# 1-system-design-mastery / 19-designing-a-webhook-delivery-system
Summary: kept 8, delete 0 of 8

## 0-card — junior — [Webhooks, Async Delivery]
**Question:** You are building a webhook system that must deliver each platform event (for example `order.paid`) to many third-party HTTP endpoints you do not own or control. Why is "just call the subscriber's URL inline when the event happens" the wrong design, and what is the core architecture that fixes it?
**Verdict:** KEEP — Open-ended "why is this wrong + what fixes it" design question with a real why (coupling to untrusted endpoints) that scales with seniority.

### New answer (en)
**TL;DR** — Calling the subscriber inline couples your core transaction's latency and availability to endpoints you do not control. The fix is to decouple producing the event from delivering it: persist a delivery record, enqueue a job, and let a separate worker pool make the outbound HTTP call.

**How it works** — When an event happens, the producing service writes a durable delivery record (event id, subscriber, payload, status) and enqueues a delivery job, then returns immediately. A pool of delivery workers picks up jobs and makes the outbound call. The queue becomes the durable buffer that lets you retry, scale, and observe delivery independently of the original request, and the persisted record is the source of truth for "did this event reach the subscriber yet?".

:::muted
**Trade-off** — Inline is simpler and gives an immediate success/failure signal, but it lets one subscriber timing out at 30s stall your checkout. Async adds moving parts (queue, workers, delivery store) and makes delivery eventually-consistent, so the producer can no longer assume the webhook was received.
:::

:::muted
**Common pitfall** — Doing the HTTP call inside the same DB transaction or request handler: a hung subscriber holds the transaction open, exhausts the connection pool, and cascades to an outage. The other trap is fire-and-forget with no record — a worker crash silently loses the event. Persist the intent to deliver before attempting it (transactional outbox).
:::

*Go deeper: how do you guarantee the delivery record and the business write commit atomically so you never enqueue a job for an event that rolled back?*

**Keywords** — `decouple` · `delivery record` · `queue` · `transactional outbox` · `eventually consistent`

### New answer (vi)
**Chốt** — Gọi subscriber inline gắn độ trễ và độ sẵn sàng của transaction lõi vào những endpoint bạn không kiểm soát. Cách sửa là tách việc tạo sự kiện khỏi việc gửi: lưu một bản ghi delivery, đẩy một job vào queue, rồi để một pool worker riêng thực hiện lời gọi HTTP ra ngoài.

**Cơ chế** — Khi sự kiện xảy ra, service tạo sự kiện ghi một bản ghi delivery bền vững (event id, subscriber, payload, trạng thái) rồi đẩy một job gửi vào queue và trả về ngay. Một pool worker lấy job ra và thực hiện lời gọi ra ngoài. Queue trở thành bộ đệm bền vững cho phép retry, scale và quan sát quá trình gửi độc lập với request gốc; bản ghi delivery là nguồn sự thật cho câu hỏi "sự kiện này đã tới subscriber chưa?".

:::muted
**Trade-off** — Inline đơn giản và cho tín hiệu thành công/thất bại ngay, nhưng chỉ một subscriber timeout 30s là làm nghẽn luồng checkout. Async thêm nhiều thành phần (queue, worker, kho delivery) và biến việc gửi thành eventually-consistent, nên producer không còn được giả định webhook đã được nhận.
:::

:::muted
**Bẫy thường gặp** — Gọi HTTP ngay trong cùng transaction DB hay request handler: một subscriber treo giữ transaction mở, làm cạn connection pool, cascade thành sập. Bẫy còn lại là fire-and-forget không lưu bản ghi — worker crash là âm thầm mất sự kiện. Hãy lưu ý định gửi trước khi thử gửi (transactional outbox).
:::

*Đào sâu tiếp: làm sao để bản ghi delivery và write nghiệp vụ commit nguyên tử cùng nhau, để không bao giờ enqueue job cho một sự kiện đã rollback?*

**Từ khoá ăn điểm** — `decouple` · `delivery record` · `queue` · `transactional outbox` · `eventually consistent`

## 1-card — senior — [Retries, Backoff]
**Question:** A subscriber's endpoint returns 503 intermittently and sometimes times out. Design the retry policy for at-least-once delivery: how do you schedule retries, why add jitter, and how do you decide when to stop retrying and dead-letter the delivery?
**Verdict:** KEEP — Full design question with scheduling, jitter rationale, retryable-vs-terminal classification, and stop conditions — carries real senior trade-offs.

### New answer (en)
**TL;DR** — Retry with exponential backoff plus jitter, treat 5xx/timeouts/connection errors as retryable but 4xx (except 429) as terminal, and cap by attempt count or a total time budget (e.g. 24h); on hitting the cap, dead-letter the delivery and mark it permanently failed.

