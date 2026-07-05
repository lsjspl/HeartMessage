import { Hono } from "hono";
import {
  AdminAccountCreateSchema,
  AdminAccountListQuerySchema,
  AdminAccountPasswordResetSchema,
  AdminAccountUpdateSchema,
  createOk
} from "@heart-message/shared";
import type { Env } from "../env";
import { requireAdmin, requireSuperAdmin, type AuthVariables } from "../middleware/auth";
import {
  createAdminAccount,
  deleteAdminAccount,
  listAdminAccounts,
  resetAdminPassword,
  updateAdminAccount
} from "../services/admin-accounts";
import { writeOperationLog } from "../services/logs";

export const adminAccountRoutes = new Hono<{ Bindings: Env; Variables: Partial<AuthVariables> }>()
  .use("*", requireAdmin)
  .use("*", requireSuperAdmin)
  .get("/", async (context) => {
    const query = AdminAccountListQuerySchema.parse(context.req.query());

    return context.json(createOk(await listAdminAccounts(context.env, query)));
  })
  .post("/", async (context) => {
    const input = AdminAccountCreateSchema.parse(await context.req.json());
    const account = await createAdminAccount(context.env, input);

    await writeOperationLog(context.env, {
      actorId: context.get("userId"),
      action: "admin.account.create",
      targetType: "admin_account",
      targetId: account.id,
      metadata: {
        username: account.username,
        role: account.role,
        status: account.status
      }
    });

    return context.json(createOk(account));
  })
  .patch("/:id", async (context) => {
    const input = AdminAccountUpdateSchema.parse(await context.req.json());
    const account = await updateAdminAccount(
      context.env,
      context.get("userId"),
      context.req.param("id"),
      input
    );

    await writeOperationLog(context.env, {
      actorId: context.get("userId"),
      action: "admin.account.update",
      targetType: "admin_account",
      targetId: account.id,
      metadata: {
        role: account.role,
        status: account.status
      }
    });

    return context.json(createOk(account));
  })
  .put("/:id/password", async (context) => {
    const input = AdminAccountPasswordResetSchema.parse(await context.req.json());
    const result = await resetAdminPassword(context.env, context.req.param("id"), input);

    await writeOperationLog(context.env, {
      actorId: context.get("userId"),
      action: "admin.account.password.reset",
      targetType: "admin_account",
      targetId: result.id,
      metadata: { updated: true }
    });

    return context.json(createOk(result));
  })
  .delete("/:id", async (context) => {
    const result = await deleteAdminAccount(context.env, context.get("userId"), context.req.param("id"));

    await writeOperationLog(context.env, {
      actorId: context.get("userId"),
      action: "admin.account.delete",
      targetType: "admin_account",
      targetId: result.id,
      metadata: { deleted: true }
    });

    return context.json(createOk(result));
  });
