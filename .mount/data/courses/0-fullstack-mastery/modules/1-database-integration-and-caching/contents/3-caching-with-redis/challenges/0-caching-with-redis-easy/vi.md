# title
<!-- @starci/seperator -->
Cache danh sách sản phẩm với Redis
<!-- @starci/seperator -->
# description
<!-- @starci/seperator -->
Đây là challenge thực hành code về caching trong **NestJS**. Bạn sẽ tích hợp **Redis** để cache endpoint `GET /products`, sau đó xử lý cache invalidation đúng cách khi dữ liệu thay đổi.
<!-- @starci/seperator -->
# requirements
## 0
### purpose
<!-- @starci/seperator -->
Khởi tạo project NestJS có **Redis** thật làm cache backend cho bài thực hành.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
Redis phải chạy bằng `docker compose`; app kết nối qua `CacheModule` với `KeyvRedis` (không dùng `cache-manager-redis-store`).
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Chạy Redis trước khi chạy app để dễ tách lỗi kết nối.
- Đặt key cache rõ ràng (`products:list`) để dễ quản lý.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
6
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Rubric chấm điểm (tối đa 6):

- Tiêu chí A (2 điểm): Redis chạy thật qua `docker compose`, app boot thành công và kết nối được Redis (không fallback in-memory).
- Tiêu chí B (2 điểm): `CacheModule` được cấu hình đúng với `KeyvRedis` (Keyv + @keyv/redis), TTL mặc định 60s.
- Tiêu chí C (2 điểm): Cấu hình tách được host/port/TTL qua env hoặc constant tập trung, không hard-code rải rác.

Quy tắc chấm: mỗi tiêu chí làm đúng trọn vẹn thì nhận đủ điểm tiêu chí đó; thiếu/sai tiêu chí nào thì tiêu chí đó nhận 0 điểm.
<!-- @starci/seperator -->
## 1
### purpose
<!-- @starci/seperator -->
Triển khai API sản phẩm tối giản để tập trung vào cơ chế cache.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
Bắt buộc có `GET /products` và `POST /products`; data source là mảng in-memory, không cần DB thật. Response shape ổn định và có `id` tăng dần.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Giữ response ổn định để dễ so sánh cache-hit và cache-miss.
- Tạo id tăng dần để verify sản phẩm mới dễ hơn.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
0
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Sử dụng chung với yêu cầu 2 (cache-aside flow + endpoint contract `GET /products` và `POST /products`).
<!-- @starci/seperator -->
## 2
### purpose
<!-- @starci/seperator -->
Cài cache-aside cho danh sách sản phẩm và đảm bảo invalidation đúng khi có ghi mới.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
`GET /products` phải check cache trước; cache miss thì đọc data source, `set` cache TTL 60s rồi trả dữ liệu; cache hit phải trả trực tiếp từ Redis. Sau `POST /products`, phải `del('products:list')` để request `GET` tiếp theo lấy dữ liệu mới rồi cache lại.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Log rõ `cache hit` / `cache miss` để kiểm chứng runtime.
- Dùng cùng một cache key cho toàn bộ list endpoint.
- Invalidate ngay sau khi ghi thành công, không delay.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
9
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Rubric chấm điểm (tối đa 9):

- Tiêu chí A (3 điểm): `GET /products` triển khai đúng cache-aside (check cache → miss thì đọc source + `set` TTL 60s → hit thì trả từ Redis), có log phân biệt hit/miss.
- Tiêu chí B (2 điểm): `POST /products` thêm item mới và xoá đúng cache key `products:list` ngay sau khi ghi thành công.
- Tiêu chí C (2 điểm): Endpoint trả đúng contract (list cho `GET`, item mới cho `POST`) và response shape ổn định giữa hit/miss/sau-invalidate.
- Tiêu chí D (2 điểm): Chuỗi `miss -> hit -> invalidate -> miss -> hit` chạy đúng end-to-end, không stale data sau ghi.

