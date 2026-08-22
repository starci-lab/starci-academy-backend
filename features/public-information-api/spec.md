# API thông tin công khai Tây Sơn

> Business head: `742352cc959645eaf1255c944a369ef5d7cf19ff76687be2f282626fb3dc4e82`
>
> This document is generated from the immutable business model. Update the model through `starci-business-analyze`; do not hand-edit this view.

## 1. Overview

Backend cung cấp truy vấn chỉ đọc tài liệu thông tin công khai đã xuất bản cho trang /gioi-thieu, với kết quả ổn định để frontend hiển thị ready, unavailable hoặc error mà không làm lộ nội dung nháp hay đã lưu trữ.

Included:
- Truy vấn backend chỉ đọc tài liệu thông tin công khai cho trang /gioi-thieu
- Nhận định danh tài liệu công khai và trả tiêu đề cùng các phần nội dung theo thứ tự
- Chỉ trả nội dung có trạng thái published
- Kết quả ổn định cho ready, unavailable và error
- Kết nối contract giữa frontend Tây Sơn và backend Tây Sơn

Excluded:
- Mutation tạo, sửa, xuất bản hoặc lưu trữ nội dung trong CMS
- Xác thực và phân quyền quản trị CMS
- Công khai nội dung draft hoặc archived
- Tự tạo tên ban chủ nhiệm, điều khoản điều lệ hoặc dữ kiện pháp lý chưa được owner cung cấp
- Khóa transport REST hoặc GraphQL và database schema trước backend planning

## 2. Source heads

| Role | Repository | Head |
|---|---|---|
| fe | local-only:D:/Repositories/tayson-fe | `6a954d40294c3dfaf7678d2eb4c34c1cd3c389d2` |
| be | local-only:D:/Repositories/tayson-backend | `661c37a1c6bb29540f0c644680e295abcf5267c7` |

## 3. Actors and access

### Khách truy cập

- Mở trang /gioi-thieu
- Đọc tài liệu thông tin đã xuất bản
- Nhận phản hồi rõ ràng khi nội dung chưa khả dụng hoặc không thể tải

Evidence: `EV-001`, `EV-002`, `EV-003`

## 4. Entry points and surfaces

### Thông tin cộng đồng Tây Sơn

- ID: `public-information`
- Route: `/gioi-thieu`
- Purpose: Hiển thị tài liệu thông tin công khai được đọc từ backend.
- Regions: `information-document`
- Navigation: none

Evidence: `EV-002`, `EV-003`

## 5. Business flows

### Đọc thông tin công khai từ backend

Trigger: Frontend trang /gioi-thieu yêu cầu tài liệu thông tin công khai theo định danh

1. **visitor** — Mở trang /gioi-thieu → Frontend yêu cầu tài liệu công khai từ backend
2. **visitor** — Chờ backend phân giải định danh tài liệu → Backend chỉ trả tài liệu published hoặc một kết quả không khả dụng ổn định
3. **visitor** — Đọc các phần nội dung đã xuất bản → Thấy tiêu đề và các phần nội dung theo đúng thứ tự

Outcomes:
- Khách đọc được tài liệu thông tin công khai đã xuất bản từ backend
- Khách nhận trạng thái unavailable khi không có phiên bản công khai phù hợp
- Khách nhận trạng thái error ổn định khi backend không thể tải dữ liệu

Evidence: `EV-001`, `EV-002`, `EV-003`

## 6. Business rules

### BR-01

Truy vấn công khai chỉ trả tài liệu có trạng thái published.

Strength: **confirmed** · Evidence: `EV-001`, `EV-002`, `EV-003`

### BR-02

Tài liệu draft, archived hoặc không tồn tại được biểu diễn là unavailable và không làm lộ nội dung bị ẩn.

Strength: **confirmed** · Evidence: `EV-001`, `EV-003`

### BR-03

Backend cung cấp kết quả đủ ổn định để frontend ánh xạ sang ready, unavailable hoặc error trong chrome trang không đổi.

Strength: **confirmed** · Evidence: `EV-002`, `EV-003`

### BR-04

Capability này chỉ đọc và không sở hữu mutation CMS, xác thực hoặc phân quyền quản trị.

Strength: **confirmed** · Evidence: `EV-003`

### BR-05

API không tự tạo tên nhân sự, điều khoản điều lệ hoặc dữ kiện pháp lý chưa được owner cung cấp.

