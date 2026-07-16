# Concept — CQRS projection + CDC (Debezium → Kafka → recompute)

> Read-model layer: Postgres write → Debezium CDC → Kafka topic → `AbstractProjectionListener` → idempotent UPSERT recompute. Khác [[cqrs-commands-events]] (in-process side-effect, không phải read-model).

- **`AbstractProjectionListener<TTarget>`** (`src/modules/projection/abstract-projection.listener.ts`) là base chung: subclass chỉ khai `groupId` (Kafka consumer group ổn định — restart resume từ offset đã commit), `topics` (CDC topics theo dõi), `deriveTargets(message)` (map 1 CDC row → recompute target(s)), `recomputeTarget(target)` (UPSERT idempotent). Connect/shutdown do `KafkaService` lo.
- Boot **best-effort**: Kafka down ở 1 số môi trường → log Error-style + swallow, app vẫn start. Message lỗi bị log + nuốt (không throw) — delivery at-least-once nên message sau tự heal.
- Envelope Debezium: `envelope.payload ?? envelope` (row có thể nested hoặc top-level).
- 13 projection listener thật: `achievements`, `content-engagement`, `contribution`, `course-stats`, `league-cohort-points`, `progress`, `trending-contents`, `user-capstone`, `user-coding`, `user-flashcard-stats`, `user-pinned-projects`, `user-solved-challenges`, `user-stats`, `user-xp` — tất cả ở `src/modules/bussiness/projections/<name>/` (hoặc `achievements.projection.listener.ts` ngang hàng).
- Phân biệt với [[elasticsearch-sync]]: `EsSyncUserListener` KHÔNG extends base này — nó ghi vào ES (search index), không phải Postgres read-model, nên tự quản Kafka wiring riêng.

> Nguồn: `src/modules/projection/`, `src/modules/bussiness/projections/`, `src/modules/kafka/`
