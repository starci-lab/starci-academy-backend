---
version: 1
project: nivo
role: fe
approvedBy: Cuong (owner)
approvedOn: 2026-08-20
expiresOn: 2026-11-18
reason: Temporary exact-SHA Sonar proof debt after the frontend spec-layout migration.
scopes: assurance:sonar, route:head
---

# Nivo frontend quality debt

## Baseline

- Revision `b9b30d48f480059f54449646b05e411e52b49413`.
- Project coverage is mature: statements/lines 94.92%, functions 93.51%, branches 89.26%.
- The previous strict Sonar pass predates this revision; current authenticated proof is unavailable.
- Lint, typecheck, build and operational E2E smoke pass.

## Why this debt is accepted

The remaining finding is current-revision provider proof after a test-layout-only migration.

## Exit criteria

- Scan the current revision or successor and pass the full strict Sonar profile.
- Refresh the routed workspace head to the accepted repair revision.

## Progress

- 2026-08-20: debt opened after all frontend unit files were migrated to colocated `.spec.` files.
