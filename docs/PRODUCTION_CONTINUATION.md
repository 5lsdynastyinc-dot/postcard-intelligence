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
  retracted/archived content must use the governed release transition.
  This intentionally closes the prior intake bypass.
- Input types/timestamps and evidence enums are checked; drafts may retain gaps.
- D1 content + creation event writes use an atomic batch.
- Missing observation confidence defaults to REPORTED, never OBSERVED.
- OBSERVED or direct/assisted attribution requires a referenced evidence artifact.
- Distribution and handoff persist the full mapped House envelope in existing
  metadata_json; the event contracts are not replaced.
- Terminal handoff states map to existing OTHER vocabulary with their exact state
  retained; they cannot falsely become a new proposal. Authority applies to
  AUTHORIZED, ACCEPTED and COMPLETED; personal-data flags are boolean-validated.

References are audit pointers, not automatically verified proof. These adapters
still need connection to the actual authority/evidence resolver. The handoff API
remains insert-only: it does not establish destination acceptance or case execution.
No live claim verifier, edition orchestrator, room connector, subscriber service,
production migration or external distribution is activated by this patch.

Exact-version release is handled separately from intake. The release transition
requires the immutable creation version and SHA-256 identity, applicable authority reference,
actor and decision time. Publication additionally requires an active approval for
the same version and hash. Existing records require an explicit review before
release. Migration `0002_exact_version_release.sql` adds this audit
record without relocating specialist Knowledge Objects into the publication store.

Deployment uses the repository's connected Cloudflare Pages Git integration. Do
not add a second Wrangler deployment workflow without configured credentials and
a migration/runbook decision. The provider check must identify the deployed commit;
database migration and health evidence remain separate release gates.

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
