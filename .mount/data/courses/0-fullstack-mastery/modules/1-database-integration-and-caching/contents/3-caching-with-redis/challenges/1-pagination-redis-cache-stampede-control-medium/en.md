# title
<!-- @starci/seperator -->
Optimizing Paginated APIs with Redis Cache and Stampede Control
<!-- @starci/seperator -->
# description
<!-- @starci/seperator -->
This medium-level coding challenge focuses on practical caching in NestJS.
You will implement cache-aside for the paginated GET /products listing with sorting, and use a Redis lock to reduce cache stampede when concurrent requests miss cache together.
<!-- @starci/seperator -->
# requirements
## 0
### purpose
<!-- @starci/seperator -->
Standardize cache keys by query params to avoid mixed responses across request variants.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
Cache key must include `page`, `limit`, and `sort` in this format: `products:list:page={page}:limit={limit}:sort={sort}`; list cache TTL is 90 seconds; Nest cache layer must use `KeyvRedis`.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Put cache key building logic in a helper function to avoid formatting errors.
- Normalize default query values before generating the key.
<!-- @starci/seperator -->
## 1
### purpose
<!-- @starci/seperator -->
Implement cache-aside flow for paginated product listing.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
`GET /products` must check cache first; on miss, read source, set cache, and return response with at least `items`, `page`, `limit`, and `total`.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Log cache read/write keys for easier debugging.
- Keep response shape stable to verify hit/miss behavior.
<!-- @starci/seperator -->
## 2
### purpose
<!-- @starci/seperator -->
Reduce backend pressure under burst traffic with stampede protection.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
On cache miss, only one request is allowed to rebuild cache through a Redis lock key (lock TTL 3-5 seconds); other requests must briefly wait/retry and re-read cache instead of querying source together.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Use short retry loops (for example, every 50-100ms, limited attempts).
- Log states `cache_miss_rebuild` and `cache_wait_for_rebuild` as runtime evidence.
<!-- @starci/seperator -->
## 3
### purpose
<!-- @starci/seperator -->
Ensure complete invalidation when data changes.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
After `POST /products` or `PATCH /products/:id`, remove all related list keys for products (not only a single key).
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Use a clear key prefix to support pattern-based invalidation.
- Invalidate only after successful write.
<!-- @starci/seperator -->
### forbidden
<!-- @starci/seperator -->
- No Redis lock while claiming stampede protection -> **0 prompt concurrency control**.
- Incomplete invalidation causing stale data after update -> **0 prompt invalidation correctness**.
- Screenshot-only evidence without raw output/log text -> **0 prompt technical evidence**.
- One fixed cache key for all page/limit/sort variants -> **0 prompt cache key design**.
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
NestJS CLI
<!-- @starci/seperator -->
## 2
### text
<!-- @starci/seperator -->
Docker (to run Redis)
<!-- @starci/seperator -->
## 3
### text
<!-- @starci/seperator -->
npm install
<!-- @starci/seperator -->
# steps

## 0
### title
<!-- @starci/seperator -->
Initialize project and configure Redis cache
### body
### 1. Steps
- Step 1: Create project and install cache/redis packages.
```bash
nest new caching-with-redis-medium
cd caching-with-redis-medium
npm i @nestjs/cache-manager keyv @keyv/redis cacheable
```
- Step 2: Create `docker-compose.yml` for Redis.
```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```
- Step 3: Start Redis and configure `CacheModule` in `AppModule`.
```bash
docker compose up -d
```

### 2. Minimum acceptance criteria
- Redis runs successfully on `localhost:6379`.
- App boots without cache connection errors.
- CacheModule uses `KeyvRedis` (memory fallback is optional).

### 3. Nice to have
- Move `REDIS_HOST`, `REDIS_PORT`, `CACHE_TTL` to env config.
- Add a simple Redis health-check endpoint.
<!-- @starci/seperator -->
## 1
### title
<!-- @starci/seperator -->
Build products API with pagination and sorting
### body
### 1. Steps
- Step 1: Create `ProductModule`, `ProductService`, and `ProductController`.
- Step 2: Use in-memory array as initial data source (10-20 sample items).
- Step 3: Implement `GET /products?page=&limit=&sort=` with pagination.
- Step 4: Implement `POST /products` and `PATCH /products/:id` for data changes.

