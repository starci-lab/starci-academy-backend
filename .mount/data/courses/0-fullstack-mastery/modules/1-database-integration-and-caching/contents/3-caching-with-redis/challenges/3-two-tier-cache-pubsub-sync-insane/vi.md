# title
<!-- @starci/seperator -->
Two-Tier Cache L1 LRU + L2 Redis với Pub/Sub Invalidation cho 1M user
<!-- @starci/seperator -->
# description
<!-- @starci/seperator -->
Challenge insane phát triển từ bản HARD. Bạn build **two-tier cache** L1 in-memory **LRU** per-instance + L2 **Redis** shared, đồng bộ invalidation cross-instance qua **Redis Pub/Sub** với loop-prevention (sender ID), capacity-plan cho **1M user / 100K RPS**, và chaos test khi instance crash hoặc Redis fail.
<!-- @starci/seperator -->
# requirements
## 0
### purpose
<!-- @starci/seperator -->
Build L1 in-memory LRU cache per-instance với capacity + TTL bound chứng minh hit ratio.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
L1 cache dùng `lru-cache` (Node) hoặc tương đương; max size 10000 entries (capacity-bounded), TTL 60s per entry; expose metric `l1.hit_count`, `l1.miss_count`, `l1.eviction_count`; thread-safe (concurrent set/get an toàn).
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- `lru-cache` v10+ có `max` + `ttl` built-in.
- Tránh L1 unbounded (`Map`) — sẽ leak memory với 1M user.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
15
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Rubric chấm điểm (tối đa 15):

- Tiêu chí A (5 điểm): L1 dùng LRU thật với `max=10000` + `ttl=60s`, không phải `Map` unbounded.
- Tiêu chí B (4 điểm): Concurrent set/get an toàn — verify bằng test 100 goroutine/worker không race.
- Tiêu chí C (3 điểm): Metric `l1.hit/miss/eviction` count chính xác (verified bằng đếm vs expected).
- Tiêu chí D (3 điểm): Eviction policy là LRU thật (least-recently-used bị evict trước), không phải FIFO.

Quy tắc chấm: mỗi tiêu chí làm đúng trọn vẹn thì nhận đủ điểm tiêu chí đó; thiếu/sai tiêu chí nào thì tiêu chí đó nhận 0 điểm.
<!-- @starci/seperator -->
## 1
### purpose
<!-- @starci/seperator -->
Build L2 Redis shared cache với fallback chain L1 → L2 → source và write-through.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
`get(key)` chạy chain: check L1 → miss thì check L2 → miss thì query source + populate cả L1 + L2 + return; `set(key, val)` write-through: set L1 + L2 cùng atomic; L2 TTL 600s (10× L1); response value đồng nhất giữa instances.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Promote L2 hit → L1 để increase L1 hit ratio next request.
- Bench L1 vs L2 vs source latency: L1 ~0.1µs, L2 ~1ms, source ~50ms.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
0
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Sử dụng chung với yêu cầu 2 (cache chain L1→L2→source + write-through + Pub/Sub invalidation).
<!-- @starci/seperator -->
## 2
### purpose
<!-- @starci/seperator -->
Đồng bộ invalidation cross-instance qua Redis Pub/Sub với sender ID loop-prevention.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
Mỗi instance bootstrap subscribe channel `cache:invalidate`; khi `delete(key)` hoặc `set(key, val)` local, publish `{ key, op: 'del' | 'set', senderId, timestamp }`; subscriber chỉ apply invalidation khi `senderId !== self.instanceId` để tránh loop; cập nhật L1 local; L2 đã sync qua write-through nên không re-set.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- `instanceId` = `process.pid + hostname + random` ổn định trong lifetime instance.
- Pub/Sub không guarantee delivery — combine với TTL L1 ngắn (60s) để self-heal.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
15
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Rubric chấm điểm (tối đa 15):

- Tiêu chí A (5 điểm): Instance A mutate key → instance B nhận pub/sub → L1 B invalidate đúng key trong < 50ms (verified bằng raw log timestamp).
- Tiêu chí B (4 điểm): Loop-prevention chính xác — sender skip self message, không có echo loop (verified bằng raw log message count: N instance × 1 mutate = N-1 invalidation apply, không phải N²).
- Tiêu chí C (3 điểm): Message schema chuẩn `{ key, op, senderId, timestamp }` (JSON), không paraphrase.
- Tiêu chí D (3 điểm): Self-heal khi Pub/Sub drop — TTL L1 ≤60s đảm bảo stale data tự expire trong 1 phút.

