# System Design Challenge - Level `easy`

**Bắt buộc phải có** cho mọi bài học trong khóa System Design Mastery. Đây là bài kiểm tra hiểu bài đầu tiên.

---

## 1. Mục đích

- Ép học viên **áp dụng khái niệm/quy trình đã học vào một context khác** với ví dụ trong `contents`, để không thể copy-paste bài mẫu.
- Đầu ra là **tài liệu phân tích / sơ đồ**, có thể kèm POC code nếu bối cảnh yêu cầu.
- Sau challenge, học viên chứng minh "hiểu khái niệm, dùng được vào kịch bản mới".

---

## 2. Nguyên tắc vàng - "Same concept, different scenario"

- **Khái niệm / chỉ số / quy trình**: giữ y hệt bài học.
- **Kịch bản / domain / quy mô cụ thể**: **phải khác** ví dụ trong `contents`.

### Ví dụ chuyển context

| Ví dụ trong `contents` | Context challenge `easy` |
|---|---|
| Phân tích Scalability/Reliability/Availability/Consistency cho blog system | Phân tích 4 thuộc tính cho ứng dụng **food delivery 10k concurrent users** |
| Quy trình 4 bước thiết kế Twitter feed | Áp dụng 4 bước thiết kế **URL Shortener 100M URL/tháng** |
| Latency vs Throughput trên web app chung | Phân tích Latency/Throughput cho **video streaming service** |

### Test context: học viên copy ví dụ `contents` về rồi đổi tên có pass không?

- Có -> context chưa đủ xa, viết lại.
- Không -> đạt.

---

## 3. Yêu cầu bắt buộc

### 3.1. `requirements`

- Nêu **kịch bản cụ thể** với số liệu (users, QPS, data volume...).
- Liệt kê **khái niệm / chỉ số bắt buộc phải phân tích** (ví dụ: "phải phân tích cả 4 thuộc tính Scalability/Reliability/Availability/Consistency", "phải có cả Latency và Throughput").
- Yêu cầu **≥ 1 bảng so sánh hoặc bảng tổng hợp** trong docs.

### 3.2. `steps`

- Số step: **3 - 5**.
- Các step đi từ: phân tích kịch bản -> phân tích từng khái niệm -> tổng hợp trade-off -> hoàn thiện tài liệu.
- Mỗi step có đủ **Các bước thực hiện / Kết quả mong đợi / Kết luận** theo `base.md`.

### 3.3. `submissions` - linh hoạt theo context

Chọn **1 trong các combo** sau, tuỳ bối cảnh challenge:

- **A) Thuần phân tích**: 1 `googleDocsUrl`.
- **B) Phân tích + sơ đồ**: 1 `googleDocsUrl` + 1 `drawioUrl`.
- **C) Có POC**: 1 `googleDocsUrl` + 1 `githubUrl` (POC code nhỏ minh hoạ 1 khái niệm).
- **D) Full**: 1 `googleDocsUrl` + 1 `drawioUrl` + 1 `githubUrl`.

Mặc định cho `easy` là **combo A hoặc B**.

- `score` tổng: **20**.
- `prompts`: **2 - 3** mỗi submission, binary đúng/sai:
  - "Docs phân tích **đầy đủ** các khái niệm/chỉ số nêu trong `requirements`, không thiếu mục nào" -> ___ điểm.
  - "Có **bảng so sánh/tổng hợp** như yêu cầu, số liệu cụ thể, không viết chung chung" -> ___ điểm.
  - (Nếu có `drawioUrl`) "Sơ đồ thể hiện đúng thành phần được phân tích, chiều phụ thuộc rõ ràng, đọc hiểu không cần giải thích thêm" -> ___ điểm.

---

## 4. CẤM - chấm strict, vi phạm là **0** prompt tương ứng

- CẤM thiếu bất kỳ khái niệm/chỉ số nào `requirements` yêu cầu.
- CẤM docs viết "chung chung" không có số liệu (mọi phân tích Latency/QPS/Storage phải có con số).
- CẤM copy nguyên ví dụ `contents` (cùng domain, cùng quy mô) - **0 toàn challenge**.
- CẤM sơ đồ kiểu chụp ảnh từ Google - phải là sơ đồ do học viên tự vẽ trên draw.io/Excalidraw.
- CẤM docs không có tên/ngày/cấu trúc heading rõ ràng.

---

## 5. Checklist publish

- [ ] Context (domain + quy mô) khác `contents`; test "đổi tên là pass" -> KHÔNG.
- [ ] Mọi khái niệm yêu cầu đều đã dạy trong `contents`.
- [ ] `requirements` có số liệu cụ thể (users, QPS, data volume).
- [ ] Combo submission phù hợp với bối cảnh (A/B/C/D).
- [ ] Mọi `prompt` là câu đúng/sai, không diễn giải.
- [ ] `difficulty: easy`, `score = 20`, tổng `prompts.score = 20`.
