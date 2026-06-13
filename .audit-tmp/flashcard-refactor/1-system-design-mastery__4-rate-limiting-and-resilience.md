# 1-system-design-mastery / 4-rate-limiting-and-resilience
Summary: kept 9, delete 0 of 9

## 0-card — senior — [RateLimit]
**Question:** Token bucket vs sliding window counter for rate limiting — when does token bucket allow a burst that violates your intended rate, and when does sliding window give a false rejection?
**Verdict:** KEEP — open-ended algorithm trade-off with concrete failure analysis; scales with seniority and invites follow-ups.

### New answer (en)
**TL;DR** — Token bucket violates the intended rate when an idle client drains a full bucket all at once (capacity, not refill rate, sets the burst size); sliding window counter falsely rejects at the window boundary because it weights the previous window's count into the current one.

**How it works** — Token bucket configured at 100 req/min with capacity 100: a client idle for a minute holds a full bucket and can fire all 100 requests in the first second — 100 RPS despite a "100/minute" limit. Burst size is governed by bucket capacity, refill smooths the steady state. Sliding window counter approximates the last N seconds by blending two fixed windows: a client that sent 90 at T-59s and 10 at T-1s reads as 100 in the trailing minute, so a request at T is rejected even though only 10 landed in the last second.

:::muted
**Trade-off** — Token bucket favours bursty clients (mobile/batch APIs); leaky bucket enforces a strict smooth output rate with zero burst tolerance. Sliding window log is exact but stores a timestamp per request (O(N) memory); the counter variant stores two integers but keeps the boundary error.
:::

:::muted
**Common pitfall** — Sharing one counter across a whole API-key tier (e.g. "free tier"): a single heavy user drains the shared quota and starves everyone else. Always limit per-entity (per user_id / per key), never per tier globally.
:::

*Go deeper — how would you make the sliding window counter boundary error provably bounded, and what is the worst-case overshoot?*

**Keywords** — `token bucket · leaky bucket · sliding window counter · sliding window log · bucket capacity vs refill rate · per-entity limit`

### New answer (vi)
**Chốt** — Token bucket vi phạm rate dự định khi một client nhàn rỗi xả sạch một bucket đầy cùng lúc (capacity, không phải refill rate, quyết định kích thước burst); sliding window counter từ chối sai tại ranh giới window vì nó trộn count của window trước vào window hiện tại.

**Cơ chế** — Token bucket cấu hình 100 req/phút với capacity 100: client nhàn rỗi một phút có bucket đầy và bắn cả 100 request trong giây đầu — 100 RPS dù giới hạn ghi "100/phút". Kích thước burst do bucket capacity quyết định, refill chỉ làm mượt trạng thái ổn định. Sliding window counter xấp xỉ N giây gần nhất bằng cách pha trộn hai window cố định: client gửi 90 ở T-59s và 10 ở T-1s được đọc thành 100 trong phút trôi qua, nên request tại T bị từ chối dù chỉ 10 cái xảy ra trong giây vừa rồi.

:::muted
**Trade-off** — Token bucket ưu ái client bursty (mobile/batch API); leaky bucket ép output rate mượt nghiêm ngặt, không dung sai burst. Sliding window log chính xác nhưng lưu timestamp mỗi request (O(N) memory); biến thể counter chỉ lưu hai số nguyên nhưng vẫn giữ lỗi ranh giới.
:::

:::muted
**Bẫy thường gặp** — Dùng chung một counter cho cả một API-key tier (ví dụ "free tier"): một user nặng xả hết shared quota và bỏ đói tất cả user còn lại. Luôn giới hạn per-entity (per user_id / per key), không bao giờ per tier toàn cục.
:::

*Đào sâu tiếp — làm sao để chứng minh được lỗi ranh giới của sliding window counter bị chặn trên, và overshoot tệ nhất là bao nhiêu?*

**Từ khoá ăn điểm** — `token bucket · leaky bucket · sliding window counter · sliding window log · bucket capacity vs refill rate · per-entity limit`

