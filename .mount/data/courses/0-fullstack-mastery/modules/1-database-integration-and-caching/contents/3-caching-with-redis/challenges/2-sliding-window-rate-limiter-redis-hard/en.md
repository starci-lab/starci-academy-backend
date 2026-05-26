# title
<!-- @starci/seperator -->
Sliding Window Rate Limiter on Redis with Lua Scripting and p95/p99 Benchmarks
<!-- @starci/seperator -->
# description
<!-- @starci/seperator -->
Hard challenge extended from the MEDIUM version. You build a production-grade **sliding window log rate limiter** on Redis ZSET + **atomic Lua scripting**, expose it through a NestJS Guard, return HTTP 429 with standard `X-RateLimit-*` headers, measure **p95/p99 benchmarks** under real concurrency, and ship non-fabricated evidence.
<!-- @starci/seperator -->
# requirements
## 0
### purpose
<!-- @starci/seperator -->
Write an atomic Lua script that handles the entire sliding-window-log logic over Redis ZSET in a single round trip.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
Lua script receives `KEYS[1] = limit:<identity>` + `ARGV = (now_ms, window_ms, limit)`; the script must run `ZREMRANGEBYSCORE key 0 (now - window)` → `ZCARD key` → if `count < limit` then `ZADD key now now` + `EXPIRE key ceil(window/1000)` + return `{1, limit - count - 1, oldest_score}`; else return `{0, 0, oldest_score}`; the whole logic runs ATOMICALLY in a single EVAL — never split across round trips.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Return an array of `allowed`, `remaining`, `oldest_score` so the client can compute `retry_after` without a second round trip.
- Cache the script via `SCRIPT LOAD` + `EVALSHA` to shrink the payload.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
15
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Scoring rubric (max 15):

- Criterion A (5 points): The whole logic runs ATOMICALLY in a single EVAL — `ZREMRANGEBYSCORE` + `ZCARD` + `ZADD` + `EXPIRE` never split into a second round trip.
- Criterion B (4 points): The script returns the array `{allowed, remaining, oldest_score}`, supplying every value the client needs for headers.
- Criterion C (3 points): Redis key TTL is set via `EXPIRE ceil(window/1000)` on every ADD, never letting the ZSET grow unbounded when traffic stops.
- Criterion D (3 points): Uses `EVALSHA` with a fallback to `EVAL` whenever the script is missing (handles the `NOSCRIPT` error).

Rule: each criterion fully met receives its full points; partial/incorrect receives 0.
<!-- @starci/seperator -->
## 1
### purpose
<!-- @starci/seperator -->
Integrate the Lua limiter into a NestJS Guard with identity resolution + per-route configuration.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
Implement `RateLimitGuard` that reads identity (IP via `X-Forwarded-For` falling back to `req.ip`, or `user.id` when authenticated); per-route config via decorator `@RateLimit({ limit, windowMs })`; default threshold `100 req / 60s`; key format `limit:{routeKey}:{identity}`; when `allowed=0`, throw `ThrottlerException` mapping to HTTP 429.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Use `Reflector.get(metadataKey, handler)` to read per-route config.
- Hash IPv6 so the key stays short (≤64 bytes).
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
12
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Scoring rubric (max 12):

- Criterion A (4 points): Identity resolution follows the exact order `user.id > first X-Forwarded-For > req.ip`, never null/undefined.
- Criterion B (4 points): Per-route config via `@RateLimit({ limit, windowMs })` decorator overrides the default `100 req / 60s`.
- Criterion C (2 points): Key format `limit:{routeKey}:{identity}`, distinct routes do not share counters.
- Criterion D (2 points): Blocked requests throw an exception that maps to HTTP 429 with the body `{ statusCode: 429, message }`.

