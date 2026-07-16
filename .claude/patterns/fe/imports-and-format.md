# Imports & Format — STRICT (lint-gated)

Nguồn: `eslint.config.mjs` (flat config + `eslint-plugin-starci-fe` + `jsx-a11y`) và `tsconfig.json`. Gate pre-commit chạy `eslint --max-warnings=0` trên file staged — file mày đụng vào PHẢI xanh cả rule `warn`.

## 1. Format — eslint `error`, không thương lượng

| Rule | Giá trị |
|---|---|
| `indent` | **4 space** |
| `quotes` | **double** `"…"` |
| `semi` | **never** — KHÔNG semicolon |
| linebreak | tự do (rule off) — đừng đổi hàng loạt |

```ts
// ✅
const name = displayName ?? username

// ❌ (semi + single-quote + indent 2)
  const name = displayName ?? username;
```

## 2. `"use client"` — dòng ĐẦU file, chỉ khi cần

- Cần khi: hook state/effect, zustand, RHF, event handler, browser API. Ví dụ thật: `AdModal`, `AdBanner` (carousel timer), `zustand/*/store.ts` + `hooks.ts`, `useContactForm.ts`.
- KHÔNG cần cho: block thuần render props (`UserCell` không có), SWR hook file thuần (`useQueryActiveAdvertisementSwr.ts` không có).
- JSDoc component nên ghi LÝ DO nếu có: `"use client" for the carousel timer + video element` (mẫu AdBanner).

## 3. Thứ tự import (quan sát ổn định toàn repo)

1. `"use client"` (nếu có) + dòng trống
2. `react` (`import React, { useEffect, useState } from "react"`)
3. Thư viện ngoài: `next-intl`, `@heroui/react`, `swr`, `zustand`, `zod`, `@phosphor-icons/react`…
4. Absolute `@/…` (types trước cũng được, nhóm theo nguồn: `@/modules/…`, `@/hooks/…`, `@/components/…`)
5. Relative `./` `../` (gần nhất cuối: `../ExtendedTabs`, `./components`)

Import nhiều symbol thì xuống dòng mỗi symbol 1 dòng (mẫu `TabsCard`):

```ts
import {
    ListBox,
    Select,
    Tabs,
    cn,
} from "@heroui/react"
```

## 4. Alias & path

- **LUÔN `@/`** (`./src/*` — tsconfig paths) cho mọi import xuyên-cây. Relative CHỈ cho anh em cùng folder cha sát cạnh.
- ❌ `../../../modules/types/base/class-name` → ✅ `@/modules/types/base/class-name`.

## 5. Import CẤM (lint bắt)

- ❌ `@gravity-ui/icons` / `@gravity-ui/*` → **`error`** `no-restricted-imports`. Dùng `@phosphor-icons/react`.
- ❌ `clsx` / `tailwind-merge` trực tiếp — **`cn` từ `@heroui/react`** là hàm duy nhất merge class (0 file dùng clsx).
- starci-fe plugin đang `error`: `no-fractional-spacing` · `no-adjacent-chip` · `no-modal-title-classname`; `warn` (vẫn chặn ở gate với file staged): `no-hero-heading-class` · `no-arbitrary-token` (cấm spacing/hex arbitrary `[13px]` `[#abc]` — dùng token). Đừng viết code phát sinh warning mới.
- jsx-a11y `warn` set (alt-text, anchor-is-valid, click-events-have-key-events, label-has-associated-control…): interactive div phải có role+key handler, icon-only button phải có accessible name.

## 6. TypeScript strict

- `strict: true`, target ES2017, `jsx: react-jsx` → **KHÔNG cần `import React` chỉ để viết JSX** (`react/react-in-jsx-scope` off) — nhưng import React khi dùng `React.ReactNode`/hooks vẫn bình thường theo mẫu repo.
- Verify sau khi sửa: `npx tsc --noEmit` + `npx eslint <files>` — cả hai phải sạch.
