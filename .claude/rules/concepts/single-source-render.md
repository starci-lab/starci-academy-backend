# Concept — 1 đại lượng = 1 component render dùng chung (đừng copy logic hiển thị ra N nơi)

> Heuristic (họ `concepts/*`). Rút từ vụ giá khóa học render ở 4 nơi, lệch logic → bug "không thấy giảm" (2026-06-24).

## Quy tắc (STRICT)
- **Một ĐẠI LƯỢNG hiển thị nhiều nơi (giá, tiến độ, trạng thái, rating…) phải có ĐÚNG 1 component render dùng chung.** Khi cùng 1 thứ (vd "giá đã giảm = discounted + struck + −%") xuất hiện ở ≥2 surface → tách thành **1 block** (vd `PriceTag`), mọi nơi import. KHÔNG copy đoạn JSX + logic tính (gate, %, format) sang từng feature.
- **Vì sao:** copy ra N nơi = N bản logic phải đồng bộ tay. Sửa/đúng 1 bản, quên bản khác → **lệch ngầm**. Vụ giá: `discountPercent>0` gate đúng ở 1 chỗ, sai (ẩn giảm) ở 3 chỗ khác vì mỗi nơi tự viết. Gom về 1 block = sửa 1 lần, đúng mọi nơi.
- **Ranh giới block vs feature:** block lo **TRÌNH BÀY** (format, gate hiển thị, cỡ chữ). Feature lo **TÍNH SỐ** (chọn loyalty vs phase, đổi tiền tệ, nguồn data) rồi **truyền số đã tính** vào block. Đừng nhét business logic (loyalty/USD/phase) vào block — chỉ truyền kết quả.
- **Dấu hiệu cần tách:** thấy mình copy 1 cụm JSX "render X" + vài dòng tính sang file thứ 2 → DỪNG, tách block. Đặc biệt thứ có **quy tắc dễ sai** (gate discount, làm tròn %, format tiền) — sai 1 nơi là bug thầm lặng.

## Áp đầu (2026-06-24)
- Giá khóa render ở `PaymentModal` · `PremiumGateModal` · `PremiumPaywall` · `CoursePricingRail` → gom về block **`PriceTag`** ([[elements/price]]). Gate theo chênh lệch giá thật (không theo loyalty flag) → hết bug "không thấy giảm". Feature truyền `discountedVnd/originalVnd/percent`; block lo render.
