import { Hono } from "hono";
import { createOk, GoogleLoginSchema, WechatLoginSchema, type AuthProvider } from "@heart-message/shared";
import type { Env } from "../env";
import { exchangeGoogleCode, getGoogleLoginConfig, type GoogleIdentity } from "../services/google";
import { exchangeWechatCode, getWechatWebLoginConfig } from "../services/wechat";
import {
  findOrCreateUserByAuthIdentity,
  findProfileByUserId,
  mapProfile,
  mapUser,
  type AuthIdentityInput
} from "../services/users";
import { signAuthToken } from "../services/token";

function isLocalAuthRequest(urlInput: string) {
  const hostname = new URL(urlInput).hostname;
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

async function createAuthSessionResponse(
  env: Env,
  authProvider: AuthProvider,
  providerUserId: string,
  identity: AuthIdentityInput,
  extra: { openid?: string; unionid?: string } = {}
) {
  const user = await findOrCreateUserByAuthIdentity(env, identity);
  const profile = await findProfileByUserId(env, user.id);
  const token = await signAuthToken(env, {
    sub: user.id,
    role: user.role
  });

  return {
    token,
    userId: user.id,
    authProvider,
    providerUserId,
    ...extra,
    needsProfile: !profile,
    user: mapUser(user),
    profile: mapProfile(profile)
  };
}

function mapGoogleIdentity(identity: GoogleIdentity): AuthIdentityInput {
  return {
    provider: "google",
    providerUserId: identity.sub,
    email: identity.email,
    displayName: identity.displayName,
    avatarUrl: identity.avatarUrl
  };
}

export const authRoutes = new Hono<{ Bindings: Env }>()
  .get("/wechat/web-config", async (context) => {
    const config = await getWechatWebLoginConfig(context.env, {
      allowLocalRequestDevCode: isLocalAuthRequest(context.req.url)
    });

    return context.json(createOk(config));
  })
  .get("/google/config", async (context) => {
    const config = await getGoogleLoginConfig(context.env, {
      allowLocalRequestDevCode: isLocalAuthRequest(context.req.url)
    });

    return context.json(createOk(config));
  })
  .post("/wechat", async (context) => {
    const input = WechatLoginSchema.parse(await context.req.json());
    const identity = await exchangeWechatCode(context.env, input.code, input.mode, {
      allowLocalRequestDevCode: isLocalAuthRequest(context.req.url)
    });
    const session = await createAuthSessionResponse(
      context.env,
      "wechat",
      identity.openid,
      {
        provider: "wechat",
        providerUserId: identity.openid,
        wechatUnionId: identity.unionid
      },
      {
        openid: identity.openid,
        unionid: identity.unionid
      }
    );

    return context.json(createOk(session));
  })
  .post("/google", async (context) => {
    const input = GoogleLoginSchema.parse(await context.req.json());
    const identity = await exchangeGoogleCode(context.env, input.code, input.redirectUri, {
      allowLocalRequestDevCode: isLocalAuthRequest(context.req.url)
    });
    const session = await createAuthSessionResponse(
      context.env,
      "google",
      identity.sub,
      mapGoogleIdentity(identity)
    );

    return context.json(createOk(session));
  });
