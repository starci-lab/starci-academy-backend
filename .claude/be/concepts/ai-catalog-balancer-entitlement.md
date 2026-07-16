# Concept — AI catalog, balancer & entitlement

> `src/modules/ai/` — 3 lớp: catalog model (balancer), quota/entitlement (1 pool credit), router theo tác vụ. Model gen/embed thật chạy qua [[rag-langchain]] (LangChain).

- **Catalog & balancer** (`ai/balancer/`): `AiModelCatalogService` (danh sách model theo tier) + `AiBalancerService` (chọn/luân phiên) + `KeyRotatorService`/`KeyStoreService` (xoay API key nhiều key/provider, tránh rate-limit 1 key) + `UseApiService` (gọi thật). `ModelTier` (Premium/Standard/Cheap) là trục chọn model theo entitlement.
- **Entitlement** (`ai-entitlement.service.ts`, `types/ai-entitlement.ts`, `constants/ai-entitlement.constants.ts`): quota = **1 pool credit chung** (không tách theo tính năng) — mỗi lượt gọi trừ theo `credit-cost.ts` (chi phí khác nhau theo model/tier). `AiInvokeService` là cổng gọi chung đo credit trước khi invoke.
- **Router theo domain**: `grade-model-router.service.ts` (chấm submission) + `grading-lane-validation.service.ts` (validate lane chấm) + `ai-task-model.service.ts` (chọn model theo task loại) — mỗi router extend `classes/abstract-model-router.ts`.
- **Ping/health** (`ai/ping/`): `gemini-ping`, `openai-ping`, `openrouter-ping` per-provider health check + latency — dùng để balancer tránh route vào provider đang down/chậm.
- Gotcha: `myAiQuota` GraphQL query là breaking surface khi đổi shape entitlement — kiểm FE tương ứng khi sửa `types/ai-entitlement.ts`.

> Nguồn: `src/modules/ai/`
