# Jobs — background-job orchestration (state machine)

Source: `src/modules/bussiness/jobs/**` (entities from `@modules/databases`), plus the one GraphQL
surface that reads job rows directly: `src/features/api/core/graphql/queries/jobs/incompleted-jobs/**`,
and the socket surface that streams job updates:
`src/features/socketio/core/job-notifications/**`. Written for a front-end reader who never opens the
backend: what a "job" is, what states it moves through, and what can never be true at once.

## What a job is

Every background unit of work — grading a submission, enrolling a course, sending an email, syncing
a search index — is tracked as one row in `jobs` (`JobEntity`). `jobs` is deliberately an
**infrastructure table with no foreign keys into domain tables**: it is shared by every kind of work
(`actionType`), so a submission row, an enrollment row, a CV row never get a hard reference from it.
Instead:

- `jobs.user_id` is a loose (nullable) owner id — set for user-triggered work, `null` for system jobs
  (e.g. an outbound email with no end-user).
- `jobs.refs` (jsonb, `JobRefs`) is a loose correlation map — `challengeSubmissionId`,
  `userChallengeSubmissionId`, `enrollmentId`, `taskId`, `aiLabRunId`, `cvSubmissionId` — filled in
  loosely by whichever caller created the job.
- `jobs.payload` (text, SuperJSON-serialized) is the actual worker input; the queryable columns above
  exist only so the API/socket layer can list and filter jobs without deserializing the payload.

