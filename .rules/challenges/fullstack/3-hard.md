# Fullstack Challenge - Level `hard`

**Production-grade code**. Học viên implement một component/service có thể deploy production thật, áp dụng các kỹ thuật nâng cao như ***Bloom Filter***, ***Rate Limiting***, ***Circuit Breaker***, ***Distributed Lock***, ***Outbox Pattern***...

---

## 1. Mục đích

- Kiểm tra khả năng **implement kỹ thuật nâng cao ở level code** (không chỉ kể tên hoặc vẽ sơ đồ).
- Học viên phải đọc paper/blog gốc và code đúng pattern, không dùng "wrapper ma thuật".
- Đầu ra chính vẫn là **code**, kèm README chất lượng cao để người khác review được.

---

## 2. Nguyên tắc vàng - "Implement the real thing, not a wrapper"

Challenge `hard` phải yêu cầu **tự implement (hoặc wrap có hiểu biết)** một trong các pattern/kỹ thuật nâng cao:

- **Data structures**: ***Bloom Filter***, ***Count-Min Sketch***, ***HyperLogLog***, ***Consistent Hashing***, ***Merkle Tree***, ***LSM Tree*** mini.
- **Reliability**: ***Circuit Breaker*** (3 state), ***Token Bucket*** / ***Sliding Window*** rate limiter, ***Retry with exponential backoff + jitter***, ***Bulkhead***.
- **Concurrency / distribution**: ***Distributed Lock*** (Redis Redlock), ***Leader Election***, ***Outbox Pattern***, ***Idempotency Key*** store, ***Saga***.
- **Caching**: ***Cache-aside*** với ***stampede protection*** (single-flight / lock), ***Write-through*** / ***Write-behind*** có queue.
- **Observability code-level**: correlation-id propagation xuyên layer, structured JSON log với schema cố định, metric (Prometheus format) tự expose.

### Test anti-pattern: được dùng lib cao cấp không?

- **KHÔNG** được dùng thư viện làm hộ toàn bộ (ví dụ: dùng `express-rate-limit` cho bài rate limiter). Bài là để học sinh **hiểu cơ chế**, phải tự viết core logic.
- Được dùng primitive: Redis client, in-memory store, hash function chuẩn.

---

## 3. Yêu cầu bắt buộc

### 3.1. `requirements`

- **Tên kỹ thuật cụ thể** và **tham số bắt buộc** (ví dụ: "Bloom Filter với expected items = 1M, false positive rate = 1%, tự tính `m` và `k`").
- **API / interface rõ ràng** của component (signature hàm, tham số, kiểu trả về).
- **Benchmark bắt buộc**: throughput / latency ở quy mô đề ra (ví dụ: "rate limiter phục vụ ≥ 10k RPS trên 1 máy, p99 < 5ms").
- **Test nâng cao**:
  - ≥ 5 test case gồm: correctness, boundary, concurrency, failure, benchmark.
  - Có **benchmark script** chạy được, in ra throughput + p50/p95/p99.
- **Code quality gate**: lint pass, typecheck pass, test coverage ≥ 80% cho module chính.

### 3.2. `steps`

- Số step: **5 - 7**.
- Bắt buộc có step cho: **thiết kế API/interface** -> **implement core** -> **test correctness** -> **test concurrency/failure** -> **benchmark** -> **README + design doc ngắn**.

### 3.3. `submissions` - code là chính, docs phụ

- **1 `githubUrl`** (bắt buộc) - code + test + benchmark + README.
- **Tuỳ chọn 1 `googleDocsUrl`** - design note ngắn (1-3 trang): chọn tham số thế nào, trade-off nào đã cân nhắc, benchmark result + phân tích.
- `score` tổng: **60**.
- `prompts` chấm **cực strict**, binary:
  - "Core logic **tự implement**, không dùng lib làm hộ; đọc source xác nhận đúng pattern (ví dụ: Bloom Filter có `k` hash function độc lập, bit array đúng size tính từ `m`)" -> ___ điểm.
  - "Tất cả test pass (correctness + boundary + concurrency + failure), coverage ≥ 80%" -> ___ điểm.
  - "Benchmark script chạy được, đạt ngưỡng throughput/latency trong `requirements`; có output log đính kèm" -> ___ điểm.
  - "README có section **Algorithm / Design** giải thích công thức và trade-off; lint + typecheck pass" -> ___ điểm.

### 3.4. README bắt buộc

- Mô tả ngắn + cách chạy.
- **Algorithm / Design**: công thức, tham số, phân tích big-O.
- **API Reference**: signature từng hàm public + ví dụ.
- **Benchmark**: cách chạy + kết quả (số thật, không bịa).
- **Trade-offs**: ≥ 2 trade-off đã cân nhắc.
- **References**: link paper/blog gốc của pattern.

---

## 4. CẤM - chấm **0 toàn bài** nếu vi phạm

- CẤM dùng wrapper cao cấp làm hộ core logic.
- CẤM benchmark bịa số - phải có log/screenshot từ lần chạy thật.
- CẤM test fail - **1 test fail = 0 prompt test**.
- CẤM README sơ sài - **thiếu Algorithm/Benchmark/Trade-offs = 0 prompt docs**.
- CẤM dùng `console.log` làm observability.

---

## 5. Checklist publish

- [ ] Kỹ thuật yêu cầu thuộc danh mục production-grade (Bloom Filter, Circuit Breaker, Rate Limiter, Distributed Lock, Outbox...).
- [ ] Tham số benchmark cụ thể (RPS, latency p99, expected items...).
- [ ] ≥ 5 test case + benchmark script chạy được.
- [ ] Coverage ≥ 80%, lint + typecheck pass.
- [ ] README đủ 6 section: mô tả / cách chạy / Algorithm / API / Benchmark / Trade-offs / References.
- [ ] `difficulty: hard`, `score = 60`, tổng `prompts.score = 60`.
- [ ] Nếu đưa code này cho senior engineer review, họ không bắt bẻ được kỹ thuật cơ bản.
