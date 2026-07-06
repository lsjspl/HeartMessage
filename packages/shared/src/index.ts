import { z } from "zod";

export const DAILY_PICK_LIMIT = 20;
export const DAILY_THROW_LIMIT = 3;

export const GenderSchema = z.enum(["male", "female", "unknown"]);
export type Gender = z.infer<typeof GenderSchema>;

export const UserStatusSchema = z.enum(["active", "disabled", "deleted"]);
export type UserStatus = z.infer<typeof UserStatusSchema>;

export const AdminAccountRoleSchema = z.enum(["super_admin", "admin"]);
export type AdminAccountRole = z.infer<typeof AdminAccountRoleSchema>;

export const AdminAccountStatusSchema = z.enum(["active", "disabled", "deleted"]);
export type AdminAccountStatus = z.infer<typeof AdminAccountStatusSchema>;

export const BottleStatusSchema = z.enum([
  "draft",
  "reviewing",
  "floating",
  "picked",
  "expired",
  "blocked",
  "deleted"
]);
export type BottleStatus = z.infer<typeof BottleStatusSchema>;

export const ConversationStatusSchema = z.enum(["active", "deleted", "blocked"]);
export type ConversationStatus = z.infer<typeof ConversationStatusSchema>;

export const AiModelPurposeSchema = z.enum([
  "persona_generation",
  "bottle_generation",
  "chat_reply",
  "content_moderation",
  "user_profile_evaluation"
]);
export type AiModelPurpose = z.infer<typeof AiModelPurposeSchema>;

export const ContentModerationCategorySchema = z.enum(["advertisement", "sexual", "contact_info"]);
export type ContentModerationCategory = z.infer<typeof ContentModerationCategorySchema>;

export const ContentModerationSourceSchema = z.enum(["bottle_throw", "bottle_reply", "chat_message"]);
export type ContentModerationSource = z.infer<typeof ContentModerationSourceSchema>;

export const ContentModerationEventStatusSchema = z.enum(["pending", "confirmed", "dismissed"]);
export type ContentModerationEventStatus = z.infer<typeof ContentModerationEventStatusSchema>;

export const UserProfileEvaluationStatusSchema = z.enum(["pending", "completed", "failed"]);
export type UserProfileEvaluationStatus = z.infer<typeof UserProfileEvaluationStatusSchema>;

export const AiProviderAdapterTypeSchema = z.enum(["openai_compatible"]);
export type AiProviderAdapterType = z.infer<typeof AiProviderAdapterTypeSchema>;

export const AiPurposeBindingsSchema = z.object({
  persona_generation: z.string().optional(),
  bottle_generation: z.string().optional(),
  chat_reply: z.string().optional(),
  content_moderation: z.string().optional(),
  user_profile_evaluation: z.string().optional()
});
export type AiPurposeBindings = z.infer<typeof AiPurposeBindingsSchema>;

export const UserProfileSchema = z.object({
  id: z.string(),
  nickname: z.string().min(1).max(24),
  avatarUrl: z.string().url().optional(),
  bio: z.string().max(160).optional(),
  age: z.number().int().min(13).max(120).optional(),
  gender: GenderSchema.default("unknown")
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

export const AuthUserSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "admin"]),
  status: UserStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string()
});
export type AuthUser = z.infer<typeof AuthUserSchema>;

export const AuthProviderSchema = z.enum(["wechat", "google"]);
export type AuthProvider = z.infer<typeof AuthProviderSchema>;

export const AuthIdentityProfileSchema = z.object({
  provider: AuthProviderSchema,
  email: z.string().email().optional(),
  displayName: z.string().max(120).optional(),
  avatarUrl: z.string().url().optional()
});
export type AuthIdentityProfile = z.infer<typeof AuthIdentityProfileSchema>;

export const WechatLoginModeSchema = z.enum(["web_qr"]);
export type WechatLoginMode = z.infer<typeof WechatLoginModeSchema>;

