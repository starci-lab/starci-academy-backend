# Proposal and document delivery

> Business head: `51b9699c36c3a355048a3d1a7286e56711c7565e6b0e59500365605455603e62`
>
> This document is generated from the immutable business model. Update the model through `starci-business-analyze`; do not hand-edit this view.

## 1. Overview

TEDO confirms a complete project requirements revision, deterministically prices the scope or routes it to manual review, generates immutable brief/specification/proposal documents, and exposes those documents for download and internal visual preview.

Included:
- Requirements patch and confirmation
- Deterministic commercial estimate
- Manual-review and insufficient-scope outcomes
- Proposal generation from a confirmed revision
- Immutable document download
- Internal sample quote preview

Excluded:
- Electronic signature and contract acceptance
- Editing live customer data from the preview route
- Payment collection

## 2. Source heads

| Role | Repository | Head |
|---|---|---|
| fe | https://github.com/starci-lab/tedo-landingpage.git | `8c9f46e075dd18c99bd749237818ab4e2ebd4152` |
| be | https://github.com/starci-lab/tedo-backend.git | `24b3dc4b0eda44638cff0b70888b8304af7814de` |

## 3. Actors and access

### Prospective buyer

- Complete and confirm project scope
- Request proposal generation
- Download generated documents
- Preview the proposal template with representative sample data

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`, `EV-008`, `EV-009`, `EV-010`

### TEDO platform

- Persist requirements revisions
- Price a confirmed scope
- Generate immutable brief, specification and proposal documents
- Stream a project-owned document

Evidence: `EV-004`, `EV-006`, `EV-007`, `EV-008`, `EV-010`

## 4. Entry points and surfaces

### Proposal documents

- ID: `proposal-panel`
- Route: `/[locale]/chat/[conversationId]#proposal`
- Purpose: Confirm complete scope, generate the document set and download immutable files.
- Regions: `proposal-generation`
- Navigation: none

Evidence: `EV-001`

### Quote template preview

- ID: `quote-preview`
- Route: `/[locale]/admin/bao-gia/preview`
- Purpose: Visually verify the real proposal template against long representative sample copy before PDF export.
- Regions: `preview-document`
- Navigation: none

Evidence: `EV-009`

## 5. Business flows

### Proposal and document delivery

Trigger: A consultation reaches complete project requirements and the buyer requests proposal documents.

1. **buyer** — Provide or amend required project scope fields → A new requirements revision is recorded
2. **buyer** — Confirm the current complete revision → The immutable scope snapshot becomes eligible for pricing
3. **platform** — Price the confirmed scope and generate the document set → Brief, requirements specification and commercial proposal links are returned
4. **buyer** — Open one generated document link → The immutable project-owned document is streamed

