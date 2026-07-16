# Exceptions — LUÔN AbstractException (luật sắt ⭐)

Nguồn: `src/modules/exceptions/` (errors + filters) — hạ tầng đã DONE trên `mtp`
(field `httpStatus?` + global `APP_FILTER` `AbstractExceptionHttpFilter` + GraphQL `formatError`).

## LUẬT

1. **CẤM `throw new Error(...)`** — `src/` hiện có **0** chỗ; giữ nguyên con số đó.
2. **CẤM Nest built-in** (`BadRequestException`, `NotFoundException`, `UnauthorizedException`, `ForbiddenException`, …) trong `src/modules/**` + `src/features/api/**` — kể cả khi edit BE qua skill FE (`starci-fe-layout-apply`…). Nợ cũ chỉ còn ở `features/mock` (demo dạy) + `features/tools` — đừng thêm mới.
3. Mọi lỗi domain = **1 class riêng extends `AbstractException`**, sống tại `src/modules/exceptions/errors/<domain>/<ten-loi>.ts`, export qua `index.ts` của domain đó (+ domain mới thì thêm vào `errors/index.ts`).
4. Cần status HTTP khác 500 (guard/auth: 401/403/404/400) → truyền `HttpStatus.*` làm **arg thứ 4** của `super`. Domain exception thường KHÔNG set → filter mặc định 500. ĐỪNG set httpStatus tuỳ hứng cho lỗi business.

## Anatomy 1 exception file — copy khuôn này

```ts
// src/modules/exceptions/errors/flashcard/flashcard-card-not-found.ts — mẫu thật
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for {@link FlashcardCardNotFoundException}. */
export interface FlashcardCardNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    /** Id of the flashcard card that was looked up. */
    flashcardCardId: string
}

/**
 * The requested flashcard card does not exist in the primary database.
 */
export class FlashcardCardNotFoundException extends AbstractException {
    constructor(
        {
            flashcardCardId,
            originalError,
        }: FlashcardCardNotFoundExceptionMetadata,
    ) {
        super(
            `Flashcard card not found: ${flashcardCardId}`,
            "FLASHCARD_CARD_NOT_FOUND_EXCEPTION",
            {
                flashcardCardId,
                originalError,
            },
        )
    }
}
```

Bắt buộc đủ 4 phần:

- **Metadata interface** `extends AbstractExceptionMetadata` (kế thừa `originalError?`), mỗi field có JSDoc. Không có field riêng → `export type XMetadata = AbstractExceptionMetadata` (xem `admin-api-key-required.ts`).
- **Constructor nhận 1 object metadata** (destructure), KHÔNG positional args.
- **Code** = SCREAMING_SNAKE, suffix `_EXCEPTION`, khớp tên class.
- **Message** tiếng Anh, human-readable, nhúng id liên quan.

Guard/auth variant (arg 4):

```ts
super(
    "x-admin-api-key header is required.",
    "ADMIN_API_KEY_REQUIRED_EXCEPTION",
    {
        originalError,
    },
    HttpStatus.UNAUTHORIZED,
)
```

## Throw tại call-site

```ts
// ✅ ĐÚNG
throw new FlashcardCardNotFoundException({
    flashcardCardId: cardId,
})

// wrap lỗi hạ tầng: giữ lỗi gốc trong metadata (mẫu thật es-sync-user.listener.ts)
const exception = new KafkaCdcMessageException({
    topic,
    originalError: error instanceof Error ? error : undefined,
})

// ❌ SAI — cả 3 dạng
throw new Error(`Card not found: ${cardId}`)
throw new NotFoundException("Card not found")
throw new AbstractException("Card not found", "CARD_NOT_FOUND", {}) // không throw base trực tiếp — luôn subclass
```

## Vì sao (để đừng "tiện tay" phá)

- REST: `AbstractExceptionHttpFilter` (global `APP_FILTER`) map `httpStatus` → response; GraphQL đi qua Apollo `formatError` riêng — filter SKIP context graphql (đã có comment giải thích double-send crash trong `abstract-exception-http.filter.ts`).
- `code` + `metadata` serialize được (`toJSON`/`fromJSON`) — dùng cho job/kafka relay lỗi qua process khác. `new Error` mất hết cấu trúc đó.
