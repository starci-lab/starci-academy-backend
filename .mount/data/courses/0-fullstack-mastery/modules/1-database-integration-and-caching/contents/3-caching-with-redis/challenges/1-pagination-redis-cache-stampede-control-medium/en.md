# title
<!-- @starci/seperator -->
Paginated Redis Cache with Stampede Control via SETNX Lock
<!-- @starci/seperator -->
# description
<!-- @starci/seperator -->
Medium challenge extended from the EASY version. You implement **cache-aside** for `GET /products` with **pagination** + **sort**, every query combination maps to a distinct Redis key, and you prevent **cache stampede** with Redis **SETNX lock** at short TTL, then invalidate by prefix on every write.
<!-- @starci/seperator -->
# requirements
## 0
### purpose
<!-- @starci/seperator -->
Standardize cache keys by query params to avoid mixing data across request variants.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
Cache key must follow `products:list:page={page}:limit={limit}:sort={sort}`; normalize defaults `page=1`, `limit=10`, `sort=price_asc` before building the key; list cache TTL is 90s; cache backend must use `KeyvRedis` (no in-memory fallback).
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Move key build logic into a helper `buildListKey(query)` to avoid format drift.
- Sort is a finite enum (`price_asc | price_desc | name_asc | name_desc`) — reject anything else.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
10
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Scoring rubric (max 10):

- Criterion A (3 points): Helper `buildListKey(query)` normalizes defaults + rejects sorts outside the enum, every `(page, limit, sort)` tuple maps to exactly one key.
- Criterion B (3 points): Key format is exactly `products:list:page={page}:limit={limit}:sort={sort}` (no JSON stringify, no `crypto.hash` replacing the human-readable format).
- Criterion C (2 points): List cache TTL is set to 90s via a centralized constant, not hard-coded in multiple places.
- Criterion D (2 points): Cache backend is real `KeyvRedis`, app boot does not fall back to in-memory.

Rule: each criterion fully met receives its full points; partial/incorrect receives 0.
<!-- @starci/seperator -->
## 1
### purpose
<!-- @starci/seperator -->
Implement cache-aside for the `GET /products` endpoint with pagination + sort.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
`GET /products?page=&limit=&sort=` must check cache first; on miss read the data source, `set` cache with TTL 90s, return a stable response shape `{ items, page, limit, total }`; on hit return directly from Redis without touching the data source.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Log `cache_hit` together with the key being read for easier debugging.
- Keep the response shape stable across hit/miss so smoke-test diff is trivial.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
0
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Shared with requirement 2 (cache-aside flow + stampede control + the three runtime log states).
<!-- @starci/seperator -->
## 2
### purpose
<!-- @starci/seperator -->
Prevent cache stampede with a Redis SETNX single-flight lock: only one request rebuilds the cache per key.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
On cache miss, use `SET <lock-key> <uuid> NX EX 3` (TTL 3-5s) to claim the right to rebuild; only the lock holder queries source + sets cache + releases lock; non-holders must wait briefly (50-100ms) and re-read cache, max 5 retries before degrading to a source query; log three runtime states `cache_hit`, `cache_miss_rebuild`, `cache_wait_for_rebuild`.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Lock key format: `lock:products:list:page=...:limit=...:sort=...` (mirror the cache key).
- Release the lock via a Lua script that checks the value (uuid) match, to avoid releasing another request's lock.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
15
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Scoring rubric (max 15):

- Criterion A (5 points): SETNX lock follows `SET lock-key uuid NX EX 3-5` exactly, no `SETEX` + check, no in-process lock.
- Criterion B (4 points): True single-flight — 5+ concurrent requests for the same key produce exactly one `cache_miss_rebuild`, all others log `cache_wait_for_rebuild` and then read from cache.
- Criterion C (3 points): Retry loop is bounded (≤5 attempts × 50-100ms), no infinite wait; fallback degrade when the budget is exceeded.
- Criterion D (3 points): Release lock checks uuid match (Lua script or transaction), never a blind `DEL`.

Rule: each criterion fully met receives its full points; partial/incorrect receives 0.
<!-- @starci/seperator -->
## 3
### purpose
<!-- @starci/seperator -->
Fully invalidate every list key after a write to avoid stale data across pages/sorts.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
After a successful `POST /products` or `PATCH /products/:id`, delete every key matching prefix `products:list:*`; invalidate right after write commit, with no delay; use `SCAN` + `DEL` batch or maintain an index set of list keys.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- `KEYS` blocks in production — use `SCAN MATCH products:list:* COUNT 100`.
- Consider maintaining `SADD products:list:keys <key>` on cache set so invalidation is O(N) instead of SCAN O(M).
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
10
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Scoring rubric (max 10):

