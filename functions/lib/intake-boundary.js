// Caller references are intake pointers, not resolved evidence, consent or authority.
// Reconnect these operations only through the existing House resolvers.
export function intakeBlocker(kind, record) {
  if (kind === 'content' && record.evidence_state && record.evidence_state !== 'REPORTED') {
    return 'HOUSE_EVIDENCE_UNVERIFIED';
  }
  if (kind === 'distribution' && ['DISTRIBUTED', 'DELIVERED', 'HANDOFF_ACCEPTED'].includes(record.event_type)) {
    return 'HOUSE_ACTION_AUTHORITY_UNVERIFIED';
  }
  if (kind === 'handoff') {
    if (record.personal_data_included === true) return 'HOUSE_CONSENT_UNVERIFIED';
    if (['AUTHORIZED', 'ACCEPTED', 'COMPLETED'].includes(record.state)) return 'HOUSE_ACTION_AUTHORITY_UNVERIFIED';
  }
  if (record.confidence === 'OBSERVED' || ['DIRECT', 'ASSISTED'].includes(record.attribution_strength)) {
    return 'HOUSE_EVIDENCE_UNVERIFIED';
  }
  return null;
}

export function storageFailure(error) {
  // A retry must not overwrite an immutable record or create a second audit event.
  if (/UNIQUE constraint failed|PRIMARY KEY constraint failed/i.test(String(error?.message || ''))) {
    return {body: {ok: false, error: 'RECORD_ALREADY_EXISTS'}, status: 409};
  }
  return {body: {ok: false, error: 'STORAGE_OPERATION_FAILED'}, status: 500};
}
