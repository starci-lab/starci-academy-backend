# title
Tối ưu API phân trang với Redis Cache và Stampede Control

# description
Đây là challenge thực hành code mức medium về caching trong NestJS. Bạn sẽ triển khai cache-aside cho danh sách sản phẩm GET /products có phân trang và sắp xếp, đồng thời dùng Redis lock để chống cache stampede khi nhiều request đồng thời bị cache miss.

# requirements
## 0
### purpose
Chuẩn hóa cache key theo query để tránh trả nhầm dữ liệu giữa các biến thể request.
### technicalConstraints
Cache key bắt buộc gồm `page`, `limit`, `sort` theo format: `products:list:page={page}:limit={limit}:sort={sort}`; TTL list cache là 90 giây; cache layer bắt buộc dùng `KeyvRedis`.
### proTipsHints
- Đưa logic tạo cache key vào một helper để tránh sai format.
- Chuẩn hóa giá trị mặc định của query trước khi build key.

## 1
### purpose
Triển khai cache-aside cho API danh sách sản phẩm có phân trang.
### technicalConstraints
`GET /products` phải check cache trước; cache miss thì đọc source, set cache, rồi trả response có tối thiểu các field `items`, `page`, `limit`, `total`.
### proTipsHints
- Log rõ key cache đang đọc/ghi để dễ debug.
- Giữ response shape ổn định để kiểm chứng hit/miss dễ hơn.

## 2
### purpose
Giảm tải backend khi burst traffic bằng cơ chế lock chống stampede.
### technicalConstraints
Khi cache miss, chỉ một request được rebuild cache thông qua Redis lock key (TTL lock 3-5 giây); request còn lại phải chờ ngắn rồi đọc lại cache thay vì query source đồng loạt.
### proTipsHints
- Có thể retry theo vòng lặp ngắn (ví dụ 50-100ms/lần, tối đa vài lần).
- Ghi log trạng thái `cache_miss_rebuild` và `cache_wait_for_rebuild` để chứng minh hành vi.

## 3
### purpose
Đảm bảo invalidation đầy đủ khi dữ liệu thay đổi.
### technicalConstraints
Sau `POST /products` hoặc `PATCH /products/:id`, phải xóa toàn bộ key list liên quan đến products (không chỉ một key đơn lẻ).
### proTipsHints
- Dùng prefix rõ ràng cho mọi list key để xóa theo pattern.
- Invalidate chỉ sau khi thao tác ghi thành công.

### forbidden
- Không dùng Redis lock trong khi vẫn claim chống stampede -> **0 prompt concurrency control**.
- Invalidate không đầy đủ khiến data stale sau update -> **0 prompt invalidation correctness**.
- Chỉ cung cấp screenshot, không có raw output/log text -> **0 prompt technical evidence**.
- Dùng một cache key cố định cho mọi query page/limit/sort -> **0 prompt cache key design**.

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
Khởi tạo project và cấu hình Redis cache
### body
### 1. Các bước thực hiện
- Bước 1: Tạo project và cài package cache/redis.
```bash
nest new caching-with-redis-medium
cd caching-with-redis-medium
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
- CacheModule dùng `KeyvRedis` (có thể kèm memory fallback).

### 3. Nice to have
- Tách `REDIS_HOST`, `REDIS_PORT`, `CACHE_TTL` qua env.
- Thêm health check Redis endpoint đơn giản.

## 1
### title
Xây dựng API products có phân trang và sắp xếp
### body
### 1. Các bước thực hiện
- Bước 1: Tạo `ProductModule`, `ProductService`, `ProductController`.
- Bước 2: Dùng mảng in-memory làm data source ban đầu (10-20 item mẫu).
- Bước 3: Tạo `GET /products?page=&limit=&sort=` trả dữ liệu phân trang.
- Bước 4: Tạo `POST /products` và `PATCH /products/:id` để thay đổi dữ liệu.

### 2. Yêu cầu tối thiểu cần đạt
- Endpoint list trả đúng `items`, `page`, `limit`, `total`.
- Query `page`, `limit`, `sort` hoạt động đúng.
- Endpoint ghi dữ liệu hoạt động ổn định.

### 3. Nice to have
- Dùng DTO + class-validator cho query/body.
- Chuẩn hóa enum sort (`price_asc`, `price_desc`, `name_asc`...).

## 2
### title
Tích hợp cache-aside và Redis lock chống stampede
### body
### 1. Các bước thực hiện
- Bước 1: Thiết kế hàm build key theo query params:
  - `products:list:page={page}:limit={limit}:sort={sort}`.
- Bước 2: Trong `GET /products`:
  - đọc cache key trước;
  - nếu hit thì trả luôn;
  - nếu miss thì thử lấy lock key tương ứng;
  - request có lock sẽ query source + set cache + release lock;
  - request không lấy được lock thì chờ ngắn rồi đọc cache lại.
- Bước 3: Ghi log rõ các trạng thái:
  - `cache_hit`
  - `cache_miss_rebuild`
  - `cache_wait_for_rebuild`

### 2. Yêu cầu tối thiểu cần đạt
- Nhiều request đồng thời tại cache miss không làm source bị query trùng quá mức.
- Chỉ một request thực hiện rebuild cache cho cùng key tại cùng thời điểm.
- Có raw log chứng minh đúng 3 trạng thái runtime.

### 3. Nice to have
- Đo đơn giản số lần rebuild thực tế để so với số request đồng thời.
- Đặt timeout/retry rõ ràng để tránh chờ vô hạn.

## 3
### title
Invalidate toàn bộ list cache sau thao tác ghi
### body
### 1. Các bước thực hiện
- Bước 1: Sau `POST /products` và `PATCH /products/:id`, xóa các key list theo prefix `products:list:*`.
- Bước 2: Chạy lại luồng test để verify:
  - trước mutate: `miss -> hit`;
  - sau mutate: lần `GET` đầu phải là miss với dữ liệu mới;
  - lần `GET` tiếp theo là hit.

### 2. Yêu cầu tối thiểu cần đạt
- Dữ liệu trả về sau update/create không stale.
- Các biến thể query (page/limit/sort) không còn dùng cache cũ sau mutate.
- Có bằng chứng raw output/log cho luồng invalidate.

### 3. Nice to have
- Tách helper invalidation để tái sử dụng.
- Bổ sung test case cho nhiều tổ hợp query phổ biến.

## 4
### title
Kiểm thử concurrency bằng script ngắn và log text
### body
### 1. Các bước thực hiện
- Bước 1: Chạy app.
```bash
nest start --watch
```
- Bước 2: Warm-up một key cụ thể và xác nhận hit.
```bash
curl "http://localhost:3000/products?page=1&limit=5&sort=price_desc"
curl "http://localhost:3000/products?page=1&limit=5&sort=price_desc"
```
- Bước 3: Trigger invalidation bằng mutate.
```bash
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -d '{ "name": "Keyboard", "price": 99 }'
```
- Bước 4: Bắn đồng thời nhiều request cùng một key để test stampede control.
```bash
for i in 1 2 3 4 5; do
  curl "http://localhost:3000/products?page=1&limit=5&sort=price_desc" &
