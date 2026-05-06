# title
Phân quyền theo vai trò với RBAC

# description
Triển khai hệ thống phân quyền RBAC (Role-Based Access Control) với custom decorator @Roles() và RolesGuard, phân biệt rõ ràng Authentication và Authorization trong ứng dụng NestJS.

# requirements
Tạo Role enum với hai giá trị `USER` và `ADMIN`. Thêm cột `role` vào User entity với giá trị mặc định là `USER`. Tạo `@Roles()` decorator sử dụng `SetMetadata` để gán metadata role cho route. Tạo `RolesGuard` implement `CanActivate`, sử dụng `Reflector` để đọc metadata role từ route và so sánh với role của user trong request. Endpoint `DELETE /users/:id` gán `@Roles('ADMIN')` kết hợp `@UseGuards(JwtAuthGuard, RolesGuard)`: user có role `USER` trả 403 Forbidden, user có role `ADMIN` thực hiện thành công.

# prerequisites
- Node.js >= 18
- Docker (PostgreSQL)
- JwtAuthGuard đã hoạt động

# steps

## 0
### title
Khởi tạo project và định nghĩa Role enum
### body
- **Các bước thực hiện:**
  - Bước 1: Tạo project mới bằng CLI:
    ```bash
    nest new rbac-and-guards-easy
    ```
  - Bước 2: Di chuyển vào thư mục project và cài đặt các dependency:
    ```bash
    cd rbac-and-guards-easy
    npm install @nestjs/typeorm typeorm pg @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt
    npm install -D @types/passport-jwt @types/bcrypt
    ```
  - Bước 3: Tạo file `docker-compose.yml` với PostgreSQL:
    ```yaml
    services:
      postgres:
        image: postgres:16
        ports:
          - "5432:5432"
        environment:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: rbac_db
    ```
  - Bước 4: Khởi động PostgreSQL:
    ```bash
    docker compose up -d
    ```
  - Bước 5: Cấu hình `TypeOrmModule.forRoot()` trong `AppModule`, bật `synchronize: true`.
  - Bước 6: Tạo enum `Role` với hai giá trị:
    ```typescript
    export enum Role {
      USER = 'USER',
      ADMIN = 'ADMIN',
    }
    ```
  - Bước 7: Tạo `User` entity với các trường: `id` (PrimaryGeneratedColumn), `email` (unique), `password` (string), `role` (enum Role, default `Role.USER`).
- **Kết quả mong đợi:** PostgreSQL chạy trên port 5432, bảng User được tạo với cột `role` có giá trị mặc định là `USER`.
- **Kết luận:** Cơ sở dữ liệu và cấu trúc entity đã sẵn sàng với hệ thống role.

## 1
### title
Tạo @Roles() decorator và AuthModule
### body
- **Các bước thực hiện:**
  - Bước 1: Tạo `AuthModule`, `AuthService`, `AuthController` với chức năng signup và signin tương tự bài trước (bcrypt hash password, JWT signing).
  - Bước 2: Trong hàm `signup`, lưu user với role mặc định `USER`. Để test, tạo thêm một endpoint hoặc seed data để tạo user với role `ADMIN`.
  - Bước 3: Trong hàm `signin`, thêm trường `role` vào JWT payload: `{ sub: user.id, email: user.email, role: user.role }`.
  - Bước 4: Tạo `JwtStrategy` và `JwtAuthGuard`. Trong hàm `validate(payload)`, trả về `{ userId: payload.sub, email: payload.email, role: payload.role }` để role có mặt trong `request.user`.
  - Bước 5: Tạo file `roles.decorator.ts` định nghĩa custom decorator `@Roles()`:
    ```typescript
    import { SetMetadata } from '@nestjs/common';
    export const ROLES_KEY = 'roles';
    export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
    ```
- **Kết quả mong đợi:** Decorator `@Roles()` có thể gán metadata role cho bất kỳ route nào. JWT payload chứa thông tin role của user.
- **Kết luận:** Cơ chế gán metadata role đã sẵn sàng, bước tiếp theo sẽ tạo Guard để đọc và enforce metadata này.

