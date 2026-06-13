# 1-system-design-mastery / 3-messaging-and-streaming
Summary: kept 9, delete 0 of 9

## 0-card — senior — [Kafka, MessageQueue]
**Question:** Your team argues Kafka vs RabbitMQ for an order-processing pipeline. Make the correct choice and justify every point where you would pick Kafka over RabbitMQ and vice versa.
**Verdict:** KEEP — Open-ended design trade-off that scales with seniority and invites follow-ups on delivery guarantees.

### New answer (en)
**TL;DR** — Pick **Kafka** when you need a replayable, retained event log read by multiple independent consumer groups at high throughput; pick **RabbitMQ** when you need a task queue with flexible routing where each message is processed once by one worker and deleted on ACK.

**How it works** — Kafka is a durable, partitioned commit log: consumers track their own offsets, so the same stream can be replayed (audit, event sourcing, backfilling a new service) and read by many groups independently, scaling to 100k+ msg/s with hours/days of retention and transactional exactly-once *within the broker*. RabbitMQ is a broker with exchanges (topic/fanout/header) and bindings: messages are routed to queues, delivered to a competing consumer, ACKed, then deleted — ideal for moderate-volume task queues where operational simplicity and rich routing matter more than replay.

:::muted
**Trade-off** — Kafka pushes offset management onto consumers: a slow consumer doesn't block fast ones but accumulates lag silently, and group rebalancing is stop-the-world for the whole group. RabbitMQ deletes on ACK — simpler, but you lose replay entirely.
:::

:::muted
**Common pitfall** — Believing "Kafka exactly-once" covers your whole system. It only holds inside the broker; external side effects (DB writes, emails) still duplicate unless you add application-level idempotency (an idempotency key checked in the DB).
:::

*Go deeper — If you need both Kafka's replay and RabbitMQ's per-message routing, how would you bridge the two?*

**Keywords** — `offset · consumer group · log retention · replay · transactional.id · exchange/binding · competing consumers`

### New answer (vi)
**Chốt** — Chọn **Kafka** khi cần một event log có thể replay, lưu giữ lâu, đọc bởi nhiều consumer group độc lập ở throughput cao; chọn **RabbitMQ** khi cần task queue với routing linh hoạt, mỗi message được xử lý đúng một lần bởi một worker rồi xóa khi ACK.

**Cơ chế** — Kafka là một commit log bền, được partition: consumer tự quản offset, nên cùng stream có thể replay (audit, event sourcing, backfill service mới) và được nhiều group đọc độc lập, scale lên 100k+ msg/s với retention hàng giờ/ngày và exactly-once *trong broker* qua transactional producer. RabbitMQ là broker với exchange (topic/fanout/header) và binding: message được route đến queue, deliver cho competing consumer, ACK rồi xóa — hợp với task queue volume vừa, nơi sự đơn giản vận hành và routing phong phú quan trọng hơn replay.

:::muted
**Trade-off** — Kafka đẩy việc quản offset sang consumer: consumer chậm không block consumer nhanh nhưng tích lag im lặng, và rebalancing là stop-the-world cho cả group. RabbitMQ xóa khi ACK — đơn giản hơn nhưng mất hẳn khả năng replay.
:::

:::muted
**Bẫy thường gặp** — Tin rằng "exactly-once của Kafka" bao trùm cả hệ thống. Nó chỉ đúng trong broker; side effect bên ngoài (DB write, email) vẫn duplicate trừ khi bạn thêm idempotency ở application (idempotency key kiểm trong DB).
:::

*Đào sâu tiếp — Nếu cần cả replay của Kafka lẫn routing per-message của RabbitMQ, bạn bắc cầu hai cái thế nào?*

**Từ khoá ăn điểm** — `offset · consumer group · log retention · replay · transactional.id · exchange/binding · competing consumers`

## 1-card — senior — [Kafka, MessageQueue]
**Question:** Explain the outbox pattern. Why does it solve the "dual write" problem that simply publishing an event after a DB write cannot?
**Verdict:** KEEP — Requires reasoning about atomicity and failure modes across two systems; classic senior design question.

### New answer (en)
**TL;DR** — The outbox pattern writes the domain row and an "outbox event" row in the *same* DB transaction, then a separate relay publishes committed outbox rows to Kafka — making the event and the DB change atomic, which a publish-after-commit never is.

