import type { Env } from "../env";

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

export async function exchangeWechatCode(env: Env, code: string): Promise<WechatIdentity> {
  const isDevCode = code.startsWith("dev-");

  if (isDevCode || !env.WECHAT_APP_ID || !env.WECHAT_APP_SECRET) {
    return createDevIdentity(code);
  }

  const url = new URL("https://api.weixin.qq.com/sns/oauth2/access_token");
  url.searchParams.set("appid", env.WECHAT_APP_ID);
  url.searchParams.set("secret", env.WECHAT_APP_SECRET);
  url.searchParams.set("code", code);
  url.searchParams.set("grant_type", "authorization_code");

  const response = await fetch(url);
  const data = (await response.json()) as WechatOauthResponse;

  if (!response.ok || !data.openid) {
    throw new Error(data.errmsg || "微信授权失败");
  }

  return {
    openid: data.openid,
    unionid: data.unionid
  };
}
