import { validateContentRecord } from "./content-state.js";

export function runContentStateContractTests() {
  const cases = [
    {
      name: "valid draft",
      expected: true,
      record: { id: "PC-T1", title: "Test", state: "DRAFT", created_at: "2026-09-28T00:00:00Z", provenance: [] }
    },
    {
      name: "missing provenance",
      expected: false,
      record: { id: "PC-T2", title: "Test", state: "DRAFT", created_at: "2026-09-28T00:00:00Z" }
    },
    {
      name: "draft cannot claim publication",
      expected: false,
      record: { id: "PC-T3", title: "Test", state: "DRAFT", created_at: "2026-09-28T00:00:00Z", published_at: "2026-09-28T01:00:00Z", provenance: [] }
    },
    {
      name: "correction link requires corrected state",
      expected: false,
      record: { id: "PC-T4", title: "Test", state: "PUBLISHED", created_at: "2026-09-28T00:00:00Z", correction_of: "PC-OLD", provenance: [] }
    }
  ];
  const results = cases.map(c => ({ name: c.name, expected: c.expected, actual: validateContentRecord(c.record).ok }));
  return { ok: results.every(r => r.expected === r.actual), results };
}
