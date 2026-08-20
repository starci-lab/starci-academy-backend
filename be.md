---
version: 1
project: tedo
role: be
approvedBy: Cuong (owner)
approvedOn: 2026-08-20
expiresOn: 2026-11-18
reason: Temporary current-revision project/patch coverage and Sonar proof debt after zero-lint migration.
scopes: source:project-coverage, source:patch-coverage, assurance:sonar, route:head
---

# Tedo backend quality debt

## Baseline

- Revision `aa698049efbe6401d74b9781596b1c1d2da4179a`.
- Current four-metric project and patch artifacts were not retained after the lint migration.
- The previous strict Sonar pass predates this revision.
- Lint moved from 303 errors / 4 warnings to 0/0; typecheck/build, 51 unit suites / 163 tests and 2 E2E suites / 2 tests pass.

## Why this debt is accepted

The zero-lint migration materially changed the revision, so old provider evidence cannot certify it. Coverage
must be remeasured rather than inferred from the previous Sonar pass.

## Exit criteria

- Produce mature current-revision project and four-metric patch coverage.
- Pass the exact-SHA strict Sonar profile.
- Refresh the routed workspace head to the accepted repair revision.

## Progress

- 2026-08-20: debt opened after canonical zero-lint migration completed.
