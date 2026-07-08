# Plan — Trả góp (installment payment) + xử lý nợ Pioneer cũ

> 2026-07-05. Yêu cầu gốc: thêm option mua trả góp, số tháng góp càng nhiều thì giá tăng % càng nhiều. Bối cảnh:
> lứa Pioneer hiện có vài người trả góp (ngoài hệ thống, không lãi) đang thiếu nợ; lứa mới muốn có option trả góp.
> Repo BE: `C:\Repositories\ac\starci-academy-backend`. Repo FE: `C:\Repositories\starci-academy`.

## 0. Quyết định đã chốt (thầy duyệt 2026-07-05)
| Câu hỏi | Chốt |
|---|---|
| Nợ Pioneer cũ (không lãi) | **Giữ giá cũ (KHÔNG cộng markup hồi tố), chỉ đưa vào hệ thống để TRACK + enforcement** — công bằng với người đã mua, chỉ siết kỷ luật trả. |
| Thu kỳ sau (không cổng nào auto-charge) | **Tự sinh link thanh toán mới mỗi kỳ + nhắc (email/notification) + cron tự khoá quyền truy cập nếu trễ quá grace period.** |
| Markup theo tháng (lứa MỚI, lịch cố định) | **3 tháng +5% · 6 tháng +10% · 12 tháng +20%** (config-driven, dễ chỉnh sau). |
| Phạm vi MVP | **VND only** (PayOS/Sepay — khớp văn hoá trả góp VN, USD gateway không hỗ trợ tốt) + **áp dụng cả cho cart nhiều khóa** (không chỉ 1 khóa/đơn). |
| **Nợ Pioneer = POOL linh hoạt, không phải lịch cố định** (chốt 2026-07-05 vòng 2) | Mỗi học viên có 1 **số dư nợ (pool)** thật (vd còn 5tr / còn 6tr — SỐ THẬT khác nhau từng người, không chia đều theo tháng cố định). Mỗi lần trả TRỪ THẲNG vào pool (không phải "kỳ thứ N/M"). **Mức trả tối thiểu mỗi tháng = `max(10% số dư pool hiện tại, 500.000đ)`** — 10% tính lại theo số dư CÒN LẠI mỗi chu kỳ (giảm dần khi pool nhỏ đi), nhưng KHÔNG BAO GIỜ dưới sàn 500k. Trả nhiều hơn mức tối thiểu (trả nhanh hơn) luôn được phép. |

## 1. Hiện trạng (research 2026-07-05, 2 agent song song)
- **Chưa có bất kỳ cơ chế trả góp nào.** `EnrollmentEntity.is_enrolled` chỉ nhị phân (paid/trial). `TransactionEntity` = 1 giao dịch = 1 số tiền trọn gói, KHÔNG có field số dư/nợ/lịch trả. Grep toàn backend "installment/partial/debt/outstanding" → 0 kết quả thật.
- **Cả 5 cổng (PayOS/Sepay/Stripe/PayPal/NOWPayments) đều one-shot** — không cổng nào tự động charge định kỳ.
- **Pattern gần nhất:** Membership/AI Subscription (`membership.entity.ts` + `MembershipService`) — `currentPeriodEnd` + cron `expireDue()` quét hết hạn → `Expired`. Đây là "1 lần trả = gia hạn 1 kỳ MỞ", KHÁC "N kỳ cố định tới 1 tổng tiền", nhưng **tái dùng được ý tưởng cron quét quá hạn + idempotent grant per transaction**.
- **Cart/checkout hiện tại** (`courses-checkout-pricing.service.ts`): progressive loyalty (dòng sau coi như đã sở hữu dòng trước) + bundle bonus (+5% 2 khóa / +10% 3+ khóa) trên TOÀN đơn. `CoursesCheckoutPreviewData` trả `lines[]` + `totalChargedVnd/Usd`.
- **FE:** `PaymentModal` đã có sẵn slot summary (PriceTag breakdown) + currency toggle + gateway list — chỗ để chèn "chọn số tháng" nằm giữa summary và currency/gateway. `PriceTag` block đã hỗ trợ `breakdown` tooltip (list→phase→loyalty→charged) — cần mở rộng thêm 1 tầng "→ trả góp".
- **Không có UI nào** để user xem/thanh toán kỳ tiếp theo (cần dựng mới — 1 surface "Kế hoạch trả góp của tôi").

## 2. Kiến trúc đề xuất (BE)

### 2.1 Entity mới `InstallmentPlanEntity` — 2 MODE trong CÙNG 1 entity
> Chốt vòng 2: KHÔNG dùng 1 lịch cố định cho cả 2 nhóm. `planType` phân biệt "lứa mới mua mới" (lịch cố định N
> tháng, có markup) vs "Pioneer nợ cũ" (pool linh hoạt, trả bao nhiêu trừ bấy nhiêu, không markup). Dùng chung 1
> entity + 1 cron enforcement (đỡ trùng lặp hạ tầng nhắc/khoá), khác nhau ở CÁCH TÍNH `minPaymentVnd` mỗi chu kỳ.

