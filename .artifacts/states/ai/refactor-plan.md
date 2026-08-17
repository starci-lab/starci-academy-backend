# AI module — refactor + roster reset plan (2026-08-04)

Grounded in a full read of `src/modules/ai` (91 files), the seed at
`.mount/data/ai-models/` (28 models), and live pricing verified against the
OpenRouter models API on 2026-08-04. Every claim below is anchored to a file
and line. Nothing here has been executed yet.

## Why the module feels chaotic — the measured cause

Not "too many models" alone. There are **three model-selection systems on two
different axes**, and only one of them actually invokes anything.

| System | Axis | Status |
|---|---|---|
| DB catalog `ai_models` → `AiModelCatalogService.enabledModels` → `UseApiService` lane/chain | `AiModelCategory` (5) + `weight`/`priority` | **LIVE — the real invoke path** |
| `modelTierMatrix` (`constants/model-tier.ts:31`) → `AiTaskModelService` | `AiTaskKind` (4) × `ModelRecommendation` (3) | Mirror. Feeds ONLY an admin display + one enqueue default |
| `AbstractModelRouterService` (`classes/abstract-model-router.ts:33`) + `GradeModelRouterService` | same matrix axis | **DEAD** — not in `ai.module.ts` providers, injected nowhere |

The mirror admits it in its own docstring (`model-tier.ts:16-21`): *"the actual
grading invoke is driven by the balancer … the chains below mirror that order so
the display matches reality."* A hand-synced second source of truth.

It has already drifted: the matrix advertises `gemini-3.1-pro`
(`model-tier.ts:152`) while the catalog seeds `gemini-3.1-pro-preview`.

### Other measured defects

1. **~10 of 28 seeded model ids do not exist** (verified twice against the live
   OpenRouter API), all `enabled: true`, so the Auto lane wastes attempts on
   them and a premium pin against one hard-fails:
   `deepseek/deepseek-v4-pro`, `deepseek/deepseek-chat-v3-0324`,
   `qwen/qwen-2.5-coder-32b-instruct`, `x-ai/grok-4.3`,
   `mistralai/mistral-medium-3.5`, `inclusionai/ling-2.6-flash`,
   `tencent/hy3-preview`, `openai/gpt-5.5`, `poolside/laguna-m.1`,
   `poolside/laguna-xs.2`.
   The correct ids are usually the **un-suffixed** ones (`tencent/hy3` exists,
   `poolside/laguna-xs-2.1` exists) — same class of bug as the `-preview` drift.
2. **Dead grading utils with a CONFLICTING ladder**: `pick-best-category.ts:20`
   and `resolve-grading-category-by-difficulty.ts:43` have no consumers, and
   they encode `hard → Balanced` while the live `DIFFICULTY_FLOOR`
   (`resolve-grading-chain.ts:21`) says `hard → Premium`.
3. **Billing is mid-migration**: the invoke seam uses token-based `creditForRun`
   (`ai-invoke.service.ts:158`) but three complete-step services still use the
   flat `creditForModel` (`process-git-submission-complete-step.service.ts:396`,
   `process-google-docs-submission-…:332`,
   `review-milestone-task-complete-step.service.ts:396`).
4. **Dead constant + stale doc**: `CATEGORY_CREDIT_COST`
   (`ai-entitlement.constants.ts:11`) is referenced only from comments, yet the
   `AiEntitlementService` docstring (`:63`) still claims billing runs through it.
5. **Stale spec, not a bug**: `ai-entitlement.service.spec.ts` fails 2 tests
   (`:291`, `:313`) because it asserts pre-atomic-claim behaviour; the service
   uses the atomic claim (`ai-entitlement.service.ts:342-352`) and the real
   Postgres e2e for it is green. Fix the spec, not the code.
6. **Two embedding models sit in the routing table** (`nomic-embed-text`,
   `text-embedding-3-small`) though they are never routed like chat models.
   OpenRouter serves **no** embedding models, so they cannot be consolidated.

## Target architecture (the Cursor shape)

Task never names a model. Task names a *requirement*; a data catalog resolves it.

```
(task, lane, difficulty, budget)
        │   lane = Auto | Premium | BYOK        ← the user's choice, an INPUT
        ▼
   Policy        → capability category          (pure function, knows no model names)
        ▼
   Catalog (ai_models rows)  → ordered concrete models   ← THE only source of truth
        ▼
   Balancer / use-api        → key rotation, health, failover
        ▼
   Billing (token usage)                          ← already token-based, keep
```

Consequence that matters for the roster question: once the matrix is gone,
**changing which models the product uses is a DATA edit** (seed rows), never a
code edit or a deploy.

The lane concept (`Auto | Premium | BYOK`) already exists
(`enqueue-generate-cv.service.ts:72`) but its logic is trapped under
grading-only names (`grading-lane-validation.service.ts`,
`resolve-grading-*.ts`), so every other task kind must re-invent or bypass it.
It gets lifted to a task-agnostic lane resolver.

