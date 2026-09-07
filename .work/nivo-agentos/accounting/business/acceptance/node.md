---
{
  "schema": "work/node@1",
  "id": "nivo.accounting.business.acceptance",
  "kind": "business",
  "required": true,
  "state": "done",
  "dependsOn": [
    "nivo.accounting.business.functional",
    "nivo.accounting.business.non-functional",
    "nivo.accounting.business.rules"
  ],
  "refs": [
    "repo.nivo-backend",
    "repo.nivo-frontend"
  ],
  "assertions": [
    "accounting-acceptance-flows-approved",
    "accounting-acceptance-negative-cases-approved",
    "accounting-acceptance-fixture-policy-approved"
  ],
  "completion": {
    "inputDigest": "e6cde43d95956954bb7d62a43f5cffa975fa1243f6704e6ce18b211629a71780",
    "evidence": [
      "nivo.accounting.business.acceptance.review-20260908"
    ]
  }
}
---
# Acceptance model

## Observed source

Backend specs contain unit and PostgreSQL-container scenarios for setup validation, authorization, request replay, document lifecycle, reconciliation, correction concurrency, period locking, and as-of reads. Frontend specs exercise workbench rendering, command dispatch, disabled states, refusal/retry messaging, file reading, localized amount conversion, and post-command readback. Test-file presence and assertions are observations, not current execution proof or browser acceptance.

## Candidate intent

Approve four acceptance flow groups: setup → exact test → apply; document submit → distinct approval → post → period close; correction proposal → distinct approval → reconciliation → reload; and two-installation isolation. Each flow must name owner/approver actors, fixture namespace, expected readback, negative checks, and applicable UI/UX observations.

## Done when

The flow inventory, actor split, data preconditions, expected state transitions, negative cases, and two-install isolation expectations are approved without claiming a run has occurred.
