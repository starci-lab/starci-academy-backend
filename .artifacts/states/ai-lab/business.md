# AI Lab — business map

AI Lab is the "prompt-engineering sandbox" surface attached to a lesson: a learner writes a system
+ user prompt, runs it against a live model (streamed token-by-token), and — separately — submits a
prompt template to be **graded** against an authored eval set (the "prompt challenge"). Two
independent entities carry two independent state machines: a **run** (one interactive playground
call) and an **eval run** (one graded submission). Both are cached so an identical resubmission never
re-calls the model.

## Entities

- **AiLabPlayground** — one sandbox attached to a lesson `content`. Fixed at authoring time: `kind`
  (`prompt` / `rag` / `comparison`), default prompts, default sampling params, the providers a
  learner may pick from, a per-window run cap (`maxRunsPerWindow`, 0 = unlimited), and — for a `rag`
  kind — the Qdrant collection it retrieves from. Localized `label`/`description` live in a child
  translation table, resolved onto the entity at read time and then stripped so they never double up
  in the response.
- **AiLabRun** — one playground call by one learner. Doubles as the **cache cold store**: unique on
  `(playground, user, inputHash)` where `inputHash` is a SHA-256 of every input that decides the
  output (both prompts + temperature/topP/maxTokens + resolved model + provider).
- **AiLabEvalSet** — the graded "prompt challenge" behind a `Challenge` or a `MilestoneTask` (exactly
  one of the two, never both) — the judge rubric, the pass threshold (0..1 fraction of weighted max
  score), and its ordered `AiLabEvalCase` children.
- **AiLabEvalCase** — one graded input inside a set: the input text, how it is scored
  (`AiLabMetricKind`: `exact` / `embedding` / `contains` / `judge`), the expected value/substrings for
  the deterministic metrics, an optional embedding threshold, a `mustCite` flag, and a `weight` in the
  set's aggregate.
- **AiLabEvalRun** — one graded submission: the submitted system prompt + user template + params,
  the resolved `(model, provider)`, the async grading `Job` that fills in the verdict, and — once
  graded — `totalScore` / `maxScore` / `passed` plus the ordered `AiLabEvalCaseResult` children. Unique
  on `(evalSet, user, submittedHash)` — the same short-circuit-identical-resubmission idea as a run,
  keyed on a hash of the submitted prompts + params (not the model output, since it hasn't run yet).
- **AiLabEvalCaseResult** — one case's grading outcome inside an eval run: the actual model output,
  the metric score, an optional judge score, a citation-present flag (only meaningful when the case
  requires one), the pass verdict, and learner-facing feedback text.

## States and transitions

### A run (`AiLabRunStatus`)

```
Streaming → Completed
          → Failed
(any run) → Cached   [only ever the STATUS of a fresh row served on a later identical request —
                       a run never transitions INTO Cached from Streaming; a cache hit returns the
                       output as a status without creating/moving a row at all]
```

- `createRun` computes `inputHash` and looks up the cache (Redis fast-path → Postgres cold-store
  fallback, filtered to `status = Completed` rows only — a `Streaming` or `Failed` row is never reused
  as a hit). A hit returns the stored output + `status: Cached` with **no row created**; a miss
  persists a fresh `Streaming` row and hands the caller `invokeOptions` to open the Socket.IO stream.
- The gateway (`prepareStream`) re-loads the `Streaming` row, streams tokens over `AiInvokeService`,
  and on completion calls `persistRunOutput` → `Completed` (also re-warms the Redis cache). Any stream
  error or a learner-initiated abort calls `markRunFailed` → `Failed`, storing the reason.
- Invariant: a `Completed` run's `(playground, user, inputHash)` is globally unique, so two identical
  submissions from the same learner can never both hold `Completed` rows — one is served from cache
  before a second row exists.

### An eval run (`AiLabEvalRunStatus`)

```
Pending → Grading → Completed
                  → Failed
```

- `submitEvalChallenge` persists `Pending` and enqueues the async grading job. An identical
  resubmission (same eval set + learner + `submittedHash`, computed BEFORE grading, over the
  submitted prompts/params/model-pick) returns the **existing** run + job id rather than creating a
  second one — the same short-circuit idea as a run, but keyed on the submission, not the output.
- The `review-ai-lab-eval` worker moves `Pending → Grading`, calls `AiLabEvalService.gradeEvalSet`
  (which invokes the model once per case, deterministically at `temperature: 0`), and persists the
  verdict → `Completed`. A grading error → `Failed`.
- Invariant: `passed` is true iff `totalScore / maxScore >= evalSet.passThreshold` (weighted fraction,
  guarded against a zero-max divide). A `mustCite` case additionally requires
  `citationPresent === true` on top of its own metric passing — a case can score well on content and
  still fail the case if it forgot to cite.
- Invariant: a judge-kind case's score always comes back clamped to `[0, 1]`; an unparseable judge
  response fails SAFE to `score: 0` rather than throwing mid-grade (one bad judge response fails one
  case, not the whole submission).

## What the FE can read off this

- **Playground panel**: `aiLabPlayground(contentId)` → the localized config; `myAiLabRuns(playgroundId)`
  → the learner's own run history (cache replay from history is just "run it again", not a special
  path — it re-hits the same cache).
- **Run lifecycle**: `runPlaygroundPrompt` mutation returns either a cached output inline (`status:
  Cached`, nothing to subscribe to) or a `runId` to subscribe to over the `/ai_lab` Socket.IO
  namespace (`ai-lab-run:{runId}` room) for token deltas, terminated by a `done: true` chunk carrying
  the final `status`.
- **Eval lifecycle**: `submitEvalChallenge` returns `{ evalRunId, jobId }` immediately (job is
  `Pending`); the FE follows the **existing job-notifications socket** for job completion, then polls
  `aiLabEvalResult(evalRunId)` for the verdict + per-case results. There is no separate eval-specific
  socket namespace — grading is not streamed token-by-token to the FE the way a playground run is.
- **Quota nudge**: every `createRun` response carries `remainingRuns` / `quotaExhausted` — the tighter
  of the playground's own per-window cap and the learner's shared AI-credit pool — regardless of
  whether the call was a cache hit, so the FE can show "you have N runs left" even on a free replay.
