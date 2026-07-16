# Concept — Observability: Sentry + Winston/Loki

> `src/modules/winston/` (log) + `src/modules/sentry/` (`@sentry/nestjs`, error tracking) + `src/modules/logger/` (Nest logger facade) + `src/modules/mixin/` (cross-cutting helper: correlation ID, request context).

- `WinstonModule.register({ serviceName, level })` — transport `winston-loki`. `ServiceName` enum (`@modules/common`) là tag dùng filter log trên Loki (Api, Worker…).
- ⚠️ **Gotcha register 2 lần**: `apps/core/src/app.module.ts` gọi `WinstonModule.register(...)` 2 lần (Info trước, Verbose+isGlobal sau) — lần sau GHI ĐÈ lần đầu. Khi debug logger phải xét dòng cuối cùng; đừng copy pattern này khi thêm module khác.
- Exception ném qua [[abstract-exception-layer]] tự mang `code` + `metadata` ổn định → Sentry group đúng issue, Winston log structured (không phải string tự do).
- Log lỗi phải bọc: catch `unknown` → normalize thành `Error` → `logger.error(msg, stack)`, không log message rời rạc không kèm stack.
- Correlation/request context (`mixin/`) gắn vào mọi log line trong 1 request để trace xuyên nhiều service call.

> Nguồn: `src/modules/winston/`, `src/modules/sentry/`, `src/modules/logger/`, `src/modules/mixin/`