Quy tắc chấm: mỗi tiêu chí làm đúng trọn vẹn thì nhận đủ điểm tiêu chí đó; thiếu/sai tiêu chí nào thì tiêu chí đó nhận 0 điểm.
<!-- @starci/seperator -->
## 3
### purpose
<!-- @starci/seperator -->
Chứng minh hành vi cache bằng raw output thật và viết README đúng 6 section.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
README ở repo phải có đủ 6 section: Challenge description, How to run, Architecture/Stack, Smoke Test (paste raw request/response của chuỗi `miss -> hit -> invalidate -> miss -> hit`), Code Execution Trace (≥3 điểm chạm `file:line -> method()`), Design Decisions.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Paste raw `curl` output thật, không paraphrase, không screenshot.
- Trong Code Execution Trace nêu rõ điểm chạm `CacheInterceptor` hoặc `CACHE_MANAGER.get/set/del`.
<!-- @starci/seperator -->
### forbidden
<!-- @starci/seperator -->
- Không dùng Redis thật, fallback in-memory cache để demo -> **0 prompt cache infra**.
- `GET /products` không check cache trước data source -> **0 prompt cache flow**.
- Không xoá cache sau `POST /products`, dữ liệu trả về vẫn stale -> **0 prompt invalidation**.
- Dùng screenshot thay raw output/log để chứng minh cache -> **0 prompt evidence**.
- Fabricate raw output (paste log không phải do app sinh ra) -> **0 whole challenge**.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
5
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Rubric chấm điểm (tối đa 5):

- Tiêu chí A (2 điểm): README có đủ 6 section bắt buộc (Challenge description, How to run, Architecture/Stack, Smoke Test, Code Execution Trace, Design Decisions).
- Tiêu chí B (2 điểm): Smoke Test paste raw output thật cho chuỗi `miss -> hit -> invalidate -> miss -> hit`, có log phân biệt hit/miss.
- Tiêu chí C (1 điểm): Code Execution Trace có ≥3 điểm chạm `file:line -> method()` thật, không placeholder.

Quy tắc chấm: mỗi tiêu chí làm đúng trọn vẹn thì nhận đủ điểm tiêu chí đó; thiếu/sai tiêu chí nào thì tiêu chí đó nhận 0 điểm.
<!-- @starci/seperator -->
# outputs
## 0
### text
<!-- @starci/seperator -->
Bạn triển khai được read-through caching với **Redis** trong **NestJS** qua `CacheModule` + `KeyvRedis`.
<!-- @starci/seperator -->
## 1
### text
<!-- @starci/seperator -->
Bạn hiểu rõ cache hit/miss và cách đo kiểm bằng runtime log thực tế.
<!-- @starci/seperator -->
## 2
### text
<!-- @starci/seperator -->
Bạn áp dụng đúng cache invalidation khi dữ liệu nguồn thay đổi.
<!-- @starci/seperator -->
## 3
### text
<!-- @starci/seperator -->
Bạn trình bày được bằng chứng kỹ thuật qua raw output thay vì mô tả cảm tính.
<!-- @starci/seperator -->
# prerequisites
## 0
### text
<!-- @starci/seperator -->
Node.js >= 18
<!-- @starci/seperator -->
## 1
### text
<!-- @starci/seperator -->
NestJS CLI (`npm i -g @nestjs/cli`)
<!-- @starci/seperator -->
## 2
### text
<!-- @starci/seperator -->
Docker Desktop (để chạy Redis)
<!-- @starci/seperator -->
# steps

## 0
### title
<!-- @starci/seperator -->
Khởi tạo project và cấu hình Redis cache
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Các bước thực hiện
- **Bước 1:** Tạo project và cài package cache/redis.
  ```bash
  nest new caching-with-redis-easy
  cd caching-with-redis-easy
  npm i @nestjs/cache-manager keyv @keyv/redis cacheable
  ```
- **Bước 2:** Tạo `docker-compose.yml` để chạy Redis.
  ```yaml
  services:
    redis:
      image: redis:7-alpine
      ports:
        - "6379:6379"
  ```
- **Bước 3:** Chạy Redis và cấu hình `CacheModule` trong `AppModule` với `KeyvRedis` + TTL 60s.
  ```bash
  docker compose up -d
  ```

### 2. Yêu cầu tối thiểu cần đạt
- Redis chạy thành công ở `localhost:6379`.
- App boot không lỗi kết nối cache.
- `CacheModule` đã cấu hình `KeyvRedis`, TTL mặc định 60s.

### 3. Nice to have
- Tách host/port/TTL ra biến môi trường qua `ConfigModule`.
- Thêm health check nhanh cho Redis.

### codeImplementations
#### 0
##### lang
typescript
##### guide
**Thư viện chính:** **`@nestjs/cache-manager`** + **`@keyv/redis`** (`keyv`, `cacheable`) — `CacheModule` async config dùng `KeyvRedis` làm store.

