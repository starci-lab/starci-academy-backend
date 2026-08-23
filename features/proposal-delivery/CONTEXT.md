# Proposal and document delivery

> Business identity: `tedo/proposal-delivery@51b9699c36c3a355048a3d1a7286e56711c7565e6b0e59500365605455603e62`
>
> Source heads: `fe@8c9f46e075dd`, `be@24b3dc4b0eda`
>
> Load this file first. Load only the modules named by the current task.

## Decision capsule

**Purpose.** TEDO confirms a complete project requirements revision, deterministically prices the scope or routes it to manual review, generates immutable brief/specification/proposal documents, and exposes those documents for download and internal visual preview.

**Primary actor.** Prospective buyer

**Primary outcome.** The buyer receives versioned downloadable project documents derived from one confirmed scope

**Never does.** Electronic signature and contract acceptance

## Invariants

- `BR-01` — Proposal generation requires a confirmed requirements revision and rejects incomplete scope.
- `BR-02` — Pricing first returns insufficient-scope when discovery is incomplete, otherwise uses an exact comparable match or a component estimate with a 15 percent reference ceiling; review reasons force manual-review.
- `BR-03` — Manual-review pricing cannot generate a proposal automatically.
- `BR-04` — Each generation persists a versioned draft proposal and immutable brief, requirements specification and proposal documents.
- `BR-05` — A document download succeeds only when the document id belongs to the requested project.

## Primary flow

```text
requirements-partial → proposal-pending → proposal-ready → proposal-ready
```

## Surface map

| Surface | Route | Owns | Module |
|---|---|---|---|
| `proposal-panel` | `/[locale]/chat/[conversationId]#proposal` | Confirm complete scope, generate the document set and download immutable files. | [surface](surfaces/proposal-panel.md) |
| `quote-preview` | `/[locale]/admin/bao-gia/preview` | Visually verify the real proposal template against long representative sample copy before PDF export. | [surface](surfaces/quote-preview.md) |

## Data and operation map

| Operation | Owner | Input | Result |
|---|---|---|---|
| `patchProjectRequirements` | backend | project id, requirements patch | recorded requirements revision |
| `confirmProjectRequirements` | backend | project id | confirmed project requirements snapshot |
| `estimateQuote` | backend | project scope fingerprint | estimate status and pricing evidence |
| `generateProjectProposal` | backend | project id | proposal and generated document summaries |
| `GET /v1/projects/:projectId/documents/:documentId/download` | backend | project id, document id | document content, file name and MIME type |

## Explicit unknowns

- `proposal-acceptance` — How does a buyer formally accept or reject a generated proposal? Impact: The implemented flow generates and downloads draft documents but defines no electronic acceptance operation.
- `preview-access-future` — What authorization must protect the quote preview if it begins reading live quotes? Impact: The current sample-only route explicitly has no auth yet and requires an admin password boundary if live data is introduced.

## LOADS

| Need | Read |
|---|---|
| Scope, terminology and exclusions | [overview.md](overview.md) |
| Actor permissions and ownership | [actors.md](actors.md) |
| One user journey | `flows/<flow-id>.md` |
| One renderable screen | `surfaces/<surface-id>.md` |
| Business invariants | [rules.md](rules.md) |
| State transitions | [states.md](states.md) |
| Entities, inputs, outputs and failures | [contracts.md](contracts.md) |
| Completion and regression proof | [acceptance.md](acceptance.md) |
| Machine rendering/query | [model.json](model.json) |
| Exact source provenance | [evidence.json](evidence.json) |

## Context rule

Do not load every module by default. `CONTEXT.md` plus the one flow or surface being changed is the normal prompt. `model.json` is authoritative for machines; Markdown files are generated projections. Unknowns remain unknown until routed source or an explicit owner decision resolves them.
