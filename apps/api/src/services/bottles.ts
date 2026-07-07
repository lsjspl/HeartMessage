import type {
  AdminBottleListItem,
  AdminBottleListQuery,
  AdminBottleStatusUpdateInput,
  BottleAuthor,
  BottleView,
  PaginatedList,
  PickBottleResponse,
  ReplyBottleInput,
  ReplyBottleResponse,
  ThrowBottleInput,
  ThrowBottleResponse,
  UserBottleListItem
} from "@heart-message/shared";
import { selectAiPersonaAvatarPath } from "@heart-message/shared";
import { AppError } from "../errors";
import type { Env } from "../env";
import { createAiBottle, generateAiReplyForConversation } from "./ai-companion";
import { moderateUserContent } from "./content-safety";
import { createPaginatedList, paginationOffset } from "./pagination";
import { consumePickQuota, consumeThrowQuota, getBottleQuota, releasePickQuota, releaseThrowQuota } from "./quotas";
import { getSystemSettings } from "./settings";
import { getEndOfDayMs, getQuotaDate, toIso } from "./time";

interface BottleRow {
  id: string;
  author_id: string | null;
  ai_persona_id: string | null;
  content: string;
  is_anonymous: number;
  source: "human" | "ai";
  status: BottleView["status"];
  expires_at: number;
  picked_at: number | null;
  created_at: number;
  updated_at: number;
  nickname: string | null;
  avatar_url: string | null;
  age: number | null;
  gender: "male" | "female" | "unknown" | null;
  ai_display_name: string | null;
  ai_bio: string | null;
  ai_avatar_url: string | null;
  ai_age: number | null;
  ai_gender: "male" | "female" | "unknown" | null;
}

interface PickupRow {
  id: string;
  bottle_id: string;
  picker_id: string;
  status: "active" | "deleted";
  author_id: string | null;
  source: "human" | "ai";
  conversation_id: string | null;
}

interface UserBottleListRow extends BottleRow {
  relation: "picked" | "thrown";
  pickup_id: string | null;
  conversation_id: string | null;
  relation_at: number | null;
  item_updated_at: number;
}

function buildAuthor(row: BottleRow): BottleAuthor {
  if (row.source === "ai" && row.ai_persona_id) {
    return {
      id: row.ai_persona_id,
      nickname: row.ai_display_name || "潮汐来信",
      avatarUrl:
        row.ai_avatar_url ||
        selectAiPersonaAvatarPath(row.ai_persona_id, row.ai_gender || "unknown"),
      bio: row.ai_bio || undefined,
      age: row.ai_age || undefined,
      gender: row.ai_gender || "unknown"
    };
  }

  if (row.is_anonymous || !row.author_id) {
    return {
      nickname: "匿名漂流者",
      gender: "unknown"
    };
  }

  return {
    id: row.author_id,
    nickname: row.nickname || "漂流瓶用户",
    avatarUrl: row.avatar_url || undefined,
    age: row.age || undefined,
    gender: row.gender || "unknown"
  };
}

function mapBottle(row: BottleRow, pickupId?: string): BottleView {
  return {
    id: row.id,
    pickupId,
    content: row.content,
    isAnonymous: Boolean(row.is_anonymous),
    source: row.source,
    status: row.status,
    author: buildAuthor(row),
    expiresAt: new Date(row.expires_at).toISOString(),
    pickedAt: toIso(row.picked_at),
    createdAt: new Date(row.created_at).toISOString()
  };
}

function createPreview(content: string) {
  return content.length > 42 ? `${content.slice(0, 42)}...` : content;
}

function mapUserBottleListItem(row: UserBottleListRow): UserBottleListItem {
  return {
    id: row.id,
    relation: row.relation,
    conversationId: row.conversation_id || undefined,
    contentPreview: createPreview(row.content),
    source: row.source,
    status: row.status,
    author: buildAuthor(row),
    pickedAt: toIso(row.relation === "picked" ? row.relation_at : row.picked_at),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.item_updated_at).toISOString()
  };
}

