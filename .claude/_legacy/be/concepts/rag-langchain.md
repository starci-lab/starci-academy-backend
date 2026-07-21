# Concept — RAG & LangChain

> `src/modules/langchain/` (model/embedding wrapper) + `src/modules/rag/` (retrieval-augmented use case) + `src/modules/databases/qdrant/` (vector store backing). Model gọi thật đi qua [[ai-catalog-balancer-entitlement]] (balancer/entitlement), RAG là lớp NGHIỆP VỤ trên nền đó.

- `langchain.service.ts` + `model.service.ts` + `embedding-model.service.ts` — provider qua `@langchain/openai` (GPT), `@langchain/google-genai` (Gemini), `@langchain/qdrant` (vector adapter), `@langchain/community`.
- **RAG use case thật** (`src/modules/rag/`, không phải khái niệm trừu tượng): `content-rag-index.service.ts`/`content-rag-retrieval.service.ts` (index + query nội dung khoá học), `cv-rag-index.service.ts`/`cv-rag-retrieval.service.ts` (CV review), `grading-rag-retrieval.service.ts` (chấm điểm có context), `github-repo-import.service.ts` (kéo repo làm nguồn RAG).
- **Public RAG playground** (`public-rag-playground.service.ts` + `public-rag-playground-cleanup.service.ts` + `rag-playground-run-registry.service.ts`) — sandbox demo RAG cho người dùng thử, có cleanup job dọn run cũ, registry track run đang chạy. Socket namespace tương ứng: `src/features/socketio/core/rag-playground/` (xem [[realtime-socketio]]).
- Stream LLM response dùng `@modules/stream-async-iterator` để wrap thành SSE/socket chunk — không block request chờ full response.
- Vector store backing: Qdrant (`databases/qdrant/`) — embedding lưu ở đây, không phải Postgres.

> Nguồn: `src/modules/langchain/`, `src/modules/rag/`, `src/modules/databases/qdrant/`
