# AI flows — unit-test coverage plan (2026-06-30)

> Mục tiêu: test ĐỦ mọi luồng AI (chat · chấm challenge · chấm PP · phỏng vấn) + mọi behavior MỚI session này (probe raw-fetch, local-first ordering, embedding-via-balancer, RAG, PP unify). Jest unit, mock external deps. Mirror spec mẫu: `use-api.service.spec`, `grading-rag-retrieval.service.spec`, `interview-grading.service.spec`.

## ✅ ĐÃ CÓ spec (chỉ confirm còn xanh, KHÔNG viết lại)
infra/balancer: `ai-invoke` · `ai-entitlement` · `ai-task-model` · `grade-model-router` · `grading-lane-validation` · `ai-balancer` · `ai-model-catalog` · `key-rotator` · `key-store` · `use-api` (base) · `ai-ping`. utils: classify-ai-error · extract-json-block · normalize-grading-score · pick-best-category · resolve-grading-* · validated-lane-to-ai-job-selection. rag: `grading-rag-retrieval`. flashcard: `flashcard-deck` · `interview-grading` (base). git: `…-complete-step`.
→ **Verify pass đầu tiên** (`npx jest src/modules/ai src/modules/rag src/modules/bussiness/flashcard`). Đã chạy use-api + grading-rag = 16 pass ✓.

## ❌ GAP — cần viết (theo TIER ưu tiên)

### TIER 1 — behavior MỚI session này (rủi ro cao nhất, vừa đổi, chưa cover)
| # | SUT | Test gì |
|---|---|---|
| 1 | `UseApiService.probeModel` (use-api.spec bổ sung) | 2xx (kể cả body rỗng/reasoning-truncate)=UP · 401/403/404/429/5xx=DOWN kèm `[code]` · timeout/network=DOWN · per-provider request shape (OpenAI max_completion_tokens / Local max_tokens / Gemini :generateContent / Anthropic headers). Mock global `fetch` + `tryAcquire` |
| 2 | `UseApiService.orderByHealthAndLatency` (freeLocalRank) | trong tier Free: Local healthy LÊN ĐẦU · Local down → fallback cloud (downRank thắng) · paid tier KHÔNG đổi · latency tiebreak (chatting) giữ. Mock latency cache |
| 3 | `AiModelLatencyService` | runCycle staggered · isLast emit snapshot · probe fail non-fatal (safeRecordDown) · scope `freeLocal` filter · gating enabled. Mock probeModel+cache+emitter |
| 4 | `EmbeddingModelService` | `.get()` per-provider (+ Local/Ollama branch, strip `/v1`) · `getViaBalancer()` route `useApi(task=Embedding,Auto)` → trả Embeddings. Mock useApi+env |

### TIER 2 — flow vừa ĐỔI (chat hybrid + PP unify)
| # | SUT | Test gì |
|---|---|---|
| 5 | `ContentAiService.prepareMessages`/`resolveGrounding` | HYBRID: body ≤ threshold → stuff cả bài · body lớn → RAG top-k filter contentId · retrieval rỗng/fail → fallback whole-body · premium gate · history cap. Mock LessonRagRetrievalService + content loader + AiInvoke |
| 6 | `review-milestone-task-grade-step` (PP, vừa unify) | criteria map V2(`{body:c.body}`)/legacy(`{body:text\npromptText}`) · runKey có fencingToken · gọi `retrieveSourceExcerpt` đúng params · grade pass. Mock GradingRetrievalService + deps |
| 7 | `LessonRagRetrievalService.retrieveContentExcerpt` | similaritySearch filter `metadata.contentId` · assemble dedupe · degrade→empty khi fail. Mock qdrant+embed |

### TIER 3 — flow chấm challenge (chưa có grade-step spec)
| # | SUT | Test gì |
|---|---|---|
| 8 | `process-git-submission-grade-step` | load→split→GradingRetrieval→invoke grading lane→parse→persist · degrade path. Mock all |
| 9 | `process-google-docs-submission-grade-step` | tương tự (gdocs) |
| 10 | `review-ai-lab-eval-grade-step` | eval-challenge grading |

### TIER 4 — RAG index + interview + chat entrypoints
| # | SUT | Test gì |
|---|---|---|
| 11 | `LessonRagIndexService.build` | enumerate contents · đọc MinIO body+code · chunk · embed · upsert lesson_rag · per-content fail non-fatal · empty-skip. Mock entityManager/s3/embed/qdrant |
| 12 | `grade-interview-answer.handler` | validate lane (selectedModel→GradingLaneValidation) · invoke · return scorecard |
| 13 | `interview-grade-prompt.service` + `interview-history.service` | prompt build per-question · history persist |
| 14 | `interview-grading.service` (augment) | bổ sung nếu thiếu nhánh model-select |
| 15 | `ask-content-ai.handler` (one-shot) + `content-ai.gateway` (socket) | wiring: resolve user · lane chatting/floor Free · stream chunk · persist turn (gateway nhẹ — socket mock) |

## Cách làm / mock
- Jest unit, **mock external**: `fetch` global, Qdrant client, Embeddings, `AiInvokeService.run`, `EntityManager`, S3 readers, socket, env. KHÔNG gọi mạng/DB thật.
- Mỗi spec: happy + ≥1 edge/error + đúng behavior MỚI. Chạy `npx jest <file>` xanh trước khi qua file kế.
- Baseline: bỏ qua lỗi tsc baseline (apps/*, .spec cũ không đụng).

## Execution (workflow, batched — hạ tầng agent đang chập chờn)
- **Pha 0**: chạy toàn bộ AI spec hiện có → confirm xanh (chốt mốc).
- **Pha 1–4 theo TIER**: mỗi TIER = 1 batch agent (2 agent/lượt, tránh rate-limit), mỗi agent viết 1–2 spec + tự `jest` xanh + iterate. Sequential giữa các TIER (T1 infra trước vì T2/3 mock chúng).
- Ưu tiên T1→T2 (vừa đổi, rủi ro) rồi T3→T4. Thầy duyệt scope (full hay tới Tier nào).
