PRAGMA foreign_keys = OFF;

DROP INDEX IF EXISTS users_wechat_open_id_idx;

CREATE TABLE users_next (
  id TEXT PRIMARY KEY,
  wechat_open_id TEXT,
  wechat_union_id TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  status TEXT NOT NULL DEFAULT 'active',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

INSERT INTO users_next (id, wechat_open_id, wechat_union_id, role, status, created_at, updated_at)
SELECT id, wechat_open_id, wechat_union_id, role, status, created_at, updated_at
FROM users;

DROP TABLE users;

ALTER TABLE users_next RENAME TO users;

CREATE UNIQUE INDEX IF NOT EXISTS users_wechat_open_id_idx ON users (wechat_open_id);

CREATE TABLE IF NOT EXISTS user_auth_identities (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS user_auth_identities_provider_user_idx
  ON user_auth_identities (provider, provider_user_id);

CREATE INDEX IF NOT EXISTS user_auth_identities_user_provider_idx
  ON user_auth_identities (user_id, provider);

INSERT INTO user_auth_identities (
  id,
  user_id,
  provider,
  provider_user_id,
  created_at,
  updated_at
)
SELECT
  'wechat-' || id,
  id,
  'wechat',
  wechat_open_id,
  created_at,
  updated_at
FROM users
WHERE wechat_open_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM user_auth_identities
    WHERE user_auth_identities.provider = 'wechat'
      AND user_auth_identities.provider_user_id = users.wechat_open_id
  );

PRAGMA foreign_keys = ON;
