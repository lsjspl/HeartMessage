import type { OperationLogItem } from "@heart-message/shared";
import type { Env } from "../env";

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
  const isAdminActor = input.actorId?.startsWith("admin:");
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

export async function listOperationLogs(env: Env): Promise<OperationLogItem[]> {
  const result = await env.DB.prepare(
    `SELECT id, actor_id, action, target_type, target_id, metadata, created_at
     FROM operation_logs
     ORDER BY created_at DESC
     LIMIT 100`
  ).all<OperationLogRow>();

  return result.results.map((row) => ({
    id: row.id,
    actorId: row.actor_id || undefined,
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id || undefined,
    metadata: JSON.parse(row.metadata || "{}") as Record<string, unknown>,
    createdAt: new Date(row.created_at).toISOString()
  }));
}
