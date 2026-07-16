# Validation BE — DTO + class-validator ở boundary (STRICT)

Phạm vi: MỌI input HTTP/GraphQL đi qua 1 class DTO có `class-validator` decorator NGAY tại
field — input sai/out-of-range phải chết TRƯỚC khi chạm business logic. Ground từ
`src/features/api/core/**/graphql-types/request.ts` + `**/dtos/*.request.ts` (quét thật
2026-07-16). Bổ trợ [[api-surface]] (khuôn folder) + [[type-safety]] §2 (boundary typed).

## 0. Pipe đăng ký ở app, KHÔNG bịa `whitelist`

`ValidationPipe` bật global; đừng chế option lạ:

- **core** (`apps/core/src/app.module.ts`): `{ provide: APP_PIPE, useClass: ValidationPipe }`
  — plain, KHÔNG option.
- **mock / tools** (`apps/mock/src/main.ts`, `apps/tools/src/main.ts`):
  `new ValidationPipe({ transform: true })`.

Cả repo KHÔNG dùng `whitelist` / `forbidNonWhitelisted` ở đâu — đừng thêm mới trừ khi thầy
chốt. Cần coerce `string → number` ở HTTP body thì gắn `@Type(() => Number)` tại field (mục
5), đừng dựa vào `transform` toàn cục.

## 1. Mỗi field: schema-decorator TRƯỚC → comment WHY → validator

Thứ tự cố định: `@Field`/`@ApiProperty` (schema) đứng đầu, rồi 1 dòng comment nói WHY của
ràng buộc, rồi `@IsOptional` (nếu có), rồi validator format/range. Tên field thụt thêm 1 cấp.

```ts
// ✅ mẫu thật review-flashcard/graphql-types/request.ts
@Field(
    () => Int,
    {
        description: "SM-2 grade: 0=Again, 1=Hard, 2=Good, 3=Easy.",
    },
)
// reject out-of-range grades before they reach the SM-2 math
@IsInt()
@Min(0)
@Max(3)
    grade: number

// ❌ SAI — validate "chay" trong service thay vì tại field
if (typeof grade !== "number") throw ...
```

REST DTO cùng khuôn nhưng schema-decorator là `@ApiProperty`/`@ApiPropertyOptional`
(`admin/presigned-url/dtos/presigned-url.request.ts`).

## 2. Range/length = named const mirror cột DB — không magic number

Bound sống trong hằng số đặt tên, JSDoc nói nó mirror cột DB nào; đừng rải số trần trong
decorator.

```ts
// ✅ mẫu thật submit-job-posting/graphql-types/request.ts
/** Upper bound on title length, mirroring the `job_postings.title` column. */
const MAX_TITLE_LENGTH = 255
...
@IsString()
@MaxLength(MAX_TITLE_LENGTH)
    title: string

// ❌ SAI — 255 trần, đổi cột là quên đồng bộ
@MaxLength(255) title: string
```

## 3. Optional = `@IsOptional()` + vẫn validate FORMAT khi có mặt

Field optional: type `?`, `@Field({ nullable: true })`, `@IsOptional()` — nhưng NẾU có giá
trị thì vẫn phải qua validator format (URL/email/…). "Optional" là được vắng, KHÔNG phải
được sai.

```ts
// ✅ mẫu thật submit-job-posting/graphql-types/request.ts
// optional; validated as a URL when present
@IsOptional()
@IsUrl()
@MaxLength(MAX_COMPANY_URL_LENGTH)
    logoUrl?: string

// ✅ mẫu thật review-flashcard — optional uuid
@IsOptional()
@IsUUID()
    sessionId?: string | null
```

## 4. Enum input = `@IsEnum(<TsEnum>)` (GraphQL type để riêng)

Discriminator/state truyền vào validate bằng `@IsEnum` với enum TS thật (không string tự do);
`() => GraphQLType…` chỉ là mặt schema.

```ts
// ✅ mẫu thật submit-job-posting/graphql-types/request.ts
@Field(() => GraphQLTypeJobApplyMethod, { description: "…" })
// required — every posting needs a way to apply
@IsEnum(JobApplyMethod)
    applyMethod: JobApplyMethod
```

## 5. Nested & array = `@ValidateNested` + `@Type`, có trần kích thước

Object con: `@ValidateNested()` + `@Type(() => Child)`. Mảng: `@IsArray()` +
`@ArrayMaxSize(<const>)` + `@ValidateNested({ each: true })` + `@Type(() => Child)` — mỗi
phần tử tự validate, và LUÔN có trần size mirror ceiling của service.

```ts
// ✅ mẫu thật complete-flashcard-quiz-session/graphql-types/request.ts
// bounded per-card breakdown; each element is itself validated (ValidateNested + Type)
@IsArray()
@ArrayMaxSize(MAX_ANSWERS)
@ValidateNested({
    each: true,
})
@Type(() => QuizSessionAnswerRequest)
    answers: Array<QuizSessionAnswerRequest>
```

Coerce kiểu primitive ở HTTP body (query/form gửi string) = `@Type(() => Number)` trước
`@IsInt()` (mẫu thật `payos/create-payment-link/dtos/request.ts`).

## 6. Cross-field invariant KHÔNG phải việc của class-validator → handler + AbstractException

Decorator field không thấy field anh em. Ràng buộc "đúng-1-trong-2" / "A bắt buộc khi B=x"
= validate FORMAT ở DTO, còn requiredness chéo enforce trong handler bằng `AbstractException`
(xem [[exceptions]]).

```ts
// ✅ mẫu thật submit-job-posting/graphql-types/request.ts
// field-level check only validates FORMAT when present; the "required
// when applyMethod is ExternalUrl" invariant is cross-field and enforced
// in the handler
@IsOptional()
@IsUrl()
    applyUrl?: string
// → handler ném JobPostingInvalidRequestException khi vi phạm cặp companyId/newCompany

// ❌ SAI — cố nhồi ràng buộc chéo vào 1 field decorator
```

## 7. KHÔNG tin aggregate client gửi — re-derive server-side

Điểm/tổng do client tính = KHÔNG nhận. DTO chỉ chở breakdown per-item, server tự tính lại.

```ts
// ✅ mẫu thật complete-flashcard-quiz-session/graphql-types/request.ts (JSDoc)
// "The server re-derives the session's aggregate coverage from this
//  per-card breakdown — it never trusts a client-sent aggregate score."
```

## 8. Webhook ngoài (untrusted) = DTO all-optional, handler verify chữ ký

Payload webhook (PayOS/SePay/NOWPayments) để MỌI field `@IsOptional()` — probe xác nhận URL
của nhà cung cấp bỏ trống field, nên pipe KHÔNG được reject sớm; tính xác thực do handler
kiểm `signature` + `code` quyết định.

```ts
// ✅ mẫu thật payos/webhook/dtos/request.ts (JSDoc)
// "All fields are optional so the global ValidationPipe never rejects a payload
//  before the handler runs … the handler verifies the signature + code
//  authoritatively anyway (mirrors the SePay / NOWPayments webhook DTOs)."
@IsString()
@IsOptional()
    code?: string
```

Đây là NGOẠI LỆ có chủ đích cho boundary webhook — input do người dùng gửi (form/mutation)
vẫn phải validate chặt như §1–§6, không được "all-optional" để né lỗi.
