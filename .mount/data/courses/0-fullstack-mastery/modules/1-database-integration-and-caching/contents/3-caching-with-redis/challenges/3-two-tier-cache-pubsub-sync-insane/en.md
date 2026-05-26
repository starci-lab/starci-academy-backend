# title
<!-- @starci/seperator -->
Two-Tier Cache L1 LRU + L2 Redis with Pub/Sub Invalidation for 1M Users
<!-- @starci/seperator -->
# description
<!-- @starci/seperator -->
Insane challenge extended from the HARD version. You build a **two-tier cache** with L1 in-memory **LRU** per instance + L2 shared **Redis**, synchronize cross-instance invalidation via **Redis Pub/Sub** with sender-ID loop prevention, capacity-plan for **1M users / 100K RPS**, and chaos test instance crashes and Redis failures.
<!-- @starci/seperator -->
# requirements
## 0
### purpose
<!-- @starci/seperator -->
Build L1 in-memory LRU cache per instance with capacity + TTL bounds and verifiable hit ratio.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
L1 cache uses `lru-cache` (Node) or equivalent; max size 10000 entries (capacity-bounded), per-entry TTL 60s; expose metrics `l1.hit_count`, `l1.miss_count`, `l1.eviction_count`; concurrent set/get must be safe.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- `lru-cache` v10+ provides `max` + `ttl` built-in.
- Avoid unbounded L1 (`Map`) — it leaks memory with 1M users.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
15
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Scoring rubric (max 15):

- Criterion A (5 points): L1 uses a real LRU with `max=10000` + `ttl=60s`, never an unbounded `Map`.
- Criterion B (4 points): Concurrent set/get is safe — verified with a 100-goroutine/worker test, no race.
- Criterion C (3 points): Metrics `l1.hit/miss/eviction` are accurate (verified by counting vs expected).
- Criterion D (3 points): Eviction policy is real LRU (least-recently-used evicted first), never FIFO.

Rule: each criterion fully met receives its full points; partial/incorrect receives 0.
<!-- @starci/seperator -->
## 1
### purpose
<!-- @starci/seperator -->
Build the L2 Redis shared cache with fallback chain L1 → L2 → source and write-through writes.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
`get(key)` runs the chain: check L1 → on miss check L2 → on miss query source + populate both L1 + L2 + return; `set(key, val)` is write-through: set L1 + L2 atomically; L2 TTL 600s (10× L1); response value remains consistent across instances.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Promote L2 hits into L1 to raise L1 hit ratio on the next request.
- Bench L1 vs L2 vs source latency: L1 ~0.1µs, L2 ~1ms, source ~50ms.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
0
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Shared with requirement 2 (cache chain L1→L2→source + write-through + Pub/Sub invalidation).
<!-- @starci/seperator -->
## 2
### purpose
<!-- @starci/seperator -->
Synchronize cross-instance invalidation via Redis Pub/Sub with sender-ID loop prevention.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
Every instance subscribes to channel `cache:invalidate` at bootstrap; on local `delete(key)` or `set(key, val)`, publish `{ key, op: 'del' | 'set', senderId, timestamp }`; subscribers only apply invalidation when `senderId !== self.instanceId` to avoid loops; update local L1; L2 is already synced via write-through, no re-set needed.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- `instanceId` = `process.pid + hostname + random`, stable for the instance's lifetime.
- Pub/Sub does not guarantee delivery — pair with a short L1 TTL (60s) for self-healing.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
15
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Scoring rubric (max 15):

- Criterion A (5 points): Instance A mutates a key → instance B receives pub/sub → L1 on B invalidates that key within 50ms (verified via raw log timestamps).
- Criterion B (4 points): Loop prevention is correct — sender skips its own message, no echo loop (verified by raw log message count: N instances × 1 mutate = N-1 invalidation applications, not N²).
- Criterion C (3 points): Standard message schema `{ key, op, senderId, timestamp }` (JSON), no paraphrasing.
- Criterion D (3 points): Self-heal when Pub/Sub drops — L1 TTL ≤60s ensures stale data expires within a minute.

