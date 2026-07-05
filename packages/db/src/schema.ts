import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    wechatOpenId: text("wechat_open_id").notNull(),
    wechatUnionId: text("wechat_union_id"),
    role: text("role", { enum: ["user", "admin"] }).notNull().default("user"),
    status: text("status", { enum: ["active", "disabled", "deleted"] }).notNull().default("active"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull()
  },
  (table) => ({
    wechatOpenIdIdx: uniqueIndex("users_wechat_open_id_idx").on(table.wechatOpenId)
  })
);

export const userProfiles = sqliteTable("user_profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  nickname: text("nickname").notNull(),
  avatarKey: text("avatar_key"),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  age: integer("age"),
  gender: text("gender", { enum: ["male", "female", "unknown"] }).notNull().default("unknown"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull()
});

export const dailyQuotas = sqliteTable(
  "daily_quotas",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    quotaDate: text("quota_date").notNull(),
    pickedCount: integer("picked_count").notNull().default(0),
    thrownCount: integer("thrown_count").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull()
  },
  (table) => ({
    userDateIdx: uniqueIndex("daily_quotas_user_date_idx").on(table.userId, table.quotaDate)
  })
);

export const bottles = sqliteTable(
  "bottles",
  {
    id: text("id").primaryKey(),
    authorId: text("author_id").references(() => users.id, { onDelete: "set null" }),
    aiPersonaId: text("ai_persona_id"),
    content: text("content").notNull(),
    mediaKeys: text("media_keys", { mode: "json" }).$type<string[]>().notNull().default([]),
    isAnonymous: integer("is_anonymous", { mode: "boolean" }).notNull().default(false),
    source: text("source", { enum: ["human", "ai"] }).notNull().default("human"),
    status: text("status", {
      enum: ["draft", "reviewing", "floating", "picked", "expired", "blocked", "deleted"]
    })
      .notNull()
      .default("reviewing"),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    pickedAt: integer("picked_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull()
  },
  (table) => ({
    statusExpiresIdx: index("bottles_status_expires_idx").on(table.status, table.expiresAt),
    authorIdx: index("bottles_author_idx").on(table.authorId)
  })
);

export const bottlePickups = sqliteTable(
  "bottle_pickups",
  {
    id: text("id").primaryKey(),
    bottleId: text("bottle_id")
      .notNull()
      .references(() => bottles.id, { onDelete: "cascade" }),
    pickerId: text("picker_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status", { enum: ["active", "deleted"] }).notNull().default("active"),
    pickedAt: integer("picked_at", { mode: "timestamp_ms" }).notNull(),
    deletedAt: integer("deleted_at", { mode: "timestamp_ms" })
  },
  (table) => ({
    bottlePickerIdx: uniqueIndex("bottle_pickups_bottle_picker_idx").on(table.bottleId, table.pickerId),
    pickerStatusIdx: index("bottle_pickups_picker_status_idx").on(table.pickerId, table.status)
  })
);

export const conversations = sqliteTable(
  "conversations",
  {
    id: text("id").primaryKey(),
    bottleId: text("bottle_id")
      .notNull()
      .references(() => bottles.id, { onDelete: "cascade" }),
    pickupId: text("pickup_id")
      .notNull()
      .references(() => bottlePickups.id, { onDelete: "cascade" }),
    participantAId: text("participant_a_id").references(() => users.id, { onDelete: "set null" }),
    participantBId: text("participant_b_id").references(() => users.id, { onDelete: "set null" }),
    status: text("status", { enum: ["active", "deleted", "blocked"] }).notNull().default("active"),
    deletedByParticipantAAt: integer("deleted_by_participant_a_at", { mode: "timestamp_ms" }),
    deletedByParticipantBAt: integer("deleted_by_participant_b_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull()
  },
  (table) => ({
    pickupIdx: uniqueIndex("conversations_pickup_idx").on(table.pickupId),
    participantAIdx: index("conversations_participant_a_idx").on(table.participantAId),
    participantBIdx: index("conversations_participant_b_idx").on(table.participantBId)
  })
);

export const messages = sqliteTable(
  "messages",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderId: text("sender_id").references(() => users.id, { onDelete: "set null" }),
    senderType: text("sender_type", { enum: ["user", "ai", "system"] }).notNull(),
    content: text("content").notNull(),
    status: text("status", { enum: ["sent", "blocked", "deleted"] }).notNull().default("sent"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    readAt: integer("read_at", { mode: "timestamp_ms" })
  },
  (table) => ({
    conversationCreatedIdx: index("messages_conversation_created_idx").on(
      table.conversationId,
      table.createdAt
    )
  })
);

export const aiProviders = sqliteTable("ai_providers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  adapterType: text("adapter_type", { enum: ["openai_compatible"] }).notNull().default("openai_compatible"),
  baseUrl: text("base_url"),
  apiKeySecretName: text("api_key_secret_name").notNull(),
  isEnabled: integer("is_enabled", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull()
});

export const aiModels = sqliteTable(
  "ai_models",
  {
    id: text("id").primaryKey(),
    providerId: text("provider_id")
      .notNull()
      .references(() => aiProviders.id, { onDelete: "cascade" }),
    displayName: text("display_name").notNull(),
    modelName: text("model_name").notNull(),
    purpose: text("purpose", {
      enum: ["persona_generation", "bottle_generation", "chat_reply", "content_moderation"]
    }).notNull(),
    isEnabled: integer("is_enabled", { mode: "boolean" }).notNull().default(true),
    configJson: text("config_json", { mode: "json" }).$type<Record<string, unknown>>().notNull().default({}),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull()
  },
  (table) => ({
    purposeIdx: index("ai_models_purpose_idx").on(table.purpose, table.isEnabled)
  })
);

export const aiPersonas = sqliteTable(
  "ai_personas",
  {
    id: text("id").primaryKey(),
    displayName: text("display_name").notNull(),
    bio: text("bio").notNull(),
    age: integer("age"),
    gender: text("gender", { enum: ["male", "female", "unknown"] }).notNull().default("unknown"),
    systemPrompt: text("system_prompt").notNull(),
    modelId: text("model_id").references(() => aiModels.id, { onDelete: "set null" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull()
  },
  (table) => ({
    modelIdx: index("ai_personas_model_idx").on(table.modelId)
  })
);

export const operationLogs = sqliteTable(
  "operation_logs",
  {
    id: text("id").primaryKey(),
    actorId: text("actor_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id"),
    metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>().notNull().default({}),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull()
  },
  (table) => ({
    createdIdx: index("operation_logs_created_idx").on(table.createdAt),
    targetIdx: index("operation_logs_target_idx").on(table.targetType, table.targetId)
  })
);
