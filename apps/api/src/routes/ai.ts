import { Hono } from "hono";
import { createOk } from "@heart-message/shared";
import type { Env } from "../env";

export const aiRoutes = new Hono<{ Bindings: Env }>()
  .get("/models", (context) => {
    return context.json(
      createOk([
        {
          id: "openai-gpt-4-1-mini",
          provider: "OpenAI",
          model: "gpt-4.1-mini",
          purpose: "chat_reply",
          enabled: true
        },
        {
          id: "deepseek-chat",
          provider: "DeepSeek",
          model: "deepseek-chat",
          purpose: "bottle_generation",
          enabled: true
        }
      ])
    );
  })
  .get("/personas", (context) => {
    return context.json(
      createOk([
        {
          id: "sea-radio",
          name: "海雾电台",
          tone: "温柔、克制、有陪伴感",
          enabled: true
        }
      ])
    );
  });
