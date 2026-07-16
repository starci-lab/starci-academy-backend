# BE — Import order, `@modules`/`@features` alias & format

Phạm vi: cách VIẾT import + format file `.ts` trong `src/**` của backend NestJS. Luật máy là `eslint.config.mjs` (governs `src/**`) — mọi rule dưới đây rút thẳng từ config + code thật, KHÔNG áp lý thuyết ngoài. STRICT: eslint là SSOT, code phải chạy `npm run lint` sạch.

> Lưu ý gốc: `.prettierrc` (`singleQuote`, `trailingComma:all`) CHỈ áp cho script `format` nhắm `apps/**`/`libs/**` — KHÔNG áp `src/**`. Trong `src/**` theo eslint: **double quote, no semi, indent 4**. Đừng để prettier IDE tự sửa `src/` về single-quote/semicolon.

---

## 1. Format cứng (eslint `error` — không bàn)

- Indent **4 space**; **double quote** `"..."`; **KHÔNG semicolon**; xuống dòng mỗi phần tử array/mỗi argument.

✅ ĐÚNG — `src/features/.../purchase-ai-subscription.command.ts`
```ts
export class PurchaseAiSubscriptionCommand {
    constructor(
        readonly params: ExecuteParams<PurchaseAiSubscriptionRequest>,
    ) { }
}
```

❌ SAI — 2 space + single quote + semicolon (prettier default, eslint `src/` reject)
```ts
export class PurchaseAiSubscriptionCommand {
  constructor(readonly params: ExecuteParams<PurchaseAiSubscriptionRequest>) {}
}
```

---

## 2. Named import LUÔN nổ nhiều dòng (kể cả 1 tên)

Rule `object-curly-newline` bật `ImportDeclaration: "always"` → mọi `import { … }` phải mở-đóng ngoặc trên dòng riêng, mỗi tên 1 dòng, có dấu phẩy đuôi. Import 1 tên vẫn 3 dòng — đây là idiom TRỘI của repo.

✅ ĐÚNG — `src/features/.../purchase-ai-subscription.handler.ts`
```ts
import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    ActionType,
    InjectPrimaryPostgreSQLEntityManager,
    PaymentType,
    TransactionEntity,
} from "@modules/databases"
```

❌ SAI — gom 1 dòng (eslint `object-curly-newline` báo lỗi)
```ts
import { ICQRSHandler } from "@modules/cqrs"
import { ActionType, PaymentType, TransactionEntity } from "@modules/databases"
```

**Ngoại lệ duy nhất — default import** (không có ngoặc) giữ 1 dòng:
```ts
import Stripe from "stripe"
import path from "path"
import SuperJSON from "superjson"
```

---

## 3. Type-only import dùng `import type`

Import chỉ để làm type (không giá trị runtime) viết `import type { … }` — vẫn nổ nhiều dòng như §2.

✅ ĐÚNG — `src/features/.../purchase-ai-subscription.handler.ts`
```ts
import type {
    EntityManager,
} from "typeorm"
import type {
    BuildSepayCheckoutParams,
    ResolveCheckoutParams,
    ResolveCheckoutResult,
} from "./types"
```

---

## 4. Cross-module → alias `@modules/*`, KHÔNG relative xuyên module

Path alias trong `tsconfig.json`: `@modules/*` → `src/modules/*`, `@features/*` → `src/features/*`. Import 1 module khác LUÔN qua **barrel alias** `@modules/<name>` (vd `@modules/databases`, `@modules/exceptions`, `@modules/mixin`), KHÔNG trỏ sâu vào file bên trong module đó, KHÔNG `../../../modules/...`.

✅ ĐÚNG
```ts
import {
    UserNotFoundException,
} from "@modules/exceptions"
import {
    DayjsService,
    RetryService,
} from "@modules/mixin"
```

❌ SAI — relative leo ngược ra module khác / trỏ sâu qua barrel
```ts
import { UserNotFoundException } from "../../../../modules/exceptions"
import { DayjsService } from "@modules/mixin/dayjs/dayjs.service"
```

Import type dùng chung TRONG cùng feature: dùng `@features/<path>` (vd `@features/api/core/types`) hoặc relative `./`, `../` — cả hai đều idiom repo, chọn theo khoảng cách (xem §5).

---

## 5. Thứ tự import: alias/external trước, relative `./` sau — KHÔNG cần alphabet/nhóm-trắng

Repo KHÔNG chèn dòng trống giữa các import và KHÔNG sort alphabet. Idiom thực tế: các import package/alias (`@modules`, `@features`, `@nestjs`, npm) đứng trước, **import relative `./` `../` của chính surface đứng CUỐI**. Không có dòng trống ngăn nhóm.

✅ ĐÚNG — `src/features/.../purchase-ai-subscription.service.ts` (alias → nestjs → relative cuối)
```ts
import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    Injectable,
} from "@nestjs/common"
import {
    PurchaseAiSubscriptionCommand,
} from "./purchase-ai-subscription.command"
import {
    PurchaseAiSubscriptionResponseData,
} from "./graphql-types"
```

❌ SAI — relative lên đầu, chèn dòng trống ngăn nhóm (không khớp idiom repo)
```ts
import {
    PurchaseAiSubscriptionCommand,
} from "./purchase-ai-subscription.command"

import {
    Injectable,
} from "@nestjs/common"
```

---

## 6. Barrel `index.ts` = `export * from "./x"`, mỗi file 1 dòng

Barrel gom con chỉ re-export sao (`export *`), mỗi nguồn 1 dòng, không đổi tên, không dòng trống thừa.

✅ ĐÚNG — `src/features/.../graphql-types/index.ts`
```ts
export * from "./request"
export * from "./response"
```

❌ SAI — re-export chọn tên / gom kiểu named (không phải idiom barrel ở đây)
```ts
export { PurchaseAiSubscriptionRequest } from "./request"
export { PurchaseAiSubscriptionResponseData } from "./response"
```