Rule: each criterion fully met receives its full points; partial/incorrect receives 0.
<!-- @starci/seperator -->
## 2
### purpose
<!-- @starci/seperator -->
Attach standard rate-limit headers so clients can self-throttle.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
Every response (allow or block) must include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` (UNIX timestamp in seconds when `oldest_score + window` expires); blocked responses additionally include `Retry-After` (seconds) = `ceil((oldest_score + window - now) / 1000)`.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Set headers in an interceptor after the guard runs, the response object already carries info from the script result.
- Test headers with `curl -i` to inspect the raw response.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
0
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Shared with requirement 1 (rate limit guard + standard `X-RateLimit-*` + `Retry-After` headers).
<!-- @starci/seperator -->
## 3
### purpose
<!-- @starci/seperator -->
Measure p95/p99 benchmarks under real concurrency to prove the limiter is correct and not a bottleneck.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
Run `k6` or `autocannon` for three scenarios: (a) below limit (50 req/60s), (b) at limit (100 req/60s burst), (c) above limit (300 req/60s); each scenario runs ≥60 seconds with ≥50 VUs; capture p50/p95/p99 latency of the guard logic (split by request type) + 200/429 ratio; commit raw JSON output into `evidence/k6-*.json`.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Target p95 guard latency under 5ms with a local Redis is reasonable.
- Plot 200 vs 429 histogram over time to visualize when throttling kicks in.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
15
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Scoring rubric (max 15):

- Criterion A (5 points): All three benchmark scenarios actually run ≥60s × ≥50 VUs, raw JSON outputs `evidence/k6-below.json`, `k6-at.json`, `k6-above.json` committed.
- Criterion B (4 points): Report p50/p95/p99 latency per scenario, numbers in README match the raw JSON exactly.
- Criterion C (3 points): "Above limit" scenario shows a 429/200 ratio ≈ `(300-100)/300 ≈ 67%` ±5%, not drifting to 50% or 90%.
- Criterion D (3 points): Histogram or 200/429 time series with a short comment on when throttling activates.

Rule: each criterion fully met receives its full points; partial/incorrect receives 0.
<!-- @starci/seperator -->
## 4
### purpose
<!-- @starci/seperator -->
Audit log every blocked request for observability and downstream alerting.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
Every 429 must emit a stdout JSON log line with fields `{ timestamp, identity, route, limit, window_ms, remaining: 0, retry_after_sec }`; log format never paraphrased; periodically ship to `logs/rate-limit-blocks.jsonl` as evidence; paste 10 raw sample lines in the README.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Use `pino` or `winston` JSON formatter to enforce strict structure.
- Hash identities for external sinks (PII), leave raw when running locally.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
8
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Scoring rubric (max 8):

- Criterion A (3 points): Each 429 emits a JSON log line with the 7 required fields, format never drifts.
- Criterion B (3 points): Logs persisted to `logs/rate-limit-blocks.jsonl`, paste ≥10 raw lines in the README.
- Criterion C (2 points): Identity hashed when shipping to an external sink (placeholder acceptable for local-only setups).

Rule: each criterion fully met receives its full points; partial/incorrect receives 0.
<!-- @starci/seperator -->
## 5
### purpose
<!-- @starci/seperator -->
Write an evidence-grade README and lock in correctness with forbidden rules.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
README has all 6 sections, Smoke Test pastes raw `curl -i` for both 200 and 429 with the `X-RateLimit-*` headers, Architecture/Stack has Mermaid or a table describing the ZSET + Lua flow, Design Decisions locks in one real concurrency decision (e.g. why ZSET log instead of counter, trade-off of 8KB/window memory versus accuracy).
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Code Execution Trace ≥3 hops `Guard.canActivate` → `LimiterService.eval` → `RateLimitInterceptor.intercept`.
<!-- @starci/seperator -->
### forbidden
<!-- @starci/seperator -->
- Computing limiter state in NestJS memory instead of Redis ZSET -> **0 prompt distributed correctness**.
- Splitting `ZREMRANGEBYSCORE` + `ZCARD` + `ZADD` into multiple round trips (race window) -> **0 prompt atomicity**.
- Fabricating benchmark JSON / pasting output not produced by `k6` -> **0 whole challenge**.
- A counter-based limiter mislabeled as sliding window (fixed window calling itself "sliding") -> **0 whole challenge**.
- No `X-RateLimit-*` headers in the response -> **0 prompt header contract**.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
10
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Scoring rubric (max 10):

- Criterion A (3 points): README has all 6 sections, Smoke Test pastes raw `curl -i` for both 200 and 429 with headers.
- Criterion B (3 points): Architecture diagram (Mermaid or table) correctly describes the ZSET + Lua + Guard flow.
- Criterion C (2 points): Design Decisions locks in one real concurrency decision + numeric trade-off (memory, latency, accuracy).
- Criterion D (2 points): Code Execution Trace ≥3 real `file:line -> method()` hops covering both allow and block paths.

Rule: each criterion fully met receives its full points; partial/incorrect receives 0.
<!-- @starci/seperator -->
# outputs
## 0
### text
<!-- @starci/seperator -->
You write an atomic Lua script handling sliding-window-log logic over Redis ZSET in a single round trip, returning all info the client needs.
<!-- @starci/seperator -->
## 1
### text
<!-- @starci/seperator -->
You integrate the rate limiter through a NestJS Guard with identity resolution, per-route config and standard `X-RateLimit-*` + `Retry-After` headers.
<!-- @starci/seperator -->
## 2
### text
<!-- @starci/seperator -->
You measure and report p50/p95/p99 latency across 3 real load scenarios with `k6` and ship non-fabricated raw JSON evidence.
<!-- @starci/seperator -->
## 3
### text
<!-- @starci/seperator -->
You design a JSON audit log for every blocked request to support observability and downstream alerts.
<!-- @starci/seperator -->
# prerequisites
## 0
### text
<!-- @starci/seperator -->
Completed MEDIUM `pagination-redis-cache-stampede-control-medium`.
<!-- @starci/seperator -->
## 1
### text
<!-- @starci/seperator -->
Access to a Redis server and familiarity with `EVAL` / `EVALSHA` / ZSET commands.
<!-- @starci/seperator -->
## 2
### text
<!-- @starci/seperator -->
Install `k6` (https://k6.io) or `autocannon` to run benchmarks.
<!-- @starci/seperator -->
# steps
## 0
### title
<!-- @starci/seperator -->
Write the atomic sliding-window Lua script
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Steps
- **Step 1:** Create the NestJS project + install Redis client.
  ```bash
  nest new sliding-window-rate-limiter-hard
  cd sliding-window-rate-limiter-hard
  npm i ioredis @nestjs/config
  ```
- **Step 2:** Create `src/limiter/limiter.lua` containing the atomic script: `ZREMRANGEBYSCORE` → `ZCARD` → conditional `ZADD` + `EXPIRE` → return array.
- **Step 3:** Create `LimiterService` that loads the script via `SCRIPT LOAD` at bootstrap, stores `scriptSha`; method `eval(key, limit, windowMs)` runs `EVALSHA` with `EVAL` fallback on `NOSCRIPT`.
- **Step 4:** Unit test with `ioredis-mock`: 100 calls with `limit=10, window=1000ms` → exactly 10 allowed + 90 blocked.

### 2. Minimum acceptance criteria
- Script returns `{allowed, remaining, oldest_score}` matching the schema.
- Atomic in a single EVAL — verify via `MONITOR` showing exactly one EVALSHA command per request.
- Key TTL is reset on every ADD, never grows unbounded.

### 3. Nice to have
- Benchmark Lua script latency with `redis-benchmark -n 100000 -P 16 EVALSHA ...`.
- Version the script by sha1 + auto-reload on change.

### codeImplementations
#### 0
##### lang
typescript
##### guide
**Main library:** **`ioredis`** via `defineCommand` or raw `eval/evalsha` — load Lua from an external file, cache SHA at bootstrap.

**API mapping:**
- `redis.eval(script, numKeys, keys, args)` -> returns Lua result directly.
- `redis.script('LOAD', source)` -> returns sha1 for later `evalsha`.

**Differences / gotchas:**
- `evalsha` throws `NOSCRIPT` after a Redis restart — catch and fall back to `eval`.
- Lua arrays come back from ioredis as `[number, number, number]`.
##### example
```typescript
const SCRIPT = readFileSync(join(__dirname, "limiter.lua"), "utf8")

