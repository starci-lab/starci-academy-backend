# System Design Challenge - Level `medium`

Nâng cấp từ `easy`: học viên phải **thiết kế một hệ thống nhỏ hoàn chỉnh** áp dụng nhiều khái niệm đã học, đưa ra **trade-off có cơ sở số liệu**.

---

## 1. Mục đích

- Kiểm tra khả năng **ghép nhiều khái niệm** vào một thiết kế liền mạch.
- Học viên phải **tự tra blog/paper bổ sung** - không đủ chỉ đọc `contents`.
- Đầu ra: design doc đầy đủ + sơ đồ kiến trúc + (tuỳ chọn) POC.

---

## 2. Nguyên tắc vàng - "Small system, complete design"

- Là một **hệ thống nhỏ** (ví dụ: rate limiter service, notification service, short URL, pastebin, leaderboard...).
- Quy mô: **10k - 100k DAU** hoặc QPS tương đương. Con số phải có trong đề.
- Phải kết hợp **≥ 3 khái niệm** đã học + **≥ 1 trade-off có số liệu**.

### Ví dụ nâng cấp từ `easy`

| Bài học | `easy` | `medium` |
|---|---|---|
| 4 thuộc tính hệ thống | Phân tích 4 thuộc tính cho food delivery | Thiết kế **Notification Service** 50k DAU, chọn trade-off Consistency vs Availability có số liệu |
| Quy trình 4 bước | Áp dụng 4 bước cho URL Shortener 100M URL/tháng | Thiết kế **Rate Limiter** 20k RPS, so sánh 2 thuật toán (token bucket vs sliding window) |

---

## 3. Yêu cầu bắt buộc

### 3.1. `requirements`

- **Functional + non-functional requirements** rõ ràng; non-functional phải có con số (SLO, SLA, QPS, p99 latency).
- **Back-of-envelope estimation**: QPS, storage, bandwidth, cache memory - có công thức tính.
- **High-level architecture** với sơ đồ.
- **≥ 1 component deep dive**: data model, API design, key algorithm (nếu có).
- **So sánh ≥ 2 phương án** cho 1 quyết định quan trọng, có bảng trade-off.

### 3.2. `steps`

- Số step: **4 - 6**.
- Đi theo format: clarify requirements -> estimation -> HLD -> deep dive -> trade-off -> hoàn thiện.
- Mỗi step có **Các bước thực hiện / Kết quả mong đợi / Kết luận**.

### 3.3. `submissions` - docs + sơ đồ bắt buộc

- **Bắt buộc 2 submission**:
  - 1 `googleDocsUrl` - design doc.
  - 1 `drawioUrl` - sơ đồ kiến trúc (có thể nhiều sơ đồ trên cùng 1 file draw.io: HLD + deep dive).
- **Tuỳ chọn** thêm 1 `githubUrl` nếu challenge yêu cầu POC (ví dụ: POC rate limiter thuật toán).
- `score` tổng: **40**.
- `prompts` mỗi submission: **2 - 3**, binary:
  - "Docs có đủ 5 mục: Requirements / Estimation / HLD / Deep Dive / Trade-offs; mọi con số có công thức" -> ___ điểm.
  - "Có bảng so sánh ≥ 2 phương án với ≥ 3 tiêu chí (performance / complexity / cost), có chọn phương án kèm lý do" -> ___ điểm.
  - "Sơ đồ HLD có đầy đủ: client -> LB -> app -> data store/cache/queue; có chú thích QPS/latency trên cạnh quan trọng" -> ___ điểm.

---

## 4. CẤM - chấm strict

- CẤM non-functional requirements thiếu số liệu - **0 prompt docs**.
- CẤM estimation không có công thức - **0 prompt docs**.
- CẤM "so sánh phương án" kiểu bullet point chung chung - phải có bảng + tiêu chí đo được.
- CẤM sơ đồ không có label, không phân biệt read/write path - **0 prompt sơ đồ**.
- CẤM copy design từ Alex Xu / Grokking / blog mà không điều chỉnh theo context - **0 toàn challenge**.

---

## 5. Checklist publish

- [ ] Hệ thống nhỏ nhưng hoàn chỉnh, quy mô 10k-100k DAU nêu rõ.
- [ ] ≥ 3 khái niệm kết hợp + ≥ 1 trade-off số liệu.
- [ ] Docs đủ 5 mục, mọi con số có công thức.
- [ ] Sơ đồ HLD + ít nhất 1 deep-dive diagram.
- [ ] Prompt viết binary đúng/sai.
- [ ] `difficulty: medium`, `score = 40`, tổng `prompts.score = 40`.
