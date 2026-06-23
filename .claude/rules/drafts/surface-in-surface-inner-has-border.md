# Draft — Surface-in-surface: surface TRONG luôn có `border border-default` để phân tách (2026-06-24)

- File/§ đích khi `/merge`: `starci-ui.rules` / `decision/card.md` (card/surface) + `cannon/CONTENT.md` §7.7.
- Bối cảnh: thầy soi PaymentModal — order-summary card (1 card đặt TRÊN mặt modal) dùng `border border-white/10`
  (veil mờ) → viền không rõ. Thầy: *"surface in surface thì trong có border, đọc kĩ rules"*.

## Luật (STRICT)
- **Khi 1 surface (card) NẰM TRÊN một surface khác (card / modal / panel) — "surface-in-surface" — thì surface
  TRONG PHẢI có `border border-default`.** Border là cái phân tách 2 lớp surface (cùng họ `bg-surface`/`--overlay`
  rất dễ trùng nền). KHÔNG dựa mỗi veil nền (`bg-white/10`) để "lift" — veil chỉ là phụ; **border mới là delineator
  chính**. Đây đúng họ với `SectionCard` = "bordered card" (cannon §7.7) + decision/card (card có viền).
- **Không thay border-token bằng `border-white/10` ad-hoc.** Dùng `border border-default` (token chuẩn) để viền hiện
  rõ, đồng bộ mọi card. Veil nền (`bg-white/5`) chỉ giữ khi cần nâng nhẹ trên `--overlay` (modal); border vẫn là chính.
- **Ngược lại — KHÔNG card-in-card thừa:** nếu content bên trong vốn đã là card thì dùng `LabeledCard frameless`
  (bỏ frame ngoài) thay vì lồng 2 card (decision/card "No card-in-card"). Luật này áp cho trường hợp **cố ý** đặt 1
  surface bounded bên trong (vd order-summary trong modal, panel trong card) — khi đó surface trong có border.
- **Nội dung PHẲNG (list/row/divider) trong modal/card KHÔNG phải surface-in-surface** → không cần bọc card/border
  (vd list "bạn mở khoá" + dòng giá ngăn bằng `border-t` trong PremiumGate là phẳng, OK). Chỉ khi tạo 1 KHỐI BOUNDED
  riêng (có nền/bo góc) mới tính là surface trong → khi đó bắt buộc border.

## ĐÃ ÁP DỤNG 2026-06-24
- `PaymentModal` order-summary: `border border-white/10 bg-white/10` → **`border border-default bg-white/5`**
  (viền chuẩn rõ + veil nhẹ giữ lift trên `--overlay`).
- Quét các modal vừa dựng (PremiumGate, GlobalSearch): nội dung phẳng, không có surface lồng → không đổi.
