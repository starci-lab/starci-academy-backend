# Quy tắc viết nội dung StarCi Academy (strict)

Mọi file content (`.mount/data/courses/**/contents/**/vi.md`, `en.md`) **bắt buộc** tuân theo đúng cấu trúc dưới đây. Không được tự ý thêm/bớt heading, đổi thứ tự, hoặc sáng tạo format mới.

---

## 1. Quy tắc chung

- Giọng văn trung lập, không khẩu ngữ.
- Thuật ngữ IT (**Database**, **ValidationPipe**, **TypeORM**, v.v.) phải **in đậm**, không dịch sang tiếng Việt.
- Bản **VI** dùng heading: `Lời mở đầu`, `Các khái niệm cốt lõi`, `Tổng kết`.
- Bản **EN** dùng heading: `Introduction`, `Core Concepts`, `Summary`.
- Code block luôn khai báo ngôn ngữ (`bash`, `typescript`, `json`, `mermaid`).
- Chỉ dùng **curl** cho mọi hướng dẫn gọi API. **Cấm** nhắc **Postman**.
- **Kiểm thử (thụt lề):** Trong phần Kiểm thử / Testing, toàn bộ nội dung con thuộc từng bước `- Bước …` / `- Step …` (nhãn Response / terminal, block `bash` / `json` / `text`, …) **bắt buộc** thụt lề **2 khoảng trắng** so với cột đầu dòng (`  `) để Markdown render gọn trong `<li>` trên giao diện web — chi tiết format từng dòng tại §4.6.
- Với **Mermaid node label**, tránh ký tự gây lỗi parse như `@`, ngoặc phức tạp hoặc chuỗi decorator raw; ưu tiên label chữ thường rõ nghĩa (ví dụ `Interval Heartbeat`, `Cron Data Backup`).

---

## 2. Metadata bắt buộc

Mỗi file content phải có đủ các trường sau ở đầu file, theo đúng thứ tự:

```
# title
<Tiêu đề bài học>

# description
<1-3 câu plain text, không markdown, không bold, không backtick, không link>

# body
<Nội dung chính — xem cấu trúc bên dưới>

# references
## 0
### alias
<Tên hiển thị>
### url
<URL tham chiếu>

# minutesRead
<số phút đọc ước tính>
```

**Quy tắc `# description`:** plain string, ngắn gọn, chỉ nêu mục tiêu/bối cảnh tổng quan. Không nhồi chi tiết kỹ thuật.

---

## 3. Cấu trúc `# body` (bắt buộc)

Có **2 mô hình** cho phần `## 2. Các khái niệm cốt lõi`. Tác giả chọn mô hình phù hợp theo nội dung bài.

### Mô hình A — Thực hành thuần (dùng khi bài không có khái niệm mới cần giải thích trước)

```
## 1. Lời mở đầu
## 2. Các khái niệm cốt lõi
### 2.1. <Tên chủ đề thực hành>
  2.1.1. Chuẩn bị source code và môi trường
  2.1.2. Kiến trúc/thành phần (stack + luồng)
  2.1.3. Chuẩn bị
  2.1.4. Khởi chạy
  2.1.5. Kiểm thử
  2.1.6. Dọn tài nguyên
  2.1.7. Đọc thêm
## 3. Tổng kết
### 3.1. Các câu hỏi dễ bị phỏng vấn
```

### Mô hình B — Lý thuyết + Thực hành (dùng khi bài có khái niệm mới cần giải thích trước khi clone/chạy code)

```
## 1. Lời mở đầu
## 2. Các khái niệm cốt lõi
### 2.1. <Tên chủ đề lý thuyết> (ví dụ: "Cơ chế của Socket.IO")
  — Giải thích khái niệm, Mermaid diagram, code snippet minh hoạ
  — Có thể dùng sub-heading **2.1.1.**, **2.1.2.**, … để chia nhỏ
  — KHÔNG chứa các mục clone/chạy/kiểm thử
### 2.2. <Tên chủ đề thực hành>
  2.2.1. Chuẩn bị source code và môi trường
  2.2.2. Kiến trúc/thành phần (stack + luồng)
  2.2.3. Chuẩn bị
  2.2.4. Khởi chạy
  2.2.5. Kiểm thử
  2.2.6. Dọn tài nguyên
  2.2.7. Đọc thêm
## 3. Tổng kết
### 3.1. Các câu hỏi dễ bị phỏng vấn
```

