# Quy định soạn thảo Phần III (Fundamentals & Core Concepts)

Tài liệu này quy định cấu trúc bắt buộc cho **Phần III** trong Fullstack Mastery theo hướng **code-first**. Mục tiêu là giúp học viên hiểu bản chất kỹ thuật bằng ngôn ngữ ngắn gọn, gắn trực tiếp với luồng chạy backend và dễ đối chiếu source.

### Tiêu đề bắt buộc
Phần 3 bắt đầu bằng:
`## III. Các khái niệm cốt lõi`

---

### Nguyên tắc & Cấu trúc Nội dung

**1. Direct to the point (nói thẳng cách chạy)**

- Không copy định nghĩa hàn lâm dài dòng.
- Mỗi khái niệm phải trả lời được: request vào đâu, code chạy qua lớp nào, dữ liệu đi đâu.
- Ưu tiên mô tả theo `Controller -> Service -> Repository/Model -> DB/Cache` thay vì mô tả lý thuyết chung.

**2. Terminology breakdown (từ khóa + vai trò)**

- Liệt kê từ khóa đã xuất hiện ở Phần I/II dưới dạng bullet points.
- Giữ nguyên từ khóa tiếng Anh, định dạng `***...***`.
- Mỗi từ khóa cần có 3 ý: vai trò, lỗi dùng sai phổ biến, hệ quả production.

**3. Use-cases (khi nào dùng / khi nào không)**

- Mỗi chủ đề cần 2-3 tình huống áp dụng rõ ràng trong dự án Fullstack/backend.
- Không viết “best practice” vô điều kiện; luôn có bối cảnh (traffic, consistency, độ phức tạp team, chi phí vận hành).

**4. Comparison table hoặc sơ đồ chốt**

- Nếu có hai hướng tiếp cận song song (ví dụ ***REST*** vs ***gRPC***, ***sync*** vs ***async***, ***transaction*** vs ***eventual consistency***), bắt buộc chốt bằng bảng so sánh hoặc Mermaid.
- Bảng/sơ đồ phải giúp người học ra quyết định kỹ thuật, không chỉ nhắc lại định nghĩa.

**5. Gắn với code execution (khuyến khích mạnh)**

- Có thể chèn snippet `ts` ngắn để minh hoạ điểm call chính.
- Nếu nhắc flow quan trọng, nên ghi file:line dạng `src/users/users.service.ts:42` để học viên check code nhanh.

---

### Ví dụ tham khảo chuẩn mực

**Ví dụ 1 (Retry & Idempotency):**

- ***Retry*** là hành vi client gọi lại khi timeout.
- ***Idempotency*** đảm bảo gọi lặp không nhân đôi side effect.
- Ở backend thanh toán, thiếu ***idempotency key*** có thể gây double charge khi client retry.

**Ví dụ 2 (Connection Pooling):**

- ***Connection pool*** giới hạn và tái sử dụng kết nối DB để tránh vượt `max_connections`.
- Tăng replica app mà không có pool thường làm DB nghẽn trước khi app CPU đầy.
- Flow điển hình: `Service` lấy connection từ pool -> query -> release connection.

**Ví dụ 3 (Database Indexing):**

- ***Database Index*** giúp tăng tốc truy vấn ở các cột lọc/tìm kiếm thường dùng (ví dụ `email`, `created_at`).
- Không có index, query dễ rơi vào full table scan khi dữ liệu lớn.
- Đánh đổi: tốc độ ghi có thể chậm hơn một chút và tốn thêm dung lượng lưu index.
