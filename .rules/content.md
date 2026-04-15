# Quy tắc và Cấu trúc Nội dung Bài giảng (Content Creation Guidelines)

Mọi bài học trong hệ thống phải tuân thủ cấu trúc phân tầng nghiêm ngặt để đảm bảo tính sư phạm và sự rõ ràng.

---

### 0. Cấu trúc Tệp tin (File Structure)
Mỗi tệp nội dung (`vi.md`, `en.md`) phải bắt đầu bằng các thẻ phân đoạn sau:

- **# title:** Tên bài học (Heading 1).
- **# description:** Một câu plain text ngắn gọn tóm tắt nội dung bài học. Không bold, không link, không bullet list — chỉ văn xuôi thuần túy.
- **# body:** Phần nội dung chi tiết, được chia thành 3 hoặc 4 phần La Mã dưới đây.

---

## I. Lời mở đầu (The Hook)
Mục tiêu là tạo ra sự tò mò và đặt vấn đề cho người học bằng cách so sánh với các lối mòn cũ.

- **Cấu trúc:** So sánh giữa **Tư duy cũ (Old Thinking)** hoặc các giải pháp truyền thống với những thách thức mới của hệ thống quy mô lớn.
- **Cách viết:** Chỉ ra những điểm yếu, giới hạn hoặc những "giả định sai lầm" mà người học thường mắc phải trước khi bắt đầu bài học.

## II. Nội dung chính (Core Concepts)
Phần này giải thích chi tiết các khái niệm kỹ thuật cốt lõi.

- **Đánh số:** Sử dụng các mục `### 1.`, `### 2.`, `### 3.` để tách biệt các khái niệm. Tiêu đề chỉ gồm số thứ tự và tên khái niệm, **không** thêm tiền tố "Bước X:" hay "Step X:" — ví dụ: `### 1. Khám phá yêu cầu (Requirements Clarification)`.
- **Câu chủ đề (Topic Sentence):** Mỗi mục `###` bắt đầu bằng một câu chủ đề rõ ràng ngay dưới tiêu đề, dưới dạng đoạn văn thường.
- **Ví dụ:** Mỗi ví dụ là một **top-level bullet**. Nếu chỉ có một ví dụ, dùng `- **Ví dụ:**`. Nếu có nhiều ví dụ, dùng `- **Ví dụ 1:**`, `- **Ví dụ 2:**`, v.v.
- **Bên trong bullet Ví dụ:** Có thể có nested bullets cho chi tiết, Ưu điểm, Nhược điểm.

## III. Thực hành (Practice) - *Chỉ dành cho bài học có Lab*
Phần này áp dụng các khái niệm đã học vào môi trường thực tế (Minikube, Cloud, Source code).

- **Nội dung:** Hướng dẫn cài đặt, thực thi câu lệnh, giải thích các file cấu hình (**YAML**, **Dockerfile**, **Code**).
- **Cấu trúc:** Sử dụng các tiểu mục `###` để chia nhỏ các bước (ví dụ: `### 1. Thiết lập môi trường`, `### 2. Thử nghiệm Luồng thành công`).
- **Chi tiết bắt buộc trong mỗi tiểu mục `###`:** (Dùng đúng ngôn ngữ của file — VI dùng tiếng Việt, EN dùng tiếng Anh, **không** trộn lẫn.)
    - `- **Các bước thực hiện:**` / `- **Execution Steps:**` — Mô tả hành động cần làm (gõ lệnh, gửi request).
    - `- **Kết quả mong đợi:**` / `- **Expected Results:**` — Danh sách các biến đổi hoặc phản hồi từ hệ thống.
    - `- **Kết luận:**` / `- **Conclusion:**` — Một câu đúc kết ngắn gọn về ý nghĩa kỹ thuật của bước thực hành đó.