export const WechatLoginSchema = z.object({
  code: z.string().min(1),
  mode: WechatLoginModeSchema.default("web_qr"),
  redirectUri: z.string().url().optional()
});
export type WechatLoginInput = z.infer<typeof WechatLoginSchema>;

export const WechatWebLoginConfigSchema = z.object({
  configured: z.boolean(),
  devLoginAllowed: z.boolean(),
  appId: z.string().optional()
});
export type WechatWebLoginConfig = z.infer<typeof WechatWebLoginConfigSchema>;

export const GoogleLoginConfigSchema = z.object({
  configured: z.boolean(),
  devLoginAllowed: z.boolean(),
  clientId: z.string().optional()
});
export type GoogleLoginConfig = z.infer<typeof GoogleLoginConfigSchema>;

export const GoogleLoginSchema = z.object({
  code: z.string().min(1),
  redirectUri: z.string().url()
});
export type GoogleLoginInput = z.infer<typeof GoogleLoginSchema>;

export const AuthSessionSchema = z.object({
  token: z.string(),
  userId: z.string(),
  authProvider: AuthProviderSchema,
  providerUserId: z.string(),
  openid: z.string().optional(),
  unionid: z.string().optional(),
  needsProfile: z.boolean(),
  user: AuthUserSchema,
  profile: UserProfileSchema.nullable(),
  authIdentity: AuthIdentityProfileSchema.optional()
});
export type AuthSession = z.infer<typeof AuthSessionSchema>;

export const CurrentUserSchema = z.object({
  user: AuthUserSchema,
  profile: UserProfileSchema.nullable(),
  needsProfile: z.boolean(),
  authIdentity: AuthIdentityProfileSchema.optional()
});
export type CurrentUser = z.infer<typeof CurrentUserSchema>;

export const ProfileUpsertSchema = z.object({
  nickname: z.string().min(1).max(24),
  avatarUrl: z.string().url().optional(),
  bio: z.string().max(160).optional(),
  age: z.number().int().min(13).max(120).optional(),
  gender: GenderSchema.default("unknown")
});
export type ProfileUpsertInput = z.infer<typeof ProfileUpsertSchema>;

export const ThrowBottleSchema = z.object({
  content: z.string().min(1).max(800),
  isAnonymous: z.boolean().default(false),
  mediaKeys: z.array(z.string()).max(9).default([])
});
export type ThrowBottleInput = z.infer<typeof ThrowBottleSchema>;

export const ReplyBottleSchema = z.object({
  bottleId: z.string().min(1),
  content: z.string().min(1).max(1000)
});
export type ReplyBottleInput = z.infer<typeof ReplyBottleSchema>;

export const SendMessageSchema = z.object({
  conversationId: z.string().min(1),
  content: z.string().min(1).max(1000)
});
export type SendMessageInput = z.infer<typeof SendMessageSchema>;

export const BottleQuotaSchema = z.object({
  quotaDate: z.string(),
  pickLimit: z.number().int(),
  throwLimit: z.number().int(),
  pickedCount: z.number().int(),
  thrownCount: z.number().int(),
  pickRemaining: z.number().int(),
  throwRemaining: z.number().int()
});
export type BottleQuota = z.infer<typeof BottleQuotaSchema>;

export const BottleAuthorSchema = z.object({
  id: z.string().optional(),
  nickname: z.string(),
  avatarUrl: z.string().url().optional(),
  bio: z.string().max(160).optional(),
  age: z.number().int().optional(),
  gender: GenderSchema
});
export type BottleAuthor = z.infer<typeof BottleAuthorSchema>;

export const BottleViewSchema = z.object({
  id: z.string(),
  pickupId: z.string().optional(),
  content: z.string(),
  isAnonymous: z.boolean(),
  source: z.enum(["human", "ai"]),
  status: BottleStatusSchema,
  author: BottleAuthorSchema,
  expiresAt: z.string(),
  pickedAt: z.string().optional(),
  createdAt: z.string()
});
export type BottleView = z.infer<typeof BottleViewSchema>;