**Quy tắc chọn mô hình:**
- Dùng **Mô hình B** khi bài có **khái niệm nền tảng mới** mà sinh viên cần hiểu trước khi thực hành (ví dụ: REST constraints, JWT structure, SQL vs NoSQL, Cache strategies, Emit/Broadcast/Rooms).
- Dùng **Mô hình A** khi bài thuần thực hành hoặc lý thuyết đã được giải thích ở module/bài trước (prerequisite).
- Phần lý thuyết `2.1` trong Mô hình B **không** chứa các sub-heading thực hành (Chuẩn bị source code, Cài dependency, Khởi chạy, Kiểm thử, Dọn tài nguyên).
- Phần thực hành trong Mô hình B (`2.2.x`) tuân thủ **đúng format** như `2.1.x` trong Mô hình A (§4.2–§4.8).

**Không được bỏ bất kỳ mục thực hành nào** (áp dụng cho cả `2.1.x` Mô hình A và `2.2.x` Mô hình B). Nếu bài không có Docker thì mục Dọn tài nguyên ghi "Không cần dọn tài nguyên." Nếu bài không có ngữ cảnh production thì bỏ `3.1. Ứng dụng trên production` và phần câu hỏi phỏng vấn đánh số `3.1` luôn.

**Mục Kiểm thử (strict):** Ngay sau heading Kiểm thử (dù là `**2.1.5.**` hay `**2.2.5.**`) **bắt buộc** có **brief tổng quan các luồng** đúng §4.6 (mở bằng `**N luồng**` + liệt kê **(1)** …) **trước** heading `#### x.x.5.1` đầu tiên. **Không** được để trống, **không** được thay brief bằng đoạn smoke-only.

---

## 4. Chi tiết từng mục

### 4.1. Lời mở đầu (`## 1`)

Gồm đúng **2 đoạn văn**:

1. **Đoạn phỏng vấn:** Một fullstack developer đặt câu hỏi thực tế (trong dấu ngoặc kép). Junior developer trả lời đúng lý thuyết nhưng thiếu depth thực hành. Nêu rõ điểm còn thiếu.
2. **Đoạn chuyển mạch:** Nêu rõ bài sẽ thực hành gì (clone repo, chạy API, đối chiếu response) và mục tiêu kỹ thuật.

### 4.2. Chuẩn bị source code (`2.1.1` hoặc `2.2.1`)

- 1 dòng mô tả mục đích.
- Link source tham chiếu: `- Source tham chiếu: [<Tên bài>](<URL tree/main>)`
- Block `bash` gồm 2 bước: `git clone ...` + `cd ...`. **Bắt buộc** thêm dòng comment giải thích phía trên mỗi lệnh (ví dụ: `# Bước 1: Clone repository demo về máy local` và `# Bước 2: Di chuyển vào thư mục bài học` cho file VI, và tương đương cho file EN).
- 1 đoạn ngắn mô tả stack. **Quy tắc `.env`:** Chỉ hướng dẫn chỉnh file `.env` đã có trong repo demo. **Cấm** trong nội dung bài nhắc file mẫu env hoặc bước “copy từ file mẫu”.
- **Không** thêm `git pull origin main`.
- Label link chỉ giữ tên bài, không thêm prefix.

### 4.3. Kiến trúc/thành phần (`2.1.2`)

Theo thứ tự bắt buộc:

1. **Mô tả components** — liệt kê bullet, mỗi bullet: `**<Component>:** <vai trò ngắn>`.
2. **Bảng thành phần** — table markdown.
3. **Mermaid diagram** — `graph LR` hoặc `flowchart LR`, giữ đơn giản.
4. **Caption** — `Hình <N>: <mô tả>` ngay dưới diagram.
5. **(Tuỳ chọn)** Giải thích khái niệm cốt lõi bằng heading `####`, có code snippet minh hoạ.
6. **(Tuỳ chọn)** Bảng HTTP status code liên quan.

### 4.4. Chuẩn bị (`2.1.3`)

```
**2.1.3.1. Điều kiện cần trước**
- Bullet list tools cần cài.

**2.1.3.2. Cài dependency**
- Block `bash` theo thứ tự: docker compose up → npm install. Bắt buộc phải có comment giải thích cho từng lệnh.
```

