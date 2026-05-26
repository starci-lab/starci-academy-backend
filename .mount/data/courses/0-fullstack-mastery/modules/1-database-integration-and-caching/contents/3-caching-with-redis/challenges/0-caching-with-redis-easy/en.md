# title
<!-- @starci/seperator -->
Cache Product List with Redis
<!-- @starci/seperator -->
# description
<!-- @starci/seperator -->
This is a hands-on caching challenge in **NestJS**. You will integrate **Redis** to cache the `GET /products` endpoint and implement correct cache invalidation when product data changes.
<!-- @starci/seperator -->
# requirements
## 0
### purpose
<!-- @starci/seperator -->
Set up a real Redis-backed NestJS environment for cache practice.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
Redis must run via `docker compose`; app must connect through `CacheModule` using `KeyvRedis` (do not use `cache-manager-redis-store`).
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Start Redis before app boot to isolate connection issues.
- Use explicit cache keys like `products:list`.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
6
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Scoring rubric (max 6):

- Criterion A (2 points): Redis runs in real via `docker compose`, app boots and connects successfully (no in-memory fallback).
- Criterion B (2 points): `CacheModule` is configured correctly with `KeyvRedis` (Keyv + @keyv/redis) with a default TTL of 60s.
- Criterion C (2 points): Host/port/TTL configuration is centralized via env or constants, not hard-coded scattered.

Rule: each criterion fully met receives its full points; partial/incorrect receives 0.
<!-- @starci/seperator -->
## 1
### purpose
<!-- @starci/seperator -->
Implement a minimal product API to focus on cache behavior.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
Required endpoints: `GET /products`, `POST /products`; source data stays in-memory (array), no real DB required. Response shape is stable and `id` is incremental.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Keep response shape stable so cache-hit/miss comparisons are easy.
- Use incremental ids for quick verification.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
0
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Shared with requirement 2 (cache-aside flow + endpoint contract for `GET /products` and `POST /products`).
<!-- @starci/seperator -->
## 2
### purpose
<!-- @starci/seperator -->
Implement read-through cache for product listing and correct invalidation on writes.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
`GET /products` must check cache first; on miss read the data source, `set` cache with TTL 60s, then return; on hit return data directly from Redis. After `POST /products`, call `del('products:list')` so the next `GET` fetches fresh source and repopulates cache.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Log `cache hit` / `cache miss` clearly to verify runtime behavior.
- Use one dedicated key for the list endpoint.
- Invalidate immediately after a successful write — no delay.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
9
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Scoring rubric (max 9):

- Criterion A (3 points): `GET /products` implements correct cache-aside (check cache -> miss reads source + `set` TTL 60s -> hit returns from Redis), with logs that distinguish hit/miss.
- Criterion B (2 points): `POST /products` adds a new item and deletes the `products:list` cache key immediately after a successful write.
- Criterion C (2 points): Endpoints return the correct contract (list for `GET`, new item for `POST`) and response shape stays stable across hit/miss/after-invalidate.
- Criterion D (2 points): The `miss -> hit -> invalidate -> miss -> hit` sequence runs correctly end-to-end with no stale data after a write.

Rule: each criterion fully met receives its full points; partial/incorrect receives 0.
<!-- @starci/seperator -->
## 3
### purpose
<!-- @starci/seperator -->
Prove cache behavior with real raw output and write README following the 6-section spec.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
README in the repo must include 6 sections: Challenge description, How to run, Architecture/Stack, Smoke Test (paste raw request/response for the `miss -> hit -> invalidate -> miss -> hit` sequence), Code Execution Trace (>=3 hit points `file:line -> method()`), Design Decisions.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Paste real raw `curl` output, no paraphrasing, no screenshots.
- In Code Execution Trace, name the touch point in `CacheInterceptor` or `CACHE_MANAGER.get/set/del`.
<!-- @starci/seperator -->
### forbidden
<!-- @starci/seperator -->
- Not using real Redis, falling back to in-memory cache for demo -> **0 prompt cache infra**.
- `GET /products` skips cache-first logic before data source -> **0 prompt cache flow**.
- Not deleting cache after `POST /products` so responses stay stale -> **0 prompt invalidation**.
- Using screenshots instead of raw output/log to prove cache -> **0 prompt evidence**.
- Fabricating raw output (paste log that did not come from the app) -> **0 whole challenge**.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
5
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Scoring rubric (max 5):

- Criterion A (2 points): README contains all 6 required sections (Challenge description, How to run, Architecture/Stack, Smoke Test, Code Execution Trace, Design Decisions).
- Criterion B (2 points): Smoke Test pastes real raw output for the `miss -> hit -> invalidate -> miss -> hit` sequence, with logs distinguishing hit/miss.
- Criterion C (1 point): Code Execution Trace contains >=3 real `file:line -> method()` hit points, no placeholders.

