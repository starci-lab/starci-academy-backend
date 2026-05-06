# title
So sánh SQL và NoSQL bằng API quản lý thư viện mini với NestJS

# description
Đây là challenge thực hành code. Bạn sẽ xây một API NestJS nhỏ với 2 luồng lưu trữ song song cho cùng nghiệp vụ quản lý sách: một luồng dùng PostgreSQL (SQL), một luồng dùng MongoDB (NoSQL). Mục tiêu là hiểu sự khác nhau giữa mô hình dữ liệu quan hệ chặt và mô hình dữ liệu linh hoạt theo metadata.

# requirements
## 0
### purpose
Dựng được 2 nhóm endpoint chạy song song (`/sql/books`, `/nosql/books`) để ghi/đọc dữ liệu sách theo 2 kiểu database khác nhau.
### technicalConstraints
Phải tách đúng 2 module độc lập theo trách nhiệm cho SQL và NoSQL trong NestJS; luồng SQL dùng TypeORM + PostgreSQL, luồng NoSQL dùng Mongoose + MongoDB, và không dùng in-memory array.
### proTipsHints
- Với SQL, mô hình sách nên có quan hệ với tác giả (ví dụ `Book` - `Author`) để thấy rõ lợi ích join/constraint.
- Với NoSQL, thêm `metadata` linh hoạt (ví dụ `tags`, `edition`, `extraInfo`) để thấy ưu thế schema linh động.

## 1
### purpose
Thực thi được các luồng API chính cho cả SQL và NoSQL: tạo dữ liệu và đọc dữ liệu.
### technicalConstraints
Bắt buộc có đủ 6 endpoint `POST /sql/books`, `GET /sql/books`, `GET /sql/books/:id`, `POST /nosql/books`, `GET /nosql/books`, `GET /nosql/books/:id`, và validation phải enforce tối thiểu `title`, `authorName`.
### proTipsHints
- Dùng DTO + `ValidationPipe` để fail sớm request không hợp lệ.
- Với SQL, nên bật relation loading hợp lý để trả về thông tin tác giả cùng sách.

## 2
### purpose
Thể hiện rõ khác biệt của 2 mô hình dữ liệu qua response API.
### technicalConstraints
Response SQL phải thể hiện dữ liệu quan hệ (sách + tác giả), response NoSQL phải có metadata linh hoạt với ít nhất 2 key tùy biến, và `README.md` phải nêu ngắn gọn lý do chọn SQL/NoSQL theo context bài.
### proTipsHints
- Bạn có thể giữ business giống nhau, chỉ khác cách mô hình dữ liệu để dễ so sánh.
- Viết giải thích ngắn, tập trung vào tính thực tế thay vì lý thuyết dài.

### forbidden
- Dùng in-memory array thay cho PostgreSQL/MongoDB thật -> **0 prompt môi trường**.
- Thiếu một trong 6 endpoint bắt buộc -> **0 prompt endpoint tương ứng**.
- Không có metadata linh hoạt ở luồng NoSQL -> **0 prompt NoSQL**.
- Response SQL không thể hiện dữ liệu quan hệ sách - tác giả -> **0 prompt SQL**.

# prerequisites
## 0
### text
Có Node.js LTS, npm, git.
## 1
### text
Có Docker Desktop (hoặc Docker Engine) và docker compose.
## 2
### text
Biết NestJS module/controller/service cơ bản.
## 3
### text
Biết DTO + validation cơ bản.
## 4
### text
Biết thao tác CRUD cơ bản với TypeORM hoặc Mongoose.

# steps
## 0
### title
Khởi tạo project và kết nối PostgreSQL + MongoDB
### body
**Các bước thực hiện**
- Tạo project NestJS mới (hoặc dùng skeleton sẵn có).
- Tạo file docker compose để chạy PostgreSQL và MongoDB.
- Cài package cần thiết cho TypeORM/PostgreSQL và Mongoose/MongoDB.
- Cấu hình module kết nối DB trong `AppModule` (hoặc module riêng).

**Yêu cầu tối thiểu cần đạt**
- Chạy được app và cả 2 DB bằng docker compose.
- App boot thành công, không lỗi kết nối DB.

**Nice to have**
- Tách config qua `.env`.
- Tạo script npm riêng để bật/tắt môi trường nhanh.

## 1
### title
Làm luồng SQL cho nghiệp vụ sách
### body
**Các bước thực hiện**
- Tạo entity SQL cho `Book` và `Author` (hoặc model quan hệ tương đương).
- Tạo DTO, service, controller cho nhóm endpoint `/sql/books`.
- Implement:
  - `POST /sql/books` để tạo sách kèm tác giả.
  - `GET /sql/books` để lấy danh sách.
  - `GET /sql/books/:id` để lấy chi tiết theo id.

**Yêu cầu tối thiểu cần đạt**
- Tạo được ít nhất 1 bản ghi SQL bằng API.
- `GET /sql/books/:id` trả về object có thông tin sách và tác giả.

**Nice to have**
- Chặn tạo trùng dữ liệu cơ bản (ví dụ title + author).
- Tách mapper response DTO rõ ràng.

## 2
### title
Làm luồng NoSQL cho nghiệp vụ sách
### body
**Các bước thực hiện**
- Tạo schema Mongoose cho `NoSqlBook`.
- Bổ sung trường metadata linh hoạt (ví dụ object `metadata` hoặc mảng `tags`).
- Tạo DTO, service, controller cho nhóm endpoint `/nosql/books`.
- Implement:
  - `POST /nosql/books`
  - `GET /nosql/books`
  - `GET /nosql/books/:id`

**Yêu cầu tối thiểu cần đạt**
- Tạo được ít nhất 1 bản ghi NoSQL bằng API.
- Response NoSQL có metadata linh hoạt với ít nhất 2 key tùy biến.

