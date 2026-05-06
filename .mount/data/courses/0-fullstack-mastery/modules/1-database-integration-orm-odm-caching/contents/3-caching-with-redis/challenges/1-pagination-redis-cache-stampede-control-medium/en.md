# title
Optimizing Paginated APIs with Redis Cache and Stampede Control

# description
This medium-level coding challenge focuses on practical caching in NestJS. You will implement cache-aside for the paginated GET /products listing with sorting, and use a Redis lock to reduce cache stampede when concurrent requests miss cache together.

# requirements
## 0
### purpose
Standardize cache keys by query params to avoid mixed responses across request variants.
### technicalConstraints
Cache key must include `page`, `limit`, and `sort` in this format: `products:list:page={page}:limit={limit}:sort={sort}`; list cache TTL is 90 seconds; Nest cache layer must use `KeyvRedis`.
### proTipsHints
- Put cache key building logic in a helper function to avoid formatting errors.
- Normalize default query values before generating the key.

## 1
### purpose
Implement cache-aside flow for paginated product listing.
### technicalConstraints
`GET /products` must check cache first; on miss, read source, set cache, and return response with at least `items`, `page`, `limit`, and `total`.
### proTipsHints
- Log cache read/write keys for easier debugging.
- Keep response shape stable to verify hit/miss behavior.

## 2
### purpose
Reduce backend pressure under burst traffic with stampede protection.
### technicalConstraints
On cache miss, only one request is allowed to rebuild cache through a Redis lock key (lock TTL 3-5 seconds); other requests must briefly wait/retry and re-read cache instead of querying source together.
### proTipsHints
- Use short retry loops (for example, every 50-100ms, limited attempts).
- Log states `cache_miss_rebuild` and `cache_wait_for_rebuild` as runtime evidence.

## 3
### purpose
Ensure complete invalidation when data changes.
### technicalConstraints
After `POST /products` or `PATCH /products/:id`, remove all related list keys for products (not only a single key).
### proTipsHints
- Use a clear key prefix to support pattern-based invalidation.
- Invalidate only after successful write.

### forbidden
- No Redis lock while claiming stampede protection -> **0 prompt concurrency control**.
- Incomplete invalidation causing stale data after update -> **0 prompt invalidation correctness**.
- Screenshot-only evidence without raw output/log text -> **0 prompt technical evidence**.
- One fixed cache key for all page/limit/sort variants -> **0 prompt cache key design**.

# prerequisites
## 0
### text
Node.js >= 18
## 1
### text
NestJS CLI
## 2
### text
Docker (to run Redis)
## 3
### text
npm install

# steps

## 0
### title
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

## 1
### title
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

## 2
### title
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

## 3
### title
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

## 4
### title
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

# outputs
## 0
### text
Design correct query-aware cache keys for paginated endpoints to prevent cross-variant response mix-ups.
## 1
### text
Implement end-to-end cache-aside read flow with Redis for list APIs in NestJS.
## 2
### text
Apply Redis lock strategy to reduce cache stampede under concurrent cache misses.
## 3
### text
Perform reliable prefix-based invalidation after writes to avoid stale cache across page/sort variants.
## 4
### text
Provide technical evidence via raw output/logs for `cache_hit`, `cache_miss_rebuild`, and `cache_wait_for_rebuild` states.

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
GitHub Repository Link
### description
Repository includes source code, Redis configuration, and README evidence for pagination caching, stampede protection, and invalidation flow.
### score
30
### prompts
#### 0
##### title
Correct cache key design and cache-aside flow
##### score
10
##### promptText
Evaluate with rubric (max 10 points):

- Criterion 1 (4 points): Cache key consistently includes normalized `page`, `limit`, and `sort`.
- Criterion 2 (3 points): `GET /products` follows correct cache-aside flow (hit/miss/set).
- Criterion 3 (3 points): Paginated response correctly returns `items`, `page`, `limit`, and `total`.

Scoring rule: each criterion gets full points only when fully satisfied; otherwise that criterion gets 0.
#### 1
##### title
Correct cache stampede protection
##### score
10
##### promptText
Evaluate with rubric (max 10 points):

- Criterion 1 (4 points): Redis lock key with short TTL is used to coordinate concurrent misses.
- Criterion 2 (3 points): Evidence shows only one request rebuilds cache while others wait/retry.
- Criterion 3 (3 points): No deadlock/infinite-wait behavior in concurrency test flow.

Scoring rule: each criterion gets full points only when fully satisfied; otherwise that criterion gets 0.
#### 2
##### title
Correct invalidation and runtime evidence
##### score
10
##### promptText
Evaluate with rubric (max 10 points):

- Criterion 1 (4 points): `POST/PATCH` clears all related list cache entries using an appropriate prefix strategy.
- Criterion 2 (3 points): No stale data is observed across main query variants after mutate.
- Criterion 3 (3 points): Raw output/log evidence is provided for behavior before and after invalidation.

Scoring rule: each criterion gets full points only when fully satisfied; otherwise that criterion gets 0.

# difficulty
medium

# score
30
