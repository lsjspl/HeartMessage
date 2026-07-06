import {
  SensitiveConfigKeySchema,
  type SensitiveConfigItem,
  type SensitiveConfigKey,
  type SensitiveConfigSource
} from "@heart-message/shared";
import { AppError } from "../errors";
import type { Env } from "../env";
import { getSystemSettings } from "./settings";

const CONFIG_DEFINITIONS: Array<{ key: SensitiveConfigKey; label: string; groupName: string }> = [
  { key: "AUTH_TOKEN_SECRET", label: "登录 Token 签名密钥", groupName: "认证" },
  { key: "LOCAL_TEST_MODEL_API_KEY", label: "本地测试 AI Key", groupName: "AI 供应商" },
  { key: "WECHAT_WEB_APP_ID", label: "微信网站应用 AppID", groupName: "第三方登录" },
  { key: "WECHAT_WEB_APP_SECRET", label: "微信网站应用 AppSecret", groupName: "第三方登录" },
  { key: "GOOGLE_OAUTH_CLIENT_ID", label: "Google OAuth Client ID", groupName: "第三方登录" },
  { key: "GOOGLE_OAUTH_CLIENT_SECRET", label: "Google OAuth Client Secret", groupName: "第三方登录" }
];

const LOCAL_DEFAULTS: Partial<Record<SensitiveConfigKey, string>> = {
  AUTH_TOKEN_SECRET: "local-dev-secret-change-before-production",
  LOCAL_TEST_MODEL_API_KEY: "local-fake-ai-key"
};

function isLocalRuntime(environment: string) {
  return environment === "local" || environment === "development" || environment === "test";
}

function labelForKey(key: SensitiveConfigKey) {
  return CONFIG_DEFINITIONS.find((item) => item.key === key)?.label ?? "敏感配置";
}

function groupForKey(key: SensitiveConfigKey) {
  return CONFIG_DEFINITIONS.find((item) => item.key === key)?.groupName ?? "自定义";
}

function previewValue() {
  return "已设置";
}

function isLikelyRawSecretKey(value: string) {
  return value.startsWith("sk-");
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
  return env.DB.prepare("SELECT key, value, label, group_name, updated_at FROM sensitive_configs")
    .all<{ key: string; value: string; label: string | null; group_name: string | null; updated_at: number }>();
}

async function readConfigValue(env: Env, key: SensitiveConfigKey) {
  return env.DB.prepare("SELECT value, updated_at FROM sensitive_configs WHERE key = ?")
    .bind(key)
    .first<{ value: string; updated_at: number }>();
}

async function readAiProviderSecretKeys(env: Env) {
  return env.DB.prepare(
    `SELECT DISTINCT api_key_secret_name
     FROM ai_providers
     WHERE api_key_secret_name IS NOT NULL
       AND api_key_secret_name <> ''`
  ).all<{ api_key_secret_name: string }>();
}

async function upsertConfigValue(
  env: Env,
  key: SensitiveConfigKey,
  value: string,
  metadata: { label?: string; groupName?: string } = {}
) {
  const now = Date.now();

  await env.DB.prepare(
    `INSERT INTO sensitive_configs (key, value, label, group_name, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET
       value = excluded.value,
       label = COALESCE(excluded.label, sensitive_configs.label),
       group_name = COALESCE(excluded.group_name, sensitive_configs.group_name),
       updated_at = excluded.updated_at`
  )
    .bind(key, value, metadata.label ?? null, metadata.groupName ?? null, now, now)
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
  const parsedKey = SensitiveConfigKeySchema.safeParse(keyInput);

  if (!parsedKey.success) {
    throw new AppError(500, "SENSITIVE_CONFIG_NOT_CONFIGURED", "敏感配置未配置");
  }

  const key = parsedKey.data;
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
  const [rows, settings, aiProviderSecretRows] = await Promise.all([
    readConfigRows(env),
    getSystemSettings(env),
    readAiProviderSecretKeys(env)
  ]);
  const record = new Map(rows.results.map((row) => [row.key, row]));
  const keys = new Set<SensitiveConfigKey>(CONFIG_DEFINITIONS.map((item) => item.key));

  for (const row of aiProviderSecretRows.results) {
    if (isLikelyRawSecretKey(row.api_key_secret_name)) {
      continue;
    }

    const parsedKey = SensitiveConfigKeySchema.safeParse(row.api_key_secret_name);

    if (parsedKey.success) {
      keys.add(parsedKey.data);
    }
  }

  for (const key of record.keys()) {
    if (isLikelyRawSecretKey(key)) {
      continue;
    }

    const parsedKey = SensitiveConfigKeySchema.safeParse(key);

    if (parsedKey.success) {
      keys.add(parsedKey.data);
    }
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
      label: row?.label || labelForKey(key),
      groupName: row?.group_name || groupForKey(key),
      configured: Boolean(value),
      source,
      valuePreview: value ? previewValue() : undefined,
      updatedAt: updatedAt ? new Date(updatedAt).toISOString() : undefined
    };
  }).sort((left, right) => left.groupName.localeCompare(right.groupName) || left.key.localeCompare(right.key));
}

export async function saveSensitiveConfigValue(
  env: Env,
  keyInput: string,
  value: string,
  metadata: { label?: string; groupName?: string } = {}
) {
  const parsedKey = SensitiveConfigKeySchema.safeParse(keyInput);

  if (!parsedKey.success) {
    throw new AppError(422, "SENSITIVE_CONFIG_KEY_INVALID", "敏感配置键格式不正确");
  }

  const key = parsedKey.data;
  await upsertConfigValue(env, key, value, metadata);

  return listSensitiveConfigItems(env);
}
