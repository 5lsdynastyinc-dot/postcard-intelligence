// Local adapter validation, not a new shared House schema or evidence verifier.
export const isRecord = value => value !== null && typeof value === "object" && !Array.isArray(value);
export const nonempty = value => typeof value === "string" && value.trim().length > 0;
export function isTimestamp(value) {
  if (!nonempty(value) || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value))) return false;
  const [year,month,day] = value.slice(0,10).split('-').map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31,leap?29:28,31,30,31,30,31,31,30,31,30,31];
  return month >= 1 && month <= 12 && day >= 1 && day <= days[month-1] && Number(value.slice(11,13))<24;
}
export const hasEvidence = value => nonempty(value.evidence_reference) || (Array.isArray(value.evidence) && value.evidence.some(nonempty));
export function checkFields(value, fields, errors) {
  for (const key of fields) if (!nonempty(value[key])) errors.push("missing or invalid: " + key);
}
export function checkTimes(value, fields, errors) {
  for (const key of fields) if (value[key] !== undefined && value[key] !== null && !isTimestamp(value[key])) errors.push("invalid timestamp: " + key);
}
export function checkEvidence(value, errors) {
  if (value.evidence !== undefined && (!Array.isArray(value.evidence) || !value.evidence.every(nonempty))) errors.push("evidence must be an array of references");
  if (value.metadata !== undefined && !isRecord(value.metadata)) errors.push("metadata must be an object");
  if (value.confidence === "OBSERVED" && !hasEvidence(value)) errors.push("OBSERVED requires an evidence reference");
  if (["DIRECT", "ASSISTED"].includes(value.attribution_strength) && !hasEvidence(value)) errors.push("attribution requires evidence");
}
