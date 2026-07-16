# React hooks & render idioms — STRICT

Phạm vi: luật VIẾT hook + effect + memo/callback + đặt tên handler + giữ render sạch trong `src/components/**` và `src/hooks/**`. Ground 100% từ code thật; ví dụ trích thẳng, đường dẫn tương đối `src/…`.

## 1. Hook chỉ ở top-level, không gọi có điều kiện

- Mọi `use*` gọi thẳng đầu component, KHÔNG trong `if`/loop/callback. Cần cắt render sớm thì gọi hết hook TRƯỚC rồi mới `return null` (guard sau hook, không trước).
- ✅ `src/components/blocks/async/InfiniteScrollSentinel/index.tsx` — `useRef` + `useEffect` ở top-level, guard `if (!node || disabled) return` nằm TRONG effect chứ không chặn hook.
- ✅ `src/components/blocks/layout/SocketConnectionStatus/index.tsx` — 4 `useEffect` xếp thẳng hàng đầu component, guard `if (phase !== "recovered") return` bên trong từng effect.
- ❌ `if (!data) return null` đặt TRÊN một `useMemo`/`useEffect` phía dưới → đổi số lượng hook giữa các render.

## 2. useEffect: deps hand-managed, `exhaustive-deps` OFF

- `react-hooks/exhaustive-deps` = `"off"` (`eslint.config.mjs`). Deps là TRÁCH NHIỆM tay — liệt kê đúng tín hiệu cần chạy lại, cố ý loại cái không muốn re-run. Lint KHÔNG bắt hộ.
- Callback thay đổi mỗi render mà KHÔNG được vào deps → giữ qua ref "latest", deps chỉ chứa tín hiệu tái-subscribe thật:
```tsx
// src/components/blocks/async/InfiniteScrollSentinel/index.tsx
const onReachRef = React.useRef(onReach)
onReachRef.current = onReach          // cập nhật mỗi render, KHÔNG re-subscribe observer
React.useEffect(() => {
    …
    observer.observe(node)
    return () => observer.disconnect()
}, [disabled, root])                  // cố ý KHÔNG có onReach
```
- ❌ nhét `onReach` vào deps → observer dựng lại mỗi render; ❌ để deps trống khi effect đọc prop/state đang đổi.

## 3. useEffect PHẢI cleanup mọi thứ tự đăng ký

- Timer/observer/subscription/toast tồn dư → return cleanup. Đây là idiom cứng của repo.
- ✅ timer: `const handle = setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS); return () => clearTimeout(handle)` (`src/components/features/course/CourseCatalog/index.tsx`).
- ✅ observer: `return () => observer.disconnect()` (`InfiniteScrollSentinel`).
- ✅ resource ngoài queue: `return () => { if (downToastKey.current) toast.close(downToastKey.current) }` + effect unmount riêng dọn mọi timer (`SocketConnectionStatus`).
- ❌ `setTimeout`/`setInterval`/`addEventListener`/`new IntersectionObserver` mà không có cleanup.

## 4. Effect chạy trên `window`/storage phải guard SSR + try/catch

- Truy cập `window`/`sessionStorage`/`localStorage` trong effect: guard môi trường, bọc `try/catch`, nuốt lỗi im lặng (private mode).
- ✅ `if (typeof window === "undefined") return` rồi `try { sessionStorage.getItem(…) } catch { /* ignore storage errors */ }` (`src/hooks/effects/useSessionSuperseded.ts`).
- ✅ `try { window.localStorage.setItem(…) } catch { /* storage unavailable (private mode) */ }` (`CourseCatalog`).
- ❌ đọc `localStorage` thẳng trong thân component (chạy lúc SSR/hydrate) hoặc không try/catch.

## 5. Tách effect theo mối quan tâm, nối chuỗi qua state

