ALTER TABLE ai_providers ADD COLUMN adapter_type TEXT NOT NULL DEFAULT 'openai_compatible';
ALTER TABLE bottles ADD COLUMN ai_persona_id TEXT;

CREATE TABLE IF NOT EXISTS ai_personas (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  bio TEXT NOT NULL,
  age INTEGER,
  gender TEXT NOT NULL DEFAULT 'unknown',
  system_prompt TEXT NOT NULL,
  model_id TEXT REFERENCES ai_models(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS ai_personas_model_idx ON ai_personas (model_id);
CREATE INDEX IF NOT EXISTS bottles_ai_persona_idx ON bottles (ai_persona_id);