**How it works** — The "dual write" bug: you commit to the DB, then call `kafka.send(event)`; if the process crashes between the two, the DB change persists but the event is lost forever. The outbox fixes this by making the event part of the same atomic transaction as the data. A relay then drains the outbox — either CDC (Debezium tailing the WAL) or a polling worker — and publishes to Kafka with retry, so the event eventually arrives even if the first publish fails. There is now no window where the data is committed but the event is unrecoverable.

:::muted
**Trade-off** — You add a relay to monitor and operate: Debezium brings Kafka Connect/cluster overhead, while a poller adds latency (the poll interval) and extra DB reads. You buy correctness (no lost events) at the cost of moving parts.
:::

:::muted
**Common pitfall** — The relay publishes but crashes before marking the outbox row processed; on restart it re-publishes the same event. The relay is at-least-once, so consumers MUST be idempotent — dedupe by event ID and use idempotent upserts.
:::

*Go deeper — Where would you prefer Debezium CDC over a polling relay, and what's the cost of each at scale?*

**Keywords** — `dual write · atomic transaction · outbox · CDC/Debezium · WAL · relay · at-least-once · idempotent consumer`

### New answer (vi)
**Chốt** — Outbox pattern ghi domain row và một "outbox event" row trong *cùng* một DB transaction, rồi một relay riêng publish các outbox row đã commit lên Kafka — làm event và DB change atomic, điều mà publish-sau-commit không bao giờ đạt được.

**Cơ chế** — Bug "dual write": bạn commit DB rồi gọi `kafka.send(event)`; nếu process crash giữa hai bước, DB change được persist nhưng event mất vĩnh viễn. Outbox sửa điều này bằng cách đưa event vào cùng transaction atomic với dữ liệu. Một relay sau đó rút outbox — hoặc CDC (Debezium đọc WAL) hoặc polling worker — và publish lên Kafka có retry, nên event eventually đến nơi ngay cả khi lần publish đầu thất bại. Không còn cửa sổ nào mà dữ liệu đã commit nhưng event không thể khôi phục.

:::muted
**Trade-off** — Bạn thêm một relay phải monitor và vận hành: Debezium kéo theo overhead Kafka Connect/cluster, còn poller thêm latency (polling interval) và DB read phụ. Bạn mua tính đúng (không mất event) bằng giá các thành phần phụ.
:::

:::muted
**Bẫy thường gặp** — Relay publish xong nhưng crash trước khi đánh dấu outbox row đã xử lý; khi restart nó re-publish cùng event. Relay là at-least-once, nên consumer BẮT BUỘC idempotent — dedupe theo event ID và dùng idempotent upsert.
:::

*Đào sâu tiếp — Khi nào bạn ưu tiên Debezium CDC hơn polling relay, và chi phí mỗi cách ở quy mô lớn là gì?*

**Từ khoá ăn điểm** — `dual write · atomic transaction · outbox · CDC/Debezium · WAL · relay · at-least-once · idempotent consumer`

## 2-card — senior — [Kafka]
**Question:** A Kafka topic has 12 partitions and your consumer group has 8 consumers. You need to process all events for a given user_id in order. How do you guarantee this, and what happens if you add a 13th consumer?
**Verdict:** KEEP — Concrete scenario testing partitioning, ordering, and parallelism limits with a non-obvious twist.

### New answer (en)
**TL;DR** — Produce with `key = user_id` so Kafka's partitioner (`hash(key) % numPartitions`) sends all of a user's events to one partition, where order is guaranteed. With 12 partitions, a 13th consumer gets no assignment and sits idle — group parallelism is capped at the partition count.

**How it works** — Kafka guarantees order *within* a partition, not across them. Keying by `user_id` pins each user to a stable partition, so a single consumer reads that user's events sequentially. With 12 partitions and 8 consumers, each consumer owns 1–2 partitions; Kafka spreads them as evenly as possible. Because a partition is owned by at most one consumer in a group, adding consumers beyond 12 leaves the extras idle — the only way to add real parallelism is more partitions.

