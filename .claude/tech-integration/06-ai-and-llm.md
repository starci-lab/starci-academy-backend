# 06 — AI / LLM / ML

| Tech | Module path | Ghi chú |
|------|-------------|---------|
| **AI router** | `src/modules/ai/` | `abstract-model-router.ts` + nhiều router cụ thể |
| **LangChain** | `src/modules/langchain/` | `langchain.service.ts`, `model.service.ts`, `embedding-model.service.ts` |
| **Qdrant (vector store)** | `src/modules/databases/qdrant/` | Backing store cho RAG |

## Các router trong `src/modules/ai/`

| File | Mục đích |
|------|---------|
| `abstract-model-router.ts` | Base class — chọn model theo tier (Premium/Standard/Cheap) |
| `model-tier.ts` | Enum tier |
| `secret.service.ts` | Quản lý API keys |
| `ping.service.ts` | Health check provider |
| `grade-model-router.service.ts` | Chấm điểm submission |
| `generate-milestone-router.service.ts` | Sinh milestone task |
| `review-cv-submission-model-router.service.ts` | Review CV |
| `review-personal-project-router.service.ts` | Review personal project |

## LangChain providers

Khai báo qua dependencies (`package.json`):

- `@langchain/openai` — GPT models
- `@langchain/google-genai` — Gemini
- `@langchain/qdrant` — Vector store adapter
- `@langchain/community` — Community providers

## Stream LLM response

Dùng `src/modules/stream-async-iterator/` để wrap LangChain stream → SSE/WebSocket.
