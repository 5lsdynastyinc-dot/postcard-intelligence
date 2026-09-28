// POSTCARD contextual intent handoff contract v0.1

export const HANDOFF_STATES=Object.freeze([
  "PROPOSED","CONSENT_REQUIRED","AUTHORIZED","ACCEPTED","DECLINED","COMPLETED","CANCELLED"
]);

export function validateIntentHandoff(h={}){
  const errors=[];
  for(const k of ["handoff_id","source_unit","target_unit","intent_summary","created_at","state"]){
    if(h[k]===undefined||h[k]===null||h[k]==="") errors.push("missing: "+k);
  }
  if(h.state && !HANDOFF_STATES.includes(h.state)) errors.push("invalid state");
  if(h.personal_data_included===true && !h.consent_reference) errors.push("personal data handoff requires consent_reference");
  if(h.state==="AUTHORIZED" && !h.authority_reference) errors.push("AUTHORIZED requires authority_reference");
  if(h.source_unit===h.target_unit) errors.push("handoff target must differ from source");
  return {ok:errors.length===0,errors};
}
