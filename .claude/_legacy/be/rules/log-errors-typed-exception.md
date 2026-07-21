# Rule — Bọc lỗi catch vào `AbstractException`, log `logger.error(message, stack)` — không flatten `.message`

**Lỗi bắt được (catch) phải bọc vào class `extends AbstractException` rồi log Error-style (`logger.error(exception.message, exception.stack)`) — không flatten về string qua helper kiểu `describeError(error)` (mất stack).**

- `AbstractException` (`@modules/exceptions`) nhận metadata object `{ ...fields, originalError }`, gọi `super(message, "STABLE_CODE", metadata)`; có `code`, `metadata`, `getOriginalError()`, `toJSON()`. 1 domain = 1 folder `src/modules/exceptions/errors/<domain>/`, export qua `errors/index.ts`.
- I/O method throw typed exception; chỗ swallow best-effort thì log `logger.error(msg, stack)` — chỉ `.error` mang stack (`.warn` 2nd arg là context).
- **CẤM cả `new Error` LẪN Nest built-in `*Exception`** (`ForbiddenException`/`NotFoundException`/`BadRequestException`/`HttpException`…) — thiếu `code` ổn định, không map đẹp qua GraphQL interceptor. Mỗi case = 1 `AbstractException` domain-specific.

> Đã áp: `src/modules/bussiness/es-sync/es-sync-user.listener.ts`, `src/modules/bussiness/league/league-reset.service.ts` (`logger.error(exception.message, exception.stack)`); domain `errors/kafka/` (KafkaConsumerConnect/EnsureTopics/ConsumerDisconnect/CdcMessage).
> Nguồn: memory `feedback-log-errors-typed-exception.md` · `.cursor/rules/starci-academy.mdc` §Errors (extend AbstractException, không throw new Error).

[[cqrs-no-inline-aggregate]]