done
wait
```

### 2. Yêu cầu tối thiểu cần đạt
- Có log cho thấy chỉ một request rebuild cache tại thời điểm miss.
- Request còn lại chờ/retry rồi đọc từ cache.
- Không có lỗi deadlock hoặc vòng chờ vô hạn.

### 3. Nice to have
- Thêm thời gian phản hồi từng request để so sánh trước/sau cache.
- Bổ sung test thêm cho query key khác (`page=2`, `sort=name_asc`).

# outputs
## 0
### text
Thiết kế đúng cache key theo query params cho endpoint phân trang, tránh trả dữ liệu sai giữa các biến thể request.
## 1
### text
Triển khai được cache-aside read flow hoàn chỉnh với Redis cho API list trong NestJS.
## 2
### text
Áp dụng được cơ chế Redis lock để giảm cache stampede khi có nhiều request đồng thời.
## 3
### text
Thực hiện đúng invalidation theo prefix sau thao tác ghi để tránh stale cache trên nhiều trang/sort.
## 4
### text
Trình bày được bằng chứng kỹ thuật bằng raw output/log cho các trạng thái `cache_hit`, `cache_miss_rebuild`, `cache_wait_for_rebuild`.

# references
## 0
### alias
NestJS Caching
### url
https://docs.nestjs.com/techniques/caching
## 1
### alias
Redis Distributed Locks
### url
https://redis.io/docs/latest/develop/use/patterns/distributed-locks/
## 2
### alias
Keyv
### url
https://www.npmjs.com/package/keyv

# submissions
## 0
### type
githubUrl
### title
Link GitHub Repository
### description
Repo chứa source code + cấu hình Redis + README có phần evidence luồng cache pagination, stampede control, và invalidation.
### score
30
### prompts
#### 0
##### title
Đúng thiết kế cache key và cache-aside flow
##### score
10
##### promptText
Chấm theo Rubric (tối đa 10 điểm):

- Tiêu chí 1 (4 điểm): Cache key có đủ `page`, `limit`, `sort` và được chuẩn hóa nhất quán.
- Tiêu chí 2 (3 điểm): `GET /products` thực hiện đúng luồng cache-aside (hit/miss/set cache).
- Tiêu chí 3 (3 điểm): Response phân trang trả đúng `items`, `page`, `limit`, `total`.

Quy tắc chấm: tiêu chí đạt đầy đủ mới nhận điểm; không đạt tiêu chí nào thì tiêu chí đó nhận 0 điểm.
#### 1
##### title
Đúng cơ chế chống cache stampede
##### score
10
##### promptText
Chấm theo Rubric (tối đa 10 điểm):

- Tiêu chí 1 (4 điểm): Có Redis lock key với TTL ngắn để điều phối request đồng thời khi cache miss.
- Tiêu chí 2 (3 điểm): Có evidence chỉ một request rebuild cache, các request còn lại chờ/retry hợp lý.
- Tiêu chí 3 (3 điểm): Không xuất hiện deadlock/chờ vô hạn trong luồng test concurrency.

Quy tắc chấm: tiêu chí đạt đầy đủ mới nhận điểm; không đạt tiêu chí nào thì tiêu chí đó nhận 0 điểm.
#### 2
##### title
Đúng invalidation và evidence runtime
##### score
10
##### promptText
Chấm theo Rubric (tối đa 10 điểm):

- Tiêu chí 1 (4 điểm): Sau `POST/PATCH` đã xóa toàn bộ list cache liên quan theo prefix phù hợp.
- Tiêu chí 2 (3 điểm): Dữ liệu sau mutate không stale trên các biến thể query chính.
- Tiêu chí 3 (3 điểm): Có raw output/log cho chuỗi hành vi trước/sau invalidate.

Quy tắc chấm: tiêu chí đạt đầy đủ mới nhận điểm; không đạt tiêu chí nào thì tiêu chí đó nhận 0 điểm.

# difficulty
medium

# score
30
