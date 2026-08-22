# CRM quản lý hồ sơ hội viên Tây Sơn

> Business head: `045f96e7829e77924cce0b2e526b55f5d6ea0dcf3e250990b5a4ccd50d53bfe0`
>
> This document is generated from the immutable business model. Update the model through `starci-business-analyze`; do not hand-edit this view.

## 1. Overview

CRM nội bộ tại /hoi-vien cho phép nhân sự được phân quyền tiếp nhận, xem xét và quyết định hồ sơ đăng ký hội viên theo vòng đời đã duyệt, đồng thời chỉ cho phép hồ sơ được phê duyệt trở thành hồ sơ công khai.

Included:
- Bề mặt CRM nội bộ quản lý hồ sơ hội viên tại route /hoi-vien
- Đọc hàng đợi hồ sơ đăng ký hội viên theo quyền của người dùng quản trị
- Xem một hồ sơ cùng dữ liệu do người đăng ký cung cấp và trạng thái xử lý
- Chuyển hồ sơ new sang reviewing rồi approved hoặc rejected theo quyền
- Tạo dấu vết audit cho quyết định xử lý hồ sơ
- Chỉ cho phép hồ sơ approved đủ điều kiện xuất hiện công khai

Excluded:
- Biểu mẫu đăng ký hội viên công khai
- Danh bạ hội viên công khai
- Cổng đăng nhập hoặc dashboard riêng cho hội viên
- CRM bán hàng, thanh toán, ticket hoặc chăm sóc khách hàng
- Quản trị nội dung website, biểu mẫu liên hệ hoặc cấu hình hệ thống
- Quản lý tài khoản quản trị và cơ chế khôi phục đăng nhập
- Upload hoặc lưu trữ file
- Tự xác định trường dữ liệu cá nhân, doanh nghiệp hoặc trường được phép công khai

## 2. Source heads

| Role | Repository | Head |
|---|---|---|
| fe | local-only:D:/Repositories/tayson-fe | `6a954d40294c3dfaf7678d2eb4c34c1cd3c389d2` |
| be | local-only:D:/Repositories/tayson-backend | `661c37a1c6bb29540f0c644680e295abcf5267c7` |

## 3. Actors and access

### Nhân viên vận hành

- Xem hàng đợi hồ sơ hội viên trong phạm vi được phân quyền
- Mở hồ sơ và chuyển hồ sơ mới sang đang xem xét
- Không quản lý tài khoản quản trị

Evidence: `EV-001`, `EV-002`

### Quản lý

- Xem và xử lý hồ sơ hội viên
- Duyệt hoặc từ chối hồ sơ đang xem xét

Evidence: `EV-001`, `EV-002`

### Quản trị viên

- Thực hiện mọi thao tác quản lý hồ sơ hội viên đã được duyệt trong scope
- Nhận trạng thái và hành động tương ứng với quyền quản trị

Evidence: `EV-001`, `EV-002`

## 4. Entry points and surfaces

### Quản lý hội viên

- ID: `crm-membership-management`
- Route: `/hoi-vien`
- Purpose: Tiếp nhận, xem xét, duyệt hoặc từ chối hồ sơ đăng ký hội viên theo quyền của người dùng quản trị.
- Regions: `membership-queue`, `membership-review`
- Navigation: none

Evidence: `EV-001`, `EV-002`

## 5. Business flows

### Tiếp nhận và quyết định hồ sơ hội viên

Trigger: Người dùng quản trị được phân quyền mở CRM hội viên tại /hoi-vien

1. **staff** — Mở hàng đợi hồ sơ hội viên → Thấy các hồ sơ được phép xem cùng trạng thái xử lý hiện tại
2. **staff** — Mở một hồ sơ mới → Thấy dữ liệu do người đăng ký cung cấp và trạng thái new mà không suy diễn field chưa được chốt
3. **staff** — Bắt đầu xem xét hồ sơ → Hồ sơ chuyển từ new sang reviewing
4. **manager** — Duyệt hoặc từ chối hồ sơ đang xem xét → Hồ sơ chuyển sang approved hoặc rejected và quyết định được ghi audit

