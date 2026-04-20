# Quy định soạn thảo Phần II (Core Concepts & Demo cho Fullstack)

Tài liệu này quy định cấu trúc bắt buộc cho **Phần II** của các bài thuộc Fullstack Mastery, ưu tiên demo thiên về **backend implementation**.

### Tiêu đề bắt buộc
Phần 2 phải bắt đầu bằng:
`## II. Bản chất`

---

### Cấu trúc Nội dung: (Trường hợp 1 - Có Source Code Demo)

Nếu bài có source demo, phần này phải giúp học viên hiểu được:

1. hệ thống chạy bằng những service nào,
2. request đi qua các tầng nào,
3. data ghi/đọc ở đâu,
4. và cách tự kiểm chứng bằng API test.

**Quy tắc bắt buộc:**

- **Không nhúng ảnh external**, chỉ dùng sơ đồ bằng ***Mermaid***.
- Luôn có dòng clone source: `Clone tại [đây](url)`.
- Luôn có bảng thành phần (khuyến nghị 5 cột): **Thành phần | Cổng nội bộ | Cổng local | Công nghệ | Trách nhiệm**.
- Luôn có `### Chuẩn bị Môi trường và Luồng Cài đặt`.
- Luôn có `### Kiểm thử ứng dụng (Kiểm tra Flow)`.

### Chuẩn bị Môi trường và Luồng Cài đặt

Mỗi bước trình bày bằng list gạch đầu dòng theo mẫu:

- **1. Prerequisites:** Node version, DB/container, công cụ cần cài.
- **2. Cài dependency:** lệnh cài đặt theo thư mục.
- **3. Lệnh khởi chạy:** app, worker, broker.
- **4. Tín hiệu thành công:** log hoặc trạng thái endpoint.

### Kiểm thử ứng dụng (Kiểm tra Flow)

Mỗi API test bắt buộc có 4 lớp:

1. **Tiêu đề API** (ngữ cảnh + METHOD + URL)
2. **Hướng dẫn Postman** ngắn
3. **Body JSON** nếu có
4. **curl tương đương** copy-paste được

Khi một flow có điểm quan sát rõ:

- dùng `*Kết quả mong đợi:*` (in nghiêng)
- và chốt bằng `*Kết luận:*` (in nghiêng)

---

### Cấu trúc Nội dung: (Trường hợp 2 - Lý thuyết thuần túy, Không có Source Code)

Với bài không có demo chạy code, vẫn phải giữ tư duy kỹ thuật backend:

1. **The Bottleneck Scenario:** mô tả pain-point production.
2. **Evolutionary Architecture:** tối thiểu 2 sơ đồ Mermaid (naive vs improved).
3. **Under-the-hood Mechanics:** giải thích data flow, retry, transaction boundary, hoặc read/write path.
4. **Tech Debt & Trade-offs:** chi phí và rủi ro khi đưa vào production.

**Lưu ý quan trọng:** Không biến phần II thành lý thuyết chung chung; phải có luồng request cụ thể, ví dụ kiểu: ***API Gateway*** -> ***Order Service*** -> ***Inventory Service*** -> ***PostgreSQL*** -> event ra ***Kafka***.
