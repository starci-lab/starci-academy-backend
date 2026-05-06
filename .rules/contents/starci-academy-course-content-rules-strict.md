# Quy tắc viết nội dung StarCi Academy (strict) — bản chuẩn + hiệu chỉnh pattern Monitoring

Tài liệu gửi giảng viên / reviewer: **quy tắc gốc (strict)** cho mọi file `vi.md` / `en.md` dưới `.mount/data/courses/**/contents/**/`, **Phần VII** minh hoạ cụ thể bằng bài *Monitoring & Observability* (lesson `0`), và **phụ lục** tóm tắt lệch chuẩn khi chuẩn hoá.

---

## Phần I — Quy tắc chung

- Giọng văn trung lập, không khẩu ngữ.
- Thuật ngữ IT (**Database**, **ValidationPipe**, **TypeORM**, …) **in đậm**, không dịch sang tiếng Việt.
- **VI:** heading `## 1. Lời mở đầu`, `## 2. Các khái niệm cốt lõi`, `## 3. Tổng kết`.
- **EN:** heading `## 1. Introduction`, `## 2. Core Concepts`, `## 3. Summary` (không dùng *Opening* / *Wrap-up* nếu muốn khớp chuẩn).
- Code block **luôn** khai báo ngôn ngữ (`bash`, `typescript`, `json`, `mermaid`, `text`, …).
- **Chỉ dùng `curl`** cho mọi hướng dẫn gọi HTTP từ terminal trong bài. **Cấm** nhắc **Postman** hoặc snippet **PowerShell** (`Invoke-WebRequest`, …) trong nội dung học viên — nếu học viên trên Windows, gợi ý **Git Bash**, **WSL**, hoặc `curl.exe` (cùng cú pháp với `curl`).
- **Kiểm thử (thụt lề):** Trong phần Kiểm thử, toàn bộ nội dung con thuộc từng bước `- Bước …` / `- Step …` (Response, block `bash` / `json` / `text`, …) **bắt buộc thụt lề 2 khoảng trắng** so với cột `- Bước` để render gọn trong `<li>` trên web (chi tiết §4.6).
- **Mermaid:** nhãn node tránh `@`, decorator raw, ngoặc phức tạp; ưu tiên nhãn rõ nghĩa.

---

## Phần II — Metadata bắt buộc

Thứ tự đầu file:

```
# title
<Tiêu đề>

# description
<1–3 câu plain text — không markdown, không bold, không backtick, không link>

# body
<Nội dung — theo §III>

# references
## 0
### alias
...
### url
...

# minutesRead
<số>
```

---

## Phần III — Cấu trúc `# body` (chuẩn strict)

```
## 1. Lời mở đầu   /   ## 1. Introduction
## 2. Các khái niệm cốt lõi   /   ## 2. Core Concepts
### 2.1. Lý thuyết — <Tên chủ đề>
  (ví dụ đời thường → định nghĩa; ví dụ tối giản; edge case; Mermaid/snippet cho phép)
  — KHÔNG: git clone, docker compose chi tiết, curl kiểm thử, npm install trong luồng lab
### 2.2. Thực hành — <Tên chủ đề>
  #### 2.2.1. Chuẩn bị source code và môi trường
  #### 2.2.2. Kiến trúc/thành phần (stack + luồng)
  #### 2.2.3. Chuẩn bị & Khởi chạy
  #### 2.2.4. Kiểm thử
  #### 2.2.5. Dọn tài nguyên
  #### 2.2.6. Đọc thêm
## 3. Tổng kết   /   ## 3. Summary
### 3.1. Các câu hỏi dễ bị phỏng vấn   /   ### 3.1. Common interview questions
```

**Quy tắc:**

