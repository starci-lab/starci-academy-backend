# Acceptance · Nền tảng website Cộng đồng Doanh nghiệp Tây Sơn

| ID | Observable result | Evidence/test |
|---|---|---|
| `AC-01` | Website công khai hiển thị tốt trên desktop, laptop và thiết bị di động, có SEO cơ bản, SSR và hiệu năng tải trang phù hợp. | `EV-001` |
| `AC-02` | Khách truy cập xem được giới thiệu, thông tin cộng đồng, điều lệ, ban chủ nhiệm, hội viên, doanh nghiệp, tin tức, hoạt động, sự kiện và các chuyên mục đã xuất bản. | `EV-001` |
| `AC-03` | Người đăng ký gửi được biểu mẫu hội viên; hệ thống lưu hồ sơ ở trạng thái new và chỉ công khai hồ sơ approved. | `EV-001` |
| `AC-04` | Khách gửi được biểu mẫu liên hệ hoặc yêu cầu và nhân sự quản trị theo dõi được trạng thái xử lý. | `EV-001` |
| `AC-05` | CMS hỗ trợ đăng nhập, đăng xuất, thêm/sửa/xóa mềm/khóa tài khoản và phân quyền Admin, Manager, Staff. | `EV-001` |
| `AC-06` | CMS quản lý được bài viết, tin tức, hoạt động, sự kiện, banner, menu, danh mục, hội viên, biểu mẫu và cấu hình website. | `EV-001` |
| `AC-07` | API cung cấp đầy đủ giao tiếp giữa website công khai, CMS và backend với kiểm tra quyền phù hợp. | `EV-001` |
| `AC-08` | Các thao tác quản trị thiết yếu tạo audit entry và dữ liệu nghiệp vụ sử dụng xóa mềm. | `EV-001` |
| `AC-09` | Hệ thống có thể tạo backup định kỳ và thực hiện restore khi có sự cố. | `EV-001` |
| `AC-10` | Bên A nhận quyền quản trị để chủ động đăng nhập và chỉnh sửa thông tin trong phạm vi CMS. | `EV-001` |
| `AC-11` | Phiên bản đầu vận hành bằng tiếng Việt và không cung cấp cổng đăng nhập riêng cho hội viên. | `EV-001` |
| `AC-12` | List/detail Tin tức & Hoạt động chỉ đọc nội dung published chưa xóa mềm; danh sách nhóm theo chuyên mục không có filter, search hoặc pagination V1, và draft, archived, deleted hoặc unknown slug không xuất hiện công khai. | `EV-004` |

## Completion

- Every current surface state is represented.
- Every business rule has evidence.
- Every operation has input, output and failure ownership.
- Unknowns are explicit and never rendered as facts.
- FE/BE source heads match the business head.
