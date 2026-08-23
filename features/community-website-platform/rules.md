# Business rules · Nền tảng website Cộng đồng Doanh nghiệp Tây Sơn

## BR-01

CMS có ba vai trò Admin, Manager và Staff; Admin toàn quyền, Manager quản lý nội dung/hội viên/biểu mẫu/cấu hình, Staff biên tập và xử lý biểu mẫu nhưng không quản lý tài khoản.

- Strength: `confirmed`
- Evidence: `EV-001`

## BR-02

Hồ sơ đăng ký hội viên đi theo new → reviewing → approved hoặc rejected; chỉ approved được hiển thị công khai.

- Strength: `confirmed`
- Evidence: `EV-001`

## BR-03

Nội dung đi theo draft → published → archived; phiên bản đầu không có scheduling hoặc duyệt nhiều cấp.

- Strength: `confirmed`
- Evidence: `EV-001`

## BR-04

Dữ liệu nghiệp vụ được xóa mềm để giữ khả năng audit và phục hồi.

- Strength: `confirmed`
- Evidence: `EV-001`

## BR-05

Phiên bản đầu sử dụng tiếng Việt; đa ngôn ngữ nằm ngoài phạm vi.

- Strength: `confirmed`
- Evidence: `EV-001`

## BR-06

Không có cổng đăng nhập hoặc dashboard riêng cho hội viên trong phạm vi hiện tại.

- Strength: `confirmed`
- Evidence: `EV-001`

## BR-07

Mọi chức năng quản trị yêu cầu đăng nhập và kiểm tra quyền theo vai trò.

- Strength: `confirmed`
- Evidence: `EV-001`

## BR-08

Hệ thống ghi audit cho các thao tác quản trị thiết yếu; tập sự kiện và thời gian lưu chưa được chốt.

- Strength: `partial`
- Evidence: `EV-001`

## BR-09

Hệ thống hỗ trợ backup định kỳ và restore khi có sự cố; lịch, retention, RPO và RTO chưa được chốt.

- Strength: `partial`
- Evidence: `EV-001`

## BR-10

Website công khai phải responsive, SEO cơ bản, SSR và tối ưu hiệu năng trên trình duyệt phổ biến.

- Strength: `confirmed`
- Evidence: `EV-001`

## BR-11

Danh sách nội dung công khai được nhóm theo danh mục đang hoạt động; danh mục theo thứ tự hiển thị và nội dung trong mỗi nhóm theo thời điểm xuất bản mới nhất trước. Phiên bản đầu không có filter, search hoặc pagination.

- Strength: `confirmed`
- Evidence: `EV-004`

## BR-12

Slug nội dung là duy nhất; chỉ nội dung published và chưa xóa mềm được trả về công khai. Draft, archived, deleted hoặc slug không tồn tại đều không được công khai và trang chi tiết trả về not-found.

- Strength: `confirmed`
- Evidence: `EV-001`, `EV-004`

## BR-13

Nội dung chi tiết V1 dùng Markdown được làm sạch; mỗi nội dung có tối đa một hero media MinIO tùy chọn và bắt buộc alt text khi media tồn tại.

- Strength: `confirmed`
- Evidence: `EV-004`
