import type { AdminLoginInput, AdminSession } from "@heart-message/shared";
import { AppError } from "../errors";
import type { Env } from "../env";
import { verifyAdminPassword } from "./admin-password";
import { findAdminAccountByUsername } from "./admin-accounts";
import { signAuthToken } from "./token";

const ADMIN_TOKEN_TTL_SECONDS = 60 * 60 * 12;

export async function loginAdmin(env: Env, input: AdminLoginInput): Promise<AdminSession> {
  const account = await findAdminAccountByUsername(env, input.username);

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
