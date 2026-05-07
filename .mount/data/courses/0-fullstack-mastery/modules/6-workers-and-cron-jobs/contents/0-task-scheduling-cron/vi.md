# title
Task Scheduling với Cron

# description
Thực hành xây dựng tác vụ chạy theo lịch trong NestJS bằng @nestjs/schedule, bao gồm Cron expression, Interval heartbeat, và backup dữ liệu tự động.

# body

## 1. Lời mở đầu

"Hệ thống cần backup database mỗi 30 giây — em để user bấm nút backup thủ công à?" — một **Senior Engineer** hỏi khi review ops automation. Một **Mid-level Developer** trả lời: "Em sẽ viết script chạy `setInterval` trong `main.ts`." Câu trả lời cho thấy nhận thức về scheduling, nhưng vẫn thiếu chiều sâu về **lifecycle management**: `setInterval` nằm ngoài DI container → không inject service, không testable — **@nestjs/schedule** tích hợp Cron decorator trực tiếp vào service, quản lý lifecycle qua NestJS DI.

Bài này dẫn qua hai mạch liên tiếp:
- **Phần 2.1**: **thực hành**; **stack** gồm **NestJS** + **PostgreSQL** (Docker), kèm **hai luồng** (heartbeat interval + cron backup).
- **Phần 2.2**: **lý thuyết** làm rõ bản chất **Cron expression**, **@nestjs/schedule decorators**, và các **edge case**.

## 2. Các khái niệm cốt lõi

Cấu trúc bài học áp dụng phương pháp **Thực hành dẫn dắt Lý thuyết**. Khởi đầu, học viên clone source, khởi động **PostgreSQL** bằng **Docker Compose**, chạy **NestJS** bằng `nest start --watch` và quan sát terminal log để thấy heartbeat mỗi 10 giây và backup mỗi 30 giây chạy tự động. Tiếp theo, **phần lý thuyết** phân tích Cron expression syntax và các **edge cases**.

### 2.1. Thực hành

#### 2.1.1. Chuẩn bị source code và môi trường

