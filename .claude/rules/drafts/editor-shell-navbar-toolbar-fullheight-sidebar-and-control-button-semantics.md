# Draft — Editor-shell (trang "làm-1-tài-liệu"): toolbar = navbar bottom-layer · sidebar full-height flush · route full-bleed; control-button semantics (reorder=tertiary · delete=danger); quick-access label; sidebar AI model picker; warning-CTA funnel (2026-07-06)

> ✅ ĐÃ PROMOTE vào canonical 2026-07-06: Luật 1 → [[elements/sidebar]] §8 (editor-shell) · Luật 2 → [[elements/button]] §4 (reorder=tertiary/delete=danger-soft) + §5 (warning inline `--button-bg`) · Luật 3 → [[elements/label]] §1b (action bản-chất-khác gắn Label riêng) · Luật 4 → [[elements/alert]] §5 (nút CTA theo status + bỏ Indicator compact). Draft giữ làm hồ sơ "áp đầu" + chi tiết đầy đủ; canonical là nguồn tra.

- File/§ đích khi `/merge`: `elements/sidebar.md` (§ editor-shell) + `elements/button.md` (§ control-button semantics) + `elements/label.md` (quick-access) + liên quan [[navbar-bottomlayer-system]] · [[learn-content-padding-shell-p6]] · [[layout-must-funnel-to-courses-and-cover-full-data-state-matrix]] · [[elements/alert]] · [[picker-popover-pin-default-search-below-scroll-results]] (model picker) · [[when-rail]].
- Bối cảnh: CV block editor (`/profile/cv/[id]`). Thầy chốt qua nhiều vòng theo reference = learn shell.

## Luật 1 (STRICT) — Trang EDITOR "làm-1-tài-liệu" (CV builder, doc editor) = APP-SHELL full-bleed, KHÔNG bọc content-column
- **Trang editor 1-tài-liệu (soạn CV/doc/sheet, có style-rail + canvas + preview) → full-bleed app-shell**, KHÔNG `mx-auto max-w px-6 py-6`. Gồm 3 phần:
  1. **Toolbar (back · tên tài liệu · export) = LỚP DƯỚI NAVBAR** qua `useRegisterNavbarBottomLayer` (mirror DashboardTabsBar/ProfileTabsBar). Navbar (`<nav>` sở hữu 1 `border-b` dưới lớp cuối) render toolbar **dính liền dưới row nav → KHÔNG divider giữa** — toolbar đọc như "dòng 2 của navbar" ([[navbar-bottomlayer-system]]). Toolbar `w-full justify-between` (back trái · tên giữa cap `max-w-sm` · export phải), padding `px-6 pb-3`, KHÔNG border/sticky/bg riêng.
  2. **Sidebar style/cấu hình = full-height flush-trái** `lg:w-64 lg:shrink-0 lg:overflow-y-auto border-r border-separator p-6`, chạm mép trái (route full-bleed), kiểu "Mục lục khoá học" ([[elements/sidebar]] §4).
  3. **Content** = canvas/blocks + preview (mỗi cột ScrollShadow cuộn riêng), `p-6`.
- **Node bottom-layer render TRONG subtree Navbar → chỉ đọc provider GLOBAL** (Redux/i18n/HeroUI/zustand). Toolbar có state động (tên sửa được, export disabled) → **dùng store zustand riêng** (`cvEditorToolbar`) giữ `{label, canExport, exportingFormat, onBack, onLabelChange, onExport}`; node = component ĐỨNG YÊN (`useMemo(()=><Bar/>,[])`) đọc store → cập nhật live **KHÔNG remount** (giữ focus ô tên). Editor sync state vào store + register node (clear on unmount). ĐỪNG re-memoize node theo state động (mỗi keystroke remount input = mất focus).
- **Chiều cao shell** = `lg:h-[calc(100dvh-Xrem)]` với X = chiều cao navbar-2-dòng (nav 4rem + toolbar ~3.5rem ≈ `7.5rem`; nút export để **default-size** cho navbar gọn + đoán được chiều cao, KHÔNG `lg` — ngoại lệ compact-strip của [[primary-cta-icon-size-lg]]). Sidebar + 2 cột content dùng cùng height, `overflow` nội vùng → trang không cuộn cả khối.

