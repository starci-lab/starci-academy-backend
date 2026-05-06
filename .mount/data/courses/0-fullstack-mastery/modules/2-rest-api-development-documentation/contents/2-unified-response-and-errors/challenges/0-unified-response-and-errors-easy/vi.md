# title
Đồng bộ Response và Xử lý lỗi toàn cục

# description
Xây dựng TransformInterceptor và AllExceptionsFilter để chuẩn hóa mọi response thành cấu trúc JSON thống nhất cho cả trường hợp thành công và thất bại.

# requirements
## 0
### purpose
Chuẩn hóa response thành công và lỗi bằng interceptor/filter toàn cục trong NestJS.
### technicalConstraints
- `TransformInterceptor` bọc response thành `{ statusCode, message, data, timestamp }`.
- `AllExceptionsFilter` trả lỗi dạng `{ statusCode, error, message, timestamp }` và không lộ stack trace.
- Cả hai phải được đăng ký toàn cục trong `main.ts`.
- `GET /tasks` trả response bọc chuẩn; lỗi bất kỳ đều bị filter bắt và trả JSON an toàn.
### proTipsHints
- Lấy `statusCode` từ HTTP response context cho response thành công.
- Với lỗi non-HTTP, map về 500 và message an toàn.

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
Đã cài NestJS CLI để tạo project.
## 2
### title
Dependencies cơ bản
### text
Chạy `npm install` trước khi code.

# steps

## 0
### title
Khởi tạo project và tạo TasksModule cơ bản
### body
- **Các bước thực hiện**
  - Bước 1: Tạo project mới:
    ```bash
    nest new unified-response-and-errors-easy
    ```
  - Bước 2: Di chuyển vào thư mục project:
    ```bash
    cd unified-response-and-errors-easy
    ```
  - Bước 3: Tạo `TasksModule`, `TasksService`, `TasksController` với endpoint `GET /tasks` trả mảng task mẫu và `GET /tasks/:id` ném `NotFoundException` khi không tìm thấy.
  - Bước 4: Chạy thử ứng dụng:
    ```bash
    nest start --watch
    ```
- **Yêu cầu tối thiểu cần đạt**
  - `GET /tasks` trả dữ liệu thành công và `GET /tasks/999` trả 404 mặc định.
- **Nice to have**
  - Chuẩn bị sẵn endpoint mô phỏng lỗi để test filter ở bước sau.

## 1
### title
Xây dựng TransformInterceptor
### body
- **Các bước thực hiện**
  - Bước 1: Tạo file `transform.interceptor.ts` trong thư mục `common/interceptors/`.
  - Bước 2: Implement class `TransformInterceptor` implement `NestInterceptor`. Trong hàm `intercept()`, sử dụng `pipe(map(data => ...))` để bọc response thành cấu trúc:
    ```typescript
    {
      statusCode: context.switchToHttp().getResponse().statusCode,
      message: 'Success',
      data: data,
      timestamp: new Date().toISOString(),
    }
    ```
  - Bước 3: Đăng ký toàn cục trong `main.ts`:
    ```typescript
    app.useGlobalInterceptors(new TransformInterceptor());
    ```
- **Yêu cầu tối thiểu cần đạt**
  - Mọi response thành công đều có đủ `statusCode`, `message`, `data`, `timestamp`.
- **Nice to have**
  - Chuẩn hóa message theo convention thống nhất toàn dự án.

## 2
### title
Xây dựng AllExceptionsFilter
### body
- **Các bước thực hiện**
  - Bước 1: Tạo file `all-exceptions.filter.ts` trong thư mục `common/filters/`.
  - Bước 2: Implement class `AllExceptionsFilter` implement `ExceptionFilter` với decorator `@Catch()` (không truyền tham số để bắt mọi loại exception).
  - Bước 3: Trong hàm `catch(exception, host)`:
    - Nếu `exception` là `HttpException`, lấy `statusCode` và `message` từ exception.
    - Nếu không phải `HttpException`, trả `statusCode: 500` và `message: 'Internal Server Error'`.
    - Trả response JSON dạng:
      ```typescript
      {
        statusCode: status,
        error: HttpStatus[status] || 'Internal Server Error',
        message: message,
        timestamp: new Date().toISOString(),
      }
      ```
    - Không bao giờ trả `stack trace` ra ngoài.
  - Bước 4: Đăng ký toàn cục trong `main.ts`:
    ```typescript
    app.useGlobalFilters(new AllExceptionsFilter());
    ```