**How it works** — Backoff delay grows geometrically (10s, 30s, 2m, 10m, 1h…) so a struggling endpoint gets increasing breathing room instead of being hammered. Randomized jitter on each delay stops thousands of deliveries that failed at the same instant from all retrying at the same instant — a synchronized thundering herd. Terminal 4xx are not retried because a malformed or unauthorized request never succeeds. The attempt cap (or time budget) bounds worst-case work; past it, the delivery moves to a dead-letter queue.

:::muted
**Trade-off** — Short backoff recovers transient blips fast but amplifies load on a sick endpoint and keeps workers on hopeless deliveries; long backoff and a generous budget survive multi-hour outages but raise end-to-end latency and grow the in-flight retry backlog. The attempt cap is the knob: too low gives up on recoverable outages, too high lets a dead subscriber waste capacity for days.
:::

:::muted
**Common pitfall** — At-least-once plus retries means duplicates are inevitable (the 200 response was lost), so they are a contract to document — consumers must dedupe — not a bug to eliminate. Retrying non-retryable 4xx hammers an endpoint forever; unbounded retries with no DLQ silently fill the queue and starve healthy deliveries. Always cap attempts and surface dead-lettered deliveries.
:::

*Go deeper: how do you set the outbound HTTP timeout, and how does that timeout interact with your backoff schedule and worker capacity?*

**Keywords** — `exponential backoff` · `jitter` · `thundering herd` · `429 retryable` · `dead-letter queue` · `attempt cap`

### New answer (vi)
**Chốt** — Retry theo exponential backoff cộng jitter, coi 5xx/timeout/lỗi kết nối là retryable nhưng 4xx (trừ 429) là terminal, và đặt trần theo số lần thử hoặc một ngân sách tổng thời gian (ví dụ 24h); khi chạm trần thì dead-letter delivery và đánh dấu thất bại vĩnh viễn.

**Cơ chế** — Độ trễ backoff tăng theo cấp số nhân (10s, 30s, 2m, 10m, 1h…) để endpoint đang chật vật có thêm thời gian thở thay vì bị dội liên tục. Jitter ngẫu nhiên trên mỗi khoảng trễ ngăn hàng nghìn delivery cùng fail tại một thời điểm khỏi cùng retry tại một thời điểm — một thundering herd đồng bộ. 4xx terminal không retry vì request sai định dạng hoặc thiếu quyền chẳng bao giờ thành công. Trần số lần thử (hoặc ngân sách thời gian) giới hạn công việc trường hợp xấu nhất; vượt qua đó, delivery chuyển vào dead-letter queue.

:::muted
**Trade-off** — Backoff ngắn phục hồi trục trặc thoáng qua nhanh nhưng khuếch đại tải lên endpoint ốm yếu và giữ worker bận với delivery vô vọng; backoff dài và ngân sách rộng sống sót qua sự cố nhiều giờ nhưng tăng độ trễ end-to-end và phình backlog retry đang chờ. Trần số lần thử là cái núm: quá thấp thì bỏ cuộc với sự cố phục hồi được, quá cao thì subscriber chết lãng phí năng lực hàng ngày trời.
:::

:::muted
**Bẫy thường gặp** — At-least-once cộng retry khiến trùng lặp là tất yếu (response 200 bị mất), nên đó là một hợp đồng cần ghi rõ — consumer phải dedupe — chứ không phải bug cần triệt tiêu. Retry các 4xx non-retryable thì dội mãi vào một endpoint; retry vô hạn không có DLQ âm thầm làm đầy queue và bỏ đói delivery khỏe mạnh. Luôn đặt trần và phơi bày những cái đã dead-letter.
:::

*Đào sâu tiếp: bạn đặt timeout HTTP ra ngoài thế nào, và timeout đó tương tác ra sao với lịch backoff và năng lực worker?*

**Từ khoá ăn điểm** — `exponential backoff` · `jitter` · `thundering herd` · `429 retryable` · `dead-letter queue` · `attempt cap`

## 2-card — middle — [Idempotency, HMAC]
**Question:** Because your system is at-least-once, subscribers will occasionally receive the same webhook twice, and they also need to be sure a request really came from you and was not forged. How do you design delivery ids and request signing so consumers can both dedupe and verify authenticity?
**Verdict:** KEEP — Two-part design (dedupe id + HMAC signing) with real correctness reasoning (raw bytes, constant-time compare, replay window).

### New answer (en)
**TL;DR** — Stamp each delivery with a stable unique id (e.g. `X-Webhook-Id`) that survives every retry so consumers dedupe on it, and sign the raw request body plus a timestamp with a per-subscriber HMAC secret in `X-Webhook-Signature` so consumers can verify authenticity with a constant-time compare.

**How it works** — The delivery id stays identical across all retry attempts, so the consumer stores seen ids and treats a repeat as a no-op. For authenticity, you compute an HMAC over the *raw* bytes (plus a timestamp) using a per-subscriber shared secret; the consumer recomputes it with their copy of the secret and compares with constant-time equality. A match proves the payload came from a holder of the secret and was not modified in transit. The timestamp is inside the signed material and stale deliveries are rejected, which blunts replay attacks.

