import { Hono } from "hono";
import {
  AdminBottleStatusUpdateSchema,
  AdminUserStatusUpdateSchema,
  createOk,
  SystemSettingsSchema
} from "@heart-message/shared";
import type { Env } from "../env";
import { requireAdmin, type AuthVariables } from "../middleware/auth";
import { listAdminUsers, updateAdminUserStatus } from "../services/admin-users";
import { listAdminBottles, updateAdminBottleStatus } from "../services/bottles";
import { listOperationLogs, writeOperationLog } from "../services/logs";
import { getSystemSettings, saveSystemSettings } from "../services/settings";

function todayStartMs() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  return start.getTime();
}

export const adminRoutes = new Hono<{ Bindings: Env; Variables: Partial<AuthVariables> }>()
  .use("*", requireAdmin)
  .get("/dashboard", async (context) => {
    const today = todayStartMs();
    const [thrown, picked, conversations, aiFilled] = await Promise.all([
      context.env.DB.prepare("SELECT COUNT(*) AS count FROM bottles WHERE source = 'human' AND created_at >= ?")
        .bind(today)
        .first<{ count: number }>(),
      context.env.DB.prepare("SELECT COUNT(*) AS count FROM bottle_pickups WHERE picked_at >= ?")
        .bind(today)
        .first<{ count: number }>(),
      context.env.DB.prepare("SELECT COUNT(*) AS count FROM conversations WHERE created_at >= ?")
        .bind(today)
        .first<{ count: number }>(),
      context.env.DB.prepare("SELECT COUNT(*) AS count FROM bottles WHERE source = 'ai' AND created_at >= ?")
        .bind(today)
        .first<{ count: number }>()
    ]);

    return context.json(
      createOk({
        thrownToday: thrown?.count ?? 0,
        pickedToday: picked?.count ?? 0,
        conversationsStarted: conversations?.count ?? 0,
        aiFilledBottles: aiFilled?.count ?? 0
      })
    );
  })
  .get("/settings", async (context) => {
    return context.json(createOk(await getSystemSettings(context.env)));
  })
  .put("/settings", async (context) => {
    const input = SystemSettingsSchema.parse(await context.req.json());
    const settings = await saveSystemSettings(context.env, input);

    await writeOperationLog(context.env, {
      actorId: context.get("userId"),
      action: "settings.update",
      targetType: "system_settings",
      metadata: {
        dailyPickLimit: settings.dailyPickLimit,
        dailyThrowLimit: settings.dailyThrowLimit,
        aiFallbackEnabled: settings.aiFallbackEnabled,
        aiBatchSize: settings.aiBatchSize
      }
    });

    return context.json(createOk(settings));
  })
  .get("/users", async (context) => {
    return context.json(createOk(await listAdminUsers(context.env)));
  })
  .patch("/users/:id/status", async (context) => {
    const input = AdminUserStatusUpdateSchema.parse(await context.req.json());
    const result = await updateAdminUserStatus(context.env, context.req.param("id"), input);

    await writeOperationLog(context.env, {
      actorId: context.get("userId"),
      action: "admin.user.status.update",
      targetType: "user",
      targetId: result.id,
      metadata: {
        previousStatus: result.previousStatus,
        status: result.status
      }
    });

    return context.json(createOk(result));
  })
  .get("/bottles", async (context) => {
    const bottles = await listAdminBottles(context.env);

    return context.json(createOk(bottles));
  })
  .patch("/bottles/:id/status", async (context) => {
    const input = AdminBottleStatusUpdateSchema.parse(await context.req.json());
    const result = await updateAdminBottleStatus(context.env, context.req.param("id"), input);

    await writeOperationLog(context.env, {
      actorId: context.get("userId"),
      action: "admin.bottle.status.update",
      targetType: "bottle",
      targetId: result.id,
      metadata: {
        source: result.source,
        previousStatus: result.previousStatus,
        status: result.status
      }
    });

    return context.json(createOk(result));
  })
  .get("/logs", async (context) => {
    return context.json(createOk(await listOperationLogs(context.env)));
  });
