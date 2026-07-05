import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const wranglerConfigPath = path.join(rootDir, "apps", "api", "wrangler.jsonc");
const systemSettingsKey = "system-settings";
const sensitiveConfigKey = "system-sensitive-config";

function requireEnv(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`缺少构建环境变量：${name}`);
  }

  return value;
}

function optionalEnv(name) {
  const value = process.env[name]?.trim();

  return value || undefined;
}

function parseCorsOrigins() {
  const origins = requireEnv("PRODUCTION_CORS_ORIGINS")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins.length === 0) {
    throw new Error("PRODUCTION_CORS_ORIGINS 至少需要配置一个域名");
  }

  return origins;
}

async function readConfigKvNamespaceId() {
  if (optionalEnv("CONFIG_KV_NAMESPACE_ID")) {
    return optionalEnv("CONFIG_KV_NAMESPACE_ID");
  }

  const config = JSON.parse(await readFile(wranglerConfigPath, "utf8"));
  const namespace = config.kv_namespaces?.find((item) => item.binding === "CONFIG_KV");

  if (!namespace?.id) {
    throw new Error("未找到 CONFIG_KV namespace id，请配置 CONFIG_KV_NAMESPACE_ID");
  }

  return namespace.id;
}

async function cloudflareRequest(pathname, init = {}) {
  const accountId = requireEnv("CLOUDFLARE_ACCOUNT_ID");
  const token = requireEnv("CLOUDFLARE_API_TOKEN");
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}${pathname}`, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      ...(init.headers ?? {})
    }
  });

  if (response.status === 404) {
    return undefined;
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Cloudflare API 请求失败：${response.status} ${body}`);
  }

  return response;
}

async function readKvJson(namespaceId, key) {
  const response = await cloudflareRequest(
    `/storage/kv/namespaces/${namespaceId}/values/${encodeURIComponent(key)}`
  );

  if (!response) {
    return undefined;
  }

  return response.json();
}

async function writeKvJson(namespaceId, key, value) {
  await cloudflareRequest(`/storage/kv/namespaces/${namespaceId}/values/${encodeURIComponent(key)}`, {
    method: "PUT",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(value)
  });
}

function createSystemSettings() {
  return {
    runtime: {
      environment: "production",
      corsOrigins: parseCorsOrigins()
    },
    dailyPickLimit: 20,
    dailyThrowLimit: 3,
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
}

function parseExtraSensitiveConfig() {
  const raw = optionalEnv("EXTRA_SENSITIVE_CONFIG_JSON");

  if (!raw) {
    return {};
  }

  const parsed = JSON.parse(raw);

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("EXTRA_SENSITIVE_CONFIG_JSON 必须是 JSON object");
  }

  return Object.fromEntries(
    Object.entries(parsed).filter(([, value]) => typeof value === "string" && value.length > 0)
  );
}

function createSensitiveValues() {
  return {
    AUTH_TOKEN_SECRET: requireEnv("AUTH_TOKEN_SECRET"),
    ...(optionalEnv("WECHAT_APP_ID") ? { WECHAT_APP_ID: optionalEnv("WECHAT_APP_ID") } : {}),
    ...(optionalEnv("WECHAT_APP_SECRET") ? { WECHAT_APP_SECRET: optionalEnv("WECHAT_APP_SECRET") } : {}),
    ...(optionalEnv("LOCAL_TEST_MODEL_API_KEY")
      ? { LOCAL_TEST_MODEL_API_KEY: optionalEnv("LOCAL_TEST_MODEL_API_KEY") }
      : {}),
    ...parseExtraSensitiveConfig()
  };
}

async function seedSystemSettings(namespaceId, overwrite) {
  const existing = await readKvJson(namespaceId, systemSettingsKey);

  if (existing && !overwrite) {
    console.log(`${systemSettingsKey} 已存在，跳过覆盖`);
    return;
  }

  await writeKvJson(namespaceId, systemSettingsKey, createSystemSettings());
  console.log(`${systemSettingsKey} 已写入`);
}

async function seedSensitiveConfig(namespaceId, overwrite) {
  const existing = (await readKvJson(namespaceId, sensitiveConfigKey)) ?? {};
  const values = createSensitiveValues();
  const now = Date.now();
  let changed = false;
  const next = {
    values: {
      ...(existing.values ?? {})
    },
    updatedAt: {
      ...(existing.updatedAt ?? {})
    }
  };

  for (const [key, value] of Object.entries(values)) {
    if (!overwrite && next.values[key]) {
      console.log(`${sensitiveConfigKey}.${key} 已存在，跳过覆盖`);
      continue;
    }

    next.values[key] = value;
    next.updatedAt[key] = now;
    changed = true;
    console.log(`${sensitiveConfigKey}.${key} 已写入`);
  }

  if (!changed) {
    console.log(`${sensitiveConfigKey} 没有新配置，跳过写入`);
    return;
  }

  await writeKvJson(namespaceId, sensitiveConfigKey, next);
}

async function main() {
  const namespaceId = await readConfigKvNamespaceId();
  const overwrite = process.env.OVERWRITE_CLOUDFLARE_CONFIG === "true";

  await seedSystemSettings(namespaceId, overwrite);
  await seedSensitiveConfig(namespaceId, overwrite);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