**Nếu repo có `docker-compose`:** bắt buộc hướng dẫn khởi động Docker trước, sau đó mới cài đặt thư viện Node.js. **Lưu ý (strict):** Bắt buộc phải thêm dòng comment giải thích phía trên mỗi lệnh.
Ví dụ đối với file `vi.md`:
```bash
# Bước 1: Khởi động database/service bằng Docker
docker compose up -d

# Bước 2: Cài đặt các thư viện Node.js
npm install
```
(Với `en.md` dùng `# Step 1: Start database/service with Docker` và `# Step 2: Install Node.js dependencies`). Không viết "cài PostgreSQL thủ công".

### 4.5. Khởi chạy (`2.1.4`)

Block `bash` duy nhất: `npm run start:dev` (hoặc script tương đương).

**Đặc biệt với các bài Kubernetes**: Cuối phần `Khởi chạy`, bắt buộc phải có đoạn mô tả yêu cầu học viên chờ các Pod chuyển sang trạng thái `Running` trước khi sang phần Kiểm thử, kèm theo câu lệnh `kubectl get pods -w`.
*Ví dụ mẫu (cho vi.md):*
```bash
# Chờ các Pod chuyển sang trạng thái Running (theo dõi liên tục; Ctrl+C để thoát khi đã ổn định)
kubectl get pods -w
```
*(Tương tự cho en.md nhưng dịch sang tiếng Anh).*

**Quy tắc local Kubernetes (strict):** Với các bài tập chạy trên **Minikube**, ưu tiên sử dụng **Service Type: ClusterIP** cho tất cả các thành phần. Hướng dẫn học viên sử dụng lệnh `kubectl port-forward` để mở cổng kết nối từ máy local vào cluster thay vì dùng **NodePort** hoặc `minikube service --url`. Cách này giúp địa chỉ truy cập luôn cố định là `localhost` và đồng nhất giữa các hệ điều hành.

### 4.6. Kiểm thử (`2.1.5`)

Kiểm thử từng luồng — **được** ghi block `json` **hoàn chỉnh** — tức **đủ mọi field mà response thật** (sau `curl` / runtime repo demo) thực sự có — để học viên đối chiếu chính xác từng khóa. **Vẫn cấm** nhồi field chỉ nằm trên model ORM / "có thể có" mà **API không trả** trong luồng đó.

**Brief tổng quan luồng (bắt buộc, strict):** Ngay sau `**2.1.5. Kiểm thử**` phải là **một đoạn văn** (có thể dài 2–4 câu) mà câu mở đầu bắt đầu bằng **`**N luồng**`** với **N là chữ số** (ví dụ `**6 luồng**`, `**3 luồng**`, `**2 luồng**`) — **không** viết N bằng chữ tiếng Việt (*Sáu*, *Ba*, *Hai*, …). Trong cùng đoạn (hoặc đoạn liền sau, không xen block code) phải liệt kê ngắn **(1)** … **(2)** … **(N)** — mỗi mục tương ứng **một** `#### 2.1.5.<N>` ngay bên dưới theo đúng thứ tự. Brief chỉ mô tả **thứ tự / mục đích** từng luồng (endpoint, hành vi, status kỳ vọng nếu cần); **không** thay block `json` chi tiết trong từng luồng.

**Format bắt buộc (sau brief):**

1. Mỗi luồng dùng heading đánh số:
   - VI: `#### 2.1.5.<N>. Luồng <N> — <tên luồng>`
   - EN: `#### 2.1.5.<N>. Flow <N> — <flow name>`
2. Trong mỗi luồng, theo thứ tự:
   - `- Bước N: <mô tả>`. **Lưu ý (strict):** Toàn bộ nội dung bên trong mỗi bước (bao gồm block code `bash`, đoạn text `Response phải trả về...`, block `json`, hay mock terminal output) **bắt buộc phải thụt lề (indent) vào 2 space** để nằm gọn bên trong thẻ list của Bước đó. Nếu bước test yêu cầu sửa đổi code, ghi rõ file và chèn block code mô tả (được thụt lề) trước lệnh terminal.
   - Block `bash` chứa lệnh `curl` đầy đủ, được thụt lề 2 space.
   - `Response phải trả về (HTTP <code>):` (được thụt lề 2 space) + block `json` (thụt lề 2 space) **đúng với payload thật**.
   - Với HTTP 204 (không body): ghi dòng status kỳ vọng thay cho block json.
   - Với các lệnh CLI (`kubectl`, `docker`, v.v.): **bắt buộc** cung cấp mock terminal output (kết quả trả về giả lập trên terminal) trong block `text` (hoặc ngôn ngữ phù hợp) kèm câu dẫn `Kết quả trả về trên terminal:` (tất cả thụt lề 2 space) để học viên dễ dàng đối chiếu.
