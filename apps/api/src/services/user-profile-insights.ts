import { z } from "zod";
import type {
  AdminUserProfileInsightListQuery,
  AdminUserProfileInsightItem,
  PaginatedList
} from "@heart-message/shared";
import { AppError } from "../errors";
import type { Env } from "../env";
import { generateAiText } from "./ai-runtime";
import { writeOperationLog } from "./logs";
import { createPaginatedList, paginationOffset } from "./pagination";
import { getSystemSettings } from "./settings";

const ProfileInsightOutputSchema = z.object({
  summary: z.string().min(1).max(240),
  interestTags: z.array(z.string().min(1).max(24)).max(12).default([]),
  preferredTopics: z.array(z.string().min(1).max(40)).max(12).default([]),
  avoidedTopics: z.array(z.string().min(1).max(40)).max(8).default([]),
  conversationStyle: z.string().min(1).max(160),
  emotionalNeeds: z.array(z.string().min(1).max(40)).max(8).default([]),
  preferredPersonaTraits: z.array(z.string().min(1).max(40)).max(10).default([]),
  companionExpectation: z.string().min(1).max(240),
  safetyNotes: z.string().max(160).default("")
});

interface UserProfileContext {
  id: string;
  nickname: string | null;
  bio: string | null;
  age: number | null;
  gender: "male" | "female" | "unknown" | null;
}

interface SourceTextRow {
  content: string;
}

interface AdminInsightRow {
  user_id: string;
  nickname: string | null;
  avatar_url: string | null;
  status: "pending" | "completed" | "failed" | null;
  summary: string | null;
  interest_tags: string | null;
  preferred_topics: string | null;
  avoided_topics: string | null;
  conversation_style: string | null;
  emotional_needs: string | null;
  preferred_persona_traits: string | null;
  companion_expectation: string | null;
  safety_notes: string | null;
  source_message_count: number | null;
  source_bottle_count: number | null;
  model_id: string | null;
  evaluated_at: number | null;
  updated_at: number | null;
  last_error_message: string | null;
}

interface PersonaInsightRow {
  summary: string;
  interest_tags: string;
  preferred_topics: string;
  avoided_topics: string;
  conversation_style: string;
  emotional_needs: string;
  preferred_persona_traits: string;
  companion_expectation: string;
  safety_notes: string;
  evaluated_at: number | null;
}

function parseJsonArray(value: string | null): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function toIso(value: number | null) {
  return value ? new Date(value).toISOString() : undefined;
}

function mapAdminInsight(row: AdminInsightRow): AdminUserProfileInsightItem {
  return {
    userId: row.user_id,
    nickname: row.nickname || undefined,
    avatarUrl: row.avatar_url || undefined,
    status: row.status || undefined,
    summary: row.summary || undefined,
    interestTags: parseJsonArray(row.interest_tags),
    preferredTopics: parseJsonArray(row.preferred_topics),
    avoidedTopics: parseJsonArray(row.avoided_topics),
    conversationStyle: row.conversation_style || undefined,
    emotionalNeeds: parseJsonArray(row.emotional_needs),
    preferredPersonaTraits: parseJsonArray(row.preferred_persona_traits),
    companionExpectation: row.companion_expectation || undefined,
    safetyNotes: row.safety_notes || undefined,
    sourceMessageCount: row.source_message_count ?? 0,
    sourceBottleCount: row.source_bottle_count ?? 0,
    modelId: row.model_id || undefined,
    evaluatedAt: toIso(row.evaluated_at),
    updatedAt: toIso(row.updated_at),
    lastErrorMessage: row.last_error_message || undefined
  };
}

function profileSystemPrompt() {
  return [
    "你是漂流瓶社交产品的用户画像评估模型。",
    "请根据用户资料、最近扔出的瓶子和用户自己发送的聊天消息，生成用于 AI 陪伴人格匹配的画像。",
    "画像要克制、尊重隐私，只总结偏好和沟通风格，不做医学、法律或危险判断。",
    "不要输出原始聊天正文，不要输出联系方式。",
    "只返回 JSON，不要 Markdown，不要代码块，不要额外解释。",
    "JSON 字段：summary、interestTags、preferredTopics、avoidedTopics、conversationStyle、emotionalNeeds、preferredPersonaTraits、companionExpectation、safetyNotes。"
  ].join("\n");
}

