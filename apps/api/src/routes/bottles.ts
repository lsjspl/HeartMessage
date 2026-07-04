import { Hono } from "hono";
import {
  createOk,
  DAILY_PICK_LIMIT,
  DAILY_THROW_LIMIT,
  ReplyBottleSchema,
  ThrowBottleSchema
} from "@heart-message/shared";
import type { Env } from "../env";

export const bottleRoutes = new Hono<{ Bindings: Env }>()
  .get("/quota", (context) => {
    return context.json(
      createOk({
        pickLimit: DAILY_PICK_LIMIT,
        throwLimit: DAILY_THROW_LIMIT,
        pickRemaining: DAILY_PICK_LIMIT,
        throwRemaining: DAILY_THROW_LIMIT
      })
    );
  })
  .post("/throw", async (context) => {
    const input = ThrowBottleSchema.parse(await context.req.json());

    return context.json(
      createOk({
        id: crypto.randomUUID(),
        status: "reviewing",
        expiresAt: new Date(new Date().setHours(23, 59, 59, 999)).toISOString(),
        ...input
      })
    );
  })
  .post("/pick", (context) => {
    return context.json(
      createOk({
        id: "demo-bottle",
        author: {
          nickname: "乔木",
          age: 27,
          gender: "unknown"
        },
        content:
          "如果你也刚好睡不着，可以告诉我一个最近支撑你的微小东西吗？我想收集一些不太响亮、但真的有用的答案。",
        pickedAt: new Date().toISOString()
      })
    );
  })
  .post("/:id/reply", async (context) => {
    const input = ReplyBottleSchema.parse({
      ...(await context.req.json()),
      bottleId: context.req.param("id")
    });

    return context.json(
      createOk({
        conversationId: "demo-conversation",
        bottleId: input.bottleId,
        firstMessage: input.content
      })
    );
  })
  .delete("/:id", (context) => {
    return context.json(
      createOk({
        bottleId: context.req.param("id"),
        deleted: true
      })
    );
  });