@Injectable()
export class LimiterService implements OnModuleInit {
    private sha!: string
    constructor(@InjectRedis() private redis: Redis) {}
    async onModuleInit() { this.sha = (await this.redis.script("LOAD", SCRIPT)) as string }

    async check(key: string, limit: number, windowMs: number): Promise<[number, number, number]> {
        try {
            return (await this.redis.evalsha(this.sha, 1, key, Date.now(), windowMs, limit)) as any
        } catch (e: any) {
            if (e.message?.includes("NOSCRIPT")) return (await this.redis.eval(SCRIPT, 1, key, Date.now(), windowMs, limit)) as any
            throw e
        }
    }
}
```
#### 1
##### lang
csharp
##### guide
**Main library:** **`StackExchange.Redis`** — `IDatabase.ScriptEvaluateAsync` together with `LoadedLuaScript`.

**API mapping:**
- `redis.script('LOAD', source)` -> `LuaScript.Prepare(source).LoadAsync(server)`.
- `redis.evalsha` -> `loadedScript.EvaluateAsync(db, new { keys, args })`.

**Differences / gotchas:**
- `LoadedLuaScript` caches the sha automatically and auto-retries `NOSCRIPT`.
- Args must be passed via anonymous object so they bind to Lua param names.
##### example
```csharp
private static readonly LuaScript Script = LuaScript.Prepare(File.ReadAllText("limiter.lua"));
private LoadedLuaScript _loaded = null!;

