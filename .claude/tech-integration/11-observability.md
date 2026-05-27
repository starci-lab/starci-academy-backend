# 11 — Observability

| Tech | Module path | Ghi chú |
|------|-------------|---------|
| **Winston + Loki** | `src/modules/winston/` | `WinstonModule.register({ serviceName, level })`. Transport: `winston-loki`. |
| **Logger module** | `src/modules/logger/` | Nest logger facade. |
| **Sentry** | `src/modules/sentry/` | `@sentry/nestjs` integration, global. |
| **Mixin** | `src/modules/mixin/` | Cross-cutting helpers (correlation IDs, request context). |

## ServiceName

`src/modules/common/` định nghĩa enum `ServiceName` (Api, Worker, …). Đây là tag dùng cho log filtering trên Loki.

## Lưu ý

WinstonModule được register **2 lần** trong `apps/core/src/app.module.ts` (Info + Verbose isGlobal) — lần thứ 2 ghi đè. Xem [21-gotchas.md](21-gotchas.md).