Quy tắc chấm: mỗi tiêu chí làm đúng trọn vẹn thì nhận đủ điểm tiêu chí đó; thiếu/sai tiêu chí nào thì tiêu chí đó nhận 0 điểm.
<!-- @starci/seperator -->
## 3
### purpose
<!-- @starci/seperator -->
Capacity planning cho 1M user / 100K RPS với số liệu memory + bandwidth chứng minh.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
README phải có section Capacity Planning với 4 phép tính: (a) số instance cần để serve 100K RPS với p95 < 50ms (giả định 1 instance ~5K RPS), (b) memory L1 per instance (10K entries × ~1KB/entry = ~10MB), (c) memory L2 Redis (1M user × 10 keys × 1KB = ~10GB → cần Redis cluster ≥3 shards), (d) bandwidth Pub/Sub (giả định 1K mutate/s × N instance × 200 byte/message); số liệu phải có nguồn (benchmark đo thật hoặc reference link).
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Dùng `redis-cli INFO memory` đo memory thật cho 100K entry mẫu.
- Plot latency vs RPS scaling — biết bottleneck ở đâu trước khi 100K.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
15
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Rubric chấm điểm (tối đa 15):

- Tiêu chí A (4 điểm): 4 phép tính capacity planning (instance count, L1 mem, L2 mem, Pub/Sub bandwidth) đầy đủ với formula + số.
- Tiêu chí B (4 điểm): Số liệu cite source — benchmark thật (`redis-cli INFO`, k6 output) HOẶC reference link (Redis docs, engineering blog).
- Tiêu chí C (4 điểm): Kết luận shard count Redis (≥3) + instance count app (≥20) match phép tính, không chỉ "tăng số" tùy ý.
- Tiêu chí D (3 điểm): Trade-off documented — vì sao chọn 10K L1 size (không 100K hay 1K), tại sao TTL L1 = 60s không 600s.

Quy tắc chấm: mỗi tiêu chí làm đúng trọn vẹn thì nhận đủ điểm tiêu chí đó; thiếu/sai tiêu chí nào thì tiêu chí đó nhận 0 điểm.
<!-- @starci/seperator -->
## 4
### purpose
<!-- @starci/seperator -->
Chaos test instance crash + Redis Pub/Sub fail để chứng minh self-healing.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
Chạy 3 instance qua docker-compose (`app-1`, `app-2`, `app-3`); kịch bản test: (a) kill `app-2` giữa mutate → assert `app-1` và `app-3` vẫn nhận invalidation, (b) `docker pause` Redis container 5s → assert app instances không crash + recover khi Redis up + L1 stale tự expire sau TTL, (c) network partition app-1 khỏi Redis 10s → assert app-1 fallback graceful (degrade to source query, không 500); capture stdout log + screenshot.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- `docker pause` simulate Redis hang.
- `iptables -A OUTPUT -d redis_ip -j DROP` simulate network partition Linux.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
15
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Rubric chấm điểm (tối đa 15):

- Tiêu chí A (5 điểm): 3 chaos scenario (instance crash, Redis pause, network partition) chạy thật trên docker-compose 3 instance, raw stdout commit vào `evidence/chaos/*.log`.
- Tiêu chí B (4 điểm): Instance crash scenario — surviving 2 instances vẫn nhận pub/sub invalidation đúng (verified bằng log).
- Tiêu chí C (3 điểm): Redis pause scenario — apps không crash, fallback graceful (degrade hoặc cached), recover khi Redis up.
- Tiêu chí D (3 điểm): Network partition scenario — partitioned app degrade source query, không 5xx, log warning, recover khi network restore.

Quy tắc chấm: mỗi tiêu chí làm đúng trọn vẹn thì nhận đủ điểm tiêu chí đó; thiếu/sai tiêu chí nào thì tiêu chí đó nhận 0 điểm.
<!-- @starci/seperator -->
## 5
### purpose
<!-- @starci/seperator -->
Bench cross-instance consistency end-to-end với 3-instance cluster dưới tải concurrent.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
Chạy `k6` 3 phút × 50 VU × 3 instance (load balance via nginx round-robin); 70% read + 30% mutate; capture metric: (i) p95 latency read, (ii) max staleness window (gap giữa mutate ở instance A đến L1 invalidation ở instance B), (iii) consistency rate (% read trả value match latest mutate); commit raw JSON `evidence/k6-cluster.json`.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Mutate request include timestamp body để verify staleness.
- Đo staleness = max(observed_value_timestamp - actual_mutate_timestamp).
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
10
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Rubric chấm điểm (tối đa 10):

- Tiêu chí A (4 điểm): Cluster bench chạy thật 3 phút × 50 VU × 3 instance, raw JSON commit.
- Tiêu chí B (3 điểm): Max staleness window < 500ms (verified bằng timestamp diff).
- Tiêu chí C (3 điểm): Consistency rate ≥ 99% (verified bằng % read match latest mutate trong 1s window).

