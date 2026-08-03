# Projections — findings

Graded against `.claude/canon/be/` (naming-and-structure, comments/jsdoc, authorization, validation,
testing) and `.claude/canon/be/explore/system-design/cqrs-and-projections.md`. Ranked most severe
first. This domain is, overall, unusually clean and well-documented for its size — most of what
follows is drift in one file, a missing test tier, and one real timezone bug, not systemic rot.

---

## 1. [test-tier] 12 of 14 sub-projection services have zero unit coverage — including the two largest, most branch-heavy files in the domain

Only `progress` (`progress-projection.service.spec.ts`) and `user-xp`
(`user-xp-projection.service.spec.ts`) have a `.spec.ts`. The other twelve — `content-engagement`,
`contribution`, `course-stats`, `league-cohort-points`, `trending-contents`, `user-capstone`,
`user-coding`, `user-flashcard-course-stats`, `user-flashcard-stats`,
`user-mock-interview-course-stats`, `user-pinned-projects`, `user-solved-challenges` — carry no test
at all.

This is most severe on exactly the two files with the heaviest in-process branching logic in the
whole scan, where a unit test is cheapest to write and a regression is easiest to hide:
- `src/modules/bussiness/projections/user-flashcard-course-stats/user-flashcard-course-stats-projection.service.ts`
  (~1370 lines: `computeQuizHardCards`, `computeByTag`, `computeWeakTagLinks`, `computeByDeck`,
  `computeDueAndMastery`, `computeReviewOutcome` — a dozen private folding functions with distinct
  edge-case guards, e.g. divide-by-zero clamps, `WEAK_TAG_MIN_SAMPLE`/`LEECH_MIN_AGAIN` thresholds).
- `src/modules/bussiness/projections/user-mock-interview-course-stats/user-mock-interview-course-stats-projection.service.ts`
  (~700 lines: `accumulatePhaseScores`, `accumulateQuestionReviewsByLanguage`, `resolveWeakest`, the
  `insufficientData` gate at `MIN_ATTEMPTS_FOR_STATS`).

Per `.claude/canon/be/enforce/authoring/testing.md` §1, unit is "where a branch, a thrown exception,
or an edge case belongs by default" — exactly what both files are made of. Every listener's
`deriveTargets` branch (e.g. multi-topic dispatch in `user-pinned-projects-projection.listener.ts`,
`progress-projection.listener.ts`) is also untested.

**What breaks if left:** a threshold constant tweak (`WEAK_THRESHOLD`, `LEECH_MIN_AGAIN`,
`MIN_ATTEMPTS_FOR_STATS`) or a refactor of one fold function silently changes what a learner sees as
"their weakest skill" or "cards they keep forgetting," with nothing in CI to catch it.

---

## 2. [naming, business-logic] `ProgressProjectionListener` duplicates the shared CDC base class instead of extending it

`src/modules/bussiness/projections/progress/progress-projection.listener.ts:55-167`

Every other listener in this domain (13 of 14) extends `AbstractProjectionListener<TTarget>`
(`src/modules/projection/abstract-projection.listener.ts`), which owns topic subscription, best-effort
boot, and the swallow-and-log per-message loop. `ProgressProjectionListener` instead `implements
OnModuleInit` directly and hand-rolls the identical `ensureTopics` -> `createConsumer` -> `subscribe`
-> `run` -> try/catch/log sequence itself (lines 72-167), duplicating roughly 110 lines the base class
exists specifically to centralise.

The sibling `user-flashcard-course-stats-projection.listener.ts:27-29` even documents in its own
JSDoc why this is unnecessary: "AbstractProjectionListener already supports a multi-topic `topics`
array with a topic-agnostic `deriveTargets`, so no hand-rolled `OnModuleInit` is needed here" —
strongly suggesting the progress listener predates that realization and was simply never migrated
when the shared base was introduced or extended to support multi-topic dispatch.

**What breaks if left:** the CQRS canon's own documented caveat (`cqrs-and-projections.md`,
"Swallowed message errors") — that a dead-letter destination or periodic full sweep should eventually
be added on top of the swallow-and-log default — can only be added once, to the base class, and will
silently NOT apply to `progress`, which is the highest-traffic, richest projection in the entire
domain (it backs rank, leaderboard, and My Courses). Two independent copies of "how to consume a CDC
topic safely" will diverge the next time either one is touched.

---

## 3. [business-logic] `user-stats`'s streak counters and its "active day" display use two different calendar-day conventions in the same UPSERT

`src/modules/bussiness/projections/user-stats/user-stats-projection.service.ts`

The `streak` (lines 217-232) and `longestStreak` (lines 235-250) CTEs bucket days with plain
`created_at::date` — i.e., whatever date that timestamp falls on in the database session's timezone.
In the same query, `weeklyStudyDays` (line 198: `(created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date`)
and `last7Days` (lines 254-268) treat the day boundary as Vietnam local time — consistent with the
explicit VN-anchored day boundaries used everywhere else in this domain (`kpi-week.util.ts`'s
`KPI_WEEK_START_SQL`, and the explicit `AT TIME ZONE 'Asia/Ho_Chi_Minh'` casts in
`contribution-projection.service.ts`, `user-flashcard-stats-projection.service.ts`, and
`user-flashcard-course-stats-projection.service.ts`).

