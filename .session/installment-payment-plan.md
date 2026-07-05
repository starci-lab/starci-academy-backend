# Checkpoint — Trả góp (installment payment): đang ở giai đoạn PLAN, chưa code

## 1. Đang làm gì
Thầy muốn thêm option mua trả góp (số tháng góp càng nhiều thì giá tăng % càng nhiều), đồng thời có lứa Pioneer
cũ đang thiếu nợ (trả góp ngoài hệ thống, không lãi) cần đưa vào hệ thống mới. Đang lên PLAN kiến trúc (BE entity +
cron enforcement + FE surface), **CHƯA viết code**.

## 2. Luồng còn treo
Không có workflow/agent/dev-server nào chạy nền. 2 Explore agent nghiên cứu (BE pricing/enrollment/payment + FE
checkout UI) đã hoàn tất từ trước, không cần check lại.

## 3. Đã xong / đã chốt (khỏi làm lại)
- **Plan đầy đủ đã ghi tại `docs/installment-payment-plan.md`** (repo này) — đọc file đó để có toàn bộ chi tiết.
- Quyết định đã chốt (không cần hỏi lại):
  - **2 mode trong 1 entity `InstallmentPlanEntity`:**
    - `Fixed` (lứa mới mua mới) — lịch cố định 3/6/12 tháng, markup snapshot **+5%/+10%/+20%**.
    - `FlexiblePool` (Pioneer nợ cũ) — số dư nợ pool THẬT riêng từng người (vd 5tr/6tr), mỗi lần trả trừ thẳng vào
      pool, mức tối thiểu mỗi chu kỳ = **`max(10% số dư HIỆN TẠI, sàn 500.000đ)`** (10% tính lại theo số dư mới
      mỗi chu kỳ, không bao giờ dưới 500k), **KHÔNG cộng lãi hồi tố** lên nợ cũ.
  - **Cron enforcement dùng chung cho cả 2 mode** (mirror pattern `membership.expireDue()` đã có sẵn trong repo):
    đến hạn → nhắc + sinh link thanh toán mới (không cổng nào trong PayOS/Sepay/Stripe/PayPal/NOWPayments tự động
    charge định kỳ được) → ~7 ngày nhắc lại → ~14 ngày tổng chưa trả đủ min → khoá `is_enrolled=false`
    (`Defaulted`). Trả bù đủ min → mở khoá lại.
  - **Phạm vi MVP:** VND only (PayOS/Sepay), áp dụng cả cho cart nhiều khóa (markup/pool gắn theo **transaction
    gốc**, không phải theo từng khóa lẻ).

## 4. Bước tiếp theo cụ thể
1. Bổ sung nốt 4 điểm còn thiếu (liệt kê ở `docs/installment-payment-plan.md` §4) trước khi code:
   - Danh sách Pioneer đang thiếu nợ thật (userId/email + `remainingVnd` từng người) để chạy backfill.
   - `gracePeriodDays` chính xác (đề xuất 7 ngày nhắc / 14 ngày tổng trước khoá — chưa final).
   - Kênh nhắc: email hay in-app notification hay cả hai.
   - Xác nhận KHÔNG có late fee (đề xuất chỉ khoá quyền là hình phạt duy nhất) hay muốn thêm phạt trễ nhỏ.
2. Sau khi có đủ 4 điểm trên, code theo thứ tự ở `docs/installment-payment-plan.md` §5:
   - BE: entity `InstallmentPlanEntity` + migration → mở rộng pricing service tính `installmentOptions` → mở
     rộng checkout mutation nhận `installmentMonths` → reconcile-worker gắn `installmentPlanId` → cron
     enforcement → mutation "trả kỳ tiếp theo".
   - BE: script backfill Pioneer arrears (1 lần, input từ thầy).
   - FE: `/starci-fe-layout-brainstorm` cho surface mới "Kế hoạch trả góp của tôi" (phải cover 2 dạng render:
     `Fixed` số cố định vs `FlexiblePool` ô nhập số tiền linh hoạt) → `/starci-fe-ux-apply` dựng.
   - FE: `PaymentModal` thêm bước chọn trả góp (không đổi luồng trả 1 lần mặc định).
   - Verify: tsc/eslint + test cron bằng cách set `nextDueAt` giả trong quá khứ.

## 5. Trạng thái git lúc lưu (chỉ file liên quan việc này)
- Branch: `mtp`.
- File MỚI liên quan checkpoint này: `docs/installment-payment-plan.md` (untracked, CHƯA commit).
- ⚠️ Working tree repo này còn RẤT NHIỀU file dở KHÁC không liên quan (mock-interview/flashcard/job-readiness...,
  các rule draft khác, skill `starci-fe-critique`/`starci-fe-layout-brainstorm` mới) — **KHÔNG phải của checkpoint
  này**, đừng commit gộp khi resume việc trả góp. Commit của checkpoint này CHỈ gồm
  `.session/installment-payment-plan.md` + `docs/installment-payment-plan.md`.
