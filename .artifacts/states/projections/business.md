# Projections — the CQRS read-model layer

This domain is not a business capability like `enrollment` or `payment` — it is the **read side** of
CQRS for fourteen different capabilities elsewhere in the backend. Nothing here originates a fact;
everything here is a recomputed, disposable summary of facts that live in other tables. If you are a
front-end reader, the mental model you want is: **every field this domain returns is a cached answer
to "what does the write-model currently say", refreshed either by a Kafka/Debezium change stream or by
the read itself noticing the cache is old.**

## The one pattern, used fourteen times

Every sub-projection (with one exception, see Drift below) is built from the same three pieces:

1. **A listener** (`*-projection.listener.ts`) subscribes to one or more Debezium CDC topics — the
   raw insert/update/delete stream off a handful of source Postgres tables. For each change it derives
   *which* read-model row is now stale (`deriveTargets`) and asks the service to rebuild exactly that
   row (`recomputeTarget`). A row it cannot resolve (deleted parent, missing column) is silently
   skipped — nothing to rebuild.
2. **A service** (`*-projection.service.ts`) owns two operations:
   - `recompute(...)`: runs the real query (sometimes one `INSERT ... SELECT ... ON CONFLICT DO
     UPDATE`, sometimes several queries folded into one JS object first) and **replaces** the row
     whole — never an increment. Running it twice for the same input produces the same row.
   - `get*(...)`: reads the flat row. If the row is missing, or older than a TTL
     (`envConfig().projection.staleAfterMs`, a few minutes), it recomputes once inline before
     returning — a **lazy self-heal** for the case where Kafka was down or a message was dropped.
3. **A jsonb `value` column** on one Postgres table per projection, keyed by whatever identity the
   projection is scoped to (a user, a course, a content, a cohort, an enrollment...). The row's shape
   is whatever TypeScript interface the service's own `types/index.ts` declares — there is no separate
   migration to change a field, only a redeploy of the service that builds it.

**What this means for a screen consuming any of these fields:**

- **The number can lag reality by up to the TTL window**, or until the next matching CDC event lands,
  whichever comes first. None of these are "live" in the sense of reflecting a write that happened one
  request ago — if a screen needs to show the effect of the user's own just-completed action, it
  should use the value the mutation itself returned, not re-fetch the projection.
- **A projection never rejects, blocks, or has business rules of its own.** If a number here looks
  wrong, the bug is either in the source tables (the write side) or in the aggregation SQL — never in
  "the projection decided something."
- **Every projection is disposable.** Nothing is stored here that cannot be rebuilt from the source
  tables; dropping any of these fourteen tables and letting the next read/CDC event repopulate it is
  always safe (slow, not wrong).

## The fourteen projections

### `content-engagement` — one content's engagement counters
**State:** `{ totalReactions, reactionsByType, viewCount, shareCount, commentCount }` keyed by
`content_id`. `shareCount` is hard-coded to `0` — sharing is not implemented yet, this is not a bug.
**Driven by:** any change to `content_reactions`, `content_comments`, or `user_contents` (a read
flips `is_read`). **Freshness:** TTL lazy-refresh only (no eager inline recompute call found on the
write path — a reaction/comment/read only becomes visible here once its CDC message lands or the TTL
expires).

### `contribution` — one user's GitHub-style contribution calendar, one row per calendar year
**State:** `{ days: [{ date, contents, challenges, milestones }] }` keyed by `(user_id, year)`,
summed from the `activities` ledger. **Invariant:** only the **current** year is TTL-refreshed on
read; past years are treated as immutable once built (a past year's row is only rebuilt if the row is
entirely missing). **Driven by:** any new `activities` row, always recomputed for the actor's
*current* year — a backdated activity insert into a past year would not trigger a rebuild of that past
year's row.

### `course-stats` — one course's enrollment counter
**State:** `{ enrollmentCount }` keyed by `course_id`. The simplest projection in the domain; replaces
what used to be a Redis counter cache. **Driven by:** any change to `enrollments`.

### `league-cohort-points` — one league cohort's ranked weekly-points board
**State:** `{ members: [{ userId, username, avatar, weekPoints }] }`, pre-ordered best→worst, keyed by
`cohort_id`. Read-side adds `rank` (1-based position) but explicitly leaves `rankDelta: null` — the
"moved up/down since last week" comparison is not this projection's job; a caller (the league service)
merges in a separate last-week baseline. **Driven by:** any `xp_histories` row (a points-earning
event); the listener resolves the earner's *current* cohort via `user_leagues` and skips silently if
the user is unplaced (no current cohort). **Invariant:** the points window is the cohort's own
`[week_start_at, week_end_at)`, read fresh from `league_cohorts` inside every recompute — the
projection never bakes in a week boundary that could go stale.