Rule: each criterion fully met receives its full points; partial/incorrect receives 0.
<!-- @starci/seperator -->
## 3
### purpose
<!-- @starci/seperator -->
Capacity planning for 1M users / 100K RPS with concrete memory + bandwidth figures.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
The README must contain a Capacity Planning section with 4 calculations: (a) instance count needed to serve 100K RPS with p95 < 50ms (assume 1 instance ~5K RPS), (b) L1 memory per instance (10K entries × ~1KB/entry = ~10MB), (c) L2 Redis memory (1M users × 10 keys × 1KB = ~10GB → requires Redis cluster ≥3 shards), (d) Pub/Sub bandwidth (assume 1K mutate/s × N instances × 200 bytes/message); every number must cite a source (real benchmark measurement or reference link).
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Use `redis-cli INFO memory` to measure real memory across 100K sample entries.
- Plot latency vs RPS scaling — locate the bottleneck before hitting 100K.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
15
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Scoring rubric (max 15):

- Criterion A (4 points): All 4 capacity-planning calculations (instance count, L1 mem, L2 mem, Pub/Sub bandwidth) are fully shown with formula + numbers.
- Criterion B (4 points): Numbers cite sources — real benchmarks (`redis-cli INFO`, k6 output) OR reference links (Redis docs, engineering blogs).
- Criterion C (4 points): Conclusion locks in Redis shard count (≥3) + app instance count (≥20) matching the calculations, not "scale numbers up" hand-wavily.
- Criterion D (3 points): Trade-offs documented — why 10K L1 size (not 100K or 1K), why L1 TTL = 60s not 600s.

Rule: each criterion fully met receives its full points; partial/incorrect receives 0.
<!-- @starci/seperator -->
## 4
### purpose
<!-- @starci/seperator -->
Chaos test instance crash + Redis Pub/Sub failure to prove self-healing.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
Run 3 instances via docker-compose (`app-1`, `app-2`, `app-3`); test scenarios: (a) kill `app-2` mid-mutation → assert `app-1` and `app-3` still receive invalidation, (b) `docker pause` Redis container for 5s → assert app instances do not crash + recover when Redis is back + stale L1 self-expires after TTL, (c) network partition app-1 from Redis for 10s → assert app-1 falls back gracefully (degrade to source query, not 500); capture stdout logs + screenshots.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- `docker pause` simulates a Redis hang.
- `iptables -A OUTPUT -d redis_ip -j DROP` simulates a Linux network partition.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
15
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Scoring rubric (max 15):

- Criterion A (5 points): 3 chaos scenarios (instance crash, Redis pause, network partition) actually run on a 3-instance docker-compose, raw stdout committed into `evidence/chaos/*.log`.
- Criterion B (4 points): Instance-crash scenario — surviving 2 instances still receive correct pub/sub invalidation (verified via log).
- Criterion C (3 points): Redis-pause scenario — apps do not crash, fallback is graceful (degrade or cached), recovery on Redis up.
- Criterion D (3 points): Network-partition scenario — the partitioned app degrades to source query, no 5xx, warning logged, recovery on network restore.

Rule: each criterion fully met receives its full points; partial/incorrect receives 0.
<!-- @starci/seperator -->
## 5
### purpose
<!-- @starci/seperator -->
Benchmark cross-instance consistency end-to-end across a 3-instance cluster under concurrent load.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
Run `k6` for 3 minutes × 50 VUs × 3 instances (load balanced via nginx round-robin); 70% read + 30% mutate; capture metrics: (i) p95 read latency, (ii) max staleness window (gap from mutate on instance A to L1 invalidation on instance B), (iii) consistency rate (% reads returning the value matching the latest mutate); commit raw JSON `evidence/k6-cluster.json`.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Include `timestamp_sent` in mutate request bodies to measure staleness.
- Compute staleness = max(observed_value_timestamp - actual_mutate_timestamp).
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
10
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Scoring rubric (max 10):

