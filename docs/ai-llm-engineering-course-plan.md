# Khóa AI / LLM Engineering — Plan (V2 capstone)

> Ngày: 2026-06-13 · Trạng thái: PLAN (chưa build)
> Chốt với thầy: **song ngữ TS + Python · capstone 1 AI product (mô hình V2) · chấm bằng Challenge V2 + LLM-judge**
> Đọc kèm: [[ai-feature]] (balancer/entitlement/BYOK), [[personal-project-v2-plan]], [[challenge-criteria-redesign]], [[content-check-audit-rule]], [[fullstack-v2-rules-ssot]]

---

## 0. Định vị & luận điểm

- **Đòn bẩy cao nhất, gần 0 hạ tầng AI mới**: platform đã có AI infra production (balancer đa-provider, entitlement 3-lane AiMode, BYOK encrypted, mua gói PayOS/Sepay). Khóa này *dạy lại chính cái stack mình đã xây* → vừa dạy vừa là tài liệu nội bộ.
- **Cầu VN đang bùng nổ, ít đối thủ làm bài bản**. Khác biệt hóa = dạy LLM **engineering** (RAG/agent/eval/LLMOps/cost) chứ không phải "prompt cho vui".
- **Bổ trợ bộ tứ**: SD test thiết kế · DSA test code · FS test web · **AI/LLM test khả năng ghép LLM vào sản phẩm thật**.
- Slug dự kiến: `3-ai-llm-engineering` (sau `2-devops-mastery`).

## 1. Mô hình khóa (mirror SD/FS V2)

- **Capstone xuyên suốt**: build 1 sản phẩm AI thật, deploy được — đề xuất **"StarCi Copilot"**: trợ lý học tập RAG + agent trên chính content course (trả lời câu hỏi, trích dẫn lesson, tra tiến độ học, gợi ý bài tiếp theo), có eval + guardrails + cost control + deploy.
  - Đối xứng "StarCi Shop" (ecommerce) của SD/FS → "StarCi Copilot" (AI) của khóa này.
- **20 milestone × 5 task = 100 task** (đúng cấu trúc personal-project V2). Mỗi milestone = 1 module; mỗi task xây 1 lát cắt của Copilot.
- **Song ngữ TS + Python**:
  - Concept agnostic; code 2 lang trong `bodies/<N>-ts/` và `bodies/<N>-python/`.
  - Áp **content-check-audit** ([[content-check-audit-rule]]): topic nào portable thì gen cả 2; topic idiom riêng (vd fine-tune HF/vLLM → Python-only; tích hợp NestJS DI/balancer → TS-only) → 1 block concept-mapping, **không bịa lang**.
  - TS-first cho phần "ghép LLM vào web/service" (đồng bộ platform); Python-first cho phần "ML/data/fine-tune".
- **Chấm**: Challenge V2 (outcome 30 agnostic + approach 70 per-lang = 100, yes/no + critical flag) + **LLM-judge** cho output non-deterministic. KHÔNG ép Judge0 (gọi API thật → non-deterministic, cần network + key).

## 2. Roadmap 20 module (5 tier)

### Tier 0 — Foundations (M0–M3)
- **M0 — LLM & the API**: token/context window/params (temperature, top_p, max_tokens), SDK Anthropic + OpenAI (TS & Python), model ids & pricing, knowledge cutoff. → *Copilot task: gọi LLM đầu tiên, "hello model".*
- **M1 — Prompt engineering**: system vs user, few-shot, chain-of-thought, prompt template, anti-pattern. → *Copilot: viết system prompt cho tutor persona.*
- **M2 — Structured output**: JSON schema, tool/function-calling để extract, validate bằng **zod (TS) / pydantic (Python)**, retry khi sai schema. → *Copilot: trích "intent" + "lesson refs" có cấu trúc.*
- **M3 — Streaming & token economics**: SSE/stream, đếm token, ước lượng cost, latency, TTFT. → *Copilot: stream câu trả lời ra UI + hiện cost.*

### Tier 1 — RAG (M4–M8)
- **M4 — Embeddings & semantic search**: embedding model, cosine sim, dựng index thủ công (in-memory) để hiểu bản chất.
- **M5 — Vector database**: pgvector (ưu tiên — đã có Postgres) hoặc Qdrant; upsert, query, metadata filter. → *Copilot: index toàn bộ lesson.*
- **M6 — Chunking & ingestion pipeline**: document loader, chiến lược chunk (fixed/semantic/recursive), metadata, dedupe. → *Copilot: pipeline nạp content course.*
- **M7 — RAG core**: retrieve → augment → generate, lắp context, **citation bắt buộc**, chống hallucination. → *Copilot: trả lời kèm trích dẫn lesson.*
- **M8 — Advanced retrieval**: hybrid (BM25 + vector), reranking, query rewriting, HyDE, multi-query. → *Copilot: nâng recall/precision.*