export const ThrowBottleResponseSchema = z.object({
  bottle: BottleViewSchema,
  quota: BottleQuotaSchema
});
export type ThrowBottleResponse = z.infer<typeof ThrowBottleResponseSchema>;

export const PickBottleResponseSchema = z.object({
  bottle: BottleViewSchema,
  quota: BottleQuotaSchema
});
export type PickBottleResponse = z.infer<typeof PickBottleResponseSchema>;

export const ReplyBottleResponseSchema = z.object({
  conversationId: z.string(),
  bottleId: z.string(),
  messageId: z.string()
});
export type ReplyBottleResponse = z.infer<typeof ReplyBottleResponseSchema>;

export const ChatListItemSchema = z.object({
  id: z.string(),
  bottleId: z.string(),
  peer: BottleAuthorSchema,
  preview: z.string(),
  unreadCount: z.number().int(),
  updatedAt: z.string()
});
export type ChatListItem = z.infer<typeof ChatListItemSchema>;

export const ChatMessageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  senderId: z.string().optional(),
  senderType: z.enum(["user", "ai", "system"]),
  content: z.string(),
  isMine: z.boolean(),
  createdAt: z.string()
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ConversationMessagesSchema = z.object({
  conversationId: z.string(),
  peer: BottleAuthorSchema,
  messages: z.array(ChatMessageSchema)
});
export type ConversationMessages = z.infer<typeof ConversationMessagesSchema>;

export const AdminBottleListItemSchema = z.object({
  id: z.string(),
  authorNickname: z.string(),
  contentPreview: z.string(),
  source: z.enum(["human", "ai"]),
  status: BottleStatusSchema,
  createdAt: z.string(),
  expiresAt: z.string()
});
export type AdminBottleListItem = z.infer<typeof AdminBottleListItemSchema>;

export const AdminPaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20)
});
export type AdminPaginationQuery = z.infer<typeof AdminPaginationQuerySchema>;

export const AdminBooleanQuerySchema = z.enum(["true", "false"]);
export type AdminBooleanQuery = z.infer<typeof AdminBooleanQuerySchema>;

export const AdminUserListQuerySchema = AdminPaginationQuerySchema.extend({
  keyword: z.string().trim().max(80).optional(),
  role: z.enum(["user", "admin"]).optional(),
  status: UserStatusSchema.optional()
});
export type AdminUserListQuery = z.infer<typeof AdminUserListQuerySchema>;

export const AdminAccountListQuerySchema = AdminPaginationQuerySchema.extend({
  keyword: z.string().trim().max(80).optional(),
  role: AdminAccountRoleSchema.optional(),
  status: AdminAccountStatusSchema.optional()
});
export type AdminAccountListQuery = z.infer<typeof AdminAccountListQuerySchema>;

export const AdminUserProfileInsightListQuerySchema = AdminPaginationQuerySchema.extend({
  keyword: z.string().trim().max(80).optional(),
  status: UserProfileEvaluationStatusSchema.optional()
});
export type AdminUserProfileInsightListQuery = z.infer<typeof AdminUserProfileInsightListQuerySchema>;

export const AdminBottleListQuerySchema = AdminPaginationQuerySchema.extend({
  keyword: z.string().trim().max(80).optional(),
  source: z.enum(["human", "ai"]).optional(),
  status: BottleStatusSchema.optional()
});
export type AdminBottleListQuery = z.infer<typeof AdminBottleListQuerySchema>;

export const AdminOperationLogListQuerySchema = AdminPaginationQuerySchema.extend({
  keyword: z.string().trim().max(80).optional(),
  action: z.string().trim().max(80).optional(),
  targetType: z.string().trim().max(80).optional()
});
export type AdminOperationLogListQuery = z.infer<typeof AdminOperationLogListQuerySchema>;

export const AdminContentModerationListQuerySchema = AdminPaginationQuerySchema.extend({
  keyword: z.string().trim().max(80).optional(),
  source: ContentModerationSourceSchema.optional(),
  category: ContentModerationCategorySchema.optional(),
  status: ContentModerationEventStatusSchema.optional()
});
export type AdminContentModerationListQuery = z.infer<typeof AdminContentModerationListQuerySchema>;

