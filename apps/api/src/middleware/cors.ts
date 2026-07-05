import type { Context } from "hono";
import type { Env } from "../env";
import { getSystemSettings } from "../services/settings";

const LOCAL_ORIGIN_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function isLocalEnvironment(environment: string) {
  return environment === "local" || environment === "development" || environment === "test";
}

export async function resolveCorsOrigin(origin: string, context: Context<{ Bindings: Env }>) {
  const settings = await getSystemSettings(context.env);
  const configuredOrigins = settings.runtime.corsOrigins;

  if (configuredOrigins.includes("*")) {
    return origin;
  }

  if (configuredOrigins.length > 0) {
    return configuredOrigins.includes(origin) ? origin : null;
  }

  if (isLocalEnvironment(settings.runtime.environment) && LOCAL_ORIGIN_PATTERN.test(origin)) {
    return origin;
  }

  return null;
}