Quy tắc chấm: mỗi tiêu chí làm đúng trọn vẹn thì nhận đủ điểm tiêu chí đó; thiếu/sai tiêu chí nào thì tiêu chí đó nhận 0 điểm.
<!-- @starci/seperator -->
## 6
### purpose
<!-- @starci/seperator -->
Viết README capacity-doc + Architecture diagram + Design Decisions với forbidden rules bảo vệ scale-correctness.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
README đủ 6 section, Architecture/Stack có Mermaid diagram 3 instance + Redis Pub/Sub channel + L1/L2 split; Smoke Test paste raw cluster bench + chaos log; Design Decisions chốt 3 quyết định scale: (1) lý do chọn LRU không LFU, (2) lý do TTL L1 = 60s không 600s, (3) lý do Pub/Sub không Streams.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Code Execution Trace ≥3 điểm chạm `CacheService.get` → `LRUCache.get` → `redis.get` → `redis.publish`.
<!-- @starci/seperator -->
### forbidden
<!-- @starci/seperator -->
- Dùng `Map` thay vì `lru-cache` cho L1 (unbounded memory) -> **0 prompt L1 capacity**.
- Pub/Sub không có sender ID loop-prevention (echo storm) -> **0 prompt distributed invalidation**.
- Capacity planning số tùy ý không cite source / benchmark -> **0 prompt capacity rigor**.
- Fabricate chaos test log (không thực sự run docker pause / kill) -> **0 whole challenge**.
- Single-instance setup giả vờ là cluster -> **0 whole challenge**.
- Bench JSON paraphrase (không paste raw k6 output) -> **0 whole challenge**.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
10
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Rubric chấm điểm (tối đa 10):

- Tiêu chí A (3 điểm): README 6 section + Mermaid 3-instance diagram đúng L1/L2 split + Pub/Sub channel.
- Tiêu chí B (3 điểm): Smoke Test paste raw cluster bench `evidence/k6-cluster.json` + chaos log `evidence/chaos/*.log`.
- Tiêu chí C (2 điểm): Design Decisions chốt 3 quyết định (LRU vs LFU, TTL 60s, Pub/Sub vs Streams) với trade-off số.
- Tiêu chí D (2 điểm): Code Execution Trace ≥3 điểm chạm `file:line -> method()` thật cho luồng L1→L2→Pub/Sub.

Quy tắc chấm: mỗi tiêu chí làm đúng trọn vẹn thì nhận đủ điểm tiêu chí đó; thiếu/sai tiêu chí nào thì tiêu chí đó nhận 0 điểm.
<!-- @starci/seperator -->
# outputs
## 0
### text
<!-- @starci/seperator -->
Bạn xây dựng được two-tier cache L1 LRU + L2 Redis với write-through và cache chain L1→L2→source.
<!-- @starci/seperator -->
## 1
### text
<!-- @starci/seperator -->
Bạn đồng bộ invalidation cross-instance qua Redis Pub/Sub với sender ID loop-prevention.
<!-- @starci/seperator -->
## 2
### text
<!-- @starci/seperator -->
Bạn capacity-plan được hệ thống cho 1M user / 100K RPS với phép tính memory + bandwidth có nguồn.
<!-- @starci/seperator -->
## 3
### text
<!-- @starci/seperator -->
Bạn chứng minh self-healing bằng chaos test instance crash + Redis pause + network partition trên cluster 3 instance thật.
<!-- @starci/seperator -->
# prerequisites
## 0
### text
<!-- @starci/seperator -->
Đã hoàn thành HARD `sliding-window-rate-limiter-redis-hard`.
<!-- @starci/seperator -->
## 1
### text
<!-- @starci/seperator -->
Docker Desktop + `docker compose` để chạy multi-instance + Redis.
<!-- @starci/seperator -->
## 2
### text
<!-- @starci/seperator -->
Cài `k6` + `nginx` (load balancer cluster bench).
<!-- @starci/seperator -->
# steps
## 0
### title
<!-- @starci/seperator -->
Build L1 LRU cache với capacity + TTL bound
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Các bước thực hiện
- **Bước 1:** Tạo project + cài lib.
  ```bash
  nest new two-tier-cache-pubsub-insane
  cd two-tier-cache-pubsub-insane
  npm i lru-cache ioredis @nestjs/config
  ```
- **Bước 2:** Tạo `L1Cache` service wrap `LRUCache<string, any>({ max: 10000, ttl: 60_000 })` với method `get(key)`, `set(key, val)`, `delete(key)`.
- **Bước 3:** Expose metric counter `l1.hit_count`, `l1.miss_count`, `l1.eviction_count` (qua `prom-client` hoặc internal counter object).
- **Bước 4:** Unit test 1000 set với key unique → assert size ≤10K + ≥1 eviction; 100 concurrent get/set không throw race.

### 2. Yêu cầu tối thiểu cần đạt
- `LRUCache` max=10K, TTL=60s, KHÔNG dùng `Map`.
- 3 metric counter chính xác.
- LRU eviction thật (least-recently-used evict trước) — verify bằng test sequence.

### 3. Nice to have
- Expose `GET /metrics` Prometheus format.
- Configurable max + TTL qua ConfigModule.

### codeImplementations
#### 0
##### lang
typescript
##### guide
**Thư viện chính:** **`lru-cache`** v10+ — capacity + TTL built-in, thread-safe ở Node single-thread event loop.

