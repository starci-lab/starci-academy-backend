---
{
  "schema": "work/node@1",
  "id": "nivo.shared.business.acceptance",
  "kind": "business",
  "required": true,
  "dependsOn": [
    "nivo.shared.business.functional",
    "nivo.shared.business.nfr",
    "nivo.shared.business.rules"
  ],
  "refs": [
    "repo.nivo-backend",
    "repo.nivo-frontend"
  ],
  "assertions": [
    "shared-acceptance-approved"
  ],
  "state": "done",
  "completion": {
    "inputDigest": "dc123ec1bf53d585738472c3bcb9e0500f7c99eb0dd49baa0354340e57526401",
    "evidence": [
      "nivo.shared.business.acceptance.review-20260908"
    ]
  }
}
---
# Business acceptance boundary

## Candidate acceptance
Acceptance requires owner review of all lifecycle states, a safe retry/recovery story, exact Setup to Test to Apply/Rollback gates, an explicit catalogue/helpdesk retirement decision, and demonstrable isolation across at least two installations.

## Exclusions
Source test names, old UAT notes, screenshots and a green structural validator are not business approval.
