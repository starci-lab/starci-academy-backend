# Checkpoint — Trả góp (installment payment): BE mutation "trả kỳ tiếp theo" xong, verify xanh

## 1. Đang làm gì
Thầy muốn thêm option mua trả góp (số tháng góp càng nhiều thì giá tăng % càng nhiều), đồng thời có lứa Pioneer
cũ đang thiếu nợ (trả góp ngoài hệ thống, không lãi) cần đưa vào hệ thống mới. Plan kiến trúc đã chốt từ trước
(`docs/installment-payment-plan.md`). Thầy làm rõ luồng runtime: **cron KHÔNG tạo link thanh toán trước — chỉ
gửi mail + chặn khoá**; user thật sự trả khi mở app, tương tác `PaymentModal` (mode "trả góp" mới) → mutation MỚI
tạo checkout gateway lúc đó. Đã xác nhận kiến trúc đã build khớp ý này (cron không hề đụng gateway).

**Đã xong: BE foundation (entity/service/cron/email) + mutation `payNextInstallment` (trả kỳ hiện tại của 1 plan
đã tồn tại).** **CHƯA làm: mutation checkout MUA MỚI trả góp (installmentMonths trên `coursesCheckout`), reconcile
hook cho lần mua đầu (tạo `Fixed` plan), FE (`PaymentModal` mode trả góp + entry point), backfill script Pioneer.**

## 2. Luồng còn treo
Không có workflow/agent/dev-server nào chạy nền lúc lưu checkpoint này.

## 3. Đã xong / đã chốt (khỏi làm lại) — tsc+eslint sạch, 0 lỗi liên quan "installment"
### 3a. Foundation (phiên trước)
- Enum `InstallmentPlanType`/`InstallmentPlanStatus`, entity `InstallmentPlanEntity` (+ field tự thêm
  `lockedCourseIds: string[]` jsonb — snapshot khoá/mở khi default/catch-up, cần vì Pioneer backfill không có
  `originTransaction`), migration `1722200000000-CreateInstallmentPlans.ts`.
- `InstallmentPlanService`: `computeMinPaymentVnd` (pure) · `createFixedPlan` · `createFlexiblePoolPlan` (backfill)
  · `recordPayment` (advance/trừ pool, tự unlock nếu catch-up) · `lockGatedEnrollments`/`unlockGatedEnrollments`.
- `InstallmentPlanEnforcementCronService` (daily 1AM Asia/Ho_Chi_Minh): day-0 nhắc → day-7 nhắc lần 2 → day-14
  khoá + email. Idempotent qua `dueRemindedAt`/`secondRemindedAt`. **CHỈ gửi mail + khoá — KHÔNG tạo checkout link**
  (khớp đúng ý thầy, đã re-verify code, không có gateway call nào trong cron).
- 3 email helper + template `.pug` (`installment-{due,final-warning,defaulted}`).
- Module wiring: `installment-plan.module.ts` đăng ký global qua `bussiness.module.ts`.

### 3b. MỚI phiên này — mutation `payNextInstallment` (trả kỳ hiện tại)
- **`ActionType.InstallmentPayment`** thêm vào enum (`enums/action-type.ts`) — enum PG dùng chung ≥2 cột
  (`transactions.action_type` + `jobs.action_type`) nên KHÔNG dựa TypeORM `synchronize` để thêm value (sẽ crash
  boot — xem rule `typeorm-synchronize-enum-add-value-trap`), phải `ALTER TYPE … ADD VALUE` migration TRƯỚC.
- **`TransactionEntity.installmentPlanId`** (cột mới, nullable, KHÔNG phải relation — tránh vòng tham chiếu với
  `InstallmentPlanEntity.originTransaction`) — cờ để reconcile-worker biết transaction này trả 1 kỳ của plan nào.
- Migration mới **`1722400000000-AddInstallmentPaymentActionType.ts`**: `ALTER TYPE action_type ADD VALUE` +
  `ALTER TABLE transactions ADD COLUMN installment_plan_id` + FK `ON DELETE SET NULL` (xoá plan không xoá lịch sử
  giao dịch).