function parseProfileInsight(content: string) {
  try {
    return ProfileInsightOutputSchema.parse(JSON.parse(content));
  } catch {
    throw new AppError(502, "USER_PROFILE_INSIGHT_PARSE_FAILED", "用户画像模型返回格式不正确");
  }
}

async function findUserProfileContext(env: Env, userId: string) {
  return env.DB.prepare(
    `SELECT
       users.id,
       user_profiles.nickname,
       user_profiles.bio,
       user_profiles.age,
       user_profiles.gender
     FROM users
     LEFT JOIN user_profiles ON user_profiles.user_id = users.id
     WHERE users.id = ? AND users.role = 'user' AND users.status = 'active'`
  )
    .bind(userId)
    .first<UserProfileContext>();
}

async function listRecentBottleTexts(env: Env, userId: string) {
  const result = await env.DB.prepare(
    `SELECT content
     FROM bottles
     WHERE author_id = ? AND source = 'human' AND status <> 'deleted'
     ORDER BY created_at DESC
     LIMIT 12`
  )
    .bind(userId)
    .all<SourceTextRow>();

  return result.results.map((row) => row.content);
}

async function listRecentMessageTexts(env: Env, userId: string) {
  const result = await env.DB.prepare(
    `SELECT content
     FROM messages
     WHERE sender_id = ? AND sender_type = 'user' AND status = 'sent'
     ORDER BY created_at DESC
     LIMIT 30`
  )
    .bind(userId)
    .all<SourceTextRow>();

  return result.results.map((row) => row.content);
}

async function markProfileInsightPending(env: Env, userId: string, now: number) {
  await env.DB.prepare(
    `INSERT INTO user_profile_insights
       (user_id, status, created_at, updated_at)
     VALUES (?, 'pending', ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       status = 'pending',
       last_error_code = NULL,
       last_error_message = NULL,
       updated_at = excluded.updated_at`
  )
    .bind(userId, now, now)
    .run();
}

async function markProfileInsightFailed(env: Env, userId: string, error: unknown, now: number) {
  const code = error instanceof AppError ? error.code : "USER_PROFILE_EVALUATION_FAILED";
  const message = error instanceof Error ? error.message : "用户画像评估失败";

  await env.DB.prepare(
    `INSERT INTO user_profile_insights
       (user_id, status, last_error_code, last_error_message, created_at, updated_at)
     VALUES (?, 'failed', ?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       status = 'failed',
       last_error_code = excluded.last_error_code,
       last_error_message = excluded.last_error_message,
       updated_at = excluded.updated_at`
  )
    .bind(userId, code, message.slice(0, 160), now, now)
    .run();
}

async function saveProfileInsight(
  env: Env,
  userId: string,
  insight: z.infer<typeof ProfileInsightOutputSchema>,
  modelId: string,
  sourceCounts: { messages: number; bottles: number },
  now: number
) {
  await env.DB.prepare(
    `INSERT INTO user_profile_insights
       (
         user_id,
         status,
         summary,
         interest_tags,
         preferred_topics,
         avoided_topics,
         conversation_style,
         emotional_needs,
         preferred_persona_traits,
         companion_expectation,
         safety_notes,
         source_message_count,
         source_bottle_count,
         model_id,
         evaluated_at,
         last_error_code,
         last_error_message,
         created_at,
         updated_at
       )
     VALUES (?, 'completed', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       status = 'completed',
       summary = excluded.summary,
       interest_tags = excluded.interest_tags,
       preferred_topics = excluded.preferred_topics,
       avoided_topics = excluded.avoided_topics,
       conversation_style = excluded.conversation_style,
       emotional_needs = excluded.emotional_needs,
       preferred_persona_traits = excluded.preferred_persona_traits,
       companion_expectation = excluded.companion_expectation,
       safety_notes = excluded.safety_notes,
       source_message_count = excluded.source_message_count,
       source_bottle_count = excluded.source_bottle_count,
       model_id = excluded.model_id,
       evaluated_at = excluded.evaluated_at,
       last_error_code = NULL,
       last_error_message = NULL,
       updated_at = excluded.updated_at`
  )
    .bind(
      userId,
      insight.summary,
      JSON.stringify(insight.interestTags),
      JSON.stringify(insight.preferredTopics),
      JSON.stringify(insight.avoidedTopics),
      insight.conversationStyle,
      JSON.stringify(insight.emotionalNeeds),
      JSON.stringify(insight.preferredPersonaTraits),
      insight.companionExpectation,
      insight.safetyNotes,
      sourceCounts.messages,
      sourceCounts.bottles,
      modelId,
      now,
      now,
      now
    )
    .run();
}

