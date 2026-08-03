# Daily-quest — findings

Ranked most severe first. Axes: naming, jsdoc, business-logic, edge-case, security, gate-middleware, test-tier.

## 1. [edge-case] Concurrent double-claim throws a raw unhandled DB error instead of the typed exception
`DailyQuestService.claimReward` re-checks hasClaimedToday inside its tx then `manager.insert` relies on the (user_id, quest_date) unique constraint as backstop — but has NO try/catch. Unlike `process-git-submission-complete-step.service.ts` which catches QueryFailedError SQLSTATE 23505 as idempotent no-op. Two concurrent claims (double-click/two tabs) both pass the pre-insert check under READ COMMITTED; loser's insert throws raw QueryFailedError to the resolver instead of the clean DailyQuestAlreadyClaimedException produced two lines earlier for the sequential case.
- src/modules/bussiness/daily-quest/daily-quest.service.ts:193-245
- contrast (correct): src/features/api/processors/ai/process-git-submission/steps/process-git-submission-complete-step.service.ts:315-326

## 2. [test-tier] Zero unit-test coverage for the whole daily-quest domain
No *.spec.ts under src/modules/bussiness/daily-quest/ — three private query builders, the DAILY_QUEST_MIN_TASKS_REQUIRED threshold branch, and transactional claimReward (incl. the finding-1 race) all unverified.
- src/modules/bussiness/daily-quest/daily-quest.service.ts

## 3. [naming] The VN timezone IANA string hardcoded independently in ~30 places, not a shared constant
`QUEST_TIMEZONE = "Asia/Ho_Chi_Minh"` is a local copy also hardcoded in streak cron `@Cron({ timeZone })`, in KPI_WEEK_START_SQL, and ~27 more (`grep -c "Asia/Ho_Chi_Minh" src` = 30). Domains that must stay in lockstep (streak, KPI week, daily quest, weekly study days) each have their own copy. Low-urgency judgement call, not a canon breach.
- src/modules/bussiness/daily-quest/daily-quest.service.ts:36
- src/modules/bussiness/streak/streak-freeze-cron.service.ts:55
- src/modules/bussiness/projections/user-stats/kpi-week.util.ts:10
