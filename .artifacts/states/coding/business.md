# Coding — business state map

Source: `src/modules/bussiness/coding/` (`coding-problem.service.ts`,
`coding-progress.service.ts`, `coding-submission.service.ts`) + entities
under `src/modules/databases/postgresql/primary/entities/coding-*.ts`.
Resolvers: `src/features/api/core/graphql/{mutations,queries}/coding/**` and
the public-profile reads under `.../queries/users/user-coding-*`. The
`challenge-submissions` resolver group elsewhere in the tree is a different
domain (owned by another business module, not `coding` — it never calls
`CodingProblemService`/`CodingSubmissionService`/`CodingProgressService`).

A LeetCode-style coding-practice feature: a shared problem catalog, a
submit → async-judge → verdict pipeline, and per-user solved/attempted/
revealed progress. This domain owns problem reads, submission create +
history, and progress; the actual judging (verdict transition) happens
outside this domain, in `src/features/api/processors/judge-coding-submission/`
(a separate async worker pipeline, not graded here).

## Entities

- **CodingProblemEntity** (`coding_problems`) — `slug` (stable, unique),
  `difficulty`, `points`, `domain`, `tags`, `enabled`. Owns `testcases`
  (`OneToMany`, includes BOTH sample and hidden cases — see Finding #2),
  `starterCodes` (per language), and `solutions` (full reference answers per
  language — deliberately **not** a GraphQL `@Field`, so the schema itself
  cannot serialize it regardless of what a resolver loads).
- **CodingSubmissionEntity** (`coding_submissions`) — one row per attempt:
  `language`, `sourceCode`, `verdict` (see the enum below), `passedCount`/
  `totalCount`, plus anti-cheat capture (`ipAddress`, `userAgent`,
  `deviceFingerprint`, `clientTelemetry`, `suspicionScore`,
  `flaggedForReview`). Never updated after creation by this domain — the
  judge worker owns the pending → terminal-verdict transition.
- **CodingSolutionRevealEntity** (`coding_solution_reveals`) — one row per
  `(user, problem)`, append-only forfeit marker: its mere existence means
  "this user peeked the answer for this problem."
- **CodingVerdict** enum — `pending` (row created, not yet judged) →
  `judging` (Judge0 batch submitted) → one terminal value: `accepted`,
  `wrongAnswer`, `timeLimitExceeded`, `memoryLimitExceeded`, `runtimeError`,
  `compileError`, `internalError` (infra/judge fault unrelated to the user's
  code). This domain only ever writes `pending`; every later transition
  happens in `judge-coding-submission-judge-step.service.ts` /
  `judge-coding-submission.worker.ts`, outside `modules/bussiness/coding`.

## Submission lifecycle (`CodingSubmissionService.submit`)

1. Resolve the target problem by `slug` — must exist AND be `enabled`, else
   `CodingProblemNotFoundException`.
2. Score the attempt for AI/paste-cheat likelihood via `AntiCheatService`
   (never blocks the submit — a suspicious attempt is still judged, just
   flagged).
3. Persist a fresh `CodingSubmissionEntity` with `verdict = Pending`.
4. Best-effort remember the device (`DeviceService.recordDevice`) — see
   Finding #1: this call is NOT actually resilient to its own failure
   despite being commented "best-effort."
5. Enqueue the async judging job (`EnqueueJudgeCodingSubmissionJobService`,
   from the `jobs` domain) and return `{submissionId, jobId}` for the client
   to subscribe to over Socket.IO.

**Solution reveal is a one-way forfeit switch**: `recordSolutionReveal` is
idempotent per `(user, problem)` — a repeat call still returns the
solutions but does not re-record. There is no corresponding "un-reveal";
once forfeited, this domain has no code path to restore eligibility for a
first-solve reward on that problem (the reward logic itself, if any, lives
outside this domain's read of `CodingSolutionRevealEntity`).

## Progress (`CodingProgressService`) — cached, event-invalidated

Per-user progress (`solvedProblemIds`, `attemptedProblemIds`,
`revealedProblemIds`, `totalPoints`) is a Redis-cached read
(`CacheKey.CodingProblemProgress`, keyed by `userId`), computed on a cache
miss from four raw SQL aggregates over `coding_submissions` /
`coding_solution_reveals` / `users.coin_balance`, and invalidated
(`invalidate()`) whenever a submission is judged. **`totalPoints` here is the
user's whole spendable Coin balance, not a coding-only figure** — the
service's own doc flags this explicitly and points callers wanting a true
"coding points" metric at the `user_xp` projection's per-source breakdown
instead.

## Problem catalog reads (`CodingProblemService`) — Elasticsearch-backed, never leaks hidden data

- `list()` and `getBySlug()` both read from a per-locale ES index (never
  Postgres) — pre-localized, `enabled: true` only, and (per `getBySlug`'s own
  comment) the ES sync builder only ever indexes SAMPLE testcases, dropping
  hidden ones and all reference solutions before they reach the index. This
  is the actual enforcement point for "hidden testcases/solutions never
  leak" — not a field-level check on the entity itself (see Finding #2).
- `getHint()` reads a separate ES index (`coding-problem-hints-<locale>`),
  falling back to English when the requested locale has no hint, and
  treating an empty `hint` string the same as "no document."

## Invariants

1. **A submission's `sourceCode`/`perCaseResults`/reference solutions never
   reach the public-profile read** — `getAcceptedSummary` (backing
   `userCodingProblemDetail`) is deliberately hand-rolled to a narrow
   `AcceptedSubmissionSummaryResult`, never the raw `CodingSubmissionEntity`.
2. **A problem's reference solutions reach the client through exactly one
   gate**: `recordSolutionReveal` (`revealCodingSolution` mutation). The
   catalog detail read (`codingProblem` query) never carries them — enforced
   at the schema level (`solutions` carries no `@Field`), not by read-time
   stripping.
3. **XP/points for coding never routes through this domain's own code** —
   `CodingProgressService.totalPoints` reads `users.coin_balance` directly;
   any coding-specific XP grant (if one exists) is written by the judge
   worker or another domain, not by anything under
   `src/modules/bussiness/coding/`.
4. **A submission is created exactly once per `submit()` call** — unlike
   flashcard's review-row upsert, there is no "existing row" branch here;
   every submit is a fresh insert, so there is no analogous
   read-then-branch race to worry about for submission creation itself.
5. **Disabled or unknown problems are uniformly 404** across `list`
   (filtered out, never individually reported), `getBySlug`, `submit`, and
   `listMine` — all four independently re-check `enabled: true`.

## Cross-domain notes

- `CodingSubmissionService` depends on `EnqueueJudgeCodingSubmissionJobService`
  (the `jobs` domain), `AntiCheatService` (the `anti-cheat` domain), and
  `DeviceService` (the `device` domain) — all three live in sibling
  `bussiness` modules, wired directly into `CodingModule`'s own `providers`
  rather than re-exported from elsewhere.
- The public-profile queries (`user-coding-history`, `user-coding-progress`,
  `user-coding-rank`, `user-coding-skills`, `user-coding-problem-detail`)
  read a *target* user's data (the profile being viewed), guarded by
  `KeycloakOptionalAuthGraphQLGuard` rather than the caller-only
  `KeycloakAuthGraphQLGuard` the `my-coding-*` queries use — this is a
  deliberate, different shape (public data about someone else) rather than
  an inconsistency.
