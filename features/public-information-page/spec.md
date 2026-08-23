# Trang thông tin cộng đồng Tây Sơn

> Business head: `c24fadecd6f84f17b9abdbfefaa529acf5603f228131647bb2604e04f64f1150`
>
> This document is generated from the immutable business model. Update the model through `starci-business-analyze`; do not hand-edit this view.

## 1. Overview

Trang công khai tiếng Việt tại /gioi-thieu giúp khách truy cập đọc nội dung giới thiệu, điều lệ, ban chủ nhiệm và thông tin liên quan đã được xuất bản, với trải nghiệm responsive, SSR/SEO cơ bản và các trạng thái tải, sẵn sàng, lỗi, không khả dụng.

Included:
- Route công khai /gioi-thieu trong frontend Tây Sơn
- Nội dung giới thiệu, điều lệ, ban chủ nhiệm và nội dung liên quan đã xuất bản
- Trạng thái loading, ready, error và unavailable của tài liệu thông tin
- Hiển thị responsive trên desktop và thiết bị di động
- SSR, metadata SEO cơ bản và nội dung tiếng Việt trong phiên bản đầu
- Điều hướng tiếp tục tới các bề mặt công khai liên quan

Excluded:
- Tự tạo tên ban chủ nhiệm, điều khoản điều lệ hoặc dữ kiện pháp lý chưa được owner cung cấp
- CMS biên tập và xuất bản nội dung
- API backend cho nội dung công khai
- Trang danh sách hội viên, tin tức, đăng ký hội viên và liên hệ
- Đa ngôn ngữ trong phiên bản đầu

## 2. Source heads

| Role | Repository | Head |
|---|---|---|
| fe | local-only:D:/Repositories/tayson-fe | `e89b39a3c6f8a9266e7a024ad2ce27e7406f926d` |

## 3. Actors and access

### Khách truy cập

- Mở trang thông tin cộng đồng
- Đọc nội dung đã xuất bản
- Theo dõi trạng thái tải hoặc lỗi
- Tiếp tục tới bề mặt công khai liên quan

Evidence: `EV-001`, `EV-002`

## 4. Entry points and surfaces

### Thông tin cộng đồng Tây Sơn

- ID: `public-information`
- Route: `/gioi-thieu`
- Purpose: Công bố nội dung giới thiệu, điều lệ, ban chủ nhiệm và thông tin liên quan đã xuất bản.
- Regions: `information-masthead`, `document-index`, `information-document`, `continuation-band`
- Navigation: Giới thiệu (active), Điều lệ (available), Ban chủ nhiệm (available)

Evidence: `EV-001`, `EV-002`

## 5. Business flows

### Đọc thông tin cộng đồng

Trigger: Khách truy cập mở /gioi-thieu từ điều hướng công khai

1. **visitor** — Mở trang giới thiệu → Thấy nhận diện trang, chỉ mục tài liệu và trạng thái tải nội dung
2. **visitor** — Đọc các phần nội dung công khai → Thấy tài liệu đã xuất bản theo thứ bậc rõ ràng
3. **visitor** — Chọn một liên kết tiếp tục → Đi tới bề mặt công khai liên quan nếu khả dụng

Outcomes:
- Khách hiểu mục đích, nguyên tắc và cơ cấu thông tin của cộng đồng
- Khách nhận được phản hồi rõ ràng khi nội dung đang tải, lỗi hoặc không khả dụng
- Khách có đường tiếp tục trong hành trình công khai

Evidence: `EV-001`, `EV-002`

## 6. Business rules

### BR-01

Trang công khai chỉ trình bày nội dung được xác định là đã xuất bản.

Strength: **confirmed** · Evidence: `EV-001`

### BR-02

Phiên bản đầu của trang sử dụng tiếng Việt và phải responsive.

Strength: **confirmed** · Evidence: `EV-001`, `EV-002`

### BR-03

Khối tài liệu sở hữu bốn trạng thái loading, ready, error và unavailable; chrome trang vẫn ổn định khi trạng thái khối thay đổi.

Strength: **confirmed** · Evidence: `EV-002`

### BR-04

Không hiển thị tên nhân sự, điều khoản điều lệ hoặc dữ kiện pháp lý chưa có nội dung owner cung cấp.

Strength: **confirmed** · Evidence: `EV-002`

## 7. State model

- **Đang tải thông tin** (`information-loading`, initial) → information-ready, information-error, information-unavailable — `EV-002`
- **Thông tin đã sẵn sàng** (`information-ready`, success) → terminal — `EV-001`, `EV-002`
- **Không thể tải thông tin** (`information-error`, error) → information-loading — `EV-002`
- **Thông tin chưa khả dụng** (`information-unavailable`, empty) → information-loading — `EV-002`

## 8. Entities and data

- **Tài liệu thông tin công khai**: Tiêu đề tài liệu, Các phần nội dung, Trạng thái xuất bản — `EV-001`, `EV-002`

## 9. Operations and APIs

- **Đọc tài liệu thông tin công khai** (query, frontend) — input: Định danh tài liệu công khai; output: Nội dung đã xuất bản, Trạng thái hiển thị; failures: Không thể tải dữ liệu, Nội dung chưa khả dụng — `EV-001`, `EV-002`

## 10. Acceptance conditions

- **AC-01** Khách mở /gioi-thieu và thấy một trang thông tin hoàn chỉnh bằng tiếng Việt trên desktop và thiết bị di động. — `EV-001`, `EV-002`
- **AC-02** Trang có metadata SEO cơ bản và được render bằng route Next.js hỗ trợ SSR. — `EV-001`, `EV-002`
- **AC-03** Khối tài liệu hiển thị đúng loading, ready, error và unavailable mà không thay đổi chrome hay cấu trúc trang. — `EV-002`
- **AC-04** Ready chỉ hiển thị nội dung được đánh dấu đã xuất bản; lỗi có hành động tải lại rõ ràng. — `EV-001`, `EV-002`
- **AC-05** Không có tên nhân sự, điều khoản điều lệ hoặc dữ kiện pháp lý được tự tạo khi chưa có nội dung owner cung cấp. — `EV-002`

## 11. Explicit unknowns

- **Danh sách và chức danh chính thức của ban chủ nhiệm là gì?** — Chưa hiển thị tên cá nhân hoặc chức danh cụ thể trong nội dung công khai.
- **Toàn văn điều lệ đã được duyệt để công bố là phiên bản nào?** — Chưa hiển thị điều khoản hoặc trích dẫn pháp lý cụ thể.
- **API và CMS nào sẽ sở hữu nội dung công khai sau giai đoạn frontend hiện tại?** — Giai đoạn này dùng seed phát triển/test có kiểm soát; tích hợp backend nằm ngoài source boundary đã duyệt.

## 12. Evidence index

| ID | Role | Source | Kind | Claim |
|---|---|---|---|---|
| EV-001 | owner | `decision:385cfe6dd712eff610dbefaf8060661780d51183c7c9bfe18b5c148ca750bdf1` | owner-decision | Owner đã chấp thuận scope website Tây Sơn gồm thông tin giới thiệu cộng đồng, điều lệ, ban chủ nhiệm, nội dung công khai responsive, SEO/SSR và tiếng Việt phiên bản đầu trong authority community-website-platform. |
| EV-002 | owner | `decision:8d7d66eecd37fea3e7e3c3c49b3474467deb7ec5e118d3aa7c4e6aa39a7c3f95` | owner-decision | Owner đã duyệt page anatomy, bốn block states, route /gioi-thieu, exact source-and-seed boundary và render contract của trang thông tin công khai. |
