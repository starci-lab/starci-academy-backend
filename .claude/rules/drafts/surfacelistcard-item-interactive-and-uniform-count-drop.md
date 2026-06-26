# Draft — `SurfaceListCardItem` interactive (free-form clickable row) + count "đồng đều" = low-signal → drop cho rank/order (2026-06-25)

- File/§ đích khi `/merge`: `elements/card.md` §3c (SurfaceListCard) + `elements/list.md` + liên quan [[whitespace-over-dividers]] · [[progress-block-growing-quantity-headline-not-vanity-strip]] · [[item-card-meta-inside-bounded-object]] · [[concepts/card]].
- Bối cảnh: dashboard "Nổi bật tuần này" (explore) + "Khóa học của tôi" (courses) → render dạng LabeledCard + list (Skin A: `LabeledCard frameless` + `SurfaceListCard`).

## Luật 1 (STRICT) — Row free-form BẤM ĐƯỢC = `SurfaceListCardItem` interactive, KHÔNG ép vào `SurfaceListCardRow`
- **`SurfaceListCardRow` có slot CỐ ĐỊNH (leading/title/subtitle/meta/trailing) + truncate 1 dòng** → KHÔNG chứa được body giàu (vd progress `SegmentBar`, nhiều dòng). Khi row cần body bespoke MÀ vẫn whole-row click → dùng **`SurfaceListCardItem`** (free-form) ở dạng **interactive**: thêm prop `onPress`/`href`/`isDisabled` → render `<button>`/`<a>` với da surface-card (`hover:bg-default` + focus ring + cursor + inset separator), `last:after:hidden`. Static (không prop) giữ nguyên `<div>` (backward-compat).
- Phân vai: `SurfaceListCardRow` = nhãn ngắn 1 dòng (name/meta); `SurfaceListCardItem` interactive = row có layout riêng (course + bar, changelog click được…). Cả hai sống trong 1 `SurfaceListCard` (1 surface bounded, KHÔNG N card — [[item-card-meta-inside-bounded-object]]).
- **Whole-row click thay title-only:** khi cả dòng điều hướng tới 1 entity, đặt navigation ở dòng (onPress), bỏ link-chỉ-ở-title. Tách logic resolve+navigate (vd `EntityToken` globalId→resolveRoute→push) thành **hook dùng chung** (`useResolveRouteNavigation`) để cả token lẫn whole-row item gọi; 1 hook / 1 component top-level (KHÔNG gọi hook trong `.map` → mỗi row là 1 component con).

## Luật 2 (STRICT) — `.card` HeroUI = `overflow-visible` → list-card phải tự clip
- `@heroui/styles .card` bake `overflow-visible` + `border-radius`. → **KHÔNG** dùng `LabeledCard flushContent` + bare rows để làm "list trong card" (hover nền row chạm mép sẽ tràn góc bo). Dùng **`LabeledCard frameless` + `SurfaceListCard`** (block này bake `overflow-hidden rounded-3xl border bg-surface` → tự clip). frameless tránh luôn card-in-card ([[concepts/card]]).
- Empty/error của section frameless: AsyncContent render EmptyContent/ErrorContent centered (chấp nhận); skeleton + content bọc `SurfaceListCard` (bordered, mirror loaded).

## Luật 3 (STRICT) — Count "đồng đều / low-signal" → DROP, để rank/order nói thay
- Field count hiển thị per-row mà hiện **toàn bằng nhau** (vd readCount = "1" mọi bài, early-stage) = **nhiễu vô nghĩa** → **bỏ**, để **rank № (suy từ order)** mang nghĩa "most X". Bật lại count làm `meta` khi giá trị **phân hoá** (24/12/5…). Cùng tinh thần [[whitespace-over-dividers]] (cắt count thừa) + [[progress-block-growing-quantity-headline-not-vanity-strip]] (số nhiễu thì gate/cắt). Rank top-3 `text-accent`, còn lại `text-muted` ([[highlight-accent-as-detail-not-block-fill]]); rank `aria-hidden` (DOM order đã mang nghĩa).

## Luật 4 (STRICT) — Row HOVER theo VAI: link list → underline title (KHÔNG fill cả dòng); card row → fill
- **Hàng mà TITLE chính là cái link** (most-read list, danh sách tiêu đề điều hướng) → hover **underline title**, **KHÔNG tô nền cả dòng** ([[interactive-needs-hover]]: row-as-link → underline nhãn, không đổi màu khối). Phần read-only cạnh (rank №) giữ màu, không đổi khi hover.
- **Hàng là BOUNDED OBJECT** (course + progress bar, payment method…) → hover **fill `bg-default`** cả dòng (đọc ra "row chọn được"). Fill hợp cho row giàu/card-like, KHÔNG hợp cho list link thuần text.
- **Block hỗ trợ cả hai:** `SurfaceListCardRow` thêm prop **`hover?: "fill" | "underline"`** (default `"fill"`). `"underline"` = row thành hover-`group`, bỏ `hover:bg-default`, title `group-hover:underline`. Whole-row vẫn click được + `cursor-pointer` (target lớn) nhưng đọc như link. Trending dùng `hover="underline"`; courses giữ `"fill"`; Foundations (default) không đổi.
- → 2 hover khác nhau trên cùng 1 dashboard là ĐÚNG (khác semantic: link vs card), không phải thiếu nhất quán.

## ĐÃ ÁP DỤNG 2026-06-25 (FE)
- `SurfaceListCard` block: `SurfaceListCardItem` thêm `onPress`/`href`/`isDisabled` (interactive variant).
- `EntityToken`: tách `useResolveRouteNavigation` hook (behavior-preserving), token + rows dùng chung.
- Trending: `LabeledCard frameless` + `SurfaceListCard` + `TrendingRow` (`SurfaceListCardRow`, rank leading, drop count). Courses: `CoursesTab` LabeledCard → `frameless`; `MyCoursesProgress` → `SurfaceListCard` + `CourseRow` (`SurfaceListCardItem` interactive: IconTile + title + completionPercent + SegmentBar + caret). Skeletons mirror. tsc/eslint sạch.
- Reconcile: brainstorm cũ `TrendingContents/UX-BRAINSTORM.md` (Hướng B = ListRow, drop count) bị **supersede** về SKIN (→ SurfaceListCard) nhưng GIỮ quyết định drop count + rank. Doc tổng: `dashboard/DASHBOARD-LIST-CARDS-BRAINSTORM.md`.