Strength: **confirmed** · Evidence: `EV-002`, `EV-003`

## 7. State model

- **Đang tải thông tin** (`information-loading`, initial) → information-ready, information-unavailable, information-error — `EV-002`, `EV-003`
- **Thông tin đã sẵn sàng** (`information-ready`, success) → terminal — `EV-002`, `EV-003`
- **Thông tin chưa khả dụng** (`information-unavailable`, empty) → information-loading — `EV-002`, `EV-003`
- **Không thể tải thông tin** (`information-error`, error) → information-loading — `EV-002`, `EV-003`

## 8. Entities and data

- **Tài liệu thông tin công khai**: Định danh tài liệu công khai, Tiêu đề tài liệu, Các phần nội dung theo thứ tự, Trạng thái xuất bản — `EV-001`, `EV-002`, `EV-003`

## 9. Operations and APIs

- **Đọc tài liệu thông tin công khai** (query, backend) — input: Định danh tài liệu công khai; output: Tiêu đề đã xuất bản, Các phần nội dung đã xuất bản theo thứ tự, Trạng thái hiển thị; failures: Nội dung chưa khả dụng, Không thể tải dữ liệu — `EV-001`, `EV-002`, `EV-003`

## 10. Acceptance conditions

- **AC-01** Frontend yêu cầu một định danh tài liệu hợp lệ và nhận tiêu đề cùng các phần nội dung theo thứ tự khi có phiên bản published. — `EV-002`, `EV-003`
- **AC-02** Tài liệu draft, archived hoặc không tồn tại trả kết quả unavailable mà không chứa nội dung bị ẩn. — `EV-001`, `EV-003`
- **AC-03** Lỗi đọc dữ liệu trả kết quả ổn định để frontend hiển thị information-error và cho phép tải lại theo contract trang. — `EV-002`, `EV-003`
- **AC-04** Capability không thêm mutation CMS, xác thực quản trị hoặc nội dung chính thức chưa được owner cung cấp. — `EV-003`

## 11. Explicit unknowns

- **Backend sẽ công bố operation bằng REST, GraphQL hay transport nào theo pattern Tây Sơn?** — Được quyết định ở backend planning; không thay đổi business contract của truy vấn chỉ đọc.
- **Entity và persistence nào sẽ lưu tài liệu cùng các phần nội dung theo thứ tự?** — Chặn file plan và migration chính xác nhưng không chặn authority business.
- **Định danh canonical và seed production của tài liệu /gioi-thieu là gì?** — Chặn dữ liệu production chính thức; implementation có thể giữ contract định danh mà không tự tạo nội dung.
- **Nội dung công khai có yêu cầu cache, revalidation hoặc invalidation cụ thể không?** — Chặn tối ưu vận hành cuối cùng nhưng không thay đổi quyền truy cập published-only.

## 12. Evidence index

| ID | Role | Source | Kind | Claim |
|---|---|---|---|---|
| EV-001 | owner | `decision:385cfe6dd712eff610dbefaf8060661780d51183c7c9bfe18b5c148ca750bdf1` | owner-decision | Owner đã chấp thuận nền tảng Tây Sơn có backend đọc nội dung công khai và vòng đời nội dung draft → published → archived trong authority community-website-platform. |
| EV-002 | owner | `decision:8d7d66eecd37fea3e7e3c3c49b3474467deb7ec5e118d3aa7c4e6aa39a7c3f95` | owner-decision | Owner đã duyệt route /gioi-thieu, tài liệu thông tin công khai, các phần theo thứ tự và bốn trạng thái loading, ready, error, unavailable của frontend Tây Sơn. |
| EV-003 | owner | `decision:084369a4c8abb6d0e4e21ea434c7969051402689a80bdf08810f8f695796a5ea` | owner-decision | Owner duyệt pending authority public-information-api với backend query chỉ đọc, published-only, output tiêu đề và các phần theo thứ tự, kết quả ready/unavailable/error, không gồm CMS mutation và chưa khóa transport hoặc database schema. |
| EV-004 | owner | `decision:565339bc4d33d72817b583024112eb7f5cdf3e5eef0252d6ec1b9c9a94e12bb3` | owner-decision | Owner chấp thuận chuyển public-information-api từ pending sang in-progress mà không thay đổi scope, contract hoặc source boundary đã duyệt. |
