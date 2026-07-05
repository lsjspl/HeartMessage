import {
  SensitiveConfigKeySchema,
  type SensitiveConfigItem,
  type SensitiveConfigKey,
  type SensitiveConfigSource
} from "@heart-message/shared";
import { AppError } from "../errors";
import type { Env } from "../env";
import { getSystemSettings } from "./settings";

const CONFIG_DEFINITIONS: Array<{ key: SensitiveConfigKey; label: string }> = [
  { key: "AUTH_TOKEN_SECRET", label: "登录 Token 签名密钥" },
  { key: "LOCAL_TEST_MODEL_API_KEY", label: "本地测试 AI Key" },
  { key: "WECHAT_APP_ID", label: "微信 App ID" },
  { key: "WECHAT_APP_SECRET", label: "微信 App Secret" }
];

const LOCAL_DEFAULTS: Partial<Record<SensitiveConfigKey, string>> = {
  AUTH_TOKEN_SECRET: "local-dev-secret-change-before-production",
  LOCAL_TEST_MODEL_API_KEY: "local-fake-ai-key"
};

function isLocalRuntime(environment: string) {
  return environment === "local" || environment === "development" || environment === "test";
}

function labelForKey(key: SensitiveConfigKey) {
  return CONFIG_DEFINITIONS.find((item) => item.key === key)?.label ?? key;
}

function previewValue(value: string) {
  if (value.length <= 8) {
    return "已设置";
  }

  return `${value.slice(0, 2)}***${value.slice(-4)}`;
}

function createSecretValue() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);

  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

async function readConfigRows(env: Env) {
  return env.DB.prepare("SELECT key, value, updated_at FROM sensitive_configs")
    .all<{ key: string; value: string; updated_at: number }>();
}

async function readConfigValue(env: Env, key: SensitiveConfigKey) {
  return env.DB.prepare("SELECT value, updated_at FROM sensitive_configs WHERE key = ?")
    .bind(key)
    .first<{ value: string; updated_at: number }>();
}

async function upsertConfigValue(env: Env, key: SensitiveConfigKey, value: string) {
  const now = Date.now();

  await env.DB.prepare(
    `INSERT INTO sensitive_configs (key, value, created_at, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
  )
    .bind(key, value, now, now)
    .run();
}

async function createBootstrapAuthSecret(env: Env) {
  const value = createSecretValue();

  await upsertConfigValue(env, "AUTH_TOKEN_SECRET", value);

  return { value, source: "custom" as const };
}

export async function resolveSensitiveConfig(
  env: Env,
  keyInput: string
): Promise<{ value: string; source: SensitiveConfigSource }> {
  const key = SensitiveConfigKeySchema.parse(keyInput);
  const [row, settings] = await Promise.all([readConfigValue(env, key), getSystemSettings(env)]);
  const customValue = row?.value;

  if (customValue) {
    return { value: customValue, source: "custom" };
  }

  const localDefault = LOCAL_DEFAULTS[key];

  if (localDefault && isLocalRuntime(settings.runtime.environment)) {
    return { value: localDefault, source: "local_default" };
  }

  if (key === "AUTH_TOKEN_SECRET") {
    return createBootstrapAuthSecret(env);
  }

  throw new AppError(500, "SENSITIVE_CONFIG_NOT_CONFIGURED", `${labelForKey(key)}未配置`);
}

export async function getSensitiveConfigValue(env: Env, key: string) {
  return (await resolveSensitiveConfig(env, key)).value;
}

export async function getOptionalSensitiveConfigValue(env: Env, key: string) {
  try {
    return await getSensitiveConfigValue(env, key);
  } catch (error) {
    if (error instanceof AppError && error.code === "SENSITIVE_CONFIG_NOT_CONFIGURED") {
      return undefined;
    }

    throw error;
  }
}

export async function listSensitiveConfigItems(env: Env): Promise<SensitiveConfigItem[]> {
  const [rows, settings] = await Promise.all([readConfigRows(env), getSystemSettings(env)]);
  const record = new Map(rows.results.map((row) => [row.key, row]));
  const keys = new Set<SensitiveConfigKey>(CONFIG_DEFINITIONS.map((item) => item.key));

  for (const key of record.keys()) {
    keys.add(SensitiveConfigKeySchema.parse(key));
  }

  return [...keys].map((key) => {
    const row = record.get(key);
    const customValue = row?.value;
    const localDefault = isLocalRuntime(settings.runtime.environment) ? LOCAL_DEFAULTS[key] : undefined;
    const value = customValue || localDefault;
    const source: SensitiveConfigSource = customValue ? "custom" : localDefault ? "local_default" : "missing";
    const updatedAt = row?.updated_at;

    return {
      key,
      label: labelForKey(key),
      configured: Boolean(value),
      source,
      valuePreview: value ? previewValue(value) : undefined,
      updatedAt: updatedAt ? new Date(updatedAt).toISOString() : undefined
    };
  });
}

export async function saveSensitiveConfigValue(env: Env, keyInput: string, value: string) {
  const key = SensitiveConfigKeySchema.parse(keyInput);
  await upsertConfigValue(env, key, value);

  return listSensitiveConfigItems(env);
}
