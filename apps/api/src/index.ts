import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { toErrorResponse } from "./middleware/error-handler";
import { optionalAuth } from "./middleware/auth";
import { adminRoutes } from "./routes/admin";
import { aiRoutes } from "./routes/ai";
import { authRoutes } from "./routes/auth";
import { bottleRoutes } from "./routes/bottles";
import { chatRoutes } from "./routes/chats";
import { healthRoutes } from "./routes/health";
import { meRoutes } from "./routes/me";
import { uploadRoutes } from "./routes/uploads";
import type { Env } from "./env";
import type { AuthVariables } from "./middleware/auth";

const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: "*",
    allowHeaders: ["content-type", "authorization", "x-demo-user-id", "x-demo-role"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
  })
);
app.use("*", optionalAuth);

app.route("/health", healthRoutes);
app.route("/v1/auth", authRoutes);
app.route("/v1/me", meRoutes);
app.route("/v1/uploads", uploadRoutes);
app.route("/v1/bottles", bottleRoutes);
app.route("/v1/chats", chatRoutes);
app.route("/admin", adminRoutes);
app.route("/admin/ai", aiRoutes);

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
    response.status === 422 ||
    response.status === 429
      ? response.status
      : 500;

  return context.json(response.body, status);
});

export default app;
