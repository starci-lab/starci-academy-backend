# Domain — AI / LLM Mastery (`3-ai-llm-mastery`) — ⚠️ BRIEF (ĐỀ XUẤT, thầy chốt)

> **Trạng thái: THIN** — mới 2 module (`0-llm-and-the-api`, `1-prompt-engineering`), chưa meta khóa, chưa flashcard/milestone/interview, chưa `rules/`. Đây là **BRIEF đề xuất** định vị + curriculum để thầy chốt hướng TRƯỚC khi gen. Bản đồ §2 là ĐỀ XUẤT (không grounded như FS/SD).

## 1. Định vị (đề xuất)
- **Outcome:** engineer **xây ứng dụng AI production** trên LLM — không phải "chơi ChatGPT", mà API/RAG/agent/eval/cost thật.
- **Trục domain đề xuất:** API cơ bản → prompt/structured output → RAG (embedding + vector DB) → agent/tool-use → eval + guardrails → production (streaming/cost/observability). Ground bằng **stack THẬT của StarCi** (Claude + local qwen + RAG + Qdrant — xem [[ai-local-first-free-tier-tasks]], [[local-qwen-gpu-host-cloudflare]]) → học viên build cái mình đang chạy thật.

## 2. Bản đồ giáo trình ĐỀ XUẤT (thầy chốt scope/thứ tự)
| Cụm | Module đề xuất |
|---|---|
| **Nền tảng** (đã có) | 0 llm-and-the-api ✅ · 1 prompt-engineering ✅ |
| **Structured + control** | structured-output-and-tool-use · streaming-and-token-economics · caching-and-latency |
| **RAG** | embeddings-and-vector-search · rag-pipeline (chunk/retrieve/rerank) · eval-retrieval-quality |
| **Agent** | agent-loops-and-tool-use · multi-agent-orchestration · mcp-and-external-tools |
| **Chất lượng + an toàn** | llm-evaluation-and-llm-as-judge · guardrails-and-safety · prompt-injection-defense |
| **Production** | observability-and-tracing-llm · cost-and-model-routing (auto-lane) · fine-tuning-vs-prompting (khi nào) |
| **Ứng dụng** | multimodal (vision) · realtime-voice (nếu hợp) |

## 3. Quy ước domain đề xuất (chốt khi soạn contents.md)
- **Lang:** chủ yếu **agnostic** (concept LLM không gắn stack) HOẶC TS-only (StarCi BE = NestJS/TS + LangChain). Provider = Claude/Anthropic mặc định ([[claude-api]]) + local qwen (free lane).
- **E2E:** gọi API thật (require-creds provider) HOẶC local model (qwen qua Ollama — free, không require-creds). RAG lab = embed + Qdrant thật.
- **Grounding:** dùng model IDs + pricing THẬT ([[claude-api]] skill); KHÔNG bịa API. Ưu tiên Claude làm ví dụ chính.
- **Loại bài:** demo API (BE flows) + eval harness; ít FE (trừ chat UI minh hoạ).

## 4. Câu hỏi cho thầy (chốt trước khi gen)
- Định vị: "AI engineering production" hay "prompt/ứng dụng cho non-eng"? (đổi cả curriculum).
- Provider chính: Claude-only hay đa provider (OpenAI/Gemini/local)?
- Có capstone không (vd build 1 RAG/agent app thật)?
- Số module mục tiêu (~12–16?).

## 5. Cho gen/audit
- **CHƯA gen được sâu tới khi thầy chốt §1/§4** + soạn `rules/ai-llm/{contents,challenges,coding}.md`. Domain.md này = brief mở màn.
