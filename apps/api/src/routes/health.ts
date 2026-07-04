import { Hono } from "hono";
import { createOk } from "@heart-message/shared";
import type { Env } from "../env";

export const healthRoutes = new Hono<{ Bindings: Env }>().get("/", (context) => {
  return context.json(
    createOk({
      service: "heart-message-api",
      environment: context.env.ENVIRONMENT,
      now: new Date().toISOString()
    })
  );
});
