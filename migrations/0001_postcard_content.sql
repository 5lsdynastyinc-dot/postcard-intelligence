-- POSTCARD durable content persistence migration v0.1
-- Additive only. Does not alter existing tables or views.
-- Designed for Cloudflare D1 / SQLite.

CREATE TABLE IF NOT EXISTS postcard_content (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('DRAFT','REVIEW_REQUIRED','APPROVED','PUBLISHED','CORRECTED','RETRACTED','ARCHIVED')),
  source_unit TEXT NOT NULL DEFAULT 'POSTCARD',
  evidence_state TEXT NOT NULL DEFAULT 'REPORTED' CHECK (evidence_state IN ('REPORTED','OBSERVED','VERIFIED','CONTESTED','SUPERSEDED')),
  created_at TEXT NOT NULL,
  updated_at TEXT,
  published_at TEXT,
  corrected_at TEXT,
  correction_of TEXT,
  provenance_json TEXT NOT NULL DEFAULT '[]',
  content_json TEXT NOT NULL DEFAULT '{}',
  FOREIGN KEY (correction_of) REFERENCES postcard_content(id)
);

CREATE INDEX IF NOT EXISTS idx_postcard_content_state ON postcard_content(state);
CREATE INDEX IF NOT EXISTS idx_postcard_content_created_at ON postcard_content(created_at);

CREATE TABLE IF NOT EXISTS postcard_content_events (
  event_id TEXT PRIMARY KEY,
  content_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  from_state TEXT,
  to_state TEXT,
  actor TEXT,
  occurred_at TEXT NOT NULL,
  evidence_json TEXT NOT NULL DEFAULT '[]',
  note TEXT,
  FOREIGN KEY (content_id) REFERENCES postcard_content(id)
);

CREATE INDEX IF NOT EXISTS idx_postcard_content_events_content ON postcard_content_events(content_id);
CREATE INDEX IF NOT EXISTS idx_postcard_content_events_time ON postcard_content_events(occurred_at);


CREATE TABLE IF NOT EXISTS postcard_distribution_events (
  event_id TEXT PRIMARY KEY,
  content_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  channel TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  audience_reference TEXT,
  outcome_type TEXT,
  target_unit TEXT,
  transaction_id TEXT,
  evidence_json TEXT NOT NULL DEFAULT '[]',
  metadata_json TEXT NOT NULL DEFAULT '{}',
  FOREIGN KEY (content_id) REFERENCES postcard_content(id)
);

CREATE INDEX IF NOT EXISTS idx_postcard_distribution_content ON postcard_distribution_events(content_id);
CREATE INDEX IF NOT EXISTS idx_postcard_distribution_time ON postcard_distribution_events(occurred_at);
CREATE INDEX IF NOT EXISTS idx_postcard_distribution_channel ON postcard_distribution_events(channel);
