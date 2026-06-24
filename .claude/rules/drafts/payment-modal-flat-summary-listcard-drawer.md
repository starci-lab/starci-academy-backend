# Draft — PaymentModal: summary PHẲNG (IconTile, bỏ card) · cổng = List Card interactive · nhóm phụ giấu sau Drawer-row · modal gutter p-4 (2026-06-24)

- File/§ đích khi `/merge`: `starci-ui.rules` (Modal/card/list) + [[elements/card]] §3c + [[elements/label]] + **đính chính** [[surface-in-surface-inner-has-border]] + [[modal-body-no-padding-override-heroui-idiom]].
- Bối cảnh: redesign `components/modals/PaymentModal` (screenshot thầy: đỏ = nhóm cổng, xanh = order-summary, nâu = vùng trust). Thầy chốt qua nhiều vòng.

## Luật (STRICT)
- **Order-summary trong modal = PHẲNG, KHÔNG card.** Nội dung của summary (avatar khóa + tên + giá + loyalty) là **info chính của modal** → modal đã là surface bounded, bọc thêm card = "hộp trong hộp" thừa. Đặt thẳng trên mặt modal. → **ĐÍNH CHÍNH** [[surface-in-surface-inner-has-border]]: không phải mọi khối-trên-surface đều cần là 1 card có border/veil; khi khối chỉ là **info hiển thị** (không phải 1 bounded object riêng cần delineate) thì để PHẲNG. Border/veil chỉ cho surface-in-surface CỐ Ý (1 card thật đặt trên card/modal). Bỏ veil `bg-white/5` cũ.
- **Avatar của "thứ" trong summary = block `IconTile`** (`size="sm"`), `src` = cover (`coverImageUrl`) khi có, else **fallback icon** (vd `GraduationCapIcon` tone accent) cho flow không cover (AI/membership). 1 block lo cả "có ảnh" lẫn "không ảnh" → khỏi guard `CoverImage` riêng. IconTile crop 16:9→vuông tự động.
- **List lựa chọn bấm-được muốn nhìn như Accordion Card → List Card INTERACTIVE** (xem [[elements/card]] §3c): 1 khối `bg-surface` bounded, row `<button>` hover `bg-default` + separator inset. KHÔNG `PressableCard` rời (ra N card tách). Bọc trong `LabeledCard frameless` + `labelEnd` cho tag tiền tệ ("VND").
- **Nhóm nội dung PHỤ/ít dùng → giấu sau 1 Drawer-row (label + caret), KHÔNG bày inline.** Cổng quốc tế (Stripe/PayPal/Crypto — hiếm với audience VN) → 1 summary-row "Thanh toán quốc tế ›" mở `Drawer` (placement right desktop / bottom mobile). Cổng nội địa (chính) bày thẳng List Card. → giảm tải thị giác modal, chính/phụ rõ. Ref [[elements/label]] §2 + [[interactive-needs-hover]].
  - **Row LUÔN hiện (entry-point ổn định); chính DRAWER xử lý trạng thái không khả dụng.** Thầy chốt (2026-06-24): đừng ẩn row khi `!hasUsd` (order không có giá USD) — vẫn hiện row "Thanh toán quốc tế ›", mở ra Drawer hiện **note `intlNoUsd`** ("chưa khả dụng cho đơn này") thay vì cổng. Lý do: ẩn row khiến user tưởng "không hỗ trợ quốc tế"; hiện row + giải thích trong drawer rõ hơn. (Đây là **điều chỉnh** so với bản 2026-06-21 "ẩn group khi thiếu USD" — entry-point của 1 affordance behind-drawer nên ổn định, dead-state nằm TRONG drawer.)
- **Modal gutter chuẩn = `p-4`, set 1 chỗ ở `globals.css`** (`.modal__dialog { padding: 1rem !important; }`), KHÔNG override `p-*` lẻ từng `Modal.Body`. → **ĐÍNH CHÍNH** [[modal-body-no-padding-override-heroui-idiom]]: gutter chuẩn đổi p-6 → **p-4** (thầy thấy p-6 rộng). HeroUI bake `.modal__dialog p-6` (unlayered) → override bằng selector trần `!important` (pattern `.switch__control`/`.extended-tabs` của repo). Body `-m-[3px] p-[3px]` focus-ring breathing giữ nguyên.

## Block API thêm
- `LabeledCard` thêm prop **`labelEnd?: ReactNode`** = tag phụ muted bên phải label (passive, không click), chỉ render khi không có `action`/`onSeeMore`. Ref [[elements/label]] §1.

## Cập nhật 2026-06-24 (sau) — giá tách block `PriceTag` dùng chung
- Khối giá inline (discounted + struck + chip) ở summary → thay bằng block **`PriceTag`** ([[elements/price]]), dùng CHUNG với `PremiumGateModal`/`PremiumPaywall`/`CoursePricingRail`. Gate theo chênh lệch giá thật (không theo loyalty `discountPercent`). Ref [[concepts/single-source-render]].

## ĐÃ ÁP DỤNG 2026-06-24 (FE `C:\Repositories\starci-academy`)
- `PaymentModal/index.tsx`: summary phẳng `IconTile sm` (cover/fallback `GraduationCapIcon`) + tên muted + giá h4 bold + struck + chip `−%` phải + loyalty dòng dưới (bỏ card + veil `bg-white/5`); nhóm nội địa = `LabeledCard frameless` (`labelEnd="VND"`) + List Card interactive (`renderMethodRow` hover `bg-default` + separator inset); nhóm quốc tế = Drawer-row "Thanh toán quốc tế ›" (GlobeIcon + caret) mở `Drawer` chứa List Card interactive (USD), ẩn khi `!hasUsd`; giữ trust line. Bỏ import `PressableCard`, thêm `Drawer`/`IconTile`/`LabeledCard`/`CaretRightIcon`/`GlobeIcon`/`useSmViewpoint`.
- `blocks/cards/LabeledCard`: thêm `labelEnd`.
- `app/globals.css`: `.modal__dialog { padding: 1rem !important; }`.
- i18n `payment.noCardStored` "StarCi" → "StarCi Academy" (vi+en).
- tsc + eslint sạch. **Chưa verify mắt** (modal auth-gated + cần click "Đăng ký" → thầy soi trên localhost).
- Doc brainstorm: `PaymentModal/UX-BRAINSTORM.md` (follow-up 2026-06-24, chốt C2).
