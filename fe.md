---
version: 1
project: miamia
role: fe
approvedBy: Cuong (owner)
approvedOn: 2026-08-20
expiresOn: 2026-11-18
reason: Temporary external Sonar authority debt; frontend project and patch coverage are mature.
scopes: assurance:sonar, route:head
---

# MiAmia frontend quality debt

## Baseline

- Revision `521c5444a119b179beafb3a8e3c581c00c53a2ad`.
- Project coverage: statements 85.99%, lines 88.56%, functions 81.28%, branches 77.13%.
- Patch coverage: statements 92.86%, lines 94.12%, functions 90.27%, branches 90.41%.
- Unit, lint, typecheck and build pass; exact-SHA Sonar strict evidence is unavailable.

## Why this debt is accepted

All local maturity thresholds are green. Only provider authority and current-revision proof remain.

## Exit criteria

- Rotate the project token and pass the complete exact-SHA strict Sonar profile.
- Refresh the routed workspace head to the accepted repair revision.

## Progress

- 2026-08-20: debt opened after project and patch coverage cleared the mature thresholds.
