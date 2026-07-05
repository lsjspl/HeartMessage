import { Hono } from "hono";
import { AdminLoginSchema, createOk } from "@heart-message/shared";
import type { Env } from "../env";
import { requireAdmin, type AuthVariables } from "../middleware/auth";
import { loginAdmin } from "../services/admin-auth";
import { writeOperationLog } from "../services/logs";

export const adminAuthRoutes = new Hono<{ Bindings: Env; Variables: Partial<AuthVariables> }>()
  .post("/login", async (context) => {
    const input = AdminLoginSchema.parse(await context.req.json());
    const session = await loginAdmin(context.env, input);

    await writeOperationLog(context.env, {
      actorId: `admin:${input.username}`,
      action: "admin.login",
      targetType: "admin",
      targetId: input.username,
      metadata: { result: "success" }
    });

    return context.json(createOk(session));
  })
  .use("*", requireAdmin)
  .get("/me", (context) => {
    return context.json(
      createOk({
        id: context.get("userId"),
        role: "admin"
      })
    );
  });
