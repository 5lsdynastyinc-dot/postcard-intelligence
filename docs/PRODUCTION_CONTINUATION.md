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

Release decisions are currently fail-closed: authenticated, well-formed requests
return HTTP 503 HOUSE_RELEASE_AUTHORITY_UNVERIFIED without reading or writing D1.
Review found that caller-supplied actor/authority references and a shared bearer
credential cannot establish delegated House authority. The incomplete transition
has been removed; a payload flag or configuration toggle cannot enable it.
The canonical content SHA-256 utility and additive migration remain preparation
artifacts, not an activated publication capability.

To reconnect, verify the existing House authority resolver, role/room/scope,
expiry and revocation, then bind all six House gate decisions to the exact content
and evidence versions. Use server time, atomic compare-and-set plus audit, check
concurrent updates, and prove that revoked/expired/superseded approval cannot be
reused. Rule 009 must invalidate all affected outputs. Do not create an alternative
authority registry or treat an approval reference as resolved proof.

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

## 17 October intake trust repair

Until the existing House resolvers are connected, intake also rejects caller-claimed
verification, observed confidence, direct/assisted attribution, completed delivery,
authorized/accepted/completed handoffs and personal-data handoffs. References and
payload approval flags cannot open these gates. DRAFT/REVIEW_REQUIRED content with
REPORTED evidence, reported/inferred outcomes with UNKNOWN attribution, and
non-personal proposed handoffs remain available to authenticated callers.

Duplicate immutable IDs return 409 without overwriting content or duplicating audit.
Storage failures expose stable error codes rather than provider messages. File-backed
SQLite tests exercise restart persistence, audit failure rollback, duplicate conflict,
foreign keys and authenticated read/write boundaries. These local tests do not claim
production API credential pairing or House service integration.

Transport compatibility: the server can use the existing encrypted binding named
`POSTCARD_ADMIN_KEY ` (including its historical trailing space) when the canonical
`POSTCARD_API_TOKEN` is absent. This reconnects the existing operator credential
without exposing or copying its value. An explicitly configured canonical token,
including an empty value used to disable transport, always overrides the legacy
binding. Rotate by setting the canonical secret and updating authorized callers;
then remove the legacy setting after caller verification. This credential permits
reported intake only; it does not resolve House role, consent, evidence or release.
