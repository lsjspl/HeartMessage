import {
  SensitiveConfigKeySchema,
  type SensitiveConfigItem,
  type SensitiveConfigKey,
  type SensitiveConfigSource
} from "@heart-message/shared";
import { AppError } from "../errors";
import type { Env } from "../env";
import { getSystemSettings } from "./settings";

const SENSITIVE_CONFIG_KEY = "system-sensitive-config";

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

interface SensitiveConfigRecord {
  values?: Partial<Record<SensitiveConfigKey, string>>;
  updatedAt?: Partial<Record<SensitiveConfigKey, number>>;
}

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

async function readConfigRecord(env: Env): Promise<SensitiveConfigRecord> {
  const stored = await env.CONFIG_KV.get(SENSITIVE_CONFIG_KEY);

  if (!stored) {
    return {};
  }

  return JSON.parse(stored) as SensitiveConfigRecord;
}

async function writeConfigRecord(env: Env, record: SensitiveConfigRecord) {
  await env.CONFIG_KV.put(SENSITIVE_CONFIG_KEY, JSON.stringify(record));
}

export async function resolveSensitiveConfig(
  env: Env,
  keyInput: string
): Promise<{ value: string; source: SensitiveConfigSource }> {
  const key = SensitiveConfigKeySchema.parse(keyInput);
  const [record, settings] = await Promise.all([readConfigRecord(env), getSystemSettings(env)]);
  const customValue = record.values?.[key];

  if (customValue) {
    return { value: customValue, source: "custom" };
  }

  const localDefault = LOCAL_DEFAULTS[key];

  if (localDefault && isLocalRuntime(settings.runtime.environment)) {
    return { value: localDefault, source: "local_default" };
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
  const [record, settings] = await Promise.all([readConfigRecord(env), getSystemSettings(env)]);
  const keys = new Set<SensitiveConfigKey>(CONFIG_DEFINITIONS.map((item) => item.key));

  for (const key of Object.keys(record.values ?? {})) {
    keys.add(SensitiveConfigKeySchema.parse(key));
  }

  return [...keys].map((key) => {
    const customValue = record.values?.[key];
    const localDefault = isLocalRuntime(settings.runtime.environment) ? LOCAL_DEFAULTS[key] : undefined;
    const value = customValue || localDefault;
    const source: SensitiveConfigSource = customValue ? "custom" : localDefault ? "local_default" : "missing";
    const updatedAt = record.updatedAt?.[key];

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
  const record = await readConfigRecord(env);
  const now = Date.now();

  await writeConfigRecord(env, {
    values: {
      ...(record.values ?? {}),
      [key]: value
    },
    updatedAt: {
      ...(record.updatedAt ?? {}),
      [key]: now
    }
  });

  return listSensitiveConfigItems(env);
}
