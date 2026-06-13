# AI Lab — Technical Plan (khóa AI / LLM Engineering)

> Ngày: 2026-06-13 · Trạng thái: PLAN (chưa build)
> Đọc kèm: [docs/ai-llm-engineering-course-plan.md](./ai-llm-engineering-course-plan.md), memory `ai-feature`, `challenge-criteria-redesign`, `initv2-git-data-source`.
> Quy ước code: `.cursor/rules/starci-academy.mdc` / skill `coding-conventions` (service FLAT `*.service.ts`; `types/enums/constants/utils` ngang hàng; service KHÔNG chứa `interface/type/enum/const`; JSDoc per-member; params/result; `Array<T>`; English-only; `@InjectPrimaryPostgreSQLEntityManager`; index quan hệ theo tên property).

---

## 1. Tổng quan & phạm vi

**AI Lab** = lớp tương tác "chạy LLM thật" cho khóa AI/LLM. Khác mọi khóa V2 hiện tại (đọc code + chấm tĩnh), học viên thực sự gọi model và thấy output.

| # | Tính năng | Ưu tiên | Mô tả 1 dòng |
|---|---|---|---|
| 1 | **Prompt Playground (per lesson)** | **P0** | Sửa prompt/params → Run → stream output thật, qua entitlement + cost cap + cache. |
| 2 | **Eval-graded challenge** | **P0** | Chạy prompt/config của học viên trên golden eval set → chấm có cấu trúc (deterministic metric + LLM-judge), async qua BullMQ. |
| 3 | RAG Playground | P1 (bonus) | Hỏi → thấy chunks retrieve + answer + citation, dùng Qdrant. |
| 4 | Model comparison | P2 (bonus) | Cùng prompt → nhiều provider/model song song để so output + cost + latency. |

Nguyên tắc xuyên suốt: **tái dùng tối đa** `src/modules/ai/` (router/entitlement/BYOK/balancer), `src/modules/langchain/`, `src/modules/databases/qdrant/`, `src/modules/stream-async-iterator/`, BullMQ + processor/step pattern. KHÔNG xây runtime mới, KHÔNG xây provider client mới — `AiInvokeService.buildClient` đã cover OpenAI/OpenRouter/Gemini.

---

## 2. Domain entities (TypeORM)

Đặt tại `src/modules/databases/postgresql/primary/entities/`. Tất cả extend `UuidAbstractEntity`. Quan hệ index theo **tên property** (`@Index(["content"])`, KHÔNG `["contentId"]`) — nếu sai TypeORM init fail (memory `feedback-index-relation-columns`).

### 2.1 `ai_lab_playgrounds` — `AiLabPlaygroundEntity` (P0)
Config playground gắn vào 1 lesson (`ContentEntity`). Author trong content repo, seed như challenge V2.

| Field | Type | Ghi chú |
|---|---|---|
| `content` | ManyToOne → `ContentEntity` | lesson chứa playground; index theo property `content` |
| `slug` | varchar | stable id từ folder mount (giống `content.slug`) |
| `kind` | enum `AiLabPlaygroundKind` (`prompt` / `rag` / `comparison`) | quyết định UI + lane logic |
| `defaultSystemPrompt` | text nullable | prompt mẫu hiển thị ban đầu |
| `defaultUserPrompt` | text nullable | |
| `defaultParams` | jsonb (`AiLabRunParams`) | temperature / topP / maxTokens defaults |
| `allowedProviders` | jsonb `Array<ModelProvider>` | giới hạn model cho lesson này |
| `maxRunsPerWindow` | int | cap run/lesson (xem §6) |
| `ragCollectionSlug` | varchar nullable | với `kind=rag` → tên Qdrant collection đã ingest |
| translations | OneToMany `AiLabPlaygroundTranslationEntity` (vi/en label/description) | theo pattern `*-translation` hiện có |

### 2.2 `ai_lab_runs` — `AiLabRunEntity` (P0)
Mỗi lần Run playground (audit + cache key). KHÔNG lưu BYOK key plaintext.