A job also carries a UI-facing `category` (`JobCategory`: `submitChallenge`, `reviewCv`, `reviewTask`,
`judgeCoding`) distinct from its `actionType` (23 specific kinds, e.g. `enroll`,
`processGitSubmission`, `sendMail`, `reconcileTransaction`…). `category` is the bucket the front end
groups realtime job cards by; it is `null` for actions that aren't tied to a "learn UI" bucket at all
(enroll, the sync/* infra jobs, send-mail).

## States and transitions (`JobStatus`)

```
        createJob()                 processingJob()
Queued ───────────────► Queued ─────────────────────► Processing
  ▲                        │                                │
  │  requeueJob()          │ completeJob()                  │ completeJob()
  │  (manual retry)         ▼                                ▼
  └───────────────────  Failed ◄──────────────────────── Completed
                          failJob()
```

- **Queued** — the row exists (`createJob`), `currentStep = 0`, `queueAt = now()`. A BullMQ job with
  the same id is pushed to the broker (after an optional short `sleepEnqueueUxDelay()` so the front
  end can render a "queued…" state without a flash before the broker job exists).
- **Processing** — a worker claimed the job (`processingJob`): status flips to `Processing` **and**
  `fencingToken` is bumped by 1. The bumped token is handed back to the worker so its later writes can
  be guarded against being a stale/zombie claim.
- **Completed** — `completeJob`: `currentStep` snaps up to `maxSteps` (if it hadn't reached it),
  `error` is cleared. Emits `JobStatusUpdated` by default (skippable via `emitChangeEvent: false`).
- **Failed** — `failJob`: `error` is set, status flips to `Failed`. Also emits `JobStatusUpdated` by
  default.
- **Requeued (Queued again)** — `requeueJob` is the ONLY manual, user-triggered path back to `Queued`
  from any state: resets `queueAt`, `status → Queued`, bumps `fencingToken` (fences out any zombie
  worker still running the old attempt), resets `error → null` and `attempts → 0`. `currentStep` is
  deliberately KEPT — side effects inside a job are idempotency-keyed, so resuming from the same step
  never double-applies. (Automatic stalled-job recovery — lock expiry, `stalledInterval`,
  `maxStalledCount` — is owned by BullMQ itself; the old Postgres `queueAt` sweeper was removed.)

`currentStep` / `maxSteps` track progress within a job (`increaseJob` bumps `currentStep`, optionally
guarded by `expectedFencingToken`) — this is what a progress bar reads.

`executionResults` (SuperJSON map, keyed by an arbitrary string) lets a multi-step job stash and later
read back per-step output (`saveExecutionResult` / `loadExecutionResult`) without a second table.

## Invariants

1. **`fencingToken` is a zombie-write guard.** It is a monotonic counter bumped on every claim
   (`processingJob`) and every manual requeue (`requeueJob`). A caller that captured the token at
   claim time can pass it as `expectedFencingToken` to `increaseJob` / `completeJob`; if the row's
   token has since moved (a newer worker claimed it, or it was requeued), the write is REJECTED with
   `JobFencedOutException` instead of silently landing. This is what stops a worker that lost its
   BullMQ lock (stalled → reassigned) from still mutating the row after a fresher attempt took over.
   (`failJob` does NOT participate in this guard at all — see findings.)
2. **One `(payload, status)` pair per job id** — `jobs.id` doubles as the BullMQ job id
   (`queue.add(job.id, job.payload, { jobId: job.id })`), so the Postgres row and the broker job are
   always 1:1 and correlatable by the same id.
3. **Enqueue is meant to be atomic with the tracked row, but the discipline is inconsistent.** Every
   `Enqueue*JobService.enqueue()` creates (or requeues) the `jobs` row FIRST, then pushes to the
   broker. 6 of 16 either await the push and rethrow on failure (marking the row `Failed` first —
   `enroll`), or fire-and-forget with a `.catch` that marks the row `Failed` (`judge-coding-
   submission`, `process-git-submission`, `process-google-docs-submission`, `review-ai-lab-eval`,
   `review-personal-project-task`). The other 10 fire-and-forget with NO `.catch` at all — see
   findings for the full list and consequence.
4. **`Enroll` fan-out is per-course-idempotent, not per-transaction-idempotent at the DB layer.** A
   paid, multi-course transaction fans out to one `enroll` job per course
   (`EnqueueEnrollJobService.enqueueForTransaction`), each enqueued sequentially and AWAITED (a broker
   failure on line 3 of 5 propagates so the webhook returns non-2xx and the gateway re-delivers); each
   individual enroll job is documented as idempotent per `(user, course)` downstream, so a re-delivery
   safely re-walks the same lines.
5. **An installment (trả góp) plan is created at most once per origin transaction** — gated by an
   existence check on `InstallmentPlanEntity.originTransaction`, inside the same
   `enqueueForTransaction` call that fans out the enroll jobs.
6. **`attempts` / `maxAttempts` are columns without a mechanism** — they exist on `JobEntity` and are
   reset on manual requeue, but nothing in application code increments or enforces them; real
   retry/backoff is BullMQ's own broker-level `defaultJobOptions.attempts` config, a separate counter
   the Postgres row never observes. See findings.

## The one client-facing read: `incompletedJobs`

`incompletedJobs` (GraphQL query) returns `{ jobId, status }` for the CALLING user's own jobs that are
`Queued` or `Processing`, restricted to `ProcessGitSubmission` / `ProcessGoogleDocsSubmission`
(the two challenge-grading pipelines a page reopens against), ordered newest-queued-first. It is the
one place the front end lists "what's still running" without a socket connection. It is guarded by
`KeycloakAuthGraphQLGuard` + `GraphQLMustEnrolledGuard` (requires an `x-course-id` header naming SOME
course the caller is enrolled in) even though the query itself is course-agnostic — see findings.

## Realtime: job-notifications socket

A client subscribes to one `jobId` room over the `/job_notifications` namespace
(`SubcribeJobNotificationHandler`); on `JobStatusUpdated` (emitted by `completeJob` / `failJob` /
`processingJob`), every socket in that job's room gets `{ jobId, challengeSubmissionId, category,
actionType, status, error }`. This is how a grading spinner flips to pass/fail without polling. The
subscribe handler does not check that the subscribing socket owns the job — see findings (this is the
top security finding for the domain).