```
- id
- userId, courseId (hoặc transactionId gốc nếu cart nhiều khóa — xem §2.3)
- planType              // "Fixed" (lứa mới) | "FlexiblePool" (Pioneer nợ cũ)

--- Fixed mode only ---
- months                // 3 | 6 | 12
- monthlyAmountVnd      // totalAmountVnd / months (làm tròn, dồn số dư lẻ vào kỳ cuối)
- totalAmountVnd        // tổng đã cộng markup (giá gốc sau loyalty/bundle * (1+markupPercent))
- markupPercent         // snapshot % đã áp dụng lúc mua (KHÔNG đổi ngược khi config sau này đổi biểu markup)
- installmentsPaid      // đếm số kỳ đã trả (bắt đầu = 1 sau khi trả kỳ đầu lúc checkout)

--- FlexiblePool mode only ---
- remainingVnd          // SỐ DƯ NỢ THẬT còn lại (vd 5.000.000 / 6.000.000 — riêng từng người, KHÔNG chia đều)
- minPaymentFloorVnd    // sàn tối thiểu tuyệt đối — mặc định 500.000đ (config)
- minPaymentPercent     // % tối thiểu tính trên remainingVnd hiện tại — mặc định 10% (config)
                        // → mức phải trả kỳ này = max(remainingVnd * minPaymentPercent, minPaymentFloorVnd)
                        //   (10% TÍNH LẠI theo remainingVnd MỚI mỗi chu kỳ, giảm dần khi pool nhỏ đi;
                        //    KHÔNG BAO GIỜ dưới 500k — pool nhỏ tới mấy vẫn phải trả tối thiểu 500k)

--- Chung cả 2 mode ---
- nextDueAt             // ngày đến hạn chu kỳ tiếp theo (Fixed: +1 tháng cố định; FlexiblePool: lastPaidAt hoặc
                        //   createdAt + 1 tháng — cùng cơ chế, chỉ khác cách tính SỐ TIỀN phải trả)
- gracePeriodDays        // config, mặc định (đề xuất) 7 ngày nhắc + 14 ngày tổng trước khi khoá
- status                // Active | Overdue | Defaulted | Completed
- createdAt/updatedAt
```
- **Vì sao 1 entity, không 2 bảng riêng:** cron enforcement (nhắc → khoá) + surface FE "Kế hoạch trả góp của tôi"
  dùng CHUNG hạ tầng cho cả 2 mode — chỉ khác công thức tính `minPaymentVnd` mỗi chu kỳ. Tránh trùng lặp cron/service.
- **Trả NHIỀU hơn mức tối thiểu luôn được phép** (cả 2 mode) — FlexiblePool đặc biệt khuyến khích trả nhanh (pool
  giảm nhanh → % tối thiểu của chu kỳ sau cũng giảm theo, vì tính trên số dư MỚI).

### 2.2 Luồng checkout (kỳ đầu)
1. User ở `PaymentModal` chọn "Trả góp" + số tháng (3/6/12) thay vì "Trả 1 lần".
2. FE gọi preview mới (mở rộng `coursePricePreview`/`coursesCheckoutPreview`): trả thêm `installmentOptions: [{months, markupPercent, totalAmountVnd, monthlyAmountVnd}]` để `PriceTag` breakdown hiện đúng.
3. Checkout mutation nhận thêm `installmentMonths?: 3|6|12` (optional — null = trả 1 lần như cũ, KHÔNG đổi hành vi mặc định).
4. Cổng thanh toán (PayOS/Sepay) chỉ charge **`monthlyAmountVnd` của kỳ đầu** (KHÔNG phải `totalAmountVnd`) — `TransactionEntity.amount` = kỳ đầu, gắn thêm `installmentPlanId` (nullable FK) để reconcile-worker biết đây là 1 phần của plan.
5. Reconcile-worker: khi transaction Succeeded → nếu có `installmentPlanId` → tạo `InstallmentPlanEntity` (nếu chưa có, kỳ đầu) HOẶC tăng `installmentsPaid` (kỳ sau) → set `is_enrolled=true` NGAY từ kỳ đầu (cấp full access, tin tưởng — chuẩn thị trường trả góp tiêu dùng) → set `nextDueAt = now + 1 tháng`.

