import { Hono } from "hono";
import type { Env } from "../env";

export const mediaRoutes = new Hono<{ Bindings: Env }>().get("/*", async (context) => {
  const objectKey = context.req.path.replace(/^\/media\//, "");
  const object = await context.env.MEDIA_BUCKET.get(objectKey);

  if (!object) {
    return context.json(
      {
        ok: false,
        error: {
          code: "MEDIA_NOT_FOUND",
          message: "媒体不存在"
        }
      },
      404
    );
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");

  return new Response(object.body, {
    headers
  });
});
