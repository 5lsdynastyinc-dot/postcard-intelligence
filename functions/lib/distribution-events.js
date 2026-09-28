// POSTCARD distribution/outcome event contract v0.1
// Records external movement and response without treating exposure as outcome.

export const DISTRIBUTION_EVENT_TYPES = Object.freeze([
  "QUEUED","DISTRIBUTED","DELIVERED","VIEWED","ENGAGED","INTENT_SIGNAL","HANDOFF","OUTCOME_REPORTED"
]);

export const OUTCOME_TYPES = Object.freeze([
  "NO_RESPONSE","RESPONSE","REQUEST","FOLLOW_UP","HANDOFF_ACCEPTED","CONVERSION","REPEAT","REFERRAL","OTHER"
]);

export function validateDistributionEvent(event = {}) {
  const errors = [];
  for (const k of ["event_id","content_id","event_type","occurred_at","channel"]) {
    if (event[k] === undefined || event[k] === null || event[k] === "") errors.push("missing: "+k);
  }
  if (event.event_type && !DISTRIBUTION_EVENT_TYPES.includes(event.event_type)) errors.push("invalid event_type");
  if (event.outcome_type && !OUTCOME_TYPES.includes(event.outcome_type)) errors.push("invalid outcome_type");
  if (event.cash_received !== undefined) errors.push("cash belongs in House Revenue Pulse, referenced by transaction_id");
  if (event.event_type === "HANDOFF" && !event.target_unit) errors.push("HANDOFF requires target_unit");
  return { ok: errors.length === 0, errors };
}
