# Flow · Mua quyền truy cập

> ID: `purchase-access` · Trigger: Khách mở /[lang]/pricing và chọn một offer.

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | `customer` | `pricing` | So sánh và chọn offer. | Checkout details được tạo cho thành viên hoặc yêu cầu đăng nhập được mở. |
| 2 | `customer` | `payment-return` | Trở về từ provider và kiểm tra trạng thái. | Succeeded cấp quyền; Unpaid không cấp; Pending tiếp tục chờ. |

## Outcomes

- Checkout transaction được tạo
- Membership hoặc entitlement chỉ cấp khi paid
- Expired/unpaid không cấp quyền

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`
