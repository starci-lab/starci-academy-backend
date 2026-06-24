# Element — Price (block `PriceTag`)

> Element doc cho hiển thị GIÁ. 1 block duy nhất render "giá khuyến mãi" cho mọi nơi. Chi tiết quyết định ở `drafts/*` cho tới khi `/merge`.

## Block `PriceTag` (blocks/commerce/PriceTag) — 2026-06-24
- **Mọi nơi hiển thị giá khóa/sản phẩm dùng `PriceTag`**, KHÔNG tự dựng "discounted + struck + chip" tay. Render: **giá đã giảm (bold) + giá gốc gạch (chỉ khi có giảm) + chip `−X%` success**.
- **Props:** `{ discounted: number, original?: number | null, currency?: "VND" | "USD", size?: "sm" | "md" | "lg", breakdown?, className? }`.
  - `size` lái cỡ giá chính: `sm`=body · `md`=h4 · `lg`=h3 (struck = body-xs ở sm, else body-sm).
  - Chỉ render giá-gốc-gạch khi **thật sự có giảm** (`original > discounted`).
  - Chip % = **luôn tự tính** `round((1 - discounted/original) * 100)` (tổng list→charge); KHÔNG có prop percent nữa.
  - **`currency`** (VND/USD): format theo tiền tệ (`toLocaleString` vi-VN ₫ / en-US $). % compute agnostic.
  - **`breakdown?: { phase, phaseLabel?, loyaltyPercent, loyaltyNote? }`**: khi có → **hover vào CHÍNH CHIP `−X%`** mở Tooltip breakdown (KHÔNG thêm icon ⓘ, KHÔNG bọc cả hàng giá — chip LÀ affordance, `cursor-help` trên chip). Tooltip tách: `Giá gốc → Giai đoạn [phase] −A% → Ưu đãi thành viên −B% (note) → Bạn trả`. `phase` = giá phase (cùng currency) trước loyalty. Nhãn chung block tự lo qua i18n `priceTag.*`; `phaseLabel`/`loyaltyNote` feature truyền (tuỳ chọn). 3 số = list(`original`) → phase(`breakdown.phase`) → charge(`discounted`).
  - **Affordance = chính cái chip, không glyph phụ.** Nguyên tắc: 1 phần tử đã có nghĩa (chip giảm giá) tự làm trigger cho giải thích của nó — đừng thêm icon ⓘ "lòng vòng" cạnh bên (ref [[interactive-needs-hover]]: interactive có hover, nhưng đừng nhân đôi affordance).
- **Gate theo CHÊNH LỆCH GIÁ THẬT, KHÔNG theo cờ loyalty.** Đây là bug gốc đã sửa: nhiều chỗ gate struck+chip theo `discountPercent > 0` (LOYALTY only = 0 hầu hết user) → khoản giảm thật (phase/early-bird) **không hiện**. `PriceTag` luôn so `originalVnd` vs `discountedVnd` → mọi khoản giảm đều lộ.
- **Tiền tệ:** format VND `toLocaleString("vi-VN")₫` (dấu chấm). USD/loyalty-reason/phase ladder KHÔNG thuộc PriceTag — caller tự render quanh nó (PriceTag chỉ lo "VND discounted + struck + %").
- **Đang dùng ở (single source):** `PaymentModal` summary · `PremiumGateModal` · `PremiumPaywall` (inline) · `CoursePricingRail` headline VND. Sửa logic giá = sửa 1 chỗ. Ref [[concepts/single-source-render]].
- **% = TỔNG khoản giảm (struck → hiện tại), KHÔNG truyền `percent`.** Chốt 2026-06-24: BE `coursePricePreview.originalPriceVnd` = **giá list/MSRP** (`course.originalPrice`), `discountedPriceVnd` = phase×(1−loyalty) = charge. → để PriceTag **tự tính %** từ gap (list→charge) = gộp phase tier (Pioneer/Early-bird) + loyalty. ĐỪNG truyền `percent={loyalty}` (sẽ understate, chỉ ra loyalty). Truyền `percent` chỉ khi muốn ép 1 con số cụ thể.

## Nguyên tắc
- Caller tính số (loyalty vs phase, đổi tiền tệ) → **truyền số đã tính** vào PriceTag; PriceTag chỉ lo trình bày. Loyalty/USD/phase là việc của feature, không nhét vào block.
- Bọc `AsyncContent` khi giá đang load (skeleton dòng giá); PriceTag chỉ render khi có `discountedVnd`.