**Mapping API:**
- `new Map()` -> `new LRUCache({ max, ttl })`.
- `Map.size` -> `LRUCache.size`.

**Khác biệt/gotcha:**
- `lru-cache` v10 dùng `max` (entry count) — v9 cũ dùng `maxSize` (byte) khác semantics.
- TTL evict lazy lúc `get` — không có background timer mặc định.
##### example
```typescript
import { LRUCache } from "lru-cache"

@Injectable()
export class L1CacheService {
    private cache = new LRUCache<string, unknown>({ max: 10_000, ttl: 60_000 })
    private metrics = { hit: 0, miss: 0, eviction: 0 }

    constructor() {
        this.cache.set = new Proxy(this.cache.set.bind(this.cache), {
            apply: (target, _, args) => { if (this.cache.size >= 10_000) this.metrics.eviction++; return target(...args as any) },
        }) as any
    }
    get<T>(key: string): T | undefined { const v = this.cache.get(key) as T; v !== undefined ? this.metrics.hit++ : this.metrics.miss++; return v }
    set(key: string, val: unknown) { this.cache.set(key, val) }
    delete(key: string) { this.cache.delete(key) }
}
```
#### 1
##### lang
csharp
##### guide
**Thư viện chính:** **`Microsoft.Extensions.Caching.Memory.IMemoryCache`** với `SizeLimit` + `AbsoluteExpirationRelativeToNow`.

**API mapping:**
- `lru-cache.set` -> `_memoryCache.Set(key, val, options)`.
- `max` -> `MemoryCacheOptions.SizeLimit = 10_000` + `Size = 1` per entry.

**Differences / gotchas:**
- `IMemoryCache` mặc định LRU-ish (entry tracking compactly) — không full LRU spec nhưng đủ cho capacity bound.
- Phải set `Size = 1` cho mỗi entry để `SizeLimit` enforce.
##### example
```csharp
public class L1CacheService {
    private readonly IMemoryCache _cache;
    public L1CacheService() {
        _cache = new MemoryCache(new MemoryCacheOptions { SizeLimit = 10_000 });
    }
    public T? Get<T>(string key) => _cache.TryGetValue<T>(key, out var v) ? v : default;
    public void Set(string key, object val) => _cache.Set(key, val,
        new MemoryCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(60), Size = 1 });
}
```
#### 2
##### lang
go
##### guide
**Thư viện chính:** **`github.com/hashicorp/golang-lru/v2`** — pure LRU, thread-safe với mutex internal.

**API mapping:**
- `lru-cache.set` -> `lruCache.Add(key, val)`.
- `max=10000` -> `lru.New[string, any](10_000)`.

**Differences / gotchas:**
- Hashicorp v2 generic API, không cần type assertion.
- TTL không built-in — wrap với expiring LRU `lru.NewWithExpire` hoặc tự maintain timestamp.
##### example
```go
import lru "github.com/hashicorp/golang-lru/v2/expirable"

type L1Cache struct {
    cache *lru.LRU[string, any]
    hit, miss, evict atomic.Int64
}

func NewL1Cache() *L1Cache {
    return &L1Cache{ cache: lru.NewLRU[string, any](10_000, nil, time.Minute) }
}

func (c *L1Cache) Get(key string) (any, bool) {
    v, ok := c.cache.Get(key)
    if ok { c.hit.Add(1) } else { c.miss.Add(1) }
    return v, ok
}
```
#### 3
##### lang
java
##### guide
**Thư viện chính:** **`com.github.ben-manes.caffeine:caffeine`** — high-performance LRU/W-TinyLFU cache.

**API mapping:**
- `lru-cache.set` -> `cache.put(key, val)`.
- `max` -> `Caffeine.newBuilder().maximumSize(10_000)`.

**Differences / gotchas:**
- Caffeine default policy là W-TinyLFU (better hit ratio than pure LRU) — set `evictionListener` để đếm.
- Built-in TTL via `expireAfterWrite(Duration.ofSeconds(60))`.
##### example
```java
private final Cache<String, Object> cache = Caffeine.newBuilder()
    .maximumSize(10_000)
    .expireAfterWrite(Duration.ofSeconds(60))
    .evictionListener((k, v, cause) -> evictionCount.incrementAndGet())
    .recordStats()
    .build();

public Object get(String key) { Object v = cache.getIfPresent(key); if (v != null) hitCount.incrementAndGet(); else missCount.incrementAndGet(); return v; }
public void put(String key, Object val) { cache.put(key, val); }
```
<!-- @starci/seperator -->
## 1
### title
<!-- @starci/seperator -->
Build L2 Redis cache với write-through và chain L1→L2→source
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Các bước thực hiện
- **Bước 1:** Tạo `TwoTierCacheService` inject `L1CacheService` + `ioredis` client + source repository.
- **Bước 2:** Implement `get(key)`: check L1 → hit return; miss → check L2 (`redis.get`) → hit thì promote L1 + return; miss thì query source + write L1 + write L2 + return.
- **Bước 3:** Implement `set(key, val)` write-through: parallel `L1.set(key, val)` + `redis.set(key, val, 'EX', 600)`.
- **Bước 4:** Implement `delete(key)`: parallel `L1.delete(key)` + `redis.del(key)`.

