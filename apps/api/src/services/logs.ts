import type { AdminOperationLogListQuery, OperationLogItem, PaginatedList } from "@heart-message/shared";
import type { Env } from "../env";
import { createPaginatedList, paginationOffset } from "./pagination";

interface OperationLogRow {
  id: string;
  actor_id: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  metadata: string;
  created_at: number;
}

export async function writeOperationLog(
  env: Env,
  input: {
    actorId?: string;
    action: string;
    targetType: string;
    targetId?: string;
    metadata?: Record<string, unknown>;
  }
) {
  const isAdminActor =
    input.actorId?.startsWith("admin:") || input.actorId?.startsWith("admin_account:");
  const metadata = {
    ...(input.metadata ?? {}),
    ...(isAdminActor ? { adminActor: input.actorId } : {})
  };

  await env.DB.prepare(
    `INSERT INTO operation_logs (id, actor_id, action, target_type, target_id, metadata, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      crypto.randomUUID(),
      isAdminActor ? null : input.actorId ?? null,
      input.action,
      input.targetType,
      input.targetId ?? null,
      JSON.stringify(metadata),
      Date.now()
    )
    .run();
}

export async function listOperationLogs(
  env: Env,
  query: AdminOperationLogListQuery
): Promise<PaginatedList<OperationLogItem>> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (query.keyword) {
    conditions.push("(action LIKE ? OR target_type LIKE ? OR target_id LIKE ?)");
    params.push(`%${query.keyword}%`, `%${query.keyword}%`, `%${query.keyword}%`);
  }

  if (query.action) {
    conditions.push("action LIKE ?");
    params.push(`%${query.action}%`);
  }

  if (query.targetType) {
    conditions.push("target_type LIKE ?");
    params.push(`%${query.targetType}%`);
  }

  const whereSql = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const [countRow, result] = await Promise.all([
    env.DB.prepare(`SELECT COUNT(*) AS count FROM operation_logs ${whereSql}`)
      .bind(...params)
      .first<{ count: number }>(),
    env.DB.prepare(
      `SELECT id, actor_id, action, target_type, target_id, metadata, created_at
       FROM operation_logs
       ${whereSql}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`
    )
      .bind(...params, query.pageSize, paginationOffset(query))
      .all<OperationLogRow>()
  ]);

  const items = result.results.map((row) => ({
    id: row.id,
    actorId: row.actor_id || undefined,
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id || undefined,
    metadata: JSON.parse(row.metadata || "{}") as Record<string, unknown>,
    createdAt: new Date(row.created_at).toISOString()
  }));

  return createPaginatedList(items, countRow?.count ?? 0, query);
}
