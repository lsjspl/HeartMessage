import { listModelsWithProvider } from "@heart-message/ai";
import type {
  AdminAiConfig,
  AdminAiModel,
  AdminAiModelListQuery,
  AdminAiProviderModels,
  AdminAiProvider,
  AdminAiProviderListQuery,
  AiModelPurpose,
  AiModelUpsertInput,
  AiProviderUpsertInput,
  PaginatedList
} from "@heart-message/shared";
import { AppError } from "../errors";
import type { Env } from "../env";
import { createPaginatedList, paginationOffset } from "./pagination";
import { getSystemSettings, saveSystemSettings } from "./settings";
import { getSensitiveConfigValue, saveSensitiveConfigValue } from "./sensitive-config";

interface ProviderRow {
  id: string;
  name: string;
  adapter_type: AdminAiProvider["adapterType"];
  base_url: string | null;
  api_key_secret_name: string;
  api_key_configured?: number;
  is_enabled: number;
  created_at: number;
  updated_at: number;
}

interface ModelRow {
  id: string;
  provider_id: string;
  provider_name: string;
  display_name: string;
  model_name: string;
  purposes_json: string;
  is_enabled: number;
  config_json: string;
  created_at: number;
  updated_at: number;
}

interface AiModelDeleteResult {
  id: string;
  clearedPurposes: AiModelPurpose[];
}

function mapProvider(row: ProviderRow): AdminAiProvider {
  return {
    id: row.id,
    name: row.name,
    adapterType: row.adapter_type,
    baseUrl: row.base_url || undefined,
    apiKeySecretName: isLikelyRawApiKey(row.api_key_secret_name) ? undefined : row.api_key_secret_name,
    apiKeyConfigured: Boolean(row.api_key_configured),
    isEnabled: Boolean(row.is_enabled),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString()
  };
}

function mapModel(row: ModelRow): AdminAiModel {
  return {
    id: row.id,
    providerId: row.provider_id,
    providerName: row.provider_name,
    displayName: row.display_name,
    modelName: row.model_name,
    purposes: parseModelPurposes(row.purposes_json),
    isEnabled: Boolean(row.is_enabled),
    configJson: JSON.parse(row.config_json || "{}") as Record<string, unknown>,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString()
  };
}

function parseModelPurposes(value: string) {
  try {
    const parsed = JSON.parse(value || "[]") as unknown;

    if (Array.isArray(parsed)) {
      const purposes = parsed.filter((item): item is AiModelPurpose => typeof item === "string");

      if (purposes.length) {
        return [...new Set(purposes)];
      }
    }
  } catch {
    throw new AppError(500, "AI_MODEL_PURPOSES_INVALID", "AI 模型用途配置无效");
  }

  throw new AppError(500, "AI_MODEL_PURPOSES_INVALID", "AI 模型用途配置无效");
}

function normalizePurposes(purposes: AiModelPurpose[]) {
  return [...new Set(purposes)];
}

function providerApiKeySecretName(providerId: string) {
  return `AI_PROVIDER_${providerId.replace(/[^a-zA-Z0-9_.-]/g, "_").toUpperCase()}_API_KEY`;
}

function isLikelyRawApiKey(value: string) {
  return value.startsWith("sk-");
}

async function normalizeProviderApiKeySecretName(env: Env, provider: ProviderRow) {
  if (!isLikelyRawApiKey(provider.api_key_secret_name)) {
    return provider.api_key_secret_name;
  }

  const secretName = providerApiKeySecretName(provider.id);
  const now = Date.now();

  await saveSensitiveConfigValue(env, secretName, provider.api_key_secret_name, {
    label: `${provider.name} API Key`,
    groupName: "AI 供应商"
  });
  await env.DB.prepare("UPDATE ai_providers SET api_key_secret_name = ?, updated_at = ? WHERE id = ?")
    .bind(secretName, now, provider.id)
    .run();

  return secretName;
}

export async function listAiConfig(env: Env): Promise<AdminAiConfig> {
  const [providersResult, modelsResult, settings] = await Promise.all([
    env.DB.prepare(
      `SELECT
         ai_providers.id,
         ai_providers.name,
         ai_providers.adapter_type,
         ai_providers.base_url,
         ai_providers.api_key_secret_name,
         CASE
           WHEN sensitive_configs.value IS NOT NULL AND sensitive_configs.value <> '' THEN 1
           WHEN ai_providers.api_key_secret_name LIKE 'sk-%' THEN 1
           ELSE 0
         END AS api_key_configured,
         ai_providers.is_enabled,
         ai_providers.created_at,
         ai_providers.updated_at
       FROM ai_providers
       LEFT JOIN sensitive_configs ON sensitive_configs.key = ai_providers.api_key_secret_name
       ORDER BY ai_providers.created_at DESC`
    ).all<ProviderRow>(),
    env.DB.prepare(
      `SELECT
         ai_models.id,
         ai_models.provider_id,
         ai_providers.name AS provider_name,
         ai_models.display_name,
         ai_models.model_name,
         ai_models.purposes_json,
         ai_models.is_enabled,
         ai_models.config_json,
         ai_models.created_at,
         ai_models.updated_at
       FROM ai_models
       JOIN ai_providers ON ai_providers.id = ai_models.provider_id
       ORDER BY ai_models.created_at DESC`
    ).all<ModelRow>(),
    getSystemSettings(env)
  ]);

  return {
    providers: providersResult.results.map(mapProvider),
    models: modelsResult.results.map(mapModel),
    bindings: settings.aiBindings
  };
}

