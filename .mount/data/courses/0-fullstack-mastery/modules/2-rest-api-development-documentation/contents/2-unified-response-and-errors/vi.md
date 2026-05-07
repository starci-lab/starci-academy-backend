# title
Response thống nhất và Error Handling

# description
Thực hành xây dựng response envelope thống nhất và global exception filter trong NestJS để client luôn nhận JSON có cấu trúc ổn định.

# body

## 1. Lời mở đầu

"Một endpoint trả `{ message }`, endpoint khác trả `{ error, details }` — frontend phải viết bao nhiêu kiểu parse?" — một **Senior Engineer** hỏi khi review API contract. Một **Mid-level Developer** trả lời: "Em sẽ thống nhất dần khi refactor." Câu trả lời cho thấy nhận thức về consistency, nhưng vẫn thiếu chiều sâu về **API contract**: nếu không chuẩn hóa response shape từ đầu, mỗi endpoint sẽ tạo contract riêng — frontend phải viết logic parse khác nhau cho từng route, và error shape không đồng nhất khiến monitoring/logging mất ý nghĩa.

Bài này dẫn qua hai mạch liên tiếp:
- **Phần 2.1**: **thực hành** đồng bộ với repository; **stack** gồm **NestJS** thuần (không Docker), kèm **hai luồng** kiểm thử (success envelope; error envelope).
- **Phần 2.2**: **lý thuyết** làm rõ bản chất **Interceptor**, **ExceptionFilter**, **response envelope**, và các **edge case** như **stack trace leak**, **status code override**.

## 2. Các khái niệm cốt lõi

Cấu trúc bài học áp dụng phương pháp **Thực hành dẫn dắt Lý thuyết**. Khởi đầu, học viên clone source, chạy **NestJS** bằng `nest start --watch` và gọi API để quan sát response envelope. Tiếp theo, **phần lý thuyết** phân tích kiến trúc interceptor/filter và các **edge cases**.

### 2.1. Thực hành

#### 2.1.1. Chuẩn bị source code và môi trường

