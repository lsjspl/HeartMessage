import { z } from "zod";
import {
  ContentModerationCategorySchema,
  ContentModerationSourceSchema,
  type ContentModerationCategory,
  type ContentModerationSource
} from "@heart-message/shared";
import { AppError } from "../errors";
import type { Env } from "../env";
import { generateAiText } from "./ai-runtime";
import { writeOperationLog } from "./logs";

export type UserContentSource = ContentModerationSource;

interface ModerationContext {
  userId: string;
  source: UserContentSource;
  targetId?: string;
}

const AiModerationOutputSchema = z.object({
  allowed: z.boolean(),
  categories: z.array(ContentModerationCategorySchema).default([]),
  reason: z.string().min(1).max(120).optional()
});

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

function detectContactInfo(content: string): ContentModerationCategory[] {
  const categories = new Set<ContentModerationCategory>();

  if (phonePattern.test(content) || wechatPattern.test(content) || qqPattern.test(content)) {
    categories.add("contact_info");
  }

  return [...categories];
}

function moderationSystemPrompt() {
  return [
    "你是漂流瓶社交产品的内容安全审核模型。",
    "请判断用户发言是否可以发送。",
    "必须拦截广告营销、色情低俗、性邀约、联系方式或引流内容。",
    "联系方式包括手机号、微信、WeChat、VX、WX、QQ、扣扣等。",
    "只返回 JSON，不要 Markdown，不要代码块，不要额外解释。",
    "JSON 字段：allowed、categories、reason。",
    "categories 只能包含 advertisement、sexual、contact_info。"
  ].join("\n");
}

function createContentPreview(content: string) {
  return content
    .replace(phonePattern, "[手机号已脱敏]")
    .replace(wechatPattern, "[微信号已脱敏]")
    .replace(qqPattern, "[QQ号已脱敏]")
    .slice(0, 120);
}

async function blockContent(
  env: Env,
  context: ModerationContext,
  categories: ContentModerationCategory[],
  reason: string,
  content: string,
  modelId?: string
): Promise<never> {
  const now = Date.now();
  const eventId = crypto.randomUUID();
  const source = ContentModerationSourceSchema.parse(context.source);

  await env.DB.prepare(
    `INSERT INTO content_moderation_events
       (id, user_id, source, target_id, categories, reason, content_preview, content_length,
        model_id, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`
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
      now,
      now
    )
    .run();

  await writeOperationLog(env, {
    actorId: context.userId,
    action: "content.moderation.block",
    targetType: context.source,
    targetId: eventId,
    metadata: {
      categories,
      modelId,
      source,
      sourceTargetId: context.targetId,
      contentLength: content.length
    }
  });

  throw new AppError(422, "CONTENT_BLOCKED", reason);
}

export async function moderateUserContent(env: Env, content: string, context: ModerationContext) {
  const normalized = content.trim();

  if (!normalized) {
    throw new AppError(400, "CONTENT_EMPTY", "内容不能为空");
  }

  const hardBlockCategories = detectContactInfo(normalized);

  if (hardBlockCategories.length > 0) {
    await blockContent(env, context, hardBlockCategories, "内容包含联系方式，不能发送", normalized);
  }

  let generation;

  try {
    generation = await generateAiText(
      env,
      "content_moderation",
      [
        { role: "system", content: moderationSystemPrompt() },
        {
          role: "user",
          content: JSON.stringify({
            source: context.source,
            content: normalized
          })
        }
      ],
      { temperature: 0, maxTokens: 220 }
    );
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(502, "AI_MODERATION_FAILED", "内容审核失败，请稍后再试");
  }

  const output = parseAiJson(generation.result.content);

  if (!output.allowed) {
    const categories: ContentModerationCategory[] =
      output.categories.length > 0 ? output.categories : ["advertisement"];
    await blockContent(
      env,
      context,
      categories,
      output.reason || "内容包含平台不允许发送的信息",
      normalized,
      generation.model.id
    );
  }
}