3. Cuối mỗi luồng: phần *Kết luận:* in nghiêng toàn bộ, đứng riêng, 1 dòng trắng trước và sau. Các luận điểm được xác nhận phải trình bày dưới dạng danh sách bullet point, **mỗi bullet point phải kèm theo giải thích ngắn gọn lý do vì sao xác nhận được điều đó dựa trên code** để tường minh và dễ theo dõi.
   Ví dụ:
   *Kết luận: Nếu response khớp đúng JSON trên, hệ thống xác nhận:*
   - *App boot thành công: ứng dụng khởi động không báo lỗi thiếu dependency.*
   - *Route map đúng vào controller/service: request được `CatController` tiếp nhận và gọi tới `CatService` để lấy dữ liệu.*

**Cấm:**
- Đoạn / nhãn **Smoke nhanh:** (hoặc tương đương) và mọi đoạn **chỉ** `curl` + kỳ vọng HTTP chung **đứng trước** brief `**N luồng**` — mọi lệnh `curl` nằm trong từng luồng con.
- Dùng bullet làm tiêu đề luồng (`- **Luồng ...**`).
- Các nhãn trung gian: `Tiêu đề API`, `Hướng dẫn gọi API`, `Body JSON`, `Hoặc dùng curl`.
- Tách body JSON ra ngoài lệnh curl.
- Tạo mục riêng "Kết quả mong đợi" cho cả luồng.
- Mô tả response chung chung ("HTTP 200 và trả JSON") — phải có block `json` cụ thể.
- Viết *Kết luận:* dạng 1 đoạn văn liền (không bullet). **Bắt buộc** theo format: 1 dòng mở đầu + danh sách bullet xác nhận.
- **Dùng lệnh `open` cho HTML test:** Nếu bài có test qua HTML (VD: WebSocket), cấm dùng lệnh terminal `open` hoặc `start`. Bắt buộc ghi chú dùng VS Code extension (ví dụ: Live Server) để mở file.
- **Dùng lệnh `cat`/`type` để “xem file kết quả” trong lesson test:** cấm hướng dẫn theo kiểu dump toàn file trong terminal. Thay vào đó, yêu cầu học viên mở trực tiếp file output trong thư mục repo đã clone để kiểm tra.

### 4.7. Dọn tài nguyên (`2.1.6`)

- Dòng cố định: `Sau khi kết thúc bài, bạn có thể dọn tài nguyên để tiết kiệm bộ nhớ.`
- Block `bash`: `docker compose -f ... down -v` cho từng compose file.

### 4.8. Đọc thêm (`2.1.7`)

- Bullet list, 4–8 mục.
- Mỗi bullet theo mẫu: `**<Keyword>:** <giải thích ngắn + vì sao quan trọng + rủi ro nếu bỏ qua>. ([<nguồn>](<url>))`
- Link phải là nguồn kỹ thuật uy tín (official docs, vendor docs).
- Nội dung bám trực tiếp stack đang dạy.

### 4.9. Tổng kết (`## 3`)

#### Các câu hỏi dễ bị phỏng vấn

- 3–5 câu hỏi, mỗi câu theo template:

```
- **Câu hỏi <N>:** <câu hỏi>
  - Ý interviewer muốn nghe: <keyword ngắn>
  - Trả lời mẫu (ngắn): <2–4 câu>
```

---

## 5. Quy ước source code theo module

Mỗi module có repo riêng. Quy tắc chung:
- Label link: chỉ giữ tên bài, không thêm prefix.
- Block clone: `git clone <url>` + `cd <repo>/<lesson-folder>`.
- **Không** thêm `git pull origin main`.

### Module `0-backend-environment-nestjs-introduction`

- Repo: `https://github.com/StarCi-Academy/fullstack-mastery-module-1-backend-environment-nestjs-introduction`
- Content → folder: `0-environment-setup-and-nestjs-core`, `1-request-lifecycle`, `2-production-ready-config-and-logging`.

### Module `1-database-integration-orm-odm-caching`

