# Flow · Tiếp nhận và quyết định hồ sơ hội viên

> ID: `review-membership-application` · Trigger: Người dùng quản trị được phân quyền mở CRM hội viên tại /hoi-vien

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | `staff` | `crm-membership-management` | Mở hàng đợi hồ sơ hội viên | Thấy các hồ sơ được phép xem cùng trạng thái xử lý hiện tại |
| 2 | `staff` | `crm-membership-management` | Mở một hồ sơ mới | Thấy đầy đủ trường hồ sơ CRM V1, trạng thái new và phân loại rõ trường nội bộ với trường được phép công khai |
| 3 | `staff` | `crm-membership-management` | Bắt đầu xem xét hồ sơ | Hồ sơ chuyển từ new sang reviewing |
| 4 | `manager` | `crm-membership-management` | Xác nhận duyệt hoặc từ chối hồ sơ đang xem xét | Hồ sơ chuyển sang approved hoặc rejected; từ chối có lý do bắt buộc, duyệt có ghi chú nội bộ tùy chọn và toàn bộ quyết định được ghi audit |

## Outcomes

- Hồ sơ có một trạng thái xử lý hợp lệ và quyết định có dấu vết audit
- Hồ sơ approved đủ điều kiện tạo hồ sơ công khai
- Hồ sơ rejected không được công khai

Evidence: `EV-001`, `EV-002`, `EV-003`
