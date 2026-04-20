# Quy định soạn thảo Phần V (Ứng dụng trong hệ thống thực tế)

Tài liệu này quy định cấu trúc **Phần V** cho Fullstack Mastery. Mục tiêu là nối lý thuyết với bài toán sản phẩm thật theo góc nhìn triển khai backend.

### Tiêu đề bắt buộc
Phần 5 bắt đầu bằng:
`## V. Ứng dụng trong hệ thống thực tế`

---

### Nguyên tắc & Cấu trúc Nội dung

**1. Số lượng case**

- Bắt buộc 3-5 case studies.
- Có thể dùng tên nền tảng quen thuộc làm neo nhận diện, nhưng không được khẳng định là kiến trúc nội bộ thật nếu không có nguồn.

**2. Cấu trúc từng case**

Mỗi case phải có đủ 3 lớp:

- **Tình huống:** mô tả từ góc người dùng trước (ai bấm gì, thấy gì, chờ bao lâu).
- **Bài toán hệ thống:** phần kỹ thuật backend phải giải quyết.
- **Vận dụng lý thuyết:** nêu pattern/kỹ thuật của bài học và lý do áp dụng.

Nếu cần làm rõ backend flow, được phép thêm một dòng:

- **Luồng minh hoạ (giả định):** ví dụ `API Gateway -> Auth Service -> Order Service -> PostgreSQL -> Kafka`.

**3. Minh hoạ — giả định**

- Nếu không có nguồn công khai, bắt buộc ghi `(minh hoạ — giả định)` ngay trong tiêu đề case hoặc trong dòng dẫn mở đầu phần V.
- Cấm câu khẳng định tuyệt đối kiểu “hệ thống X chắc chắn dùng Y”.

**4. Tham chiếu chéo**

- Dùng cách gọi: **mục II–III**, **mục IV** (hoặc bản tiếng Anh: **Sections II–III**, **Section IV**).
- Không dùng ký hiệu `§`.

**5. Không lặp disclaimer**

- Nếu đã có disclaimer ngay dưới `## V...` và nhãn `(minh hoạ — giả định)` trong case, không thêm đoạn disclaimer lặp ngay trước `# references`.

---

### Ví dụ tham khảo chuẩn mực

1. **Shopee (minh hoạ — giả định)**
   - **Tình huống:** User bấm thanh toán đúng giờ sale, app phải phản hồi nhanh.
   - **Bài toán hệ thống:** backend ghi đơn hàng chịu burst lớn, dễ timeout và ghi trùng khi retry.
   - **Vận dụng lý thuyết:** áp dụng hàng đợi + idempotency key + circuit breaker để giữ luồng cốt lõi.
   - **Luồng minh hoạ (giả định):** `Checkout API -> Order Service -> Payment Service -> PostgreSQL -> Outbox -> Kafka`.

2. **Grab (minh hoạ — giả định)**
   - **Tình huống:** Một thao tác đặt chuyến chạm nhiều domain (ride, pricing, payment).
   - **Bài toán hệ thống:** nhiều service sync dễ dồn tail latency và tăng lỗi dây chuyền.
   - **Vận dụng lý thuyết:** tách sync/async, đặt timeout/deadline, kết hợp saga compensation.

3. **Netflix (minh hoạ — giả định)**
   - **Tình huống:** User xem nội dung, tracking event phát sinh liên tục.
   - **Bài toán hệ thống:** luồng ghi analytics không được làm chậm request chính.
   - **Vận dụng lý thuyết:** dùng async event pipeline, tách đường ghi phân tích khỏi đường phục vụ realtime.
