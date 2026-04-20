# Quy tắc Soạn thảo Nội dung (Content Creation Guidelines)

Tài liệu này quy định cách viết phần mở đầu cho khóa **Fullstack Developer** theo phong cách ngắn gọn, đi thẳng vào vấn đề, ưu tiên tư duy backend thực chiến.

---

## 1. Quy tắc Ngôn ngữ và Định dạng

- Mỗi bài phải có đủ `vi.md` và `en.md`; viết `vi.md` trước.
- Giọng văn trung lập, chuyên nghiệp, ngôi thứ 3.
- Thuật ngữ kỹ thuật tiếng Anh bắt buộc định dạng `***...***` (ví dụ: ***API***, ***Dependency Injection***, ***trade-off***).

---

## 2. Cấu trúc Nội dung Cơ bản

Mỗi bài giữ đúng 5 phần:

- `## I. Lời mở đầu`
- `## II. Bản chất`
- `## III. Các khái niệm cốt lõi`
- `## IV. Kỹ thuật nâng cao`
- `## V. Các mẫu câu phỏng vấn`

### `## I. Lời mở đầu` (ngắn gọn, đúng trọng tâm)

Phần mở đầu phải trả lời đủ 3 ý trong 1-2 đoạn ngắn:

- **Pain point:** nghẽn hoặc lỗi cụ thể khi dự án lớn lên.
- **Sai lầm phổ biến:** cách làm local-first, copy-paste, hoặc đặt logic sai tầng.
- **Mục tiêu bài:** bài này giúp sửa tư duy gì và giải quyết bằng kỹ thuật nào.

Không viết dài dòng kiểu định nghĩa giáo trình.

---

## 3. Mẫu khuyến nghị (đủ 3 ví dụ)

### Ví dụ 1 - Làm chủ kiến trúc ***NestJS***

Code ***Node.js*** với ***Express*** rất nhanh, nhưng dự án lớn dần thì lạm dụng `new` gây ***tight coupling***: khó test, khó thay thế thành phần, sửa một chỗ dễ vỡ cả cụm. Sai lầm phổ biến là vá cấu trúc thư mục thay vì sửa tư duy kiến trúc.

Bài này tập trung vào ***IoC***, ***Dependency Injection***, và ranh giới ***Module*** để biến backend từ “chạy được” thành “mở rộng được”.

### Ví dụ 2 - Vòng đời ***HTTP Request***

Nhiều đội nhét auth, validate, format response vào cùng controller, khiến route càng ngày càng phình to và khó debug. Sai lầm phổ biến là đặt sai trách nhiệm giữa ***Middleware***, ***Guard***, ***Pipe***, ***Interceptor***.

Bài này giúp đặt đúng logic vào đúng tầng pipeline để request flow rõ ràng, dễ test, và giảm lỗi production.

### Ví dụ 3 - Cấu hình đa môi trường và ***Logging***

Hardcode biến môi trường và dùng `console.log` có thể ổn ở local, nhưng lên production thì lộ secret, log rời rạc, khó truy vết. Sai lầm phổ biến là chỉ nghĩ tới cấu hình và log khi đã gần deploy.

Bài này chuẩn hóa ***ConfigModule***, namespace config, và logger cấu trúc (ví dụ ***Winston***) để cùng một codebase chạy an toàn ở mọi môi trường.