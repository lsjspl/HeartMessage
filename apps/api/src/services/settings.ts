import {
  DAILY_PICK_LIMIT,
  DAILY_THROW_LIMIT,
  DEFAULT_CONTENT_SAFETY_SETTINGS,
  ContentSafetySettingsSchema,
  SystemSettingsSchema,
  type ContentSafetyCategoryPolicies,
  type ContentSafetyCategoryPolicyOverrides,
  type ContentSafetySettings,
  type ContentModerationCategory,
  type ContentModerationSource,
  type SystemSettings
} from "@heart-message/shared";
import type { Env } from "../env";

const SETTINGS_KEY = "system-settings";
const CONTENT_SAFETY_CATEGORIES: ContentModerationCategory[] = [
  "contact_info",
  "advertisement",
  "sexual",
  "abuse",
  "illegal"
];
const CONTENT_SAFETY_SOURCES: ContentModerationSource[] = ["bottle_throw", "bottle_reply", "chat_message"];

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  runtime: {
    environment: "production",
    corsOrigins: ["*"]
  },
  dailyPickLimit: DAILY_PICK_LIMIT,
  dailyThrowLimit: DAILY_THROW_LIMIT,
  bottleExpires: "end_of_day",
  aiFallbackEnabled: true,
  aiTrigger: "empty_pool",
  aiBatchSize: 20,
  aiBindings: {},
  userProfileEvaluation: {
    enabled: true,
    intervalHours: 24,
    batchSize: 20
  },
  contentSafety: DEFAULT_CONTENT_SAFETY_SETTINGS
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function mergeCategoryPolicies(input: unknown): ContentSafetyCategoryPolicies {
  const inputPolicies = asRecord(input);
  const categories = {} as ContentSafetyCategoryPolicies;

  for (const category of CONTENT_SAFETY_CATEGORIES) {
    categories[category] = {
      ...DEFAULT_CONTENT_SAFETY_SETTINGS.categories[category],
      ...asRecord(inputPolicies[category])
    };
  }

  return categories;
}

function mergeSourceOverrides(input: unknown): Record<ContentModerationSource, ContentSafetyCategoryPolicyOverrides> {
  const inputOverrides = asRecord(input);
  const sourceOverrides = {} as Record<ContentModerationSource, ContentSafetyCategoryPolicyOverrides>;

  for (const source of CONTENT_SAFETY_SOURCES) {
    const defaultSource = asRecord(DEFAULT_CONTENT_SAFETY_SETTINGS.sourceOverrides[source]);
    const inputSource = asRecord(inputOverrides[source]);
    const mergedSource = {} as ContentSafetyCategoryPolicyOverrides;

    for (const category of CONTENT_SAFETY_CATEGORIES) {
      const mergedPolicy = {
        ...asRecord(defaultSource[category]),
        ...asRecord(inputSource[category])
      };

      if (Object.keys(mergedPolicy).length > 0) {
        mergedSource[category] = mergedPolicy;
      }
    }

    sourceOverrides[source] = mergedSource;
  }

  return sourceOverrides;
}

export function normalizeContentSafetySettings(input: unknown): ContentSafetySettings {
  const draft = asRecord(input);

  return ContentSafetySettingsSchema.parse({
    ...DEFAULT_CONTENT_SAFETY_SETTINGS,
    ...draft,
    categories: mergeCategoryPolicies(draft.categories),
    sourceOverrides: mergeSourceOverrides(draft.sourceOverrides)
  });
}

export async function getSystemSettings(env: Env): Promise<SystemSettings> {
  const stored = await env.DB.prepare("SELECT value_json FROM system_settings WHERE key = ?")
    .bind(SETTINGS_KEY)
    .first<{ value_json: string }>();

  if (!stored) {
    await saveSystemSettings(env, DEFAULT_SYSTEM_SETTINGS);
    return DEFAULT_SYSTEM_SETTINGS;
  }

  const parsed = JSON.parse(stored.value_json) as Partial<SystemSettings>;

  return SystemSettingsSchema.parse({
    ...DEFAULT_SYSTEM_SETTINGS,
    ...parsed,
    runtime: {
      ...DEFAULT_SYSTEM_SETTINGS.runtime,
      ...(parsed.runtime ?? {})
    },
    aiBindings: {
      ...DEFAULT_SYSTEM_SETTINGS.aiBindings,
      ...(parsed.aiBindings ?? {})
    },
    userProfileEvaluation: {
      ...DEFAULT_SYSTEM_SETTINGS.userProfileEvaluation,
      ...(parsed.userProfileEvaluation ?? {})
    },
    contentSafety: normalizeContentSafetySettings(parsed.contentSafety)
  });
}

export async function saveSystemSettings(env: Env, input: SystemSettings) {
  const settings = SystemSettingsSchema.parse(input);
  const now = Date.now();

  await env.DB.prepare(
    `INSERT INTO system_settings (key, value_json, created_at, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at`
  )
    .bind(SETTINGS_KEY, JSON.stringify(settings), now, now)
    .run();

  return settings;
}