### 2.3 Cart nhiều khóa (theo phạm vi đã chốt)
- Markup áp lên **`totalChargedVnd` của TOÀN cart** (sau bundle bonus + loyalty per-line) — KHÔNG áp riêng từng dòng rồi cộng (tránh lệch làm tròn + tránh markup "ăn" 2 lần logic bundle).
- `InstallmentPlanEntity` gắn theo **transaction gốc** (1 plan / 1 checkout), không phải 1 plan / 1 khóa — vì user trả 1 khoản gộp mỗi tháng cho cả cart, giống cách `TransactionEntity` hiện tại đã gộp cart thành 1 giao dịch (`TransactionItemEntity` list các khóa bên trong).
- Khi plan bị `Defaulted` (khoá quyền) → khoá **tất cả khóa trong plan đó** (set `is_enrolled=false` cho mọi enrollment liên quan tới transaction gốc) — nhất quán, không khoá lẻ từng khóa.

### 2.4 Thu kỳ sau + enforcement (cron) — DÙNG CHUNG cho cả 2 mode
- Trước mỗi chu kỳ, tính **`minPaymentVnd` của chu kỳ đó** theo mode:
  - `Fixed`: `minPaymentVnd = monthlyAmountVnd` (số cố định, snapshot lúc mua).
  - `FlexiblePool`: `minPaymentVnd = max(remainingVnd * minPaymentPercent, minPaymentFloorVnd)` — **tính lại theo
    `remainingVnd` HIỆN TẠI** mỗi chu kỳ (không phải số dư ban đầu) → càng trả nhiều, mức tối thiểu chu kỳ sau
    càng giảm, nhưng KHÔNG BAO GIỜ dưới `minPaymentFloorVnd` (500k).
- Cron hàng ngày (mirror `membership.expireDue()`): tìm `InstallmentPlanEntity` có `nextDueAt` đã qua:
  - **Ngày 0 (đến hạn):** gửi reminder (email/notification) kèm link thanh toán mới — số tiền gợi ý = `minPaymentVnd`
    vừa tính (PayOS/Sepay tạo link; `FlexiblePool` cho phép user SỬA số tiền lên cao hơn min khi trả, `Fixed` thì
    số tiền cố định không cho sửa) → set `status=Overdue`.
  - **Qua `gracePeriodDays` (đề xuất 7 ngày) mà vẫn chưa trả đủ `minPaymentVnd`:** nhắc lại lần 2 (cảnh báo sắp khoá).
  - **Qua tổng ~14 ngày mà vẫn chưa trả đủ:** `status=Defaulted` → khoá enrollment(s) liên quan (`is_enrolled=false`).
    Đây chính là cơ chế giải quyết "thiếu mà không sao" của lứa Pioneer — plan mới có RÀNG BUỘC thật.
- **Khi user trả (qua link hoặc chủ động vào "Kế hoạch trả góp của tôi"):**
  - `Fixed`: webhook/reconcile → tăng `installmentsPaid`, `nextDueAt += 1 tháng`; `installmentsPaid === months` →
    `Completed`.
  - `FlexiblePool`: webhook/reconcile → **trừ số tiền THẬT đã trả vào `remainingVnd`** (phải ≥ `minPaymentVnd` của
    chu kỳ để coi là "đã trả đúng hạn"; trả DƯỚI min vẫn ghi nhận giảm `remainingVnd` nhưng KHÔNG tính là qua chu
    kỳ — vẫn `Overdue` cho tới khi đủ min) → `nextDueAt = paymentDate + 1 tháng`; `remainingVnd <= 0` → `Completed`.
  - Nếu đang `Defaulted` mà trả bù đủ min → mở khoá lại (`is_enrolled=true`) + `status=Active` (KHÔNG phạt thêm,
    chỉ enforcement bằng khoá quyền — không phải late fee, giữ đơn giản v1).

### 2.5 Migrate nợ Pioneer cũ (mode `FlexiblePool`)
- Cần **admin tool** (script/CLI, KHÔNG cần UI công khai) để thầy backfill: với mỗi user Pioneer đang thiếu
  (danh sách thầy có sẵn ngoài hệ thống — vd "A còn nợ 5.000.000đ", "B còn nợ 6.000.000đ") → tạo
  `InstallmentPlanEntity` với:
  - `planType = "FlexiblePool"`.
  - `remainingVnd` = **số dư nợ THẬT còn lại** (5tr/6tr/... — số riêng từng người, KHÔNG chia đều theo tháng).
  - `minPaymentPercent = 10%`, `minPaymentFloorVnd = 500.000đ` (theo quyết định §0 — dùng chung config mặc định,
    trừ khi thầy muốn set khác cho từng ca đặc biệt).
  - `markupPercent`/`months`/`monthlyAmountVnd` = bỏ trống (không dùng ở mode này — không cộng lãi hồi tố).
  - `nextDueAt` = ngày thầy quyết cho kỳ tiếp theo (có thể cho grace period rộng hơn lần đầu vì họ chưa từng bị
    nhắc/enforce).
