-- Exact-version publication authority. Apply after 0001_postcard_content.sql.
-- Existing content storage remains unchanged. The release handler derives the
-- version from the immutable creation identity and hashes the stored editorial
-- payload, so rollout of this migration cannot break current intake.

CREATE TABLE IF NOT EXISTS postcard_release_authorizations (
  authorization_id TEXT PRIMARY KEY,
  content_id TEXT NOT NULL,
  content_version TEXT NOT NULL,
  content_hash TEXT NOT NULL CHECK(length(content_hash)=64),
  approved_by TEXT NOT NULL,
  authority_reference TEXT NOT NULL,
  scope TEXT NOT NULL,
  decision TEXT NOT NULL CHECK(decision IN ('APPROVED','DENIED','REVOKED')),
  decided_at TEXT NOT NULL,
  expires_at TEXT,
  revoked_at TEXT,
  evidence_json TEXT NOT NULL DEFAULT '[]',
  note TEXT,
  FOREIGN KEY(content_id) REFERENCES postcard_content(id)
);

CREATE INDEX IF NOT EXISTS idx_postcard_release_exact_version
  ON postcard_release_authorizations(content_id,content_version,content_hash,decision);

-- Existing records need an explicit review receipt before governed publication.

