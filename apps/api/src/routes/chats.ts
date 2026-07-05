import { Hono } from "hono";
import { createOk, SendMessageSchema } from "@heart-message/shared";
import type { Env } from "../env";
import { requireAuth, type AuthVariables } from "../middleware/auth";
import { deleteConversation, getConversationMessages, listChats, sendChatMessage } from "../services/chats";

export const chatRoutes = new Hono<{ Bindings: Env; Variables: Partial<AuthVariables> }>()
  .use("*", requireAuth)
  .get("/", async (context) => {
    const userId = context.get("userId")!;
    const chats = await listChats(context.env, userId);

    return context.json(createOk(chats));
  })
  .get("/:id/messages", async (context) => {
    const userId = context.get("userId")!;
    const messages = await getConversationMessages(context.env, userId, context.req.param("id"));

    return context.json(createOk(messages));
  })
  .post("/:id/messages", async (context) => {
    const userId = context.get("userId")!;
    const input = SendMessageSchema.parse({
      ...(await context.req.json()),
      conversationId: context.req.param("id")
    });
    const message = await sendChatMessage(context.env, userId, input);

    return context.json(createOk(message));
  })
  .delete("/:id", async (context) => {
    const userId = context.get("userId")!;
    const result = await deleteConversation(context.env, userId, context.req.param("id"));

    return context.json(createOk(result));
  });
