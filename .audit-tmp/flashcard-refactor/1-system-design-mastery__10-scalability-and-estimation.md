# 1-system-design-mastery / 10-scalability-and-estimation
Summary: kept 8, delete 0 of 8

## 0-card — middle — [Estimation, Capacity Planning]
**Question:** An interviewer asks you to design a URL shortener for 100M new links per day and says "estimate the storage and read QPS." You don't know the exact read ratio. How do you produce a defensible number, and why does the interviewer care more about your method than the final figure?
**Verdict:** KEEP — Open-ended capacity-estimation question testing method, surfacing assumptions, and order-of-magnitude reasoning; invites follow-ups.

### New answer (en)
**TL;DR** — Convert to a per-second rate, state your read:write ratio and payload size out loud as explicit assumptions, then round to the nearest power of ten. The interviewer scores the method because a defensible estimate is a chain of stated assumptions they can correct on the fly — a memorized number can't adapt.

**How it works** — 100M writes/day ÷ 86,400s ≈ 1,160 writes/sec average. Reads dominate a shortener, so assume a 100:1 read:write ratio → ≈ 116K reads/sec, which you round to "~100K QPS." For storage, size one record (short code + long URL + metadata ≈ 500 bytes) × 100M = 50 GB/day ≈ 18 TB/year before replication. The deliverable is an order of magnitude (tens of TB, ~100K QPS), not three significant digits.

:::muted
**Trade-off** — Every real estimate rests on assumptions the interviewer wants surfaced: peak-to-average multiplier (often 2–10x), read:write ratio, payload size, retention window. Stating them lets you absorb a correction and still land a sane number; it also shows you know which dimension dominates (here storage growth and read fan-out, not write throughput).
:::

:::muted
**Common pitfall** — Sizing for the daily average and ignoring the bursty peak: a system provisioned for 1,160 writes/sec falls over at the 5x lunchtime spike. Also forgetting silent multipliers — replication (×3), indexes, backups can triple raw storage. And don't compute 116,407 reads/sec to three decimals when the design only needs "about 100K."
:::

*Go deeper — how would your storage and QPS numbers change if the interviewer added "links expire after 30 days" or "we need analytics on every click"?*

**Keywords** — `requests/sec from per-day` · `read:write ratio` · `peak-to-average` · `order of magnitude` · `replication factor` · `back-of-envelope`

### New answer (vi)
**Chốt** — Đổi sang rate mỗi giây, nói rõ ra tỉ lệ read:write và kích thước payload như những giả định tường minh, rồi làm tròn về lũy thừa của mười gần nhất. Interviewer chấm phương pháp vì một ước lượng bảo vệ được là một chuỗi giả định họ có thể chỉnh tại chỗ — một con số học thuộc thì không xoay xở được.

**Cơ chế** — 100 triệu write/ngày ÷ 86.400s ≈ 1.160 write/giây trung bình. Read áp đảo với shortener, nên giả định tỉ lệ read:write 100:1 → ≈ 116K read/giây, làm tròn thành "~100K QPS". Về storage, tính một record (short code + long URL + metadata ≈ 500 byte) × 100 triệu = 50 GB/ngày ≈ 18 TB/năm trước replication. Sản phẩm cuối là một cấp độ độ lớn (hàng chục TB, ~100K QPS), không phải ba chữ số có nghĩa.

:::muted
**Trade-off** — Mọi ước lượng thực dựa trên giả định mà interviewer muốn thấy nêu ra: hệ số peak-to-average (thường 2–10x), tỉ lệ read:write, kích thước payload, cửa sổ retention. Nêu rõ cho phép bạn tiếp thu một chỉnh sửa mà vẫn ra con số hợp lý; nó còn cho thấy bạn biết chiều nào áp đảo (ở đây là storage growth và read fan-out, không phải write throughput).
:::

:::muted
**Bẫy thường gặp** — Tính theo trung bình ngày và bỏ qua peak bùng nổ: hệ thống provision cho 1.160 write/giây sẽ sập ở spike giờ trưa gấp 5 lần. Cũng dễ quên các hệ số nhân âm thầm — replication (×3), index, backup có thể nhân ba storage thô. Và đừng tính 116.407 read/giây tới ba số lẻ khi thiết kế chỉ cần "khoảng 100K".
:::

