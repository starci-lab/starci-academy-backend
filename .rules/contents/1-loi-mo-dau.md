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
- **Tư duy (Concept):** Phần Lời mở đầu phải luôn bắt đầu bằng một kịch bản phỏng vấn thực tế. Đặt người đọc vào một tình huống họ cố ý trả lời sai/hời hợt, để Interviewer có cớ hỏi xoáy sâu thêm, từ đó xây dựng nhu cầu dẫn dắt vào bài kiến thức mới. 

**Cách thức triển khai:**
1. **Câu hỏi tình huống:** Bắt đầu với câu hỏi hóc búa của người phỏng vấn (Interviewer). Cấu trúc hỏi càng tường minh, sát với vấn đề bài giảng càng tốt. 
2. **Phản xạ thông thường (Có tính chuyên môn nhưng chưa tối ưu):** Mô tả câu trả lời của một ứng viên có kinh nghiệm nhất định. Khuyến khích đưa ra câu trả lời thoạt nghe có vẻ hợp lý và "thông minh" một chút (có yếu tố kỹ thuật, thực tế), mục đích là để ứng viên tự tạo ra điểm mù kiến trúc tổng thể.
3. **Chốt hạ vấn đề (Hook):** Người phỏng vấn từ chối (lắc đầu) trước đáp án vòng vo trên. Lúc này, người học lĩnh hội được rằng họ thực sự phải nắm được phương thức **<kiến thức_mới / thuật_ngữ_mới>**. 
4. **Giới hạn nội dung:** Trình bày lý thuyết sơ lược không đi sâu.

**3 Ví dụ thực tế về Concept Phỏng vấn này (Để context tường minh hơn):**

- **Ví dụ 1 (Bài API Gateway):** 
  - *Interviewer:* "Hệ thống có 10 ***microservices***, mỗi ***service*** một cổng — app mobile gọi thẳng từng ***service*** à? Nếu có thì ***auth***, ***rate-limit*** và ***log*** em đặt ở đâu?"
  - *Ứng viên trả lời:* "Em sẽ đóng gói ***auth logic*** thành một thư viện dùng chung (***shared library / npm package***) và đưa vào từng ***service*** để tái sử dụng code chung."
  - *The Hook:* Interviewer lắc đầu. Đáp án đó thông minh nhưng nếu phát hiện lỗi bảo mật, bạn phải chạy ***pipeline deploy*** và khởi động lại toàn bộ 10 dự án. Cách giải quyết triệt để là rút chức năng định tuyến đó đặt vào một lớp ***Gateway*** trung gian...

- **Ví dụ 2 (Bài Database Scaling):** 
  - *Interviewer:* "Lưu lượng ghi (***Write traffic***) hệ thống đột ngột tăng 10x và ***CPU Database*** chạm 100%, bạn xử lý thế nào?"
  - *Ứng viên trả lời:* "Em dựng cụm ***PostgreSQL HA*** và lắp thêm các cụm báo cáo ***Read Replica***, dùng ***Pgpool*** ngắt mọi lệnh đọc sang ***Replica*** để nhường lại CPU cho Node phụ trách ghi."
  - *The Hook:* Interviewer lắc đầu từ chối. Kéo ***Replica*** chỉ giải quyết được tải Đọc. Tải Ghi của bạn tăng 10x đồng nghĩa toàn bộ luồng ***Write*** vẫn nã thẳng vào một cổng ***Master*** duy nhất và gây thủng hệ thống. Chỉ có con đường phân mảnh dữ liệu cấu trúc (***Database Sharding*** / ***Polyglot Persistence***) mới giải phóng được...

- **Ví dụ 3 (Bài Caching Basics):**
  - *Interviewer:* "Sản phẩm vừa được một người nổi tiếng tweet, lập tức có 5 triệu ***request*** xem cùng lúc một mặt hàng khiến ***Database*** đóng băng. Bạn xử lý thế nào?"
  - *Ứng viên trả lời:* "Em sẽ cài ***Redis***, truy vấn nào nặng em sẽ ***Set/Get*** giá trị ***JSON*** của món hàng đó lưu tại ***Redis*** với ***TTL*** 1 giờ để cản bớt tải từ cổng gốc."
  - *The Hook:* Interviewer lắc đầu. Khi khóa (***key***) tại ***Redis*** đó vừa hết hạn thì 5 triệu câu lệnh kia ập tới tạo ra hiện tượng ***Cache Stampede*** (lở tuyết, dẫm đạp) và làm cháy luồng ***DB***. Bạn cần một hệ thống phòng thủ tinh vi hơn với dạng ***Multi-tier Caching*** và bẫy tại rìa biên ***Nginx***...

*(Các phần từ `## II` đến `## V` sẽ đi từng bước phân mảng sâu hơn vào kiến thức cốt lõi, demo thực hành, ưu nhược điểm ***trade-offs*** và cuối cùng là chốt lại vấn đề của từng bài).*