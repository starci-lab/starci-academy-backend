# Contracts · Proposal and document delivery

## Entity · Requirements revision (`requirements-revision`)

Fields: `project id`, `version`, `requirements`, `confirmedAt`

Evidence: `EV-002`, `EV-003`, `EV-008`

## Entity · Commercial estimate (`commercial-estimate`)

Fields: `status`, `currency`, `lines`, `subtotal`, `discount`, `total`, `range min/max`, `timeline min/max`, `missing fields`, `review reasons`

Evidence: `EV-007`, `EV-008`

## Entity · Project proposal (`project-proposal`)

Fields: `id`, `project id`, `version`, `draft status`, `estimate`, `lines`, `summary`

Evidence: `EV-004`, `EV-008`

## Entity · Generated project document (`generated-document`)

Fields: `id`, `project id`, `kind`, `file name`, `MIME type`, `content`, `download URL`

Evidence: `EV-001`, `EV-005`, `EV-006`, `EV-008`

## Operation · patchProjectRequirements

- Kind/owner: `mutation` / `backend`
- Inputs: project id, requirements patch
- Outputs: recorded requirements revision
- Failures: project missing, scope invalid
- Evidence: `EV-002`

## Operation · confirmProjectRequirements

- Kind/owner: `mutation` / `backend`
- Inputs: project id
- Outputs: confirmed project requirements snapshot
- Failures: project missing, requirements incomplete
- Evidence: `EV-003`

## Operation · estimateQuote

- Kind/owner: `query` / `backend`
- Inputs: project scope fingerprint
- Outputs: estimate status and pricing evidence
- Failures: scope invalid, insufficient scope, manual review
- Evidence: `EV-007`, `EV-010`

## Operation · generateProjectProposal

- Kind/owner: `mutation` / `backend`
- Inputs: project id
- Outputs: proposal and generated document summaries
- Failures: requirements unconfirmed, requirements incomplete, commercial review required
- Evidence: `EV-004`, `EV-008`

## Operation · GET /v1/projects/:projectId/documents/:documentId/download

- Kind/owner: `query` / `backend`
- Inputs: project id, document id
- Outputs: document content, file name and MIME type
- Failures: document missing or belongs to another project
- Evidence: `EV-006`, `EV-008`

No field, failure or operation may appear here without routed source evidence.
