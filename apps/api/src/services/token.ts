import type { Env } from "../env";
import { getSensitiveConfigValue } from "./sensitive-config";

export interface AuthTokenPayload {
  sub: string;
  role: "user" | "admin";
  exp: number;
}

const encoder = new TextEncoder();

function base64UrlEncode(input: ArrayBuffer | string) {
  const bytes =
    typeof input === "string" ? encoder.encode(input) : new Uint8Array(input);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlDecode(input: string) {
  const padded = input.replaceAll("-", "+").replaceAll("_", "/").padEnd(
    Math.ceil(input.length / 4) * 4,
    "="
  );
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

async function importKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function getSecret(env: Env) {
  return getSensitiveConfigValue(env, "AUTH_TOKEN_SECRET");
}

export async function signAuthToken(
  env: Env,
  payload: Omit<AuthTokenPayload, "exp">,
  expiresInSeconds = 60 * 60 * 24 * 30
) {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64UrlEncode(
    JSON.stringify({
      ...payload,
      exp: Math.floor(Date.now() / 1000) + expiresInSeconds
    })
  );
  const signingInput = `${header}.${body}`;
  const signature = await crypto.subtle.sign(
    "HMAC",
    await importKey(await getSecret(env)),
    encoder.encode(signingInput)
  );

  return `${signingInput}.${base64UrlEncode(signature)}`;
}

export async function verifyAuthToken(env: Env, token: string): Promise<AuthTokenPayload | null> {
  const [header, body, signature] = token.split(".");

  if (!header || !body || !signature) {
    return null;
  }

  const signingInput = `${header}.${body}`;
  const isValid = await crypto.subtle.verify(
    "HMAC",
    await importKey(await getSecret(env)),
    base64UrlDecode(signature),
    encoder.encode(signingInput)
  );

  if (!isValid) {
    return null;
  }

  const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(body))) as AuthTokenPayload;

  if (!payload.sub || !payload.role || payload.exp <= Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payload;
}
