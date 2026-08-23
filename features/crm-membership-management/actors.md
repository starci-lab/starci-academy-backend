# Actors · CRM quản lý hồ sơ hội viên Tây Sơn

## Nhân viên vận hành (`staff`)

Can:

- Xem hàng đợi hồ sơ hội viên trong phạm vi được phân quyền
- Mở hồ sơ và chuyển hồ sơ mới sang đang xem xét
- Không quản lý tài khoản quản trị

Evidence: `EV-001`, `EV-002`

## Quản lý (`manager`)

Can:

- Xem và xử lý hồ sơ hội viên
- Duyệt hoặc từ chối hồ sơ đang xem xét

Evidence: `EV-001`, `EV-002`

## Quản trị viên (`admin`)

Can:

- Thực hiện mọi thao tác quản lý hồ sơ hội viên đã được duyệt trong scope
- Nhận trạng thái và hành động tương ứng với quyền quản trị

Evidence: `EV-001`, `EV-002`
