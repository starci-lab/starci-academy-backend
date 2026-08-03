# Progress — business state map

Source: `src/modules/bussiness/progress/` (`challenge.service.ts`,
`personal-project.service.ts`) + the resolvers/handlers that call them under
`src/features/api/core/graphql/queries/{challenges/challenge-submission-progress,
personal-project/milestone-task-progress,dashboard/my-in-progress-challenges}/`.

Two parallel "how far has this learner gotten in this course" trackers — one
for **challenges** (git/Google-Docs graded submissions), one for **personal
project milestone tasks** — each keyed by `(enrollmentId, courseId)`, each
read-mostly with an eager recompute on every grade event.

## Entities (read side, not owned by this domain)

- **ChallengeEntity** → has many **ChallengeSubmissionEntity** (the grading
  template, carries `score`) → has many **UserChallengeSubmissionEntity** (one
  per learner attempt-to-grade cycle, carries `enrollmentId`) → has many
  **UserChallengeSubmissionAttemptEntity** (`attemptNumber`, `score`).
- **MilestoneEntity** → has many **MilestoneTaskEntity** (`maxScore`) →
  **UserMilestoneTaskEntity** (one per learner) → has many
  **UserMilestoneTaskAttemptEntity** (`attemptNumber`, `score`).
- **UserChallengeProgressProjectionEntity** (`user_challenge_progress_projections`,
  one row per `enrollment_id`, aggregate stored as `jsonb value`) — the
  challenge side's persisted cache.
- Milestone-task side has no dedicated projection table; it is cached in Redis
  under `CacheKey.MilestoneTaskProgress` keyed by `enrollmentId`.

## States and transitions

### One challenge, for one enrollment — `ChallengeProgressStatus`
`NotStarted` (no `UserChallengeSubmissionEntity` row for any of the
challenge's submissions) → **learner opens/creates a submission row** →
`InProgress` (a user-submission row exists but has zero attempts, i.e. never
graded) → **grading completes** (an attempt is recorded) → either:
- `Completed` — every submission on the challenge has been submitted AND its
  latest attempt's score clears `passThreshold × submission.score`, or
- `Failed` — every submission was submitted but at least one's latest attempt
  is below threshold.

A challenge can move `Failed → Completed` on a re-attempt (a new, higher
attempt becomes "latest" by `attemptNumber`), but never the reverse — the
aggregate is always recomputed from ALL current rows, not incrementally, so
there is no stale "was Completed, now shows Failed" state possible from a
partial write. `numAttempts` is the sum of attempts across every submission on
the challenge, not scoped to the latest.

### One milestone task, for one enrollment
`not attempted` (`lastScore: 0, completed: false, numAttempts: 0`, no
`UserMilestoneTaskEntity` row) → **attempt graded** → `completed: lastScore >=
maxScore × passThreshold`. Unlike challenges there is no explicit
`InProgress`/`Failed` enum — only a boolean `completed`, plus `currentTask`:
the **first** task (in module/milestone sort order) that is not yet
`completed`, or `null` when every task in the course is done. `currentTask` is
a pointer for "resume here", not a lifecycle state of the task itself.

## Invariants

1. **Progress is always scoped by `enrollmentId`, never bare `userId` +
   `courseId`.** A resolver/handler first looks up the caller's own enrollment
   (`where: { user: { id: user.id }, course: { id: courseId } }`) and returns
   an empty result if none exists — a learner can never read another user's
   progress by supplying someone else's `courseId` alone, because the
   enrollment lookup is always self-scoped first.
2. **The stored aggregate is never partially written.** Both
   `ChallengeProgressService.computeProgress` and
   `PersonalProjectProgressService.computeProgress` rebuild the ENTIRE
   `completionTasks` array from every current row on every recompute — there
   is no incremental "bump this one task" path, so a crash mid-grade can never
   leave one task updated and its siblings stale relative to each other
   (though the whole row can still be stale relative to the DB — see the TTL
   note below).
3. **A challenge's `lastScore` is capped per-submission, then summed** — a
   submission's contribution can never exceed its own `score`, even if a
   grading model over-scores an attempt above the submission's max.
4. **Freshness is TTL-bounded, not push-only, for challenges**: reading
   `getProgress` always re-derives from the DB if the projection row is
   missing or older than `envConfig().projection.staleAfterMs` — a lost or
   delayed `ChallengeSubmissionProgressUpdated` event self-heals within that
   window rather than serving a permanently stale row. The milestone-task side
   has no such TTL check baked into `getProgress` — a cache hit is trusted
   until the key's Redis TTL expires or something explicitly calls
   `invalidateProgress`/`updateProgress`.
5. **Grading always invalidates + recomputes on the SAME code path that wrote
   the attempt** (`process-git-submission-complete-step.service.ts` and its
   Google-Docs counterpart), inside/adjacent to the grading transaction, and
   ALSO emits an event the corresponding listener uses to recompute again —
   the event is belt-and-suspenders, not the only trigger, so a missed NATS
   delivery does not leave the projection stale beyond the invalidate-on-write.

## Cross-domain notes

- `MyInProgressChallengesResolver` (the dashboard "in progress" rail) reuses
  `ChallengeProgressService.getProgress` per enrollment rather than a
  hand-rolled query — the rail's definition of "in progress" is exactly
  `InProgress ∪ Failed`, so it inherits the challenge progress state machine
  directly instead of maintaining a second one.
- Passing a challenge also feeds XP (`XpSource.Challenge`), a home-feed
  `ActivityType.ChallengePassed` row, and (via the `UserStatsProjection` CDC
  listener) the platform-wide streak — a challenge `Completed` transition is
  an upstream trigger for the `streak` domain, not just a challenge-local
  event.