## Luật 2 (STRICT) — Control-button trong item/block lặp-được: reorder = `tertiary` · delete = `danger` (KHÔNG ghost đồng loạt)
- Header của 1 item/block lặp-được (RepeatableItemCard, block card) có cụm control **đảo thứ tự (↑↓) + xoá**. Phân vai màu theo NGHĨA:
  - **↑↓ (move up/down) = `variant="tertiary"`** (thao tác phụ trung tính, quiet).
  - **Xoá/remove = `variant="danger-soft"`** (đỏ MỀM, KHÔNG `danger` đặc — trash lặp lại nhiều item/block, danger đặc quá loud/đỏ chói; danger-soft = tint đỏ nhạt, vẫn đọc ra "destructive" mà không hét). KHÔNG để trash chung `ghost` với ↑↓ (không phân biệt được destructive). Thầy chốt 2026-07-06: *"danger soft ấy, không phải danger"*.
- Áp cho CẢ cấp: **item** (RepeatableItemCard) LẪN **block lớn** (block card header). **Block lớn cũng có ↑↓** (đảo thứ tự cả block), không chỉ item — cụm action của block = `[↑ tertiary][↓ tertiary][xoá danger]`.

## Luật 3 — Sidebar cấu hình editor: nhóm theo NHÃN section; action "loại khác" (import/paste) gắn nhãn "Truy cập nhanh"; AI per-feature lộ MODEL PICKER
- Sidebar editor chia section bằng `<Label>` + divider `border-t`: **Kiểu dáng** (phông/màu/cỡ) · **Trợ lý AI** · **Truy cập nhanh**.
- **Action bản-chất-khác** (vd "Dán CV có sẵn" = import/parse, KHÁC style-config) → gắn nhãn riêng **"Truy cập nhanh"** (`<Label>`), đừng để lẫn cụm style.
- **Tính năng AI trong editor (vd "AI viết giúp" per-block) → lộ MODEL PICKER ở sidebar** (`GradeModelDropdown`, task `Chatting`) — user chọn model dùng cho AI của editor đó; mutation AI nhận `selectedModel/provider` (mirror challenge/interview grading). 1 chỗ chọn model cho cả editor, không mỗi block 1 picker.

## Luật 4 — Empty-state funnel-CTA = **Alert `status="warning"`**; nút CTA màu THEO STATUS của alert
- Empty-state kéo-về-khóa ([[layout-must-funnel-to-courses-and-cover-full-data-state-matrix]]) trong sidebar hẹp = **HeroUI `Alert status="warning"`** (`className="bg-warning/10 shadow-none"`), **nút CTA stack TRONG `Alert.Content`** (vertical, vừa sidebar hẹp — KHÔNG dùng `action` ngang của Callout vì tràn).
- **Alert có nút CTA → nút CTA tô màu THEO STATUS của alert** (đồng tông): warning alert → nút **warning (vàng)** · danger alert → nút danger · accent alert → nút accent. KHÔNG để nút accent-hồng trong alert warning (chọi tông). Thầy chốt 2026-07-06: *"alert CTA thì để [nút] theo accent [status] của alert"*.
  - HeroUI Button KHÔNG có `variant="warning"` → nút warning tô qua inline `style` override `--button-bg`/`--button-bg-hover`/`--button-color` (= `var(--warning)` + `--warning-foreground`), `variant="ghost"` làm base (pattern repo `FlexWrapButtonRadio` — [[elements/card]] §3f gotcha). KHÔNG `bg-warning` className (base `.button` đổ nền qua `--button-bg` var, className thua).
- **BỎ `Alert.Indicator` (icon) trong funnel-CTA compact** — sidebar hẹp, tiêu đề đã tự nói; icon cảnh báo thừa/chật. Thầy chốt 2026-07-06: *"bỏ cái alert icon đi"*. (Alert vẫn render Content full-width khi không có Indicator.)

## Áp đầu (2026-07-06)
- CV editor: shell (toolbar navbar bottom-layer + store `cvEditorToolbar` + full-height sidebar + full-bleed route). Control ↑↓ tertiary / xoá danger (item + block) + block-level ↑↓. Sidebar: Kiểu dáng · Trợ lý AI (model picker) · Truy cập nhanh (Dán CV). Warning Alert CTA "Vào khóa học" nút vàng.
- Kèm feature: AI-tailor-theo-JD · đo độ hoàn thiện CV · cỡ chữ/mật độ · ngôn ngữ CV (vi/en) — dựng qua workflow.