:::muted
**Trade-off** — Symmetric HMAC is simple and fast but the secret lives on both sides, so a subscriber compromise forces rotation and a leak lets an attacker forge events. Asymmetric signatures (platform signs with a private key, consumers verify with a public key) remove the shared-secret problem for many untrusted consumers, at the cost of key distribution and rotation.
:::

:::muted
**Common pitfall** — Signing or comparing the parsed/re-serialized body instead of the exact received bytes makes signatures mysteriously fail for some payloads — verify before any JSON re-encode. A non-constant-time compare leaks timing. On dedupe, too short an id-retention window lets a late retry slip through as "new", and treating a duplicate as an error rather than a silent no-op breaks legitimate at-least-once retries.
:::

*Go deeper: how do you rotate a per-subscriber secret without dropping or failing in-flight deliveries signed with the old key?*

**Keywords** — `X-Webhook-Id` · `HMAC` · `raw body` · `constant-time compare` · `timestamp / replay window` · `idempotent dedupe`

### New answer (vi)
**Chốt** — Đóng dấu mỗi delivery bằng một id ổn định, duy nhất (ví dụ `X-Webhook-Id`) sống sót qua mọi lần retry để consumer dedupe trên nó, và ký raw body cộng một timestamp bằng secret HMAC riêng từng subscriber trong `X-Webhook-Signature` để consumer xác thực bằng so sánh thời gian hằng số.

**Cơ chế** — Delivery id giữ y nguyên qua mọi lần retry, nên consumer lưu các id đã thấy và coi một lần lặp là no-op. Về tính chính danh, bạn tính HMAC trên *raw* bytes (cộng timestamp) bằng secret dùng chung riêng từng subscriber; consumer tính lại bằng bản secret của họ và so sánh bằng nhau theo thời gian hằng số. Khớp tức payload do người nắm secret tạo ra và không bị sửa trên đường truyền. Timestamp nằm trong phần dữ liệu được ký và delivery quá cũ bị từ chối, làm cùn các đòn replay.

:::muted
**Trade-off** — HMAC đối xứng đơn giản và nhanh nhưng secret tồn tại ở cả hai phía, nên một subscriber bị xâm phạm buộc phải xoay secret và một lần rò rỉ cho phép kẻ tấn công giả mạo sự kiện. Chữ ký bất đối xứng (nền tảng ký bằng private key, consumer xác minh bằng public key) loại bỏ vấn đề secret dùng chung cho nhiều consumer không đáng tin, đổi lại là phân phối và xoay khóa phức tạp hơn.
:::

:::muted
**Bẫy thường gặp** — Ký hoặc so sánh body đã parse/re-serialize thay vì đúng bytes nhận được khiến chữ ký fail bí ẩn với một số payload — hãy xác minh trước khi re-encode JSON. So sánh không theo thời gian hằng số làm rò rỉ định thời. Về dedupe, cửa sổ lưu id quá ngắn để một retry đến muộn lọt qua như "mới", và coi một bản trùng là lỗi thay vì no-op âm thầm sẽ phá vỡ các retry at-least-once hợp lệ.
:::

*Đào sâu tiếp: làm sao xoay secret theo từng subscriber mà không làm rớt hay fail các delivery đang bay đã ký bằng khóa cũ?*

**Từ khoá ăn điểm** — `X-Webhook-Id` · `HMAC` · `raw body` · `constant-time compare` · `timestamp / replay window` · `idempotent dedupe`

## 3-card — senior — [Isolation, Concurrency]
**Question:** One subscriber's endpoint starts taking 25 seconds per request and timing out. Suddenly deliveries to all your other healthy subscribers slow to a crawl too. Why does this happen with a single shared worker pool, and how do you isolate subscribers so one bad consumer cannot block the others?
**Verdict:** KEEP — Diagnosis (head-of-line blocking) plus an isolation design (per-subscriber queues, concurrency caps, breakers) with real capacity trade-offs.

### New answer (en)
**TL;DR** — A shared worker pool fills with workers stuck on the slow endpoint (head-of-line blocking), starving everyone else. Isolate by giving each subscriber its own logical queue and a per-subscriber concurrency cap, plus a per-endpoint circuit breaker, so the blast radius of one bad consumer stays in its own lane.

**How it works** — Instead of one global FIFO feeding a shared pool, deliveries are scheduled fairly across subscribers with a per-subscriber concurrency limit, so a slow subscriber consumes only its share. A per-endpoint circuit breaker opens after N consecutive failures and stops sending for a cooldown, draining the backlog slowly via half-open probes instead of burning workers on a dead host. Tight outbound HTTP timeouts are the prerequisite — they cap how long any one stuck request can hold a worker.

:::muted
**Trade-off** — Strict per-subscriber queues and caps give strong isolation and fairness but cost more: thousands of subscribers mean thousands of queues, and capacity reserved for an idle subscriber can't be borrowed by a busy one. A single shared pool is operationally trivial and efficient normally but offers no isolation. Many systems compromise with a bounded set of shared worker shards plus per-subscriber limits and breakers — trading perfect isolation for manageable cardinality.
:::

