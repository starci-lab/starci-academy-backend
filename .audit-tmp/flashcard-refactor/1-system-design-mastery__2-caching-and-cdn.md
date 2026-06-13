# 1-system-design-mastery / 2-caching-and-cdn
Summary: kept 8, delete 1 of 9

## 0-card — senior — [Caching]
**Question:** You serve a product-detail page that is cached in Redis. You deploy a price update that must be visible within 5 seconds to all users globally. What invalidation strategy do you use, and what breaks if you choose wrong?
**Verdict:** KEEP — design-decision question with a bounded SLA, a real trade-off, and a clear failure mode; scales with seniority.

### New answer (en)
**TL;DR** — A 5-second freshness SLA rules out TTL-only expiry; you need **active, event-driven invalidation** — on price write, publish an invalidation event and have every regional cache delete the affected key, with a short TTL as a backstop.

**How it works** — The price-update service writes to the DB, then publishes an event to a Pub/Sub channel (Redis pub/sub or a Kafka topic). All cache nodes subscribe and delete the specific key immediately, so the next read is a cache-aside miss that repopulates from the DB. Pair it with a short safety TTL (~5 s) so freshness still converges even if an event is dropped. For an edge/CDN layer, fire the provider purge API (Cloudflare Purge, Fastly instant purge) on the same event.

:::muted
**Trade-off** — Pure TTL is dead simple but cannot bound staleness: a 60 s TTL means up to 60 s of wrong prices. Event-driven is fast but couples freshness to the event bus — if Kafka is down, invalidations queue and staleness grows. Global purge APIs add 1–5 s of propagation latency you must budget against the 5 s SLA.
:::

:::muted
**Common pitfall** — Invalidating too broadly — flushing the whole namespace on any product update — triggers a thundering herd as every concurrent reader hits the DB at once. Always delete the specific key, never the namespace.
:::

*Go deeper — if the event bus is down for 30 s, how do you guarantee you don't silently serve stale prices past the SLA?*

**Keywords** — `active invalidation · cache-aside · Pub/Sub · short safety TTL · targeted key delete · purge API`

### New answer (vi)
**Chốt** — SLA freshness 5 giây loại bỏ phương án chỉ dựa vào TTL expiry; bạn cần **active invalidation hướng sự kiện** — khi ghi giá mới, publish một invalidation event để mọi regional cache xóa key bị ảnh hưởng, kèm TTL ngắn làm lưới an toàn.

**Cơ chế** — Price-update service ghi vào DB rồi publish event lên Pub/Sub channel (Redis pub/sub hoặc Kafka topic). Tất cả cache node subscribe và xóa đúng key ngay lập tức, nên read kế tiếp là cache-aside miss và repopulate từ DB. Kết hợp TTL an toàn ngắn (~5 s) để freshness vẫn hội tụ kể cả khi mất một event. Với lớp edge/CDN, gọi purge API của nhà cung cấp (Cloudflare Purge, Fastly instant purge) trên cùng event đó.

:::muted
**Trade-off** — TTL thuần rất đơn giản nhưng không chặn được staleness: TTL 60 s nghĩa là giá sai tới 60 s. Event-driven nhanh nhưng gắn freshness vào event bus — Kafka down thì invalidation xếp hàng và staleness tăng. Purge API toàn cầu thêm 1–5 s propagation, phải trừ vào ngân sách 5 s.
:::

:::muted
**Bẫy thường gặp** — Invalidate quá rộng — flush cả namespace khi có bất kỳ update nào — gây thundering herd vì mọi reader đồng thời hit DB. Luôn xóa đúng key, không bao giờ xóa cả namespace.
:::

*Đào sâu tiếp — nếu event bus chết 30 giây, bạn đảm bảo thế nào để không âm thầm serve giá stale vượt SLA?*

**Từ khoá ăn điểm** — `active invalidation · cache-aside · Pub/Sub · short safety TTL · targeted key delete · purge API`

## 1-card — senior — [Caching]
**Question:** You serve a product-detail page that is cached in Redis. You deploy a price update that must be visible within 5 seconds to all users globally. What invalidation strategy do you use, and what breaks if you choose wrong?
**Verdict:** DELETE — exact duplicate of 0-card (same question, same answer); keep 0-card, re-index siblings so numbering/sortIndex stay contiguous from 0.

