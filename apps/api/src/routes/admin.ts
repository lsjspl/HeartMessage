import { Hono } from "hono";
import {
  AdminBottleListQuerySchema,
  AdminBottleStatusUpdateSchema,
  AdminContentModerationListQuerySchema,
  AdminContentModerationStatusUpdateSchema,
  AdminOperationLogListQuerySchema,
  AdminUserListQuerySchema,
  AdminUserProfileInsightListQuerySchema,
  AdminUserStatusUpdateSchema,
  ContentSafetySettingsSchema,
  createOk,
  SensitiveConfigKeySchema,
  SensitiveConfigUpsertSchema,
  SystemSettingsSchema
} from "@heart-message/shared";
import type { Env } from "../env";
import { requireAdmin, type AuthVariables } from "../middleware/auth";
import { listAdminUsers, updateAdminUserStatus } from "../services/admin-users";
import { listAdminBottles, updateAdminBottleStatus } from "../services/bottles";
import {
  getContentModerationSettings,
  listContentModerationEvents,
  saveContentModerationSettings,
  updateContentModerationEventStatus
} from "../services/content-moderation-admin";
import { listOperationLogs, writeOperationLog } from "../services/logs";
import { getSystemSettings, saveSystemSettings } from "../services/settings";
import { listSensitiveConfigItems, saveSensitiveConfigValue } from "../services/sensitive-config";
import {
  evaluateUserProfileInsight,
  listAdminUserProfileInsights
} from "../services/user-profile-insights";

function todayStartMs() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  return start.getTime();
}

export const adminRoutes = new Hono<{ Bindings: Env; Variables: Partial<AuthVariables> }>()
  .use("*", requireAdmin)
  .get("/dashboard", async (context) => {
    const today = todayStartMs();
    const [thrown, picked, conversations, aiFilled, contentBlocked] = await Promise.all([
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
        .first<{ count: number }>(),
      context.env.DB.prepare("SELECT COUNT(*) AS count FROM operation_logs WHERE action = 'content.moderation.block' AND created_at >= ?")
        .bind(today)
        .first<{ count: number }>()
    ]);

    return context.json(
      createOk({
        thrownToday: thrown?.count ?? 0,
        pickedToday: picked?.count ?? 0,
        conversationsStarted: conversations?.count ?? 0,
        aiFilledBottles: aiFilled?.count ?? 0,
        contentBlockedToday: contentBlocked?.count ?? 0
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
        environment: settings.runtime.environment,
        corsOriginCount: settings.runtime.corsOrigins.length,
        aiFallbackEnabled: settings.aiFallbackEnabled,
        aiBatchSize: settings.aiBatchSize
      }
    });

    return context.json(createOk(settings));
  })
  .get("/settings/sensitive", async (context) => {
    return context.json(createOk(await listSensitiveConfigItems(context.env)));
  })
  .put("/settings/sensitive/:key", async (context) => {
    const pathKey = SensitiveConfigKeySchema.parse(context.req.param("key"));
    const input = SensitiveConfigUpsertSchema.parse(await context.req.json());

    if (input.key !== pathKey) {
      return context.json(
        {
          ok: false,
          error: {
            code: "SENSITIVE_CONFIG_KEY_MISMATCH",
            message: "敏感配置键不一致"
          }
        },
        400
      );
    }

    const items = await saveSensitiveConfigValue(context.env, input.key, input.value, {
      label: input.label,
      groupName: input.groupName
    });

    await writeOperationLog(context.env, {
      actorId: context.get("userId"),
      action: "settings.sensitive.update",
      targetType: "system_sensitive_config",
      targetId: input.key,
      metadata: { key: input.key, updated: true }
    });

    return context.json(createOk(items));
  })
  .get("/users", async (context) => {
    const pagination = AdminUserListQuerySchema.parse(context.req.query());

    return context.json(createOk(await listAdminUsers(context.env, pagination)));
  })
  .get("/user-profile-insights", async (context) => {
    const pagination = AdminUserProfileInsightListQuerySchema.parse(context.req.query());

    return context.json(createOk(await listAdminUserProfileInsights(context.env, pagination)));
  })
  .post("/user-profile-insights/:id/evaluate", async (context) => {
    const result = await evaluateUserProfileInsight(context.env, context.req.param("id"));

    await writeOperationLog(context.env, {
      actorId: context.get("userId"),
      action: "admin.user_profile.evaluate",
      targetType: "user",
      targetId: result.userId,
      metadata: {
        status: result.status,
        sourceMessageCount: result.sourceMessageCount,
        sourceBottleCount: result.sourceBottleCount
      }
    });

    return context.json(createOk(result));
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
    const pagination = AdminBottleListQuerySchema.parse(context.req.query());
    const bottles = await listAdminBottles(context.env, pagination);

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
  .get("/content-moderation", async (context) => {
    const query = AdminContentModerationListQuerySchema.parse(context.req.query());

    return context.json(createOk(await listContentModerationEvents(context.env, query)));
  })
  .get("/content-moderation/settings", async (context) => {
    return context.json(createOk(await getContentModerationSettings(context.env)));
  })
  .put("/content-moderation/settings", async (context) => {
    const input = ContentSafetySettingsSchema.parse(await context.req.json());
    const settings = await saveContentModerationSettings(context.env, input);

    await writeOperationLog(context.env, {
      actorId: context.get("userId"),
      action: "admin.content_moderation.settings.update",
      targetType: "content_moderation_settings",
      metadata: {
        enabled: settings.enabled,
        logAllowedFindings: settings.logAllowedFindings,
        categoryCount: Object.keys(settings.categories).length,
        updatedAt: settings.updatedAt
      }
    });

    return context.json(createOk(settings));
  })
  .patch("/content-moderation/:id/status", async (context) => {
    const input = AdminContentModerationStatusUpdateSchema.parse(await context.req.json());
    const result = await updateContentModerationEventStatus(
      context.env,
      context.req.param("id"),
      input,
      context.get("userId")
    );

    await writeOperationLog(context.env, {
      actorId: context.get("userId"),
      action: "admin.content_moderation.status.update",
      targetType: "content_moderation_event",
      targetId: result.id,
      metadata: { status: result.status }
    });

    return context.json(createOk(result));
  })
  .get("/logs", async (context) => {
    const pagination = AdminOperationLogListQuerySchema.parse(context.req.query());

    return context.json(createOk(await listOperationLogs(context.env, pagination)));
  });