- Criterion A (3 points): After a mutate, every `(page, limit, sort)` tuple misses on the next read (verified by raw log), no stale sort or page slips through.
- Criterion B (3 points): Uses `SCAN MATCH products:list:*` OR an index set, never blocking `KEYS`.
- Criterion C (2 points): Invalidation runs after successful write commit only, never when write throws.
- Criterion D (2 points): Chain `miss → hit → mutate → miss → hit` works end-to-end across ≥2 distinct query tuples.

Rule: each criterion fully met receives its full points; partial/incorrect receives 0.
<!-- @starci/seperator -->
## 4
### purpose
<!-- @starci/seperator -->
Prove the cache + stampede + invalidation behavior with real raw output and a README with the 6 required sections.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
The repo README must contain all 6 sections: Challenge description, How to run, Architecture/Stack, Smoke Test (paste raw output of all three states `cache_hit` / `cache_miss_rebuild` / `cache_wait_for_rebuild` + the invalidation chain), Code Execution Trace (≥3 `file:line -> method()` hops), Design Decisions; raw logs must be real output produced by the app.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Use `for i in 1..10; do curl ... & done; wait` to trigger a real stampede.
- The Code Execution Trace should reference `CacheService.acquireLock`, `CacheService.releaseLock`, `ProductService.findAll`.
<!-- @starci/seperator -->
### forbidden
<!-- @starci/seperator -->
- Skipping the Redis lock while still claiming stampede protection (relying only on TTL) -> **0 prompt concurrency control**.
- Missing sort/page variants during invalidation, leaving stale data -> **0 prompt invalidation correctness**.
- Pasting only a screenshot without raw output/log text -> **0 prompt evidence**.
- Using one fixed cache key for every page/limit/sort query -> **0 prompt cache key design**.
- Fabricating raw logs (pasting logs not produced by the app) -> **0 whole challenge**.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
5
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Scoring rubric (max 5):

- Criterion A (2 points): README has all 6 required sections (Challenge description, How to run, Architecture/Stack, Smoke Test, Code Execution Trace, Design Decisions).
- Criterion B (2 points): Smoke Test pastes real raw output for all three states `cache_hit` / `cache_miss_rebuild` / `cache_wait_for_rebuild` + the invalidation chain for ≥2 query tuples.
- Criterion C (1 point): Code Execution Trace has ≥3 real `file:line -> method()` hops covering the stampede flow (acquire lock → rebuild → release lock).

Rule: each criterion fully met receives its full points; partial/incorrect receives 0.
<!-- @starci/seperator -->
# outputs
## 0
### text
<!-- @starci/seperator -->
You design correct query-aware cache keys for paginated endpoints and avoid mixing data across request variants.
<!-- @starci/seperator -->
## 1
### text
<!-- @starci/seperator -->
You implement a complete cache-aside flow for a list API in NestJS with TTL and stable response shape.
<!-- @starci/seperator -->
## 2
### text
<!-- @starci/seperator -->
You apply a Redis SETNX lock to prevent cache stampede with single-flight rebuild and a bounded retry loop.
<!-- @starci/seperator -->
## 3
### text
<!-- @starci/seperator -->
You fully invalidate list cache by prefix after writes and prove it with real raw output.
<!-- @starci/seperator -->
# prerequisites
## 0
### text
<!-- @starci/seperator -->
Completed EASY `caching-with-redis-easy`.
<!-- @starci/seperator -->
## 1
### text
<!-- @starci/seperator -->
Node.js >= 18, NestJS CLI, Docker Desktop (to run Redis).
<!-- @starci/seperator -->
# steps
## 0
### title
<!-- @starci/seperator -->
Init project and build the cache key helper
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Steps
- **Step 1:** Create the project and install cache/redis packages.
  ```bash
  nest new pagination-redis-cache-stampede-medium
  cd pagination-redis-cache-stampede-medium
  npm i @nestjs/cache-manager keyv @keyv/redis cacheable ioredis class-validator class-transformer
  ```
