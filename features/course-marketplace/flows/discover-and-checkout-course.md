# Flow · Khám phá và thanh toán khóa học

> ID: `discover-and-checkout-course` · Trigger: Người mua mở danh mục hoặc giỏ.

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | `buyer` | `course-catalog` | Tìm, lọc và mở một khóa học. | Chi tiết khóa được mở hoặc danh mục được phân trang. |
| 2 | `buyer` | `course-detail` | Đọc chi tiết và chọn mua. | Khóa học được thêm vào giỏ hoặc chuyển sang học nếu đã sở hữu. |
| 3 | `buyer` | `course-cart` | Xác nhận các dòng và bắt đầu thanh toán. | Người mua được chuyển tới checkoutUrl của provider. |

## Outcomes

- Khóa đã sở hữu không xuất hiện như món cần mua
- Checkout chỉ trả URL và giao dịch pending

Evidence: `EV-001`, `EV-002`, `EV-003`
