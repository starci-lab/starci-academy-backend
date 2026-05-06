# title
Chiến lược Refresh Token với Rotation

# description
Mở rộng hệ thống xác thực với vòng đời Refresh Token, triển khai cơ chế Rotation và Revocation để bảo mật phiên đăng nhập.

# requirements
`POST /auth/signin` trả cả `access_token` (15 phút) và `refresh_token` (7 ngày). Lưu hash của refresh token vào cột `hashedRefreshToken` trong bảng User. `POST /auth/refresh` xác minh refresh token, so sánh với hash trong database, cấp cặp token mới (Rotation). `POST /auth/logout` đặt `hashedRefreshToken = null` (Revocation). Dùng lại refresh token cũ sau khi đã refresh phải trả 401 Unauthorized.

# prerequisites
- Node.js >= 18
- Docker (PostgreSQL)
- Đã hiểu JWT authentication flow

# steps

## 0
### title
Khởi tạo project và thêm cột hashedRefreshToken
### body
- **Các bước thực hiện:**
  - Bước 1: Tạo project mới bằng CLI:
    ```bash
    nest new refresh-token-strategy-easy
    ```
  - Bước 2: Di chuyển vào thư mục project và cài đặt các dependency:
    ```bash
    cd refresh-token-strategy-easy
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
          POSTGRES_DB: refresh_token_db
    ```
  - Bước 4: Khởi động PostgreSQL:
    ```bash
    docker compose up -d
    ```
  - Bước 5: Cấu hình `TypeOrmModule.forRoot()` trong `AppModule` với thông tin kết nối, bật `synchronize: true`.
  - Bước 6: Tạo `User` entity với các trường: `id` (PrimaryGeneratedColumn), `email` (unique), `password` (string), `hashedRefreshToken` (string, nullable). Cột `hashedRefreshToken` dùng để lưu hash của refresh token hiện tại.
- **Kết quả mong đợi:** PostgreSQL chạy trên port 5432, bảng User được tạo tự động với cột `hashedRefreshToken` nullable.
- **Kết luận:** Cơ sở dữ liệu đã sẵn sàng với cấu trúc hỗ trợ lưu trữ refresh token hash.

## 1
### title
Triển khai sign-in trả cặp token kép
### body
- **Các bước thực hiện:**
  - Bước 1: Tạo `AuthModule`, `AuthService`, `AuthController`. Import `JwtModule` và `TypeOrmModule.forFeature([User])`.
  - Bước 2: Trong `AuthService`, cài đặt hàm `signup(email, password)`: hash password bằng bcrypt và lưu user mới.
  - Bước 3: Cài đặt hàm `signin(email, password)`:
    - Xác thực credentials (tìm user, so sánh password bằng bcrypt).
    - Tạo `access_token` với payload `{ sub: user.id, email: user.email }`, hết hạn 15 phút.
    - Tạo `refresh_token` với payload `{ sub: user.id }`, hết hạn 7 ngày.
    - Hash refresh token bằng `bcrypt.hash()` và lưu vào cột `hashedRefreshToken` của user.
    - Trả về `{ access_token, refresh_token }`.
  - Bước 4: Trong `AuthController`, tạo endpoint `POST /auth/signup` và `POST /auth/signin`.
- **Kết quả mong đợi:** `POST /auth/signin` trả về cả hai token, refresh token được hash và lưu vào database.
- **Kết luận:** Hệ thống đã cấp được cặp token kép, refresh token được bảo mật bằng hash trước khi lưu.

## 2
### title
Triển khai refresh với cơ chế Rotation
### body
- **Các bước thực hiện:**
  - Bước 1: Tạo `JwtStrategy` (cho access token) và `JwtAuthGuard` tương tự bài trước.
  - Bước 2: Tạo `RefreshTokenStrategy` extend `PassportStrategy(Strategy, 'jwt-refresh')`:
    - Lấy token từ header `Authorization: Bearer <token>`.
    - Trong hàm `validate(req, payload)`, lấy refresh token từ request và trả về `{ userId: payload.sub, refreshToken }`.
  - Bước 3: Tạo `RefreshTokenGuard` extend `AuthGuard('jwt-refresh')`.
  - Bước 4: Trong `AuthService`, cài đặt hàm `refreshTokens(userId, refreshToken)`:
    - Tìm user theo id, kiểm tra `hashedRefreshToken` có tồn tại không (nếu null thì ném `UnauthorizedException`).
    - So sánh refresh token với `hashedRefreshToken` bằng `bcrypt.compare()`. Nếu không khớp thì ném `UnauthorizedException`.
    - Tạo cặp token mới (access + refresh).
    - Hash refresh token mới và cập nhật `hashedRefreshToken` trong database (Rotation).
    - Trả về `{ access_token, refresh_token }` mới.
  - Bước 5: Trong `AuthController`, tạo endpoint `POST /auth/refresh` sử dụng `@UseGuards(RefreshTokenGuard)`, gọi `this.authService.refreshTokens()`.