- **Step 2:** Create `docker-compose.yml` running Redis 7-alpine on port `6379` and run `docker compose up -d`.
- **Step 3:** Configure `CacheModule.registerAsync` with `KeyvRedis` + TTL 90s in `AppModule`; expose `REDIS_URL`, `LIST_TTL_MS=90000`, `LOCK_TTL_SEC=3` via `ConfigModule`.
- **Step 4:** Write helper `buildListKey({ page=1, limit=10, sort='price_asc' })` formatted as `products:list:page={page}:limit={limit}:sort={sort}` + reject sort outside the enum.

### 2. Minimum acceptance criteria
- Redis runs for real at `localhost:6379`, app boots without cache errors.
- `buildListKey` normalizes defaults + rejects unknown sorts with HTTP 400.
- TTL / lock TTL / Redis URL come from env, not hard-coded inside the service.

### 3. Nice to have
- Health check endpoint `GET /health/cache` pings Redis.
- Logging interceptor prints the cache key being processed per request.

### codeImplementations
#### 0
##### lang
typescript
##### guide
**Main library:** **`@nestjs/cache-manager`** + **`@keyv/redis`** — `CacheModule` async config with `KeyvRedis`, the key builder stays a pure function.

**API mapping:**
- `register({ store, ttl })` -> `registerAsync({ useFactory: () => ({ stores: [new Keyv(new KeyvRedis(url))], ttl }) })`.
- `cache-manager-redis-store.set(key, val, ttl)` (seconds) -> `cacheManager.set(key, val, 90_000)` (ms).

**Differences / gotchas:**
- TTL in `@nestjs/cache-manager` is measured in **milliseconds**, unlike `ioredis.SET EX` (seconds).
- Use the same `ioredis` instance for SETNX lock — `CacheModule` does not expose raw SETNX.
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
**Main library:** **`StackExchange.Redis`** + **`Microsoft.Extensions.Caching.StackExchangeRedis`** — `IDistributedCache` for cache-aside, `IConnectionMultiplexer` for raw SETNX.

**API mapping:**
- `CacheModule.registerAsync` -> `services.AddStackExchangeRedisCache(opt => opt.Configuration = cfg["Redis:Url"])`.
- `cacheManager.set` -> `IDistributedCache.SetStringAsync(key, val, new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(90) })`.

**Differences / gotchas:**
- `IDistributedCache` has no SETNX primitive — call `IDatabase.StringSetAsync(lockKey, value, ttl, When.NotExists)` via `IConnectionMultiplexer`.
- Build the key via a `ListQuery` record so the compiler enforces defaults.
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
**Main library:** **`github.com/redis/go-redis/v9`** — native client, key helper is a pure function, SETNX via `rdb.SetNX`.

**API mapping:**
- `cacheManager.set(key, val, ttl)` -> `rdb.Set(ctx, key, val, 90*time.Second)`.
- `cacheManager.get` -> `rdb.Get(ctx, key).Bytes()` + check `errors.Is(err, redis.Nil)`.

**Differences / gotchas:**
- No DI container — pass `*redis.Client` through a handler closure.
- `SetNX` in `go-redis` returns `*BoolCmd` — check `.Val()` for the acquired flag.
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
**Main library:** **`spring-boot-starter-data-redis`** — `RedisTemplate` for SETNX, `StringRedisTemplate.opsForValue().setIfAbsent` raw, Spring Cache abstraction optional.

**API mapping:**
- `cacheManager.set(key, val, ttl)` -> `redisTemplate.opsForValue().set(key, val, Duration.ofSeconds(90))`.
- `cacheManager.get` -> `redisTemplate.opsForValue().get(key)` (null-safe).

**Differences / gotchas:**
- Spring Cache `@Cacheable` does not easily expose dynamic keys — use programmatic `RedisTemplate` for list cache.
- SETNX via `setIfAbsent(key, val, ttl)` returns `Boolean`.
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
Build products API with pagination and sort
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Steps
- **Step 1:** Create `ProductModule`, `ProductService`, `ProductController` with a 20-item in-memory array (`name`, `price`, `createdAt`).
- **Step 2:** Write `GET /products?page=&limit=&sort=` returning `{ items, page, limit, total }` with pagination + enum-driven sort.
- **Step 3:** Add `POST /products` (body `{ name, price }`) and `PATCH /products/:id` (partial update) as mutation endpoints for invalidation testing.
- **Step 4:** Validate the query with `class-validator` (`@IsInt @Min(1)` for page/limit, `@IsIn(SORT_ENUM)` for sort).

