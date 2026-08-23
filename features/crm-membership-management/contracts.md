# Contracts · CRM quản lý hồ sơ hội viên Tây Sơn

## Entity · Hồ sơ đăng ký hội viên (`member-application`)

Fields: `Mã hồ sơ`, `Tên doanh nghiệp`, `Mã số thuế`, `Tên người đại diện`, `Chức vụ người đại diện`, `Địa chỉ doanh nghiệp`, `Email liên hệ`, `Điện thoại liên hệ`, `Lĩnh vực hoạt động`, `Phần giới thiệu doanh nghiệp`, `Trạng thái xử lý`, `Thời điểm gửi`, `Dấu thời gian xóa mềm`, `Phiên bản optimistic concurrency`

Evidence: `EV-001`, `EV-002`, `EV-003`

## Entity · Hồ sơ hội viên và doanh nghiệp (`member-profile`)

Fields: `Tên doanh nghiệp được phép công khai`, `Lĩnh vực hoạt động được phép công khai`, `Phần giới thiệu doanh nghiệp được phép công khai`, `Trạng thái duyệt`, `Trạng thái công khai`, `Dấu thời gian xóa mềm`

Evidence: `EV-001`, `EV-003`

## Entity · Nhật ký quản trị (`audit-entry`)

Fields: `Người thao tác`, `Hành động`, `Đối tượng`, `Thời điểm`, `Quyết định xử lý`, `Lý do từ chối hoặc ghi chú duyệt`

Evidence: `EV-001`, `EV-003`

## Operation · Đọc hàng đợi hồ sơ hội viên

- Kind/owner: `query` / `backend`
- Inputs: Từ khóa tìm theo mã hồ sơ, tên doanh nghiệp hoặc mã số thuế, Bộ lọc trạng thái, Trang hiện tại với 20 hồ sơ mỗi trang, Sắp xếp thời điểm gửi mới nhất trước
- Outputs: Các hồ sơ được phép xem, Trạng thái xử lý hiện tại, Thông tin phân trang, Phiên bản hồ sơ dùng cho lệnh chuyển trạng thái
- Failures: Không đủ quyền, Không thể tải dữ liệu
- Evidence: `EV-001`, `EV-002`, `EV-003`

## Operation · Đọc một hồ sơ đăng ký hội viên

- Kind/owner: `query` / `backend`
- Inputs: Định danh hồ sơ
- Outputs: Các trường hồ sơ CRM V1, Phân loại trường nội bộ và trường được phép công khai, Trạng thái xử lý, Thời điểm gửi, Phiên bản hồ sơ dùng cho lệnh chuyển trạng thái
- Failures: Không đủ quyền, Không tìm thấy
- Evidence: `EV-001`, `EV-002`, `EV-003`

## Operation · Bắt đầu xem xét hồ sơ hội viên

- Kind/owner: `command` / `backend`
- Inputs: Định danh hồ sơ, expectedVersion của hồ sơ
- Outputs: Hồ sơ ở trạng thái reviewing, Phiên bản hồ sơ mới, Audit entry bắt đầu xem xét
- Failures: Không đủ quyền, Chuyển trạng thái không hợp lệ, Không tìm thấy, Xung đột phiên bản do hồ sơ đã được người khác xử lý
- Evidence: `EV-001`, `EV-002`, `EV-004`

## Operation · Quyết định hồ sơ đăng ký hội viên

- Kind/owner: `command` / `backend`
- Inputs: Định danh hồ sơ, Quyết định xử lý, Lý do bắt buộc khi từ chối, Ghi chú nội bộ tùy chọn khi duyệt, Xác nhận quyết định, expectedVersion của hồ sơ
- Outputs: Trạng thái hồ sơ đã cập nhật, Hồ sơ công khai nếu approved, Audit entry
- Failures: Không đủ quyền, Chuyển trạng thái không hợp lệ, Không tìm thấy, Xung đột phiên bản do hồ sơ đã được người khác xử lý
- Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`

No field, failure or operation may appear here without routed source evidence.