- Criterion A (4 points): Cluster bench actually runs 3 min × 50 VU × 3 instances, raw JSON committed.
- Criterion B (3 points): Max staleness window < 500ms (verified via timestamp diff).
- Criterion C (3 points): Consistency rate ≥ 99% (verified by % reads matching the latest mutate within a 1s window).

Rule: each criterion fully met receives its full points; partial/incorrect receives 0.
<!-- @starci/seperator -->
## 6
### purpose
<!-- @starci/seperator -->
Write a README with capacity docs + architecture diagram + design decisions, locked down by forbidden rules protecting scale correctness.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
README has all 6 sections, Architecture/Stack includes a Mermaid diagram of 3 instances + Redis Pub/Sub channel + L1/L2 split; Smoke Test pastes raw cluster bench + chaos logs; Design Decisions locks in 3 scaling decisions: (1) why LRU not LFU, (2) why L1 TTL = 60s not 600s, (3) why Pub/Sub not Streams.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Code Execution Trace ≥3 hops `CacheService.get` → `LRUCache.get` → `redis.get` → `redis.publish`.
<!-- @starci/seperator -->
### forbidden
<!-- @starci/seperator -->
- Using `Map` instead of `lru-cache` for L1 (unbounded memory) -> **0 prompt L1 capacity**.
- Pub/Sub without sender-ID loop prevention (echo storm) -> **0 prompt distributed invalidation**.
- Capacity planning numbers without sources / benchmarks -> **0 prompt capacity rigor**.
- Fabricating chaos test logs (not actually running docker pause / kill) -> **0 whole challenge**.
- A single-instance setup masquerading as a cluster -> **0 whole challenge**.
- Bench JSON paraphrased (not real `k6` output) -> **0 whole challenge**.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
10
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Scoring rubric (max 10):

- Criterion A (3 points): README has all 6 sections + a Mermaid 3-instance diagram correctly showing the L1/L2 split + Pub/Sub channel.
- Criterion B (3 points): Smoke Test pastes the raw cluster bench `evidence/k6-cluster.json` + chaos logs `evidence/chaos/*.log`.
- Criterion C (2 points): Design Decisions locks in 3 decisions (LRU vs LFU, TTL 60s, Pub/Sub vs Streams) with numeric trade-offs.
- Criterion D (2 points): Code Execution Trace ≥3 real `file:line -> method()` hops for the L1→L2→Pub/Sub flow.

Rule: each criterion fully met receives its full points; partial/incorrect receives 0.
<!-- @starci/seperator -->
# outputs
## 0
### text
<!-- @starci/seperator -->
You build a two-tier cache L1 LRU + L2 Redis with write-through and the L1→L2→source chain.
<!-- @starci/seperator -->
## 1
### text
<!-- @starci/seperator -->
You synchronize cross-instance invalidation via Redis Pub/Sub with sender-ID loop prevention.
<!-- @starci/seperator -->
## 2
### text
<!-- @starci/seperator -->
You capacity-plan the system for 1M users / 100K RPS with sourced memory + bandwidth calculations.
<!-- @starci/seperator -->
## 3
### text
<!-- @starci/seperator -->
You prove self-healing with chaos tests covering instance crash + Redis pause + network partition on a real 3-instance cluster.
<!-- @starci/seperator -->
# prerequisites
## 0
### text
<!-- @starci/seperator -->
Completed HARD `sliding-window-rate-limiter-redis-hard`.
<!-- @starci/seperator -->
## 1
### text
<!-- @starci/seperator -->
Docker Desktop + `docker compose` to run multi-instance + Redis.
<!-- @starci/seperator -->
## 2
### text
<!-- @starci/seperator -->
Install `k6` + `nginx` (load balancer for the cluster bench).
<!-- @starci/seperator -->
# steps
## 0
### title
<!-- @starci/seperator -->
Build the L1 LRU cache with capacity + TTL bounds
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Steps
- **Step 1:** Create the project + install libs.
  ```bash
  nest new two-tier-cache-pubsub-insane
  cd two-tier-cache-pubsub-insane
  npm i lru-cache ioredis @nestjs/config
  ```
