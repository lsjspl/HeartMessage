import type { AiModelPurpose } from "@heart-message/shared";

export interface AiModelConfig {
  provider: string;
  adapterType: string;
  model: string;
  purpose: AiModelPurpose;
  baseUrl?: string;
  apiKey?: string;
  options?: Record<string, unknown>;
}

export interface AiModelListConfig {
  provider: string;
  adapterType: string;
  baseUrl?: string;
  apiKey?: string;
}

export interface AiProviderModelOption {
  id: string;
  displayName?: string;
  owner?: string;
  raw?: unknown;
}

export interface AiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AiGenerateOptions {
  temperature?: number;
  maxTokens?: number;
  metadata?: Record<string, unknown>;
}

export interface AiGenerateResult {
  content: string;
  provider: string;
  model: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
  raw?: unknown;
}

export interface AiProviderAdapter {
  readonly name: string;
  listModels?(config: AiModelListConfig): Promise<AiProviderModelOption[]>;
  generateText(
    config: AiModelConfig,
    messages: AiMessage[],
    options?: AiGenerateOptions
  ): Promise<AiGenerateResult>;
}

const adapters = new Map<string, AiProviderAdapter>();

function trimTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function getNumberOption(options: Record<string, unknown>, key: string) {
  const value = options[key];

  return typeof value === "number" ? value : undefined;
}

function getResponseText(data: unknown) {
  const choices = (data as { choices?: Array<{ message?: { content?: unknown }; text?: unknown }> }).choices;
  const firstChoice = choices?.[0];
  const content = firstChoice?.message?.content ?? firstChoice?.text;

  return typeof content === "string" ? content.trim() : "";
}

function mapOpenAiCompatibleModels(data: unknown): AiProviderModelOption[] {
  const items = (data as { data?: unknown }).data;

  if (!Array.isArray(items)) {
    throw new Error("AI provider returned invalid model list");
  }

  const models: AiProviderModelOption[] = [];

  for (const item of items) {
    const record = item as { id?: unknown; owned_by?: unknown };

    if (typeof record.id === "string" && record.id) {
      models.push({
        id: record.id,
        displayName: record.id,
        owner: typeof record.owned_by === "string" ? record.owned_by : undefined,
        raw: item
      });
    }
  }

  return models;
}

const openAiCompatibleAdapter: AiProviderAdapter = {
  name: "openai_compatible",
  async listModels(config) {
    if (!config.baseUrl) {
      throw new Error("AI provider baseUrl is required for openai_compatible adapter");
    }

    if (!config.apiKey) {
      throw new Error("AI provider apiKey is required");
    }

    const response = await fetch(`${trimTrailingSlash(config.baseUrl)}/models`, {
      headers: {
        authorization: `Bearer ${config.apiKey}`
      }
    });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(`AI provider models request failed: ${response.status}`);
    }

    return mapOpenAiCompatibleModels(data);
  },
  async generateText(config, messages, options) {
    if (!config.baseUrl) {
      throw new Error("AI provider baseUrl is required for openai_compatible adapter");
    }

    if (!config.apiKey) {
      throw new Error("AI provider apiKey is required");
    }

    const providerOptions = config.options ?? {};
    const temperature = options?.temperature ?? getNumberOption(providerOptions, "temperature");
    const maxTokens =
      options?.maxTokens ??
      getNumberOption(providerOptions, "maxTokens") ??
      getNumberOption(providerOptions, "max_tokens");
    const requestBody: Record<string, unknown> = {
      ...providerOptions,
      model: config.model,
      messages
    };

    delete requestBody.maxTokens;

    if (temperature !== undefined) {
      requestBody.temperature = temperature;
    }

    if (maxTokens !== undefined) {
      requestBody.max_tokens = maxTokens;
    }

    const response = await fetch(`${trimTrailingSlash(config.baseUrl)}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${config.apiKey}`
      },
      body: JSON.stringify(requestBody)
    });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(`AI provider request failed: ${response.status}`);
    }

    const content = getResponseText(data);

    if (!content) {
      throw new Error("AI provider returned empty content");
    }

    const usage = (data as {
      usage?: {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
      };
    } | null)?.usage;

    return {
      content,
      provider: config.provider,
      model: config.model,
      usage: usage
        ? {
            inputTokens: usage.prompt_tokens,
            outputTokens: usage.completion_tokens,
            totalTokens: usage.total_tokens
          }
        : undefined,
      raw: data
    };
  }
};

export function registerAiProvider(adapter: AiProviderAdapter) {
  adapters.set(adapter.name, adapter);
}

export function getAiProvider(name: string) {
  return adapters.get(name);
}

export async function generateWithProvider(
  config: AiModelConfig,
  messages: AiMessage[],
  options?: AiGenerateOptions
) {
  const adapter = getAiProvider(config.adapterType);

  if (!adapter) {
    throw new Error(`AI provider adapter is not registered: ${config.adapterType}`);
  }

  return adapter.generateText(config, messages, options);
}

export async function listModelsWithProvider(config: AiModelListConfig) {
  const adapter = getAiProvider(config.adapterType);

  if (!adapter) {
    throw new Error(`AI provider adapter is not registered: ${config.adapterType}`);
  }

  if (!adapter.listModels) {
    throw new Error(`AI provider adapter cannot list models: ${config.adapterType}`);
  }

  return adapter.listModels(config);
}

registerAiProvider(openAiCompatibleAdapter);