### Tier 2 — Agents (M9–M12)
- **M9 — Tool use / function calling (sâu)**: định nghĩa tool, tool loop, parallel tools, error handling. → *Copilot: tool tra tiến độ học từ DB.*
- **M10 — Agents**: ReAct, planning, vòng lặp agent, dừng/kiểm soát, budget bước. → *Copilot: agent trả lời câu hỏi đa-bước.*
- **M11 — Multi-agent orchestration**: supervisor/worker, handoff, fan-out/fan-in, khi nào cần multi-agent. → *Copilot: "tutor" + "planner" + "grader".*
- **M12 — Agent memory & state**: short/long-term memory, conversation, session, tóm tắt lịch sử. → *Copilot: nhớ ngữ cảnh học viên qua phiên.*

### Tier 3 — Evaluation & Quality (M13–M15)
- **M13 — Evaluation harness**: dataset, golden set, metrics (exact/embedding/heuristic), regression test cho prompt. → *Copilot: bộ eval cho câu trả lời RAG.*
- **M14 — LLM-as-judge**: rubric, pairwise, alignment với người chấm, bias của judge. → *(Chính là cơ chế chấm challenge của khóa — dạy lại được).* 
- **M15 — Guardrails & safety**: validate input/output, PII, jailbreak/prompt-injection defense, moderation, fallback. → *Copilot: chặn off-topic + injection.*

### Tier 4 — Production / LLMOps (M16–M19)
- **M16 — Observability & tracing**: log prompt/response, trace đa-bước, OTel cho LLM, debug agent, eval online. → *Copilot: trace 1 câu hỏi end-to-end.*
- **M17 — Caching, cost & model routing**: prompt caching, semantic cache, batching, **balancer đa-provider + entitlement + BYOK** (dạy lại stack của platform). → *Copilot: route model theo lane, cap cost.*
- **M18 — Fine-tuning & adaptation**: RAG vs fine-tune vs prompt — khi nào dùng gì; chuẩn bị dataset, fine-tune nhẹ/distillation, eval trước-sau (Python-first; TS = concept-mapping). → *Copilot: cân nhắc FT cho intent-router.*
- **M19 — Deploy & LLMOps wrap**: deploy AI service, rate-limit/throttle, secrets/vault, BYOK prod, readiness checklist; ráp toàn bộ Copilot + capstone review. → *Copilot: lên production.*

## 3. Map vào hạ tầng có sẵn (tái dùng vs phải xây)

| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| LLM call + balancer đa-provider | ✅ có | dạy lại ở M0/M17; reuse cho sandbox proxy |
| Entitlement 3-lane AiMode + BYOK | ✅ có | dạy ở M17; cấp quota chạy bài cho học viên |
| Course/Module/Lesson seeder (V2) | ✅ có | tạo course mới như SD/FS |
| Challenge V2 criteria + **LLM-judge grader** | ✅ có | chấm bài AI non-deterministic |
| Flashcard "interview-prep" + Quiz deck | ✅ có | map theo pattern (prompt/RAG/agent/eval term) |
| Personal-project V2 (milestone_task + grade) | ✅ có | 100 task Copilot |
| **Sandbox chạy code** | ✅ **không cần** | đã chốt (a) read-only + LLM-judge → không cần runtime |
| **Vector DB cho RAG** | ✅ **CÓ SẴN** | `src/modules/databases/qdrant/` (module đầy đủ: client/collection/providers) + `@langchain/qdrant`. GAP đã đóng — dùng Qdrant, không cần pgvector |
| **Embeddings** | ✅ có | `src/modules/langchain/embedding-model.service.ts` (OpenAI + Gemini) |
| **LLM-judge / grading** | ✅ có | `src/modules/ai/grade-model-router.service.ts` + `ai-invoke` + `grading-lane-validation` + review processors (milestone-task, git/google-docs submission) |
| **Stream LLM → SSE/WS** | ✅ có | `src/modules/stream-async-iterator/` |
| **AI router theo tier** | ✅ có | `src/modules/ai/` (Premium/Standard/Cheap) + entitlement + secret |