:::muted
**Common pitfall** — The headline failure is head-of-line blocking. A subtle trap is setting outbound timeouts too high, letting each stuck request hold a worker far longer than necessary. Another is forgetting the breaker, so even with per-subscriber lanes you keep paying full timeout cost on every retry to a host that is clearly down instead of backing off fast.
:::

*Go deeper: with thousands of subscribers you can't run a real queue per subscriber — how do you map subscribers onto a bounded number of shards while preserving fairness?*

**Keywords** — `head-of-line blocking` · `per-subscriber queue` · `concurrency cap` · `circuit breaker` · `half-open probe` · `tight timeout`

### New answer (vi)
**Chốt** — Một worker pool dùng chung bị đầy worker kẹt vào endpoint chậm (head-of-line blocking), bỏ đói mọi người khác. Cô lập bằng cách cho mỗi subscriber một queue logic riêng và một trần concurrency theo từng subscriber, cộng một circuit breaker theo từng endpoint, để bán kính ảnh hưởng của một consumer tồi nằm gọn trong làn của nó.

**Cơ chế** — Thay vì một FIFO toàn cục nuôi một pool dùng chung, delivery được lập lịch công bằng giữa các subscriber với một giới hạn concurrency theo từng subscriber, nên một subscriber chậm chỉ tiêu đúng phần của nó. Circuit breaker theo từng endpoint mở sau N lần fail liên tiếp và ngừng gửi trong một cooldown, xả backlog từ từ qua các probe half-open thay vì đốt worker vào một host đã chết. Timeout HTTP ra ngoài chặt là điều kiện tiên quyết — chúng giới hạn thời gian một request bị kẹt giữ một worker.

:::muted
**Trade-off** — Queue và trần riêng chặt theo subscriber cho cô lập và công bằng mạnh nhưng tốn hơn: hàng nghìn subscriber nghĩa là hàng nghìn queue, và năng lực dành cho một subscriber rảnh không cho một subscriber bận mượn được. Một pool dùng chung thì đơn giản và hiệu quả lúc bình thường nhưng không có cô lập. Nhiều hệ thống thỏa hiệp bằng một số hữu hạn worker shard dùng chung cộng giới hạn và breaker theo subscriber — đổi cô lập hoàn hảo lấy cardinality quản lý được.
:::

:::muted
**Bẫy thường gặp** — Lỗi nổi bật là head-of-line blocking. Một bẫy tinh vi là đặt timeout ra ngoài quá cao, khiến mỗi request bị kẹt giữ worker lâu hơn cần thiết nhiều. Lỗi khác là quên breaker, nên ngay cả khi có làn riêng theo subscriber bạn vẫn trả đủ chi phí timeout cho mỗi retry tới một host rõ ràng đã sập thay vì lùi nhanh.
:::

*Đào sâu tiếp: với hàng nghìn subscriber bạn không thể chạy một queue thật cho mỗi subscriber — làm sao map subscriber lên một số shard hữu hạn mà vẫn giữ công bằng?*

**Từ khoá ăn điểm** — `head-of-line blocking` · `per-subscriber queue` · `concurrency cap` · `circuit breaker` · `half-open probe` · `tight timeout`

## 4-card — senior — [Ordering, Throughput]
**Question:** A subscriber complains that they received `subscription.updated` before `subscription.created` for the same object, which broke their state machine. When do webhook consumers actually need ordered delivery, how would you provide it, and what does strict ordering cost you?
**Verdict:** KEEP — Nuanced "when do you actually need ordering" question with per-key vs version-number designs and serialization cost — strong senior depth.

### New answer (en)
**TL;DR** — Order only matters within a single entity, not globally, so provide per-key ordering: partition by a stable key (the resource id) and process each key's events serially while different keys run in parallel. Strict ordering costs you throughput — it turns parallel delivery into a serial chain and lets one stuck event head-of-line-block every later event for that key.

**How it works** — Partition deliveries by an ordering key (e.g. the resource id) and keep one in-flight delivery per key; the next event for a key dispatches only after the previous one is acked. With retries, a failed delivery for a key blocks subsequent events for that key until it succeeds or is dead-lettered. The serialization-free alternative is to attach a monotonic sequence number or version to each event and let consumers reorder or drop stale events themselves.

:::muted
**Trade-off** — Strict per-key ordering is easy for consumers to reason about but caps throughput on a hot key and head-of-line-blocks on a stuck event. Sequence-number-and-let-the-consumer-reorder keeps delivery fully parallel and resilient but pushes complexity onto every consumer (persist last-seen version, handle out-of-order arrival). Most platforms choose at-least-once with no ordering guarantee plus version numbers, because guaranteeing order over an unreliable network with retries is expensive.
:::

