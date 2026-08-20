---
version: 1
project: tedo
role: fe
approvedBy: Cuong (owner)
approvedOn: 2026-08-20
expiresOn: 2026-11-18
reason: Temporary exact-SHA Sonar proof debt after frontend canon migration.
scopes: assurance:sonar, route:head
---

# Tedo frontend quality debt

## Baseline

- Revision `bcf8f25c6ab760d275a7fc6a8079f1e771f24b4a`.
- Lint and the operational frontend E2E smoke pass.
- The previous strict Sonar pass predates this revision; current authenticated proof is unavailable.

## Why this debt is accepted

Only current-revision provider proof remains in scope for this temporary record.

## Exit criteria

- Pass the complete exact-SHA strict Sonar profile.
- Refresh the routed workspace head to the accepted repair revision.

## Progress

- 2026-08-20: debt opened after frontend canon migration.
