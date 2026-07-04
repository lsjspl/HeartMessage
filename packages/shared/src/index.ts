import { z } from "zod";

export const DAILY_PICK_LIMIT = 20;
export const DAILY_THROW_LIMIT = 3;

export const GenderSchema = z.enum(["male", "female", "unknown"]);
export type Gender = z.infer<typeof GenderSchema>;

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
  status: z.enum(["active", "disabled", "deleted"]),
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
