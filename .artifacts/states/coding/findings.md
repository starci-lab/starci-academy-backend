# Coding — findings

Ranked most severe first. Axes per starci-be-deepscan-map: naming, jsdoc,
business-logic, edge-case, security, gate-middleware, test-tier.

## 1. [edge-case] "Best-effort" device recording is not actually resilient to its own failure
`CodingSubmissionService.submit()` (`coding-submission.service.ts:92-123`)
persists the `CodingSubmissionEntity` (verdict `Pending`), THEN calls
`await this.deviceService.recordDevice(...)` with the inline comment
"best-effort: remember the device this submission came from" — but the call
is not wrapped in a try/catch, and `DeviceService.recordDevice`
(`src/modules/bussiness/device/device.service.ts:41-71`) has no internal
error handling either (a plain `findOne` + `save`). If this write throws for
any reason (a transient DB error, a constraint conflict), the whole
`submit()` call rejects AFTER the submission row already exists in the DB —
the client gets an error response as if nothing was created, but a
`Pending` row is now stranded forever, since the judging-job enqueue
(`enqueueJudgeCodingSubmissionJobService.enqueue`) never runs for it. A
comment claiming "best-effort" should mean a failure here cannot take down
the primary flow; today it can.
- `src/modules/bussiness/coding/coding-submission.service.ts:117-123`
- `src/modules/bussiness/device/device.service.ts:41-71` (no internal resilience either)

## 2. [gate-middleware] Hidden testcase protection is enforced by convention (the ES sync builder), not by the schema
`CodingProblemEntity.testcases` (`coding-problem.entity.ts:224-238`) is a
real GraphQL `@Field(() => [CodingProblemTestcaseEntity])` carrying BOTH
sample and hidden cases in the DB relation, with only a comment —
"Hidden testcases are never exposed to non-admin users" — as the guarantee.
Today that guarantee holds only because every current reader
(`CodingProblemService.list`/`getBySlug`) reads from the Elasticsearch index
instead of Postgres, and the ES sync builder
(`src/modules/init/synchronizers/elasticsearch-synchronizer/builder/coding-problem.service.ts:85`)
is the one place that actually filters hidden cases out before indexing.
There is no field-level resolver guard (e.g. a role-checked `@ResolveField`)
and no separate "public testcases" DTO — a future resolver that does
`entityManager.findOne(CodingProblemEntity, {relations: {testcases: true}})`
and returns the entity directly (the natural thing to reach for, since the
GraphQL field already exists) would leak every hidden testcase with zero
additional code required. Contrast with `solutions` on the same entity
(`coding-problem.entity.ts:256-269`), which is NOT a `@Field` at all — that
one is schema-enforced and cannot leak regardless of what a resolver loads.
- `src/modules/databases/postgresql/primary/entities/coding-problem.entity.ts:224-238` (field-level exposure relies on convention)
- `src/modules/databases/postgresql/primary/entities/coding-problem.entity.ts:256-269` (contrast: `solutions` is schema-enforced, not convention-enforced)

## 3. [test-tier] `CodingProgressService` (the cache-backed progress read) has zero unit tests
`coding-problem.service.spec.ts` and `coding-submission.service.spec.ts`
exist, but `coding-progress.service.ts` — the cache-hit/cache-miss branch,
the four raw-SQL aggregates, and the `totalPoints`-is-actually-coin-balance
mapping — has no `*.spec.ts` anywhere in
`src/modules/bussiness/coding/`. What breaks: a change to the cache-hit
guard (`Array.isArray(cached.solvedProblemIds)`) or to any of the four SQL
strings in `compute()` has no automated check that the shape returned on a
cache hit still matches a cache miss.
- `src/modules/bussiness/coding/coding-progress.service.ts` (whole file, no spec)

## 4. [naming] `AcceptedSubmissionSummaryRow` mixes snake_case DB-aliased fields into an otherwise camelCase types file
`passed_count`, `total_count`, and `first_solved_at`
(`src/modules/bussiness/coding/types/index.ts:179-188`) are snake_case while
every other interface in the same file is camelCase — deliberate, since they
mirror the raw SQL's `AS "passed_count"` column aliases
(`coding-submission.service.ts:287-291`) rather than an app-level shape, and
the interface's own JSDoc says as much ("Raw row from the
accepted-submission-summary SQL aggregate"). Low severity: worth a one-line
note in the interface doc for a reader who has not seen the SQL, since the
casing break otherwise reads as an oversight rather than a deliberate mirror.
- `src/modules/bussiness/coding/types/index.ts:179-188`
