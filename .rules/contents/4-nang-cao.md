# Quy định soạn thảo Phần IV (Advanced Techniques - Scale to 1M Users)

Tài liệu này quy định cấu trúc và độ sâu cho Phần IV trong mọi bài học System Design. Đây là vùng tri thức "hạng nặng", nơi xé bỏ các ranh giới an toàn của ứng dụng nhỏ lẻ. Tác giả phải đặt học viên vào tình thế vận hành hệ thống chịu tải 1.000.000 Users (Concurrency cực cao) để trang bị cho họ **Mindset của một Kỹ sư Big Tech**.

### Tiêu đề bắt buộc
Phần 4 của bài học bắt buộc phải bắt đầu bằng tiêu đề (Heading 2):
`## IV. Kỹ thuật nâng cao (Scale to 1M Users)`

---

### Nguyên tắc & Cấu trúc Nội dung

**1. The 1M Users Mindset (Lật tẩy các giới hạn ngầm):**
Hệ thống chạy ngon với 1.000 user không có nghĩa là nó sẽ sống sót ở 1 triệu user. Ở dưới đáy sâu, lượng Data I/O và Network Latency sẽ bóp nghẹt mọi nguyên lý lý thuyết thông thường.
- Tuyệt đối không dạy học viên xài mẹo vặt (tricks).
- Bắt buộc khai quật các điểm chết ở Scale khổng lồ (Ví dụ: Vài nghìn người mua chung 1 món hàng sẽ gây ra ***Race Condition*** và ***Database Lock***; Cache hết hạn cùng lúc gây ra ***Thundering Herd*** quét sạch Master DB).

**2. Core Advanced Techniques (Trình diễn kỹ thuật giải cứu):**
Chỉ ra đúng giải pháp đẳng cấp thế giới mà các tập đoàn áp dụng. Yêu cầu BẮT BUỘC liệt kê tối thiểu 2 Kỹ thuật lõi (Có kèm *Code block* giả lập thuật toán hoặc YAML cấu hình tĩnh):
- *Ví dụ về Database:* Thay vì tạo Index thường, hãy nói về cách dùng ***Connection Pooling*** (`pgbouncer`), thiết lập ***Read Replica*** khắt khe với độ trễ replication xấp xỉ `20ms`, hoặc dùng thuật toán băm shard ***Consistent Hashing***.
- *Ví dụ về API Gateway:* Giảng về ***Circuit Breaker*** (tự động ngắt điện chặn các luồng request nát), ***Rate Limiting*** bằng thuật toán Token Bucket chống DDoS.
- *Ví dụ về Data Flush:* Bày cách dùng kỹ thuật ***Batching*** (Gom luồng 10.000 events vào memory buffer rối mới bung 1 lượt xuống ổ cứng để chừa I/O thay vì ghi lẻ tẻ).

**3. Disaster Recovery (Khống chế thảm họa):**
Khi hệ thống to, nó SẼ RỚT. Câu hỏi ở đây là khi rớt thì sống lại như thế nào? Bắt buộc chỉ ra cách khống chế lỗi rủi ro.
- Cấu hình ***Eviction Policies*** cho Redis (VD: Khi RAM full 100%, chọn thuật toán xóa bớt `allkeys-lru` để tồn tại thay vì nổ service).
- Quản trị độ chia cắt ***Split-brain*** khi hệ phân tán cắn xé nhau.

---

### Ví dụ tham khảo cực độ

**Ví dụ 1 (Bài Database Scaling):**
> **Bài toán 1 triệu Users:** Nếu để ứng dụng NodeJS đập 1 triệu connection rác thẳng vào PostgreSQL, Database sẽ nổ tung vì không đủ RAM để cấp phát bộ quản lý tiến trình.
> 
> **Kỹ thuật xài Pool:** Áp dụng ***PgBouncer*** làm Proxy đứng giữa. Nó giữ sẵn 200 connection cứng vào DB. Hàng vạn connection từ NodeJS trỏ vào PgBouncer sẽ được điều phối tái sử dụng liên tục (Connection Multiplexing).
> 
> **Thảm họa Race Condition:** 10 vạn người mua con iPhone 15 Promax giá 1k. Nếu dùng code check `{ if (stock > 0) stock-- }`, kho sẽ thủng số âm. Kỹ thuật nâng cao BẮT BUỘC áp dụng là xài truy vấn Atomic khoá dòng DB trực tiếp (Pessimistic Locking `SELECT ... FOR UPDATE` trong Transaction) hoặc áp dụng thuật toán `LUA Script` trên lõi của Redis.

**Ví dụ 2 (Bài Microservices Resilience):**
> Kiến trúc mạng nội bộ không bao giờ an toàn tuyệt đối. Ở mức độ tải 1M Request, hiện tượng tăng vọt độ trễ (***Network Latency Spike***) hoặc nghẽn thắt nút chai là điều tất yếu.
> **Circuit Breaker Pattern:** Khi cụm Payment Service phản hồi chậm hoặc báo lỗi Timeout quá 5 giây liên tục, hệ thống giám sát sẽ tự động kích hoạt mạch ngắt đưa sang trạng thái ***Open State***, chủ động từ chối toàn bộ request luân chuyển vào cụm dịch vụ này, ngăn chặn hiện tượng tắc nghẽn dây chuyền (***Cascading Failure***). Đồng thời lập tức gọi hàm ***Fallback*** định tuyến luồng dữ liệu lỗi trả về "Hệ thống bận, vui lòng thử lại sau".
> ```typescript
> // Giả lập Circuit Breaker chặn luồng nát
> const breaker = new CircuitBreaker(requestPayment, {
>    timeout: 3000, 
>    errorThresholdPercentage: 50, // Lỗi vượt 50% => Cắt cầu dao
>    resetTimeout: 30000 // 30s sau mới thử đóng điện lại
> });
> ```