- **Step 2:** Create `L1Cache` service wrapping `LRUCache<string, any>({ max: 10000, ttl: 60_000 })` with methods `get(key)`, `set(key, val)`, `delete(key)`.
- **Step 3:** Expose metric counters `l1.hit_count`, `l1.miss_count`, `l1.eviction_count` (via `prom-client` or an internal counter object).
- **Step 4:** Unit test: 1000 sets with unique keys → assert size ≤10K + ≥1 eviction; 100 concurrent get/sets do not throw a race.

### 2. Minimum acceptance criteria
- `LRUCache` with max=10K, TTL=60s, NEVER a plain `Map`.
- All 3 metric counters are accurate.
- Real LRU eviction (least-recently-used evicted first) — verified by a sequence test.

### 3. Nice to have
- Expose `GET /metrics` in Prometheus format.
- Configurable max + TTL via ConfigModule.

### codeImplementations
#### 0
##### lang
typescript
##### guide
**Main library:** **`lru-cache`** v10+ — capacity + TTL built-in, thread-safe under Node's single-threaded event loop.

**API mapping:**
- `new Map()` -> `new LRUCache({ max, ttl })`.
- `Map.size` -> `LRUCache.size`.

**Differences / gotchas:**
- `lru-cache` v10 uses `max` (entry count) — v9 used `maxSize` (bytes), different semantics.
- TTL eviction is lazy on `get` — no default background timer.
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
**Main library:** **`Microsoft.Extensions.Caching.Memory.IMemoryCache`** with `SizeLimit` + `AbsoluteExpirationRelativeToNow`.

**API mapping:**
- `lru-cache.set` -> `_memoryCache.Set(key, val, options)`.
- `max` -> `MemoryCacheOptions.SizeLimit = 10_000` + `Size = 1` per entry.

**Differences / gotchas:**
- `IMemoryCache` is LRU-ish by default (compact entry tracking) — not a full LRU spec but enough for the capacity bound.
- Each entry must set `Size = 1` so `SizeLimit` is enforced.
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
**Main library:** **`github.com/hashicorp/golang-lru/v2`** — pure LRU, thread-safe via internal mutex.

**API mapping:**
- `lru-cache.set` -> `lruCache.Add(key, val)`.
- `max=10000` -> `lru.New[string, any](10_000)`.

**Differences / gotchas:**
- Hashicorp v2 has a generic API, no type assertions needed.
- TTL is not built-in — wrap with `lru.NewWithExpire` or maintain a timestamp yourself.
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
**Main library:** **`com.github.ben-manes.caffeine:caffeine`** — high-performance LRU / W-TinyLFU cache.

**API mapping:**
- `lru-cache.set` -> `cache.put(key, val)`.
- `max` -> `Caffeine.newBuilder().maximumSize(10_000)`.

**Differences / gotchas:**
- Caffeine's default policy is W-TinyLFU (better hit ratio than pure LRU) — set `evictionListener` to count.
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
Build the L2 Redis cache with write-through and the L1→L2→source chain
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Steps
- **Step 1:** Create `TwoTierCacheService` injecting `L1CacheService` + `ioredis` client + source repository.
- **Step 2:** Implement `get(key)`: check L1 → return on hit; miss → check L2 (`redis.get`) → on hit promote to L1 + return; miss → query source + write L1 + write L2 + return.
- **Step 3:** Implement `set(key, val)` write-through: in parallel `L1.set(key, val)` + `redis.set(key, val, 'EX', 600)`.
- **Step 4:** Implement `delete(key)`: in parallel `L1.delete(key)` + `redis.del(key)`.

