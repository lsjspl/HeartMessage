import type { ApiResult } from "@heart-message/shared";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8787";
const TOKEN_STORAGE_KEY = "heart_message_token";

let authToken = readStoredToken();

function readStoredToken() {
  try {
    return (uni.getStorageSync(TOKEN_STORAGE_KEY) as string) || "";
  } catch {
    return "";
  }
}

export function getAuthToken() {
  return authToken;
}

export function setAuthToken(token: string) {
  authToken = token;
  uni.setStorageSync(TOKEN_STORAGE_KEY, token);
}

export function clearAuthToken() {
  authToken = "";
  uni.removeStorageSync(TOKEN_STORAGE_KEY);
}

export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  data?: string | ArrayBuffer | Record<string, unknown>;
  headers?: Record<string, string>;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}) {
  return new Promise<T>((resolve, reject) => {
    uni.request({
      url: `${API_BASE_URL}${path}`,
      method: options.method ?? "GET",
      data: options.data,
      header: {
        "content-type": "application/json",
        ...(authToken ? { authorization: `Bearer ${authToken}` } : {}),
        ...options.headers
      },
      success(response) {
        const body = response.data as ApiResult<T>;

        if (response.statusCode >= 400) {
          reject(new Error(body?.ok === false ? body.error.message : `请求失败：${response.statusCode}`));
          return;
        }

        if (body && typeof body === "object" && "ok" in body) {
          if (body.ok) {
            resolve(body.data);
          } else {
            reject(new Error(body.error.message));
          }

          return;
        }

        resolve(response.data as T);
      },
      fail(error) {
        reject(new Error(error.errMsg));
      }
    });
  });
}
