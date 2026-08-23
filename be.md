---
version: 1
project: starci-academy
role: be
approvedBy: Cuong (owner)
approvedOn: 2026-08-20
expiresOn: 2026-11-18
reason: Temporary maturity debt for backend project coverage and unavailable exact-SHA Sonar authority.
scopes: source:project-coverage, assurance:sonar, route:head
---

# StarCi Academy backend quality debt

## Baseline

- Project coverage measured at `7132af0e`: statements 44.10%, lines 45.01%, functions 28.26%, branches 46.97%.
- Patch coverage is green: statements/lines/functions 100%, branches 91%.
- Current debt-record revision: `56978b00c4e04585a8c594fdbcbae4eb240f9278`.
- Sonar host is `https://sonar.starci.org`; authenticated exact-SHA proof is unavailable because the current project token returned HTTP 401.
- Lint is 0/0 and backend E2E is 77 suites / 303 tests passing.

## Why this debt is accepted

The backend source surface contains tens of thousands of uncovered statements and functions. The repair
raised coverage and made patch coverage strict, but completing project maturity is a multi-batch backlog.
This debt does not lower repository thresholds or relabel the measured figures as green.

## Exit criteria

- Statements, lines and functions reach at least 80%; branches reach at least 75%.
- Exact-current-SHA Sonar strict profile returns quality gate OK with the required zero issues, A ratings,
  hotspot review, duplication and native coverage conditions.
- Refresh the routed workspace head to the accepted repair revision.

## Progress

- 2026-08-20: debt opened by owner after zero-lint, patch coverage and full E2E repair.
