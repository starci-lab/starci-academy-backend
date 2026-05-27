# 17 — Environment & Config

| Concern | Path |
|---------|------|
| **Env loader** | `src/modules/env/` — `EnvModule.forRoot()` ở `apps/core/src/app.module.ts` |
| **Common constants** | `src/modules/common/` — `ServiceName` enum, shared types |
| **Locale / i18n** | `src/modules/locale/` |
| **Exceptions** | `src/modules/exceptions/` — custom HttpException classes |
| **Docs** | `src/modules/docs/` |

## Env

- `.env` không commit. Mỗi app có thể đọc env riêng qua `EnvModule`.
- `EnvModule.forRoot()` schema-validate biến môi trường khi boot.

## i18n

- `src/modules/locale/` cung cấp locale helper.
- Translation entity pattern: `<entity>-translation.entity.ts` (xem [03-databases-and-storage.md](03-databases-and-storage.md)).

## Exceptions

Tất cả custom exception extend Nest `HttpException`. Throw từ service/controller → global filter format response.
