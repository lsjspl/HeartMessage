CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sensitive_configs (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

INSERT INTO system_settings (key, value_json, created_at, updated_at)
SELECT
  'system-settings',
  '{"runtime":{"environment":"production","corsOrigins":["*"]},"dailyPickLimit":20,"dailyThrowLimit":3,"bottleExpires":"end_of_day","aiFallbackEnabled":true,"aiTrigger":"empty_pool","aiBatchSize":20,"aiBindings":{},"userProfileEvaluation":{"enabled":true,"intervalHours":24,"batchSize":20}}',
  unixepoch('now') * 1000,
  unixepoch('now') * 1000
WHERE NOT EXISTS (
  SELECT 1 FROM system_settings WHERE key = 'system-settings'
);

INSERT INTO sensitive_configs (key, value, created_at, updated_at)
SELECT
  'AUTH_TOKEN_SECRET',
  lower(hex(randomblob(32))),
  unixepoch('now') * 1000,
  unixepoch('now') * 1000
WHERE NOT EXISTS (
  SELECT 1 FROM sensitive_configs WHERE key = 'AUTH_TOKEN_SECRET'
);