export async function listAiProviders(
  env: Env,
  query: AdminAiProviderListQuery
): Promise<PaginatedList<AdminAiProvider>> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (query.keyword) {
    conditions.push("(id LIKE ? OR name LIKE ? OR base_url LIKE ?)");
    params.push(`%${query.keyword}%`, `%${query.keyword}%`, `%${query.keyword}%`);
  }

  if (query.isEnabled) {
    conditions.push("is_enabled = ?");
    params.push(query.isEnabled === "true" ? 1 : 0);
  }

  const whereSql = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const [countRow, result] = await Promise.all([
    env.DB.prepare(`SELECT COUNT(*) AS count FROM ai_providers ${whereSql}`)
      .bind(...params)
      .first<{ count: number }>(),
    env.DB.prepare(
      `SELECT
         ai_providers.id,
         ai_providers.name,
         ai_providers.adapter_type,
         ai_providers.base_url,
         ai_providers.api_key_secret_name,
         CASE
           WHEN sensitive_configs.value IS NOT NULL AND sensitive_configs.value <> '' THEN 1
           WHEN ai_providers.api_key_secret_name LIKE 'sk-%' THEN 1
           ELSE 0
         END AS api_key_configured,
         ai_providers.is_enabled,
         ai_providers.created_at,
         ai_providers.updated_at
       FROM ai_providers
       LEFT JOIN sensitive_configs ON sensitive_configs.key = ai_providers.api_key_secret_name
       ${whereSql}
       ORDER BY ai_providers.created_at DESC
       LIMIT ? OFFSET ?`
    )
      .bind(...params, query.pageSize, paginationOffset(query))
      .all<ProviderRow>()
  ]);

  return createPaginatedList(result.results.map(mapProvider), countRow?.count ?? 0, query);
}

async function findAiProviderById(env: Env, providerId: string) {
  return env.DB.prepare(
    `SELECT id, name, adapter_type, base_url, api_key_secret_name, is_enabled, created_at, updated_at
     FROM ai_providers
     WHERE id = ?`
  )
    .bind(providerId)
    .first<ProviderRow>();
}

export async function listAiProviderModels(env: Env, providerId: string): Promise<AdminAiProviderModels> {
  const provider = await findAiProviderById(env, providerId);

  if (!provider) {
    throw new AppError(404, "AI_PROVIDER_NOT_FOUND", "AI 供应商不存在");
  }

  if (!provider.is_enabled) {
    throw new AppError(409, "AI_PROVIDER_DISABLED", "AI 供应商已停用");
  }

  if (!provider.base_url) {
    throw new AppError(422, "AI_PROVIDER_BASE_URL_REQUIRED", "AI 供应商未配置 baseUrl");
  }

  try {
    const apiKeySecretName = await normalizeProviderApiKeySecretName(env, provider);
    const apiKey = await getSensitiveConfigValue(env, apiKeySecretName);
    const models = await listModelsWithProvider({
      provider: provider.name,
      adapterType: provider.adapter_type,
      baseUrl: provider.base_url,
      apiKey
    });

    return {
      providerId: provider.id,
      providerName: provider.name,
      models: models
        .map((model) => ({
          id: model.id,
          displayName: model.displayName,
          owner: model.owner
        }))
        .sort((left, right) => left.id.localeCompare(right.id))
    };
  } catch (error) {
    if (error instanceof AppError && error.code === "SENSITIVE_CONFIG_NOT_CONFIGURED") {
      throw new AppError(
        409,
        "AI_PROVIDER_API_KEY_NOT_CONFIGURED",
        `供应商「${provider.name}」的 API Key 未配置：请编辑供应商填写 API Key`
      );
    }

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      502,
      "AI_PROVIDER_MODEL_LIST_FAILED",
      error instanceof Error ? error.message : "AI 供应商模型拉取失败"
    );
  }
}

