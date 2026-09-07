---
{
  "schema": "work/node@1",
  "id": "nivo.shared.architecture.api-events",
  "kind": "architecture",
  "required": true,
  "dependsOn": [
    "nivo.shared.business.acceptance"
  ],
  "refs": [
    "repo.nivo-backend",
    "repo.nivo-frontend"
  ],
  "assertions": [
    "shared-api-events-reviewed"
  ],
  "state": "done",
  "completion": {
    "inputDigest": "9d15d6fac1a60f210949394c7121336c23cb2036ed1e5def630c0446a13b0ba5",
    "evidence": [
      "nivo.shared.architecture.api-events.review-20260908"
    ]
  }
}
---
# API and event contracts

## Observed source
GraphQL exposes installation, runtime, setup-management and module-test operations keyed by workspace/installation IDs and idempotency keys. Backend setup projection consumes exact Apply or rollback events idempotently; runtime/test reads carry setup/context digests and generation bindings.

## Candidate contract
Clients must distinguish accepted, pending, refused and stale results; retries reuse the logical request key; Apply/Rollback and tests bind exact context/generation identity.

## Done when
Input/output/error/event compatibility and ownership are reviewed end to end.
