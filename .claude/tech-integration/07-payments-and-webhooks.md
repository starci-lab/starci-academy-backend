# 07 — Payments & Webhooks

| Tech | Module path | Webhook handler |
|------|-------------|-----------------|
| **PayOS** | `src/modules/payos/` | `src/features/api/core/http/payos/` |
| **Sepay** | `src/modules/sepay/` | `src/features/api/core/http/sepay/` |

## PayOS

- SDK: `@payos/node` (v2).
- Dùng S3 cho snapshot (PayOSModule yêu cầu S3Module).
- `payos.providers.ts` cấu hình client.
- Webhook controllers verify signature trước khi update transaction.

## Sepay

- Client: `src/modules/sepay/sepay.client.ts`.
- Webhook trong `src/features/api/core/http/sepay/`.

## Transaction tracking

Domain entity: `src/modules/databases/postgresql/primary/entities/transaction.entity.ts` + business service ở `src/modules/bussiness/transactions/`.

Payment gateway config: `payment-gateway.entity.ts`.
Pricing phase: `pricing-phase.entity.ts`.
