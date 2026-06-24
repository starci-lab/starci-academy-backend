# Draft — Giá hiển thị ĐỒNG NHẤT mọi surface: VND ÷testDivisor (non-prod), USD charm .99 — FE mirror BE transform (2026-06-24)

- File/§ đích khi `/merge`: `starci-ui.rules` (pricing/display) + [[elements/price]] + [[payment-currency-toggle-and-price-breakdown]] + đối chiếu [[concepts/single-source-render]].
- Bối cảnh: thầy thấy giá LỆCH — rail course-detail `1.190.000đ` (raw) vs catalog/modal `12.500đ` (đã /100). Thầy chốt: *"non production thì giá /100, cứ vậy mà làm"* (áp ĐỒNG NHẤT mọi nơi).

## Gốc lệch
`LOCAL_TEST_PRICE_DIVISOR=100` (BE, gate theo NODE_ENV) để charge rẻ khi test local. Áp KHÔNG đồng nhất:
- `coursePricePreview` (BE, qua `resolveAmountVnd`) **/100** → modal · gate · paywall · catalog-card (logged-in).
- `usePricingRows` (FE, đọc raw `course.pricingPhases[].price`) **KHÔNG /100** → rail headline + ladder + mobile bar.
- `CourseCard` fallback (guest, đọc raw entity) **KHÔNG /100**.
→ cùng 1 khóa: rail triệu, modal chục nghìn.

## Luật (STRICT)
- **Giá HIỂN THỊ phải đồng nhất mọi surface.** Non-prod: VND chia `testDivisor` (=100), prod: không chia. USD: charm `.99` (ceil − 0.01), KHÔNG chia (int'l gateway sandbox/test).
- **FE mirror transform của BE qua 1 nguồn:** `publicEnv().pricing.testDivisor` = `NODE_ENV !== "production" ? 100 : 1` (KHỚP BE `LOCAL_TEST_PRICE_DIVISOR` cũng NODE_ENV-gated). Mọi chỗ FE đọc giá RAW từ entity (`usePricingRows`, `CourseCard` fallback) PHẢI áp `÷divisor` (VND) + charm (USD) trước khi hiện. Giá từ `coursePricePreview` (BE đã transform) thì KHÔNG áp lại.
- **Giá từ preview (BE) là chuẩn; FE-raw phải khớp nó.** Khi 1 surface re-derive giá từ entity (vì cần TẤT CẢ phase cho ladder mà preview chỉ trả active) → bắt buộc áp cùng transform. Đây là **ngoại lệ có chủ đích** của [[concepts/single-source-render]] (lý tưởng 1 nguồn, nhưng ladder cần all-phase preview không có → FE mirror, centralize divisor ở `publicEnv` để không scatter).

## ĐÃ ÁP DỤNG 2026-06-24 (FE)
- `publicEnv()` thêm `pricing.testDivisor` (NODE_ENV-gated, mirror BE).
- `usePricingRows`: `toDisplayVnd` (÷divisor, Math.round, min 1) cho mọi phase price + listPrice; `toDisplayUsd` (charm) cho USD. % giảm tính từ giá đã-transform (ratio giữ nguyên).
- `CourseCard`: nhánh fallback (guest) `displayPrice`/`displayOriginal` áp `toVnd`; USD hint charm. Nhánh loyalty (preview) giữ nguyên (đã /100 từ BE).
- Kết quả: rail · catalog · modal · mobile-bar · gate · paywall — VND `12.500/15.000`, USD `$49.99/$59.99` đồng nhất. tsc/eslint sạch.
- **Nợ:** divisor đang duplicate FE↔BE (chấp nhận theo chốt thầy). Cách bỏ duplicate dài hạn: BE expose giá-đã-transform per-phase trên course entity/query → FE chỉ hiện, không mirror. Cân nhắc khi rảnh.