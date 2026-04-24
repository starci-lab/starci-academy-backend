# System Design Challenge - Level `insane`

**Big-tech scale, 1M+ users**. Thiết kế hệ thống phục vụ quy mô lớn, áp dụng pattern công bố bởi Google/Meta/Netflix/Uber/Amazon. Học viên có thể đem thiết kế này đi phỏng vấn system design ở công ty lớn mà không bị bắt bẻ ý cơ bản.

---

## 1. Mục đích

- Kiểm tra khả năng **thiết kế hệ thống phân tán quy mô lớn**: capacity planning, sharding, caching multi-layer, async event-driven, multi-region.
- Học viên phải **đọc và áp dụng pattern từ engineering blog thật** của big tech, có reference link sống.
- Đầu ra: design doc theo format big-tech + nhiều sơ đồ deep-dive + cost estimation + (khuyến khích) POC component khó nhất.

---

## 2. Nguyên tắc vàng - "Scale to 1M users, follow big tech patterns"

Đề bài bắt buộc nêu **quy mô đo được**:

- **≥ 1.000.000 users đăng ký**, **≥ 100.000 DAU**.
- **QPS đỉnh** cụ thể (ví dụ: 10k write/s, 100k read/s).
- **Data volume** (ví dụ: 10 TB/năm, 1B event/ngày).
- **SLO cụ thể**: p99 latency < X ms, availability ≥ 99.95%.

Pattern áp dụng phải **link tới engineering blog thật**: High Scalability, Netflix Tech Blog, Uber Engineering, Meta Engineering, AWS/GCP Architecture Center, Discord blog, Jepsen, DDIA. Blog dịch lại / cá nhân không được tính.

---

## 3. Yêu cầu bắt buộc

### 3.1. `requirements` - tối thiểu 5/6 nhóm

- **Capacity planning**: back-of-envelope đầy đủ cho QPS, storage, bandwidth, cache memory, số instance, số shard. Có công thức.
- **Horizontal scaling**: LB + stateless service multi-instance, auto-scaling trigger, session strategy.
- **Data partitioning**: sharding strategy (by user_id / hash / geo), **cách re-shard** khi mở rộng, hot shard mitigation.
- **Caching multi-layer**: CDN -> edge -> app cache -> DB cache; invalidation strategy (TTL / write-through / write-behind); cache stampede protection.
- **Async / event-driven**: message broker (Kafka/Pulsar/SQS), idempotent consumer, DLQ, backpressure, exactly-once vs at-least-once analysis.
- **Multi-region & DR**: active-active hay active-passive, RPO/RTO, replication strategy, failover playbook.

Ngoài ra bắt buộc:

- **Bottleneck analysis**: ≥ 3 bottleneck nhận dạng trước + giải pháp + trade-off.
- **Failure scenarios**: ≥ 4 kịch bản (region down, broker partition, hot shard, cache stampede, thundering herd).
- **Cost estimation**: chi phí hạ tầng/tháng (compute + storage + network + ops) có công thức, so sánh ≥ 2 option (self-host vs managed chẳng hạn).

### 3.2. `steps`

- Số step: **6 - 9**.
- Bắt buộc có step cho: (1) clarify + capacity planning, (2) HLD, (3) deep dive ≥ 2 component quan trọng, (4) scaling & bottleneck, (5) failure scenarios, (6) cost & trade-off, (7) rollout & migration strategy.

### 3.3. `submissions` - design doc + sơ đồ đa tầng + (khuyến khích) POC

- **Bắt buộc 2 submission**:
  - 1 `googleDocsUrl` - design doc theo format big-tech: **Context -> Goals/Non-goals -> Personas -> Requirements -> Capacity -> HLD -> Deep Dive (≥2) -> Data Model -> Scaling -> Failure Modes -> Security -> Observability -> Cost -> Alternatives Considered -> Rollout Plan -> Risks -> References**.
  - 1 `drawioUrl` - **≥ 5 sơ đồ** trong cùng file: HLD, deep-dive 1, deep-dive 2, data flow (read + write), deployment multi-region.
- **Khuyến khích** 1 `githubUrl` - POC component khó nhất (sharded counter / rate limiter phân tán / consistent hashing ring...). Có POC thì cộng thêm prompt, không có thì không mất điểm.
- `score` tổng: **100**.
- `prompts` **cực strict**, binary:
  - "Capacity planning có công thức đầy đủ cho QPS / storage / bandwidth / cache / số shard; chốt số sizing cuối cùng (số instance, shard count, cache size)" -> ___ điểm.
  - "Sharding strategy nêu được **cách re-shard** cụ thể (consistent hashing / directory service / double-write window), không chỉ 'dùng hash'" -> ___ điểm.
  - "Có ≥ 3 bottleneck + giải pháp + trade-off cụ thể; có ≥ 4 failure scenario + phản ứng" -> ___ điểm.
  - "Cost estimation có công thức + so sánh ≥ 2 option; có số cụ thể theo $/tháng, không phải 'tương đối'" -> ___ điểm.
  - "References ≥ 2 engineering blog của big tech; trích đúng pattern đã áp dụng trong design (không chỉ liệt kê link)" -> ___ điểm.
  - "Drawio có ≥ 5 sơ đồ theo đúng danh sách yêu cầu; mọi sơ đồ có label, chú thích QPS/latency/RPO-RTO trên cạnh quan trọng" -> ___ điểm.

---

## 4. CẤM - chấm **cực strict, say cực mạnh**

- CẤM bài không có con số cụ thể (users/QPS/storage/SLO) -> **0 toàn challenge**.
- CẤM "microservice" là câu trả lời mặc định - phải có lý do dựa trên capacity và team topology.
- CẤM tự bịa pattern không có reference thật -> **0 toàn challenge**.
- CẤM chỉ 1 sơ đồ HLD - thiếu deep-dive là **0 prompt sơ đồ**.
- CẤM thiếu failure scenarios -> design chưa hoàn chỉnh, **0 prompt failure**.
- CẤM thiếu cost estimation hoặc cost không có công thức -> **0 prompt cost**.
- CẤM copy design từ Alex Xu / ByteByteGo / Grokking gần như nguyên si -> **0 toàn challenge**.
- CẤM references kiểu blog dịch lại, blog cá nhân không ai biết -> prompt references **0**.
- CẤM "Alternatives Considered" kiểu 1 dòng - phải có ít nhất 2 alternative với lý do reject.

---

## 5. Checklist publish

- [ ] Có đủ quy mô cụ thể: users / DAU / QPS đỉnh / data volume / SLO.
- [ ] ≥ 5/6 nhóm Capacity / Scaling / Partitioning / Caching / Async / Multi-region.
- [ ] ≥ 3 bottleneck + ≥ 4 failure scenarios.
- [ ] Cost estimation có công thức + so sánh ≥ 2 option.
- [ ] References ≥ 2 engineering blog big tech, link sống.
- [ ] Drawio ≥ 5 sơ đồ (HLD + 2 deep-dive + read/write flow + multi-region deployment).
- [ ] Design doc theo format big-tech, đủ 17 section.
- [ ] `difficulty: insane`, `score = 100`, tổng `prompts.score = 100`.
- [ ] Test cuối: đem design này đi phỏng vấn L5+ ở big tech, không bị bắt bẻ thiếu ý cơ bản.