## 2-card — senior — [Caching]
**Question:** Explain the cache stampede (thundering herd) problem. Under what exact conditions does it occur, and what are the two canonical solutions?
**Verdict:** KEEP — diagnosis + two named mitigations + a real trade-off; classic senior depth question.

### New answer (en)
**TL;DR** — A cache stampede is when a hot key expires and many concurrent requests all miss at once, each independently hitting the origin — N identical expensive queries that can topple the DB. The two canonical fixes are **lock-on-miss (mutex)** and **probabilistic early expiry (XFetch)**.

**How it works** — It happens precisely when (a) a key is popular, (b) regeneration is expensive, and (c) requests are concurrent at the expiry instant. **Lock-on-miss**: the first miss acquires a distributed lock, fetches and repopulates; everyone else waits and then reads the fresh value, so the origin sees one query. **Probabilistic early expiry**: each read before TTL has a small, rising probability of refreshing the key early, spreading regeneration over time instead of concentrating it at expiry. A cheap complement is TTL jitter so bulk-loaded keys don't expire in lockstep.

:::muted
**Trade-off** — Lock-on-miss serialises regeneration: every waiter blocks until one thread finishes, inflating tail latency during the miss. Early expiry adds continuous background refresh load even when the cache is healthy. Jitter helps coordinated expiry but does nothing for a single white-hot key.
:::

:::muted
**Common pitfall** — Stampedes spike right after a cache flush or a Redis restart post-deploy. Treat cache hit rate as an SLO and alert on a sudden dip toward 0% — if you only notice via a DB CPU spike, you're already in the incident.
:::

*Go deeper — with lock-on-miss, what do you serve the waiting requests if the lock holder's origin fetch times out?*

**Keywords** — `thundering herd · lock-on-miss · distributed lock · probabilistic early expiry / XFetch · TTL jitter · hit-rate SLO`

### New answer (vi)
**Chốt** — Cache stampede là khi một hot key hết hạn và nhiều request đồng thời cùng miss một lúc, mỗi request độc lập hit origin — N query tốn kém giống hệt nhau có thể đánh sập DB. Hai cách chuẩn là **lock-on-miss (mutex)** và **probabilistic early expiry (XFetch)**.

**Cơ chế** — Nó xảy ra đúng khi (a) key phổ biến, (b) regeneration tốn kém, (c) request đồng thời ngay thời điểm hết hạn. **Lock-on-miss**: miss đầu tiên acquire distributed lock, fetch và repopulate; số còn lại chờ rồi đọc giá trị mới, nên origin chỉ thấy một query. **Probabilistic early expiry**: mỗi read trước khi hết TTL có xác suất nhỏ (và tăng dần) refresh sớm, phân tán regeneration theo thời gian thay vì dồn vào lúc hết hạn. Bổ trợ rẻ là TTL jitter để các key nạp theo lô không hết hạn cùng lúc.

:::muted
**Trade-off** — Lock-on-miss serialize regeneration: mọi request chờ bị block tới khi một thread xong, làm phình tail latency trong sự kiện miss. Early expiry thêm tải refresh nền liên tục ngay cả khi cache khỏe. Jitter chỉ giúp coordinated expiry, vô dụng với một key cực nóng đơn lẻ.
:::

:::muted
**Bẫy thường gặp** — Stampede bùng lên ngay sau cache flush hoặc Redis restart hậu deploy. Coi cache hit rate là SLO và alert khi nó tụt đột ngột về gần 0% — nếu chỉ phát hiện qua DB CPU spike thì đã ở trong incident.
:::

*Đào sâu tiếp — với lock-on-miss, bạn serve gì cho các request đang chờ nếu origin fetch của thread giữ lock bị timeout?*

**Từ khoá ăn điểm** — `thundering herd · lock-on-miss · distributed lock · probabilistic early expiry / XFetch · TTL jitter · hit-rate SLO`

## 3-card — senior — [Caching]
**Question:** Write-through vs write-back (write-behind) caching — in what system do each shine, and in what failure scenario does write-back cause data loss?
**Verdict:** KEEP — comparison with workload fit and a concrete durability failure mode; strong senior question.

### New answer (en)
**TL;DR** — **Write-through** writes synchronously to cache and DB (always consistent, ideal for read-heavy); **write-back** writes to cache only and flushes to the DB asynchronously (low write latency, ideal for write-heavy). Write-back loses data when the cache node crashes before flushing.

