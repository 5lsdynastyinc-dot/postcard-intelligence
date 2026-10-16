// Deterministic identity for the exact editorial payload being reviewed.
// The hash covers reader-visible content and its evidence pointers. Runtime
// timestamps and lifecycle state are intentionally outside the identity.
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
  }
  return value;
}

export function canonicalContent(record) {
  return JSON.stringify(stable({
    title: record.title,
    source_unit: record.source_unit || "POSTCARD",
    evidence_state: record.evidence_state || "REPORTED",
    provenance: record.provenance || [],
    content: record.content || {}
  }));
}

export async function contentHash(record) {
  const bytes = new TextEncoder().encode(canonicalContent(record));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, "0")).join("");
}

