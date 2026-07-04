import { Hono } from "hono";
import { createOk, SendMessageSchema } from "@heart-message/shared";
import type { Env } from "../env";

export const chatRoutes = new Hono<{ Bindings: Env }>()
  .get("/", (context) => {
    return context.json(
      createOk([
        {
          id: "demo-conversation",
          nickname: "乔木",
          preview: "风这个答案好自由。",
          unreadCount: 2,
          updatedAt: new Date().toISOString()
        }
      ])
    );
  })
  .get("/:id/messages", (context) => {
    return context.json(
      createOk({
        conversationId: context.req.param("id"),
        messages: [
          {
            id: "m1",
            senderType: "user",
            content: "你说的微小东西，我最近想到的是便利店门口的热豆浆。",
            createdAt: new Date().toISOString()
          },
          {
            id: "m2",
            senderType: "user",
            content: "这很具体，也很温暖。我最近是下班路上的风。",
            createdAt: new Date().toISOString()
          }
        ]
      })
    );
  })
  .post("/:id/messages", async (context) => {
    const input = SendMessageSchema.parse({
      ...(await context.req.json()),
      conversationId: context.req.param("id")
    });

    return context.json(
      createOk({
        id: crypto.randomUUID(),
        conversationId: input.conversationId,
        content: input.content,
        createdAt: new Date().toISOString()
      })
    );
  })
  .delete("/:id", (context) => {
    return context.json(
      createOk({
        conversationId: context.req.param("id"),
        deleted: true
      })
    );
  });
