import type { AiModelPurpose } from "@heart-message/shared";

export interface AiModelConfig {
  provider: string;
  model: string;
  purpose: AiModelPurpose;
  baseUrl?: string;
  apiKey?: string;
  options?: Record<string, unknown>;
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
  generateText(
    config: AiModelConfig,
    messages: AiMessage[],
    options?: AiGenerateOptions
  ): Promise<AiGenerateResult>;
}

const adapters = new Map<string, AiProviderAdapter>();

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
  const adapter = getAiProvider(config.provider);

  if (!adapter) {
    throw new Error(`AI provider is not registered: ${config.provider}`);
  }

  return adapter.generateText(config, messages, options);
}
