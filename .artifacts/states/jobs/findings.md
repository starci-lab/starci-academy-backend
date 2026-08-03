# Jobs — findings (ranked, most severe first)

Graded against `.claude/canon/be/enforce/authoring/{authorization,comments,naming-and-structure,
validation,testing}.md`. Scope: `src/modules/bussiness/jobs/**`,
`src/features/api/core/graphql/queries/jobs/**`, and
`src/features/socketio/core/job-notifications/**` (the resolvers/gateways that read `JobEntity`
directly).

---

## 1. [security] No owner check on the job-notifications socket subscription — any authenticated client can watch any job's status/error by id

**File:** `src/features/socketio/core/job-notifications/subcribe/handle-subcribe/subcribe.handler.ts:52-68`

`SubcribeJobNotificationHandler.process()` joins the caller's socket to `jobRoomService.name(jobId)`
and returns the job's full status payload (`status`, `error`, `category`, `actionType`,
`challengeSubmissionId`) for whatever `jobId` the client sends — with **zero comparison** against
`client.data.userId` (the Keycloak-verified id the socket middleware attaches on connect,
`src/modules/socketio/middlewares/keycloak-auth.ts:60`). `JobActionService.getJob` is called with
`{ id }` alone (`job-action.service.ts:62-85`), and the room is joined BEFORE that lookup even
resolves.

Per `authorization.md` §3: "a by-id endpoint carries the owner in its `where`... an RPC or resolver
that takes an id but forgets the owner is an IDOR." This is exactly that class, on the socket
transport instead of GraphQL. Job ids are UUIDs (not brute-forceable), but they are handed to the
client in plaintext by every submit/enqueue mutation response (e.g.
`submit-challenge-submission.handler.ts:396` returns `{ jobId: job.id }`) and are visible in browser
network tabs, so a second user who obtains one (shared screenshot, support ticket, logging) can
subscribe to it and read another learner's grading error message and pass/fail outcome. What breaks:
a job's status/error — which can embed submission details in the error string — leaks cross-user.

**Fix direction (not applied — read-only scan):** compare `job.userId` (nullable — system jobs have
none) to `client.data.userId` before joining the room / returning data, mirroring the pattern already
used by `GraphQLProfileVisibilityGuard` elsewhere in the codebase.

---

## 2. [business-logic] 10 of 16 enqueue services swallow a broker failure with no `.catch` — the `jobs` row is stranded `Queued` forever, unobserved

**Files (each: `void sleepEnqueueUxDelay().then(() => queue.add(...))` with no `.catch`):**
- `src/modules/bussiness/jobs/enqueue/generate-personal-project-tasks.service.ts:81-89`
- `src/modules/bussiness/jobs/enqueue/process-personal-project.service.ts:80-88`
- `src/modules/bussiness/jobs/enqueue/resolve-github.service.ts:128-136`
- `src/modules/bussiness/jobs/enqueue/revoke-github.service.ts:128-136`
- `src/modules/bussiness/jobs/enqueue/send-mail.service.ts:67-75`
- `src/modules/bussiness/jobs/enqueue/sync-cdn.service.ts:63-71`
- `src/modules/bussiness/jobs/enqueue/sync-elasticsearch.service.ts:63-71`
- `src/modules/bussiness/jobs/enqueue/sync-email-bloom-filter.service.ts:59-67`
- `src/modules/bussiness/jobs/enqueue/sync-indexer.service.ts:63-71`
- `src/modules/bussiness/jobs/enqueue/sync-scylladb.service.ts:62-70`

The design invariant this domain documents for itself (see the 5 sibling services that DO catch —
`enroll.service.ts`, `judge-coding-submission.service.ts`, `process-git-submission.service.ts`,
`process-google-docs-submission.service.ts`, `review-ai-lab-eval.service.ts`,
`review-personal-project-task.service.ts`) is: create the `jobs` row, THEN push to the broker, and if
the push fails, call `failJob` so the row (and anyone watching it) reflects reality. These 10 services
persist the row, then `.then()` a broker push with no `.catch` at all. If `queue.add()` rejects
(Redis down, connection reset), the row is left `status: Queued` permanently — no `error`, no
`JobStatusUpdated` event — and it is an **unhandled promise rejection** in the Node process (severity
of that depends on the process's global rejection handler, which is out of this domain's files to
verify). What breaks: a user action (send a CV-score request, generate personal-project tasks,
resolve/revoke a GitHub invite, send a transactional email, any of the 5 sync-* infra jobs) can
silently vanish into a `Queued` row nobody will ever see move, with no operator alert and no user-
facing error.