*Đào sâu tiếp — các con số storage và QPS thay đổi thế nào nếu interviewer thêm "link hết hạn sau 30 ngày" hoặc "cần analytics trên mỗi click"?*

**Từ khoá ăn điểm** — `requests/sec từ per-day` · `read:write ratio` · `peak-to-average` · `order of magnitude` · `replication factor` · `back-of-envelope`

## 1-card — junior — [Vertical Scaling, Horizontal Scaling]
**Question:** Your single API server is maxing out CPU at peak. A teammate says "just give it a bigger box," another says "add more boxes behind a load balancer." When does scaling up hit a ceiling, and what does making the service stateless buy you for scaling out?
**Verdict:** KEEP — Conceptual scale-up vs scale-out decision with a real "why" (ceiling, statelessness precondition); scales with seniority.

### New answer (en)
**TL;DR** — Scale up (bigger box) first because the code doesn't change, but it hits a hard ceiling: the largest instance is finite, cost grows super-linearly, and one box is a single point of failure. Scale out (more boxes behind a load balancer) has no single-machine ceiling and adds redundancy — and statelessness is the precondition that lets any instance serve any request.

**How it works** — Vertical scaling moves to a machine with more CPU/RAM/faster disk. Horizontal scaling runs many smaller instances behind a load balancer that spreads requests. A stateless service keeps no client-specific data on the instance, so a new instance is immediately useful and a dying one is harmless — that's what makes scale-out cheap. Scale up to buy time while small; plan scale-out as the real growth path.

:::muted
**Common pitfall** — Scaling out a service that secretly holds state — in-memory sessions, a local upload directory, a per-instance cache users depend on. Requests routed to a different instance then fail or behave inconsistently, forcing you into sticky sessions, which undermine the even load distribution you scaled out for. Externalize state (sessions in Redis, files in object storage) before adding instances, not after the bugs hit production.
:::

*Go deeper — once you're horizontally scaled, what's the next tier that saturates, and why won't adding more app instances fix it?*

**Keywords** — `scale-up / vertical` · `scale-out / horizontal` · `single point of failure` · `stateless` · `load balancer` · `super-linear cost`

### New answer (vi)
**Chốt** — Scale up (máy to hơn) trước vì code không đổi, nhưng nó chạm trần cứng: instance lớn nhất là hữu hạn, chi phí tăng siêu tuyến tính, và một máy là single point of failure. Scale out (nhiều máy sau load balancer) không có trần của một máy đơn và thêm redundancy — và statelessness là điều kiện tiên quyết để bất kỳ instance nào phục vụ được bất kỳ request nào.

**Cơ chế** — Vertical scaling chuyển sang máy nhiều CPU/RAM/disk nhanh hơn. Horizontal scaling chạy nhiều instance nhỏ sau một load balancer phân tán request. Một stateless service không giữ data riêng của client trên instance, nên instance mới hữu dụng ngay và instance chết vô hại — đó là thứ khiến scale-out rẻ. Scale up để mua thời gian khi còn nhỏ; coi scale-out là con đường tăng trưởng thật.

:::muted
**Bẫy thường gặp** — Scale-out một service bí mật giữ state — session trong memory, thư mục upload cục bộ, cache per-instance mà user phụ thuộc. Khi đó request route tới instance khác sẽ fail hoặc không nhất quán, ép bạn dùng sticky session, làm hỏng chính sự phân bổ tải đều mà bạn scale-out để có. Hãy externalize state (session trong Redis, file trong object storage) trước khi thêm instance, không phải sau khi bug nổ ở production.
:::

*Đào sâu tiếp — khi đã scale ngang, tier nào bão hòa kế tiếp, và tại sao thêm app instance lại không fix được nó?*

**Từ khoá ăn điểm** — `scale-up / vertical` · `scale-out / horizontal` · `single point of failure` · `stateless` · `load balancer` · `super-linear cost`

## 2-card — middle — [Statelessness, Zero-Downtime Deploy]
**Question:** After a deploy, some users get logged out and a few uploads vanish. You discover sessions live in each instance's memory and uploaded files land on local disk. Why is externalizing state the precondition for both horizontal scaling and zero-downtime deploys?
**Verdict:** KEEP — Diagnosis from symptoms to root cause, with a design principle (externalize state) and a real trade-off; classic middle-level depth.