- Mỗi `useEffect` MỘT việc, deps riêng; luồng nhiều bước = chuỗi effect nối bằng state trung gian, KHÔNG gộp 1 effect khổng lồ.
- ✅ `CourseCatalog`: effect debounce `[query]→setDebouncedQuery` → effect reset trang `[debouncedQuery]→setPageNumber(0)` → SWR đọc `debouncedQuery`.
- ✅ `SocketConnectionStatus`: effect "react tín hiệu socket" `[anyDown]`, effect "hết giờ recovered→hidden" `[phase]`, effect "đẩy toast theo phase" `[phase, t]`, effect "dọn khi unmount" `[]` — bốn việc bốn effect.

## 6. useMemo/useCallback: dùng khi CÓ lý do, không rải bừa

- `useMemo` cho phép tính phái sinh không tầm thường (sort/filter/split), deps = nguồn dữ liệu thật. Giá trị rẻ (đếm, cộng, so sánh) tính THẲNG trong thân, KHÔNG memo.
- ✅ memo cần: `const list = useMemo(() => [...data].sort((l, r) => rankOf(l.displayId) - rankOf(r.displayId)), [payload])` (`CourseCatalog`).
- ✅ để THẲNG: `const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE))`, `const currentPage = pageNumber + 1` — cùng file, KHÔNG memo.
- `useCallback` cho handler truyền xuống child/effect hoặc bind vào ref; deps đúng.
- ✅ `const onChangeView = useCallback((next) => { setView(next); … }, [])`; `const selectAt = useCallback((index) => {…}, [items, onSelectSuggestion])` (`SearchInput`).
- ❌ bọc `useMemo` cho `a + b`; ❌ `useCallback` cho handler chỉ dùng inline 1 chỗ (JSX `onChange`) mà không truyền đi đâu.

## 7. Đặt tên handler = `onXxx` (idiom trội), không `handleXxx`

- Repo trội hẳn `on*` (~354 chỗ / 175 file) so với `handle*` (~25 chỗ / 14 file) cho handler nội bộ. VIẾT MỚI theo `onXxx`.
- ✅ `onChangeView`, `onNavigateHome` (`CourseCatalog`); `onKeyDown`, `onMouseDown` (`SearchInput`).
- ⚠️ `handleXxx` còn tồn tại (vd `handleDiagramChange` trong `src/components/features/learn/MockInterview/MockInterviewSession/index.tsx`) nhưng là số ít — đừng nhân bản, dùng `onXxx`.
- Prop callback ra ngoài = `onXxx` bắt buộc: `onReach`, `onValueChange`, `onSelectSuggestion` (`InfiniteScrollSentinel`, `SearchInput`).

## 8. Không logic nặng trong thân render / trong JSX

- Thân component (đường chạy mỗi render) chỉ derive rẻ + memo hoá cái đắt. Sort/filter/parse/regex → `useMemo`. KHÔNG dựng mảng lớn hay tính vòng lặp thẳng trong render.
- ✅ split-để-bôi-đậm nằm trong memo: `const segments = useMemo(() => { … indexOf … slice … }, [suggestion.label, query])` (`SearchInput`), JSX chỉ đọc `segments.before/match/after`.
- Side-effect (fetch/storage/toast/timer) TUYỆT ĐỐI không đặt trong render — chỉ trong `useEffect` hoặc handler.
- ❌ `<ul>{items.filter(...).sort(...).map(...)}</ul>` inline; ❌ `localStorage.getItem(...)` hay `toast(...)` giữa thân render.

## 9. Comment WHY cho mỗi effect/callback không hiển nhiên

- Repo coi 1 dòng `//` giải thích LÝ DO đứng ngay trên effect/callback là bắt buộc khi hành vi không tự-rõ (vì sao loại deps, vì sao mousedown thay click, vì sao grace timer).
- ✅ `// keep the latest callback without re-subscribing the observer each render`; `// mousedown (not click) so it runs before the input blur closes the dropdown`; `// debounce the search input before it reaches the backend`.
- ❌ effect có deps "lạ" (thiếu biến effect đọc) mà không 1 dòng giải thích tại sao cố ý.
