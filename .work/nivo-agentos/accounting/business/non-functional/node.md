---
{
  "schema": "work/node@1",
  "id": "nivo.accounting.business.non-functional",
  "kind": "business",
  "required": true,
  "state": "done",
  "refs": [
    "repo.nivo-backend",
    "repo.nivo-frontend"
  ],
  "assertions": [
    "accounting-nfr-integrity-approved",
    "accounting-nfr-recovery-approved",
    "accounting-nfr-accessibility-and-locale-approved"
  ],
  "completion": {
    "inputDigest": "9ed8b1337f4146299ff3a7a6887f5d285065c1b521204e7f0ba30073b4da697d",
    "evidence": [
      "nivo.accounting.business.non-functional.review-20260908"
    ]
  }
}
---
# Non-functional requirements

## Observed source

Backend `accounting.service.ts` uses installation-qualified authorization, parameterized SQL, serializable transactions with bounded retry for PostgreSQL serialization/deadlock errors, caller-scoped idempotency receipts, immutable context snapshots, bigint minor-unit strings, and currency-scoped ledger reads. Migration tests describe append-only and relational constraints. Frontend workbench code uses localized currency/month formatting, minimum-height native controls, live regions for feedback, and readback after accepted commands.

## Candidate intent

Turn these observations into owner-approved, measurable expectations for isolation, consistency under concurrency, idempotent recovery, exact money representation, accessibility, localization, and actionable error recovery. No latency, volume, retention, browser, viewport, or accessibility threshold is assumed by this import.

## Done when

Each required quality has an approved metric or observable criterion, a named validation layer, and an explicit treatment of failure and recovery.
