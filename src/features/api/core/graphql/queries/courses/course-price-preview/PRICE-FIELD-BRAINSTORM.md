# Brainstorm — `Course.price` ResolveField: 1 nguồn giá (sau giảm + loyalty% + giá gốc gạch) (2026-06-24)

> KHÔNG code — chốt hướng kiến trúc. Mục tiêu: mọi surface (CoursePricingRail · PaymentModal · PremiumGateModal · PremiumPaywall) đọc CÙNG 1 nguồn giá; FE `PriceTag` hiện struck = list, discounted = charge, % = loyalty.

## Sự thật đã đào (BE)
- `coursePricePreview.service` hiện: `originalPriceVnd = resolveAmountVnd({course})` (giá **PHASE**, chưa discount) · `discountedPriceVnd = resolveAmountVnd({course, discountPercent: loyalty})`. → khi loyalty=0, original==discounted → **phẳng**, không hiện giảm.
- **Bug nghĩa "original":** original = giá phase, KHÔNG phải list/MSRP. Nên khoản giảm **list → phase** (rail hiện −21%) không bao giờ lộ ở modal. Phải đổi original = **`course.originalPrice`** (list).
- **Loyalty% = per-USER, KHÔNG per-course** (`computeLoyaltyDiscount(userId)` = enrolledCount×5 + diligent×5, cap 30; 2 read indexed). → tính 1 lần/request là đủ cho cả list course.
- `CourseResolver` đã có ResolveField (`currentPhase`, `enrollmentCount` đọc projection) → thêm `price` khớp pattern.
- Local: `LOCAL_TEST_PRICE_DIVISOR=100` (giá test rẻ) — áp cho cả original & discounted để tỉ lệ + % không đổi.

## 2 hướng
### A. ResolveField `Course.price` (per-viewer, compute on read) ✅ ĐỀ XUẤT
- Thêm `@ResolveField price` trên `CourseResolver` trả `CoursePriceData { originalVnd, discountedVnd, discountPercent, discountReason, enrolledCount, originalUsd, discountedUsd }`.
- `originalVnd` = list (`course.originalPrice`, /100 local) · `discountedVnd` = phase × (1−loyalty) (/100 local) = **số charge thật** · `discountPercent` = loyalty.
- Loyalty% **memoize 1 lần/request** (DataLoader / request-scoped theo userId) → list N course không N+1. Guest (không auth) → loyalty 0.
- Reuse `CoursePricingService` (chỉ thêm 1 method lấy list price) + `LoyaltyDiscountService`. **0 bảng mới.**
- ✅ luôn tươi (loyalty đổi tức thì khi enroll) · ✅ ít hạ tầng · ⚠️ cần optional-auth-user trên resolver.

### B. Projection `user_course_price` (CQRS, precompute)
- Bảng user×course, CDC rebuild khi enroll/streak/phase đổi.
- ❌ nở M×N · ❌ staleness (loyalty phụ thuộc enroll/streak/điểm → rebuild nhiều) · ❌ 7-file/projection cho compute vốn rẻ. → over-engineer.

## CHỐT A — vì sao
Loyalty per-user + compute rẻ (2 read, 1×/request) ⟹ projection user×course không đáng (ngược tinh thần [[feedback-cqrs-no-inline-aggregate]]: projection cho read NẶNG; đây nhẹ). ResolveField compute-on-read đúng tầm: trang course-detail = 1 course (trivial); catalog = memoize loyalty 1 lần + tính giá mỗi course (0 thêm DB). Nếu sau này catalog cực lớn + cần sort theo giá-sau-giảm → mới cân nhắc precompute loyalty% vào `user_stats` (1 row/user, KHÔNG user×course).

## Ảnh hưởng FE
- **Bỏ** query `coursePricePreview` + hook `useQueryCoursePricePreviewSwr`; thay bằng field `price` trong query `course` (đã load ở redux `state.course.entity`).
- `PriceTag` mọi nơi đọc `course.price` (`discountedVnd`/`originalVnd`/`discountPercent`). PaymentModal/Gate/Paywall/Rail cùng 1 field → hết lệch.
- Loyalty reason (enrolledCount/diligent) lấy từ `price.discountReason` + `price.enrolledCount` (PaymentModal loyalty breakdown giữ nguyên).

## Section → dữ liệu
| Field price | Nguồn |
|---|---|
| originalVnd | `course.originalPrice` (list/MSRP), /100 local |
| discountedVnd | active phase price × (1−loyalty), /100 local = charge thật |
| discountPercent | `LoyaltyDiscountService.computeLoyaltyDiscount(userId).percent` (memoized) |
| discountReason · enrolledCount | cùng service |
| originalUsd / discountedUsd | phase priceUsd (như hiện tại) |

## States / a11y
- ResolveField luôn trả `price` (loyalty 0 → original==? : nếu list>phase vẫn có struck phase-discount). Guest → loyalty 0, vẫn hiện phase discount (list→phase).
- FE bọc `AsyncContent` khi `course` đang load (course query đã có sẵn).

→ Widget so sánh đã vẽ trong chat.

## CHỐT 2026-06-24 (thầy) — KHÔNG ResolveField/projection; GIỮ `coursePricePreview` + tweak 1 dòng "original = list"
- Thầy: *"dùng coursePricePreview đi, khỏi sửa [kiến trúc], thầy cần đồng nhất UI thôi… có giá giảm, giá hiện tại, loyalty, discount %, do regular/pioneer"*. → KHÔNG làm `price` ResolveField, KHÔNG projection. Chỉ sửa nghĩa của `originalPriceVnd`.
- **BE (đã làm):** `CoursePricingService` thêm `resolveListAmountVnd` + `resolveListAmountUsd` (= `course.originalPrice`/`originalPriceUsd`, /100 local, KHÔNG discount, fallback phase-amount nếu thiếu list). `CoursePricePreviewService`: `originalPriceVnd/Usd` = **list** (thay vì giá phase); `discountedPriceVnd/Usd` GIỮ = phase × (1−loyalty) = charge thật. → gap = list → charge = **phase tier + loyalty** gộp.
- **FE (đã làm):** mọi `PriceTag` BỎ prop `percent` → chip **tự tính % tổng** từ `originalVnd(list)` → `discountedVnd(charge)` (không chỉ loyalty). 4 nơi đọc cùng coursePricePreview/usePricingRows → struck=list, hiện tại=charge, %=tổng. Hết phẳng khi loyalty=0 (vì list>phase → luôn có gap ở Pioneer/Early-bird; Regular thì list==phase → không strike, đúng).
- **Còn ngỏ:** nhãn phase chữ ("Giá Pioneer/Early-bird") + dòng loyalty reason — PaymentModal/Gate đã có loyalty breakdown; phase label hiển thị qua chính khoản giảm. Thêm label chữ nếu thầy cần (course.currentPhase ở redux, không đụng BE).
