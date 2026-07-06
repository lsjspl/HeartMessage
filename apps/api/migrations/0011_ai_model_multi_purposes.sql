ALTER TABLE ai_models ADD COLUMN purposes_json TEXT NOT NULL DEFAULT '[]';

UPDATE ai_models
SET purposes_json = json_array(purpose);

DROP INDEX IF EXISTS ai_models_purpose_idx;

ALTER TABLE ai_models DROP COLUMN purpose;

CREATE UNIQUE INDEX IF NOT EXISTS ai_models_provider_model_unique_idx
  ON ai_models (provider_id, model_name);

CREATE INDEX IF NOT EXISTS ai_models_enabled_idx
  ON ai_models (is_enabled);
