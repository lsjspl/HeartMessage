import { generateWithProvider, type AiGenerateOptions, type AiMessage } from "@heart-message/ai";
import type { AiModelPurpose } from "@heart-message/shared";
import { AppError } from "../errors";
import type { Env } from "../env";
import { getSystemSettings } from "./settings";

interface AiRuntimeModelRow {
  id: string;
  provider_name: string;
  adapter_type: string;
  base_url: string | null;
  api_key_secret_name: string;
  model_name: string;
  purpose: AiModelPurpose;
  config_json: string;
}

export interface ResolvedAiModel {
  id: string;
  providerName: string;
  adapterType: string;
  modelName: string;
  purpose: AiModelPurpose;
}

function parseModelOptions(value: string) {
  return JSON.parse(value || "{}") as Record<string, unknown>;
}

function readSecret(env: Env, secretName: string) {
  const value = (env as unknown as Record<string, unknown>)[secretName];

  if (typeof value !== "string" || !value) {
    throw new AppError(500, "AI_SECRET_NOT_CONFIGURED", `AI 密钥环境变量未配置：${secretName}`);
  }

  return value;
}

async function resolveAiModel(env: Env, purpose: AiModelPurpose) {
  const settings = await getSystemSettings(env);
  const modelId = settings.aiBindings[purpose];

  if (!modelId) {
    throw new AppError(409, "AI_MODEL_NOT_BOUND", `AI 用途未绑定模型：${purpose}`);
  }

  const row = await env.DB.prepare(
    `SELECT
       ai_models.id,
       ai_providers.name AS provider_name,
       ai_providers.adapter_type,
       ai_providers.base_url,
       ai_providers.api_key_secret_name,
       ai_models.model_name,
       ai_models.purpose,
       ai_models.config_json
     FROM ai_models
     JOIN ai_providers ON ai_providers.id = ai_models.provider_id
     WHERE ai_models.id = ?
       AND ai_models.purpose = ?
       AND ai_models.is_enabled = 1
       AND ai_providers.is_enabled = 1`
  )
    .bind(modelId, purpose)
    .first<AiRuntimeModelRow>();

  if (!row) {
    throw new AppError(409, "AI_MODEL_NOT_AVAILABLE", `AI 模型不可用：${purpose}`);
  }

  return row;
}

export async function generateAiText(
  env: Env,
  purpose: AiModelPurpose,
  messages: AiMessage[],
  options?: AiGenerateOptions
) {
  const row = await resolveAiModel(env, purpose);
  const result = await generateWithProvider(
    {
      provider: row.provider_name,
      adapterType: row.adapter_type,
      model: row.model_name,
      purpose: row.purpose,
      baseUrl: row.base_url || undefined,
      apiKey: readSecret(env, row.api_key_secret_name),
      options: parseModelOptions(row.config_json)
    },
    messages,
    options
  );

  return {
    result,
    model: {
      id: row.id,
      providerName: row.provider_name,
      adapterType: row.adapter_type,
      modelName: row.model_name,
      purpose: row.purpose
    } satisfies ResolvedAiModel
  };
}