## 4. Quyết định đã chốt + open còn lại

**ĐÃ CHỐT (2026-06-13):**
- ✅ **Capstone = "StarCi Copilot"** (RAG tutor trên content course).
- ✅ **Chạy bài = (a) read-only code + chấm bằng Challenge LLM-judge** — không cần runtime, không trả token chạy thử, rẻ nhất. Học viên đọc code mẫu + tự làm challenge, grader chấm bằng criteria + LLM-judge.

**OPEN còn lại:**
1. ✅ ~~Vector DB~~ → **Qdrant đã có sẵn** (P0 verify). Khóa dạy thẳng Qdrant; Copilot reuse module hiện tại.
2. **Token cost khi chấm**: LLM-judge cho 100 task × N học viên = chi phí. Cần cap/cache verdict (tái dùng entitlement lane).
3. **Premium gating**: tier nào miễn phí (Foundations?) để hút, tier nào premium (Agents/LLMOps)?
4. ✅ **Mô hình quota AI Lab (CHỐT 2026-06-13)**: **free theo quota cho mọi học viên + gợi ý (nudge) BYOK khi gần hết, KHÔNG ép**. Mặc định lane Auto free (cap + cache); hết quota → nudge BYOK/Premium. BYOK không trừ quota, chỉ rate-limit nhẹ. (Còn: con số quota cụ thể + có nới theo tier không.)

## 4b. P0 VERIFY — KẾT QUẢ (2026-06-13) ✅

Pass verify đã chạy. Hạ tầng AI/RAG **đã có sẵn gần như đầy đủ** — khóa này dạy lại chính stack production của platform:

- ✅ **Qdrant** vector store: `src/modules/databases/qdrant/` (module đầy đủ) + `@langchain/qdrant` → T1 RAG (M5–M8) dùng thật.
- ✅ **Embeddings**: `langchain/embedding-model.service.ts` (OpenAI + Gemini) → M4.
- ✅ **LangChain + stream**: `src/modules/langchain/` + `stream-async-iterator/` → M0/M3.
- ✅ **AI router theo tier + entitlement + secret + BYOK**: `src/modules/ai/` → M17 dạy lại nguyên xi.
- ✅ **Grading/LLM-judge**: `grade-model-router` + review processors (milestone-task, git/google-docs) → chấm challenge V2.
- ✅ **Course seeder**: content sống ở git data repo (initv2, Octokit tarball — [[initv2-git-data-source]]); `.mount/data/courses/` hiện chỉ mount `1-system-design-mastery` làm mẫu. Tạo khóa mới = author trong data repo + index.

**Hệ quả**: GAP lớn nhất (vector DB + runtime) đã đóng. P0 coi như xong → có thể vào **P1 scaffold** ngay khi thầy chốt #2/#3 ở trên.

## 5. Phasing (P0–P6)

- **P0 — Verify hạ tầng** (1 buổi): xác nhận pgvector, sandbox khả năng Python, LLM-judge grader nhận output AI, course seeder nhận khóa mới. *(Đây là pass exploration mình hoãn — chạy khi thầy go.)*
- **P1 — Scaffold course**: tạo `3-ai-llm-engineering` + 20 module folder + metadata, seed rỗng, FE render khóa.
- **P2 — Content Tier 0 (M0–M3)** + capstone milestone 0–3 + challenge mẫu + LLM-judge chạy thật 1 bài.
- **P3 — Tier 1 RAG (M4–M8)** + dựng vector index cho Copilot (nội dung nặng nhất).
- **P4 — Tier 2 Agents (M9–M12)**.
- **P5 — Tier 3 Eval/Safety (M13–M15)**.
- **P6 — Tier 4 LLMOps (M16–M19)** + ráp capstone + flashcard/quiz deck + audit + seed.

## 6. Rủi ro & bài học áp từ V2

- **Cost control workflow** ([[feedback-v2-workflow-cost-control]]): ≤2 workflow nặng song song; verify COUNT trước khi tin gate; body song-ngữ dễ "chết đói im lặng" → pin flow-order/status; cân nhắc Sonnet cho body.
- **Non-determinism**: mọi bài chấm phải đi qua criteria yes/no + critical flag, KHÔNG so khớp output literal.
- **content-check applicability**: đừng ép TS/Python cho topic vô nghĩa với lang đó.
- **Gate ≠ semantic**: re-verify độc lập bằng grep/script, đừng tin workflow báo PASS.

## 7. ĐÀO SÂU — vượt mức "mirror platform" (chốt với thầy 2026-06-13)

