# Type-safety BE — STRICT (NestJS/TypeScript)

Nguồn: `tsconfig.json` (`strictNullChecks: true`, `noImplicitAny: false`) + `eslint.config.mjs`
(`no-explicit-any: off`) + quét `src/` thật (2026-07-16). Máy KHÔNG chặn `any`/`as` —
nhưng codebase sạch gần tuyệt đối, và giữ sạch là LUẬT, không phải gợi ý.

## 1. CẤM `any` — dùng `unknown` + narrow

`src/` production gần như sạch `any`: chỉ còn `argsExtractor` (`src/modules/cache/types/graphql-cache.ts`,
`(request: any, user: any) => Array<any>`) và `any[]` trong tuple raw-SQL của `process-video`
(`src/modules/bullmq/types/payloads/process-video.ts`) — nợ cũ, ĐỪNG thêm chỗ mới. Input không biết kiểu
(catch, payload ngoài) = `unknown`, rồi narrow bằng `typeof`/`instanceof`/duck-typing:

```ts
// ✅ mẫu thật src/modules/ai/ping/utils/to-error-message.ts
export const toPingErrorMessage = (err: unknown): string => {
    const base = err instanceof Error ? err.message : String(err)
    ...
}
const extractResponseDetail = (err: unknown): string | null => {
    if (typeof err !== "object" || err === null) {
        return null
    }
    const data = (err as { response?: { data?: unknown } }).response?.data
    ...
}

// ❌ SAI — nuốt hết type-check downstream
const handle = (err: any) => err.response.data.error.message
```

Narrow từng bước như trên: cast sang shape TỐI THIỂU có field `?: unknown`, check `typeof`
trước khi dùng — không cast thẳng sang shape đầy đủ.

## 2. Boundary = DTO + class-validator, KHÔNG tin input

Mọi input HTTP/GraphQL đi qua class DTO có decorator validate NGAY tại field — out-of-range
phải chết TRƯỚC khi chạm business logic (xem thêm [[api-surface]]):

```ts
// ✅ mẫu thật review-flashcard/graphql-types/request.ts
// reject out-of-range grades before they reach the SM-2 math
@IsInt()
@Min(0)
@Max(3)
    grade: number

// ❌ SAI — validate "chay" trong service, hoặc tệ hơn: không validate
if (typeof grade !== "number") throw ...
```

Chiều ra cũng typed: resolver trả `Promise<<Op>Data>` (class `@ObjectType`), REST trả DTO
response có `@ApiProperty`. Queue payload cũng là boundary — xem mục 6 (`satisfies`).

## 3. Enum cho state & kind — mỗi member có JSDoc

State/kind KHÔNG là string literal rải rác — là `enum` sống trong `enums/` của module,
member PascalCase, value string, MỖI member 1 dòng JSDoc nói hệ quả:

```ts
// ✅ mẫu thật src/modules/ai/balancer/enums/ai-error-kind.ts
export enum AiErrorKind {
    /** Invalid / revoked / unauthorized key (401/403) → hard-disable the key. */
    Auth = "auth",
    /** Rate limit / quota (429) → short cooldown, key auto-recovers. */
    RateLimit = "rateLimit",
    ...
}

// ❌ SAI — magic string, không exhaustive-check được
if (error.kind === "rate_limit") ...
```

Discriminant cục bộ (không đáng lập enum) → literal + `as const` để giữ narrow:
`axis: "phase" as const` (mẫu thật `user-mock-interview-course-stats-projection.service.ts`).

## 4. Return type service TƯỜNG MINH — type sống trong `types/`

Public method của service LUÔN khai `Promise<XResult>` tường minh; interface params/result
đặt trong `types/` của module (barrel), KHÔNG inline trong service, KHÔNG để infer:

```ts
// ✅ mẫu thật flashcard-review.service.ts
async listDue(
    { userId, courseId, limit, locale }: ListDueFlashcardsParams,
): Promise<DueFlashcardsResult> {

// ❌ SAI — caller phải đoán shape, đổi ruột là gãy ngầm
async listDue(params) { return { count, cards } }
```

## 5. `strictNullChecks` BẬT — cấm `!` bừa

Cả `src/` chỉ có 13 chỗ `!` (đa số AWS SDK trả optional dù logic đảm bảo có). Mặc định:

- `??` cho default: `exception.httpStatus ?? HttpStatus.INTERNAL_SERVER_ERROR` (mẫu thật filter).
- `?.` cho đường đi optional: `(err as {...}).response?.data`.
- `!` CHỈ khi invariant do chính query/API đảm bảo mà type không diễn tả được — kèm comment
  1 dòng nói invariant đó. Không giải thích được bằng 1 dòng → refactor cho type tự nói.

```ts
// ❌ SAI — che null bug thay vì xử lý
const enrollment = await repo.findOne(...)
return enrollment!.id
```

## 6. CẤM `as X` bừa — ưu tiên `satisfies` + type guard

- **`satisfies`** khi cần CHECK shape mà không đổi type — chuẩn nhà cho queue payload:

```ts
// ✅ mẫu thật send-mail.service.ts — params bị check khớp contract SendMailPayload tại compile
payload: this.superJson.stringify(params satisfies SendMailPayload),
```

- **Type guard / predicate** thay cho cast sau filter:

```ts
// ✅ mẫu thật flashcard-review.service.ts
.filter((card): card is FlashcardCardEntity => Boolean(card))
// ✅ mẫu thật init-config-parser.service.ts
private isPlainObject(value: unknown): value is Record<string, unknown> {
```

- `as X` được phép khi library typing bắt buộc — kèm lý do rõ (comment hoặc hiển nhiên từ
  ngữ cảnh 1 dòng): `ms((...) as ms.StringValue)` (mẫu thật `parse-env.ts`).
- **`as unknown as` = CẤM trong production** — hiện chỉ tồn tại trong `*.spec.ts` (mock),
  giữ nguyên ranh giới đó. Thấy `as unknown as` ngoài spec là code SAI.
- Ép kiểu kết quả query/entity phải có lý do + comment; mặc định là dùng `select`/relations
  đúng để TypeORM trả đúng type.

## 7. Generics cho helper/khuôn tái dùng — `as const` cho bảng literal

```ts
// ✅ mẫu thật parse-env.ts — caller quyết định T, không any
export const parseEnvJson = <T>({ key, defaultValue }: ParseEnvJsonParams): T => ...

// ✅ mẫu thật — generic của framework để type hoá boundary, không cast
const response = ctx.getResponse<Response>()          // express Response
if (host.getType<string>() === "graphql") ...

// ✅ mẫu thật points-config.ts / routes.ts — bảng hằng số khoá bằng as const
} as const
```

## 8. Typed config — KHÔNG đọc `process.env` rải

`process.env` CHỈ được chạm trong `src/modules/env/utils/parse-env.ts`. Mọi consumer đọc
cây typed `envConfig().<domain>.<key>` (mỗi field có JSDoc + default, xem `env/config.ts`):

```ts
// ✅ mẫu thật sepay.providers.ts
} = envConfig().services.api.sepay

// ❌ SAI — string chết, không default, không type
const key = process.env.SEPAY_API_KEY
```

Thêm config mới = thêm field vào `envConfig()` qua `parseEnv*` helper — không bao giờ
`process.env.X` trong service/resolver/worker. (Ngoại lệ duy nhất: `*.spec.ts` set env để test
chính parse layer, ví dụ `judge0.service.spec.ts`.)