- Repo: `https://github.com/StarCi-Academy/fullstack-mastery-module-2-database-integration-orm-odm-caching`
- Content → folder: `0-sql-vs-nosql-in-nestjs`, `1-typeorm-and-postgresql`, `2-mongoose-and-mongodb`, `3-caching-with-redis`.
- **Bài `3-caching-with-redis` (VI + EN):** Trong `2.1.3` chỉ hướng dẫn `docker compose` + `npm install` đúng repo đã clone; **không** chèn đoạn so sánh hay “ưu tiên” stack cache cụ thể (ví dụ Keyv vs `cache-manager-redis-store`), **không** thêm lệnh `npm i` phụ hay snippet `CacheModule` thay cấu hình ngoài source demo — tránh lệch runtime và tránh nhồi lựa chọn thư viện trong bài học.

### Module `2-rest-api-development-documentation`

- Repo: `https://github.com/StarCi-Academy/fullstack-mastery-module-3-rest-api-development-documentation`
- Tất cả content dùng source từ repo này:
  - `0-restful-api-crud-best-practices` → `.../tree/main/0-restful-api-crud-best-practices`
  - `1-dtos-and-validation` → `.../tree/main/1-dtos-and-validation`
  - `2-unified-response-and-errors` → `.../tree/main/2-unified-response-and-errors`
  - `3-swagger-api-documentation` → `.../tree/main/3-swagger-api-documentation`

### Module `3-authentication-authorization-jwt-rbac`

- Repo: `https://github.com/StarCi-Academy/fullstack-mastery-module-4-authentication-authorization-jwt-rbac`
- Content → folder: `0-jwt-authentication-flow`, `1-refresh-token-strategy`, `2-rbac-and-guards`, `3-oauth2-google-login`.

### Module `4-websocket-and-realtime-communication`

- Repo: `https://github.com/StarCi-Academy/fullstack-mastery-module-5-websocket-and-realtime-communication`
- Content → folder: `0-socketio-gateway-architecture`, `1-namespaces-rooms-and-events`, `2-socket-authentication`, `3-scaling-with-redis-adapter`.

### Module `5-otp-sms-mail`

- Repo: `https://github.com/StarCi-Academy/fullstack-mastery-module-6-otp-sms-mail`
- Content → folder: `0-sending-emails-with-nodemailer`, `1-otp-verification-with-redis`, `2-integrating-sms-gateways`.

### Module `6-workers-and-cron-jobs`

- Repo: `https://github.com/StarCi-Academy/fullstack-mastery-module-7-workers-and-cron-jobs`
- Content → folder: `0-task-scheduling-cron`, `1-bullmq-message-queue`.

### Module `7-react-basic`

- Repo: `https://github.com/StarCi-Academy/fullstack-mastery-module-8-react-basic`
- Content → folder: `0-react-vite-setup-and-jsx`, `1-components-props-and-state`, `2-hooks-and-api-calls`, `3-react-router-navigation`.

---

## 6. Challenge framework

### Format chuẩn

Mỗi challenge có:
- **Challenge title**, **Key takeaway(s)**, **Bối cảnh** (2–4 câu), **Input**.
- **Requirements:** nhiều block đánh số (`## 1`, `## 2`, ...), mỗi block có:
  - `### purpose`, `### technicalConstraints`, `### proTipsHints`.
  - Cuối phần requirements bắt buộc có `### forbidden`.
- **Steps:** mỗi step có đủ 3 mục:
  - `### 1. Các bước thực hiện`
  - `### 2. Yêu cầu tối thiểu cần đạt`
  - `### 3. Nice to have`
- **Outputs:** mỗi output theo schema `## <orderIndex>` → `### text` → nội dung.
- **promptText** trong submissions: viết theo rubric, mở đầu `Chấm theo Rubric (tối đa X điểm):`, tiêu chí đánh số liên tiếp, `score` là số nguyên dương.

### 4 levels

| Level | Kỳ vọng | Bắt buộc? |
|---|---|---|
| **Easy** | Hiểu định nghĩa, giải thích, 1 ví dụ tối giản | **Có** (tối thiểu 1/bài) |
| **Medium** | Trade-off, failure scenario, 1 Mermaid diagram | Tuỳ chọn |
| **Hard** | SLO/SLA, monitoring, rollback, production readiness | Tuỳ chọn |
| **Insane** | Scale 1M users, sharding, multi-region, cost trade-off | Tuỳ chọn |

### Evidence

- Bằng chứng bắt buộc: **copy/paste output text** (terminal/API/JSON). **Cấm** screenshot làm bằng chứng chính.
