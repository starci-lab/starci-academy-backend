# Props & Types — STRICT

Phạm vi: cách KHAI BÁO prop + kiểu cho component FE (`$FE_SOURCE/src/components`, branch `mtp`) — không phải design. Ground 100% từ source thật.

## 1. `WithClassNames<T>` — cách DUY NHẤT nhận className

Import từ `@/modules/types/base/class-name` (371 file `extends`):

```ts
export interface WithClassNames<T> {
    classNames?: T      // object class cho từng slot con
    className?: string  // class cho root
}
```

- **Component chỉ style root** → `WithClassNames<undefined>`:

```ts
// ✅ src/components/blocks/async/EmptyContent/index.tsx
export interface EmptyContentProps extends WithClassNames<undefined> { … }
```

- **Component có slot con cần override riêng** → truyền object shape, MỖI key phản ánh 1 slot thật:

```ts
// ✅ src/components/reuseable/TagChips/index.tsx
export interface TagChipsProps extends WithClassNames<{
    trigger: string
    content: string
}> { … }
```

- ❌ CẤM tự khai `className?: string` tay trong interface. ❌ CẤM `classNames: Record<string, string>` (phải liệt kê slot cụ thể).
- Root LUÔN merge bằng `cn(base, className)` — xem [[react-idioms]].

## 2. `type` vs `interface` cho `XxxProps` — quy ước cứng

Ranh giới repo (365 `interface … extends`, 264 `type …`):

- **`interface XxxProps extends WithClassNames<…>`** khi component có prop RIÊNG (shape object bạn tự khai). Đây là mặc định.
- **`type XxxProps = <biểu-thức>`** CHỈ khi prop = 1 biểu thức kiểu, không phải object literal bạn dựng:
  - alias thẳng: `export type BrandLogoProps = WithClassNames<undefined>` (`blocks/identity/BrandLogo`)
  - intersection: `export type GradeModelDropdownProps = WithClassNames<undefined> & { … }` (`blocks/grading/GradeModelDropdown`)
  - no-prop: `export type PracticeProblemProps = Record<string, never>` (`features/practice/PracticeProblem`)
- ❌ Đừng `type XxxProps = { … }` cho prop object thường (dùng `interface`). ❌ Đừng `interface` để bọc 1 alias/union.

## 3. JSDoc — MỌI prop, MỌI component

- **STRICT**: mỗi prop 1 dòng `/** … */` nói prop làm gì + default + khi nào ẩn/fallback. Default ghi `@default 3` (mẫu `TagChipsProps.maxVisible`). Prop hành vi phức tạp → JSDoc nhiều dòng giải thích KHI NÀO dùng.
- Component có JSDoc block trên đầu: vai trò · thuần hay container · compose gì · `@param props - {@link XxxProps}` (mẫu `Headhuntings`, `TagChips`).
- Interface phụ (item, group…) cũng JSDoc.
- ❌ Prop trần không JSDoc = sai chuẩn, kể cả prop "hiển nhiên".

## 4. Kiểu — quy ước cứng

- **`Array<T>` chứ KHÔNG `T[]`**: `tags: Array<string>`, `ReadonlyArray<OverlayKey>` cho hằng bất biến.
- **`import type`** cho mọi import chỉ-kiểu: `import type { WithClassNames } from "@/modules/types/base/class-name"`. Trộn được `import { type Key, type ReactNode } from "react"`.
- **CẤM `any`** (kể cả `as any`). Nới kiểu → generic, union, hoặc `Awaited<ReturnType<typeof fn>>`; mượn kiểu prop của primitive HeroUI: `variant?: React.ComponentProps<typeof Chip>["variant"]` (mẫu thật `TagChips`).
- Union hẹp thay boolean mù: `size?: "sm" | "md"`, `variant?: "primary" | "secondary"` — default ghi JSDoc + destructure (`size = "md"`).
- Discriminated union cho payload nhiều nhánh, field `readonly`:

```ts
// ✅ zustand/overlay/store.ts
export type PendingCartIntent =
    | { readonly type: "add"; readonly courseId: string }
    | { readonly type: "open" }
```

- Nullable từ API: `avatar?: string | null` — giữ đúng `| null` khi backend trả null, không ép về `undefined`.
- Slot render: `ReactNode` (`trailing?: ReactNode`), KHÔNG `JSX.Element`.

## 5. Container tự đọc store/SWR — KHÔNG prop-drill data/callback thừa

Component "feature/container" tự sở hữu data + orchestration; đọc thẳng SWR/Redux/zustand trong body, KHÔNG nhận list/handler qua prop từ trên xuống.

```ts
// ✅ src/components/features/careers/Headhunting/Headhuntings/index.tsx
export type HeadhuntingsProps = WithClassNames<undefined>   // KHÔNG có prop data
export const Headhuntings = ({ className }: HeadhuntingsProps) => {
    const companies = useQueryHeadhunterCompaniesSwr()       // container tự đọc
    const consultants = useAppSelector(...)                  // đọc thẳng store
    // … render <ConsultantGrid/> presentational bằng data này
}
```

- Container thường `extends WithClassNames<undefined>` (chỉ nhận `className`), rồi self-fetch.
- ❌ CẤM prop-drill: `<Headhuntings data={list} onSelect={…} refetch={…} />` khi container thừa sức tự đọc SWR/store. Callback đi xuống PRESENTATIONAL con là được; nhưng đừng bơm data/callback xuyên nhiều tầng thay vì để tầng dưới tự đọc store.
- Block THUẦN (`blocks/`) thì NGƯỢC lại: nhận mọi data qua prop, KHÔNG đụng SWR/store — ranh giới container↔block giữ sạch.
- Ghi rõ trong JSDoc component là `Container — owns data` hay presentational (mẫu `Headhuntings`).

## 6. Destructure props ngay signature, default tại chỗ

```ts
// ✅ src/components/reuseable/TagChips/index.tsx
export const TagChips = ({ tags, maxVisible = 3, variant = "soft", classNames }: TagChipsProps) => {
// ❌ (props) => { const { tags } = props … }   ·   ❌ props.tags rải rác trong body
```
