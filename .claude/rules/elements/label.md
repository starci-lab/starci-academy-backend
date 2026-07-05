# Element — Label

> Element doc cho "label" (nhãn). Tổng hợp 2 vai của label đã chốt. Chi tiết quyết định ở `drafts/*` cho tới khi `/merge`.

## 1. Label trong/đầu card (section label) — block `LabeledCard`
- Nhãn của 1 section/khối = `Label` (HeroUI) đặt **NGOÀI/TRÊN** card, card chỉ chứa content. KHÔNG dựng header trong card bằng `Typography` tay. Dùng block `blocks/cards/LabeledCard` (xem [[elements/card]] §2).
- **Label phụ bên PHẢI (prop `labelEnd`):** 1 nhãn phụ MUTED pin bên phải hàng label — là **tag thụ động**, KHÔNG phải action (vd đơn vị tiền tệ "VND", count "12 mục", unit). Render `<span className="shrink-0 text-xs text-muted">`. Chỉ hiện khi KHÔNG có `action`/`onSeeMore` (2 cái đó chiếm slot phải trước). Phân biệt rõ:
  - `labelEnd` = **thông tin** (passive tag, muted, không click).
  - `action` / `onSeeMore` = **hành động** (button/link "Xem thêm ›", accent, click được).
  - → Khi cần "label trái + 1 nhãn phụ phải" thuần thông tin (vd "Thanh toán trong nước" · "VND") → dùng `labelEnd`, ĐỪNG nhồi vào `action` (action mang nghĩa bấm-được).
- Áp đầu: `PaymentModal` nhóm cổng "Thanh toán trong nước" (`label` + `labelEnd="VND"`).

### 1b. Nhãn NHÓM control/option bên trong surface = `<Label>`, KHÔNG `text-sm text-muted` tay — CHỐT 2026-06-27
- **Nhãn giới thiệu 1 NHÓM control/option (mode picker, level/segmented selector, field group, radio/checkbox group, cụm input) bên trong 1 card/form = block `<Label>` (HeroUI), KHÔNG `text-sm text-muted`/`text-xs text-muted` dựng tay.** `<Label>` đồng bộ cỡ/màu/spacing với mọi field + wire `htmlFor`/aria → a11y đúng; text muted tay = lệch da + mất liên kết nhãn↔control. Thầy chốt (Phỏng vấn thử setup): *"kiểu luyện cấp độ dùng Label nhé, không dùng text-sm text-muted"*.
- **Phân biệt với eyebrow câm:** nhãn đứng TRÊN 1 control user bấm-chọn ("Kiểu luyện", "Cấp độ", "Ngôn ngữ") → `<Label>`; còn eyebrow/count/meta định danh phụ (số thứ tự "Thử thách N", "n mục", caption) → `text-xs text-muted` (quiet — [[challenge-section-labeledcard-quiet-eyebrow-icon-once]]). Hỏi: nhãn này gắn 1 control/group bên dưới? → `<Label>`. Chỉ text định danh/đếm phụ? → muted câm.
- Khác §1 (`LabeledCard` = nhãn của CẢ 1 card/section, label ngoài): đây là nhãn-nhóm-control BÊN TRONG 1 surface (setup card, form) nơi không bọc LabeledCard riêng từng nhóm. Ref [[control-group-label-uses-label-block]].
- **GAP `<Label>` → control PHỤ THUỘC LOẠI control (thầy chốt 2026-06-28):**
  - **Label → 1 INPUT TEXT (TextField/Input) ngay dưới = `gap-2`** (cặp field SÁT — da chuẩn HeroUI field, nhãn dính ô nhập). Đây là NGOẠI LỆ giữ chặt.
  - **Label → CARD / RADIO-GROUP / cụm card (FlexWrap{Card,Button}Radio, SelectableCardGroup, SegmentedControl, group nhiều control) = `gap-3`** (THOÁNG khí — control "nặng/giàu" cần thở, gap-2 chật). Thầy: *"label cách card, cụm radio là gap-3 để tạo cảm giác thoáng khí; trừ input ở dưới thì gap-2"*.
  - Quy tắc rút ra: nhãn dính SÁT (`gap-2`) khi control là 1 ô nhập đơn (field pair kinh điển); nhãn THOÁNG (`gap-3`) khi control là 1 khối/cụm (card, radio-group) để tạo nhịp. **Đính chính** §1.17 ("settings modal Label→control gap-2"): đúng cho control = input/dropdown ĐƠN; nhưng Label→cụm-card/radio-group = `gap-3`.