### 2. Yêu cầu tối thiểu cần đạt
- Cache chain L1 → L2 → source đúng thứ tự, không skip tier.
- L2 hit promote L1 (next request hit L1).
- Write-through atomic — L1 + L2 cùng sync sau write.

### 3. Nice to have
- Singleflight on L2 miss để chống cache stampede xuống source.
- Batch `mget` cho multiple keys.

### codeImplementations
#### 0
##### lang
typescript
##### guide
**Thư viện chính:** **`ioredis`** + L1 service từ step 0 — wrap chain logic trong service method.

**Mapping API:**
- `cacheManager.get/set` -> custom chain `L1 → L2 → source`.
- `Promise.all` parallel L1 + L2 write.

**Khác biệt/gotcha:**
- Promote L2 → L1 phải call SAU L2 get (vì L1 promotion là side effect).
- Source query có thể fail — phải handle separately không invalidate L2 đang valid.
##### example
```typescript
async get<T>(key: string): Promise<T | null> {
    const l1Hit = this.l1.get<T>(key)
    if (l1Hit !== undefined) return l1Hit
    const l2Raw = await this.redis.get(key)
    if (l2Raw) { const v = JSON.parse(l2Raw) as T; this.l1.set(key, v); return v }
    const v = await this.source.fetch<T>(key)
    if (v !== null) await this.set(key, v)
    return v
}
async set<T>(key: string, val: T) {
    this.l1.set(key, val)
    await this.redis.set(key, JSON.stringify(val), "EX", 600)
}
```
#### 1
##### lang
csharp
##### guide
**Thư viện chính:** **`IMemoryCache`** (L1) + **`IDistributedCache`** (L2) — combine qua wrapper.

**API mapping:**
- `L1.get` -> `_memCache.TryGetValue`.
- `L2.get` -> `_distCache.GetStringAsync`.

**Differences / gotchas:**
- Async/sync mismatch — L1 sync, L2 async; service expose `Task<T?>` thống nhất.
- JSON serialize gốc khi store L2 (string).
##### example
```csharp
public async Task<T?> GetAsync<T>(string key) {
    if (_memCache.TryGetValue<T>(key, out var hit)) return hit;
    var raw = await _distCache.GetStringAsync(key);
    if (raw != null) { var v = JsonSerializer.Deserialize<T>(raw); _memCache.Set(key, v, l1Opts); return v; }
    var srcVal = await _source.FetchAsync<T>(key);
    if (srcVal != null) await SetAsync(key, srcVal);
    return srcVal;
}
```
#### 2
##### lang
go
##### guide
**Thư viện chính:** **`hashicorp/golang-lru/v2/expirable`** (L1) + **`go-redis/v9`** (L2).

**API mapping:**
- `L1.Get` -> `lruCache.Get`.
- `L2.Get` -> `rdb.Get(ctx, key).Bytes()`.

**Differences / gotchas:**
- Goroutine-safe — không cần extra mutex.
- Source fetch nên timeout ngắn để không block.
##### example
```go
func (c *TwoTierCache) Get(ctx context.Context, key string) (any, error) {
    if v, ok := c.l1.Get(key); ok { return v, nil }
    if raw, err := c.rdb.Get(ctx, key).Bytes(); err == nil {
        var v any; json.Unmarshal(raw, &v); c.l1.Add(key, v); return v, nil
    }
    v, err := c.source.Fetch(ctx, key)
    if err == nil && v != nil { c.Set(ctx, key, v) }
    return v, err
}
```
#### 3
##### lang
java
##### guide
**Thư viện chính:** **Caffeine** (L1) + **Spring Data Redis** (L2).

**API mapping:**
- `L1.get` -> `caffeineCache.getIfPresent`.
- `L2.get` -> `redisTemplate.opsForValue().get`.