**Mapping API:**
- `cache-manager-redis-store` (legacy) -> `KeyvRedis` qua `Keyv`.
- `register({ store, ttl })` -> `registerAsync({ useFactory: () => ({ stores: [new Keyv(new KeyvRedis(url))], ttl }) })`.

**Khác biệt/gotcha:**
- TTL ở `cache-manager` là millisecond (60000), khác `ioredis` `EX` (giây) và `node-redis` `PX` (ms).
- `CacheModule.registerAsync` phải `isGlobal: true` nếu muốn `CACHE_MANAGER` inject ở module khác mà không re-import.
##### example
```typescript
import { CacheModule } from "@nestjs/cache-manager"
import Keyv from "keyv"
import KeyvRedis from "@keyv/redis"

@Module({
    imports: [
        CacheModule.registerAsync({
            isGlobal: true,
            useFactory: () => ({
                stores: [new Keyv(new KeyvRedis("redis://localhost:6379"))],
                ttl: 60_000,
            }),
        }),
    ],
})
export class AppModule {}
```
#### 1
##### lang
csharp
##### guide
**Thư viện chính:** **`Microsoft.Extensions.Caching.StackExchangeRedis`** (`IDistributedCache`) — ASP.NET Core distributed cache backed by Redis.

**API mapping:**
- `CacheModule.register` -> `services.AddStackExchangeRedisCache(opt => opt.Configuration = "localhost:6379")`.
- `CACHE_MANAGER.get/set` -> `IDistributedCache.GetStringAsync` + `SetStringAsync` với `DistributedCacheEntryOptions`.

**Differences / gotchas:**
- `IDistributedCache` không serialize POCO — luôn `JsonSerializer.Serialize/Deserialize`.
- TTL config qua `AbsoluteExpirationRelativeToNow` chứ không phải global TTL.
##### example
```csharp
builder.Services.AddStackExchangeRedisCache(opt =>
{
    opt.Configuration = "localhost:6379";
    opt.InstanceName = "products:";
});
```
#### 2
##### lang
go
##### guide
**Thư viện chính:** **`github.com/redis/go-redis/v9`** + **`github.com/gin-gonic/gin`** — client native, không có DI container, cache-aside viết tay.

**API mapping:**
- `CacheModule` -> singleton `*redis.Client` ở `main.go`, truyền vào handler qua closure.
- `CACHE_MANAGER.get/set` -> `rdb.Get(ctx, key)` + `rdb.Set(ctx, key, val, ttl)`.

**Differences / gotchas:**
- `go-redis` trả `redis.Nil` khi key không tồn tại — phải `errors.Is(err, redis.Nil)` để phân biệt miss vs system error.
- TTL là `time.Duration` (vd `60*time.Second`).
##### example
```go
rdb := redis.NewClient(&redis.Options{Addr: "localhost:6379"})
ctx := context.Background()
if err := rdb.Set(ctx, "products:list", payload, 60*time.Second).Err(); err != nil {
    log.Fatal(err)
}
```
#### 3
##### lang
java
##### guide
**Thư viện chính:** **`spring-boot-starter-data-redis`** + **Spring Cache** abstraction — `@EnableCaching` + `RedisCacheManager`.

**API mapping:**
- `CacheModule` -> `@EnableCaching` + auto-config `RedisCacheManager`.
- `CACHE_MANAGER.get/set` -> `@Cacheable` + `@CacheEvict` trên service method.

**Differences / gotchas:**
- TTL cấu hình qua `RedisCacheConfiguration.entryTtl(Duration.ofSeconds(60))`, không per `@Cacheable`.
- `@CacheEvict(beforeInvocation = true)` evict trước khi method chạy, tránh stale key sau exception.
##### example
```java
@Configuration
@EnableCaching
public class RedisConfig {
    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory cf) {
        return RedisCacheManager.builder(cf)
            .cacheDefaults(RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofSeconds(60)))
            .build();
    }
}
```
<!-- @starci/seperator -->
## 1
### title
<!-- @starci/seperator -->
Tạo Product module với dữ liệu in-memory
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Các bước thực hiện
- **Bước 1:** Tạo `ProductModule`, `ProductService`, `ProductController`.
- **Bước 2:** Khởi tạo mảng `products` 3 item mẫu trong service.
- **Bước 3:** Cài `findAll()` trả list và `create()` thêm sản phẩm mới với id tăng dần.
- **Bước 4:** Tạo endpoint `GET /products` và `POST /products`.

