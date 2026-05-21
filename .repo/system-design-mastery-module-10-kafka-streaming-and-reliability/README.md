# System Design Mastery — Module 10: Kafka Streaming & Reliability

## Tổng quan (VI)

Module lab **Kafka-style**: log phân vùng, consumer group, ordering/lag, idempotent consumer + dedup. Tuân `coding-rules.md` — `src/config/`, `.env` khớp `compose.yaml`, JSDoc song ngữ.

## Overview (EN)

Kafka-style labs: partitioned log, consumer groups, ordering/lag, idempotent consumption and deduplication. Follows `coding-rules.md` — `src/config/`, committed `.env`, bilingual JSDoc.

## Lessons

- `0-log-based-messaging-fundamentals` — `ingest-api`, `consumer-a`, `consumer-b`
- `1-ordering-partitions-and-operations` — `ordering-producer`, `consumer-fast`, `consumer-slow`
- `2-reliability-replay-and-deduplication` — `ingest-api`, `reliability-consumer`

## Scripts

```bash
node scratch/apply_coding_rules_system_design.mjs 10
node scratch/apply_module_10_kafka_rules.mjs
```

## Comment & cấu trúc (strict §4)
- `compose.yaml`: header + comment từng service (VI + EN).
- `*.service.ts` / `*.controller.ts`: mọi method có JSDoc **Logic —** + **Code —** + EN Logic/Code.
- Regenerate: `node scratch/comment_system_design_modules_1_11.mjs`

