# title
Đăng nhập bằng Google với OAuth2

# description
Tích hợp đăng nhập bằng Google vào hệ thống NestJS sử dụng OAuth2, tự động tạo tài khoản khi người dùng đăng nhập lần đầu và phát hành JWT nội bộ.

# requirements
Cấu hình Google OAuth2 trên Google Cloud Console để lấy `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET`. Tạo `GoogleStrategy` sử dụng `passport-google-oauth20`. `GET /auth/google` chuyển hướng đến trang đăng nhập Google. `GET /auth/google/callback` nhận kết quả từ Google, kiểm tra email trong database: nếu email chưa tồn tại thì tạo user mới với thông tin từ Google profile (email, firstName, picture) - đây là cơ chế **silent registration**; nếu email đã tồn tại thì dùng user hiện có. Sau đó phát hành `access_token` JWT nội bộ và trả về cho client.

# prerequisites
- Node.js >= 18
- Docker (PostgreSQL)
- Google Cloud Console account

# steps

## 0
### title
Cấu hình Google Cloud Console và cài đặt project
### body
- **Các bước thực hiện:**
  - Bước 1: Tạo project mới bằng CLI:
    ```bash
    nest new oauth2-google-login-easy
    ```
  - Bước 2: Di chuyển vào thư mục project và cài đặt các dependency:
    ```bash
    cd oauth2-google-login-easy
    npm install @nestjs/typeorm typeorm pg @nestjs/jwt @nestjs/passport passport passport-google-oauth20 @nestjs/config
    npm install -D @types/passport-google-oauth20
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
          POSTGRES_DB: oauth2_db
    ```
  - Bước 4: Khởi động PostgreSQL:
    ```bash
    docker compose up -d
    ```
  - Bước 5: Truy cập Google Cloud Console (https://console.cloud.google.com), tạo project mới hoặc chọn project có sẵn.
  - Bước 6: Vào **APIs & Services > Credentials**, tạo **OAuth 2.0 Client ID** loại Web application. Thêm `http://localhost:3000/auth/google/callback` vào **Authorized redirect URIs**.
  - Bước 7: Tạo file `.env` ở thư mục gốc với các biến:
    ```
    GOOGLE_CLIENT_ID=your-client-id
    GOOGLE_CLIENT_SECRET=your-client-secret
    GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
    JWT_SECRET=your-jwt-secret
    ```
  - Bước 8: Import `ConfigModule.forRoot()` vào `AppModule` để đọc biến môi trường. Cấu hình `TypeOrmModule.forRoot()` với kết nối PostgreSQL, bật `synchronize: true`.
- **Kết quả mong đợi:** Google OAuth2 credentials đã được tạo, biến môi trường đã cấu hình, PostgreSQL chạy và ứng dụng sẵn sàng.
- **Kết luận:** Môi trường OAuth2 và cơ sở dữ liệu đã sẵn sàng để triển khai Google login.

## 1
### title
Tạo User entity và GoogleStrategy
### body
- **Các bước thực hiện:**
  - Bước 1: Tạo `User` entity với các trường: `id` (PrimaryGeneratedColumn), `email` (unique), `firstName` (string, nullable), `picture` (string, nullable), `password` (string, nullable - vì user OAuth không có password).
  - Bước 2: Tạo file `google.strategy.ts` định nghĩa `GoogleStrategy` extend `PassportStrategy(Strategy, 'google')` từ `passport-google-oauth20`.
  - Bước 3: Trong constructor, cấu hình:
    ```typescript
    super({
      clientID: configService.get('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
    ```
  - Bước 4: Cài đặt hàm `validate(accessToken, refreshToken, profile, done)`:
    - Lấy thông tin từ `profile`: `email` từ `profile.emails[0].value`, `firstName` từ `profile.name.givenName`, `picture` từ `profile.photos[0].value`.
    - Trả về object `{ email, firstName, picture }` qua `done(null, user)`.
  - Bước 5: Đăng ký `GoogleStrategy` vào mảng `providers` của `AuthModule`.
- **Kết quả mong đợi:** `GoogleStrategy` đọc được thông tin từ Google profile và trả về cho Passport xử lý.
- **Kết luận:** Strategy đã sẵn sàng nhận dữ liệu từ Google, bước tiếp theo sẽ xử lý logic tạo user và phát hành JWT.

## 2
### title
Triển khai controller endpoints và silent registration
### body
- **Các bước thực hiện:**
  - Bước 1: Tạo `GoogleAuthGuard` extend `AuthGuard('google')`.
  - Bước 2: Trong `AuthController`, tạo endpoint redirect:
    ```typescript
    @Get('google')
    @UseGuards(GoogleAuthGuard)
    googleAuth() {}
    ```
    Endpoint này tự động chuyển hướng đến trang đăng nhập Google.
  - Bước 3: Tạo endpoint callback:
    ```typescript
    @Get('google/callback')
    @UseGuards(GoogleAuthGuard)
    googleAuthCallback(@Req() req) {
      return this.authService.googleLogin(req.user);
    }
    ```
  - Bước 4: Trong `AuthService`, cài đặt hàm `googleLogin(googleUser)`:
    - Tìm user theo email trong database.
    - Nếu chưa tồn tại: tạo user mới với `email`, `firstName`, `picture` từ Google profile (silent registration).
    - Nếu đã tồn tại: dùng user hiện có.
    - Tạo JWT với payload `{ sub: user.id, email: user.email }` và trả về `{ access_token }`.
  - Bước 5: Đảm bảo `JwtModule.register({ secret: process.env.JWT_SECRET, signOptions: { expiresIn: '15m' } })` đã được import vào `AuthModule`.
- **Kết quả mong đợi:** User đăng nhập Google lần đầu được tự động tạo tài khoản. Lần đăng nhập tiếp theo dùng tài khoản đã có. Cả hai trường hợp đều trả về `access_token` JWT.
- **Kết luận:** Cơ chế silent registration đảm bảo trải nghiệm liền mạch, user không cần đăng ký thủ công trước khi dùng Google login.

## 3
### title
Kiểm thử luồng OAuth2 hoàn chỉnh
### body
- **Các bước thực hiện:**
  - Bước 1: Chạy ứng dụng:
    ```bash
    nest start --watch
    ```
  - Bước 2: Mở trình duyệt và truy cập:
    ```
    http://localhost:3000/auth/google
    ```
    Xác nhận trình duyệt chuyển hướng đến trang đăng nhập Google.
  - Bước 3: Đăng nhập bằng tài khoản Google. Sau khi xác thực thành công, trình duyệt được chuyển về callback URL.
  - Bước 4: Xác nhận response trả về `{ "access_token": "eyJ..." }`.
  - Bước 5: Kiểm tra database: bảng User phải có bản ghi mới với email, firstName, picture từ Google profile.
  - Bước 6: Đăng nhập lại bằng cùng tài khoản Google. Xác nhận không tạo bản ghi mới trong database (dùng user đã có).
  - Bước 7: Sử dụng access token để truy cập một protected route (nếu có) để xác nhận JWT hợp lệ:
    ```bash
    curl http://localhost:3000/some-protected-route \
      -H "Authorization: Bearer <access_token>"
    ```
- **Kết quả mong đợi:**
  - `GET /auth/google` -> chuyển hướng đến Google login.
  - `GET /auth/google/callback` -> trả `{ access_token }` JWT.
  - Đăng nhập lần đầu -> tạo user mới trong database.
  - Đăng nhập lần hai -> dùng user đã có, không tạo trùng.
  - Access token JWT hợp lệ và có thể dùng cho các route bảo vệ.
- **Kết luận:** Nếu tất cả kết quả đúng, luồng OAuth2 Google login với silent registration và JWT nội bộ đã hoạt động hoàn chỉnh.

# references
## 0
### alias
OAuth2 Login NestJS
### url
https://dev.to/imichaelowolabi/how-to-implement-login-with-google-in-nestjs-2aoa

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
GoogleStrategy cấu hình đúng
##### score
10
##### promptText
`GoogleStrategy` sử dụng `passport-google-oauth20` với đúng `clientID`, `clientSecret`, `callbackURL`. `GET /auth/google` chuyển hướng đến Google. `GET /auth/google/callback` nhận kết quả và lấy được email, firstName, picture từ Google profile.
#### 1
##### title
Silent registration và JWT phát hành
##### score
10
##### promptText
User đăng nhập lần đầu được tự động tạo tài khoản trong database với thông tin từ Google. Lần đăng nhập tiếp theo dùng user đã có. Cả hai trường hợp đều trả về `access_token` JWT hợp lệ.

# difficulty
easy

# score
20
