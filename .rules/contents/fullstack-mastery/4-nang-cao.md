# Quy định soạn thảo Phần IV (Kỹ thuật nâng cao)

Tài liệu này quy định độ sâu cho **Phần IV** trong Fullstack Mastery. Đây là phần chuyển từ “biết khái niệm” sang “code và vận hành được ở production”.

### Tiêu đề bắt buộc
Phần 4 bắt đầu bằng:
`## IV. Kỹ thuật nâng cao`

**Nghiêm:** Không gắn chủ đề trong ngoặc trên cùng một dòng heading. Nếu cần, thêm dòng phạm vi ngay dưới heading:

`Phạm vi: ...`

---

### Cấu trúc nhiều chủ đề (gạch đầu dòng lồng nhau)

- Dùng một danh sách cấp một `-` cho từng trục kỹ thuật.
- Mỗi trục có 3-5 mục con (bài toán, cách xử lý, trade-off).
- Không dùng đồng thời cả kiểu `**1.**`, `**2.**` nếu đã dùng cây bullet.

---

### Nguyên tắc & cấu trúc nội dung

**1. Mục đích**

- Nêu lỗi production thật thường gặp: timeout chain, retry storm, deadlock, stale cache, queue backlog, race condition.
- Mỗi kỹ thuật phải gắn với **bài toán -> hướng xử lý -> trade-off**.

**2. Trục gợi ý (chọn theo bài)**

| Trục | Gợi ý nội dung |
|---|---|
| **Độ bền luồng backend** | timeout, retry budget, circuit breaker, bulkhead |
| **Đúng & nhất quán dữ liệu** | idempotency key, outbox, saga, read-after-write |
| **Hiệu năng backend** | pooling, batching, cache strategy, n+1 query |
| **Bảo mật API** | authn/authz, rate limit, input validation, secret handling |
| **Vận hành** | tracing, log correlation, SLI/SLO, rollback, runbook |

**3. Hình thức trình bày**

- Tối thiểu 2 khối kỹ thuật, khuyến khích 3-5 khối.
- Khuyến khích kèm pseudo-code, SQL, YAML, hoặc snippet config khi giúp học viên hiểu cơ chế.
- Tránh slogan; phải nói cụ thể “đặt ở đâu trong codebase/backend flow”.

**4. Disaster & recovery**

- Nếu bài liên quan DB/cache/queue/distributed: bắt buộc nhắc ít nhất 1 tình huống phục hồi (failover, replay, poison message, partial outage).

---

### Ví dụ tham khảo (rút gọn)

- **Retry + Idempotency:** endpoint thanh toán nhận ***Idempotency-Key***, lưu trạng thái request để chống double charge.
- **Outbox pattern:** ghi business row và outbox row trong cùng transaction, worker publish event theo cơ chế at-least-once.
- **Observability:** thêm trace id xuyên gateway -> service -> DB -> broker để điều tra lỗi liên tầng.
