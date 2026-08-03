# league — findings

Graded against `.claude/canon/be/enforce/authoring/{naming-and-structure,validation,testing}.md` and
read for defect independent of canon. Scope read: `src/modules/bussiness/league/*` (service, cron,
constants, types) and its two resolvers (`myLeague`, `globalLeaderboard`).

## 1. [business-logic] The "active users" filter in the weekly re-bucket query is dead code — every league member is re-bucketed forever, active or not

- **Anchor**: `src/modules/bussiness/league/league.service.ts:610-625` (`buildActiveUsersSql`):
  ```sql
  FROM user_leagues ul
  WHERE EXISTS ( SELECT 1 FROM xp_histories x WHERE x.user_id = ul.user_id AND ... )
     OR ul.user_id IS NOT NULL
  ```
  `user_leagues.user_id` is the table's PRIMARY KEY (stated explicitly two methods away, `:61`: `// load the viewer's single league row (PK is user_id)`) — a primary-key column is never `NULL` by definition. `ul.user_id IS NOT NULL` is therefore true for every row the `FROM user_leagues ul` clause can ever produce, which makes the `OR` unconditionally true and the entire `WHERE` clause tautological. The `EXISTS (... xp_histories ...)` half can never matter: it is dead code.
- **Rule broken**: no single enforce/ rule names this exact shape, but it directly contradicts the
  method's own doc comment one line above (`:446-449`): *"Returns every user with a league row OR
  >= 1 point in the ending week"* — the code does not implement "OR >= 1 point," it implements "every
  row in `user_leagues`, unconditionally," because the second disjunct swallows the first. This is a
  `comments.md` §5 violation (the comment describes behavior the code does not have) as much as a
  business-logic one.
- **What breaks**: the query is called `formNewCohorts` every week from `runWeeklyReset`
  (`:186-208`) to decide who gets a fresh cohort. As written, EVERY user who has ever been placed
  into the league — including an account dormant for a year with zero points every week since — gets
  re-bucketed into a live cohort every single week, forever. There is no pruning path for genuinely
  inactive members. Over time this means live cohorts fill up with dormant accounts (a cohort has a
  fixed size, `cohortSize` from env — a slot spent on a dormant account is a slot an active user
  doesn't get, degrading the "compete against real activity" experience the whole league exists for),
  which is the opposite of what the doc comment claims the query does.

## 2. [test-tier] Zero unit tests for the entire `league` domain — the most branchy logic in this bundle is the least tested

- **Anchor**: `src/modules/bussiness/league/` has no `*.spec.ts` file at all. `league.service.ts` alone
  contains: a lazy-placement race guarded by a transaction + re-read (`:217-274`), a promote/demote
  zone-overlap rule with a documented tie-break (`:376-410`), a tier-shift clamp at both ladder ends
  (`:512-537`), a deterministic (non-`Math.random`) shuffle for cohort formation (`:602-625`), and an
  idempotency guard against a re-run reset (`:430-442`) — none of it is asserted anywhere.
- **Rule broken**: `testing.md` §1.
- **What breaks**: finding #1 above is exactly the kind of defect a unit test on `formNewCohorts`
  ("a user with zero points and no prior activity is excluded from re-bucketing") would have caught
  before it shipped — there is no test that could have failed. The promote/demote overlap rule
  (`isDemoted = !isPromoted && rank > memberCount - demoteCount`) is a second unguarded invariant a
  future edit to the zone-size config could quietly break with nothing turning red.

## 3. [edge-case] `globalLeaderboard`'s `myRank` and the visible `entries[].rank` can disagree for a tied viewer

- **Anchor**: `league.service.ts:132-172` (`getGlobalLeaderboard`) — `entries` is ranked
  `ORDER BY coin_balance DESC, id ASC` with `rank = list position` (a real, gapless, id-tie-broken
  ranking), but `myRank` is computed separately as
  `(SELECT COUNT(*) FROM users o WHERE o.coin_balance > u.coin_balance)::int + 1` (`:153-160`) — a
  COUNT-based rank that collapses every tie to the SAME number, with no id tie-break.
- **Judgment, not a canon breach** (no validation/authorization rule covers ranking arithmetic): when
  the viewer sits inside the visible top 50 AND shares their exact `coin_balance` with one or more
  other users, `entries[].rank` for the viewer's own row (id-tie-broken, a distinct number) and the
  top-level `myRank` field (tie-collapsed, shared by every tied user) can show two different numbers
  for the same person in the same response. A screen that reads `myRank` to highlight "you" in the
  `entries` list would highlight the wrong row, or none, whenever this happens.
