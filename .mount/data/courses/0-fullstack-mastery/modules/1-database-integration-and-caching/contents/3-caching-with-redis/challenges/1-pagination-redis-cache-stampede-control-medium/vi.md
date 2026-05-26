# title
<!-- @starci/seperator -->
Cache phân trang Redis với Stampede Control bằng SETNX lock
<!-- @starci/seperator -->
# description
<!-- @starci/seperator -->
Challenge medium phát triển từ bản EASY. Bạn triển khai **cache-aside** cho `GET /products` có **pagination** + **sort**, mỗi tổ hợp query là một key Redis riêng, đồng thời chống **cache stampede** bằng Redis **SETNX lock** với TTL ngắn, và invalidate đúng theo prefix sau mọi thao tác ghi.
<!-- @starci/seperator -->
# requirements
## 0
### purpose
<!-- @starci/seperator -->
Chuẩn hóa cache key theo query params để tránh trộn dữ liệu giữa các biến thể request.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
Cache key bắt buộc theo format `products:list:page={page}:limit={limit}:sort={sort}`; chuẩn hóa default `page=1`, `limit=10`, `sort=price_asc` trước khi build key; TTL list cache 90s; cache backend bắt buộc dùng `KeyvRedis` (không in-memory).
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Đưa logic build key vào helper function `buildListKey(query)` để tránh sai format.
- Sort enum hữu hạn (`price_asc | price_desc | name_asc | name_desc`) — reject query khác.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
10
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Rubric chấm điểm (tối đa 10):

- Tiêu chí A (3 điểm): Helper `buildListKey(query)` chuẩn hóa default + reject sort không thuộc enum, mỗi tổ hợp `(page, limit, sort)` map về duy nhất 1 key.
- Tiêu chí B (3 điểm): Format key đúng `products:list:page={page}:limit={limit}:sort={sort}` (không dùng JSON stringify, không dùng `crypto.hash` thay format human-readable).
- Tiêu chí C (2 điểm): TTL list cache cấu hình 90s qua constant tập trung, không hard-code rải rác.
- Tiêu chí D (2 điểm): Cache backend là `KeyvRedis` thật, app boot không fallback in-memory.

Quy tắc chấm: mỗi tiêu chí làm đúng trọn vẹn thì nhận đủ điểm tiêu chí đó; thiếu/sai tiêu chí nào thì tiêu chí đó nhận 0 điểm.
<!-- @starci/seperator -->
## 1
### purpose
<!-- @starci/seperator -->
Triển khai cache-aside cho endpoint `GET /products` có pagination + sort.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
`GET /products?page=&limit=&sort=` phải check cache trước; cache miss thì đọc data source, `set` cache TTL 90s rồi trả response shape ổn định gồm `items`, `page`, `limit`, `total`; cache hit phải trả trực tiếp từ Redis không chạm data source.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Log rõ `cache_hit` kèm key đang đọc để dễ debug.
- Giữ response shape ổn định giữa hit/miss để smoke test diff dễ.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
0
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Sử dụng chung với yêu cầu 2 (cache-aside flow + stampede control + 3 trạng thái runtime log).
<!-- @starci/seperator -->
## 2
### purpose
<!-- @starci/seperator -->
Chống cache stampede bằng Redis SETNX lock single-flight, chỉ 1 request rebuild cache mỗi key.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
Khi cache miss, dùng `SET <lock-key> <uuid> NX EX 3` (TTL 3-5s) để giành quyền rebuild; chỉ request có lock được query source + set cache + release lock; request không có lock phải chờ ngắn (50-100ms) rồi đọc cache lại, max 5 lần retry trước khi degrade query source; log 3 trạng thái runtime `cache_hit`, `cache_miss_rebuild`, `cache_wait_for_rebuild`.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Lock key format: `lock:products:list:page=...:limit=...:sort=...` (mirror cache key).
- Release lock bằng Lua script check value (uuid) match để tránh release nhầm lock của request khác.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
15
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Rubric chấm điểm (tối đa 15):

- Tiêu chí A (5 điểm): SETNX lock đúng pattern `SET lock-key uuid NX EX 3-5`, không dùng `SETEX` rồi check, không lock per-instance memory.
- Tiêu chí B (4 điểm): Single-flight thật — 5+ request đồng thời cùng key chỉ có 1 lần `cache_miss_rebuild`, các request còn lại đều `cache_wait_for_rebuild` rồi đọc cache.
- Tiêu chí C (3 điểm): Retry loop có giới hạn (≤5 lần × 50-100ms), không vòng chờ vô hạn; có fallback degrade khi vượt retry budget.
- Tiêu chí D (3 điểm): Release lock check uuid match (Lua script hoặc transaction), không blind `DEL`.