**How it works** — Write-through pays two synchronous round-trips per write, so the cache and DB never diverge — good for read-heavy workloads that tolerate slightly slower writes. Write-back acknowledges as soon as the cache is updated and batches flushes to the DB later, slashing DB write pressure — good for high-frequency mutations like a cart updated many times before checkout or a per-action game score. The unflushed window is exactly the durability gap: a crash there loses those writes permanently unless the cache has a durable write-ahead log (e.g. Redis AOF with `fsync=always`).

:::muted
**Trade-off** — Write-through adds write latency and can waste cache space on data that's never read back. Write-back trades durability for speed; making it safe requires AOF/WAL persistence, which claws back much of the latency win.
:::

:::muted
**Common pitfall** — Using write-back for money or orders. If a payment is acknowledged from a write-back cache and Redis crashes pre-flush, the order record is lost but the customer was charged. Any mutation with real-world consequences must go through write-through or a synchronous DB write.
:::

*Go deeper — for a cart that's write-heavy but must not lose the final checkout, how do you mix the two strategies on the same entity?*

**Keywords** — `write-through · write-back / write-behind · durability gap · async flush · Redis AOF fsync=always · synchronous DB write`

### New answer (vi)
**Chốt** — **Write-through** ghi synchronous vào cả cache và DB (luôn nhất quán, hợp read-heavy); **write-back** chỉ ghi vào cache rồi flush DB bất đồng bộ (write latency thấp, hợp write-heavy). Write-back mất dữ liệu khi cache node crash trước khi flush.

**Cơ chế** — Write-through tốn hai round-trip synchronous mỗi write nên cache và DB không bao giờ lệch — tốt cho read-heavy chấp nhận write hơi chậm. Write-back ack ngay khi cache được cập nhật và gộp flush vào DB sau, giảm mạnh write pressure DB — tốt cho mutation tần suất cao như cart cập nhật nhiều lần trước checkout hay điểm game tăng theo action. Cửa sổ chưa flush chính là durability gap: crash ở đó mất vĩnh viễn các write đó trừ khi cache có durable write-ahead log (ví dụ Redis AOF với `fsync=always`).

:::muted
**Trade-off** — Write-through thêm write latency và có thể lãng phí cache space trên data không bao giờ được đọc lại. Write-back đổi durability lấy tốc độ; muốn an toàn phải bật persistence AOF/WAL, mà điều đó lấy lại phần lớn lợi ích latency.
:::

:::muted
**Bẫy thường gặp** — Dùng write-back cho tiền hoặc đơn hàng. Nếu payment được ack từ write-back cache rồi Redis crash trước flush, bản ghi đơn mất nhưng khách đã bị charge. Mọi mutation có hậu quả thực tế phải đi qua write-through hoặc synchronous DB write.
:::

*Đào sâu tiếp — với một cart write-heavy nhưng không được mất bước checkout cuối, bạn phối hai chiến lược trên cùng một entity ra sao?*

**Từ khoá ăn điểm** — `write-through · write-back / write-behind · durability gap · async flush · Redis AOF fsync=always · synchronous DB write`

## 4-card — senior — [CDN, Caching]
**Question:** Your API gateway caches responses at the edge (CDN layer). A user updates their profile picture, but the CDN still serves the old image for 20 minutes. What is the root cause and how do you architect this correctly?
**Verdict:** KEEP — root-cause diagnosis plus an architecture fix and a security pitfall; layered senior depth.

### New answer (en)
**TL;DR** — Root cause: the image URL is stable (`/profile/user-123.jpg`), so the CDN keeps serving the cached copy until TTL with no reason to re-fetch. Fix it with **content-addressable (cache-busted) URLs** so a new upload produces a new immutable URL.

**How it works** — On upload, mint a versioned/hashed URL like `/profile/user-123/abc123.jpg` and point the profile at it. The old URL keeps serving the old bytes (harmless — nothing requests it anymore), and every new request hits a URL the CDN has never seen, so it fetches fresh from origin. Because each URL is immutable you can set `Cache-Control: max-age=31536000`, getting maximum CDN efficiency with instant correctness. The alternative — calling the CDN purge API on each update — works but is weaker (see pitfall).

:::muted
**Trade-off** — Content-addressed URLs are immutable and cacheable forever, optimal for hit ratio, but require the app to track and propagate the current URL. Purge-based invalidation is simpler but depends on a purge call succeeding at upload time, and purge APIs carry rate limits and 1–10 s global propagation.
:::

