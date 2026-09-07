---
{
  "schema": "work/node@1",
  "id": "nivo.accounting.architecture.api-events",
  "kind": "architecture",
  "required": true,
  "state": "done",
  "refs": [
    "repo.nivo-backend",
    "repo.nivo-frontend"
  ],
  "assertions": [
    "accounting-graphql-contract-approved",
    "accounting-event-and-idempotency-contract-approved",
    "accounting-readback-contract-approved"
  ],
  "completion": {
    "inputDigest": "31fc82253a5d860402e79814cdc547379f0e260b86a9ec24736d8c82c4974b8b",
    "evidence": [
      "nivo.accounting.architecture.api-events.review-20260908"
    ]
  }
}
---
# API, events, and readback

## Observed source

Backend `accounting.mutation.resolver.ts` exposes nine guarded mutations and derives `userId` from the authenticated Keycloak principal rather than client input. `accounting.query.resolver.ts` exposes guarded applied-context and workbench queries. `accounting.service.ts` stores operation events and actor-scoped idempotency receipts in the same transaction as command effects. Frontend `modules/api/accounting.ts` mirrors those operations and narrows raw relational rows; SWR hooks key current/historical reads by installation, currency, and ledger version and invalidate current reads after accepted commands.

## Candidate decision

Approve the public GraphQL shapes, authorization/error semantics, event and receipt ownership, idempotency lifetime, version compatibility, and required read-after-write behavior. Distinguish advisory viewer capabilities from transactional authorization.

## Done when

The architecture review fixes operation/query names, identity derivation, versioning, error/non-enumeration behavior, event semantics, idempotency rules, and readback guarantees with explicit owners.
