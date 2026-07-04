import { Hono } from "hono";
import { AvatarUploadRequestSchema, createOk } from "@heart-message/shared";
import type { Env } from "../env";
import type { AuthVariables } from "../middleware/auth";
import { requireAuth } from "../middleware/auth";

const extensionByContentType = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
} as const;

export const uploadRoutes = new Hono<{ Bindings: Env; Variables: AuthVariables }>()
  .use("*", requireAuth)
  .post("/avatar", async (context) => {
    const userId = context.get("userId")!;
    const input = AvatarUploadRequestSchema.parse(await context.req.json());
    const extension = extensionByContentType[input.contentType];
    const objectKey = `avatars/${userId}/${crypto.randomUUID()}.${extension}`;

    return context.json(
      createOk({
        objectKey,
        uploadUrl: `/v1/uploads/avatar/${encodeURIComponent(objectKey)}`,
        publicUrl: `/media/${objectKey}`,
        fileName: input.fileName
      })
    );
  });