| Field | Type | Ghi chú |
|---|---|---|
| `user` | ManyToOne → `UserEntity` | index theo property `user` |
| `playground` | ManyToOne → `AiLabPlaygroundEntity` | index theo property `playground` |
| `inputHash` | varchar, **@Index** | sha256(systemPrompt+userPrompt+params+model+provider) — cache key |
| `systemPrompt` / `userPrompt` | text | snapshot input |
| `params` | jsonb `AiLabRunParams` | |
| `model` / `provider` | varchar / enum `ModelProvider` | model thực dùng |
| `mode` | enum `AiMode` | lane đã chạy (auto/premium/byok) |
| `output` | text nullable | output đầy đủ (điền khi stream xong) |
| `promptTokens` / `completionTokens` / `estimatedCostCredits` | int | token economics — dạy ở M3 |
| `status` | enum `AiLabRunStatus` (`streaming`/`completed`/`failed`/`cached`) | |
| `errorMessage` | text nullable | |

`@Unique(["playground", "user", "inputHash"])` → cache hit theo người + input (xem §6). Cân nhắc thêm `@Index(["inputHash"])` riêng cho semantic-cache cross-user (tùy quyết định §10).

### 2.3 `ai_lab_eval_sets` — `AiLabEvalSetEntity` (P0)
Golden set của 1 eval-graded challenge. Gắn vào `ChallengeEntity` (tái dùng challenge V2 đã có) HOẶC `MilestoneTaskEntity` cho capstone.

| Field | Type | Ghi chú |
|---|---|---|
| `challenge` | ManyToOne → `ChallengeEntity` nullable | challenge gắn eval set |
| `milestoneTask` | ManyToOne → `MilestoneTaskEntity` nullable | hoặc gắn capstone task |
| `slug` | varchar | |
| `judgeRubric` | text | rubric cho LLM-judge (phần non-deterministic) |
| `passThreshold` | float | vd 0.7 = 7/10 câu đạt |
| `cases` | OneToMany → `AiLabEvalCaseEntity` | golden cases |

### 2.4 `ai_lab_eval_cases` — `AiLabEvalCaseEntity` (P0)
1 câu trong golden set.

| Field | Type | Ghi chú |
|---|---|---|
| `evalSet` | ManyToOne → `AiLabEvalSetEntity` | index theo property |
| `orderIndex` | int | thứ tự ổn định |
| `input` | text | câu hỏi/đầu vào để chạy qua config học viên |
| `expectedOutput` | text nullable | đáp án mẫu (cho exact / embedding match) |
| `expectedContains` | jsonb `Array<string>` nullable | substring/regex deterministic phải có |
| `mustCite` | boolean | metric "có citation" (RAG) |
| `metricKind` | enum `AiLabMetricKind` (`exact`/`embedding`/`contains`/`judge`) | metric chính cho case |
| `embeddingThreshold` | float nullable | ngưỡng cosine khi `metricKind=embedding` |
| `weight` | int default 1 | trọng số khi tính điểm tổng |

### 2.5 `ai_lab_eval_runs` — `AiLabEvalRunEntity` (P0)
1 lần học viên submit eval challenge (1 attempt). Song song `user_milestone_task_attempt` / `user_challenge_submission`.

| Field | Type | Ghi chú |
|---|---|---|
| `user` / `enrollment` | ManyToOne | index theo property |
| `evalSet` | ManyToOne → `AiLabEvalSetEntity` | |
| `job` | ManyToOne → `JobEntity` nullable | liên kết BullMQ job (giống submission V2) |
| `submittedSystemPrompt` / `submittedUserTemplate` | text | config học viên nộp |
| `submittedParams` | jsonb | |
| `model` / `provider` / `mode` | | lane đã chấm |
| `totalScore` / `maxScore` | float | vd 8 / 10 |
| `passed` | boolean | `totalScore/maxScore >= passThreshold` |
| `status` | enum (`pending`/`grading`/`completed`/`failed`) | |
| `caseResults` | OneToMany → `AiLabEvalCaseResultEntity` | per-case breakdown |

### 2.6 `ai_lab_eval_case_results` — `AiLabEvalCaseResultEntity` (P0)
Kết quả từng case (để FE hiện "8/10 câu đạt, câu 3 thiếu citation").