- **Yêu cầu tối thiểu cần đạt**
  - Mọi exception trả JSON theo cấu trúc chuẩn và không lộ stack trace.
- **Nice to have**
  - Tách utility xử lý message lỗi để dễ tái sử dụng.

## 3
### title
Kiểm thử response thống nhất
### body
- **Các bước thực hiện**
  - Bước 1: Chạy ứng dụng:
    ```bash
    nest start --watch
    ```
  - Bước 2: Gọi endpoint thành công:
    ```bash
    curl http://localhost:3000/tasks
    ```
    Xác nhận response có dạng:
    ```json
    {
      "statusCode": 200,
      "message": "Success",
      "data": [...],
      "timestamp": "2025-..."
    }
    ```
  - Bước 3: Gọi endpoint với id không tồn tại (NotFoundException):
    ```bash
    curl http://localhost:3000/tasks/999
    ```
    Xác nhận response có dạng:
    ```json
    {
      "statusCode": 404,
      "error": "Not Found",
      "message": "...",
      "timestamp": "2025-..."
    }
    ```
  - Bước 4: Tạo một endpoint tạm `GET /tasks/crash` trong controller để throw `new Error('Unexpected')` (error không phải HttpException). Gọi endpoint này:
    ```bash
    curl http://localhost:3000/tasks/crash
    ```
    Xác nhận response trả 500 với JSON an toàn, không chứa stack trace.
- **Yêu cầu tối thiểu cần đạt**
  - `GET /tasks` -> `{ statusCode: 200, message: "Success", data: [...], timestamp }`.
  - `GET /tasks/999` -> `{ statusCode: 404, error: "Not Found", message, timestamp }`.
  - `GET /tasks/crash` -> `{ statusCode: 500, error: "Internal Server Error", message, timestamp }` không lộ stack trace.
- **Nice to have**
  - Kiểm thử thêm nhiều lỗi runtime để xác nhận filter luôn trả format nhất quán.

# references
## 0
### alias
NestJS Interceptors
### url
https://docs.nestjs.com/interceptors
## 1
### alias
NestJS Exception Filters
### url
https://docs.nestjs.com/exception-filters
## 2
### alias
NestJS First Steps
### url
https://docs.nestjs.com/first-steps

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
Interceptor bọc response đúng format
##### score
10
##### promptText
Rubric chấm điểm (tối đa 10):
- 4 điểm: `TransformInterceptor` được đăng ký toàn cục.
- 4 điểm: Response thành công có đủ `statusCode`, `message`, `data`, `timestamp`.
- 2 điểm: `GET /tasks` trả data đã bọc, không trả dữ liệu thô.

Chấm cộng dồn theo tiêu chí đạt được; thiếu field bắt buộc trừ điểm tiêu chí tương ứng.
#### 1
##### title
Filter bắt mọi exception an toàn
##### score
10
##### promptText
Rubric chấm điểm (tối đa 10):
- 4 điểm: `AllExceptionsFilter` được đăng ký toàn cục và bắt được cả HTTP/non-HTTP exception.
- 4 điểm: Response lỗi đúng cấu trúc `{ statusCode, error, message, timestamp }`.
- 2 điểm: Không lộ stack trace trong mọi trường hợp.

Chấm theo tổng điểm tiêu chí đạt được; phát hiện rò rỉ stack trace thì không đạt tiêu chí bảo mật.

# difficulty
easy

# score
20