### 2. Yêu cầu tối thiểu cần đạt
- `GET /products` trả list 3 sản phẩm ban đầu.
- `POST /products` tạo được sản phẩm mới với id tăng dần.
- Response shape ổn định giữa các lần gọi.

### 3. Nice to have
- Thêm DTO validate `name`, `price` qua `class-validator`.
- Chuẩn hoá response shape thống nhất.
<!-- @starci/seperator -->
## 2
### title
<!-- @starci/seperator -->
Tích hợp cache-aside và invalidation trong ProductService
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Các bước thực hiện
- **Bước 1:** Inject `CACHE_MANAGER` vào `ProductService`.
- **Bước 2:** Với `findAll()`:
  - đọc key `products:list`;
  - nếu có cache thì trả ngay (log `cache hit`);
  - nếu không có thì lấy từ mảng, `set` cache TTL 60s rồi trả (log `cache miss`).
- **Bước 3:** Với `create()`, sau khi thêm item thì gọi `cacheManager.del('products:list')`.
- **Bước 4:** Ghi log rõ `Serving from cache` hoặc `Serving from data source` để verify runtime.

### 2. Yêu cầu tối thiểu cần đạt
- Luồng `GET` đầu là miss, lần sau là hit.
- Sau `POST`, cache key bị xoá.
- `GET` kế tiếp sau `POST` là miss và trả dữ liệu mới nhất.

### 3. Nice to have
- Thêm metric đơn giản cho cache hit ratio.
- Gói cache key thành hằng số để tránh typo.

### codeImplementations
#### 0
##### lang
typescript
##### guide
**Thư viện chính:** **`@nestjs/cache-manager`** (`CACHE_MANAGER`) — inject vào service để gọi `get`/`set`/`del` Cache-Aside thủ công.

**Mapping API:**
- `CacheInterceptor` (decorator-driven) -> `CACHE_MANAGER.get/set/del` (programmatic).
- `@CacheTTL` -> tham số `ttl` (ms) ở `set`.

**Khác biệt/gotcha:**
- `cacheManager.set(key, value, ttl)` — `ttl` là **millisecond** (60000), không phải giây.
- Khi cần xoá nhiều key cùng prefix → dùng `cacheManager.store.keys()` rồi `del` từng key (Keyv không hỗ trợ pattern delete native).
##### example
```typescript
@Injectable()
export class ProductService {
    private readonly key = "products:list"
    constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}

    async findAll(): Promise<Product[]> {
        const hit = await this.cache.get<Product[]>(this.key)
        if (hit) { this.logger.log("Serving from cache"); return hit }
        this.logger.log("Serving from data source")
        await this.cache.set(this.key, this.products, 60_000)
        return this.products
    }

    async create(dto: CreateProductDto): Promise<Product> {
        const product = { id: this.nextId(), ...dto }
        this.products.push(product)
        await this.cache.del(this.key)
        return product
    }
}
```
#### 1
##### lang
csharp
##### guide
**Thư viện chính:** **`IDistributedCache`** — Cache-Aside thủ công, tự serialize JSON.

**API mapping:**
- `CACHE_MANAGER.get/set/del` -> `GetStringAsync` + `SetStringAsync` + `RemoveAsync`.

**Differences / gotchas:**
- TTL qua `DistributedCacheEntryOptions.AbsoluteExpirationRelativeToNow`.
- Luôn null-check `GetStringAsync` trước khi `Deserialize`.
##### example
```csharp
public async Task<List<Product>> FindAll()
{
    var raw = await _cache.GetStringAsync("products:list");
    if (raw is not null) return JsonSerializer.Deserialize<List<Product>>(raw)!;
    await _cache.SetStringAsync("products:list",
        JsonSerializer.Serialize(_products),
        new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(60) });
    return _products;
}
```
#### 2
##### lang
go
##### guide
**Thư viện chính:** **`go-redis/v9`** — Cache-Aside qua helper hàm vì Go không có decorator.

**API mapping:**
- `CACHE_MANAGER.get/set/del` -> `rdb.Get/Set/Del`.