Quy tắc chấm: mỗi tiêu chí làm đúng trọn vẹn thì nhận đủ điểm tiêu chí đó; thiếu/sai tiêu chí nào thì tiêu chí đó nhận 0 điểm.
<!-- @starci/seperator -->
## 3
### purpose
<!-- @starci/seperator -->
Invalidate đầy đủ mọi list key sau thao tác ghi để tránh stale data trên nhiều trang/sort.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
Sau `POST /products` hoặc `PATCH /products/:id` (write thành công), phải xóa toàn bộ key match prefix `products:list:*`; invalidate ngay sau khi write commit, không delay; có thể dùng `SCAN` + `DEL` batch hoặc maintain index set của list keys.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- `KEYS` blocking ở production — dùng `SCAN MATCH products:list:* COUNT 100`.
- Cân nhắc maintain `SADD products:list:keys <key>` khi set cache để invalidate O(N) thay vì SCAN O(M).
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
10
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Rubric chấm điểm (tối đa 10):

- Tiêu chí A (3 điểm): Sau mutate, mọi tổ hợp `(page, limit, sort)` đều miss lần kế tiếp (verified bằng raw log), không sót sort khác hoặc page khác.
- Tiêu chí B (3 điểm): Dùng `SCAN MATCH products:list:*` HOẶC index set thay vì `KEYS` blocking.
- Tiêu chí C (2 điểm): Invalidate chạy sau write commit thành công, không invalidate khi write throw exception.
- Tiêu chí D (2 điểm): Chuỗi `miss → hit → mutate → miss → hit` chạy đúng end-to-end với ≥2 tổ hợp query khác nhau.

Quy tắc chấm: mỗi tiêu chí làm đúng trọn vẹn thì nhận đủ điểm tiêu chí đó; thiếu/sai tiêu chí nào thì tiêu chí đó nhận 0 điểm.
<!-- @starci/seperator -->
## 4
### purpose
<!-- @starci/seperator -->
Chứng minh hành vi cache + stampede control + invalidation bằng raw output thật và viết README đúng 6 section.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
README repo phải có đủ 6 section: Challenge description, How to run, Architecture/Stack, Smoke Test (paste raw output 3 trạng thái `cache_hit` / `cache_miss_rebuild` / `cache_wait_for_rebuild` + chuỗi invalidate), Code Execution Trace (≥3 điểm chạm `file:line -> method()`), Design Decisions; raw log phải là output thật do app sinh ra.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Dùng `for i in 1..10; do curl ... & done; wait` để trigger stampede thật.
- Trong Code Execution Trace nêu `CacheService.acquireLock`, `CacheService.releaseLock`, `ProductService.findAll`.
<!-- @starci/seperator -->
### forbidden
<!-- @starci/seperator -->
- Không dùng Redis lock mà vẫn claim chống stampede (chỉ relying on TTL) -> **0 prompt concurrency control**.
- Invalidate sót sort/page khác sau mutate khiến data stale -> **0 prompt invalidation correctness**.
- Chỉ paste screenshot, không có raw output/log text -> **0 prompt evidence**.
- Dùng 1 cache key cố định cho mọi query page/limit/sort -> **0 prompt cache key design**.
- Fabricate raw log (paste log không phải do app sinh ra) -> **0 whole challenge**.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
5
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Rubric chấm điểm (tối đa 5):

- Tiêu chí A (2 điểm): README đủ 6 section bắt buộc (Challenge description, How to run, Architecture/Stack, Smoke Test, Code Execution Trace, Design Decisions).
- Tiêu chí B (2 điểm): Smoke Test paste raw output thật cho cả 3 trạng thái `cache_hit` / `cache_miss_rebuild` / `cache_wait_for_rebuild` + chuỗi invalidate cho ≥2 tổ hợp query.
- Tiêu chí C (1 điểm): Code Execution Trace ≥3 điểm chạm `file:line -> method()` thật cho flow stampede (acquire lock → rebuild → release lock).

