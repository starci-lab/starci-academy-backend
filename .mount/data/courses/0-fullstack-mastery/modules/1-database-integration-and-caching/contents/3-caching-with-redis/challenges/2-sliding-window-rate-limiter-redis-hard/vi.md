# title
<!-- @starci/seperator -->
Sliding Window Rate Limiter trên Redis với Lua Scripting và Benchmark p95/p99
<!-- @starci/seperator -->
# description
<!-- @starci/seperator -->
Challenge hard phát triển từ bản MEDIUM. Bạn xây dựng **sliding window log rate limiter** tiệm cận production trên Redis ZSET + **Lua scripting atomic**, expose qua NestJS Guard, trả HTTP 429 với rate limit header chuẩn `X-RateLimit-*`, đo **benchmark p95/p99** dưới tải concurrency thật và viết evidence không fabricate.
<!-- @starci/seperator -->
# requirements
## 0
### purpose
<!-- @starci/seperator -->
Viết Lua script atomic xử lý toàn bộ logic sliding window log trên Redis ZSET trong 1 round trip.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
Lua script nhận `KEYS[1] = limit:<identity>` + `ARGV = (now_ms, window_ms, limit)`; trong script phải chạy `ZREMRANGEBYSCORE key 0 (now - window)` → `ZCARD key` → if `count < limit` thì `ZADD key now now` + `EXPIRE key ceil(window/1000)` + return `{1, limit - count - 1, oldest_score}`; else return `{0, 0, oldest_score}`; toàn bộ logic chạy ATOMIC trong 1 EVAL — không split sang nhiều round trip.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Trả về array gồm `allowed`, `remaining`, `oldest_score` để client tính `retry_after` mà không cần round trip thứ 2.
- Cache script qua `SCRIPT LOAD` + `EVALSHA` để giảm payload.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
15
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Rubric chấm điểm (tối đa 15):

- Tiêu chí A (5 điểm): Toàn bộ logic chạy ATOMIC trong 1 EVAL — `ZREMRANGEBYSCORE` + `ZCARD` + `ZADD` + `EXPIRE` không tách sang lần round trip thứ 2.
- Tiêu chí B (4 điểm): Script trả về array `{allowed, remaining, oldest_score}` đủ thông tin cho client tính header.
- Tiêu chí C (3 điểm): TTL Redis key set qua `EXPIRE ceil(window/1000)` mỗi lần ADD, không để ZSET phình vô hạn khi không có request mới.
- Tiêu chí D (3 điểm): Dùng `EVALSHA` với fallback `EVAL` khi script chưa load (handle `NOSCRIPT` error).

Quy tắc chấm: mỗi tiêu chí làm đúng trọn vẹn thì nhận đủ điểm tiêu chí đó; thiếu/sai tiêu chí nào thì tiêu chí đó nhận 0 điểm.
<!-- @starci/seperator -->
## 1
### purpose
<!-- @starci/seperator -->
Tích hợp Lua limiter vào NestJS Guard với identity resolution + per-route config.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
Triển khai `RateLimitGuard` đọc identity (IP qua `X-Forwarded-For` fallback `req.ip`, hoặc `user.id` nếu authenticated); per-route config qua decorator `@RateLimit({ limit, windowMs })`; ngưỡng default `100 req / 60s`; key format `limit:{routeKey}:{identity}`; khi `allowed=0` throw `ThrottlerException` mapping HTTP 429.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Dùng `Reflector.get(metadataKey, handler)` để đọc per-route config.
- IPv6 hash để key không quá dài (>64 byte).
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
12
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Rubric chấm điểm (tối đa 12):

- Tiêu chí A (4 điểm): Identity resolution đúng thứ tự `user.id > X-Forwarded-For đầu tiên > req.ip`, không null/undefined identity.
- Tiêu chí B (4 điểm): Per-route config qua `@RateLimit({ limit, windowMs })` decorator override default `100 req / 60s`.
- Tiêu chí C (2 điểm): Key format đúng `limit:{routeKey}:{identity}`, route khác nhau không share counter.
- Tiêu chí D (2 điểm): Khi block, throw exception mapping về HTTP 429 với body chuẩn `{ statusCode: 429, message }`.