---

## 3. [business-logic] `completeJob`/`increaseJob` honor `expectedFencingToken`; `failJob` has no such parameter at all — a fenced-out zombie worker can still overwrite a fresher attempt's outcome

**Files:** `src/modules/bussiness/jobs/atomic/job-action.service.ts:242-267` (`failJob`) vs. the same
file's `increaseJob` (142-173) and `completeJob` (179-233); the type gap is in
`src/modules/bussiness/jobs/types/job.ts:77-83` (`FailJobParams` — no `expectedFencingToken` field,
unlike `IncreaseJobParams` line 66 and `CompleteJobParams` line 74).

The domain's own stated invariant (JobEntity's JSDoc, `job.entity.ts:213-216`): "Monotonic token
bumped on every claim/requeue. Side-effect writes guard on it so a zombie worker (lease lost, then
resumed) cannot double-apply." That guard is real for the "step forward" and "succeed" transitions,
but the "fail" transition has no fencing check AT ALL — `failJob` unconditionally sets
`status = Failed` on whatever row `job` points to. Concretely: worker A claims a job
(`processingJob` -> `fencingToken: 5`), BullMQ marks it stalled and reassigns it, worker B claims it
(`processingJob` -> `fencingToken: 6`) and completes it successfully
(`completeJob({ expectedFencingToken: 6 })` — correctly guarded, succeeds). If worker A (the zombie,
still holding the stale token 5) then errors out on its own stale attempt and calls
`failJob({ job })`, the row flips from `Completed` back to `Failed` with no token check to stop it —
overwriting a legitimately succeeded job. What breaks: a challenge submission or CV grade that
genuinely passed can be silently flipped to `Failed` by a straggling zombie worker, and the front end
(reading `JobStatusUpdated`) shows the wrong outcome.

---

## 4. [test-tier] 18 of 19 files under `src/modules/bussiness/jobs/**` have zero unit spec — including the entire job state machine

**Files with no `.spec.ts` sibling:** `atomic/job-action.service.ts` (create/increase/complete/fail/
processing/save+load-execution-result — every transition in `business.md`), `atomic/job-stalled.
service.ts` (`requeueJob`), and 15 of the 16 `enqueue/*.service.ts` files. The lone spec in the
domain is `enqueue/reconcile-transaction.service.spec.ts`.

Per `testing.md` §1, unit is "where a branch, a thrown exception, or an edge case belongs by
default" and "the one that runs on every save and every CI push." `JobActionService` alone has at
least 6 branches worth locking down (the `expectedFencingToken` guard path on both `increaseJob` and
`completeJob`, the `emitChangeEvent` toggle on 3 methods, the `SuperJSON` round-trip in
save/loadExecutionResult) and none of them are pinned by a test — meaning findings #2 and #3 above
could regress silently with no CI signal either way.

---

## 5. [gate-middleware] `incompletedJobs` is guarded by `GraphQLMustEnrolledGuard`, which checks enrollment in an ARBITRARY course the query never uses

**Files:** `src/features/api/core/graphql/queries/jobs/incompleted-jobs/incompleted-jobs.resolver.ts:48-51`
guards with `KeycloakAuthGraphQLGuard, GraphQLMustEnrolledGuard`; the guard
(`src/modules/bussiness/guards/graphql-must-enrolled.guard.ts:37-56`) reads an `x-course-id` HTTP
header and throws unless the caller is enrolled in THAT course. But
`incompleted-jobs.handler.ts:57-84` filters jobs only by `userId` and `actionType` — it never reads or
uses the header's course id, and the jobs it returns can belong to any course the user has ever
submitted to. A user enrolled in Course A but querying about a stuck submission in Course B can
satisfy the guard by sending Course A's id in the header (any enrolled course passes) and still get
back Course B's job status. The guard is not wrong per se (it does require SOME real enrollment,
so it is not a bypassable auth hole), but it is the wrong check for this query — it reads as
course-scoped access control while doing nothing course-scoped at all, and a reader has no way to
tell that from the resolver alone. Filed as a judgement call (no canon rule says "a guard's checked
resource must match the query's filter", but `authorization.md` §2's whole point — the domain check
names the real rule — is undermined when the named rule and the enforced rule diverge).

---

## 6. [security] `JobStalledService.requeueJob` and 4 `Enqueue*JobService.enqueue({ jobId })` requeue paths perform no ownership check — currently dead code, but IDOR-shaped

