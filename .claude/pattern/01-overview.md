# 01 — Overview

## Stack
- **NestJS 11** monorepo (Nest CLI `nest-cli.json`, webpack build/app). TypeScript strict.
- **GraphQL**: Apollo Server 5 (code-first, `@nestjs/graphql`). **REST**: Express 5 + `@nestjs/swagger` + `@scalar/nestjs-api-reference`.
- **DB**: PostgreSQL (TypeORM 0.3, repository pattern) — primary store. Phụ: Qdrant (vector), Elasticsearch, Redis (node-redis + ioredis).
- **Messaging/realtime**: BullMQ (job queue), NATS (`@modules/event`), Socket.IO (realtime), `@nestjs/cqrs` event bus.
- **Auth**: Keycloak (OIDC). **AI**: LangChain + balancer (`@modules/ai`). **Payments**: PayOS, Sepay (webhook).
- **Mail**: nodemailer + Brevo SMTP + Pug templates. **Media**: ffmpeg + Bento4. **Obs**: Winston/Loki + Sentry.
- Path alias: `@modules/*` → `src/modules/*`, `@features/*` → `src/features/*`. Lint: `npm run lint` (ESLint flat `eslint.config.mjs`).

## Cây thư mục
```
starci-academy-backend/
├─ apps/                     # runnable apps (entry points) — xem 02
│  ├─ core/                  # API chính (HTTP + GraphQL + Socket.IO + processors)
│  ├─ cli/ backup/ ffmpeg-proccessor/ ml-sucvat/ scripts/
├─ src/
│  ├─ modules/               # Nest module tái sử dụng (DynamicModule) — xem 03
│  │  ├─ databases/ ai/ keycloak/ bussiness/ cqrs/ event/ cache/ s3/ mailer/
│  │  ├─ langchain/ elasticsearch/ payos/ sepay/ socketio/ throttler/ env/
│  │  ├─ exceptions/ crypto/ logger/ winston/ sentry/ api/ docs/ init/ …
│  └─ features/              # feature gắn vào app, gọi nhiều modules/ — xem 04
│     ├─ api/                # core (graphql + http) + processors
│     ├─ synchronizer/ socketio/ video-encoder/ backup/ cli/
├─ templates/                # Pug email templates
├─ scripts/                  # repo-level scripts
└─ nest-cli.json             # monorepo + entry mỗi app (root = apps/core)
```

## 3 tầng (layering)
1. **Data layer** — `src/modules/databases/postgresql/primary/entities/` — chỉ schema, không business rule.
2. **Domain layer** — `src/modules/bussiness/` — service tổng hợp nhiều entity + áp business rule (xem 08).
3. **Feature layer** — `src/features/api/` — resolver/controller gọi domain service (xem 05, 06).

⚠️ KHÔNG bypass domain layer: controller/resolver không đi thẳng vào TypeORM repo (trừ query đơn giản 1 entity).

## Điều hướng nhanh
- Muốn biết module nào đang on? → đọc `apps/core/src/app.module.ts` trước tiên.
- Thêm endpoint/data/job? → xem bảng [13-conventions.md](13-conventions.md) hoặc tech-integration `20-quick-lookup.md`.
- Luật viết code chi tiết → `.claude/skills/coding-conventions/SKILL.md`.
