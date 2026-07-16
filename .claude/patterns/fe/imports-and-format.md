# Import & Format — STRICT (lint-gated)

> Cách viết import + format của app FE chính (`starci-academy`, branch `mtp`). Format do **ESLint quyết** — KHÔNG có Prettier, KHÔNG có `.editorconfig`. Gate pre-commit chạy `eslint --max-warnings=0` trên file staged → file mày đụng vào PHẢI xanh cả rule `warn`. Mọi mẫu ✅/❌ dưới đây trích thẳng code thật trên `mtp`.

## 1. Format = ESLint, KHÔNG Prettier — 4 luật cứng

Authority DUY NHẤT là `eslint.config.mjs`. `.vscode/settings.json` đặt `defaultFormatter: "dbaeumer.vscode-eslint"` + `source.fixAll.eslint` on save. Đừng thêm Prettier, đừng cãi style — chạy `eslint --fix`.

| Rule (`eslint.config.mjs`) | Giá trị |
|---|---|
| `indent` | **4 space** (không tab) |
| `quotes` | **double** `"…"` |
| `semi` | **never** — KHÔNG semicolon |
| `linebreak-style` | off — CRLF/LF đều được, đừng đổi hàng loạt |

```ts
// ✅
const name = displayName ?? username

// ❌ semicolon + single-quote + indent 2
  const name = displayName ?? username;
```

Grounding: 5404/5404 dòng import dùng `"double"` (0 single); 0 dòng import kết bằng `;`. Đây là trạng thái thật của toàn `src/`, không phải gợi ý.

## 2. `"use client"` — dòng ĐẦU file, chỉ khi cần

- Dòng ĐẦU tuyệt đối (trước cả import), double-quote, no semicolon, rồi 1 dòng trống. 728 file client mở đầu đúng kiểu này.
- Cần khi: hook state/effect, zustand, RHF, event handler, browser API.
- KHÔNG cần cho: block thuần render props, file SWR/util thuần không hook browser.

```tsx
// ✅ src/components/blocks/cards/CourseCard/index.tsx
"use client"

import React, { useCallback, useMemo, useState } from "react"
```

```tsx
// ❌ single quote + semicolon
'use client';
```

## 3. Thứ tự import: external → `@/` → relative

Convention (KHÔNG có plugin `import/order` — không máy-enforce, phải TỰ giữ; lệch order = review trả về):

1. `"use client"` (nếu có) + dòng trống
2. `react` trước (`import React, { useMemo } from "react"`)
3. `next/*` (`next/dynamic`, `next/link`…)
4. `@heroui/react`, rồi các package ngoài còn lại (`next-intl`, `framer-motion`, `swr`, `zustand`, `zod`, `@phosphor-icons/react`…)
5. Absolute `@/…` (`@/components/…`, `@/modules/…`)
6. Relative `../` `./`

```tsx
// ✅ src/components/features/architecture/ArchitectureMap/index.tsx
import React, { useMemo } from "react"
import dynamic from "next/dynamic"
import { Chip, Skeleton, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { TabsCard } from "@/components/blocks/navigation/TabsCard"   // @/ …
import type { HealthByName } from "../hooks/useSystemHealthPoll"     // … rồi relative
import { ARCHITECTURE_MODULE_MAP } from "../modules"
import { buildLiveScene } from "./scene"
```

Blank line ngăn nhóm là TÙY (đa số file gói liền mạch; số ít tách external↔relative bằng 1 dòng trống). Nếu có thì đặt GIỮA nhóm, đừng rải lung tung.

## 4. `import type { WithClassNames }` thường TRÔI xuống cuối

Idiom THẬT (468 file): type import `WithClassNames` từ `@/modules/types/base/class-name` đặt Ở CUỐI khối import, SAU cả relative — cố ý phá order §3. Chấp nhận idiom hiện hành, đừng "sửa cho đúng order" tạo diff rác:

```tsx
// ✅ src/components/features/architecture/ArchitectureMap/index.tsx (dòng cuối khối import)
import { buildFutureScene } from "./future-scene"
import type { WithClassNames } from "@/modules/types/base/class-name"
```

## 5. `import type` cho type thuần — luôn tách ra

Import CHỈ dùng cho type → `import type { X }` (982 statement; `isolatedModules: true` trong `tsconfig` khiến điều này load-bearing cho emit/tree-shaking đúng). Value + type cùng module → tách 2 dòng.

```tsx
// ✅ src/components/blocks/async/AsyncContent/index.tsx
import React from "react"
import type { ReactNode } from "react"

import { EmptyContent } from "../EmptyContent"
import type { EmptyContentProps } from "../EmptyContent"
```

```tsx
// ❌ kéo type vào import value — ngược idiom repo
import React, { ReactNode } from "react"
```

## 6. Alias `@/` cho cross-area · relative cho sibling — CẤM deep `../../../`

- `@/*` → `./src/*` (`tsconfig.json` `paths`). Dùng `@/…` khi vượt sang area khác (3260 lần). Dùng relative `./` `../` cho file CÙNG feature-folder (940 lần).
- Deep relative `../../../` (leo ≥3 cấp) = 15 lần toàn repo → coi như CẤM, chuyển sang `@/`.
- KHÔNG ghi đuôi `.ts`/`.tsx` trong import (0 file làm vậy): `from "./scene"`, không `"./scene.ts"`.

```tsx
// ✅ src/components/features/architecture/ArchitectureRail/index.tsx
import { MetricsInline } from "../MetricsInline"                        // sibling → relative
import type { WithClassNames } from "@/modules/types/base/class-name"   // cross-area → @/
```

```tsx
// ❌ leo sâu thay vì alias
import { WithClassNames } from "../../../../modules/types/base/class-name"
```

## 7. Named import dài → multiline 4-space, trailing comma

Named list ngắn để INLINE; dài (≈4+ tên) mỗi tên 1 dòng, indent 4-space, CÓ trailing comma cuối. `cn` (heroui class-merger) theo idiom đứng CUỐI named list `@heroui/react`.

```tsx
// ✅ src/components/blocks/cards/CourseCard/index.tsx — dài → multiline + trailing comma
import {
    Button,
    Card,
    Chip,
    Typography,
    cn,
} from "@heroui/react"

// ✅ cùng file — ngắn thì inline
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
```

## 8. Import CẤM (lint bắt)

- ❌ `@gravity-ui/icons` / `@gravity-ui/*` → `no-restricted-imports` **`error`**. Dùng `@phosphor-icons/react` (đã migrate xong, 0 file còn `@gravity-ui`).
- ❌ `clsx` / `tailwind-merge` trực tiếp — **`cn` từ `@heroui/react`** là hàm DUY NHẤT merge class (0 file dùng clsx/tailwind-merge; 294 file dùng `cn`).
- starci-fe plugin `error`: `no-fractional-spacing` · `no-adjacent-chip` · `no-modal-title-classname`. `warn` (vẫn chặn gate với file staged): `no-hero-heading-class` · `no-arbitrary-token` (cấm spacing/hex arbitrary `[13px]` `[#abc]` → dùng token). Đừng phát sinh warning mới.
- jsx-a11y `warn` set (`alt-text`, `anchor-is-valid`, `click-events-have-key-events`, `label-has-associated-control`…): interactive div phải có role + key handler, icon-only button phải có accessible name.

## 9. TypeScript strict

- `strict: true`, target ES2017, `jsx: react-jsx` → **KHÔNG cần `import React` chỉ để viết JSX** (`react/react-in-jsx-scope` off). Vẫn import React khi dùng `React.ReactNode`/hooks theo mẫu repo.
- Verify sau khi sửa: `npx tsc --noEmit` + `npx eslint <files>` — cả hai phải sạch.

Liên quan: [[naming-and-structure]] · [[props-and-types]] (`WithClassNames`) · [[type-safety]].