:::muted
**Common pitfall** — Caching user-specific or auth-sensitive responses at the CDN without `Vary: Cookie`/`Authorization` or `Cache-Control: private`. The CDN can then serve one user's private data to another because the cache key omits the session. Set `Cache-Control: no-store` (or `private`) for authenticated responses.
:::

*Go deeper — if a purge API call silently fails at upload, how do you detect that users are stuck on a stale image before they complain?*

**Keywords** — `content-addressable URL · cache-busting · immutable · max-age=31536000 · purge API · Vary: Cookie/Authorization · Cache-Control: private`

### New answer (vi)
**Chốt** — Nguyên nhân gốc: URL ảnh cố định (`/profile/user-123.jpg`) nên CDN cứ serve bản cache tới hết TTL, không có lý do re-fetch. Sửa bằng **content-addressable URL (cache-busting)** để mỗi lần upload tạo ra một URL immutable mới.

**Cơ chế** — Khi upload, sinh URL có version/hash như `/profile/user-123/abc123.jpg` và trỏ profile vào đó. URL cũ vẫn serve bytes cũ (vô hại — không còn ai request), còn mọi request mới trỏ tới URL CDN chưa từng thấy nên fetch fresh từ origin. Vì mỗi URL là immutable, bạn đặt được `Cache-Control: max-age=31536000`, đạt hiệu suất CDN tối đa mà vẫn đúng tức thì. Cách thay thế — gọi purge API mỗi lần update — chạy được nhưng yếu hơn (xem bẫy).

:::muted
**Trade-off** — Content-addressed URL immutable và cacheable mãi mãi, tối ưu hit ratio, nhưng buộc app phải lưu và propagate URL hiện hành. Purge-based đơn giản hơn nhưng phụ thuộc purge call thành công lúc upload, và purge API có rate limit cùng 1–10 s propagation toàn cầu.
:::

:::muted
**Bẫy thường gặp** — Cache response user-specific hoặc auth-sensitive ở CDN mà thiếu `Vary: Cookie`/`Authorization` hoặc `Cache-Control: private`. CDN có thể serve dữ liệu private của người này cho người khác vì cache key bỏ qua session. Đặt `Cache-Control: no-store` (hoặc `private`) cho response đã xác thực.
:::

*Đào sâu tiếp — nếu purge API fail im lặng lúc upload, bạn phát hiện người dùng đang kẹt ảnh stale trước khi họ phàn nàn bằng cách nào?*

**Từ khoá ăn điểm** — `content-addressable URL · cache-busting · immutable · max-age=31536000 · purge API · Vary: Cookie/Authorization · Cache-Control: private`

## 5-card — senior — [Caching]
**Question:** Describe the three-tier caching hierarchy (L1 in-process, L2 Redis cluster, L3 database). When does promoting data up the hierarchy hurt you?
**Verdict:** KEEP — requires explaining a layered design and reasoning about when it backfires; genuine senior judgment.

### New answer (en)
**TL;DR** — L1 is an in-process cache (µs, but per-pod and hard to invalidate), L2 is a shared Redis cluster (ms, cross-pod, supports locking), L3 is the DB (source of truth, slowest). Promotion hurts when data is rarely re-read, mutates frequently, or is large.

**How it works** — Read flow: check L1 → on hit return; on miss check L2 → on hit populate L1 and return; on miss read L3 → populate L2 and L1 → return. L1 gives microsecond reads with no network hop but each pod has its own copy, so a write on one pod doesn't invalidate L1 on the others. L2 is the sweet spot for shared mutable data. Promoting into L1 backfires when (1) data is rarely re-read — you pay promotion cost with no hit benefit; (2) it mutates often — the L1 copy is stale before the next request; (3) it's large — heap pressure raises GC frequency.

:::muted
**Trade-off** — L1 is fastest but the hardest to invalidate: you can't broadcast a key deletion to every pod's L1 without a pub/sub fan-out. Reserve L1 for reference data that changes very rarely (config, feature flags) where brief eventual consistency on update is acceptable; keep everything mutable in L2.
:::

:::muted
**Common pitfall** — Infinite/long TTLs on L1 for "static" config that's actually changed via a feature-flag API. If the pod never restarts, it serves stale config for its whole lifetime. Use short L1 TTLs (30–60 s) for anything mutable through config APIs, or wire a pub/sub invalidation.
:::