:::muted
**Common pitfall** — Promising *global* ordering is a trap: retries, multiple workers, and network variability make true cross-entity order practically impossible without crippling serialization. Even per-key ordering fails if the key is wrong (ordering by user id when the entity is an order id) so related events scatter across partitions. And per-key serialization creates a new failure mode where one poison delivery permanently stalls all later events for that key — you need a dead-letter escape, accepting the consumer may then see a gap.
:::

*Go deeper: if you dead-letter a stuck delivery to unblock a key's chain, how does the consumer detect and recover the gap that creates?*

**Keywords** — `per-key ordering` · `ordering key / partition` · `sequence number / version` · `head-of-line blocking` · `global order is a trap`

### New answer (vi)
**Chốt** — Thứ tự chỉ quan trọng trong phạm vi một entity, không phải toàn cục, nên hãy cung cấp ordering theo từng key: phân vùng theo một key ổn định (resource id) và xử lý sự kiện của mỗi key một cách tuần tự trong khi các key khác chạy song song. Ordering nghiêm ngặt khiến bạn trả giá throughput — nó biến delivery song song thành một chuỗi tuần tự và để một sự kiện bị kẹt head-of-line-block mọi sự kiện sau của key đó.

**Cơ chế** — Phân vùng delivery theo một ordering key (ví dụ resource id) và giữ mỗi key chỉ một delivery đang bay; sự kiện kế tiếp của một key chỉ phát đi sau khi cái trước đã được ack. Với retry, một delivery fail của một key chặn các sự kiện sau của key đó tới khi nó thành công hoặc bị dead-letter. Cách không cần tuần tự hóa là gắn một sequence number hoặc version đơn điệu vào mỗi sự kiện và để consumer tự sắp xếp lại hoặc bỏ các sự kiện cũ.

:::muted
**Trade-off** — Ordering nghiêm ngặt theo từng key dễ cho consumer suy luận nhưng giới hạn throughput trên một key nóng và head-of-line-block khi một sự kiện kẹt. Cách sequence-number-rồi-để-consumer-sắp-xếp giữ delivery hoàn toàn song song và bền bỉ nhưng đẩy độ phức tạp sang từng consumer (lưu version cuối thấy được, xử lý đến lệch thứ tự). Đa số nền tảng chọn at-least-once không đảm bảo thứ tự cộng version number, vì đảm bảo thứ tự qua mạng không tin cậy có retry rất đắt.
:::

:::muted
**Bẫy thường gặp** — Hứa ordering *toàn cục* là một cái bẫy: retry, nhiều worker, và biến thiên mạng làm thứ tự xuyên-entity thực sự gần như bất khả thi nếu không tuần tự hóa đến tê liệt. Ngay cả ordering theo key cũng fail nếu chọn key sai (sắp theo user id trong khi entity là order id) khiến sự kiện liên quan rải khắp các partition. Và tuần tự hóa theo key tạo failure mode mới khi một delivery độc hại làm đình trệ vĩnh viễn mọi sự kiện sau của key đó — bạn cần lối thoát dead-letter, chấp nhận consumer khi đó có thể thấy một khoảng trống.
:::

*Đào sâu tiếp: nếu bạn dead-letter một delivery kẹt để khai thông chuỗi của một key, consumer phát hiện và phục hồi khoảng trống đó ra sao?*

**Từ khoá ăn điểm** — `per-key ordering` · `ordering key / partition` · `sequence number / version` · `head-of-line blocking` · `global order là bẫy`

## 5-card — middle — [Dead Letter, Replay]
**Question:** A subscriber was down for six hours during a deploy and exhausted the retry budget on thousands of deliveries, so those events are now permanently failed. Design dead-letter handling and a replay mechanism so the subscriber can recover those missed events once they are healthy again.
**Verdict:** KEEP — Concrete recovery-design question (DLQ store + replay API + rate-limited, dedupe-preserving replay) with real operational reasoning.

### New answer (en)
**TL;DR** — Don't discard exhausted deliveries: move them to a queryable dead-letter store with the full delivery and attempt history, surface them via dashboard/API and alerts, and offer a rate-limited replay (by delivery id, time range, or event type) that re-enqueues the *original* delivery id so dedupe still works.

**How it works** — When a delivery exhausts retries, persist it to a DLQ keeping event id, payload, subscriber, attempt history, and last error, and mark the record `failed` so it is queryable. Make failures visible through a list/get API and an alert or daily digest, not silent. Replay re-enqueues the original deliveries through the normal pipeline, reusing the original delivery id so the consumer can still dedupe; it should be rate-limited so a mass replay does not overwhelm the freshly recovered endpoint.

:::muted
**Trade-off** — A rich, queryable DLQ with full payloads enables self-service replay and great debuggability, but grows storage and may retain sensitive payloads long after the event (retention/compliance concerns). Auto-replay when the breaker closes is convenient but risks re-delivering unwanted events or stampeding; manual operator/subscriber-triggered replay is safer but slower and needs good tooling.
:::