### New answer (en)
**TL;DR** — Because both depend on instances being disposable. If a session or file lives only on one instance, killing or replacing that instance (a deploy, an autoscale-down, a crash) destroys data — users get logged out, uploads vanish. Move state to an external store (sessions in Redis, files in S3) and any instance can be added, removed, or replaced freely.

**How it works** — A stateless service keeps no client-specific data between requests; everything durable lives externally — sessions/tokens in Redis, files in object storage, app data in the database. With state external, the load balancer can route any request anywhere, and a rolling deploy spins up new-version instances, drains and terminates old ones, and no session or file is trapped on the dying instance — users never notice.

:::muted
**Trade-off** — You pay an extra network hop per request to fetch state, and you add a dependency (Redis, S3) that must itself be highly available — you've traded a local-memory failure mode for a shared-store one. For most systems it's a clear win: the external store is built for HA and the app tier becomes trivially replaceable.
:::

:::muted
**Common pitfall** — "Mostly stateless" services that still cache something locally — a hot lookup table, a rate-limit counter, a feature-flag snapshot — and behave inconsistently by instance. The other trap is using sticky sessions as a crutch to avoid externalizing: it pins a user to one instance, so that instance's death still logs them out and load never spreads evenly. Audit any per-instance memory or disk write a request's correctness depends on.
:::

*Go deeper — your session store is now Redis. How do you keep Redis itself from becoming the new single point of failure?*

**Keywords** — `stateless` · `externalize state` · `rolling deploy` · `drain / connection draining` · `sticky session` · `object storage`

### New answer (vi)
**Chốt** — Vì cả hai đều dựa trên việc instance phải "vứt đi được". Nếu session hay file chỉ nằm trên một instance, việc giết hoặc thay instance đó (deploy, autoscale-down, crash) sẽ phá data — user bị logout, upload biến mất. Đưa state ra external store (session trong Redis, file trong S3) thì instance có thể thêm, bớt, hoặc thay tự do.

**Cơ chế** — Một stateless service không giữ data riêng của client giữa các request; mọi thứ durable nằm bên ngoài — session/token trong Redis, file trong object storage, data ứng dụng trong database. Khi state ở ngoài, load balancer route request đi bất kỳ đâu, và rolling deploy dựng instance phiên bản mới, drain rồi tắt instance cũ, không session hay file nào kẹt trên instance đang chết — user không nhận ra.

:::muted
**Trade-off** — Bạn trả thêm một network hop mỗi request để lấy state, và thêm một dependency (Redis, S3) mà bản thân nó phải highly available — đổi failure mode local-memory lấy failure mode shared-store. Với hầu hết hệ thống đây là thắng lợi rõ ràng: external store được xây cho HA và app tier trở nên dễ thay thế tầm thường.
:::

:::muted
**Bẫy thường gặp** — Các service "gần như stateless" mà vẫn cache cục bộ thứ gì đó — lookup table nóng, rate-limit counter, snapshot feature-flag — và hành xử không nhất quán tùy instance. Bẫy khác là dùng sticky session như cái nạng để né externalize: nó ghim user vào một instance, nên instance đó chết vẫn logout họ và tải không bao giờ trải đều. Hãy audit mọi memory per-instance hoặc disk write mà tính đúng đắn của request phụ thuộc vào.
:::

*Đào sâu tiếp — session store giờ là Redis. Làm sao để chính Redis không trở thành single point of failure mới?*

**Từ khoá ăn điểm** — `stateless` · `externalize state` · `rolling deploy` · `drain / connection draining` · `sticky session` · `object storage`

## 3-card — senior — [Load Balancing, Consistent Hashing]
**Question:** Your load balancer uses round-robin, but a few instances with slow long-lived requests keep getting overloaded while others sit idle. When would you switch to least-connections, when is consistent hashing the right call, and where do sticky sessions help versus hurt?
**Verdict:** KEEP — Senior-level algorithm-selection question requiring trade-off reasoning across three policies plus the stickiness anti-pattern.

### New answer (en)
**TL;DR** — Switch to least-connections when request durations vary widely — it routes to the instance with the fewest in-flight connections, so busy instances stop receiving work (your fix here). Use consistent hashing when downstream locality matters (cache affinity, a sharded backend). Sticky sessions help only when an instance holds genuine per-client state, and otherwise hurt scalability.

