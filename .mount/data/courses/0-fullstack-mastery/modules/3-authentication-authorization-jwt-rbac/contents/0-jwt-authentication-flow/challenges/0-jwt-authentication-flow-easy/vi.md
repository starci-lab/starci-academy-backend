# title
Xác thực người dùng bằng JWT

# description
Xây dựng luồng xác thực JWT hoàn chỉnh cho hệ thống quản lý nhân viên. Người dùng đăng ký, đăng nhập nhận access token, và truy cập route được bảo vệ bằng JwtAuthGuard.

# requirements
Tạo project NestJS với `AuthModule` và `EmployeeModule`. `POST /auth/signup` nhận `email` và `password`, hash password bằng **bcrypt** và lưu vào PostgreSQL. `POST /auth/signin` xác thực credentials và trả `{ access_token }` (JWT ký bằng secret, hết hạn sau 15 phút). `GET /employees/profile` bảo vệ bằng `JwtAuthGuard`: trả 401 Unauthorized nếu không có token hoặc token hết hạn, trả thông tin user từ JWT payload nếu token hợp lệ.

# prerequisites
- Node.js >= 18
- Docker (PostgreSQL)
- NestJS CLI

# steps

## 0
### title
Khởi tạo project và cấu hình PostgreSQL bằng Docker
### body
- **Các bước thực hiện:**
  - Bước 1: Tạo project mới bằng CLI:
    ```bash
    nest new jwt-authentication-flow-easy
    ```
  - Bước 2: Di chuyển vào thư mục project và cài đặt các dependency cần thiết:
    ```bash
    cd jwt-authentication-flow-easy
    npm install @nestjs/typeorm typeorm pg @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt
    npm install -D @types/passport-jwt @types/bcrypt
    ```
  - Bước 3: Tạo file `docker-compose.yml` ở thư mục gốc với PostgreSQL:
    ```yaml
    services:
      postgres:
        image: postgres:16
        ports:
          - "5432:5432"
        environment:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: jwt_auth_db
    ```
  - Bước 4: Khởi động PostgreSQL:
    ```bash
    docker compose up -d
    ```
  - Bước 5: Cấu hình `TypeOrmModule.forRoot()` trong `AppModule` với thông tin kết nối PostgreSQL, bật `synchronize: true` để tự động tạo bảng.
- **Kết quả mong đợi:** PostgreSQL chạy trên port 5432, ứng dụng NestJS kết nối thành công và sẵn sàng tạo bảng từ entity.
- **Kết luận:** Môi trường project và cơ sở dữ liệu đã sẵn sàng để triển khai module xác thực.

## 1
### title
Tạo User entity và AuthModule với bcrypt và JWT
### body
- **Các bước thực hiện:**
  - Bước 1: Tạo `User` entity với các trường: `id` (PrimaryGeneratedColumn), `email` (unique), `password` (string).
  - Bước 2: Tạo `AuthModule`, `AuthService`, `AuthController` bằng CLI hoặc thủ công.
  - Bước 3: Import `TypeOrmModule.forFeature([User])` và `JwtModule.register({ secret: 'your-secret-key', signOptions: { expiresIn: '15m' } })` vào `AuthModule`.
  - Bước 4: Trong `AuthService`, cài đặt hàm `signup(email, password)`:
    - Kiểm tra email đã tồn tại chưa, nếu có thì ném `ConflictException`.
    - Hash password bằng `bcrypt.hash(password, 10)`.
    - Lưu user mới vào database và trả về thông báo thành công.
  - Bước 5: Trong `AuthService`, cài đặt hàm `signin(email, password)`:
    - Tìm user theo email, nếu không có thì ném `UnauthorizedException`.
    - So sánh password bằng `bcrypt.compare()`, nếu sai thì ném `UnauthorizedException`.
    - Tạo JWT với payload `{ sub: user.id, email: user.email }` và trả về `{ access_token }`.
  - Bước 6: Trong `AuthController`, tạo `POST /auth/signup` gọi `this.authService.signup()` và `POST /auth/signin` gọi `this.authService.signin()`.