:::muted
**Common pitfall** — The biggest failure is a silent dead-letter: events expire into a queue nobody watches and data loss is found days later. Replaying without rate limiting recreates the original outage by dumping the whole backlog at once. Replaying out of order breaks consumers that depend on per-entity sequence — preserve ordering keys or send versions. And replaying with a *fresh* delivery id defeats dedupe and causes double-processing — always replay with the original id.
:::

*Go deeper: if the consumer's dedupe window is shorter than the outage, replaying with the original id won't be recognized as a duplicate — how do you handle that?*

**Keywords** — `dead-letter store` · `attempt history` · `replay API` · `original delivery id` · `rate-limited replay` · `silent DLQ`

### New answer (vi)
**Chốt** — Đừng vứt các delivery đã cạn retry: chuyển chúng vào một kho dead-letter truy vấn được với trọn delivery và lịch sử các lần thử, phơi bày qua dashboard/API và cảnh báo, và cung cấp một replay có rate-limit (theo delivery id, khoảng thời gian, hoặc loại sự kiện) đẩy lại *delivery id gốc* để dedupe vẫn hoạt động.

**Cơ chế** — Khi một delivery cạn retry, lưu nó vào DLQ giữ event id, payload, subscriber, lịch sử các lần thử và lỗi cuối, và đánh dấu bản ghi là `failed` để truy vấn được. Làm thất bại hiện ra qua một API list/get và một cảnh báo hoặc bản tổng hợp hằng ngày, chứ không âm thầm. Replay đẩy lại các delivery gốc qua pipeline bình thường, dùng lại delivery id gốc để consumer vẫn dedupe được; nó nên được rate-limit để một đợt replay hàng loạt không nhấn chìm endpoint vừa phục hồi.

:::muted
**Trade-off** — Một DLQ giàu thông tin, truy vấn được với payload đầy đủ giúp replay tự phục vụ và debug rất tốt, nhưng làm phình storage và có thể lưu payload nhạy cảm lâu sau sự kiện (lo ngại retention/tuân thủ). Auto-replay khi breaker đóng thì tiện nhưng có nguy cơ gửi lại sự kiện không mong muốn hoặc làm giẫm đạp; replay thủ công do vận hành viên/subscriber kích hoạt thì an toàn hơn nhưng chậm hơn và cần công cụ tốt.
:::

:::muted
**Bẫy thường gặp** — Thất bại lớn nhất là một dead-letter âm thầm: sự kiện hết hạn vào một queue chẳng ai theo dõi và mất dữ liệu bị phát hiện vài ngày sau. Replay không rate-limit tái tạo đúng sự cố ban đầu bằng cách dội toàn bộ backlog cùng lúc. Replay lệch thứ tự phá vỡ các consumer phụ thuộc sequence theo từng entity — hãy giữ ordering key hoặc gửi version. Và replay với một delivery id *mới* vô hiệu hóa dedupe và gây xử lý lặp — luôn replay với id gốc.
:::

*Đào sâu tiếp: nếu cửa sổ dedupe của consumer ngắn hơn thời gian sự cố, replay với id gốc sẽ không được nhận ra là trùng — bạn xử lý điều đó thế nào?*

**Từ khoá ăn điểm** — `dead-letter store` · `attempt history` · `replay API` · `original delivery id` · `rate-limited replay` · `silent DLQ`

## 6-card — middle — [Rate Limiting, Backpressure]
**Question:** A burst of events produces 5,000 webhooks for one subscriber in a few seconds, but their endpoint can only handle about 50 requests per second and starts returning 429. How do you rate limit delivery per subscriber so you respect each consumer's capacity instead of hammering it?
**Verdict:** KEEP — Backpressure design question with token-bucket-per-subscriber, 429/Retry-After handling, and static-vs-adaptive trade-offs.

### New answer (en)
**TL;DR** — Cap the outbound rate *per subscriber* (not just globally) with a distributed token bucket keyed by subscriber id; the queue absorbs the burst as backpressure, smoothing 5,000 events into a stream the endpoint can digest. Treat `429` as a first-class signal — honor `Retry-After` and throttle that subscriber down rather than counting it as a failure.

**How it works** — Each delivery consumes a token; the bucket refills at the subscriber's configured rate, and workers block or defer when it's empty. The queue holds the rest, so you never overshoot the endpoint's ceiling. A `429 Too Many Requests` dynamically lowers that subscriber's rate and respects its `Retry-After`. The per-subscriber limit is configurable so high-capacity consumers aren't artificially throttled.

:::muted
**Trade-off** — Per-subscriber limiting protects fragile endpoints but raises delivery latency for bursts and adds shared state (a distributed token bucket, usually Redis) every worker consults on the hot path. A purely reactive "send fast, back off on 429" approach needs no config and self-adapts, but guarantees you overshoot before learning the ceiling — the thing you're trying to avoid. Static limits are predictable but can be stale; adaptive limits track real capacity but are more complex and can oscillate.
:::

