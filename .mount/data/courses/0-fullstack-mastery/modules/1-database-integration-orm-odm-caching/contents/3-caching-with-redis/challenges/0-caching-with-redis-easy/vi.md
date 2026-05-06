# title
Cache danh sách sản phẩm với Redis

# description
Đây là challenge thực hành code về caching trong NestJS. Bạn sẽ tích hợp Redis để cache endpoint GET /products, sau đó xử lý cache invalidation đúng cách khi dữ liệu thay đổi.

# requirements
## 0
### purpose
Khởi tạo project NestJS có Redis thật để làm bài cache.
### technicalConstraints
Redis phải chạy bằng `docker compose`; app kết nối qua `CacheModule` với `KeyvRedis` (không dùng `cache-manager-redis-store`).
### proTipsHints
- Chạy Redis trước khi chạy app để dễ tách lỗi kết nối.
- Đặt key cache rõ ràng (`products:list`) để dễ quản lý.

## 1
### purpose
Triển khai API sản phẩm đơn giản để tập trung vào cơ chế cache.
### technicalConstraints
Bắt buộc có `GET /products` và `POST /products`; dữ liệu nguồn dùng mảng in-memory, không cần DB thật.
### proTipsHints
- Giữ response ổn định để dễ so sánh cache-hit và cache-miss.
- Tạo id tăng dần để verify sản phẩm mới dễ hơn.

## 2
### purpose
Cài cache read-through cho danh sách sản phẩm.
### technicalConstraints
`GET /products` phải check cache trước; cache miss thì đọc data source, set cache TTL 60s rồi trả dữ liệu; cache hit phải trả trực tiếp từ Redis.
### proTipsHints
- Log rõ `cache hit` / `cache miss` để kiểm chứng runtime.
- Dùng cùng một cache key cho toàn bộ list endpoint.

## 3
### purpose
Đảm bảo dữ liệu nhất quán khi có ghi mới.
### technicalConstraints
Sau `POST /products`, phải xoá cache key list để request `GET` tiếp theo lấy dữ liệu mới từ source rồi cache lại.
### proTipsHints
- Invalidate ngay sau khi ghi thành công.
- Kiểm tra lại flow theo thứ tự `miss -> hit -> invalidate -> miss -> hit`.

### forbidden
- Không dùng Redis thật (fallback in-memory cache) -> **0 prompt hạ tầng cache**.
- `GET /products` không check cache trước source -> **0 prompt cache flow**.
- Không xoá cache sau `POST /products` -> **0 prompt invalidation**.
- Dùng screenshot thay raw output/log để chứng minh cache -> **0 prompt evidence**.

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
## 3
### text
npm install

# steps

## 0
### title
Khởi tạo project và cấu hình Redis
### body
### 1. Các bước thực hiện
- Bước 1: Tạo project và cài package cache/redis.
```bash
nest new caching-with-redis-easy
cd caching-with-redis-easy
npm i @nestjs/cache-manager keyv @keyv/redis cacheable
```
- Bước 2: Tạo `docker-compose.yml` để chạy Redis.
```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```
- Bước 3: Chạy Redis và cấu hình `CacheModule` trong `AppModule`.
```bash
docker compose up -d
```

### 2. Yêu cầu tối thiểu cần đạt
- Redis chạy thành công ở `localhost:6379`.
- App boot không lỗi kết nối cache.
- CacheModule đã cấu hình `KeyvRedis` (có thể kèm memory fallback), TTL mặc định 60s.

### 3. Nice to have
- Tách host/port/ttl ra biến môi trường.
- Thêm health check nhanh cho Redis.

## 1
### title
Tạo Product module với dữ liệu in-memory
### body
### 1. Các bước thực hiện
- Bước 1: Tạo `ProductModule`, `ProductService`, `ProductController`.
- Bước 2: Khởi tạo mảng `products` 3 item mẫu trong service.
- Bước 3: Cài `findAll()` trả list và `create()` thêm sản phẩm mới.
- Bước 4: Tạo endpoint `GET /products` và `POST /products`.

### 2. Yêu cầu tối thiểu cần đạt
- `GET /products` trả list 3 sản phẩm ban đầu.
- `POST /products` tạo được sản phẩm mới với id tăng dần.

### 3. Nice to have
- Thêm DTO validate `name`, `price`.
- Chuẩn hóa response shape thống nhất.

