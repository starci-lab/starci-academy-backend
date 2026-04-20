# Quy định soạn thảo Phần IV (Kỹ thuật nâng cao)

Tài liệu này quy định cấu trúc và độ sâu cho **Phần IV** trong các bài học System Design. Đây là phần **sau demo và sau khái niệm (II–III)**: không lặp lại định nghĩa cơ bản, mà đi sâu **kỹ thuật nâng cao** phù hợp chủ đề bài — có thể là **scale & độ bền tải**, **bảo mật & chống lạm dụng**, **vận hành & quan sát**, hoặc kết hợp — tùy bài, không bắt buộc chỉ một trục “tải khủng” hay một con số user cố định.

### Tiêu đề bắt buộc
Phần 4 của bài học **bắt đầu** bằng tiêu đề (Heading 2):

`## IV. Kỹ thuật nâng cao`

**Nghiêm:** Dòng tiêu đề **chỉ** dùng đúng câu trên — **không** gắn thêm cụm chủ đề trong ngoặc trên cùng một dòng heading (ví dụ không viết `## IV. Kỹ thuật nâng cao (Quorum, PACELC)`). Trọng tâm từng chủ đề đưa xuống **danh sách** ngay dưới heading (xem mục *Cấu trúc nhiều chủ đề* bên dưới).

**Phụ đề / nhãn phạm vi (tuỳ chọn):** Nếu cần nhắc nhanh phạm vi toàn phần IV, dùng **một dòng mở đầu** (đoạn văn hoặc gạch đầu dòng) ngay sau `## IV`, **không** nhét vào heading.

**Tương thích ngược:** Các bài đã dùng `## IV. Kỹ thuật nâng cao (Scale to 1M Users)` hoặc phụ đề trong ngoặc trên heading — khi sửa bài, chuyển dần sang tiêu đề chuẩn một dòng + nội dung phạm vi ở phần thân.

### Cấu trúc nhiều chủ đề (gạch đầu dòng lồng nhau)

Khi phần IV gồm **nhiều trục kỹ thuật** (ví dụ đa vùng **CP/AP**, **quorum**, **PACELC**):

- Dùng **một danh sách** `-` cấp một; mỗi mục cấp một bắt đầu bằng **in đậm tên chủ đề** (ví dụ `- **Đa vùng CP/AP**`).
- Chi tiết triển khai bằng **gạch đầu dòng lồng** (thụt 2 space + `-`) **3–5 mục con** mỗi chủ đề khi đủ ý — tránh khối văn dài một đoạn cho mỗi chủ đề.
- **Không** đánh số `**1.**`, `**2.**`… cho từng khối lớn nếu đã dùng cấu trúc cây `-` / `-` lồng (tránh trùng hai hệ thống phân cấp).

---

### Nguyên tắc & cấu trúc nội dung

**1. Mục đích phần IV**

- Nối từ **III (khái niệm)** sang những gì **production** hay gặp: giới hạn ngầm, trade-off, hỏng hóc.
- **Không** bó hẹp một kịch bản duy nhất (ví dụ chỉ “1 triệu user”) nếu bài cần nói thêm **an toàn** hoặc **vận hành**.
- **Được phép viết dài hơn phần III** nếu cần: nhiều mục con, mỗi mục có **bài toán → hướng xử lý → trade-off** (hoặc rủi ro).

**2. Chủ đề gợi ý (chọn theo bài, không cần đủ cả)**

| Trục | Gợi ý nội dung |
|---|---|
| **Scale & độ bền** | Cổ chai I/O, pool, shard/replica, thundering herd, backpressure, queue… |
| **Bảo mật & lạm dụng** | Rate limit, WAF/edge, key namespace, không lộ PII trong cache edge, Redis ACL, chống scan ID… |
| **Đúng & nhất quán** | Stale read, replication lag, invalidation theo vùng, idempotency… |
| **Vận hành** | Eviction (`maxmemory`, policy), observability (hit rate, latency theo key prefix), DR |

**3. Hình thức trình bày**

- **Tối thiểu 2** khối kỹ thuật rõ ranh giới: hoặc **cây gạch đầu dòng** (khuyến khích khi nhiều chủ đề — xem *Cấu trúc nhiều chủ đề*), hoặc tiêu đề phụ đánh số (`**1. ...**`, `**2. ...**`) khi bài quen kiểu tuần tự; **khuyến khích 3–5** khối nếu bài phù hợp.
- **Khuyến khích** có đoạn **giả lập** (pseudo-code, YAML config, lệnh CLI, hoặc sơ đồ Mermaid) **khi** giúp học viên “thấy” cơ chế — không bắt buộc mọi bài đều có code.
- Tránh khẩu hiệu rỗng; mỗi kỹ thuật nên gắn **khi nào dùng / cái giá phải trả**.
- **Không** kết phần IV bằng đoạn **meta** kiểu *“Tóm lại: phần này không thay thế tài liệu chính thức của X…”* — trùng ý với `# references` (đã có alias/link tài liệu gốc); phần IV chấm dứt sau khối kỹ thuật cuối (hoặc sau ví dụ cấu hình/ code minh hoạ), rồi sang **V** hoặc `# references` tùy cấu trúc bài.

**4. Disaster & recovery (tuỳ bài)**

- Nếu chủ đề liên quan hệ phân tán / cache / DB: nên nhắc **một** khía cạnh phục hồi hoặc giảm thiểu (eviction đầy RAM, split-brain, failover đọc stale…) — không nhồi hết vào mọi bài.

---

### Ví dụ tham khảo (rút gọn)

**Ví dụ (Database scaling — trục tải):** Connection pool (PgBouncer), read replica, và race khi flash sale — khóa pessimistic hoặc Lua trên Redis.

**Ví dụ (Resilience — trục độ bền):** Circuit breaker khi downstream chậm; tránh cascading failure.

**Ví dụ (Caching — đa trục):** Single-flight chống stampede; Bloom filter chống penetration; TTL jitter; Redis `maxmemory` + `allkeys-lru`; rate limit theo IP/key trên edge.
