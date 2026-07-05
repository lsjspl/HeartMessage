import { Hono } from "hono";
import { createOk, ReplyBottleSchema, ThrowBottleSchema } from "@heart-message/shared";
import type { Env } from "../env";
import { requireAuth, type AuthVariables } from "../middleware/auth";
import {
  deletePickedBottle,
  getBottleForUser,
  getBottleQuotaForUser,
  pickBottle,
  replyToBottle,
  throwBottle
} from "../services/bottles";

export const bottleRoutes = new Hono<{ Bindings: Env; Variables: Partial<AuthVariables> }>()
  .use("*", requireAuth)
  .get("/quota", async (context) => {
    const userId = context.get("userId")!;
    const quota = await getBottleQuotaForUser(context.env, userId);

    return context.json(createOk(quota));
  })
  .post("/throw", async (context) => {
    const userId = context.get("userId")!;
    const input = ThrowBottleSchema.parse(await context.req.json());
    const result = await throwBottle(context.env, userId, input);

    return context.json(createOk(result));
  })
  .post("/pick", async (context) => {
    const userId = context.get("userId")!;
    const result = await pickBottle(context.env, userId);

    return context.json(createOk(result));
  })
  .get("/:id", async (context) => {
    const userId = context.get("userId")!;
    const bottle = await getBottleForUser(context.env, userId, context.req.param("id"));

    return context.json(createOk(bottle));
  })
  .post("/:id/reply", async (context) => {
    const userId = context.get("userId")!;
    const input = ReplyBottleSchema.parse({
      ...(await context.req.json()),
      bottleId: context.req.param("id")
    });
    const result = await replyToBottle(context.env, userId, input);

    return context.json(createOk(result));
  })
  .delete("/:id", async (context) => {
    const userId = context.get("userId")!;
    const result = await deletePickedBottle(context.env, userId, context.req.param("id"));

    return context.json(createOk(result));
  });
