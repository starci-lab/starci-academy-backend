# title
Swagger và API Documentation

# description
Thực hành tích hợp Swagger (OpenAPI) vào NestJS để tự động sinh API documentation, giúp frontend và QA team consume API mà không cần đọc source code.

# body

## 1. Lời mở đầu

"API có 20 endpoint nhưng không có docs — làm sao frontend team biết request/response shape?" — một **Senior Engineer** hỏi khi onboard member mới. Một **Mid-level Developer** trả lời: "Em sẽ viết docs trong Notion." Câu trả lời cho thấy nhận thức về documentation, nhưng vẫn thiếu chiều sâu về **single source of truth**: docs viết tay nhanh chóng lỗi thời khi code thay đổi — **Swagger/OpenAPI** sinh docs trực tiếp từ code decorators, đảm bảo docs luôn khớp implementation.

Bài này dẫn qua hai mạch liên tiếp:
- **Phần 2.1**: **thực hành** đồng bộ với repository; **stack** gồm **NestJS** thuần (không Docker), kèm **hai luồng** kiểm thử (Swagger UI; API call từ Swagger).
- **Phần 2.2**: **lý thuyết** làm rõ bản chất **OpenAPI spec**, **@ApiProperty**, **@ApiOperation**, và các **edge case** như **DTO thiếu decorator**, **auth header**, **production exposure**.

## 2. Các khái niệm cốt lõi

Cấu trúc bài học áp dụng phương pháp **Thực hành dẫn dắt Lý thuyết**. Khởi đầu, học viên clone source, chạy **NestJS** bằng `nest start --watch` và mở Swagger UI. Tiếp theo, **phần lý thuyết** phân tích kiến trúc OpenAPI và các **edge cases**.

### 2.1. Thực hành

#### 2.1.1. Chuẩn bị source code và môi trường

