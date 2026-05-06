# title
Cache Product List with Redis

# description
This is a hands-on caching challenge in NestJS. You will integrate Redis to cache the GET /products endpoint and implement correct cache invalidation when product data changes.

# requirements
## 0
### purpose
Set up a real Redis-backed NestJS environment for cache practice.
### technicalConstraints
Redis must run via `docker compose`; app must connect through `CacheModule` using `KeyvRedis` (do not use `cache-manager-redis-store`).
### proTipsHints
- Start Redis before app boot to isolate infra issues.
- Use explicit cache keys like `products:list`.

## 1
### purpose
Implement a minimal product API to focus on cache behavior.
### technicalConstraints
Required endpoints: `GET /products`, `POST /products`; source data stays in-memory (array), no real DB required.
### proTipsHints
- Keep response shape stable so cache-hit/miss comparisons are easy.
- Use incremental ids for quick verification.

## 2
### purpose
Implement read-through cache for product listing.
### technicalConstraints
`GET /products` must check cache first; on miss read the data source, set cache with TTL 60s, then return; on hit return data directly from Redis.
### proTipsHints
- Log `cache hit` / `cache miss` clearly.
- Keep one dedicated key for list response.

## 3
### purpose
Keep cache and source consistent after write operations.
### technicalConstraints
After `POST /products`, invalidate the list key so next `GET` fetches fresh source and repopulates cache.
### proTipsHints
- Invalidate immediately after successful write.
- Verify full flow: `miss -> hit -> invalidate -> miss -> hit`.

### forbidden
- Not using real Redis (fallbacking to in-memory cache only) -> **0 cache-infra prompt**.
- `GET /products` skipping cache-first logic -> **0 cache-flow prompt**.
- Not deleting cache after `POST /products` -> **0 invalidation prompt**.
- Using screenshots instead of raw output/log for cache proof -> **0 evidence prompt**.

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
Initialize the project and configure Redis
### body
### 1. Steps to follow
- Step 1: Create project and install cache dependencies.
```bash
nest new caching-with-redis-easy
cd caching-with-redis-easy
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
- Redis runs on `localhost:6379`.
- App boots with no cache connection errors.
- CacheModule uses `KeyvRedis` (memory fallback is optional) with default TTL 60s.

### 3. Nice to have
- Move Redis config to env variables.
- Add a lightweight Redis health check endpoint.

## 1
### title
Create ProductModule with in-memory data
### body
### 1. Steps to follow
- Step 1: Create `ProductModule`, `ProductService`, `ProductController`.
- Step 2: Seed 3 products in an in-memory array.
- Step 3: Implement `findAll()` and `create()` in service.
- Step 4: Expose `GET /products` and `POST /products` in controller.

### 2. Minimum acceptance criteria
- `GET /products` returns initial 3 products.
- `POST /products` adds a new product with incremental id.

### 3. Nice to have
- Add DTO validation for `name` and `price`.
- Keep consistent response shape for all product endpoints.

## 2
### title
Integrate caching and invalidation in ProductService
### body
### 1. Steps to follow
- Step 1: Inject `CACHE_MANAGER` into the service.
- Step 2: For `findAll()`:
  - read key `products:list`;
  - if cached, return immediately;
  - if missing, read from the array, set cache with TTL 60s, then return.
- Step 3: For `create()`, after inserting an item call `del('products:list')`.
- Step 4: Log clearly `Serving from cache` or `Serving from data source`.

### 2. Minimum acceptance criteria
- First `GET` is a miss, the next is a hit.
- After `POST`, the cache key is deleted.
- The next `GET` after `POST` is a miss and returns the freshest data.

### 3. Nice to have
- Track simple cache-hit ratio metrics.
- Store cache key in a constant to avoid typos.

## 3
### title
Test the caching flow
### body
### 1. Steps to follow
- Step 1: Start the app.
```bash
nest start --watch
```
- Step 2: Call `GET /products` twice.
```bash
curl http://localhost:3000/products
curl http://localhost:3000/products
```
- Step 3: Create one new product.
```bash
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -d '{ "name": "Monitor", "price": 399 }'
```
- Step 4: Call `GET /products` twice again to verify invalidate + recache.
```bash
curl http://localhost:3000/products
curl http://localhost:3000/products
```

### 2. Minimum acceptance criteria
- Raw logs/output prove `miss -> hit -> invalidate -> miss -> hit`.
- Response after create includes the new product.
- `updated` list data is not stale after the write operation.

### 3. Nice to have
- Paste Redis key verification logs (if available).
- Add one TTL-expiration check after ~60s.

# outputs
## 0
### text
Implement Redis read-through caching in NestJS correctly.
## 1
### text
Understand and verify cache hit/miss behavior with runtime evidence.
## 2
### text
Apply proper cache invalidation after write operations.
## 3
### text
Present reproducible technical proof using raw output text.

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
GitHub Repository Link
### description
Repository with source code + Redis configuration + README section evidencing the `miss/hit/invalidate` flow.
### score
20
### prompts
#### 0
##### title
Correct Redis and Cache Manager configuration
##### score
10
##### promptText
Grading rubric (max 10 points):

- Criterion 1 (4 points): Redis is correctly connected via `CacheModule` and `KeyvRedis`.
- Criterion 2 (3 points): `findAll()` implements read-through caching with TTL 60s.
- Criterion 3 (3 points): `create()` invalidates the correct list cache key.

Scoring rule: each criterion receives points only if fully satisfied; otherwise that criterion receives 0.
#### 1
##### title
Correct cache hit and cache invalidation flow
##### score
10
##### promptText
Grading rubric (max 10 points):

- Criterion 1 (4 points): Evidence proves first `GET` is miss and second `GET` is hit.
- Criterion 2 (3 points): After `POST`, cache is invalidated and next `GET` is miss.
- Criterion 3 (3 points): Post-invalidation response includes latest created data.

Scoring rule: each criterion receives points only if fully satisfied; otherwise that criterion receives 0.

# difficulty
easy

# score
20
