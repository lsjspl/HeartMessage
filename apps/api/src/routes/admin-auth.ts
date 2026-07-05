import { Hono } from "hono";
import { AdminLoginSchema, AdminPasswordChangeSchema, createOk } from "@heart-message/shared";
import type { Env } from "../env";
import { requireAdmin, type AuthVariables } from "../middleware/auth";
import { changeOwnAdminPassword } from "../services/admin-accounts";
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
  })
  .put("/password", async (context) => {
    const input = AdminPasswordChangeSchema.parse(await context.req.json());
    const result = await changeOwnAdminPassword(context.env, context.get("userId"), input);

    await writeOperationLog(context.env, {
      actorId: context.get("userId"),
      action: "admin.password.change",
      targetType: "admin_account",
      targetId: result.id,
      metadata: { updated: true }
    });

    return context.json(createOk(result));
  });