Quy tắc chấm: mỗi tiêu chí làm đúng trọn vẹn thì nhận đủ điểm tiêu chí đó; thiếu/sai tiêu chí nào thì tiêu chí đó nhận 0 điểm.
<!-- @starci/seperator -->
# outputs
## 0
### text
<!-- @starci/seperator -->
Bạn thiết kế được cache key theo query params đúng chuẩn cho endpoint phân trang, tránh trộn dữ liệu giữa biến thể request.
<!-- @starci/seperator -->
## 1
### text
<!-- @starci/seperator -->
Bạn triển khai được cache-aside hoàn chỉnh cho API list trong NestJS với TTL và response shape ổn định.
<!-- @starci/seperator -->
## 2
### text
<!-- @starci/seperator -->
Bạn áp dụng được Redis SETNX lock để chống cache stampede với single-flight rebuild và retry loop có giới hạn.
<!-- @starci/seperator -->
## 3
### text
<!-- @starci/seperator -->
Bạn invalidate đầy đủ list cache theo prefix sau thao tác ghi và chứng minh bằng raw output thật.
<!-- @starci/seperator -->
# prerequisites
## 0
### text
<!-- @starci/seperator -->
Đã hoàn thành EASY `caching-with-redis-easy`.
<!-- @starci/seperator -->
## 1
### text
<!-- @starci/seperator -->
Node.js >= 18, NestJS CLI, Docker Desktop (chạy Redis).
<!-- @starci/seperator -->
# steps
## 0
### title
<!-- @starci/seperator -->
Init project và build cache key helper
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Các bước thực hiện
- **Bước 1:** Tạo project và cài package cache/redis.
  ```bash
  nest new pagination-redis-cache-stampede-medium
  cd pagination-redis-cache-stampede-medium
  npm i @nestjs/cache-manager keyv @keyv/redis cacheable ioredis class-validator class-transformer
  ```
- **Bước 2:** Tạo `docker-compose.yml` chạy Redis 7-alpine ở port `6379` và `docker compose up -d`.
- **Bước 3:** Cấu hình `CacheModule.registerAsync` với `KeyvRedis` + TTL 90s ở `AppModule`; tách `REDIS_URL`, `LIST_TTL_MS=90000`, `LOCK_TTL_SEC=3` qua `ConfigModule`.
- **Bước 4:** Viết helper `buildListKey({ page=1, limit=10, sort='price_asc' })` format `products:list:page={page}:limit={limit}:sort={sort}` + reject sort không thuộc enum.

### 2. Yêu cầu tối thiểu cần đạt
- Redis chạy thật ở `localhost:6379`, app boot không lỗi cache.
- `buildListKey` chuẩn hóa default + reject sort lạ với HTTP 400.
- TTL/lock TTL/Redis URL tách qua env, không hard-code trong service.

### 3. Nice to have
- Health check endpoint `GET /health/cache` ping Redis.
- Logging interceptor in cache key đang xử lý cho mỗi request.

### codeImplementations
#### 0
##### lang
typescript
##### guide
**Thư viện chính:** **`@nestjs/cache-manager`** + **`@keyv/redis`** — `CacheModule` async config với `KeyvRedis`, helper key build dạng pure function.

**Mapping API:**
- `register({ store, ttl })` -> `registerAsync({ useFactory: () => ({ stores: [new Keyv(new KeyvRedis(url))], ttl }) })`.
- `cache-manager-redis-store.set(key, val, ttl)` (giây) -> `cacheManager.set(key, val, 90_000)` (ms).

**Khác biệt/gotcha:**
- TTL ở `@nestjs/cache-manager` đo bằng **millisecond**, khác `ioredis.SET EX` (giây).
- Nên dùng cùng `ioredis` instance cho SETNX lock — `CacheModule` không expose primitive SETNX trực tiếp.
##### example
```typescript
const SORT_ENUM = ["price_asc", "price_desc", "name_asc", "name_desc"] as const
export type Sort = (typeof SORT_ENUM)[number]

export function buildListKey(q: { page?: number; limit?: number; sort?: string }) {
    const page = q.page ?? 1
    const limit = q.limit ?? 10
    const sort = (SORT_ENUM as readonly string[]).includes(q.sort ?? "") ? q.sort : "price_asc"
    return `products:list:page=${page}:limit=${limit}:sort=${sort}`
}
```
#### 1
##### lang
csharp
##### guide
**Thư viện chính:** **`StackExchange.Redis`** + **`Microsoft.Extensions.Caching.StackExchangeRedis`** — `IDistributedCache` cho cache-aside, `IConnectionMultiplexer` cho SETNX lock raw.

**API mapping:**
- `CacheModule.registerAsync` -> `services.AddStackExchangeRedisCache(opt => opt.Configuration = cfg["Redis:Url"])`.
- `cacheManager.set` -> `IDistributedCache.SetStringAsync(key, val, new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(90) })`.

**Differences / gotchas:**
- `IDistributedCache` không có primitive SETNX — phải gọi `IDatabase.StringSetAsync(lockKey, value, ttl, When.NotExists)` qua `IConnectionMultiplexer`.
- Build key qua record `ListQuery` để compiler check default.
##### example
```csharp
public static string BuildListKey(int page = 1, int limit = 10, string sort = "price_asc")
{
    var sortNormalized = SortEnum.Contains(sort) ? sort : "price_asc";
    return $"products:list:page={page}:limit={limit}:sort={sortNormalized}";
}
```
#### 2
##### lang
go
##### guide
**Thư viện chính:** **`github.com/redis/go-redis/v9`** — client native, key helper là pure function, SETNX qua `rdb.SetNX`.

