import type {
  AdminAccountCreateInput,
  AdminAccountListItem,
  AdminAccountListQuery,
  AdminAccountPasswordResetInput,
  AdminAccountUpdateInput,
  AdminPasswordChangeInput,
  PaginatedList
} from "@heart-message/shared";
import { AppError } from "../errors";
import type { Env } from "../env";
import { hashAdminPassword, verifyAdminPassword } from "./admin-password";
import { createPaginatedList, paginationOffset } from "./pagination";

interface AdminAccountRow {
  id: string;
  username: string;
  name: string;
  role: "super_admin" | "admin";
  status: "active" | "disabled" | "deleted";
  password_hash: string;
  password_salt: string;
  password_iterations: number;
  created_at: number;
  updated_at: number;
}

function mapAdminAccount(row: AdminAccountRow): AdminAccountListItem {
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    role: row.role,
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString()
  };
}

export function adminAccountIdFromSubject(subject?: string) {
  return subject?.startsWith("admin_account:") ? subject.slice("admin_account:".length) : "";
}

export async function findAdminAccountById(env: Env, id: string) {
  return env.DB.prepare("SELECT * FROM admin_accounts WHERE id = ?")
    .bind(id)
    .first<AdminAccountRow>();
}

export async function findAdminAccountByUsername(env: Env, username: string) {
  return env.DB.prepare("SELECT * FROM admin_accounts WHERE username = ?")
    .bind(username)
    .first<AdminAccountRow>();
}

export async function ensureSuperAdmin(env: Env, subject?: string) {
  const id = adminAccountIdFromSubject(subject);

  if (!id) {
    throw new AppError(403, "SUPER_ADMIN_REQUIRED", "需要超级管理员权限");
  }

  const account = await findAdminAccountById(env, id);

  if (!account || account.status !== "active" || account.role !== "super_admin") {
    throw new AppError(403, "SUPER_ADMIN_REQUIRED", "需要超级管理员权限");
  }

  return account;
}

export async function listAdminAccounts(
  env: Env,
  query: AdminAccountListQuery
): Promise<PaginatedList<AdminAccountListItem>> {
  const conditions = ["status <> 'deleted'"];
  const params: unknown[] = [];

  if (query.keyword) {
    conditions.push("(id LIKE ? OR username LIKE ? OR name LIKE ?)");
    params.push(`%${query.keyword}%`, `%${query.keyword}%`, `%${query.keyword}%`);
  }

  if (query.role) {
    conditions.push("role = ?");
    params.push(query.role);
  }

  if (query.status) {
    conditions.push("status = ?");
    params.push(query.status);
  }

  const whereSql = `WHERE ${conditions.join(" AND ")}`;
  const [countRow, result] = await Promise.all([
    env.DB.prepare(`SELECT COUNT(*) AS count FROM admin_accounts ${whereSql}`)
      .bind(...params)
      .first<{ count: number }>(),
    env.DB.prepare(
      `SELECT *
       FROM admin_accounts
       ${whereSql}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`
    )
      .bind(...params, query.pageSize, paginationOffset(query))
      .all<AdminAccountRow>()
  ]);

  return createPaginatedList(result.results.map(mapAdminAccount), countRow?.count ?? 0, query);
}

export async function createAdminAccount(env: Env, input: AdminAccountCreateInput) {
  const existing = await findAdminAccountByUsername(env, input.username);

  if (existing) {
    throw new AppError(409, "ADMIN_USERNAME_EXISTS", "管理员账号已存在");
  }

  const now = Date.now();
  const password = await hashAdminPassword(input.password);
  const id = crypto.randomUUID();

  await env.DB.prepare(
    `INSERT INTO admin_accounts
       (id, username, name, role, status, password_hash, password_salt, password_iterations, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      input.username,
      input.name,
      input.role,
      input.status,
      password.hash,
      password.salt,
      password.iterations,
      now,
      now
    )
    .run();

  const account = await findAdminAccountById(env, id);

  if (!account) {
    throw new AppError(500, "ADMIN_ACCOUNT_CREATE_FAILED", "管理员创建失败");
  }

  return mapAdminAccount(account);
}

export async function updateAdminAccount(
  env: Env,
  subject: string | undefined,
  id: string,
  input: AdminAccountUpdateInput
) {
  const current = await findAdminAccountById(env, id);
  const selfId = adminAccountIdFromSubject(subject);

  if (!current || current.status === "deleted") {
    throw new AppError(404, "ADMIN_ACCOUNT_NOT_FOUND", "管理员不存在");
  }

  if (selfId === id && input.status !== "active") {
    throw new AppError(409, "ADMIN_SELF_DISABLE_FORBIDDEN", "不能禁用自己的管理员账号");
  }

  await env.DB.prepare(
    `UPDATE admin_accounts
     SET name = ?, role = ?, status = ?, updated_at = ?
     WHERE id = ?`
  )
    .bind(input.name, input.role, input.status, Date.now(), id)
    .run();

  const account = await findAdminAccountById(env, id);

  if (!account) {
    throw new AppError(500, "ADMIN_ACCOUNT_UPDATE_FAILED", "管理员更新失败");
  }

  return mapAdminAccount(account);
}

export async function deleteAdminAccount(env: Env, subject: string | undefined, id: string) {
  const current = await findAdminAccountById(env, id);
  const selfId = adminAccountIdFromSubject(subject);

  if (!current || current.status === "deleted") {
    throw new AppError(404, "ADMIN_ACCOUNT_NOT_FOUND", "管理员不存在");
  }

  if (selfId === id) {
    throw new AppError(409, "ADMIN_SELF_DELETE_FORBIDDEN", "不能删除自己的管理员账号");
  }

  await env.DB.prepare("UPDATE admin_accounts SET status = 'deleted', updated_at = ? WHERE id = ?")
    .bind(Date.now(), id)
    .run();

  return { id, deleted: true };
}

export async function resetAdminPassword(
  env: Env,
  id: string,
  input: AdminAccountPasswordResetInput
) {
  const current = await findAdminAccountById(env, id);

  if (!current || current.status === "deleted") {
    throw new AppError(404, "ADMIN_ACCOUNT_NOT_FOUND", "管理员不存在");
  }

  const password = await hashAdminPassword(input.password);

  await env.DB.prepare(
    `UPDATE admin_accounts
     SET password_hash = ?, password_salt = ?, password_iterations = ?, updated_at = ?
     WHERE id = ?`
  )
    .bind(password.hash, password.salt, password.iterations, Date.now(), id)
    .run();

  return { id, updated: true };
}

export async function changeOwnAdminPassword(
  env: Env,
  subject: string | undefined,
  input: AdminPasswordChangeInput
) {
  const id = adminAccountIdFromSubject(subject);
  const current = id ? await findAdminAccountById(env, id) : null;

  if (!current || current.status !== "active") {
    throw new AppError(404, "ADMIN_ACCOUNT_NOT_FOUND", "管理员不存在");
  }

  const isValid = await verifyAdminPassword(
    input.oldPassword,
    current.password_hash,
    current.password_salt,
    current.password_iterations
  );

  if (!isValid) {
    throw new AppError(401, "INVALID_OLD_PASSWORD", "旧密码错误");
  }

  return resetAdminPassword(env, id, { password: input.newPassword });
}
