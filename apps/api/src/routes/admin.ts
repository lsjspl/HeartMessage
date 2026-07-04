import { Hono } from "hono";
import { createOk, DAILY_PICK_LIMIT, DAILY_THROW_LIMIT } from "@heart-message/shared";
import type { Env } from "../env";

export const adminRoutes = new Hono<{ Bindings: Env }>()
  .get("/dashboard", (context) => {
    return context.json(
      createOk({
        thrownToday: 1284,
        pickedToday: 8936,
        conversationsStarted: 624,
        aiFilledBottles: 118
      })
    );
  })
  .get("/settings", (context) => {
    return context.json(
      createOk({
        dailyPickLimit: DAILY_PICK_LIMIT,
        dailyThrowLimit: DAILY_THROW_LIMIT,
        bottleExpires: "end_of_day",
        aiFallbackEnabled: true
      })
    );
  })
  .get("/users", async (context) => {
    const result = await context.env.DB.prepare(
      `SELECT
         users.id,
         users.role,
         users.status,
         users.created_at,
         user_profiles.nickname,
         user_profiles.avatar_url
       FROM users
       LEFT JOIN user_profiles ON user_profiles.user_id = users.id
       ORDER BY users.created_at DESC
       LIMIT 100`
    ).all();

    return context.json(
      createOk(result.results)
    );
  })
  .get("/bottles", (context) => {
    return context.json(createOk([]));
  })
  .get("/logs", (context) => {
    return context.json(createOk([]));
  });