**API mapping:**
- `cacheManager.set(key, val, ttl)` -> `rdb.Set(ctx, key, val, 90*time.Second)`.
- `cacheManager.get` -> `rdb.Get(ctx, key).Bytes()` + check `errors.Is(err, redis.Nil)`.

**Differences / gotchas:**
- Không có DI container — pass `*redis.Client` qua handler closure.
- `SetNX` của `go-redis` trả `*BoolCmd` — check `.Val()` cho lock acquired.
##### example
```go
var sortEnum = map[string]bool{"price_asc": true, "price_desc": true, "name_asc": true, "name_desc": true}

func BuildListKey(page, limit int, sort string) string {
    if !sortEnum[sort] { sort = "price_asc" }
    if page == 0 { page = 1 }
    if limit == 0 { limit = 10 }
    return fmt.Sprintf("products:list:page=%d:limit=%d:sort=%s", page, limit, sort)
}
```
#### 3
##### lang
java
##### guide
**Thư viện chính:** **`spring-boot-starter-data-redis`** — `RedisTemplate` cho SETNX, `StringRedisTemplate.opsForValue().setIfAbsent` raw, Spring Cache abstraction optional.

**API mapping:**
- `cacheManager.set(key, val, ttl)` -> `redisTemplate.opsForValue().set(key, val, Duration.ofSeconds(90))`.
- `cacheManager.get` -> `redisTemplate.opsForValue().get(key)` (null-safe).

**Differences / gotchas:**
- Spring Cache `@Cacheable` không expose key dynamic dễ — dùng programmatic `RedisTemplate` cho list cache.
- SETNX qua `setIfAbsent(key, val, ttl)` trả `Boolean`.
##### example
```java
private static final Set<String> SORT_ENUM = Set.of("price_asc","price_desc","name_asc","name_desc");

public static String buildListKey(Integer page, Integer limit, String sort) {
    int p = page == null ? 1 : page;
    int l = limit == null ? 10 : limit;
    String s = SORT_ENUM.contains(sort) ? sort : "price_asc";
    return "products:list:page=" + p + ":limit=" + l + ":sort=" + s;
}
```
<!-- @starci/seperator -->
## 1
### title
<!-- @starci/seperator -->
Xây dựng API products có pagination và sort
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Các bước thực hiện
- **Bước 1:** Tạo `ProductModule`, `ProductService`, `ProductController` với mảng in-memory 20 item mẫu (`name`, `price`, `createdAt`).
- **Bước 2:** Viết `GET /products?page=&limit=&sort=` trả `{ items, page, limit, total }` với pagination + sort theo enum.
- **Bước 3:** Viết `POST /products` (body `{ name, price }`) và `PATCH /products/:id` (partial update) làm endpoint mutate cho invalidation test.
- **Bước 4:** Validate query bằng `class-validator` (`@IsInt @Min(1)` cho page/limit, `@IsIn(SORT_ENUM)` cho sort).

### 2. Yêu cầu tối thiểu cần đạt
- `GET /products?page=1&limit=5&sort=price_desc` trả 5 item sort đúng theo `price` giảm dần.
- `POST /products` thêm item, `PATCH` update đúng id, response trả item mới/sau update.
- Query invalid (sort lạ, page=0) reject với HTTP 400.

### 3. Nice to have
- Tách DTO `ListQueryDto`, `CreateProductDto`, `UpdateProductDto` riêng.
- Thêm field `total_pages = ceil(total/limit)` trong response.

### codeImplementations
#### 0
##### lang
typescript
##### guide
**Thư viện chính:** **`@nestjs/common`** + **`class-validator`** + **`class-transformer`** — Nest controller + DTO validation pipe + sort/paginate trên mảng in-memory.

**Mapping API:**
- `IsInt/Min` -> validate query int.
- `IsIn(SORT_ENUM)` -> validate enum.
- `ValidationPipe({ transform: true })` -> coerce query string → int.

**Khác biệt/gotcha:**
- Phải `app.useGlobalPipes(new ValidationPipe({ transform: true }))` để coerce string `'1'` → number `1` cho `@IsInt`.
- Mặc định nest controller không tự transform query — bật trong DTO bằng `@Type(() => Number)`.
##### example
```typescript
@Get()
async list(@Query() q: ListQueryDto) {
    const sorted = [...this.products].sort((a, b) => sortFn(a, b, q.sort))
    const offset = (q.page - 1) * q.limit
    return { items: sorted.slice(offset, offset + q.limit), page: q.page, limit: q.limit, total: this.products.length }
}
```
#### 1
##### lang
csharp
##### guide
**Thư viện chính:** **`Microsoft.AspNetCore.Mvc`** + **`System.ComponentModel.DataAnnotations`** — minimal API + LINQ pagination, validation qua data annotations.

