# Overview · CRM quản lý hồ sơ hội viên Tây Sơn

## Purpose

CRM nội bộ tại /hoi-vien cho phép nhân sự được phân quyền tiếp nhận, xem xét và quyết định hồ sơ đăng ký hội viên theo vòng đời đã duyệt, đồng thời chỉ cho phép hồ sơ được phê duyệt trở thành hồ sơ công khai.

## Included

- Bề mặt CRM nội bộ quản lý hồ sơ hội viên tại route /hoi-vien
- Đọc hàng đợi hồ sơ đăng ký hội viên theo quyền của người dùng quản trị
- Xem một hồ sơ cùng dữ liệu do người đăng ký cung cấp và trạng thái xử lý
- Chuyển hồ sơ new sang reviewing rồi approved hoặc rejected theo quyền
- Tạo dấu vết audit cho quyết định xử lý hồ sơ
- Chỉ cho phép hồ sơ approved đủ điều kiện xuất hiện công khai

## Excluded

- Biểu mẫu đăng ký hội viên công khai
- Danh bạ hội viên công khai
- Cổng đăng nhập hoặc dashboard riêng cho hội viên
- CRM bán hàng, thanh toán, ticket hoặc chăm sóc khách hàng
- Quản trị nội dung website, biểu mẫu liên hệ hoặc cấu hình hệ thống
- Quản lý tài khoản quản trị và cơ chế khôi phục đăng nhập
- Upload hoặc lưu trữ file
- Công khai tên người đại diện, chức vụ, địa chỉ, email, điện thoại hoặc mã số thuế của hồ sơ hội viên

## Source heads

| Role | Repository | Head |
|---|---|---|
| fe | local-only:D:/Repositories/tayson-fe | `6a954d40294c3dfaf7678d2eb4c34c1cd3c389d2` |
| be | local-only:D:/Repositories/tayson-backend | `661c37a1c6bb29540f0c644680e295abcf5267c7` |
