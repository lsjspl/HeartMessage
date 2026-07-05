import type { Env } from "../env";
import { AppError } from "../errors";

export interface WechatIdentity {
  openid: string;
  unionid?: string;
}

interface WechatOauthResponse {
  openid?: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
}

function createDevIdentity(code: string): WechatIdentity {
  return {
    openid: `dev-openid-${code.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48) || "local"}`
  };
}

function isLocalEnvironment(env: Env) {
  return env.ENVIRONMENT === "local" || env.ENVIRONMENT === "development" || env.ENVIRONMENT === "test";
}

export async function exchangeWechatCode(env: Env, code: string): Promise<WechatIdentity> {
  const isDevCode = code.startsWith("dev-");
  const hasWechatConfig = Boolean(env.WECHAT_APP_ID && env.WECHAT_APP_SECRET);

  if (isDevCode && !isLocalEnvironment(env)) {
    throw new AppError(403, "DEV_WECHAT_CODE_FORBIDDEN", "生产环境不能使用开发登录 code");
  }

  if (isLocalEnvironment(env) && (isDevCode || !hasWechatConfig)) {
    return createDevIdentity(code);
  }

  if (!hasWechatConfig) {
    throw new AppError(500, "WECHAT_NOT_CONFIGURED", "微信登录配置未完成");
  }

  const url = new URL("https://api.weixin.qq.com/sns/oauth2/access_token");
  url.searchParams.set("appid", env.WECHAT_APP_ID!);
  url.searchParams.set("secret", env.WECHAT_APP_SECRET!);
  url.searchParams.set("code", code);
  url.searchParams.set("grant_type", "authorization_code");

  const response = await fetch(url);
  const data = (await response.json()) as WechatOauthResponse;

  if (!response.ok || !data.openid) {
    throw new AppError(502, "WECHAT_OAUTH_FAILED", data.errmsg || "微信授权失败");
  }

  return {
    openid: data.openid,
    unionid: data.unionid
  };
}