- Luôn có **đủ** `### 2.1` (Lý thuyết) và `### 2.2` (Thực hành).
- **2.1:** analogy bắt buộc khi khái niệm trừu tượng; lần đầu xuất hiện thuật ngữ/abbrev có ngoặc giải thích tiếng Việt ngắn; mỗi khái niệm chính có sub-heading `#### 2.1.N`; có edge case (hiện tượng / nguyên nhân / hệ quả).
- **2.2:** không lược bớt mục; không có Docker vẫn ghi **Dọn tài nguyên** (có thể một dòng “Không cần …”).

---

## Phần IV — §1 Lời mở đầu (đúng 2 đoạn)

1. **Đoạn phỏng vấn:** một dev đặt câu (trong ngoặc kép). Chọn **Junior / Mid / Senior** cho khớp độ khó bài; người trả lời đúng lý thuyết nhưng **thiếu depth** phù hợp để dẫn vào bài.
2. **Đoạn chuyển mạch:** (1) nắm **lý thuyết** `2.1` trước, (2) **thực hành** `2.2` để clone/chạy/đối chiếu với demo; nêu mục tiêu kỹ thuật sau bài.

---

## Phần V — Chi tiết thực hành (rút gọn)

### V.1 Chuẩn bị source (`2.2.1`)

- Mục đích 1 dòng.
- `- Source tham chiếu: [<Tên bài>](<URL /tree/main>)`
- Block `bash`: `git clone` + `cd` — **mỗi lệnh có comment** `# Bước 1:` / `# Step 1:` …
- Stack ngắn; **cấm** “copy env mẫu”; chỉ chỉnh `.env` có sẵn repo.
- **Cấm** `git pull origin main`.

### V.2 Kiến trúc (`2.2.2`)

Thứ tự: bullets component → bảng → Mermaid (`graph LR` / `flowchart LR`) → `Hình N:` caption → (tuỳ chọn) `####` bổ sung / bảng HTTP.

### V.3 Chuẩn bị & khởi chạy (`2.2.3`)

**Gộp một sub-heading**, trong đó:

- `**2.2.3.1. Điều kiện cần trước**` — bullet công cụ.
- `**2.2.3.2. Cài dependency và khởi chạy**` — block `bash`: **Docker trước** (nếu có), sau `npm install`, sau `npm run start:dev` (hoặc tương đương); **mỗi lệnh có comment**.

**Biến thể lab chỉ Docker (image có sẵn):** vẫn dùng `2.2.3.2`, có thể chỉ `docker compose up -d` + comment; **không** thêm `npm run start:dev` nếu không đúng repo — ghi đúng đường dẫn `.docker` như demo.

### V.4 Kiểm thử (`2.2.4`) — strict

Sau heading `**2.2.4. Kiểm thử**`:

1. **Brief bắt buộc:** một đoạn văn mở đầu bằng **`**N luồng**`** (**N là chữ số**, không viết *Bốn luồng*), trong đó hoặc đoạn liền sau **liệt kê (1) … (N)** — khớp thứ tự với `#### 2.2.4.1` … `#### 2.2.4.N`. Đánh dấu luồng nâng cao, ví dụ `(luồng nâng cao)` ở mục **(N)** tương ứng.
2. **Cấm** bullet `- **Luồng 1:**` làm brief chính thay cho đoạn **N luồng** + **(1)(2)**.
3. Mỗi luồng: `#### 2.2.4.<N>. Luồng <N> — …` / `Flow <N> — …`
4. Trong luồng: `- Bước …` / `- Step …`; nội dung bước **thụt 2 space**; **`curl`** trong block `bash`; `Response … (HTTP xxx):` + `json` đúng payload thật; CLI có mock **terminal** trong block `text` khi cần.
5. Cuối luồng: *Kết luận:* in nghiêng + **bullet** giải thích ngắn gắn với **code**.

**Cấm:** smoke đứng trước brief; nhãn “Tiêu đề API”, “Body JSON” tách khỏi curl; kết luận một khối văn không bullet; bỏ luồng fail hoặc bỏ luồng nâng cao.

### V.5 Dọn tài nguyên (`2.2.5`)

