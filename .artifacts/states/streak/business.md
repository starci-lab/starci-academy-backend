# Streak — business state map

Source: `src/modules/bussiness/streak/` (`streak.service.ts`,
`streak-freeze-cron.service.ts`, `streak-milestone.service.ts`) +
`src/modules/bussiness/projections/user-stats/user-stats-projection.service.ts`
(the streak NUMBER itself is computed there, not in this domain) + the
`UserStatsProjectionListener` CDC consumer that drives both.

The platform-wide, cross-course "consecutive days active" counter, its
freeze/insurance inventory, and the one-time + daily Coin bonuses tied to it.
Unlike `progress`, the streak LENGTH is not owned by this domain at all — it
lives in the `user-stats` projection as one field among many; this domain owns
only the freeze inventory (buy/spend) and the milestone/daily bonus grants
that react to the streak once it changes.

## Entities

- **UserEntity** columns `streakFreezes` (int, inventory count) and
  `coinBalance` — no dedicated streak entity; the freeze count is a plain
  column on the user row, spent/credited via direct `UPDATE`.
- **StreakProtectedDayEntity** (`streak_protected_days`) — one row per
  `(user_id, date)`, unique constraint `uq_streak_protected_days_user_date`.
  Existence of a row for a calendar day makes that day count as "active" for
  streak purposes even with zero real activity.
- **UserStatsProjectionEntity** (`user_stats_projections`) — the CQRS
  projection row holding, among other counters, `streak` (current run length),
  `longestStreak`, and `last7Days` (a 7-entry `{date, active}` array).
- **CoinHistoryEntity** rows with `source = StreakMilestone` /
  `StreakDailyBonus` and a stable `refId` — the append-only ledger that is
  also the idempotency backstop for both bonus grants.

## States and transitions

### Streak length (derived, not stored as a state machine)
The streak is not an enum — it is a NUMBER recomputed from scratch on every
relevant event: "the size of the most recent consecutive-day run of active
days, counted only if that run reaches today or yesterday" (see
`user-stats-projection.service.ts:210-232`). A day is "active" if the user
earned any `xp_histories` row that day OR a `StreakProtectedDayEntity` row
exists for it (union, not just XP). Two consecutive missed days (no XP, no
protection) resets the visible streak to whatever shorter run, if any, still
reaches "today or yesterday" — there is no separate `broken` state to clear;
the next recompute simply produces a smaller number (or 0).

### Streak-freeze inventory (`user.streakFreezes`, 0–3)
`0..3` ⇄ **buy** (`StreakService.buyStreakFreeze`, +1, spends
`STREAK_FREEZE_COST` Coin, blocked at `STREAK_FREEZE_MAX = 3`) ⇄ **auto-protect
spend** (`StreakFreezeCronService`, −1, only when a miss is detected — see
below). There is no manual "use a freeze now" action; consumption is entirely
automatic and retroactive.

### Auto-protect sweep (daily, 01:00 Asia/Ho_Chi_Minh)
For every user who (a) holds ≥1 freeze, (b) was active the day before
yesterday, and (c) was NOT active yesterday: decrement one freeze (guarded by
`streak_freezes > 0` in the same `UPDATE`, so a freeze spent between the
candidate scan and this transaction skips the insert), insert a
`StreakProtectedDayEntity` row for yesterday (idempotent on the unique
constraint), then recompute `user_stats_projections` in the same transaction
so the streak reflects the newly-protected day immediately. A user who misses
TWO consecutive days is never retroactively protected for the older of the two
— only "yesterday" is ever the target day, so a freeze can cover exactly one
missed day per sweep, never a multi-day gap.

### Milestone bonus (7 / 30 / 100 consecutive days, one-time each)
`ungranted` → **streak first reaches/crosses the threshold** (checked on
every `UserStatsProjectionListener` recompute, not just once) → **grant + notify
atomically** → `granted` (permanent; keyed by `streak:<userId>:<days>` in
`CoinHistoryEntity`, checked before every grant attempt). A user who is already
past a milestone on every subsequent recompute short-circuits on the
existence check and neither re-grants nor re-notifies.

### Daily streak-alive bonus (`STREAK_DAILY_BONUS_COIN`, once per VN day)
`not granted today` → **user is active today AND has not yet claimed today's
bonus** → **grant** → `granted today` (keyed by `streakDaily:<userId>:<date>`).
Resets implicitly every day because the key includes the date — there is no
explicit "new day" transition, just a new, never-before-seen `refId`.

## Invariants

1. **The freeze purchase is race-safe via a pessimistic row lock**: `buyStreakFreeze`
   re-reads the user row `FOR UPDATE` inside its own transaction before
   checking the cap and the balance, so two concurrent buys cannot both pass
   the `< STREAK_FREEZE_MAX` / `>= STREAK_FREEZE_COST` checks against a value
   that is about to change underneath them.
2. **The cap check always runs before the affordability check** — a maxed-out
   inventory (3 freezes) rejects a purchase attempt regardless of Coin
   balance; a user cannot "stock up" past 3 even if they can afford more.
3. **A day counts as active for streak purposes via a UNION of two sources**
   (real XP activity OR a protected-day row) everywhere the streak length,
   longest streak, or the 7-day strip is computed — a protected day is
   indistinguishable from a real activity day to every reader of the
   projection.
4. **Milestone and daily-bonus grants are idempotent on a stable Coin-history
   `refId`**, not on an in-memory flag — `writeCoinHistory`'s own
   `(source, refId)` uniqueness is the actual backstop; the `findOne`
   existence check before each grant is a fast-path, not the source of truth,
   so even a race that slips past the fast-path cannot double-credit.
5. **The auto-protect sweep is fully idempotent per day**: the unique
   `(user_id, date)` constraint on `streak_protected_days` means re-running the
   whole cron twice for the same "yesterday" is a no-op the second time (the
   `ON CONFLICT DO NOTHING` insert), even though the freeze-decrement `UPDATE`
   itself is not separately guarded against a true double-run (see findings).

## Cross-domain notes

- Every streak-affecting event funnels through ONE place —
  `UserStatsProjectionListener.recomputeTarget` — which recomputes the
  projection, then always calls both `checkAndGrant` (milestones) and
  `checkAndGrantDailyBonus` (daily) in that fixed order; a challenge pass, a
  flashcard review, a follow, and the auto-protect cron's own recompute all
  reach the same trigger.
- `MyWeeklyStatsResolver` (`dashboard/my-weekly-stats`) is the sole GraphQL
  surface that reads `streak`/`longestStreak`/`last7Days` — it reads them off
  `UserStatsProjectionService.getStats`, never off this domain directly, and
  reads `streakFreezes` straight off the guard-attached `UserEntity`, not a
  streak-domain call.
- **No GraphQL mutation calls `StreakService.buyStreakFreeze` anywhere in the
  tree** — see findings.md. The freeze-spend purchase flow is fully
  implemented, unit-covered, and documented in this module's own JSDoc as
  backing "the GraphQL `buyStreakFreeze` mutation", but that mutation does not
  exist.
