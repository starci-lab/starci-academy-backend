# Flow · Đọc thông tin công khai từ backend

> ID: `read-public-information-from-api` · Trigger: Frontend trang /gioi-thieu yêu cầu tài liệu thông tin công khai theo định danh

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | `visitor` | `public-information` | Mở trang /gioi-thieu | Frontend yêu cầu tài liệu công khai từ backend |
| 2 | `visitor` | `public-information` | Chờ backend phân giải định danh tài liệu | Backend chỉ trả tài liệu published hoặc một kết quả không khả dụng ổn định |
| 3 | `visitor` | `public-information` | Đọc các phần nội dung đã xuất bản | Thấy tiêu đề và các phần nội dung theo đúng thứ tự |

## Outcomes

- Khách đọc được tài liệu thông tin công khai đã xuất bản từ backend
- Khách nhận trạng thái unavailable khi không có phiên bản công khai phù hợp
- Khách nhận trạng thái error ổn định khi backend không thể tải dữ liệu

Evidence: `EV-001`, `EV-002`, `EV-003`
