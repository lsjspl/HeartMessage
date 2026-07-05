import { Hono } from "hono";
import { AvatarUploadRequestSchema, createOk } from "@heart-message/shared";
import { AppError } from "../errors";
import type { Env } from "../env";
import type { AuthVariables } from "../middleware/auth";
import { requireAuth } from "../middleware/auth";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

const extensionByContentType = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
} as const;

function getPublicUrl(context: { req: { url: string } }, objectKey: string) {
  const url = new URL(context.req.url);

  return `${url.origin}/media/${objectKey}`;
}

function assertAvatarKeyForUser(objectKey: string, userId: string) {
  if (!objectKey.startsWith(`avatars/${userId}/`)) {
    throw new AppError(403, "AVATAR_KEY_FORBIDDEN", "不能上传到其他用户的头像路径");
  }
}

function assertAvatarContentType(contentType: string) {
  if (!(contentType in extensionByContentType)) {
    throw new AppError(400, "INVALID_AVATAR_TYPE", "头像只支持 JPG、PNG 或 WebP");
  }
}

async function readMultipartFile(request: Request) {
  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    throw new AppError(400, "AVATAR_FILE_REQUIRED", "缺少头像文件");
  }

  return file;
}

export const uploadRoutes = new Hono<{ Bindings: Env; Variables: AuthVariables }>()
  .use("*", requireAuth)
  .post("/avatar", async (context) => {
    const userId = context.get("userId")!;
    const input = AvatarUploadRequestSchema.parse(await context.req.json());
    assertAvatarContentType(input.contentType);
    const extension = extensionByContentType[input.contentType];
    const objectKey = `avatars/${userId}/${crypto.randomUUID()}.${extension}`;

    return context.json(
      createOk({
        objectKey,
        uploadUrl: `/v1/uploads/avatar/${encodeURIComponent(objectKey)}`,
        publicUrl: getPublicUrl(context, objectKey),
        fileName: input.fileName
      })
    );
  })
  .post("/avatar/:objectKey", async (context) => {
    const userId = context.get("userId")!;
    const objectKey = decodeURIComponent(context.req.param("objectKey"));
    assertAvatarKeyForUser(objectKey, userId);

    const file = await readMultipartFile(context.req.raw);
    assertAvatarContentType(file.type);

    if (file.size > MAX_AVATAR_BYTES) {
      throw new AppError(413, "AVATAR_TOO_LARGE", "头像不能超过 5MB");
    }

    await context.env.MEDIA_BUCKET.put(objectKey, await file.arrayBuffer(), {
      httpMetadata: {
        contentType: file.type
      },
      customMetadata: {
        ownerId: userId,
        originalName: file.name
      }
    });

    return context.json(
      createOk({
        objectKey,
        uploadUrl: `/v1/uploads/avatar/${encodeURIComponent(objectKey)}`,
        publicUrl: getPublicUrl(context, objectKey)
      })
    );
  });
