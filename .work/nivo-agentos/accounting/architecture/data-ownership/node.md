---
{
  "schema": "work/node@1",
  "id": "nivo.accounting.architecture.data-ownership",
  "kind": "architecture",
  "required": true,
  "state": "done",
  "refs": [
    "repo.nivo-backend"
  ],
  "assertions": [
    "accounting-data-owner-approved",
    "accounting-installation-isolation-approved",
    "accounting-data-integrity-boundaries-approved"
  ],
  "completion": {
    "inputDigest": "ab294139b0113f9eebb4f9ffab83642e0f78fa8d0cdb3f4e7664f74c5b251fa3",
    "evidence": [
      "nivo.accounting.architecture.data-ownership.review-20260908"
    ]
  }
}
---
# Data ownership and isolation

## Observed source

At backend commit `51248f75e0bf1c36a088afb57a04b2d7440a62c4`, `accounting.service.ts` describes itself as the sole transactional owner of installation-qualified Accounting state. The service reads the catalog owner and Accounting workspace inside the transaction, uses an installation-scoped ledger high-water, and stores documents with the applied context version, digest, and snapshot. `1799187300000-agentos-accounting.ts` defines Accounting-owned workspace, setup projection, document, ledger, correction, reconciliation, period, event, and idempotency stores with installation-qualified constraints.

## Candidate decision

Confirm the Accounting service/database boundary as canonical, identify owners for source evidence and retention, and specify isolation at installation, workspace, actor, currency, and as-of ledger version. Decide how two installations are proven isolated and how ownership drift is handled operationally.

## Done when

An architecture owner approves the data owners, transaction boundaries, isolation keys, immutable/append-only records, retention expectations, and prohibited cross-install reads/writes.
