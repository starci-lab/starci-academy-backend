# Quy tắc Soạn thảo Nội dung (Content Creation Guidelines)

Tài liệu này quy định cấu trúc và văn phong chuẩn khi tạo mới hoặc chỉnh sửa các nội dung bài học trong hệ thống. Vui lòng bỏ qua toàn bộ quy tắc cũ và chỉ áp dụng những định dạng sau đây.

---

## 1. Quy tắc Ngôn ngữ và Định dạng

- **Quy định Đa ngôn ngữ:** Mỗi bài học bắt buộc phải tồn tại 2 file là `vi.md` (Tiếng Việt) và `en.md` (Tiếng Anh). 
  - Mặc định viết ưu tiên cho file `vi.md` trước. 
  - File `en.md` đóng vai trò là bản dịch chính xác từ file `vi.md` sang.
- **Giọng văn:** Cần giữ văn phong trung lập, chuyên nghiệp, bắt buộc dùng **ngôi thứ 3** thay vì xưng hô cá nhân.
- **Định dạng Thuật ngữ tiếng Anh:** Khi sử dụng các từ chuyên ngành thuộc tiếng Anh (ví dụ: ***trade-off***, ***API***, ***Single Point of Failure***...), yêu cầu bắt buộc phải **tô đậm** và *in nghiêng* đồng thời định dạng thống nhất bằng cú pháp `***từ_khóa_tiếng_Anh***`. Áp dụng ngay cả khi đang hành văn trong tệp tiếng Việt.

---

## 2. Cấu trúc Nội dung Cơ bản

Bất kỳ một bài đọc nào cũng bắt buộc phải được chia thành **đúng 5 phần** (theo số thứ tự La Mã). 

### ## I. Lời mở đầu

- **Bắt buộc giữ nguyên tiêu đề:** `## I. Lời mở đầu`
- **Tư duy (Concept):** Tuyệt đối không viết theo kiểu "định nghĩa" hay "giới thiệu" máy móc. Phải viết theo kiểu "kể chuyện" (human style). Bắt đầu bằng một màn hội thoại phỏng vấn ***Senior Backend*** thực tế nhưng không được dùng danh sách gạch đầu dòng (li) cho lời thoại. Không sử dụng nhãn "- *The Hook:*" để bắt đầu phần phân tích.

**Cách thức triển khai:**
1. **Dẫn dắt:** "Đi phỏng vấn ***Senior Backend***, bạn gặp câu:"
2. **Câu hỏi:** Đặt trong dấu ngoặc kép `"..."`.
3. **Câu trả lời của ứng viên:** Viết theo dạng `Ứng viên trả lời: "..."`.
4. **Phân tích và Dẫn dắt:** Viết thành một đoạn văn (paragraph) ngay bên dưới, phân tích trực diện sự yếu kém của câu trả lời và dẫn vào giải pháp/kiến thức của bài học.

**Ví dụ chuẩn (Bài Introduction to Kubernetes):**

## I. Lời mở đầu

Đi phỏng vấn ***Senior Backend***, bạn gặp câu:

"Ứng dụng của em kết nối ***Database*** bằng ***IP*** cứng trong file `.env`. Bây giờ ***Pod Database*** bị ***crash*** và ***Kubernetes*** tạo lại ***Pod*** mới với ***IP*** khác — em xử lý thế nào?"

Ứng viên trả lời: "Em sẽ vào file `.env` sửa lại ***IP*** mới rồi ***restart Backend*** ạ."

Câu trả lời đó chứng tỏ ứng viên chưa chạm vào ***Kubernetes*** ở quy mô thật. Trên ***production***, ***Container*** có thể chết bất cứ lúc nào, ***IP*** thay đổi liên tục. Khi cần ***scale*** lên 10 bản sao để chịu tải, việc cấu hình thủ công sẽ trở thành thảm họa. ***Kubernetes*** giải quyết bài toán này không bằng cách cố giữ cho ***container*** sống mãi, mà bằng cách trừu tượng hóa chúng thành các đối tượng có khả năng ***Self-healing*** và ***Service Discovery***. Bộ ba ***Pod***, ***Deployment*** và ***Service*** chính là nền móng của toàn bộ kiến trúc đó.

**(Áp dụng tương tự cho các bài học khác, đảm bảo văn phong gãy gọn, authoritative và không dùng list items cho hội thoại).**

*(Các phần từ `## II` đến `## V` sẽ đi từng bước phân mảng sâu hơn vào kiến thức cốt lõi, demo thực hành, ưu nhược điểm ***trade-offs*** và cuối cùng là chốt lại vấn đề của từng bài).*