### 2. Minimum acceptance criteria
- `GET /products?page=1&limit=5&sort=price_desc` returns 5 items sorted by descending `price`.
- `POST /products` adds an item, `PATCH` updates by id, both return the resulting item.
- Invalid queries (unknown sort, page=0) are rejected with HTTP 400.

### 3. Nice to have
- Extract `ListQueryDto`, `CreateProductDto`, `UpdateProductDto` into separate files.
- Add `total_pages = ceil(total/limit)` to the response.

### codeImplementations
#### 0
##### lang
typescript
##### guide
**Main library:** **`@nestjs/common`** + **`class-validator`** + **`class-transformer`** — Nest controller + DTO validation pipe + in-memory sort/paginate.

**API mapping:**
- `IsInt/Min` -> validate query ints.
- `IsIn(SORT_ENUM)` -> validate enum membership.
- `ValidationPipe({ transform: true })` -> coerce query strings → int.

**Differences / gotchas:**
- Must `app.useGlobalPipes(new ValidationPipe({ transform: true }))` so `'1'` becomes `1` for `@IsInt`.
- By default Nest controllers do not auto-transform queries — enable per-DTO with `@Type(() => Number)`.
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
**Main library:** **`Microsoft.AspNetCore.Mvc`** + **`System.ComponentModel.DataAnnotations`** — minimal API + LINQ pagination, validation through data annotations.

**API mapping:**
- `class-validator @IsInt @Min(1)` -> `[FromQuery] int Page = 1` + `[Range(1, int.MaxValue)]`.
- `@IsIn(SORT_ENUM)` -> custom validation attribute or enum.

**Differences / gotchas:**
- Default model binding coerces query strings → int automatically.
- Use `IEnumerable<Product>.Skip().Take()` for pagination.
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
**Main library:** **`github.com/gin-gonic/gin`** + **`github.com/go-playground/validator/v10`** — Gin router + struct-tag validation.

**API mapping:**
- DTO validation -> struct tag `binding:"min=1,max=100"`.
- Sort enum -> `binding:"oneof=price_asc price_desc name_asc name_desc"`.

**Differences / gotchas:**
- Gin `ShouldBindQuery` parses + validates query in one step.
- Pagination uses `products[offset:offset+limit]`, watch the bounds.
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
**Main library:** **`spring-boot-starter-web`** + **`spring-boot-starter-validation`** — Spring REST controller + Bean Validation.

**API mapping:**
- `class-validator` -> `jakarta.validation.constraints.*` annotations (`@Min`, `@Pattern`).
- DTO -> record class with `@Valid` in the controller.

**Differences / gotchas:**
- Spring auto-coerces query strings → int via `@RequestParam(defaultValue = "1") int page`.
- Enum validation via custom `@SortValid` annotation or `@Pattern(regexp = "price_asc|price_desc|...")`.
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
Implement cache-aside with SETNX single-flight lock
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Steps
- **Step 1:** Inject `CACHE_MANAGER` and the raw `ioredis` client (`@nestjs-modules/ioredis` or a factory provider) into `ProductService`.
- **Step 2:** Inside `findAll(query)`:
  - build the cache key + lock key via `buildListKey`;
  - check `cacheManager.get(key)` — hit → log `cache_hit`, return immediately;
  - miss → `redis.set(lockKey, uuid, 'NX', 'EX', 3)`;
  - lock acquired → log `cache_miss_rebuild`, query source, `cacheManager.set(key, data, 90000)`, release the lock via a Lua script that checks uuid.
- **Step 3:** Lock NOT acquired → log `cache_wait_for_rebuild`, `sleep 80ms`, retry the cache read, max 5 attempts; over budget → degrade to source query + log `cache_lock_timeout`.
- **Step 4:** Write a concurrency unit test using `Promise.all(Array(10).fill(0).map(() => service.findAll(q)))` and assert exactly one data-source query.

### 2. Minimum acceptance criteria
- 10 concurrent requests for the same key produce exactly 1 `cache_miss_rebuild`, 9 `cache_wait_for_rebuild`.
- Lock release uses a Lua compare-and-delete by uuid, never a blind `DEL`.
- Retry loop ≤5 attempts × 50-100ms with a fallback degrade.

### 3. Nice to have
- Metrics counters `cache.rebuild.count` + `cache.wait.count` for observability.
- Dynamic lock TTL based on average rebuild duration (start at 3s).

