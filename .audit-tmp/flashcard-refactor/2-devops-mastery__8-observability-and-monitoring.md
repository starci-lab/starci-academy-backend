# 2-devops-mastery / 8-observability-and-monitoring
Summary: kept 8, delete 0 of 8

## 0-card — middle — [Observability, Metrics]
**Question:** Checkout latency spiked at 14:03 and you have metrics, logs and traces all wired up. A teammate asks "which one do I open first, and what does each actually answer?" Walk through how you'd use the three pillars to go from "something is slow" to root cause.
**Verdict:** KEEP — Scenario-driven; tests whether you understand the detect → localize → explain funnel, not just three definitions.

### New answer (en)
**TL;DR** — Use the pillars as a funnel: **metrics detect** ("is it wrong, how bad?"), **traces localize** ("where in the request is the time?"), **logs explain** ("what exactly happened?"). Open metrics first, then trace, then log.

**How it works** — Metrics are cheap, pre-aggregated time series, so you start there: p99 checkout latency jumped at 14:03 and tells you the blast radius (one endpoint vs the whole service). Pivot to a **trace** of a slow checkout — the span tree across services shows 800ms sitting in one downstream call to payments. Finally open **logs** scoped to that span/service/time window: the structured error says the payments DB connection pool was exhausted. A shared `trace_id` stitched across all three is what lets you hop from a metric anomaly to the exact traces and logs.