### 2. Minimum acceptance criteria
- Cache chain follows L1 → L2 → source in order, never skipping a tier.
- L2 hits promote to L1 (the next request hits L1).
- Write-through is atomic — L1 + L2 are in sync after a write.

### 3. Nice to have
- Single-flight on L2 misses to prevent stampede against the source.
- Batch `mget` for multiple keys.

### codeImplementations
#### 0
##### lang
typescript
##### guide
**Main library:** **`ioredis`** + the L1 service from step 0 — wrap chain logic inside a service method.

**API mapping:**
- `cacheManager.get/set` -> custom chain `L1 → L2 → source`.
- `Promise.all` for parallel L1 + L2 writes.

**Differences / gotchas:**
- Promote L2 → L1 must run AFTER L2 get (the promotion is a side effect).
- Source query may fail — handle separately without invalidating an otherwise valid L2.
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
**Main library:** **`IMemoryCache`** (L1) + **`IDistributedCache`** (L2) — combine through a wrapper.

**API mapping:**
- `L1.get` -> `_memCache.TryGetValue`.
- `L2.get` -> `_distCache.GetStringAsync`.

**Differences / gotchas:**
- Async/sync mismatch — L1 is sync, L2 async; expose a single `Task<T?>` to keep the API uniform.
- JSON serialize at the boundary when storing L2 (string).
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
**Main library:** **`hashicorp/golang-lru/v2/expirable`** (L1) + **`go-redis/v9`** (L2).

**API mapping:**
- `L1.Get` -> `lruCache.Get`.
- `L2.Get` -> `rdb.Get(ctx, key).Bytes()`.

**Differences / gotchas:**
- Goroutine-safe — no extra mutex needed.
- Keep the source fetch on a tight timeout so it does not block.
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
**Main library:** **Caffeine** (L1) + **Spring Data Redis** (L2).

**API mapping:**
- `L1.get` -> `caffeineCache.getIfPresent`.
- `L2.get` -> `redisTemplate.opsForValue().get`.

**Differences / gotchas:**
- Caffeine `getIfPresent` does not trigger compute — use `get(key, mappingFunction)` if you want auto-source-fetch.
- Serialize L2 via Jackson or `JdkSerializationRedisSerializer`.
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
Cross-instance Pub/Sub invalidation with sender-ID loop prevention
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Steps
- **Step 1:** Bootstrap `instanceId = ${process.pid}-${hostname}-${randomUUID()}`, stable for the instance's lifetime.
- **Step 2:** Create 2 separate Redis connections: `pub` for `publish`, `sub` for `subscribe('cache:invalidate')`.
- **Step 3:** Inside `set(key, val)` and `delete(key)`, after the local write publish JSON `{ key, op, senderId: instanceId, timestamp: Date.now() }`.
- **Step 4:** Handler subscribe: parse message, skip when `senderId === instanceId`; otherwise → invalidate local L1 for that key, log `applied_invalidation`.

### 2. Minimum acceptance criteria
- 2 dedicated connections (sub blocking, pub not).
- Loop prevention skips self-messages — verified by logs showing no echo loop.
- Pub/Sub message schema is standard JSON with the 4 fields.

### 3. Nice to have
- Batch invalidation (publish an array of keys when many are mutated).
- Retry publish on transient Redis failure.

### codeImplementations
#### 0
##### lang
typescript
##### guide
**Main library:** **`ioredis`** — 2 connections (`pub` + `sub`), the `sub` connection stays in blocking pattern.

**API mapping:**
- `redis.publish(channel, msg)` -> `pub.publish('cache:invalidate', JSON.stringify({...}))`.
- `redis.subscribe(channel)` + `redis.on('message')` -> `sub.subscribe(...)` + `sub.on('message', handler)`.

**Differences / gotchas:**
- An `ioredis` connection in subscribe mode CANNOT serve regular commands — you need 2 connections.
- Pub/Sub is fire-and-forget — no delivery guarantee, no replay.
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
**Main library:** **`StackExchange.Redis`** `ISubscriber` — one multiplexed connection serves both pub + sub on .NET.

