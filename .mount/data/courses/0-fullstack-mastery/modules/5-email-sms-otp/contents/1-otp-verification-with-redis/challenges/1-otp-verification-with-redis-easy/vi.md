# title
Bảo mật luồng OTP với Redis (Rate Limiting & Retry Limit)

# description
Bối cảnh: Hệ thống gửi mã OTP xác nhận đăng ký đang bị bot tấn công, gọi liên tục làm cạn kiệt ngân sách SMS và dò mã bằng kỹ thuật brute force. Input: Các yêu cầu gửi mã OTP và xác thực mã OTP từ client. Yêu cầu: Xây dựng cơ chế giới hạn tần suất gửi và giới hạn số lần nhập sai bằng Redis.

# requirements
## 0
### purpose
Xây dựng API gửi OTP có kiểm soát tần suất (Rate Limiting).
### technicalConstraints
- Endpoint `POST /otp/send` nhận `{ "phone": "string" }`.
- Sinh mã OTP 6 chữ số bằng hàm an toàn `crypto.randomInt`.
- Lưu OTP vào Redis với `ttl` là 5 phút. Key format: `otp:{phone}`.
- Kiểm soát số lần gửi bằng Redis (ví dụ: tối đa 3 lần/phút). Vượt mức trả về lỗi `429 Too Many Requests`. Key format: `retry:{phone}`.
### proTipsHints
Sử dụng `ioredis` để kết nối Redis. Lưu ý set TTL cho key `retry:{phone}` ngay khi khởi tạo để biến đếm tự động reset sau 1 phút.

## 1
### purpose
Xây dựng API xác thực OTP và chống rà quét mã (Brute-force).
### technicalConstraints
- Endpoint `POST /otp/verify` nhận `{ "phone": "string", "code": "string" }`.
- So sánh mã `code` với giá trị trong `otp:{phone}`.
- Nếu sai mã: tăng biến đếm trong `fails:{phone}` (TTL 15 phút). Nếu sai đến 5 lần, khóa tính năng xác thực của số điện thoại này trong 15 phút (trả về lỗi `403 Forbidden`).
- Nếu đúng mã: xóa OTP và trả về xác nhận thành công.
### proTipsHints
Sử dụng lệnh `INCR` của Redis để đảm bảo tính an toàn trong môi trường đa luồng khi tăng giá trị biến đếm.

### forbidden
- Không sử dụng các biến toàn cục (global in-memory variables) để lưu OTP, bắt buộc phải dùng Redis.
- Không bỏ qua việc giới hạn số lần nhập sai, vì mã 6 số cực kỳ dễ bị brute-force nếu không chặn.

# prerequisites
## 0
### text
Node.js >= 18
## 1
### text
NestJS CLI
## 2
### text
Docker (để chạy Redis)

# steps
## 0
### title
Khởi tạo project và cấu hình kết nối Redis
### body
### 1. Các bước thực hiện
- Khởi tạo project NestJS mới: `nest new otp-verification-easy`
- Cài đặt thư viện: `npm install ioredis`
- Tạo file `docker-compose.yml` để chạy Redis trên port 6379. Khởi động bằng `docker compose up -d`.
- Tạo `OtpModule`, cấu hình `ioredis` Provider kết nối tới `localhost:6379`.
### 2. Yêu cầu tối thiểu cần đạt
- Project khởi động thành công, in ra log đã kết nối Redis.
### 3. Nice to have
- Tạo một Redis Module riêng biệt export provider `REDIS_CLIENT` để các module khác dễ dàng sử dụng.

