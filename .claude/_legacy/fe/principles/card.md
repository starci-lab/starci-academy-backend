# Concept — Card: KHÔNG xếp 2 card/surface bordered liên tiếp

> Heuristic bố cục card (họ `concepts/*`). Bổ trợ [[elements/card]] (biến thể card) — đây là luật KHI NÀO / KHÔNG nên dựng card.

## Quy tắc (STRICT)
- **Đừng render 2 khối bordered (card / list-card / surface có viền) DÍNH liền nhau theo chiều dọc.** 2 hộp viền chồng nhau = nặng, "hộp nối hộp", mắt không phân được đâu là 1 nhóm. Mỗi card phải là 1 **bounded object có nghĩa**; xếp 2 cái sát = nhiễu, mất phân cấp.
- **Cách đúng khi cái thứ 2 là phụ/secondary:**
  1. **Hành động phụ → LINK phẳng** (không box): text + caret, hover underline, `text-accent`. KHÔNG bọc border/bg. (Vd "Thanh toán quốc tế ›" dưới List Card cổng nội địa → link, không phải card thứ 2.)
  2. **Nội dung phụ cùng nhóm → gộp VÀO card trên** (divider `border-t` trong cùng card) thay vì tách card mới.
  3. **2 nhóm NGANG HÀNG thật sự** (đều là card có nghĩa) → cách nhau `gap-6` + mỗi cái có nhãn/định danh riêng (LabeledCard) để đọc ra "2 vùng", không phải "2 hộp dính".
- **Card chỉ cho thứ XỨNG là bounded object** (1 item, 1 section nội dung, 1 list lựa chọn). Hành động đơn / link điều hướng / 1 dòng meta → KHÔNG phải card. Ref design-restraint + [[gap]] (continue block để phẳng, không bọc card thừa).

## Tách HAY gom card = quyết định theo MÀN (cả hai hợp lệ) — CHỐT 2026-06-30
- **"Tách thành nhiều labeled card" và "gom về 1 card" đều hợp lệ; chọn theo từng màn + ý thầy, KHÔNG dogma "luôn tách"/"luôn gom".** 1 màn setup có thể tách N section thành N LabeledCard (rõ từng vùng) HOẶC gom hết vào 1 card (gọn, 1 surface). Đảo hướng giữa các vòng (tách → gom) là **có chủ đích**, không phải lỗi — bám yêu cầu hiện tại.
- **Khi TÁCH card cấu hình → gộp control theo NGHĨA, KHÔNG per-control.** Mỗi card = 1 nhóm có nghĩa (vd *what-to-practice* = mode+level · *how-graded* = model). 1 control lẻ (1 dropdown / 1 segmented) thành 1 card = mỏng/thừa (vi phạm "card xứng đáng"). Control lẻ buộc đứng riêng → thêm 1 dòng helper cho thân. Ref [[control-group-label-uses-label-block]].
- **Khi GOM về 1 card:** section trong card = `<Label>` + whitespace; tối đa **1 divider** `border-t` để tách 2 CỤM NGHĨA LỚN (vd "kết quả/độ sẵn sàng" ↔ "cấu hình"), quanh divider để **gap-3** ([[gap]] §divider). Bên trong mỗi cụm giữ nhịp riêng (vd nhóm control = gap-6). Thứ tự gợi ý: **kết-quả/progress (status "đang ở đâu") TRÊN ĐẦU** → divider → cấu hình → **CTA chính** → control PHỤ.
- **Control PHỤ (default-on, ít đổi — vd model chấm = Auto) đặt DƯỚI CTA chính** (de-emphasize), dùng **component/dropdown CHUNG tự self-label** (sparkle + tên) → **bỏ helper "X = ..." thừa**. Đừng đặt control phụ trên CTA (cướp attention khỏi hành động chính).
- **Meta-intro "màn này là gì + kỳ vọng"** (subtitle 1 dòng + chips "N câu · giọng nói · AI chấm") = **strip PHẲNG dưới page-header**, KHÔNG bọc card (caption giới thiệu, không phải nhóm control). Bỏ khi thầy thấy thừa.
- **CTA đơn** (primary action) để **phẳng** (trong card gom: đặt trong flow card; khi tách: phẳng ngoài các card cấu hình) — 1 hành động đơn KHÔNG bọc card riêng.

## Liên quan (đừng nhầm)
- **Card-in-card** (lồng) → [[card-in-card-border-not-double-fill]] / [[surface-in-surface-inner-has-border]] (con bỏ fill / border + inherit). Đây là luật KHÁC: luật này nói về 2 card **kề nhau** (siblings), không phải lồng.
- **Frameless** khi content vốn là card(s) → [[frameless-section-empty-state-needs-card]] + `LabeledCard frameless`.
- **Summary phẳng trong modal** (không bọc card vì modal đã là surface) → [[when-drawer]].

## Áp đầu (2026-06-24)
- `PaymentModal`: dưới List Card "Thanh toán trong nước" (bordered) → "Thanh toán quốc tế" để **link phẳng + caret** (mở Drawer), KHÔNG bọc thành card thứ 2 (thầy: *"không có card bọc ngoài, không render 2 card liên tiếp kiểu này"*). Bỏ luôn icon quả địa cầu ở link.
