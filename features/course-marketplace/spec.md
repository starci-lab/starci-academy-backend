# Khám phá và mua khóa học

> Business head: `806dbd5d25423c2339cace8b53bac2b9f0c598ca5ef84347bfeae644eb739d8b`
>
> This document is generated from the immutable business model. Update the model through `starci-business-analyze`; do not hand-edit this view.

## 1. Overview

Khách và thành viên duyệt danh mục, mở chi tiết, phân biệt khóa đã sở hữu với khóa để khám phá, đưa khóa vào giỏ và chuyển tới nhà cung cấp thanh toán cho đơn đang chờ xác nhận.

Included:
- Danh mục khóa học
- Chi tiết khóa học
- Giỏ khóa học
- Checkout theo URL nhà cung cấp

Excluded:
- Xác nhận thanh toán trước webhook
- Lịch trả góp chưa được backend hỗ trợ
- Nội dung học sau mua

## 2. Source heads

| Role | Repository | Head |
|---|---|---|
| fe | https://github.com/starci-lab/miamia-fe2.git | `775bc711bafd48675d6dc44beab81fad712a31da` |
| be | https://github.com/starci-lab/miamia-be.git | `9dc84d7278abb34030e8c8e6957e925abe4bef70` |

## 3. Actors and access

### Khách hoặc người mua đã đăng nhập

- Tìm và phân trang khóa học
- Xem giá
- Quản lý giỏ
- Bắt đầu checkout

Evidence: `EV-001`, `EV-002`, `EV-003`

## 4. Entry points and surfaces

### Danh mục khóa học

- ID: `course-catalog`
- Route: `/[lang]/courses`
- Purpose: Tìm khóa học và phân biệt nội dung đã sở hữu với nội dung có thể mua.
- Regions: `course-catalog-content`
- Navigation: none

Evidence: `EV-001`, `EV-002`

### Chi tiết khóa học

- ID: `course-detail`
- Route: `/[lang]/courses/[displayId]`
- Purpose: Giải thích khóa học, chương trình, giá và quyết định mua.
- Regions: `course-detail-content`
- Navigation: none

Evidence: `EV-001`

### Giỏ khóa học

- ID: `course-cart`
- Route: `/[lang]/cart`
- Purpose: Xem các dòng khóa, tổng giá server trả về và bắt đầu checkout.
- Regions: `course-cart-content`
- Navigation: none

Evidence: `EV-001`, `EV-003`

## 5. Business flows

### Khám phá và thanh toán khóa học

Trigger: Người mua mở danh mục hoặc giỏ.

1. **buyer** — Tìm, lọc và mở một khóa học. → Chi tiết khóa được mở hoặc danh mục được phân trang.
2. **buyer** — Đọc chi tiết và chọn mua. → Khóa học được thêm vào giỏ hoặc chuyển sang học nếu đã sở hữu.
3. **buyer** — Xác nhận các dòng và bắt đầu thanh toán. → Người mua được chuyển tới checkoutUrl của provider.

Outcomes:
- Khóa đã sở hữu không xuất hiện như món cần mua
- Checkout chỉ trả URL và giao dịch pending

Evidence: `EV-001`, `EV-002`, `EV-003`

## 6. Business rules

### BR-01

Danh mục tách khóa đã sở hữu khỏi danh sách khám phá và hỗ trợ tìm kiếm, phân trang cùng chế độ grid/line.

Strength: **confirmed** · Evidence: `EV-002`

### BR-02

Checkout không tự ghi danh; người mua chỉ được chuyển tới checkoutUrl và phải chờ webhook xác nhận.

Strength: **partial** · Evidence: `EV-003`

## 7. State model

- **Đang tải hoặc đang xử lý** (`pending`, pending) → ready, empty, error — `EV-001`, `EV-002`, `EV-003`
- **Dữ liệu sẵn sàng** (`ready`, success) → Thực hiện hành động tiếp theo — `EV-001`, `EV-002`, `EV-003`
- **Không có dữ liệu phù hợp** (`empty`, empty) → Đổi bộ lọc, Quay lại — `EV-001`
- **Không thể hoàn tất yêu cầu** (`error`, error) → Thử lại — `EV-001`, `EV-002`, `EV-003`

## 8. Entities and data

- **Ưu đãi khóa học**: id, displayId, title, coverImageUrl, originalPrice, currentPhase, enrollmentCount, isEnrolled — `EV-001`, `EV-002`, `EV-003`
- **Đơn khóa học**: courseIds, paymentType, checkoutUrl, referenceId, transactionId — `EV-001`, `EV-002`, `EV-003`

## 9. Operations and APIs

- **courses** (query, frontend) — input: filters, optional token; output: count, course rows; failures: GraphQL error envelope — `EV-002`, `EV-003`
- **coursesCheckout** (mutation, frontend) — input: courseIds, paymentType, returnUrl, cancelUrl; output: checkoutUrl, referenceId, transactionId; failures: No checkout URL, Provider initiation failure — `EV-002`, `EV-003`

## 10. Acceptance conditions

- **AC-01** Danh mục phải tách owned khỏi discover và phân biệt pending, empty, filtered-empty, failed. — `EV-001`, `EV-002`
- **AC-02** Route chi tiết phải dùng displayId để resolve khóa học. — `EV-001`
- **AC-03** Giỏ không được coi người chưa đăng nhập là giỏ trống và không được báo thành công trước webhook. — `EV-001`, `EV-003`

## 11. Explicit unknowns

- **Resolver current-head nào triển khai courses và coursesCheckout mà FE đang gọi?** — Các operation này chỉ được xác nhận ở FE và phải giữ strength partial cho tới khi BE route hiện tại chứng minh contract.
- **Khi nào backend hỗ trợ lịch trả góp được surface mô tả?** — Không gửi installmentMonths hoặc hiển thị lịch thanh toán như khả năng đã hoạt động.

## 12. Evidence index

| ID | Role | Source | Kind | Claim |
|---|---|---|---|---|
| EV-001 | fe | `src/app/routes.spec.tsx:45` | route | Frontend khai báo route chi tiết và danh mục khóa học. |
| EV-002 | fe | `src/modules/api/graphql/queries/query-courses.ts:8` | api | Danh mục đọc course identity, nội dung, giá, lượt đăng ký và trạng thái sở hữu với optional auth. |
| EV-003 | fe | `src/modules/api/graphql/mutations/mutation-courses-checkout.ts:11` | api | Checkout khóa học trả URL/giao dịch pending, không tự ghi danh và chưa gửi lịch trả góp. |
