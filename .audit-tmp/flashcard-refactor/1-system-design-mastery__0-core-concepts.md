# 1-system-design-mastery / 0-core-concepts
Summary: kept 9, delete 0 of 9

## 0-card — senior — [SystemDesign]
**Question:** Your service has p50 latency of 20 ms but p99 of 2 s. A fix that reduces p99 to 200 ms raises p50 to 35 ms — do you ship it?
**Verdict:** KEEP — Demands a tail-latency trade-off judgment under real traffic math, scales with seniority.

### New answer (en)
**TL;DR** — Yes, almost certainly ship it. A 10× cut in p99 for a 1.75× p50 regression is a strong trade: the slow tail hits real users, and 35 ms is still fast.

**How it works** — p99 means the worst 1 in 100 requests; at 10k RPS that's 100 requests/s hitting a 2 s wall — often real users on long-tail personalization, cold-cache paths, or retry storms. Validate with histograms (not averages), compare error-budget burn rate before vs after, and track client-side perceived latency separately so you measure the regression where it actually lands.

:::muted
**Trade-off** — Tail latency dominates as fan-out grows: a page calling 20 services sequentially has page-p99 ≈ sum of their p99s. But if the p50 regression sits on a synchronous payment or checkout step, weight by business impact, not raw percentile.
:::

:::muted
**Common pitfall** — Optimizing the average hides the tail completely. GC pauses, lock contention, and cold starts all live at the tail; chasing the mean lets SLA breaches surface only under load spikes.
:::

*Go deeper: how would you decide the p99 target itself — is it from an SLO, or from where users start abandoning?*

**Keywords:** p99 · tail latency · histogram · error-budget burn rate · fan-out

### New answer (vi)
**Chốt** — Có, gần như chắc chắn ship. Giảm p99 10× để đổi lấy p50 tệ hơn 1.75× là đánh đổi tốt: cái tail chậm đập vào người dùng thực, mà 35 ms vẫn nhanh.

**Cơ chế** — p99 là 1 trong 100 request tệ nhất; ở 10k RPS đó là 100 request/s bị chặn 2 s — thường là người dùng thực ở long-tail personalization, cold-cache, hay retry storm. Kiểm chứng bằng histogram (không phải average), so sánh error-budget burn rate trước và sau, và đo perceived latency phía client riêng để đo regression đúng nơi nó thực sự rơi vào.

:::muted
**Trade-off** — Tail latency càng quan trọng khi fan-out tăng: một trang gọi 20 service tuần tự có page-p99 ≈ tổng các p99. Nhưng nếu p50 regression nằm trên bước thanh toán/checkout đồng bộ, hãy cân theo tác động kinh doanh, không phải percentile thuần.
:::

:::muted
**Bẫy thường gặp** — Tối ưu average che giấu hoàn toàn cái tail. GC pause, lock contention, cold start đều sống ở tail; đuổi theo mean khiến vi phạm SLA chỉ lộ ra khi có spike tải.
:::

*Đào sâu tiếp: bạn quyết định chính cái mốc p99 mục tiêu thế nào — từ SLO, hay từ ngưỡng người dùng bắt đầu bỏ đi?*

**Từ khoá ăn điểm:** p99 · tail latency · histogram · error-budget burn rate · fan-out

## 1-card — senior — [SystemDesign]
**Question:** You need "four nines" availability. Your deployment pipeline currently takes the service down for 3 minutes per release. How do you make that compatible with the SLA?
**Verdict:** KEEP — Forces budget arithmetic plus a zero-downtime deployment design with migration nuance.

### New answer (en)
**TL;DR** — Four nines (99.99%) is only ~52 min/year of downtime, so a recurring 3-min deploy is unaffordable — switch to zero-downtime deployment: rolling, blue/green, or canary.

**How it works** — A weekly 3-min outage burns the entire annual budget in ~3 weeks. Rolling keeps N-1 replicas serving while one pod drains and re-joins; blue/green stands up a full new fleet and flips the load balancer atomically (instant rollback); canary shifts a small traffic slice to the new version and widens as health metrics hold. Pair any of them with health checks and automatic rollback on error-rate regression.