- **2 exception mới** (`modules/exceptions/errors/payment/`): `InstallmentPlanNotFoundException` (gộp "không tồn
  tại" + "không phải chủ" — tránh lộ ownership) · `InstallmentPlanNotPayableException` (plan đã `Completed`).
- **`InstallmentPlanService.applyPaymentForTransaction`** (method mới) — mirror `AiEntitlementService.grantTier`:
  idempotency guard (transaction đã `Succeeded` thì no-op) + gọi `recordPayment` + mark transaction `Succeeded`,
  TRỌN trong 1 DB transaction. Được `ReconcileTransactionWorker.finalize()` gọi ở case `ActionType.InstallmentPayment`
  mới (song song `Enroll`/`AiSubscriptionPurchase`/`MembershipPurchase`).
- **Mutation `payNextInstallment(request:{planId,paymentType,returnUrl?,cancelUrl?})`** — CQRS đầy đủ, mirror
  100% cấu trúc `PurchaseMembershipHandler` (fixed-amount charge, KHÔNG cart pricing):
  `src/features/api/core/graphql/mutations/installment-plans/pay-next-installment/` (command/service/resolver/
  handler/module/module-definition/index + `graphql-types/{request,response}` + `types/checkout.ts`).
  - **PayOS + Sepay ONLY** (MVP VND-only theo plan doc) — mọi `paymentType` khác → `BadRequestException` rõ ràng
    (KHÔNG âm thầm charge sai tiền tệ; plan không có giá USD).
  - Ownership check: `plan.userId !== user.id` → `InstallmentPlanNotFoundException` (không lộ tồn tại).
  - `plan.status === Completed` → `InstallmentPlanNotPayableException`.
  - Amount = `installmentPlanService.computeMinPaymentVnd(plan)` — LUÔN đúng 1 kỳ, KHÔNG BAO GIỜ charge cả
    `remainingVnd`/`totalAmountVnd`.
  - **Reuse pending transaction** (mirror membership: cùng plan + cùng provider + còn `Pending` + còn "fresh" theo
    `envConfig().services.api.transaction.timeSinceCreationMs`) — mở modal nhiều lần trước khi trả KHÔNG tạo N
    checkout link rác.
  - Persist `TransactionEntity{actionType:InstallmentPayment, installmentPlanId:plan.id, course:null,
    pricingPhase:Regular, aiSubTier:null}` + enqueue reconcile job — giống hệt pattern `coursesCheckout`/
    `purchaseMembership`.
  - Đăng ký `InstallmentPlansMutationsModule` (group, mirror `MembershipMutationsModule`) trong `mutations.module.ts`.
- **Verify:** `npx tsc --noEmit` toàn repo → 236 lỗi baseline (KHÔNG cái nào chứa "installment", `grep -i installment`
  = 0 dòng — đã tự sửa 1 lỗi của chính mình lúc build, `data: T | null` sai kiểu `IAbstractGraphQLResponse` → sửa
  về `data: T` khớp convention `CoursesCheckoutResponse`/`PurchaseMembershipResponse`). `npx eslint` trên toàn bộ
  file mới/sửa → 0 lỗi.
- **CHƯA runtime-test** (chưa chạy migration thật / chưa gọi mutation qua GraphQL Playground thật — chỉ static
  verify tsc+eslint).

## 4. Bước tiếp theo cụ thể — CHƯA làm
1. **Checkout mutation MUA MỚI trả góp** (lần mua ĐẦU TIÊN, khác `payNextInstallment` — cái đó chỉ trả KỲ TIẾP
   THEO của plan ĐÃ TỒN TẠI): mở rộng `CoursesCheckoutPricingService`/`CoursePricingService` trả `installmentOptions[]`
   (months/markupPercent/totalAmountVnd/monthlyAmountVnd), mở rộng `CoursesCheckoutRequest` nhận
   `installmentMonths?: 3|6|12`, sửa `CoursesCheckoutHandler` chỉ charge kỳ đầu (`monthlyAmountVnd`, KHÔNG
   `totalAmountVnd`) khi có `installmentMonths` — chỉ PayOS/Sepay.
2. **Reconcile-worker hook cho lần mua ĐẦU** (case `ActionType.Enroll`): sau
   `enqueueEnrollJobService.enqueueForTransaction`, nếu transaction có `installmentMonths` (cần thêm cột tương tự
   lên `TransactionEntity`, CHƯA thêm) → gọi `InstallmentPlanService.createFixedPlan` để tạo plan.
3. **Script backfill Pioneer** (`InstallmentPlanService.createFlexiblePoolPlan`, input CSV/JSON từ thầy — CẦN danh
   sách userId/email + `remainingVnd` thật, thầy CHƯA cung cấp).
4. **FE — 3 việc:**
   a. GraphQL mutation FE mirror `payNextInstallment` (query file + generated types + hook, giống
      `mutation-courses-checkout` phía FE).
   b. `PaymentModal` thêm mode "trả góp" — nhận `planId` + `minPaymentVnd` thay vì `courseIds`, gọi mutation mới.
   c. Entry point mở modal ở mode này — TẠM: query-param nhỏ trên 1 trang có sẵn (vd `?payInstallment=<planId>`),
      email CTA trỏ tới đó. `/starci-fe-layout-brainstorm` cho surface đầy đủ "Kế hoạch trả góp của tôi" (list mọi
      plan, hiện cho cả `Fixed` lẫn `FlexiblePool`) là việc SAU, không block phần "trả kỳ tiếp theo" hoạt động được.
5. Verify cron + mutation THẬT: chạy migration, set `nextDueAt` quá khứ trên 1 plan test, gọi `payNextInstallment`
   qua GraphQL Playground, xác nhận transaction pending → (giả lập webhook/reconcile) → `applyPaymentForTransaction`
   chạy đúng, plan advance/unlock đúng.

## 5. Trạng thái git lúc lưu (chỉ phần liên quan)
- Branch: `mtp`. Working tree **CHƯA commit** bất kỳ file nào của checkpoint này.
- File MỚI (phiên trước, chưa commit): xem §3a — enum/entity/migration installment-plan + `bussiness/installment-plan/**`
  + 3 template pug.
- File MỚI (phiên này, chưa commit):
  `src/modules/exceptions/errors/payment/installment-plan-{not-found,not-payable}.ts`
  `src/modules/databases/postgresql/primary/migrations/1722400000000-AddInstallmentPaymentActionType.ts`
  `src/features/api/core/graphql/mutations/installment-plans/**` (toàn bộ group mới)
- File SỬA (phiên này, chưa commit):
  `.../enums/action-type.ts` (thêm `InstallmentPayment`) ·
  `.../entities/transaction.entity.ts` (thêm `installmentPlanId`) ·
  `.../exceptions/errors/payment/index.ts` ·
  `bussiness/installment-plan/installment-plan.service.ts` (thêm `applyPaymentForTransaction`) ·
  `bussiness/installment-plan/types/index.ts` (thêm `ApplyInstallmentPaymentForTransactionParams`) ·
  `features/api/processors/reconcile-transaction/reconcile-transaction.worker.ts` (case mới + inject service) ·
  `features/api/core/graphql/mutations/mutations.module.ts` (đăng ký `InstallmentPlansMutationsModule`).
- ⚠️ Working tree repo này còn RẤT NHIỀU file dở KHÁC không liên quan (job-posting/cv-generation/voucher/
  rag-playground/mock-interview-session enums+migration mới do session khác thêm) — **KHÔNG phải của checkpoint
  này**, đừng commit gộp. Commit của checkpoint này CHỈ gồm đúng danh sách file MỚI + SỬA liệt kê ở §3a + trên
  (+ file checkpoint này).