| Field | Type | Ghi chú |
|---|---|---|
| `evalRun` | ManyToOne → `AiLabEvalRunEntity` | index theo property |
| `evalCase` | ManyToOne → `AiLabEvalCaseEntity` | |
| `actualOutput` | text | output model sinh ra cho case |
| `metricScore` | float | điểm deterministic (0..1) |
| `judgeScore` | float nullable | điểm LLM-judge (0..1) khi `metricKind=judge` |
| `passed` | boolean | |
| `citationPresent` | boolean nullable | với case `mustCite` |
| `feedback` | text | giải thích ngắn (LLM-judge hoặc deterministic) |

**Enums mới** (folder `enums/` của module databases, có `index.ts`, GraphQL type kèm theo pattern `GraphQLType*`): `AiLabPlaygroundKind`, `AiLabRunStatus`, `AiLabMetricKind`, `AiLabEvalRunStatus`. Lưu ý: KHÔNG định nghĩa enum trong entity file — entity chỉ import (đúng convention).

---

## 3. Bussiness services (`src/modules/bussiness/ai-lab/`)

Tuân thủ: service FLAT, types ở `types/`, không inline type. Module `AiLabModule` export tất cả service + được import bởi feature GraphQL modules + processors.

| Service | Chức năng |
|---|---|
| `ai-lab-playground.service.ts` | CRUD/read playground theo lesson; `getPlaygroundForLesson({ contentId, locale })` trả config + defaults. |
| `ai-lab-run.service.ts` | Điều phối 1 run: tính `inputHash`, check cache (`findCachedRun`), gọi entitlement, tạo `AiLabRunEntity`, gọi invoke/stream, persist output + tokens. Trả về stream iterator hoặc cached output. |
| `ai-lab-cache.service.ts` | Cache verdict/output: `computeInputHash(params)` (sha256), `lookup({ playgroundId, userId, inputHash })`, `store(...)`. Bọc Redis (`@modules/cache`) + bảng `ai_lab_runs` làm cold store. |
| `ai-lab-eval.service.ts` | Đọc golden set + run từng case qua `AiInvokeService`, tính metric deterministic, gọi LLM-judge cho case `judge`, tổng hợp điểm. (Logic core dùng lại trong eval-runner step §5.) |
| `ai-lab-eval-metric.service.ts` | Pure-ish metric helpers: `exactMatch`, `containsMatch`, `embeddingMatch` (dùng `EmbeddingModelService` + cosine), `citationPresent`. Mỗi metric → `{ score: number; passed: boolean }`. |
| `ai-lab-rag.service.ts` (P1) | RAG playground: embed query → `QdrantVectorStore.similaritySearch` → trả `{ chunks, answer, citations }`. Tái dùng pattern trong `review-milestone-task-grade-step`. |
| `ai-lab-comparison.service.ts` (P2) | Fan-out cùng prompt qua N (provider, model) song song (`Promise.allSettled`), trả mảng kết quả + token/cost/latency. |

Tích hợp AI có sẵn (KHÔNG viết lại):
- Lane/quota: `AiEntitlementService.resolve/consume/getByokApiKey`.
- Validate model pick: `GradingLaneValidationService.validate` (đã làm đúng auto/premium/byok + catalog).
- Invoke: `AiInvokeService.invoke` (non-stream) cho eval-case + comparison.
- Lane→invoke args: `resolveGradingInvokeOptions` (đã map selection→category/byok/model).
- Stream: dùng `ChatOpenAI/ChatGoogleGenerativeAI.stream()` (LangChain) bọc qua `StreamAsyncIteratorService` (xem §4).

---

## 4. API (GraphQL)

Đặt dưới `src/features/api/core/graphql/` theo convention leaf module (`*SingleQueryModule` / `*SingleMutationModule`, `.register({ isGlobal: true })`). Inputs ở `graphql-types/inputs/`, object-types ở `graphql-types/object-types/`.

