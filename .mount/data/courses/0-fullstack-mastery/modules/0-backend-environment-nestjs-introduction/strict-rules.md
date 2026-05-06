# Quy tắc viết nội dung — Fullstack Mastery (strict)

Mọi file content (`vi.md`, `en.md`) trong khoá **Fullstack Mastery** bắt buộc tuân theo đúng cấu trúc dưới đây. Tuân thủ 100% strict-rules của System Design Mastery (xem `strict-rules.md` module monitoring-and-observability), **ngoại trừ** các điểm khác biệt liệt kê bên dưới.

---

## 1. Khác biệt so với System Design Mastery

### 1.1. Chạy ứng dụng bằng `nest start --watch` (KHÔNG chạy Docker cho backend)

- Backend **NestJS** chạy trực tiếp trên máy bằng **`nest start --watch`**, **KHÔNG** build image, **KHÔNG** chạy trong Docker.
- **Docker Compose** (nếu có) chỉ dùng cho **infrastructure** (PostgreSQL, MongoDB, Redis, v.v.) — **KHÔNG** chứa service backend.
- Điều kiện cần trước (**Prerequisites**) luôn bao gồm: **Node.js** v18+, **npm**, **NestJS CLI** (`npm i -g @nestjs/cli`).
- Nếu bài có infrastructure Docker:
  - Heading `2.1.3.2`: `Khởi động` (VI) / `Start` (EN).
  - **1 block duy nhất** chứa 3 bước: docker compose → npm install → nest start.
  - **KHÔNG** tách thành 2 heading `2.1.3.2` + `2.1.3.3`.
  - Ví dụ (VI):
    ```
    ##### 2.1.3.2. Khởi động
    ```bash
    # Bước 1: Khởi động PostgreSQL
    docker compose -f .docker/compose.yaml up -d

    # Bước 2: Cài dependency
    npm install

    # Bước 3: Khởi chạy ở chế độ watch
    nest start --watch
    ```
    ```
  - Ví dụ (EN):
    ```
    ##### 2.1.3.2. Start
    ```bash
    # Step 1: Start PostgreSQL
    docker compose -f .docker/compose.yaml up -d

    # Step 2: Install dependencies
    npm install

    # Step 3: Start in watch mode
    nest start --watch
    ```
    ```
- Nếu bài **KHÔNG** có Docker (chỉ chạy NestJS thuần):
  - Heading `2.1.3.2`: `Khởi động` (VI) / `Start` (EN).
  - **1 block duy nhất** chứa 2 bước: npm install → nest start.
  - Ví dụ (VI):
    ```
    ##### 2.1.3.2. Khởi động
    ```bash
    # Bước 1: Cài dependency
    npm install

    # Bước 2: Khởi chạy ở chế độ watch
    nest start --watch
    ```
    ```
  - Mục Cleanup ghi: "Bài này không sử dụng Docker, không cần dọn tài nguyên." / "This lesson does not use Docker, no resource cleanup is needed."
- **Mỗi lệnh phải có comment bước** (`# Bước N:` / `# Step N:`).

### 1.2. Clone & cd

- Block clone: cd vào **thư mục lesson trực tiếp** (không có `.docker`):

  ```bash
  # Bước 1: Clone repository về máy local
  git clone <URL>.git

  # Bước 2: Di chuyển vào đúng thư mục bài học
  cd <repo>/<lesson-folder>
  ```

### 1.3. Source line format

- **VI:** `Source: [<Org/repo>](<URL>) trên GitHub — thư mục bài học: [`<folder>`](<URL tree>).`
- **EN:** `Source: [<Org/repo>](<URL>) on GitHub — lesson directory: [`<folder>`](<URL tree>).`
- **KHÔNG** đề cập `.docker` trong source line nếu bài không dùng Docker cho backend.

### 1.4. Repo duy nhất cho module này

```
https://github.com/StarCi-Academy/fullstack-mastery-module-1-backend-environment-nestjs-introduction
```

---

## 2. Giữ nguyên từ strict-rules gốc

Tất cả các quy tắc sau **giữ nguyên 100%** từ `strict-rules.md` module monitoring-and-observability:

- Metadata bắt buộc: `# title`, `# description`, `# body`, `# references`, `# minutesRead`.
- Cấu trúc body: `## 1` → `## 2` (2.1 Hands-on + 2.2 Theory) → `## 3`.
- Opening 2 đoạn (phỏng vấn + chuyển mạch).
- Đoạn dẫn mạch practice-led theory trước `### 2.1` — **phải mô tả cụ thể luồng bài học**: clone source, khởi động infrastructure (nếu có), chạy NestJS bằng `nest start --watch`, gọi API/WebSocket để quan sát, rồi chuyển sang phần lý thuyết. **KHÔNG** viết ngắn gọn kiểu "Cấu trúc bài học áp dụng phương pháp Thực hành dẫn dắt Lý thuyết." mà phải khai triển chi tiết.
- Dual-platform commands (PowerShell + curl) cho mọi lệnh API.
- Verification flows format (heading, steps, expected response, conclusion).
- Further reading bullet list.
- Theory section với edge cases cuối.
- Wrap-up interview questions.
- Wording cố định (bảng §6 của strict-rules gốc).
- Giọng văn trung lập, thuật ngữ IT in đậm.
- Cấm dùng "bài lab", luôn dùng "bài học" / "lesson".

---

## 3. Content → folder mapping

| Content | Lesson folder | Stack chính |
| --- | --- | --- |
| `0-environment-setup-and-nestjs-core` | `0-environment-setup-and-nestjs-core` | NestJS thuần (không Docker) |
| `1-request-lifecycle` | `1-request-lifecycle` | NestJS thuần (không Docker) |
| `2-production-ready-config-and-logging` | `2-production-ready-config-and-logging` | NestJS + Docker (infra only) |

---

## 4. Checklist trước khi submit

- [ ] File có đủ: `# title`, `# description`, `# body`, `# references`, `# minutesRead`.
- [ ] `# description` là plain text, không markdown.
- [ ] `## 1` có đúng 2 đoạn (phỏng vấn + chuyển mạch).
- [ ] `## 2` có đoạn dẫn mạch **practice-led theory** trước `### 2.1`.
- [ ] `### 2.1` có đủ 6 mục con (2.1.1 → 2.1.6).
- [ ] `### 2.2` có edge cases cuối cùng.
- [ ] Mọi lệnh API có dual-platform (PowerShell + curl).
- [ ] Backend chạy bằng `nest start --watch`, **KHÔNG** chạy Docker.
- [ ] Docker (nếu có) chỉ cho infrastructure.
- [ ] `## 3` có `### 3.1` với 3–5 câu hỏi phỏng vấn.
- [ ] References ≥ 2, link uy tín.
- [ ] `# minutesRead` hợp lý (15–30).
- [ ] EN và VI heading/wording khớp bảng wording cố định.
