# Element — Label

> Element doc cho "label" (nhãn). Tổng hợp 2 vai của label đã chốt. Chi tiết quyết định ở `drafts/*` cho tới khi `/merge`.

## 1. Label trong/đầu card (section label) — block `LabeledCard`
- Nhãn của 1 section/khối = `Label` (HeroUI) đặt **NGOÀI/TRÊN** card, card chỉ chứa content. KHÔNG dựng header trong card bằng `Typography` tay. Dùng block `blocks/cards/LabeledCard` (xem [[elements/card]] §2).
- **Label phụ bên PHẢI (prop `labelEnd`):** 1 nhãn phụ MUTED pin bên phải hàng label — là **tag thụ động**, KHÔNG phải action (vd đơn vị tiền tệ "VND", count "12 mục", unit). Render `<span className="shrink-0 text-xs text-muted">`. Chỉ hiện khi KHÔNG có `action`/`onSeeMore` (2 cái đó chiếm slot phải trước). Phân biệt rõ:
  - `labelEnd` = **thông tin** (passive tag, muted, không click).
  - `action` / `onSeeMore` = **hành động** (button/link "Xem thêm ›", accent, click được).
  - → Khi cần "label trái + 1 nhãn phụ phải" thuần thông tin (vd "Thanh toán trong nước" · "VND") → dùng `labelEnd`, ĐỪNG nhồi vào `action` (action mang nghĩa bấm-được).
- Áp đầu: `PaymentModal` nhóm cổng "Thanh toán trong nước" (`label` + `labelEnd="VND"`).

## 2. Label mở drawer/panel (summary-row + caret) — clickable row
- Khi 1 label đại diện cho 1 NHÓM nội dung phụ được giấu trong drawer/panel (mở khi cần) → render thành **1 summary-row clickable**: `[leading icon + label]` trái · `[hint/value? + caret-right]` phải, cả hàng bấm được mở drawer.
- Class chuẩn (border-only, hover nền `bg-default`, có cursor + focus ring): `group flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border border-default px-4 py-3 text-left outline-none transition-colors hover:bg-default focus-visible:ring-2 focus-visible:ring-accent`. Caret `CaretRightIcon size-4 text-muted transition-transform group-hover:translate-x-1`.
- Đây là áp [[interactive-needs-hover]] (mọi interactive phải có hover + cursor; hover kích bằng CẢ hàng qua `group`) + pattern "Cài đặt chấm điểm ›" (GradeModelDropdown / settings summary-row).
- **Khi nào dùng vai 2 thay vì bày inline:** nội dung của nhóm là PHỤ/ít dùng (vd cổng thanh toán quốc tế cho audience VN) → giấu sau 1 label-row + caret để gọn modal; nội dung CHÍNH (cổng nội địa) bày thẳng (List Card). Áp đầu: `PaymentModal` — "Thanh toán quốc tế ›" mở Drawer chứa Stripe/PayPal/Crypto.

## Nguyên tắc rút ra
- Label KHÔNG mặc định là heading semantic — chọn primitive theo VAI: **nhãn section** (`Label` trong `LabeledCard`, có thể kèm `labelEnd` info phải) vs **nhãn-mở-panel** (summary-row clickable + caret). Nhãn phụ/định danh phụ (số thứ tự, eyebrow) để text câm muted (ref [[challenge-section-labeledcard-quiet-eyebrow-icon-once]]).
- Style chỉ ở block: `labelEnd` sống trong `LabeledCard`; summary-row dùng class chuẩn ở feature (chưa trích block — nợ: cân nhắc block `DrawerTriggerRow`).
