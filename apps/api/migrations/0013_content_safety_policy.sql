ALTER TABLE content_moderation_events
ADD COLUMN decision TEXT NOT NULL DEFAULT 'blocked';

ALTER TABLE content_moderation_events
ADD COLUMN highest_severity TEXT NOT NULL DEFAULT 'medium';

ALTER TABLE content_moderation_events
ADD COLUMN findings_json TEXT NOT NULL DEFAULT '[]';

ALTER TABLE content_moderation_events
ADD COLUMN policy_version TEXT;

ALTER TABLE content_moderation_events
ADD COLUMN policy_snapshot_json TEXT NOT NULL DEFAULT '{}';

ALTER TABLE content_moderation_events
ADD COLUMN rule_source TEXT NOT NULL DEFAULT 'ai_model';

CREATE INDEX IF NOT EXISTS content_moderation_events_decision_idx
  ON content_moderation_events (decision);

CREATE INDEX IF NOT EXISTS content_moderation_events_severity_idx
  ON content_moderation_events (highest_severity);
