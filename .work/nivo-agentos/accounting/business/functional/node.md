---
{
  "schema": "work/node@1",
  "id": "nivo.accounting.business.functional",
  "kind": "business",
  "required": true,
  "state": "done",
  "refs": [
    "repo.nivo-backend",
    "repo.nivo-frontend"
  ],
  "assertions": [
    "accounting-functional-scope-approved",
    "accounting-functional-exclusions-approved"
  ],
  "completion": {
    "inputDigest": "22e0d6dea7d0fbe46fabec977bda9e759061bf76176555027c52e554ebc9acc3",
    "evidence": [
      "nivo.accounting.business.functional.review-20260908"
    ]
  }
}
---
# Functional scope

## Observed source

At backend commit `51248f75e0bf1c36a088afb57a04b2d7440a62c4`, `accounting.setup-definition.ts` publishes ten setup requirements and one `payables-review` acceptance scenario. `accounting.service.ts` exposes initialization, applied-context read, evidence-document intake, submit, distinct approval, posting, reconciliation, period close, correction submit/approval, and an as-of workbench read. At frontend commit `f234d1abe6dd8f59fa4031959f8c55934e8997b0`, `AccountingWorkbenchBlock/component.tsx` renders controls for those workbench operations.

## Candidate intent

Review whether the supported product journey should include: preparing and applying Accounting setup, establishing a separate approver, ingesting classified evidence, advancing a document through review and posting, closing a period, recording a reconciliation, proposing and approving a later-period correction, and reading current or historical ledger state. Confirm explicit exclusions instead of inferring them from missing code.

## Done when

The product owner has approved the included actor journeys and explicit exclusions, with each behavior traceable to an observable acceptance flow rather than merely to a source method.