### `progress` — one user's progress in one course (the richest projection here)
**State:** `{ totalScore, completedChallenges, lessonsRead, milestoneProgress, totalXp }` keyed by
`(user_id, course_id)`, with `totalXp = totalScore + lessonsRead*3 + milestoneProgress*10`. Backs
three surfaces: **my rank** in a course, the **course leaderboard**, and **my-courses** progress rail.
**Trial vs paid split is the core invariant here:** an `enrollments` row can be a trial
(`is_enrolled = false`) or paid. `getMyCourseProgress` (My Courses) shows **every** enrollment
including trials with a `isEnrolled` flag; `getMyRank` and `getLeaderboard` **exclude trials
entirely** — a trial user never appears on a rank or leaderboard, however much XP the trial
accumulated. A rank/leaderboard entry with `totalXp <= 0` is also excluded (never surfaces a "rank" of
someone who has done nothing). **Driven by, eagerly, no read-time TTL:** an XP-changing event
(challenge passed / lesson read / milestone passed / enroll) is meant to call `recompute` inline *and*
via CDC on four topics (`user_contents`, `user_challenge_submission_attempts`,
`user_milestone_task_attempts`, `enrollments`) — this is the one projection in the domain the canon
explicitly calls "eager-maintained ... no read-time TTL refresh."

### `trending-contents` — the one platform-wide "trending lessons this week" board
**State:** a single global row (`key = "global"`) holding the top-50 most-read lessons in a rolling
7-day window. **Per-viewer personalization happens at read time, not in the aggregate:** `getTrending`
takes the shared top-50 and filters out lessons the requesting viewer has already read, then slices to
the caller's `limit` — so "trending" always reflects the crowd, but the list any one viewer actually
sees is never materialised per-user. **Driven by:** any `user_contents` change; because every change
maps to the same single global key, TTL is effectively the real throttle (a viral morning doesn't
recompute the board on every single read).

### `user-capstone` — one user's capstone (milestone) task history + full roadmap
**State:** two views sharing one row keyed by `user_id`: `tasks` (a flat, newest-first list of every
*passed* milestone task with its score) and `courses` (a full per-course roadmap — every milestone,
every task, pass/score state — for every course the user is enrolled in, even tasks never attempted).
**Driven by:** any `user_milestone_task_attempts` row; the listener resolves the owning user via
`user_milestone_tasks → enrollments`.

### `user-coding` — one user's coding-practice history + skills breakdown
**State:** `{ solvedCount, byLanguage, byDifficulty, byDomain, history }` keyed by `user_id`, all
scoped to submissions with `verdict = 'accepted'`, distinct by problem (solving the same problem twice
does not double-count). Also backs a **global leaderboard** (`getLeaderboard`, top-N by `solvedCount`)
and a **derived rank + percentile** (`getRank`). **Invariant/gotcha:** both the leaderboard and rank
break ties on `updated_at ASC` (i.e., whichever tied user's row was recomputed longest ago sorts
first) — this is a *recompute-recency* tiebreak, not a stable identity tiebreak; see findings.

### `user-flashcard-course-stats` — one enrollment's flashcard stats for ONE course (largest service in the domain)
**State:** ~20 fields keyed by `enrollment_id`, folding together the quick-quiz surface (trend,
per-tag/per-deck coverage, "hard cards") and the spaced-repetition review surface (due-today,
7-day due forecast, mastery/maturity ladders, leech cards, weakest tags, retention trends, best review
hour). **Two DIFFERENT source event sets:** `flashcard_quiz_sessions` for quiz-mode stats,
`flashcard_review_events`/`user_flashcard_reviews` for SM-2 spaced-repetition stats — they measure
different activities and are not comparable. **Invariant — schema-drift self-heal:** because new
outcome fields have been added to this jsonb shape over time (`leechCards`, `quizHardCards`,
`maturityLadder`, `reviewedTotal`), a row written before a given field existed is detected as
"missing outcome fields" and forced through one recompute on next read, rather than serving that field
as empty forever. **Driven by:** `flashcard_quiz_sessions` OR `flashcard_review_sessions` changes,
both funnelled into the same enrollment-keyed row by one listener.

### `user-flashcard-stats` — one user's overall flashcard streak/retention (course-agnostic)
**State:** `{ currentStreak, longestStreak, retentionRate, totalReviewed, lastReviewedAt,
dailyReviewCounts, gradeDistribution }` keyed by `user_id`, folded from the user's ENTIRE
`flashcard_review_events` history (see findings — unlike its sibling, this scan has no row cap).
`currentStreak` only counts as "current" if the last reviewed day is today or yesterday (VN calendar
day) — a two-day gap silently resets it to 0 on the next recompute. **Driven by:** any new
`flashcard_review_events` row (i.e., every single graded review).

