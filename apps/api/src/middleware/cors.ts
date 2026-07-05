import type { Context } from "hono";
import type { Env } from "../env";

const LOCAL_ORIGIN_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function parseAllowedOrigins(value?: string) {
  return (value ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function isLocalEnvironment(env: Env) {
  return env.ENVIRONMENT === "local" || env.ENVIRONMENT === "development" || env.ENVIRONMENT === "test";
}

export function resolveCorsOrigin(origin: string, context: Context<{ Bindings: Env }>) {
  const configuredOrigins = parseAllowedOrigins(context.env.CORS_ORIGINS);

  if (configuredOrigins.length > 0) {
    return configuredOrigins.includes(origin) ? origin : null;
  }

  if (isLocalEnvironment(context.env) && LOCAL_ORIGIN_PATTERN.test(origin)) {
    return origin;
  }

  return null;
}