:::muted
**Trade-off** — Blue/green doubles infra cost during cutover; canary needs feature-flag discipline and traffic-splitting infra; rolling runs two versions at once, so your API and events must stay backward-compatible for the overlap window.
:::

:::muted
**Common pitfall** — Schema migrations break this: running two app versions against a column that was dropped or renamed 500s the old pods instantly. Use expand-contract — add the new column, backfill, ship code, and only drop the old column a release later.
:::

*Go deeper: how do you handle a long-running migration that can't finish inside one deploy window?*

**Keywords:** 99.99% · error budget · blue/green · canary · expand-contract migration

### New answer (vi)
**Chốt** — Four nines (99.99%) chỉ cho ~52 phút downtime/năm, nên một lần deploy 3 phút lặp lại là không kham nổi — chuyển sang zero-downtime deployment: rolling, blue/green hoặc canary.

**Cơ chế** — Một lần outage 3 phút mỗi tuần đốt sạch ngân sách cả năm trong ~3 tuần. Rolling giữ N-1 replica phục vụ trong khi một pod drain rồi quay lại; blue/green dựng nguyên một fleet mới và chuyển load balancer nguyên tử (rollback tức thì); canary đẩy một phần nhỏ traffic sang version mới rồi mở rộng dần khi health metric ổn. Kết hợp với health check và auto-rollback khi error-rate tăng.

:::muted
**Trade-off** — Blue/green nhân đôi chi phí hạ tầng lúc cutover; canary đòi kỷ luật feature-flag và hạ tầng traffic-splitting; rolling chạy hai version cùng lúc nên API và event phải backward-compatible suốt cửa sổ overlap.
:::

:::muted
**Bẫy thường gặp** — Schema migration làm vỡ điều này: chạy hai version app trên một column vừa bị xoá/đổi tên sẽ làm pod cũ 500 ngay. Dùng expand-contract — thêm column mới, backfill, ship code, và chỉ xoá column cũ ở release sau.
:::

*Đào sâu tiếp: bạn xử lý một migration chạy dài không kịp xong trong một cửa sổ deploy thế nào?*

**Từ khoá ăn điểm:** 99.99% · error budget · blue/green · canary · expand-contract migration

## 2-card — senior — [SystemDesign]
**Question:** Throughput is flat at 5 000 RPS even though CPU sits at 30% and you added 3× more instances. What are the likely bottlenecks and how do you diagnose them?
**Verdict:** KEEP — Classic diagnosis-under-pressure question; low CPU + no scaling gain forces reasoning about shared resources.

### New answer (en)
**TL;DR** — When horizontal scaling stops helping while CPU stays low, the bottleneck is a shared, un-scaled resource downstream — a single-writer DB, an exhausted connection pool, a per-host downstream rate limit, or a mutex-heavy in-process cache.

**How it works** — Adding stateless instances only helps if the constraint is per-instance CPU. Diagnose by following the contention: (1) check connection-pool wait time and DB max-connections; (2) look at downstream latency histograms — a dependency whose p99 climbs under load is the choke point; (3) profile thread-pool queue depth and rejected tasks; (4) check bandwidth/IOPS on the shared data tier. The signal is requests queuing somewhere they don't consume CPU.

:::muted
**Trade-off** — Blindly raising DB connection limits backfires: PostgreSQL forks a process per connection, so more connections means more memory and context-switching, not more throughput. Put a pooler (PgBouncer in transaction mode) in front to multiplex hundreds of app connections onto tens of DB ones.
:::

:::muted
**Common pitfall** — Load-testing with uniform synthetic traffic masks hot-key and serialization bottlenecks that only appear under production skew. Replay real traffic shapes, not flat uniform load.
:::

*Go deeper: how would you tell a connection-pool bottleneck apart from a downstream-dependency one from the metrics alone?*

**Keywords:** shared bottleneck · connection pool · PgBouncer · queue depth · traffic skew

### New answer (vi)
**Chốt** — Khi scale ngang hết tác dụng mà CPU vẫn thấp, bottleneck là một tài nguyên dùng chung chưa được scale ở phía sau — DB single-writer, connection pool cạn, rate limit per-host của downstream, hay in-process cache nặng mutex.