**How it works** — Round-robin rotates requests in fixed order — cheap and stateless, ideal for short uniform requests but blind to instance load. Least-connections tracks per-instance in-flight counts and self-corrects for uneven request cost. Consistent hashing routes by a key (user ID, cache key) so the same key lands on the same instance and the key set reshuffles minimally when instances change; virtual nodes smooth out key skew.

:::muted
**Trade-off** — Least-connections needs the balancer to track connection counts (more state) and can misroute if "connections" don't reflect CPU load. Consistent hashing buys affinity and stable routing but sacrifices perfect evenness under key skew. Round-robin is cheapest and most predictable but ignores health and request weight. No policy is universally best — match it to request shape and whether downstream state is keyed.
:::

:::muted
**Common pitfall** — Sticky sessions help when an instance holds session state or a warm local cache, but they break even load distribution, let a popular cohort hot-spot one instance, and drop all pinned users when that instance dies. The deeper anti-pattern is using stickiness to avoid making the service stateless. Prefer externalized state plus a stateless policy; reserve stickiness for genuine cases like in-progress WebSocket connections.
:::

*Go deeper — least-connections still overloads an instance whose requests are CPU-heavy but few. How would you route on actual load instead of connection count?*

**Keywords** — `round-robin` · `least-connections` · `consistent hashing` · `virtual nodes` · `cache affinity` · `sticky session` · `key skew`

### New answer (vi)
**Chốt** — Chuyển sang least-connections khi thời lượng request biến thiên lớn — nó route tới instance có ít connection đang xử lý nhất, nên instance bận ngừng nhận việc (cách fix ở đây). Dùng consistent hashing khi locality downstream quan trọng (cache affinity, backend sharded). Sticky session chỉ giúp khi instance giữ per-client state thật, còn lại thì gây hại cho scalability.

**Cơ chế** — Round-robin xoay request theo vòng cố định — rẻ và stateless, lý tưởng cho request ngắn đồng đều nhưng mù trước tải instance. Least-connections theo dõi số connection đang xử lý per-instance và tự sửa cho chi phí request không đều. Consistent hashing route theo một key (user ID, cache key) để cùng key đáp xuống cùng instance và tập key xáo trộn tối thiểu khi instance thay đổi; virtual node làm mượt key skew.

:::muted
**Trade-off** — Least-connections cần balancer theo dõi connection count (nhiều state hơn) và có thể route sai nếu "connection" không phản ánh CPU load. Consistent hashing mua được affinity và routing ổn định nhưng hi sinh sự đều hoàn hảo khi key skew. Round-robin rẻ nhất và dễ đoán nhất nhưng bỏ qua health và trọng số request. Không policy nào tốt nhất phổ quát — khớp nó với hình dạng request và việc downstream state có theo key hay không.
:::

:::muted
**Bẫy thường gặp** — Sticky session giúp khi instance giữ session state hoặc local cache đang nóng, nhưng nó phá phân bổ tải đều, để một cohort đông hot-spot một instance, và rớt toàn bộ user bị ghim khi instance đó chết. Anti-pattern sâu hơn là dùng stickiness để né việc làm service stateless. Hãy ưu tiên externalized state cộng policy stateless; để dành stickiness cho trường hợp đích thực như WebSocket connection đang dở.
:::

*Đào sâu tiếp — least-connections vẫn quá tải một instance có ít request nhưng nặng CPU. Làm sao để route theo tải thực thay vì connection count?*

**Từ khoá ăn điểm** — `round-robin` · `least-connections` · `consistent hashing` · `virtual nodes` · `cache affinity` · `sticky session` · `key skew`

## 4-card — senior — [Sharding, Partition Key]
**Question:** You're partitioning a multi-tenant events table across 8 shards and pick tenant_id as the partition key. One enterprise customer generates 60% of all events. Walk through why this key choice creates a hot partition and how a better key would have avoided it.
**Verdict:** KEEP — Diagnose-and-redesign partition-key question with a concrete skew scenario and a sharp locality-vs-spread trade-off.

### New answer (en)
**TL;DR** — Keying by tenant_id co-locates all of one tenant's rows on one shard, so a whale with 60% of the volume slams 60% of the load onto a single shard while seven idle — a classic hot partition. A better key spreads one tenant's writes across shards: hash a composite like (tenant_id, event_id) or (tenant_id, time-bucket). Choose a key with high cardinality and uniform access, not just uniqueness.