**Differences / gotchas:**
- Phải `errors.Is(err, redis.Nil)` để phân biệt miss vs system error.
- `rdb.Set(ctx, key, val, ttl)` — `ttl` là `time.Duration`.
##### example
```go
func (s *ProductService) FindAll(ctx context.Context) ([]Product, error) {
    raw, err := s.rdb.Get(ctx, "products:list").Bytes()
    if err == nil {
        var p []Product
        if json.Unmarshal(raw, &p) == nil { return p, nil }
    }
    if b, err := json.Marshal(s.products); err == nil {
        s.rdb.Set(ctx, "products:list", b, 60*time.Second)
    }
    return s.products, nil
}
```
#### 3
##### lang
java
##### guide
**Thư viện chính:** **Spring Cache** (`@Cacheable`, `@CacheEvict`) với Redis backend.

**API mapping:**
- `CACHE_MANAGER.get/set` -> `@Cacheable(value = "products:list")`.
- `CACHE_MANAGER.del` -> `@CacheEvict(value = "products:list", allEntries = true)`.

**Differences / gotchas:**
- `@Cacheable` chỉ cache theo method args + name — service code không thấy Redis trực tiếp.
- `@CacheEvict(beforeInvocation = false)` (default) evict sau khi method chạy thành công.
##### example
```java
@Service
public class ProductService {
    @Cacheable(value = "products:list")
    public List<Product> findAll() { return this.products; }

    @CacheEvict(value = "products:list", allEntries = true)
    public Product create(CreateProductDto dto) {
        var p = new Product(nextId(), dto.name(), dto.price());
        this.products.add(p);
        return p;
    }
}
```
<!-- @starci/seperator -->
## 3
### title
<!-- @starci/seperator -->
Smoke test cache flow và viết README với raw output
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Các bước thực hiện
- **Bước 1:** Chạy app.
  ```bash
  nest start --watch
  ```
- **Bước 2:** Gọi `GET /products` hai lần liên tiếp.
  ```bash
  curl http://localhost:3000/products
  curl http://localhost:3000/products
  ```
- **Bước 3:** Tạo sản phẩm mới.
  ```bash
  curl -X POST http://localhost:3000/products \
    -H "Content-Type: application/json" \
    -d '{ "name": "Monitor", "price": 399 }'
  ```
- **Bước 4:** Gọi lại `GET /products` hai lần để verify invalidate + recache.
  ```bash
  curl http://localhost:3000/products
  curl http://localhost:3000/products
  ```
- **Bước 5:** Viết README repo với 6 section: Challenge description, How to run, Architecture/Stack, Smoke Test (paste raw output Bước 2-4), Code Execution Trace (≥3 điểm chạm `file:line -> method()`), Design Decisions.

### 2. Yêu cầu tối thiểu cần đạt
- Raw output/log chứng minh chuỗi `miss -> hit -> invalidate -> miss -> hit`.
- Response sau khi tạo mới có chứa sản phẩm vừa thêm (`Monitor`).
- README có đủ 6 section, Code Execution Trace có ≥3 điểm chạm thật.

### 3. Nice to have
- Paste thêm log Redis key check (`redis-cli KEYS 'products:*'`) để tăng độ tin cậy.
- Bổ sung case chờ 60s để verify key hết hạn theo TTL.
<!-- @starci/seperator -->
# references
## 0
### alias
<!-- @starci/seperator -->
NestJS Caching
<!-- @starci/seperator -->
### url
<!-- @starci/seperator -->
https://docs.nestjs.com/techniques/caching
<!-- @starci/seperator -->

## 1
### alias
<!-- @starci/seperator -->
Keyv Redis Store
<!-- @starci/seperator -->
### url
<!-- @starci/seperator -->
https://www.npmjs.com/package/@keyv/redis
<!-- @starci/seperator -->

## 2
### alias
<!-- @starci/seperator -->
Redis Documentation
<!-- @starci/seperator -->
### url
<!-- @starci/seperator -->
https://redis.io/docs/
<!-- @starci/seperator -->

# submissions
## 0
### type
<!-- @starci/seperator -->
githubUrl
<!-- @starci/seperator -->
### title
<!-- @starci/seperator -->
Link GitHub Repository
<!-- @starci/seperator -->
### description
<!-- @starci/seperator -->
Repo public chứa source code NestJS + `docker-compose.yml` cho Redis + README đủ 6 section (Challenge description, How to run, Architecture/Stack, Smoke Test với raw output `miss -> hit -> invalidate -> miss -> hit`, Code Execution Trace ≥3 điểm chạm, Design Decisions).
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
20
<!-- @starci/seperator -->

# difficulty
<!-- @starci/seperator -->
easy
<!-- @starci/seperator -->

# score
<!-- @starci/seperator -->
20
<!-- @starci/seperator -->
