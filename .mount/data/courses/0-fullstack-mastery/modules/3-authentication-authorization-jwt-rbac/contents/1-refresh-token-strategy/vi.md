# title
Chiến lược Refresh Token

# description
Thực hành xây dựng luồng refresh token để gia hạn access token mà không cần user đăng nhập lại, giữ trải nghiệm liền mạch và bảo mật.

# body

## 1. Lời mở đầu

"Access token hết hạn sau 15 phút — user phải đăng nhập lại liên tục, làm sao giải quyết?" — một **Senior Engineer** hỏi khi review UX. Một **Mid-level Developer** trả lời: "Em tăng expiry lên 7 ngày." Câu trả lời cho thấy nhận thức về UX, nhưng vẫn thiếu chiều sâu về **security**: token dài hạn bị steal → attacker access mọi resource trong 7 ngày. **Refresh token** cho phép access token ngắn hạn (15m) kết hợp refresh token dài hạn (7d) — khi access token hết hạn, client dùng refresh token để lấy access token mới mà không cần nhập lại credentials.

Bài này dẫn qua hai mạch liên tiếp:
- **Phần 2.1**: **thực hành**; **stack** gồm **NestJS** + **PostgreSQL** (Docker), kèm **hai luồng** kiểm thử (signin → tokens; refresh → new tokens).
- **Phần 2.2**: **lý thuyết** làm rõ bản chất **token rotation**, **refresh flow**, và các **edge case**.

## 2. Các khái niệm cốt lõi

Cấu trúc bài học áp dụng phương pháp **Thực hành dẫn dắt Lý thuyết**. Khởi đầu, học viên clone source, khởi động **PostgreSQL** bằng **Docker Compose**, chạy **NestJS** bằng `nest start --watch` và gọi API để quan sát luồng refresh token end-to-end. Tiếp theo, **phần lý thuyết** phân tích token rotation và các **edge cases**.

### 2.1. Thực hành

#### 2.1.1. Chuẩn bị source code và môi trường

