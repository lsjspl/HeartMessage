import type { GoogleLoginConfig, WechatWebLoginConfig } from "@heart-message/shared";
import { apiRequest } from "./api";

export function fetchWechatWebLoginConfig() {
  return apiRequest<WechatWebLoginConfig>("/v1/auth/wechat/web-config");
}

export function fetchGoogleLoginConfig() {
  return apiRequest<GoogleLoginConfig>("/v1/auth/google/config");
}
