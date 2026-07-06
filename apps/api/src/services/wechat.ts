import type { WechatLoginMode, WechatWebLoginConfig } from "@heart-message/shared";
import type { Env } from "../env";
import { AppError } from "../errors";
import { getSystemSettings } from "./settings";
import { getOptionalSensitiveConfigValue } from "./sensitive-config";

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

interface WechatCredentials {
  appId?: string;
  appSecret?: string;
  label: string;
}

export interface WechatExchangeOptions {
  allowLocalRequestDevCode?: boolean;
}

function createDevIdentity(code: string): WechatIdentity {
  return {
    openid: `dev-openid-${code.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48) || "local"}`
  };
}

function isLocalEnvironment(environment: string) {
  return environment === "local" || environment === "development" || environment === "test";
}

async function getWechatCredentials(env: Env, mode: WechatLoginMode): Promise<WechatCredentials> {
  if (mode === "web_qr") {
    const [appId, appSecret] = await Promise.all([
      getOptionalSensitiveConfigValue(env, "WECHAT_WEB_APP_ID"),
      getOptionalSensitiveConfigValue(env, "WECHAT_WEB_APP_SECRET")
    ]);

    return {
      appId,
      appSecret,
      label: "微信网站应用登录配置"
    };
  }

  throw new AppError(400, "UNSUPPORTED_WECHAT_LOGIN_MODE", "不支持的微信登录方式");
}

export async function getWechatWebLoginConfig(
  env: Env,
  options: WechatExchangeOptions = {}
): Promise<WechatWebLoginConfig> {
  const [settings, appId, appSecret] = await Promise.all([
    getSystemSettings(env),
    getOptionalSensitiveConfigValue(env, "WECHAT_WEB_APP_ID"),
    getOptionalSensitiveConfigValue(env, "WECHAT_WEB_APP_SECRET")
  ]);

  return {
    configured: Boolean(appId && appSecret),
    devLoginAllowed: isLocalEnvironment(settings.runtime.environment) || Boolean(options.allowLocalRequestDevCode),
    appId: appId || undefined
  };
}

export async function exchangeWechatCode(
  env: Env,
  code: string,
  mode: WechatLoginMode,
  options: WechatExchangeOptions = {}
): Promise<WechatIdentity> {
  const [settings, credentials] = await Promise.all([
    getSystemSettings(env),
    getWechatCredentials(env, mode)
  ]);
  const isDevCode = code.startsWith("dev-");
  const isLocal = isLocalEnvironment(settings.runtime.environment) || Boolean(options.allowLocalRequestDevCode);
  const hasWechatConfig = Boolean(credentials.appId && credentials.appSecret);

  if (isDevCode && !isLocal) {
    throw new AppError(403, "DEV_WECHAT_CODE_FORBIDDEN", "生产环境不能使用开发登录 code");
  }

  if (isLocal && (isDevCode || !hasWechatConfig)) {
    return createDevIdentity(code);
  }

  if (!hasWechatConfig) {
    throw new AppError(500, "WECHAT_NOT_CONFIGURED", `${credentials.label}未完成`);
  }

  const url = new URL("https://api.weixin.qq.com/sns/oauth2/access_token");
  url.searchParams.set("appid", credentials.appId!);
  url.searchParams.set("secret", credentials.appSecret!);
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