**Cơ chế** — Thêm instance stateless chỉ giúp nếu ràng buộc là CPU per-instance. Chẩn đoán bằng cách lần theo điểm tranh chấp: (1) kiểm tra connection-pool wait time và DB max-connections; (2) xem histogram latency downstream — dependency nào có p99 leo lên dưới tải là điểm nghẽn; (3) profile thread-pool queue depth và rejected task; (4) kiểm tra bandwidth/IOPS trên data tier dùng chung. Dấu hiệu là request đang xếp hàng ở nơi không tốn CPU.

:::muted
**Trade-off** — Tăng bừa DB connection limit phản tác dụng: PostgreSQL fork một process mỗi connection, nên nhiều connection nghĩa là nhiều memory và context-switch, chứ không thêm throughput. Đặt pooler (PgBouncer chế độ transaction) phía trước để ghép hàng trăm kết nối app vào hàng chục kết nối DB.
:::

:::muted
**Bẫy thường gặp** — Load test với traffic synthetic phân bố đều che giấu bottleneck hot-key và serialization vốn chỉ lộ dưới traffic skew thực tế. Hãy replay traffic shape thật, không dùng tải đều phẳng.
:::

*Đào sâu tiếp: chỉ nhìn metric, bạn phân biệt bottleneck connection-pool với bottleneck downstream-dependency thế nào?*

**Từ khoá ăn điểm:** shared bottleneck · connection pool · PgBouncer · queue depth · traffic skew

## 3-card — middle — [SystemDesign]
**Question:** You are designing a stateful service — user session state is stored in-process. What breaks when you scale horizontally, and what is the canonical fix?
**Verdict:** KEEP — Core stateless-design concept with a clear "what breaks + canonical fix" arc and a real pitfall.

### New answer (en)
**TL;DR** — In-process session state breaks because a request routed to another pod can't see it; the canonical fix is to externalize state (Redis/DynamoDB) so every pod is fungible.

**How it works** — With state in memory, horizontal scaling, rolling deploys, and pod restarts all drop sessions for whoever lands on a different replica. Two options: sticky sessions (L4/L7 affinity pins a client to one pod) or externalized state (a shared store every pod reads). Externalized state is preferred for scalable systems — pods become interchangeable, you can deploy and auto-scale without draining sessions.

:::muted
**Common pitfall** — JWTs pushed to the client look stateless, but if you keep a revocation blocklist in-process you've quietly re-introduced in-process state under a new name — the blocklist must be externalized too.
:::

*Go deeper: when would sticky sessions actually be the right call despite the downsides?*

**Keywords:** stateless · sticky session · externalized state · Redis · fungible pods

### New answer (vi)
**Chốt** — Session state in-process vỡ vì một request route sang pod khác không thấy nó; giải pháp chuẩn là externalize state (Redis/DynamoDB) để mọi pod đều fungible.

**Cơ chế** — Khi state nằm trong memory, scale ngang, rolling deploy và pod restart đều làm mất session của ai rơi vào replica khác. Hai lựa chọn: sticky session (L4/L7 affinity ghim client vào một pod) hoặc externalized state (một store chung mọi pod đọc được). Externalized state là lựa chọn ưu tiên cho hệ thống scalable — pod trở nên thay thế lẫn nhau, bạn deploy và auto-scale mà không cần drain session.

:::muted
**Bẫy thường gặp** — JWT đẩy về client trông như stateless, nhưng nếu bạn giữ blocklist thu hồi token in-process thì bạn đã âm thầm tái tạo in-process state dưới tên khác — blocklist cũng phải externalize.
:::

*Đào sâu tiếp: khi nào sticky session thực sự là lựa chọn đúng dù có nhược điểm?*

**Từ khoá ăn điểm:** stateless · sticky session · externalized state · Redis · fungible pods