Source: [StarCi-Academy/fullstack-mastery-module-7-workers-and-cron-jobs](https://github.com/StarCi-Academy/fullstack-mastery-module-7-workers-and-cron-jobs) trên GitHub — thư mục bài học: [`0-task-scheduling-cron`](https://github.com/StarCi-Academy/fullstack-mastery-module-7-workers-and-cron-jobs/tree/main/0-task-scheduling-cron).

```bash
# Bước 1: Clone repository về máy local
git clone https://github.com/StarCi-Academy/fullstack-mastery-module-7-workers-and-cron-jobs.git

# Bước 2: Di chuyển vào đúng thư mục bài học
cd fullstack-mastery-module-7-workers-and-cron-jobs/0-task-scheduling-cron
```

#### 2.1.2. Kiến trúc/thành phần (stack + luồng)

| Thành phần | File | Vai trò |
| --- | --- | --- |
| **PostgreSQL** | `.docker/compose.yaml` | Lưu trữ users (data để backup) |
| **BackupService** | `src/backup/backup.service.ts` | `@Cron` + `@Interval` decorators |
| **UsersService** | `src/users/users.service.ts` | Đọc users từ DB |

#### 2.1.3. Chuẩn bị & khởi chạy

##### 2.1.3.1. Điều kiện cần trước

- **Node.js** LTS, **npm**, **NestJS CLI**, **Docker Desktop**.
- **Windows:** các lệnh API dùng **`Invoke-RestMethod`** (PowerShell). Xem song song **`curl`** cho macOS / Linux.

##### 2.1.3.2. Khởi động

```bash
# Bước 1: Khởi động PostgreSQL
docker compose -f .docker/compose.yaml up -d

# Bước 2: Cài dependency
npm install

# Bước 3: Khởi chạy ở chế độ watch
nest start --watch
```

#### 2.1.4. Kiểm thử

##### 2.1.4.1. Luồng 1 — Quan sát heartbeat (Interval)

  Sau khi app khởi động, terminal log hiển thị mỗi **10 giây**:

  ```
  [BackupService] [Heartbeat] Hệ thống scheduling vẫn đang hoạt động tốt...
  ```

##### 2.1.4.2. Luồng 2 — Quan sát backup (Cron)

  Terminal log hiển thị mỗi **30 giây**:

  ```
  [BackupService] Bắt đầu tiến trình sao lưu dữ liệu...
  [BackupService] Đã lấy thành công N users từ PostgreSQL.
  [BackupService] Sao lưu hoàn tất. Đã ghi vào file backup.js.
  ```

  Kiểm tra file `backup.js` trong root project:

  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri http://localhost:3000/users -Method Get

  # macOS / Linux
  curl -s http://localhost:3000/users
  ```

*Kết luận:*

- *@Interval(10000) — heartbeat mỗi 10 giây, dùng cho health check.*
- *@Cron('*/30 * * * * *') — backup mỗi 30 giây, đọc DB và ghi file.*

#### 2.1.5. Dọn tài nguyên

Sau khi kết thúc bài, bạn có thể dọn tài nguyên để tiết kiệm bộ nhớ.

```bash
# Bước 1: Dừng server đang chạy
# Windows / macOS / Linux
Ctrl + C

# Bước 2: Đóng Docker (nếu bài học có dùng Docker)
docker compose -f .docker/compose.yaml down -v
```

#### 2.1.6. Đọc thêm

- **@nestjs/schedule:** Task scheduling module. ([NestJS Docs](https://docs.nestjs.com/techniques/task-scheduling))
- **Cron Expression:** Syntax reference. ([crontab.guru](https://crontab.guru/))

### 2.2. Lý thuyết — Cron và @nestjs/schedule

#### 2.2.1. Cron Expression

| Field | Values | Ví dụ |
| --- | --- | --- |
| Second | 0–59 | `*/30` = mỗi 30 giây |
| Minute | 0–59 | `0` = phút 0 |
| Hour | 0–23 | `*/2` = mỗi 2 giờ |
| Day of month | 1–31 | `1` = ngày 1 |
| Month | 1–12 | `*` = mọi tháng |
| Day of week | 0–6 | `1-5` = thứ 2–6 |

#### 2.2.2. Các trường hợp biên (edge cases) cần lưu ý

- **Job chồng chéo:** Cron trigger lần mới trong khi lần cũ chưa xong. **Giải pháp:** dùng lock (Redis/file) hoặc skip nếu đang chạy.
- **App restart:** Mất lịch sử job đã chạy. **Giải pháp:** lưu last run timestamp vào DB/Redis.
- **Time zone:** Server ở UTC nhưng business ở GMT+7. **Giải pháp:** set timezone trong `@Cron` decorator.
- **Long-running task:** Backup lâu → block event loop. **Giải pháp:** offload sang queue (BullMQ).

## 3. Tổng kết

### 3.1. Các câu hỏi dễ bị phỏng vấn

- **Câu hỏi 1:** @Cron khác @Interval thế nào?
  - Trả lời mẫu: @Cron chạy theo lịch cố định (expression); @Interval chạy lặp với khoảng cách cố định (ms).

- **Câu hỏi 2:** Cron job chạy song song nếu job trước chưa xong — xử lý thế nào?
  - Trả lời mẫu: Dùng distributed lock (Redis) hoặc check flag isRunning trước khi bắt đầu.

- **Câu hỏi 3:** Vì sao không dùng setInterval thay @nestjs/schedule?
  - Trả lời mẫu: @nestjs/schedule tích hợp DI container — inject services, testable, lifecycle managed.

# references
## 0
### alias
NestJS Task Scheduling
### url
https://docs.nestjs.com/techniques/task-scheduling
## 1
### alias
Crontab Guru
### url
https://crontab.guru/

# minutesRead
16