**Nice to have**
- Hỗ trợ filter theo tag hoặc theo một key trong metadata.
- Chuẩn hóa response shape giữa SQL và NoSQL cho dễ so sánh.

## 3
### title
Kiểm thử bằng curl và viết kết luận so sánh
### body
**Các bước thực hiện**
- Chạy app bằng `nest start --watch`.
- Gọi tuần tự các endpoint SQL và NoSQL bằng `curl`.
- Thu lại response minh họa cho 2 luồng.
- Viết phần so sánh ngắn trong `README.md`:
  - Trường hợp nào bạn ưu tiên SQL.
  - Trường hợp nào bạn ưu tiên NoSQL.
  - Trade-off chính khi bảo trì lâu dài.

**Yêu cầu tối thiểu cần đạt**
- Có thể gọi thành công cả 6 endpoint bắt buộc.
- `README.md` có phần so sánh tối thiểu 6-8 câu, có dẫn chứng từ API bạn vừa chạy.

**Nice to have**
- Thêm bảng so sánh SQL vs NoSQL trong README.
- Thêm 1 endpoint mở rộng (ví dụ search title) cho mỗi luồng để tăng tính thực chiến.

# outputs
## 0
### text
Triển khai được 2 luồng API song song cho cùng nghiệp vụ bằng SQL và NoSQL trên NestJS.
## 1
### text
So sánh được khác biệt mô hình dữ liệu quan hệ và tài liệu dựa trên response API chạy thật.
## 2
### text
Chọn được hướng lưu trữ phù hợp theo bối cảnh nghiệp vụ thay vì dùng một giải pháp chung cho mọi trường hợp.

# references
## 0
### alias
NestJS - Database techniques (TypeORM / Sequelize / Mongoose / Prisma)
### url
https://docs.nestjs.com/techniques/database
## 1
### alias
MongoDB - When to use Document Database
### url
https://www.mongodb.com/resources/basics/databases/nosql-explained
## 2
### alias
PostgreSQL - About
### url
https://www.postgresql.org/about/
## 3
### alias
Redis - Data types overview
### url
https://redis.io/docs/latest/develop/data-types/
## 4
### alias
Elasticsearch - JavaScript client
### url
https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/index.html
## 5
### alias
AWS - NoSQL vs SQL
### url
https://aws.amazon.com/nosql/

# submissions
## 0
### type
githubRepository
### title
Link repository challenge SQL vs NoSQL (context thư viện sách)
### description
Nộp link repository công khai chứa source code NestJS cho challenge này. Repository cần có hướng dẫn chạy, file `README.md` mô tả cách test các endpoint SQL/NoSQL, và kết luận so sánh ngắn giữa 2 hướng lưu trữ.
### score
20
### prompts
#### 0
##### title
Kết nối môi trường và triển khai đầy đủ luồng SQL
##### score
6
##### promptText
Chấm theo Rubric (tối đa 6 điểm):

- Tiêu chí 1 (2 điểm): Dự án chạy được với PostgreSQL thật (không dùng giả lập in-memory).
- Tiêu chí 2 (2 điểm): Có đủ endpoint `POST /sql/books`, `GET /sql/books`, `GET /sql/books/:id`.
- Tiêu chí 3 (2 điểm): Response SQL thể hiện đúng dữ liệu quan hệ sách - tác giả.

Quy tắc chấm: tiêu chí đạt đầy đủ mới nhận điểm; không đạt tiêu chí nào thì tiêu chí đó nhận 0 điểm.
#### 1
##### title
Triển khai đầy đủ luồng NoSQL và metadata linh hoạt
##### score
5
##### promptText
Chấm theo Rubric (tối đa 5 điểm):

- Tiêu chí 1 (2 điểm): Dự án chạy được với MongoDB thật.
- Tiêu chí 2 (2 điểm): Có đủ endpoint `POST /nosql/books`, `GET /nosql/books`, `GET /nosql/books/:id`.
- Tiêu chí 3 (1 điểm): Response NoSQL có metadata linh hoạt với ít nhất 2 key tùy biến.

Quy tắc chấm: tiêu chí đạt đầy đủ mới nhận điểm; không đạt tiêu chí nào thì tiêu chí đó nhận 0 điểm.
#### 2
##### title
Kiểm thử API bằng curl cho cả hai luồng
##### score
5
##### promptText
Chấm theo Rubric (tối đa 5 điểm):

- Tiêu chí 1 (2 điểm): Có hướng dẫn test rõ ràng cho các endpoint bắt buộc.
- Tiêu chí 2 (2 điểm): Có bằng chứng gọi thành công endpoint SQL và NoSQL (curl hoặc API client tương đương).
- Tiêu chí 3 (1 điểm): Kết quả trả về thể hiện rõ khác biệt giữa 2 mô hình dữ liệu.

Quy tắc chấm: tiêu chí đạt đầy đủ mới nhận điểm; không đạt tiêu chí nào thì tiêu chí đó nhận 0 điểm.
#### 3
##### title
README có so sánh SQL vs NoSQL theo bối cảnh bài
##### score
4
##### promptText
Chấm theo Rubric (tối đa 4 điểm):

- Tiêu chí 1 (2 điểm): `README.md` nêu rõ khi nào nên ưu tiên SQL hoặc NoSQL trong context bài.
- Tiêu chí 2 (2 điểm): Có phân tích trade-off thực tế tối thiểu 6-8 câu, không mô tả chung chung.

Quy tắc chấm: tiêu chí đạt đầy đủ mới nhận điểm; không đạt tiêu chí nào thì tiêu chí đó nhận 0 điểm.

# difficulty
easy

# score
20
