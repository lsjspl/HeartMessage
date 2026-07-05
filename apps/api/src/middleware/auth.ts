import { createMiddleware } from "hono/factory";
import type { Env } from "../env";
import { verifyAuthToken } from "../services/token";

export interface AuthVariables {
  userId?: string;
  role?: "user" | "admin";
  authSource?: "token" | "demo";
}

export const optionalAuth = createMiddleware<{ Bindings: Env; Variables: Partial<AuthVariables> }>(
  async (context, next) => {
    const authorization = context.req.header("authorization");
    const token = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : "";

    if (token) {
      const payload = await verifyAuthToken(context.env, token);

      if (payload) {
        context.set("userId", payload.sub);
        context.set("role", payload.role);
        context.set("authSource", "token");
      }
    }

    const demoUserId = context.req.header("x-demo-user-id");
    const demoRole = context.req.header("x-demo-role");

    if (!context.get("userId") && demoUserId) {
      context.set("userId", demoUserId);
      context.set("role", demoRole === "admin" ? "admin" : "user");
      context.set("authSource", "demo");
    }

    await next();
  }
);

export const requireAuth = createMiddleware<{ Bindings: Env; Variables: Partial<AuthVariables> }>(
  async (context, next) => {
    const userId = context.get("userId");

    if (!userId) {
      return context.json(
        {
          ok: false,
          error: {
            code: "UNAUTHORIZED",
            message: "请先登录"
          }
        },
        401
      );
    }

    if (context.get("role") === "user" && context.get("authSource") === "token") {
      const user = await context.env.DB.prepare("SELECT status FROM users WHERE id = ?")
        .bind(userId)
        .first<{ status: "active" | "disabled" | "deleted" }>();

      if (!user || user.status !== "active") {
        return context.json(
          {
            ok: false,
            error: {
              code: "ACCOUNT_DISABLED",
              message: "账号已被禁用或不存在"
            }
          },
          403
        );
      }
    }

    await next();
  }
);

export const requireAdmin = createMiddleware<{ Bindings: Env; Variables: Partial<AuthVariables> }>(
  async (context, next) => {
    if (!context.get("userId")) {
      return context.json(
        {
          ok: false,
          error: {
            code: "UNAUTHORIZED",
            message: "请先登录后台"
          }
        },
        401
      );
    }

    if (context.get("role") !== "admin" || context.get("authSource") !== "token") {
      return context.json(
        {
          ok: false,
          error: {
            code: "FORBIDDEN",
            message: "没有后台访问权限"
          }
        },
        403
      );
    }

    await next();
  }
);