Outcomes:
- Hồ sơ có một trạng thái xử lý hợp lệ và quyết định có dấu vết audit
- Hồ sơ approved đủ điều kiện tạo hồ sơ công khai
- Hồ sơ rejected không được công khai

Evidence: `EV-001`, `EV-002`

## 6. Business rules

### BR-01

Hồ sơ đăng ký hội viên chỉ chuyển theo new → reviewing → approved hoặc rejected.

Strength: **confirmed** · Evidence: `EV-001`, `EV-002`

### BR-02

Chỉ hồ sơ approved mới đủ điều kiện trở thành hồ sơ hội viên công khai; hồ sơ new, reviewing hoặc rejected không được công khai.

Strength: **confirmed** · Evidence: `EV-001`, `EV-002`

### BR-03

Admin có toàn quyền trong scope, Manager được quản lý và quyết định hồ sơ, Staff được biên tập và xử lý biểu mẫu nhưng không quản lý tài khoản.

Strength: **confirmed** · Evidence: `EV-001`

### BR-04

Hành động không được vai trò cho phép phải bị từ chối và không xuất hiện như một thao tác khả dụng trong CRM.

Strength: **confirmed** · Evidence: `EV-001`, `EV-002`

### BR-05

Quyết định xử lý hồ sơ tạo audit entry và dữ liệu nghiệp vụ sử dụng xóa mềm để giữ khả năng audit và phục hồi.

Strength: **confirmed** · Evidence: `EV-001`

### BR-06

Phiên bản đầu của CRM hội viên sử dụng tiếng Việt và không cung cấp cổng đăng nhập riêng cho hội viên.

Strength: **confirmed** · Evidence: `EV-001`

## 7. State model

- **Đang tải hàng đợi hồ sơ** (`collection-loading`, initial) → collection-ready, collection-empty, collection-error, permission-denied — `EV-001`, `EV-002`
- **Hàng đợi hồ sơ sẵn sàng** (`collection-ready`, success) → membership-new, membership-reviewing, membership-approved, membership-rejected — `EV-001`, `EV-002`
- **Không có hồ sơ phù hợp** (`collection-empty`, empty) → collection-loading — `EV-001`, `EV-002`
- **Không thể tải hàng đợi hồ sơ** (`collection-error`, error) → collection-loading — `EV-001`, `EV-002`
- **Không có quyền truy cập CRM hội viên** (`permission-denied`, error) → terminal — `EV-001`, `EV-002`
- **Hồ sơ mới** (`membership-new`, initial) → membership-reviewing — `EV-001`, `EV-002`
- **Hồ sơ đang xem xét** (`membership-reviewing`, pending) → membership-approved, membership-rejected — `EV-001`, `EV-002`
- **Hồ sơ đã duyệt** (`membership-approved`, success) → terminal — `EV-001`, `EV-002`
- **Hồ sơ đã từ chối** (`membership-rejected`, error) → terminal — `EV-001`, `EV-002`

## 8. Entities and data

- **Hồ sơ đăng ký hội viên**: Dữ liệu biểu mẫu do người đăng ký cung cấp, Trạng thái xử lý, Thời điểm gửi, Dấu thời gian xóa mềm — `EV-001`, `EV-002`
- **Hồ sơ hội viên và doanh nghiệp**: Thông tin doanh nghiệp, Trạng thái duyệt, Trạng thái công khai, Dấu thời gian xóa mềm — `EV-001`
- **Nhật ký quản trị**: Người thao tác, Hành động, Đối tượng, Thời điểm, Chi tiết cần thiết — `EV-001`

## 9. Operations and APIs