## 2
### title
Tạo RolesGuard sử dụng Reflector
### body
- **Các bước thực hiện:**
  - Bước 1: Tạo file `roles.guard.ts` định nghĩa `RolesGuard` implement `CanActivate`.
  - Bước 2: Inject `Reflector` vào constructor của `RolesGuard`.
  - Bước 3: Trong hàm `canActivate(context)`:
    - Dùng `this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [context.getHandler(), context.getClass()])` để lấy danh sách role yêu cầu từ metadata.
    - Nếu không có metadata role (route không dùng `@Roles()`), trả `true` (cho phép truy cập).
    - Lấy `user` từ `context.switchToHttp().getRequest().user`.
    - Kiểm tra `requiredRoles.includes(user.role)`. Nếu không khớp, ném `ForbiddenException`.
  - Bước 4: Tạo `UserModule` với `UserController`. Tạo endpoint `DELETE /users/:id` và gán:
    ```typescript
    @Roles(Role.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Delete(':id')
    deleteUser(@Param('id') id: string) { ... }
    ```
  - Bước 5: Trong `UserService`, cài đặt hàm `deleteUser(id)` xóa user theo id từ database.
- **Kết quả mong đợi:** `RolesGuard` đọc metadata từ decorator, so sánh với role của user. Route chỉ cho phép user có role phù hợp truy cập.
- **Kết luận:** RolesGuard kết hợp với Reflector tạo thành cơ chế phân quyền linh hoạt, tái sử dụng cho mọi route cần bảo vệ.

## 3
### title
Kiểm thử phân quyền với các role khác nhau
### body
- **Các bước thực hiện:**
  - Bước 1: Chạy ứng dụng:
    ```bash
    nest start --watch
    ```
  - Bước 2: Đăng ký user thường (role USER):
    ```bash
    curl -X POST http://localhost:3000/auth/signup \
      -H "Content-Type: application/json" \
      -d '{"email": "user@example.com", "password": "123456"}'
    ```
  - Bước 3: Tạo hoặc seed user admin (role ADMIN). Có thể dùng endpoint riêng hoặc trực tiếp cập nhật trong database:
    ```bash
    curl -X POST http://localhost:3000/auth/signup \
      -H "Content-Type: application/json" \
      -d '{"email": "admin@example.com", "password": "123456"}'
    ```
    Sau đó cập nhật role trong database hoặc dùng endpoint seed.
  - Bước 4: Đăng nhập với user thường và lấy token:
    ```bash
    curl -X POST http://localhost:3000/auth/signin \
      -H "Content-Type: application/json" \
      -d '{"email": "user@example.com", "password": "123456"}'
    ```
  - Bước 5: Gọi `DELETE /users/1` với token của user thường:
    ```bash
    curl -X DELETE http://localhost:3000/users/1 \
      -H "Authorization: Bearer <user_token>"
    ```
    Xác nhận trả về 403 Forbidden.
  - Bước 6: Đăng nhập với admin và lấy token:
    ```bash
    curl -X POST http://localhost:3000/auth/signin \
      -H "Content-Type: application/json" \
      -d '{"email": "admin@example.com", "password": "123456"}'
    ```
  - Bước 7: Gọi `DELETE /users/1` với token của admin:
    ```bash
    curl -X DELETE http://localhost:3000/users/1 \
      -H "Authorization: Bearer <admin_token>"
    ```
    Xác nhận thao tác thành công.
- **Kết quả mong đợi:**
  - `DELETE /users/:id` với token user (role USER) -> 403 Forbidden.
  - `DELETE /users/:id` với token admin (role ADMIN) -> thành công (200).
  - `DELETE /users/:id` không có token -> 401 Unauthorized (bị JwtAuthGuard chặn trước).
- **Kết luận:** Nếu kết quả đúng, hệ thống RBAC đã phân biệt rõ Authentication (ai đang truy cập) và Authorization (có quyền thực hiện không) thông qua hai tầng Guard.

# references
## 0
### alias
NestJS Authorization
### url
https://docs.nestjs.com/security/authorization

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
Cấu trúc RBAC đúng
##### score
10
##### promptText
Có Role enum (USER, ADMIN), cột `role` trong User entity với default USER, decorator `@Roles()` sử dụng `SetMetadata`, và `RolesGuard` sử dụng `Reflector` đọc metadata role.
#### 1
##### title
Guard enforce đúng
##### score
10
##### promptText
`DELETE /users/:id` với `@Roles('ADMIN')` và `@UseGuards(JwtAuthGuard, RolesGuard)`: user role USER trả 403 Forbidden, user role ADMIN thực hiện thành công, không có token trả 401.

# difficulty
easy

# score
20
