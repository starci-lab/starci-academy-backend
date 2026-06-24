# Concept — Card: KHÔNG xếp 2 card/surface bordered liên tiếp

> Heuristic bố cục card (họ `concepts/*`). Bổ trợ [[elements/card]] (biến thể card) — đây là luật KHI NÀO / KHÔNG nên dựng card.

## Quy tắc (STRICT)
- **Đừng render 2 khối bordered (card / list-card / surface có viền) DÍNH liền nhau theo chiều dọc.** 2 hộp viền chồng nhau = nặng, "hộp nối hộp", mắt không phân được đâu là 1 nhóm. Mỗi card phải là 1 **bounded object có nghĩa**; xếp 2 cái sát = nhiễu, mất phân cấp.
- **Cách đúng khi cái thứ 2 là phụ/secondary:**
  1. **Hành động phụ → LINK phẳng** (không box): text + caret, hover underline, `text-accent`. KHÔNG bọc border/bg. (Vd "Thanh toán quốc tế ›" dưới List Card cổng nội địa → link, không phải card thứ 2.)
  2. **Nội dung phụ cùng nhóm → gộp VÀO card trên** (divider `border-t` trong cùng card) thay vì tách card mới.
  3. **2 nhóm NGANG HÀNG thật sự** (đều là card có nghĩa) → cách nhau `gap-6` + mỗi cái có nhãn/định danh riêng (LabeledCard) để đọc ra "2 vùng", không phải "2 hộp dính".
- **Card chỉ cho thứ XỨNG là bounded object** (1 item, 1 section nội dung, 1 list lựa chọn). Hành động đơn / link điều hướng / 1 dòng meta → KHÔNG phải card. Ref design-restraint + [[course-home-vertical-rhythm-gap3]] (continue block để phẳng, không bọc card thừa).

## Liên quan (đừng nhầm)
- **Card-in-card** (lồng) → [[card-in-card-border-not-double-fill]] / [[surface-in-surface-inner-has-border]] (con bỏ fill / border + inherit). Đây là luật KHÁC: luật này nói về 2 card **kề nhau** (siblings), không phải lồng.
- **Frameless** khi content vốn là card(s) → [[frameless-section-empty-state-needs-card]] + `LabeledCard frameless`.
- **Summary phẳng trong modal** (không bọc card vì modal đã là surface) → [[payment-modal-flat-summary-listcard-drawer]].

## Áp đầu (2026-06-24)
- `PaymentModal`: dưới List Card "Thanh toán trong nước" (bordered) → "Thanh toán quốc tế" để **link phẳng + caret** (mở Drawer), KHÔNG bọc thành card thứ 2 (thầy: *"không có card bọc ngoài, không render 2 card liên tiếp kiểu này"*). Bỏ luôn icon quả địa cầu ở link.