Câu cố định + `bash` `docker compose … down -v` đúng file.

### V.6 Đọc thêm (`2.2.6`)

4–8 bullet: `**Keyword:** … ([nguồn](url))`.

### V.7 Tổng kết §3

3–5 câu phỏng vấn theo template **Câu hỏi / Ý interviewer / Trả lời mẫu**.

---

## Phần VI — Challenge framework & Evidence (tóm tắt)

- Challenge: đủ title, takeaway, bối cảnh, input; requirements có `purpose`, `technicalConstraints`, `proTipsHints`, `forbidden`; steps có 3 mục; outputs schema `## orderIndex` → `### text`; `promptText` theo rubric.
- Evidence ưu tiên **copy/paste text**; **cấm** screenshot làm bằng chứng chính.

---

## Phần VII — Ví dụ gắn bài: *Giới thiệu Monitoring & Observability* (lesson `0`)

Các ví dụ dưới đây lấy từ nội dung đang mount tại:

- `.mount/data/courses/1-system-design-mastery/modules/4-monitoring-and-observability/contents/0-monitoring-and-observability/vi.md`
- cùng thư mục: `en.md`

Repo demo GitHub:

- `https://github.com/StarCi-Academy/system-design-mastery-module-7-monitoring-and-observability`  
- Thư mục Compose bài học: `0-monitoring-and-observability/.docker` (sau khi clone, `cd` vào đây rồi `docker compose up -d`).

### VII.1. Metadata — ví dụ “đúng hình thức” (trích ý, có thể tinh chỉnh wording)

Cấu trúc `# title` → `# description` → `# body` → `# references` → `# minutesRead` của bài này **đã khớp** Phần II. Ví dụ phần đầu `vi.md` (học viên chỉ thấy phần sau `# body` trên CMS; phần trên là nguồn dữ liệu):

```
# title
Giới thiệu về Monitoring và Observability trong hệ thống Microservices

# description
Bài viết này làm rõ sự khác biệt cốt lõi giữa Monitoring và Observability, cùng cách áp dụng ba trụ cột telemetry. Bài gồm phần thực hành thiết lập hệ thống giám sát với NestJS, Prometheus, Grafana và PostgreSQL.
```

**Ghi chú strict:** `# description` là plain text — không **bold**, không backtick, không link; đoạn trên là mẫu hợp lệ.

**EN:** file `en.md` hiện dùng `## 1. Opening` và có thể dùng *Wrap-up* — khi chuẩn hoá strict thì đổi thành `Introduction` / `Summary` (Phần I).

### VII.2. §1 Lời mở đầu — bài này đang làm đúng gì / cần chỉnh gì khi strict

- **Đúng hướng:** hai đoạn (phỏng vấn + chuyển mạch), có **Senior** hỏi và **Mid** trả lời thiếu depth **Observability** / **High Cardinality** — phù hợp Phần IV.
- **Khi áp strict thuần:** đoạn chuyển mạch **bắt buộc** nói học viên đọc **`2.1` Lý thuyết trước**, rồi **`2.2` Thực hành** (clone/chạy/kiểm thử). Bản hiện tại viết theo **“Thực hành dẫn dắt Lý thuyết”** (`2.1` = hands-on, `2.2` = theory) — **mâu thuẫn** với đoạn chuyển mạch chuẩn; khi gom về một pattern, hoặc **đổi thứ tự mục** hoặc **sửa lời dẫn** cho khớp quyết định nội bộ.

### VII.3. Skeleton `# body` — đối chiếu trực tiếp

| Ý | Chuẩn strict (Phần III) | Nội dung lesson `0` hiện tại (`vi.md`) |
|---|-------------------------|----------------------------------------|
| Thứ tự | `### 2.1. Lý thuyết` rồi `### 2.2. Thực hành` | `### 2.1. Thực hành` rồi `### 2.2. Lý thuyết` |
| Mục thực hành | `#### 2.2.1` … `2.2.6` | `#### 2.1.1` … `2.1.6` (cùng tên mục, khác nhánh `2.1`) |
| Kiểm thử | `#### 2.2.4.1` … | `##### 2.1.4.1` … (cấp heading sâu hơn strict mẫu — khi chuẩn hoá nên dùng `#### 2.2.4.<N>`) |

