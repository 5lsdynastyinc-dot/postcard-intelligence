// POSTCARD distribution/outcome event contract v0.2
// Implements the House shared distribution/outcome envelope while preserving
// POSTCARD content_id compatibility. Revenue remains authoritative in Revenue Pulse.

export const DISTRIBUTION_EVENT_TYPES = Object.freeze([
  "QUEUED","DISTRIBUTED","DELIVERED","VIEWED","SAVED","ENGAGED","RESPONSE","REQUEST",
  "INTENT_SIGNAL","HANDOFF_PROPOSED","HANDOFF_ACCEPTED","FOLLOW_UP","OFFER_PRESENTED",
  "CONVERSION_REPORTED","REPEAT","REFERRAL","CORRECTION","COMPLAINT","NO_RESPONSE","OTHER"
]);

export const ATTRIBUTION_STRENGTHS = Object.freeze(["DIRECT","ASSISTED","UNKNOWN"]);
export const EVIDENCE_CONFIDENCE = Object.freeze(["OBSERVED","REPORTED","INFERRED"]);

export function validateDistributionEvent(event = {}) {
  const errors = [];
  for (const k of ["event_id","content_id","event_type","occurred_at","channel"]) {
    if (event[k] === undefined || event[k] === null || event[k] === "") errors.push("missing: "+k);
  }
  if (event.event_type && !DISTRIBUTION_EVENT_TYPES.includes(event.event_type)) errors.push("invalid event_type");
  if (event.attribution_strength && !ATTRIBUTION_STRENGTHS.includes(event.attribution_strength)) errors.push("invalid attribution_strength");
  if (event.confidence && !EVIDENCE_CONFIDENCE.includes(event.confidence)) errors.push("invalid confidence");
  if (event.cash_received !== undefined) errors.push("cash belongs in House Revenue Pulse, referenced by transaction_id");
  if (event.event_type === "HANDOFF_PROPOSED" && !event.target_unit) errors.push("HANDOFF_PROPOSED requires target_unit");
  if (event.event_type === "HANDOFF_ACCEPTED" && !event.target_unit) errors.push("HANDOFF_ACCEPTED requires target_unit");
  if (event.transaction_id && event.event_type !== "CONVERSION_REPORTED" && event.event_type !== "REPEAT") {
    errors.push("transaction_id is only valid on conversion/repeat events");
  }
  return { ok: errors.length === 0, errors };
}

export function toHouseOutcomeEnvelope(event = {}) {
  return {
    event_id: event.event_id,
    correlation_id: event.correlation_id || null,
    distribution_id: event.distribution_id || null,
    source_unit: "POSTCARD",
    source_record_id: event.content_id,
    event_type: event.event_type,
    occurred_at: event.occurred_at,
    actor_class: event.actor_class || "ANONYMOUS",
    channel: event.channel,
    evidence_reference: event.evidence_reference || null,
    target_unit: event.target_unit || null,
    consent_reference: event.consent_reference || null,
    authority_reference: event.authority_reference || null,
    transaction_reference: event.transaction_id || null,
    confidence: event.confidence || "OBSERVED",
    attribution_strength: event.attribution_strength || "UNKNOWN"
  };
}
