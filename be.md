---
version: 1
project: nivo
role: be
approvedBy: Cuong (owner)
approvedOn: 2026-08-20
expiresOn: 2026-11-18
reason: Temporary backend project/patch coverage and Sonar authority debt; lint and E2E remain blocking.
scopes: source:project-coverage, source:patch-coverage, assurance:sonar, route:head
---

# Nivo backend quality debt

## Baseline

- Revision `1c7c2515f6844064f55b492dafe7b96f2cecb08d`.
- Project coverage: statements 46.17%, lines 47.57%, functions 37.13%, branches 39.71%.
- No current four-metric patch artifact was retained for the backend coverage batches.
- Sonar exact-SHA strict evidence is unavailable at `https://sonar.starci.org`.
- Lint is 0/0; full E2E is 56 suites / 358 tests, zero skip/todo, exit 0.

## Why this debt is accepted

Coverage improved across many high-yield owner families, but the remaining source surface is still large.
The debt keeps the exact measured gap visible and does not weaken lint or E2E.

## Exit criteria

- Project statements, lines and functions reach 80%; branches reach 75%.
- Patch statements, lines, functions and branches reach 90%.
- Exact-SHA strict Sonar profile passes.
- Refresh the routed workspace head to the accepted repair revision.

## Progress

- 2026-08-20: debt opened after broad coverage repair and repository-wide E2E isolation reached green.
