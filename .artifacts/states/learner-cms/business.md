# Learner-CMS — business map

Source read: `src/modules/bussiness/learner-cms/**`,
`src/features/api/core/graphql/queries/learner-cms/{my-challenge-submissions,my-learning-feedbacks,my-milestone-task-attempts}/**`.

## What this domain is

Three read-only, self-service "my history" lists for the currently authenticated learner — the CMS a
learner uses to review their own past work, not an admin CMS. Each is a **plain paginated list keyed
by the viewer** (the codebase's own name for this shape is "the LIST exception"): no CQRS
query/handler split, no Elasticsearch, no projection table — the service runs raw parameterised SQL
straight against the primary Postgres `EntityManager` on every request, and the GraphQL resolver calls
that service directly with no intermediate `.service.ts` layer.

There are three services, one per list, all shaped identically (page query + count query run in
parallel via `Promise.all`, mapped into a typed `{ items, total }` envelope):

## 1. Challenge-submission attempts (`ChallengeSubmissionsCmsService` -> `myChallengeSubmissions`)

Every attempt the learner has ever made at a graded challenge, newest first. Joins
`user_challenge_submission_attempts -> user_challenge_submissions -> challenge_submissions ->
challenges (LEFT) -> contents -> modules -> courses`. The `challenges` join is LEFT because "V1 rows
may lack it" (a pre-migration data shape).

**Status is derived, not stored**, purely from two columns at read time:
- `processed_at IS NULL` -> **"pending"** (grading has not finished)
- `processed_at` set AND `score > 0` -> **"passed"**
- `processed_at` set AND `score` is null/0 -> **"failed"**

This three-way bucket is the domain's only real state machine, and it lives entirely in
`ChallengeSubmissionsCmsService.deriveStatus` — the GraphQL `status` field is a bare `string`, not an
enum, so nothing outside that one method enforces the three literal values stay exactly
`"pending"|"passed"|"failed"`.

## 2. Milestone-task review attempts (`MilestoneTaskAttemptsCmsService` -> `myMilestoneTaskAttempts`)

Every attempt at a personal-project milestone task, newest first. Joins
`user_milestone_task_attempts -> user_milestone_tasks -> milestone_tasks -> milestones`, and
separately `-> enrollments -> courses` for ownership + course title. Unlike challenge submissions,
this state is NOT derived — `passed: boolean` and `score: number` are read straight off the attempt
row; there is no third "pending" bucket surfaced here (a milestone attempt row apparently only exists
once graded).

## 3. Merged learning feedback (`LearningFeedbacksCmsService` -> `myLearningFeedbacks`)

A single newest-first feed merging feedback **from two sources** via `UNION ALL` inside one CTE, so
pagination stays correct across both without an in-memory fetch-merge-slice:
- `"challenge"` — `user_challenge_submission_feedbacks`, reached via the same
  attempt->submission->challenge->course join chain as list 1.
- `"task"` — `user_milestone_task_attempt_feedbacks`, reached via
  attempt->user_milestone_task->milestone_task->enrollment->course.

**Drift already flagged in the code's own comments**: a third source, CV-review feedback
(`cv_submission_attempts.detail_feedback`), was dropped when the legacy `cv_submissions` /
`cv_submission_attempts` tables were retired, because the replacement `cv_generations.feedback` is
jsonb-shaped differently and was not a drop-in UNION branch. The service's own JSDoc documents this
removal. **The resolver's JSDoc was not updated to match** — see `findings.md` axis "comments".

## Invariants a screen can rely on

- All three lists are hard-scoped to the caller's own `user.id` (via the JWT, never a client-supplied
  id) both in the resolver's guard (`KeycloakAuthGraphQLGuard`, mandatory — none of these three is
  optional-auth) and in the SQL's `WHERE ... = $1` — there is no cross-user leak path.
- Every list clamps `limit` into `[1, 100]` and floors `offset` at `0` before it reaches SQL — a
  client cannot request an unbounded scan.
- `total` on every list ignores the page window (it is a separate, unwindowed COUNT over the same
  join/union), so a FE pager's "N of total" is always the true total, not the current page size.
- The merged feedback list's `id` is synthesised (`${source}:${absoluteOffset}`) because the union has
  no shared primary key — it is stable for a given page slot, not a durable row identity across pages.