## Roster reset — decided shape

Decisions taken: consolidate cloud on **OpenRouter** (one key pool, one bill,
ids and prices verifiable via API so drift becomes impossible); **drop the local
model**; collapse to **two rungs — `free` and `frontier`**.

**The category axis changes meaning.** It no longer answers *"how hard is this
task"* — it answers *"which surface is calling"*:

| Rung | Surface | Existing `supportedTasks` tag |
|---|---|---|
| `free` | **chatbot** — content-ai chat, mock-interview, rag-playground, playground | `chatting` |
| `frontier` | **everything else** — challenge / milestone / personal-project grading, CV | `grading`, `task_grading`, `challenge_grading`, `cv_generating` |

This maps onto machinery that already exists and is already seeded: the
`supportedTasks` jsonb column on `AiModelEntity` (`:267`) and
`AiInvokeService.surfaceToTask` (`:71`), which today only ever emits
`Chatting` / `Grading` while the finer tags sit unused. Surface → task →
category becomes the whole routing policy.

Prices below are USD per 1M tokens, verified against the live OpenRouter API on
2026-08-04. `credit` is the per-category flat constant already used by the seed
(free 0 · frontier 887). `creditPerMTokIn/Out` are derived by the seeder from
the USD prices — not authored by hand.

| Category | Model | $ in | $ out | Note |
|---|---|---|---|---|
| `free` | `deepseek/deepseek-v4-flash` | 0.09 | 0.18 | 1M context; ~$0.00028 per typical call (≈3,500 calls/USD) |
| `frontier` | `openai/gpt-5.6-terra` | 1.00 | 6.00 | grading quality at a mid price |

Two rows now, down from 28, with **more models per rung added later** — the rung
is a pool, not a single model. Until a second model exists in each rung there is
no failover left to climb to, so a provider incident takes that surface down;
adding one backup row per rung is the cheapest insurance and is a pure data edit.

## Rotation must be driven by price AND benchmark

Today `weight` — the within-rung try-order that `UseApiService` sorts by — is a
**hand-typed decimal** (`5.2`, `20.1`, `100.3`) anchored to nothing. Adding a
model means guessing a number that keeps the order sane. That is the same
hand-maintenance disease as the matrix, one level down.

**Fix: `weight` stops being authored and becomes DERIVED from two recorded
facts — the real price and a real benchmark.**

### New column
`benchmarkScore` (double, nullable) on `AiModelEntity` — the **Artificial
Analysis Intelligence Index** (v4.1: 9 evals — GDPval-AA v2, τ³-Banking,
Terminal-Bench v2.1, SciCode, HLE, GPQA Diamond, CritPt, AA-Omniscience,
AA-LCR). One normalised number, comparable across vendors, re-checkable.
Alongside it record `benchmarkVariant` (e.g. `reasoning-max-effort`) and
`benchmarkAt` — the same model scores differently per reasoning effort
(DeepSeek V4 Flash: **40** at max effort vs **37** at high), so a bare number
is not comparable.

Adding a nullable double is safe under the production `synchronize: true` — it
is an additive column, not the enum surgery that has caused incidents here before.

### Derivation
Blend the two prices with the token mix the codebase already assumes
(`DEFAULT_ESTIMATE_PROMPT_TOKENS = 1500`, `DEFAULT_ESTIMATE_COMPLETION_TOKENS = 800`,
`constants/credit-cost.ts`):

```
usdPerCall = (1500 · priceInUsdPerMTok + 800 · priceOutUsdPerMTok) / 1e6
weight     = benchmarkScore / (usdPerCall · 1000)      // benchmark per $ per 1k calls
```

Computed at seed time, so it is deterministic, auditable and recomputable —
never guessed. Worked from the verified figures:

| Model | benchmark | usd/call | **weight** |
|---|---|---|---|
| `deepseek/deepseek-v4-flash` | 40 | $0.000279 | **143.4** |
| `openai/gpt-5.6-terra` | 55 | $0.006300 | **8.7** |

### The floor that stops "cheapest always wins"
Pure value-per-dollar would let a cheap, weak model outrank everything in its
rung. So each rung declares a **minimum `benchmarkScore`**; a model below it is
not seeded into that rung at all. Within the rung, ranking is then purely
value-for-money — which is exactly the stated policy: *lowest price among models
that are actually good enough*.

Proposed floors (tune with data): `free` ≥ 35, `frontier` ≥ 50. Note this makes
the rungs quality-tiered as well as surface-tiered, and it is what keeps
`gpt-5.6-terra` (weight 8.7) ahead of a hypothetical cheap-but-weak model that
would otherwise score a huge weight.

Sources for every figure above are recorded in the seed row itself
(`benchmarkAt` + the price fields), so a later reviewer can re-verify rather
than trust.

