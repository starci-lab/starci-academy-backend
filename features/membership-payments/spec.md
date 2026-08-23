# Membership, gói tải đề và thanh toán

> Business head: `f1a2dcfee6c5e0b2cbbdc5a7855362040b4954c9cdbedfb58f3759d31d910966`
>
> This document is generated from the immutable business model. Update the model through `starci-business-analyze`; do not hand-edit this view.

## 1. Overview

Khách đọc catalog giá do server sở hữu; thành viên chọn membership hoặc gói tải đề, nhận checkout URL và chỉ được cấp quyền sau khi transaction được provider xác nhận.

Included:
- Public pricing catalog
- Membership monthly/yearly
- Exam download packages
- Provider checkout
- Payment status reconciliation

Excluded:
- Course-cart checkout
- Lịch trả góp khóa học
- Quản trị giá

## 2. Source heads

| Role | Repository | Head |
|---|---|---|
| fe | https://github.com/starci-lab/miamia-fe2.git | `775bc711bafd48675d6dc44beab81fad712a31da` |
| be | https://github.com/starci-lab/miamia-be.git | `9dc84d7278abb34030e8c8e6957e925abe4bef70` |

## 3. Actors and access

### Khách xem giá hoặc thành viên mua quyền

- So sánh membership
- Xem entitlement
- Mua membership
- Mua gói tải đề
- Theo dõi trạng thái thanh toán

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`

## 4. Entry points and surfaces

### Gói MiaMia

- ID: `pricing`
- Route: `/[lang]/pricing`
- Purpose: So sánh membership và gói tải đề bằng dữ liệu server-owned.
- Regions: `pricing-content`
- Navigation: none

Evidence: `EV-001`, `EV-002`, `EV-003`

### Trạng thái thanh toán

- ID: `payment-return`
- Route: `provider-return-url (không có page chuyên biệt trong FE current head)`
- Purpose: Diễn giải pending/succeeded/unpaid từ transaction thay vì tự suy luận theo redirect.
- Regions: `payment-return-content`
- Navigation: none

Evidence: `EV-003`, `EV-004`

## 5. Business flows

### Mua quyền truy cập

Trigger: Khách mở /[lang]/pricing và chọn một offer.

1. **customer** — So sánh và chọn offer. → Checkout details được tạo cho thành viên hoặc yêu cầu đăng nhập được mở.
2. **customer** — Trở về từ provider và kiểm tra trạng thái. → Succeeded cấp quyền; Unpaid không cấp; Pending tiếp tục chờ.

Outcomes:
- Checkout transaction được tạo
- Membership hoặc entitlement chỉ cấp khi paid
- Expired/unpaid không cấp quyền

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`

## 6. Business rules

### BR-01

Pricing catalog public do server trả membership price/entitlements và exam-download packages.

Strength: **confirmed** · Evidence: `EV-002`

### BR-02

Purchase membership chỉ tạo checkout details; quyền membership được cấp khi reconciliation xác nhận paid.

Strength: **confirmed** · Evidence: `EV-003`, `EV-004`

### BR-03

Giao dịch paid được settle idempotent; unpaid/expired không cấp membership hoặc download entitlement.

Strength: **confirmed** · Evidence: `EV-004`

## 7. State model

- **Đang tải hoặc đang xử lý** (`pending`, pending) → ready, empty, error — `EV-001`, `EV-002`, `EV-003`, `EV-004`
- **Dữ liệu sẵn sàng** (`ready`, success) → Thực hiện hành động tiếp theo — `EV-001`, `EV-002`, `EV-003`, `EV-004`
- **Không có dữ liệu phù hợp** (`empty`, empty) → Đổi bộ lọc, Quay lại — `EV-001`
- **Không thể hoàn tất yêu cầu** (`error`, error) → Thử lại — `EV-001`, `EV-002`, `EV-003`, `EV-004`

## 8. Entities and data

- **Ưu đãi membership**: enabled, monthlyPriceVnd, yearlyPriceVnd, demoPaperLimit, aiCreditsPerDay, entitlements — `EV-001`, `EV-002`, `EV-003`, `EV-004`
- **Gói tải đề**: packageId, priceVnd, continuousUpdates, zaloSupport, commercialTeaching, brandPromotionMonths — `EV-001`, `EV-002`, `EV-003`, `EV-004`
- **Giao dịch**: transactionId, referenceId, amount, status, checkoutUrl — `EV-001`, `EV-002`, `EV-003`, `EV-004`

## 9. Operations and APIs

- **pricingCatalog** (query, backend) — input: none; output: membership offer, exam download packages; failures: Catalog disabled, GraphQL error — `EV-002`, `EV-003`, `EV-004`
- **purchaseMembership** (mutation, backend) — input: membership request, authenticated customer; output: checkoutUrl, referenceId, transactionId, amount, checkoutFields; failures: Offer disabled, Provider initiation failure — `EV-002`, `EV-003`, `EV-004`
- **reconcile transaction poll** (event, backend) — input: transaction id, provider status; output: Succeeded/Unpaid/Pending, membership or entitlement grant; failures: Provider unknown, Amount mismatch — `EV-002`, `EV-003`, `EV-004`

## 10. Acceptance conditions

- **AC-01** Pricing không được hard-code price/entitlement ngoài catalog server trả về. — `EV-001`, `EV-002`, `EV-003`
- **AC-02** Redirect về không được coi là paid; chỉ reconciliation provider xác nhận mới cấp quyền. — `EV-003`, `EV-004`

## 11. Explicit unknowns

- **Route FE nào sở hữu payment-return status cho membership và exam download?** — Business surface giữ routePattern mô tả provider-return vì current FE không có page chuyên biệt; design không được tự chọn route.
- **Giá và entitlement production hiện tại là gì tại runtime?** — Không ghi số đại diện vào prototype; phải render dữ liệu pricingCatalog thật.

## 12. Evidence index

| ID | Role | Source | Kind | Claim |
|---|---|---|---|---|
| EV-001 | fe | `src/app/routes.spec.tsx:8` | route | Frontend khai báo Pricing và Cart nhưng không có payment-return page chuyên biệt. |
| EV-002 | fe | `src/modules/api/graphql/queries/query-miamia-pricing-catalog.ts:5` | api | Public pricing query đọc membership prices/entitlements và exam-download package properties. |
| EV-003 | fe | `src/modules/api/graphql/mutations/mutation-purchase-membership.ts:7` | api | Membership purchase trả checkout URL, references, transaction, amount và checkout fields. |
| EV-004 | be | `test/e2e/reconcile-transaction.e2e-spec.ts:475` | test | Paid transaction cấp membership hoặc exam-download entitlement đúng một lần; unpaid không cấp quyền. |
