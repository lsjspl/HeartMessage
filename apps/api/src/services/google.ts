import type { GoogleLoginConfig } from "@heart-message/shared";
import type { Env } from "../env";
import { AppError } from "../errors";
import { getSystemSettings } from "./settings";
import { getOptionalSensitiveConfigValue } from "./sensitive-config";

const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_ENDPOINT = "https://openidconnect.googleapis.com/v1/userinfo";

interface GoogleTokenResponse {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  id_token?: string;
  error?: string;
  error_description?: string;
}

interface GoogleUserInfoResponse {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  error?: string;
  error_description?: string;
}

interface GoogleCredentials {
  clientId?: string;
  clientSecret?: string;
}

export interface GoogleExchangeOptions {
  allowLocalRequestDevCode?: boolean;
}

export interface GoogleIdentity {
  sub: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
}

function isLocalEnvironment(environment: string) {
  return environment === "local" || environment === "development" || environment === "test";
}

function sanitizeDevCode(code: string) {
  return code.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48) || "local";
}

function createDevIdentity(code: string): GoogleIdentity {
  const id = sanitizeDevCode(code);

  return {
    sub: `dev-google-sub-${id}`,
    email: `${id}@local.google.invalid`,
    displayName: "本地 Google 用户"
  };
}

async function getGoogleCredentials(env: Env): Promise<GoogleCredentials> {
  const [clientId, clientSecret] = await Promise.all([
    getOptionalSensitiveConfigValue(env, "GOOGLE_OAUTH_CLIENT_ID"),
    getOptionalSensitiveConfigValue(env, "GOOGLE_OAUTH_CLIENT_SECRET")
  ]);

  return {
    clientId,
    clientSecret
  };
}

export async function getGoogleLoginConfig(
  env: Env,
  options: GoogleExchangeOptions = {}
): Promise<GoogleLoginConfig> {
  const [settings, credentials] = await Promise.all([getSystemSettings(env), getGoogleCredentials(env)]);

  return {
    configured: Boolean(credentials.clientId && credentials.clientSecret),
    devLoginAllowed: isLocalEnvironment(settings.runtime.environment) || Boolean(options.allowLocalRequestDevCode),
    clientId: credentials.clientId || undefined
  };
}

async function exchangeCodeForAccessToken(credentials: Required<GoogleCredentials>, code: string, redirectUri: string) {
  const body = new URLSearchParams();
  body.set("client_id", credentials.clientId);
  body.set("client_secret", credentials.clientSecret);
  body.set("code", code);
  body.set("grant_type", "authorization_code");
  body.set("redirect_uri", redirectUri);

  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded"
    },
    body
  });
  const data = (await response.json()) as GoogleTokenResponse;

  if (!response.ok || !data.access_token) {
    throw new AppError(502, "GOOGLE_TOKEN_EXCHANGE_FAILED", data.error_description || "Google 登录授权失败");
  }

  return data.access_token;
}

async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleIdentity> {
  const response = await fetch(GOOGLE_USERINFO_ENDPOINT, {
    headers: {
      authorization: `Bearer ${accessToken}`
    }
  });
  const data = (await response.json()) as GoogleUserInfoResponse;

  if (!response.ok || !data.sub) {
    throw new AppError(502, "GOOGLE_USERINFO_FAILED", data.error_description || "Google 用户信息获取失败");
  }

  return {
    sub: data.sub,
    email: data.email,
    displayName: data.name,
    avatarUrl: data.picture
  };
}

export async function exchangeGoogleCode(
  env: Env,
  code: string,
  redirectUri: string,
  options: GoogleExchangeOptions = {}
): Promise<GoogleIdentity> {
  const [settings, credentials] = await Promise.all([getSystemSettings(env), getGoogleCredentials(env)]);
  const isDevCode = code.startsWith("dev-");
  const isLocal = isLocalEnvironment(settings.runtime.environment) || Boolean(options.allowLocalRequestDevCode);
  const hasGoogleConfig = Boolean(credentials.clientId && credentials.clientSecret);

  if (isDevCode && !isLocal) {
    throw new AppError(403, "DEV_GOOGLE_CODE_FORBIDDEN", "生产环境不能使用开发 Google 登录 code");
  }

  if (isLocal && (isDevCode || !hasGoogleConfig)) {
    return createDevIdentity(code);
  }

  if (!hasGoogleConfig) {
    throw new AppError(500, "GOOGLE_NOT_CONFIGURED", "Google 登录配置未完成");
  }

  const accessToken = await exchangeCodeForAccessToken(
    {
      clientId: credentials.clientId!,
      clientSecret: credentials.clientSecret!
    },
    code,
    redirectUri
  );

  return fetchGoogleUserInfo(accessToken);
}
