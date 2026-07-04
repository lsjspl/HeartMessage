import { createMiddleware } from "hono/factory";
import type { Env } from "../env";
import { verifyAuthToken } from "../services/token";

export interface AuthVariables {
  userId?: string;
  role?: "user" | "admin";
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
      }
    }

    const demoUserId = context.req.header("x-demo-user-id");
    const demoRole = context.req.header("x-demo-role");

    if (!context.get("userId") && demoUserId) {
      context.set("userId", demoUserId);
      context.set("role", demoRole === "admin" ? "admin" : "user");
    }

    await next();
  }
);

export const requireAuth = createMiddleware<{ Bindings: Env; Variables: Partial<AuthVariables> }>(
  async (context, next) => {
    if (!context.get("userId")) {
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

    await next();
  }
);
