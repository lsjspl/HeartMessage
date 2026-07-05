import type { ApiResult } from "@heart-message/shared";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8787";
const ADMIN_TOKEN_KEY = "heart_message_admin_token";

export function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY) || "";
}

export function setAdminToken(token: string) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

export async function adminRequest<T>(path: string, options: RequestInit = {}) {
  const token = getAdminToken();
  const response = await fetch(`${API_BASE_URL}/admin${path}`, {
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...options.headers
    },
    ...options
  });
  const body = (await response.json()) as ApiResult<T>;

  if (!response.ok) {
    throw new Error(body && !body.ok ? body.error.message : `Admin request failed: ${response.status}`);
  }

  if (body && typeof body === "object" && "ok" in body) {
    if (body.ok) {
      return body.data;
    }

    throw new Error(body.error.message);
  }

  return body as T;
}