export async function listAiModels(
  env: Env,
  query: AdminAiModelListQuery
): Promise<PaginatedList<AdminAiModel>> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (query.keyword) {
    conditions.push("(ai_models.id LIKE ? OR ai_models.display_name LIKE ? OR ai_models.model_name LIKE ?)");
    params.push(`%${query.keyword}%`, `%${query.keyword}%`, `%${query.keyword}%`);
  }

  if (query.providerId) {
    conditions.push("ai_models.provider_id = ?");
    params.push(query.providerId);
  }

  if (query.purpose) {
    conditions.push("EXISTS (SELECT 1 FROM json_each(ai_models.purposes_json) WHERE value = ?)");
    params.push(query.purpose);
  }

  if (query.isEnabled) {
    conditions.push("ai_models.is_enabled = ?");
    params.push(query.isEnabled === "true" ? 1 : 0);
  }

  const fromSql = `FROM ai_models
       JOIN ai_providers ON ai_providers.id = ai_models.provider_id`;
  const whereSql = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const [countRow, result] = await Promise.all([
    env.DB.prepare(`SELECT COUNT(*) AS count ${fromSql} ${whereSql}`)
      .bind(...params)
      .first<{ count: number }>(),
    env.DB.prepare(
      `SELECT
         ai_models.id,
         ai_models.provider_id,
         ai_providers.name AS provider_name,
         ai_models.display_name,
         ai_models.model_name,
         ai_models.purposes_json,
         ai_models.is_enabled,
         ai_models.config_json,
         ai_models.created_at,
         ai_models.updated_at
       ${fromSql}
       ${whereSql}
       ORDER BY ai_models.created_at DESC
       LIMIT ? OFFSET ?`
    )
      .bind(...params, query.pageSize, paginationOffset(query))
      .all<ModelRow>()
  ]);

  return createPaginatedList(result.results.map(mapModel), countRow?.count ?? 0, query);
}

export async function upsertAiProvider(env: Env, input: AiProviderUpsertInput) {
  const now = Date.now();
  const id = input.id || crypto.randomUUID();

  if (input.apiKeySecretName && isLikelyRawApiKey(input.apiKeySecretName)) {
    throw new AppError(422, "AI_PROVIDER_SECRET_KEY_INVALID", "请选择敏感配置键，不要填写 API Key 明文");
  }

  const existingProvider = input.id ? await findAiProviderById(env, input.id) : null;
  const normalizedExistingSecretName = existingProvider
    ? await normalizeProviderApiKeySecretName(env, existingProvider)
    : undefined;
  const apiKeySecretName =
    input.apiKeySecretName ?? normalizedExistingSecretName ?? providerApiKeySecretName(id);

  if (input.apiKey) {
    await saveSensitiveConfigValue(env, apiKeySecretName, input.apiKey, {
      label: `${input.name} API Key`,
      groupName: "AI 供应商"
    });
  }

  await env.DB.prepare(
      `INSERT INTO ai_providers
       (id, name, adapter_type, base_url, api_key_secret_name, is_enabled, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       adapter_type = excluded.adapter_type,
       base_url = excluded.base_url,
       api_key_secret_name = excluded.api_key_secret_name,
       is_enabled = excluded.is_enabled,
       updated_at = excluded.updated_at`
  )
    .bind(
      id,
      input.name,
      input.adapterType,
      input.baseUrl ?? null,
      apiKeySecretName,
      input.isEnabled ? 1 : 0,
      now,
      now
    )
    .run();

  return id;
}

export async function upsertAiModel(env: Env, input: AiModelUpsertInput) {
  const now = Date.now();
  const id = input.id || crypto.randomUUID();
  const purposes = normalizePurposes(input.purposes);
  const existing = await env.DB.prepare(
    `SELECT id
     FROM ai_models
     WHERE provider_id = ?
       AND model_name = ?
       AND id <> ?
     LIMIT 1`
  )
    .bind(input.providerId, input.modelName, id)
    .first<{ id: string }>();

  if (existing) {
    throw new AppError(409, "AI_MODEL_DUPLICATE", "同一供应商下该模型已存在");
  }

  await env.DB.prepare(
    `INSERT INTO ai_models
       (id, provider_id, display_name, model_name, purposes_json, is_enabled, config_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       provider_id = excluded.provider_id,
       display_name = excluded.display_name,
       model_name = excluded.model_name,
       purposes_json = excluded.purposes_json,
       is_enabled = excluded.is_enabled,
       config_json = excluded.config_json,
       updated_at = excluded.updated_at`
  )
    .bind(
      id,
      input.providerId,
      input.displayName,
      input.modelName,
      JSON.stringify(purposes),
      input.isEnabled ? 1 : 0,
      JSON.stringify(input.configJson),
      now,
      now
    )
    .run();

  return id;
}

export async function deleteAiModel(env: Env, modelId: string): Promise<AiModelDeleteResult> {
  const model = await env.DB.prepare("SELECT id, purposes_json FROM ai_models WHERE id = ?")
    .bind(modelId)
    .first<{ id: string; purposes_json: string }>();

  if (!model) {
    throw new AppError(404, "AI_MODEL_NOT_FOUND", "AI 模型不存在");
  }

  const settings = await getSystemSettings(env);
  const purposes = parseModelPurposes(model.purposes_json);
  const nextBindings = { ...settings.aiBindings };
  const clearedPurposes: AiModelPurpose[] = [];

  for (const purpose of purposes) {
    if (nextBindings[purpose] === modelId) {
      delete nextBindings[purpose];
      clearedPurposes.push(purpose);
    }
  }

  await env.DB.prepare("UPDATE content_moderation_events SET model_id = NULL WHERE model_id = ?")
    .bind(modelId)
    .run();
  await env.DB.prepare("DELETE FROM ai_models WHERE id = ?").bind(modelId).run();

  if (clearedPurposes.length) {
    await saveSystemSettings(env, {
      ...settings,
      aiBindings: nextBindings
    });
  }

  return {
    id: modelId,
    clearedPurposes
  };
}
