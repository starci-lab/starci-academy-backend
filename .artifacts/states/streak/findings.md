# Streak — findings

Ranked most severe first. Axes: naming, jsdoc, business-logic, edge-case, security, gate-middleware, test-tier.

## 1. [edge-case] Freeze auto-protect decrement commits before the idempotency check, no lock across cron replicas
`StreakFreezeCronService.protectUser`: (1) `UPDATE users SET streak_freezes = streak_freezes - 1 WHERE id=$1 AND streak_freezes > 0` runs with NO check whether yesterday already protected; then (2) idempotent `INSERT ... ON CONFLICT DO NOTHING`. `@Cron` is per-process in-memory; no PostgreSqlAdvisoryLockService taken. Multi-replica deploy → each replica passes the >0 check and decrements while only first insert lands → a user loses 2-3 freezes to protect ONE missed day. Fix: make the decrement conditional on the insert having happened, not the reverse.
- src/modules/bussiness/streak/streak-freeze-cron.service.ts:86-118

## 2. [edge-case] Streak day-boundary computed in two different timezones inside the same upsert
`buildUpsertSql` computes `weeklyStudyDays` with explicit `(created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date` but `streak`/`longestStreak`/`last7Days` + `CURRENT_DATE` use bare `created_at::date` (DB session tz). No session tz set in primary.module.ts. If server tz is UTC, a user active 00:00-07:00 VN is attributed to the wrong calendar day for streak but the right day for weeklyStudyDays — the streak "day" and the platform "day" disagree by up to 7h.
- src/modules/bussiness/projections/user-stats/user-stats-projection.service.ts:197-268
- src/modules/bussiness/streak/streak-freeze-cron.service.ts:129-154
- contrast (correct): src/modules/bussiness/daily-quest/daily-quest.service.ts:56-117

## 3. [business-logic] `buyStreakFreeze` has no GraphQL mutation anywhere in the tree
Module doc says it backs "the GraphQL buyStreakFreeze mutation"; service is complete + race-safe. Repo-wide search finds only the module doc, the service, its result type, the UserEntity column, and a comment. No src/features streak folder; `grep StreakService src/features` → nothing. The whole "spend Coin to buy a streak freeze" feature is built+documented-as-wired but unreachable from the API — the built-but-never-mounted class.
- src/modules/bussiness/streak/streak.module.ts:18-26
- src/modules/bussiness/streak/streak.service.ts:47-93

## 4. [test-tier] Zero unit-test coverage for the whole streak domain
No *.spec.ts under src/modules/bussiness/streak/ — streak.service (race-safe pessimistic-lock purchase), streak-freeze-cron (finding 1 race), streak-milestone (idempotent grant) all untested. Sibling progress has a spec per service.
- src/modules/bussiness/streak/{streak.service,streak-freeze-cron.service,streak-milestone.service}.ts
