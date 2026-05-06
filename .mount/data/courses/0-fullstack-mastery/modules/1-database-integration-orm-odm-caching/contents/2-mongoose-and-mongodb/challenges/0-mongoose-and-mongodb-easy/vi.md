# title
Blog API với Mongoose và MongoDB

# description
Đây là challenge thực hành code với NestJS, Mongoose và MongoDB. Bạn sẽ xây Blog API cơ bản để hiểu schema linh hoạt, truy vấn document và cách cập nhật dữ liệu an toàn.

# requirements
## 0
### purpose
Dựng project NestJS kết nối MongoDB thật để triển khai CRUD blog theo document model.
### technicalConstraints
Phải chạy MongoDB bằng `docker compose`, kết nối qua `MongooseModule.forRoot`, và dùng database `blog`.
### proTipsHints
- Chạy Mongo trước khi start app để tách lỗi hạ tầng và lỗi code.
- Giữ env rõ ràng ngay từ đầu để tránh sửa connection string nhiều lần.

## 1
### purpose
Định nghĩa schema `Post` đúng chuẩn Mongoose, vừa có cấu trúc vừa giữ tính linh hoạt của MongoDB.
### technicalConstraints
`PostSchema` bắt buộc có: `title` (required, index), `content` (required), `author` (required), `tags` (`[String]`), `metadata` (Mixed/Object), `timestamps: true`.
### proTipsHints
- Dùng `SchemaFactory.createForClass(Post)` để đồng bộ decorator với schema runtime.
- Trường `metadata` nên giới hạn ở use-case có lý do rõ ràng, tránh lạm dụng.

## 2
### purpose
Triển khai API cơ bản cho luồng tạo, đọc danh sách, đọc chi tiết và cập nhật bài viết.
### technicalConstraints
Phải có endpoint: `POST /posts`, `GET /posts`, `GET /posts/:id`, `PATCH /posts/:id`; `GET /posts` sắp xếp `createdAt` giảm dần; endpoint chi tiết/cập nhật phải trả `NotFoundException` khi id không tồn tại.
### proTipsHints
- Dùng `.exec()` cho query để hành vi Promise nhất quán.
- Với update, dùng `{ new: true }` để trả document sau cập nhật.

## 3
### purpose
Chứng minh API chạy đúng bằng evidence đầu ra thật.
### technicalConstraints
Bắt buộc dùng curl để kiểm thử, paste raw output JSON/terminal log, và thể hiện rõ trường `updatedAt` thay đổi sau update.
### proTipsHints
- Tạo 2 bài viết có `metadata` khác cấu trúc để chứng minh tính linh hoạt.
- Lưu lại id từ response tạo mới để test flow update nhanh hơn.

### forbidden
- Dùng `@Schema()` nhưng không bật `timestamps: true` -> **0 prompt schema**.
- Không tạo index cho `title` -> **0 prompt schema**.
- `GET /posts` không sort `createdAt` giảm dần -> **0 prompt endpoint**.
- Yêu cầu screenshot thay cho raw output text -> **0 prompt evidence**.

# prerequisites
## 0
### text
Node.js >= 18
## 1
### text
NestJS CLI
## 2
### text
Docker (để chạy MongoDB)
## 3
### text
npm install

# steps

## 0
### title
Khởi tạo project và cấu hình MongoDB
### body
### 1. Các bước thực hiện
- Bước 1: Tạo project mới bằng NestJS CLI:
    ```bash
    nest new mongoose-and-mongodb-easy
    ```
- Bước 2: Di chuyển vào thư mục project:
    ```bash
    cd mongoose-and-mongodb-easy
    ```
- Bước 3: Cài đặt các dependency cần thiết:
    ```bash
    npm install @nestjs/mongoose mongoose
    ```
- Bước 4: Tạo file `docker-compose.yml` tại thư mục gốc để khởi động MongoDB:
    ```yaml
    services:
      mongo:
        image: mongo:7
        environment:
          MONGO_INITDB_ROOT_USERNAME: mongo
          MONGO_INITDB_ROOT_PASSWORD: mongo
        ports:
          - "27017:27017"
    ```
- Bước 5: Khởi động MongoDB:
    ```bash
    docker compose up -d
    ```
- Bước 6: Cấu hình `MongooseModule.forRoot()` trong `AppModule` với connection string `mongodb://mongo:mongo@localhost:27017/blog?authSource=admin`.

### 2. Yêu cầu tối thiểu cần đạt
- MongoDB chạy thành công qua `docker compose up -d`.
- Ứng dụng NestJS kết nối được tới database `blog`.
- App chạy không báo lỗi kết nối Mongoose.

### 3. Nice to have
- Tách connection string sang biến môi trường `MONGO_URI`.
- Thêm health endpoint kiểm tra trạng thái kết nối DB.

## 1
### title
Định nghĩa Schema và Model
### body
### 1. Các bước thực hiện
- Bước 1: Tạo file `post.schema.ts`, định nghĩa `PostSchema` với `@Schema({ timestamps: true })`.
- Bước 2: Thêm các trường `title`, `content`, `author`, `tags`, `metadata` với đúng kiểu và constraint.
- Bước 3: Export schema bằng `SchemaFactory.createForClass(Post)`.
- Bước 4: Đăng ký schema trong module bằng `MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }])`.

### 2. Yêu cầu tối thiểu cần đạt
- `PostSchema` có đủ field bắt buộc theo đề bài.
- `title` có index và các field required hoạt động đúng.
- `timestamps` tự động tạo `createdAt`, `updatedAt`.