- **MỌI section header trong 1 settings modal/drawer = `<Label>` (mở rộng 2026-06-28).** Cả nhóm CONTROL (vd "Model trả lời" → dropdown) LẪN nhóm ACTION (vd "Xoá lịch sử" → nút danger) trong modal/drawer Cài đặt đều dùng `<Label>` (KHÔNG `Typography body-sm` / muted tay) → mọi section label trong settings đồng nhất 1 da. Các section cách nhau `gap-6`; trong mỗi section: `<Label>` → control/hint/button `gap-2`. Thầy chốt (ContentAiChat settings): *"Model trả lời là `<Label/>`… xoá lịch sử là `<Label/>`"*. (Nhãn nhóm action cũng tính là control-group header → `<Label>`, không chỉ riêng nhóm input.)
- **Hiển thị "model/option đang chọn" trong settings = DROPDOWN (cùng control với composer), KHÔNG box read-only.** Khi panel chính (vd composer chat) đã có dropdown chọn model thì ô "model trả lời" trong settings cũng là **đúng dropdown đó** (1 control = 1 cách render, [[single-source-render]]), để đổi được từ cả 2 chỗ — KHÔNG render thành box tĩnh read-only. Thầy: *"cái đấy là drop down, y chang chatbox"*.
- **Action BẢN-CHẤT-KHÁC trong 1 sidebar/panel cấu hình → gắn `<Label>` section RIÊNG, đừng lẫn vào cụm cùng loại (CHỐT 2026-07-06).** Sidebar editor gồm nhiều nhóm khác bản chất (style-config: phông/màu/cỡ · AI · import/paste) → mỗi nhóm 1 `<Label>` + `border-t` (vd "Kiểu dáng" · "Trợ lý AI" · "Truy cập nhanh"). 1 action lạc loại (vd "Dán CV có sẵn" = import/parse, KHÁC style-config) → đặt dưới nhãn riêng **"Truy cập nhanh"**, KHÔNG nhét chung cụm Kiểu dáng. Ref [[editor-shell-navbar-toolbar-fullheight-sidebar-and-control-button-semantics]] · [[elements/sidebar]] §8.

## 2. Label mở drawer/panel (summary-row + caret) — clickable row
- Khi 1 label đại diện cho 1 NHÓM nội dung phụ được giấu trong drawer/panel (mở khi cần) → render thành **1 summary-row clickable**: `[leading icon + label]` trái · `[hint/value? + caret-right]` phải, cả hàng bấm được mở drawer.
- Class chuẩn (border-only, hover nền `bg-default`, có cursor + focus ring): `group flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border border-default px-4 py-3 text-left outline-none transition-colors hover:bg-default focus-visible:ring-2 focus-visible:ring-accent`. Caret `CaretRightIcon size-4 text-muted transition-transform group-hover:translate-x-1`.
- Đây là áp [[interactive-needs-hover]] (mọi interactive phải có hover + cursor; hover kích bằng CẢ hàng qua `group`) + pattern "Cài đặt chấm điểm ›" (GradeModelDropdown / settings summary-row).
- **Khi nào dùng vai 2 thay vì bày inline:** nội dung của nhóm là PHỤ/ít dùng (vd cổng thanh toán quốc tế cho audience VN) → giấu sau 1 label-row + caret để gọn modal; nội dung CHÍNH (cổng nội địa) bày thẳng (List Card). Áp đầu: `PaymentModal` — "Thanh toán quốc tế ›" mở Drawer chứa Stripe/PayPal/Crypto.

## Nguyên tắc rút ra
- Label KHÔNG mặc định là heading semantic — chọn primitive theo VAI: **nhãn section** (`Label` trong `LabeledCard`, có thể kèm `labelEnd` info phải) vs **nhãn-mở-panel** (summary-row clickable + caret). Nhãn phụ/định danh phụ (số thứ tự, eyebrow) để text câm muted (ref [[challenge-section-labeledcard-quiet-eyebrow-icon-once]]).
- Style chỉ ở block: `labelEnd` sống trong `LabeledCard`; summary-row dùng class chuẩn ở feature (chưa trích block — nợ: cân nhắc block `DrawerTriggerRow`).
