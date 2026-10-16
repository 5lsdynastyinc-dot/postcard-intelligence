import { isRecord, checkFields, checkTimes } from "./record-validation.js";
// POSTCARD durable content-state contract v0.1, with input hardening.
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
  if (!isRecord(record)) return { ok: false, errors: ["record must be an object"] };
  const errors = [];
  checkFields(record, ["id", "title", "state", "created_at"], errors);
  checkTimes(record, ["created_at", "updated_at", "published_at", "corrected_at"], errors);
  if (!Array.isArray(record.provenance)) errors.push("provenance must be an array");
  if (record.content !== undefined && !isRecord(record.content)) errors.push("content must be an object");
  if (record.evidence_state !== undefined && !POSTCARD_EVIDENCE_STATES.includes(record.evidence_state)) errors.push("invalid evidence_state");
  if (record.state && !POSTCARD_CONTENT_STATES.includes(record.state)) errors.push("invalid state");
  if (record.published_at && record.state === "DRAFT") errors.push("draft cannot have published_at");
  if (record.correction_of && record.state !== "CORRECTED") errors.push("correction_of requires CORRECTED state");
  return { ok: errors.length === 0, errors };
}

// This endpoint is intake only. Publishing requires a separate governed transition
// with evidence checks and exact-version authority; a bearer token is not approval.
export function validateContentIntake(record) {
  const check = validateContentRecord(record);
  if (check.ok && !["DRAFT", "REVIEW_REQUIRED"].includes(record.state)) {
    check.errors.push("intake cannot grant approval, publication or lifecycle transitions");
  }
  if (check.ok && (record.published_at || record.corrected_at || record.correction_of)) {
    check.errors.push("intake cannot claim publication or correction history");
  }
  check.ok = check.errors.length === 0;
  return check;
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

