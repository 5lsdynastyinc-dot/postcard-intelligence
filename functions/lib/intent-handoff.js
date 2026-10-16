import { isRecord, checkFields, checkTimes, checkEvidence } from "./record-validation.js";
import { EVIDENCE_CONFIDENCE, ATTRIBUTION_STRENGTHS } from "./distribution-events.js";
// POSTCARD contextual intent handoff contract v0.2
// Bound to the House shared outcome/attribution envelope.

export const HANDOFF_STATES=Object.freeze([
  "PROPOSED","CONSENT_REQUIRED","AUTHORIZED","ACCEPTED","DECLINED","COMPLETED","CANCELLED"
]);

export function validateIntentHandoff(h={}){
  if (!isRecord(h)) return {ok:false,errors:["handoff must be an object"]};
  const errors=[];
  checkFields(h,["handoff_id","source_unit","target_unit","intent_summary","created_at","state"],errors);
  checkTimes(h,["created_at","updated_at"],errors);
  checkEvidence(h,errors);
  if(h.personal_data_included!==undefined && typeof h.personal_data_included!=="boolean") errors.push("personal_data_included must be boolean");
  if(h.confidence!==undefined && !EVIDENCE_CONFIDENCE.includes(h.confidence)) errors.push("invalid confidence");
  if(h.attribution_strength!==undefined && !ATTRIBUTION_STRENGTHS.includes(h.attribution_strength)) errors.push("invalid attribution_strength");
  if(h.state && !HANDOFF_STATES.includes(h.state)) errors.push("invalid state");
  if(h.personal_data_included===true && !h.consent_reference) errors.push("personal data handoff requires consent_reference");
  if(["AUTHORIZED","ACCEPTED","COMPLETED"].includes(h.state) && !h.authority_reference) errors.push(h.state+" requires authority_reference");
  if(h.source_unit===h.target_unit) errors.push("handoff target must differ from source");
  return {ok:errors.length===0,errors};
}

export function toHouseHandoffEnvelope(h={}){
  const eventType=h.state==="ACCEPTED" ? "HANDOFF_ACCEPTED" : h.state==="PROPOSED" ? "HANDOFF_PROPOSED" : "OTHER";
  return {
    event_id:h.event_id || ("handoff:"+h.handoff_id+":"+h.state+":"+(h.updated_at||h.created_at)),
    correlation_id:h.correlation_id || h.handoff_id,
    distribution_id:h.distribution_id || null,
    source_unit:h.source_unit || "POSTCARD",
    source_record_id:h.content_id || null,
    event_type:eventType,
    occurred_at:h.updated_at || h.created_at,
    actor_class:h.actor_class || "AUDIENCE",
    channel:h.channel || "POSTCARD",
    target_unit:h.target_unit,
    consent_reference:h.consent_reference || null,
    authority_reference:h.authority_reference || null,
    evidence_reference:h.evidence_reference || null,
    transaction_reference:null,
    confidence:h.confidence || "REPORTED",
    attribution_strength:h.attribution_strength || "UNKNOWN",
    notes: "POSTCARD handoff state: "+h.state,
    metadata: {handoff_state:h.state}
  };
}