export async function listAdminUserProfileInsights(
  env: Env,
  query: AdminUserProfileInsightListQuery
): Promise<PaginatedList<AdminUserProfileInsightItem>> {
  const conditions = ["users.role = 'user'", "users.status <> 'deleted'"];
  const params: unknown[] = [];

  if (query.keyword) {
    conditions.push("(users.id LIKE ? OR user_profiles.nickname LIKE ? OR user_profile_insights.summary LIKE ?)");
    params.push(`%${query.keyword}%`, `%${query.keyword}%`, `%${query.keyword}%`);
  }

  if (query.status) {
    conditions.push("user_profile_insights.status = ?");
    params.push(query.status);
  }

  const whereSql = `WHERE ${conditions.join(" AND ")}`;
  const fromSql = `FROM users
       LEFT JOIN user_profiles ON user_profiles.user_id = users.id
       LEFT JOIN user_profile_insights ON user_profile_insights.user_id = users.id`;
  const [countRow, result] = await Promise.all([
    env.DB.prepare(
      `SELECT COUNT(*) AS count ${fromSql} ${whereSql}`
    )
      .bind(...params)
      .first<{ count: number }>(),
    env.DB.prepare(
      `SELECT
         users.id AS user_id,
         user_profiles.nickname,
         user_profiles.avatar_url,
         user_profile_insights.status,
         user_profile_insights.summary,
         user_profile_insights.interest_tags,
         user_profile_insights.preferred_topics,
         user_profile_insights.avoided_topics,
         user_profile_insights.conversation_style,
         user_profile_insights.emotional_needs,
         user_profile_insights.preferred_persona_traits,
         user_profile_insights.companion_expectation,
         user_profile_insights.safety_notes,
         user_profile_insights.source_message_count,
         user_profile_insights.source_bottle_count,
         user_profile_insights.model_id,
         user_profile_insights.evaluated_at,
         user_profile_insights.updated_at,
         user_profile_insights.last_error_message
       ${fromSql}
       ${whereSql}
       ORDER BY COALESCE(user_profile_insights.evaluated_at, 0) DESC, users.created_at DESC
       LIMIT ? OFFSET ?`
    )
      .bind(...params, query.pageSize, paginationOffset(query))
      .all<AdminInsightRow>()
  ]);

  return createPaginatedList(result.results.map(mapAdminInsight), countRow?.count ?? 0, query);
}

export async function getAdminUserProfileInsight(env: Env, userId: string) {
  const row = await env.DB.prepare(
    `SELECT
       users.id AS user_id,
       user_profiles.nickname,
       user_profiles.avatar_url,
       user_profile_insights.status,
       user_profile_insights.summary,
       user_profile_insights.interest_tags,
       user_profile_insights.preferred_topics,
       user_profile_insights.avoided_topics,
       user_profile_insights.conversation_style,
       user_profile_insights.emotional_needs,
       user_profile_insights.preferred_persona_traits,
       user_profile_insights.companion_expectation,
       user_profile_insights.safety_notes,
       user_profile_insights.source_message_count,
       user_profile_insights.source_bottle_count,
       user_profile_insights.model_id,
       user_profile_insights.evaluated_at,
       user_profile_insights.updated_at,
       user_profile_insights.last_error_message
     FROM users
     LEFT JOIN user_profiles ON user_profiles.user_id = users.id
     LEFT JOIN user_profile_insights ON user_profile_insights.user_id = users.id
     WHERE users.id = ? AND users.role = 'user' AND users.status <> 'deleted'`
  )
    .bind(userId)
    .first<AdminInsightRow>();

  return row ? mapAdminInsight(row) : null;
}