**API mapping:**
- `pub.publish` -> `subscriber.PublishAsync(channel, msg)`.
- `sub.subscribe + on('message')` -> `subscriber.Subscribe(channel, (ch, msg) => ...)`.

**Differences / gotchas:**
- `ConnectionMultiplexer` is thread-safe — no need for 2 connections like ioredis.
- Channels can be patterns (`cache:*`).
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
**Main library:** **`go-redis/v9`** `PubSub` channel + goroutine listener.

**API mapping:**
- `pub.publish` -> `rdb.Publish(ctx, channel, msg)`.
- `sub.on('message')` -> `pubsub := rdb.Subscribe(ctx, channel); for msg := range pubsub.Channel() { ... }`.

**Differences / gotchas:**
- One connection is enough — go-redis multiplexes internally.
- The subscribe goroutine needs a graceful shutdown via `pubsub.Close()`.
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
**Main library:** **Spring Data Redis `RedisMessageListenerContainer`** + a custom listener.

**API mapping:**
- `pub.publish` -> `redisTemplate.convertAndSend(channel, msg)`.
- `sub.on('message')` -> `container.addMessageListener(listener, new ChannelTopic(channel))`.

**Differences / gotchas:**
- `RedisMessageListenerContainer` runs a thread pool — listener must be thread-safe.
- Serialize with Jackson, deserialize manually in `onMessage`.
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
Capacity planning for 1M users + real benchmarks for L1/L2/Pub-Sub
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Steps
- **Step 1:** Bench L1 memory: seed 10K sample entries (`{ userId, profile: {...} }`) → measure heap `process.memoryUsage().heapUsed` before/after → derive bytes/entry.
- **Step 2:** Bench L2 memory: run `redis-cli INFO memory` after seeding 100K entries → derive bytes/entry.
- **Step 3:** Bench single-instance throughput: `k6 run --vus 100 --duration 60s` against the GET endpoint → measure sustainable RPS with p95 < 50ms.
- **Step 4:** Write the README Capacity Planning section with all 4 calculations + an input/output table + shard count conclusion.

### 2. Minimum acceptance criteria
- 4 calculations (instance count, L1 mem, L2 mem, Pub/Sub bandwidth) with formula + real numbers.
- Numbers cite their source (real benchmark or reference doc).
- Conclusion: Redis shards ≥3, app instances ≥20 (or whatever the benchmark indicates).

### 3. Nice to have
- Bench a scaling curve at 1 vs 3 vs 10 instances — plot throughput.
- Cost estimate (AWS/GCP price per node × shards × instances).
<!-- @starci/seperator -->
## 4
### title
<!-- @starci/seperator -->
Chaos test 3 scenarios on a 3-instance cluster
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Steps
- **Step 1:** Write `docker-compose.yml` for 3 instances (`app-1`, `app-2`, `app-3`) + Redis + nginx (round-robin LB). Run `docker compose up -d`.
- **Step 2:** Scenario A — Instance crash. Trigger a mutate on `app-1`, simultaneously `docker kill app-2`; verify `app-3` still receives the pub/sub invalidation (log `applied_invalidation`); capture into `evidence/chaos/instance-crash.log`.
- **Step 3:** Scenario B — Redis pause. `docker pause redis` for 5s while traffic flows; verify apps do not throw 5xx, log warning `redis_unavailable`, recover on `docker unpause redis`; capture `evidence/chaos/redis-pause.log`.
- **Step 4:** Scenario C — Network partition. `iptables -A OUTPUT -d <redis_ip> -j DROP` on `app-1` for 10s; verify `app-1` degrades to source query without 5xx; `iptables -D` to restore; capture `evidence/chaos/network-partition.log`.

### 2. Minimum acceptance criteria
- 3 scenarios actually run, raw logs committed into `evidence/chaos/`.
- Apps do not crash in any scenario.
- Self-healing: stale L1 expires within the TTL window when Pub/Sub drops.