*Go deeper — a feature flag must flip within 1 s across 200 pods that each hold it in L1 — how do you guarantee that?*

**Keywords** — `L1 in-process · L2 Redis cluster · L3 DB · per-pod invalidation · pub/sub fan-out · short L1 TTL · GC/heap pressure`

### New answer (vi)
**Chốt** — L1 là cache in-process (µs, nhưng per-pod và khó invalidate), L2 là Redis cluster dùng chung (ms, cross-pod, hỗ trợ locking), L3 là DB (nguồn chân lý, chậm nhất). Promote data lên gây hại khi data hiếm khi đọc lại, biến đổi thường xuyên, hoặc kích thước lớn.

**Cơ chế** — Luồng read: kiểm L1 → hit thì return; miss thì kiểm L2 → hit thì populate L1 rồi return; miss thì đọc L3 → populate L2 và L1 → return. L1 cho read microsecond không network hop nhưng mỗi pod có bản riêng, nên write ở một pod không invalidate L1 ở pod khác. L2 là điểm tối ưu cho shared mutable data. Promote vào L1 phản tác dụng khi (1) data hiếm khi đọc lại — trả chi phí promotion mà không hit; (2) biến đổi thường xuyên — bản L1 stale trước request kế; (3) kích thước lớn — heap pressure làm tăng tần suất GC.

:::muted
**Trade-off** — L1 nhanh nhất nhưng khó invalidate nhất: không thể broadcast xóa key tới L1 của mọi pod nếu thiếu pub/sub fan-out. Chỉ dành L1 cho reference data thay đổi rất hiếm (config, feature flag) nơi eventual consistency ngắn khi update là chấp nhận được; mọi thứ mutable để ở L2.
:::

:::muted
**Bẫy thường gặp** — TTL vô hạn/dài trên L1 cho config "tĩnh" mà thực ra đổi qua feature-flag API. Nếu pod không restart, nó serve config stale suốt lifetime. Dùng L1 TTL ngắn (30–60 s) cho mọi thứ mutable qua config API, hoặc gắn pub/sub invalidation.
:::

*Đào sâu tiếp — một feature flag phải lật trong 1 giây trên 200 pod đang giữ nó ở L1 — bạn đảm bảo điều đó thế nào?*

**Từ khoá ăn điểm** — `L1 in-process · L2 Redis cluster · L3 DB · per-pod invalidation · pub/sub fan-out · short L1 TTL · GC/heap pressure`

## 6-card — senior — [CDN]
**Question:** How does edge caching change the behaviour of A/B testing, personalisation, and authenticated pages? What is the standard solution?
**Verdict:** KEEP — connects edge cache-key semantics to several product concerns with named solution patterns; solid senior depth.

### New answer (en)
**TL;DR** — An edge cache returns one cached response to everyone sharing a cache key, so if the key is just the URL path, all users get the same HTML — breaking personalisation, pinning everyone to one A/B variant, and risking private-data leaks. The fix is to control the cache key (Vary), cache only a public shell, or assemble responses with edge compute.

**How it works** — Three standard patterns: (1) **Cache a public shell, personalise on the client** — the CDN caches a static HTML skeleton and JS fetches per-user data from an API after load (edge SSI / fragment caching). (2) **Vary the cache key** — vary on `Cookie`, `Accept-Language`, or a custom A/B header so each variant gets its own entry. (3) **Edge compute** — Cloudflare Workers / Fastly Compute@Edge run logic at the edge to assemble personalised responses from cached fragments without a full origin round-trip.

:::muted
**Trade-off** — Varying on `Cookie` effectively disables edge caching for logged-in users, since each session is a distinct key. The shell-plus-API approach adds a request waterfall that hurts Time-To-Interactive. Edge compute is the modern answer but adds infrastructure cost and operational complexity.
:::

:::muted
**Common pitfall** — Forgetting the `Vary` header entirely. Two users hitting the same URL — one English, one French — will see each other's cached language version if you don't `Vary: Accept-Language`. Always audit `Vary` when shipping multi-language or multi-variant content.
:::

*Go deeper — you must run a 50/50 A/B test that stays sticky per user but still cache at the edge — how do you key it?*

**Keywords** — `cache key · Vary: Cookie/Accept-Language · public shell + client personalise · fragment caching / edge SSI · edge compute (Workers / Compute@Edge)`

