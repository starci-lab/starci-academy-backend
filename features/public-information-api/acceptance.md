# Acceptance · API thông tin công khai Tây Sơn

| ID | Observable result | Evidence/test |
|---|---|---|
| `AC-01` | Frontend yêu cầu một định danh tài liệu hợp lệ và nhận tiêu đề cùng các phần nội dung theo thứ tự khi có phiên bản published. | `EV-002`, `EV-003` |
| `AC-02` | Tài liệu draft, archived hoặc không tồn tại trả kết quả unavailable mà không chứa nội dung bị ẩn. | `EV-001`, `EV-003` |
| `AC-03` | Lỗi đọc dữ liệu trả kết quả ổn định để frontend hiển thị information-error và cho phép tải lại theo contract trang. | `EV-002`, `EV-003` |
| `AC-04` | Capability không thêm mutation CMS, xác thực quản trị hoặc nội dung chính thức chưa được owner cung cấp. | `EV-003` |

## Completion

- Every current surface state is represented.
- Every business rule has evidence.
- Every operation has input, output and failure ownership.
- Unknowns are explicit and never rendered as facts.
- FE/BE source heads match the business head.
