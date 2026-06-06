# Brief nội dung — V2 Migration M1 (FS + SD) — 8 lessons

> **Trạng thái:** ✅ **DONE 2026-06-02** — cả 8 lesson V2 đầy đủ (bodies 4-lang, challenges easy+medium, criteria sum 100, `# verified`, `audited.md` + E2E real stdout).
> **Format brief:** mỗi lesson = (1) nội dung/concept · (2) luồng demo · (3) challenges còn lại + purpose.
> **Quyết định nền:** docs đủ 4 lang (TS/Java/C#/Go), **E2E chỉ chạy thật trên TypeScript** (3 lang kia idiomatic + review tĩnh — ghi deviation `audited.md`); SD **chỉ easy+medium** (đã xóa hard/insane); mọi lang **cùng 1 API contract**.

---

## A. FS M1 — Database Integration & Caching (host backend, Docker infra-only)

Per-lang idiom xuyên suốt: **TS** NestJS+TypeORM/Mongoose/cache-manager · **Java** Spring Data JPA/Mongo / Spring Cache · **C#** EF Core / MongoDB.Driver / IDistributedCache · **Go** GORM / mongo-go-driver / go-redis.

### FS L0 — "SQL vs NoSQL — chọn mô hình lưu trữ dữ liệu"
- **Nội dung:** 1 backend cắm song song PG (relational, schema chặt) + Mongo (document, metadata linh hoạt) cho cùng nghiệp vụ; write/read path, schema rigidity, latency; ORM/ODM chỉ là lớp mapping.
- **Luồng demo:** `POST /compare/write` (dual-write, 2 id) → `GET /compare/read` (đối chiếu shape: SQL row cố định vs Mongo doc `_id/__v`) → `GET /compare/timings` (`{sqlMs,noSqlMs,deltaMs}`) → `DELETE /compare/all`.
- **Challenges:** `0-dual-store-books-api-easy` — dựng 2 luồng lưu trữ song song cho books, hiểu quan-hệ-chặt vs metadata-linh-hoạt. · `1-polyglot-persistence-ecommerce-medium` — order→PG(ACID) + clickstream→Mongo, `POST /orders` fan-out; proof: rollback PG khi lỗi, nêu không có distributed-tx.

### FS L1 — "Mô hình quan hệ và ORM: ánh xạ 1-1, 1-N, N-N"
- **Nội dung:** mô hình QUAN HỆ + cách ORM ánh xạ quan hệ (1-1 passport, 1-N toys, N-N owners) thành object; eager vs lazy; vì sao cần relations chặt.
- **Luồng demo:** `POST /cats` (tạo kèm relations) → `GET /cats/:id/with-relations` (eager-load nested) → `POST /cats/:id/toys` (1-N mutation, FK auto). *(E2E: toys [Ball, Laser Pointer] ✓)*
- **Challenges:** `0-library-author-book-tag-crud-easy` — Author 1-N Book, Book N-N Tag; CRUD + đọc kèm relations nested. · `1-typeorm-index-jsonb-relations-cascade-medium` — index + jsonb column + cascade delete; proof EXPLAIN dùng index, cascade kéo con, jsonb query đúng.

### FS L2 — "Mô hình document và ODM: nhúng vs tham chiếu, cập nhật atomic"
- **Nội dung:** document model (schema linh hoạt, mảng/embedded, atomic `$inc`) vs quan hệ; khi nào embed khi nào ref; atomic tránh race.
- **Luồng demo:** `POST /cats` (doc hobbies[] + metadata) → `GET /cats?hobby=x` (query phần tử mảng) → `POST /cats/:id/like` ×N (atomic `$inc`). *(E2E: likes 1→2 ✓)*
- **Challenges:** `0-mongoose-and-mongodb-easy` — document model catalog, schema linh hoạt + query mảng. · `1-embedded-referenced-documents-aggregation-medium` — embed vs ref + aggregation pipeline; proof chọn embed/ref đúng tình huống, aggregation group/lookup đúng, trade-off doc-size vs join.

### FS L3 — "Chiến lược caching: ba tầng cache (response / logic / data)"
- **Nội dung:** caching 3 tầng (response interceptor, logic manual, data query-cache); cache-aside, TTL, invalidation; vì sao lần 2 nhanh hơn (HIT). Redis = store.
- **Luồng demo:** `POST /cats/seed?count=1000` → `GET /cats/logic-layer` ×2 (lần 2 = HIT, timestamp trùng) → `DELETE .../cache` → `GET` lại (MISS, timestamp mới). *(E2E: HIT ts trùng → MISS ts mới ✓)*
- **Challenges:** `0-caching-with-redis-easy` — cache-aside 1 endpoint, MISS→set/HIT→serve/TTL hết. · `1-pagination-redis-cache-stampede-control-medium` — cache pagination + chống stampede (single-flight/mutex); proof N request đồng thời khi key hết hạn chỉ 1 lần hit DB.

---

## B. SD M1 — Database Fundamentals (docker compose, backend container)

Góc nhìn SD = **tradeoff @ scale + benchmark** (khác FS = application integration). Per-lang idiom tương tự FS.

### SD L0 — "SQL vs NoSQL"
- **Nội dung:** query shape nào hợp engine nào; seed cùng dataset 2 engine rồi benchmark; "đo, đừng đoán".
- **Luồng demo:** `POST /api/seed?count=1000` → `POST /api/sql/products` + `GET .../category/:cat` → `GET /api/nosql/products/category/:cat` → `GET /api/compare` (`findByCategory`/`search` latency 2 engine).
- **Challenges:** `0-product-catalog-sql-nosql-mirror-easy` — mirror 10k products 2 engine, 4 query shape + EXPLAIN thật, verdict engine-nào-thắng từng shape. · `1-polyglot-storage-decision-medium` — orders+inventory→PG(ACID), sessions+catalog→Mongo(TTL); cross-tx + TTL index + k6 @1k RPS.

### SD L1 — "Indexing và tối ưu truy vấn: từ sequential scan tới B-tree"
- **Nội dung:** index B-tree, selectivity, query planner; seq scan vs index scan; composite/covering; đọc EXPLAIN ANALYZE.
- **Luồng demo:** `POST /api/seed/100000` → `GET /api/query/no-index` vs `/with-index` (so `executionTimeMs`) → `GET /api/compare` (plan Seq Scan vs Index) → `GET /api/stats`. *(E2E: Seq Scan 26ms vs Index 12ms ✓)*
- **Challenges:** `0-index-tuning-explain-driven-easy` — tune 3 query Seq Scan→Index Scan, dẫn chứng EXPLAIN before/after, biện minh theo selectivity. · `1-n-plus-1-and-pool-tuning-medium` — sửa N+1 + tune connection pool, benchmark k6 @1k RPS.

### SD L2 — "Replication và Partitioning: scale read/write"
- **Nội dung:** streaming replication (primary→replica), read/write split, replication lag (LSN); table partitioning RANGE(created_at).
- **Luồng demo:** `POST /api/seed/1000` (→primary) → `POST /api/orders` (→primary) + `GET /api/orders` (←replica) → `GET /api/replication/status` (lag/LSN) → `GET /api/partitions`. *(E2E: streaming lag=0, replay_lsn=sent_lsn ✓)*
- **Challenges:** `0-streaming-replication-lab-easy` — dựng primary+standby, chứng minh replication lag end-to-end (saturate primary, đo LSN lag). · `1-read-write-split-nestjs-medium` — datasource router write→primary/read→replica + fallback khi replica lag/down, test k6 + fault injection.

### SD L3 — "Sharding: hash shard key, targeted vs scatter-gather"
- **Nội dung:** horizontal partitioning; shard key (hashed), targeted (1 shard) vs scatter-gather (mọi shard), chunk distribution/balance, vì sao chọn shard key tốt; mongos router.
- **Luồng demo:** `POST /api/seed/10000` → `POST /api/users` + `GET /api/users/:userId` (targeted, 1 shard) → `GET /api/users/country/:c` (scatter-gather) → `GET /api/shards/distribution`. *(E2E: count 10001 rải 2 shard cân bằng, nchunks 4 ✓)*
- **Challenges:** `0-hash-sharding-router-easy` — hash router 4 shard `hash(tenant_id) mod 4`, seed 100K, verify balance ±5%, document hotspot. · `1-consistent-hashing-rebalance-medium` — consistent-hashing ring, chứng minh thêm node chỉ di chuyển ~1/(N+1) key.

---

## C. Bảng challenge tổng hợp (16 challenge, mỗi cái criteria sum 100 = outcome 30 + approach 70)

| Khóa | Lesson | Easy (purpose tóm tắt) | Medium (purpose tóm tắt) |
|------|--------|------------------------|--------------------------|
| FS | L0 | dual-store books | polyglot order+clickstream |
| FS | L1 | library 1-N + N-N CRUD | index+jsonb+cascade |
| FS | L2 | document catalog + array | embed/ref + aggregation |
| FS | L3 | cache-aside + TTL | pagination + stampede control |
| SD | L0 | mirror 10k + 4 query shape + EXPLAIN | polyglot placement + cross-tx + k6 |
| SD | L1 | tune 3 query EXPLAIN-driven | N+1 + pool tuning k6 |
| SD | L2 | streaming replication lab | read/write split + fallback |
| SD | L3 | hash router 4 shard balance | consistent-hashing rebalance |

---

## D. Bằng chứng E2E (TypeScript, stdout thật — chi tiết trong từng `audited.md`)
| Lesson | Proof |
|--------|-------|
| FS L0 | dual-write 2 id (UUID + ObjectId); timings deltaMs |
| FS L1 | 1:1+1:N+N:N nested; addToy → toys grew |
| FS L2 | atomic `$inc` likes 1→2 |
| FS L3 | cache HIT (ts trùng) → invalidate → MISS (ts mới) |
| SD L0 | benchmark findByCategory/search 2 engine |
| SD L1 | EXPLAIN Seq Scan 26ms vs Index 12ms |
| SD L2 | replication streaming lag=0; partitions RANGE |
| SD L3 | cluster 8-container; seed 10k rải 2 shard cân bằng |

> Port 3000 bận toàn bộ → mỗi lesson chạy PORT random / `compose_test.yaml` ephemeral (đã `down -v` + xoá).

## E. Pending
- Repo `backend/` → `0-typescript/` (§5.3) cho 8 lesson.
- Java/C#/Go scaffold + E2E thật (nếu nâng scope khỏi docs-4lang/E2E-TS).
- M2+ cả 2 khóa chưa migrate.
