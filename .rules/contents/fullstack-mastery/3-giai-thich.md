# Quy định soạn thảo Phần III (Fundamentals & Core Concepts)

Tài liệu này quy định cấu trúc bắt buộc cho **Phần III** trong Fullstack Mastery. Trọng tâm là giúp học viên nắm bản chất kỹ thuật bằng ngôn ngữ ngắn, rõ, và bám sát luồng code backend.

### Tiêu đề bắt buộc
Phần 3 bắt đầu bằng:
`## III. Các khái niệm cốt lõi`

---

### Nguyên tắc & Cấu trúc Nội dung

**1. Direct to the point**

- Không copy định nghĩa dài từ tài liệu học thuật.
- Mỗi khái niệm phải được diễn giải bằng **data flow** hoặc **request flow**.
- Ưu tiên câu trả lời kiểu “nó chạy thế nào trong service/backend” thay vì “nó là gì”.

**2. Terminology breakdown**

- Liệt kê từ khóa xuất hiện ở Phần I/II dưới dạng bullet points.
- Giữ nguyên từ khóa kỹ thuật tiếng Anh, định dạng `***...***`.
- Với mỗi từ khóa, nêu: vai trò, điểm dễ sai, và hệ quả nếu dùng sai.

**3. Use-cases**

- Mỗi chủ đề cần 2-3 tình huống “khi nào dùng / khi nào không dùng”.
- Không đưa “best practice” vô điều kiện; phải có điều kiện áp dụng rõ.

**4. Comparison table hoặc sơ đồ chốt**

- Nếu có 2 hướng tiếp cận song song (ví dụ ***REST*** vs ***gRPC***, ***sync*** vs ***async***, ***transaction*** vs ***eventual consistency***), phải có bảng so sánh hoặc sơ đồ Mermaid kết thúc phần.

---

### Ví dụ tham khảo chuẩn mực

**Ví dụ 1 (Retry & Idempotency):**

> ***Retry*** là hành vi client gọi lại khi timeout, còn ***idempotency*** là cơ chế đảm bảo gọi lặp không nhân đôi side effect.
> Nếu endpoint thanh toán không có ***idempotency key***, một timeout giả có thể gây double charge.

**Ví dụ 2 (Connection Pooling):**

> ***Connection pool*** giới hạn và tái sử dụng kết nối DB để tránh quá tải `max_connections`.
> Tăng replica app mà không có pool có thể làm DB sập trước khi app CPU đầy.

**Ví dụ 3 (CQRS):**

> ***CQRS*** tách đường ghi và đường đọc để tối ưu workload khác nhau.
> Đổi lại, hệ thống phải chấp nhận ***eventual consistency*** và thêm chi phí vận hành projection.
