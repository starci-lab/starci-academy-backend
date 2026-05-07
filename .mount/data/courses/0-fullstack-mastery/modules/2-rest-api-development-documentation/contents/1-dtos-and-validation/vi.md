# title
DTO và Validation trong NestJS

# description
Thực hành xây dựng DTO với class-validator và class-transformer trong NestJS, đảm bảo dữ liệu đầu vào luôn hợp lệ trước khi đến service layer.

# body

## 1. Lời mở đầu

"Tại sao API vẫn nhận field lạ từ client mà không báo lỗi?" — một **Senior Engineer** hỏi khi audit security. Một **Mid-level Developer** trả lời: "Em validate ở frontend rồi." Câu trả lời cho thấy nhận thức về UX validation, nhưng vẫn thiếu chiều sâu về **server-side validation**: frontend validation dễ bị bypass bởi curl/Postman, và nếu backend không validate + whitelist, dữ liệu bẩn sẽ lọt vào database — gây lỗi logic, security risk, và data corruption.

Bài này dẫn qua hai mạch liên tiếp:
- **Phần 2.1**: **thực hành** đồng bộ với repository trên GitHub; **stack** gồm **NestJS** + **PostgreSQL** (Docker), kèm **hai luồng** kiểm thử (valid payload; invalid payload).
- **Phần 2.2**: **lý thuyết** làm rõ bản chất **DTO pattern**, **ValidationPipe**, **class-validator** / **class-transformer**, và các **edge case** như **whitelist bypass**, **nested DTO**, **PartialType**.

## 2. Các khái niệm cốt lõi

Cấu trúc bài học áp dụng phương pháp **Thực hành dẫn dắt Lý thuyết**. Khởi đầu, học viên sẽ trực tiếp clone source, khởi động **PostgreSQL** bằng **Docker Compose**, chạy **NestJS** bằng `nest start --watch` và gọi API để quan sát validation hoạt động. Tiếp theo, **phần lý thuyết** sẽ hệ thống hóa **các khái niệm cốt lõi** và phân tích các **edge cases** chuyên sâu.

### 2.1. Thực hành

#### 2.1.1. Chuẩn bị source code và môi trường

