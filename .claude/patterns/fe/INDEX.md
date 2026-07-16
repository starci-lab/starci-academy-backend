# FE Code-Style — FORCE

> **Code-style FORCE cho FE, skills đọc để viết code đúng chuẩn.**
> Đây là quy ước VIẾT CODE (naming · cấu trúc file · props · import · idiom React/tsx) — KHÔNG phải design-rule (design-rule ở `.claude/fe/`). Mọi skill BUILD/APPLY (`starci-fe-layout-apply`, `starci-fe-block-apply`, `starci-fe-story-fix`…) PHẢI tuân 100% khi sinh/sửa code trong `$FE_SOURCE`.
> Tất cả rule INFER từ code THẬT trên branch `mtp` + `eslint.config.mjs` + `tsconfig.json` — không rule nào bịa.

## Files

| File | Nội dung | Khi nào đọc |
|---|---|---|
| [[naming-and-structure]] | Cây thư mục `src/` · 1-component-1-folder `index.tsx` · naming component/hook/store/story · named-export-only | TRƯỚC khi tạo file mới bất kỳ |
| [[props-and-types]] | `WithClassNames<T>` discipline · JSDoc mọi prop · `Array<T>` · `import type` · cấm `any` | Khi khai props/interface |
| [[imports-and-format]] | `"use client"` · thứ tự import · indent 4 · double-quote · no-semi · alias `@/` · cấm import | Khi mở đầu file / bị lint đỏ |
| [[react-idioms]] | Block thuần props vs Feature có data · overlay qua zustand · SWR/RHF hook pattern · i18n · `cn` · render idiom | Khi viết logic component/hook |
| [[type-safety]] | Cấm `any` → `unknown`+narrow · discriminated union · `!` phải chứng minh · `satisfies` thay `as` · `as const`+Record · boundary annotate | Khi khai kiểu / cần ép kiểu / bị TS đỏ |
| [[comments]] | Comment = WHY không WHAT · xoá comment thừa/comment-out · JSDoc public API · TODO phải kèm ngữ cảnh · cập nhật comment cùng diff | Khi viết/sửa comment hoặc review thấy comment |

## Luật tối thượng (nhớ 5 điều này là sống)

1. **1 component = 1 folder PascalCase + `index.tsx`, named export** — không file `.tsx` rời tên component, không default export (trừ 2 ngoại lệ ghi trong [[naming-and-structure]]).
2. **Props extends `WithClassNames<T>`** từ `@/modules/types/base/class-name` — không tự khai `className?: string` tay.
3. **Indent 4 · double quote · KHÔNG semicolon** (eslint `error` — vi phạm là gate pre-commit chặn).
4. **Blocks thuần props-only** (không fetch/store), **features** mới được gọi SWR hook + `useTranslations`.
5. **Cấm `any`, cấm hand-roll primitive** (Button/Modal/Tabs… phải từ `@heroui/react` hoặc block canon), **cấm `@gravity-ui/icons`** (dùng `@phosphor-icons/react` — lint `error`).
