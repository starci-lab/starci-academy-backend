# Draft — Cỡ icon theo BỐ CỤC (inline cạnh chữ vs stacked trên chữ), KHÔNG chỉ theo cỡ chữ (2026-06-30)

- File/§ đích khi `/merge`: `elements/icon.md` §3 (**ĐÈ/THAY** bảng cỡ icon hiện tại — xem xung đột dưới).
- Bối cảnh: thầy chốt cỡ icon phụ thuộc icon nằm **cạnh** chữ (inline) hay **trên** chữ (stacked), không chỉ cỡ chữ. Thầy phát biểu: *"size 4 = icon trước/sau text-sm · size-3 = trước/sau text-xs · size-5 = icon phía TRÊN text-sm (flex-row→col stacked)"*.

## Luật (STRICT) — quyết định theo VỊ TRÍ icon so với text
- **Icon INLINE — trước/sau text, CÙNG HÀNG (leading/trailing)** → icon ≈ cỡ chữ (nhỏ, không lấn dòng):
  - cạnh **`text-sm` / `body-sm` (14px)** → **`size-4`** (16px).
  - cạnh **`text-xs` / `body-xs` (12px)** → **`size-3`** (12px).
- **Icon STACKED — PHÍA TRÊN text, icon trên / chữ dưới (flex-col, items-center)** → icon LỚN (điểm neo thị giác):
  - trên **`text-sm`** → **`size-5`** (20px). (Vd: bottom-tab bar — icon trên, label dưới.)
- **`<Chip>` / `HighlightChip`** = inline cạnh chữ chip (text-xs) → **`size-3`** (chip nén, icon = cỡ chữ, đừng phình pill).
- **text-base / cột đọc (16px)** → `size-6` (giữ). **Avatar-của-1-thứ** → `IconTile` (giữ).
- **Icon-only button** (không text kèm) → giữ `size-5` (icon là cả affordance, không có chữ để scale theo).
- **LEADING ROW-MARKER / NAV ICON = NGOẠI LỆ `size-5` (CHỐT 2026-06-30)** — icon trạng thái/định-danh ở ĐẦU 1 dòng list/nav (Play/Check/Circle/Lock đầu content-map row · icon `SidebarNavItem`), dù cạnh title `text-sm`, vẫn **giữ `size-5`** (thầy: *"cái này size 5 chứ chuẩn rồi"*). Lý do: leading icon = **điểm neo thị giác** của dòng (to hơn 1 nấc cho dễ quét) + sidebar collapsed thì thành icon-only (size-5 hợp). Cùng họ ngoại lệ với icon-only + stacked. → KHÔNG đổi `ContentMapRow`/`ListRow`/`SidebarNavItem`/path-row leading.

## ⚠️ XUNG ĐỘT với `elements/icon.md` §3 hiện tại (2026-06-26) — CẦN THẦY CHỐT KHI /merge
- `elements/icon.md` §3 (canon 2026-06-26, "leading = trailing theo shadcn") ghi: **text-sm inline → `size-5`** · text-xs inline → `size-4` · chip → `size-3`.
- Rule MỚI này (2026-06-30) **LẬT NGƯỢC**: text-sm inline → **`size-4`** · text-xs inline → **`size-3`** · chip → `size-3` (khớp). size-5 CHỈ còn cho **stacked trên text-sm** (+ icon-only button).
- → 2 rule mâu thuẫn ở "inline cạnh text-sm" (size-5 cũ vs size-4 mới). Rule MỚI = phát biểu gần nhất của thầy → ưu tiên; nhưng `/merge` phải **viết lại §3** (bỏ "leading=trailing size-5"), KHÔNG để 2 bảng chỏi nhau.

## ✅ NGOẠI LỆ leading row-marker = size-5 — ĐÃ CHỐT 2026-06-30 (xem §Luật trên)
- Thầy chốt giữ `size-5` cho leading row-status/nav icon (ngoại lệ như icon-only + stacked). KHÔNG đổi `ContentMapRow`/`ListRow`/`SidebarNavItem`/path-row leading.

## Nguyên tắc rút ra
- Hỏi: icon **CẠNH** chữ (cùng hàng) hay **TRÊN** chữ (xếp dọc)? Cạnh → nhỏ (≈ chữ: 4/3). Trên → to (5). Vì icon-cạnh không được lấn dòng chữ; icon-trên là điểm neo nên to để cân khối. Icon-only / leading-row-marker = ngoại lệ (giữ 5, chờ chốt).

## ĐÃ ÁP DỤNG 2026-06-30 (FE `D:\Repositories\starci-academy`, branch mtp) — scope "learn + block dùng chung"
- **Chip icon → size-3** (12 chỗ): `CourseContents` meta (Stack/Clock/Users HighlightChip) · `ChallengeView` (Trophy/Flame) · `ChallengeCard` (Flame/Trophy) · `ReadBadge` (CheckCircle).
- **Bỏ icon section-label (LabeledCard/LabeledList label)** — theo quyết định "Bỏ hết (theo rule)" [[challenge-section-labeledcard-quiet-eyebrow-icon-once]]: `ContentHeader` (Target "Bạn sẽ nắm được") · `LessonChallenges` (Puzzle) · `LessonFlashcards` (Cards) · `DueReviewHero` (Cards "Đến hạn hôm nay") · `FlashcardStatsStrip` (ChartLineUp "Tiến bộ"). + gỡ import chết.
- **Tab icon inline → size-4**: `ContentTabBar/TabTrigger` (Nội dung/Thử thách) · `LessonReader` language tab.
- **GIỮ size-5 (flag, chờ chốt)**: leading row-status icon (`CourseContents`/`PersonalProjectDashboard` path rows Play/Check/Circle/Lock) · `SidebarNavItem` icon-rail · `ChallengeSubmissionPanel` status (cạnh `text-base` không phải text-xs — agent nhầm) · icon-only button (toolbar/composer/FAB) · stacked bottom-tab · crown/skeleton trang trí.
- tsc + eslint sạch.