**How it works** — The partition key decides which shard each row lands on. tenant_id has low effective cardinality under skew — one value dominates — so hashing it can't spread that tenant. A composite key fans each tenant's events out evenly across all 8 shards because the second component (event_id, time-bucket) varies per row, restoring uniform load.

:::muted
**Trade-off** — Spreading a tenant fixes the hotspot but costs query locality: "all events for tenant X" now scatter-gathers across every shard instead of hitting one, raising read fan-out and tail latency. Co-locating keeps those reads cheap but reintroduces skew. Pick by dominant access pattern — co-locate when per-tenant reads dominate and tenants are balanced; spread when write throughput and even load matter more.
:::

:::muted
**Common pitfall** — Two deeper traps: (1) low-cardinality keys (status, country, boolean) can never spread no matter how you hash; (2) monotonic keys (auto-increment ID, timestamp) send every new write to the newest shard — a moving write hotspot. Resharding to fix a bad key in production is expensive and risky because data moves while traffic flows. Stress-test with skewed, production-shaped distributions, not uniform synthetic load.
:::

*Go deeper — you ship the composite key, then the business needs "give me this tenant's events in time order" cheaply. How do you reconcile that with the spread?*

**Keywords** — `partition key` · `hot partition` · `cardinality` · `composite key` · `time-bucket` · `scatter-gather` · `resharding`

### New answer (vi)
**Chốt** — Key theo tenant_id gom toàn bộ row của một tenant lên một shard, nên một "cá voi" chiếm 60% volume dồn 60% tải lên một shard trong khi bảy shard ngồi không — một hot partition kinh điển. Một key tốt hơn trải write của một tenant ra nhiều shard: hash một composite như (tenant_id, event_id) hoặc (tenant_id, time-bucket). Chọn key vừa cardinality cao vừa access đồng đều, không chỉ tính duy nhất.

**Cơ chế** — Partition key quyết định mỗi row đáp xuống shard nào. tenant_id có cardinality hiệu dụng thấp khi skew — một giá trị áp đảo — nên hash nó không trải nổi tenant đó. Một composite key fan event của mỗi tenant ra đều khắp 8 shard vì thành phần thứ hai (event_id, time-bucket) biến thiên theo từng row, khôi phục tải đồng đều.

:::muted
**Trade-off** — Trải một tenant fix được hotspot nhưng tốn query locality: "tất cả event của tenant X" giờ scatter-gather khắp mọi shard thay vì trúng một, làm tăng read fan-out và tail latency. Co-locate giữ các read đó rẻ nhưng tái phát skew. Chọn theo access pattern áp đảo — co-locate khi read per-tenant áp đảo và tenant cân bằng; trải ra khi write throughput và tải đều quan trọng hơn.
:::

:::muted
**Bẫy thường gặp** — Hai bẫy sâu hơn: (1) key cardinality thấp (status, country, boolean) không bao giờ trải được dù hash kiểu gì; (2) key monotonic (auto-increment ID, timestamp) gửi mọi write mới tới shard mới nhất — một write hotspot di động. Reshard để fix key tệ trong production thì tốn kém và rủi ro vì data phải di chuyển khi traffic vẫn chảy. Stress-test bằng phân phối skewed đúng hình dạng production, không phải tải synthetic đồng đều.
:::

*Đào sâu tiếp — bạn ship composite key, rồi business cần "lấy event của tenant này theo thứ tự thời gian" một cách rẻ. Làm sao dung hòa điều đó với việc trải?*

**Từ khoá ăn điểm** — `partition key` · `hot partition` · `cardinality` · `composite key` · `time-bucket` · `scatter-gather` · `resharding`

## 5-card — senior — [Read Scaling, Write Scaling]
**Question:** You've added read replicas and a cache, and reads are fast — but the primary is now saturated on writes and replication lag is climbing. Why do replicas and caching not help writes, and what are your options when writes are the bottleneck?
**Verdict:** KEEP — Strong "why" (single-primary ordering) plus a menu of write-scaling levers with trade-offs; clearly senior.

