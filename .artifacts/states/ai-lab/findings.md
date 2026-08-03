# AI Lab — findings

Ranked most severe first. Anchors are real `file:line` in the tree at scan time (2026-08-04).

## 1. [security / gate-middleware] `submitEvalChallenge` trusts a client-supplied `enrollmentId` with no ownership check and no enrollment guard

`src/features/api/core/graphql/mutations/ai-lab/submit-eval-challenge/submit-eval-challenge.service.ts:129-137`
persists the eval run with `enrollment: { id: enrollmentId }` straight from
`SubmitEvalChallengeInput.enrollmentId` (`.../graphql-types/request.ts:31-37`, a raw client `ID!`
field) — there is no query or lookup anywhere in `execute()` that checks the enrollment belongs to
`userId`. The resolver
(`src/features/api/core/graphql/mutations/ai-lab/submit-eval-challenge/submit-eval-challenge.resolver.ts:55-57`)
carries only `KeycloakAuthGraphQLGuard` — no `GraphqlMustEnrolledGuard` / `GraphQLEnrollmentGuard`
from `src/modules/bussiness/guards/` establishes or verifies the enrollment context the way
`canon/be/enforce/authoring/authorization.md` §2 requires for a domain check ("may THIS caller submit
under THIS enrollment"). Contrast with `start-mock-interview-session-draw.service.ts:385,477`, which
always reads `enrollment.id` off a server-resolved `enrollment` object, never a client-supplied id.

**What breaks**: any authenticated learner can pass another learner's (or another course's)
`enrollmentId` and the eval run — and the capstone/milestone-task progress it may feed into — gets
recorded under someone else's enrollment. `authorization.md` §3 names exactly this shape ("an RPC
that takes an id but forgets the owner is an IDOR").

## 2. [business-logic] The run cache key is computed BEFORE the Auto lane knows which model will serve it, using a fabricated placeholder

`ai-lab-run.service.ts:118-131` computes `inputHash` from `this.resolveModelProvider(invokeOptions)`
(`ai-lab-run.service.ts:520-528`), which for the **unpinned / Auto lane** — no `selection.model` +
`selection.provider` — returns `model: invokeOptions.model ?? ""` and
`provider: invokeOptions.provider ?? ModelProvider.OpenAI`. Per `resolve-grading-invoke-options.ts:116-122`,
the Auto/balancer path never sets `model`/`provider` on its result (only `categories`, the climb
chain) — the real model is decided later, per-attempt, inside the balancer during the stream. So
every Auto-lane run's cache key uses the SAME fabricated pair (`"", OpenAI`), regardless of which
model actually ends up serving it.

`ai-lab-cache.service.ts:26-30`'s own doc says the hash "covers every input that changes the output
(prompts + sampling params **+ model + provider**) so two runs collide only when they would produce
the same answer" — that invariant is false for every Auto-lane run: the model/provider component of
the hash is constant, not derived from anything real. The `AiLabRunEntity.provider` column
(`ai-lab-run.entity.ts:205-217`, NOT NULL, documented "Provider that served the run") is also written
`OpenAI` at row-creation time for an Auto-lane run — before any provider has served anything — and is
only corrected later in `persistRunOutput` (`ai-lab-run.service.ts:363-365`) if the stream completes.

**What breaks**: (a) a `Streaming` row abandoned by a crash/restart before `persistRunOutput` runs
keeps a permanently false `provider: OpenAI` on a column documented as ground truth; (b) two identical
Auto-lane prompts submitted at different times, where the balancer would legitimately pick a
different model the second time (a key rotated out, a tier change, a provider outage), are silently
served the FIRST run's cached output — the cache cannot tell them apart because its key never
captured which model actually served either one.

## 3. [test-tier] The core grading + orchestration services carry no unit spec at all

`src/modules/bussiness/ai-lab/` has exactly one `.spec.ts`: `ai-lab-eval-metric.service.spec.ts` (the
pure string/embedding metric helpers). Zero unit coverage exists for:
- `ai-lab-eval.service.ts` (423 lines) — `gradeEvalSet`'s weighted aggregation, the must-cite
  pass-gating in `gradeCase` (:238-240), and `parseJudge`'s fail-safe-to-0 branch (:390-422) are all
  untested.
- `ai-lab-run.service.ts` (529 lines) — the cache-hit/miss branch in `createRun`, `getRemainingRuns`'s
  quota-vs-window-cap min() logic (:449-463), and `runToSelection`'s re-pin logic are all untested.
- `ai-lab-cache.service.ts`, `ai-lab-playground.service.ts` — no spec at all.

The only other coverage is one e2e happy-path
(`apps/core/test/app/ai-lab-eval-runner.e2e-spec.ts:237`, "grades the eval set and persists a
Completed verdict"). Per `testing.md` §1, branches and thrown exceptions belong in `.spec.ts` first —
this domain has the most eval-scoring branch logic in the codebase (4 metric kinds x must-cite gating
x weighted aggregation x judge-parse-fallback) and the least unit coverage of it. It is also the
textbook case for `testing.md` §3's harness lane (non-deterministic LLM-judge grading, "was this good"
not "was this equal") — the lane is fully wired (`apps/core/test/harness/`) but, as documented there,
zero `*.harness-spec.ts` files exist anywhere yet; AI Lab's judge-kind eval cases are the first
candidate the lane was built for.

## 4. [jsdoc] Reference-quality domain — noted for contrast, not a finding

No jsdoc-axis finding rose above the noise floor in `ai-lab/` itself — every public class/method
scanned (`AiLabRunService`, `AiLabEvalService`, `AiLabEvalMetricService`, `AiLabCacheService`,
`AiLabPlaygroundService`, all four resolvers) carries real, non-restating JSDoc, and every method
declares an explicit `Promise<XResult>` with the params/result interfaces living in `types/`. This is
the reference-quality domain in this bundle; `content-ai` and `bloom-filters` are graded against it
in their own findings.

---

**Axis tally**: security 1, business-logic 1, test-tier 1 (three services + the harness gap),
gate-middleware 1 (folded into #1), jsdoc 0, naming 0, edge-case 0.