:::muted
**Trade-off** — Each pillar trades detail for cost. Metrics are dimensional but lossy (you can't recover one request from a histogram), cheap and fast — right for alerting. Logs are high-fidelity per-event but expensive to index. Traces sit between but are usually sampled, so the exact slow request may not have been kept. The skill is using the always-on cheap pillar to decide *when* to spend the expensive ones.
:::

:::muted
**Common pitfall** — Treating logs as your primary monitoring tool: grepping terabytes to compute an error rate is slow, costly and often wrong when a counter answers instantly. The opposite failure is metric-only shops that detect a spike but have no correlated trace or log, so every incident is guesswork. Without a shared `trace_id`, the funnel breaks at the first hop.
:::

*Go deeper — how do you guarantee the same `trace_id` reaches the log line, the trace, and the metric exemplar?*

**Keywords** — `three pillars · blast radius · p99 · span tree · trace_id · exemplars`

### New answer (vi)
**Chốt** — Dùng ba trụ cột như một cái phễu: **metrics phát hiện** ("có sai không, nặng cỡ nào?"), **traces khoanh vùng** ("thời gian đi đâu trong request?"), **logs giải thích** ("chính xác chuyện gì đã xảy ra?"). Mở metrics trước, rồi trace, rồi log.

**Cơ chế** — Metrics là time series rẻ, đã pre-aggregate nên bắt đầu ở đó: p99 latency checkout nhảy lên lúc 14:03 và cho bạn biết blast radius (một endpoint hay cả service). Pivot sang một **trace** của checkout chậm — cây span xuyên các service lộ ra 800ms nằm ở một call downstream tới payments. Cuối cùng mở **logs** giới hạn vào span/service/khoảng thời gian đó: structured error log nói connection pool của payments DB đã cạn. Một `trace_id` chung khâu xuyên cả ba chính là thứ cho phép bạn nhảy từ một metric anomaly tới đúng các trace và log.

:::muted
**Trade-off** — Mỗi trụ cột đánh đổi độ chi tiết lấy chi phí. Metrics đa chiều nhưng lossy (không khôi phục được một request từ histogram), rẻ và nhanh — hợp cho alerting. Logs trung thực theo từng event nhưng đắt để index. Traces ở giữa nhưng thường bị sampling, nên đúng cái request chậm có thể đã không được giữ. Kỹ năng là dùng trụ cột luôn-bật và rẻ để quyết định *khi nào* mới tiêu tới những cái đắt.
:::

:::muted
**Bẫy thường gặp** — Coi logs như công cụ monitoring chính: grep hàng terabyte để tính error rate vừa chậm vừa tốn lại thường sai, trong khi một counter trả lời tức thì. Sai lầm ngược là shop chỉ-có-metrics, phát hiện được spike nhưng không có trace/log tương quan, nên mỗi incident đều thành đoán mò. Không có `trace_id` chung, cái phễu vỡ ngay ở bước nhảy đầu tiên.
:::

*Đào sâu tiếp — làm sao bảo đảm cùng một `trace_id` chạm tới dòng log, cái trace, và metric exemplar?*

**Từ khoá ăn điểm** — `three pillars · blast radius · p99 · span tree · trace_id · exemplars`

## 1-card — senior — [Prometheus, Cardinality]
**Question:** After adding a `user_id` label to your HTTP request metric, Prometheus memory exploded and queries time out. Explain the pull model, the difference between counter / gauge / histogram, and why that one label change nearly took down your monitoring.
**Verdict:** KEEP — Forces the candidate to connect the pull/series model to a concrete cardinality-bomb incident; clear senior depth.

### New answer (en)
**TL;DR** — `user_id` is an **unbounded, high-cardinality label**: every distinct value spawns its own time series, so one user per series turned a few hundred series into millions and OOM'd Prometheus. Per-request identity belongs in traces/logs, never in metric labels.

**How it works** — Prometheus uses a **pull** model: the server scrapes each target's `/metrics` endpoint on a schedule, which lets it control scrape frequency, get a free `up` metric when a scrape fails, and find targets via service discovery. The core types: a **counter** only increases and is read with `rate()` (requests, errors); a **gauge** moves up and down for point-in-time values (memory, queue depth); a **histogram** buckets observations so you can approximate quantiles server-side with `histogram_quantile()`. Crucially, **every unique combination of label values is a separate series in memory** — that multiplicative cost is what `user_id` detonated.

:::muted
**Trade-off** — Labels are what make metrics powerful (slice latency by route/method/status), but cardinality is multiplicative: 10 routes × 5 methods × 8 statuses = 400 series is fine; × number of users = millions is not. The trade-off is dimensionality vs scalability — keep labels bounded (route *templates*, not raw paths) and push identity into traces/logs.
:::

:::muted
**Common pitfall** — High-cardinality labels are the #1 way to OOM Prometheus (the "cardinality bomb"). Histograms multiply it: each is one series *per bucket per label combo*, so 12 buckets × an unbounded label explodes 12× faster. Bad series also linger until retention expires even after you remove the label. Mitigate with `metric_relabel_configs` to drop labels at scrape time and recording rules to pre-aggregate.
:::

*Go deeper — given a Prometheus already OOMing, how do you find which metric is the offender before it crashes again?*

**Keywords** — `pull model · /metrics · up · rate() · histogram_quantile · active series · metric_relabel_configs`

### New answer (vi)
**Chốt** — `user_id` là một **label high-cardinality vô biên**: mỗi giá trị phân biệt sinh một time series riêng, nên một user một series biến vài trăm series thành hàng triệu và OOM Prometheus. Danh tính theo từng request thuộc về trace/log, không bao giờ vào label metric.

**Cơ chế** — Prometheus dùng mô hình **pull**: server scrape endpoint `/metrics` của mỗi target theo lịch, cho phép kiểm soát tần suất scrape, có metric `up` miễn phí khi scrape fail, và discover target qua service discovery. Các type cốt lõi: **counter** chỉ tăng, đọc bằng `rate()` (request, error); **gauge** lên xuống cho giá trị tại một thời điểm (memory, queue depth); **histogram** chia observation vào bucket để xấp xỉ quantile ở phía server bằng `histogram_quantile()`. Quan trọng nhất, **mỗi tổ hợp giá trị label duy nhất là một series riêng trong memory** — chính chi phí có tính nhân đó là cái `user_id` đã kích nổ.

:::muted
**Trade-off** — Label làm metric mạnh mẽ (cắt lát latency theo route/method/status), nhưng cardinality có tính nhân: 10 route × 5 method × 8 status = 400 series thì ổn; × số user = hàng triệu thì không. Trade-off là tính đa chiều vs khả năng scale — giữ label có biên (route *template* chứ không raw path) và đẩy danh tính vào trace/log.
:::

:::muted
**Bẫy thường gặp** — Label high-cardinality là cách số một làm OOM Prometheus ("cardinality bomb"). Histogram nhân nó lên: mỗi cái là một series *cho mỗi bucket cho mỗi tổ hợp label*, nên 12 bucket × một label vô biên nổ nhanh hơn 12 lần. Series xấu còn lưu lại tới khi retention hết hạn dù đã gỡ label. Giảm thiểu bằng `metric_relabel_configs` để drop label lúc scrape và recording rule để pre-aggregate.
:::

*Đào sâu tiếp — khi Prometheus đang OOM, làm sao tìm ra metric nào là thủ phạm trước khi nó crash lại?*

**Từ khoá ăn điểm** — `pull model · /metrics · up · rate() · histogram_quantile · active series · metric_relabel_configs`

## 2-card — middle — [Dashboards, RED-USE]
**Question:** You inherit a Grafana dashboard with 60 panels and nobody knows which ones matter during an incident. How would you redesign it using the RED and USE methods, and when does each method apply?
**Verdict:** KEEP — Asks for a design decision (which method where) plus a redesign, not a definition; good middle-level depth.

### New answer (en)
**TL;DR** — Use **RED for request-driven services** (Rate, Errors, Duration) and **USE for resources** (Utilization, Saturation, Errors). Redesign top-down: a RED row per critical service up top for user-facing health, USE rows for the resources behind each service underneath.

**How it works** — **RED** answers "how is this service treating its callers?" — Rate (req/s), Errors (failed req/s or ratio), Duration as p50/p90/p99. **USE** answers "is this resource the bottleneck?" — Utilization (% busy), Saturation (queued/waiting work), Errors (device/resource errors). The redesign makes on-call read symptom→cause: glance at the RED rows to see user pain, then drill into the USE rows below to find the constrained resource. That hierarchy is what the flat 60-panel wall lacks.

:::muted
**Trade-off** — RED gives the user's view but is blind to *why* (a disk can fill silently while rate/errors/duration look healthy); USE gives the machine's view but is blind to user impact (90% CPU is fine if latency is fine). They're complementary — lead with RED for alerting/triage, keep USE as the diagnostic layer. Saturation is the most predictive USE signal because queues grow before utilization pins at 100%.
:::

:::muted
**Common pitfall** — The 60-panel wall *is* the failure mode: no hierarchy means responders can't find signal under load. Averaging latency instead of percentiles hides a 4s p99 behind a 50ms mean. Don't apply RED to a resource (a queue has no "request rate") or USE to a stateless autoscaling fleet (utilization is meaningless without saturation). And dashboards answer known questions — novel incidents still need ad-hoc querying and traces.
:::

*Go deeper — for an autoscaling service where utilization is always ~60% by design, which USE signal actually warns you of trouble?*

**Keywords** — `RED · USE · rate/errors/duration · utilization/saturation/errors · p99 · symptom-to-cause`

### New answer (vi)
**Chốt** — Dùng **RED cho service hướng-request** (Rate, Errors, Duration) và **USE cho resource** (Utilization, Saturation, Errors). Thiết kế lại top-down: một hàng RED cho mỗi service quan trọng ở trên cùng cho sức khỏe hướng-user, các hàng USE cho resource đằng sau mỗi service ở dưới.

**Cơ chế** — **RED** trả lời "service này đối xử với caller ra sao?" — Rate (req/s), Errors (req fail/s hoặc tỉ lệ), Duration dạng p50/p90/p99. **USE** trả lời "resource này có phải bottleneck không?" — Utilization (% bận), Saturation (việc đang xếp hàng/chờ), Errors (lỗi thiết bị/resource). Thiết kế lại cho on-call đọc triệu chứng→nguyên nhân: liếc các hàng RED để thấy nỗi đau của user, rồi drill vào các hàng USE bên dưới để tìm resource bị thắt. Chính thứ bậc đó là cái bức tường 60 panel phẳng đang thiếu.

:::muted
**Trade-off** — RED cho góc nhìn user nhưng mù về *tại sao* (disk có thể âm thầm đầy trong khi rate/errors/duration khỏe); USE cho góc nhìn máy nhưng mù về tác động user (90% CPU ổn nếu latency ổn). Chúng bổ trợ nhau — dẫn đầu bằng RED cho alerting/triage, giữ USE làm lớp chẩn đoán. Saturation là tín hiệu USE dự báo nhất vì queue phình trước khi utilization ghim ở 100%.
:::

:::muted
**Bẫy thường gặp** — Bức tường 60 panel *chính là* failure mode: không thứ bậc nghĩa là người ứng cứu không tìm được tín hiệu khi tải cao. Lấy trung bình latency thay vì percentile giấu một p99 4s sau một mean 50ms. Đừng áp RED cho resource (queue không có "request rate") hay USE cho fleet stateless autoscale (utilization vô nghĩa nếu không có saturation). Và dashboard trả lời câu hỏi đã biết — incident lạ vẫn cần ad-hoc query và trace.
:::

*Đào sâu tiếp — với một service autoscale mà utilization luôn ~60% theo thiết kế, tín hiệu USE nào thật sự cảnh báo bạn?*

**Từ khoá ăn điểm** — `RED · USE · rate/errors/duration · utilization/saturation/errors · p99 · symptom-to-cause`

## 3-card — senior — [SLO, ErrorBudget]
**Question:** Your team pages whenever error rate exceeds 1% for 5 minutes, and you're getting woken up for blips that self-heal while slow burns go unnoticed. Redesign this around an SLO with error-budget burn-rate alerting. What makes a good SLI, and how does burn rate beat a static threshold?
**Verdict:** KEEP — Real design problem with a clear "why burn rate wins"; full senior arc.

### New answer (en)
**TL;DR** — Replace the static threshold with **multi-window, multi-burn-rate alerting on an error budget**: page fast when you're burning the budget catastrophically (e.g. 14.4× over 1h), open a ticket for slow burns (e.g. 3× over 6h). A good **SLI** is good events ÷ valid events measured as close to the user as possible.

**How it works** — An **SLO** is a target on that SLI over a window (99.9% over 28 days); its complement is the **error budget** (0.1% allowed to fail). **Burn rate** = how fast you're consuming that budget: rate 1 exhausts it exactly over the window, 14.4 burns a month's budget in two days. You combine a fast/high-burn rule (14.4× over 1h, confirmed over 5m) for severe outages with a slow/low-burn rule (3× over 6h) for gradual degradation — so blips that self-heal never accumulate enough burn to page, and a 0.8% slow burn that a 1% threshold ignored does.

:::muted
**Trade-off** — Burn-rate alerting trades simple thresholds for a model that ties paging to actual budget consumption, so you only wake for *significant* error volume. The cost is conceptual/operational complexity: agree the SLI, pick the window, tune burn factors. The multi-window design trades precision (don't page on transient spikes) against detection time (don't sleep through an outage). Error budgets also turn reliability into a currency: healthy budget → ship faster, spent budget → freeze.
:::

:::muted
**Common pitfall** — Static thresholds fail both ways: at low traffic a few errors trip 1% and page on noise; a steady 0.8% never alerts yet drains the budget over days. The deeper trap is a bad SLI — measuring server-side 200s while users hit CDN/LB/client timeouts, so your SLO looks green during an outage. Also: a window so long an incident barely moves it, an SLO of 100% (no budget = every blip violates), and alerting on the SLI ratio directly instead of burn rate.
:::

*Go deeper — how do you pick the burn-rate factors and windows so a fast page and a slow ticket don't both fire (and double-alert) for the same incident?*

**Keywords** — `SLI · SLO · error budget · burn rate · multi-window multi-burn-rate · 14.4× · good/valid events`

### New answer (vi)
**Chốt** — Thay static threshold bằng **multi-window, multi-burn-rate alerting trên error budget**: page nhanh khi bạn đốt budget thảm họa (vd 14.4× qua 1h), mở ticket cho slow burn (vd 3× qua 6h). Một **SLI** tốt là good event ÷ valid event, đo càng gần user càng tốt.

**Cơ chế** — Một **SLO** là mục tiêu trên SLI đó qua một window (99.9% trong 28 ngày); phần bù là **error budget** (0.1% được phép fail). **Burn rate** = bạn tiêu budget nhanh cỡ nào: rate 1 cạn vừa khít qua window, 14.4 đốt budget cả tháng trong hai ngày. Bạn kết hợp rule fast/high-burn (14.4× qua 1h, xác nhận qua 5m) cho outage nghiêm trọng với rule slow/low-burn (3× qua 6h) cho suy thoái từ từ — nên blip tự lành không bao giờ tích đủ burn để page, còn một slow burn 0.8% mà threshold 1% bỏ lỡ thì có.

:::muted
**Trade-off** — Burn-rate alerting đánh đổi threshold đơn giản lấy một mô hình gắn việc page với mức tiêu budget thật, nên bạn chỉ thức dậy vì error volume *đáng kể*. Cái giá là độ phức tạp khái niệm/vận hành: đồng thuận SLI, chọn window, tinh chỉnh hệ số burn. Thiết kế multi-window đánh đổi độ chính xác (đừng page vì spike thoáng qua) với thời gian phát hiện (đừng ngủ quên qua outage). Error budget còn biến reliability thành đồng tiền: budget khỏe → ship nhanh, budget cạn → freeze.
:::

:::muted
**Bẫy thường gặp** — Static threshold fail cả hai chiều: lúc traffic thấp vài error đã chạm 1% và page vì nhiễu; một mức 0.8% đều đặn không bao giờ alert mà vẫn cạn budget qua nhiều ngày. Cái bẫy sâu hơn là SLI tồi — đo 200 ở phía server trong khi user gặp CDN/LB/client timeout, nên SLO xanh lè giữa outage. Còn: window dài tới mức incident hầu như không nhúc nhích con số, SLO 100% (không budget = mọi blip vi phạm), và alert trực tiếp trên tỉ lệ SLI thay vì burn rate.
:::

*Đào sâu tiếp — chọn hệ số burn-rate và window thế nào để một fast page và một slow ticket không cùng nổ (double-alert) cho cùng một incident?*

**Từ khoá ăn điểm** — `SLI · SLO · error budget · burn rate · multi-window multi-burn-rate · 14.4× · good/valid events`

## 4-card — middle — [Logging, Correlation]
**Question:** A user reports their request failed but across five microservices you can't find the related log lines, and the logs you do find are free-text strings that won't parse. How would you fix this with structured logging, correlation ids and centralized aggregation?
**Verdict:** KEEP — Concrete cross-service debugging scenario with a clear "fix the system" answer; solid middle depth.

### New answer (en)
**TL;DR** — Emit **structured (JSON) logs** with consistent fields, stamp every line with a **correlation id** (reuse the `trace_id`) generated at the edge and propagated through every call, and ship everything to a **centralized aggregator**. Debugging then collapses to one filter: `trace_id="abc123"`.

**How it works** — Switch from free-text to JSON lines with stable fields (`timestamp`, `level`, `service`, `message`, plus typed context like `user_id`, `order_id`, `status_code`, `duration_ms`). Generate the correlation id at the API gateway / first service and propagate it downstream via headers, attaching it to every log line. Ship all logs to one queryable store (Loki, Elasticsearch/OpenSearch, a cloud logging service). Now a single `trace_id` filter returns the user's whole journey across all five services in order, instead of grepping five hosts by hand.

:::muted
**Trade-off** — Structured logs cost more bytes and require schema discipline in exchange for being machine-queryable, aggregatable into metrics, and joinable across services. Centralized aggregation adds infra, egress and storage cost and a dependency you must keep healthy, but without it you can't correlate across hosts. There's also a level trade-off: DEBUG everywhere gives max fidelity at huge cost, so most teams run INFO in prod with on-demand verbosity bumps.
:::

:::muted
**Common pitfall** — The most damaging mistake is logging secrets/PII (passwords, tokens, full card numbers, emails) into a store many people query and that's retained for months — scrub/redact at the logging layer. Inconsistent field names (`userId` vs `user_id` vs `uid`) silently break cross-service queries; enforce a shared schema. Logging is synchronous and can become back-pressure if the pipeline stalls — use async, buffered, non-blocking appenders. Unbounded volume is a cost-and-noise bomb without sampling and retention.
:::

*Go deeper — once logs are aggregated, how do you keep the `trace_id` consistent with what your tracing system uses so a log line and its span line up?*

**Keywords** — `structured logging · JSON · correlation id · trace_id · context propagation · centralized aggregation · PII redaction`

### New answer (vi)
**Chốt** — Phát **structured log (JSON)** với field nhất quán, đóng dấu mỗi dòng bằng một **correlation id** (tái dùng `trace_id`) sinh ở rìa và propagate qua mọi call, rồi ship tất cả tới một **aggregator tập trung**. Debug khi đó thu về một filter: `trace_id="abc123"`.

**Cơ chế** — Chuyển từ free-text sang dòng JSON với field ổn định (`timestamp`, `level`, `service`, `message`, cộng context có kiểu như `user_id`, `order_id`, `status_code`, `duration_ms`). Sinh correlation id ở API gateway / service đầu tiên và propagate xuống downstream qua header, gắn vào mọi dòng log. Ship toàn bộ log tới một store query được (Loki, Elasticsearch/OpenSearch, một cloud logging service). Bây giờ một filter `trace_id` trả về toàn bộ hành trình của user xuyên cả năm service theo thứ tự, thay vì grep tay năm host.

:::muted
**Trade-off** — Structured log tốn nhiều byte hơn và đòi hỏi kỷ luật schema để đổi lấy việc máy query được, gộp thành metric được, và join xuyên service được. Centralized aggregation thêm hạ tầng, egress và chi phí storage cùng một dependency phải giữ khỏe, nhưng không có nó bạn không correlate xuyên host được. Còn trade-off về level: DEBUG khắp nơi cho fidelity tối đa với chi phí khổng lồ, nên đa số team chạy INFO ở prod và nâng verbosity khi cần.
:::

:::muted
**Bẫy thường gặp** — Sai lầm tai hại nhất là log secret/PII (password, token, số thẻ đầy đủ, email) vào một store nhiều người query được và bị giữ hàng tháng — scrub/redact ngay ở lớp logging. Tên field không nhất quán (`userId` vs `user_id` vs `uid`) âm thầm phá query xuyên service; ép một schema chung. Logging là đồng bộ và có thể thành back-pressure nếu pipeline nghẽn — dùng appender async, có buffer, non-blocking. Volume vô biên là quả bom chi phí và nhiễu nếu không sampling và retention.
:::

*Đào sâu tiếp — khi log đã được gộp, làm sao giữ `trace_id` nhất quán với cái hệ tracing dùng để một dòng log và span của nó khớp nhau?*

**Từ khoá ăn điểm** — `structured logging · JSON · correlation id · trace_id · context propagation · centralized aggregation · PII redaction`

## 5-card — middle — [Alerting, OnCall]
**Question:** Your on-call rotation gets 40 pages a night — high CPU, a pod restart, a queue at 80% — and people have started ignoring them. Lay out an alerting philosophy that fixes this. Why page on symptoms not causes, and how do you fight alert fatigue?
**Verdict:** KEEP — Philosophy + concrete remediation question; the symptom-vs-cause judgment is exactly what a real interviewer probes.

### New answer (en)
**TL;DR** — **Page on user-facing symptoms, not internal causes**, and make every page *urgent, actionable and real*. "Checkout success rate below SLO" wakes someone; "CPU at 90%" or "a pod restarted" is a cause that belongs on a dashboard, not a pager.

**How it works** — A symptom means a human is being hurt, so a human should wake; a cause may be completely fine. The rule of thumb: if it can wait until morning it's a ticket; if there's nothing to do it shouldn't page; if it self-heals it shouldn't have fired. Attach causes as *context* to the symptom alert — when checkout latency pages, the responder immediately sees the high-CPU graph as a likely culprit, without CPU itself ever paging. Fight fatigue by deleting/down-grading alerts that fired with no action, grouping correlated alerts so one incident is one page, and adding `for:` durations / hysteresis to kill flapping.

:::muted
**Trade-off** — Symptom-based alerting trades early, granular warnings for fewer, higher-signal pages — the cost is detection latency, since you alert once users are affected rather than when an upstream resource first looks unhealthy. Mitigate with slow-burn budget alerts and saturation-based ticketing that flag degradation *before* it's user-visible, routed to a queue. The core trade-off is sensitivity vs specificity: cause-based catches everything early but drowns you in false positives; symptom-based makes every page matter, slightly later.
:::

:::muted
**Common pitfall** — Alert fatigue is the real failure: when most pages are noise, responders ignore all of them and miss the real one — cry-wolf turns monitoring into a liability and burns people out. Track pages-per-shift as a first-class reliability metric, review every page in the postmortem, and remove any alert that never catches a real incident — it's pure cost. Route non-urgent signals to tickets, not pages.
:::

*Go deeper — a CPU-saturation alert genuinely predicts an outage 10 minutes out. Do you page on it, or is that still a "cause"? How do you decide?*

**Keywords** — `symptom vs cause · urgent/actionable/real · alert fatigue · pages-per-shift · grouping · for:/hysteresis · cry-wolf`

### New answer (vi)
**Chốt** — **Page trên symptom mà user nhìn thấy, không phải cause nội bộ**, và làm mọi page *khẩn cấp, hành động được, có thật*. "Tỉ lệ checkout thành công dưới SLO" đánh thức ai đó; "CPU 90%" hay "một pod restart" là cause, thuộc về dashboard chứ không phải pager.

**Cơ chế** — Một symptom nghĩa là một con người đang bị tổn hại nên con người nên thức; một cause có thể hoàn toàn ổn. Quy tắc ngón tay cái: nếu đợi được tới sáng thì là ticket; nếu không có gì để làm thì không nên page; nếu tự lành thì lẽ ra đừng nổ. Đính cause làm *context* vào symptom alert — khi latency checkout page, người ứng cứu thấy ngay đồ thị CPU cao như thủ phạm khả dĩ, mà CPU tự nó không bao giờ page. Chống fatigue bằng cách xóa/hạ cấp alert đã nổ mà không có hành động, gom alert tương quan để một incident là một page, và thêm `for:` / hysteresis để giết flapping.

:::muted
**Trade-off** — Alerting dựa trên symptom đánh đổi cảnh báo sớm, chi tiết lấy ít page hơn nhưng tín hiệu cao hơn — cái giá là độ trễ phát hiện, vì bạn alert khi user đã bị ảnh hưởng thay vì khi resource thượng nguồn lần đầu trông không khỏe. Giảm thiểu bằng slow-burn budget alert và ticketing dựa trên saturation, cờ hiệu suy thoái *trước khi* nó user-visible, định tuyến vào queue. Trade-off cốt lõi là độ nhạy vs độ đặc hiệu: cause-based bắt mọi thứ sớm nhưng dìm bạn trong false positive; symptom-based làm mọi page đều quan trọng, sớm hơn một chút ít đi.
:::

:::muted
**Bẫy thường gặp** — Alert fatigue mới là failure thật: khi đa số page là nhiễu, người ứng cứu phớt lờ tất cả và bỏ lỡ cái có thật — cậu-bé-chăn-cừu biến monitoring thành gánh nặng và làm kiệt sức con người. Theo dõi page-mỗi-ca như metric reliability hạng nhất, review mọi page trong postmortem, và gỡ mọi alert không bao giờ bắt được incident thật — đó là chi phí thuần. Định tuyến tín hiệu không khẩn vào ticket, không phải page.
:::

*Đào sâu tiếp — một alert CPU-saturation thật sự dự báo outage trước 10 phút. Bạn có page nó không, hay nó vẫn là "cause"? Quyết định thế nào?*

**Từ khoá ăn điểm** — `symptom vs cause · urgent/actionable/real · alert fatigue · pages-per-shift · grouping · for:/hysteresis · cry-wolf`

## 6-card — senior — [Tracing, Sampling]
**Question:** A request passes through gateway → orders → payments → a Kafka consumer, and traces show up broken: the consumer's work appears as a separate disconnected trace. Explain spans, how context propagation should work end-to-end, and how sampling affects what you'll actually see.
**Verdict:** KEEP — Diagnoses a real broken-trace symptom (async boundary) and demands head-vs-tail sampling reasoning; strong senior depth.

### New answer (en)
**TL;DR** — The consumer started a **fresh root span** because nobody propagated trace context across the Kafka boundary. Fix it by **injecting** context into message headers on publish and **extracting** it in the consumer, so the consumer's span gets the right `parent_span_id`.

**How it works** — A **trace** is one request's journey, made of **spans** — each a timed unit of work (HTTP handler, DB query, Kafka publish) with a `trace_id`, its own `span_id`, a `parent_span_id` linking it to its caller, plus timestamps/attributes. **Context propagation** carries `trace_id` + current `span_id` between services: over HTTP via the `traceparent` header (W3C Trace Context); across async boundaries (Kafka) you must inject context into the **message headers** on publish and extract it in the consumer. HTTP auto-instrumentation handles this for you; queues need the manual inject/extract — which is exactly the missing step here.

:::muted
**Trade-off** — Tracing every request is perfect fidelity but expensive in overhead, network and storage, so you **sample**. **Head-based** decides at trace start (keep 1%): cheap, but may discard the rare slow/errored request you most wanted. **Tail-based** buffers all spans and decides after completion, so you keep 100% of errors and slow traces and drop boring fast ones — far better signal, at the cost of a stateful collector holding spans in memory until the trace finishes. The trade-off is cost/volume vs the chance the interesting trace survives.
:::

:::muted
**Common pitfall** — Inconsistent sampling decisions across services produce **partial traces** with missing spans — worse than no trace because they mislead; propagate the sampling decision with the context so every hop agrees to keep or drop the whole trace. The async-boundary gap (Kafka, SQS, background jobs) is the most common break. Over-instrumenting (a span per trivial function) explodes volume and clutters the UI — aim for spans at service and external-call boundaries. Head-based at 1% can leave a low-traffic critical endpoint with almost no traces; use per-route or always-sample-on-error rules.
:::

*Go deeper — with head-based 1% sampling, how do you still guarantee you capture 100% of error traces?*

**Keywords** — `span · trace_id/span_id/parent_span_id · traceparent · W3C Trace Context · inject/extract · head vs tail sampling · partial trace`

### New answer (vi)
**Chốt** — Consumer mở một **root span mới toanh** vì không ai propagate trace context qua ranh giới Kafka. Sửa bằng cách **inject** context vào message header lúc publish và **extract** ở consumer, để span của consumer có đúng `parent_span_id`.

**Cơ chế** — Một **trace** là hành trình của một request, tạo từ các **span** — mỗi cái là một đơn vị công việc có đo thời gian (HTTP handler, DB query, Kafka publish) với `trace_id`, `span_id` riêng, một `parent_span_id` nối về caller, cộng timestamp/attribute. **Context propagation** mang `trace_id` + `span_id` hiện tại giữa các service: qua HTTP bằng header `traceparent` (W3C Trace Context); xuyên ranh giới async (Kafka) bạn phải inject context vào **message header** lúc publish và extract ở consumer. HTTP auto-instrumentation lo việc này cho bạn; queue cần inject/extract thủ công — chính là bước thiếu ở đây.

:::muted
**Trade-off** — Trace mọi request là fidelity hoàn hảo nhưng đắt về overhead, network và storage, nên bạn **sampling**. **Head-based** quyết định ngay đầu trace (giữ 1%): rẻ, nhưng có thể vứt đúng cái request chậm/lỗi hiếm hoi bạn muốn nhất. **Tail-based** buffer toàn bộ span và quyết định sau khi hoàn tất, nên giữ 100% error và trace chậm rồi drop những cái nhanh nhàm — tín hiệu tốt hơn hẳn, với cái giá là một collector có state giữ span trong memory tới khi trace kết thúc. Trade-off là chi phí/volume vs cơ hội cái trace thú vị sống sót.
:::

:::muted
**Bẫy thường gặp** — Quyết định sampling không nhất quán giữa các service sinh **partial trace** thiếu span — tệ hơn không có trace vì nó đánh lừa; propagate quyết định sampling cùng context để mọi hop đồng ý giữ hay drop cả trace. Khoảng trống ranh giới async (Kafka, SQS, background job) là chỗ đứt phổ biến nhất. Over-instrument (một span cho mỗi hàm tầm thường) làm nổ volume và rối UI — nhắm span ở ranh giới service và external-call. Head-based ở 1% có thể để một endpoint ít traffic nhưng quan trọng gần như không có trace; dùng rule sampling theo route hoặc always-sample-on-error.
:::

*Đào sâu tiếp — với head-based sampling 1%, làm sao vẫn bảo đảm bắt 100% trace lỗi?*

**Từ khoá ăn điểm** — `span · trace_id/span_id/parent_span_id · traceparent · W3C Trace Context · inject/extract · head vs tail sampling · partial trace`

## 7-card — staff — [Observability, CostControl]
**Question:** Your observability bill has grown to rival your compute bill across a 5,000-host fleet, and leadership wants it cut in half without going blind during incidents. As the staff engineer owning this, how do you control cardinality, retention and sampling cost while keeping the system debuggable?
**Verdict:** KEEP — Open-ended staff-level cost/governance design with real trade-off reasoning and a non-obvious failure mode; exactly the bar.

### New answer (en)
**TL;DR** — Attack the three cost drivers separately and make the cuts **value-weighted, not uniform**: cap metric **cardinality**, tier **log** retention by value, switch traces to **tail-based** sampling — while protecting SLIs, error traces and audit logs with explicit "never drop" rules.

**How it works** — For **metrics** (cost = active series), enforce a label allowlist, drop high-cardinality labels at ingest with relabeling, and pre-aggregate hot queries into recording rules; most spend comes from a handful of runaway metrics a cardinality report will surface. For **logs**, tier by value: keep INFO+ hot-searchable for days, sample/drop chatty debug/access logs, archive raw logs to cheap object storage with longer retention than the indexed store. For **traces**, move head-based → **tail-based** so you keep errors and slow traces (high value) and drop fast successes. Underpin all three with tiered retention: high-resolution recent, downsampled long-term.

:::muted
**Trade-off** — Every cut trades cost against the chance the exact data you need during an incident still exists; aggressive sampling and short retention save money but risk the specific failed request or week-long slow burn being gone. The art is value-weighting: never sample errors, keep SLI metrics at full resolution and long retention, but drop 99% of healthy traffic and downsample old data. Centralized governance (quotas, per-team cost attribution, label budgets) vs team autonomy is itself a trade-off — show-back makes teams own spend, but too-rigid a quota blocks a team that legitimately needs more cardinality.
:::

:::muted
**Common pitfall** — The catastrophic failure is cutting blindly and finding during the next outage that you sampled away the trace, dropped the log, or downsampled the metric you needed. A subtler trap: observability cost scales with deploy frequency and pod churn, not traffic — ephemeral k8s pod ids and per-deploy labels silently inflate cardinality, so a CI/CD speedup can blow up the metrics bill with no extra users. Protect high-value signals (SLIs, error traces, audit logs) with explicit never-sample/never-drop rules, attribute cost back to the teams that generate it, and treat a cardinality-limit breach as an alert, not a surprise invoice.
:::

*Go deeper — leadership wants the bill halved by next quarter. What's the first measurement you take to know where the 50% actually is before you cut anything?*

**Keywords** — `active series · label allowlist · relabeling · recording rules · tiered retention · tail-based sampling · cost attribution / show-back · never-sample SLIs`

### New answer (vi)
**Chốt** — Tấn công ba nguồn chi phí riêng rẽ và làm các nhát cắt **theo trọng số giá trị, không đồng đều**: chặn **cardinality** metric, phân tầng retention **log** theo giá trị, chuyển traces sang **tail-based** sampling — đồng thời bảo vệ SLI, error trace và audit log bằng các rule "không bao giờ drop" tường minh.

**Cơ chế** — Với **metrics** (chi phí = active series), ép một label allowlist, drop label high-cardinality lúc ingest bằng relabeling, và pre-aggregate query nóng thành recording rule; phần lớn chi tiêu tới từ một nhúm metric mất kiểm soát mà một cardinality report sẽ lộ ra. Với **logs**, phân tầng theo giá trị: giữ INFO+ hot-searchable trong vài ngày, sampling/drop debug/access log lắm lời, archive raw log vào object storage rẻ với retention dài hơn store đã index. Với **traces**, chuyển head-based → **tail-based** để giữ error và trace chậm (giá trị cao) rồi drop những cái nhanh thành công. Nền tảng cho cả ba là tiered retention: gần đây high-resolution, dài hạn đã downsample.

:::muted
**Trade-off** — Mỗi nhát cắt đánh đổi chi phí với cơ hội đúng cái data bạn cần khi có incident vẫn còn; sampling hung hãn và retention ngắn tiết kiệm tiền nhưng có rủi ro đúng cái request fail cụ thể hay cái slow burn cả tuần đã biến mất. Nghệ thuật là theo trọng số giá trị: không bao giờ sampling error, giữ SLI metric ở full resolution và retention dài, nhưng drop 99% traffic khỏe và downsample data cũ. Governance tập trung (quota, quy chi phí theo team, label budget) vs quyền tự chủ của team bản thân nó là một trade-off — show-back khiến team sở hữu chi tiêu, nhưng quota quá cứng chặn một team thật sự cần thêm cardinality.
:::

:::muted
**Bẫy thường gặp** — Thất bại thảm họa là cắt mù quáng rồi phát hiện trong outage kế tiếp rằng bạn đã sampling mất cái trace, drop cái log, hay downsample cái metric mình cần. Một bẫy tinh vi hơn: chi phí observability scale theo tần suất deploy và pod churn, không phải traffic — pod id k8s phù du và label theo-từng-deploy âm thầm thổi phồng cardinality, nên một cú tăng tốc CI/CD có thể làm nổ hóa đơn metric mà không thêm user nào. Bảo vệ tín hiệu giá trị-cao (SLI, error trace, audit log) bằng rule never-sample/never-drop tường minh, quy chi phí ngược về team sinh ra nó, và coi vi phạm cardinality-limit là một alert, không phải một hóa đơn bất ngờ.
:::

*Đào sâu tiếp — lãnh đạo muốn cắt nửa hóa đơn trong quý tới. Phép đo đầu tiên bạn lấy để biết 50% thật sự nằm ở đâu trước khi cắt bất cứ thứ gì là gì?*

**Từ khoá ăn điểm** — `active series · label allowlist · relabeling · recording rules · tiered retention · tail-based sampling · cost attribution / show-back · never-sample SLIs`
