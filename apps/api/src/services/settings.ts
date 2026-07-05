import {
  DAILY_PICK_LIMIT,
  DAILY_THROW_LIMIT,
  SystemSettingsSchema,
  type SystemSettings
} from "@heart-message/shared";
import type { Env } from "../env";

const SETTINGS_KEY = "system-settings";

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  dailyPickLimit: DAILY_PICK_LIMIT,
  dailyThrowLimit: DAILY_THROW_LIMIT,
  bottleExpires: "end_of_day",
  aiFallbackEnabled: true,
  aiTrigger: "empty_pool",
  aiBatchSize: 20,
  aiBindings: {}
};

export async function getSystemSettings(env: Env): Promise<SystemSettings> {
  const stored = await env.CONFIG_KV.get(SETTINGS_KEY);

  if (!stored) {
    return DEFAULT_SYSTEM_SETTINGS;
  }

  return SystemSettingsSchema.parse({
    ...DEFAULT_SYSTEM_SETTINGS,
    ...(JSON.parse(stored) as Record<string, unknown>)
  });
}

export async function saveSystemSettings(env: Env, input: SystemSettings) {
  const settings = SystemSettingsSchema.parse(input);
  await env.CONFIG_KV.put(SETTINGS_KEY, JSON.stringify(settings));

  return settings;
}