## 1-card — senior — [RateLimit, Distributed]
**Question:** How do you implement a distributed rate limiter that is both accurate and low-latency across multiple stateless API servers?
**Verdict:** KEEP — design question balancing accuracy vs latency with a real race-condition diagnosis; clearly senior.

### New answer (en)
**TL;DR** — Centralise the counter in Redis and make each check atomic with a Lua script (one round-trip per request); for extreme throughput, fall back to per-pod local buckets that sync periodically, trading a little accuracy for latency.

**How it works** — The canonical implementation is a Lua script that `INCR user:{id}:minute:{bucket}`, sets the TTL only when the result is 1 (so INCR and EXPIRE can't race), and rejects when the count exceeds the limit — all in a single Redis round-trip. That is the sliding window counter. For an exact sliding window log, use a sorted set: `ZADD` with timestamps then `ZREMRANGEBYSCORE` to evict old entries — accurate but O(requests) memory per client.

:::muted
**Trade-off** — Central Redis adds ~1 ms per request; above ~500k RPS that matters, so use local token buckets per pod with periodic sync (accepting slight over-counting during the sync window). HA needs Redis Cluster/Sentinel — and you must consciously decide fail-open (limits stop, traffic flows) vs fail-closed (block everything) on a Redis outage.
:::

:::muted
**Common pitfall** — A read-then-write counter without atomicity: two pods both read 99, both write 100, both pass — the limit is breached. Use INCR's atomic return value or a Lua script; read-then-write is never safe in a distributed context.
:::

*Go deeper — on a Redis outage, would you fail open or fail closed for a public API versus a payments API, and why?*

**Keywords** — `Redis · Lua atomic · INCR + TTL · sliding window counter · ZADD/ZREMRANGEBYSCORE · fail-open vs fail-closed`

### New answer (vi)
**Chốt** — Tập trung counter ở Redis và làm mỗi lần kiểm tra atomic bằng Lua script (một round-trip mỗi request); với throughput cực cao, lùi về local bucket per-pod sync định kỳ, đổi một chút chính xác lấy latency.

**Cơ chế** — Implementation chuẩn là Lua script `INCR user:{id}:minute:{bucket}`, chỉ set TTL khi result == 1 (để INCR và EXPIRE không race), và reject khi count vượt limit — tất cả trong một round-trip Redis. Đó là sliding window counter. Muốn sliding window log chính xác, dùng sorted set: `ZADD` với timestamp rồi `ZREMRANGEBYSCORE` để loại bản ghi cũ — chính xác nhưng O(request) memory mỗi client.

:::muted
**Trade-off** — Redis tập trung thêm ~1 ms mỗi request; trên ~500k RPS điều đó đáng kể, nên dùng local token bucket per-pod sync định kỳ (chấp nhận over-counting nhỏ trong cửa sổ sync). HA cần Redis Cluster/Sentinel — và phải chủ động chọn fail-open (limit ngừng, traffic chảy) hay fail-closed (chặn hết) khi Redis sập.
:::

:::muted
**Bẫy thường gặp** — Counter read-then-write không atomic: hai pod cùng đọc 99, cùng ghi 100, cùng pass — limit bị vượt. Dùng giá trị trả về atomic của INCR hoặc Lua script; read-then-write không bao giờ an toàn trong môi trường phân tán.
:::

*Đào sâu tiếp — khi Redis sập, bạn fail open hay fail closed cho một public API so với một payments API, và vì sao?*

**Từ khoá ăn điểm** — `Redis · Lua atomic · INCR + TTL · sliding window counter · ZADD/ZREMRANGEBYSCORE · fail-open vs fail-closed`

## 2-card — senior — [Distributed]
**Question:** A circuit breaker is in "open" state. Explain the full state machine, what triggers each transition, and what happens to in-flight requests during the "half-open" probe.
**Verdict:** KEEP — classic resilience state-machine question with transition reasoning and a fallback-design follow-up.

### New answer (en)
**TL;DR** — Three states — Closed (traffic flows, failures counted), Open (fail fast with a fallback, no network call), Half-open (a few probes are let through) — with transitions driven by an error-rate threshold, a cool-down timeout, and probe success/failure.

**How it works** — In **Closed**, every request passes and the failure counter tracks the recent error rate; crossing the threshold (e.g. 50% over 10s) flips to **Open**. In **Open**, requests fail fast and return a fallback immediately; after a cool-down (e.g. 30s) it moves to **Half-open**. In **Half-open**, a limited number of probe requests are allowed: enough successes close the breaker, any failure reopens it and resets the timeout. Requests arriving after the probe quota is used are still rejected with the fallback.

:::muted
**Trade-off** — Breakers stop cascading failure by shedding load off a sick dependency, but the first post-probe requests may hit a still-recovering service — Resilience4j/Hystrix let you require N consecutive successes before fully closing. Too aggressive a threshold trips on a normal latency spike and causes needless failures.
:::

:::muted
**Common pitfall** — Opening the circuit with no fallback, so the caller just returns 500 to the user — you protected the downstream but broke the UX. Design degraded responses: cached data, a "temporarily unavailable" message, or reduced functionality.
:::

*Go deeper — how do you choose the error-rate window and probe count so a breaker reacts fast but doesn't flap during noisy traffic?*

**Keywords** — `Closed/Open/Half-open · error-rate threshold · cool-down timeout · probe request · fallback · Resilience4j/Hystrix`

### New answer (vi)
**Chốt** — Ba trạng thái — Closed (traffic chảy, đếm lỗi), Open (fail fast với fallback, không gọi network), Half-open (cho vài probe đi qua) — chuyển trạng thái dựa trên ngưỡng error-rate, timeout cool-down, và kết quả probe.

**Cơ chế** — Ở **Closed**, mọi request đi qua và failure counter theo dõi error rate gần đây; vượt ngưỡng (ví dụ 50% trong 10s) chuyển sang **Open**. Ở **Open**, request fail fast và trả fallback ngay; sau cool-down (ví dụ 30s) chuyển sang **Half-open**. Ở **Half-open**, một số lượng probe giới hạn được cho qua: đủ success thì đóng breaker, bất kỳ failure nào cũng mở lại và reset timeout. Request đến sau khi hết quota probe vẫn bị reject với fallback.

:::muted
**Trade-off** — Breaker chặn cascading failure bằng cách shed load khỏi dependency đang ốm, nhưng những request đầu sau probe có thể trúng service mới phục hồi một phần — Resilience4j/Hystrix cho phép yêu cầu N success liên tiếp trước khi đóng hẳn. Ngưỡng quá aggressive trip khi chỉ có latency spike bình thường, gây failure vô ích.
:::

:::muted
**Bẫy thường gặp** — Mở circuit mà không có fallback, caller chỉ trả 500 cho người dùng — bạn bảo vệ downstream nhưng phá UX. Thiết kế degraded response: cached data, message "tạm thời không khả dụng", hoặc giảm tính năng.
:::

*Đào sâu tiếp — chọn cửa sổ error-rate và số probe thế nào để breaker phản ứng nhanh mà không flap khi traffic nhiễu?*

**Từ khoá ăn điểm** — `Closed/Open/Half-open · error-rate threshold · cool-down timeout · probe request · fallback · Resilience4j/Hystrix`

## 3-card — senior — [Distributed]
**Question:** You add retries to a microservice call. Under a partial outage, retries make the system worse instead of better. Explain why and what must accompany retries to prevent amplification.
**Verdict:** KEEP — diagnosis of retry amplification plus the mandatory mitigations; strong senior question with a layered-retry follow-up.

### New answer (en)
**TL;DR** — Naive retries multiply load exactly when a service is already struggling, turning a partial outage into a full one; safe retries need exponential backoff, jitter, a retry budget, and idempotency on writes.

**How it works** — If a service takes 1000 RPS with 30% failing and you add 3 retries, it can receive up to 1000 + 700×3 = 3100 RPS — a 3× amplification on the worst-hit path. The mitigations: (1) **exponential backoff** doubles the wait each attempt (100→200→400 ms) to spread retries over time; (2) **jitter** randomises the wait so retrying clients don't all fire at once after backoff expires (thundering herd); (3) a **retry budget** caps total attempts and the global per-service retry rate.

:::muted
**Trade-off** — Backoff adds latency the user feels, so for synchronous user-facing calls cap the total retry window to your SLO (e.g. 3 retries within 2s); async jobs can back off for minutes. Retrying non-idempotent operations (POST /orders) can duplicate mutations — always pair with idempotency keys.
:::

:::muted
**Common pitfall** — Retrying at every layer (client → gateway → mesh → service): 3 retries per layer over 4 layers is 3^4 = 81 backend requests from one user click. Coordinate a retry budget — typically only the outermost caller retries; inner hops fast-fail.
:::

*Go deeper — how do you implement a shared retry budget across services so inner layers know the outer client has already burned the budget?*

**Keywords** — `retry amplification · exponential backoff · jitter · retry budget · thundering herd · idempotency key`

### New answer (vi)
**Chốt** — Retry ngây thơ nhân tải đúng lúc service đang đuối, biến partial outage thành full outage; retry an toàn cần exponential backoff, jitter, retry budget, và idempotency trên write.

**Cơ chế** — Nếu service nhận 1000 RPS với 30% fail và bạn thêm 3 retry, nó có thể nhận đến 1000 + 700×3 = 3100 RPS — khuếch đại 3× trên đường bị ảnh hưởng nặng nhất. Các biện pháp: (1) **exponential backoff** nhân đôi thời gian chờ mỗi lần (100→200→400 ms) để phân tán retry theo thời gian; (2) **jitter** ngẫu nhiên hóa thời gian chờ để các client retry không bắn cùng lúc sau khi backoff hết (thundering herd); (3) **retry budget** giới hạn tổng số lần và global retry rate per-service.

:::muted
**Trade-off** — Backoff thêm latency người dùng cảm nhận, nên với synchronous call user-facing hãy cap tổng retry window theo SLO (ví dụ 3 retry trong 2s); job async có thể backoff hàng phút. Retry trên operation non-idempotent (POST /orders) có thể nhân đôi mutation — luôn pair với idempotency key.
:::

:::muted
**Bẫy thường gặp** — Retry ở mọi layer (client → gateway → mesh → service): 3 retry mỗi layer qua 4 layer là 3^4 = 81 request backend từ một cú click. Phối hợp một retry budget — thường chỉ caller ngoài cùng retry; các hop bên trong fast-fail.
:::

*Đào sâu tiếp — làm sao implement một retry budget dùng chung giữa các service để layer bên trong biết client ngoài đã tiêu hết budget?*

**Từ khoá ăn điểm** — `retry amplification · exponential backoff · jitter · retry budget · thundering herd · idempotency key`

## 4-card — senior — [Distributed]
**Question:** Explain the bulkhead pattern. Give a concrete example of how NOT using bulkheads causes a slow database query to take down an entire service.
**Verdict:** KEEP — pattern explanation grounded in a concrete cascading-failure scenario; clear senior depth.

### New answer (en)
**TL;DR** — Bulkheads give each downstream dependency its own isolated pool (threads/connections/semaphore) so a slowdown in one can't starve the others; without them one slow query category exhausts the shared pool and every endpoint appears down.

**How it works** — Without bulkheads, a service shares one 200-thread pool across all calls. Slow analytics reads holding threads ~30s each: 200 concurrent analytics queries occupy all 200 threads, so payments, user lookups, and health checks all queue behind them — the whole service looks down because of one query type. With bulkheads, analytics gets its own 20 threads, payments 50, user queries 50, health checks 5 — an analytics stall only blocks its own 20 threads; everything else stays healthy.

:::muted
**Trade-off** — Partitioning caps per-endpoint peak throughput (you can't lend the idle analytics pool to payments) and requires sizing each pool from known traffic/failure patterns; under-sizing a critical pool still causes partial failures. JVM thread-pool bulkheads add ~0.1 ms context-switch overhead; semaphore bulkheads avoid that but don't isolate blocking I/O.
:::

:::muted
**Common pitfall** — Isolating thread pools but sharing one DB connection pool: a slow analytics query holds connections and starves payments anyway — the connection pool becomes the shared resource that bypasses the bulkhead. Each category needs its own connection pool too.
:::

*Go deeper — how do you size each bulkhead pool, and how do you detect when a pool is chronically saturated versus briefly spiking?*

**Keywords** — `bulkhead · resource isolation · thread pool · connection pool · semaphore · cascading failure`

### New answer (vi)
**Chốt** — Bulkhead cho mỗi downstream dependency một pool cô lập riêng (thread/connection/semaphore) để slowdown ở một cái không bỏ đói cái khác; thiếu nó, một loại query chậm xả hết shared pool và mọi endpoint trông như down.

**Cơ chế** — Không có bulkhead, service dùng chung một pool 200 thread cho mọi call. Analytics read chậm giữ thread ~30s mỗi cái: 200 query analytics đồng thời chiếm cả 200 thread, nên payment, user lookup và health check đều xếp hàng phía sau — cả service trông như down vì một loại query. Có bulkhead, analytics có riêng 20 thread, payment 50, user query 50, health check 5 — analytics kẹt chỉ block 20 thread của nó; phần còn lại vẫn khỏe.

:::muted
**Trade-off** — Phân vùng cap peak throughput per-endpoint (không thể cho payment mượn analytics pool đang rảnh) và đòi sizing mỗi pool từ traffic/failure pattern đã biết; under-size một pool quan trọng vẫn gây partial failure. Bulkhead thread-pool trên JVM thêm ~0.1 ms overhead context-switch; bulkhead semaphore tránh điều đó nhưng không cô lập blocking I/O.
:::

:::muted
**Bẫy thường gặp** — Cô lập thread pool nhưng dùng chung một DB connection pool: query analytics chậm giữ connection và vẫn bỏ đói payment — connection pool trở thành shared resource vượt qua bulkhead. Mỗi category cũng cần connection pool riêng.
:::

*Đào sâu tiếp — bạn sizing mỗi bulkhead pool thế nào, và phát hiện ra sao khi một pool bão hòa kinh niên so với chỉ spike ngắn?*

**Từ khoá ăn điểm** — `bulkhead · resource isolation · thread pool · connection pool · semaphore · cascading failure`

## 5-card — senior — [Distributed, RateLimit]
**Question:** What is idempotency in the context of API design, and why is it critical for financial operations specifically? How do you design an idempotent payment endpoint?
**Verdict:** KEEP — concept plus concrete endpoint design with durability and atomicity reasoning; strong senior question.

### New answer (en)
**TL;DR** — An idempotent operation yields the same result however many times it runs; it's critical for payments because a retried POST can charge a customer twice. Design it with a client-generated `Idempotency-Key` and a durable dedup store written atomically with the charge.

**How it works** — GET/PUT/DELETE are inherently idempotent; POST is not, so payments need an explicit key. The client sends `Idempotency-Key: <uuid>`; the server (1) looks the key up in a dedup store, (2) if it's still processing, returns 202/200 with the in-flight status, (3) if completed, returns the original response, (4) if absent, processes the request and stores the response together with the key atomically before returning.

:::muted
**Trade-off** — The dedup store must be durable — Redis alone risks duplicate charges if it flushes, so use a DB table for financial-grade idempotency. Key TTL (e.g. 24h) balances safety (too short evicts a key before the retry window closes) against storage. The charge and key write must be one atomic transaction, or you can charge without recording the key.
:::

:::muted
**Common pitfall** — Deriving the key from user_id + amount instead of a per-intent UUID: two legitimate same-amount purchases by one user collide on the key and one is silently dropped. The key must be a client-generated UUID per request intent.
:::

*Go deeper — how do you make "charge the gateway" and "store the idempotency record" atomic when they live in two different systems?*

**Keywords** — `idempotency · Idempotency-Key · UUID per intent · dedup store · durable (DB) vs Redis · atomic store-with-response`

### New answer (vi)
**Chốt** — Operation idempotent cho cùng kết quả dù chạy bao nhiêu lần; nó tối quan trọng với payment vì một POST bị retry có thể charge khách hai lần. Thiết kế bằng `Idempotency-Key` do client sinh và một dedup store bền được ghi atomic cùng lần charge.

**Cơ chế** — GET/PUT/DELETE tự nhiên idempotent; POST thì không, nên payment cần key tường minh. Client gửi `Idempotency-Key: <uuid>`; server (1) tra key trong dedup store, (2) nếu vẫn đang xử lý, trả 202/200 với trạng thái in-flight, (3) nếu đã hoàn thành, trả original response, (4) nếu chưa có, xử lý request và lưu response cùng key một cách atomic trước khi trả.

:::muted
**Trade-off** — Dedup store phải bền — chỉ Redis có nguy cơ duplicate charge nếu nó flush, nên dùng DB table cho idempotency cấp tài chính. TTL key (ví dụ 24h) cân bằng safety (quá ngắn evict key trước khi retry window đóng) với storage. Lần charge và việc ghi key phải nằm trong một transaction atomic, nếu không bạn có thể charge mà không ghi key.
:::

:::muted
**Bẫy thường gặp** — Suy key từ user_id + amount thay vì UUID per-intent: hai lần mua hợp lệ cùng amount của một user trùng key và một cái bị drop im lặng. Key phải là UUID do client sinh theo từng request intent.
:::

*Đào sâu tiếp — làm sao để "charge gateway" và "lưu bản ghi idempotency" atomic khi chúng nằm ở hai hệ thống khác nhau?*

**Từ khoá ăn điểm** — `idempotency · Idempotency-Key · UUID per intent · dedup store · durable (DB) vs Redis · atomic store-with-response`

## 6-card — staff — [RateLimit, Distributed]
**Question:** Your API needs to rate-limit per user but also protect the backend with a global request cap. How do you architect two-level rate limiting without race conditions or excessive Redis round-trips?
**Verdict:** KEEP — staff-level architecture question layering local + global limits with fallback design; genuinely deep.

### New answer (en)
**TL;DR** — Run a cheap local per-user token bucket in each pod to absorb the common case, then make a single atomic Redis check for the global cap only after the local check passes — keeping it to at most one round-trip per allowed request.

**How it works** — (1) **Per-user local bucket**: an in-process token bucket on each pod refilling at the user's rate adds zero latency and handles the typical "user is under limit" case, accepting slight cross-pod over-counting. (2) **Global Redis check**: once the local check passes, atomically `INCR` a global per-service counter via Lua and reject if the cap is exceeded — one round-trip, only on requests that survive the local gate. For an exact per-user limit, move per-user to Redis too but batch the counter update every N requests to cut round-trips.

:::muted
**Trade-off** — Local per-user buckets across M pods allow up to M× over-counting in the worst case (every pod thinks the user is under limit at once). That's fine for most APIs — rate limits are soft guarantees, not security boundaries — but for billing/payment use exact Redis per-user counting even at ~1 ms per request.
:::

:::muted
**Common pitfall** — A synchronous global Redis limiter in the hot path with no fallback: one network blip fails every request (fail-closed). Fall back to conservative per-pod local limiting when Redis is unreachable, and raise the Redis failure as a critical alert.
:::

*Go deeper — when you fall back to per-pod local limiting on a Redis outage, how do you keep the aggregate global cap roughly intact across all pods?*

**Keywords** — `two-level limiting · local token bucket · global Redis counter · Lua atomic · over-counting · fail-open fallback`

### New answer (vi)
**Chốt** — Chạy một local per-user token bucket rẻ trong mỗi pod để hấp thụ common case, rồi chỉ làm một Redis check atomic cho global cap sau khi local check pass — giữ tối đa một round-trip mỗi request được cho qua.

**Cơ chế** — (1) **Per-user local bucket**: token bucket in-process trên mỗi pod refill theo rate của user, thêm zero latency và xử lý case điển hình "user dưới limit", chấp nhận over-counting nhỏ giữa các pod. (2) **Global Redis check**: khi local check pass, atomic `INCR` một global counter per-service qua Lua và reject nếu vượt cap — một round-trip, chỉ trên request vượt qua cổng local. Muốn per-user limit chính xác, đưa per-user lên Redis nhưng batch update counter mỗi N request để giảm round-trip.

:::muted
**Trade-off** — Local per-user bucket qua M pod cho phép over-counting đến M× trong worst case (mọi pod cùng nghĩ user dưới limit). Ổn với hầu hết API — rate limit là soft guarantee, không phải security boundary — nhưng với billing/payment hãy dùng Redis per-user exact ngay cả với ~1 ms mỗi request.
:::

:::muted
**Bẫy thường gặp** — Một global Redis limiter synchronous trong hot path không có fallback: một network blip làm fail mọi request (fail-closed). Fall back sang local limiting per-pod với cap thận trọng khi Redis không tới được, và báo Redis failure như critical alert.
:::

*Đào sâu tiếp — khi fall back sang local limiting per-pod lúc Redis sập, làm sao giữ global cap tổng hợp gần như nguyên vẹn qua tất cả pod?*

**Từ khoá ăn điểm** — `two-level limiting · local token bucket · global Redis counter · Lua atomic · over-counting · fail-open fallback`

## 7-card — senior — [Distributed]
**Question:** Timeout strategies: how do you set read timeouts, connection timeouts, and per-request deadlines in a microservice call chain to prevent timeout budget exhaustion?
**Verdict:** KEEP — distinguishes timeout types and motivates deadline propagation; clear senior reasoning with a follow-up.

### New answer (en)
**TL;DR** — Separate connection timeout from read timeout, make every downstream hop's timeout smaller than its caller's, and propagate an absolute deadline so the whole chain is capped at the user's SLO rather than the sum of per-hop timeouts.

**How it works** — A **connection timeout** (time to establish the TCP connection, ~500 ms–2 s) is distinct from a **read timeout** (time to wait for a response byte, set to the downstream p99). In a chain A→B→C→D each hop's timeout must be tighter than the upstream's. Propagate a **deadline** (absolute timestamp) via a gRPC deadline or `Request-Deadline` header; each service computes `remaining = deadline - now` and fails fast if it's below a floor (e.g. 100 ms), avoiding "wasted work" where D finishes after the upstream already gave up.

:::muted
**Trade-off** — Too-short timeouts discard slow-but-correct responses (false failures); too-long timeouts let slow calls pin threads/connections and cause head-of-line blocking. Rule of thumb: set the read timeout to ~3× the downstream's normal p99, not the p50.
:::

:::muted
**Common pitfall** — Not propagating the deadline, so each of 5 hops independently runs a 2 s timeout: a user can wait up to 10 s before the origin gives up. Deadline propagation caps total wall-clock time for the whole chain at the user's SLO.
:::

*Go deeper — how do you set per-hop timeouts so the chain reliably finishes within the user SLO even when one hop is at its p99?*

**Keywords** — `connection vs read timeout · deadline propagation · gRPC deadline · remaining budget · head-of-line blocking · p99 not p50`

### New answer (vi)
**Chốt** — Tách connection timeout khỏi read timeout, làm timeout của mỗi hop downstream nhỏ hơn của caller, và propagate một absolute deadline để cả chain bị cap theo SLO của user thay vì tổng các timeout per-hop.

**Cơ chế** — **Connection timeout** (thời gian thiết lập TCP connection, ~500 ms–2 s) khác với **read timeout** (thời gian chờ response byte, set theo p99 của downstream). Trong chain A→B→C→D, timeout mỗi hop phải chặt hơn upstream. Propagate một **deadline** (absolute timestamp) qua gRPC deadline hoặc header `Request-Deadline`; mỗi service tính `remaining = deadline - now` và fail fast nếu dưới ngưỡng sàn (ví dụ 100 ms), tránh "wasted work" khi D hoàn thành sau khi upstream đã bỏ cuộc.

:::muted
**Trade-off** — Timeout quá ngắn loại bỏ response chậm-nhưng-đúng (false failure); timeout quá dài để slow call ghim thread/connection và gây head-of-line blocking. Rule of thumb: set read timeout ~3× p99 bình thường của downstream, không phải p50.
:::

:::muted
**Bẫy thường gặp** — Không propagate deadline, nên mỗi trong 5 hop chạy timeout 2 s độc lập: user có thể chờ đến 10 s trước khi origin bỏ cuộc. Deadline propagation cap tổng wall-clock của cả chain theo SLO của user.
:::

*Đào sâu tiếp — đặt timeout per-hop thế nào để chain hoàn thành đáng tin cậy trong SLO của user ngay cả khi một hop đang ở p99?*

**Từ khoá ăn điểm** — `connection vs read timeout · deadline propagation · gRPC deadline · remaining budget · head-of-line blocking · p99 not p50`

## 8-card — senior — [RateLimit]
**Question:** What is the "thundering herd" problem in the context of rate limiting and capacity management, and how does shedding load early (rather than queuing) improve system stability?
**Verdict:** KEEP — concept plus a queuing-vs-shedding trade-off and priority-shedding follow-up; clear senior depth.

### New answer (en)
**TL;DR** — Thundering herd is the synchronized retry spike after an outage or window reset; shedding load early (immediate 429/503) beats queuing because queued requests still burn memory, eventually time out, and keep the service saturated.

**How it works** — After a brief outage or a rate-limit window reset, every client retries at once, producing a spike far above steady state. Early load shedding rejects over-capacity requests immediately instead of queuing them; queues just convert a fast error into a slow one while the service stays pinned. Add **priority shedding**: drop the lowest-value traffic (bulk exports, analytics) first and keep serving interactive requests, and return `Retry-After` so clients back off instead of hammering instantly.

:::muted
**Trade-off** — Aggressive shedding stabilizes the system but surfaces more visible errors. The real comparison is fail-fast (user sees an error immediately and can back off) vs queuing (user waits, then times out anyway) — for user-facing APIs, fast failure with a clear error and `Retry-After` is strictly better than long queues.
:::

:::muted
**Common pitfall** — Shedding indiscriminately, so paying/premium users get the same rejection rate as free users during overload. Use priority queues or separate rate-limit tiers so premium traffic is shed last.
:::

*Go deeper — how do you decide the load-shed threshold dynamically instead of a fixed cap, e.g. from queue depth or latency signals?*

**Keywords** — `thundering herd · load shedding · 429/503 · Retry-After · priority shedding · fail-fast vs queue`

### New answer (vi)
**Chốt** — Thundering herd là spike retry đồng bộ sau outage hoặc window reset; shed load sớm (429/503 ngay) hơn hẳn queuing vì request xếp hàng vẫn ngốn memory, rồi cũng timeout, và giữ service bão hòa.

**Cơ chế** — Sau một outage ngắn hoặc một rate-limit window reset, mọi client retry cùng lúc, tạo spike vượt xa steady state. Early load shedding reject request vượt capacity ngay thay vì xếp hàng; queue chỉ biến fast error thành slow error trong khi service vẫn bị ghim. Thêm **priority shedding**: drop traffic giá trị thấp nhất trước (bulk export, analytics) và tiếp tục phục vụ request tương tác, và trả `Retry-After` để client backoff thay vì dập liên tục.

:::muted
**Trade-off** — Shedding aggressive ổn định hệ thống nhưng phơi ra nhiều error hiển thị hơn. So sánh thực sự là fail-fast (user thấy error ngay và có thể backoff) vs queuing (user chờ, rồi vẫn timeout) — với user-facing API, fail nhanh với error rõ ràng và `Retry-After` tốt hơn hẳn queue dài.
:::

:::muted
**Bẫy thường gặp** — Shed không phân biệt, nên user trả phí/premium nhận cùng rejection rate với free user lúc overload. Dùng priority queue hoặc rate-limit tier riêng để traffic premium bị shed cuối cùng.
:::

*Đào sâu tiếp — quyết định ngưỡng shed-load động thế nào thay vì cap cố định, ví dụ từ tín hiệu queue depth hay latency?*

**Từ khoá ăn điểm** — `thundering herd · load shedding · 429/503 · Retry-After · priority shedding · fail-fast vs queue`
