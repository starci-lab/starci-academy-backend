---
version: 1
project: miamia
role: be
approvedBy: Cuong (owner)
approvedOn: 2026-08-20
expiresOn: 2026-11-18
reason: Temporary backend project/patch coverage and Sonar authority debt; lint and E2E remain blocking.
scopes: source:project-coverage, source:patch-coverage, assurance:sonar, route:head
---

# MiAmia backend quality debt

## Baseline

- Revision `826dbbbd6a1d9d0b6bc205af235ef68d53de202a`.
- Project coverage: statements 42.70%, lines 42.44%, functions 24.09%, branches 42.69%.
- No current four-metric patch artifact was retained for the backend repair batch.
- Sonar exact-SHA strict evidence is unavailable at `https://sonar.starci.org`.
- Lint is 0/0; all declared verify scripts pass; Jest E2E is 30 suites / 118 tests with exit 0.

## Why this debt is accepted

The backend has substantial legacy unit-test debt even though its production transport and E2E behavior are
now exercised. Project and patch coverage remain explicitly red/unmeasured and are not presented as pass.

## Exit criteria

- Project statements, lines and functions reach 80%; branches reach 75%.
- Patch statements, lines, functions and branches reach 90%.
- Exact-SHA strict Sonar profile passes.
- Refresh the routed workspace head to the accepted repair revision.

## Progress

- 2026-08-20: debt opened after lint and full self-contained E2E became green.
