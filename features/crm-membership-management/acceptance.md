# Acceptance · CRM quản lý hồ sơ hội viên Tây Sơn

| ID | Observable result | Evidence/test |
|---|---|---|
| `AC-01` | Người dùng quản trị được phân quyền mở /hoi-vien và thấy hàng đợi hồ sơ hoặc một trạng thái loading, empty, error hay permission-denied rõ ràng. | `EV-001`, `EV-002` |
| `AC-02` | Staff được phép mở hồ sơ mới và chuyển hồ sơ từ new sang reviewing nhưng không nhận hành động ngoài quyền. | `EV-001`, `EV-002` |
| `AC-03` | Manager hoặc Admin được phép chuyển hồ sơ reviewing sang approved hoặc rejected và quyết định tạo audit entry. | `EV-001`, `EV-002` |
| `AC-04` | Chỉ hồ sơ approved đủ điều kiện tạo hồ sơ công khai; mọi trạng thái khác không được công khai. | `EV-001`, `EV-002` |
| `AC-05` | Người dùng không có quyền không đọc được hàng đợi, dữ liệu hồ sơ hoặc hành động xử lý bị cấm. | `EV-001`, `EV-002` |
| `AC-06` | CRM hiển thị đầy đủ trường hồ sơ V1 nhưng chỉ tên doanh nghiệp, lĩnh vực và phần giới thiệu đủ điều kiện công khai sau khi hồ sơ approved; thông tin đại diện, chức vụ, địa chỉ, email, điện thoại và mã số thuế không được công khai. | `EV-003` |
| `AC-07` | Hàng đợi tìm được theo mã hồ sơ, tên doanh nghiệp hoặc mã số thuế, lọc theo trạng thái, sắp xếp mới nhất trước và trả đúng 20 hồ sơ mỗi trang cùng thông tin phân trang. | `EV-003` |
| `AC-08` | Từ chối không hoàn tất khi thiếu lý do; duyệt cho phép bỏ trống ghi chú nội bộ; cả hai quyết định yêu cầu xác nhận và tạo audit entry chứa người thao tác, thời điểm cùng chi tiết quyết định. | `EV-003` |
| `AC-09` | Backend chỉ trả và thực thi capability CRM phù hợp với phiên HTTP-only cùng role staff, manager hoặc admin; người không có phiên hoặc quyền nhận permission denied. | `EV-004` |
| `AC-10` | Hai lệnh dùng cùng expectedVersion không thể cùng hoàn tất: lệnh thắng cập nhật phiên bản và ghi audit, lệnh cũ bị từ chối như concurrency conflict mà không ghi side effect. | `EV-004` |
| `AC-11` | CRM V1 không phát email hoặc notification khi hồ sơ chuyển trạng thái và không triển khai invite, reset password hoặc 2FA. | `EV-004` |

## Completion

- Every current surface state is represented.
- Every business rule has evidence.
- Every operation has input, output and failure ownership.
- Unknowns are explicit and never rendered as facts.
- FE/BE source heads match the business head.