:::muted
**Trade-off** — Hash-by-user_id creates hot partitions when a few users (a celebrity posting 1000 events/min) dwarf the rest; that partition's consumer lags. Mitigate by sub-partitioning (e.g. `user_id + event_type`) or a virtual key plus consumer-side dedupe — at the cost of weaker per-user ordering.
:::

:::muted
**Common pitfall** — Changing partition count on a live topic. `hash(user_id) % N` changes when N changes, so a user that was on partition 3 may move to 7 — in-flight ordered processing for that user breaks. Never shrink partitions on a live topic; grow only with a migration plan.
:::

*Go deeper — How would you preserve per-user ordering while still scaling past the partition-count parallelism ceiling?*

**Keywords** — `key=user_id · hash(key) % numPartitions · ordering within partition · idle consumer · hot partition · partition count`

### New answer (vi)
**Chốt** — Produce với `key = user_id` để partitioner của Kafka (`hash(key) % numPartitions`) gửi mọi event của một user vào một partition, nơi order được đảm bảo. Với 12 partition, consumer thứ 13 không được gán gì và ngồi idle — parallelism của group bị chặn bởi số partition.

**Cơ chế** — Kafka đảm bảo order *trong* một partition, không phải qua các partition. Key theo `user_id` ghim mỗi user vào một partition ổn định, nên một consumer đọc event của user đó tuần tự. Với 12 partition và 8 consumer, mỗi consumer giữ 1–2 partition; Kafka phân đều nhất có thể. Vì một partition chỉ thuộc tối đa một consumer trong group, thêm consumer quá 12 khiến phần dư idle — cách duy nhất để thêm parallelism thật là thêm partition.

:::muted
**Trade-off** — Hash-theo-user_id tạo hot partition khi vài user (user viral post 1000 event/phút) lấn át phần còn lại; consumer của partition đó bị lag. Giảm thiểu bằng sub-partition (vd `user_id + event_type`) hoặc virtual key cộng dedupe phía consumer — đổi lại order per-user yếu hơn.
:::

:::muted
**Bẫy thường gặp** — Thay đổi số partition trên live topic. `hash(user_id) % N` đổi khi N đổi, nên user đang ở partition 3 có thể chuyển sang 7 — ordered processing in-flight cho user đó vỡ. Không bao giờ giảm partition trên live topic; tăng chỉ với kế hoạch migration.
:::

*Đào sâu tiếp — Làm sao giữ ordering per-user mà vẫn scale vượt trần parallelism bằng số partition?*

**Từ khoá ăn điểm** — `key=user_id · hash(key) % numPartitions · ordering within partition · idle consumer · hot partition · partition count`

## 3-card — senior — [Kafka, MessageQueue]
**Question:** What is backpressure in a streaming system, and what are the concrete mechanisms to implement it in Kafka-based and queue-based architectures?
**Verdict:** KEEP — Tests a concept plus concrete cross-system mechanisms and a real failure mode; strong senior depth.

### New answer (en)
**TL;DR** — Backpressure is how a slow consumer keeps a fast producer from overwhelming it, preventing unbounded buffering and OOM. In Kafka it's pull-based (the consumer controls its poll rate; lag is the signal); in RabbitMQ it's `prefetch_count` (QoS) limiting outstanding unacked messages.

**How it works** — Kafka never pushes — consumers pull, so a slow consumer simply polls less often and its lag (consumer offset vs end offset) grows on the broker; you watch it with `kafka-consumer-groups.sh --describe`. RabbitMQ pushes, so backpressure is explicit: `prefetch_count` caps how many unacked messages a consumer holds; once it's busy and hits the cap, RabbitMQ stops delivering to it until it ACKs.

:::muted
**Trade-off** — Kafka stores un-consumed backlog cheaply in log segments on the broker, absorbing producer bursts for days. RabbitMQ holds backlog in memory (or disk with lazy queues) — a slow consumer can fill memory and crash the broker. Kafka is inherently better at absorbing bursts.
:::

:::muted
**Common pitfall** — Large `max.poll.records` (e.g. 10000) with slow processing. If a poll's batch takes longer than `max.poll.interval.ms` (default 5 min), Kafka declares the consumer dead, rebalances, and evicts it — offsets never commit, so the whole batch is reprocessed.
:::

