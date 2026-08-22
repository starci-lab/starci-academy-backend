# Contracts · CRM quản lý hồ sơ hội viên Tây Sơn

## Entity · Hồ sơ đăng ký hội viên (`member-application`)

Fields: `Dữ liệu biểu mẫu do người đăng ký cung cấp`, `Trạng thái xử lý`, `Thời điểm gửi`, `Dấu thời gian xóa mềm`

Evidence: `EV-001`, `EV-002`

## Entity · Hồ sơ hội viên và doanh nghiệp (`member-profile`)

Fields: `Thông tin doanh nghiệp`, `Trạng thái duyệt`, `Trạng thái công khai`, `Dấu thời gian xóa mềm`

Evidence: `EV-001`

## Entity · Nhật ký quản trị (`audit-entry`)

Fields: `Người thao tác`, `Hành động`, `Đối tượng`, `Thời điểm`, `Chi tiết cần thiết`

Evidence: `EV-001`

## Operation · Đọc hàng đợi hồ sơ hội viên

- Kind/owner: `query` / `backend`
- Inputs: none
- Outputs: Các hồ sơ được phép xem, Trạng thái xử lý hiện tại
- Failures: Không đủ quyền, Không thể tải dữ liệu
- Evidence: `EV-001`, `EV-002`

## Operation · Đọc một hồ sơ đăng ký hội viên

- Kind/owner: `query` / `backend`
- Inputs: Định danh hồ sơ
- Outputs: Dữ liệu do người đăng ký cung cấp, Trạng thái xử lý, Thời điểm gửi
- Failures: Không đủ quyền, Không tìm thấy
- Evidence: `EV-001`, `EV-002`

## Operation · Xử lý hồ sơ đăng ký hội viên

- Kind/owner: `command` / `backend`
- Inputs: Định danh hồ sơ, Quyết định xử lý
- Outputs: Trạng thái hồ sơ đã cập nhật, Hồ sơ công khai nếu approved, Audit entry
- Failures: Không đủ quyền, Chuyển trạng thái không hợp lệ, Không tìm thấy
- Evidence: `EV-001`, `EV-002`

No field, failure or operation may appear here without routed source evidence.