- **Kết quả mong đợi:** `POST /auth/refresh` với refresh token hợp lệ trả cặp token mới. Refresh token cũ bị vô hiệu hóa sau khi rotation.
- **Kết luận:** Cơ chế Rotation đảm bảo mỗi refresh token chỉ được sử dụng một lần, giảm rủi ro bị tấn công replay.

## 3
### title
Triển khai logout và kiểm thử toàn bộ luồng
### body
- **Các bước thực hiện:**
  - Bước 1: Trong `AuthService`, cài đặt hàm `logout(userId)`: cập nhật `hashedRefreshToken = null` trong database.
  - Bước 2: Trong `AuthController`, tạo endpoint `POST /auth/logout` sử dụng `@UseGuards(JwtAuthGuard)`, gọi `this.authService.logout()`.
  - Bước 3: Chạy ứng dụng:
    ```bash
    nest start --watch
    ```
  - Bước 4: Đăng ký và đăng nhập:
    ```bash
    curl -X POST http://localhost:3000/auth/signup \
      -H "Content-Type: application/json" \
      -d '{"email": "test@example.com", "password": "123456"}'

    curl -X POST http://localhost:3000/auth/signin \
      -H "Content-Type: application/json" \
      -d '{"email": "test@example.com", "password": "123456"}'
    ```
    Lưu lại `access_token` và `refresh_token` từ response.
  - Bước 5: Gọi refresh để lấy cặp token mới:
    ```bash
    curl -X POST http://localhost:3000/auth/refresh \
      -H "Authorization: Bearer <refresh_token>"
    ```
    Xác nhận trả về cặp token mới.
  - Bước 6: Dùng lại refresh token cũ (đã bị rotation):
    ```bash
    curl -X POST http://localhost:3000/auth/refresh \
      -H "Authorization: Bearer <old_refresh_token>"
    ```
    Xác nhận trả về 401 Unauthorized.
  - Bước 7: Gọi logout:
    ```bash
    curl -X POST http://localhost:3000/auth/logout \
      -H "Authorization: Bearer <access_token>"
    ```
  - Bước 8: Sau logout, gọi refresh với token mới nhất:
    ```bash
    curl -X POST http://localhost:3000/auth/refresh \
      -H "Authorization: Bearer <new_refresh_token>"
    ```
    Xác nhận trả về 401 Unauthorized vì `hashedRefreshToken` đã bị xóa.
- **Kết quả mong đợi:**
  - `POST /auth/signin` -> trả `{ access_token, refresh_token }`.
  - `POST /auth/refresh` với token hợp lệ -> trả cặp token mới.
  - `POST /auth/refresh` với token cũ -> 401 Unauthorized.
  - `POST /auth/logout` -> thành công.
  - `POST /auth/refresh` sau logout -> 401 Unauthorized.
- **Kết luận:** Nếu tất cả kết quả đúng, cơ chế Rotation và Revocation đã hoạt động chính xác, bảo vệ hệ thống khỏi tấn công sử dụng lại token cũ.

# references
## 0
### alias
Token Revocation Best Practices
### url
https://auth0.com/blog/refresh-tokens-what-are-they-and-when-to-use-them/

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
Rotation hoạt động
##### score
10
##### promptText
`POST /auth/refresh` xác minh refresh token, cấp cặp token mới, hash refresh token mới và lưu vào database. Refresh token cũ không còn sử dụng được sau khi rotation.
#### 1
##### title
Revocation hoạt động
##### score
10
##### promptText
`POST /auth/logout` đặt `hashedRefreshToken = null`. Sau logout, mọi yêu cầu refresh đều trả 401 Unauthorized.

# difficulty
easy

# score
20