### 2. Minimum acceptance criteria
- List endpoint returns correct `items`, `page`, `limit`, and `total`.
- Query `page`, `limit`, and `sort` work as expected.
- Write endpoints are stable.

### 3. Nice to have
- Add DTO + class-validator for query/body.
- Standardize sort enum (`price_asc`, `price_desc`, `name_asc`, ...).
<!-- @starci/seperator -->
## 2
### title
<!-- @starci/seperator -->
Integrate cache-aside and Redis lock for stampede protection
### body
### 1. Steps
- Step 1: Implement cache key builder with query params:
  - `products:list:page={page}:limit={limit}:sort={sort}`.
- Step 2: In `GET /products`:
  - read cache first;
  - return immediately on hit;
  - on miss, try acquiring lock key;
  - lock holder queries source + sets cache + releases lock;
  - non-lock holders wait briefly and re-read cache.
- Step 3: Add explicit logs for:
  - `cache_hit`
  - `cache_miss_rebuild`
  - `cache_wait_for_rebuild`

### 2. Minimum acceptance criteria
- Concurrent requests on miss do not trigger excessive duplicate source queries.
- Only one request rebuilds cache for the same key at a given time.
- Raw logs clearly show all three runtime states.

### 3. Nice to have
- Add simple counter for rebuild occurrences vs concurrent request count.
- Define clear retry/timeouts to avoid infinite waiting.
<!-- @starci/seperator -->
## 3
### title
<!-- @starci/seperator -->
Invalidate all list cache variants after write operations
### body
### 1. Steps
- Step 1: After `POST /products` and `PATCH /products/:id`, delete list keys by prefix `products:list:*`.
- Step 2: Re-run test flow to verify:
  - before mutate: `miss -> hit`;
  - after mutate: first `GET` must be miss with updated data;
  - next `GET` becomes hit.

### 2. Minimum acceptance criteria
- No stale data after update/create.
- Query variants (page/limit/sort) do not use stale cache after mutate.
- Raw output/log evidence exists for invalidation flow.

### 3. Nice to have
- Extract invalidation helper for reuse.
- Add tests for common query combinations.
<!-- @starci/seperator -->
## 4
### title
<!-- @starci/seperator -->
Test concurrency with a short script and text logs
### body
### 1. Steps
- Step 1: Run the app.
```bash
nest start --watch
```
- Step 2: Warm one key and confirm hit.
```bash
curl "http://localhost:3000/products?page=1&limit=5&sort=price_desc"
curl "http://localhost:3000/products?page=1&limit=5&sort=price_desc"
```
- Step 3: Trigger invalidation through a write.
```bash
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -d '{ "name": "Keyboard", "price": 99 }'
```
- Step 4: Fire concurrent requests on the same key to test stampede control.
```bash
for i in 1 2 3 4 5; do
  curl "http://localhost:3000/products?page=1&limit=5&sort=price_desc" &
done
wait
```

### 2. Minimum acceptance criteria
- Logs show only one request rebuilding cache during miss.
- Other requests wait/retry and then read from cache.
- No deadlock or infinite waiting errors.

### 3. Nice to have
- Capture per-request latency before/after cache.
- Add one more test key (`page=2`, `sort=name_asc`).
<!-- @starci/seperator -->
# outputs
## 0
### text
<!-- @starci/seperator -->
Design correct query-aware cache keys for paginated endpoints to prevent cross-variant response mix-ups.
<!-- @starci/seperator -->
## 1
### text
<!-- @starci/seperator -->
Implement end-to-end cache-aside read flow with Redis for list APIs in NestJS.
<!-- @starci/seperator -->
## 2
### text
<!-- @starci/seperator -->
Apply Redis lock strategy to reduce cache stampede under concurrent cache misses.
<!-- @starci/seperator -->
## 3
### text
<!-- @starci/seperator -->
Perform reliable prefix-based invalidation after writes to avoid stale cache across page/sort variants.
<!-- @starci/seperator -->
## 4
### text
<!-- @starci/seperator -->
Provide technical evidence via raw output/logs for `cache_hit`, `cache_miss_rebuild`, and `cache_wait_for_rebuild` states.
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
Keyv
<!-- @starci/seperator -->
### url
<!-- @starci/seperator -->
https://www.npmjs.com/package/keyv
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
Submit your solution via the link below.
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
