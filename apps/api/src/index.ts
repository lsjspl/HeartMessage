import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { toErrorResponse } from "./middleware/error-handler";
import { optionalAuth } from "./middleware/auth";
import { resolveCorsOrigin } from "./middleware/cors";
import { adminAccountRoutes } from "./routes/admin-accounts";
import { adminAuthRoutes } from "./routes/admin-auth";
import { adminRoutes } from "./routes/admin";
import { aiRoutes } from "./routes/ai";
import { authRoutes } from "./routes/auth";
import { bottleRoutes } from "./routes/bottles";
import { chatRoutes } from "./routes/chats";
import { healthRoutes } from "./routes/health";
import { mediaRoutes } from "./routes/media";
import { meRoutes } from "./routes/me";
import { uploadRoutes } from "./routes/uploads";
import { runDueUserProfileEvaluations } from "./services/user-profile-insights";
import type { Env } from "./env";
import type { AuthVariables } from "./middleware/auth";

const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: resolveCorsOrigin,
    allowHeaders: ["content-type", "authorization", "x-demo-user-id", "x-demo-role"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
  })
);
app.use("*", optionalAuth);

app.route("/health", healthRoutes);
app.route("/media", mediaRoutes);
app.route("/v1/auth", authRoutes);
app.route("/v1/me", meRoutes);
app.route("/v1/uploads", uploadRoutes);
app.route("/v1/bottles", bottleRoutes);
app.route("/v1/chats", chatRoutes);
app.route("/admin/auth", adminAuthRoutes);
app.route("/admin/accounts", adminAccountRoutes);
app.route("/admin/ai", aiRoutes);
app.route("/admin", adminRoutes);

app.notFound((context) => {
  return context.json(
    {
      ok: false,
      error: {
        code: "NOT_FOUND",
        message: "Route not found"
      }
    },
    404
  );
});

app.onError((error, context) => {
  const response = toErrorResponse(error);
  const status =
    response.status === 400 ||
    response.status === 401 ||
    response.status === 403 ||
    response.status === 404 ||
    response.status === 409 ||
    response.status === 413 ||
    response.status === 422 ||
    response.status === 429 ||
    response.status === 502 ||
    response.status === 503
      ? response.status
      : 500;

  return context.json(response.body, status);
});

export default {
  fetch(request, env, executionContext) {
    return app.fetch(request, env, executionContext);
  },
  scheduled(_controller, env, executionContext) {
    executionContext.waitUntil(runDueUserProfileEvaluations(env));
  }
} satisfies ExportedHandler<Env>;
