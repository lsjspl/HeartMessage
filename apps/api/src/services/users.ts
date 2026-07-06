import type { AuthProvider, CurrentUser, ProfileUpsertInput, UserProfile } from "@heart-message/shared";
import type { Env } from "../env";

interface UserRow {
  id: string;
  wechat_open_id: string | null;
  wechat_union_id: string | null;
  role: "user" | "admin";
  status: "active" | "disabled" | "deleted";
  created_at: number;
  updated_at: number;
}

interface ProfileRow {
  user_id: string;
  nickname: string;
  avatar_url: string | null;
  bio: string | null;
  age: number | null;
  gender: "male" | "female" | "unknown";
}

export interface AuthIdentityInput {
  provider: AuthProvider;
  providerUserId: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  wechatUnionId?: string;
}

export function mapUser(row: UserRow) {
  return {
    id: row.id,
    role: row.role,
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString()
  };
}

export function mapProfile(row: ProfileRow | null): UserProfile | null {
  if (!row) {
    return null;
  }

  return {
    id: row.user_id,
    nickname: row.nickname,
    avatarUrl: row.avatar_url || undefined,
    bio: row.bio || undefined,
    age: row.age || undefined,
    gender: row.gender
  };
}

export async function findUserByWechatOpenId(env: Env, openid: string) {
  return env.DB.prepare("SELECT * FROM users WHERE wechat_open_id = ?")
    .bind(openid)
    .first<UserRow>();
}

export async function findUserByAuthIdentity(env: Env, provider: AuthProvider, providerUserId: string) {
  return env.DB.prepare(
    `SELECT users.*
     FROM user_auth_identities
     INNER JOIN users ON users.id = user_auth_identities.user_id
     WHERE user_auth_identities.provider = ?
       AND user_auth_identities.provider_user_id = ?`
  )
    .bind(provider, providerUserId)
    .first<UserRow>();
}

export async function findUserById(env: Env, userId: string) {
  return env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(userId).first<UserRow>();
}

async function insertAuthIdentity(env: Env, userId: string, input: AuthIdentityInput, now: number) {
  await env.DB.prepare(
    `INSERT INTO user_auth_identities
       (id, user_id, provider, provider_user_id, email, display_name, avatar_url, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(provider, provider_user_id) DO UPDATE SET
       email = COALESCE(excluded.email, user_auth_identities.email),
       display_name = COALESCE(excluded.display_name, user_auth_identities.display_name),
       avatar_url = COALESCE(excluded.avatar_url, user_auth_identities.avatar_url),
       updated_at = excluded.updated_at`
  )
    .bind(
      crypto.randomUUID(),
      userId,
      input.provider,
      input.providerUserId,
      input.email ?? null,
      input.displayName ?? null,
      input.avatarUrl ?? null,
      now,
      now
    )
    .run();
}

export async function createUserByAuthIdentity(env: Env, input: AuthIdentityInput) {
  const now = Date.now();
  const id = crypto.randomUUID();
  const wechatOpenId = input.provider === "wechat" ? input.providerUserId : null;

  await env.DB.prepare(
    `INSERT INTO users (id, wechat_open_id, wechat_union_id, role, status, created_at, updated_at)
     VALUES (?, ?, ?, 'user', 'active', ?, ?)`
  )
    .bind(id, wechatOpenId, input.wechatUnionId ?? null, now, now)
    .run();

  await insertAuthIdentity(env, id, input, now);

  const user = await findUserById(env, id);

  if (!user) {
    throw new Error("用户创建失败");
  }

  return user;
}

export async function findOrCreateUserByAuthIdentity(env: Env, input: AuthIdentityInput) {
  const existingUser = await findUserByAuthIdentity(env, input.provider, input.providerUserId);

  if (existingUser) {
    await insertAuthIdentity(env, existingUser.id, input, Date.now());
    return existingUser;
  }

  if (input.provider === "wechat") {
    const legacyUser = await findUserByWechatOpenId(env, input.providerUserId);

    if (legacyUser) {
      await insertAuthIdentity(env, legacyUser.id, input, Date.now());
      return legacyUser;
    }
  }

  return createUserByAuthIdentity(env, input);
}

export async function findProfileByUserId(env: Env, userId: string) {
  return env.DB.prepare("SELECT * FROM user_profiles WHERE user_id = ?")
    .bind(userId)
    .first<ProfileRow>();
}

export async function upsertProfile(env: Env, userId: string, input: ProfileUpsertInput) {
  const now = Date.now();

  await env.DB.prepare(
    `INSERT INTO user_profiles
       (user_id, nickname, avatar_url, bio, age, gender, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       nickname = excluded.nickname,
       avatar_url = excluded.avatar_url,
       bio = excluded.bio,
       age = excluded.age,
       gender = excluded.gender,
       updated_at = excluded.updated_at`
  )
    .bind(
      userId,
      input.nickname,
      input.avatarUrl ?? null,
      input.bio ?? null,
      input.age ?? null,
      input.gender,
      now,
      now
    )
    .run();

  return findProfileByUserId(env, userId);
}

export async function getCurrentUser(env: Env, userId: string): Promise<CurrentUser> {
  const user = await findUserById(env, userId);

  if (!user) {
    throw new Error("用户不存在");
  }

  const profile = await findProfileByUserId(env, userId);

  return {
    user: mapUser(user),
    profile: mapProfile(profile),
    needsProfile: !profile
  };
}