### New answer (vi)
**Chốt** — Edge cache trả một cached response cho mọi người chung cache key, nên nếu key chỉ là URL path thì tất cả nhận cùng HTML — phá personalisation, ghim mọi người vào một A/B variant, và có nguy cơ leak private data. Cách sửa là kiểm soát cache key (Vary), chỉ cache phần shell công khai, hoặc lắp ráp response bằng edge compute.

**Cơ chế** — Ba pattern chuẩn: (1) **Cache public shell, personalise ở client** — CDN cache HTML skeleton tĩnh, JS fetch dữ liệu per-user từ API sau khi load (edge SSI / fragment caching). (2) **Vary cache key** — vary trên `Cookie`, `Accept-Language`, hoặc custom A/B header để mỗi variant có entry riêng. (3) **Edge compute** — Cloudflare Workers / Fastly Compute@Edge chạy logic tại edge để lắp response personalised từ fragment cached mà không cần full origin round-trip.

:::muted
**Trade-off** — Vary trên `Cookie` thực tế vô hiệu hóa edge caching cho user đã đăng nhập, vì mỗi session là một key riêng. Cách shell + API thêm waterfall request làm hại Time-To-Interactive. Edge compute là câu trả lời hiện đại nhưng tăng chi phí hạ tầng và độ phức tạp vận hành.
:::

:::muted
**Bẫy thường gặp** — Quên hẳn header `Vary`. Hai user hit cùng URL — một tiếng Anh, một tiếng Pháp — sẽ thấy phiên bản ngôn ngữ của nhau nếu không `Vary: Accept-Language`. Luôn audit `Vary` khi ship nội dung đa ngôn ngữ hoặc đa variant.
:::

*Đào sâu tiếp — bạn phải chạy A/B test 50/50 sticky theo user nhưng vẫn cache ở edge — bạn đặt cache key thế nào?*

**Từ khoá ăn điểm** — `cache key · Vary: Cookie/Accept-Language · public shell + client personalise · fragment caching / edge SSI · edge compute (Workers / Compute@Edge)`

## 7-card — staff — [Caching]
**Question:** A hot key in Redis is receiving 50 000 reads/second — far above what a single Redis node can handle. What options do you have, and what are the operational costs of each?
**Verdict:** KEEP — staff-level scaling problem with a graded menu of options, each with operational cost and a sharp misconception to correct.

### New answer (en)
**TL;DR** — A single key maps to one Redis slot/node, so you can't shard your way out — you must take read load off that node: local in-process cache, replica reads, or key replication with random suffixes. Local cache is the cheapest big win.

**How it works** — In increasing complexity: (1) **Local in-process cache** — each app pod caches the hot key with a short TTL (100–500 ms); reads serve from heap and Redis load drops proportionally to pod count. (2) **Replica reads** — route hot-key reads to Redis read replicas to scale read throughput. (3) **Keyspace replication** — store N copies as `hot-key:0..N-1` and read a random one; writes must fan out atomically (Lua/pipeline) to all N. (4) **Manual slot spreading** — hash the logical key across multiple physical slots at the application layer.

:::muted
**Trade-off** — Local cache introduces a 100–500 ms inconsistency window where pods can disagree on the value. Replica reads add staleness when a replica lags the master. Key replication turns one write into N coordinated atomic writes, multiplying write cost and complexity to win read scale.
:::

:::muted
**Common pitfall** — Assuming Redis Cluster fixes hot-key reads automatically. Slots are pre-sharded, so one key always lives on one node; spreading it requires app-level fan-out, not a Redis feature. Detect hot keys early with `redis-cli --hotkeys` / per-slot op-rate monitoring before they become an incident.
:::

*Go deeper — with a short-TTL local cache, how do you bound the worst-case staleness a user can observe for that hot key?*

**Keywords** — `hot key · single slot/node · local in-process cache (short TTL) · replica reads · key replication hot-key:0..N · Lua fan-out · redis-cli --hotkeys`

### New answer (vi)
**Chốt** — Một key chỉ map về một Redis slot/node, nên không thể shard để thoát — phải gỡ read load khỏi node đó: local in-process cache, replica read, hoặc key replication với random suffix. Local cache là cú thắng lớn rẻ nhất.

