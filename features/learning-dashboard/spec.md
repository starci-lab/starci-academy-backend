# Trung tâm học tập cá nhân

> Business head: `3590f9b4e7bb17050a6097bc4fd83741e1ce473f8c7e155a388f4ab6cbcdd1be`
>
> This document is generated from the immutable business model. Update the model through `starci-business-analyze`; do not hand-edit this view.

## 1. Overview

Dashboard chỉ mở khi có phiên và tổ chức tổng quan, khám phá, khóa học và cộng đồng thành các tab; các khối đọc tiến độ, mục tiêu, hoạt động và gợi ý độc lập.

Included:
- Dashboard có kiểm soát phiên
- Bốn tab overview/explore/courses/community
- Điểm tiếp tục học

Excluded:
- Định nghĩa lại dữ liệu của từng widget
- Chat cộng đồng chuyên dụng
- Quản trị nội dung dashboard

## 2. Source heads

| Role | Repository | Head |
|---|---|---|
| fe | https://github.com/starci-lab/miamia-fe2.git | `775bc711bafd48675d6dc44beab81fad712a31da` |
| be | https://github.com/starci-lab/miamia-be.git | `9dc84d7278abb34030e8c8e6957e925abe4bef70` |

## 3. Actors and access

### Học viên đã xác thực

- Xem tổng quan học tập
- Chuyển giữa các tab dashboard
- Tiếp tục nội dung gần nhất

Evidence: `EV-001`, `EV-002`, `EV-003`

## 4. Entry points and surfaces

### Dashboard

- ID: `dashboard`
- Route: `/[lang]/dashboard`
- Purpose: Đưa người học tới tổng quan và các nhóm nội dung chính.
- Regions: `dashboard-content`
- Navigation: none

Evidence: `EV-001`, `EV-002`

## 5. Business flows

### Mở trung tâm học tập

Trigger: Thành viên mở /[lang]/dashboard.

1. **learner** — Khôi phục phiên và chọn tab yêu cầu. → Dashboard hợp lệ được mount hoặc người đọc được chuyển sang xác thực.

Outcomes:
- Người chưa có token được đưa tới /authentication
- Thành viên thấy tab hợp lệ hoặc overview mặc định

Evidence: `EV-001`, `EV-002`, `EV-003`

## 6. Business rules

### BR-01

Dashboard không mount nội dung khi chưa có session token và chuyển người đọc sang /authentication.

Strength: **confirmed** · Evidence: `EV-002`

### BR-02

Chỉ overview, explore, courses và community là tab hợp lệ; giá trị khác trở về overview.

Strength: **confirmed** · Evidence: `EV-002`

### BR-03

ContinueLearning trả con trỏ topic, paper và reviewPhrase cho người dùng đã xác thực.

Strength: **partial** · Evidence: `EV-003`

## 7. State model

- **Đang tải hoặc đang xử lý** (`pending`, pending) → ready, empty, error — `EV-001`, `EV-002`, `EV-003`
- **Dữ liệu sẵn sàng** (`ready`, success) → Thực hiện hành động tiếp theo — `EV-001`, `EV-002`, `EV-003`
- **Không có dữ liệu phù hợp** (`empty`, empty) → Đổi bộ lọc, Quay lại — `EV-001`, `EV-002`
- **Không thể hoàn tất yêu cầu** (`error`, error) → Thử lại — `EV-001`, `EV-002`, `EV-003`

## 8. Entities and data

- **Con trỏ tiếp tục học**: topic, paper, reviewPhrase — `EV-001`, `EV-002`, `EV-003`

## 9. Operations and APIs

- **continueLearning** (query, backend) — input: authenticated viewer; output: topic, paper, reviewPhrase; failures: GraphQL error envelope — `EV-003`

## 10. Acceptance conditions

- **AC-01** Dashboard chỉ hiển thị sau khi có token và tab không hợp lệ phải trở về overview. — `EV-001`, `EV-002`

## 11. Explicit unknowns

- **Những query dashboard ngoài continueLearning hiện được resolver nào trong BE current head phục vụ?** — Các widget không có resolver tương ứng không được xem là contract backend đã xác nhận.

## 12. Evidence index

| ID | Role | Source | Kind | Claim |
|---|---|---|---|---|
| EV-001 | fe | `src/app/routes.spec.tsx:47` | route | Frontend khai báo route dashboard, league và root redirect. |
| EV-002 | fe | `src/components/pages/DashboardPage/index.tsx:18` | ui | Dashboard giới hạn bốn tab, yêu cầu token và chuyển người chưa xác thực sang /authentication. |
| EV-003 | fe | `src/modules/api/graphql/queries/query-continue-learning.ts:5` | api | ContinueLearning đọc topic, paper và reviewPhrase cho người dùng đã xác thực. |
