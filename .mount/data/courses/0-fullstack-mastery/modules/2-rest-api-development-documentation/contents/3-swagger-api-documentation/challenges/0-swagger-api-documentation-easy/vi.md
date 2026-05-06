# title
Tài liệu API tự động với Swagger

# description
Tích hợp Swagger vào dự án NestJS để tự động sinh tài liệu API song từ code, cho phép Frontend thử nghiệm trực tiếp trên giao diện web.

# requirements
## 0
### purpose
Tích hợp Swagger để tự động sinh tài liệu API và hỗ trợ thử nghiệm endpoint trực tiếp.
### technicalConstraints
- Cài `@nestjs/swagger` và cấu hình Swagger UI tại `/docs`.
- Controller có `@ApiTags()`; mỗi endpoint có `@ApiOperation()` và `@ApiResponse()`.
- Mỗi thuộc tính DTO có `@ApiProperty()` kèm `example`.
- Bật `addBearerAuth()` trong `DocumentBuilder`.
### proTipsHints
- Đặt title/description/version rõ ràng để tài liệu dễ dùng cho Frontend.
- Đảm bảo response codes trong decorator khớp hành vi endpoint thật.

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
Đã cài NestJS CLI để khởi tạo dự án.
## 2
### title
Dependencies dự án
### text
Chạy `npm install` trước khi cấu hình tài liệu API.
## 3
### title
Thư viện Swagger
### text
Cài `@nestjs/swagger`.

# steps

## 0
### title
Khởi tạo project và cài đặt Swagger
### body
- **Các bước thực hiện**
  - Bước 1: Tạo project mới:
    ```bash
    nest new swagger-api-documentation-easy
    ```
  - Bước 2: Di chuyển vào thư mục project và cài đặt thư viện Swagger:
    ```bash
    cd swagger-api-documentation-easy
    npm install @nestjs/swagger
    ```
  - Bước 3: Chạy thử ứng dụng:
    ```bash
    nest start --watch
    ```
- **Yêu cầu tối thiểu cần đạt**
  - Ứng dụng chạy được và thư viện `@nestjs/swagger` đã được cài.
- **Nice to have**
  - Chuẩn bị sẵn module task để test tài liệu ngay sau khi setup.

## 1
### title
Cấu hình Swagger trong main.ts
### body
- **Các bước thực hiện**
  - Bước 1: Trong `main.ts`, import `SwaggerModule` và `DocumentBuilder` từ `@nestjs/swagger`.
  - Bước 2: Tạo cấu hình Swagger bằng `DocumentBuilder`:
    ```typescript
    const config = new DocumentBuilder()
      .setTitle('Task Management API')
      .setDescription('API tài liệu tự động cho quản lý Task')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    ```
  - Bước 3: Tạo document và mount Swagger UI:
    ```typescript
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
    ```
  - Bước 4: Chạy ứng dụng và truy cập `http://localhost:3000/docs` trên trình duyệt.
- **Yêu cầu tối thiểu cần đạt**
  - Swagger UI truy cập được tại `/docs` và hiển thị Authorize cho Bearer token.
- **Nice to have**
  - Metadata (`title`, `description`, `version`) đầy đủ và dễ hiểu.

## 2
### title
Gắn Swagger decorators cho Controller và DTO
### body
- **Các bước thực hiện**
  - Bước 1: Tạo `TasksModule` với `TasksController` và `TasksService` (nếu chưa có). Implement ít nhất 2 endpoint: `POST /tasks` và `GET /tasks`.
  - Bước 2: Tạo `CreateTaskDto` với các trường `title` và `description`. Gắn `@ApiProperty()` với `example` cho mỗi trường:
    ```typescript
    @ApiProperty({ example: 'Fix login bug', description: 'Tiêu đề của task' })
    title: string;

    @ApiProperty({ example: 'Sửa lỗi không đăng nhập được', description: 'Mô tả chi tiết', required: false })
    description?: string;
    ```
  - Bước 3: Gắn `@ApiTags('Tasks')` lên `TasksController`.
  - Bước 4: Gắn `@ApiOperation()` và `@ApiResponse()` cho mỗi endpoint:
    ```typescript
    @Post()
    @ApiOperation({ summary: 'Tạo task mới' })
    @ApiResponse({ status: 201, description: 'Task đã được tạo thành công' })
    @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ' })
    create(@Body() dto: CreateTaskDto) { ... }
    ```
  - Bước 5: Lặp lại tương tự cho `GET /tasks` với `@ApiOperation()` và `@ApiResponse()` phù hợp.
