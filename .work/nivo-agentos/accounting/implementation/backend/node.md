---
{
  "schema": "work/node@1",
  "id": "nivo.accounting.implementation.backend",
  "kind": "implementation",
  "required": true,
  "state": "done",
  "dependsOn": [
    "nivo.shared.implementation.backend"
  ],
  "refs": [
    "repo.nivo-backend"
  ],
  "assertions": [
    "accounting-backend-setup-contract-implemented",
    "accounting-backend-document-ledger-flow-implemented",
    "accounting-backend-correction-reconciliation-flow-implemented",
    "accounting-backend-installation-isolation-verified"
  ],
  "completion": {
    "inputDigest": "19d8501cc581495fb7ae52e738b20e7f4c8a824798d94abd80682c88c6034ae5",
    "evidence": [
      "nivo.accounting.implementation.backend.review-20260908"
    ],
    "codeRefs": [
      {
        "repository": "repo.nivo-backend",
        "commit": "51248f75e0bf1c36a088afb57a04b2d7440a62c4"
      }
    ]
  }
}
---
# Backend implementation

## Observed source

Backend HEAD is `51248f75e0bf1c36a088afb57a04b2d7440a62c4`. The Accounting directory contains the versioned setup definition/provider, transactional service, types, Nest module, migration specs, unit specs, and a PostgreSQL 16 container spec. The GraphQL boundary contains guarded mutation/query modules and typed inputs/outputs. The focused tests were inspected but not executed by this migration authoring step.

## Candidate delivery

Verify the implementation against approved business and architecture nodes, including exact Shared setup/test/apply integration, authorization, transaction/idempotency behavior, document/posting/period rules, correction/reconciliation/as-of behavior, and explicit two-install isolation. Bind any completion to the exact repository commit and passing evidence; do not use source file existence as proof.

## Done when

The approved backend assertions pass in the actual supported test environment, changed-path review confirms the owned scope, and completion references the full backend commit and durable evidence.