### 4.1 Queries
- `aiLabPlayground(contentId: ID!, locale: Locale): AiLabPlayground` — config + defaults cho lesson.
- `aiLabEvalResult(evalRunId: ID!): AiLabEvalRun` — poll kết quả eval (caseResults breakdown).
- `myAiLabRuns(playgroundId: ID!): [AiLabRun!]` — lịch sử run của user (audit/cache hiển thị).
- `ragQuery(playgroundId: ID!, query: String!): RagQueryResult` (P1) — `{ chunks: [RagChunk], answer, citations }`. (Synchronous, ngắn → không stream.)

### 4.2 Mutations + streaming transport — **CHỐT: Socket.IO (KHÔNG GraphQL Subscription)**
> **PIVOT 2026-06-13** sau khi verify FE: Apollo Subscription **CHƯA wire** trên FE (chỉ HTTP link — cần tự thêm `graphql-ws` WS link + split + auth-over-WS = việc lớn). Trong khi đó FE **đã có Socket.IO** (`useJobNotificationsSocketIo`, `PublicationEvent.SubscribeJobNotification`, Redux `jobStatusByJobId`) và challenge-submit V2 đang dùng đúng nó. → **Dùng Socket.IO cho cả streaming playground lẫn eval job** = đồng bộ stack thật + bỏ điểm chặn FE lớn nhất. (GraphQL Subscription giữ làm phương án B nếu sau này wire WS.)

- `runPlaygroundPrompt(input: RunPlaygroundPromptInput!): RunPlaygroundPromptResult` (**mutation**) — tạo `AiLabRunEntity` (`status=streaming`), trả `{ runId }`. BE build LangChain `.stream()`, **emit từng chunk qua Socket.IO** vào room `ai-lab-run:{runId}` (gateway mới `AiLabGateway` cạnh jobs gateway, hoặc tái dùng publication gateway). FE: sau khi có `runId` → `socket.emit("subscribe-ai-lab-run", { runId })` → nhận event `ai-lab-run-chunk { delta, done, status, tokens }`.
  - **Cache hit** (`inputHash` đã `completed`): mutation trả luôn `{ runId, cachedOutput }` + emit 1 chunk `{ delta: fullOutput, done: true, status: cached }`, KHÔNG gọi model.
  - Abort: `socket.emit("abort-ai-lab-run", { runId })` → BE huỷ stream, set `status=failed/aborted`.
- `submitEvalChallenge(input: SubmitEvalChallengeInput!): SubmitEvalChallengeResult` — enqueue BullMQ job `ReviewAiLabEval`, trả `{ evalRunId, jobId }`. FE **tái dùng nguyên** flow job-notification Socket.IO của challenge-submit (`SubscribeJobNotification` + `jobStatusByJobId`) → 0 transport mới. Kết quả final poll `aiLabEvalResult`.

### 4.3 Input shapes
```
RunPlaygroundPromptInput {
  playgroundId: ID!
  systemPrompt: String
  userPrompt: String!
  params: AiLabRunParamsInput   # temperature, topP, maxTokens
  ai: AiJobSelectionInput        # mode(auto|premium|byok) + model + provider + apiKey?  — reuse type
  locale: Locale
}
SubmitEvalChallengeInput {
  evalSetId: ID!            # hoặc challengeId/milestoneTaskId → resolve evalSet
  enrollmentId: ID!
  systemPrompt: String
  userTemplate: String!    # template có {{input}} chèn case input
  params: AiLabRunParamsInput
  ai: AiJobSelectionInput
  locale: Locale
}
```
`AiJobSelectionInput` map thẳng sang `AiJobSelection` (đã có) → đưa vào payload BullMQ y như submission V2.

### 4.4 Object-type shapes
- `AiLabRunChunk { delta: String!, done: Boolean!, status: AiLabRunStatus, promptTokens: Int, completionTokens: Int }`
- `AiLabEvalRun { id, totalScore, maxScore, passed, status, caseResults: [AiLabEvalCaseResult!] }`
- `AiLabEvalCaseResult { orderIndex, passed, metricScore, judgeScore, citationPresent, feedback }`
- `RagQueryResult { answer: String!, chunks: [RagChunk!]!, citations: [String!]! }`, `RagChunk { content, source, score }`

---

## 5. Eval-runner design (tính năng #2 — lõi)