public async Task<long[]> CheckAsync(string key, int limit, int windowMs)
{
    if (_loaded == null) _loaded = await Script.LoadAsync(_redis.GetServer(_redis.GetEndPoints()[0]));
    var result = await _loaded.EvaluateAsync(_db, new { key = (RedisKey)key, now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(), window = windowMs, limit });
    return (long[])result!;
}
```
#### 2
##### lang
go
##### guide
**Main library:** **`go-redis/v9`** — `redis.NewScript(source)` caches the sha + auto-retries `NOSCRIPT`.

**API mapping:**
- `redis.script LOAD` -> `script := redis.NewScript(source); script.Load(ctx, rdb)`.
- `redis.evalsha` -> `script.Run(ctx, rdb, keys, args...)` falls back to EVAL automatically.

**Differences / gotchas:**
- `Run` handles `NOSCRIPT` internally — no manual catch needed.
- Result returns `interface{}` — cast to `[]interface{}` then each element to int64.
##### example
```go
//go:embed limiter.lua
var limiterScript string
var limiter = redis.NewScript(limiterScript)

func (s *LimiterService) Check(ctx context.Context, key string, limit, windowMs int) ([]int64, error) {
    res, err := limiter.Run(ctx, s.rdb, []string{key}, time.Now().UnixMilli(), windowMs, limit).Result()
    if err != nil { return nil, err }
    arr := res.([]interface{})
    return []int64{arr[0].(int64), arr[1].(int64), arr[2].(int64)}, nil
}
```
#### 3
##### lang
java
##### guide
**Main library:** **`StringRedisTemplate`** + **`DefaultRedisScript`** — Spring caches the sha and falls back on `NOSCRIPT` automatically.

**API mapping:**
- `redis.script LOAD` -> `new DefaultRedisScript<>(source, List.class)`.
- `redis.evalsha` -> `redisTemplate.execute(script, keys, args)`.

**Differences / gotchas:**
- Spring Redis handles `NOSCRIPT` for you — no catch required.
- Return type must match the script return: `List.class` for arrays, generics convert automatically.
##### example
```java
private final DefaultRedisScript<List> script = new DefaultRedisScript<>(
    Files.readString(Path.of("src/main/resources/limiter.lua")), List.class);

public List<Long> check(String key, int limit, long windowMs) {
    List<Long> result = redisTemplate.execute(script, List.of(key),
        String.valueOf(System.currentTimeMillis()), String.valueOf(windowMs), String.valueOf(limit));
    return result;
}
```
<!-- @starci/seperator -->
## 1
### title
<!-- @starci/seperator -->
Integrate the Guard + identity resolution + per-route decorator
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Steps
- **Step 1:** Create the decorator `@RateLimit({ limit, windowMs })` that stores metadata via `SetMetadata('rate-limit', opts)`.
- **Step 2:** Create `RateLimitGuard` implementing `CanActivate`: read metadata via `Reflector`, resolve identity (user.id > X-Forwarded-For[0] > req.ip), build key `limit:{routeKey}:{identity}`, call `LimiterService.check`.
- **Step 3:** When `allowed=0`, throw `HttpException('Too Many Requests', 429)` with body `{ statusCode: 429, message, retryAfter }`.
- **Step 4:** Apply the guard globally via the `APP_GUARD` provider; default `100 req / 60s` when the route lacks the decorator.

### 2. Minimum acceptance criteria
- Identity resolution is never null/undefined on any request (test both with and without an auth header).
- Per-route config successfully overrides the default, verified by one endpoint allowing while another is blocked.
- Blocked requests return HTTP 429 with the standard body.

### 3. Nice to have
- Hash IPv6 with sha256 so the key stays <64 bytes.
- Support skipping the limit via decorator `@SkipRateLimit()`.

### codeImplementations
#### 0
##### lang
typescript
##### guide
**Main library:** **`@nestjs/core`** Reflector + custom Guard pattern, `SetMetadata` for per-route config.

**API mapping:**
- `Reflector.get(metadataKey, ctx.getHandler())` -> read per-route config.
- `context.switchToHttp().getRequest()` -> Express/Fastify request for IP + user.

**Differences / gotchas:**
- `Reflector.getAllAndOverride([handler, class])` lets the handler override class-level config.
- `X-Forwarded-For` may contain multiple IPs — pick the first (client IP).
##### example
```typescript
export const RATE_LIMIT_KEY = "rate-limit"
export const RateLimit = (opts: { limit: number; windowMs: number }) => SetMetadata(RATE_LIMIT_KEY, opts)

