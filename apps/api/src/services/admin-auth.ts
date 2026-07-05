import type { AdminLoginInput, AdminSession } from "@heart-message/shared";
import { AppError } from "../errors";
import type { Env } from "../env";
import { signAuthToken } from "./token";

const ADMIN_TOKEN_TTL_SECONDS = 60 * 60 * 12;

function getConfiguredAdmin(env: Env) {
  if (!env.ADMIN_USERNAME || !env.ADMIN_PASSWORD) {
    throw new AppError(500, "ADMIN_CREDENTIALS_NOT_CONFIGURED", "后台管理员账号未配置");
  }

  return {
    username: env.ADMIN_USERNAME,
    password: env.ADMIN_PASSWORD
  };
}

export async function loginAdmin(env: Env, input: AdminLoginInput): Promise<AdminSession> {
  const admin = getConfiguredAdmin(env);

  if (input.username !== admin.username || input.password !== admin.password) {
    throw new AppError(401, "INVALID_ADMIN_LOGIN", "后台账号或密码错误");
  }

  const token = await signAuthToken(
    env,
    {
      sub: `admin:${admin.username}`,
      role: "admin"
    },
    ADMIN_TOKEN_TTL_SECONDS
  );
  const expiresAt = new Date(Date.now() + ADMIN_TOKEN_TTL_SECONDS * 1000).toISOString();

  return {
    token,
    name: admin.username,
    expiresAt
  };
}
