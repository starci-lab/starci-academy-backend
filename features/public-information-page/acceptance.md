# Acceptance · Trang thông tin cộng đồng Tây Sơn

| ID | Observable result | Evidence/test |
|---|---|---|
| `AC-01` | Khách mở /gioi-thieu và thấy một trang thông tin hoàn chỉnh bằng tiếng Việt trên desktop và thiết bị di động. | `EV-001`, `EV-002` |
| `AC-02` | Trang có metadata SEO cơ bản và được render bằng route Next.js hỗ trợ SSR. | `EV-001`, `EV-002` |
| `AC-03` | Khối tài liệu hiển thị đúng loading, ready, error và unavailable mà không thay đổi chrome hay cấu trúc trang. | `EV-002` |
| `AC-04` | Ready chỉ hiển thị nội dung được đánh dấu đã xuất bản; lỗi có hành động tải lại rõ ràng. | `EV-001`, `EV-002` |
| `AC-05` | Không có tên nhân sự, điều khoản điều lệ hoặc dữ kiện pháp lý được tự tạo khi chưa có nội dung owner cung cấp. | `EV-002` |

## Completion

- Every current surface state is represented.
- Every business rule has evidence.
- Every operation has input, output and failure ownership.
- Unknowns are explicit and never rendered as facts.
- FE/BE source heads match the business head.
