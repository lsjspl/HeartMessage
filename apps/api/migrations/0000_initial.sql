CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  wechat_open_id TEXT NOT NULL,
  wechat_union_id TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  status TEXT NOT NULL DEFAULT 'active',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS users_wechat_open_id_idx ON users (wechat_open_id);

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  avatar_key TEXT,
  avatar_url TEXT,
  bio TEXT,
  age INTEGER,
  gender TEXT NOT NULL DEFAULT 'unknown',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS daily_quotas (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quota_date TEXT NOT NULL,
  picked_count INTEGER NOT NULL DEFAULT 0,
  thrown_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS daily_quotas_user_date_idx ON daily_quotas (user_id, quota_date);

CREATE TABLE IF NOT EXISTS bottles (
  id TEXT PRIMARY KEY,
  author_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  media_keys TEXT NOT NULL DEFAULT '[]',
  is_anonymous INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'human',
  status TEXT NOT NULL DEFAULT 'reviewing',
  expires_at INTEGER NOT NULL,
  picked_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS bottles_status_expires_idx ON bottles (status, expires_at);
CREATE INDEX IF NOT EXISTS bottles_author_idx ON bottles (author_id);

CREATE TABLE IF NOT EXISTS bottle_pickups (
  id TEXT PRIMARY KEY,
  bottle_id TEXT NOT NULL REFERENCES bottles(id) ON DELETE CASCADE,
  picker_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active',
  picked_at INTEGER NOT NULL,
  deleted_at INTEGER
);

CREATE UNIQUE INDEX IF NOT EXISTS bottle_pickups_bottle_picker_idx ON bottle_pickups (bottle_id, picker_id);
CREATE INDEX IF NOT EXISTS bottle_pickups_picker_status_idx ON bottle_pickups (picker_id, status);

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  bottle_id TEXT NOT NULL REFERENCES bottles(id) ON DELETE CASCADE,
  pickup_id TEXT NOT NULL REFERENCES bottle_pickups(id) ON DELETE CASCADE,
  participant_a_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  participant_b_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS conversations_pickup_idx ON conversations (pickup_id);
CREATE INDEX IF NOT EXISTS conversations_participant_a_idx ON conversations (participant_a_id);
CREATE INDEX IF NOT EXISTS conversations_participant_b_idx ON conversations (participant_b_id);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  sender_type TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS messages_conversation_created_idx ON messages (conversation_id, created_at);

CREATE TABLE IF NOT EXISTS ai_providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  base_url TEXT,
  api_key_secret_name TEXT NOT NULL,
  is_enabled INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_models (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL REFERENCES ai_providers(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  model_name TEXT NOT NULL,
  purpose TEXT NOT NULL,
  is_enabled INTEGER NOT NULL DEFAULT 1,
  config_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS ai_models_purpose_idx ON ai_models (purpose, is_enabled);

CREATE TABLE IF NOT EXISTS operation_logs (
  id TEXT PRIMARY KEY,
  actor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  metadata TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS operation_logs_created_idx ON operation_logs (created_at);
CREATE INDEX IF NOT EXISTS operation_logs_target_idx ON operation_logs (target_type, target_id);