### New answer (en)
**TL;DR** — Replicas and caches scale reads because a read can be served from any copy, but every write must funnel to the single primary to preserve consistent ordering — replicas only apply that write afterward, so adding replicas actually increases write load. When writes bind, your real levers are sharding writes across multiple primaries, batching/coalescing writes, buffering bursts in queues, and write-optimized storage (LSM-tree engines).

**How it works** — One primary owns the authoritative write order; replicas replay its log, so each replica applies every write rather than absorbing any. To scale writes you must split the write path: shard so each primary owns a slice of the keyspace; batch to amortize per-write overhead; queue/write-back to absorb bursts; and pick LSM-tree storage tuned for high write throughput.

:::muted
**Trade-off** — Sharding is the only lever that truly removes the single-primary ceiling, but it sacrifices cross-shard transactions and global ordering and forces careful partition-key design. Queuing smooths bursts but adds latency and eventual consistency — the write isn't durable in the system of record the instant the client gets a 200. Match the technique to the dimension that's actually saturated.
:::

:::muted
**Common pitfall** — Piling on read replicas against a write-bound primary makes it worse: more replicas means more replication traffic and growing lag, so stale reads appear exactly when load peaks. Another is hiding write pressure behind an unbounded queue — under sustained overload it grows without limit and you've moved the failure from the database to memory exhaustion. Measure read:write split and replication lag explicitly.
:::

*Go deeper — you decide to shard the write path. How do you handle the operations that genuinely need a transaction across two shards?*

**Keywords** — `single primary` · `replication lag` · `write sharding` · `batch / coalesce` · `write-back queue` · `LSM-tree` · `eventual consistency`

### New answer (vi)
**Chốt** — Replica và cache scale read được vì một read phục vụ từ bất kỳ bản sao nào, nhưng mọi write phải dồn về primary duy nhất để giữ thứ tự nhất quán — replica chỉ apply write đó sau đó, nên thêm replica thực ra làm tăng write load. Khi write là bottleneck, các đòn bẩy thực là shard write qua nhiều primary, batch/gộp write, buffer burst trong queue, và storage tối ưu write (engine LSM-tree).

**Cơ chế** — Một primary sở hữu thứ tự write quyền uy; replica replay log của nó, nên mỗi replica apply mọi write chứ không hấp thụ cái nào. Để scale write phải tách write path: shard để mỗi primary sở hữu một lát keyspace; batch để khấu hao overhead per-write; queue/write-back để hấp thụ burst; và chọn storage LSM-tree tune cho write throughput cao.

:::muted
**Trade-off** — Sharding là đòn bẩy duy nhất thực sự gỡ trần single-primary, nhưng nó hi sinh cross-shard transaction và global ordering và buộc thiết kế partition key cẩn thận. Queue làm mượt burst nhưng thêm latency và eventual consistency — write chưa durable trong system of record ngay khoảnh khắc client nhận 200. Hãy khớp kỹ thuật với chiều thực sự đang bão hòa.
:::

:::muted
**Bẫy thường gặp** — Chất thêm read replica vào một primary đang nghẽn write làm mọi thứ tệ hơn: nhiều replica nghĩa là nhiều replication traffic và lag tăng, nên stale read xuất hiện đúng lúc tải đỉnh. Lỗi khác là giấu write pressure sau một queue không giới hạn — dưới overload kéo dài nó phình vô hạn và bạn vừa dời failure từ database sang cạn kiệt memory. Hãy đo read:write split và replication lag rõ ràng.
:::

*Đào sâu tiếp — bạn quyết định shard write path. Làm sao xử lý các thao tác thực sự cần transaction qua hai shard?*

**Từ khoá ăn điểm** — `single primary` · `replication lag` · `write sharding` · `batch / coalesce` · `write-back queue` · `LSM-tree` · `eventual consistency`