**Kept out of the roster**: `nomic-embed-text` / `text-embedding-3-small`.
OpenRouter has no embedding models, and embeddings are a different concern
(`integrations/langchain/embedding-model.service.ts`). They stay on their
current provider and move out of the routing ladder.

**Dropped**: Gemini via OpenRouter is dominated at every rung
(`gemini-3.5-flash-lite` $0.30/$2.50 vs `qwen3.7-flash` $0.03/$0.13;
`gemini-3.5-flash` $1.50/$9.00). Re-addable later as one seed row if vendor
diversity is wanted.

### The reseed trap

The seeder **upserts by `(provider, name)`** (`inserts/ai-model-insert.service.ts:38`).
Deleting a model from the seed does **not** remove its DB row — the 24 dropped
models would stay `enabled: true` and keep being routed to. The reset therefore
needs an explicit **disable-or-delete of every row not present in the seed**,
not just a new seed directory.

## Phases — each its own commit, each gated

Gates every phase: `tsc -p apps/core/tsconfig.app.json` at or below baseline
**19**, unit suite for the module at or above **222/224** passing, and for the
phases that touch routing, the e2e suite run **sequentially** (`--runInBand`,
single Postgres container — parallel container boots crash the host).

### Phase 0 — delete dead code (no behaviour change)
- `grade-model-router.service.ts` (+ spec), `classes/abstract-model-router.ts`
- `utils/pick-best-category.ts` (+ spec),
  `utils/resolve-grading-category-by-difficulty.ts` (+ spec)
- `CATEGORY_CREDIT_COST` and the stale docstring at `ai-entitlement.service.ts:63`

Nothing outside the module imports any of these, so the blast radius is zero.

### Phase 1 — remove the second source of truth
- Delete `constants/model-tier.ts` and `ai-task-model.service.ts` (+ spec)
- Rewire its only two consumers:
  - `ai-models.handler.ts:36-51` (admin display) reads
    `AiModelCatalogService.enabledModels()` — the real catalog — instead of the mirror
  - `generate-personal-project-tasks.service.ts:70` (enqueue default) takes a
    category/lane default instead of a hardcoded model name
- Retires the whole `AiTaskKind × ModelRecommendation` axis and the
  `AI_MODEL_RECOMMENDATION` env var (`env/config.ts:2149`, never written at runtime)

### Phase 2 — roster reset (DATA, plus one seeder change)
- Rewrite `.mount/data/ai-models/` to the four rows above (each `en.md` + `vi.md`)
- Add the disable-or-delete-not-in-seed step to the catalog seeder
- Move the two embedding models out of the routing catalog
- `AiModelCatalogService.invalidate()` after reseed so the 60s query cache
  (`ai-model-catalog.service.ts:27`) does not serve the old list

### Phase 3 — collapse the ladder to two rungs
- `DIFFICULTY_FLOOR` (`resolve-grading-chain.ts:21`): `easy`/`medium` → `Free`,
  `hard`/`insane`/`expert` → `Frontier`
- `TIER_ALLOWED_CATEGORIES` (`ai-entitlement.constants.ts:41`): free → `[Free]`,
  Plus/Pro → `[Free, Frontier]`
- **Keep the 5-value `ai_model_category` DB enum untouched.** Production runs
  `synchronize: true`; a Postgres enum change there is exactly the class of
  incident that has bitten this project before. Leaving three categories simply
  unpopulated achieves the collapse with zero schema risk — and re-adding a
  middle rung later is one seed row.
- Verify the edge this exposes: a free user submitting a `hard` task now has
  floor `Frontier` above their ceiling `Free`, so the chain is empty. Decide
  deliberately: clamp to `Free`, or refuse with the paywall error.

### Phase 4 — finish the billing migration
- Three complete-step services: flat `creditForModel` → token-based `creditForRun`
- Fix the stale `ai-entitlement.service.spec.ts` (2 tests, `:291` / `:313`)

### Phase 5 — separate the concerns (optional, later)
Split the module along the boundaries measured above: `ai-invoke.service.ts`
mixes infra + billing + entitlement; `ai-model-catalog.service.ts` mixes catalog
policy + billing; `use-api.service.ts` mixes routing policy + key infra;
`grading-lane-validation.service.ts` mixes policy + entitlement. Also lift the
grading-only lane logic to a task-agnostic lane resolver so CV / milestone /
personal-project stop re-inventing it.

## Blast radius

83 files import `@modules/ai`. The invoke seam `AiInvokeService` is used by the
three grade-step services, CV compose + scoring, and four Socket.IO gateways
(content-ai, mock-interview, ai-lab, rag-playground). `AiEntitlementService` is
used by all five payment webhooks, the reconcile worker, the complete-step
services and rewards. **Phases 0 and 1 touch none of them** — only the dead set
and the two mirror consumers. Phases 2-4 change what those consumers *resolve
to*, never their call signatures.