Rule: each criterion fully met receives its full points; partial/incorrect receives 0.
<!-- @starci/seperator -->
# outputs
## 0
### text
<!-- @starci/seperator -->
You implement read-through caching with **Redis** in **NestJS** via `CacheModule` + `KeyvRedis`.
<!-- @starci/seperator -->
## 1
### text
<!-- @starci/seperator -->
You understand cache hit/miss and measure them via real runtime logs.
<!-- @starci/seperator -->
## 2
### text
<!-- @starci/seperator -->
You apply correct cache invalidation when source data changes.
<!-- @starci/seperator -->
## 3
### text
<!-- @starci/seperator -->
You present technical evidence via raw output instead of subjective description.
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
Docker Desktop (to run Redis)
<!-- @starci/seperator -->
# steps

## 0
### title
<!-- @starci/seperator -->
Bootstrap project and configure Redis cache
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Steps
- **Step 1:** Create project and install cache/redis packages.
  ```bash
  nest new caching-with-redis-easy
  cd caching-with-redis-easy
  npm i @nestjs/cache-manager keyv @keyv/redis cacheable
  ```
- **Step 2:** Create `docker-compose.yml` to run Redis.
  ```yaml
  services:
    redis:
      image: redis:7-alpine
      ports:
        - "6379:6379"
  ```
- **Step 3:** Run Redis and configure `CacheModule` in `AppModule` with `KeyvRedis` + TTL 60s.
  ```bash
  docker compose up -d
  ```

### 2. Minimum acceptance criteria
- Redis runs successfully at `localhost:6379`.
- App boots with no cache connection errors.
- `CacheModule` is configured with `KeyvRedis`, default TTL 60s.

### 3. Nice to have
- Externalize host/port/TTL via env through `ConfigModule`.
- Add a quick Redis health check.

### codeImplementations
#### 0
##### lang
typescript
##### guide
**Main library:** **`@nestjs/cache-manager`** + **`@keyv/redis`** (`keyv`, `cacheable`) — `CacheModule` async config uses `KeyvRedis` as the store.

**API mapping:**
- `cache-manager-redis-store` (legacy) -> `KeyvRedis` via `Keyv`.
- `register({ store, ttl })` -> `registerAsync({ useFactory: () => ({ stores: [new Keyv(new KeyvRedis(url))], ttl }) })`.

**Differences / gotchas:**
- TTL in `cache-manager` is in milliseconds (60000), unlike `ioredis` `EX` (seconds) and `node-redis` `PX` (ms).
- `CacheModule.registerAsync` must be `isGlobal: true` if you want `CACHE_MANAGER` injected in other modules without re-importing.
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
**Main library:** **`Microsoft.Extensions.Caching.StackExchangeRedis`** (`IDistributedCache`) — ASP.NET Core distributed cache backed by Redis.

**API mapping:**
- `CacheModule.register` -> `services.AddStackExchangeRedisCache(opt => opt.Configuration = "localhost:6379")`.
- `CACHE_MANAGER.get/set` -> `IDistributedCache.GetStringAsync` + `SetStringAsync` with `DistributedCacheEntryOptions`.

**Differences / gotchas:**
- `IDistributedCache` does not serialize POCO automatically — always `JsonSerializer.Serialize/Deserialize`.
- TTL is configured via `AbsoluteExpirationRelativeToNow`, not a global TTL.
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
**Main library:** **`github.com/redis/go-redis/v9`** + **`github.com/gin-gonic/gin`** — native client, no DI container; cache-aside written by hand.

**API mapping:**
- `CacheModule` -> singleton `*redis.Client` in `main.go`, passed into handlers via closure.
- `CACHE_MANAGER.get/set` -> `rdb.Get(ctx, key)` + `rdb.Set(ctx, key, val, ttl)`.

**Differences / gotchas:**
- `go-redis` returns `redis.Nil` when the key is absent — must `errors.Is(err, redis.Nil)` to distinguish miss vs system error.
- TTL is `time.Duration` (e.g. `60*time.Second`).
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
**Main library:** **`spring-boot-starter-data-redis`** + **Spring Cache** abstraction — `@EnableCaching` + `RedisCacheManager`.

**API mapping:**
- `CacheModule` -> `@EnableCaching` + auto-config `RedisCacheManager`.
- `CACHE_MANAGER.get/set` -> `@Cacheable` + `@CacheEvict` on service methods.

**Differences / gotchas:**
- TTL is configured via `RedisCacheConfiguration.entryTtl(Duration.ofSeconds(60))`, not per `@Cacheable`.
- `@CacheEvict(beforeInvocation = true)` evicts before the method runs to prevent stale keys after exceptions.
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
Create Product module with in-memory data
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Steps
- **Step 1:** Create `ProductModule`, `ProductService`, `ProductController`.
- **Step 2:** Initialize a `products` array with 3 sample items in the service.
- **Step 3:** Implement `findAll()` returning the list and `create()` adding a new product with incremental id.
- **Step 4:** Create endpoints `GET /products` and `POST /products`.

### 2. Minimum acceptance criteria
- `GET /products` returns the initial 3-product list.
- `POST /products` creates a new product with incremental id.
- Response shape stays stable across calls.