*Go deeper — How do you tune `max.poll.records` and `max.poll.interval.ms` together so a heavy batch never triggers a rebalance?*

**Keywords** — `pull vs push · consumer lag · prefetch_count/QoS · max.poll.records · max.poll.interval.ms · log segments · lazy queue`

### New answer (vi)
**Chốt** — Backpressure là cách consumer chậm ngăn producer nhanh làm ngợp mình, tránh buffer vô hạn và OOM. Trong Kafka nó pull-based (consumer kiểm soát poll rate; lag là tín hiệu); trong RabbitMQ là `prefetch_count` (QoS) giới hạn số message unacked đang chờ.

**Cơ chế** — Kafka không bao giờ push — consumer pull, nên consumer chậm chỉ poll thưa hơn và lag của nó (consumer offset vs end offset) tăng trên broker; bạn theo dõi bằng `kafka-consumer-groups.sh --describe`. RabbitMQ push, nên backpressure là tường minh: `prefetch_count` chặn số message unacked consumer giữ; khi nó bận và chạm trần, RabbitMQ ngừng deliver đến nó cho tới khi nó ACK.

:::muted
**Trade-off** — Kafka lưu backlog chưa consume rẻ trong log segment trên broker, hấp thụ producer burst hàng ngày. RabbitMQ giữ backlog trong memory (hoặc disk với lazy queue) — consumer chậm có thể lấp đầy memory và crash broker. Kafka tự nhiên tốt hơn ở việc hấp thụ burst.
:::

:::muted
**Bẫy thường gặp** — `max.poll.records` lớn (vd 10000) với xử lý chậm. Nếu batch một lần poll mất lâu hơn `max.poll.interval.ms` (mặc định 5 phút), Kafka coi consumer đã chết, rebalance, và đẩy nó ra — offset không commit, nên cả batch bị reprocess.
:::

*Đào sâu tiếp — Bạn tune `max.poll.records` và `max.poll.interval.ms` cùng nhau thế nào để một batch nặng không bao giờ trigger rebalance?*

**Từ khoá ăn điểm** — `pull vs push · consumer lag · prefetch_count/QoS · max.poll.records · max.poll.interval.ms · log segments · lazy queue`

## 4-card — staff — [MessageQueue]
**Question:** In an event-driven architecture, a downstream service fails to process an event. Walk through the full dead-letter queue (DLQ) strategy: when to DLQ, what to put in it, and how to operationalise it.
**Verdict:** KEEP — Staff-level operational design with retry policy, triage, replay ordering — rich full-arc question.

### New answer (en)
**TL;DR** — Retry with exponential backoff + jitter; after N attempts publish the original event to a DLQ enriched with enough metadata to replay it; then alert on DLQ depth, triage transient vs poison-pill failures, and replay carefully so you don't violate ordering.

**How it works** — After N failed retries the consumer stops and writes the event to a dead-letter topic/queue with: original topic, partition+offset, error message, stack trace, retry count, consumer ID, timestamp — everything needed to diagnose and re-publish. Alert when DLQ depth crosses a threshold so on-call sees stuck events. Operators then triage: transient errors (DB timeout, network blip) are replayed once the upstream issue is fixed; poison pills (events that will always fail) are discarded after investigation or routed to a quarantine topic for manual review. Replay is either an automated job re-publishing to the source topic or per-event by hand.

:::muted
**Trade-off** — Too-aggressive retry without a DLQ lets a poison pill block an ordered partition forever; too-shallow retry dumps transient errors into the DLQ instantly, creating on-call noise. Tune retry count and backoff against your event-processing latency SLO.
:::

:::muted
**Common pitfall** — Replaying DLQ events back into the source topic out of order relative to newer events for the same entity. With a `user_id` key, replaying an old event after newer ones causes state regression — replay through a consumer that applies business rules to decide if a late event is still valid.
:::

*Go deeper — How do you replay a DLQ for an ordering-sensitive entity without regressing state from newer events already processed?*

**Keywords** — `exponential backoff + jitter · enriched metadata · DLQ depth alert · poison pill · quarantine topic · replay job · out-of-order replay`

