CREATE TABLE IF NOT EXISTS content_moderation_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  source TEXT NOT NULL,
  target_id TEXT,
  categories TEXT NOT NULL,
  reason TEXT NOT NULL,
  content_preview TEXT NOT NULL,
  content_length INTEGER NOT NULL,
  model_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewer_id TEXT,
  review_note TEXT,
  reviewed_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS content_moderation_events_created_idx
  ON content_moderation_events (created_at);

CREATE INDEX IF NOT EXISTS content_moderation_events_user_idx
  ON content_moderation_events (user_id);

CREATE INDEX IF NOT EXISTS content_moderation_events_status_idx
  ON content_moderation_events (status);

CREATE INDEX IF NOT EXISTS content_moderation_events_source_idx
  ON content_moderation_events (source);
