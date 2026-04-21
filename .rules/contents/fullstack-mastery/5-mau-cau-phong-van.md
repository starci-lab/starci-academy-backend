# Quy định soạn thảo Phần V (Các mẫu câu phỏng vấn)

Tài liệu này quy định cấu trúc cho phần **mẫu câu phỏng vấn** ở cuối bài học Fullstack. Mục tiêu là giúp học viên tự kiểm tra mức hiểu theo hướng backend thực chiến, thay vì học thuộc định nghĩa.

### Tiêu đề bắt buộc
Phần 5 của bài học bắt buộc phải bắt đầu bằng tiêu đề (Heading 2):
`## V. Các mẫu câu phỏng vấn`

---

### Nguyên tắc & Cấu trúc Nội dung

**1. Số lượng câu hỏi bắt buộc:**  
Tác giả **BẮT BUỘC** đưa từ **3 đến 5** câu hỏi phỏng vấn cho mỗi bài. Không viết 1-2 câu quá ngắn, cũng không kéo dài thành danh sách dài gây loãng trọng tâm.

**2. Cấu trúc mỗi câu hỏi:**  
Mỗi câu hỏi phải có đủ 3 lớp (không chỉ nêu câu hỏi trống):

- **Câu hỏi phỏng vấn:** Viết rõ ngữ cảnh theo kiểu interviewer hỏi trong thực tế.
- **Ý cần đánh giá:** Nêu interviewer đang kiểm tra năng lực gì (tư duy luồng chạy, xử lý lỗi, trade-off, tối ưu DB...).
- **Hướng trả lời kỳ vọng:** Tóm tắt 2-4 ý chính ứng viên nên đề cập (không cần đáp án dài như giáo trình).

**3. Bám phạm vi bài học (bắt buộc):**  
Câu hỏi phải bám trực tiếp nội dung bài vừa học (ví dụ ***DI***, ***Middleware***, ***Connection Pool***, ***Index***...).  
**Cấm** đặt câu hỏi vượt quá phạm vi khiến học viên phải đoán kiến thức chưa được dạy.

**4. Ưu tiên ngữ cảnh production:**  
Ưu tiên câu hỏi kiểu “nếu lỗi X xảy ra trên production thì xử lý thế nào” hơn câu hỏi “định nghĩa là gì”.

**5. Tham chiếu chéo tới bài học:**  
Khuyến khích ghi rõ liên hệ với các phần trước trong bài như **mục II–III**, **mục IV** để học viên biết ôn lại phần nào.

---

### Ví dụ tham khảo chuẩn mực

**Ví dụ bài: NestJS Request Lifecycle**  
*(Lưu ý: ví dụ dưới mang tính định hướng. Khi áp dụng vào bài thật, thay đúng theo nội dung đã dạy.)*

1. **Câu hỏi phỏng vấn:**  
   “Trong NestJS, request đi qua những lớp nào trước khi vào controller, và vì sao không nên validate trực tiếp trong controller?”
   - **Ý cần đánh giá:** Ứng viên có nắm đúng thứ tự pipeline và trách nhiệm từng lớp hay không.
   - **Hướng trả lời kỳ vọng:** Nêu được luồng ***Middleware*** -> ***Guard*** -> ***Interceptor*** -> ***Pipe*** -> Controller -> Service; giải thích validate nên để ở ***Pipe*** để tách concern.

2. **Câu hỏi phỏng vấn:**  
   “Nếu endpoint `GET /items/:id` bị gửi `id=abc`, ứng dụng nên fail ở đâu để tối ưu tài nguyên?”
   - **Ý cần đánh giá:** Khả năng thiết kế fail-fast và đặt logic đúng tầng.
   - **Hướng trả lời kỳ vọng:** Chặn sớm ở ***Pipe*** (ví dụ `ParsePositiveIntPipe`), trả lỗi **400**, không cho controller/service execute.

3. **Câu hỏi phỏng vấn:**  
   “Khi service A gọi service B qua DI trong cùng ứng dụng, đâu là dấu hiệu bạn đã thiết kế module sai ranh giới?”
   - **Ý cần đánh giá:** Hiểu ranh giới module, export/import provider và coupling.
   - **Hướng trả lời kỳ vọng:** Nêu được provider chưa export, module phụ thuộc vòng, service biết quá nhiều domain khác; đề xuất tách lại module hoặc refactor contract.