@Injectable()
export class RateLimitGuard implements CanActivate {
    constructor(private reflector: Reflector, private limiter: LimiterService) {}
    async canActivate(ctx: ExecutionContext): Promise<boolean> {
        const opts = this.reflector.getAllAndOverride(RATE_LIMIT_KEY, [ctx.getHandler(), ctx.getClass()]) ?? { limit: 100, windowMs: 60_000 }
        const req = ctx.switchToHttp().getRequest()
        const identity = req.user?.id ?? (req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ?? req.ip)
        const [allowed] = await this.limiter.check(`limit:${ctx.getHandler().name}:${identity}`, opts.limit, opts.windowMs)
        if (!allowed) throw new HttpException("Too Many Requests", 429)
        return true
    }
}
```
#### 1
##### lang
csharp
##### guide
**Main library:** **`Microsoft.AspNetCore.Mvc.Filters`** — `IAsyncActionFilter` replaces the Nest Guard.

**API mapping:**
- Nest `@RateLimit` -> custom attribute `[RateLimit(Limit=100, WindowMs=60000)]`.
- `Reflector` -> `context.ActionDescriptor.EndpointMetadata.OfType<RateLimitAttribute>()`.

**Differences / gotchas:**
- ASP.NET filters run after auth — use `HttpContext.User.Identity.Name` for identity.
- Throw `RateLimitExceededException` and handle it via middleware.
##### example
```csharp
public class RateLimitAttribute : Attribute, IAsyncActionFilter
{
    public int Limit { get; set; } = 100;
    public int WindowMs { get; set; } = 60_000;
    public async Task OnActionExecutionAsync(ActionExecutingContext ctx, ActionExecutionDelegate next) {
        var identity = ctx.HttpContext.User.Identity?.Name ?? ctx.HttpContext.Connection.RemoteIpAddress?.ToString();
        var result = await _limiter.CheckAsync($"limit:{ctx.ActionDescriptor.DisplayName}:{identity}", Limit, WindowMs);
        if (result[0] == 0) { ctx.Result = new StatusCodeResult(429); return; }
        await next();
    }
}
```
#### 2
##### lang
go
##### guide
**Main library:** **`gin`** middleware pattern + struct config per route.

**API mapping:**
- Per-route decorator -> middleware closure `RateLimit(limit, window)` applied via `router.GET("/path", RateLimit(50, time.Minute), handler)`.
- Identity -> `c.Request.Header.Get("X-Forwarded-For")` falling back to `c.ClientIP()`.

**Differences / gotchas:**
- Gin has no Reflector — config flows through the closure capture.
- Block via `c.AbortWithStatusJSON(429, gin.H{...})`.
##### example
```go
func RateLimit(limit, windowMs int) gin.HandlerFunc {
    return func(c *gin.Context) {
        identity := c.ClientIP()
        if xff := c.GetHeader("X-Forwarded-For"); xff != "" { identity = strings.Split(xff, ",")[0] }
        res, _ := limiterService.Check(c, fmt.Sprintf("limit:%s:%s", c.FullPath(), identity), limit, windowMs)
        if res[0] == 0 { c.AbortWithStatusJSON(429, gin.H{"statusCode": 429, "message": "Too Many Requests"}); return }
        c.Next()
    }
}
```
#### 3
##### lang
java
##### guide
**Main library:** **Spring `HandlerInterceptor`** + a custom `@RateLimit` annotation reflected in `preHandle`.

**API mapping:**
- Nest `@RateLimit` -> `@Target(ElementType.METHOD) @Retention(RUNTIME) @interface RateLimit { ... }`.
- Reflector -> `HandlerMethod.getMethodAnnotation(RateLimit.class)`.

**Differences / gotchas:**
- `preHandle` returns false to block + sets status 429.
- `request.getHeader("X-Forwarded-For")` + fallback `request.getRemoteAddr()`.
##### example
```java
@Override
public boolean preHandle(HttpServletRequest req, HttpServletResponse resp, Object handler) throws Exception {
    if (!(handler instanceof HandlerMethod hm)) return true;
    RateLimit ann = hm.getMethodAnnotation(RateLimit.class);
    int limit = ann != null ? ann.limit() : 100;
    long window = ann != null ? ann.windowMs() : 60_000;
    String identity = Optional.ofNullable(req.getHeader("X-Forwarded-For")).map(s -> s.split(",")[0]).orElse(req.getRemoteAddr());
    List<Long> res = limiter.check("limit:" + req.getRequestURI() + ":" + identity, limit, window);
    if (res.get(0) == 0) { resp.setStatus(429); return false; }
    return true;
}
```
<!-- @starci/seperator -->
## 2
### title
<!-- @starci/seperator -->
Attach X-RateLimit and Retry-After headers
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Steps
- **Step 1:** After the guard calls `limiter.check`, stash `{remaining, oldestScore, limit, windowMs}` in `request.rateLimit` for the interceptor to read.
- **Step 2:** Create `RateLimitInterceptor` (running after the guard) that sets headers on the response: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` (= `floor((oldestScore + windowMs) / 1000)`).
- **Step 3:** On block (throw exception path), the `ExceptionFilter` also sets those three headers + `Retry-After` = `ceil((oldestScore + windowMs - now) / 1000)`.
- **Step 4:** Verify with `curl -i http://localhost:3000/api/foo` showing all headers in both 200 and 429.