Theo đúng pattern processor/step hiện có (`review-milestone-task`): BullMQ worker → step-map → grade step → complete step. **Chạy async qua BullMQ** (mỗi case = 1 lần gọi model → tổng N call, không thể đồng bộ trong request).

### 5.1 Golden set format (author trong content repo — §7)
Mỗi eval challenge 1 folder; mỗi case 1 file `case.md` với front-matter:
```
---
metricKind: contains        # exact | embedding | contains | judge
mustCite: false
weight: 1
embeddingThreshold: 0.82    # khi metricKind=embedding
expectedContains: ["idempotent", "retry"]
---
# input
<câu hỏi đưa qua config học viên>
# expected
<đáp án mẫu — cho exact/embedding>
```
`evalset.md` (cấp set): `judgeRubric`, `passThreshold`. Parser tái dùng `extract-json-from-md` / pattern seeder challenge V2.

### 5.2 Luồng job `ReviewAiLabEval`
Folder `src/features/api/processors/review-ai-lab-eval/` (worker + step-mapping + steps), copy khung từ `review-milestone-task`:

1. **grade-step**:
   - Load `AiLabEvalSetEntity` + cases + `AiLabEvalRunEntity`.
   - Resolve lane: `resolveGradingInvokeOptions({ userId, selection: payload.ai, aiEntitlementService })`.
   - Auto-lane quota gate (giống milestone grade step: check `CreditUsageService.getSnapshot().overQuota` → `AiQuotaExhaustedException`).
   - **Vòng lặp per-case**: build messages = `[SystemMessage(submittedSystemPrompt), HumanMessage(userTemplate.replace("{{input}}", case.input))]` → `AiInvokeService.invoke(messages, ...invokeOptions)` → `actualOutput`.
     - **Deterministic metric** (`AiLabEvalMetricService`): `exact` (normalize + so khớp), `contains` (mọi `expectedContains` xuất hiện), `embedding` (cosine(actual, expected) ≥ threshold qua `EmbeddingModelService`), `citationPresent` (regex nguồn `[doc]`/`(source: ...)`).
     - **LLM-judge** (`metricKind=judge` hoặc luôn chạy bổ sung): 1 invoke với system = `judgeRubric` + template JSON output `{ passed: bool, score: 0..1, feedback }`, parse bằng `extractJsonBlock` + `ProjectEvaluationParseService`-style.
   - `totalScore = Σ weight*caseScore`; `passed = totalScore/maxScore ≥ evalSet.passThreshold`.
   - `AiEntitlementService.consume({ userId, mode, cost })` 1 lần cho cả job (Premium debit credit).
2. **complete-step**: persist `AiLabEvalRunEntity` + `AiLabEvalCaseResultEntity[]`, set `status=completed`, `emitChangeEvent`.

### 5.3 Scoring (kết hợp)
- Mỗi case: `caseScore = metricKind === "judge" ? judgeScore : metricScore` (0..1), nhân `weight`.
- Citation: nếu `mustCite && !citationPresent` → case score = 0 (critical, mirror "critical criteria" của challenge V2).
- Output FE: "8/10 câu đạt · 7 có citation" = đếm `caseResults.filter(passed)` + `filter(citationPresent)`.

### 5.4 Determinism
`temperature: 0` cho judge (như `AiInvokeService` default) để verdict ổn định + cache được. Eval case có temperature riêng cho output học viên (vì đang test prompt của họ), nhưng judge luôn 0.

---

## 6. Cost / quota / cache

- **Lane**: tái dùng nguyên `AiEntitlement` 3-lane.
  - Playground Run + Eval: mặc định **Auto** (free, course-included, Economy models). Premium dùng credit pool; BYOK bypass quota.
  - Validate pick bằng `GradingLaneValidationService.validate` trước khi chạy.