- **Bắt buộc Step-by-step rõ ràng:** Luôn liệt kê theo thứ tự `Bước 1`, `Bước 2`... (VI) hoặc `Step 1`, `Step 2`... (EN); mỗi bước là một hành động cụ thể, ngắn gọn, có thể làm ngay.
- **Mức độ chi tiết thực hành:** Tránh mô tả chung chung kiểu "chạy hệ thống" hoặc "kiểm tra kết quả"; phải nêu rõ lệnh, endpoint, file cấu hình hoặc thao tác cần thực hiện.
- **Template mục thực hành bắt buộc (khi là demo service/event-driven như Saga):** Phải theo đúng thứ tự sau, không đảo ngược:
    - `### 1. Thiết lập (Setup & Run)`
    - `### 2. Kiến trúc (Architecture)`
    - `### 3. Luồng hệ thống (System Flow)`
    - `### 4. Thử nghiệm (Try it out)`
- **Quy tắc cho `### 4. Thử nghiệm (Try it out)`:**
    - Phải có tối thiểu 2 nhánh kiểm thử: `Success path` và `Compensation/Failure path`.
    - Mỗi nhánh bắt buộc có các bước tuần tự (`Bước 1`, `Bước 2`... hoặc `Step 1`, `Step 2`...).
    - Mỗi bước phải có lệnh cụ thể (ví dụ `curl`, `docker compose`, `npx nest start`) và endpoint/port liên quan.
    - Bắt buộc ghi rõ input tạo ra nhánh (ví dụ productId nào thành công, productId nào thất bại).
    - Bắt buộc ghi trạng thái cuối cùng quan sát được (ví dụ `COMPLETED`, `CANCELLED`, `REFUNDED`).
- **Quy tắc trình bày lệnh:** Mọi lệnh shell/curl phải đặt trong code block Markdown, không để lẫn trong câu văn.
- **Quy tắc chất lượng nội dung thực hành:** Không được liệt kê rời rạc hoặc đảo thứ tự bước; nội dung phải đọc được theo luồng từ setup -> chạy service -> trigger request -> quan sát kết quả.
- **Dẫn link Source Code (bắt buộc nếu có lab):** Dùng đúng 1 template duy nhất cho mọi bài:
    - VI: `> **Source code:** [Tên bài](URL)`
    - EN: `> **Source code:** [Tên bài](URL)`

## IV. Kết luận (Conclusion)
Tóm lược và đúc kết tư duy. (Nếu bài học không có thực hành, phần này đánh số là **III**).

- **Nội dung:** Tóm tắt ngắn gọn các điểm mấu chốt dưới dạng đoạn văn.
- **Kết luận:** Kết thúc bằng `**Kết luận:**` (hoặc `**Kết luận cuối cùng:**`) — một câu chốt mang tính kiến trúc sư để người học ghi nhớ lâu hơn.

---

### Quy tắc định dạng chung (Formatting Rules)
1. **Strictly Icon-free:** Không sử dụng emoji hoặc icon trong các đoạn văn bản kỹ thuật.
2. **Professional Tone:** Ngôn ngữ kỹ thuật chính xác nhưng dễ tiếp cận.
3. **Consistency:** Luôn có đủ cả bản tiếng Việt (`vi.md`) và tiếng Anh (`en.md`) với nội dung tương đồng.
4. **Keyword Highlighting (Tô đậm từ khoá):** Dùng `**từ**` để tô đậm các từ khoá quan trọng **trong câu văn thường** (không phải heading). Áp dụng cho:
    - Tên khái niệm kỹ thuật: `**Scalability**`, `**ACID**`, `**CAP Theorem**`
    - Tên công nghệ cụ thể: `**Redis**`, `**Kafka**`, `**Kubernetes**`, `**NestJS**`
    - Con số hoặc ngưỡng quan trọng: `**50ms**`, `**99.99%**`, `**10.000 req/s**`
    - Thuật ngữ kiến trúc cốt lõi: `**Single Point of Failure**`, `**Eventual Consistency**`, `**Self-healing**`
    - Cụm từ nhấn mạnh trong câu dẫn: `**"một cục code gánh tất cả"**`, `**"hỏng một cách có kiểm soát"**`
    - **Không** tô đậm mọi thứ — chỉ những từ thực sự cần nổi bật để người đọc chú ý khi lướt qua.