async function findBottleWithAuthor(env: Env, bottleId: string) {
  return env.DB.prepare(
    `SELECT
       bottles.*,
       user_profiles.nickname,
       user_profiles.avatar_url,
       user_profiles.age,
       user_profiles.gender
     FROM bottles
     LEFT JOIN user_profiles ON user_profiles.user_id = bottles.author_id
     LEFT JOIN ai_personas ON ai_personas.id = bottles.ai_persona_id
     WHERE bottles.id = ?`
  )
    .bind(bottleId)
    .first<BottleRow>();
}

async function findPickCandidate(env: Env, userId: string, now: number) {
  return env.DB.prepare(
    `SELECT
       bottles.*,
       user_profiles.nickname,
       user_profiles.avatar_url,
       user_profiles.age,
       user_profiles.gender,
       ai_personas.display_name AS ai_display_name,
       ai_personas.bio AS ai_bio,
       ai_personas.avatar_url AS ai_avatar_url,
       ai_personas.age AS ai_age,
       ai_personas.gender AS ai_gender
     FROM bottles
     LEFT JOIN user_profiles ON user_profiles.user_id = bottles.author_id
     LEFT JOIN ai_personas ON ai_personas.id = bottles.ai_persona_id
     WHERE bottles.status = 'floating'
       AND bottles.expires_at > ?
       AND (bottles.author_id IS NULL OR bottles.author_id <> ?)
       AND (
         bottles.source <> 'ai'
         OR ai_personas.target_user_id IS NULL
         OR ai_personas.target_user_id = ?
       )
     ORDER BY bottles.created_at ASC
     LIMIT 1`
  )
    .bind(now, userId, userId)
    .first<BottleRow>();
}

export async function throwBottle(
  env: Env,
  userId: string,
  input: ThrowBottleInput
): Promise<ThrowBottleResponse> {
  const nowDate = new Date();
  const now = nowDate.getTime();
  const quotaDate = getQuotaDate(nowDate);

  await moderateUserContent(env, input.content, {
    userId,
    source: "bottle_throw"
  });

  const quota = await consumeThrowQuota(env, userId, quotaDate);
  const bottleId = crypto.randomUUID();

  try {
    await env.DB.prepare(
      `INSERT INTO bottles
         (id, author_id, content, media_keys, is_anonymous, source, status, expires_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'human', 'floating', ?, ?, ?)`
    )
      .bind(
        bottleId,
        userId,
        input.content,
        JSON.stringify(input.mediaKeys),
        input.isAnonymous ? 1 : 0,
        getEndOfDayMs(nowDate),
        now,
        now
      )
      .run();
  } catch (error) {
    await releaseThrowQuota(env, userId, quotaDate);
    throw error;
  }

  const bottle = await findBottleWithAuthor(env, bottleId);

  if (!bottle) {
    throw new Error("瓶子创建失败");
  }

  return {
    bottle: mapBottle(bottle),
    quota
  };
}

export async function pickBottle(env: Env, userId: string): Promise<PickBottleResponse> {
  const nowDate = new Date();
  let now = nowDate.getTime();
  const quotaDate = getQuotaDate(nowDate);
  let candidate = await findPickCandidate(env, userId, now);

  if (!candidate) {
    const settings = await getSystemSettings(env);

    if (!settings.aiFallbackEnabled) {
      throw new AppError(404, "NO_BOTTLE_AVAILABLE", "今天暂时没有可捞的瓶子");
    }

    await createAiBottle(env, userId);
    now = Date.now();
    candidate = await findPickCandidate(env, userId, now);

    if (!candidate) {
      throw new AppError(503, "AI_BOTTLE_NOT_AVAILABLE", "AI 瓶子已生成但暂时无法捞取");
    }
  }

  const quota = await consumePickQuota(env, userId, quotaDate);
  const pickupId = crypto.randomUUID();
  const updateResult = await env.DB.prepare(
    `UPDATE bottles
     SET status = 'picked', picked_at = ?, updated_at = ?
     WHERE id = ? AND status = 'floating' AND expires_at > ?`
  )
    .bind(now, now, candidate.id, now)
    .run();

  if ((updateResult.meta.changes ?? 0) !== 1) {
    await releasePickQuota(env, userId, quotaDate);
    throw new AppError(409, "BOTTLE_ALREADY_PICKED", "这个瓶子刚刚被别人捡走了");
  }

  try {
    await env.DB.prepare(
      `INSERT INTO bottle_pickups (id, bottle_id, picker_id, status, picked_at)
       VALUES (?, ?, ?, 'active', ?)`
    )
      .bind(pickupId, candidate.id, userId, now)
      .run();
  } catch (error) {
    await env.DB.prepare("UPDATE bottles SET status = 'floating', picked_at = NULL, updated_at = ? WHERE id = ?")
      .bind(Date.now(), candidate.id)
      .run();
    await releasePickQuota(env, userId, quotaDate);
    throw error;
  }

  return {
    bottle: mapBottle({ ...candidate, status: "picked", picked_at: now }, pickupId),
    quota
  };
}