Quy tắc chấm: mỗi tiêu chí làm đúng trọn vẹn thì nhận đủ điểm tiêu chí đó; thiếu/sai tiêu chí nào thì tiêu chí đó nhận 0 điểm.
<!-- @starci/seperator -->
## 2
### purpose
<!-- @starci/seperator -->
Gắn rate limit header chuẩn để client tự điều tiết request.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
Mọi response (cả allow lẫn block) phải có header `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` (UNIX timestamp giây khi `oldest_score + window` expire); khi block thêm header `Retry-After` (giây) = `ceil((oldest_score + window - now) / 1000)`.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Set header trong interceptor sau guard, response object đã có info từ script result.
- Test header bằng `curl -i` để xem raw response.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
0
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Sử dụng chung với yêu cầu 1 (rate limit guard + header chuẩn `X-RateLimit-*` + `Retry-After`).
<!-- @starci/seperator -->
## 3
### purpose
<!-- @starci/seperator -->
Đo benchmark p95/p99 dưới tải concurrency thật chứng minh limiter chính xác và không trở thành bottleneck.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
Dùng `k6` hoặc `autocannon` chạy 3 scenario: (a) below limit (50 req/60s), (b) at limit (100 req/60s burst), (c) above limit (300 req/60s); mỗi scenario chạy ≥ 60 giây với ≥ 50 VU; capture p50/p95/p99 latency của guard logic (chia request type) + ratio 200/429; commit raw JSON output vào `evidence/k6-*.json`.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- p95 guard latency < 5ms với Redis local là target reasonable.
- Plot histogram 200 vs 429 theo thời gian để thấy throttle kick-in.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
15
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Rubric chấm điểm (tối đa 15):

- Tiêu chí A (5 điểm): 3 scenario benchmark chạy thật ≥60s × ≥50 VU, raw JSON output `evidence/k6-below.json`, `k6-at.json`, `k6-above.json` commit vào repo.
- Tiêu chí B (4 điểm): Báo cáo p50/p95/p99 latency cho từng scenario, số liệu khớp giữa README và raw JSON.
- Tiêu chí C (3 điểm): Scenario (c) "above limit" chứng minh ratio 429/200 ≈ `(300-100)/300 ≈ 67%` ±5%, không drift về 50% hay 90%.
- Tiêu chí D (3 điểm): Plot histogram hoặc time series 200/429 theo timestamp, có comment ngắn về moment throttle kick-in.

Quy tắc chấm: mỗi tiêu chí làm đúng trọn vẹn thì nhận đủ điểm tiêu chí đó; thiếu/sai tiêu chí nào thì tiêu chí đó nhận 0 điểm.
<!-- @starci/seperator -->
## 4
### purpose
<!-- @starci/seperator -->
Audit log mỗi request bị block để observability + alert downstream.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
Mỗi 429 ghi log JSON line vào stdout với fields `{ timestamp, identity, route, limit, window_ms, remaining: 0, retry_after_sec }`; log format không paraphrase; định kỳ ship vào file `logs/rate-limit-blocks.jsonl` để evidence; trong README paste 10 dòng raw log mẫu.
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Dùng `pino` hoặc `winston` JSON formatter để strict structure.
- Hash identity nếu logging tới external (PII) — local OK leave raw.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
8
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Rubric chấm điểm (tối đa 8):

- Tiêu chí A (3 điểm): Mỗi 429 emit JSON log line đủ 7 field, format không drift.
- Tiêu chí B (3 điểm): Log persist vào `logs/rate-limit-blocks.jsonl`, paste ≥10 dòng raw vào README.
- Tiêu chí C (2 điểm): Identity hash khi log tới external sink (placeholder OK nếu local-only).