Outcomes:
- The buyer receives versioned downloadable project documents derived from one confirmed scope

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`, `EV-008`, `EV-009`, `EV-010`

## 6. Business rules

### BR-01

Proposal generation requires a confirmed requirements revision and rejects incomplete scope.

Strength: **confirmed** · Evidence: `EV-008`

### BR-02

Pricing first returns insufficient-scope when discovery is incomplete, otherwise uses an exact comparable match or a component estimate with a 15 percent reference ceiling; review reasons force manual-review.

Strength: **confirmed** · Evidence: `EV-007`

### BR-03

Manual-review pricing cannot generate a proposal automatically.

Strength: **confirmed** · Evidence: `EV-007`, `EV-008`

### BR-04

Each generation persists a versioned draft proposal and immutable brief, requirements specification and proposal documents.

Strength: **confirmed** · Evidence: `EV-008`

### BR-05

A document download succeeds only when the document id belongs to the requested project.

Strength: **confirmed** · Evidence: `EV-006`, `EV-008`

### BR-06

The quote preview is no-index, uses checked-in sample data and is not an editor or a live-customer-data surface.

Strength: **confirmed** · Evidence: `EV-009`

## 7. State model

- **Requirements incomplete** (`requirements-partial`, partial) → proposal-pending — `EV-002`, `EV-007`
- **Proposal generating** (`proposal-pending`, pending) → proposal-ready, proposal-manual-review, proposal-error — `EV-001`, `EV-003`, `EV-004`, `EV-008`
- **Proposal documents ready** (`proposal-ready`, success) → terminal — `EV-001`, `EV-004`, `EV-005`, `EV-006`, `EV-008`
- **Commercial review required** (`proposal-manual-review`, partial) → terminal — `EV-007`, `EV-008`
- **Proposal generation failed** (`proposal-error`, error) → proposal-pending — `EV-001`, `EV-003`, `EV-004`

## 8. Entities and data

- **Requirements revision**: project id, version, requirements, confirmedAt — `EV-002`, `EV-003`, `EV-008`
- **Commercial estimate**: status, currency, lines, subtotal, discount, total, range min/max, timeline min/max, missing fields, review reasons — `EV-007`, `EV-008`
- **Project proposal**: id, project id, version, draft status, estimate, lines, summary — `EV-004`, `EV-008`
- **Generated project document**: id, project id, kind, file name, MIME type, content, download URL — `EV-001`, `EV-005`, `EV-006`, `EV-008`

## 9. Operations and APIs

- **patchProjectRequirements** (mutation, backend) — input: project id, requirements patch; output: recorded requirements revision; failures: project missing, scope invalid — `EV-002`
- **confirmProjectRequirements** (mutation, backend) — input: project id; output: confirmed project requirements snapshot; failures: project missing, requirements incomplete — `EV-003`
- **estimateQuote** (query, backend) — input: project scope fingerprint; output: estimate status and pricing evidence; failures: scope invalid, insufficient scope, manual review — `EV-007`, `EV-010`
- **generateProjectProposal** (mutation, backend) — input: project id; output: proposal and generated document summaries; failures: requirements unconfirmed, requirements incomplete, commercial review required — `EV-004`, `EV-008`
- **GET /v1/projects/:projectId/documents/:documentId/download** (query, backend) — input: project id, document id; output: document content, file name and MIME type; failures: document missing or belongs to another project — `EV-006`, `EV-008`

## 10. Acceptance conditions

- **AC-01** The proposal panel confirms requirements before generation and exposes returned immutable document links only after a valid generated response. — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`
- **AC-02** Unconfirmed, incomplete or manual-review scopes cannot produce automatic proposal documents. — `EV-007`, `EV-008`
- **AC-03** Generated documents are versioned, project-owned and downloadable with their recorded filename and MIME type. — `EV-006`, `EV-008`
- **AC-04** The internal preview renders checked-in sample content, is no-index and does not read live client data. — `EV-009`

## 11. Explicit unknowns

- **How does a buyer formally accept or reject a generated proposal?** — The implemented flow generates and downloads draft documents but defines no electronic acceptance operation.
- **What authorization must protect the quote preview if it begins reading live quotes?** — The current sample-only route explicitly has no auth yet and requires an admin password boundary if live data is introduced.

## 12. Evidence index

| ID | Role | Source | Kind | Claim |
|---|---|---|---|---|
| EV-001 | fe | `src/components/consultation/proposal-actions.tsx:13` | ui | The proposal panel confirms requirements, generates documents, distinguishes idle/generating/ready/error and exposes immutable download links. |
| EV-002 | fe | `src/app/api/projects/[projectId]/confirm/route.ts:3` | api | The frontend project boundary validates project id and confirms the complete current requirements revision. |
| EV-003 | fe | `src/app/api/projects/[projectId]/proposals/route.ts:3` | api | The frontend project boundary validates project id and requests immutable requirements and proposal documents. |
| EV-004 | be | `src/features/api/graphql/projects/generate-project-proposal/generate-project-proposal.resolver.ts:1` | api | The GraphQL mutation generates a project proposal for a project id. |
| EV-005 | fe | `src/app/api/projects/[projectId]/documents/[documentId]/route.ts:3` | api | The frontend document route validates ids and streams the private backend response with content headers. |
| EV-006 | be | `src/features/api/http/projects/download-project-document/download-project-document.controller.ts:5` | api | The backend project document boundary streams a project-owned immutable document with recorded MIME type and filename. |
| EV-007 | be | `src/modules/pricing/commercial-price-engine.service.ts:25` | policy | The commercial engine evaluates completeness, comparable pricing, component lines, ranges and manual-review reasons. |
| EV-008 | be | `src/modules/proposal/proposal-generator.service.ts:88` | policy | Proposal generation requires confirmed complete priced scope, persists versioned draft and three immutable documents, and enforces project ownership on download. |
| EV-009 | fe | `src/app/[locale]/admin/bao-gia/preview/page.tsx:12` | ui | The no-index preview uses checked-in sample data, states it is not an editor or live-data route, and renders print guidance plus the proposal document. |
| EV-010 | be | `src/features/api/graphql/quote/estimate-quote/estimate-quote.resolver.ts:9` | api | The estimateQuote GraphQL query exposes deterministic project discovery and price matching with scope validation. |
