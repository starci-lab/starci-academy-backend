# Element — Price (block `PriceTag`)

> Element doc cho hiển thị GIÁ. 1 block duy nhất render "giá khuyến mãi" cho mọi nơi.

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

## Currency toggle (khi sản phẩm có giá NHIỀU tiền tệ) — 2026-06-24
- **1 sản phẩm có giá ở NHIỀU tiền tệ + nhiều nhóm cổng theo tiền tệ → công tắc tiền tệ (`SegmentedControl`) drive CẢ giá summary (`PriceTag currency`) LẪN danh sách cổng** (domestic ↔ international). Chỉ hiện toggle khi **có giá USD** (`hasUsd`); không có → ẩn toggle, chỉ VND. Đây là 1 nhánh của công tắc tiền tệ (KHÔNG giấu cổng quốc tế sau Drawer nữa khi tiền tệ là lựa chọn ngang hàng).
- **Breakdown tooltip cần 3 số** (list→phase→charge): BE preview trả thêm `phasePriceVnd`/`phasePriceUsd` = giá phase (CHƯA loyalty) → FE đủ tách phase-discount vs loyalty. ĐỪNG suy phase = charge/(1−loyalty) (sai số).

## Display consistency: VND ÷testDivisor (non-prod) · USD charm `.99` — FE mirror BE transform (2026-06-24)
- **Giá HIỂN THỊ đồng nhất MỌI surface.** Non-prod: VND chia `testDivisor` (=100, `NODE_ENV !== "production" ? 100 : 1` — MIRROR BE `LOCAL_TEST_PRICE_DIVISOR` cũng NODE_ENV-gated); prod không chia. USD: charm `.99` (`ceil − 0.01`), KHÔNG chia (int'l gateway sandbox/test).
- **Giá HIỂN THỊ = giá CHARGE → round ở NGUỒN (BE), KHÔNG round riêng ở UI.** USD charm-round `roundUsdToCharm(x) = max(1, ceil(x)) − 0.01` áp ở BE (`resolveAmountUsd`/`resolveListAmountUsd`) → display == charge. KHÔNG để số lẻ ($0.50) — luôn `x.99`.
- **FE mirror transform qua 1 nguồn** (`publicEnv().pricing.testDivisor` khớp BE): mọi surface đọc giá RAW từ entity (`usePricingRows`, `CourseCard` fallback — cần ALL phase cho ladder mà preview chỉ trả active) PHẢI áp `÷divisor` (VND) + charm (USD) TRƯỚC khi hiện. Giá từ `coursePricePreview` (BE đã transform) thì KHÔNG áp lại → tránh lệch "rail triệu / modal chục nghìn".
- **NGOẠI LỆ có chủ đích của [[concepts/single-source-render]]:** ladder cần all-phase (preview không có) → FE re-derive từ entity + mirror transform; centralize divisor ở `publicEnv` để không scatter. Nợ dài hạn: BE expose giá-đã-transform per-phase → FE chỉ hiện, bỏ mirror.

## Nguyên tắc
- Caller tính số (loyalty vs phase, đổi tiền tệ) → **truyền số đã tính** vào PriceTag; PriceTag chỉ lo trình bày. Loyalty/USD/phase là việc của feature, không nhét vào block.
- Bọc `AsyncContent` khi giá đang load (skeleton dòng giá); PriceTag chỉ render khi có `discountedVnd`.