### New answer (vi)
**Chốt** — Retry với exponential backoff + jitter; sau N lần publish original event lên DLQ kèm đủ metadata để replay; rồi alert theo DLQ depth, triage lỗi transient vs poison-pill, và replay cẩn thận để không vi phạm ordering.

**Cơ chế** — Sau N retry thất bại, consumer dừng và ghi event lên dead-letter topic/queue với: original topic, partition+offset, error message, stack trace, retry count, consumer ID, timestamp — mọi thứ cần để chẩn đoán và re-publish. Alert khi DLQ depth vượt threshold để on-call thấy event kẹt. Operator triage: lỗi transient (DB timeout, network blip) được replay sau khi fix upstream; poison pill (event luôn fail) bị discard sau điều tra hoặc route đến quarantine topic để review thủ công. Replay là một job tự động re-publish lên source topic, hoặc thủ công per-event.

:::muted
**Trade-off** — Retry quá aggressive mà không có DLQ để poison pill block partition có ordering vĩnh viễn; retry quá nông đẩy lỗi transient vào DLQ ngay, tạo on-call noise. Tune retry count và backoff theo SLO latency xử lý event.
:::

:::muted
**Bẫy thường gặp** — Replay event từ DLQ vào source topic sai thứ tự so với event mới hơn cho cùng entity. Với `user_id` key, replay event cũ sau event mới gây state regression — replay qua consumer áp dụng business rule để quyết định late event còn valid không.
:::

*Đào sâu tiếp — Làm sao replay DLQ cho entity nhạy ordering mà không regress state từ event mới hơn đã xử lý?*

**Từ khoá ăn điểm** — `exponential backoff + jitter · enriched metadata · DLQ depth alert · poison pill · quarantine topic · replay job · out-of-order replay`

## 5-card — staff — [Kafka, MessageQueue]
**Question:** Describe exactly-once vs at-least-once delivery. For a payment processing system, which do you choose and how do you actually achieve it end-to-end?
**Verdict:** KEEP — Staff design + correctness reasoning; the "exactly-once is impossible without idempotency" insight is exactly what an interviewer probes.

### New answer (en)
**TL;DR** — For payments, choose **idempotent at-least-once**, not "exactly-once" — Kafka's transactional exactly-once stops at the broker, so end-to-end correctness comes from an application idempotency key that makes duplicate processing a no-op.

**How it works** — At-least-once: the producer retries until acked and the consumer commits the offset after processing — so a crash between processing and commit reprocesses the message and runs side effects twice. Kafka's exactly-once (`enable.idempotence=true` + `transactional.id`) only guarantees this inside Kafka. For real payments you make the side effects idempotent: embed a `payment_id` in the event, write with `INSERT ... ON CONFLICT (payment_id) DO NOTHING`, and pass the same `payment_id` as the provider's idempotency key — now a duplicate event changes nothing.

:::muted
**Trade-off** — Kafka transactions add ~10–15% latency from coordination across producers, brokers, and the group coordinator. The application idempotency-key approach is broker-agnostic and is the only correct option for *external* side effects — true exactly-once across systems is provably impossible, so idempotent at-least-once is the ceiling.
:::

:::muted
**Common pitfall** — Generating the idempotency key on the consumer from event contents. Two genuinely distinct payments with identical fields then collide on one key, and a legitimate second payment is silently dropped. Generate a UUID at the original request and carry it in the event payload.
:::

*Go deeper — Where exactly does Kafka's transactional exactly-once stop being enough, and how do you draw that boundary for a charge to an external provider?*

**Keywords** — `at-least-once · enable.idempotence · transactional.id · idempotency key · ON CONFLICT DO NOTHING · provider idempotency key · idempotent at-least-once`

### New answer (vi)
**Chốt** — Với payment, chọn **idempotent at-least-once**, không phải "exactly-once" — exactly-once transactional của Kafka dừng ở broker, nên tính đúng end-to-end đến từ một idempotency key ở application làm duplicate processing thành no-op.

**Cơ chế** — At-least-once: producer retry đến khi được ack và consumer commit offset sau xử lý — nên crash giữa xử lý và commit khiến reprocess message và side effect chạy hai lần. Exactly-once của Kafka (`enable.idempotence=true` + `transactional.id`) chỉ đảm bảo điều này trong Kafka. Với payment thật, bạn làm side effect idempotent: nhúng `payment_id` vào event, ghi bằng `INSERT ... ON CONFLICT (payment_id) DO NOTHING`, và truyền cùng `payment_id` làm idempotency key của provider — giờ event duplicate không đổi gì.