Quy tắc chấm: mỗi tiêu chí làm đúng trọn vẹn thì nhận đủ điểm tiêu chí đó; thiếu/sai tiêu chí nào thì tiêu chí đó nhận 0 điểm.
<!-- @starci/seperator -->
## 5
### purpose
<!-- @starci/seperator -->
Viết README evidence-grade + bảo vệ correctness bằng forbidden rules.
<!-- @starci/seperator -->
### technicalConstraints
<!-- @starci/seperator -->
README đủ 6 section, Smoke Test paste raw `curl -i` cho 200 + 429 với header `X-RateLimit-*`, Architecture/Stack có Mermaid hoặc bảng describe ZSET + Lua flow, Design Decisions chốt 1 quyết định concurrency thật (vd: vì sao ZSET log thay vì counter, trade-off memory 8KB/window so với accuracy).
<!-- @starci/seperator -->
### proTipsHints
<!-- @starci/seperator -->
- Code Execution Trace ≥3 điểm chạm `Guard.canActivate` → `LimiterService.eval` → `RateLimitInterceptor.intercept`.
<!-- @starci/seperator -->
### forbidden
<!-- @starci/seperator -->
- Tính trạng thái limiter trong memory NestJS thay vì Redis ZSET -> **0 prompt distributed correctness**.
- Split `ZREMRANGEBYSCORE` + `ZCARD` + `ZADD` thành nhiều round trip (race window) -> **0 prompt atomicity**.
- Fabricate benchmark JSON / paste raw output không phải do `k6` sinh ra -> **0 whole challenge**.
- Counter-based limiter trá hình sliding window (fixed window đặt tên "sliding") -> **0 whole challenge**.
- Không có `X-RateLimit-*` header trong response -> **0 prompt header contract**.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
10
<!-- @starci/seperator -->
### promptText
<!-- @starci/seperator -->
Rubric chấm điểm (tối đa 10):

- Tiêu chí A (3 điểm): README đủ 6 section, Smoke Test paste raw `curl -i` cho cả 200 và 429 với header.
- Tiêu chí B (3 điểm): Architecture diagram (Mermaid hoặc bảng) describe đúng flow ZSET + Lua + Guard.
- Tiêu chí C (2 điểm): Design Decisions chốt 1 quyết định concurrency thật + trade-off số (memory, latency, accuracy).
- Tiêu chí D (2 điểm): Code Execution Trace ≥3 điểm chạm `file:line -> method()` thật cho luồng allow + block.