### `user-mock-interview-course-stats` — one enrollment's mock-interview stats for ONE course
**State:** trend line, mode split (Q&A vs system-design), two breakdown axes (`byPhase` for design
attempts, `byKind` for Q&A attempts) plus `byAttribute`/`byLevel`/`byLanguage`, recurring "gap" phrases,
and a single `weakest` verdict, keyed by `enrollment_id`. **Invariant — the "honesty gate":** with
fewer than 3 scanned attempts, the entire result collapses to `insufficientData: true` with every
field zeroed — the projection deliberately refuses to show a stat derived from too small a sample
rather than showing a misleading one. A breakdown key only counts as "weak" (and only enters
`weakest`) if it underperforms *and* has done so at least 3 times — one bad interview never becomes
"the pattern to fix."

### `user-pinned-projects` — one user's public-profile pinned projects
**State:** an ordered `pins` array keyed by `user_id`. A pin's `title` falls back to the linked
course's title when the pin has no custom title (course pins only); `isVerified` is true only for a
course pin whose linked enrollment has actually completed its task plan
(`tasks_completed_at IS NOT NULL`) — an external/custom pin is never "verified". **Driven by:** changes
to the pin rows themselves, OR to the `enrollments`/`courses` rows a pin's title/verified state
derives from (the listener reverse-looks-up which pins are affected by an enrollment or course
change).

### `user-solved-challenges` — one user's passed challenge history + derived "strength"
**State:** newest-first `challenges` list (one entry per distinct passed submission, latest passing
attempt only) plus a derived `strengthScore` — a weighted sum by difficulty (easy=10 ... expert=50)
over the SAME passing set. **Invariant:** `strengthScore` is explicitly documented as **not** touching
the real points/XP/league economy — it exists purely to rank/percentile challenge skill.
`getChallengeStrength` ties its rank/percentile ordering to this derived score (tie-break `updated_at`,
same caveat as `user-coding`).

### `user-stats` — one user's social + inbox + streak + weekly-KPI counters (widest single row)
**State:** follower/following counts, unread-notification count, `streak`/`longestStreak`, `last7Days`
activity strip, and six `weekly*` KPI counters (`weeklyXp` — actually flat reward points, not XP — is
a legacy field name kept to avoid a FE contract change) reset every Monday 8am Asia/Ho_Chi_Minh
(`KPI_WEEK_START_SQL`, shared with the KPI-reward-claim logic so "current week" can never drift between
the two). **Streak invariant:** a calendar day counts as "active" if the user earned XP that day *or*
has a streak-freeze (`streak_protected_days`) for that day — protection is purely additive, never
subtracts a day. **Driven by:** `user_follows` (moves both endpoints' counters), `notifications`
(moves the recipient's unread count), `xp_histories` (moves the earner's streak + weekly metrics).
Recomputing this projection also triggers a **side-effect that is not itself a projection concern**:
the listener calls `StreakMilestoneService.checkAndGrant`/`checkAndGrantDailyBonus` right after every
recompute, which can grant the user Coins for crossing a 7/30/100-day milestone or for simply keeping
the streak alive that day.

### `user-xp` — one user's XP-by-source totals + the two spendable balances
**State:** `{ challengeXp, milestoneXp, codingXp, lessonXp, totalPoints, coinBalance }` keyed by
`user_id`. `totalPoints` and the four per-source figures are all `SUM(amount)` over the same
`xp_histories` ledger (one source of truth, no separately-maintained counter to drift); `coinBalance`
is the one field NOT ledger-derived — it is read straight off `users.coin_balance`. **Driven by:** any
`xp_histories` row (moves both the per-source total and the global total), or any `users` row change
(moves the coin snapshot).

## Cross-cutting invariants worth knowing before building a screen

- **"My" vs "a user's" is a real split, not just an argument name.** Every `user-*` query in this
  domain that takes an arbitrary `userId` argument (public profile: XP, coding rank, pinned projects,
  solved challenges, contribution calendar...) is guarded by profile-visibility — a locked profile
  withholds the data from anyone but its owner. Every `my-*` query instead reads the caller's own id
  off the authenticated session. Do not assume a `userXp(userId)`-shaped query works for "my" XP if the
  viewer might be looking at someone else's locked profile — it won't return data.
- **Trial enrollments are visible in "my courses" progress but invisible on any rank or leaderboard.**
  This is deliberate (see `progress` above) — do not "fix" a trial user's absence from a leaderboard as
  a bug.
- **A number that "hasn't updated yet" is not necessarily broken.** Check whether the relevant CDC
  topic actually covers the change that should have moved it, and whether the TTL window has elapsed,
  before treating a stale-looking projection as a defect.