- **Yêu cầu tối thiểu cần đạt**
  - UI hiển thị endpoint với tag, mô tả, schema request body có example và response status.
- **Nice to have**
  - Mô tả endpoint rõ business context để Frontend dùng nhanh.

## 3
### title
Kiểm thử Swagger UI và thử nghiệm trực tiếp
### body
- **Các bước thực hiện**
  - Bước 1: Chạy ứng dụng:
    ```bash
    nest start --watch
    ```
  - Bước 2: Mở trình duyệt và truy cập `http://localhost:3000/docs`.
  - Bước 3: Kiểm tra giao diện Swagger UI:
    - Xác nhận có nhóm `Tasks` hiển thị các endpoint.
    - Xác nhận mỗi endpoint có mô tả (`summary`) và các response status.
    - Xác nhận `POST /tasks` có schema request body với example từ `@ApiProperty`.
  - Bước 4: Sử dụng nút "Try it out" trên Swagger UI để gửi `POST /tasks` với body mẫu:
    ```json
    {
      "title": "Test from Swagger",
      "description": "Testing API documentation"
    }
    ```
    Xác nhận nhận được response 201 thành công.
  - Bước 5: Sử dụng "Try it out" để gửi `GET /tasks` và xác nhận trả về danh sách task.
  - Bước 6: Nhấn nút "Authorize", nhập một Bearer token bất kỳ và xác nhận nút Authorize hoạt động (dù chưa có logic xác thực).
- **Yêu cầu tối thiểu cần đạt**
  - Swagger UI tại `/docs` hiển thị đầy đủ endpoint với tag, summary, response codes.
  - Request body của `POST /tasks` có schema với example values.
  - "Try it out" gửi request thành công và nhận response.
  - Nút Authorize hiển thị và hoạt động.
- **Nice to have**
  - Tài liệu thể hiện rõ cả flow thành công và lỗi phổ biến cho từng endpoint.

# references
## 0
### alias
NestJS OpenAPI (Swagger)
### url
https://docs.nestjs.com/openapi/introduction
## 1
### alias
NestJS OpenAPI Decorators
### url
https://docs.nestjs.com/openapi/decorators
## 2
### alias
NestJS OpenAPI Types and Parameters
### url
https://docs.nestjs.com/openapi/types-and-parameters

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
Swagger cấu hình đúng và decorators đầy đủ
##### score
10
##### promptText
Rubric chấm điểm (tối đa 10):
- 3 điểm: `DocumentBuilder` có `title`, `description`, `version`, `addBearerAuth()`.
- 3 điểm: `SwaggerModule.setup()` mount đúng tại `/docs`.
- 2 điểm: Controller có `@ApiTags()`.
- 2 điểm: Mỗi endpoint có `@ApiOperation()` và `@ApiResponse()`.

Chấm cộng dồn theo tiêu chí đạt được; thiếu cấu hình lõi thì không đạt điểm tiêu chí tương ứng.
#### 1
##### title
DTO có ApiProperty đầy đủ
##### score
10
##### promptText
Rubric chấm điểm (tối đa 10):
- 5 điểm: Mỗi thuộc tính trong `CreateTaskDto` có `@ApiProperty()` với `example` cụ thể.
- 3 điểm: Swagger UI hiển thị schema request body đúng với các example values.
- 2 điểm: Không có thuộc tính DTO nào thiếu decorator Swagger.

Chấm theo tổng điểm tiêu chí đạt được; mỗi thuộc tính thiếu decorator bị trừ điểm theo mức độ ảnh hưởng.

# difficulty
easy

# score
20
