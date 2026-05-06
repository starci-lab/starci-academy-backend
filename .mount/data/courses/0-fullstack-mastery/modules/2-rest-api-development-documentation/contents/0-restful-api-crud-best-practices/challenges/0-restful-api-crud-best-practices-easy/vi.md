# title
Xây dựng REST API quản lý Task

# description
Xây dựng REST API quản lý công việc (Task) theo đúng chuẩn RESTful, sử dụng đúng HTTP methods và trả về HTTP status codes chính xác.

# requirements
## 0
### purpose
Xây dựng `TasksController` và `TasksService` quản lý danh sách task in-memory theo chuẩn RESTful.
### technicalConstraints
- Endpoint bắt buộc: `POST /tasks` (201), `GET /tasks` (200), `GET /tasks/:id` (200 hoặc 404), `PATCH /tasks/:id` (200 hoặc 404), `DELETE /tasks/:id` (204 hoặc 404).
- URL phải dùng danh từ số nhiều (`/tasks`), không chứa động từ.
- Giữ nguyên ý định challenge CRUD và status-code semantics.
### proTipsHints
- Dùng `NotFoundException` cho trường hợp không tìm thấy resource.
- Tách rõ controller (routing/status code) và service (business logic/in-memory data).

# prerequisites
## 0
### title
Node.js
### text
Node.js >= 18
## 1
### title
NestJS CLI
### text
Đã cài NestJS CLI để khởi tạo project.
## 2
### title
Dependencies cơ bản
### text
Chạy `npm install` trước khi bắt đầu.

# steps

## 0
### title
Khởi tạo project NestJS
### body
- **Các bước thực hiện**
  - Bước 1: Tạo project mới bằng CLI:
    ```bash
    nest new restful-api-crud-best-practices-easy
    ```
  - Bước 2: Di chuyển vào thư mục project và chạy thử:
    ```bash
    cd restful-api-crud-best-practices-easy
    nest start --watch
    ```
- **Yêu cầu tối thiểu cần đạt**
  - Ứng dụng khởi động thành công trên cổng 3000 và không có lỗi bootstrapping.
- **Nice to have**
  - Bật watch mode ổn định và xác nhận log startup rõ ràng.

## 1
### title
Tạo TasksModule, TasksService và TasksController
### body
- **Các bước thực hiện**
  - Bước 1: Tạo `TasksModule`, `TasksService`, `TasksController` bằng CLI hoặc thủ công.
  - Bước 2: Trong `TasksService`, khai báo một mảng in-memory lưu danh sách task với `id`, `title`, `description`, `status` (mặc định `"open"`).
  - Bước 3: Đăng ký `TasksService` trong `providers` và `TasksController` trong `controllers` của `TasksModule`.
  - Bước 4: Import `TasksModule` vào `AppModule`.
- **Yêu cầu tối thiểu cần đạt**
  - Module được NestJS nhận diện và ứng dụng chạy không lỗi.
- **Nice to have**
  - Chuẩn hóa kiểu dữ liệu task và tách interface/type rõ ràng.

## 2
### title
Implement đầy đủ các endpoint CRUD
### body
- **Các bước thực hiện**
  - Bước 1: Trong `TasksService`, implement `create`, `findAll`, `findOne`, `update`, `remove`; ném `NotFoundException` khi không tồn tại.
  - Bước 2: Trong `TasksController`, tạo các endpoint với HTTP method và status code chính xác:
    - `@Post()` cho `POST /tasks`.
    - `@Get()` cho `GET /tasks`.
    - `@Get(':id')` cho `GET /tasks/:id`.
    - `@Patch(':id')` cho `PATCH /tasks/:id`.
    - `@Delete(':id')` cho `DELETE /tasks/:id` với 204 khi xóa thành công.
  - Bước 3: Đảm bảo URL dùng dạng số nhiều (`/tasks`), không dùng verb trong path.
- **Yêu cầu tối thiểu cần đạt**
  - Tất cả 5 endpoint hoạt động đúng method và status code theo yêu cầu.
- **Nice to have**
  - Xử lý dữ liệu trả về nhất quán và có message dễ đọc cho client.

## 3
### title
Kiểm thử các endpoint
### body
- **Các bước thực hiện**
  - Bước 1: Chạy ứng dụng:
    ```bash
    nest start --watch
    ```
  - Bước 2: Tạo một task mới:
    ```bash
    curl -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d "{\"title\":\"Learn REST\",\"description\":\"Study RESTful conventions\"}"
    ```
  - Bước 3: Lấy danh sách task:
    ```bash
    curl http://localhost:3000/tasks
    ```
  - Bước 4: Lấy task theo id:
    ```bash
    curl http://localhost:3000/tasks/1
    ```
  - Bước 5: Cập nhật task:
    ```bash
    curl -X PATCH http://localhost:3000/tasks/1 -H "Content-Type: application/json" -d "{\"status\":\"done\"}"
    ```
  - Bước 6: Xóa task:
    ```bash
    curl -X DELETE http://localhost:3000/tasks/1
    ```
- **Yêu cầu tối thiểu cần đạt**
  - `POST /tasks` trả 201 và body chứa task vừa tạo.
  - `GET /tasks` trả 200 và danh sách task.
  - `GET /tasks/:id` trả 200 khi tồn tại, 404 khi không tồn tại.
  - `PATCH /tasks/:id` trả 200 khi cập nhật thành công, 404 khi không tồn tại.
  - `DELETE /tasks/:id` trả 204 khi xóa thành công, 404 khi không tồn tại.
- **Nice to have**
  - Kiểm thử thêm nhiều id và body khác nhau để xác nhận tính ổn định endpoint.

# references
## 0
### alias
NestJS Controllers
### url
https://docs.nestjs.com/controllers
## 1
### alias
NestJS Providers
### url
https://docs.nestjs.com/providers
## 2
### alias
HTTP Status Codes - MDN
### url
https://developer.mozilla.org/en-US/docs/Web/HTTP/Status

# submissions
## 0
### type
githubUrl
### title
Link GitHub Repository
### description
Nộp link GitHub repository chứa source code challenge của bạn.
### score
20
### prompts
#### 0
##### title
Đúng chuẩn REST naming và HTTP methods
##### score
10
##### promptText
Rubric chấm điểm (tối đa 10):
- 4 điểm: URL dùng danh từ số nhiều (`/tasks`), không chứa động từ.
- 4 điểm: Dùng đúng HTTP methods cho CRUD (`POST`, `GET`, `PATCH`, `DELETE`).
- 2 điểm: Controller áp dụng đúng decorators tương ứng.

Chấm 0 điểm nếu sai naming hoặc sai mapping method-endpoint cốt lõi.
#### 1
##### title
Đúng HTTP status codes
##### score
10
##### promptText
Rubric chấm điểm (tối đa 10):
- 3 điểm: `POST /tasks` trả 201 Created.
- 2 điểm: `GET /tasks` và `GET /tasks/:id` trả 200 OK đúng ngữ cảnh.
- 2 điểm: `PATCH /tasks/:id` trả 200 OK khi cập nhật thành công.
- 2 điểm: `DELETE /tasks/:id` trả 204 No Content khi xóa thành công.
- 1 điểm: Trường hợp không tìm thấy resource trả 404 qua `NotFoundException`.

Chấm theo tổng điểm tiêu chí đạt được; thiếu từng trạng thái trừ điểm tương ứng.

# difficulty
easy

# score
20
