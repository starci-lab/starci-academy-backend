# 15 — Business domain (`src/modules/bussiness/`)

> Tên typo "bussiness" (1 chữ s thừa) **giữ nguyên** trong code. Đừng đổi.

| Sub | Path | Purpose |
|-----|------|---------|
| `user/` | `…/bussiness/user/` | User domain service (profile, settings) |
| `transactions/` | `…/bussiness/transactions/` | Wallet / payment transactions |
| `progress/` | `…/bussiness/progress/` | Course/lesson/milestone progress tracking |
| `jobs/` | `…/bussiness/jobs/` | Job domain (job board entity) |
| `guards/` | `…/bussiness/guards/` | Domain-aware guards (enrollment, ownership) |
| `pipes/` | `…/bussiness/pipes/` | Domain-aware pipes |
| `bloom-filters/` | `…/bussiness/bloom-filters/` | Bloom filter helpers (email dedup, etc.) |

## Domain layer vs Data layer

- **Data layer**: `src/modules/databases/postgresql/primary/entities/` — chỉ schema, không business rule.
- **Domain layer**: `src/modules/bussiness/` — service tổng hợp nhiều entity, áp business rule.
- **Feature layer**: `src/features/api/` — controller/resolver gọi domain service.

→ Không bypass domain layer từ controller đi thẳng vào TypeORM repository (trừ query đơn giản).

## Register

`BussinessModule.register({ isGlobal: true })` ở `apps/core/src/app.module.ts`.