Source: [StarCi-Academy/fullstack-mastery-module-4-authentication-authorization-jwt-rbac](https://github.com/StarCi-Academy/fullstack-mastery-module-4-authentication-authorization-jwt-rbac) trên GitHub — thư mục bài học: [`1-refresh-token-strategy`](https://github.com/StarCi-Academy/fullstack-mastery-module-4-authentication-authorization-jwt-rbac/tree/main/1-refresh-token-strategy).

```bash
git clone https://github.com/StarCi-Academy/fullstack-mastery-module-4-authentication-authorization-jwt-rbac.git
cd fullstack-mastery-module-4-authentication-authorization-jwt-rbac/1-refresh-token-strategy
```

#### 2.1.2. Kiến trúc/thành phần (stack + luồng)

| Thành phần | File | Vai trò |
| --- | --- | --- |
| **PostgreSQL** | `.docker/compose.yaml` | Lưu trữ users |
| **AuthController** | `src/modules/auth/auth.controller.ts` | signup, signin, refresh |
| **AuthService** | `src/modules/auth/auth.service.ts` | Issue access + refresh tokens |
| **RefreshDto** | `src/modules/auth/dto/refresh.dto.ts` | Validate refresh payload |

#### 2.1.3. Chuẩn bị & khởi chạy

##### 2.1.3.1. Điều kiện cần trước

- **Node.js** LTS, **npm**, **NestJS CLI**, **Docker Desktop**.
- **Windows:** các lệnh API dùng **`Invoke-RestMethod`** (PowerShell). Xem song song **`curl`** cho macOS / Linux.

##### 2.1.3.2. Khởi động

```bash
# Bước 1: Khởi động infrastructure
docker compose -f .docker/compose.yaml up -d

# Bước 2: Cài dependency
npm install

# Bước 3: Khởi chạy ở chế độ watch
nest start --watch
```

#### 2.1.4. Kiểm thử

##### 2.1.4.1. Luồng 1 — Đăng nhập và nhận cặp token

  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri http://localhost:3000/auth/signup -Method Post -ContentType "application/json" -Body '{"email":"test@demo.com","password":"secret123"}'
  $res = Invoke-RestMethod -Uri http://localhost:3000/auth/signin -Method Post -ContentType "application/json" -Body '{"email":"test@demo.com","password":"secret123"}'
  $res

  # macOS / Linux
  curl -s -X POST http://localhost:3000/auth/signup -H "Content-Type: application/json" -d '{"email":"test@demo.com","password":"secret123"}'
  curl -s -X POST http://localhost:3000/auth/signin -H "Content-Type: application/json" -d '{"email":"test@demo.com","password":"secret123"}'
  ```

  Response (HTTP 200): `{ "access_token": "<JWT>", "refresh_token": "<JWT>" }`.

##### 2.1.4.2. Luồng 2 — Dùng refresh token để gia hạn

  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri http://localhost:3000/auth/refresh -Method Post -ContentType "application/json" -Body "{`"refresh_token`":`"$($res.refresh_token)`"}"

  # macOS / Linux
  curl -s -X POST http://localhost:3000/auth/refresh -H "Content-Type: application/json" -d '{"refresh_token":"<refresh_token>"}'
  ```

  Response (HTTP 200): cặp token mới `{ "access_token": "<new JWT>", "refresh_token": "<new JWT>" }`.

*Kết luận:*

- *Token rotation — mỗi lần refresh trả cặp token mới, refresh token cũ không dùng lại.*
- *Access token ngắn hạn — giảm window of attack nếu token bị steal.*

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

- **OAuth 2.0 Refresh Tokens:** Chuẩn RFC 6749. ([RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749#section-1.5))
- **NestJS Authentication:** JWT + refresh strategy. ([NestJS Docs](https://docs.nestjs.com/security/authentication))

### 2.2. Lý thuyết — Refresh Token Flow

#### 2.2.1. Access Token vs Refresh Token

| Access Token | Refresh Token |
| --- | --- |
| Short-lived (15m) | Long-lived (7d) |
| Gửi mỗi request (Bearer) | Chỉ gửi khi cần gia hạn |
| Nếu bị steal → damage giới hạn | Nếu bị steal → cần revoke ngay |

#### 2.2.2. Các trường hợp biên (edge cases) cần lưu ý

- **Refresh token reuse:** Attacker dùng refresh token cũ. **Giải pháp:** token rotation — invalidate cũ khi issue mới.
- **Concurrent refresh:** Nhiều tab gửi refresh cùng lúc. **Giải pháp:** grace period hoặc token family tracking.
- **Refresh token không lưu DB:** Không revoke được. **Giải pháp:** lưu hash trong DB, check trước khi issue.
- **Missing HTTPS:** Token bị intercept. **Giải pháp:** enforce HTTPS everywhere.

## 3. Tổng kết

### 3.1. Các câu hỏi dễ bị phỏng vấn

- **Câu hỏi 1:** Vì sao cần refresh token thay vì tăng expiry access token?
  - Trả lời mẫu: Access token ngắn hạn giới hạn damage khi bị steal; refresh token dùng riêng để gia hạn.

- **Câu hỏi 2:** Token rotation là gì?
  - Trả lời mẫu: Mỗi lần refresh, cả access và refresh token đều mới; token cũ bị invalidate.

- **Câu hỏi 3:** Lưu refresh token ở đâu an toàn nhất?
  - Trả lời mẫu: HttpOnly cookie (chống XSS) + secure flag (chống MITM).

# references
## 0
### alias
NestJS Authentication
### url
https://docs.nestjs.com/security/authentication
## 1
### alias
RFC 6749 - OAuth 2.0
### url
https://datatracker.ietf.org/doc/html/rfc6749

# minutesRead
15
