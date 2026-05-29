# 12 — Exceptions & Error Handling

## STRICT: KHÔNG `throw new Error("...")`
Mọi giá trị ném trong `src/` + `apps/` phải extend `AbstractException` (`@modules/exceptions`), mang `code` ổn định + `metadata` có cấu trúc → Sentry/log group được, caller `instanceof`-match được.

```ts
// ❌
throw new Error(`Unsupported provider: ${provider}`)

// ✅
throw new UnsupportedAiProviderException({ provider })
```

### Thêm exception mới
1. `src/modules/exceptions/errors/<domain>/<kebab-name>.ts`:
   - `interface XMetadata extends AbstractExceptionMetadata { ... }`
   - class `extends AbstractException`, truyền `code` ổn định vào `super(...)`.
2. Export ở `src/modules/exceptions/errors/<domain>/index.ts`.
3. `import { XException } from "@modules/exceptions"` rồi throw tại call site.

Ngoại lệ raw `new Error()` được phép: **chỉ** trong helper normalize lỗi (biến `unknown` đã catch thành `Error`).

## Error normalization — guard tại boundary
Normalize `unknown` **một lần** tại catch site, KHÔNG guard ở mọi consumer:
```ts
let lastError: Error | undefined
try {
    await something()
} catch (err) {
    lastError = err instanceof Error ? err : new Error(String(err))
}
throw new MyException({ originalError: lastError })
```
Nhiều catch site trong 1 service → tách helper `normalizeError(err: unknown): Error`.

## STRICT: không `let` chưa khởi tạo cho kết quả try/catch
`let x` (không init) gán trong `try`, đọc sau `catch` → `x` thành `T | undefined`. Refactor thành helper trả `T | null` rồi `if (!x) {...}`, hoặc gộp logic vào cùng `try`. Biến phải **luôn có giá trị tại điểm dùng** (không `!`, không check `undefined`).

## GraphQL / REST surfacing
- GraphQL: lỗi được map vào response wrapper `{ success, message, error, data }` qua interceptor (xem 05). `@GraphQLSuccessMessage` set message khi thành công.
- Sentry instrument ở `@modules/sentry`; log qua Winston (`@modules/winston`).
