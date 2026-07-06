ALTER TABLE ai_models ADD COLUMN purposes_json TEXT NOT NULL DEFAULT '[]';

CREATE TEMP TABLE ai_model_merge_map AS
SELECT
  source.id AS old_id,
  (
    SELECT canonical.id
    FROM ai_models AS canonical
    WHERE canonical.provider_id = source.provider_id
      AND canonical.model_name = source.model_name
    ORDER BY canonical.created_at ASC, canonical.id ASC
    LIMIT 1
  ) AS new_id
FROM ai_models AS source;

UPDATE ai_personas
SET model_id = (
  SELECT new_id FROM ai_model_merge_map WHERE old_id = ai_personas.model_id
)
WHERE model_id IN (SELECT old_id FROM ai_model_merge_map WHERE old_id <> new_id);

UPDATE user_profile_insights
SET model_id = (
  SELECT new_id FROM ai_model_merge_map WHERE old_id = user_profile_insights.model_id
)
WHERE model_id IN (SELECT old_id FROM ai_model_merge_map WHERE old_id <> new_id);

UPDATE content_moderation_events
SET model_id = (
  SELECT new_id FROM ai_model_merge_map WHERE old_id = content_moderation_events.model_id
)
WHERE model_id IN (SELECT old_id FROM ai_model_merge_map WHERE old_id <> new_id);

UPDATE system_settings
SET value_json = json_set(
  value_json,
  '$.aiBindings.persona_generation',
  (
    SELECT new_id
    FROM ai_model_merge_map
    WHERE old_id = json_extract(value_json, '$.aiBindings.persona_generation')
  )
)
WHERE key = 'system-settings'
  AND EXISTS (
    SELECT 1
    FROM ai_model_merge_map
    WHERE old_id = json_extract(value_json, '$.aiBindings.persona_generation')
      AND old_id <> new_id
  );

UPDATE system_settings
SET value_json = json_set(
  value_json,
  '$.aiBindings.bottle_generation',
  (
    SELECT new_id
    FROM ai_model_merge_map
    WHERE old_id = json_extract(value_json, '$.aiBindings.bottle_generation')
  )
)
WHERE key = 'system-settings'
  AND EXISTS (
    SELECT 1
    FROM ai_model_merge_map
    WHERE old_id = json_extract(value_json, '$.aiBindings.bottle_generation')
      AND old_id <> new_id
  );

UPDATE system_settings
SET value_json = json_set(
  value_json,
  '$.aiBindings.chat_reply',
  (
    SELECT new_id
    FROM ai_model_merge_map
    WHERE old_id = json_extract(value_json, '$.aiBindings.chat_reply')
  )
)
WHERE key = 'system-settings'
  AND EXISTS (
    SELECT 1
    FROM ai_model_merge_map
    WHERE old_id = json_extract(value_json, '$.aiBindings.chat_reply')
      AND old_id <> new_id
  );

UPDATE system_settings
SET value_json = json_set(
  value_json,
  '$.aiBindings.content_moderation',
  (
    SELECT new_id
    FROM ai_model_merge_map
    WHERE old_id = json_extract(value_json, '$.aiBindings.content_moderation')
  )
)
WHERE key = 'system-settings'
  AND EXISTS (
    SELECT 1
    FROM ai_model_merge_map
    WHERE old_id = json_extract(value_json, '$.aiBindings.content_moderation')
      AND old_id <> new_id
  );

UPDATE system_settings
SET value_json = json_set(
  value_json,
  '$.aiBindings.user_profile_evaluation',
  (
    SELECT new_id
    FROM ai_model_merge_map
    WHERE old_id = json_extract(value_json, '$.aiBindings.user_profile_evaluation')
  )
)
WHERE key = 'system-settings'
  AND EXISTS (
    SELECT 1
    FROM ai_model_merge_map
    WHERE old_id = json_extract(value_json, '$.aiBindings.user_profile_evaluation')
      AND old_id <> new_id
  );

UPDATE ai_models
SET purposes_json = (
  SELECT json_group_array(DISTINCT purpose)
  FROM ai_models AS source
  WHERE source.provider_id = ai_models.provider_id
    AND source.model_name = ai_models.model_name
)
WHERE id IN (SELECT new_id FROM ai_model_merge_map);

DELETE FROM ai_models
WHERE id NOT IN (SELECT new_id FROM ai_model_merge_map);

DROP INDEX IF EXISTS ai_models_purpose_idx;

ALTER TABLE ai_models DROP COLUMN purpose;

CREATE UNIQUE INDEX IF NOT EXISTS ai_models_provider_model_unique_idx
  ON ai_models (provider_id, model_name);

CREATE INDEX IF NOT EXISTS ai_models_enabled_idx
  ON ai_models (is_enabled);

DROP TABLE ai_model_merge_map;