### 3. Nice to have
- Add DTO validation for `name`, `price` via `class-validator`.
- Normalize the response shape consistently.
<!-- @starci/seperator -->
## 2
### title
<!-- @starci/seperator -->
Integrate cache-aside and invalidation in ProductService
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Steps
- **Step 1:** Inject `CACHE_MANAGER` into `ProductService`.
- **Step 2:** In `findAll()`:
  - read key `products:list`;
  - if cached, return immediately (log `cache hit`);
  - otherwise read from array, `set` cache TTL 60s, then return (log `cache miss`).
- **Step 3:** In `create()`, after adding the item call `cacheManager.del('products:list')`.
- **Step 4:** Log clearly `Serving from cache` or `Serving from data source` to verify runtime.

### 2. Minimum acceptance criteria
- First `GET` is a miss, subsequent ones are hits.
- After `POST`, the cache key is deleted.
- Next `GET` after `POST` is a miss and returns the latest data.

### 3. Nice to have
- Add a simple cache hit ratio metric.
- Centralize the cache key into a constant to avoid typos.

### codeImplementations
#### 0
##### lang
typescript
##### guide
**Main library:** **`@nestjs/cache-manager`** (`CACHE_MANAGER`) — injected into service for manual `get`/`set`/`del` cache-aside.

**API mapping:**
- `CacheInterceptor` (decorator-driven) -> `CACHE_MANAGER.get/set/del` (programmatic).
- `@CacheTTL` -> `ttl` argument (ms) on `set`.

**Differences / gotchas:**
- `cacheManager.set(key, value, ttl)` — `ttl` is in **milliseconds** (60000), not seconds.
- To delete multiple keys by prefix, use `cacheManager.store.keys()` then `del` per key (Keyv does not support native pattern delete).
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
**Main library:** **`IDistributedCache`** — manual cache-aside with explicit JSON serialization.

**API mapping:**
- `CACHE_MANAGER.get/set/del` -> `GetStringAsync` + `SetStringAsync` + `RemoveAsync`.

**Differences / gotchas:**
- TTL via `DistributedCacheEntryOptions.AbsoluteExpirationRelativeToNow`.
- Always null-check `GetStringAsync` before `Deserialize`.
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
**Main library:** **`go-redis/v9`** — cache-aside via helper function because Go has no decorators.

**API mapping:**
- `CACHE_MANAGER.get/set/del` -> `rdb.Get/Set/Del`.

**Differences / gotchas:**
- Must `errors.Is(err, redis.Nil)` to distinguish miss vs system error.
- `rdb.Set(ctx, key, val, ttl)` — `ttl` is `time.Duration`.
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
**Main library:** **Spring Cache** (`@Cacheable`, `@CacheEvict`) with Redis backend.

**API mapping:**
- `CACHE_MANAGER.get/set` -> `@Cacheable(value = "products:list")`.
- `CACHE_MANAGER.del` -> `@CacheEvict(value = "products:list", allEntries = true)`.

**Differences / gotchas:**
- `@Cacheable` only caches by method args + name — service code never touches Redis directly.
- `@CacheEvict(beforeInvocation = false)` (default) evicts after the method succeeds.
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
Smoke test cache flow and write README with raw output
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Steps
- **Step 1:** Start the app.
  ```bash
  nest start --watch
  ```
- **Step 2:** Call `GET /products` twice in a row.
  ```bash
  curl http://localhost:3000/products
  curl http://localhost:3000/products
  ```
- **Step 3:** Create a new product.
  ```bash
  curl -X POST http://localhost:3000/products \
    -H "Content-Type: application/json" \
    -d '{ "name": "Monitor", "price": 399 }'
  ```
- **Step 4:** Call `GET /products` twice more to verify invalidate + recache.
  ```bash
  curl http://localhost:3000/products
  curl http://localhost:3000/products
  ```
- **Step 5:** Write the README with 6 sections: Challenge description, How to run, Architecture/Stack, Smoke Test (paste raw output from Steps 2-4), Code Execution Trace (>=3 hit points `file:line -> method()`), Design Decisions.

### 2. Minimum acceptance criteria
- Raw output/log proves the `miss -> hit -> invalidate -> miss -> hit` sequence.
- Response after creation contains the newly added product (`Monitor`).
- README has all 6 sections; Code Execution Trace has >=3 real hit points.

### 3. Nice to have
- Paste extra Redis key check log (`redis-cli KEYS 'products:*'`) for added credibility.
- Add a 60s wait case to verify TTL-based expiry.
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
GitHub Repository Link
<!-- @starci/seperator -->
### description
<!-- @starci/seperator -->
Public repo with NestJS source code + `docker-compose.yml` for Redis + README with all 6 sections (Challenge description, How to run, Architecture/Stack, Smoke Test with raw output for `miss -> hit -> invalidate -> miss -> hit`, Code Execution Trace with >=3 hit points, Design Decisions).
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
