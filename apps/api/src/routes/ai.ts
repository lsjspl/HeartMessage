import { Hono } from "hono";
import {
  AdminAiModelListQuerySchema,
  AdminAiProviderListQuerySchema,
  AiModelUpsertSchema,
  AiProviderUpsertSchema,
  AiPurposeBindingsSchema,
  createOk,
  SystemSettingsSchema
} from "@heart-message/shared";
import type { Env } from "../env";
import { requireAdmin, type AuthVariables } from "../middleware/auth";
import {
  deleteAiModel,
  listAiConfig,
  listAiModels,
  listAiProviderModels,
  listAiProviders,
  upsertAiModel,
  upsertAiProvider
} from "../services/ai-admin";
import { writeOperationLog } from "../services/logs";
import { getSystemSettings, saveSystemSettings } from "../services/settings";

export const aiRoutes = new Hono<{ Bindings: Env; Variables: Partial<AuthVariables> }>()
  .use("*", requireAdmin)
  .get("/config", async (context) => {
    return context.json(createOk(await listAiConfig(context.env)));
  })
  .get("/providers/:providerId/models", async (context) => {
    return context.json(createOk(await listAiProviderModels(context.env, context.req.param("providerId"))));
  })
  .get("/providers", async (context) => {
    const query = AdminAiProviderListQuerySchema.parse(context.req.query());

    return context.json(createOk(await listAiProviders(context.env, query)));
  })
  .get("/models", async (context) => {
    const query = AdminAiModelListQuerySchema.parse(context.req.query());

    return context.json(createOk(await listAiModels(context.env, query)));
  })
  .post("/providers", async (context) => {
    const input = AiProviderUpsertSchema.parse(await context.req.json());
    const id = await upsertAiProvider(context.env, input);

    await writeOperationLog(context.env, {
      actorId: context.get("userId"),
      action: input.id ? "ai.provider.update" : "ai.provider.create",
      targetType: "ai_provider",
      targetId: id,
      metadata: { name: input.name, adapterType: input.adapterType, isEnabled: input.isEnabled }
    });

    return context.json(createOk(await listAiConfig(context.env)));
  })
  .post("/models", async (context) => {
    const input = AiModelUpsertSchema.parse(await context.req.json());
    const id = await upsertAiModel(context.env, input);

    await writeOperationLog(context.env, {
      actorId: context.get("userId"),
      action: input.id ? "ai.model.update" : "ai.model.create",
      targetType: "ai_model",
      targetId: id,
      metadata: {
        providerId: input.providerId,
        purposes: input.purposes,
        isEnabled: input.isEnabled
      }
    });

    return context.json(createOk(await listAiConfig(context.env)));
  })
  .delete("/models/:modelId", async (context) => {
    const result = await deleteAiModel(context.env, context.req.param("modelId"));

    await writeOperationLog(context.env, {
      actorId: context.get("userId"),
      action: "ai.model.delete",
      targetType: "ai_model",
      targetId: result.id,
      metadata: {
        clearedPurposes: result.clearedPurposes
      }
    });

    return context.json(createOk(result));
  })
  .put("/bindings", async (context) => {
    const bindings = AiPurposeBindingsSchema.parse(await context.req.json());
    const current = await getSystemSettings(context.env);
    const settings = SystemSettingsSchema.parse({
      ...current,
      aiBindings: bindings
    });

    await saveSystemSettings(context.env, settings);
    await writeOperationLog(context.env, {
      actorId: context.get("userId"),
      action: "ai.bindings.update",
      targetType: "system_settings",
      metadata: bindings
    });

    return context.json(createOk(await listAiConfig(context.env)));
  });