Quy tắc chấm: mỗi tiêu chí làm đúng trọn vẹn thì nhận đủ điểm tiêu chí đó; thiếu/sai tiêu chí nào thì tiêu chí đó nhận 0 điểm.
<!-- @starci/seperator -->
# outputs
## 0
### text
<!-- @starci/seperator -->
Bạn viết được Lua script atomic xử lý sliding window log trên Redis ZSET trong 1 round trip với output đủ thông tin client.
<!-- @starci/seperator -->
## 1
### text
<!-- @starci/seperator -->
Bạn tích hợp được rate limiter qua NestJS Guard với identity resolution, per-route config và header chuẩn `X-RateLimit-*` + `Retry-After`.
<!-- @starci/seperator -->
## 2
### text
<!-- @starci/seperator -->
Bạn đo và báo cáo được p50/p95/p99 latency dưới 3 scenario tải thật bằng `k6` với raw JSON evidence không fabricate.
<!-- @starci/seperator -->
## 3
### text
<!-- @starci/seperator -->
Bạn thiết kế audit log JSON cho mỗi request bị block phục vụ observability và alert downstream.
<!-- @starci/seperator -->
# prerequisites
## 0
### text
<!-- @starci/seperator -->
Đã hoàn thành MEDIUM `pagination-redis-cache-stampede-control-medium`.
<!-- @starci/seperator -->
## 1
### text
<!-- @starci/seperator -->
Quyền kết nối Redis server, làm quen lệnh `EVAL` / `EVALSHA` / ZSET commands.
<!-- @starci/seperator -->
## 2
### text
<!-- @starci/seperator -->
Cài `k6` (https://k6.io) hoặc `autocannon` để chạy benchmark.
<!-- @starci/seperator -->
# steps
## 0
### title
<!-- @starci/seperator -->
Viết Lua script sliding window atomic
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Các bước thực hiện
- **Bước 1:** Tạo project NestJS + cài Redis client.
  ```bash
  nest new sliding-window-rate-limiter-hard
  cd sliding-window-rate-limiter-hard
  npm i ioredis @nestjs/config
  ```
- **Bước 2:** Tạo `src/limiter/limiter.lua` chứa script atomic: `ZREMRANGEBYSCORE` → `ZCARD` → conditional `ZADD` + `EXPIRE` → return array.
- **Bước 3:** Tạo `LimiterService` load script qua `SCRIPT LOAD` lúc bootstrap, lưu `scriptSha`; method `eval(key, limit, windowMs)` chạy `EVALSHA` với fallback `EVAL` khi gặp `NOSCRIPT`.
- **Bước 4:** Unit test với `ioredis-mock`: 100 lần gọi với `limit=10, window=1000ms` → đúng 10 allowed + 90 blocked.

### 2. Yêu cầu tối thiểu cần đạt
- Script trả `{allowed, remaining, oldest_score}` đúng schema.
- Atomic trong 1 EVAL — verify bằng `MONITOR` chỉ thấy 1 command EVALSHA mỗi request.
- TTL key reset mỗi lần ADD, không vô hạn.

### 3. Nice to have
- Benchmark Lua script latency với `redis-benchmark -n 100000 -P 16 EVALSHA ...`.
- Versioning script qua hash sha1 + auto-reload khi script thay đổi.

### codeImplementations
#### 0
##### lang
typescript
##### guide
**Thư viện chính:** **`ioredis`** với `defineCommand` hoặc raw `eval/evalsha` — load Lua từ file external, cache SHA bootstrap time.

**Mapping API:**
- `redis.eval(script, numKeys, keys, args)` -> trả kết quả Lua trực tiếp.
- `redis.script('LOAD', source)` -> trả sha1, dùng cho `evalsha`.

**Khác biệt/gotcha:**
- `evalsha` throw `NOSCRIPT` khi Redis restart — phải catch + fallback `eval`.
- Trả về từ Lua là array — ioredis convert thành `[number, number, number]`.
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
**Thư viện chính:** **`StackExchange.Redis`** — `IDatabase.ScriptEvaluateAsync` với `LoadedLuaScript`.

**API mapping:**
- `redis.script('LOAD', source)` -> `LuaScript.Prepare(source).LoadAsync(server)`.
- `redis.evalsha` -> `loadedScript.EvaluateAsync(db, new { keys, args })`.

**Differences / gotchas:**
- `LoadedLuaScript` cache sha automatically + tự `NOSCRIPT` retry.
- Args phải pass qua anonymous object để bind tên Lua param.
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
**Thư viện chính:** **`go-redis/v9`** — `redis.NewScript(source)` cache sha + auto retry NOSCRIPT.

**API mapping:**
- `redis.script LOAD` -> `script := redis.NewScript(source); script.Load(ctx, rdb)`.
- `redis.evalsha` -> `script.Run(ctx, rdb, keys, args...)` tự fallback EVAL.

**Differences / gotchas:**
- `Run` auto-handle NOSCRIPT internal — không cần catch manually.
- Result return `interface{}` — cast về `[]interface{}` rồi từng element về int64.
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
**Thư viện chính:** **`StringRedisTemplate`** + **`DefaultRedisScript`** — Spring auto cache sha + fallback NOSCRIPT.

**API mapping:**
- `redis.script LOAD` -> `new DefaultRedisScript<>(source, List.class)`.
- `redis.evalsha` -> `redisTemplate.execute(script, keys, args)`.

**Differences / gotchas:**
- Spring redis tự handle NOSCRIPT — không cần catch.
- Return type phải match script return: `List.class` cho array, generics convert tự động.
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
Tích hợp Guard + identity resolution + per-route decorator
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Các bước thực hiện
- **Bước 1:** Tạo decorator `@RateLimit({ limit, windowMs })` lưu metadata qua `SetMetadata('rate-limit', opts)`.
- **Bước 2:** Tạo `RateLimitGuard` implement `CanActivate`: đọc metadata qua `Reflector`, resolve identity (user.id > X-Forwarded-For[0] > req.ip), build key `limit:{routeKey}:{identity}`, gọi `LimiterService.check`.
- **Bước 3:** Khi `allowed=0` throw `HttpException('Too Many Requests', 429)` với body `{ statusCode: 429, message, retryAfter }`.
- **Bước 4:** Apply guard global qua `APP_GUARD` provider; default `100 req / 60s` khi route không có decorator.

### 2. Yêu cầu tối thiểu cần đạt
- Identity resolution không null/undefined trên mọi request (test với + không có header auth).
- Per-route config override default thành công, verified bằng request 1 endpoint 200 vẫn allow trong khi endpoint khác đã block.
- Block trả HTTP 429 với body chuẩn.

### 3. Nice to have
- IPv6 hash bằng sha256 cho key < 64 byte.
- Hỗ trợ skip rate limit qua decorator `@SkipRateLimit()`.

### codeImplementations
#### 0
##### lang
typescript
##### guide
**Thư viện chính:** **`@nestjs/core`** Reflector + custom Guard pattern, `SetMetadata` cho per-route config.

**Mapping API:**
- `Reflector.get(metadataKey, ctx.getHandler())` -> đọc per-route config.
- `context.switchToHttp().getRequest()` -> Express/Fastify request lấy IP + user.

**Khác biệt/gotcha:**
- `Reflector.getAllAndOverride([handler, class])` cho handler override class-level.
- `X-Forwarded-For` có thể chứa nhiều IP — lấy IP đầu tiên (client IP).
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
**Thư viện chính:** **`Microsoft.AspNetCore.Mvc.Filters`** — `IAsyncActionFilter` thay thế Nest Guard.

**API mapping:**
- Nest `@RateLimit` -> custom attribute `[RateLimit(Limit=100, WindowMs=60000)]`.
- `Reflector` -> `context.ActionDescriptor.EndpointMetadata.OfType<RateLimitAttribute>()`.

**Differences / gotchas:**
- ASP.NET filters chạy sau auth — `HttpContext.User.Identity.Name` cho identity.
- Throw `RateLimitExceededException` rồi handle qua middleware.
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
**Thư viện chính:** **`gin`** middleware pattern + struct config per-route.

**API mapping:**
- Per-route decorator -> middleware closure `RateLimit(limit, window)` apply qua `router.GET("/path", RateLimit(50, time.Minute), handler)`.
- Identity -> `c.Request.Header.Get("X-Forwarded-For")` fallback `c.ClientIP()`.

**Differences / gotchas:**
- Gin không có Reflector — config inject qua closure capture.
- Block bằng `c.AbortWithStatusJSON(429, gin.H{...})`.
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
**Thư viện chính:** **Spring `HandlerInterceptor`** + custom `@RateLimit` annotation reflected ở `preHandle`.

**API mapping:**
- Nest `@RateLimit` -> `@Target(ElementType.METHOD) @Retention(RUNTIME) @interface RateLimit { ... }`.
- Reflector -> `HandlerMethod.getMethodAnnotation(RateLimit.class)`.

**Differences / gotchas:**
- `preHandle` return false để block + set status 429.
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
Gắn header X-RateLimit và Retry-After
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Các bước thực hiện
- **Bước 1:** Sau khi guard chạy `limiter.check`, lưu `{remaining, oldestScore, limit, windowMs}` vào `request.rateLimit` để interceptor sau đọc.
- **Bước 2:** Tạo `RateLimitInterceptor` (after guard) set header lên response: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` (= `floor((oldestScore + windowMs) / 1000)`).
- **Bước 3:** Khi block (throw exception path), trong `ExceptionFilter` cũng set 3 header trên + `Retry-After` = `ceil((oldestScore + windowMs - now) / 1000)`.
- **Bước 4:** Verify bằng `curl -i http://localhost:3000/api/foo` thấy đủ header ở cả 200 và 429.

### 2. Yêu cầu tối thiểu cần đạt
- 200 response có 3 header `X-RateLimit-*` đầy đủ, giá trị `Remaining` giảm dần đúng.
- 429 response có thêm `Retry-After` (giây), giá trị > 0.
- `X-RateLimit-Reset` là UNIX timestamp giây, không phải ms.

### 3. Nice to have
- Header `X-RateLimit-Policy: "100;w=60"` chuẩn IETF draft.
- Logging response header để debug.
<!-- @starci/seperator -->
## 3
### title
<!-- @starci/seperator -->
Benchmark 3 scenario với k6 và capture evidence
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Các bước thực hiện
- **Bước 1:** Cài `k6` (https://k6.io/docs/get-started/installation/) và start app + Redis.
- **Bước 2:** Viết 3 script `bench/below.js`, `bench/at.js`, `bench/above.js` với target 50/100/300 req/60s, 50 VU.
  ```javascript
  // bench/above.js
  import http from 'k6/http';
  export const options = { vus: 50, duration: '60s', rps: 300 };
  export default function () { http.get('http://localhost:3000/api/foo'); }
  ```
- **Bước 3:** Chạy từng script và lưu raw JSON.
  ```bash
  k6 run --out json=evidence/k6-below.json bench/below.js
  k6 run --out json=evidence/k6-at.json bench/at.js
  k6 run --out json=evidence/k6-above.json bench/above.js
  ```
- **Bước 4:** Parse JSON, build bảng p50/p95/p99 + ratio 200/429 cho từng scenario, paste vào README section `Smoke Test`.

### 2. Yêu cầu tối thiểu cần đạt
- 3 file JSON `evidence/k6-*.json` commit vào repo, là raw output `k6` (không paraphrase).
- Bảng p50/p95/p99 trong README số khớp 1:1 với JSON.
- Scenario "above limit" cho thấy ratio 429/total ≈ 67% ±5%.

### 3. Nice to have
- Thêm script `bench/plot.py` parse JSON → plot histogram PNG commit vào evidence.
- Threshold k6 `thresholds: { 'http_req_duration{status:200}': ['p(95)<10'] }` fail build nếu p95 vượt.
<!-- @starci/seperator -->
## 4
### title
<!-- @starci/seperator -->
Audit log JSON cho block events
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Các bước thực hiện
- **Bước 1:** Cài `pino` và config JSON formatter trong `main.ts`.
- **Bước 2:** Trong `ExceptionFilter` xử lý 429, log line JSON với fields `{ timestamp, identity, route, limit, window_ms, remaining, retry_after_sec }`.
- **Bước 3:** Pipe stdout → `logs/rate-limit-blocks.jsonl` qua process manager (PM2, systemd hoặc dev script).
- **Bước 4:** Trigger ≥10 block bằng `k6` "above limit" để có sample log; copy 10 dòng raw vào README.

### 2. Yêu cầu tối thiểu cần đạt
- Mỗi 429 emit đúng 1 JSON line đủ 7 field.
- File `logs/rate-limit-blocks.jsonl` chứa ≥10 dòng từ run benchmark.
- README paste ≥10 dòng raw log mẫu (không sửa).

### 3. Nice to have
- Ship log tới Loki/CloudWatch qua transport.
- Thêm correlation ID per request để trace toàn flow.

### codeImplementations
#### 0
##### lang
typescript
##### guide
**Thư viện chính:** **`pino`** + **`nestjs-pino`** — JSON structured logging chuẩn, format strict không paraphrase.

**Mapping API:**
- `console.log({...})` -> `logger.warn({ ... }, "rate_limit_block")`.
- File transport -> pipe stdout hoặc `pino-pretty | tee logs/...`.

**Khác biệt/gotcha:**
- `pino` mặc định output JSON một dòng — không cần custom format.
- Strict field name để downstream parser khớp.
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
**Thư viện chính:** **`Serilog`** + `WriteTo.File(formatter: new JsonFormatter())` — JSON structured logging trong ASP.NET.

**API mapping:**
- `Logger.warn(obj)` -> `_logger.LogWarning("{@Block}", blockObj)`.
- File transport -> `Log.Logger = new LoggerConfiguration().WriteTo.File(new JsonFormatter(), "logs/rate-limit.jsonl")`.

**Differences / gotchas:**
- `{@}` destructure operator giữ object property names.
- `JsonFormatter` từ `Serilog.Formatting.Json`.
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
**Thư viện chính:** **`zerolog`** — JSON structured logging fast native.

**API mapping:**
- `logger.warn(obj)` -> `log.Warn().Str(...).Int(...).Msg("rate_limit_block")`.
- File transport -> `log.Logger = zerolog.New(os.Stdout)` + pipe shell.

**Differences / gotchas:**
- Fluent API — chain `Str/Int/Msg` per field.
- Default `zerolog` already JSON.
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
**Thư viện chính:** **`logback-classic`** + **`logstash-logback-encoder`** — JSON encoder cho Logback.

**API mapping:**
- `logger.warn(obj)` -> `log.warn(StructuredArguments.kv("identity", ...), ...)`.
- File transport -> `<appender class="ch.qos.logback.core.FileAppender">` + JSON encoder.

**Differences / gotchas:**
- Phải config `logback.xml` với `LogstashEncoder`.
- `StructuredArguments` từ logstash-logback giúp tránh string concat.
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
Viết README evidence-grade và chốt design decision
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
### 1. Các bước thực hiện
- **Bước 1:** Viết README đủ 6 section: Challenge description, How to run, Architecture/Stack (Mermaid ZSET + Lua + Guard + Interceptor), Smoke Test (paste raw `curl -i` 200 + 429 + bảng p50/p95/p99 + 10 dòng raw JSON log), Code Execution Trace (≥3 điểm chạm), Design Decisions.
- **Bước 2:** Trong Smoke Test, paste raw `curl -i` thật:
  ```bash
  curl -i http://localhost:3000/api/foo
  curl -i http://localhost:3000/api/foo  # thực hiện đến khi block
  ```
- **Bước 3:** Design Decisions chốt 1 quyết định concurrency thật với trade-off số: vì sao chọn ZSET log (memory ~8KB/window/identity, accuracy 100%) so với token bucket counter (memory 16B/identity, accuracy 95%).
- **Bước 4:** Code Execution Trace nêu rõ `src/limiter/limiter.guard.ts:25 -> RateLimitGuard.canActivate` → `src/limiter/limiter.service.ts:42 -> LimiterService.check` → `src/limiter/rate-limit.interceptor.ts:18 -> RateLimitInterceptor.intercept`.

### 2. Yêu cầu tối thiểu cần đạt
- README đủ 6 section với raw output thật cho cả 200 và 429.
- Design Decisions có số (memory, latency, accuracy), không vague "chọn vì performance tốt".
- Code Execution Trace ≥3 điểm chạm `file:line -> method()` thật.

### 3. Nice to have
- Bảng so sánh sliding window vs token bucket vs fixed window 3 cột (memory, accuracy, complexity).
- Diagram time-series 200/429 throughput từ k6.
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
Repo public chứa source NestJS + Lua script + `docker-compose.yml` Redis + folder `bench/` chứa 3 k6 script + folder `evidence/` chứa 3 file `k6-*.json` raw + folder `logs/` chứa `rate-limit-blocks.jsonl` + README đủ 6 section (Challenge description, How to run, Architecture/Stack với Mermaid, Smoke Test với raw `curl -i` cho 200/429 + bảng p50/p95/p99 + 10 dòng raw log JSON, Code Execution Trace ≥3 điểm chạm, Design Decisions với số liệu memory/latency/accuracy).
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