Source: [StarCi-Academy/fullstack-mastery-module-3-rest-api-development-documentation](https://github.com/StarCi-Academy/fullstack-mastery-module-3-rest-api-development-documentation) trên GitHub — thư mục bài học: [`1-dtos-and-validation`](https://github.com/StarCi-Academy/fullstack-mastery-module-3-rest-api-development-documentation/tree/main/1-dtos-and-validation).

```bash
git clone https://github.com/StarCi-Academy/fullstack-mastery-module-3-rest-api-development-documentation.git
cd fullstack-mastery-module-3-rest-api-development-documentation/1-dtos-and-validation
```

#### 2.1.2. Kiến trúc/thành phần (stack + luồng)

| Thành phần | File | Vai trò |
| --- | --- | --- |
| **PostgreSQL** | `.docker/compose.yaml` | Lưu trữ users |
| **CreateUserDto** | `src/modules/user/dto/create-user.dto.ts` | Validate payload POST |
| **UserController** | `src/modules/user/user.controller.ts` | REST endpoints |
| **UserService** | `src/modules/user/user.service.ts` | CRUD logic |
| **ValidationPipe** | `bootstrap.ts` | Global pipe validate + whitelist |

#### 2.1.3. Chuẩn bị & khởi chạy

##### 2.1.3.1. Điều kiện cần trước

- **Node.js** LTS, **npm**, **NestJS CLI**, **Docker Desktop**.
- **Windows:** các lệnh API dùng **`Invoke-RestMethod`** (PowerShell). Xem song song **`curl`** cho macOS / Linux.

> **Lưu ý:** Repo đã ship env defaults qua **ConfigModule**; khi chạy hệ thống không cần tạo hay sửa **.env**. Chỉ chỉnh sửa file này khi bạn muốn chạy service với các port/credential khác mặc định.

##### 2.1.3.2. Khởi động

```bash
docker compose -f .docker/compose.yaml up -d

# Bước 1: Cài dependency
npm install

# Bước 3: Khởi chạy ở chế độ watch
nest start --watch
```

#### 2.1.4. Kiểm thử

##### 2.1.4.1. Luồng 1 — Payload hợp lệ

  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri http://localhost:3000/users -Method Post -ContentType "application/json" -Body '{"name":"Alice","email":"alice@test.com"}'

  # macOS / Linux
  curl -s -X POST http://localhost:3000/users -H "Content-Type: application/json" -d '{"name":"Alice","email":"alice@test.com"}'
  ```

  Response (HTTP 201): user được tạo thành công.

##### 2.1.4.2. Luồng 2 — Payload không hợp lệ

  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri http://localhost:3000/users -Method Post -ContentType "application/json" -Body '{"name":123}'

  # macOS / Linux
  curl -s -X POST http://localhost:3000/users -H "Content-Type: application/json" -d '{"name":123}'
  ```

  Response (HTTP 400): validation error messages.

*Kết luận:*

- *ValidationPipe hoạt động — `@IsString()`, `@IsEmail()` reject payload sai type.*
- *Whitelist — field lạ bị loại bỏ nhờ `whitelist: true`.*

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

- **class-validator:** Library decorator-based validation cho TypeScript. ([GitHub](https://github.com/typestack/class-validator))
- **class-transformer:** Transform plain objects sang class instances. ([GitHub](https://github.com/typestack/class-transformer))
- **NestJS Validation:** ValidationPipe, whitelist, transform. ([NestJS Docs](https://docs.nestjs.com/techniques/validation))

### 2.2. Lý thuyết — DTO, ValidationPipe và class-validator

#### 2.2.1. DTO Pattern

**DTO** (Data Transfer Object) là class chỉ chứa data, không có business logic. Trong NestJS, DTO kết hợp với **class-validator** decorators để validate input tại pipe layer.

#### 2.2.2. ValidationPipe

```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,           // Loại bỏ field không khai báo trong DTO
  forbidNonWhitelisted: true, // Throw error nếu có field lạ
  transform: true,            // Auto-transform types
}));
```

#### 2.2.3. Các trường hợp biên (edge cases) cần lưu ý

- **Whitelist bypass:** Quên `whitelist: true` → client gửi field lạ vào DB. **Giải pháp:** luôn bật `whitelist` và `forbidNonWhitelisted`.
- **Nested DTO không validate:** Thiếu `@ValidateNested()` + `@Type()`. **Giải pháp:** luôn dùng `@ValidateNested()` với `class-transformer`.
- **Partial update thiếu PartialType:** Update endpoint nhận full DTO. **Giải pháp:** dùng `PartialType(CreateDto)` cho update.
- **Transform order:** `class-transformer` chạy trước `class-validator` — transform sai thì validation pass nhưng data sai. **Giải pháp:** test cả hai cùng lúc.

## 3. Tổng kết

### 3.1. Các câu hỏi dễ bị phỏng vấn

- **Câu hỏi 1:** DTO khác interface TypeScript thế nào?
  - Trả lời mẫu: Interface bị erase lúc compile. DTO là class, tồn tại runtime, cho phép gắn decorator validate.

- **Câu hỏi 2:** Vì sao cần whitelist trong ValidationPipe?
  - Trả lời mẫu: Ngăn client inject field không mong muốn vào DB (mass assignment attack).

- **Câu hỏi 3:** `PartialType` giải quyết vấn đề gì?
  - Trả lời mẫu: Tạo DTO update từ DTO create, biến tất cả field thành optional mà không duplicate code.

# references
## 0
### alias
NestJS Validation
### url
https://docs.nestjs.com/techniques/validation
## 1
### alias
class-validator
### url
https://github.com/typestack/class-validator

# minutesRead
15