### codeImplementations
#### 0
##### lang
typescript
##### guide
**Main library:** **`ioredis`** raw client for SETNX/EVAL + **`@nestjs/cache-manager`** for cache value read/write.

**API mapping:**
- `cacheManager.set(key, val, 90_000)` -> store cache value with ms TTL.
- `redis.set(lockKey, uuid, 'NX', 'EX', 3)` -> atomic SETNX with TTL seconds.
- `redis.eval(luaCompareDel, 1, lockKey, uuid)` -> safe lock release.

**Differences / gotchas:**
- `ioredis.set` with `'NX', 'EX', 3` is **atomic** — do not replace with `SETNX` + `EXPIRE` separately (race).
- `sleep` in NestJS tests uses a `setTimeout` Promise, never block the event loop.
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
**Main library:** **`StackExchange.Redis.IDatabase`** raw for SETNX/EVAL + **`IDistributedCache`** for cache value.

**API mapping:**
- `redis.set NX EX` -> `db.StringSetAsync(lockKey, val, TimeSpan.FromSeconds(3), When.NotExists)`.
- `redis.eval` -> `db.ScriptEvaluateAsync(luaScript, new RedisKey[] { lockKey }, new RedisValue[] { uuid })`.

**Differences / gotchas:**
- `When.NotExists` is the canonical enum — no need for raw command strings.
- Use `Task.Delay` for sleeps.
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
**Main library:** **`go-redis/v9`** — `SetNX` + `Eval` raw commands, cache-aside written by hand.

**API mapping:**
- `redis.set NX EX` -> `rdb.SetNX(ctx, lockKey, uuid, 3*time.Second)`.
- `redis.eval` -> `rdb.Eval(ctx, releaseLua, []string{lockKey}, uuid)`.

**Differences / gotchas:**
- `SetNX` returns `*BoolCmd` — `.Val()` true means acquired.
- `time.Sleep(80*time.Millisecond)` for retry waits.
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
**Main library:** **`StringRedisTemplate`** — `setIfAbsent` for SETNX + `execute(DefaultRedisScript, ...)` for Lua release.

**API mapping:**
- `redis.set NX EX` -> `redisTemplate.opsForValue().setIfAbsent(lockKey, uuid, Duration.ofSeconds(3))`.
- `redis.eval` -> `redisTemplate.execute(new DefaultRedisScript<>(releaseLua, Long.class), List.of(lockKey), uuid)`.

**Differences / gotchas:**
- `setIfAbsent(key, val, ttl)` returns `Boolean` (may be null) — null-safe.
- `Thread.sleep` for retry — NEVER inside reactive flows, use `Mono.delay` instead.
##### example
```java
public Page findAll(ListQuery q) {
    String key = buildListKey(q.page(), q.limit(), q.sort());
    String lockKey = "lock:" + key;
    String uuid = UUID.randomUUID().toString();
    String cached = redisTemplate.opsForValue().get(key);
    if (cached != null) { log.info("cache_hit {}", key); return parse(cached); }
    Boolean acquired = redisTemplate.opsForValue().setIfAbsent(lockKey, uuid, Duration.ofSeconds(3));
    if (Boolean.TRUE.equals(acquired)) { /* rebuild + release via Lua */ }
    return waitAndRetry(key);
}
```
<!-- @starci/seperator -->
## 3
### title
<!-- @starci/seperator -->
Invalidate list cache by prefix after mutations
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Steps
- **Step 1:** In `ProductService.create()` and `update()`, after a successful write call `invalidateListCache()`.
- **Step 2:** Implement `invalidateListCache()` with `SCAN MATCH products:list:* COUNT 100` + batch `DEL`, never `KEYS`.
- **Step 3:** Wrap invalidation in try/catch — if write throws, do NOT invalidate; log the number of keys deleted.
- **Step 4:** Verify with `redis-cli SCAN 0 MATCH products:list:*` before and after a mutation.

### 2. Minimum acceptance criteria
- After a mutate, every key matching prefix `products:list:*` is deleted, the next GET is a miss.
- No use of `KEYS` (blocking).
- Failed writes (exception) do NOT invalidate (cache stays intact).

### 3. Nice to have
- Maintain `SADD products:list:keys <key>` on `cacheManager.set` so invalidation is O(N) instead of SCAN O(M).
- Pub/sub channel `products:invalidate` for multi-instance setups (foreshadowing INSANE).

