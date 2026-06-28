# Draft — Block `SelectableCardGroup` (chọn 1-trong-N card): da list-card SURFACE; selected = `bg-accent/10` + `border-accent`, CHỮ GIỮ `text-foreground` (không pink chữ) (2026-06-27)

- File/§ đích khi `/merge`: `elements/card.md` (§ selectable card) + `elements/` (navigation control) + liên quan [[single-select-among-options-use-tabs]] · [[control-group-label-uses-label-block]] · [[highlight-accent-as-detail-not-block-fill]] · [[elements/card]] §3c (SurfaceListCard da).
- Bối cảnh: Phỏng vấn thử — "kiểu luyện" cần "1 đống card, chọn 1 cái sáng lên". Nền tảng CHƯA có component này. Đọc HeroUI → dựng block `SelectableCardGroup` trên `RadioGroup`/`Radio`. Thầy chốt styling: *"list card surface; select thì có bg-accent/10 và border; text giữ màu đen tạm"*.

## Luật (STRICT)
- **"Chọn 1 trong N card sáng-lên" = block `SelectableCardGroup` (bọc HeroUI `RadioGroup` + `Radio`), KHÔNG `<button aria-pressed>` tự chế.** RadioGroup = role radiogroup + arrow-key roving + single-select chuẩn (a11y). `Radio` root nhận **className-hàm** (`isSelected`/`isDisabled`/`isFocusVisible`) + `data-selected` → style cả card.
- **"Da" card = list-card SURFACE** (`rounded-xl border border-default bg-surface px-3 py-3`) — KHÔNG transparent (chìm trên nền tối). Cùng họ surface của [[elements/card]] §3c (SurfaceListCard).
- **Selected = `bg-accent/10` + `border-accent`** (nền nhạt accent + VIỀN accent). **CHỮ GIỮ `text-foreground` (đen) — KHÔNG `text-accent`** (thầy: *"text giữ màu đen tạm"*). Tín hiệu "đang chọn" do **nền + viền** mang accent; chữ giữ trung tính → đọc tốt, không rực. (Nền `bg-accent/10` trên 1 card NHỎ được-chọn = bounded object nhỏ → OK, không vi phạm [[highlight-accent-as-detail-not-block-fill]] vốn cấm tô accent cả KHỐI/section lớn.)
- **Disabled = `opacity-60` + `cursor-not-allowed`** + render `badge` (vd "Sắp có") góc phải. **Focus = `ring-2 ring-accent`.**
- **Phân biệt control single-select (đừng nhầm):**
  - **setting nhỏ gọn 1 hàng** (cấp độ, currency) → `SegmentedControl` (pill).
  - **chọn 1 trong N CARD to** (có icon + mô tả + badge) → `SelectableCardGroup` (card surface).
  - **đổi panel/nav** → `TabsCard` (underline).
- **API đề xuất:** `{ items: Array<{ value, label, description?, icon?, isDisabled?, badge? }>, value, onChange, ariaLabel, columns?: 1|2|3, className? }`. Root RadioGroup = `grid gap-2` + `grid-cols-{columns}`.

## Tái dùng
- Kiểu luyện (interview) · cổng thanh toán (PaymentModal list-card-interactive hiện tự chế → có thể chuyển) · chọn gói · mọi "chọn 1 trong N card". 1 nguồn render ([[single-source-render]]). Skeleton mirror = `Skeleton/RadioGroup` (đã có).

## Áp đầu (2026-06-27)
- Tạo `blocks/navigation/SelectableCardGroup`. `InterviewSession` "Kiểu luyện" button-grid → `SelectableCardGroup` (columns=2). Đồng thời bỏ bento → 1 cột (readiness strip ngang). Apply qua `/starci-fe-ux-apply`.