export const AdminAiProviderListQuerySchema = AdminPaginationQuerySchema.extend({
  keyword: z.string().trim().max(80).optional(),
  isEnabled: AdminBooleanQuerySchema.optional()
});
export type AdminAiProviderListQuery = z.infer<typeof AdminAiProviderListQuerySchema>;

export const AdminAiModelListQuerySchema = AdminPaginationQuerySchema.extend({
  keyword: z.string().trim().max(80).optional(),
  providerId: z.string().trim().max(80).optional(),
  purpose: AiModelPurposeSchema.optional(),
  isEnabled: AdminBooleanQuerySchema.optional()
});
export type AdminAiModelListQuery = z.infer<typeof AdminAiModelListQuerySchema>;

export const PaginationMetaSchema = z.object({
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
  pageCount: z.number().int()
});
export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;

export interface PaginatedList<T> {
  items: T[];
  pagination: PaginationMeta;
}

export const AdminUserListItemSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "admin"]),
  status: UserStatusSchema,
  nickname: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  email: z.string().email().optional(),
  authProvider: AuthProviderSchema.optional(),
  authDisplayName: z.string().max(120).optional(),
  authAvatarUrl: z.string().url().optional(),
  profileCompleted: z.boolean(),
  createdAt: z.string()
});
export type AdminUserListItem = z.infer<typeof AdminUserListItemSchema>;

export const AdminUserProfileInsightItemSchema = z.object({
  userId: z.string(),
  nickname: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  status: UserProfileEvaluationStatusSchema.optional(),
  summary: z.string().optional(),
  interestTags: z.array(z.string()),
  preferredTopics: z.array(z.string()),
  avoidedTopics: z.array(z.string()),
  conversationStyle: z.string().optional(),
  emotionalNeeds: z.array(z.string()),
  preferredPersonaTraits: z.array(z.string()),
  companionExpectation: z.string().optional(),
  safetyNotes: z.string().optional(),
  sourceMessageCount: z.number().int(),
  sourceBottleCount: z.number().int(),
  modelId: z.string().optional(),
  evaluatedAt: z.string().optional(),
  updatedAt: z.string().optional(),
  lastErrorMessage: z.string().optional()
});
export type AdminUserProfileInsightItem = z.infer<typeof AdminUserProfileInsightItemSchema>;

export const AdminUserStatusUpdateSchema = z.object({
  status: z.enum(["active", "disabled"])
});
export type AdminUserStatusUpdateInput = z.infer<typeof AdminUserStatusUpdateSchema>;

export const AdminBottleStatusUpdateSchema = z.object({
  status: z.enum(["blocked", "deleted", "expired", "restore"])
});
export type AdminBottleStatusUpdateInput = z.infer<typeof AdminBottleStatusUpdateSchema>;

export const AdminContentModerationStatusUpdateSchema = z.object({
  status: ContentModerationEventStatusSchema,
  note: z.string().trim().max(300).optional()
});
export type AdminContentModerationStatusUpdateInput = z.infer<
  typeof AdminContentModerationStatusUpdateSchema
>;

export const AdminAccountCreateSchema = z.object({
  username: z.string().min(3).max(80).regex(/^[a-zA-Z0-9_.-]+$/),
  name: z.string().min(1).max(80),
  role: AdminAccountRoleSchema.default("admin"),
  password: z.string().min(8).max(200),
  status: AdminAccountStatusSchema.default("active")
});
export type AdminAccountCreateInput = z.infer<typeof AdminAccountCreateSchema>;

export const AdminAccountUpdateSchema = z.object({
  name: z.string().min(1).max(80),
  role: AdminAccountRoleSchema,
  status: AdminAccountStatusSchema
});
export type AdminAccountUpdateInput = z.infer<typeof AdminAccountUpdateSchema>;