Source: [StarCi-Academy/fullstack-mastery-module-3-rest-api-development-documentation](https://github.com/StarCi-Academy/fullstack-mastery-module-3-rest-api-development-documentation) trên GitHub — thư mục bài học: [`2-unified-response-and-errors`](https://github.com/StarCi-Academy/fullstack-mastery-module-3-rest-api-development-documentation/tree/main/2-unified-response-and-errors).

```bash
git clone https://github.com/StarCi-Academy/fullstack-mastery-module-3-rest-api-development-documentation.git
cd fullstack-mastery-module-3-rest-api-development-documentation/2-unified-response-and-errors
```

#### 2.1.2. Kiến trúc/thành phần (stack + luồng)

| Thành phần | File | Vai trò |
| --- | --- | --- |
| **TransformInterceptor** | `src/common/interceptors/transform.interceptor.ts` | Wrap success → `{ statusCode, message, data, timestamp }` |
| **AllExceptionsFilter** | `src/common/filters/all-exceptions.filter.ts` | Wrap error → `{ statusCode, error, message, timestamp, path }` |
| **@ResponseMessage** | `src/common/decorators/response-message.decorator.ts` | Custom message per route |
| **UserController** | `src/modules/user/user.controller.ts` | REST + error demo endpoint |

#### 2.1.3. Chuẩn bị & khởi chạy

##### 2.1.3.1. Điều kiện cần trước

- **Node.js** LTS, **npm**, **NestJS CLI**.
- **Windows:** các lệnh API dùng **`Invoke-RestMethod`** (PowerShell). Xem song song **`curl`** cho macOS / Linux.

> **Lưu ý:** Repo đã ship env defaults qua **ConfigModule**; khi chạy hệ thống không cần tạo hay sửa **.env**. Chỉ chỉnh sửa file này khi bạn muốn chạy service với các port/credential khác mặc định.

##### 2.1.3.2. Khởi động

```bash
# Bước 1: Cài dependency
npm install

# Bước 2: Khởi chạy ở chế độ watch
nest start --watch
```

Bài này không sử dụng Docker, không cần dọn tài nguyên.

#### 2.1.4. Kiểm thử

##### 2.1.4.1. Luồng 1 — Success envelope

  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri http://localhost:3000/users

  # macOS / Linux
  curl -s http://localhost:3000/users
  ```

  Response (HTTP 200):

  ```json
  {
    "statusCode": 200,
    "message": "Success",
    "data": [],
    "timestamp": "<ISO datetime>"
  }
  ```

##### 2.1.4.2. Luồng 2 — Error envelope

  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri http://localhost:3000/users/nonexistent

  # macOS / Linux
  curl -s http://localhost:3000/users/nonexistent
  ```

  Response (HTTP 404):

  ```json
  {
    "statusCode": 404,
    "error": "NotFoundException",
    "message": "User with ID nonexistent not found",
    "timestamp": "<ISO datetime>",
    "path": "/users/nonexistent"
  }
  ```

*Kết luận:*

- *TransformInterceptor — wrap mọi success response vào envelope thống nhất.*
- *AllExceptionsFilter — catch mọi exception, trả JSON lỗi không lộ stack trace.*

#### 2.1.5. Dọn tài nguyên

Bài này không sử dụng Docker, không cần dọn tài nguyên.

#### 2.1.6. Đọc thêm

- **NestJS Interceptors:** Bind extra logic before/after route handler. ([NestJS Docs](https://docs.nestjs.com/interceptors))
- **NestJS Exception Filters:** Catch and transform exceptions. ([NestJS Docs](https://docs.nestjs.com/exception-filters))

### 2.2. Lý thuyết — Interceptor, ExceptionFilter, Response Envelope

#### 2.2.1. Success Envelope vs Error Envelope

| Success | Error |
| --- | --- |
| `{ statusCode, message, data, timestamp }` | `{ statusCode, error, message, timestamp, path }` |
| Interceptor wrap | ExceptionFilter catch |
| HTTP 2xx | HTTP 4xx / 5xx |

#### 2.2.2. TransformInterceptor hoạt động thế nào?

1. Request đi qua pipe → controller → service.
2. Service trả data.
3. **TransformInterceptor** wrap data vào envelope `{ statusCode, message, data, timestamp }`.
4. `@ResponseMessage()` decorator cho phép custom message per route.

#### 2.2.3. Các trường hợp biên (edge cases) cần lưu ý

- **Error shape không thống nhất:** Route trả shape khác nhau → frontend parse khó. **Giải pháp:** dùng global exception filter chuẩn hóa.
- **Status code bị override:** Interceptor wrap 200 cho cả error. **Giải pháp:** interceptor chỉ wrap success, filter handle error.
- **Stack trace leak production:** Error chứa stack trace → lộ code. **Giải pháp:** chỉ trả stack trace ở development.
- **Pagination metadata thiếu:** List không có `total`, `page` → client không biết có thêm data. **Giải pháp:** wrap với pagination metadata.

## 3. Tổng kết

### 3.1. Các câu hỏi dễ bị phỏng vấn

- **Câu hỏi 1:** Interceptor và ExceptionFilter khác nhau thế nào?
  - Trả lời mẫu: Interceptor wrap success response; ExceptionFilter catch exceptions và chuẩn hóa error response.

- **Câu hỏi 2:** Vì sao cần response envelope thống nhất?
  - Trả lời mẫu: Client chỉ cần 1 logic parse cho mọi endpoint; monitoring/logging dễ aggregate.

- **Câu hỏi 3:** Có nên trả stack trace cho client production?
  - Trả lời mẫu: Không. Stack trace lộ internal code; chỉ trả message chung, log chi tiết server-side.

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

# minutesRead
15
