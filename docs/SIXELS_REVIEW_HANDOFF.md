# SIXELS review handoff — preparation only

Status: implementation prepared; human verification and all publication held.

## Problem and resulting behavior
SIXELS editorial drafts need a consistent private handoff for review before POSTCARD intake. The offline preparer produces a DRAFT / REPORTED record, a six-gate pending-review manifest and an escaped local HTML review. It uses the existing POSTCARD intake validator, trust boundary and exact-content hash. It cannot approve, publish, upload, send, schedule or call a network endpoint. No new database, authority registry or deployment workflow is added.

The input contains only source ID/version, title, summary, body, caption, POSTCARD introduction, named source URLs/scopes, and existing SIXELS editorial image URLs/alt text/credits. Unexpected fields are rejected, including caller approval flags and private operational fields. This structural check cannot detect personal or confidential information hidden inside prose: human privacy review remains required. Image rights, source support and factual currency are not certified by this tool.

## Use locally
From this repository, run:

```sh
node scripts/prepare-sixels-review.mjs /private/path/article-input.json /private/path/new-review-directory
```

The output directory must not already exist. It contains `review-bundle.json` and `review.html`. Open HTML locally for review; do not deploy it or commit real drafts to this public repository. The HTML references existing SIXELS images, so opening it can load those images from the SIXELS host. Source links open only when followed. Its noindex metadata is a precaution, not access control.

Required input shape (synthetic example, never a real release):

```json
{
  "source_id": "EXAMPLE-ONLY",
  "source_version": "draft-1",
  "title": "Example only",
  "summary": "Synthetic preparation fixture.",
  "body": "Not a public article.",
  "caption": "Example draft caption.",
  "postcard_intro": "Example draft introduction.",
  "images": [],
  "sources": [{"title":"Example source", "url":"https://example.invalid/reference", "scope":"Synthetic; not verified."}]
}
```

The existing public article reused as edition P02 retains its identity and distribution history. New P01 and proposed P03 revision stay private. Preparing P03 does not overwrite its original immutable inbox record. Queue capacity and existing editorial workflow still govern later staging.

## Identity and correction behavior
The record ID derives from POSTCARD's canonical content hash. Retrying unchanged content at a later preparation time produces the same identity. Text, introduction, caption, picture/credit, source/scope or upstream version changes produce a different hash and require fresh human verification. Source pointers and the hash identify submitted bytes; they do not prove evidence truth, source retrieval, role authority or approval. A future POSTCARD intake uses the existing endpoint and immutable duplicate handling; this tool performs no intake.

## Verification and release hold
All six checks start PENDING_HUMAN_VERIFICATION: content, evidence, editorial, brand, render and release. No approval fields, actor impersonation or publication timestamp are generated. A general instruction to continue work cannot clear these gates. Human review must identify the exact bundle hash and source version. Changing the bundle requires re-review. A recorded human review alone does not activate POSTCARD's missing House authority resolver.

The existing `/api/content-release` must remain fail-closed. Before future release, the actual approved House resolver implementation and identity must be recovered and connected, with role/room/scope, expiry/revocation, all six exact-version gates, atomic lifecycle/audit, concurrency and Rule 009 evidence. This preparation change does not implement or certify that resolver. Do not build an alternative registry or accept a request's `approved` flag.

## Validation and rollout
Run `node --test tests/sixels-review.test.mjs` plus the existing adapter suite. Added cases cover hold states, content-change identity, privacy/approval field rejection, unsafe URLs and HTML escaping. Local synthetic results are not proof of production integration or human approval. This change is prepared for review only; do not merge/deploy or stage/send real content until the applicable review is complete.

Compatibility: additive offline script/docs/test only; existing routes, database and UI unchanged. Rollback: remove these three files or revert their commits; there is no production data or migration to undo. No new service, package or paid resource is required.
