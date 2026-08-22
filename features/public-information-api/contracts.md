# Contracts · API thông tin công khai Tây Sơn

## Entity · Tài liệu thông tin công khai (`public-information-document`)

Fields: `Định danh tài liệu công khai`, `Tiêu đề tài liệu`, `Các phần nội dung theo thứ tự`, `Trạng thái xuất bản`

Evidence: `EV-001`, `EV-002`, `EV-003`

## Operation · Đọc tài liệu thông tin công khai

- Kind/owner: `query` / `backend`
- Inputs: Định danh tài liệu công khai
- Outputs: Tiêu đề đã xuất bản, Các phần nội dung đã xuất bản theo thứ tự, Trạng thái hiển thị
- Failures: Nội dung chưa khả dụng, Không thể tải dữ liệu
- Evidence: `EV-001`, `EV-002`, `EV-003`

No field, failure or operation may appear here without routed source evidence.
