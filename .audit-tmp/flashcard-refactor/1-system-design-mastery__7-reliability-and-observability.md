# 1-system-design-mastery / 7-reliability-and-observability
Summary: kept 8, delete 0 of 8

## 0-card — middle — [Observability, SystemDesign]
**Question:** An incident is live: error rate jumped 30 minutes ago and you have metrics, logs, and traces all wired up. Which signal do you reach for first, and why is it the wrong move to start by grepping logs?
**Verdict:** KEEP — Forces a reasoned ordering of the three pillars under incident pressure, not a single fact.

### New answer (en)
**TL;DR** — Reach for metrics first: they instantly localise the blast radius (which service/endpoint/region). Logs come last because under a spike you would be grepping gigabytes with no idea which service to filter to.

**How it works** — The three pillars answer different questions in order. Metrics are pre-aggregated time-series, so a dashboard shows *where* the error spike lives and whether latency or saturation moved with it. Once metrics narrow the suspect, follow one failing request through a trace to find the exact hop that broke. Only then drill into logs for the *why* — the stack trace or bad payload on that specific span. Metrics say where, traces say the path, logs say the detail.

:::muted
**Trade-off** — Each pillar trades fidelity for cost. Metrics are cheap and fast but lossy — you cannot recover an individual request from a counter. Logs are high-fidelity but expensive to store and slow to search. Traces sit between but add propagation overhead and are usually sampled, so the one request you want may not have been recorded.
:::

:::muted
**Common pitfall** — Promoting high-cardinality fields (user_id, request_id) to metric labels: one unbounded dimension multiplies time-series into the millions and can take down the monitoring backend before it ever helps you debug.
:::

*Go deeper: how would you pick the sampling strategy so the trace you need during an incident is actually there?*

**Keywords** — `metrics → traces → logs` · `blast radius` · `high-cardinality labels` · `pre-aggregated time-series`

### New answer (vi)
**Chốt** — Dùng metrics trước: chúng khoanh vùng blast radius ngay lập tức (service/endpoint/region nào). Logs để cuối cùng vì khi đang có spike, grep logs nghĩa là search hàng gigabyte mà không biết lọc theo service nào.

**Cơ chế** — Ba pillar trả lời các câu hỏi khác nhau theo thứ tự. Metrics là time-series đã pre-aggregate, nên một dashboard cho thấy ngay error spike nằm *ở đâu* và latency hay saturation có dịch chuyển cùng không. Sau khi metrics thu hẹp nghi phạm, bám theo một request lỗi qua một trace để tìm đúng hop bị hỏng. Chỉ tới lúc đó mới đào vào logs để biết *tại sao* — stack trace hay payload sai trên đúng span đó. Metrics cho biết ở đâu, traces cho biết đường đi, logs cho biết chi tiết.

:::muted
**Trade-off** — Mỗi pillar đánh đổi độ chi tiết lấy chi phí. Metrics rẻ và nhanh nhưng lossy — không thể khôi phục một request riêng lẻ từ một counter. Logs chi tiết cao nhưng tốn lưu trữ và chậm khi search. Traces nằm giữa nhưng thêm overhead propagation và thường bị sampling, nên đúng request bạn cần có thể đã không được ghi lại.
:::

:::muted
**Bẫy thường gặp** — Biến field high-cardinality (user_id, request_id) thành metric label: một chiều không giới hạn nhân số time-series lên hàng triệu và có thể đánh sập monitoring backend trước khi nó kịp giúp bạn debug.
:::

*Đào sâu tiếp: bạn chọn chiến lược sampling thế nào để đúng trace cần lúc sự cố thực sự còn nằm đó?*

**Từ khoá ăn điểm** — `metrics → traces → logs` · `blast radius` · `high-cardinality labels` · `time-series pre-aggregate`

