# Format & Imports (eslint-gated — máy chặn, đừng cãi)

Nguồn: `eslint.config.mjs` (mọi rule dưới đây mức `error`) + quét `src/` thật.

## Format cơ học — STRICT

| Rule | Giá trị | Nghĩa là |
|---|---|---|
| `indent` | 4 | 4 space, không tab |
| `quotes` | `double` | `"..."` — KHÔNG single quote |
| `semi` | `never` | KHÔNG chấm phẩy cuối dòng |
| `object-curly-newline` | `always` (ObjectExpression + ImportDeclaration) | MỌI object literal và MỌI import `{...}` đều xuống dòng từng phần |
| `array-element-newline` | `always` | mỗi phần tử array literal 1 dòng |
| `function-call-argument-newline` | `always` | mỗi argument của call 1 dòng (khi >1 arg) |

```ts
// ✅ ĐÚNG (nhìn "dọc" là đặc trưng codebase này)
import {
    Inject,
    Injectable,
} from "@nestjs/common"

return this.flashcardReviewService.review({
    userId: user.id,
    cardId: request.cardId,
    grade: request.grade,
})

// ❌ SAI — ngang 1 dòng, single quote, có semi
import { Inject, Injectable } from '@nestjs/common';
return this.svc.review({ userId, cardId });
```

- `no-explicit-any` đang OFF — nhưng đừng lạm dụng `any` trong code mới; ưu tiên type thật từ `types/`.
- `strictNullChecks` BẬT (tsconfig) — null-handle tử tế, đừng `!` bừa.

## Import order — quy ước quan sát được (không máy-gate, vẫn FORCE)

Thứ tự block trong 1 file:

1. `@nestjs/*` (common, graphql, swagger, …)
2. Third-party (typeorm, class-validator, …)
3. Path alias nội bộ: `@modules/*`, `@features/*` (KHÔNG relative `../../..` xuyên module)
4. Relative trong cùng feature: `./graphql-types`, `./x.service`, `../abstract`

Thêm:

- **`import type`** cho import chỉ-dùng-type (`import type { AbstractExceptionMetadata } from "../abstract"`) — tách riêng khỏi import value dù cùng file nguồn.
- Path alias là bắt buộc khi vượt biên module: `@modules/databases`, `@modules/env`, `@modules/exceptions` — thấy `../../../modules/...` là SAI.

## Kiểu khai báo

- **`Array<T>` chứ KHÔNG `T[]`** — codebase 303 chỗ `Array<`, 0 chỗ `T[]`. Ví dụ thật: `private readonly badges: Array<AbstractBadge>`, `Promise<Array<PresignedUrlItem>>`.
- Enum member PascalCase, dùng qua enum chứ không string literal: `Locale.En`, `Locale.Vi`, `S3Provider.Minio`, `ThrottlerConfig.Soft`.
- Interface/type export đặt trong `types/` của module (barrel `types/index.ts`), KHÔNG inline rải rác trong service.

## JSDoc — bắt buộc cho surface public

Mọi class (service/resolver/controller/exception), mọi public method, mọi field của
interface trong `types/` đều có JSDoc tiếng Anh, mô tả HÀNH VI + business intent
(xem `AchievementsService`, `DueFlashcard` làm mẫu). Comment inline `//` dùng để giải
thích "vì sao", ngắn, đặt NGAY trên dòng code liên quan.

```ts
/**
 * One due flashcard for the spaced-repetition queue, already localized.
 */
export interface DueFlashcard {
    /** The card id. */
    cardId: string
    ...
}
```