**Differences / gotchas:**
- Caffeine `getIfPresent` không trigger compute — dùng `get(key, mappingFunction)` nếu muốn auto-source-fetch.
- Serialize L2 qua Jackson hoặc `JdkSerializationRedisSerializer`.
##### example
```java
public <T> T get(String key, Class<T> type) {
    Object hit = l1.getIfPresent(key);
    if (hit != null) return type.cast(hit);
    String raw = redisTemplate.opsForValue().get(key);
    if (raw != null) { T v = objectMapper.readValue(raw, type); l1.put(key, v); return v; }
    T fromSource = source.fetch(key, type);
    if (fromSource != null) set(key, fromSource);
    return fromSource;
}
```
<!-- @starci/seperator -->
## 2
### title
<!-- @starci/seperator -->
Pub/Sub invalidation cross-instance với sender ID loop-prevention
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Các bước thực hiện
- **Bước 1:** Bootstrap `instanceId = ${process.pid}-${hostname}-${randomUUID()}` ổn định trong lifetime instance.
- **Bước 2:** Tạo 2 Redis connection riêng: `pub` cho `publish`, `sub` cho `subscribe('cache:invalidate')`.
- **Bước 3:** Trong `set(key, val)` và `delete(key)`, sau khi local write, publish JSON `{ key, op, senderId: instanceId, timestamp: Date.now() }`.
- **Bước 4:** Handler subscribe: parse message, skip nếu `senderId === instanceId`; nếu khác → invalidate L1 local cho key đó, log `applied_invalidation`.

### 2. Yêu cầu tối thiểu cần đạt
- 2 connection riêng (sub blocking, pub không).
- Loop-prevention skip self message — verify bằng log không có echo loop.
- Pub/Sub message schema chuẩn JSON 4 field.

### 3. Nice to have
- Batch invalidation (publish array of keys khi mutate nhiều).
- Retry publish khi Redis transient fail.

### codeImplementations
#### 0
##### lang
typescript
##### guide
**Thư viện chính:** **`ioredis`** — 2 connection (`pub` + `sub`), `sub` blocking pattern.

**Mapping API:**
- `redis.publish(channel, msg)` -> `pub.publish('cache:invalidate', JSON.stringify({...}))`.
- `redis.subscribe(channel)` + `redis.on('message')` -> `sub.subscribe(...)` + `sub.on('message', handler)`.

**Khác biệt/gotcha:**
- Một `ioredis` connection vào subscribe mode KHÔNG dùng được cho command thường — phải 2 connection.
- Pub/Sub fire-and-forget — không guarantee delivery, không có replay.
##### example
```typescript
@Injectable()
export class InvalidationBusService implements OnModuleInit {
    private instanceId = `${process.pid}-${hostname()}-${randomUUID()}`
    constructor(@Inject("REDIS_PUB") private pub: Redis, @Inject("REDIS_SUB") private sub: Redis, private l1: L1CacheService) {}

    async onModuleInit() {
        await this.sub.subscribe("cache:invalidate")
        this.sub.on("message", (_ch, msg) => {
            const { key, senderId } = JSON.parse(msg)
            if (senderId === this.instanceId) return
            this.l1.delete(key)
            this.logger.log(`applied_invalidation key=${key} from=${senderId}`)
        })
    }

    async publish(key: string, op: "set" | "del") {
        await this.pub.publish("cache:invalidate", JSON.stringify({ key, op, senderId: this.instanceId, timestamp: Date.now() }))
    }
}
```
#### 1
##### lang
csharp
##### guide
**Thư viện chính:** **`StackExchange.Redis`** `ISubscriber` — 1 connection multiplex pub + sub OK trong .NET.

**API mapping:**
- `pub.publish` -> `subscriber.PublishAsync(channel, msg)`.
- `sub.subscribe + on('message')` -> `subscriber.Subscribe(channel, (ch, msg) => ...)`.

**Differences / gotchas:**
- `ConnectionMultiplexer` thread-safe — không cần 2 connection như ioredis.
- Channel có thể pattern (`cache:*`).
##### example
```csharp
public class InvalidationBus {
    private readonly string _instanceId = $"{Environment.ProcessId}-{Environment.MachineName}-{Guid.NewGuid()}";
    private readonly ISubscriber _sub;
    public InvalidationBus(IConnectionMultiplexer redis, L1Cache l1) {
        _sub = redis.GetSubscriber();
        _sub.Subscribe("cache:invalidate", (ch, msg) => {
            var data = JsonSerializer.Deserialize<InvalidateMsg>(msg!);
            if (data!.SenderId == _instanceId) return;
            l1.Delete(data.Key);
        });
    }
    public Task PublishAsync(string key, string op) =>
        _sub.PublishAsync("cache:invalidate", JsonSerializer.Serialize(new { key, op, senderId = _instanceId, timestamp = DateTimeOffset.UtcNow }));
}
```
#### 2
##### lang
go
##### guide
**Thư viện chính:** **`go-redis/v9`** `PubSub` channel + goroutine listener.

**API mapping:**
- `pub.publish` -> `rdb.Publish(ctx, channel, msg)`.
- `sub.on('message')` -> `pubsub := rdb.Subscribe(ctx, channel); for msg := range pubsub.Channel() { ... }`.

