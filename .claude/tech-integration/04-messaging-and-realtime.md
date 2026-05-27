# 04 — Messaging, Queue & Realtime

| Tech | Module path | Ghi chú |
|------|-------------|---------|
| **BullMQ** | `src/modules/bullmq/` | `BullModule.forRoot({ isGlobal })`. Queue rooms ở `rooms/`. Consumer logic rải rác ở `features/*/processors/`. |
| **NATS** | `src/modules/event/nats/` | Distributed event bus. Subjects khai báo ở `EventName` enum. `EventModule.register({ nats: { subjects } })`. |
| **Event Emitter (in-process)** | `src/modules/event/event-emitter.service.ts` | Wraps `@nestjs/event-emitter`. |
| **CQRS** | `src/modules/cqrs/` | Wraps `@nestjs/cqrs`. `event-bus/` (custom event bus), `icqrs-handler.ts`. `EventBusModule.register({ isGlobal })`. |
| **Socket.IO (gateway core)** | `src/modules/socketio/` | Adapters (Redis adapter), decorators, filters, interceptors, middlewares, `response.service.ts`. |
| **Socket.IO (feature layer)** | `src/features/socketio/` | `core/autocomplete/`, `core/job-notifications/` — namespaces & handlers cụ thể. |
| **Stream async iterator** | `src/modules/stream-async-iterator/` | Helper cho SSE / streaming responses (LLM stream). |

## Khi cần thêm

- **Job consumer mới (nghiệp vụ)** → `src/features/api/processors/<name>/`.
- **Job consumer mới (sync)** → `src/features/synchronizer/processors/<name>/`.
- **Socket namespace mới** → `src/features/socketio/core/<namespace>/`.
- **NATS subject mới** → thêm vào enum `EventName` rồi khai báo subject ở `EventModule.register({ nats: { subjects } })` trong `apps/core/src/app.module.ts`.