export async function getBottleForUser(env: Env, userId: string, bottleId: string) {
  const row = await env.DB.prepare(
    `SELECT
       bottles.*,
       user_profiles.nickname,
       user_profiles.avatar_url,
       user_profiles.age,
       user_profiles.gender,
       ai_personas.display_name AS ai_display_name,
       ai_personas.bio AS ai_bio,
       ai_personas.avatar_url AS ai_avatar_url,
       ai_personas.age AS ai_age,
       ai_personas.gender AS ai_gender,
       bottle_pickups.id AS pickup_id,
       bottle_pickups.status AS pickup_status
     FROM bottles
     LEFT JOIN user_profiles ON user_profiles.user_id = bottles.author_id
     LEFT JOIN ai_personas ON ai_personas.id = bottles.ai_persona_id
     LEFT JOIN bottle_pickups ON bottle_pickups.bottle_id = bottles.id AND bottle_pickups.picker_id = ?
     WHERE bottles.id = ?
       AND (
         bottles.author_id = ?
         OR (bottle_pickups.id IS NOT NULL AND bottle_pickups.status = 'active')
       )`
  )
    .bind(userId, bottleId, userId)
    .first<BottleRow & { pickup_id: string | null; pickup_status: "active" | "deleted" | null }>();

  if (!row) {
    throw new AppError(404, "BOTTLE_NOT_FOUND", "没有找到这个瓶子");
  }

  return mapBottle(row, row.pickup_id || undefined);
}

export async function listUserBottles(env: Env, userId: string): Promise<UserBottleListItem[]> {
  const pickedResult = await env.DB.prepare(
    `SELECT
       bottles.*,
       'picked' AS relation,
       user_profiles.nickname,
       user_profiles.avatar_url,
       user_profiles.age,
       user_profiles.gender,
       ai_personas.display_name AS ai_display_name,
       ai_personas.bio AS ai_bio,
       ai_personas.avatar_url AS ai_avatar_url,
       ai_personas.age AS ai_age,
       ai_personas.gender AS ai_gender,
       bottle_pickups.id AS pickup_id,
       bottle_pickups.picked_at AS relation_at,
       conversations.id AS conversation_id,
       COALESCE(conversations.updated_at, bottle_pickups.picked_at, bottles.updated_at, bottles.created_at) AS item_updated_at
     FROM bottle_pickups
     JOIN bottles ON bottles.id = bottle_pickups.bottle_id
     LEFT JOIN user_profiles ON user_profiles.user_id = bottles.author_id
     LEFT JOIN ai_personas ON ai_personas.id = bottles.ai_persona_id
     LEFT JOIN conversations
       ON conversations.pickup_id = bottle_pickups.id
      AND conversations.status = 'active'
      AND conversations.deleted_by_participant_b_at IS NULL
     WHERE bottle_pickups.picker_id = ?
       AND bottle_pickups.status = 'active'
       AND bottles.status <> 'deleted'
     ORDER BY item_updated_at DESC
     LIMIT 100`
  )
    .bind(userId)
    .all<UserBottleListRow>();

  const thrownResult = await env.DB.prepare(
    `SELECT
       bottles.*,
       'thrown' AS relation,
       user_profiles.nickname,
       user_profiles.avatar_url,
       user_profiles.age,
       user_profiles.gender,
       ai_personas.display_name AS ai_display_name,
       ai_personas.bio AS ai_bio,
       ai_personas.avatar_url AS ai_avatar_url,
       ai_personas.age AS ai_age,
       ai_personas.gender AS ai_gender,
       NULL AS pickup_id,
       NULL AS relation_at,
       conversations.id AS conversation_id,
       COALESCE(conversations.updated_at, bottles.updated_at, bottles.created_at) AS item_updated_at
     FROM bottles
     LEFT JOIN user_profiles ON user_profiles.user_id = bottles.author_id
     LEFT JOIN ai_personas ON ai_personas.id = bottles.ai_persona_id
     LEFT JOIN conversations
       ON conversations.bottle_id = bottles.id
      AND conversations.status = 'active'
      AND conversations.deleted_by_participant_a_at IS NULL
     WHERE bottles.author_id = ?
       AND bottles.status <> 'deleted'
     ORDER BY item_updated_at DESC
     LIMIT 100`
  )
    .bind(userId)
    .all<UserBottleListRow>();

  return [...pickedResult.results, ...thrownResult.results]
    .sort((left, right) => right.item_updated_at - left.item_updated_at)
    .slice(0, 100)
    .map(mapUserBottleListItem);
}