**API mapping:**
- `class-validator @IsInt @Min(1)` -> `[FromQuery] int Page = 1` + `[Range(1, int.MaxValue)]`.
- `@IsIn(SORT_ENUM)` -> custom validation attribute hoặc enum.

**Differences / gotchas:**
- Default model binding coerce query string → int tự động.
- Dùng `IEnumerable<Product>.Skip().Take()` cho pagination.
##### example
```csharp
[HttpGet]
public IActionResult List([FromQuery] int page = 1, [FromQuery] int limit = 10, [FromQuery] string sort = "price_asc")
{
    var sorted = SortProducts(_products, sort);
    var items = sorted.Skip((page-1)*limit).Take(limit).ToList();
    return Ok(new { items, page, limit, total = _products.Count });
}
```
#### 2
##### lang
go
##### guide
**Thư viện chính:** **`github.com/gin-gonic/gin`** + **`github.com/go-playground/validator/v10`** — Gin router + struct tag validation.

**API mapping:**
- DTO validation -> struct tag `binding:"min=1,max=100"`.
- Sort enum -> `binding:"oneof=price_asc price_desc name_asc name_desc"`.

**Differences / gotchas:**
- Gin `ShouldBindQuery` parse + validate query một step.
- Pagination dùng slice `products[offset:offset+limit]`, nhớ check bounds.
##### example
```go
type ListQuery struct {
    Page  int    `form:"page" binding:"omitempty,min=1"`
    Limit int    `form:"limit" binding:"omitempty,min=1,max=100"`
    Sort  string `form:"sort" binding:"omitempty,oneof=price_asc price_desc name_asc name_desc"`
}
```
#### 3
##### lang
java
##### guide
**Thư viện chính:** **`spring-boot-starter-web`** + **`spring-boot-starter-validation`** — Spring REST controller + Bean Validation.

**API mapping:**
- `class-validator` -> `jakarta.validation.constraints.*` annotations (`@Min`, `@Pattern`).
- DTO -> record class với `@Valid` ở controller.

**Differences / gotchas:**
- Spring tự coerce query string → int qua `@RequestParam(defaultValue = "1") int page`.
- Enum validation qua custom `@SortValid` annotation hoặc `@Pattern(regexp = "price_asc|price_desc|...")`.
##### example
```java
@GetMapping
public Map<String, Object> list(
        @RequestParam(defaultValue = "1") @Min(1) int page,
        @RequestParam(defaultValue = "10") @Min(1) int limit,
        @RequestParam(defaultValue = "price_asc") @Pattern(regexp = "price_(asc|desc)|name_(asc|desc)") String sort) {
    return paginateAndSort(products, page, limit, sort);
}
```
<!-- @starci/seperator -->
## 2
### title
<!-- @starci/seperator -->
Triển khai cache-aside với SETNX lock single-flight
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Các bước thực hiện
- **Bước 1:** Inject `CACHE_MANAGER` và raw `ioredis` client (`@nestjs-modules/ioredis` hoặc factory provider) vào `ProductService`.
- **Bước 2:** Trong `findAll(query)`:
  - build cache key + lock key bằng `buildListKey`;
  - check `cacheManager.get(key)` — hit → log `cache_hit`, trả ngay;
  - miss → `redis.set(lockKey, uuid, 'NX', 'EX', 3)`;
  - lock acquired → log `cache_miss_rebuild`, query source, `cacheManager.set(key, data, 90000)`, release lock bằng Lua script check uuid.
- **Bước 3:** Lock NOT acquired → log `cache_wait_for_rebuild`, `sleep 80ms` rồi retry đọc cache, max 5 lần; vượt budget → fallback query source (degrade) + log `cache_lock_timeout`.
- **Bước 4:** Viết unit test concurrency dùng `Promise.all(Array(10).fill(0).map(() => service.findAll(q)))` assert chỉ 1 lần data source query.

### 2. Yêu cầu tối thiểu cần đạt
- 10 request đồng thời cùng key → chỉ 1 lần `cache_miss_rebuild`, 9 lần `cache_wait_for_rebuild`.
- Release lock dùng Lua compare-uuid, không blind `DEL`.
- Retry loop ≤5 lần × 50-100ms, có fallback degrade.

### 3. Nice to have
- Metric counter `cache.rebuild.count` + `cache.wait.count` cho observability.
- Dynamic lock TTL theo thời gian rebuild trung bình (start với 3s).