**Cách đọc bảng khi sửa bài:** giữ nguyên *nội dung* từng mục, chỉ **đổi số hiệu** và **thứ tự khối** cho trùng Phần III (Lý thuyết trước, Thực hành sau).

### VII.4. `2.2.1` Chuẩn bị source — ví dụ block `bash` (đúng repo bài này)

Strict thêm dòng link dạng `- Source tham chiếu: […](…/tree/main/0-monitoring-and-observability)`; nội dung lệnh có thể giữ như demo:

```bash
# Bước 1: Clone repository demo về máy local
git clone https://github.com/StarCi-Academy/system-design-mastery-module-7-monitoring-and-observability.git

# Bước 2: Di chuyển vào thư mục chứa Compose của bài học
cd system-design-mastery-module-7-monitoring-and-observability/0-monitoring-and-observability/.docker
```

(EN: `# Step 1:` / `# Step 2:` với cùng URL và `cd`.)

### VII.5. `2.2.3` Khởi chạy — biến thể “chỉ Docker” của chính bài này

```bash
# Bước 1: Khởi động PostgreSQL, API NestJS image lab, Prometheus và Grafana
docker compose up -d
```

Không bắt buộc thêm `npm install` / `npm run start:dev` trong luồng chính nếu học viên chỉ chạy image đã build sẵn (Phần V.3). **Ghi chú thầy:** phần **Node.js** + rebuild image chỉ cho **nhánh tuỳ chọn** (ví dụ **High Cardinality** ở Luồng 4) — có thể để trong bullet *Điều kiện cần trước* hoặc bước riêng trong luồng nâng cao, không làm sai thứ tự Docker-first của lab.

### VII.6. Brief kiểm thử — **sai strict** (pattern đang có) vs **mẫu đúng** (cùng nội dung 4 luồng)

**Đang có trong bài (vi phạm §V.4 mục “cấm bullet brief”):** đoạn mở `**4 luồng**` tiếp theo là list `- **Luồng 1:**` … `- **Luồng 4**`.

**Mẫu chỉnh theo strict** (một đoạn văn, **N = chữ số**, **(1)…(4)** khớp `#### 2.2.4.1` … `#### 2.2.4.4`):

> **4 luồng** kiểm thử xác nhận **HttpMetricsMiddleware**, **ValidationPipe** trên **CreateCatDto**, cấu hình scrape **Prometheus**, và (luồng nâng cao) **PromQL** / **Grafana Explore** cùng tuỳ chọn **High Cardinality**: **(1)** happy path **GET /cats** và counter **http_requests_total**; **(2)** **POST /cats** payload sai → HTTP 400 và nhãn **status_code**; **(3)** target **Prometheus** **health=up**, **job=nestjs-app-lesson0**; **(4)** sinh tải, **p95** qua API/query và **Explore**, tuỳ chọn mở rộng **labelNames** và đối chứng **numSeries** **(luồng nâng cao)**.

### VII.7. Một bước trong luồng — **sai strict** vs **mẫu đúng** (HTTP)

**Sai (trích ý từ bài — PowerShell + Postman):** khối `bash` chứa `Invoke-WebRequest` và dòng gợi ý Postman.

**Mẫu đúng (curl + thụt 2 space dưới `- Bước 1:`)** — ví dụ dưới bọc bằng fence 4 backtick để hiển thị được khối `bash`/`json` bên trong:

````
- Bước 1: Gọi GET /cats để có metric với route="/cats".

  ```bash
  curl -i http://localhost:3000/cats
  ```

  Response phải trả về (HTTP 200):

  ```json
  [
    {
      "id": 1,
      "name": "Tom",
      "age": 3
    }
  ]
  ```