:::muted
**Trade-off** — Kafka transaction thêm ~10–15% latency do coordination giữa producer, broker và group coordinator. Cách idempotency-key ở application không phụ thuộc broker và là lựa chọn đúng duy nhất cho side effect *bên ngoài* — exactly-once thật qua các hệ thống chứng minh được là bất khả, nên idempotent at-least-once là trần.
:::

:::muted
**Bẫy thường gặp** — Generate idempotency key ở consumer từ nội dung event. Hai payment thực sự khác nhau nhưng cùng field sẽ đụng cùng một key, và payment thứ hai hợp lệ bị drop im lặng. Generate UUID lúc request gốc và mang nó trong event payload.
:::

*Đào sâu tiếp — Exactly-once transactional của Kafka dừng đủ ở đâu, và bạn vẽ ranh giới đó thế nào cho một lần charge tới provider bên ngoài?*

**Từ khoá ăn điểm** — `at-least-once · enable.idempotence · transactional.id · idempotency key · ON CONFLICT DO NOTHING · provider idempotency key · idempotent at-least-once`

## 6-card — senior — [MessageQueue]
**Question:** Pub/Sub vs point-to-point queue: give a concrete scenario where using pub/sub when you needed a queue causes a production bug.
**Verdict:** KEEP — Forces a concrete failure scenario and a design judgment; the Kafka consumer-group nuance makes it non-trivial.

### New answer (en)
**TL;DR** — Pub/Sub broadcasts every message to every subscriber; a point-to-point queue gives each message to exactly one worker. Model a "send welcome email" job as pub/sub across 3 replicas and every replica sends the email — the user gets 3 welcome emails.

**How it works** — In pub/sub, N subscribers each receive a copy, which is right when each must react independently (order-created → inventory AND notification AND analytics). A queue with competing consumers delivers each message once, which is right for a task that must happen exactly once. The bug above is a routing-semantics mismatch: a side-effecting job was broadcast. The fix is a queue — a RabbitMQ queue with competing consumers, or a single Kafka consumer group where each event goes to exactly one consumer in the group.

:::muted
**Trade-off** — Pub/sub buys independent fan-out at the cost of duplicate work for once-only tasks; a queue buys exactly-one delivery at the cost of not naturally fanning out to multiple independent reactions. Choose by whether the consumers are independent reactors or competing workers.
:::

:::muted
**Common pitfall** — In Kafka, accidentally giving each pod its own consumer group instead of a shared group name. Kafka then treats the pods as independent subscribers and delivers every message to every pod — the same pub/sub bug, hidden inside a Kafka wrapper.
:::

*Go deeper — In Kafka, what concrete config makes the difference between "one shared group" and "accidental fan-out," and how would you catch the mistake in review?*

**Keywords** — `pub/sub broadcast · competing consumers · consumer group (shared name) · fan-out · once-only side effect · group.id`

### New answer (vi)
**Chốt** — Pub/Sub broadcast mọi message đến mọi subscriber; point-to-point queue đưa mỗi message cho đúng một worker. Model job "gửi welcome email" như pub/sub qua 3 replica thì mỗi replica gửi email — user nhận 3 email chào mừng.

**Cơ chế** — Trong pub/sub, N subscriber mỗi cái nhận một bản copy, đúng khi mỗi cái phải phản ứng độc lập (order-created → inventory VÀ notification VÀ analytics). Queue với competing consumer deliver mỗi message một lần, đúng cho task phải xảy ra đúng một lần. Bug trên là sai routing semantics: một job có side effect bị broadcast. Fix là queue — RabbitMQ queue với competing consumer, hoặc một Kafka consumer group nơi mỗi event đến đúng một consumer trong group.

:::muted
**Trade-off** — Pub/sub mua fan-out độc lập với giá duplicate work cho task once-only; queue mua delivery đúng-một-lần với giá không fan-out tự nhiên đến nhiều phản ứng độc lập. Chọn theo việc consumer là reactor độc lập hay competing worker.
:::