export async function replyToBottle(
  env: Env,
  userId: string,
  input: ReplyBottleInput
): Promise<ReplyBottleResponse> {
  const pickup = await env.DB.prepare(
    `SELECT
       bottle_pickups.id,
       bottle_pickups.bottle_id,
       bottle_pickups.picker_id,
       bottle_pickups.status,
       bottles.author_id,
       bottles.source,
       conversations.id AS conversation_id
     FROM bottle_pickups
     JOIN bottles ON bottles.id = bottle_pickups.bottle_id
     LEFT JOIN conversations ON conversations.pickup_id = bottle_pickups.id
     WHERE bottle_pickups.bottle_id = ? AND bottle_pickups.picker_id = ?`
  )
    .bind(input.bottleId, userId)
    .first<PickupRow>();

  if (!pickup || pickup.status !== "active") {
    throw new AppError(403, "BOTTLE_NOT_PICKED", "只能回复自己捡到且未删除的瓶子");
  }

  await moderateUserContent(env, input.content, {
    userId,
    source: "bottle_reply",
    targetId: pickup.bottle_id
  });

  const now = Date.now();
  const conversationId = pickup.conversation_id || crypto.randomUUID();

  if (!pickup.conversation_id) {
    await env.DB.prepare(
      `INSERT INTO conversations
         (id, bottle_id, pickup_id, participant_a_id, participant_b_id, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'active', ?, ?)`
    )
      .bind(conversationId, pickup.bottle_id, pickup.id, pickup.author_id, userId, now, now)
      .run();
  }

  const messageId = crypto.randomUUID();

  await env.DB.prepare(
    `INSERT INTO messages
       (id, conversation_id, sender_id, sender_type, content, status, created_at)
     VALUES (?, ?, ?, 'user', ?, 'sent', ?)`
  )
    .bind(messageId, conversationId, userId, input.content, now)
    .run();

  await env.DB.prepare("UPDATE conversations SET updated_at = ? WHERE id = ?")
    .bind(now, conversationId)
    .run();

  if (pickup.source === "ai" && !pickup.author_id) {
    await generateAiReplyForConversation(env, userId, conversationId);
  }

  return {
    conversationId,
    bottleId: pickup.bottle_id,
    messageId
  };
}

export async function deletePickedBottle(env: Env, userId: string, bottleId: string) {
  const pickup = await env.DB.prepare(
    `SELECT id, bottle_id, picker_id, status, NULL AS author_id, 'human' AS source, NULL AS conversation_id
     FROM bottle_pickups
     WHERE bottle_id = ? AND picker_id = ?`
  )
    .bind(bottleId, userId)
    .first<PickupRow>();

  if (!pickup) {
    throw new AppError(404, "PICKUP_NOT_FOUND", "没有找到这个捡瓶记录");
  }

  const now = Date.now();

  await env.DB.prepare(
    `UPDATE bottle_pickups
     SET status = 'deleted', deleted_at = ?
     WHERE id = ? AND picker_id = ?`
  )
    .bind(now, pickup.id, userId)
    .run();

  await env.DB.prepare(
    `UPDATE conversations
     SET deleted_by_participant_b_at = ?, updated_at = ?
     WHERE pickup_id = ? AND participant_b_id = ?`
  )
    .bind(now, now, pickup.id, userId)
    .run();

  return {
    bottleId,
    deleted: true
  };
}

