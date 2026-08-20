---
version: 1
project: starci-academy
role: fe
approvedBy: Cuong (owner)
approvedOn: 2026-08-20
expiresOn: 2026-11-18
reason: Temporary external Sonar authority debt; frontend project and patch coverage are already mature.
scopes: assurance:sonar, route:head
---

# StarCi Academy frontend quality debt

## Baseline

- Revision `082c8ba5d803d654f7a4ccb6deddc7d0bfda82b7`.
- Project coverage: statements 85.22%, lines 86.62%, functions 85.70%, branches 79.43%.
- All four patch metrics are at least 90%; unit, lint, typecheck and operational E2E smoke pass.
- Sonar host is `https://sonar.starci.org`; the current project token returned HTTP 401, so exact-SHA strict evidence is unavailable.

## Why this debt is accepted

The remaining gap is external credential authority rather than untested frontend source. The quality profile
stays installed and must be measured again after token rotation.

## Exit criteria

- Rotate the project-scoped token through hidden intake.
- Scan this exact revision or its successor and pass the complete strict Sonar profile.
- Refresh the routed workspace head to the accepted repair revision.

## Progress

- 2026-08-20: debt opened after mature project/patch coverage and E2E smoke passed.
