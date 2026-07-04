import { Hono } from "hono";
import { createOk, ProfileUpsertSchema } from "@heart-message/shared";
import type { Env } from "../env";
import type { AuthVariables } from "../middleware/auth";
import { requireAuth } from "../middleware/auth";
import { getCurrentUser, mapProfile, upsertProfile } from "../services/users";

export const meRoutes = new Hono<{ Bindings: Env; Variables: AuthVariables }>()
  .use("*", requireAuth)
  .get("/", async (context) => {
    const userId = context.get("userId")!;
    return context.json(createOk(await getCurrentUser(context.env, userId)));
  })
  .put("/profile", async (context) => {
    const userId = context.get("userId")!;
    const input = ProfileUpsertSchema.parse(await context.req.json());
    const profile = await upsertProfile(context.env, userId, input);

    return context.json(createOk(mapProfile(profile)));
  });
