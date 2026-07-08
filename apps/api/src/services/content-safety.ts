import { z } from "zod";
import {
  ContentModerationFindingSchema,
  ContentModerationSourceSchema,
  type ContentModerationCategory,
  type ContentModerationDecision,
  type ContentModerationFinding,
  type ContentModerationRuleSource,
  type ContentModerationSeverity,
  type ContentModerationSource,
  type ContentSafetyCategoryPolicy,
  type ContentSafetySettings
} from "@heart-message/shared";
import { AppError } from "../errors";
import type { Env } from "../env";
import { generateAiText } from "./ai-runtime";
import { writeOperationLog } from "./logs";
import { getSystemSettings } from "./settings";

export type UserContentSource = ContentModerationSource;

interface ModerationContext {
  userId: string;
  source: UserContentSource;
  targetId?: string;
}

const AiModerationOutputSchema = z.object({
  findings: z.array(ContentModerationFindingSchema).default([])
});

const moderationCategories: ContentModerationCategory[] = [
  "contact_info",
  "advertisement",
  "sexual",
  "abuse",
  "illegal"
];

const severityRank: Record<ContentModerationSeverity, number> = {
  low: 1,
  medium: 2,
  high: 3
};

const categoryMessages: Record<ContentModerationCategory, string> = {
  contact_info: "内容包含联系方式，不能发送",
  advertisement: "内容包含广告营销信息，不能发送",
  sexual: "内容包含色情低俗内容，不能发送",
  abuse: "内容包含骚扰辱骂内容，不能发送",
  illegal: "内容包含违法或诈骗风险，不能发送"
};

const phonePattern = /(?:\+?86[-\s]?)?1[3-9]\d[-\s]?\d{4}[-\s]?\d{4}/;
const wechatPattern =
  /(?:加|找|搜|联系|私信|看)?\s*(?:微信|微\s*信|wechat|weixin|v\s*x|w\s*x|v信|薇信)\s*(?:号|联系|是|:|：)?\s*[a-zA-Z0-9_-]{3,}/i;
const qqPattern = /(?:q\s*q|扣\s*扣|企鹅)\s*(?:号|联系|是|:|：)?\s*[1-9]\d{4,11}/i;

function parseAiJson(content: string) {
  try {
    return AiModerationOutputSchema.parse(JSON.parse(content));
  } catch {
    throw new AppError(502, "AI_MODERATION_PARSE_FAILED", "内容审核模型返回格式不正确");
  }
}

function getEffectivePolicy(
  settings: ContentSafetySettings,
  source: ContentModerationSource,
  category: ContentModerationCategory
): ContentSafetyCategoryPolicy {
  return {
    ...settings.categories[category],
    ...(settings.sourceOverrides[source]?.[category] ?? {})
  };
}

function reachesBlockThreshold(
  settings: ContentSafetySettings,
  source: ContentModerationSource,
  finding: ContentModerationFinding
) {
  const policy = getEffectivePolicy(settings, source, finding.category);

  return policy.enabled && severityRank[finding.severity] >= severityRank[policy.blockAt];
}

function enabledAiCategories(settings: ContentSafetySettings, source: ContentModerationSource) {
  return moderationCategories.filter((category) => getEffectivePolicy(settings, source, category).enabled);
}

function detectContactInfo(
  content: string,
  settings: ContentSafetySettings,
  source: ContentModerationSource
): ContentModerationFinding[] {
  const policy = getEffectivePolicy(settings, source, "contact_info");
  const hardRules = settings.hardRules.contactInfo;

  if (!policy.enabled || !hardRules.enabled) {
    return [];
  }

  const matchedRules = [
    hardRules.phone && phonePattern.test(content) ? "手机号" : undefined,
    hardRules.wechat && wechatPattern.test(content) ? "微信" : undefined,
    hardRules.qq && qqPattern.test(content) ? "QQ" : undefined
  ].filter(Boolean);

  if (matchedRules.length > 0) {
    return [
      {
        category: "contact_info",
        severity: "high",
        confidence: 1,
        reason: `命中联系方式规则：${matchedRules.join("、")}`
      }
    ];
  }

  return [];
}

function moderationSystemPrompt(categories: ContentModerationCategory[]) {
  return [
    "你是漂流瓶社交产品的内容安全审核模型。",
    "请识别用户发言中的内容安全风险，不要直接决定是否允许发送。",
    "风险程度只能是 low、medium、high。",
    "low 表示轻微或语义不明确，medium 表示明确风险，high 表示明显违规或高风险。",
    `只评估这些分类：${categories.join("、")}。`,
    "contact_info 表示手机号、微信、WeChat、VX、WX、QQ、扣扣或站外导流。",
    "advertisement 表示广告营销、推广、刷屏或商业引流。",
    "sexual 表示色情低俗、露骨性暗示、性邀约或色情交易。",
    "abuse 表示辱骂、骚扰、歧视或威胁。",
    "illegal 表示诈骗、违法交易或灰产引导。",
    "只返回 JSON，不要 Markdown，不要代码块，不要额外解释。",
    "JSON 字段：findings。",
    "findings 数组元素字段：category、severity、confidence、reason。"
  ].join("\n");
}

function createContentPreview(content: string) {
  return content
    .replace(phonePattern, "[手机号已脱敏]")
    .replace(wechatPattern, "[微信号已脱敏]")
    .replace(qqPattern, "[QQ号已脱敏]")
    .slice(0, 120);
}

function highestSeverity(findings: ContentModerationFinding[]): ContentModerationSeverity {
  return findings.reduce<ContentModerationSeverity>((highest, finding) => {
    return severityRank[finding.severity] > severityRank[highest] ? finding.severity : highest;
  }, "low");
}