### 3. Nice to have
- Run chaos via `pumba` (chaos engineering tool for Docker).
- Add a partial-network scenario (latency injection via `tc qdisc`).
<!-- @starci/seperator -->
## 5
### title
<!-- @starci/seperator -->
Cluster benchmark for consistency + staleness window
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Steps
- **Step 1:** Write `bench/cluster.js` k6 script: 50 VUs × 3 minutes, 70% GET / 30% POST mutate, the POST body carries `timestamp_sent` to measure staleness.
- **Step 2:** Run the bench through nginx LB (port 80 → app-1/2/3).
  ```bash
  k6 run --out json=evidence/k6-cluster.json bench/cluster.js
  ```
- **Step 3:** Parse the JSON output → compute: p95 read latency, max staleness window (`max(read_response_timestamp - actual_mutate_timestamp)`), consistency rate (% reads returning the latest mutate within 1s).
- **Step 4:** Paste the results table + a raw JSON snippet into the README Smoke Test.

### 2. Minimum acceptance criteria
- `evidence/k6-cluster.json` is committed straight from the run.
- Max staleness < 500ms.
- Consistency rate ≥ 99%.

### 3. Nice to have
- Plot a histogram of staleness windows across all requests.
- A/B compare with vs without Pub/Sub (staleness should skyrocket without Pub/Sub).
<!-- @starci/seperator -->
## 6
### title
<!-- @starci/seperator -->
Write the README capacity docs + Mermaid + design decisions
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Steps
- **Step 1:** Write the README with all 6 sections: Challenge description, How to run (docker-compose up 3 instances + Redis + nginx), Architecture/Stack (Mermaid showing 3 instances + Redis Pub/Sub channel + L1/L2 split + nginx LB), Smoke Test (paste raw cluster bench JSON snippet + chaos logs + capacity table), Code Execution Trace (≥3 hops), Design Decisions.
- **Step 2:** Design Decisions locks in 3 scaling decisions: (1) LRU vs LFU (LRU simple, enough for uniform workload; LFU better for skewed workloads but higher overhead); (2) L1 TTL = 60s not 600s (faster self-heal when Pub/Sub drops, trade-off in hit ratio); (3) Pub/Sub not Streams (fire-and-forget is fine because TTL self-heals; Streams complexity unnecessary).
- **Step 3:** Code Execution Trace: `src/cache/two-tier.service.ts:25 -> TwoTierCacheService.get` → `src/cache/l1.service.ts:18 -> L1CacheService.get` → `src/cache/invalidation-bus.service.ts:35 -> InvalidationBusService.publish`.
- **Step 4:** Paste raw `redis-cli INFO memory` snippet + raw `k6 cluster` JSON snippet + chaos log snippets into Smoke Test.

### 2. Minimum acceptance criteria
- README has all 6 sections + a correct Mermaid diagram.
- Design Decisions covers 3 scaling decisions with numeric trade-offs (memory, latency, accuracy).
- Code Execution Trace has ≥3 real `file:line -> method()` hops.

### 3. Nice to have
- Comparison table LRU vs LFU vs ARC.
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
Public repo containing the NestJS source + `docker-compose.yml` with 3 instances + Redis + nginx LB + `bench/` folder with `cluster.js` + `evidence/` folder with `k6-cluster.json` (raw bench) + `evidence/chaos/` folder with 3 log files (`instance-crash.log`, `redis-pause.log`, `network-partition.log`) + README with all 6 sections (Challenge description, How to run, Architecture/Stack with Mermaid showing 3 instances + Pub/Sub channel + L1/L2 split + nginx LB, Smoke Test with raw bench snippet + chaos logs + capacity planning table containing 4 calculations, Code Execution Trace ≥3 real `file:line -> method()` hops, Design Decisions covering 3 scaling decisions LRU/TTL/Pub-Sub with numeric trade-offs).
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