export async function listAdminBottles(
  env: Env,
  query: AdminBottleListQuery
): Promise<PaginatedList<AdminBottleListItem>> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (query.keyword) {
    conditions.push(
      "(bottles.id LIKE ? OR bottles.content LIKE ? OR user_profiles.nickname LIKE ? OR ai_personas.display_name LIKE ?)"
    );
    params.push(`%${query.keyword}%`, `%${query.keyword}%`, `%${query.keyword}%`, `%${query.keyword}%`);
  }

  if (query.source) {
    conditions.push("bottles.source = ?");
    params.push(query.source);
  }

  if (query.status) {
    conditions.push("bottles.status = ?");
    params.push(query.status);
  }

  const fromSql = `FROM bottles
       LEFT JOIN user_profiles ON user_profiles.user_id = bottles.author_id
       LEFT JOIN ai_personas ON ai_personas.id = bottles.ai_persona_id`;
  const whereSql = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const [countRow, result] = await Promise.all([
    env.DB.prepare(`SELECT COUNT(*) AS count ${fromSql} ${whereSql}`)
      .bind(...params)
      .first<{ count: number }>(),
    env.DB.prepare(
      `SELECT
         bottles.id,
         bottles.content,
         bottles.source,
         bottles.status,
         bottles.created_at,
         bottles.expires_at,
         COALESCE(user_profiles.nickname, ai_personas.display_name) AS nickname
       ${fromSql}
       ${whereSql}
       ORDER BY bottles.created_at DESC
       LIMIT ? OFFSET ?`
    )
      .bind(...params, query.pageSize, paginationOffset(query))
      .all<{
        id: string;
        content: string;
        source: "human" | "ai";
        status: BottleView["status"];
        created_at: number;
        expires_at: number;
        nickname: string | null;
      }>()
  ]);
  const items = result.results.map((row) => ({
    id: row.id,
    authorNickname: row.nickname || "匿名漂流者",
    contentPreview: row.content.length > 80 ? `${row.content.slice(0, 80)}...` : row.content,
    source: row.source,
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    expiresAt: new Date(row.expires_at).toISOString()
  }));

  return createPaginatedList(items, countRow?.count ?? 0, query);
}

export async function updateAdminBottleStatus(
  env: Env,
  bottleId: string,
  input: AdminBottleStatusUpdateInput
) {
  const current = await env.DB.prepare("SELECT id, status, source, picked_at, expires_at FROM bottles WHERE id = ?")
    .bind(bottleId)
    .first<{
      id: string;
      status: BottleView["status"];
      source: "human" | "ai";
      picked_at: number | null;
      expires_at: number;
    }>();

  if (!current) {
    throw new AppError(404, "BOTTLE_NOT_FOUND", "瓶子不存在");
  }

  const now = Date.now();
  let nextStatus: BottleView["status"] = input.status === "restore" ? "floating" : input.status;

  if (input.status === "restore") {
    if (current.status !== "blocked") {
      throw new AppError(409, "BOTTLE_NOT_BLOCKED", "只有封禁状态的瓶子可以解封");
    }

    nextStatus = current.picked_at ? "picked" : current.expires_at <= now ? "expired" : "floating";
  }

  await env.DB.prepare("UPDATE bottles SET status = ?, updated_at = ? WHERE id = ?")
    .bind(nextStatus, now, bottleId)
    .run();

  if (input.status === "blocked" || input.status === "deleted") {
    await env.DB.prepare("UPDATE conversations SET status = ?, updated_at = ? WHERE bottle_id = ?")
      .bind(input.status === "blocked" ? "blocked" : "deleted", now, bottleId)
      .run();
  }

  if (input.status === "restore") {
    await env.DB.prepare("UPDATE conversations SET status = 'active', updated_at = ? WHERE bottle_id = ? AND status = 'blocked'")
      .bind(now, bottleId)
      .run();
  }

  return {
    id: bottleId,
    source: current.source,
    previousStatus: current.status,
    status: nextStatus
  };
}

export async function getBottleQuotaForUser(env: Env, userId: string) {
  return getBottleQuota(env, userId);
}
