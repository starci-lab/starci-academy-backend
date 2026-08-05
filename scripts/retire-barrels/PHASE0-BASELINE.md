# Phase 0 — pre-barrel-retirement baselines

Recorded 2026-08-05 on `mtp` at `b9054d36`. Working tree was clean.
Every later phase is judged against these numbers.

## `npx tsc --noEmit`

**248 errors** (exit 2). Breakdown by tree:

| Prefix | Errors |
|---|---|
| `apps/tools` | 176 |
| `src/modules` | 46 |
| `src/features` | 20 |
| `src/tests` | 5 |
| `apps/backup` | 1 |

Most of the 176 live under `apps/tools/dashboard`, as expected. The repo
carries these; they are not a regression gate, only a ceiling.

## `npx eslint "{src,apps}/**/*.ts"`

**19 problems** (19 errors, 0 warnings) across 17 of 5805 scanned files.
All pre-existing: unused-var in seeders/synchronizers/migrations, plus four
`require-export-jsdoc` hits under `src/tests/helpers`.

## `npm test` (unit)

| | |
|---|---|
| Test suites | 15 failed, 167 passed, 182 total |
| Tests | 26 failed, **1188 passed**, 1214 total |

Failures are pre-existing on this branch (Nest DI setup in a handful of
business specs, notably `coding-submission.service.spec.ts`). Pass count
to hold: **1188**.