export const AdminAccountPasswordResetSchema = z.object({
  password: z.string().min(8).max(200)
});
export type AdminAccountPasswordResetInput = z.infer<typeof AdminAccountPasswordResetSchema>;

export const AdminPasswordChangeSchema = z.object({
  oldPassword: z.string().min(1).max(200),
  newPassword: z.string().min(8).max(200)
});
export type AdminPasswordChangeInput = z.infer<typeof AdminPasswordChangeSchema>;

export const AdminAccountListItemSchema = z.object({
  id: z.string(),
  username: z.string(),
  name: z.string(),
  role: AdminAccountRoleSchema,
  status: AdminAccountStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string()
});
export type AdminAccountListItem = z.infer<typeof AdminAccountListItemSchema>;

export const AdminLoginSchema = z.object({
  username: z.string().min(1).max(80),
  password: z.string().min(1).max(200)
});
export type AdminLoginInput = z.infer<typeof AdminLoginSchema>;

export const AdminSessionSchema = z.object({
  token: z.string(),
  accountId: z.string().optional(),
  name: z.string(),
  adminRole: AdminAccountRoleSchema.optional(),
  expiresAt: z.string()
});
export type AdminSession = z.infer<typeof AdminSessionSchema>;

export const UserProfileEvaluationSettingsSchema = z.object({
  enabled: z.boolean(),
  intervalHours: z.number().int().min(1).max(720),
  batchSize: z.number().int().min(1).max(100)
});
export type UserProfileEvaluationSettings = z.infer<typeof UserProfileEvaluationSettingsSchema>;

export const RuntimeEnvironmentSchema = z.enum(["local", "development", "test", "production"]);
export type RuntimeEnvironment = z.infer<typeof RuntimeEnvironmentSchema>;

export const SystemRuntimeSettingsSchema = z.object({
  environment: RuntimeEnvironmentSchema,
  corsOrigins: z.array(z.union([z.literal("*"), z.string().url()])).max(50)
});
export type SystemRuntimeSettings = z.infer<typeof SystemRuntimeSettingsSchema>;

export const SensitiveConfigKeySchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-zA-Z0-9_.-]+$/)
  .refine((value) => !value.startsWith("sk-"), "敏感配置键不能是 API Key 明文");
export type SensitiveConfigKey = z.infer<typeof SensitiveConfigKeySchema>;

export const SensitiveConfigSourceSchema = z.enum(["custom", "local_default", "missing"]);
export type SensitiveConfigSource = z.infer<typeof SensitiveConfigSourceSchema>;

export const SensitiveConfigItemSchema = z.object({
  key: SensitiveConfigKeySchema,
  label: z.string(),
  groupName: z.string(),
  configured: z.boolean(),
  source: SensitiveConfigSourceSchema,
  valuePreview: z.string().optional(),
  updatedAt: z.string().optional()
});
export type SensitiveConfigItem = z.infer<typeof SensitiveConfigItemSchema>;

export const SensitiveConfigUpsertSchema = z.object({
  key: SensitiveConfigKeySchema,
  label: z.string().trim().min(1).max(120).optional(),
  groupName: z.string().trim().min(1).max(80).optional(),
  value: z.string().min(1).max(4000)
});
export type SensitiveConfigUpsertInput = z.infer<typeof SensitiveConfigUpsertSchema>;

export const SystemSettingsSchema = z.object({
  runtime: SystemRuntimeSettingsSchema,
  dailyPickLimit: z.number().int().min(0).max(200),
  dailyThrowLimit: z.number().int().min(0).max(50),
  bottleExpires: z.literal("end_of_day"),
  aiFallbackEnabled: z.boolean(),
  aiTrigger: z.enum(["empty_pool", "low_pool"]),
  aiBatchSize: z.number().int().min(1).max(200),
  aiBindings: AiPurposeBindingsSchema,
  userProfileEvaluation: UserProfileEvaluationSettingsSchema
});
export type SystemSettings = z.infer<typeof SystemSettingsSchema>;

