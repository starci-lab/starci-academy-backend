# Quy định soạn thảo Phần III (Fundamentals & Core Concepts)

Tài liệu này quy định cấu trúc bắt buộc đối với Phần III. Trái ngược với Phần II (nặng về thực hành và bóc tách giới hạn kiến trúc), Phần III đóng vai trò xoa dịu luồng tư duy, là nơi giải thích các khái niệm kỹ thuật cốt lõi (Fundamentals) một cách sơ đẳng, dễ hiểu và "trần trụi" nhất bằng ngôn từ thực tế.

### Tiêu đề bắt buộc
Phần 3 của bài học bắt buộc phải bắt đầu bằng tiêu đề (Heading 2):
`## III. Các khái niệm cốt lõi`

---

### Nguyên tắc & Cấu trúc Nội dung

**1. Direct to the Point (Giải thích thẳng bản chất kỹ thuật):**
Tuyệt đối cấm bê nguyên định nghĩa dài dòng từ Wikipedia hay sách vở hàn lâm. Tác giả bắt buộc giải thích lý thuyết bằng luồng kỹ thuật thực dụng (Data flow). Bỏ đi mọi sự ví von mây gió.
- *Ví dụ giải thích ***Load Balancer***:* Không lan man, nói thẳng: "Nó là một *Reverse Proxy* đứng ở cửa ngõ, liên tục hứng 10.000 TCP connection từ ngoài và rải tải đều xuống cho nội bộ 3 Server phía dưới bằng thuật toán *Round Robin*".
- *Ví dụ giải thích ***Message Queue***:* Nói thẳng: "Nó là trung gian lưu trữ sự kiện (Event) trên RAM. Nhờ nó, Server A (*Publisher*) bắn data xong là đóng luồng HTTP để đi làm việc khác ngay lập tức, mặc kệ Server B (*Consumer*) bao giờ mới rảnh tay lôi data ra xử lý."

**2. Terminology Breakdown (Bóc tách và định hình Từ khóa tiếng Anh):**
Liệt kê và định nghĩa lại các từ khóa chuyên ngành quan trọng đã xuất hiện ở Phần I hoặc II dưới dạng danh sách list viên đạn (bullet points).
- **Tuyệt đối không dùng tiếng Việt bồi:** Giữ nguyên từ gốc tiếng Anh. (Dùng ***Horizontal Scaling*** thay vì "Thuật toán mở rộng ngang", hoặc dùng ***Single Point of Failure*** thay vì "Điểm chết duy nhất").
- **Định dạng bắt buộc:** Tất cả từ khoá tiếng Anh phải in đậm nghiêng `***từ_khóa***`.

**3. Use-cases (Khi nào đưa vào Production?):**
Nêu từ 2-3 gạch đầu dòng rõ ràng, dứt khoát về hoàn cảnh áp dụng công nghệ/lý thuyết đó. Học viên cần biết rõ lúc nào kiến trúc phát huy tác dụng và lúc nào phản tác dụng.

**4. Bảng biểu đúc kết (Comparison Table):**
Nếu phần này mang tính chất giải thích 2 luồng khái niệm song song (Ví dụ: `SQL` vs `NoSQL`, `Scale-out` vs `Scale-up`, `Pull` vs `Push`), bắt buộc phải vẽ một bảng (Table) hoặc một khối sơ đồ Mermaid chốt hạ cuối phần để minh họa cái nhìn tương quan.

---

### 3 Ví dụ tham khảo chuẩn mực

**Ví dụ 1 (Bài Message Queue):**
> Thay vì client A gọi API HTTP đồng bộ sang service B và phải treo connection chờ xử lý, chúng ta đẩy payload data vào ***Message Queue***. 
> ***Producer*** (kẻ phát hành) ném trực tiếp event lên bộ nhớ đệm của Queue và ngắt kết nối trả kết quả ngay. Ở đầu bên kia, đám ***Consumer*** sẽ duy trì khe cắp TCP để pull data rớt từ luồng Queue về xử lý theo rãnh thời gian độc lập.
> 
> **Bộ từ vựng cốt lõi:**
> - ***Asynchronous***: Tính bất đồng bộ. Tách rời pha ghi data và pha xử lý data qua hai khung thời gian riêng biệt.
> - ***Broker***: Công cụ mã nguồn mở (VD: RabbitMQ, hệ NATS) đứng giữa làm điểm neo (routing node) của hệ thống message.

**Ví dụ 2 (Bài Horizontal vs Vertical Scaling):**
> Khi ranh giới băng thông bị dồn tụ vì traffic, có 2 giao thức nâng cấp hệ thống:
> 
> - ***Vertical Scaling (Scale-up):*** Tắt nóng máy chủ và cắm nhồi thêm thanh RAM 64GB, CPU 16 cores to hơn. Bản chất: Gom chung sức mạnh vào một hệ điều hành duy nhất. Giới hạn: Khi bo mạch chủ cạn kiệt khe cắm (*Hardware Limits*), hệ thống chết nghẽn vĩnh viễn.
> - ***Horizontal Scaling (Scale-out):*** Giữ nguyên cấu hình máy ảo, nhưng kích hoạt nhân bản liên tục ra 10 con Server chạy song song phía sau ***Load Balancer***. Bản chất: Rải tải (Network Distribution), một Server hỏng thì các Server khác vẫn gánh luồng. Khả năng Scale vọt xấp xỉ vô hạn (*Limitless*).

**Ví dụ 3 (Bài Caching Basics):**
> Đọc xuất dữ liệu xuống hệ thống Ổ cứng (Disk I/O) luôn mang giới hạn vật lý tốc độ thấp. ***Cache*** là cấu trúc vùng nhớ đệm dạng *Key-Value* chèn lót ở tầng giữa kết nối, sử dụng 100% chip RAM vật lý siêu tốc để lưu trữ.
> Mọi Query lấy dữ liệu sẽ đập vào khối RAM (Cache) trước. Nếu trúng dữ liệu tĩnh (*Cache Hit*), API sẽ giật thẳng data về cho User với ngưỡng phản hồi sub-millisecond `0.1ms`.
> - **Khi nào dùng Cache:** Phục hồi các endpoint có chỉ số đọc rất cao (*Read-heavy*), ít thay đổi (VD: Cấu hình hệ thống, Banner sản phẩm đầu trang).
> - **Khi nào tuyệt đối KHÔNG:** Dữ liệu thuộc biến động (*Write-heavy*) liên tục hoặc giao dịch tiền mặt. Mất đồng bộ giữa RAM và Disk là tự sát nền tảng.