:::muted
**Bẫy thường gặp** — Trong Kafka, vô tình cho mỗi pod một consumer group riêng thay vì cùng một group name. Kafka coi các pod là subscriber độc lập và deliver mọi message đến mọi pod — đúng bug pub/sub, ẩn trong Kafka wrapper.
:::

*Đào sâu tiếp — Trong Kafka, config cụ thể nào tạo khác biệt giữa "một group chung" và "fan-out vô tình", và bạn bắt lỗi này thế nào lúc review?*

**Từ khoá ăn điểm** — `pub/sub broadcast · competing consumers · consumer group (shared name) · fan-out · once-only side effect · group.id`

## 7-card — staff — [Kafka]
**Question:** A single Kafka partition receives 500k messages/second but your consumer can only process 50k/s. You cannot increase partition count. How do you solve this?
**Verdict:** KEEP — Staff scaling puzzle that defeats the naive "add consumers" answer and demands ordering-vs-parallelism reasoning.

### New answer (en)
**TL;DR** — A partition is owned by one consumer thread, so adding consumers does nothing — you must parallelize *inside* the consumer: read a batch and fan it out to a thread pool (or an external work queue), committing the Kafka offset only after every task in the batch durably completes.

**How it works** — Within a group, one partition maps to one consumer instance, so the bottleneck is per-consumer throughput, not consumer count. Options: (1) fan a polled batch out to a thread pool and commit the batch offset only when all threads finish — parallel within the batch, not globally ordered; (2) push work into an in-memory/Redis-backed queue drained by many worker threads, committing the Kafka offset after the work queue ACKs all tasks; (3) move to a stream framework (Kafka Streams, Flink) that handles internal parallelism for you.

:::muted
**Trade-off** — A thread pool breaks ordering if messages in a batch depend on each other; you need idempotent, order-insensitive processing. If order matters, group by the ordering key and pin each group to one thread (a virtual single-threaded sub-stream) — recovering order at the cost of per-key parallelism.
:::

:::muted
**Common pitfall** — Committing the offset before all pool tasks finish. If worker thread for message M fails but an offset past M is already committed, M is silently dropped. Commit only when the whole batch is durably done (DB write committed, downstream ACK received).
:::

*Go deeper — How do you keep per-key ordering and crash-safe offset commits while fanning a single partition across a thread pool?*

**Keywords** — `one partition = one thread · in-consumer parallelism · thread pool fan-out · work queue · Kafka Streams/Flink · commit after durable completion`

### New answer (vi)
**Chốt** — Một partition do một consumer thread sở hữu, nên thêm consumer vô ích — bạn phải parallel *bên trong* consumer: đọc một batch và fan-out ra thread pool (hoặc external work queue), chỉ commit Kafka offset sau khi mọi task trong batch hoàn thành bền vững.

**Cơ chế** — Trong một group, một partition map tới một consumer instance, nên bottleneck là throughput per-consumer, không phải số consumer. Lựa chọn: (1) fan-out batch đã poll ra thread pool và commit batch offset chỉ khi tất cả thread xong — parallel trong batch, không order globally; (2) đẩy work vào queue in-memory/Redis được rút bởi nhiều worker thread, commit Kafka offset sau khi work queue ACK tất cả task; (3) chuyển sang stream framework (Kafka Streams, Flink) tự xử lý internal parallelism.

:::muted
**Trade-off** — Thread pool phá order nếu message trong batch phụ thuộc nhau; bạn cần xử lý idempotent, order-insensitive. Nếu order quan trọng, group theo ordering key và ghim mỗi group vào một thread (virtual single-threaded sub-stream) — lấy lại order với giá parallelism per-key.
:::

:::muted
**Bẫy thường gặp** — Commit offset trước khi mọi task pool xong. Nếu worker thread cho message M fail nhưng offset vượt M đã commit, M bị drop im lặng. Chỉ commit khi cả batch xong bền vững (DB write committed, downstream ACK nhận).
:::

*Đào sâu tiếp — Làm sao giữ ordering per-key và commit offset crash-safe khi fan một partition qua thread pool?*

**Từ khoá ăn điểm** — `one partition = one thread · in-consumer parallelism · thread pool fan-out · work queue · Kafka Streams/Flink · commit after durable completion`