export const AiProviderUpsertSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(80),
  adapterType: AiProviderAdapterTypeSchema.default("openai_compatible"),
  baseUrl: z.string().url().optional(),
  apiKeySecretName: SensitiveConfigKeySchema.optional(),
  apiKey: z.string().min(1).max(4000).optional(),
  isEnabled: z.boolean().default(true)
});
export type AiProviderUpsertInput = z.infer<typeof AiProviderUpsertSchema>;

export const AiModelUpsertSchema = z.object({
  id: z.string().optional(),
  providerId: z.string().min(1),
  displayName: z.string().min(1).max(120),
  modelName: z.string().min(1).max(160),
  purpose: AiModelPurposeSchema,
  isEnabled: z.boolean().default(true),
  configJson: z.record(z.string(), z.unknown()).default({})
});
export type AiModelUpsertInput = z.infer<typeof AiModelUpsertSchema>;

export const AdminAiProviderSchema = z.object({
  id: z.string(),
  name: z.string(),
  adapterType: AiProviderAdapterTypeSchema,
  baseUrl: z.string().optional(),
  apiKeySecretName: SensitiveConfigKeySchema.optional(),
  apiKeyConfigured: z.boolean(),
  isEnabled: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type AdminAiProvider = z.infer<typeof AdminAiProviderSchema>;

export const AdminAiModelSchema = z.object({
  id: z.string(),
  providerId: z.string(),
  providerName: z.string(),
  displayName: z.string(),
  modelName: z.string(),
  purpose: AiModelPurposeSchema,
  isEnabled: z.boolean(),
  configJson: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type AdminAiModel = z.infer<typeof AdminAiModelSchema>;

export const AdminAiProviderModelOptionSchema = z.object({
  id: z.string(),
  displayName: z.string().optional(),
  owner: z.string().optional()
});
export type AdminAiProviderModelOption = z.infer<typeof AdminAiProviderModelOptionSchema>;

export const AdminAiProviderModelsSchema = z.object({
  providerId: z.string(),
  providerName: z.string(),
  models: z.array(AdminAiProviderModelOptionSchema)
});
export type AdminAiProviderModels = z.infer<typeof AdminAiProviderModelsSchema>;

export const AdminAiConfigSchema = z.object({
  providers: z.array(AdminAiProviderSchema),
  models: z.array(AdminAiModelSchema),
  bindings: AiPurposeBindingsSchema
});
export type AdminAiConfig = z.infer<typeof AdminAiConfigSchema>;

export const OperationLogItemSchema = z.object({
  id: z.string(),
  actorId: z.string().optional(),
  action: z.string(),
  targetType: z.string(),
  targetId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()),
  createdAt: z.string()
});
export type OperationLogItem = z.infer<typeof OperationLogItemSchema>;

export const AdminContentModerationItemSchema = z.object({
  id: z.string(),
  userId: z.string(),
  nickname: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  source: ContentModerationSourceSchema,
  targetId: z.string().optional(),
  categories: z.array(ContentModerationCategorySchema),
  reason: z.string(),
  contentPreview: z.string(),
  contentLength: z.number().int(),
  modelId: z.string().optional(),
  status: ContentModerationEventStatusSchema,
  reviewerId: z.string().optional(),
  reviewNote: z.string().optional(),
  reviewedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type AdminContentModerationItem = z.infer<typeof AdminContentModerationItemSchema>;

export const AvatarUploadRequestSchema = z.object({
  fileName: z.string().min(1).max(120),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"])
});
export type AvatarUploadRequest = z.infer<typeof AvatarUploadRequestSchema>;

export const AvatarUploadTicketSchema = z.object({
  objectKey: z.string(),
  uploadUrl: z.string(),
  publicUrl: z.string()
});
export type AvatarUploadTicket = z.infer<typeof AvatarUploadTicketSchema>;

export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string()
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

export type ApiResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: ApiError;
    };

export const createOk = <T>(data: T): ApiResult<T> => ({
  ok: true,
  data
});

export const createError = (code: string, message: string): ApiResult<never> => ({
  ok: false,
  error: { code, message }
});