## 4-card — senior — [SystemDesign]
**Question:** In a back-of-envelope estimate, your interviewer says "that math seems off by an order of magnitude." Walk through how you would sanity-check your storage estimate for a social-media photo service with 100 M daily active users.
**Verdict:** KEEP — Estimation-under-challenge question; tests anchoring, write amplification, and cross-checking against reality.

### New answer (en)
**TL;DR** — Re-derive from anchored numbers and the most likely missing factor is write amplification — replication and derived artifacts (thumbnails, transcodes) — which alone can make a naive estimate 3–5× too low.

**How it works** — Anchor: a compressed phone JPEG is ~3 MB. If 10% of DAU upload 2 photos/day: 100M × 0.1 × 2 × 3 MB = 60 TB/day raw ≈ 22 PB/year. Apply 3× replication = 66 PB, add ~4 thumbnail sizes (~40%) → ~90 PB/year. Cross-check against a known reference (Instagram-class growth is ~100 PB/year), which confirms ~90 PB is plausible. The interviewer is usually flagging a dropped replication factor or the assumption that CDN edges reduce origin storage (they don't — they cache it).

:::muted
**Trade-off** — Switching JPEG → WebP/AVIF gives 30–50% better compression at equal quality, roughly halving storage — at the cost of extra encode CPU at upload and weaker client support.
:::

:::muted
**Common pitfall** — Forgetting write amplification (replication, RAID, thumbnails, transcodes) is the most common estimation error. Multiply raw storage by at least 3× for replication and ~1.5× for derived artifacts before quoting a number.
:::

*Go deeper: how would your estimate change if you had to keep all originals hot vs. tiering cold ones to glacier-class storage?*

**Keywords:** back-of-envelope · anchoring · write amplification · replication factor · cross-check

### New answer (vi)
**Chốt** — Tính lại từ số liệu đã neo, và yếu tố hay bị bỏ sót nhất là write amplification — replication và derived artifact (thumbnail, transcode) — riêng nó đã có thể khiến ước tính ngây thơ thấp hơn thực tế 3–5×.

**Cơ chế** — Neo: ảnh JPEG điện thoại nén ~3 MB. Nếu 10% DAU upload 2 ảnh/ngày: 100M × 0.1 × 2 × 3 MB = 60 TB/ngày thô ≈ 22 PB/năm. Nhân 3× replication = 66 PB, thêm ~4 size thumbnail (~40%) → ~90 PB/năm. Cross-check với mốc đã biết (tăng trưởng cỡ Instagram ~100 PB/năm) xác nhận ~90 PB là hợp lý. Interviewer thường đang chỉ ra bạn rớt replication factor hoặc giả định CDN edge giảm origin storage (không — nó chỉ cache).

:::muted
**Trade-off** — Đổi JPEG → WebP/AVIF nén tốt hơn 30–50% cùng chất lượng, giảm storage khoảng một nửa — đổi lại tốn CPU encode lúc upload và client support yếu hơn.
:::

:::muted
**Bẫy thường gặp** — Quên write amplification (replication, RAID, thumbnail, transcode) là lỗi ước tính phổ biến nhất. Nhân storage thô với ít nhất 3× cho replication và ~1.5× cho derived artifact trước khi đưa ra con số.
:::

*Đào sâu tiếp: ước tính thay đổi thế nào nếu phải giữ tất cả ảnh gốc ở hot storage so với tiering ảnh nguội xuống storage cỡ glacier?*

**Từ khoá ăn điểm:** back-of-envelope · anchoring · write amplification · replication factor · cross-check

## 5-card — senior — [SystemDesign]
**Question:** Vertical scaling "solved" your performance problem in staging but not in production at 10× the load. What architectural assumptions does vertical scaling violate?
**Verdict:** KEEP — Probes the hidden assumptions of scale-up vs scale-out; invites real design reasoning and blast-radius judgment.

### New answer (en)
**TL;DR** — Vertical scaling assumes the bottleneck is single-process CPU/RAM on one box. It breaks when the real limit is I/O, the data tier, or OS/runtime ceilings — none of which a bigger machine relieves.

**How it works** — A bigger box still has one NIC and one disk controller, so I/O-bound work doesn't scale; doubling app-server CPU does nothing if the DB is at max IOPS; and OS/runtime limits bite (per-process fd limits, JVM GC pauses that grow super-linearly with heap). Staging passed because its load never hit those ceilings; production at 10× does. Vertical scaling is a fine stopgap for 2–5× growth, not a long-term design.

:::muted
**Trade-off** — Scale-up is operationally simpler: no sharding, no distributed coordination, and for a stateful DB it avoids distributed transactions entirely. Running a larger single DB and deferring horizontal sharding until you hit the vertical ceiling is often the correct call.
:::

:::muted
**Common pitfall** — Bigger instances mean a bigger blast radius: one node carrying 10× the traffic turns a crash into 10× the outage. A single-instance DB with no replica is a SPOF — always pair scale-up with a standby replica.
:::

*Go deeper: at what signal would you commit to horizontal sharding instead of buying the next-bigger instance?*

**Keywords:** scale-up vs scale-out · I/O bound · IOPS ceiling · GC pause · blast radius · SPOF

### New answer (vi)
**Chốt** — Vertical scaling giả định bottleneck là CPU/RAM single-process trên một máy. Nó vỡ khi giới hạn thật là I/O, data tier, hay trần OS/runtime — những thứ máy to hơn không gỡ được.

**Cơ chế** — Máy to hơn vẫn chỉ có một NIC, một disk controller nên việc I/O-bound không scale; nhân đôi CPU app-server vô nghĩa nếu DB đã max IOPS; và giới hạn OS/runtime phát huy (fd limit per-process, JVM GC pause tăng phi tuyến theo heap). Staging pass vì tải chưa chạm trần đó; production ở 10× thì chạm. Vertical scaling là giải pháp tình thế tốt cho tăng 2–5×, không phải thiết kế dài hạn.

:::muted
**Trade-off** — Scale-up đơn giản về vận hành: không sharding, không phối hợp phân tán, và với DB stateful nó tránh hẳn distributed transaction. Chạy một DB lớn hơn và hoãn sharding ngang đến khi chạm trần vertical thường là quyết định đúng.
:::

:::muted
**Bẫy thường gặp** — Instance lớn nghĩa là blast radius lớn: một node gánh 10× traffic biến một lần crash thành outage 10×. DB single-instance không replica là SPOF — luôn kết hợp scale-up với standby replica.
:::

*Đào sâu tiếp: tín hiệu nào khiến bạn quyết định sharding ngang thay vì mua instance to hơn nữa?*

**Từ khoá ăn điểm:** scale-up vs scale-out · I/O bound · IOPS ceiling · GC pause · blast radius · SPOF

## 6-card — senior — [SystemDesign]
**Question:** How does "latency vs throughput" become a concrete design decision when choosing between synchronous RPC and asynchronous messaging?
**Verdict:** KEEP — Turns an abstract trade-off into a concrete sync-vs-async decision with operational consequences.

### New answer (en)
**TL;DR** — Sync RPC optimizes single-request latency (caller blocks for an immediate answer); async messaging optimizes throughput and decoupling (producer returns instantly, consumer processes at its own pace). Pick sync for user-facing reads that need an answer now, async for side-effects where eventual processing is fine.

**How it works** — With sync RPC, end-to-end latency is the sum of processing across every hop and the caller is coupled to all of them. With async, the producer's latency is just the enqueue, but consumer time-to-process is unbounded and non-deterministic — you trade an immediate result for capacity to absorb spikes. So a checkout confirmation stays sync; sending email, updating a search index, or retrying a charge goes async.

:::muted
**Trade-off** — Async buys decoupling and burst tolerance but adds operational complexity: ordering, idempotency, dead-letter queues, consumer-lag monitoring. Sync is easier to reason about and trace, but couples services so a slow downstream propagates latency upstream as a cascading slowdown.
:::

:::muted
**Common pitfall** — Mixing the two inconsistently yields "fire and forget" bugs: the caller assumes the async op completes, but nothing monitors it. Messages pile up in a dead-letter queue for weeks and user data goes silently stale.
:::

*Go deeper: where would you put the sync/async boundary in a "place order" flow, and why?*

**Keywords:** sync RPC · async messaging · decoupling · idempotency · dead-letter queue · consumer lag

### New answer (vi)
**Chốt** — Sync RPC tối ưu latency một request (caller block chờ câu trả lời ngay); async messaging tối ưu throughput và decoupling (producer return tức thì, consumer xử lý theo nhịp riêng). Chọn sync cho user-facing read cần trả lời ngay, async cho side-effect mà xử lý eventual là chấp nhận được.

**Cơ chế** — Với sync RPC, end-to-end latency là tổng thời gian xử lý qua mọi hop và caller bị coupling với tất cả. Với async, latency của producer chỉ là enqueue, nhưng time-to-process của consumer không bị chặn và không xác định — bạn đổi kết quả tức thì lấy khả năng hấp thụ spike. Nên xác nhận checkout giữ sync; gửi email, cập nhật search index, hay retry charge thì async.

:::muted
**Trade-off** — Async mua được decoupling và chịu burst nhưng thêm độ phức tạp vận hành: ordering, idempotency, dead-letter queue, monitoring consumer-lag. Sync dễ reason và trace hơn, nhưng coupling service chặt nên downstream chậm propagate latency ngược lên thành cascading slowdown.
:::

:::muted
**Bẫy thường gặp** — Trộn hai kiểu không nhất quán sinh bug "fire and forget": caller giả định async op hoàn thành nhưng không ai monitor. Message dồn trong dead-letter queue hàng tuần và dữ liệu người dùng stale âm thầm.
:::

*Đào sâu tiếp: bạn đặt ranh giới sync/async ở đâu trong luồng "đặt đơn hàng", và vì sao?*

**Từ khoá ăn điểm:** sync RPC · async messaging · decoupling · idempotency · dead-letter queue · consumer lag

## 7-card — middle — [SystemDesign]
**Question:** Your back-of-envelope estimate for a URL shortener shows 100 B URLs over 5 years. How does that figure drive every subsequent design decision?
**Verdict:** KEEP — Shows how one estimate cascades into storage, key-space, caching, and sharding decisions.

### New answer (en)
**TL;DR** — 100B rows ≈ 50 TB rules out a single relational node, forces sharding, sets the short-code length, and — given the read-heavy ratio — mandates a cache in front of the DB.

**How it works** — At ~500 bytes/row, 100B rows ≈ 50 TB, well past a single PostgreSQL node's practical hot-data ceiling (~5–10 TB), so you shard (hash on short code). The code namespace needs ≥ log62(100B) ≈ 7 chars (62^7 ≈ 3.5T) to fit. Reads dominate writes ~100:1, so a Redis/Memcached cache at ~95% hit rate fronts the DB to avoid overload, and the redirect latency target decides whether you need in-region cache or CDN-edge redirects.

:::muted
**Common pitfall** — Forgetting analytics alongside the redirect path. A naive row-per-click at 10k RPS is ~864M writes/day, which crushes a relational DB — decouple click tracking into an event stream (Kafka → ClickHouse/BigQuery) processed asynchronously.
:::

*Go deeper: would you pre-generate codes from a distributed ID generator or hash the URL — what does each cost you?*

**Keywords:** capacity estimate · base62 · 100:1 read:write · cache hit rate · sharding · event stream

### New answer (vi)
**Chốt** — 100B row ≈ 50 TB loại bỏ một node quan hệ đơn lẻ, ép phải sharding, định độ dài short-code, và — với tỉ lệ đọc nặng — bắt buộc đặt cache trước DB.

**Cơ chế** — Ở ~500 byte/row, 100B row ≈ 50 TB, vượt xa trần hot-data thực tế của một node PostgreSQL (~5–10 TB), nên bạn sharding (hash theo short code). Không gian code cần ≥ log62(100B) ≈ 7 ký tự (62^7 ≈ 3.5T) để chứa đủ. Read áp đảo write ~100:1, nên cache Redis/Memcached với ~95% hit rate đứng trước DB để tránh overload, và mục tiêu redirect latency quyết định cần in-region cache hay redirect ở CDN-edge.

:::muted
**Bẫy thường gặp** — Quên analytics bên cạnh redirect path. Ghi ngây thơ một row mỗi click ở 10k RPS là ~864M write/ngày, đè bẹp relational DB — tách click tracking vào event stream (Kafka → ClickHouse/BigQuery) xử lý bất đồng bộ.
:::

*Đào sâu tiếp: bạn pre-generate code từ distributed ID generator hay hash URL — mỗi cách phải trả giá gì?*

**Từ khoá ăn điểm:** capacity estimate · base62 · 100:1 read:write · cache hit rate · sharding · event stream

## 8-card — senior — [SystemDesign]
**Question:** Explain the "availability nines" framework and how you use it to push back on unrealistic SLA requirements from a product manager.
**Verdict:** KEEP — Combines the nines math with a stakeholder-negotiation and SLO-measurement design judgment.

### New answer (en)
**TL;DR** — Translate "nines" into concrete downtime and cost, then push back by tiering: 99.9% = 8.7 h/yr, 99.99% = 52 min/yr, 99.999% = 5 min/yr, with each nine costing ~10× more. Ask which flows truly need it rather than blanketing the whole system.

**How it works** — Make "five nines" tangible for the PM: 5 min/year means zero-downtime deploys, automated failover under 30 s, active-active multi-region, and chaos engineering. Then differentiate by user journey — core checkout might warrant 99.99%, the help-center CMS 99.9% — so you spend redundancy only where it pays. The framework is a negotiation tool: it converts an aspirational number into a concrete bill of work.

:::muted
**Trade-off** — Active-active multi-region forces either synchronous cross-region replication (60–150 ms RTT penalty on writes) or eventual consistency with conflict resolution. Five-nines on stateful data is a fundamental distributed-systems problem, not a Kubernetes config tweak.
:::

:::muted
**Common pitfall** — Quoting an SLA without measuring an SLO. Many teams claim 99.99% but measure "is the load balancer responding?" instead of "does the user's core flow work end-to-end?" Define the SLO around the user journey via synthetic monitoring, not a binary up/down ping.
:::

*Go deeper: how would you set the error budget and what happens operationally when a team burns through it mid-quarter?*

**Keywords:** availability nines · SLA vs SLO · error budget · active-active · synthetic monitoring

### New answer (vi)
**Chốt** — Dịch "nines" thành downtime và chi phí cụ thể, rồi phản bác bằng cách phân tầng: 99.9% = 8.7 giờ/năm, 99.99% = 52 phút/năm, 99.999% = 5 phút/năm, mỗi nine tốn gấp ~10×. Hỏi luồng nào thực sự cần thay vì phủ cả hệ thống.

**Cơ chế** — Làm "five nines" trở nên cụ thể với PM: 5 phút/năm nghĩa là zero-downtime deploy, automated failover dưới 30 s, active-active multi-region và chaos engineering. Rồi phân biệt theo hành trình người dùng — checkout core có thể cần 99.99%, CMS help-center thì 99.9% — để chi redundancy đúng nơi đáng. Framework này là công cụ đàm phán: nó biến một con số tham vọng thành bảng công việc cụ thể.

:::muted
**Trade-off** — Active-active multi-region buộc hoặc synchronous cross-region replication (penalty 60–150 ms RTT cho write) hoặc eventual consistency với conflict resolution. Five-nines trên dữ liệu stateful là vấn đề distributed-systems cơ bản, không phải tinh chỉnh Kubernetes config.
:::

:::muted
**Bẫy thường gặp** — Tuyên bố SLA mà không đo SLO. Nhiều team tuyên bố 99.99% nhưng đo "load balancer có respond không?" thay vì "luồng core của người dùng có hoạt động end-to-end không?" Định nghĩa SLO quanh hành trình người dùng qua synthetic monitoring, không phải ping up/down nhị phân.
:::

*Đào sâu tiếp: bạn đặt error budget thế nào, và về vận hành điều gì xảy ra khi một team đốt hết nó giữa quý?*

**Từ khoá ăn điểm:** availability nines · SLA vs SLO · error budget · active-active · synthetic monitoring
