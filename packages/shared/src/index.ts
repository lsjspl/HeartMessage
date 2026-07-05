import { z } from "zod";

export const DAILY_PICK_LIMIT = 20;
export const DAILY_THROW_LIMIT = 3;

export const GenderSchema = z.enum(["male", "female", "unknown"]);
export type Gender = z.infer<typeof GenderSchema>;

export const UserStatusSchema = z.enum(["active", "disabled", "deleted"]);
export type UserStatus = z.infer<typeof UserStatusSchema>;

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
  "content_moderation"
]);
export type AiModelPurpose = z.infer<typeof AiModelPurposeSchema>;

export const AiProviderAdapterTypeSchema = z.enum(["openai_compatible"]);
export type AiProviderAdapterType = z.infer<typeof AiProviderAdapterTypeSchema>;

export const AiPurposeBindingsSchema = z.object({
  persona_generation: z.string().optional(),
  bottle_generation: z.string().optional(),
  chat_reply: z.string().optional(),
  content_moderation: z.string().optional()
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

export const WechatLoginSchema = z.object({
  code: z.string().min(1),
  redirectUri: z.string().url().optional()
});
export type WechatLoginInput = z.infer<typeof WechatLoginSchema>;

export const AuthSessionSchema = z.object({
  token: z.string(),
  userId: z.string(),
  openid: z.string(),
  unionid: z.string().optional(),
  needsProfile: z.boolean(),
  user: AuthUserSchema,
  profile: UserProfileSchema.nullable()
});
export type AuthSession = z.infer<typeof AuthSessionSchema>;

export const CurrentUserSchema = z.object({
  user: AuthUserSchema,
  profile: UserProfileSchema.nullable(),
  needsProfile: z.boolean()
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

export const AdminUserListItemSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "admin"]),
  status: UserStatusSchema,
  nickname: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  profileCompleted: z.boolean(),
  createdAt: z.string()
});
export type AdminUserListItem = z.infer<typeof AdminUserListItemSchema>;

export const AdminUserStatusUpdateSchema = z.object({
  status: z.enum(["active", "disabled"])
});
export type AdminUserStatusUpdateInput = z.infer<typeof AdminUserStatusUpdateSchema>;

export const AdminBottleStatusUpdateSchema = z.object({
  status: z.enum(["blocked", "deleted", "expired"])
});
export type AdminBottleStatusUpdateInput = z.infer<typeof AdminBottleStatusUpdateSchema>;

export const AdminLoginSchema = z.object({
  username: z.string().min(1).max(80),
  password: z.string().min(1).max(200)
});
export type AdminLoginInput = z.infer<typeof AdminLoginSchema>;

export const AdminSessionSchema = z.object({
  token: z.string(),
  name: z.string(),
  expiresAt: z.string()
});
export type AdminSession = z.infer<typeof AdminSessionSchema>;

export const SystemSettingsSchema = z.object({
  dailyPickLimit: z.number().int().min(0).max(200),
  dailyThrowLimit: z.number().int().min(0).max(50),
  bottleExpires: z.literal("end_of_day"),
  aiFallbackEnabled: z.boolean(),
  aiTrigger: z.enum(["empty_pool", "low_pool"]),
  aiBatchSize: z.number().int().min(1).max(200),
  aiBindings: AiPurposeBindingsSchema
});
export type SystemSettings = z.infer<typeof SystemSettingsSchema>;

export const AiProviderUpsertSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(80),
  adapterType: AiProviderAdapterTypeSchema.default("openai_compatible"),
  baseUrl: z.string().url().optional(),
  apiKeySecretName: z.string().min(1).max(120),
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
  apiKeySecretName: z.string(),
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
