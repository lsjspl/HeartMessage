import type {
  AdminUserListQuery,
  AdminUserListItem,
  AdminUserStatusUpdateInput,
  PaginatedList,
  UserStatus
} from "@heart-message/shared";
import { AppError } from "../errors";
import type { Env } from "../env";
import { createPaginatedList, paginationOffset } from "./pagination";

interface AdminUserRow {
  id: string;
  role: "user" | "admin";
  status: UserStatus;
  created_at: number;
  nickname: string | null;
  avatar_url: string | null;
  auth_provider: "wechat" | "google" | null;
  email: string | null;
  auth_display_name: string | null;
  auth_avatar_url: string | null;
}

interface UserStatusRow {
  id: string;
  role: "user" | "admin";
  status: UserStatus;
}

function mapAdminUser(row: AdminUserRow): AdminUserListItem {
  return {
    id: row.id,
    role: row.role,
    status: row.status,
    nickname: row.nickname || undefined,
    avatarUrl: row.avatar_url || undefined,
    email: row.email || undefined,
    authProvider: row.auth_provider || undefined,
    authDisplayName: row.auth_display_name || undefined,
    authAvatarUrl: row.auth_avatar_url || undefined,
    profileCompleted: Boolean(row.nickname),
    createdAt: new Date(row.created_at).toISOString()
  };
}

export async function listAdminUsers(
  env: Env,
  query: AdminUserListQuery
): Promise<PaginatedList<AdminUserListItem>> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (query.keyword) {
    conditions.push(
      `(users.id LIKE ?
        OR user_profiles.nickname LIKE ?
        OR EXISTS (
          SELECT 1
          FROM user_auth_identities
          WHERE user_auth_identities.user_id = users.id
            AND (user_auth_identities.email LIKE ? OR user_auth_identities.display_name LIKE ?)
        ))`
    );
    params.push(`%${query.keyword}%`, `%${query.keyword}%`, `%${query.keyword}%`, `%${query.keyword}%`);
  }

  if (query.role) {
    conditions.push("users.role = ?");
    params.push(query.role);
  }

  if (query.status) {
    conditions.push("users.status = ?");
    params.push(query.status);
  }

  const whereSql = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const [countRow, result] = await Promise.all([
    env.DB.prepare(
      `SELECT COUNT(*) AS count
       FROM users
       LEFT JOIN user_profiles ON user_profiles.user_id = users.id
       ${whereSql}`
    )
      .bind(...params)
      .first<{ count: number }>(),
    env.DB.prepare(
      `SELECT
         users.id,
         users.role,
         users.status,
         users.created_at,
         user_profiles.nickname,
         user_profiles.avatar_url,
         (
           SELECT provider
           FROM user_auth_identities
           WHERE user_auth_identities.user_id = users.id
           ORDER BY updated_at DESC
           LIMIT 1
         ) AS auth_provider,
         (
           SELECT email
           FROM user_auth_identities
           WHERE user_auth_identities.user_id = users.id
             AND email IS NOT NULL
           ORDER BY updated_at DESC
           LIMIT 1
         ) AS email,
         (
           SELECT display_name
           FROM user_auth_identities
           WHERE user_auth_identities.user_id = users.id
             AND display_name IS NOT NULL
           ORDER BY updated_at DESC
           LIMIT 1
         ) AS auth_display_name,
         (
           SELECT avatar_url
           FROM user_auth_identities
           WHERE user_auth_identities.user_id = users.id
             AND avatar_url IS NOT NULL
           ORDER BY updated_at DESC
           LIMIT 1
         ) AS auth_avatar_url
       FROM users
       LEFT JOIN user_profiles ON user_profiles.user_id = users.id
       ${whereSql}
       ORDER BY users.created_at DESC
       LIMIT ? OFFSET ?`
    )
      .bind(...params, query.pageSize, paginationOffset(query))
      .all<AdminUserRow>()
  ]);

  return createPaginatedList(result.results.map(mapAdminUser), countRow?.count ?? 0, query);
}

export async function updateAdminUserStatus(
  env: Env,
  userId: string,
  input: AdminUserStatusUpdateInput
) {
  const current = await env.DB.prepare("SELECT id, role, status FROM users WHERE id = ?")
    .bind(userId)
    .first<UserStatusRow>();

  if (!current) {
    throw new AppError(404, "USER_NOT_FOUND", "用户不存在");
  }

  if (current.role === "admin") {
    throw new AppError(403, "ADMIN_USER_STATUS_LOCKED", "不能通过该接口修改管理员账号");
  }

  const now = Date.now();

  await env.DB.prepare("UPDATE users SET status = ?, updated_at = ? WHERE id = ?")
    .bind(input.status, now, userId)
    .run();

  return {
    id: userId,
    previousStatus: current.status,
    status: input.status
  };
}
