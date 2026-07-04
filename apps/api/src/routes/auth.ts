import { Hono } from "hono";
import { createOk, WechatLoginSchema } from "@heart-message/shared";
import type { Env } from "../env";
import { exchangeWechatCode } from "../services/wechat";
import { createUserByWechat, findProfileByUserId, findUserByWechatOpenId, mapProfile, mapUser } from "../services/users";
import { signAuthToken } from "../services/token";

export const authRoutes = new Hono<{ Bindings: Env }>()
  .post("/wechat", async (context) => {
    const input = WechatLoginSchema.parse(await context.req.json());
    const identity = await exchangeWechatCode(context.env, input.code);
    const existingUser = await findUserByWechatOpenId(context.env, identity.openid);
    const user = existingUser ?? (await createUserByWechat(context.env, identity.openid, identity.unionid));
    const profile = await findProfileByUserId(context.env, user.id);
    const token = await signAuthToken(context.env, {
      sub: user.id,
      role: user.role
    });

    return context.json(
      createOk({
        token,
        userId: user.id,
        openid: identity.openid,
        unionid: identity.unionid,
        needsProfile: !profile,
        user: mapUser(user),
        profile: mapProfile(profile)
      })
    );
  });
