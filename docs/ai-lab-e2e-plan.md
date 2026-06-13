# AI Lab — E2E Test Plan

Scope: the AI Lab feature (playground runs over Socket.IO + the async eval-runner
that grades a submitted prompt template against an eval set). This plan follows the
repo's established e2e pattern: **Testcontainers Postgres + a focused Nest module +
`AiInvokeService` mocked** (see `apps/core/test/app/sepay-webhook.e2e-spec.ts` and
`apps/core/test/setup-e2e.ts`).

## Non-negotiable: never hit a real model in CI

Every LLM call in this feature funnels through `AiInvokeService.invoke(...)`
(`src/modules/ai/ai-invoke.service.ts`) — both the per-case grading invoke and the
LLM-judge invoke in `AiLabEvalService`, and the playground stream uses the same lane
resolution. In tests we **always provide `AiInvokeService` as a jest mock** that
returns deterministic `{ text, model, provider, attempts }`. The embedding metric's
`EmbeddingModelService.get().embedQuery(...)` is likewise mocked when an embedding
case is exercised. No network, no tokens, fully reproducible verdicts.

Lane resolution (`resolveGradingInvokeOptions`) and entitlement
(`AiEntitlementService`) are real where a test asserts the lane/credit behaviour,
and mocked where a test only cares about grading correctness.

## Test infrastructure (reuse, don't reinvent)

- **DB**: `setup-e2e.ts` boots `postgres:16-alpine` via `@testcontainers/postgresql`,
  exports the `POSTGRESQL_PRIMARY_*` env vars, and sets `SYNCHRONIZE=true` so TypeORM
  builds the whole schema on connect. `teardown-e2e.ts` stops it. Config:
  `apps/core/test/jest-e2e.json` (`--runInBand`, 120s timeout, `diagnostics:false`).
- **Focused module**: import `PrimaryPostgreSQLModule.register({ isGlobal: true,
  withHydration: false, withSeeders: false, withResolvers: false })` so only the
  datasource + entities load (no global app graph). Register just the AI Lab
  providers the test drives, plus mocks for everything external.
- **Isolation**: `TRUNCATE ... RESTART IDENTITY CASCADE` in `afterEach`, mirroring
  the sepay spec.

## What to mock vs. run real

| Concern | Real | Mocked |
| --- | --- | --- |
| Postgres + entities | yes (Testcontainers) | — |
| `AiLabEvalService`, `AiLabEvalMetricService` | yes | — |
| LLM provider call (`AiInvokeService`) | — | yes (deterministic text) |
| Embedding model (`EmbeddingModelService`) | — | yes (deterministic vectors) |
| BullMQ queue / Redis (`EnqueueReviewAiLabEvalJobService`) | — | yes (assert enqueue only) |
| `AiEntitlementService` / `CreditUsageService` | real or mock per test | per test |
| Socket.IO server | per playground test | — |

## Test 1 — Eval-runner happy path (IMPLEMENTED)

File: `apps/core/test/app/ai-lab-eval-runner.e2e-spec.ts`.

The eval-runner is a two-step BullMQ job (`grade` → `complete`,
`src/features/api/processors/review-ai-lab-eval/`). Driving the full worker needs
Redis + the job-row machinery, which is heavy and orthogonal to what we want to
prove. The **grading and the verdict-persistence are the feature logic**; the BullMQ
plumbing is shared infra already covered elsewhere. So this spec exercises the
runner's real logic end to end against the real DB without Redis:

1. Seed a real `AiLabEvalSetEntity` + ordered `AiLabEvalCaseEntity` rows (one
   `exact` case, one `contains` case) and a `UserEntity` + `EnrollmentEntity` + a
   `Pending` `AiLabEvalRunEntity` (exactly what `SubmitEvalChallengeService` writes).
2. Mock `AiInvokeService.invoke` to return the expected answer for each case (the
   deterministic "model" output), asserting temperature-0 determinism.
3. Call `AiLabEvalService.gradeEvalSet(...)` — the same call the grade step makes —
   and assert the weighted aggregate (`totalScore`, `maxScore`, `passed`) and the
   per-case results.
4. Reproduce the **complete step's** write-back in one transaction: flip the run to
   `Completed` with the verdict, delete+insert `AiLabEvalCaseResultEntity` rows.
5. Reload from Postgres and assert: run is `Completed`, `passed = true`, scores
   match, and one persisted case-result row exists per eval case with the right
   `metricScore`/`passed`.
6. Assert `AiInvokeService.invoke` was called **once per case** (cost accounting:
   no extra model calls, no judge call for non-judge metrics).

This proves the runner's real path: load set + ordered cases → invoke template per
case → score with the real metric service → aggregate → persist verdict + case rows.

## Test 2 — Eval-runner judge + must-cite path (planned)

Same harness. Seed a `judge`-metric case with a rubric and a `mustCite` case. Mock
`AiInvokeService.invoke` to (a) return a strong answer for the graded invoke and
(b) return strict JSON `{"score":0.9,"feedback":"..."}` for the judge invoke. Assert:
the judge score is parsed and clamped, a malformed judge response fails safe to 0
(second sub-case), and a `mustCite` case only passes when the output contains a
citation (markdown link / bare URL). Assert two invokes per judge case (template +
judge).

## Test 3 — Playground run + Socket.IO chunk emission (planned)

Boot the focused module with `socketio` `AiLabModule` (gateway +
`AiLabRunRoomService`) and a real Socket.IO server attached to the Nest HTTP server;
connect a `socket.io-client`. Seed an `AiLabPlaygroundEntity`. Mock
`AiInvokeService` (or the streaming client) to yield a fixed sequence of chunks.

1. `AiLabRunService.createRun(...)` → asserts a `Streaming` `AiLabRunEntity` row,
   entitlement gated (real `AiEntitlementService` against a seeded quota), and
   `invokeOptions` returned.
2. Drive the gateway's stream-start for that `runId`; assert the client receives the
   ordered chunk events then a terminal "done" event, and that
   `persistRunOutput(...)` flips the row to `Completed` with the concatenated output
   + token counts.
3. Assert the emitted chunks reassemble to the persisted `output`.

## Test 4 — Cache hit: identical re-run makes no model call (planned)

Same playground harness, focuses on `AiLabCacheService` (input-hash key over
prompts + params + model + provider).

1. First `createRun` → `Streaming`; complete it via `persistRunOutput` (which warms
   the cache via `AiLabCacheService.store`). Record `AiInvokeService.invoke` call
   count.
2. Second `createRun` with **identical** prompts/params/lane → assert
   `status === Cached`, `cachedOutput` equals the first run's output, `invokeOptions`
   is `null`, and **`AiInvokeService.invoke` call count is unchanged** (zero new
   model calls). On `prepareStream` for a `Cached` run, assert it returns the stored
   output with `messages: []` so the gateway emits one final chunk and never streams.
3. Cost assertion: `estimatedCostCredits` / token counters are not incremented on the
   cache hit, and no Premium-pool `consume` is issued for the cached path.

## Running

```
npm run test:e2e -- ai-lab-eval-runner
```

(`test:e2e` = `jest --config ./apps/core/test/jest-e2e.json --runInBand`.) Requires a
working Docker daemon for Testcontainers; CI must have Docker available.