:::muted
**Common pitfall** — A global-only limit lets one subscriber's burst eat the shared budget and starve others; conversely, per-worker local limits sum to far more than the subscriber can take because nothing coordinates across workers — the bucket must be shared/distributed. Ignoring `Retry-After` and blindly retrying a 429 turns rate limiting into a self-inflicted DoS. And if throttled deliveries pile up unboundedly you breach the retry budget and dead-letter events that were only slow — pair the limit with sane queue depth.
:::

*Go deeper: a distributed token bucket in Redis is on every delivery's hot path — how do you keep it from becoming the bottleneck or a single point of failure?*

**Keywords** — `token bucket` · `per-subscriber rate limit` · `429 / Retry-After` · `backpressure` · `distributed (Redis) bucket` · `adaptive vs static`

### New answer (vi)
**Chốt** — Giới hạn tốc độ gửi ra *theo từng subscriber* (không chỉ toàn cục) bằng một token bucket phân tán khóa theo subscriber id; queue hấp thụ đợt bùng nổ như backpressure, làm mượt 5.000 sự kiện thành một dòng mà endpoint tiêu hóa được. Coi `429` là tín hiệu hạng nhất — tôn trọng `Retry-After` và giảm tốc subscriber đó xuống thay vì tính nó như một thất bại.

**Cơ chế** — Mỗi delivery tiêu một token; bucket nạp lại theo tốc độ cấu hình của subscriber, và worker chặn hoặc hoãn khi bucket cạn. Queue giữ phần còn lại, nên bạn không bao giờ vượt trần của endpoint. Một `429 Too Many Requests` động thái hạ tốc độ subscriber đó xuống và tôn trọng `Retry-After` của nó. Giới hạn theo từng subscriber có thể cấu hình để consumer năng lực cao không bị throttle giả tạo.

:::muted
**Trade-off** — Giới hạn theo từng subscriber bảo vệ endpoint mong manh nhưng tăng độ trễ gửi cho các đợt bùng nổ và thêm trạng thái dùng chung (một token bucket phân tán, thường ở Redis) mà mọi worker phải tra trên hot path. Cách thuần phản ứng "gửi nhanh, lùi khi gặp 429" không cần cấu hình và tự thích nghi, nhưng đảm bảo bạn vượt ngưỡng trước khi học được trần — đúng điều bạn đang cố tránh. Giới hạn tĩnh dễ đoán nhưng có thể lỗi thời; giới hạn thích nghi bám năng lực thật nhưng phức tạp hơn và có thể dao động.
:::

:::muted
**Bẫy thường gặp** — Một giới hạn chỉ toàn cục để đợt bùng nổ của một subscriber ngốn hết ngân sách dùng chung và bỏ đói những subscriber khác; ngược lại, các giới hạn cục bộ theo từng worker cộng lại nhiều hơn nhiều so với mức subscriber chịu được vì không gì điều phối giữa các worker — bucket phải dùng chung/phân tán. Phớt lờ `Retry-After` và retry mù một 429 biến rate limit thành một cú DoS tự gây ra. Và nếu các delivery bị throttle chất đống vô hạn thì bạn vi phạm ngân sách retry và dead-letter những sự kiện vốn chỉ chậm — hãy ghép giới hạn với độ sâu queue hợp lý.
:::

*Đào sâu tiếp: một token bucket phân tán ở Redis nằm trên hot path của mọi delivery — làm sao để nó không trở thành bottleneck hay điểm chết đơn lẻ?*

**Từ khoá ăn điểm** — `token bucket` · `per-subscriber rate limit` · `429 / Retry-After` · `backpressure` · `distributed (Redis) bucket` · `adaptive vs static`

## 7-card — staff — [Architecture, Observability]
**Question:** Design the end-to-end webhook delivery platform that powers a product like Stripe's: events flow from internal services to thousands of external subscribers. Walk through ingestion, fan-out, the delivery pipeline with retries and DLQ, and the observability subscribers need to trust it. What are the key scaling and reliability decisions?
**Verdict:** KEEP — Capstone staff system-design question integrating every prior concept, with genuine scale/reliability decisions (write amplification, fairness, central guarantee).

### New answer (en)
**TL;DR** — Four stages: ingest domain events into a durable log (outbox/Kafka), fan out one event into N persisted delivery records, run a horizontally scalable worker pipeline (sign + per-subscriber rate/concurrency limits + breaker + tight timeout + backoff retries → DLQ), and ship first-class observability (per-subscriber dashboards, a deliveries API, alerts, self-service replay). The central guarantee is at-least-once with idempotency keys.

**How it works** — *Ingestion:* internal services publish to a durable log so production is decoupled and never lost. *Fan-out:* a router matches each event against active subscriptions and, per (event, subscriber) pair, writes a `pending` delivery record and enqueues a job — one event becomes N deliveries. *Delivery:* workers pull jobs, sign each request with the subscriber's secret and a stable delivery id, apply per-subscriber rate/concurrency limits with a circuit breaker, call with a tight timeout, and on failure reschedule with backoff+jitter until the cap, then DLQ. *Observability:* per-subscriber success/latency/failure dashboards, a deliveries API with full attempt history, signed-payload inspection, alerts, and replay over the DLQ.

