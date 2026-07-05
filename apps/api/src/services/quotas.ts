import type { BottleQuota, SystemSettings } from "@heart-message/shared";
import { AppError } from "../errors";
import type { Env } from "../env";
import { getSystemSettings } from "./settings";
import { getQuotaDate } from "./time";

interface QuotaRow {
  id: string;
  user_id: string;
  quota_date: string;
  picked_count: number;
  thrown_count: number;
}

function mapQuota(row: QuotaRow, settings: SystemSettings): BottleQuota {
  return {
    quotaDate: row.quota_date,
    pickLimit: settings.dailyPickLimit,
    throwLimit: settings.dailyThrowLimit,
    pickedCount: row.picked_count,
    thrownCount: row.thrown_count,
    pickRemaining: Math.max(settings.dailyPickLimit - row.picked_count, 0),
    throwRemaining: Math.max(settings.dailyThrowLimit - row.thrown_count, 0)
  };
}

async function ensureQuotaRow(env: Env, userId: string, quotaDate: string, now: number) {
  await env.DB.prepare(
    `INSERT OR IGNORE INTO daily_quotas
       (id, user_id, quota_date, picked_count, thrown_count, created_at, updated_at)
     VALUES (?, ?, ?, 0, 0, ?, ?)`
  )
    .bind(crypto.randomUUID(), userId, quotaDate, now, now)
    .run();
}

export async function getBottleQuota(env: Env, userId: string, quotaDate = getQuotaDate()) {
  const now = Date.now();
  const settings = await getSystemSettings(env);
  await ensureQuotaRow(env, userId, quotaDate, now);

  const row = await env.DB.prepare(
    `SELECT id, user_id, quota_date, picked_count, thrown_count
     FROM daily_quotas
     WHERE user_id = ? AND quota_date = ?`
  )
    .bind(userId, quotaDate)
    .first<QuotaRow>();

  if (!row) {
    throw new Error("每日额度初始化失败");
  }

  return mapQuota(row, settings);
}

export async function consumeThrowQuota(env: Env, userId: string, quotaDate = getQuotaDate()) {
  const now = Date.now();
  const settings = await getSystemSettings(env);
  await ensureQuotaRow(env, userId, quotaDate, now);

  const result = await env.DB.prepare(
    `UPDATE daily_quotas
     SET thrown_count = thrown_count + 1, updated_at = ?
     WHERE user_id = ? AND quota_date = ? AND thrown_count < ?`
  )
    .bind(now, userId, quotaDate, settings.dailyThrowLimit)
    .run();

  if ((result.meta.changes ?? 0) !== 1) {
    throw new AppError(429, "THROW_LIMIT_REACHED", "今天扔瓶子的次数已经用完");
  }

  return getBottleQuota(env, userId, quotaDate);
}

export async function consumePickQuota(env: Env, userId: string, quotaDate = getQuotaDate()) {
  const now = Date.now();
  const settings = await getSystemSettings(env);
  await ensureQuotaRow(env, userId, quotaDate, now);

  const result = await env.DB.prepare(
    `UPDATE daily_quotas
     SET picked_count = picked_count + 1, updated_at = ?
     WHERE user_id = ? AND quota_date = ? AND picked_count < ?`
  )
    .bind(now, userId, quotaDate, settings.dailyPickLimit)
    .run();

  if ((result.meta.changes ?? 0) !== 1) {
    throw new AppError(429, "PICK_LIMIT_REACHED", "今天捡瓶子的次数已经用完");
  }

  return getBottleQuota(env, userId, quotaDate);
}

export async function releaseThrowQuota(env: Env, userId: string, quotaDate = getQuotaDate()) {
  await env.DB.prepare(
    `UPDATE daily_quotas
     SET thrown_count = CASE WHEN thrown_count > 0 THEN thrown_count - 1 ELSE 0 END,
         updated_at = ?
     WHERE user_id = ? AND quota_date = ?`
  )
    .bind(Date.now(), userId, quotaDate)
    .run();
}

export async function releasePickQuota(env: Env, userId: string, quotaDate = getQuotaDate()) {
  await env.DB.prepare(
    `UPDATE daily_quotas
     SET picked_count = CASE WHEN picked_count > 0 THEN picked_count - 1 ELSE 0 END,
         updated_at = ?
     WHERE user_id = ? AND quota_date = ?`
  )
    .bind(Date.now(), userId, quotaDate)
    .run();
}