### 2. Minimum acceptance criteria
- 200 responses contain all three `X-RateLimit-*` headers, `Remaining` strictly decreases as expected.
- 429 responses additionally contain `Retry-After` (seconds), value > 0.
- `X-RateLimit-Reset` is a UNIX timestamp in seconds, never milliseconds.

### 3. Nice to have
- Header `X-RateLimit-Policy: "100;w=60"` per the IETF draft.
- Log response headers for debugging.
<!-- @starci/seperator -->
## 3
### title
<!-- @starci/seperator -->
Benchmark 3 scenarios with k6 and capture evidence
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Steps
- **Step 1:** Install `k6` (https://k6.io/docs/get-started/installation/) and start the app + Redis.
- **Step 2:** Write 3 scripts `bench/below.js`, `bench/at.js`, `bench/above.js` with targets 50/100/300 req/60s, 50 VUs.
  ```javascript
  // bench/above.js
  import http from 'k6/http';
  export const options = { vus: 50, duration: '60s', rps: 300 };
  export default function () { http.get('http://localhost:3000/api/foo'); }
  ```
- **Step 3:** Run each script and store the raw JSON.
  ```bash
  k6 run --out json=evidence/k6-below.json bench/below.js
  k6 run --out json=evidence/k6-at.json bench/at.js
  k6 run --out json=evidence/k6-above.json bench/above.js
  ```
- **Step 4:** Parse the JSON, build a p50/p95/p99 table + 200/429 ratio for every scenario, paste into the README's `Smoke Test` section.

### 2. Minimum acceptance criteria
- 3 files `evidence/k6-*.json` committed to the repo, raw `k6` output (no paraphrasing).
- The p50/p95/p99 table in the README matches the JSON 1:1.
- The "above limit" scenario shows a 429/total ratio ≈ 67% ±5%.

### 3. Nice to have
- Add script `bench/plot.py` that parses JSON → emits a histogram PNG committed to evidence/.
- Use the k6 `thresholds: { 'http_req_duration{status:200}': ['p(95)<10'] }` to fail the build when p95 regresses.
<!-- @starci/seperator -->
## 4
### title
<!-- @starci/seperator -->
JSON audit log for block events
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Steps
- **Step 1:** Install `pino` and configure JSON formatter in `main.ts`.
- **Step 2:** Inside the 429 `ExceptionFilter`, log a JSON line with fields `{ timestamp, identity, route, limit, window_ms, remaining, retry_after_sec }`.
- **Step 3:** Pipe stdout → `logs/rate-limit-blocks.jsonl` via a process manager (PM2, systemd, or a dev script).
- **Step 4:** Trigger ≥10 blocks via the k6 "above limit" run to generate sample logs; copy 10 raw lines into the README.

### 2. Minimum acceptance criteria
- Every 429 emits exactly one JSON line with the 7 required fields.
- File `logs/rate-limit-blocks.jsonl` contains ≥10 lines from the benchmark run.
- README pastes ≥10 raw log lines (unedited).

### 3. Nice to have
- Ship logs to Loki/CloudWatch via a transport.
- Add a correlation ID per request to trace the entire flow.

### codeImplementations
#### 0
##### lang
typescript
##### guide
**Main library:** **`pino`** + **`nestjs-pino`** — JSON structured logging, strict format that does not drift.

**API mapping:**
- `console.log({...})` -> `logger.warn({ ... }, "rate_limit_block")`.
- File transport -> pipe stdout or `pino-pretty | tee logs/...`.

**Differences / gotchas:**
- `pino` defaults to single-line JSON — no custom formatter needed.
- Keep field names strict so downstream parsers match.
##### example
```typescript
@Catch(RateLimitException)
export class RateLimitExceptionFilter implements ExceptionFilter {
    private logger = new Logger("RateLimit")
    catch(ex: RateLimitException, host: ArgumentsHost) {
        const req = host.switchToHttp().getRequest()
        const res = host.switchToHttp().getResponse()
        this.logger.warn({
            timestamp: new Date().toISOString(),
            identity: ex.identity, route: req.route?.path,
            limit: ex.limit, window_ms: ex.windowMs,
            remaining: 0, retry_after_sec: ex.retryAfter,
        }, "rate_limit_block")
        res.status(429).header("Retry-After", String(ex.retryAfter)).json({ statusCode: 429, message: "Too Many Requests" })
    }
}
```
#### 1
##### lang
csharp
##### guide
**Main library:** **`Serilog`** + `WriteTo.File(formatter: new JsonFormatter())` — JSON structured logging in ASP.NET.

**API mapping:**
- `Logger.warn(obj)` -> `_logger.LogWarning("{@Block}", blockObj)`.
- File transport -> `Log.Logger = new LoggerConfiguration().WriteTo.File(new JsonFormatter(), "logs/rate-limit.jsonl")`.

**Differences / gotchas:**
- The `{@}` destructure operator preserves object property names.
- `JsonFormatter` comes from `Serilog.Formatting.Json`.
##### example
```csharp
_logger.LogWarning("{@Block}", new {
    timestamp = DateTimeOffset.UtcNow,
    identity, route = ctx.Request.Path.ToString(),
    limit, window_ms = windowMs, remaining = 0, retry_after_sec = retryAfter
});
```
#### 2
##### lang
go
##### guide
**Main library:** **`zerolog`** — fast native JSON structured logging.

**API mapping:**
- `logger.warn(obj)` -> `log.Warn().Str(...).Int(...).Msg("rate_limit_block")`.
- File transport -> `log.Logger = zerolog.New(os.Stdout)` + shell pipe.

**Differences / gotchas:**
- Fluent API — chain `Str/Int/Msg` per field.
- `zerolog` already emits JSON by default.
##### example
```go
log.Warn().
    Str("timestamp", time.Now().UTC().Format(time.RFC3339)).
    Str("identity", identity).
    Str("route", c.FullPath()).
    Int("limit", limit).
    Int("window_ms", windowMs).
    Int("remaining", 0).
    Int("retry_after_sec", retryAfter).
    Msg("rate_limit_block")
```
#### 3
##### lang
java
##### guide
**Main library:** **`logback-classic`** + **`logstash-logback-encoder`** — JSON encoder for Logback.

**API mapping:**
- `logger.warn(obj)` -> `log.warn(StructuredArguments.kv("identity", ...), ...)`.
- File transport -> `<appender class="ch.qos.logback.core.FileAppender">` + JSON encoder.

**Differences / gotchas:**
- Must configure `logback.xml` with `LogstashEncoder`.
- `StructuredArguments` from logstash-logback avoids string concatenation.
##### example
```java
log.warn("rate_limit_block {} {} {} {} {} {} {}",
    StructuredArguments.kv("timestamp", Instant.now()),
    StructuredArguments.kv("identity", identity),
    StructuredArguments.kv("route", req.getRequestURI()),
    StructuredArguments.kv("limit", limit),
    StructuredArguments.kv("window_ms", windowMs),
    StructuredArguments.kv("remaining", 0),
    StructuredArguments.kv("retry_after_sec", retryAfter));
```
<!-- @starci/seperator -->
## 5
### title
<!-- @starci/seperator -->
Write the evidence-grade README and lock in design decisions
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Steps
- **Step 1:** Write the README with all 6 sections: Challenge description, How to run, Architecture/Stack (Mermaid ZSET + Lua + Guard + Interceptor), Smoke Test (paste raw `curl -i` 200 + 429 + p50/p95/p99 table + 10 raw JSON log lines), Code Execution Trace (≥3 hops), Design Decisions.
- **Step 2:** In Smoke Test, paste the real `curl -i` output:
  ```bash
  curl -i http://localhost:3000/api/foo
  curl -i http://localhost:3000/api/foo  # repeat until blocked
  ```
- **Step 3:** Design Decisions locks in one real concurrency decision with numeric trade-off: why ZSET log (memory ~8KB/window/identity, 100% accuracy) was chosen over a token bucket counter (memory 16B/identity, 95% accuracy).
- **Step 4:** Code Execution Trace explicitly names `src/limiter/limiter.guard.ts:25 -> RateLimitGuard.canActivate` → `src/limiter/limiter.service.ts:42 -> LimiterService.check` → `src/limiter/rate-limit.interceptor.ts:18 -> RateLimitInterceptor.intercept`.

### 2. Minimum acceptance criteria
- README has all 6 sections with real raw output for both 200 and 429.
- Design Decisions includes numeric trade-offs (memory, latency, accuracy), never vague "chose for performance".
- Code Execution Trace has ≥3 real `file:line -> method()` hops.

### 3. Nice to have
- Comparison table sliding window vs token bucket vs fixed window with three columns (memory, accuracy, complexity).
- Time-series diagram of 200/429 throughput from k6.
<!-- @starci/seperator -->
# references
## 0
### alias
<!-- @starci/seperator -->
Redis Lua Scripting (EVAL/EVALSHA)
<!-- @starci/seperator -->
### url
<!-- @starci/seperator -->
https://redis.io/docs/latest/develop/interact/programmability/eval-intro/
<!-- @starci/seperator -->
## 1
### alias
<!-- @starci/seperator -->
Cloudflare — How we built rate limiting
<!-- @starci/seperator -->
### url
<!-- @starci/seperator -->
https://blog.cloudflare.com/counting-things-a-lot-of-different-things/
<!-- @starci/seperator -->
## 2
### alias
<!-- @starci/seperator -->
k6 Documentation
<!-- @starci/seperator -->
### url
<!-- @starci/seperator -->
https://k6.io/docs/
<!-- @starci/seperator -->
## 3
### alias
<!-- @starci/seperator -->
IETF RateLimit Headers Draft
<!-- @starci/seperator -->
### url
<!-- @starci/seperator -->
https://datatracker.ietf.org/doc/draft-ietf-httpapi-ratelimit-headers/
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
Public repo containing the NestJS source + Lua script + `docker-compose.yml` for Redis + `bench/` folder with the 3 k6 scripts + `evidence/` folder with 3 raw `k6-*.json` files + `logs/` folder with `rate-limit-blocks.jsonl` + README with all 6 sections (Challenge description, How to run, Architecture/Stack with Mermaid, Smoke Test with raw `curl -i` for 200/429 + p50/p95/p99 table + 10 raw JSON log lines, Code Execution Trace with ≥3 hops, Design Decisions with numeric memory/latency/accuracy trade-offs).
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
60
<!-- @starci/seperator -->
# difficulty
<!-- @starci/seperator -->
hard
<!-- @starci/seperator -->
# score
<!-- @starci/seperator -->
60
<!-- @starci/seperator -->