### codeImplementations
#### 0
##### lang
typescript
##### guide
**Thư viện chính:** **`ioredis`** raw client cho SETNX/EVAL + **`@nestjs/cache-manager`** cho read/write cache value.

**Mapping API:**
- `cacheManager.set(key, val, 90_000)` -> store cache value với TTL ms.
- `redis.set(lockKey, uuid, 'NX', 'EX', 3)` -> SETNX với TTL giây (atomic).
- `redis.eval(luaCompareDel, 1, lockKey, uuid)` -> release lock an toàn.

**Khác biệt/gotcha:**
- `ioredis.set` với options `'NX', 'EX', 3` là **atomic** — không thay bằng `SETNX` + `EXPIRE` riêng (race).
- `sleep` trong NestJS test phải dùng `setTimeout` Promise, không block event loop.
##### example
```typescript
const RELEASE_LUA = `
  if redis.call("GET", KEYS[1]) == ARGV[1]
  then return redis.call("DEL", KEYS[1])
  else return 0 end`

async findAll(q: ListQueryDto) {
    const key = buildListKey(q), lockKey = `lock:${key}`, uuid = randomUUID()
    const hit = await this.cache.get<Page>(key)
    if (hit) { this.logger.log(`cache_hit ${key}`); return hit }
    const acquired = await this.redis.set(lockKey, uuid, "NX", "EX", 3)
    if (acquired) {
        this.logger.log(`cache_miss_rebuild ${key}`)
        const data = this.queryDataSource(q)
        await this.cache.set(key, data, 90_000)
        await this.redis.eval(RELEASE_LUA, 1, lockKey, uuid)
        return data
    }
    return this.waitAndRetry(key)
}
```
#### 1
##### lang
csharp
##### guide
**Thư viện chính:** **`StackExchange.Redis.IDatabase`** raw cho SETNX/EVAL + **`IDistributedCache`** cho cache value.

**API mapping:**
- `redis.set NX EX` -> `db.StringSetAsync(lockKey, val, TimeSpan.FromSeconds(3), When.NotExists)`.
- `redis.eval` -> `db.ScriptEvaluateAsync(luaScript, new RedisKey[] { lockKey }, new RedisValue[] { uuid })`.

**Differences / gotchas:**
- `When.NotExists` là enum chuẩn — không cần raw command string.
- `Task.Delay` cho sleep.
##### example
```csharp
public async Task<Page> FindAllAsync(ListQuery q)
{
    var key = BuildListKey(q.Page, q.Limit, q.Sort);
    var lockKey = $"lock:{key}";
    var uuid = Guid.NewGuid().ToString();
    var cached = await _cache.GetStringAsync(key);
    if (cached != null) { _logger.LogInformation("cache_hit {Key}", key); return Deserialize(cached); }
    var acquired = await _redis.StringSetAsync(lockKey, uuid, TimeSpan.FromSeconds(3), When.NotExists);
    if (acquired) { /* rebuild + release */ }
    return await WaitAndRetry(key);
}
```
#### 2
##### lang
go
##### guide
**Thư viện chính:** **`go-redis/v9`** — `SetNX` + `Eval` raw command, cache-aside viết tay.

**API mapping:**
- `redis.set NX EX` -> `rdb.SetNX(ctx, lockKey, uuid, 3*time.Second)`.
- `redis.eval` -> `rdb.Eval(ctx, releaseLua, []string{lockKey}, uuid)`.

**Differences / gotchas:**
- `SetNX` trả `*BoolCmd` — `.Val()` true nghĩa acquired.
- `time.Sleep(80*time.Millisecond)` cho retry wait.
##### example
```go
func (s *ProductService) FindAll(ctx context.Context, q ListQuery) (Page, error) {
    key := BuildListKey(q.Page, q.Limit, q.Sort)
    lockKey := "lock:" + key
    uuid := uuid.NewString()
    if cached, err := s.rdb.Get(ctx, key).Bytes(); err == nil { return parse(cached), nil }
    acquired, _ := s.rdb.SetNX(ctx, lockKey, uuid, 3*time.Second).Result()
    if acquired { /* rebuild + release */ }
    return s.waitAndRetry(ctx, key)
}
```
#### 3
##### lang
java
##### guide
**Thư viện chính:** **`StringRedisTemplate`** — `setIfAbsent` cho SETNX + `execute(DefaultRedisScript, ...)` cho Lua release.

**API mapping:**
- `redis.set NX EX` -> `redisTemplate.opsForValue().setIfAbsent(lockKey, uuid, Duration.ofSeconds(3))`.
- `redis.eval` -> `redisTemplate.execute(new DefaultRedisScript<>(releaseLua, Long.class), List.of(lockKey), uuid)`.