> Nguyên tắc: *dạy được vì mình đã xây* là điểm tin cậy, nhưng KHÔNG dừng ở "dùng balancer của StarCi". Mỗi module có **3 lớp độ sâu** — và một tính năng học viên mới: **AI Lab** (xem [[ai-lab-feature-plan]]).

### 7.1 Ba lớp độ sâu mỗi module
- **Lớp 1 — Concept gốc (vendor-neutral)**: nguyên lý phía dưới, không phụ thuộc framework. VD M0 không chỉ "gọi SDK" mà dạy tokenization, context window economics, sampling (temperature/top_p/top_k thực sự làm gì); M4 dạy bản chất embedding/cosine trước khi đụng thư viện; M7 dạy lý thuyết retrieval + vì sao RAG giảm hallucination.
- **Lớp 2 — Stack StarCi (mirror)**: cách platform hiện thực (ai-invoke router, entitlement, Qdrant, stream-async-iterator). Học viên đọc code thật + tự dựng lại slice trong Copilot.
- **Lớp 3 — Production failure modes + interview**: cái mà tutorial khác né. Mỗi module 1 mục "**Khi nó vỡ**" + 1 mục "**Hỏi phỏng vấn AI Engineer**". VD: context overflow & truncation, embedding drift khi đổi model, retrieval recall sụp khi chunk sai, agent loop vô hạn/cost blowup, prompt-injection qua retrieved content, eval bị judge-bias, cache poisoning, rate-limit/timeout/fallback.

### 7.2 Bổ sung topic deep (không có ở "mirror" thuần)
- **M3+**: context-window budgeting & token accounting thực chiến (prompt caching, message pruning, summary-memory).
- **M6/M8**: chunking nâng cao (semantic/late chunking, parent-document, contextual retrieval kiểu Anthropic), hybrid + RRF fusion, reranker cross-encoder.
- **M10/M11**: agent design patterns chuẩn (ReAct vs plan-execute vs reflexion), kiểm soát budget bước/cost, **failure & recovery** (tool error, hallucinated tool call), khi nào KHÔNG dùng agent.
- **M13/M14**: eval rigor — golden set, offline vs online eval, regression gate cho prompt (CI cho prompt!), LLM-judge bias & cách hiệu chỉnh, pairwise + Elo, đo cost/latency như first-class metric.
- **M15**: threat model thật — prompt injection (direct + indirect qua RAG), data exfiltration, jailbreak, output validation; defense-in-depth.
- **M17/M18**: model routing economics (route theo độ khó câu hỏi), semantic cache, batching; RAG-vs-finetune-vs-prompt decision framework có số liệu cost/latency.

### 7.3 Interview-prep track xuyên khóa (điểm bán mạnh)
Mỗi tier kết bằng 1 **"AI System Design" interview** (đối xứng khóa SD nhưng cho LLM app): "thiết kế 1 chatbot hỗ trợ KH có RAG + guardrail + cost cap", "thiết kế eval pipeline", "thiết kế agent đặt hàng an toàn". → Flashcard interview-prep + quiz deck map thẳng vào pattern (RAG, agent, eval, guardrail, routing).

### 7.4 AI Lab — tính năng MỚI cho học viên (track riêng, agent đang plan)
Khiến khóa này KHÔNG phải "dạy như bình thường": học viên **chạy LLM thật** + được **chấm theo hành vi LLM** chứ không đọc code tĩnh.
- **Prompt Playground** (P0 feature): sửa prompt/params → Run → output stream thật, qua entitlement + cost cap + cache.
- **Eval-graded challenge** (P0 feature): chạy prompt/config của học viên trên golden eval set → điểm có cấu trúc.
- **RAG Playground** + **Model comparison** (P1 bonus).
- Spec kỹ thuật đầy đủ (entity/API/eval-runner/cost/FE contract): **`docs/ai-lab-feature-plan.md`** (đang được agent soạn).

---

### Việc tiếp theo
1. **[track A — feature]** Agent đang soạn `docs/ai-lab-feature-plan.md` (AI Lab). Review xong → quyết build P0 (Playground + Eval-graded challenge) trước hay song song content.
2. **[track B — content]** Chốt 2 open §4 (cost cap chấm + premium gating) → vào P1 scaffold `3-ai-llm-engineering`.
3. Mỗi module author theo **3 lớp độ sâu §7.1** + mục "Khi nó vỡ" + "Hỏi phỏng vấn", KHÔNG dừng ở mirror.
