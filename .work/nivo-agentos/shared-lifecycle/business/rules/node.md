---
{
  "schema": "work/node@1",
  "id": "nivo.shared.business.rules",
  "kind": "business",
  "required": true,
  "refs": [
    "repo.nivo-backend",
    "repo.nivo-frontend"
  ],
  "assertions": [
    "shared-rules-reviewed"
  ],
  "state": "done",
  "completion": {
    "inputDigest": "0949a4b694ec7e49464bf04d00eabd80e76b67c122d43e23918d7565e68333e9",
    "evidence": [
      "nivo.shared.business.rules.review-20260908"
    ]
  }
}
---
# Business rules

## Candidate rules
- One logical install request is identified by workspace, actor, operation and idempotency key; a changed payload on the same key is refused.
- Apply and rollback must use an eligible context and exact authority/source/retrieval generations; a stale or failed test cannot authorize activation.
- A failure or retry must not mutate an unrelated installation or erase the previously active context.
- Legacy catalogue/helpdesk retirement is an explicit acceptance item, not inferred from renaming a route or fixture.

## Done when
The owner accepts or amends each rule and resolves the meaning of retirement.
