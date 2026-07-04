import type { ApiResult } from "@heart-message/shared";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8787";

export async function adminRequest<T>(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}/admin${path}`, {
    headers: {
      "content-type": "application/json",
      ...options.headers
    },
    ...options
  });

  if (!response.ok) {
    throw new Error(`Admin request failed: ${response.status}`);
  }

  const body = (await response.json()) as ApiResult<T>;

  if (body && typeof body === "object" && "ok" in body) {
    if (body.ok) {
      return body.data;
    }

    throw new Error(body.error.message);
  }

  return body as T;
}
