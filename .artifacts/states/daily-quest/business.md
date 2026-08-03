# Daily-quest — business state map

Source: `src/modules/bussiness/daily-quest/` (`daily-quest.service.ts`,
`daily-quest.catalog.ts`) + the resolvers under
`src/features/api/core/graphql/{queries/dashboard/my-daily-quest,mutations/profile/claim-daily-quest-reward}/`.

A per-VN-calendar-day checklist of 5 fixed tasks (read a lesson, pass a
challenge, review flashcards, do a mock interview, finish a flashcard quiz);
completing enough of them unlocks a one-time-per-day Coin claim. Unlike
`progress` and `streak`, this domain has **no projection table and no
persisted "current state" row for the checklist itself** — every read
re-derives from the underlying activity tables live, for TODAY only. The only
row this domain ever writes before a claim is the claim record itself.

## Entities

- **DailyQuestCompletionEntity** (`daily_quest_completions`) — the ONLY
  persisted row this domain owns: one per `(user_id, quest_date)`, written
  exactly once, at claim time. Its existence for today IS the "claimed" state.
- No entity for the 5 tasks or their targets — `DAILY_QUEST_TASKS` is a
  hardcoded, in-code array (`daily-quest.catalog.ts`), the single source of
  truth for what counts and how much is required, shipped with the build.
- Task progress is read live from four unrelated tables the quest does not
  own: `xp_histories` (lessons read, challenges passed),
  `user_flashcard_reviews`, `mock_interview_attempts`, and
  `flashcard_quiz_sessions`.

## States and transitions

### The quest, for one user, for one VN calendar day
`in progress` (0 or more of 5 tasks done today) → **enough tasks cross their
target** (`completedCount >= DAILY_QUEST_MIN_TASKS_REQUIRED = 3`, NOT all 5) →
`ready to claim` (`allDone: true`, `claimed: false`) → **claim** (mutation,
atomic) → `claimed` (permanent for that VN day — a
`DailyQuestCompletionEntity` row now exists for `(user, today)`).

There is no `expired`/`missed` state either — a day that ends with `allDone:
false` simply stops being "today" once the VN clock rolls over; the very next
read of `getMyDailyQuest` computes a brand new `date` and a fresh set of
`current` counts starting from zero, because every counter query is scoped
`= (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date`. Nothing is carried forward
and nothing is explicitly reset — "reset" is simply "today's date changed, so
the WHERE clause now matches a different, empty set of rows."

### Per-task progress (one of 5 `DailyQuestKey`s)
`current: 0` → **user performs the underlying activity today** (a
`lessonRead`/`challenge` XP row, a flashcard review, a mock-interview
attempt, a completed flashcard-quiz session) → `current` increments toward the
task's fixed `target` (1 for four of the tasks, 5 for `ReviewFlashcards`).
A task has no independent "done" flag exposed to the client beyond
`current >= target`, computed fresh on every read — there is nothing to
persist per-task.

## Invariants

1. **"Today" is always Asia/Ho_Chi_Minh, computed by Postgres, never by
   Node/JS `Date`** — `getTodayDate` runs `to_char((now() AT TIME ZONE
   $1)::date, 'YYYY-MM-DD')` server-side, and every per-task counter query
   in the same request converts `created_at`/`last_reviewed_at`/`updated_at`
   with the identical `AT TIME ZONE $2` expression before comparing dates —
   so the day boundary used to gate the claim and the day boundary used to
   count "did this happen today" can never disagree with each other, even
   though the Postgres session's own server timezone is unrelated to either.
2. **Completing "enough" is NOT completing "all"**: exactly
   `DAILY_QUEST_MIN_TASKS_REQUIRED = 3` of 5 unlocks the claim, deliberately
   (per the class doc) because not every learner touches every category
   (e.g. mock interview) on a given day.
3. **The claim is checked and inserted in ONE transaction**: `claimReward`
   re-derives `allDone` AND re-checks `hasClaimedToday` inside the same
   transaction that inserts the `DailyQuestCompletionEntity` row and writes
   the Coin grant — so a request that reads stale "not yet claimed" state
   from before the transaction started still cannot double-claim, because the
   completeness/claimed checks are redone against the transaction's own view
   right before the write.
4. **The completion row is inserted BEFORE the Coin grant**, and the unique
   `(user_id, quest_date)` constraint on `daily_quest_completions` is the
   idempotency backstop a concurrent double-claim relies on — a losing
   concurrent transaction fails the unique insert (or is serialized behind
   the winner) rather than ever reaching `writeCoinHistory` twice. The Coin
   grant additionally carries its own `refId: daily:<date>` (per-user via
   `writeCoinHistory`'s own scoping), a second, independent idempotency layer.
5. **The reward value and the task catalog are code constants, not
   configurable data** (`DAILY_QUEST_REWARD = 20`, `DAILY_QUEST_TASKS`) — a
   change to what counts as a daily quest ships as a deploy, never as a
   runtime/admin edit; there is no admin surface for this domain at all.

## Cross-domain notes

- The reward is deliberately LOWER than most other single-activity XP grants
  and is credited as **Coin**, never XP — this is a spending-currency bonus
  layered on top of whatever XP the day's underlying activities already
  earned, not a competing progression currency.
- `MyDailyQuestResolver` and `ClaimDailyQuestRewardResolver` both derive the
  acting user from the guard-attached `UserEntity` only — there is no
  "view another user's daily quest" surface, so there is no by-id ownership
  check to get wrong (the whole domain is inherently self-scoped).
- Unlike `streak`, this domain has no CDC listener and no projection —
  everything is computed synchronously, per request, from four live tables;
  it never goes stale because it never caches.