**Cơ chế** — Theo độ phức tạp tăng dần: (1) **Local in-process cache** — mỗi app pod cache hot key với TTL ngắn (100–500 ms); read serve từ heap và Redis load giảm tỉ lệ thuận với số pod. (2) **Replica read** — route read hot-key tới Redis read replica để scale read throughput. (3) **Keyspace replication** — lưu N bản `hot-key:0..N-1` và đọc một bản ngẫu nhiên; write phải fan-out atomic (Lua/pipeline) tới cả N. (4) **Manual slot spreading** — hash logical key qua nhiều physical slot ở tầng application.

:::muted
**Trade-off** — Local cache tạo cửa sổ inconsistency 100–500 ms khi các pod bất đồng về giá trị. Replica read thêm staleness khi replica lag sau master. Key replication biến một write thành N atomic write phối hợp, nhân chi phí và độ phức tạp write để đổi lấy read scale.
:::

:::muted
**Bẫy thường gặp** — Giả định Redis Cluster tự xử lý hot-key read. Slot được pre-shard nên một key luôn nằm trên một node; muốn phân tán phải fan-out ở tầng app, không phải feature của Redis. Phát hiện hot key sớm bằng `redis-cli --hotkeys` / monitor op-rate per-slot trước khi thành incident.
:::

*Đào sâu tiếp — với local cache TTL ngắn, bạn chặn staleness tệ nhất mà user có thể thấy cho hot key đó bằng cách nào?*

**Từ khoá ăn điểm** — `hot key · single slot/node · local in-process cache (short TTL) · replica reads · key replication hot-key:0..N · Lua fan-out · redis-cli --hotkeys`

## 8-card — middle — [Caching]
**Question:** When should you NOT cache a database query result, even if the query is expensive?
**Verdict:** KEEP — judgment question that resists rote answers; a mid-level engineer must reason about consistency, cardinality, and write-path correctness.

### New answer (en)
**TL;DR** — Don't cache when correctness beats speed: strongly-consistent reads (balances, inventory, permissions), data that changes as fast as it's read, high-cardinality per-user results with no sharing, and any value used in write-path validation.

**How it works** — Four cases: (1) **Strong consistency required** — a stale balance, stock count, or permission check causes financial or security errors. (2) **Write:read ≈ 1:1** — the cache is stale on the very first read and never amortises its cost. (3) **High-cardinality per-user data** — caching a distinct result for 50 M users burns memory with no shared hit benefit; serve from the DB with a good index instead. (4) **Write-path validation** — uniqueness checks and concurrent-modification guards; a cached value gives false assurance and lets races through.

:::muted
**Common pitfall** — Caching permission/ACL data with a long TTL. Remove a user from an org and the cache still grants access until the TTL expires (e.g. 10 more minutes). If the key includes user + resource IDs, revocation must trigger an explicit invalidation, not wait for TTL.
:::

*Go deeper — for permission checks you still want fast, how do you get cache speed without the stale-revocation hole?*

**Keywords** — `strong consistency · write:read ratio · high cardinality · write-path validation · ACL/permission TTL · explicit invalidation on revoke`

### New answer (vi)
**Chốt** — Đừng cache khi tính đúng quan trọng hơn tốc độ: read strongly-consistent (số dư, tồn kho, permission), data đổi nhanh ngang với tần suất đọc, kết quả per-user high-cardinality không chia sẻ được, và mọi giá trị dùng trong write-path validation.

**Cơ chế** — Bốn trường hợp: (1) **Cần strong consistency** — số dư, tồn kho, hay permission check bị stale gây lỗi tài chính hoặc bảo mật. (2) **Write:read ≈ 1:1** — cache stale ngay lần đọc đầu và không bao giờ amortise được chi phí. (3) **Data per-user high-cardinality** — cache kết quả riêng cho 50 M user đốt memory mà không có shared hit; thay vào đó serve từ DB với index tốt. (4) **Write-path validation** — uniqueness check và concurrent-modification guard; giá trị cache cho assurance sai và để race lọt qua.

:::muted
**Bẫy thường gặp** — Cache dữ liệu permission/ACL với TTL dài. Xóa một user khỏi org mà cache vẫn cấp quyền tới khi hết TTL (ví dụ thêm 10 phút). Nếu key gồm user + resource ID, revocation phải trigger invalidation tường minh, không chờ TTL.
:::

*Đào sâu tiếp — với permission check vẫn cần nhanh, bạn đạt tốc độ cache mà không dính lỗ hổng stale-revocation bằng cách nào?*

**Từ khoá ăn điểm** — `strong consistency · write:read ratio · high cardinality · write-path validation · ACL/permission TTL · explicit invalidation on revoke`
