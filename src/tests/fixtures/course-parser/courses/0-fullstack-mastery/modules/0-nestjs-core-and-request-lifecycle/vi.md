# sortIndex
<!-- @starci/seperator -->
1
<!-- @starci/seperator -->
# contentType
<!-- @starci/seperator -->
foundation
<!-- @starci/seperator -->
# title
<!-- @starci/seperator -->
Nền tảng backend: Framework, vòng đời request, cấu hình và logging
<!-- @starci/seperator -->
# description
<!-- @starci/seperator -->
Nắm các khái niệm nền tảng của một backend production: vai trò của framework và inversion of control, vòng đời request/response, cấu hình đa môi trường, và logging có cấu trúc. NestJS được dùng làm ví dụ minh họa, nhưng kiến thức áp dụng cho mọi ngôn ngữ.
<!-- @starci/seperator -->
# previewContents
## 0
### text
<!-- @starci/seperator -->
Framework backend làm gì cho bạn: chia code thành module, tự khởi tạo và ghép nối thành phần qua inversion of control.
<!-- @starci/seperator -->
## 1
### text
<!-- @starci/seperator -->
Vòng đời request/response: thứ tự cố định của các tầng xử lý trước khi vào business logic và quay ra.
<!-- @starci/seperator -->
## 2
### text
<!-- @starci/seperator -->
Cấu hình đa môi trường: tách config khỏi code, chọn profile theo thứ tự ưu tiên, và type-hóa cấu hình.
<!-- @starci/seperator -->
## 3
### text
<!-- @starci/seperator -->
Logging chuẩn production: structured logging, transport pattern fan-out nhiều đích, và một pipeline log thống nhất.
<!-- @starci/seperator -->
## 4
### text
<!-- @starci/seperator -->
Xử lý lỗi & chuẩn hóa response lỗi: mọi lỗi được xử lý tập trung, chuẩn hóa thành một error envelope nhất quán, đúng HTTP code, không lộ stack trace ra client.
<!-- @starci/seperator -->