- **Kết quả mong đợi:** `POST /auth/signup` tạo user với password đã hash trong database. `POST /auth/signin` trả access token JWT hợp lệ.
- **Kết luận:** Luồng đăng ký và đăng nhập hoàn chỉnh với bcrypt hash và JWT signing.

## 2
### title
Tạo JwtStrategy và JwtAuthGuard
### body
- **Các bước thực hiện:**
  - Bước 1: Tạo file `jwt.strategy.ts` trong thư mục auth. Class `JwtStrategy` extend `PassportStrategy(Strategy)` từ `passport-jwt`.
  - Bước 2: Cấu hình strategy trong constructor:
    - `jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()` để lấy token từ header `Authorization: Bearer <token>`.
    - `ignoreExpiration: false` để từ chối token hết hạn.
    - `secretOrKey` trùng với secret đã dùng khi ký JWT.
  - Bước 3: Cài đặt hàm `validate(payload)` trả về `{ userId: payload.sub, email: payload.email }`. Giá trị này sẽ được gán vào `request.user`.
  - Bước 4: Tạo `JwtAuthGuard` extend `AuthGuard('jwt')`.
  - Bước 5: Đăng ký `JwtStrategy` vào mảng `providers` của `AuthModule` và export `JwtAuthGuard` để các module khác sử dụng.
  - Bước 6: Tạo `EmployeeModule` với `EmployeeController`. Tạo endpoint `GET /employees/profile` gán `@UseGuards(JwtAuthGuard)` và trả về `request.user`.
- **Kết quả mong đợi:** Request đến `GET /employees/profile` không có token trả 401. Request có token hợp lệ trả thông tin user từ JWT payload.
- **Kết luận:** JwtStrategy và JwtAuthGuard đã bảo vệ route thành công, chỉ cho phép request có token hợp lệ truy cập.

## 3
### title
Kiểm thử toàn bộ luồng xác thực
### body
- **Các bước thực hiện:**
  - Bước 1: Chạy ứng dụng:
    ```bash
    nest start --watch
    ```
  - Bước 2: Đăng ký user mới:
    ```bash
    curl -X POST http://localhost:3000/auth/signup \
      -H "Content-Type: application/json" \
      -d '{"email": "test@example.com", "password": "123456"}'
    ```
  - Bước 3: Đăng nhập để lấy access token:
    ```bash
    curl -X POST http://localhost:3000/auth/signin \
      -H "Content-Type: application/json" \
      -d '{"email": "test@example.com", "password": "123456"}'
    ```
    Xác nhận response trả về `{ "access_token": "eyJ..." }`.
  - Bước 4: Truy cập route bảo vệ với token:
    ```bash
    curl http://localhost:3000/employees/profile \
      -H "Authorization: Bearer <access_token>"
    ```
    Xác nhận trả về thông tin user.
  - Bước 5: Truy cập route bảo vệ không có token:
    ```bash
    curl http://localhost:3000/employees/profile
    ```
    Xác nhận trả về 401 Unauthorized.
- **Kết quả mong đợi:**
  - `POST /auth/signup` -> tạo user thành công (201).
  - `POST /auth/signin` -> trả `{ access_token }` (200).
  - `GET /employees/profile` với token -> trả thông tin user (200).
  - `GET /employees/profile` không token -> 401 Unauthorized.
- **Kết luận:** Nếu tất cả endpoint trả đúng kết quả, luồng xác thực JWT hoàn chỉnh đã hoạt động chính xác.

# references
## 0
### alias
NestJS Authentication
### url
https://docs.nestjs.com/security/authentication

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
Luồng xác thực đúng
##### score
10
##### promptText
`POST /auth/signup` hash password bằng bcrypt và lưu vào PostgreSQL. `POST /auth/signin` xác thực credentials và trả `{ access_token }` JWT hợp lệ với thời hạn 15 phút.
#### 1
##### title
Guard bảo vệ route
##### score
10
##### promptText
`GET /employees/profile` được bảo vệ bằng `JwtAuthGuard`. Không có token trả 401 Unauthorized. Có token hợp lệ trả thông tin user từ JWT payload.

# difficulty
easy

# score
20
