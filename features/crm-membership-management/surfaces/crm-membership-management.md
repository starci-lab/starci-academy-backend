# Surface · Quản lý hội viên

> ID: `crm-membership-management` · Route: `/hoi-vien`

## Job

Tiếp nhận, xem xét, duyệt hoặc từ chối hồ sơ đăng ký hội viên theo quyền của người dùng quản trị.

## Navigation

- none

## Prototype contract

| Region | Kind | Real representative content | States | Actions | Evidence |
|---|---|---|---|---|---|
| `membership-queue` | collection | Định danh hồ sơ; Tên doanh nghiệp; Mã số thuế; Trạng thái xử lý; Thời điểm gửi; Tìm theo mã hồ sơ, tên doanh nghiệp hoặc mã số thuế; Lọc theo trạng thái new, reviewing, approved hoặc rejected; 20 hồ sơ mỗi trang, mới nhất trước | collection-loading, collection-empty, collection-ready, collection-error, permission-denied | Xem hồ sơ | `EV-001`, `EV-002`, `EV-003` |
| `membership-review` | flow | Mã hồ sơ, tên doanh nghiệp, mã số thuế, người đại diện và chức vụ, địa chỉ, email, điện thoại, lĩnh vực và phần giới thiệu; Tên doanh nghiệp, lĩnh vực và phần giới thiệu là các trường được phép công khai sau khi duyệt; Trạng thái hiện tại; Lý do bắt buộc khi từ chối; Ghi chú nội bộ tùy chọn khi duyệt; Xác nhận trước khi duyệt hoặc từ chối | membership-new, membership-reviewing, membership-approved, membership-rejected, permission-denied | Bắt đầu xem xét, Duyệt hồ sơ, Từ chối hồ sơ | `EV-001`, `EV-002`, `EV-003` |

## Context rule

Layout preview may use these identities, values, statuses and actions to show density and hierarchy. Block design owns final anatomy.
