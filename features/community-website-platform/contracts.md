# Contracts · Nền tảng website Cộng đồng Doanh nghiệp Tây Sơn

## Entity · Tài khoản quản trị (`admin-user`)

Fields: `Thông tin tài khoản`, `Trạng thái hoạt động hoặc bị khóa`, `Vai trò Admin, Manager hoặc Staff`, `Dấu thời gian xóa mềm`

Evidence: `EV-001`

## Entity · Đăng ký hội viên (`member-application`)

Fields: `Dữ liệu biểu mẫu do người đăng ký cung cấp`, `Trạng thái xử lý`, `Thời điểm gửi`, `Dấu thời gian xóa mềm`

Evidence: `EV-001`

## Entity · Hồ sơ hội viên và doanh nghiệp (`member-profile`)

Fields: `Thông tin doanh nghiệp`, `Trạng thái duyệt`, `Trạng thái công khai`, `Dấu thời gian xóa mềm`

Evidence: `EV-001`

## Entity · Nội dung website (`content-entry`)

Fields: `Loại nội dung`, `Danh mục`, `Slug duy nhất`, `Tiêu đề`, `Nội dung Markdown`, `Hero media key MinIO tùy chọn`, `Alt text bắt buộc khi có hero media`, `Trạng thái draft, published hoặc archived`, `Dấu thời gian xuất bản`, `Dấu thời gian xóa mềm`

Evidence: `EV-001`, `EV-004`

## Entity · Danh mục (`category`)

Fields: `Slug duy nhất`, `Nhãn chuyên mục`, `Thứ tự hiển thị`, `Trạng thái hoạt động`

Evidence: `EV-001`, `EV-004`

## Entity · Dữ liệu biểu mẫu (`form-submission`)

Fields: `Loại biểu mẫu`, `Payload người dùng gửi`, `Trạng thái xử lý`, `Thời điểm gửi`, `Dấu thời gian xóa mềm`

Evidence: `EV-001`

## Entity · Cấu hình website (`site-configuration`)

Fields: `Thông tin website`, `Banner`, `Menu`, `Thông tin liên hệ`, `Cấu hình cơ bản`

Evidence: `EV-001`

## Entity · Nhật ký quản trị (`audit-entry`)

Fields: `Người thao tác`, `Hành động`, `Đối tượng`, `Thời điểm`, `Chi tiết cần thiết`

Evidence: `EV-001`

## Entity · Bản sao lưu (`backup-record`)

Fields: `Thời điểm tạo`, `Trạng thái`, `Vị trí lưu trữ`, `Kết quả restore nếu có`

Evidence: `EV-001`

## Operation · Đọc danh sách nội dung công khai

- Kind/owner: `query` / `backend`
- Inputs: Không có
- Outputs: Các danh mục đang hoạt động cùng nội dung published, chưa xóa mềm, theo thứ tự danh mục và publishedAt giảm dần
- Failures: Không thể tải danh sách, Vượt quá 50 danh mục đang hoạt động hoặc 500 nội dung published chưa xóa mềm
- Evidence: `EV-001`, `EV-004`, `EV-005`

## Operation · Đọc chi tiết nội dung công khai

- Kind/owner: `query` / `backend`
- Inputs: Slug nội dung
- Outputs: Một nội dung published và chưa xóa mềm
- Failures: Không tìm thấy, Nội dung draft, archived hoặc đã xóa mềm
- Evidence: `EV-001`, `EV-004`

## Operation · Đọc hội viên công khai

- Kind/owner: `query` / `backend`
- Inputs: Phân trang hoặc định danh
- Outputs: Hồ sơ hội viên đã duyệt và công khai
- Failures: Không tìm thấy
- Evidence: `EV-001`

## Operation · Gửi đăng ký hội viên

- Kind/owner: `mutation` / `backend`
- Inputs: Dữ liệu biểu mẫu đăng ký
- Outputs: Đăng ký trạng thái new, Xác nhận tiếp nhận
- Failures: Dữ liệu không hợp lệ, Không thể lưu
- Evidence: `EV-001`

## Operation · Gửi biểu mẫu liên hệ

- Kind/owner: `mutation` / `backend`
- Inputs: Dữ liệu liên hệ hoặc yêu cầu
- Outputs: Biểu mẫu trạng thái new, Xác nhận tiếp nhận
- Failures: Dữ liệu không hợp lệ, Không thể lưu
- Evidence: `EV-001`

## Operation · Đăng nhập quản trị

- Kind/owner: `mutation` / `backend`
- Inputs: Thông tin đăng nhập
- Outputs: Phiên xác thực và quyền
- Failures: Sai thông tin, Tài khoản bị khóa, Không đủ quyền
- Evidence: `EV-001`

## Operation · Đăng xuất quản trị

- Kind/owner: `mutation` / `backend`
- Inputs: Phiên hiện tại
- Outputs: Phiên bị kết thúc
- Failures: Phiên không hợp lệ
- Evidence: `EV-001`

## Operation · Quản lý tài khoản và phân quyền

- Kind/owner: `command` / `backend`
- Inputs: Thông tin tài khoản, Vai trò, Trạng thái khóa
- Outputs: Tài khoản đã cập nhật, Audit entry
- Failures: Không đủ quyền, Dữ liệu không hợp lệ, Xung đột tài khoản
- Evidence: `EV-001`

## Operation · Quản lý và xuất bản nội dung

- Kind/owner: `command` / `backend`
- Inputs: Nội dung, Danh mục, Trạng thái
- Outputs: Nội dung đã cập nhật, Audit entry
- Failures: Không đủ quyền, Dữ liệu không hợp lệ, Không tìm thấy
- Evidence: `EV-001`

## Operation · Xử lý đăng ký hội viên

- Kind/owner: `command` / `backend`
- Inputs: Định danh đăng ký, Quyết định
- Outputs: Trạng thái đăng ký, Hồ sơ công khai nếu approved, Audit entry
- Failures: Không đủ quyền, Chuyển trạng thái không hợp lệ, Không tìm thấy
- Evidence: `EV-001`

## Operation · Cập nhật cấu hình website

- Kind/owner: `command` / `backend`
- Inputs: Banner, Menu, Thông tin liên hệ, Cấu hình cơ bản
- Outputs: Cấu hình đã cập nhật, Audit entry
- Failures: Không đủ quyền, Dữ liệu không hợp lệ
- Evidence: `EV-001`

## Operation · Tạo backup

- Kind/owner: `command` / `provider`
- Inputs: Phạm vi backup
- Outputs: Backup record
- Failures: Lưu trữ không khả dụng, Backup thất bại
- Evidence: `EV-001`

## Operation · Khôi phục dữ liệu

- Kind/owner: `command` / `provider`
- Inputs: Định danh backup
- Outputs: Kết quả restore
- Failures: Backup không hợp lệ, Restore thất bại
- Evidence: `EV-001`

No field, failure or operation may appear here without routed source evidence.
