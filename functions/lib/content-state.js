// POSTCARD durable content-state contract v0.1
// This module defines truth states only. It does not claim D1 persistence exists yet.

export const POSTCARD_CONTENT_STATES = Object.freeze([
  "DRAFT",
  "REVIEW_REQUIRED",
  "APPROVED",
  "PUBLISHED",
  "CORRECTED",
  "RETRACTED",
  "ARCHIVED"
]);

export const POSTCARD_EVIDENCE_STATES = Object.freeze([
  "REPORTED",
  "OBSERVED",
  "VERIFIED",
  "CONTESTED",
  "SUPERSEDED"
]);

export function validateContentRecord(record = {}) {
  const required = ["id", "title", "state", "created_at", "provenance"];
  const missing = required.filter((key) => record[key] === undefined || record[key] === null || record[key] === "");
  const errors = [];
  if (missing.length) errors.push("missing: " + missing.join(", "));
  if (record.state && !POSTCARD_CONTENT_STATES.includes(record.state)) errors.push("invalid state");
  if (record.published_at && record.state === "DRAFT") errors.push("draft cannot have published_at");
  if (record.correction_of && record.state !== "CORRECTED") errors.push("correction_of requires CORRECTED state");
  return { ok: errors.length === 0, errors };
}

export const contentRecordExample = Object.freeze({
  id: "EXAMPLE-NOT-REAL",
  title: "Example only",
  state: "DRAFT",
  created_at: "2026-09-28T00:00:00Z",
  updated_at: null,
  published_at: null,
  corrected_at: null,
  correction_of: null,
  provenance: [],
  evidence_state: "REPORTED",
  source_unit: "POSTCARD",
  distribution: [],
  outcome_events: []
});