**Differences / gotchas:**
- `setIfAbsent(key, val, ttl)` trả `Boolean` (có thể null) — null-safe check.
- `Thread.sleep` cho retry — KHÔNG ở reactive flow, dùng `Mono.delay` thay.
##### example
```java
public Page findAll(ListQuery q) {
    String key = buildListKey(q.page(), q.limit(), q.sort());
    String lockKey = "lock:" + key;
    String uuid = UUID.randomUUID().toString();
    String cached = redisTemplate.opsForValue().get(key);
    if (cached != null) { log.info("cache_hit {}", key); return parse(cached); }
    Boolean acquired = redisTemplate.opsForValue().setIfAbsent(lockKey, uuid, Duration.ofSeconds(3));
    if (Boolean.TRUE.equals(acquired)) { /* rebuild + release Lua */ }
    return waitAndRetry(key);
}
```
<!-- @starci/seperator -->
## 3
### title
<!-- @starci/seperator -->
Invalidate list cache theo prefix sau mutate
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Các bước thực hiện
- **Bước 1:** Trong `ProductService.create()` và `update()`, sau khi write thành công, gọi `invalidateListCache()`.
- **Bước 2:** Triển khai `invalidateListCache()` dùng `SCAN MATCH products:list:* COUNT 100` + `DEL` batch, KHÔNG dùng `KEYS`.
- **Bước 3:** Wrap invalidation trong try/catch — nếu write throw thì KHÔNG invalidate; log số key đã xóa.
- **Bước 4:** Verify bằng `redis-cli SCAN 0 MATCH products:list:*` trước và sau mutate.

### 2. Yêu cầu tối thiểu cần đạt
- Sau mutate, mọi key match prefix `products:list:*` đều bị xóa, lần GET kế là miss.
- Không dùng `KEYS` (blocking).
- Write fail (exception) → KHÔNG invalidate (cache vẫn còn).

### 3. Nice to have
- Maintain `SADD products:list:keys <key>` khi `cacheManager.set` để invalidate O(N) thay vì SCAN O(M).
- Pub/sub channel `products:invalidate` cho multi-instance (foreshadowing INSANE).

### codeImplementations
#### 0
##### lang
typescript
##### guide
**Thư viện chính:** **`ioredis`** — `scanStream({ match, count })` cho async iteration + `del` batch.

**Mapping API:**
- `KEYS pattern` -> `scanStream({ match: 'products:list:*', count: 100 })`.
- `cacheManager.del(key)` -> `redis.del(...keys)` batch.

**Khác biệt/gotcha:**
- `scanStream` là `Readable` stream — collect keys vào array rồi `del` cùng lúc, không `del` mỗi event.
- `cacheManager.del` chỉ del 1 key/lần — dùng raw `ioredis.del(...)` cho batch.
##### example
```typescript
async invalidateListCache(): Promise<number> {
    const keys: string[] = []
    const stream = this.redis.scanStream({ match: "products:list:*", count: 100 })
    for await (const batch of stream) keys.push(...(batch as string[]))
    if (keys.length === 0) return 0
    return await this.redis.del(...keys)
}
```
#### 1
##### lang
csharp
##### guide
**Thư viện chính:** **`StackExchange.Redis`** — `IServer.Keys(pattern)` (dùng SCAN internally) + `IDatabase.KeyDeleteAsync`.

**API mapping:**
- `scanStream` -> `_redis.GetServer(endpoint).Keys(pattern: "products:list:*", pageSize: 100)`.
- Batch del -> `db.KeyDeleteAsync(keys.ToArray())`.

**Differences / gotchas:**
- `IServer.Keys` mặc định dùng SCAN khi server hỗ trợ.
- Phải `AllowAdmin = true` khi connect mới gọi được `IServer.Keys`.
##### example
```csharp
public async Task<long> InvalidateListCacheAsync()
{
    var server = _redis.GetServer(_redis.GetEndPoints()[0]);
    var keys = server.Keys(pattern: "products:list:*", pageSize: 100).ToArray();
    return keys.Length == 0 ? 0 : await _db.KeyDeleteAsync(keys);
}
```
#### 2
##### lang
go
##### guide
**Thư viện chính:** **`go-redis/v9`** — `Scan` iterator + `Del` variadic.

**API mapping:**
- `scanStream` -> `iter := rdb.Scan(ctx, 0, "products:list:*", 100).Iterator()`.
- Batch del -> `rdb.Del(ctx, keys...)`.

