# Overview · API thông tin công khai Tây Sơn

## Purpose

Backend cung cấp truy vấn chỉ đọc tài liệu thông tin công khai đã xuất bản cho trang /gioi-thieu, với kết quả ổn định để frontend hiển thị ready, unavailable hoặc error mà không làm lộ nội dung nháp hay đã lưu trữ.

## Included

- Truy vấn backend chỉ đọc tài liệu thông tin công khai cho trang /gioi-thieu
- Nhận định danh tài liệu công khai và trả tiêu đề cùng các phần nội dung theo thứ tự
- Chỉ trả nội dung có trạng thái published
- Kết quả ổn định cho ready, unavailable và error
- Kết nối contract giữa frontend Tây Sơn và backend Tây Sơn

## Excluded

- Mutation tạo, sửa, xuất bản hoặc lưu trữ nội dung trong CMS
- Xác thực và phân quyền quản trị CMS
- Công khai nội dung draft hoặc archived
- Tự tạo tên ban chủ nhiệm, điều khoản điều lệ hoặc dữ kiện pháp lý chưa được owner cung cấp
- Khóa transport REST hoặc GraphQL và database schema trước backend planning

## Source heads

| Role | Repository | Head |
|---|---|---|
| fe | local-only:D:/Repositories/tayson-fe | `3fa4956e035a06ca0afebb7b30659ad2ee8724a2` |
| be | local-only:D:/Repositories/tayson-backend | `661c37a1c6bb29540f0c644680e295abcf5267c7` |
