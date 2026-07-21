# Concept — Realtime (Socket.IO)

> Gateway core ở `src/modules/socketio/` (adapters Redis, decorators, filters, interceptors, middlewares, `response.service.ts`). Namespace cụ thể ở `src/features/socketio/core/<namespace>/`.

- Namespace thật (9): `ai-lab/` (chạy AI Lab job), `autocomplete/` (search suggest), `community-chat/`, `community-feed/`, `content-ai/`, `content-discussion/`, `job-notifications/`, `mock-interview/` (turn streaming), `notifications/`, `rag-playground/`, `system-health/` — mỗi namespace có `<name>.gateway.ts` + `<name>.module.ts`/`module-definition.ts` + `types/` (một số có thêm `<name>-room.service.ts` quản room membership).
- Redis adapter (`native/redis` — key `Adapter`) cho phép multi-instance broadcast cùng namespace, khác Redis cache instance (`Cache`), xem [[typeorm-entities-and-relations]] §stores phụ.
- Job realtime (progress, encode, AI run) đẩy state qua namespace tương ứng — FE subscribe theo `subscription-event.ts` / publish theo `publication-event.ts` (`src/features/socketio/core/enums/`).
- Thêm namespace mới → `src/features/socketio/core/<namespace>/` theo khuôn module 3-file + gateway.
- Stream LLM response (token-by-token) dùng `@modules/stream-async-iterator` để wrap thành SSE/socket chunk — xem [[rag-langchain]].

> Nguồn: `src/modules/socketio/`, `src/features/socketio/core/`
