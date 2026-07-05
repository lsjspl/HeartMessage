import type {
  AdminAiConfig,
  AdminAiModel,
  AdminAiModelListQuery,
  AdminAiProvider,
  AdminAiProviderListQuery,
  AiModelUpsertInput,
  AiProviderUpsertInput,
  PaginatedList
} from "@heart-message/shared";
import type { Env } from "../env";
import { createPaginatedList, paginationOffset } from "./pagination";
import { getSystemSettings } from "./settings";

interface ProviderRow {
  id: string;
  name: string;
  adapter_type: AdminAiProvider["adapterType"];
  base_url: string | null;
  api_key_secret_name: string;
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
  purpose: AdminAiModel["purpose"];
  is_enabled: number;
  config_json: string;
  created_at: number;
  updated_at: number;
}

function mapProvider(row: ProviderRow): AdminAiProvider {
  return {
    id: row.id,
    name: row.name,
    adapterType: row.adapter_type,
    baseUrl: row.base_url || undefined,
    apiKeySecretName: row.api_key_secret_name,
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
    purpose: row.purpose,
    isEnabled: Boolean(row.is_enabled),
    configJson: JSON.parse(row.config_json || "{}") as Record<string, unknown>,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString()
  };
}

export async function listAiConfig(env: Env): Promise<AdminAiConfig> {
  const [providersResult, modelsResult, settings] = await Promise.all([
    env.DB.prepare(
      `SELECT id, name, adapter_type, base_url, api_key_secret_name, is_enabled, created_at, updated_at
       FROM ai_providers
       ORDER BY created_at DESC`
    ).all<ProviderRow>(),
    env.DB.prepare(
      `SELECT
         ai_models.id,
         ai_models.provider_id,
         ai_providers.name AS provider_name,
         ai_models.display_name,
         ai_models.model_name,
         ai_models.purpose,
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
    conditions.push("(id LIKE ? OR name LIKE ? OR base_url LIKE ? OR api_key_secret_name LIKE ?)");
    params.push(`%${query.keyword}%`, `%${query.keyword}%`, `%${query.keyword}%`, `%${query.keyword}%`);
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
      `SELECT id, name, adapter_type, base_url, api_key_secret_name, is_enabled, created_at, updated_at
       FROM ai_providers
       ${whereSql}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`
    )
      .bind(...params, query.pageSize, paginationOffset(query))
      .all<ProviderRow>()
  ]);

  return createPaginatedList(result.results.map(mapProvider), countRow?.count ?? 0, query);
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
    conditions.push("ai_models.purpose = ?");
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
         ai_models.purpose,
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
      input.apiKeySecretName,
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

  await env.DB.prepare(
    `INSERT INTO ai_models
       (id, provider_id, display_name, model_name, purpose, is_enabled, config_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       provider_id = excluded.provider_id,
       display_name = excluded.display_name,
       model_name = excluded.model_name,
       purpose = excluded.purpose,
       is_enabled = excluded.is_enabled,
       config_json = excluded.config_json,
       updated_at = excluded.updated_at`
  )
    .bind(
      id,
      input.providerId,
      input.displayName,
      input.modelName,
      input.purpose,
      input.isEnabled ? 1 : 0,
      JSON.stringify(input.configJson),
      now,
      now
    )
    .run();

  return id;
}
