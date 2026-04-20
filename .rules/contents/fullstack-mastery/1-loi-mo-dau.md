# Quy tắc Soạn thảo Nội dung (Fullstack Mastery)

Tài liệu này kế thừa tư duy của bộ `system-design-mastery`, nhưng tối ưu cho khóa **Fullstack** với trọng tâm: **code chạy được**, **kỹ thuật backend**, và khả năng đưa logic vào production an toàn.

---

## 1. Quy tắc Ngôn ngữ và Định dạng

- **Đa ngôn ngữ bắt buộc:** Mỗi bài có đủ `vi.md` và `en.md`.
  - Viết chuẩn ở `vi.md` trước.
  - `en.md` là bản dịch trung thành về kỹ thuật (không tự thêm/bớt ý nghĩa kiến trúc hoặc code flow).
- **Giọng văn:** Trung lập, chuyên nghiệp, ngôi thứ 3, tránh xưng “em/mình/tôi”.
- **Định dạng thuật ngữ tiếng Anh:** Dùng `***...***` cho thuật ngữ kỹ thuật (ví dụ: `***idempotency***`, `***connection pooling***`, `***circuit breaker***`).
- **Code-first:** Khi có thể minh họa bằng code/config/test thì ưu tiên code thay vì diễn giải mơ hồ.

---

## 2. Cấu trúc Nội dung Cơ bản

Mỗi bài bắt buộc giữ đúng 5 phần:

- `## I. Lời mở đầu`
- `## II. Bản chất`
- `## III. Các khái niệm cốt lõi`
- `## IV. Kỹ thuật nâng cao`
- `## V. Ứng dụng trong hệ thống thực tế`

### `## I. Lời mở đầu`

- Giữ nguyên tiêu đề trên.
- Mở đầu bằng bối cảnh phỏng vấn hoặc bug production thật, không mở bằng định nghĩa sách vở.
- Đoạn mở đầu cần trả lời 3 ý:
  1. **Pain point:** lỗi gì, nghẽn gì, user thấy gì.
  2. **Sai lầm phổ biến:** cách làm “chạy được ở local” nhưng gãy ở production.
  3. **Mục tiêu bài:** bài này sẽ sửa lỗi tư duy nào bằng kỹ thuật/cấu hình gì.

**Mẫu khuyến nghị:**

Đi phỏng vấn ***Senior Backend***, ứng viên gặp câu hỏi về timeout liên service hoặc dữ liệu ghi trùng khi retry. Ứng viên trả lời theo kiểu “thêm RAM”, “retry vô hạn”, hoặc “bắn thẳng DB là xong”. Đây là tư duy local-first, thiếu production guardrails. Bài học sẽ làm rõ cách thiết kế luồng gọi, ***idempotency*** và quan sát hệ thống để xử lý đúng ở quy mô thật.