**Files:** `src/modules/bussiness/jobs/atomic/job-stalled.service.ts:44-83`; the optional `jobId`
requeue branch in `enroll.service.ts:180-188`, `process-git-submission.service.ts:78-84`,
`process-google-docs-submission.service.ts:76-82`, `judge-coding-submission.service.ts:72-76`.

`requeueJob({ id })` loads `JobEntity` by `where: { id }` alone and unconditionally resets
`queueAt`/`status`/`fencingToken`/`attempts`/`error` — no `userId` in the `where`, no comparison
against a caller. Per `authorization.md` §3 this is the textbook shape of "a by-id endpoint carries
the owner in its `where`... forgets the owner is an IDOR." As of this scan, `jobId` is never actually
supplied by any GraphQL resolver in the tree (verified: every caller of these 4 `enqueue()` methods
only ever reads back `job.id` from the response, never sends one in) — so there is no LIVE exploit
today. It is filed here because the primitive itself carries no defense, so the day a "retry my failed
submission" mutation is wired up to pass a client-supplied `jobId` through, it will silently let any
authenticated user reset/reclaim any other user's job unless whoever wires it remembers to add the
owner check by hand — exactly the "one refactor from being dropped" pattern the canon warns about.

---

## 7. [business-logic] `jobs.attempts` / `jobs.max_attempts` are never enforced by application code — the documented "poison-pill cap -> DLQ" does not exist

**Files:** `src/modules/databases/postgresql/primary/entities/job.entity.ts:177-211` (the columns and
their JSDoc: "How many times this job has been dispatched/run (poison-pill cap -> DLQ)" / "Max dispatch
attempts before dead-lettering"); the only place either column is touched anywhere in `src/` is
`job-stalled.service.ts:75`, which RESETS `attempts` to 0 on manual requeue. No code path increments
`jobs.attempts`, and nothing compares it to `jobs.max_attempts` to dead-letter a job. The actual retry/
backoff mechanism is BullMQ's own broker-level config
(`src/modules/bullmq/bullmq.module.ts:60-66`: `defaultJobOptions.attempts` + exponential backoff),
which is a separate counter the Postgres row never sees. What breaks: a reader of the `jobs` table
(an ops dashboard, a support query) sees `attempts: 0, maxAttempts: 5` on every row forever and
reasonably concludes the dead-letter cap is live, when in fact BullMQ may have already exhausted its
OWN retry budget and moved on — the two numbers are unrelated and only one of them does anything.

---

## 8. [naming] Google Docs submission jobs silently borrow the Git-submission env config for `maxSteps`/cooldown

**File:** `src/modules/bussiness/jobs/enqueue/process-google-docs-submission.service.ts:112`
(`maxSteps: envConfig().job.processGitSubmission.maxSteps`).

There is no `job.processGoogleDocsSubmission` key in `envConfig()` (confirmed against
`src/modules/env/config.ts:1838-1884`, which defines only `job.enroll`, `job.processCvSubmission`,
`job.processGitSubmission`, `job.sendMail`, `job.judgeCodingSubmission`) — the Google Docs pipeline
reuses `JOB_PROCESS_GIT_SUBMISSION_MAX_STEPS` and (transitively, wherever `cooldownMs` from the same
block is read for this pipeline) the Git submission's cooldown. A maintainer tuning
`JOB_PROCESS_GIT_SUBMISSION_MAX_STEPS` to change the Git grading pipeline's step count unknowingly
changes the Google Docs pipeline too — the config key's name lies about what it controls at this call
site (`naming-and-structure.md`'s "the file/symbol name says what it is" spirit applied to a config
key instead of a file).

---

## 9. [jsdoc] `incompletedJobs`'s CQRS trio carries no class-level JSDoc

**Files:** `src/features/api/core/graphql/queries/jobs/incompleted-jobs/incompleted-jobs.handler.ts:36`
(`IncompletedJobsHandler`), `incompleted-jobs.service.ts:18` (`IncompletedJobsService`),
`incompleted-jobs.query.ts:5` (`IncompletedJobsQuery`) — none of the three classes has a doc comment
above the class declaration (the resolver's `@Query(...)` decorator carries a description, but per
`comments.md` §3 / the canon's "JSDoc required on every public class, method, and interface", the
handler/service/query classes still need their own). Low severity — the resolver's inline description
covers the reader-facing intent — but it is the one gap in an otherwise fully-JSDoc'd domain (every
class in `atomic/` and every `Enqueue*JobService` carries a class comment).
