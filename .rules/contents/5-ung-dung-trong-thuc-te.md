# Quy định soạn thảo Phần V (Ứng dụng trong hệ thống thực tế)

Tài liệu này quy định cấu trúc cho đoạn kết của toàn bộ module học (Phần V). Đây là phần minh hoạ để chứng minh rằng: Những lý thuyết, mô hình và công nghệ trong bài học có **ứng dụng quy mô lớn** trong ngành — đồng thời tránh hiểu nhầm là “tiết lộ kiến trúc nội bộ” của một công ty cụ thể.

### Tiêu đề bắt buộc
Phần 5 của bài học bắt buộc phải bắt đầu bằng tiêu đề (Heading 2):
`## V. Ứng dụng trong hệ thống thực tế`

---

### Nguyên tắc & Cấu trúc Nội dung

**1. Áp đặt 3 đến 5 "Case Studies" kinh điển:**  
Tác giả **BẮT BUỘC** cung cấp một danh sách từ **3 đến 5** tình huống, thường lấy **tên nền tảng công nghệ quen thuộc** làm **neo nhận diện** (ví dụ: Grab, Shopee, Netflix) — mục đích là **định hướng tư duy**, không phải báo cáo kiến trúc đã được doanh nghiệp công bố.

**2. Phân tích cấu trúc mỗi Case Study:**  
Mỗi tình huống **không** được liệt kê xuông một dòng; phải tách **ba lớp** với **nhãn tiếng Việt thuần** (KHÔNG gắn thêm giải thích song ngữ trong dấu ngoặc kiểu *(The Context)*):

- **Tình huống:** Pain-point hoặc áp lực vận hành/UX mà nền tảng đó (hoặc loại hệ thống tương tự) thường gặp. **Ưu tiên** câu chữ **góc người dùng** (ai ở đâu, thấy gì, chờ gì) rồi mới thu gọn sang thuật ngữ hạ tầng.
- **Bài toán hệ thống:** Đòi hỏi kỹ thuật ngầm phía sau màn hình người dùng (latency, fan-out, consistency, v.v.).
- **Vận dụng lý thuyết:** Áp dụng đúng công nghệ/lý thuyết **của trọn bộ bài học** để giải thích **cách xử lý định hướng**; nêu rõ vai trò cốt lõi của pattern đó. Khi cần làm rõ **luồng triển khai** (kiến trúc dịch vụ, RPC, v.v.), **được phép** thêm một cụm ngắn dạng *luồng minh hoạ*: ví dụ ***Checkout Service*** gọi ***Inventory Service*** qua **gRPC** / **HTTP** — vẫn ghi rõ là **minh hoạ — giả định**, không khẳng định stack thật của doanh nghiệp.

**Tham chiếu chéo tới các mục trong bài:** Dùng cách gọi rõ ràng như **mục II–III**, **mục IV**, hoặc **Sections II–III** (bản tiếng Anh) — **không** dùng ký hiệu `§` (ví dụ `§II`, `§IV`) vì dễ lệch format khi render và không thống nhất với phần còn lại của khóa học.

**3. Minh hoạ — giả định (bắt buộc ghi rõ):**  
Khi dùng tên thương hiệu làm ví dụ **mà không trích dẫn bài báo/tài liệu chính thức** của chính doanh nghiệp, tác giả **BẮT BUỘC** đánh dấu từng mục là **minh hoạ — giả định**, ví dụ tiêu đề dạng: **`Grab (minh hoạ — giả định)`**, hoặc một dòng dẫn ngay dưới `## V. ...` nêu rõ *toàn bộ case dưới đây là ví dụ định hướng, không khẳng định kiến trúc thực tế*.  
**Cấm** diễn đạt kiểu “hệ thống X chắc chắn làm Y” nếu không có **nguồn công khai** đi kèm.

**4. Không lặp disclaimer ngay trước `# references`:**  
Sau khi đã có **đoạn dẫn ngay dưới `## V. ...`** (nêu rõ các case là **minh hoạ — giả định**) và **nhãn `(minh hoạ — giả định)`** trên từng mục theo mục 3, **không** thêm một đoạn kết riêng ngay trước `# references` kiểu *“các tình huống trên… không phải mô tả kiến trúc nội bộ…”* — tránh lặp ý. Nếu khóa học có **chính sách trích dẫn** tập trung với URL cố định, có thể dùng **một mục** trong `# references` (`### alias` / `### url`); **không** bắt buộc thêm đoạn disclaimer thứ hai trong body.

---

### Ví dụ tham khảo chuẩn mực

**Ví dụ bài: Message Queue (Kafka/RabbitMQ)**  
*(Lưu ý: ví dụ dưới mang tính **văn phong minh hoạ**; khi áp dụng vào bài thật cần bổ sung dấu **(minh hoạ — giả định)** theo mục 3.)*

> Dưới đây là 3 tình huống giải thích tại sao Message Queue phân tán là nền tảng quan trọng ở quy mô lớn:
>
> 1. **Grab (minh hoạ — giả định) — tính cước & điều phối**
>    - **Tình huống:** Sau khi người dùng chốt điểm đến, hệ thống phải vừa tính cước, vừa khớp khuyến mãi, vừa tìm tài xế gần.
>    - **Bài toán hệ thống:** Nếu đợi API chạy hết các khâu này mới phản hồi, app có thể “quay” lâu trước khi hiển thị trạng thái nhận cuốc.
>    - **Vận dụng lý thuyết:** Tách bước nặng sang worker qua ***Kafka*** (hoặc queue tương đương), phản hồi sớm cho client và xử lý nền song song.
>
> 2. **Shopee (minh hoạ — giả định) — flash sale**
>    - **Tình huống:** Lưu lượng thanh toán đổ dồn trong vài phút mở sale.
>    - **Bài toán hệ thống:** Ghi trực tiếp hết vào DB primary có thể vượt ngưỡng write/s.
>    - **Vận dụng lý thuyết:** Dùng queue làm vùng đệm (ví dụ ***RabbitMQ***), tách **ingest** khỏi **ghi DB** theo tốc độ an toàn.
>
> 3. **Netflix (minh hoạ — giả định) — telemetry phía client**
>    - **Tình huống:** Khối lượng lớn sự kiện tương tác (tua, dừng, đánh giá) cần đưa về pipeline phân tích.
>    - **Bài toán hệ thống:** Luồng log không phục vụ trực tiếp UX từng frame nhưng cần cho hệ thống gợi ý/analytics.
>    - **Vận dụng lý thuyết:** Đổ sự kiện vào đường ống kiểu ***Kafka*** để consumer xử lý không chặn đường truyền phát chính.