- **Cap run/lesson**: `AiLabPlaygroundEntity.maxRunsPerWindow` + đếm `ai_lab_runs` theo user trong cửa sổ 5h (tái dùng cùng triết lý window của entitlement). Kết hợp gate Auto chung (`CreditUsageService.getSnapshot().overQuota`) để không vượt pool 50-credit.
- **Cache playground output**: key = `inputHash` = sha256(systemPrompt+userPrompt+JSON(params)+model+provider). Hit (cùng user, `status=completed`) → trả output cũ, KHÔNG gọi model, KHÔNG debit. Redis hot + bảng `ai_lab_runs` cold (`@Unique(playground,user,inputHash)`).
- **Cache eval verdict**: key per (evalSet, user, hash(submittedSystemPrompt+userTemplate+params+model)). Submit trùng config → trả lại `AiLabEvalRunEntity` cũ thay vì chạy lại N case (tiết kiệm lớn — đây là rủi ro cost #2 trong course plan §4).
- **BYOK** (CHỐT 2026-06-13: *free theo quota + gợi ý BYOK, KHÔNG ép*): mặc định mọi học viên chạy lane **Auto free** (quota cap + `maxRunsPerWindow` + cache). Khi sắp/đã hết quota → FE hiện **nudge** "hết lượt free → cắm key riêng (BYOK) chạy không giới hạn, hoặc nâng Premium". BYOK là **tùy chọn được khuyến khích, không bắt buộc**. `AiInvokeService.invoke({ byok })` đã có; key inline (one-shot) hoặc stored encrypted (`getByokApiKey`). **BYOK run KHÔNG trừ quota / KHÔNG tính `maxRunsPerWindow`** (key của họ) — chỉ giữ rate-limit nhẹ chống spam. → API trả kèm trạng thái quota (`remainingRuns`, `quotaExhausted`) để FE biết lúc nào nudge.
- **Token economics (dạy M3)**: lưu `promptTokens/completionTokens` từ response usage (LangChain `response.usage_metadata`); ước cost qua catalog giá (tận dụng `app.yaml` model catalog). Hiển thị ở UI playground.

---

## 7. Tích hợp content (author + seeder)

Content khóa AI sống trong **git data repo** (initv2 Octokit tarball — memory `initv2-git-data-source`), KHÔNG hardcode. `.mount/data/courses/` hiện chỉ mount `1-system-design-mastery` làm mẫu; khóa mới author tại data repo rồi seed.

Layout đề xuất (gắn vào lesson/challenge sẵn có):
```
courses/3-ai-llm-engineering/modules/<N>-<slug>/contents/<M>-<lesson>/
  playground/
    playground.md            # front-matter: kind, allowedProviders, maxRunsPerWindow, ragCollectionSlug
    vi.md / en.md            # label + description (translations)
  challenges/<K>-<slug>-<difficulty>/
    ... (challenge V2 files đã có) ...
    eval/
      evalset.md             # judgeRubric, passThreshold
      cases/<i>-case/case.md # front-matter metric + # input / # expected
```
**Seeder**: thêm builder trong `src/modules/init/` (pattern các builder hiện có, vd flashcard-deck builder mới thêm gần đây). Đọc `playground.md`/`evalset.md` bằng pattern `extract-json-from-md` (đã có service) → upsert `AiLabPlayground*` / `AiLabEvalSet*`. Diff/sync theo cơ chế initv2 (extract→staging→seed→materialize). RAG collection (`ragCollectionSlug`) ingest 1 lần qua pipeline riêng (M6 capstone) — KHÔNG ingest mỗi seed.

---

## 8. Frontend contract (FE repo `C:\Repositories\starci-academy` — chỉ contract, KHÔNG code)

UI cần (3 surface):
1. **Prompt Playground panel trong lesson**: 2 ô (system/user prompt) + sliders params (temperature/topP/maxTokens) + model picker (lane Auto/Premium/BYOK reuse profile AI settings) + nút Run. Output pane stream realtime. Hiện token + estimated cost. Badge "cached" khi hit cache. Nút "reset to default" (từ `aiLabPlayground.defaults`).
   - **Contract**: `aiLabPlayground` query (defaults) → `runPlaygroundPrompt` mutation (trả runId) → `playgroundRunStream` subscription (chunk `{ delta, done, status, tokens }`). Reuse `AiJobSelectionInput` + AI settings page hiện có.
2. **Eval challenge submit**: ô system prompt + user template (có placeholder `{{input}}`) + params + model → Submit. Sau submit hiện progress, rồi breakdown "8/10 câu đạt", per-case (input → actual output → passed/citation/feedback).
   - **Contract**: `submitEvalChallenge` → poll `aiLabEvalResult(evalRunId)` (hoặc subscribe job-change event đã có cho submission V2). Tái dùng UI submission V2 hiện có làm khung.
3. **RAG Playground (P1)**: ô query → hiện retrieved chunks (source + score) + answer + citations highlight. Contract: `ragQuery`.
4. **Model comparison (P2)**: cùng prompt, cột-per-model, mỗi cột output + cost + latency. Contract: mutation fan-out (cân nhắc nhiều subscription song song hoặc 1 query trả `Array`).

**Sandbox/Vite note**: khóa AI **không cần** code-runtime sandbox (đã chốt course plan §4: read-only + LLM-judge). Sandpack/Vite hiện chỉ cho FS course; AI Lab là UI native trong lesson page (không nhúng Sandpack). Code mẫu TS/Python trong content hiển thị read-only như các khóa khác.

---

## 9. Phasing

| Phase | Nội dung | Output |
|---|---|---|
| **P0a — Schema + bussiness core** | 6 entity + enums + migration; `AiLabPlaygroundService`, `AiLabRunService`, `AiLabCacheService`, `AiLabEvalMetricService`, `AiLabEvalService`. Unit test mock (mẫu `ai-entitlement.service.spec`). | DB + domain layer xanh tsc/lint. |
| **P0b — Playground stream API** | `aiLabPlayground` query + `runPlaygroundPrompt` mutation + `playgroundRunStream` subscription; cache hit path; entitlement + cap. | Run 1 prompt thật → stream + cache hoạt động. |
| **P0c — Eval-runner** | Processor `review-ai-lab-eval` (worker/step-map/grade/complete) + `submitEvalChallenge` + `aiLabEvalResult` + queue trong `BullQueueName`. | Submit eval → chấm async → breakdown đúng. |
| **P0d — Seeder + content hook** | Builder đọc `playground.md`/`evalset.md`/`case.md`; seed 1 lesson + 1 eval challenge mẫu (M3 streaming hoặc M7 RAG). | Author→seed→chạy E2E 1 bài thật. |
| **P1 — RAG Playground** | `AiLabRagService` + `ragQuery` + ingest pipeline collection. | Hỏi → chunks + answer + citation. |
| **P2 — Model comparison** | `AiLabComparisonService` + API fan-out. | So sánh đa-provider. |

---

## 10. Rủi ro & quyết định mở (cần founder chốt)

1. **Cost chấm eval** (course plan §4 #2): 100 task × N học viên × M case × (output + judge) = nhiều call. Đã có cache verdict (§6) nhưng cần chốt: cap số lần submit/challenge? Judge chạy mọi case hay chỉ case `metricKind=judge`?
2. **Premium gating** (course plan §4 #3): Foundations free để hút, Agents/LLMOps premium? Ảnh hưởng `maxRunsPerWindow` + lane mặc định playground.
3. **Cache cross-user**: `inputHash` cache theo user (an toàn) hay semantic-cache cross-user (rẻ hơn nhiều nhưng cùng prompt trả output đã cache của người khác — chấp nhận được cho playground "đọc"?). Hiện plan: per-user; cross-user là tùy chọn tiết kiệm.
4. ✅ ~~BYOK & cap~~ — **CHỐT 2026-06-13**: free theo quota cho mọi học viên + **gợi ý (nudge) BYOK khi gần hết quota, KHÔNG ép**. BYOK không trừ quota/không tính `maxRunsPerWindow`, chỉ rate-limit nhẹ. API trả `remainingRuns`/`quotaExhausted` cho FE nudge. (Còn lại: chốt con số quota cụ thể + có khác nhau theo tier không.)
5. ✅ ~~Streaming transport~~ — **CHỐT 2026-06-13: Socket.IO** (FE verify: Apollo Subscription chưa wire; Socket.IO đã wire + challenge-submit đang dùng). Xem §4.2 + §8.
6. **Token usage chính xác**: LangChain `usage_metadata` không đồng nhất giữa OpenAI/Gemini/OpenRouter → ước cost có thể lệch. Chốt: lấy best-effort + fallback đếm bằng tokenizer.
7. **Embedding cost cho metric**: `embedding` metric gọi embedding model mỗi case → thêm cost. Cân nhắc chỉ bật `embedding` cho case thực sự cần (mặc định `contains`/`judge` rẻ hơn).

---

## 11. FE build plan chi tiết (repo `C:\Repositories\starci-academy` — đã verify)

> FE = Next.js + HeroUI v3 + Tailwind v4 + Apollo (HTTP) + Socket.IO + Redux. **KHÔNG dùng graphql-codegen** — query/mutation viết tay theo file pattern `src/modules/api/graphql/{queries,mutations}/`. ~70-80% hạ tầng tái dùng được.

**Tái dùng (đã có):**
- **Socket.IO realtime**: `src/hooks/socketio/useJobNotificationsSocketIo.ts` + `PublicationEvent.SubscribeJobNotification` + Redux `state.socketIo.jobStatusByJobId` → dùng cho eval job; mở rộng thêm event `ai-lab-run-chunk` cho playground stream.
- **Lane/BYOK picker**: `src/components/layouts/profile/AiSettings/{LaneSelector,ByokForm,EffectiveLane}/` → trích ra component dùng chung cho model picker của playground.
- **Challenge submit flow**: `src/components/modals/ChallengeModal/ChallengeSubmissionPanel/` + `GradeModelDropdown` + `mutation-submit-challenge-submission.ts` + `SubmissionRow` → khung cho eval-graded challenge.
- **Markdown render**: `src/components/reuseable/MarkdownContent/` (react-markdown + remark-directive, directive `:::muted` / `::::tab`).
- **Lesson shell**: `src/components/layouts/Content/index.tsx` (tab system) + `ContentBody/ContentBodyV2/`.

**Phải làm thêm (FE):**
1. **GraphQL ops viết tay** (theo pattern file):
   - `queries/query-ai-lab-playground.ts`, `query-ai-lab-eval-result.ts`, `query-my-ai-lab-runs.ts`.
   - `mutations/mutation-run-playground-prompt.ts`, `mutation-submit-eval-challenge.ts`.
   - SWR hooks `src/hooks/swr/.../use*Swr.ts` tương ứng.
2. **Socket.IO mở rộng**: thêm event `subscribe-ai-lab-run` / `ai-lab-run-chunk` / `abort-ai-lab-run` vào hook socket (mẫu `useJobNotificationsSocketIo`); reducer gom chunk vào state `aiLabRunById[runId].output`.
3. **AI Lab tab** trong lesson (`Content/index.tsx`): thêm `ContentTab.AILab` (chỉ hiện khi lesson có playground) → component `AiLabBody`:
   - `PromptPlayground`: 2 ô (system/user) + sliders params + model/lane picker (reuse LaneSelector) + nút Run/Abort. Output pane stream realtime + badge "cached" + hiển thị token/cost + nudge BYOK khi `quotaExhausted`.
   - `EvalChallengePanel`: ô system prompt + user template (`{{input}}`) + params/model → Submit → progress (reuse job-status) → breakdown "8/10 câu đạt" per-case (reuse `SubmissionRow`).
4. **RAG Playground (P1)** + **Model comparison (P2)**: component riêng, contract `ragQuery` / fan-out.

**Quyết định FE**: AI Lab = **tab riêng** (full-width cho editor/output), KHÔNG nhúng inline trong body markdown (Option A của verify report) — trừ khi muốn 1 mini-playground inline thì thêm directive `:::ailab` vào `MarkdownContent/map.tsx`.

### Tóm tắt tái dùng (không xây mới)
`AiInvokeService` (invoke + buildClient OpenAI/OpenRouter/Gemini) · `AiEntitlementService` (lane/quota/BYOK/consume) · `GradingLaneValidationService` · `resolveGradingInvokeOptions` + `pickBestCategory` · `EmbeddingModelService` + `ModelService` · `QdrantClient` (`@InjectQdrantClient`) + `QdrantVectorStore` · `StreamAsyncIteratorService` · BullMQ worker/step pattern (`review-milestone-task`) · `extractJsonBlock` + `ProjectEvaluationParseService` · initv2 seeder + `extract-json-from-md`.