### 3. Nice to have
- Thêm validation độ dài tối thiểu cho `title`, `content`.
- Tách type rõ cho `metadata` theo từng use-case phổ biến.

## 2
### title
Xây dựng Service và Controller
### body
### 1. Các bước thực hiện
- Bước 1: Tạo `PostService` và inject Model bằng `@InjectModel(Post.name)`.
- Bước 2: Cài đặt `create`, `findAll`, `findOne`, `update` bằng các method phù hợp của Mongoose Model.
- Bước 3: Với `findAll`, bắt buộc sort `createdAt: -1`.
- Bước 4: Với `findOne` và `update`, ném `NotFoundException` khi không tìm thấy document.
- Bước 5: Tạo `PostController` với 4 endpoint `POST/GET/GET:id/PATCH:id`.

### 2. Yêu cầu tối thiểu cần đạt
- 4 endpoint hoạt động đúng theo contract.
- `GET /posts` trả danh sách bài mới nhất trước.
- `PATCH /posts/:id` trả document mới sau cập nhật.

### 3. Nice to have
- Thêm DTO + `ValidationPipe` cho request body.
- Tách mapper response để không lộ field nội bộ nếu có.

## 3
### title
Kiểm thử các endpoint
### body
### 1. Các bước thực hiện
- Bước 1: Chạy ứng dụng:
    ```bash
    nest start --watch
    ```
- Bước 2: Tạo bài viết mới với tags và metadata linh hoạt:
    ```bash
    curl -X POST http://localhost:3000/posts \
      -H "Content-Type: application/json" \
      -d '{
        "title": "Getting Started with MongoDB",
        "content": "MongoDB is a document database...",
        "author": "Jane Doe",
        "tags": ["mongodb", "nosql", "tutorial"],
        "metadata": { "readTime": 5, "featured": true, "source": "internal" }
      }'
    ```
- Bước 3: Tạo thêm bài viết thứ 2 với metadata khác cấu trúc:
    ```bash
    curl -X POST http://localhost:3000/posts \
      -H "Content-Type: application/json" \
      -d '{
        "title": "Mongoose Best Practices",
        "content": "Schema design is crucial...",
        "author": "Jane Doe",
        "tags": ["mongoose", "best-practices"],
        "metadata": { "series": "MongoDB Mastery", "part": 2 }
      }'
    ```
- Bước 4: Lấy danh sách bài viết (xác nhận sắp xếp theo createdAt giảm dần):
    ```bash
    curl http://localhost:3000/posts
    ```
- Bước 5: Cập nhật bài viết, thêm tag mới:
    ```bash
    curl -X PATCH http://localhost:3000/posts/<id> \
      -H "Content-Type: application/json" \
      -d '{
        "tags": ["mongodb", "nosql", "tutorial", "beginner"]
      }'
    ```

### 2. Yêu cầu tối thiểu cần đạt
- `POST /posts` trả document mới có `_id`, `createdAt`, `updatedAt`.
- `GET /posts` trả danh sách theo thứ tự mới nhất trước.
- `PATCH /posts/:id` cập nhật thành công và `updatedAt` thay đổi.
- 2 bài viết có `metadata` khác cấu trúc đều lưu thành công.

### 3. Nice to have
- Bổ sung case 404 cho `GET /posts/:id` và `PATCH /posts/:id` với id không tồn tại.
- Paste thêm raw log Mongo query để đối chiếu khi review.

# outputs
## 0
### text
Xây được Blog API cơ bản bằng NestJS + Mongoose với schema rõ ràng và MongoDB chạy thật.
## 1
### text
Hiểu cách dùng trường linh hoạt (`metadata`) trong MongoDB mà vẫn giữ các ràng buộc cần thiết.
## 2
### text
Triển khai và kiểm thử được flow tạo, đọc danh sách, đọc chi tiết, cập nhật document.
## 3
### text
Biết trình bày bằng chứng kỹ thuật bằng raw output thay vì mô tả chung chung.

# references
## 0
### alias
NestJS Mongoose Integration
### url
https://docs.nestjs.com/techniques/mongodb
## 1
### alias
Mongoose Schemas Guide
### url
https://mongoosejs.com/docs/guide.html
## 2
### alias
Mongoose Queries
### url
https://mongoosejs.com/docs/queries.html

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
Đúng cấu trúc Schema và Model
##### score
10
##### promptText
Chấm theo Rubric (tối đa 10 điểm):

- Tiêu chí 1 (4 điểm): `PostSchema` có đủ các field bắt buộc và đúng kiểu dữ liệu.
- Tiêu chí 2 (3 điểm): `title` có index, các field required hoạt động đúng.
- Tiêu chí 3 (3 điểm): Schema đăng ký đúng trong module và timestamps hoạt động.

Quy tắc chấm: tiêu chí đạt đầy đủ mới nhận điểm; không đạt tiêu chí nào thì tiêu chí đó nhận 0 điểm.
#### 1
##### title
Đúng kết quả endpoint
##### score
10
##### promptText
Chấm theo Rubric (tối đa 10 điểm):

- Tiêu chí 1 (4 điểm): `POST /posts` tạo được bài viết mới với `tags` và `metadata` linh hoạt.
- Tiêu chí 2 (3 điểm): `GET /posts` trả danh sách đúng thứ tự `createdAt` giảm dần.
- Tiêu chí 3 (3 điểm): `PATCH /posts/:id` cập nhật thành công và `updatedAt` thay đổi.

Quy tắc chấm: tiêu chí đạt đầy đủ mới nhận điểm; không đạt tiêu chí nào thì tiêu chí đó nhận 0 điểm.

# difficulty
easy

# score
20
