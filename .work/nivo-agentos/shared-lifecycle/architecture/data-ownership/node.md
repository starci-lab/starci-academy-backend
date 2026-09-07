---
{
  "schema": "work/node@1",
  "id": "nivo.shared.architecture.data-ownership",
  "kind": "architecture",
  "required": true,
  "dependsOn": [
    "nivo.shared.business.acceptance"
  ],
  "refs": [
    "repo.nivo-backend"
  ],
  "assertions": [
    "shared-data-ownership-reviewed"
  ],
  "state": "done",
  "completion": {
    "inputDigest": "934407b0a6b7d34219d452daaf98e56ef2e63ce3f8810c5eac0df5886104be69",
    "evidence": [
      "nivo.shared.architecture.data-ownership.review-20260908"
    ]
  }
}
---
# Data ownership

## Observed source
PostgreSQL entities own installation identity, status, desired/applied digests, setup generations and active context; Studio services own setup sessions, immutable context versions, test runs and projected operations. External runtime work is dispatched through jobs/outboxes rather than owned by the UI.

## Candidate decision
The backend is authoritative; the frontend holds only transient selections, drafts and pending/refusal feedback. Each mutable record is installation- and workspace-scoped.

## Done when
Persistence owners, retention, recovery and isolation invariants are reviewed against schemas and migrations.
