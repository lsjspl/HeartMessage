import {
  DAILY_PICK_LIMIT,
  DAILY_THROW_LIMIT,
  SystemSettingsSchema,
  type SystemSettings
} from "@heart-message/shared";
import type { Env } from "../env";

const SETTINGS_KEY = "system-settings";

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  runtime: {
    environment: "production",
    corsOrigins: ["*"]
  },
  dailyPickLimit: DAILY_PICK_LIMIT,
  dailyThrowLimit: DAILY_THROW_LIMIT,
  bottleExpires: "end_of_day",
  aiFallbackEnabled: true,
  aiTrigger: "empty_pool",
  aiBatchSize: 20,
  aiBindings: {},
  userProfileEvaluation: {
    enabled: true,
    intervalHours: 24,
    batchSize: 20
  }
};

export async function getSystemSettings(env: Env): Promise<SystemSettings> {
  const stored = await env.DB.prepare("SELECT value_json FROM system_settings WHERE key = ?")
    .bind(SETTINGS_KEY)
    .first<{ value_json: string }>();

  if (!stored) {
    await saveSystemSettings(env, DEFAULT_SYSTEM_SETTINGS);
    return DEFAULT_SYSTEM_SETTINGS;
  }

  const parsed = JSON.parse(stored.value_json) as Partial<SystemSettings>;

  return SystemSettingsSchema.parse({
    ...DEFAULT_SYSTEM_SETTINGS,
    ...parsed,
    runtime: {
      ...DEFAULT_SYSTEM_SETTINGS.runtime,
      ...(parsed.runtime ?? {})
    },
    aiBindings: {
      ...DEFAULT_SYSTEM_SETTINGS.aiBindings,
      ...(parsed.aiBindings ?? {})
    },
    userProfileEvaluation: {
      ...DEFAULT_SYSTEM_SETTINGS.userProfileEvaluation,
      ...(parsed.userProfileEvaluation ?? {})
    }
  });
}

export async function saveSystemSettings(env: Env, input: SystemSettings) {
  const settings = SystemSettingsSchema.parse(input);
  const now = Date.now();

  await env.DB.prepare(
    `INSERT INTO system_settings (key, value_json, created_at, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at`
  )
    .bind(SETTINGS_KEY, JSON.stringify(settings), now, now)
    .run();

  return settings;
}