**Differences / gotchas:**
- 1 connection OK — go-redis tự handle multiplex.
- Subscribe goroutine cần graceful shutdown qua `pubsub.Close()`.
##### example
```go
func (b *InvalidationBus) Listen(ctx context.Context) {
    pubsub := b.rdb.Subscribe(ctx, "cache:invalidate")
    go func() {
        defer pubsub.Close()
        for msg := range pubsub.Channel() {
            var data InvalidateMsg
            json.Unmarshal([]byte(msg.Payload), &data)
            if data.SenderId == b.instanceId { continue }
            b.l1.Remove(data.Key)
        }
    }()
}
func (b *InvalidationBus) Publish(ctx context.Context, key, op string) error {
    payload, _ := json.Marshal(InvalidateMsg{ Key: key, Op: op, SenderId: b.instanceId, Timestamp: time.Now().UnixMilli() })
    return b.rdb.Publish(ctx, "cache:invalidate", payload).Err()
}
```
#### 3
##### lang
java
##### guide
**Thư viện chính:** **Spring Data Redis `RedisMessageListenerContainer`** + custom listener.

**API mapping:**
- `pub.publish` -> `redisTemplate.convertAndSend(channel, msg)`.
- `sub.on('message')` -> `container.addMessageListener(listener, new ChannelTopic(channel))`.

**Differences / gotchas:**
- `RedisMessageListenerContainer` chạy thread pool — listener phải thread-safe.
- Serialize qua Jackson, deserialize manual trong `onMessage`.
##### example
```java
@Component
public class InvalidationBus {
    private final String instanceId = ProcessHandle.current().pid() + "-" + InetAddress.getLocalHost().getHostName() + "-" + UUID.randomUUID();
    @EventListener
    public void handleMessage(Message msg, byte[] pattern) {
        var data = objectMapper.readValue(msg.getBody(), InvalidateMsg.class);
        if (data.senderId().equals(instanceId)) return;
        l1.invalidate(data.key());
    }
    public void publish(String key, String op) {
        var msg = new InvalidateMsg(key, op, instanceId, Instant.now().toEpochMilli());
        redisTemplate.convertAndSend("cache:invalidate", objectMapper.writeValueAsString(msg));
    }
}
```
<!-- @starci/seperator -->
## 3
### title
<!-- @starci/seperator -->
Capacity planning 1M user + benchmark thật cho L1/L2/Pub/Sub
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Các bước thực hiện
- **Bước 1:** Bench memory L1: seed 10K entry sample (`{ userId, profile: {...} }`) → đo heap `process.memoryUsage().heapUsed` trước/sau → tính byte/entry.
- **Bước 2:** Bench memory L2: dùng `redis-cli INFO memory` sau khi seed 100K entry → tính byte/entry.
- **Bước 3:** Bench throughput single instance: `k6 run --vus 100 --duration 60s` GET endpoint → đo RPS sustainable với p95 < 50ms.
- **Bước 4:** Viết section Capacity Planning trong README với 4 phép tính + bảng input/output + conclusion shard count.

### 2. Yêu cầu tối thiểu cần đạt
- 4 phép tính (instance count, L1 mem, L2 mem, Pub/Sub bandwidth) với formula + số thực tế.
- Số cite source (benchmark đo thật hoặc reference doc).
- Conclusion: Redis shards ≥3, app instances ≥20 (or whatever theo benchmark).

### 3. Nice to have
- Bench scaling curve 1 vs 3 vs 10 instance — plot throughput.
- Cost estimate (AWS/GCP price per node × shard × instance).
<!-- @starci/seperator -->
## 4
### title
<!-- @starci/seperator -->
Chaos test 3 scenario trên cluster 3 instance
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Các bước thực hiện
- **Bước 1:** Viết `docker-compose.yml` 3 instance (`app-1`, `app-2`, `app-3`) + Redis + nginx (round-robin LB). Chạy `docker compose up -d`.
- **Bước 2:** Scenario A — Instance crash. Trigger mutate ở `app-1`, đồng thời `docker kill app-2`; verify `app-3` vẫn nhận pub/sub invalidation (log `applied_invalidation`); capture vào `evidence/chaos/instance-crash.log`.
- **Bước 3:** Scenario B — Redis pause. `docker pause redis` 5s khi đang chạy traffic; verify apps không throw 5xx, log warning `redis_unavailable`, recover khi `docker unpause redis`; capture `evidence/chaos/redis-pause.log`.
- **Bước 4:** Scenario C — Network partition. `iptables -A OUTPUT -d <redis_ip> -j DROP` ở `app-1` 10s; verify `app-1` degrade source query, không 5xx; `iptables -D` để restore; capture `evidence/chaos/network-partition.log`.

### 2. Yêu cầu tối thiểu cần đạt
- 3 scenario chạy thật, raw log commit vào `evidence/chaos/`.
- Apps không crash trong cả 3 scenario.
- Self-healing: L1 stale tự expire trong TTL window khi Pub/Sub drop.

### 3. Nice to have
- Run chaos qua `pumba` (chaos engineering tool cho Docker).
- Thêm scenario partial network (latency injection qua `tc qdisc`).
<!-- @starci/seperator -->
## 5
### title
<!-- @starci/seperator -->
Cluster benchmark consistency + staleness window
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Các bước thực hiện
- **Bước 1:** Viết `bench/cluster.js` k6 script: 50 VU × 3 phút, 70% GET / 30% POST mutate, request body POST chứa `timestamp_sent` để đo staleness.
- **Bước 2:** Chạy bench qua nginx LB (port 80 → app-1/2/3).
  ```bash
  k6 run --out json=evidence/k6-cluster.json bench/cluster.js
  ```
