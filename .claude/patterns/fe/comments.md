# Comment — ghi LÚC NÀO — STRICT

> Comment là NỢ phải trả lãi khi code đổi — chỉ ghi khi nó nói được điều CODE KHÔNG NÓI ĐƯỢC. Mọi mẫu ✅ dưới đây là code thật trên `mtp`.

## 1. Comment = WHY, KHÔNG BAO GIỜ = WHAT

- Ghi comment khi có **ràng buộc · workaround · quyết định không hiển nhiên** mà người sửa sau CẦN biết để không phá:

```tsx
// ✅ src/components/blocks/cards/GroupPressableCard/index.tsx — giải thích VÌ SAO opt-in
// Press 1–N to act without reaching for the mouse. Opt-in: the listener is
// on `window`, so a group that isn't the screen's main action would steal
// every digit the page sees.

// ✅ src/components/blocks/chips/StatusChip/index.tsx — ghi luật thiết kế đằng sau nhánh render
{/* leading status icon — DROPPED when the chip is removable (has a
    trailing cancel-X): a chip carries EITHER a status icon OR a cancel-X,
    never both. */}

// ✅ src/components/features/architecture/hooks/useSystemHealthPoll.ts — vì sao useMemo rỗng deps
// stable per-mount jitter (not re-rolled every render)
```

- ❌ CẤM comment lặp lại điều code đã nói:

```ts
// ❌ // reset the input
//    setBody("")
// ❌ // loop over the items
//    items.forEach(…)
```

## 2. KHÔNG comment lại tên đã rõ — xoá comment thừa

- Tên hàm/biến tốt LÀ tài liệu ([[naming-and-structure]]). `hasNonEmptyString`, `stripLocale`, `onSeeMore` không cần dòng `// check if string is non-empty` bên trên — thấy là XOÁ khi sửa file.
- Gặp comment mô tả sai lệch code hiện tại → sửa hoặc xoá NGAY trong cùng diff, không để "fix sau". **Comment sai còn hại hơn không có** — người sau tin comment thay vì đọc code.

## 3. JSDoc cho public API/props — nối [[props-and-types]] §2

- Mọi prop/field của interface export: 1 dòng `/** … */` nói **làm gì + default + khi nào ẩn/fallback**:

```ts
// ✅ src/components/blocks/async/AsyncContent/index.tsx
/**
 * Truthy → the {@link ErrorContent} is shown (takes priority over loading).
 * Pass the SWR `error` (only when there is no cached data to fall back to).
 */
error?: unknown

// ✅ src/components/features/architecture/hooks/useSystemHealthPoll.ts — ngữ nghĩa null ghi TẠI field
/** Live health keyed by component name, or `null` before the first resolve. */
healthByName: HealthByName | null
```

- Component/hook export có JSDoc block đầu: vai trò · compose gì · luật hành vi (mẫu: `AsyncContent` ghi rõ thứ tự ưu tiên `error → loading → empty → content`; `useSystemHealthPoll` ghi honesty-rule "null = checking, NEVER up").
- Helper/hằng module-level export cũng 1 dòng: `/** Resolve a hit's kind to its presentation, defaulting unknown kinds to content. */`.
- ❌ Prop trần không JSDoc = sai chuẩn, kể cả prop "hiển nhiên".

## 4. CẤM code comment-out để lâu

- Code chết → **XOÁ**, git giữ lịch sử. Repo hiện SẠCH (0 block comment-out) — giữ nguyên như vậy.
- ❌ `// const oldHandler = …` · ❌ `{/* <OldCard … /> */}` "để tham khảo" — muốn tham khảo thì `git log -p`.
- Ngoại lệ DUY NHẤT: giữ tạm trong CÙNG một chuỗi commit đang WIP, và phải kèm `TODO` có ngữ cảnh (xem §5) — không bao giờ merge lên `mtp` ở trạng thái đó.

## 5. TODO/FIXME phải kèm NGỮ CẢNH + điều kiện gỡ

- TODO hợp lệ = nói rõ **vì sao chưa làm + khi nào làm** — người lạ đọc hiểu được mà không cần hỏi:

```ts
// ✅ src/components/features/learn/MockInterview/MockInterviewSession/index.tsx
// "Luyện thiết kế hệ thống" is only offered for a System-Design course — its
// capstones are architecture systems, the only ones the unchanged 5-phase
// script fits.
// TODO: refine to "a module large enough for a design interview" once a
// non-SD track has a capstone that size, rather than gating by track alone.
const isDesignAvailable = courseDisplayId.includes("system-design")

// ❌ // TODO: fix this
// ❌ // FIXME later
```

- Sửa code quanh một comment → ĐỌC LẠI comment đó và cập nhật cùng diff. Comment kể chuyện code cũ (sai số nhánh, sai tên prop, sai thứ tự ưu tiên) là bug tài liệu — chặn tại review.
