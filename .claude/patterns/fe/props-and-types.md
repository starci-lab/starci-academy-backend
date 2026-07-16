# Props & Types — STRICT

## 1. `WithClassNames<T>` — cách DUY NHẤT nhận className

Import từ `@/modules/types/base/class-name`:

```ts
export interface WithClassNames<T> {
    classNames?: T      // object class cho từng slot con
    className?: string  // class cho root
}
```

- **Component chỉ style root** → `extends WithClassNames<undefined>`:

```ts
// ✅ blocks/identity/UserCell/index.tsx
export interface UserCellProps extends WithClassNames<undefined> {
    username: string
    …
}
```

- **Component có slot con cần override** → truyền object shape, mỗi key JSDoc:

```ts
// ✅ reuseable/TagChips/index.tsx
export interface TagChipsProps extends WithClassNames<{
    trigger: string
    content: string
}> { … }
```

- Component KHÔNG có prop nào khác ngoài className → dùng `type` alias thẳng: `export type StarCiAIBadgeProps = WithClassNames<{ icon?: string }>` (ví dụ thật).
- ❌ CẤM tự khai `className?: string` tay trong interface. ❌ CẤM `classNames: Record<string, string>`.
- Root LUÔN merge bằng `cn(base, className)` — xem [[react-idioms]] §5.

## 2. JSDoc — MỌI prop, MỌI component

- **STRICT**: mỗi prop 1 dòng `/** … */` nói prop làm gì + default + khi nào ẩn/fallback (nhìn `UserCellProps`, `TabsCardProps` làm mẫu). Prop hành vi phức tạp được viết JSDoc dài nhiều dòng giải thích KHI NÀO dùng (mẫu: `TabsCardProps.variant`).
- Component có JSDoc block trên đầu: vai trò · thuần hay container · compose gì · `@param props - {@link XxxProps}` · `@see Story:` nếu có story.
- Interface phụ (item, group…) cũng JSDoc: `/** One tab in a {@link TabsCardGroup}. */`.
- ❌ Prop trần không JSDoc = sai chuẩn, kể cả prop "hiển nhiên".

## 3. Kiểu — quy ước cứng

- **`Array<T>` chứ KHÔNG `T[]`** (302 chỗ dùng `Array<>` vs 2 file lệch): `items: Array<TabsCardItem>`, `ReadonlyArray<OverlayKey>` cho hằng bất biến.
- **`import type`** cho mọi import chỉ-kiểu: `import type { WithClassNames } from "@/modules/types/base/class-name"`. Trộn được dạng `import { type Key, type ReactNode } from "react"`.
- **CẤM `any`** (kể cả `as any`) — repo hiện ~1 chỗ legacy, không thêm. Cần nới kiểu → generic, union, hoặc `Awaited<ReturnType<typeof fn>>` (mẫu thật: `type MutateAddToCartResult = Awaited<ReturnType<typeof mutateAddToCart>>`).
- Union hẹp thay boolean mù: `size?: "sm" | "md"`, `variant?: "primary" | "secondary"` — default ghi trong JSDoc + destructure (`size = "md"`).
- Discriminated union cho payload nhiều nhánh, field `readonly`:

```ts
// ✅ zustand/overlay/store.ts
export type PendingCartIntent =
    | { readonly type: "add"; readonly courseId: string }
    | { readonly type: "open" }
```

- Nullable từ API: `avatar?: string | null` — giữ đúng `| null` khi backend trả null, không ép về `undefined`.
- Slot render: `React.ReactNode` (`trailing?: ReactNode`), KHÔNG `JSX.Element`.

## 4. Destructure props ngay signature, default tại chỗ

```ts
// ✅
export const UserCell = ({ username, displayName, size = "sm", trailing, className }: UserCellProps) => {
// ❌ (props) => { const { username } = props … }   ·   ❌ props.username rải rác trong body
```