- **Bước 3:** Parse JSON output → tính: p95 read latency, max staleness window (`max(read_response_timestamp - actual_mutate_timestamp)`), consistency rate (% read response match latest mutate trong 1s).
- **Bước 4:** Paste bảng kết quả + raw JSON snippet vào README Smoke Test.

### 2. Yêu cầu tối thiểu cần đạt
- `evidence/k6-cluster.json` commit thật từ run.
- Max staleness < 500ms.
- Consistency rate ≥ 99%.

### 3. Nice to have
- Plot histogram staleness window cross all requests.
- A/B compare with vs without Pub/Sub (staleness sẽ skyrocket nếu disable Pub/Sub).
<!-- @starci/seperator -->
## 6
### title
<!-- @starci/seperator -->
Viết README capacity + Mermaid + design decisions
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Các bước thực hiện
- **Bước 1:** Viết README 6 section: Challenge description, How to run (docker-compose up 3 instance + Redis + nginx), Architecture/Stack (Mermaid 3 instance + Redis Pub/Sub channel + L1/L2 split + nginx LB), Smoke Test (paste raw cluster bench JSON snippet + chaos log + capacity table), Code Execution Trace (≥3 điểm chạm), Design Decisions.
- **Bước 2:** Design Decisions chốt 3 quyết định scale: (1) LRU vs LFU (LRU đơn giản, đủ cho workload đồng đều; LFU tốt cho skewed nhưng overhead cao); (2) TTL L1 = 60s không 600s (self-heal nhanh khi Pub/Sub drop, trade-off hit ratio); (3) Pub/Sub không Streams (fire-and-forget OK vì TTL self-heal; Streams complexity không cần).
- **Bước 3:** Code Execution Trace: `src/cache/two-tier.service.ts:25 -> TwoTierCacheService.get` → `src/cache/l1.service.ts:18 -> L1CacheService.get` → `src/cache/invalidation-bus.service.ts:35 -> InvalidationBusService.publish`.
- **Bước 4:** Paste raw `redis-cli INFO memory` snippet + raw `k6 cluster` JSON snippet + chaos log snippets vào Smoke Test.

### 2. Yêu cầu tối thiểu cần đạt
- README 6 section đầy đủ + Mermaid diagram chính xác.
- Design Decisions 3 quyết định scale với trade-off số (memory, latency, accuracy).
- Code Execution Trace ≥3 điểm chạm `file:line -> method()` thật.

### 3. Nice to have
- Bảng so sánh LRU vs LFU vs ARC.
- Cost analysis (AWS instance type + Redis cluster cost).
<!-- @starci/seperator -->
# references
## 0
### alias
<!-- @starci/seperator -->
Redis Pub/Sub
<!-- @starci/seperator -->
### url
<!-- @starci/seperator -->
https://redis.io/docs/latest/develop/interact/pubsub/
<!-- @starci/seperator -->
## 1
### alias
<!-- @starci/seperator -->
lru-cache (Node.js) docs
<!-- @starci/seperator -->
### url
<!-- @starci/seperator -->
https://github.com/isaacs/node-lru-cache
<!-- @starci/seperator -->
## 2
### alias
<!-- @starci/seperator -->
Facebook TAO — Two-tier caching at scale
<!-- @starci/seperator -->
### url
<!-- @starci/seperator -->
https://engineering.fb.com/2013/06/25/core-infra/tao-the-power-of-the-graph/
<!-- @starci/seperator -->
## 3
### alias
<!-- @starci/seperator -->
Redis cluster specification
<!-- @starci/seperator -->
### url
<!-- @starci/seperator -->
https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/
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
Repo public chứa source NestJS + `docker-compose.yml` 3 instance + Redis + nginx LB + folder `bench/` chứa `cluster.js` + folder `evidence/` chứa `k6-cluster.json` (raw bench) + folder `evidence/chaos/` chứa 3 log file (`instance-crash.log`, `redis-pause.log`, `network-partition.log`) + README đủ 6 section (Challenge description, How to run, Architecture/Stack với Mermaid 3-instance + Pub/Sub channel + L1/L2 split + nginx LB, Smoke Test với raw bench snippet + chaos log + capacity planning table 4 phép tính, Code Execution Trace ≥3 điểm chạm `file:line -> method()`, Design Decisions chốt 3 quyết định scale LRU/TTL/Pub-Sub với trade-off số).
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
80
<!-- @starci/seperator -->
# difficulty
<!-- @starci/seperator -->
insane
<!-- @starci/seperator -->
# score
<!-- @starci/seperator -->
80
<!-- @starci/seperator -->
