import type { AdminLoginInput, AdminSession } from "@heart-message/shared";
import { AppError } from "../errors";
import type { Env } from "../env";
import { hashAdminPassword, verifyAdminPassword } from "./admin-password";
import { findAdminAccountByUsername } from "./admin-accounts";
import { signAuthToken } from "./token";
import { resolveSensitiveConfig } from "./sensitive-config";

const ADMIN_TOKEN_TTL_SECONDS = 60 * 60 * 12;

async function countAdminAccounts(env: Env) {
  const row = await env.DB.prepare("SELECT COUNT(*) AS count FROM admin_accounts").first<{ count: number }>();

  return row?.count ?? 0;
}

function isLocalRequestHost(hostname?: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

async function bootstrapSuperAdmin(env: Env, input: AdminLoginInput, requestHostname?: string) {
  const [usernameConfig, passwordConfig] = await Promise.all([
    resolveSensitiveConfig(env, "ADMIN_USERNAME"),
    resolveSensitiveConfig(env, "ADMIN_PASSWORD")
  ]);

  if (
    (usernameConfig.source === "local_default" || passwordConfig.source === "local_default") &&
    !isLocalRequestHost(requestHostname)
  ) {
    throw new AppError(500, "ADMIN_BOOTSTRAP_NOT_CONFIGURED", "线上环境必须先配置首次超级管理员账号密码");
  }

  if (input.username !== usernameConfig.value || input.password !== passwordConfig.value) {
    return null;
  }

  const now = Date.now();
  const password = await hashAdminPassword(input.password);
  const id = crypto.randomUUID();

  await env.DB.prepare(
    `INSERT INTO admin_accounts
       (id, username, name, role, status, password_hash, password_salt, password_iterations, created_at, updated_at)
     VALUES (?, ?, ?, 'super_admin', 'active', ?, ?, ?, ?, ?)`
  )
    .bind(id, usernameConfig.value, usernameConfig.value, password.hash, password.salt, password.iterations, now, now)
    .run();

  return findAdminAccountByUsername(env, usernameConfig.value);
}

export async function loginAdmin(env: Env, input: AdminLoginInput, requestHostname?: string): Promise<AdminSession> {
  const accountCount = await countAdminAccounts(env);
  const account =
    accountCount === 0
      ? await bootstrapSuperAdmin(env, input, requestHostname)
      : await findAdminAccountByUsername(env, input.username);

  if (!account || account.status !== "active") {
    throw new AppError(401, "INVALID_ADMIN_LOGIN", "后台账号或密码错误");
  }

  const isValid = await verifyAdminPassword(
    input.password,
    account.password_hash,
    account.password_salt,
    account.password_iterations
  );

  if (!isValid) {
    throw new AppError(401, "INVALID_ADMIN_LOGIN", "后台账号或密码错误");
  }

  const token = await signAuthToken(
    env,
    {
      sub: `admin_account:${account.id}`,
      role: "admin"
    },
    ADMIN_TOKEN_TTL_SECONDS
  );
  const expiresAt = new Date(Date.now() + ADMIN_TOKEN_TTL_SECONDS * 1000).toISOString();

  return {
    token,
    accountId: account.id,
    name: account.name,
    adminRole: account.role,
    expiresAt
  };
}