## 8-card — senior — [Kafka]
**Question:** How do consumer group rebalances in Kafka cause latency spikes and even data reprocessing, and what strategies reduce rebalance impact?
**Verdict:** KEEP — Diagnosis + mitigation with a real GC-pause failure mode; strong senior operational depth.

### New answer (en)
**TL;DR** — A rebalance is stop-the-world: every consumer pauses while partitions are reassigned, and a consumer that loses a partition can fail its offset commit and have its last batch reprocessed. Cut the impact with cooperative incremental rebalancing and static membership.

**How it works** — Rebalances fire when a consumer joins, leaves, crashes, or misses heartbeats within `session.timeout.ms`. While the coordinator reassigns partitions, all consumers stop; a rolling deploy of 50 pods can cause ~50 rebalances, each pausing the group 5–30s. Mitigations: (1) **cooperative incremental rebalancing** (`CooperativeStickyAssignor`, Kafka 2.4+) reassigns only affected partitions so the rest keep processing; (2) **static membership** (`group.instance.id`) lets a known consumer rejoin within the timeout and reclaim its partitions without a full rebalance. Tune `session.timeout.ms` / `heartbeat.interval.ms` to your GC/pause profile.

:::muted
**Trade-off** — Static membership delays failure detection: a truly dead consumer isn't reassigned until `session.timeout.ms` elapses. A shorter timeout detects failures faster but triggers more spurious rebalances from GC pauses or brief CPU starvation.
:::

:::muted
**Common pitfall** — A long JVM GC pause causes missed heartbeats → Kafka marks the consumer dead → its partition is reassigned → GC finishes → the consumer tries to commit offsets it no longer owns → `CommitFailedException` → the new owner reprocesses the whole last batch.
:::

*Go deeper — How do you set `session.timeout.ms` and `heartbeat.interval.ms` for a GC-heavy JVM consumer to avoid spurious rebalances without delaying real failure detection?*

**Keywords** — `stop-the-world rebalance · session.timeout.ms · CooperativeStickyAssignor · static membership / group.instance.id · GC pause · CommitFailedException`

### New answer (vi)
**Chốt** — Rebalance là stop-the-world: mọi consumer pause trong khi partition được phân lại, và consumer mất partition có thể fail commit offset và bị reprocess batch cuối. Giảm tác động bằng cooperative incremental rebalancing và static membership.

**Cơ chế** — Rebalance kích hoạt khi consumer join, leave, crash, hoặc miss heartbeat trong `session.timeout.ms`. Trong khi coordinator phân lại partition, mọi consumer dừng; một rolling deploy 50 pod có thể gây ~50 rebalance, mỗi cái pause group 5–30s. Giảm thiểu: (1) **cooperative incremental rebalancing** (`CooperativeStickyAssignor`, Kafka 2.4+) chỉ phân lại partition bị ảnh hưởng nên phần còn lại vẫn xử lý; (2) **static membership** (`group.instance.id`) cho consumer known rejoin trong timeout và lấy lại partition mà không full rebalance. Tune `session.timeout.ms` / `heartbeat.interval.ms` theo GC/pause profile.

:::muted
**Trade-off** — Static membership trì hoãn phát hiện lỗi: consumer thật sự chết không được phân lại cho tới khi hết `session.timeout.ms`. Timeout ngắn hơn phát hiện lỗi nhanh hơn nhưng trigger nhiều rebalance giả từ GC pause hoặc CPU starvation ngắn.
:::

:::muted
**Bẫy thường gặp** — Một GC pause JVM dài gây missed heartbeat → Kafka đánh dấu consumer đã chết → partition của nó phân lại → GC xong → consumer cố commit offset nó không còn sở hữu → `CommitFailedException` → owner mới reprocess cả batch cuối.
:::

*Đào sâu tiếp — Bạn set `session.timeout.ms` và `heartbeat.interval.ms` thế nào cho consumer JVM nặng GC để tránh rebalance giả mà không trì hoãn phát hiện lỗi thật?*

**Từ khoá ăn điểm** — `stop-the-world rebalance · session.timeout.ms · CooperativeStickyAssignor · static membership / group.instance.id · GC pause · CommitFailedException`
