# Concept — CQRS event bus (in-process, decoupled side-effect)

> `src/modules/cqrs/event-bus/` — wraps `@nestjs/cqrs`. Khác [[messaging-nats-kafka]] (cross-service pub/sub) và [[cqrs-projection-and-cdc]] (read-model recompute từ Debezium/Kafka).

- Mỗi event = 1 folder: `<name>.event.ts` (class chứa payload) + `<name>.handler.ts` (xử lý) + `index.ts`.
- Handler pattern: extend `ICQRSHandler<Event, Result>` + implement `ICommandHandler` — override **`process()`** (KHÔNG `execute()`; wrapper bọc retry quanh `process`).
- Publish từ domain/feature service: `eventBus.publish(new XEvent(payload))`.
- Handler có sẵn: `add-github-user-to-team`, `send-mail`, `sync-cdn`, `sync-elasticsearch`, `sync-cassandra`, `sync-mongodb`, `sync-scylladb`.
- ⚠️ **Double-register cố ý** ở `apps/core/src/app.module.ts`: cả `CqrsModule.forRoot()` (Nest core) VÀ `CQRSModule.register({ isGlobal: true })` (wrapper riêng bổ sung event bus custom) — cần cả hai, đừng xoá cái nào.
- Chọn cơ chế: side-effect nội bộ/decouple/retry → CQRS event bus · việc nặng có queue → [[background-jobs-bullmq]] · pub/sub giữa service/app → [[messaging-nats-kafka]].

> Nguồn: `src/modules/cqrs/`