- Sau backfill, các plan này chạy chung 1 cron enforcement với plan mới (§2.4) → từ giờ họ mới thực sự chịu áp lực
  "trễ thì bị khoá" (đúng ý thầy: hiện KHÔNG có ràng buộc, giờ có) — nhưng KHÔNG bị tính thêm lãi trên số nợ gốc.

## 3. Kiến trúc đề xuất (FE)
1. **`PaymentModal`** — thêm 1 bước chọn "Trả 1 lần / Trả góp" (block `FlexWrapButtonRadio` hoặc `SelectableCardGroup`, xem `.claude/rules/elements/card.md` §3e/§3f — tái dùng, KHÔNG tự chế). Chọn "Trả góp" → hiện thêm `FlexWrapButtonRadio` chọn 3/6/12 tháng, mỗi option hiện `monthlyAmountVnd` + tổng `totalAmountVnd`.
2. **`PriceTag` breakdown** mở rộng thêm dòng "Trả góp {months} tháng (+{markupPercent}%)" khi có installment — theo pattern breakdown đã có (list→phase→loyalty→**trả góp**→charged kỳ đầu).
3. **Surface mới "Kế hoạch trả góp của tôi"** (`/profile/settings/installments` hoặc gộp vào 1 trang settings có sẵn)
   — list các `InstallmentPlan` đang active, render KHÁC nhau theo `planType`:
   - `Fixed`: tiến độ "đã trả N/M kỳ", số tiền kỳ tới CỐ ĐỊNH (`monthlyAmountVnd`), nút "Trả kỳ này" (số tiền không
     sửa được).
   - `FlexiblePool`: tiến độ "còn nợ `remainingVnd`đ", **mức tối thiểu kỳ này = `minPaymentVnd` (tính động, hiện rõ
     công thức "10% số dư hiện tại, tối thiểu 500k")**, ô nhập số tiền muốn trả (mặc định = `minPaymentVnd`, cho
     phép SỬA LÊN cao hơn để trả nhanh — không cho sửa xuống dưới `minPaymentVnd`), nút "Trả".
   - Cả 2: hạn kỳ tiếp (`nextDueAt`), trạng thái (Active/Overdue/Defaulted, màu semantic — KHÔNG accent, theo
     `.claude/rules/elements/color.md`).
4. Cần brainstorm layout riêng cho surface mới này (`/starci-fe-layout-brainstorm`) khi tới bước implement — chưa vẽ
   ở đây vì plan này tập trung cơ chế, chưa phải layout. Layout phải cover CẢ 2 dạng render (`Fixed` số cố định vs
   `FlexiblePool` ô nhập số tiền linh hoạt) như 2 state khác nhau của cùng 1 danh sách.

## 4. Việc CẦN thầy cung cấp thêm khi bắt đầu implement (không suy ra được)
- **Danh sách Pioneer đang thiếu nợ** (userId/email + `remainingVnd` còn lại — vd A: 5.000.000đ, B: 6.000.000đ) để
  chạy backfill §2.5. (Mức tối thiểu 10%/500k đã chốt dùng chung, không cần thầy nhập riêng từng người trừ khi có
  ca đặc biệt muốn khác.)
- **`gracePeriodDays` chính xác** (đề xuất 7 ngày nhắc / 14 ngày tổng trước khoá — thầy xác nhận hoặc chỉnh).
- **Kênh nhắc** — email (đã có `@modules/transactional-email` theo memory) hay in-app notification hay cả hai.
- Xác nhận **KHÔNG có late fee** (chỉ khoá quyền truy cập là hình phạt duy nhất) — hay muốn thêm phạt trễ nhỏ.

## 5. Thứ tự triển khai đề xuất (khi thầy duyệt bắt đầu code)
1. **BE**: entity `InstallmentPlanEntity` + migration · mở rộng `CoursesCheckoutPreviewService`/`CoursePricingService` tính `installmentOptions` · mở rộng checkout mutation nhận `installmentMonths` · reconcile-worker gắn `installmentPlanId` · cron enforcement (mirror `membership.expireDue()`) · mutation "trả kỳ tiếp theo" (tạo payment link mới cho `monthlyAmountVnd`).
2. **BE**: script backfill Pioneer arrears (chạy 1 lần, có input file/CSV từ thầy).
3. **FE**: `/starci-fe-layout-brainstorm` cho surface "Kế hoạch trả góp của tôi" → `/starci-fe-ux-apply` dựng.
4. **FE**: `PaymentModal` thêm bước chọn trả góp (mở rộng, KHÔNG đổi luồng trả 1 lần mặc định).
5. Verify: tsc/eslint + test cron enforcement bằng cách set `nextDueAt` giả trong quá khứ.
