import type {
  AdminContentModerationItem,
  AdminContentModerationListQuery,
  AdminContentModerationStatusUpdateInput,
  ContentModerationCategory,
  PaginatedList
} from "@heart-message/shared";
import { AppError } from "../errors";
import type { Env } from "../env";
import { createPaginatedList, paginationOffset } from "./pagination";

interface ContentModerationEventRow {
  id: string;
  user_id: string;
  nickname: string | null;
  avatar_url: string | null;
  source: AdminContentModerationItem["source"];
  target_id: string | null;
  categories: string;
  reason: string;
  content_preview: string;
  content_length: number;
  model_id: string | null;
  status: AdminContentModerationItem["status"];
  reviewer_id: string | null;
  review_note: string | null;
  reviewed_at: number | null;
  created_at: number;
  updated_at: number;
}

function mapContentModerationEvent(row: ContentModerationEventRow): AdminContentModerationItem {
  return {
    id: row.id,
    userId: row.user_id,
    nickname: row.nickname || undefined,
    avatarUrl: row.avatar_url || undefined,
    source: row.source,
    targetId: row.target_id || undefined,
    categories: JSON.parse(row.categories || "[]") as ContentModerationCategory[],
    reason: row.reason,
    contentPreview: row.content_preview,
    contentLength: row.content_length,
    modelId: row.model_id || undefined,
    status: row.status,
    reviewerId: row.reviewer_id || undefined,
    reviewNote: row.review_note || undefined,
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at).toISOString() : undefined,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString()
  };
}

export async function listContentModerationEvents(
  env: Env,
  query: AdminContentModerationListQuery
): Promise<PaginatedList<AdminContentModerationItem>> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (query.keyword) {
    conditions.push(
      `(content_moderation_events.id LIKE ?
        OR content_moderation_events.user_id LIKE ?
        OR user_profiles.nickname LIKE ?
        OR content_moderation_events.reason LIKE ?
        OR content_moderation_events.content_preview LIKE ?)`
    );
    params.push(
      `%${query.keyword}%`,
      `%${query.keyword}%`,
      `%${query.keyword}%`,
      `%${query.keyword}%`,
      `%${query.keyword}%`
    );
  }

  if (query.source) {
    conditions.push("content_moderation_events.source = ?");
    params.push(query.source);
  }

  if (query.category) {
    conditions.push("content_moderation_events.categories LIKE ?");
    params.push(`%"${query.category}"%`);
  }

  if (query.status) {
    conditions.push("content_moderation_events.status = ?");
    params.push(query.status);
  }

  const fromSql = `FROM content_moderation_events
       LEFT JOIN user_profiles ON user_profiles.user_id = content_moderation_events.user_id`;
  const whereSql = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const [countRow, result] = await Promise.all([
    env.DB.prepare(`SELECT COUNT(*) AS count ${fromSql} ${whereSql}`)
      .bind(...params)
      .first<{ count: number }>(),
    env.DB.prepare(
      `SELECT
         content_moderation_events.id,
         content_moderation_events.user_id,
         user_profiles.nickname,
         user_profiles.avatar_url,
         content_moderation_events.source,
         content_moderation_events.target_id,
         content_moderation_events.categories,
         content_moderation_events.reason,
         content_moderation_events.content_preview,
         content_moderation_events.content_length,
         content_moderation_events.model_id,
         content_moderation_events.status,
         content_moderation_events.reviewer_id,
         content_moderation_events.review_note,
         content_moderation_events.reviewed_at,
         content_moderation_events.created_at,
         content_moderation_events.updated_at
       ${fromSql}
       ${whereSql}
       ORDER BY content_moderation_events.created_at DESC
       LIMIT ? OFFSET ?`
    )
      .bind(...params, query.pageSize, paginationOffset(query))
      .all<ContentModerationEventRow>()
  ]);

  return createPaginatedList(result.results.map(mapContentModerationEvent), countRow?.count ?? 0, query);
}

export async function updateContentModerationEventStatus(
  env: Env,
  id: string,
  input: AdminContentModerationStatusUpdateInput,
  reviewerId?: string
) {
  const now = Date.now();

  await env.DB.prepare(
    `UPDATE content_moderation_events
     SET status = ?,
         reviewer_id = ?,
         review_note = ?,
         reviewed_at = ?,
         updated_at = ?
     WHERE id = ?`
  )
    .bind(input.status, reviewerId ?? null, input.note ?? null, now, now, id)
    .run();

  const row = await env.DB.prepare(
    `SELECT
       content_moderation_events.id,
       content_moderation_events.user_id,
       user_profiles.nickname,
       user_profiles.avatar_url,
       content_moderation_events.source,
       content_moderation_events.target_id,
       content_moderation_events.categories,
       content_moderation_events.reason,
       content_moderation_events.content_preview,
       content_moderation_events.content_length,
       content_moderation_events.model_id,
       content_moderation_events.status,
       content_moderation_events.reviewer_id,
       content_moderation_events.review_note,
       content_moderation_events.reviewed_at,
       content_moderation_events.created_at,
       content_moderation_events.updated_at
     FROM content_moderation_events
     LEFT JOIN user_profiles ON user_profiles.user_id = content_moderation_events.user_id
     WHERE content_moderation_events.id = ?`
  )
    .bind(id)
    .first<ContentModerationEventRow>();

  if (!row) {
    throw new AppError(404, "CONTENT_MODERATION_EVENT_NOT_FOUND", "内容审核事件不存在");
  }

  return mapContentModerationEvent(row);
}