### codeImplementations
#### 0
##### lang
typescript
##### guide
**Main library:** **`ioredis`** — `scanStream({ match, count })` for async iteration + `del` batch.

**API mapping:**
- `KEYS pattern` -> `scanStream({ match: 'products:list:*', count: 100 })`.
- `cacheManager.del(key)` -> `redis.del(...keys)` batch.

**Differences / gotchas:**
- `scanStream` is a `Readable` stream — collect keys into an array then `del` once, not per event.
- `cacheManager.del` deletes one key at a time — use raw `ioredis.del(...)` for batches.
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
**Main library:** **`StackExchange.Redis`** — `IServer.Keys(pattern)` (uses SCAN internally) + `IDatabase.KeyDeleteAsync`.

**API mapping:**
- `scanStream` -> `_redis.GetServer(endpoint).Keys(pattern: "products:list:*", pageSize: 100)`.
- Batch del -> `db.KeyDeleteAsync(keys.ToArray())`.

**Differences / gotchas:**
- `IServer.Keys` defaults to SCAN when the server supports it.
- Must connect with `AllowAdmin = true` before calling `IServer.Keys`.
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
**Main library:** **`go-redis/v9`** — `Scan` iterator + variadic `Del`.

**API mapping:**
- `scanStream` -> `iter := rdb.Scan(ctx, 0, "products:list:*", 100).Iterator()`.
- Batch del -> `rdb.Del(ctx, keys...)`.

**Differences / gotchas:**
- `iter.Next(ctx)` returns bool — accumulate keys then `Del` at the end.
- In cluster mode use `rdb.ScanType` per node.
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
**Main library:** **`StringRedisTemplate`** — `execute(RedisCallback)` for raw SCAN + `delete(Collection)` batch.

**API mapping:**
- `scanStream` -> `ScanOptions.scanOptions().match(pattern).count(100).build()` + `Cursor<byte[]>`.
- Batch del -> `redisTemplate.delete(keys)`.

**Differences / gotchas:**
- Must `cursor.close()` to avoid leaks.
- Use `delete(Collection)` for batches, not per-key.
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
Smoke test stampede + invalidation and write the raw-output README
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Steps
- **Step 1:** Start the app.
  ```bash
  nest start --watch
  ```
- **Step 2:** Warm up + verify a hit for a specific key.
  ```bash
  curl "http://localhost:3000/products?page=1&limit=5&sort=price_desc"
  curl "http://localhost:3000/products?page=1&limit=5&sort=price_desc"
  ```
- **Step 3:** Flush cache + trigger stampede with 10 concurrent requests.
  ```bash
  redis-cli FLUSHDB
  for i in 1 2 3 4 5 6 7 8 9 10; do
    curl -s "http://localhost:3000/products?page=1&limit=5&sort=price_desc" &
  done
  wait
  ```
- **Step 4:** Mutate + verify invalidation.
  ```bash
  curl -X POST http://localhost:3000/products \
    -H "Content-Type: application/json" \
    -d '{ "name": "Keyboard", "price": 99 }'
  curl "http://localhost:3000/products?page=1&limit=5&sort=price_desc"
  curl "http://localhost:3000/products?page=2&limit=5&sort=name_asc"
  ```
- **Step 5:** Write the repo README with 6 sections: Challenge description, How to run, Architecture/Stack (Mermaid lock flow), Smoke Test (paste raw logs for three states + invalidation across ≥2 tuples), Code Execution Trace (≥3 hops), Design Decisions.

### 2. Minimum acceptance criteria
- Raw log of Step 3 shows exactly one `cache_miss_rebuild`, nine `cache_wait_for_rebuild`, no deadlock.
- After the mutation in Step 4, both `page=1 sort=price_desc` and `page=2 sort=name_asc` miss on the next read.
- README has all 6 sections with a real Code Execution Trace ≥3 `file:line -> method()` hops.

### 3. Nice to have
- Measure per-request response time during the stampede (p50/p95) versus a baseline without lock.
- Add a Grafana/Prometheus metrics panel for cache hit ratio.
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
Public repo containing the NestJS source + `docker-compose.yml` for Redis + README with all 6 sections (Challenge description, How to run, Architecture/Stack with a Mermaid lock flow, Smoke Test with raw logs for the three states `cache_hit` / `cache_miss_rebuild` / `cache_wait_for_rebuild` + invalidation across ≥2 query tuples, Code Execution Trace ≥3 `file:line -> method()` hops, Design Decisions).
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
