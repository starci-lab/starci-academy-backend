# league — states, transitions, invariants

Source: `src/modules/bussiness/league/` (`league.service.ts`, `league-reset.service.ts`,
`constants/`, `types/`). Surfaced through `myLeague` (weekly cohort standing) and
`globalLeaderboard` (all-time Coin ranking) queries under
`src/features/api/core/graphql/queries/league/`. Two independent ranking systems share this folder;
they do not interact.

## System A — the weekly league (Duolingo-style tiers + cohorts)

**Tiers** (`LEAGUE_TIER_ORDER`, ascending): Bronze → Silver → Gold → Platinum → Diamond → Champion →
Legend. A user has exactly one `UserLeagueEntity` row (their current tier + which cohort they're in).

**A cohort** (`LeagueCohortEntity`) is a fixed-size (env-configured) group of same-tier users sharing
one week window (`weekStartAt`/`weekEndAt`, Sunday→Sunday Asia/Ho_Chi_Minh). Ranking within a cohort
is by `xp_histories.points` summed inside that window — course-agnostic reward points, not Coin.

### States and transitions, per user

1. **Never placed** — no `UserLeagueEntity` row (or the row's `cohort` was cleared by a reset and not
   yet re-bucketed). On first read (`getMyStanding`), `placeUserLazily` places them into Bronze + an
   open (under-capacity) cohort for the current week, creating a fresh cohort if none has room. This
   runs inside a transaction that re-reads first, so two concurrent first-reads for the same user
   can't create two placements.
2. **Placed, mid-week** — ranked live against cohort-mates by the CQRS points projection
   (`LeagueCohortPointsProjectionService`, not computed inline). `rankDelta` compares against last
   week's finishing rank (`lastWeekRank`), null when there is no baseline.
3. **Week ends → settlement** (`runWeeklyReset`, cron-driven, `LeagueResetService`, Sunday 00:00
   Asia/Ho_Chi_Minh): every cohort whose week just ended is ranked; the top `promoteCount` move up one
   tier, the bottom `demoteCount` move down one tier (Bronze floor, Legend ceiling — clamped, never
   moves past the ends). A tiny cohort where the zones would overlap resolves promotion-wins
   (documented, deliberate). Each member's `cohort` is cleared and `lastWeekRank` stamped.
4. **New week forms** — every user who was active (>= 1 point) in the week that just ended, OR who
   already had a league row, is re-bucketed by their POST-settlement tier into fresh cohorts, shuffled
   by a deterministic hash (`md5(user_id || newWeekStart)`, not `Math.random`) so the bucketing is
   reproducible and testable.

**Invariants**: the whole reset (settle + re-bucket) runs in ONE transaction — a crash mid-reset never
leaves half the league on old tiers with no new cohort. The reset is idempotent per week: re-running it
after cohorts already exist for the new week is a no-op (guarded by a `COUNT` check), so a retried cron
tick can't double-promote or fragment cohorts.

## System B — the global leaderboard (all-time Coin ranking)

Entirely separate: ranks EVERY user by `users.coin_balance` (materialized, no per-request recompute),
returns the top 50 plus the viewer's own rank (computed as `COUNT(*) WHERE coin_balance > mine + 1`)
so a viewer outside the visible top 50 still sees their own standing. No tiers, no cohorts, no reset —
this is a live, continuously-current snapshot, not a weekly event.

## What a front-end screen can rely on

- A brand-new user's FIRST `myLeague` read is never empty — the lazy placement guarantees a tier and
  a cohort exist before the query returns.
- `rankDelta` being `null` means "no baseline," not "no movement" — a screen must not render it as
  "0" (unchanged); it should render as "new" or omit the caret.
- The two boards use different point systems (`xp_histories.points` for the weekly league,
  `coin_balance` for the global leaderboard) — a user's rank on one has no fixed relationship to their
  rank on the other.