export async function evaluateUserProfileInsight(env: Env, userId: string) {
  const user = await findUserProfileContext(env, userId);

  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "用户不存在或不可评估");
  }

  const now = Date.now();
  await markProfileInsightPending(env, userId, now);

  try {
    const [bottleTexts, messageTexts] = await Promise.all([
      listRecentBottleTexts(env, userId),
      listRecentMessageTexts(env, userId)
    ]);
    const generation = await generateAiText(
      env,
      "user_profile_evaluation",
      [
        { role: "system", content: profileSystemPrompt() },
        {
          role: "user",
          content: JSON.stringify({
            profile: {
              nickname: user.nickname,
              bio: user.bio,
              age: user.age,
              gender: user.gender
            },
            recentBottles: bottleTexts,
            recentMessages: messageTexts
          })
        }
      ],
      { temperature: 0.35, maxTokens: 900 }
    );
    const insight = parseProfileInsight(generation.result.content);

    await saveProfileInsight(
      env,
      userId,
      insight,
      generation.model.id,
      { messages: messageTexts.length, bottles: bottleTexts.length },
      Date.now()
    );

    const saved = await getAdminUserProfileInsight(env, userId);

    if (!saved) {
      throw new AppError(500, "USER_PROFILE_INSIGHT_NOT_FOUND", "用户画像保存失败");
    }

    return saved;
  } catch (error) {
    await markProfileInsightFailed(env, userId, error, Date.now());

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(502, "USER_PROFILE_EVALUATION_FAILED", "用户画像评估失败，请稍后再试");
  }
}

export async function runDueUserProfileEvaluations(env: Env) {
  const settings = await getSystemSettings(env);

  if (!settings.userProfileEvaluation.enabled) {
    return { total: 0, completed: 0, failed: 0 };
  }

  const now = Date.now();
  const cutoff = now - settings.userProfileEvaluation.intervalHours * 60 * 60 * 1000;
  const result = await env.DB.prepare(
    `SELECT users.id
     FROM users
     LEFT JOIN user_profiles ON user_profiles.user_id = users.id
     LEFT JOIN user_profile_insights ON user_profile_insights.user_id = users.id
     WHERE users.role = 'user'
       AND users.status = 'active'
       AND user_profiles.user_id IS NOT NULL
       AND (
         user_profile_insights.user_id IS NULL
         OR user_profile_insights.status = 'failed'
         OR user_profile_insights.evaluated_at IS NULL
         OR user_profile_insights.evaluated_at <= ?
       )
     ORDER BY COALESCE(user_profile_insights.evaluated_at, 0) ASC, users.created_at ASC
     LIMIT ?`
  )
    .bind(cutoff, settings.userProfileEvaluation.batchSize)
    .all<{ id: string }>();

  let completed = 0;
  let failed = 0;

  for (const row of result.results) {
    try {
      await evaluateUserProfileInsight(env, row.id);
      completed += 1;
    } catch {
      failed += 1;
    }
  }

  if (result.results.length > 0) {
    await writeOperationLog(env, {
      action: "user_profile.schedule.evaluate",
      targetType: "user_profile_insights",
      metadata: {
        total: result.results.length,
        completed,
        failed
      }
    });
  }

  return { total: result.results.length, completed, failed };
}

export async function getCompletedUserProfileInsightForPersona(env: Env, userId: string) {
  const row = await env.DB.prepare(
    `SELECT
       summary,
       interest_tags,
       preferred_topics,
       avoided_topics,
       conversation_style,
       emotional_needs,
       preferred_persona_traits,
       companion_expectation,
       safety_notes,
       evaluated_at
     FROM user_profile_insights
     WHERE user_id = ? AND status = 'completed'`
  )
    .bind(userId)
    .first<PersonaInsightRow>();

  if (!row) {
    return null;
  }

  return {
    summary: row.summary,
    interestTags: parseJsonArray(row.interest_tags),
    preferredTopics: parseJsonArray(row.preferred_topics),
    avoidedTopics: parseJsonArray(row.avoided_topics),
    conversationStyle: row.conversation_style,
    emotionalNeeds: parseJsonArray(row.emotional_needs),
    preferredPersonaTraits: parseJsonArray(row.preferred_persona_traits),
    companionExpectation: row.companion_expectation,
    safetyNotes: row.safety_notes,
    evaluatedAt: toIso(row.evaluated_at)
  };
}