**Differences / gotchas:**
- `iter.Next(ctx)` returns bool — accumulate keys rồi `Del` cuối loop.
- Cluster mode dùng `rdb.ScanType` per node.
##### example
```go
func (s *ProductService) InvalidateListCache(ctx context.Context) (int64, error) {
    var keys []string
    iter := s.rdb.Scan(ctx, 0, "products:list:*", 100).Iterator()
    for iter.Next(ctx) { keys = append(keys, iter.Val()) }
    if iter.Err() != nil { return 0, iter.Err() }
    if len(keys) == 0 { return 0, nil }
    return s.rdb.Del(ctx, keys...).Result()
}
```
#### 3
##### lang
java
##### guide
**Thư viện chính:** **`StringRedisTemplate`** — `execute(RedisCallback)` cho SCAN raw + `delete(Collection)` batch.

**API mapping:**
- `scanStream` -> `ScanOptions.scanOptions().match(pattern).count(100).build()` + `Cursor<byte[]>`.
- Batch del -> `redisTemplate.delete(keys)`.

**Differences / gotchas:**
- Phải `cursor.close()` để tránh leak.
- `delete(Collection)` cho batch, không `delete` mỗi key.
##### example
```java
public long invalidateListCache() {
    Set<String> keys = new HashSet<>();
    ScanOptions opts = ScanOptions.scanOptions().match("products:list:*").count(100).build();
    try (Cursor<String> cursor = redisTemplate.scan(opts)) {
        while (cursor.hasNext()) keys.add(cursor.next());
    }
    return keys.isEmpty() ? 0 : redisTemplate.delete(keys);
}
```
<!-- @starci/seperator -->
## 4
### title
<!-- @starci/seperator -->
Smoke test stampede + invalidation và viết README raw output
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Các bước thực hiện
- **Bước 1:** Chạy app.
  ```bash
  nest start --watch
  ```
- **Bước 2:** Warm-up + verify hit cho key cụ thể.
  ```bash
  curl "http://localhost:3000/products?page=1&limit=5&sort=price_desc"
  curl "http://localhost:3000/products?page=1&limit=5&sort=price_desc"
  ```
- **Bước 3:** Flush cache + trigger stampede bằng 10 request đồng thời.
  ```bash
  redis-cli FLUSHDB
  for i in 1 2 3 4 5 6 7 8 9 10; do
    curl -s "http://localhost:3000/products?page=1&limit=5&sort=price_desc" &
  done
  wait
  ```
- **Bước 4:** Mutate + verify invalidate.
  ```bash
  curl -X POST http://localhost:3000/products \
    -H "Content-Type: application/json" \
    -d '{ "name": "Keyboard", "price": 99 }'
  curl "http://localhost:3000/products?page=1&limit=5&sort=price_desc"
  curl "http://localhost:3000/products?page=2&limit=5&sort=name_asc"
  ```
- **Bước 5:** Viết README repo với 6 section: Challenge description, How to run, Architecture/Stack (Mermaid lock flow), Smoke Test (paste raw log 3 trạng thái + invalidate ≥2 tổ hợp), Code Execution Trace (≥3 điểm chạm), Design Decisions.

### 2. Yêu cầu tối thiểu cần đạt
- Raw log Bước 3 cho thấy đúng 1 lần `cache_miss_rebuild`, 9 lần `cache_wait_for_rebuild`, không deadlock.
- Sau mutate Bước 4, cả `page=1 sort=price_desc` và `page=2 sort=name_asc` đều miss lần kế tiếp.
- README có đủ 6 section với Code Execution Trace ≥3 điểm chạm `file:line -> method()` thật.

### 3. Nice to have
- Đo response time từng request trong stampede (p50/p95) so sánh với baseline không lock.
- Thêm Grafana/Prometheus metric panel cho cache hit ratio.
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
Redis Distributed Locks
<!-- @starci/seperator -->
### url
<!-- @starci/seperator -->
https://redis.io/docs/latest/develop/use/patterns/distributed-locks/
<!-- @starci/seperator -->
## 2
### alias
<!-- @starci/seperator -->
Redis SCAN command
<!-- @starci/seperator -->
### url
<!-- @starci/seperator -->
https://redis.io/docs/latest/commands/scan/
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
Repo public chứa source NestJS + `docker-compose.yml` Redis + README đủ 6 section (Challenge description, How to run, Architecture/Stack với Mermaid lock flow, Smoke Test với raw log 3 trạng thái `cache_hit` / `cache_miss_rebuild` / `cache_wait_for_rebuild` + invalidate cho ≥2 tổ hợp query, Code Execution Trace ≥3 điểm chạm `file:line -> method()`, Design Decisions).
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
40
<!-- @starci/seperator -->
# difficulty
<!-- @starci/seperator -->
medium
<!-- @starci/seperator -->
# score
<!-- @starci/seperator -->
40
<!-- @starci/seperator -->
