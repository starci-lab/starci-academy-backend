# Concept — Messaging: NATS + Kafka

> Hai pub/sub cross-service khác mục đích, đừng nhầm với [[cqrs-commands-events]] (in-process).

- **NATS** (`src/modules/event/nats/`) — cross-service pub/sub theo subject. Subject khai trong enum `EventName` (`src/modules/event/enums/`). ⚠️ Thêm subject mới phải làm **2 chỗ**: (1) add vào `EventName`, (2) khai trong `EventModule.register({ nats: { subjects: [...] } })` ở `apps/core/src/app.module.ts` — quên 1 → không subscribe.
- **Kafka** (`src/modules/kafka/`, `KafkaService`, dùng `kafkajs`) — kênh CDC: Debezium stream mọi insert/update/delete Postgres vào topic, [[cqrs-projection-and-cdc]] và [[elasticsearch-sync]] là 2 nhóm consumer chính. `ensureTopics()` trước khi subscribe (topic không tồn tại không làm gãy boot).
- Kafka consumer boot **best-effort** — Kafka down thì log + swallow, app vẫn chạy (không coi Kafka là hard dependency lúc bootstrap).
- Chọn cơ chế: side-effect nội bộ decouple → CQRS event bus · pub/sub giữa service/app (fan-out theo subject) → NATS · CDC/stream đổi dữ liệu Postgres → Kafka.

> Nguồn: `src/modules/event/nats/`, `src/modules/kafka/`