## 1-card — senior — [SLO, Reliability]
**Question:** Your team promises 99.9% availability but the only alert fires when success rate drops below 99.9% in the last 5 minutes — it pages constantly during tiny blips yet stayed silent through a slow 6-hour degradation. How do you fix the alerting?
**Verdict:** KEEP — Genuine senior design problem about SLO/error-budget/burn-rate alerting with real trade-offs.

### New answer (en)
**TL;DR** — Drop the static per-window threshold and alert on multi-window burn rate against an error budget: a fast-burn window catches sudden outages and a slow-burn window catches the 6-hour drift, while pairing short with long windows stops transient blips from paging.

**How it works** — A 99.9% SLO over 30 days is a budget of ~43 minutes of downtime; burn rate is how fast you consume it. Page on a fast burn (e.g. 14.4× over 1 hour — would exhaust a month's budget in ~2 days) AND a slow burn (e.g. 3× over 6 hours). Each alert pairs a long detection window with a short window that must also be burning, so a blip that recovers never pages. The SLI must proxy user happiness — measure good events / valid events at the load balancer, not raw server-side CPU.

:::muted
**Trade-off** — Burn-rate alerting trades simplicity for tunability: more config (windows, thresholds, the budget) and a clean SLI, but pages become proportional to user impact instead of noise. A tighter SLO buys trust but shrinks the budget for risky deploys; the contractual SLA is deliberately looser than the internal SLO so there is margin before penalties are owed.
:::

:::muted
**Common pitfall** — Setting the SLO to 100% leaves zero budget, so every deploy is a violation and the org freezes. Averaging availability over too long a window hides a 6-hour outage inside a "still 99.9% this month" number — exactly the failure described.
:::

*Go deeper: how do you choose the burn-rate multiplier and window length for each alert tier?*

**Keywords** — `error budget` · `multi-window burn rate` · `SLI good/valid events` · `SLO vs SLA`

### New answer (vi)
**Chốt** — Bỏ threshold tĩnh theo từng window và alert trên burn rate nhiều window dựa trên error budget: một window burn-nhanh bắt outage đột ngột, một window burn-chậm bắt đợt degradation 6 giờ, còn ghép window ngắn với dài để blip thoáng qua không gây page.

**Cơ chế** — SLO 99.9% trong 30 ngày là budget khoảng ~43 phút downtime; burn rate là tốc độ bạn tiêu hết nó. Page khi burn nhanh (ví dụ 14.4× trong 1 giờ — ngốn hết budget cả tháng trong ~2 ngày) VÀ khi burn chậm (ví dụ 3× trong 6 giờ). Mỗi alert ghép một window dài để phát hiện với một window ngắn cũng phải đang burn, nên một blip tự hồi phục không bao giờ page. SLI phải là proxy cho sự hài lòng của user — đo good events / valid events ở load balancer, không phải CPU thô phía server.

:::muted
**Trade-off** — Burn-rate alerting đánh đổi sự đơn giản lấy khả năng tinh chỉnh: nhiều cấu hình hơn (window, threshold, chính cái budget) và một SLI sạch, nhưng page tỉ lệ thuận với tác động lên user thay vì với noise. SLO chặt hơn mua niềm tin nhưng thu hẹp budget cho deploy mạo hiểm; SLA hợp đồng cố tình lỏng hơn SLO nội bộ để có biên trước khi phải đền tiền.
:::

:::muted
**Bẫy thường gặp** — Đặt SLO bằng 100% để lại budget bằng 0, nên mọi deploy đều là vi phạm và cả tổ chức bị đóng băng. Lấy trung bình availability trên window quá dài giấu một outage 6 giờ bên trong con số "vẫn 99.9% tháng này" — đúng như failure được mô tả.
:::

*Đào sâu tiếp: bạn chọn hệ số burn-rate và độ dài window cho mỗi tầng alert thế nào?*

**Từ khoá ăn điểm** — `error budget` · `multi-window burn rate` · `SLI good/valid events` · `SLO vs SLA`

## 2-card — senior — [HealthCheck, Resilience]
**Question:** Your shared Postgres has a 5-second hiccup. Suddenly every pod across all your services is marked unready and removed from rotation at once, taking the whole platform down for a transient blip. What did the health checks get wrong?
**Verdict:** KEEP — Diagnoses a correlated-failure anti-pattern in liveness/readiness probe design; strong senior depth.

### New answer (en)
**TL;DR** — The readiness probe did a deep check that pinged the shared database, so one dependency blip flipped every pod unready at once — a self-inflicted correlated outage. Probes must reflect only what the instance itself controls.

**How it works** — Separate the two probes by intent. Liveness answers "is this process wedged and does it need a restart?" — it must be shallow and self-contained (a deadlock detector, never a dependency call). Readiness answers "can this instance serve traffic right now?" and should reflect only this instance's own state. For a shared critical dependency, let requests fail fast with proper timeouts and circuit breakers rather than yanking the whole fleet out of rotation: degrade, do not disappear.

:::muted
**Trade-off** — A deep readiness check catches a genuinely broken dependency early and stops routing doomed requests, but it couples instance health to shared-resource health, turning one slow dependency into a fleet-wide failure. A shallow check keeps instances in rotation through blips (better availability) at the cost of briefly serving some errors while the dependency recovers.
:::

:::muted
**Common pitfall** — A dependency call in the *liveness* probe is worst case: a slow DB triggers restarts → cold caches and reconnection storms → DB slows further → death spiral. A readiness check shared by all replicas flips them in lockstep — no graceful partial degradation, only all-or-nothing collapse.
:::

*Go deeper: how would you keep some pods serving while a shared dependency is degraded — load-shedding, or per-instance breakers?*

**Keywords** — `liveness vs readiness` · `shallow check` · `correlated failure` · `circuit breaker · fail fast`

### New answer (vi)
**Chốt** — Readiness probe làm deep check ping vào database dùng chung, nên một blip dependency lật mọi pod sang unready cùng lúc — một correlated outage tự gây ra. Probe chỉ nên phản ánh thứ mà bản thân instance kiểm soát.

**Cơ chế** — Tách hai probe theo mục đích. Liveness trả lời "process này có bị kẹt và cần restart không?" — phải nông và tự chứa (phát hiện deadlock, không bao giờ gọi dependency). Readiness trả lời "instance này có phục vụ traffic ngay bây giờ được không?" và chỉ nên phản ánh trạng thái riêng của instance. Với một dependency dùng chung quan trọng, hãy để request fail fast bằng timeout và circuit breaker đúng cách thay vì giật cả fleet ra khỏi rotation: degrade chứ đừng biến mất.

:::muted
**Trade-off** — Deep readiness check bắt sớm một dependency thực sự hỏng và ngừng route các request chắc chắn lỗi, nhưng nó gắn instance health vào sức khỏe của shared resource, biến một dependency chậm thành failure toàn fleet. Check nông giữ instance trong rotation qua các blip (availability tốt hơn) với cái giá là phục vụ vài lỗi trong chốc lát khi dependency hồi phục.
:::

:::muted
**Bẫy thường gặp** — Một lời gọi dependency trong *liveness* probe là tệ nhất: DB chậm kích hoạt restart → cold cache và bão reconnect → DB chậm thêm → vòng xoáy tử thần. Readiness check chung cho mọi replica khiến chúng lật đồng loạt — không có partial degradation mượt mà, chỉ có sụp đổ all-or-nothing.
:::

*Đào sâu tiếp: bạn giữ một số pod vẫn phục vụ khi dependency dùng chung bị degrade bằng cách nào — load-shedding hay breaker per-instance?*

**Từ khoá ăn điểm** — `liveness vs readiness` · `shallow check` · `correlated failure` · `circuit breaker · fail fast`

## 3-card — middle — [Alerting, Observability]
**Question:** Your on-call rotation gets 200 pages a week and engineers have started ignoring them. Most fire on things like "CPU > 80%" or "disk queue high" but users rarely notice. How do you redesign the alerts?
**Verdict:** KEEP — Symptom-vs-cause alerting design with the alert-fatigue failure mode; real middle/senior depth.

### New answer (en)
**TL;DR** — Page on symptoms (user-visible pain), not causes. "CPU > 80%" can be perfectly healthy under load; what matters is whether requests are slow, failing, or dropped — so page on the RED signals and demote resource metrics to dashboards.

**How it works** — For request-driven services page on RED — Rate (traffic), Errors (failed requests), Duration (latency) — because they map directly to what users feel. Keep cause-based USE metrics (Utilization, Saturation, Errors of a resource) as diagnostics for *after* a symptom alert fires, not as paging triggers. Every page should be actionable, urgent, and tied to an SLO; everything else becomes a ticket or a dashboard.

:::muted
**Trade-off** — Symptom-based alerting slashes page volume and keeps on-call sane, but you lose early warning — by the time errors climb, users are already hit. Cause-based alerts give a head start (disk filling) but generate huge noise since resources routinely run hot harmlessly. Pragmatic blend: page on symptoms, add a few predictive cause alerts only where lead time genuinely prevents an outage.
:::

:::muted
**Common pitfall** — Alert fatigue is itself a failure mode: 200 pages a week train engineers to mute, so the one real outage is ignored too. The fix is deleting non-actionable alerts and consolidating duplicates from a single root cause, not adding more. A flapping threshold with no hysteresis (firing/resolving every minute) is a top offender — add for-duration conditions and dedup.
:::

*Go deeper: which few cause-based alerts would you keep, and how do you set their lead time?*

**Keywords** — `symptom vs cause` · `RED method` · `USE method` · `actionable · tied to SLO` · `hysteresis · for-duration`

### New answer (vi)
**Chốt** — Page trên symptom (nỗi đau user thấy được), không phải cause. "CPU > 80%" có thể hoàn toàn khỏe mạnh dưới tải; điều quan trọng là request có chậm, lỗi, hay bị drop không — nên page trên các tín hiệu RED và hạ resource metric xuống làm dashboard.

**Cơ chế** — Với service hướng request, page trên RED — Rate (traffic), Errors (request lỗi), Duration (latency) — vì chúng ánh xạ trực tiếp tới thứ user cảm nhận. Giữ các USE metric theo cause (Utilization, Saturation, Errors của resource) làm công cụ chẩn đoán cho *sau* khi một symptom alert kêu, không phải làm trigger để page. Mỗi page phải actionable, khẩn cấp và gắn với một SLO; còn lại biến thành ticket hoặc dashboard.

:::muted
**Trade-off** — Alerting theo symptom giảm mạnh lượng page và giữ on-call tỉnh táo, nhưng bạn mất cảnh báo sớm — đến lúc error leo lên thì user đã bị ảnh hưởng. Alert theo cause cho khởi đầu sớm (disk đang đầy) nhưng tạo noise khổng lồ vì resource thường chạy nóng vô hại. Cách pha trộn thực dụng: page trên symptom, thêm một số ít alert dự báo theo cause chỉ ở nơi lead time thực sự ngăn được outage.
:::

:::muted
**Bẫy thường gặp** — Alert fatigue tự nó là một failure mode: 200 page mỗi tuần huấn luyện kỹ sư bấm mute, nên một outage thật cũng bị bỏ qua theo. Cách sửa là xóa alert non-actionable và gộp các bản trùng cùng root cause, không phải thêm alert. Một threshold flapping không có hysteresis (kêu rồi resolve mỗi phút) là thủ phạm hàng đầu — thêm điều kiện for-duration và dedup.
:::

*Đào sâu tiếp: bạn giữ lại vài alert theo cause nào, và đặt lead time cho chúng ra sao?*

**Từ khoá ăn điểm** — `symptom vs cause` · `RED method` · `USE method` · `actionable · gắn SLO` · `hysteresis · for-duration`

## 4-card — junior — [Latency, Observability]
**Question:** A dashboard shows your average response time is a healthy 50 ms, yet users keep complaining the app feels slow. Your manager asks why the average looks fine but people are unhappy — what do you check and explain?
**Verdict:** KEEP — A "why does the average lie" question that a junior and a senior answer at very different depths; teaches percentiles.

### New answer (en)
**TL;DR** — The average hides the tail. Look at percentiles instead: a 50 ms average can sit happily next to a p99 of 3 s if a small slice of requests is very slow — and those slow requests land on real users.

**How it works** — p50 (median) is the typical request: half faster, half slower. p95 means 95% of requests finish within that time and 5% are worse; p99 is the worst 1 in 100. Slow requests cluster on real conditions — cold caches, big accounts, contended locks — so they hurt actual users even when the mean looks fine. Plot p95 and p99 alongside the average and you see the pain the average smeared away.

:::muted
**Trade-off** — Averages are cheap and intuitive but a single very slow request barely moves the mean, so they systematically understate user pain. Percentiles surface the tail but cost more to compute and store (you need histograms, and you cannot average two p99s across servers). Tracking p50/p95/p99 together gives the full shape without drowning in detail.
:::

*Go deeper: with fan-out — one page making 10 backend calls each 1% likely to be slow — the chance the page hits at least one slow call is ~1 − 0.99¹⁰ ≈ 10%, so a rare per-service tail becomes a common per-page experience.*

**Keywords** — `p50 · p95 · p99` · `tail latency` · `percentiles not averages` · `histograms`

### New answer (vi)
**Chốt** — Average che giấu phần tail. Hãy nhìn vào percentile: một average 50 ms hoàn toàn có thể nằm cạnh một p99 là 3 s nếu một lát nhỏ request rất chậm — và những request chậm đó rơi vào user thật.

**Cơ chế** — p50 (median) là request điển hình: một nửa nhanh hơn, một nửa chậm hơn. p95 nghĩa là 95% request hoàn thành trong khoảng đó và 5% tệ hơn; p99 là 1 trong 100 request tệ nhất. Request chậm tập trung vào các tình huống thật — cold cache, account lớn, lock bị tranh chấp — nên chúng làm đau user thật ngay cả khi mean trông ổn. Vẽ p95 và p99 cạnh average và bạn sẽ thấy nỗi đau mà average đã bôi nhòe đi.

:::muted
**Trade-off** — Average rẻ và trực quan nhưng một request rất chậm gần như không dịch chuyển được mean, nên nó hệ thống hóa việc đánh giá thấp nỗi đau của user. Percentile làm lộ ra tail nhưng tốn kém hơn để tính và lưu (bạn cần histogram, và không thể lấy trung bình hai p99 giữa các server). Theo dõi p50/p95/p99 cùng nhau cho thấy toàn bộ hình dạng mà không chìm trong chi tiết.
:::

*Đào sâu tiếp: với fan-out — một trang gọi 10 backend, mỗi cái 1% khả năng chậm — xác suất trang dính ít nhất một call chậm xấp xỉ 1 − 0.99¹⁰ ≈ 10%, nên một tail hiếm ở mỗi service thành trải nghiệm phổ biến ở mỗi trang.*

**Từ khoá ăn điểm** — `p50 · p95 · p99` · `tail latency` · `percentile không phải average` · `histogram`

## 5-card — senior — [Resilience, Reliability]
**Question:** A downstream payment service gets briefly overloaded. Your service retries failed calls 3 times immediately, and within seconds the downstream is buried under 4× its normal traffic and never recovers. What went wrong and how do you make the client resilient?
**Verdict:** KEEP — Classic retry-storm diagnosis demanding the full resilience-pattern stack; strong senior depth.

### New answer (en)
**TL;DR** — Immediate retries created a retry storm: every client tripled load on an already-struggling service exactly when it needed less. Make the client resilient with tight timeouts, backoff-with-jitter retries, a circuit breaker, and bulkheads.

**How it works** — Four layers. (1) Tight timeouts so a slow call fails fast instead of holding a thread. (2) Retries with exponential backoff + jitter (1s, 2s, 4s with random spread) so retries do not synchronise into thundering-herd waves. (3) A circuit breaker that trips open after a failure threshold and fails calls instantly during a cooldown, giving the downstream room to recover before letting a trickle of half-open probes through. (4) Bulkheads — isolate the payment caller in its own bounded thread/connection pool so its saturation cannot starve unrelated work.

:::muted
**Trade-off** — Retries help transient blips but amplify load during real overload, so cap them, back them off, and ideally budget them. A circuit breaker sacrifices some recoverable requests in its open window to let the dependency heal — individual success traded for system-wide stability. Bulkheads waste some capacity by partitioning pools but contain blast radius.
:::

:::muted
**Common pitfall** — Retrying non-idempotent operations (a charge) can double-bill. Retries that stack across layers multiply — three tiers each retrying 3× turn one user request into 27 downstream calls — so cap retries at a single layer and pass deadlines downstream.
:::

*Go deeper: where in the stack do you put the retry budget, and how do you propagate the remaining deadline?*

**Keywords** — `retry storm · thundering herd` · `exponential backoff + jitter` · `circuit breaker (half-open)` · `bulkhead` · `retry budget`

### New answer (vi)
**Chốt** — Retry ngay lập tức tạo ra retry storm: mỗi client nhân ba tải lên một service vốn đã chật vật đúng lúc nó cần ít hơn. Làm client resilient bằng timeout chặt, retry backoff-có-jitter, một circuit breaker, và bulkhead.

**Cơ chế** — Bốn lớp. (1) Timeout chặt để một call chậm fail fast thay vì giữ một thread. (2) Retry với exponential backoff + jitter (1s, 2s, 4s với độ phân tán ngẫu nhiên) để các retry không đồng bộ thành các đợt thundering-herd. (3) Một circuit breaker trip open sau một ngưỡng failure và fail call ngay lập tức trong một khoảng cooldown, cho downstream không gian hồi phục trước khi thả một dòng nhỏ probe half-open đi qua. (4) Bulkhead — cô lập caller thanh toán trong pool thread/connection có giới hạn riêng để saturation của nó không làm đói các phần không liên quan.

:::muted
**Trade-off** — Retry giúp các blip thoáng qua nhưng khuếch đại tải khi quá tải thật, nên phải giới hạn, backoff, và lý tưởng là có budget. Circuit breaker hy sinh một số request lẽ ra hồi phục được trong cửa sổ open để cho dependency lành lại — đánh đổi success đơn lẻ lấy sự ổn định toàn hệ thống. Bulkhead lãng phí một phần capacity vì phân vùng pool nhưng khoanh được blast radius.
:::

:::muted
**Bẫy thường gặp** — Retry một thao tác không idempotent (một lần charge) có thể tính tiền hai lần. Retry chồng nhau xuyên nhiều lớp sẽ nhân lên — ba tầng mỗi tầng retry 3× biến một request thành 27 call downstream — nên giới hạn retry ở một lớp duy nhất và truyền deadline xuống downstream.
:::

*Đào sâu tiếp: bạn đặt retry budget ở tầng nào trong stack, và truyền phần deadline còn lại đi xuống thế nào?*

**Từ khoá ăn điểm** — `retry storm · thundering herd` · `exponential backoff + jitter` · `circuit breaker (half-open)` · `bulkhead` · `retry budget`

## 6-card — senior — [Idempotency, Reliability]
**Question:** A user taps "Pay" once but their card is charged twice. Logs show the request succeeded, but the client timed out waiting for the response and retried. A teammate says "let's just switch the queue to exactly-once delivery." Why is that the wrong fix?
**Verdict:** KEEP — Tests understanding that exactly-once delivery is a myth and idempotency is the real fix; rich senior trade-offs.

### New answer (en)
**TL;DR** — Exactly-once *delivery* across a network is essentially a myth — a lost ack leaves the sender unsure whether the message was processed, so it must pick at-most-once or at-least-once. The real fix is to make the operation idempotent so a duplicate retry is harmless.

**How it works** — The client generates an idempotency key (a UUID) per logical payment and sends it with every retry. The server records the key together with the result in a durable store, inside the same transaction as the charge. On a duplicate key it returns the original result instead of charging again. This turns unavoidable at-least-once delivery into effectively-once processing.

:::muted
**Trade-off** — Idempotency keys add a storage write and lookup on the hot path, a retention policy (how long to remember keys), and care around races (two concurrent requests with the same key need a unique constraint or lock, not read-then-write). In exchange you get correctness under arbitrary retries and network faults — far cheaper than chasing exactly-once guarantees a broker cannot truly provide end-to-end.
:::

:::muted
**Common pitfall** — Recording the key in a *separate* transaction from the side effect: if the charge commits but the key write fails, the retry charges again. Key write and effect must be atomic. Trusting a broker's "exactly-once" flag end-to-end is the same trap — a crash between processing and committing the offset still double-applies.
:::

*Go deeper: how do you handle two concurrent requests with the same idempotency key arriving before either commits?*

**Keywords** — `idempotency key (UUID)` · `at-least-once vs exactly-once` · `atomic key+effect` · `effectively-once` · `unique constraint`

### New answer (vi)
**Chốt** — Exactly-once *delivery* qua mạng về cơ bản là một huyền thoại — một ack bị mất khiến bên gửi không chắc message đã được xử lý hay chưa, nên buộc phải chọn at-most-once hoặc at-least-once. Cách sửa thật là làm thao tác trở nên idempotent để một lần retry trùng trở nên vô hại.

**Cơ chế** — Client sinh một idempotency key (một UUID) cho mỗi payment logic và gửi kèm trong mọi lần retry. Server ghi key cùng kết quả vào một durable store, trong cùng transaction với lần charge. Khi gặp key trùng, nó trả về kết quả gốc thay vì charge lại. Điều này biến at-least-once delivery không tránh khỏi thành effectively-once processing.

:::muted
**Trade-off** — Idempotency key thêm một lần write storage và một lần lookup trên hot path, một retention policy (nhớ key bao lâu), và phải cẩn thận với race (hai request đồng thời cùng key cần một unique constraint hoặc lock, không phải read-rồi-write). Đổi lại bạn có tính đúng đắn dưới retry tùy ý và network fault — rẻ hơn nhiều so với đuổi theo đảm bảo exactly-once mà broker không thể thực sự cung cấp end-to-end.
:::

:::muted
**Bẫy thường gặp** — Ghi key trong một transaction *tách rời* khỏi side effect: nếu lần charge commit nhưng lần write key thất bại, retry sẽ charge lại. Việc write key và effect phải atomic. Tin vào cờ "exactly-once" của broker cho end-to-end là cùng cái bẫy — một lần crash giữa lúc xử lý và lúc commit offset vẫn áp dụng hai lần.
:::

*Đào sâu tiếp: bạn xử lý hai request đồng thời cùng idempotency key đến trước khi cái nào kịp commit thế nào?*

**Từ khoá ăn điểm** — `idempotency key (UUID)` · `at-least-once vs exactly-once` · `atomic key+effect` · `effectively-once` · `unique constraint`

## 7-card — staff — [Observability, SystemDesign]
**Question:** You own observability for a platform of 300 microservices. A single user request fans out across 40 of them, debugging across teams takes hours, and the logging bill just doubled to seven figures. Design an observability strategy that makes cross-service debugging fast without bankrupting the company.
**Verdict:** KEEP — Open-ended staff-level design problem balancing debuggability against cost; full arc warranted.

### New answer (en)
**TL;DR** — Make distributed tracing the backbone — one trace ID generated at the edge and propagated across every hop turns a 40-service request into a single waterfall — and pay for it with tail-based sampling and cardinality discipline so you keep signal, not noise.

**How it works** — Generate a trace ID at the gateway and propagate trace/span context via standard headers (W3C traceparent / OpenTelemetry) so one request's full path is a single waterfall. Stamp that same trace/correlation ID into every structured (JSON) log line so a log search pivots instantly to its trace and back. Standardise instrumentation through a shared OpenTelemetry library or sidecar so every team emits the same fields. This collapses cross-team debugging from hours of Slack archaeology to one trace lookup.

:::muted
**Trade-off** — Affordability comes from sampling and cardinality discipline, both trading completeness for cost. Use tail-based sampling — keep every errored or slow trace, sample boring successes at ~1%. Keep metrics low-cardinality (no user_id labels; use exemplars to jump from an aggregate to a representative trace). Tier storage: hot/searchable for days, cheap cold archive for the long tail. The cost: an un-sampled healthy request may have no trace — acceptable, since you rarely debug healthy requests.
:::

:::muted
**Common pitfall** — Head-based sampling decided at the edge before the outcome is known silently drops the exact failed traces you need. Inconsistent propagation (one service swallows the header) fragments the waterfall — the most common reason "tracing doesn't work." Unbounded log/metric cardinality is the cost bomb that doubled the bill, so enforce schemas, sampling, and per-team budgets up front, not globally after the fact.
:::

*Go deeper: how do you implement tail-based sampling when spans for one trace arrive at different collectors at different times?*

**Keywords** — `distributed tracing · trace ID propagation` · `W3C traceparent / OpenTelemetry` · `tail-based sampling` · `exemplars · low cardinality` · `tiered storage`

### New answer (vi)
**Chốt** — Đặt distributed tracing làm xương sống — một trace ID sinh ở edge và propagate qua mọi hop biến một request 40-service thành một waterfall duy nhất — và chi trả cho nó bằng tail-based sampling cùng kỷ luật cardinality để giữ signal, không phải noise.

**Cơ chế** — Sinh một trace ID ở gateway và propagate trace/span context qua header chuẩn (W3C traceparent / OpenTelemetry) để toàn bộ đường đi của một request thành một waterfall duy nhất. Đóng dấu chính trace/correlation ID đó vào mọi dòng structured log (JSON) để một lần search log nhảy ngay được sang trace của nó và ngược lại. Chuẩn hóa instrumentation qua một shared OpenTelemetry library hoặc sidecar để mọi team phát ra cùng bộ field. Điều này thu gọn việc debug xuyên team từ hàng giờ đào bới Slack xuống một lần lookup trace.

:::muted
**Trade-off** — Khả năng chi trả đến từ sampling và kỷ luật cardinality, cả hai đánh đổi tính đầy đủ lấy chi phí. Dùng tail-based sampling — giữ mọi trace bị lỗi hoặc chậm, sample các trace thành công nhàm chán ở ~1%. Giữ metrics low-cardinality (không gắn label user_id; dùng exemplar để nhảy từ một aggregate sang một trace đại diện). Phân tầng storage: hot/searchable trong vài ngày, cold archive rẻ cho phần đuôi dài. Cái giá: một request khỏe mạnh không bị sample có thể không có trace — chấp nhận được vì bạn hiếm khi debug request khỏe mạnh.
:::

:::muted
**Bẫy thường gặp** — Head-based sampling quyết định ở edge trước khi biết kết quả sẽ âm thầm drop đúng những failed trace bạn cần. Propagation không nhất quán (một service nuốt mất header) làm vỡ waterfall — lý do phổ biến nhất khiến "tracing không hoạt động". Cardinality log/metric không giới hạn là quả bom chi phí đã làm gấp đôi hóa đơn, nên ép schema, sampling và budget theo từng team từ đầu, không phải xử lý sau toàn cục.
:::

*Đào sâu tiếp: bạn triển khai tail-based sampling thế nào khi các span của cùng một trace đến các collector khác nhau vào các thời điểm khác nhau?*

**Từ khoá ăn điểm** — `distributed tracing · trace ID propagation` · `W3C traceparent / OpenTelemetry` · `tail-based sampling` · `exemplars · low cardinality` · `tiered storage`
