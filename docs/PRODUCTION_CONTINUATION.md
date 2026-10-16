# Production continuation — 16 October 2026

## Binding relationship
The House owns institutional records, shared provenance, identity, event routing,
authority, distribution and outcomes. Each room owns specialist interpretation,
safety, workflows and assigned authority. POSTCARD humanizes authorized intelligence,
publishes channel-appropriate views, senses demand and returns relevant intent.
Build shared services once; use existing House contracts. Do not create a second
truth store or assume all rooms share a physical runtime.

Full master mandate, three-block work graph, recovery references and readiness
evidence requirements are maintained in private Source at
`units/postcard/production95/`. Preserve institutional and audience confidentiality.

## Scope of this implementation patch
- Intake creates DRAFT/REVIEW_REQUIRED only. A server bearer credential is not
  exact-version editorial approval. Requests creating approved/published/corrected/
  retracted/archived content must use the future reconciled governed transition.
  This intentionally closes a prior bypass; it does not implement that transition.
- Input types/timestamps and evidence enums are checked; drafts may retain gaps.
- D1 content + creation event writes use an atomic batch.
- Missing observation confidence defaults to REPORTED, never OBSERVED.
- OBSERVED or direct/assisted attribution requires a referenced evidence artifact.
- Distribution and handoff persist the full mapped House envelope in existing
  metadata_json; no database migration or new House schema is introduced.
- Terminal handoff states map to existing OTHER vocabulary with their exact state
  retained; they cannot falsely become a new proposal. Authority applies to
  AUTHORIZED, ACCEPTED and COMPLETED; personal-data flags are boolean-validated.

References are audit pointers, not automatically verified proof. These adapters
still need connection to the actual authority/evidence resolver. The handoff API
remains insert-only: it does not establish destination acceptance or case execution.
No live claim verifier, edition orchestrator, room connector, subscriber service,
production migration or external distribution is activated by this patch.

## Three blocks
1. Reconcile/harden authoritative engine + publication adapter; verify persistence,
   authorization, original Rule 009 behavior, deployment and recovery.
2. Prove each launch room's audience/demand/source-to-edition chain, using existing
   gateways, Question Objects, Knowledge Objects, Studio and publication standards.
3. Release authorized real editions, prove channel delivery, reader continuation,
   specialist handoff, repeat operation and evidence-backed learning.

## UI protection
Preserve masthead, cream-paper/serif editorial system, Home/Briefings/Stories/Topics/
Places/My POSTCARD, continuous mobile reading and existing operating workspace.
Compare the strongest historical visual/spec/code before upgrades. Show the value;
hide the machinery. Follow/save/share/search/subscribe must either work or honestly
show their unavailable state. Images must retain origin/rights and cannot imply
documented projects, private stories or observed commercial outcomes.

## Readiness
95 is a target, not a self-awarded score. Use the unchanged House achievement model
and keep House Integration and Specialist Integrity separate. A launch checklist
and passing local CI are not the House maturity ledger. Record external provider
and human-evidence gaps explicitly; never seed fake audience events to close them.