- **Đọc hàng đợi hồ sơ hội viên** (query, backend) — input: none; output: Các hồ sơ được phép xem, Trạng thái xử lý hiện tại; failures: Không đủ quyền, Không thể tải dữ liệu — `EV-001`, `EV-002`
- **Đọc một hồ sơ đăng ký hội viên** (query, backend) — input: Định danh hồ sơ; output: Dữ liệu do người đăng ký cung cấp, Trạng thái xử lý, Thời điểm gửi; failures: Không đủ quyền, Không tìm thấy — `EV-001`, `EV-002`
- **Xử lý hồ sơ đăng ký hội viên** (command, backend) — input: Định danh hồ sơ, Quyết định xử lý; output: Trạng thái hồ sơ đã cập nhật, Hồ sơ công khai nếu approved, Audit entry; failures: Không đủ quyền, Chuyển trạng thái không hợp lệ, Không tìm thấy — `EV-001`, `EV-002`

## 10. Acceptance conditions

- **AC-01** Người dùng quản trị được phân quyền mở /hoi-vien và thấy hàng đợi hồ sơ hoặc một trạng thái loading, empty, error hay permission-denied rõ ràng. — `EV-001`, `EV-002`
- **AC-02** Staff được phép mở hồ sơ mới và chuyển hồ sơ từ new sang reviewing nhưng không nhận hành động ngoài quyền. — `EV-001`, `EV-002`
- **AC-03** Manager hoặc Admin được phép chuyển hồ sơ reviewing sang approved hoặc rejected và quyết định tạo audit entry. — `EV-001`, `EV-002`
- **AC-04** Chỉ hồ sơ approved đủ điều kiện tạo hồ sơ công khai; mọi trạng thái khác không được công khai. — `EV-001`, `EV-002`
- **AC-05** Người dùng không có quyền không đọc được hàng đợi, dữ liệu hồ sơ hoặc hành động xử lý bị cấm. — `EV-001`, `EV-002`
- **AC-06** Capability không tự xác định hoặc công khai trường cá nhân và doanh nghiệp chưa được owner chốt. — `EV-001`, `EV-002`

## 11. Explicit unknowns

- **Hồ sơ đăng ký và hồ sơ doanh nghiệp gồm những trường nào, trường nào được phép công khai?** — Chặn schema cuối cùng, validation, privacy và anatomy chi tiết của màn xem hồ sơ.
- **Hàng đợi cần pagination, filter, search và sort theo quy tắc nào?** — Chặn input query và điều khiển collection cuối cùng nhưng không chặn route hoặc lifecycle.
- **Từ chối hoặc duyệt có bắt buộc lý do, ghi chú nội bộ hay xác nhận bổ sung không?** — Chặn contract form quyết định và dữ liệu audit chi tiết.
- **Cơ chế phiên, mời tài khoản, đặt lại mật khẩu, 2FA và thời hạn phiên của CRM là gì?** — Chặn auth implementation nhưng không thay đổi quyền nghiệp vụ của route /hoi-vien.
- **Backend sẽ công bố query và command hội viên bằng GraphQL shape nào cùng persistence schema nào?** — Chặn backend file plan và kết nối FE thật; business model không khóa transport hoặc database shape.
- **Có cần gửi email hoặc thông báo khi hồ sơ chuyển reviewing, approved hoặc rejected không?** — Quyết định provider và event flow; hiện nằm ngoài operation đã chốt.
- **Hệ thống xử lý thế nào khi hai người cùng xem xét hoặc quyết định một hồ sơ?** — Chặn concurrency contract và failure chi tiết.

## 12. Evidence index

| ID | Role | Source | Kind | Claim |
|---|---|---|---|---|
| EV-001 | owner | `decision:385cfe6dd712eff610dbefaf8060661780d51183c7c9bfe18b5c148ca750bdf1` | owner-decision | Owner đã chấp thuận nền tảng Tây Sơn có CRM Admin, Manager và Staff, vòng đời hồ sơ new → reviewing → approved hoặc rejected, chỉ approved được công khai, audit và xóa mềm. |
| EV-002 | owner | `decision:9058a36a3e8162332ac8a76f3c461fff8851f053f39f9e5e743e291f368d5daf` | owner-decision | Owner yêu cầu tạo business authority cho CRM hội viên Tây Sơn và chốt route quản trị /hoi-vien. |