## 2
### title
Tích hợp cache và invalidation trong ProductService
### body
### 1. Các bước thực hiện
- Bước 1: Inject `CACHE_MANAGER` vào service.
- Bước 2: Với `findAll()`:
  - đọc key `products:list`;
  - nếu có cache thì trả ngay;
  - nếu không có thì lấy từ mảng, set cache TTL 60s rồi trả.
- Bước 3: Với `create()`, sau khi thêm item thì `del('products:list')`.
- Bước 4: Ghi log rõ `Serving from cache` hoặc `Serving from data source`.

### 2. Yêu cầu tối thiểu cần đạt
- Luồng `GET` đầu là miss, lần sau là hit.
- Sau `POST`, cache key bị xóa.
- `GET` kế tiếp sau `POST` là miss và trả dữ liệu mới nhất.

### 3. Nice to have
- Thêm metric đơn giản cho cache hit ratio.
- Gói cache key thành hằng số để tránh typo.

## 3
### title
Kiểm thử luồng cache bằng curl và log text
### body
### 1. Các bước thực hiện
- Bước 1: Chạy app.
```bash
nest start --watch
```
- Bước 2: Gọi `GET /products` hai lần liên tiếp.
```bash
curl http://localhost:3000/products
curl http://localhost:3000/products
```
- Bước 3: Tạo sản phẩm mới.
```bash
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -d '{ "name": "Monitor", "price": 399 }'
```
- Bước 4: Gọi lại `GET /products` hai lần để verify invalidate + recache.
```bash
curl http://localhost:3000/products
curl http://localhost:3000/products
```

### 2. Yêu cầu tối thiểu cần đạt
- Có raw output/log chứng minh chuỗi `miss -> hit -> invalidate -> miss -> hit`.
- Response sau khi tạo mới có chứa sản phẩm vừa thêm.
- `updated` data không bị stale sau thao tác ghi.

### 3. Nice to have
- Paste thêm log Redis key check (nếu có) để tăng độ tin cậy.
- Bổ sung case chờ 60s để verify key hết hạn theo TTL.

# outputs
## 0
### text
Triển khai được read-through caching với Redis trong NestJS.
## 1
### text
Hiểu rõ cache hit/miss và cách đo kiểm bằng runtime log thực tế.
## 2
### text
Áp dụng đúng cache invalidation khi dữ liệu nguồn thay đổi.
## 3
### text
Trình bày được bằng chứng kỹ thuật qua raw output thay vì mô tả cảm tính.

# references
## 0
### alias
NestJS Caching
### url
https://docs.nestjs.com/techniques/caching
## 1
### alias
Keyv
### url
https://www.npmjs.com/package/keyv
## 2
### alias
Redis Documentation
### url
https://redis.io/docs/

# submissions
## 0
### type
githubUrl
### title
Link GitHub Repository
### description
Repo chứa source code + cấu hình Redis + README có phần evidence luồng `miss/hit/invalidate`.
### score
20
### prompts
#### 0
##### title
Đúng cấu hình Redis và Cache Manager
##### score
10
##### promptText
Chấm theo Rubric (tối đa 10 điểm):

- Tiêu chí 1 (4 điểm): Redis kết nối thành công qua `CacheModule` và `KeyvRedis`.
- Tiêu chí 2 (3 điểm): `findAll()` triển khai đúng read-through cache với TTL 60s.
- Tiêu chí 3 (3 điểm): `create()` xóa đúng cache key sau khi ghi dữ liệu.

Quy tắc chấm: tiêu chí đạt đầy đủ mới nhận điểm; không đạt tiêu chí nào thì tiêu chí đó nhận 0 điểm.
#### 1
##### title
Đúng luồng cache hit và cache invalidation
##### score
10
##### promptText
Chấm theo Rubric (tối đa 10 điểm):

- Tiêu chí 1 (4 điểm): Có evidence `GET` lần 1 là cache miss, lần 2 là cache hit.
- Tiêu chí 2 (3 điểm): Sau `POST`, cache bị invalidate và `GET` kế tiếp là miss.
- Tiêu chí 3 (3 điểm): Dữ liệu trả về sau invalidate chứa sản phẩm mới nhất.

Quy tắc chấm: tiêu chí đạt đầy đủ mới nhận điểm; không đạt tiêu chí nào thì tiêu chí đó nhận 0 điểm.

# difficulty
easy

# score
20