## 6-card — middle — [Database Bottleneck, Connection Pool]
**Question:** Under load you autoscale from 4 app instances to 40, but latency gets worse and you see "too many connections" errors from the database. Why did adding app instances move the pressure downstream instead of fixing it, and what's actually exhausted?
**Verdict:** KEEP — Concrete diagnosis (what's exhausted) plus the pooler fix and the "scale the saturated tier" lesson; solid middle-level.

### New answer (en)
**TL;DR** — Every app instance talks to the same database, so adding instances adds no DB capacity — it just funnels more concurrent demand into a shared resource. What's exhausted is the database's connection limit: 40 instances × a 20-connection pool = 800 connections against a Postgres tuned for ~200. The fix is to relieve the database, not add app instances.

**How it works** — The stateless app tier scales out easily, but each instance holds its own connection pool, and connections beyond the DB's limit get rejected or queued — and even accepted ones cost memory and context-switching on the DB, so latency rises. Put a connection pooler (PgBouncer) between app and DB so thousands of app-side connections multiplex onto a small number of real DB connections, resolving exhaustion without code changes.

:::muted
**Trade-off** — Beyond the pooler, the levers are caching to cut query volume, read replicas for read-heavy load, and sharding when one primary genuinely can't keep up — each adding operational complexity. Reach for the pooler and cache first; sharding is the heavyweight option you adopt only when cheaper moves are exhausted, because it reshapes your data model.
:::

:::muted
**Common pitfall** — Treating autoscaling as a universal fix and scaling the easy tier (stateless app) instead of the saturated one (database). Aggressive autoscaling can even trigger a stampede that exhausts connections faster and takes the DB down for everyone. Set per-instance pool sizes deliberately (total pool × instances must stay under the DB limit) and load-test against the database tier.
:::

*Go deeper — PgBouncer fixes connections, but at 100 instances your queries still saturate the primary's CPU. What's the next move?*

**Keywords** — `connection limit` · `connection pool` · `PgBouncer` · `multiplexing` · `transaction pooling` · `scale the saturated tier`

### New answer (vi)
**Chốt** — Mọi app instance đều nói chuyện với cùng một database, nên thêm instance không thêm capacity cho DB — nó chỉ dồn thêm nhu cầu đồng thời vào một tài nguyên chia sẻ. Thứ bị cạn kiệt là connection limit của database: 40 instance × pool 20 connection = 800 connection trên một Postgres tune cho ~200. Cách fix là giải tỏa cho database, không phải thêm app instance.

**Cơ chế** — App tier stateless scale ngang dễ, nhưng mỗi instance giữ pool riêng, và connection vượt limit của DB bị reject hoặc xếp hàng — ngay cả những cái được chấp nhận cũng tốn memory và context-switching trên DB, nên latency tăng. Đặt một connection pooler (PgBouncer) giữa app và DB để hàng nghìn connection phía app multiplex xuống một số nhỏ connection DB thật, giải quyết cạn kiệt mà không đổi code.

:::muted
**Trade-off** — Ngoài pooler, các đòn bẩy là caching để cắt query volume, read replica cho tải nặng read, và sharding khi một primary thực sự không theo kịp — mỗi cái thêm độ phức tạp vận hành. Hãy với tới pooler và cache trước; sharding là lựa chọn hạng nặng chỉ dùng khi các nước rẻ hơn đã cạn, vì nó định hình lại data model.
:::

:::muted
**Bẫy thường gặp** — Coi autoscaling như cách fix vạn năng và scale tier dễ (app stateless) thay vì tier bão hòa (database). Autoscaling quá mạnh tay thậm chí có thể kích một stampede làm cạn kiệt connection nhanh hơn và kéo DB down cho tất cả. Hãy đặt pool size per-instance có chủ đích (tổng pool × số instance phải dưới DB limit) và load-test nhằm vào database tier.
:::

*Đào sâu tiếp — PgBouncer fix connection, nhưng ở 100 instance query của bạn vẫn bão hòa CPU của primary. Nước đi tiếp theo là gì?*

**Từ khoá ăn điểm** — `connection limit` · `connection pool` · `PgBouncer` · `multiplexing` · `transaction pooling` · `scale the saturated tier`

## 7-card — staff — [Scalability, Bottleneck Analysis]
**Question:** Your product just got a deal that will grow traffic 100x over the next year. An interviewer asks: "What breaks first, and in what order, as you push this system from 1x to 100x?" How do you reason tier by tier instead of guessing?
**Verdict:** KEEP — Staff-level systems-thinking question requiring an ordered tier-by-tier mental model plus when-to-defer judgment; rich follow-ups.

### New answer (en)
**TL;DR** — At any load exactly one tier is the binding constraint; scaling it just exposes the next one, so you reason in order rather than guess. The usual sequence: app-server CPU → load balancer / DB connections → DB write path → synchronous hot paths → network egress and storage. At each step, find the current constraint with metrics, not intuition.

**How it works** — Walk the chain: (1) the single app server saturates CPU — fix with statelessness + horizontal scaling behind a load balancer; (2) the LB or single DB connection limit binds — add a pooler and read replicas; (3) the DB write path saturates — add caching, then sharding; (4) a synchronous hot path can't keep up — move work to async queues/workers; (5) network egress and storage growth dominate — add CDN, object storage, archival. Identify each binding constraint via metrics: CPU, connections, replication lag, queue depth.

:::muted
**Trade-off** — Each fix trades simplicity (and usually consistency) for capacity: replicas/caches add staleness, sharding kills cross-shard transactions, async queues turn synchronous correctness into eventual consistency. So don't pre-build for 100x on day one — over-engineering wastes effort on bottlenecks you may never hit. Make the architecture stateless and shardable early (cheap up front, brutal to retrofit), but defer actual sharding and async decomposition until metrics show a tier about to bind.
:::

:::muted
**Common pitfall** — Optimizing the wrong tier — adding app instances when the database is the constraint, which just exhausts connections faster. Subtler: moving the bottleneck without removing it — a cache that collapses into a thundering herd on cold start, a queue that grows unbounded when workers can't drain it, a CDN that still funnels every cache-miss to one origin. Always ask "if I 10x this tier, what becomes the new constraint?" and verify with load tests at projected scale.
:::

*Go deeper — you've sequenced the work, but the 100x deal lands in one quarter, not a year. Which "defer it" decisions do you now pull forward, and why?*

**Keywords** — `binding constraint` · `tier by tier` · `thundering herd` · `unbounded queue` · `shardable early, shard late` · `metrics-driven` · `move the bottleneck`

### New answer (vi)
**Chốt** — Ở bất kỳ mức tải nào luôn có đúng một tier là ràng buộc chặt; scale nó chỉ phơi bày cái tiếp theo, nên bạn suy luận theo thứ tự thay vì đoán mò. Thứ tự điển hình: CPU app server → load balancer / DB connection → write path của DB → các hot path đồng bộ → network egress và storage. Ở mỗi bước, tìm ràng buộc hiện tại bằng metric, không phải trực giác.

**Cơ chế** — Đi qua chuỗi: (1) app server đơn bão hòa CPU — fix bằng statelessness + horizontal scaling sau load balancer; (2) LB hoặc DB connection limit bind — thêm pooler và read replica; (3) write path của DB bão hòa — thêm caching, rồi sharding; (4) một hot path đồng bộ không theo kịp — chuyển việc sang async queue/worker; (5) network egress và storage growth áp đảo — thêm CDN, object storage, archival. Xác định mỗi ràng buộc chặt qua metric: CPU, connection, replication lag, queue depth.

:::muted
**Trade-off** — Mỗi fix đổi sự đơn giản (và thường consistency) lấy capacity: replica/cache thêm staleness, sharding giết cross-shard transaction, async queue biến tính đúng đắn đồng bộ thành eventual consistency. Nên đừng pre-build cho 100x ngay ngày đầu — over-engineering phí công vào bottleneck có thể không bao giờ chạm. Làm kiến trúc stateless và shardable sớm (rẻ khi làm trước, tàn khốc khi retrofit), nhưng hoãn sharding thực và phân rã async cho tới khi metric cho thấy một tier sắp bind.
:::

:::muted
**Bẫy thường gặp** — Tối ưu nhầm tier — thêm app instance khi database là ràng buộc, chỉ làm cạn kiệt connection nhanh hơn. Tinh vi hơn: dời bottleneck mà không gỡ nó — một cache sụp thành thundering herd khi cold start, một queue phình vô hạn khi worker không drain kịp, một CDN vẫn dồn mọi cache-miss về một origin. Luôn hỏi "nếu tôi 10x tier này, cái gì thành ràng buộc mới?" và verify bằng load test ở mức scale dự kiến.
:::

*Đào sâu tiếp — bạn đã sắp xếp công việc theo trình tự, nhưng deal 100x đến trong một quý chứ không phải một năm. Những quyết định "hoãn" nào giờ phải kéo lên trước, và tại sao?*

**Từ khoá ăn điểm** — `binding constraint` · `tier by tier` · `thundering herd` · `unbounded queue` · `shardable early, shard late` · `metrics-driven` · `move the bottleneck`