:::muted
**Trade-off** — Persisting every delivery and attempt gives exact accountability and replay, but at fan-out scale the write amplification dominates storage and DB load, pushing toward partitioned/sharded delivery stores and aggressive retention. Pull-based workers scale elastically and isolate failures but require careful per-subscriber fairness. You choose the central guarantee: at-least-once with idempotency keys is the pragmatic default; exactly-once or strict ordering is far more expensive and usually an opt-in per-key mode.
:::

:::muted
**Common pitfall** — At platform scale the dangerous failures are systemic: a poison event or misconfigured subscriber saturates shared workers (head-of-line blocking) and degrades everyone, so isolation, breakers, and tight timeouts are non-negotiable. A retry storm after a broad outage can self-DoS your infra and the recovering subscribers unless retries carry jitter and respect per-subscriber limits. Leaked or unrotated signing secrets let attackers forge events. And without first-class observability, subscribers can't tell a dropped event from a slow one — the deliveries API, signature docs, and replay are part of the product.
:::

*Go deeper: how do you guarantee the fan-out itself is exactly-once — that the router never drops or double-writes delivery records when it crashes mid-fan-out?*

**Keywords** — `durable log / outbox` · `fan-out write amplification` · `at-least-once + idempotency` · `per-subscriber fairness` · `DLQ + replay` · `observability as product`

### New answer (vi)
**Chốt** — Bốn giai đoạn: nạp domain event vào một log bền vững (outbox/Kafka), fan-out một sự kiện thành N bản ghi delivery được lưu, chạy một pipeline worker scale ngang (ký + giới hạn rate/concurrency theo subscriber + breaker + timeout chặt + retry backoff → DLQ), và đưa ra observability hạng nhất (dashboard theo subscriber, một API deliveries, cảnh báo, replay tự phục vụ). Đảm bảo trung tâm là at-least-once với idempotency key.

**Cơ chế** — *Ingestion:* các service nội bộ publish vào một log bền vững để việc tạo sự kiện được tách rời và không bao giờ mất. *Fan-out:* một router khớp mỗi sự kiện với các subscription đang hoạt động và, với mỗi cặp (event, subscriber), ghi một bản ghi delivery `pending` rồi đẩy một job — một sự kiện trở thành N delivery. *Gửi:* worker kéo job, ký mỗi request bằng secret của subscriber và một delivery id ổn định, áp giới hạn rate/concurrency theo subscriber kèm circuit breaker, gọi với timeout chặt, và khi fail thì lập lịch lại theo backoff+jitter tới trần rồi vào DLQ. *Observability:* dashboard tỉ lệ thành công/độ trễ/thất bại theo subscriber, một API deliveries với lịch sử các lần thử đầy đủ, kiểm tra payload đã ký, cảnh báo, và replay trên DLQ.

:::muted
**Trade-off** — Lưu mọi delivery và lần thử cho trách nhiệm giải trình chính xác và khả năng replay, nhưng ở quy mô fan-out sự khuếch đại ghi chi phối tải storage và DB, đẩy về phía kho delivery được partition/shard và retention quyết liệt. Worker kéo job scale co giãn và cô lập thất bại nhưng đòi hỏi công bằng theo subscriber cẩn thận. Bạn chọn đảm bảo trung tâm: at-least-once với idempotency key là mặc định thực dụng; exactly-once hay ordering nghiêm ngặt đắt hơn nhiều và thường là chế độ opt-in theo từng key.
:::

:::muted
**Bẫy thường gặp** — Ở quy mô nền tảng, những thất bại nguy hiểm mang tính hệ thống: một sự kiện độc hại hay một subscriber cấu hình sai làm bão hòa worker dùng chung (head-of-line blocking) và làm suy giảm tất cả, nên cô lập, breaker và timeout chặt là không thể thương lượng. Một cơn bão retry sau sự cố diện rộng có thể tự-DoS chính hạ tầng của bạn và các subscriber đang phục hồi nếu retry không mang jitter và không tôn trọng giới hạn theo subscriber. Secret ký rò rỉ hay không xoay cho phép kẻ tấn công giả mạo sự kiện. Và thiếu observability hạng nhất, subscriber không phân biệt nổi một sự kiện bị rớt với một sự kiện chậm — API deliveries, tài liệu chữ ký và replay là một phần của sản phẩm.
:::

*Đào sâu tiếp: làm sao đảm bảo bản thân fan-out là exactly-once — router không bao giờ rớt hay ghi trùng bản ghi delivery khi nó crash giữa chừng fan-out?*

**Từ khoá ăn điểm** — `durable log / outbox` · `fan-out write amplification` · `at-least-once + idempotency` · `per-subscriber fairness` · `DLQ + replay` · `observability là sản phẩm`