**What breaks:** for a user active in the band where the UTC calendar date and the VN calendar date
disagree (VN is UTC+7, so anything from 17:00-23:59 UTC is already "tomorrow" in VN), the `last7Days`
strip can show a day as active while the `streak`/`longestStreak` islands bucket that same activity
into a different day than the rest of the domain would — and because `streak` requires the latest
active day to be "today or yesterday" to stay alive, a user reviewing consistently late at night VN
time is at real risk of their displayed streak silently resetting to 0 on the next recompute even
though `last7Days` shows no gap. This is exactly the class of bug the domain's own comments elsewhere
warn about (`kpi-week.util.ts`: "shared by every weekly KPI subquery... so the notion of 'week' can
never drift apart between them") — the same discipline was not applied to the streak islands here.

---

## 4. [edge-case] `user-flashcard-stats`'s per-recompute history scan has no row cap, unlike every sibling aggregate

`src/modules/bussiness/projections/user-flashcard-stats/user-flashcard-stats-projection.service.ts:76-85`

`recompute` runs `SELECT ... FROM flashcard_review_events WHERE user_id = $1` with no `LIMIT`, no
`take`, no scan cap — every other heavy-fold projection in this domain bounds its input explicitly
(`STATS_SESSION_SCAN_CAP = 50` in `user-flashcard-course-stats-projection.service.ts`,
`STATS_SCAN_CAP = 50` in `user-mock-interview-course-stats-projection.service.ts`). This service is
recomputed on every single graded review (`user-flashcard-stats-projection.listener.ts` subscribes to
`flashcard_review_events` with no filtering), so for a long-tenured heavy reviewer the per-write cost
of this scan grows without bound over the user's lifetime, on the hot write path, rather than being
capped the way its siblings deliberately are.

**What breaks if left:** this is precisely the "aggregation that runs per request/per write instead of
being bounded" cost the CQRS canon exists to eliminate — except here it has moved from the read side
(fixed by the projection) to the write side (unfixed), where a spike in review volume from the most
engaged users degrades write latency for exactly the users the feature is meant to reward.

---

## 5. [jsdoc] `ProjectionsModule`'s class-level JSDoc describes 4 leaf modules; it registers 15

`src/modules/bussiness/projections/projections.module.ts:55-61`

"Umbrella module aggregating every CQRS projection leaf-module: progress (user x course), content
engagement (content), user stats (user), course stats (course)... Registering this module wires +
re-exports all four."

The `static register()` method immediately below actually composes 15 leaf modules (line 77-93):
progress, content-engagement, user-stats, course-stats, contribution, user-coding, user-xp,
user-capstone, user-pinned-projects, user-solved-challenges, trending-contents,
league-cohort-points, user-flashcard-stats, user-flashcard-course-stats,
user-mock-interview-course-stats. Per `.claude/canon/be/enforce/authoring/comments.md` §5, "A comment
LIVES with its code — change the code, change the comment"; this comment was accurate once (at 4
leaves) and was never updated across 11 subsequent additions.

**What breaks if left:** a reader relying on this JSDoc as the module's contract will believe there
are 4 projections in this domain and miss 11 of them when reasoning about what CDC topics are live or
what the umbrella module actually wires.

---

## 6. [business-logic] Tied rank order in `user-coding` and `user-solved-challenges` depends on incidental recompute timing, not a stable identity

`src/modules/bussiness/projections/user-coding/user-coding-projection.service.ts` (`getLeaderboard`,
`getRank`) and `src/modules/bussiness/projections/user-solved-challenges/user-solved-challenges-projection.service.ts`
(`getChallengeStrength`)

Both order by their metric descending, then tie-break on `p.updated_at ASC` — but `updated_at` is
stamped by `recompute`'s own `ON CONFLICT DO UPDATE SET ... updated_at = now()` on every recompute,
including a lazy TTL refresh that finds nothing changed. Reading a tied user's profile (which lazily
recomputes their row if stale) therefore mutates their tie-break position for every other user tied
with them, with no underlying change to `solvedCount` / `strengthScore`.

**What breaks if left:** two users permanently tied on solved-problem count (or challenge strength)
can observe their relative rank order flip depending on whose profile a third party happened to view
recently — a rank meant to represent a skill ordering instead partly reflects incidental read traffic.
Low severity in practice (only affects exact ties), but worth a stable tiebreak (e.g. `user_id ASC`)
since the current one silently violates the "recompute must be idempotent / order-independent" spirit
of the CQRS canon it otherwise follows carefully.

---

## Not findings (checked, found compliant)

- **Authorization/ownership on every "a user's ..." public-profile query** (`userXp`,
  `userCodingRank`, `userPinnedProjects`, `userSolvedChallenges`, and siblings) consistently pairs
  `KeycloakOptionalAuthGraphQLGuard` with `GraphQLProfileVisibilityGuard`; every "my ..." query
  (`myKpis`, `myWeeklyStats`) reads the id off `@KeycloakGraphQLUser()` rather than trusting a
  caller-supplied id. No IDOR pattern found across the ~30 resolver entry points grepped into this
  domain.
- **No SQL injection surface.** Every `buildUpsertSql`/raw-query method parameterises the real input
  ($1, $2...); the only string-interpolated pieces are fixed enum values (`ProjectPinType.Course`) or
  local `const` numeric thresholds, never caller input.
- **Recompute-is-idempotent-UPSERT discipline** is followed uniformly — every projection writes via
  `INSERT ... ON CONFLICT DO UPDATE`, never a read-modify-write increment, matching
  `cqrs-and-projections.md`'s central rule.
- **JSDoc coverage** on public classes/methods is strong throughout this domain (the exceptions above
  are the only two found); this is one of the better-documented domains in the backend.