````

**Windows:** thêm một câu ngoài khối lệnh: dùng **Git Bash**, **WSL**, hoặc `curl.exe` — không nhét PowerShell vào nội dung bước.

### VII.8. Kiến trúc (`2.2.2`) — phần bài này gần khớp §V.2

Lesson đã có: bullet component → bảng → `flowchart LR` Mermaid. **Bổ sung strict nhỏ:** ngay dưới diagram thêm một dòng caption dạng `Hình 1: Luồng client → NestJS → PostgreSQL; Prometheus scrape /metrics; Grafana truy vấn Prometheus.`

### VII.9. Liên kết nội dung cũ trong `.rules`

File `.rules/contents/monitoring-lesson-0-steps-module5-repo.md` có thể trỏ repo/module khác phiên bản — khi đối chiếu **luôn ưu tiên URL và tree của lesson đang mount** (module-7 như trên).

---

## Phụ lục A — Pattern đã dùng cho bài *Monitoring & Observability* (lesson `0`) và lệch chuẩn

*Bảng rút gọn; chi tiết và ví dụ câu chữ xem **Phần VII**.*

| Hạng mục | Chuẩn strict (Phần III–V) | Đã làm trong draft lesson Monitoring |
|----------|---------------------------|-------------------------------------|
| Thứ tự §2 | `2.1` Lý thuyết → `2.2` Thực hành | **Đảo:** “Thực hành dẫn dắt Lý thuyết” (`2.1` thực hành, `2.2` lý thuyết). **Khuyến nghị chuẩn hoá:** gom về đúng strict để CMS/parser một pattern duy nhất; nếu giữ đảo thứ tự thì cần **quyết định nội bộ StarCi** ghi trong style guide. |
| HTTP trong bài | Chỉ `curl` | Đã có **PowerShell** / gợi ý Postman → **vi phạm** strict; khi chỉnh: **chỉ `curl`**, Windows → Git Bash / WSL / `curl.exe`. |
| Brief luồng | `**4 luồng**` + **(1)(2)(3)(4)** trong đoạn văn | Đã dùng bullet `- **Luồng N:**` → **đổi** sang định dạng §V.4. |
| Heading EN §1/§3 | Introduction / Summary | Kiểm tra đổi *Opening* / *Wrap-up* nếu còn. |
| Repo demo | Theo §V và mapping module | Nội dung mount có thể trỏ **`system-design-mastery-module-7-monitoring-and-observability`** và thư mục **`0-monitoring-and-observability/.docker`** — đối chiếu `.rules/contents/monitoring-lesson-0-steps-module5-repo.md` nếu URL/module khác phiên bản repo. |
| **2.2.3** chỉ Compose | Cho phép nếu đúng demo | Stack Nest + Postgres + Prometheus + Grafana chỉ **`docker compose up -d`** trong `.docker`: **không** ép thêm `npm run start:dev` nếu không có trong luồng chính. |

---

## Phụ lục B — Kiểm thử tự động / máy giảng viên

- Trước `docker compose up`, nếu báo bind cổng: **không** nhất thiết đưa vào bài học; có thể xử lý ngoài bài (`docker compose down`, hoặc giải phóng PID đang LISTEN trên cổng conflict — chỉ khi chắc an toàn).
- **Luồng Prometheus targets (`health=up`):** sau `up` nên chờ **15–25s** (vài nhịp scrape) trước khi gọi `/api/v1/targets`.
- **Luồng nâng cao `histogram_quantile` + `rate(...[5m])`:** có thể cần **chờ** sau khi sinh tải để vector không rỗng — ghi trong bước kiểm thử (đúng §V.4, có mock/`text` nếu cần).

---

*Tài liệu này tổng hợp quy tắc strict do team định nghĩa và đối chiếu pattern thực tế bài Monitoring để chỉnh một lần cho khớp chuẩn.*
