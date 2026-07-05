import { Hono } from "hono";
import { createOk } from "@heart-message/shared";
import type { Env } from "../env";
import { getSystemSettings } from "../services/settings";

export const healthRoutes = new Hono<{ Bindings: Env }>().get("/", async (context) => {
  const settings = await getSystemSettings(context.env);

  return context.json(
    createOk({
      service: "heart-message-api",
      environment: settings.runtime.environment,
      now: new Date().toISOString()
    })
  );
});
