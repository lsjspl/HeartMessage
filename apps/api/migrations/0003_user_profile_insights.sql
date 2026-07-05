ALTER TABLE ai_personas ADD COLUMN target_user_id TEXT REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS ai_personas_target_user_idx ON ai_personas (target_user_id);

CREATE TABLE IF NOT EXISTS user_profile_insights (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  summary TEXT NOT NULL DEFAULT '',
  interest_tags TEXT NOT NULL DEFAULT '[]',
  preferred_topics TEXT NOT NULL DEFAULT '[]',
  avoided_topics TEXT NOT NULL DEFAULT '[]',
  conversation_style TEXT NOT NULL DEFAULT '',
  emotional_needs TEXT NOT NULL DEFAULT '[]',
  preferred_persona_traits TEXT NOT NULL DEFAULT '[]',
  companion_expectation TEXT NOT NULL DEFAULT '',
  safety_notes TEXT NOT NULL DEFAULT '',
  source_message_count INTEGER NOT NULL DEFAULT 0,
  source_bottle_count INTEGER NOT NULL DEFAULT 0,
  model_id TEXT REFERENCES ai_models(id) ON DELETE SET NULL,
  evaluated_at INTEGER,
  last_error_code TEXT,
  last_error_message TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS user_profile_insights_status_evaluated_idx
  ON user_profile_insights (status, evaluated_at);
