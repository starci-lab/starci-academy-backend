# system-design-mastery-module-7-monitoring-and-observability

Monitoring and observability demos for System Design Mastery.

## Lessons

- `0-monitoring-and-observability`: Prometheus metrics (`prom-client`), Nest `/cats` persisted in **PostgreSQL**, `/metrics`; Compose trong `.docker/` (**Prometheus** **9090**, **Grafana** host **3001**, API host **3000** — Postgres chỉ trong network Compose)
- `1-centralized-logging-with-loki`: Winston logger shipping logs to Loki
- `2-service-discovery`: Consul HTTP API for register/discovery flows
- `3-distributed-tracing`: single **tracing-api** (**NestJS** + **OpenTelemetry SDK** → **Jaeger** OTLP); Compose maps host **`3005`** → container **`3000`** (tránh trùng **metrics-api** `:3000`)

## Quick start

Mỗi bài có **`{lesson-folder}/.docker/compose.yaml`** — **`name`** và **network Docker** trùng slug thư mục bài (Compose **tự tạo** network khi `up`, **không** cần `docker network create` trước).

Each lesson ships **`{lesson-folder}/.docker/compose.yaml`** — Compose **`name`** and Docker **network** match the lesson folder slug (Compose **creates** the network on `up`; **no** manual `docker network create`).

```bash
cd <lesson-folder>/.docker
docker compose up -d --build
```

### Lesson `0-monitoring-and-observability` (compose trong `.docker/`)

**`metrics-api/.env`** is checked in with defaults (**`POSTGRES_*`** for **`ConfigModule`**). Edit only for local **`nest start`** or different DB settings; Compose-defined runs take Postgres env from **`compose.yaml`**, not this file.

File **`metrics-api/.env`** đã có sẵn giá trị mặc định (**`POSTGRES_*`** cho **`ConfigModule`**); chỉ chỉnh khi chạy **`nest start`** local hoặc đổi DB. Chạy qua Compose thì biến Postgres lấy từ **`compose.yaml`**, không đọc file này.

Compose **tự tạo** network tên `0-monitoring-and-observability` khi `up` (không cần `docker network create`).

```bash
cd 0-monitoring-and-observability/.docker
docker compose up -d
```

## Comment & cấu trúc (strict §4)
- `compose.yaml`: header + comment từng service (VI + EN).
- `*.service.ts` / `*.controller.ts`: mọi method có JSDoc **Logic —** + **Code —** + EN Logic/Code.
- Regenerate: `node scratch/comment_system_design_modules_1_11.mjs`