## 1
### title
Xây dựng luồng gửi mã OTP (Send OTP)
### body
### 1. Các bước thực hiện
- Trong `OtpService`, tạo hàm `sendOtp(phone: string)`.
- Đọc giá trị của `retry:{phone}`. Nếu >= 3, ném ra ngoại lệ `HttpException` (429).
- Dùng `crypto.randomInt(100000, 999999)` sinh mã OTP 6 số. Lưu vào `otp:{phone}` với TTL 300s.
- Tăng biến đếm `retry:{phone}` bằng `INCR` và set TTL 60s nếu là lần đầu tiên tạo biến đếm.
- Tạo endpoint `POST /otp/send` gọi vào hàm trên, trả về thông báo và log mã OTP ra terminal (để test).
### 2. Yêu cầu tối thiểu cần đạt
- Gọi API 3 lần đầu tiên thành công, lần thứ 4 (trong vòng 1 phút) trả về lỗi 429.
### 3. Nice to have
- Dùng Redis Multi (Transaction) để đảm bảo `INCR` và `EXPIRE` được thực thi cùng lúc.

## 2
### title
Xây dựng luồng xác thực mã OTP (Verify OTP)
### body
### 1. Các bước thực hiện
- Tạo hàm `verifyOtp(phone: string, code: string)`.
- Đọc giá trị `fails:{phone}`. Nếu >= 5, ném ra ngoại lệ `HttpException` (403 Forbidden).
- Đọc giá trị `otp:{phone}`. Nếu không có hoặc không trùng khớp với `code`, dùng `INCR` tăng `fails:{phone}` lên 1 (set TTL 900s), trả về lỗi 400 Bad Request.
- Nếu mã khớp, xóa cả `otp:{phone}` và `fails:{phone}` bằng lệnh `DEL`. Trả về thành công 200 OK.
### 2. Yêu cầu tối thiểu cần đạt
- Nhập sai mã 5 lần liên tiếp sẽ nhận HTTP 403.
- Nhập đúng mã OTP trước 5 lần sẽ nhận HTTP 200 và sau đó mã OTP không còn dùng lại được nữa.
### 3. Nice to have
- Log cảnh báo ra console hệ thống khi một user cố tình nhập sai mã OTP nhiều lần.

# outputs
## 0
### text
Thiết kế và triển khai được cơ chế Rate Limiting cơ bản bằng Redis.
## 1
### text
Hiểu và xây dựng được luồng bảo vệ Brute-force giới hạn số lần nhập sai.
## 2
### text
Sử dụng thành thạo các thao tác In-memory căn bản của Redis (`GET`, `SET`, `INCR`, `EXPIRE`, `DEL`).

# references
## 0
### alias
NestJS Security Rate Limiting
### url
https://docs.nestjs.com/security/rate-limiting
## 1
### alias
ioredis Documentation
### url
https://github.com/redis/ioredis

# submissions
## 0
### type
githubUrl
### title
Link GitHub Repository
### description
Repo chứa source code ứng dụng NestJS giải quyết bài toán Rate Limit OTP, cấu hình Redis và file README.md đính kèm terminal logs chứng minh kết quả.
### score
20
### prompts
#### 0
##### title
Luồng gửi mã (Rate Limit) hoạt động đúng
##### score
10
##### promptText
Chấm theo Rubric (tối đa 10 điểm):
- Tiêu chí 1 (5 điểm): Sinh đúng mã ngẫu nhiên 6 chữ số và lưu vào Redis.
- Tiêu chí 2 (5 điểm): Chặn đứng các request thứ 4 trở đi (trong cùng 1 phút) và trả về lỗi `429 Too Many Requests`.
Quy tắc chấm: Đạt tiêu chí nào nhận điểm tiêu chí đó.
#### 1
##### title
Luồng xác thực (Brute-force Challenge) hoạt động đúng
##### score
10
##### promptText
Chấm theo Rubric (tối đa 10 điểm):
- Tiêu chí 1 (5 điểm): Đếm và giới hạn chính xác số lần sai. Báo lỗi `403 Forbidden` ở lần sai thứ 5 trở lên.
- Tiêu chí 2 (5 điểm): Verify đúng mã sẽ báo thành công và xóa OTP để không thể tái sử dụng.
Quy tắc chấm: Đạt tiêu chí nào nhận điểm tiêu chí đó.

# difficulty
easy

# score
20