function ruleSourceFromFindings(
  hardRuleFindings: ContentModerationFinding[],
  aiFindings: ContentModerationFinding[]
): ContentModerationRuleSource {
  if (hardRuleFindings.length > 0 && aiFindings.length > 0) {
    return "mixed";
  }

  return hardRuleFindings.length > 0 ? "hard_rule" : "ai_model";
}

function createPolicySnapshot(
  settings: ContentSafetySettings,
  source: ContentModerationSource,
  findings: ContentModerationFinding[]
) {
  const categories = [...new Set(findings.map((finding) => finding.category))];

  return {
    enabled: settings.enabled,
    source,
    categories: Object.fromEntries(
      categories.map((category) => [category, getEffectivePolicy(settings, source, category)])
    )
  };
}

function mainBlockReason(findings: ContentModerationFinding[]) {
  const [finding] = [...findings].sort((left, right) => {
    return severityRank[right.severity] - severityRank[left.severity];
  });

  return finding?.reason || categoryMessages[finding?.category ?? "advertisement"];
}

async function recordModerationEvent(
  env: Env,
  context: ModerationContext,
  content: string,
  settings: ContentSafetySettings,
  findings: ContentModerationFinding[],
  decision: ContentModerationDecision,
  ruleSource: ContentModerationRuleSource,
  reason: string,
  modelId?: string
) {
  const now = Date.now();
  const eventId = crypto.randomUUID();
  const source = ContentModerationSourceSchema.parse(context.source);
  const categories = [...new Set(findings.map((finding) => finding.category))];
  const severity = highestSeverity(findings);
  const status = decision === "blocked" ? "pending" : "dismissed";

  await env.DB.prepare(
    `INSERT INTO content_moderation_events
       (id, user_id, source, target_id, categories, reason, content_preview, content_length,
        model_id, decision, highest_severity, findings_json, policy_version, policy_snapshot_json,
        rule_source, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      eventId,
      context.userId,
      source,
      context.targetId ?? null,
      JSON.stringify(categories),
      reason,
      createContentPreview(content),
      content.length,
      modelId ?? null,
      decision,
      severity,
      JSON.stringify(findings),
      settings.updatedAt ? String(settings.updatedAt) : "default",
      JSON.stringify(createPolicySnapshot(settings, source, findings)),
      ruleSource,
      status,
      now,
      now
    )
    .run();

  await writeOperationLog(env, {
    actorId: context.userId,
    action: decision === "blocked" ? "content.moderation.block" : "content.moderation.allow_log",
    targetType: context.source,
    targetId: eventId,
    metadata: {
      categories,
      decision,
      highestSeverity: severity,
      modelId,
      ruleSource,
      source,
      sourceTargetId: context.targetId,
      contentLength: content.length
    }
  });
}

async function blockContent(
  env: Env,
  context: ModerationContext,
  content: string,
  settings: ContentSafetySettings,
  findings: ContentModerationFinding[],
  ruleSource: ContentModerationRuleSource,
  modelId?: string
): Promise<never> {
  const blockedFindings = findings.filter((finding) => {
    return reachesBlockThreshold(settings, context.source, finding);
  });
  const reason = mainBlockReason(blockedFindings);

  await recordModerationEvent(env, context, content, settings, blockedFindings, "blocked", ruleSource, reason, modelId);

  throw new AppError(422, "CONTENT_BLOCKED", reason);
}

export async function moderateUserContent(env: Env, content: string, context: ModerationContext) {
  const normalized = content.trim();

  if (!normalized) {
    throw new AppError(400, "CONTENT_EMPTY", "内容不能为空");
  }

  const settings = (await getSystemSettings(env)).contentSafety;

  if (!settings.enabled) {
    return;
  }

  const hardRuleFindings = detectContactInfo(normalized, settings, context.source);
  const blockedHardFindings = hardRuleFindings.filter((finding) => {
    return reachesBlockThreshold(settings, context.source, finding);
  });

  if (blockedHardFindings.length > 0) {
    await blockContent(env, context, normalized, settings, blockedHardFindings, "hard_rule");
  }

  const categories = enabledAiCategories(settings, context.source);
  let aiFindings: ContentModerationFinding[] = [];
  let modelId: string | undefined;

  if (categories.length > 0) {
    let generation;

    try {
      generation = await generateAiText(
        env,
        "content_moderation",
        [
          { role: "system", content: moderationSystemPrompt(categories) },
          {
            role: "user",
            content: JSON.stringify({
              source: context.source,
              content: normalized
            })
          }
        ],
        { temperature: 0, maxTokens: 360 }
      );
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(502, "AI_MODERATION_FAILED", "内容审核失败，请稍后再试");
    }

    modelId = generation.model.id;
    aiFindings = parseAiJson(generation.result.content).findings.filter((finding) => {
      return getEffectivePolicy(settings, context.source, finding.category).enabled;
    });
  }

  const findings = [...hardRuleFindings, ...aiFindings];
  const blockedFindings = findings.filter((finding) => {
    return reachesBlockThreshold(settings, context.source, finding);
  });

  if (blockedFindings.length > 0) {
    await blockContent(
      env,
      context,
      normalized,
      settings,
      findings,
      ruleSourceFromFindings(hardRuleFindings, aiFindings),
      modelId
    );
  }

  if (settings.logAllowedFindings && findings.length > 0) {
    await recordModerationEvent(
      env,
      context,
      normalized,
      settings,
      findings,
      "allowed_logged",
      ruleSourceFromFindings(hardRuleFindings, aiFindings),
      "未达到拦截程度，仅记录观察",
      modelId
    );
  }
}
