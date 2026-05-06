# title
Bảo vệ API bằng DTO và ValidationPipe

# description
Triển khai lớp bảo vệ dữ liệu đầu vào cho REST API bằng DTO kết hợp ValidationPipe, ngăn chặn dữ liệu rác và dữ liệu thiếu trường bắt buộc.

# requirements
## 0
### purpose
Áp dụng DTO và `ValidationPipe` để bảo vệ dữ liệu đầu vào cho endpoint `POST /tasks`.
### technicalConstraints
- Tạo `CreateTaskDto` gồm: `title` (`@IsString`, `@MinLength(3)`), `description` (`@IsString`, `@IsOptional`), `priority` (`@IsEnum(['low','medium','high'])`).
- Kích hoạt `ValidationPipe` toàn cục với `whitelist: true` và `forbidNonWhitelisted: true`.
- `POST /tasks` thiếu `title` phải trả 400; body có field lạ như `role` phải bị reject.
### proTipsHints
- Typing `@Body()` bằng `CreateTaskDto` để validation chạy đúng.
- Viết test cho cả thiếu field, sai enum và field lạ.

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
Đã cài NestJS CLI để tạo project và module.
## 2
### title
Dependencies dự án
### text
Chạy `npm install` trước khi triển khai.
## 3
### title
Thư viện validation
### text
Cài `class-validator` và `class-transformer`.

# steps

## 0
### title
Khởi tạo project và cài đặt thư viện
### body
- **Các bước thực hiện**
  - Bước 1: Tạo project mới:
    ```bash
    nest new dtos-and-validation-easy
    ```
  - Bước 2: Di chuyển vào thư mục project và cài đặt các thư viện cần thiết:
    ```bash
    cd dtos-and-validation-easy
    npm install class-validator class-transformer
    ```
  - Bước 3: Chạy thử ứng dụng:
    ```bash
    nest start --watch
    ```
- **Yêu cầu tối thiểu cần đạt**
  - Ứng dụng chạy được và đã cài đầy đủ `class-validator`, `class-transformer`.
- **Nice to have**
  - Bật watch mode để quan sát lỗi validation nhanh khi chỉnh sửa.

## 1
### title
Tạo TasksModule và endpoint POST /tasks cơ bản
### body
- **Các bước thực hiện**
  - Bước 1: Tạo `TasksModule`, `TasksService`, `TasksController` bằng CLI hoặc thủ công.
  - Bước 2: Trong `TasksService`, khai báo mảng in-memory và implement hàm `create(data)` thêm task mới vào mảng.
  - Bước 3: Trong `TasksController`, tạo endpoint `@Post()` nhận body và gọi `TasksService.create()`.
  - Bước 4: Import `TasksModule` vào `AppModule`.
- **Yêu cầu tối thiểu cần đạt**
  - `POST /tasks` nhận body hợp lệ và trả 201 khi tạo thành công.
- **Nice to have**
  - Chuẩn hóa kiểu dữ liệu task cho service/controller.

## 2
### title
Tạo CreateTaskDto với class-validator decorators
### body
- **Các bước thực hiện**
  - Bước 1: Tạo file `create-task.dto.ts` trong thư mục `tasks/dto/`.
  - Bước 2: Khai báo class `CreateTaskDto` với các trường và decorator:
    - `title`: gắn `@IsString()` và `@MinLength(3)`.
    - `description`: gắn `@IsString()` và `@IsOptional()`.
    - `priority`: gắn `@IsEnum(['low', 'medium', 'high'])`.
  - Bước 3: Trong `TasksController`, thay kiểu tham số body từ `any` thành `CreateTaskDto`:
    ```typescript
    @Post()
    create(@Body() createTaskDto: CreateTaskDto) { ... }
    ```
  - Bước 4: Kích hoạt `ValidationPipe` toàn cục trong `main.ts`:
    ```typescript
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }));
    ```
- **Yêu cầu tối thiểu cần đạt**
  - Body thiếu `title` hoặc `title` ngắn hơn 3 ký tự trả 400 với lỗi rõ ràng.
- **Nice to have**
  - Thông điệp lỗi thân thiện, nhất quán giữa các rule validation.

## 3
### title
Kiểm thử validation và whitelist
### body
- **Các bước thực hiện**
  - Bước 1: Chạy ứng dụng:
    ```bash
    nest start --watch
    ```
  - Bước 2: Gửi request hợp lệ:
    ```bash
    curl -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d "{\"title\":\"Fix bug\",\"priority\":\"high\"}"
    ```
    Xác nhận trả về 201 với task vừa tạo.
  - Bước 3: Gửi request thiếu trường `title`:
    ```bash
    curl -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d "{\"priority\":\"low\"}"
    ```
    Xác nhận trả về 400 Bad Request với message chỉ rõ `title` là bắt buộc.
  - Bước 4: Gửi request với `title` quá ngắn:
    ```bash
    curl -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d "{\"title\":\"AB\",\"priority\":\"low\"}"
    ```
    Xác nhận trả về 400 với message chỉ rõ `title` phải có ít nhất 3 ký tự.
  - Bước 5: Gửi request với field lạ `role`:
    ```bash
    curl -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d "{\"title\":\"Fix bug\",\"priority\":\"high\",\"role\":\"admin\"}"
    ```
    Xác nhận trả về 400 với message chỉ rõ `role` không được phép (`forbidNonWhitelisted`).
  - Bước 6: Gửi request với `priority` không nằm trong enum:
    ```bash
    curl -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d "{\"title\":\"Fix bug\",\"priority\":\"urgent\"}"
    ```
    Xác nhận trả về 400 với message chỉ rõ `priority` phải là giá trị enum hợp lệ.
- **Yêu cầu tối thiểu cần đạt**
  - Body hợp lệ -> 201 Created.
  - Thiếu `title` -> 400 Bad Request.
  - `title` < 3 ký tự -> 400 Bad Request.
  - Field lạ `role` -> 400 Bad Request (forbidNonWhitelisted).
  - `priority` sai enum -> 400 Bad Request.
- **Nice to have**
  - Kiểm thử thêm nhiều payload để đảm bảo không lọt dữ liệu rác.

# references
## 0
### alias
NestJS Validation
### url
https://docs.nestjs.com/techniques/validation
## 1
### alias
class-validator GitHub
### url
https://github.com/typestack/class-validator
## 2
### alias
NestJS Pipes
### url
https://docs.nestjs.com/pipes

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
DTO decorators chính xác
##### score
10
##### promptText
Rubric chấm điểm (tối đa 10):
- 4 điểm: `CreateTaskDto` có đủ `title`, `description`, `priority`.
- 3 điểm: Decorator validation gắn đúng theo yêu cầu từng field.
- 3 điểm: Controller dùng đúng kiểu `CreateTaskDto` cho `@Body()`.

Chấm theo mức độ hoàn thành từng tiêu chí; thiếu field bắt buộc thì không đạt điểm tiêu chí tương ứng.
#### 1
##### title
ValidationPipe cấu hình đúng
##### score
10
##### promptText
Rubric chấm điểm (tối đa 10):
- 4 điểm: `ValidationPipe` được đăng ký toàn cục trong `main.ts`.
- 3 điểm: Cấu hình có `whitelist: true` và `forbidNonWhitelisted: true`.
- 3 điểm: Test cho body thiếu trường bắt buộc và body có field lạ đều trả 400 hợp lệ.

Chấm cộng dồn theo tiêu chí đạt được; không có reject field lạ thì trừ toàn bộ điểm tiêu chí đó.

# difficulty
easy

# score
20