Source: [StarCi-Academy/fullstack-mastery-module-3-rest-api-development-documentation](https://github.com/StarCi-Academy/fullstack-mastery-module-3-rest-api-development-documentation) trên GitHub — thư mục bài học: [`3-swagger-api-documentation`](https://github.com/StarCi-Academy/fullstack-mastery-module-3-rest-api-development-documentation/tree/main/3-swagger-api-documentation).

```bash
git clone https://github.com/StarCi-Academy/fullstack-mastery-module-3-rest-api-development-documentation.git
cd fullstack-mastery-module-3-rest-api-development-documentation/3-swagger-api-documentation
```

#### 2.1.2. Kiến trúc/thành phần (stack + luồng)

| Thành phần | File | Vai trò |
| --- | --- | --- |
| **SwaggerModule** | `bootstrap.ts` | Setup OpenAPI document + Swagger UI |
| **CreateCatDto** | `src/modules/cat/dto/create-cat.dto.ts` | DTO với `@ApiProperty` |
| **CatController** | `src/modules/cat/cat.controller.ts` | `@ApiTags`, `@ApiOperation`, `@ApiResponse` |
| **TransformInterceptor** | `src/common/interceptors/transform.interceptor.ts` | Unified response envelope |
| **AllExceptionsFilter** | `src/common/filters/all-exceptions.filter.ts` | Unified error envelope |

#### 2.1.3. Chuẩn bị & khởi chạy

##### 2.1.3.1. Điều kiện cần trước

- **Node.js** LTS, **npm**, **NestJS CLI**.
- **Windows:** các lệnh API dùng **`Invoke-RestMethod`** (PowerShell). Xem song song **`curl`** cho macOS / Linux.

##### 2.1.3.2. Khởi động

```bash
# Bước 1: Cài dependency
npm install

# Bước 2: Khởi chạy ở chế độ watch
nest start --watch
```

Bài này không sử dụng Docker, không cần dọn tài nguyên.

#### 2.1.4. Kiểm thử

##### 2.1.4.1. Luồng 1 — Mở Swagger UI

Mở trình duyệt tại **`http://localhost:3000/api`**. Swagger UI hiển thị tất cả endpoint với request/response schema.

##### 2.1.4.2. Luồng 2 — Gọi API từ Swagger

- Bước 1: mở `POST /cats` trên Swagger UI → click "Try it out".
- Bước 2: điền body:

  ```json
  { "breed": "Persian", "age": 2 }
  ```

- Bước 3: click "Execute".

  Hoặc dùng terminal:

  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri http://localhost:3000/cats -Method Post -ContentType "application/json" -Body '{"breed":"Persian","age":2}'

  # macOS / Linux
  curl -s -X POST http://localhost:3000/cats -H "Content-Type: application/json" -d '{"breed":"Persian","age":2}'
  ```

  Response (HTTP 201): cat vừa tạo, wrapped trong unified envelope.

- Bước 4: gọi `GET /cats/error-demo`.

  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri http://localhost:3000/cats/error-demo

  # macOS / Linux
  curl -s http://localhost:3000/cats/error-demo
  ```

  Response (HTTP 400): error envelope thống nhất.

*Kết luận:*

- *Swagger UI tự sinh — docs luôn khớp code decorators.*
- *@ApiProperty trên DTO — Swagger hiển thị schema request/response chính xác.*

#### 2.1.5. Dọn tài nguyên

Bài này không sử dụng Docker, không cần dọn tài nguyên.

#### 2.1.6. Đọc thêm

- **NestJS OpenAPI:** Tích hợp `@nestjs/swagger` vào NestJS. ([NestJS Docs](https://docs.nestjs.com/openapi/introduction))
- **OpenAPI Specification:** Chuẩn mô tả RESTful APIs. ([OpenAPI Spec](https://spec.openapis.org/oas/latest.html))
- **Swagger UI:** Interactive API documentation. ([Swagger](https://swagger.io/tools/swagger-ui/))

### 2.2. Lý thuyết — OpenAPI, Swagger Decorators

#### 2.2.1. OpenAPI Specification

**OpenAPI** (trước đây Swagger) là chuẩn mô tả RESTful APIs bằng JSON/YAML. **NestJS** dùng `@nestjs/swagger` để sinh OpenAPI spec từ decorators runtime.

#### 2.2.2. Key Decorators

| Decorator | Dùng ở | Mục đích |
| --- | --- | --- |
| `@ApiTags('...')` | Controller | Nhóm endpoints trên Swagger UI |
| `@ApiOperation({ summary })` | Method | Mô tả endpoint |
| `@ApiResponse({ status, description })` | Method | Mô tả response |
| `@ApiProperty({ example, description })` | DTO field | Mô tả field trong schema |
| `@ApiBearerAuth()` | Controller/Method | Thêm auth header |

#### 2.2.3. Các trường hợp biên (edge cases) cần lưu ý

- **DTO không hiện Swagger:** Quên `@ApiProperty()` → schema trống. **Giải pháp:** thêm `@ApiProperty()` cho mọi DTO field.
- **Auth header thiếu:** Quên `addBearerAuth()` → không test authenticated endpoint. **Giải pháp:** cấu hình `addBearerAuth()` + `@ApiBearerAuth()`.
- **Swagger expose production:** UI accessible → lộ API surface. **Giải pháp:** chỉ enable khi `NODE_ENV !== 'production'`.
- **Response type sai:** `@ApiResponse` type không khớp actual response. **Giải pháp:** sync DTO type giữa controller và `@ApiResponse`.

## 3. Tổng kết

### 3.1. Các câu hỏi dễ bị phỏng vấn

- **Câu hỏi 1:** Swagger có thay thế được Postman không?
  - Trả lời mẫu: Swagger sinh docs tự động từ code; Postman mạnh hơn cho test complex flows. Hai tool bổ trợ nhau.

- **Câu hỏi 2:** Vì sao cần `@ApiProperty()` trên mỗi field DTO?
  - Trả lời mẫu: TypeScript types bị erase khi compile; `@ApiProperty()` cung cấp metadata runtime cho Swagger.

- **Câu hỏi 3:** Có nên expose Swagger UI ở production không?
  - Trả lời mẫu: Không. Swagger lộ toàn bộ API surface; chỉ enable ở development/staging.

# references
## 0
### alias
NestJS OpenAPI
### url
https://docs.nestjs.com/openapi/introduction
## 1
### alias
OpenAPI Specification
### url
https://spec.openapis.org/oas/latest.html

# minutesRead
15
