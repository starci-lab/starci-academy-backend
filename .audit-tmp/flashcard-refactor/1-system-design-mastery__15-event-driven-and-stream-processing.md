# 1-system-design-mastery / 15-event-driven-and-stream-processing
Summary: kept 8, delete 0 of 8

## 0-card — middle — [EventDriven, Architecture]
**Question:** A checkout service calls inventory, payment, and email synchronously over HTTP, and the whole flow falls over whenever email is slow. A colleague proposes flipping it to event-driven. What do you actually gain, and what debuggability do you lose?

**Verdict:** KEEP — open-ended design trade-off (decoupling vs distributed debuggability), invites follow-ups on outbox/idempotency.

### New answer (en)
**TL;DR** — You gain temporal, failure, and evolution decoupling: checkout publishes `OrderPlaced` and returns immediately, so a slow email service no longer drags it down. You lose the single synchronous stack trace — the flow is now an async choreography you can only follow with distributed tracing.

**How it works** — In request-driven design the caller blocks on every downstream and inherits its latency and failures. Going event-driven, checkout publishes one event and inventory, payment, and email each subscribe and process at their own pace. They decouple in time (the producer doesn't wait), in failure (one slow consumer doesn't stall the others), and in evolution (add an analytics consumer without touching the producer). The producer no longer needs to know who consumes the event — that is the core win.

:::muted
**Trade-off** — A "completed" request now means only that the event was published, not that the order is fully processed, so you must design for eventual consistency and surface status to the user differently. Debugging requires a correlation/trace id propagated through events, plus observability on consumer lag and DLQs.
:::

:::muted
**Common pitfall** — The distributed monolith: services emit events but still block waiting for a downstream event reply, reintroducing coupling with worse debuggability. Also fire-and-forget with no DLQ silently loses orders, and without idempotent consumers plus an outbox, at-least-once redelivery double-charges or event and DB state diverge.
:::

*Go deeper: how does the outbox pattern stop the publish from succeeding while the DB commit fails?*

**Keywords** — `temporal decoupling · OrderPlaced · eventual consistency · correlation id · DLQ · outbox · idempotent consumer`

### New answer (vi)
**Chốt** — Bạn được decoupling về thời gian, failure và tiến hóa: checkout publish `OrderPlaced` rồi trả về ngay, nên email chậm không còn kéo tụt nó. Bạn mất cái stack trace đồng bộ duy nhất — luồng giờ là một choreography bất đồng bộ chỉ lần theo được bằng distributed tracing.

**Cơ chế** — Trong thiết kế request-driven, caller block ở mọi downstream và thừa hưởng latency cùng failure của chúng. Khi event-driven, checkout publish một event và inventory, payment, email mỗi cái subscribe và xử lý theo nhịp riêng. Chúng decouple về thời gian (producer không chờ), về failure (một consumer chậm không nghẽn cái khác), và về tiến hóa (thêm consumer analytics mà không động vào producer). Producer không còn cần biết ai consume event — đó là cái lợi cốt lõi.

:::muted
**Trade-off** — Một request "hoàn tất" giờ chỉ nghĩa là event đã publish, không phải order đã xử lý xong, nên bạn phải thiết kế cho eventual consistency và hiển thị trạng thái cho user theo cách khác. Debug đòi một correlation/trace id truyền xuyên qua event, cộng observability về consumer lag và DLQ.
:::

:::muted
**Bẫy thường gặp** — Distributed monolith: service phát event nhưng vẫn block chờ một event reply từ downstream, tái lập coupling với khả năng debug tệ hơn. Ngoài ra fire-and-forget không DLQ âm thầm làm mất order, và không có idempotent consumer cộng outbox thì redelivery at-least-once sẽ double-charge hoặc event và state DB phân kỳ.
:::

*Đào sâu tiếp: outbox pattern ngăn việc publish thành công trong khi DB commit fail ra sao?*

**Từ khoá ăn điểm** — `temporal decoupling · OrderPlaced · eventual consistency · correlation id · DLQ · outbox · idempotent consumer`

## 1-card — senior — [DeliverySemantics, Idempotency]
**Question:** Your payment consumer occasionally charges a customer twice. A teammate insists you "just switch the broker to exactly-once and the bug is gone." Explain why exactly-once delivery is largely a myth and how a correct system actually achieves the effect.

**Verdict:** KEEP — debunks a common misconception, requires distributed-systems reasoning and a concrete idempotency design.

### New answer (en)
**TL;DR** — Exactly-once *delivery* can't be guaranteed over an unreliable network, because a producer can never tell a lost ACK ("not delivered") from a dropped ACK ("delivered"), so it must retry and duplicates are inevitable. The honest pattern is at-least-once delivery plus idempotent consumers — you accept duplicates at transport and make processing safe to repeat.

**How it works** — Attach a stable idempotency key (the event id, or a business key like `paymentIntentId`) and have the consumer record processed keys in the *same transaction* as the side effect, rejecting any key it has already seen. What brokers call "exactly-once" (Kafka EOS) is really exactly-once within the broker's own state via transactional offsets — not across external side effects like a DB write or a third-party charge.

:::muted
**Trade-off** — Idempotency needs durable dedup state queried on every message (latency + storage), retained at least as long as the max redelivery window; too short a TTL reopens the duplicate window after a delayed redelivery. Kafka EOS reduces app-level dedup but costs throughput and only covers Kafka-to-Kafka — touch an external DB or API and you're back to idempotency keys.
:::

:::muted
**Common pitfall** — Non-atomic "process then mark done": if the side effect commits but the dedup write fails (or the consumer crashes between them), redelivery re-applies the effect — the double-charge. The dedup record and side effect must commit atomically (same transaction or outbox/inbox). Also a per-attempt UUID makes every retry look new, and in-memory dedup loses state on restart or rebalance.
:::

*Go deeper: how does the inbox pattern make "record key + apply side effect" atomic when the side effect is an external API call?*

**Keywords** — `at-least-once · idempotency key · paymentIntentId · dedup table · transactional offset · Kafka EOS · outbox/inbox`

### New answer (vi)
**Chốt** — Exactly-once *delivery* không thể đảm bảo qua một network không tin cậy, vì producer không bao giờ phân biệt được ACK mất ("chưa deliver") với ACK rớt ("đã deliver"), nên nó buộc phải retry và duplicate là tất yếu. Pattern trung thực là at-least-once delivery cộng idempotent consumer — chấp nhận duplicate ở transport và làm việc xử lý an toàn khi lặp lại.

**Cơ chế** — Gắn một idempotency key ổn định (event id, hoặc business key như `paymentIntentId`) và để consumer ghi các key đã xử lý trong *cùng transaction* với side effect, từ chối key nào đã thấy. Cái broker gọi là "exactly-once" (Kafka EOS) thực ra là exactly-once trong state nội bộ broker qua transactional offset — không phải qua side effect bên ngoài như một DB write hay một charge bên thứ ba.

:::muted
**Trade-off** — Idempotency cần dedup state bền, truy vấn trên mỗi message (latency + storage), giữ ít nhất bằng cửa sổ redelivery tối đa; TTL quá ngắn mở lại cửa sổ duplicate sau một redelivery trễ. Kafka EOS giảm dedup tầng app nhưng tốn throughput và chỉ phủ Kafka-to-Kafka — chạm vào DB hay API ngoài là bạn lại quay về idempotency key.
:::

:::muted
**Bẫy thường gặp** — "Process rồi mark done" không atomic: nếu side effect commit nhưng dedup write fail (hoặc consumer crash giữa hai bước), redelivery áp lại effect — đúng là double-charge. Dedup record và side effect phải commit atomic (cùng transaction hoặc outbox/inbox). Ngoài ra một UUID per-attempt khiến mỗi retry trông như mới, và dedup trong memory mất state khi restart hoặc rebalance.
:::

*Đào sâu tiếp: inbox pattern làm "ghi key + áp side effect" atomic ra sao khi side effect là một lời gọi API ngoài?*

**Từ khoá ăn điểm** — `at-least-once · idempotency key · paymentIntentId · dedup table · transactional offset · Kafka EOS · outbox/inbox`

## 2-card — senior — [Ordering, Partitioning]
**Question:** A wallet service replays events and sometimes applies a "withdraw" before the matching "deposit," producing a negative balance — even though both were published in order. The topic has 12 partitions. What went wrong, and what ordering guarantee do you actually have?

**Verdict:** KEEP — root-cause diagnosis plus the design fix; scales from "wrong key" to producer/consumer concurrency subtleties.

### New answer (en)
**TL;DR** — A partitioned log only guarantees ordering *within a single partition*, never across partitions. Deposit and withdraw for one account landed on different partitions, so different consumers applied them with no relative order — the fix is to make the account id the partition key.

**How it works** — If the partition key is random, round-robin, or a poor key like region, two events for the same account hash to different partitions and are consumed independently, so withdraw can be applied first. Key by account id and every event for that account hashes to the same partition, consumed in publish order by one consumer. Ordering is a property you *design in* by choosing a key that matches your consistency boundary — it is not something the broker gives you globally.

:::muted
**Trade-off** — Per-key ordering forces all events for a hot key onto one partition, so a very active account becomes a throughput ceiling and hotspot you can't parallelize. Coarser keys order more strongly but balance worse; finer keys balance better but only order at that grain. Changing partition count later rehashes keys and breaks per-key ordering for in-flight data unless you stop, drain, and migrate.
:::

:::muted
**Common pitfall** — Even with the right key, retries with `max.in.flight > 1` and no idempotent producer let a retried earlier message land after a later one in the same partition. Fanning one partition's records to a thread pool reorders them — process a partition single-threaded. And a rebalance mid-stream can reprocess from the last committed offset, so non-idempotent handlers reorder effects on recovery.
:::

*Go deeper: how would you preserve ordering while still parallelizing across many accounts within one partition?*

**Keywords** — `per-partition ordering · partition key · account id · consistency boundary · max.in.flight · single-threaded consumer · rebalance`

### New answer (vi)
**Chốt** — Một partitioned log chỉ đảm bảo ordering *trong một partition duy nhất*, không bao giờ xuyên partition. Deposit và withdraw của cùng một account rơi vào các partition khác nhau, nên consumer khác nhau áp chúng không theo thứ tự tương đối — cách sửa là dùng account id làm partition key.

**Cơ chế** — Nếu partition key ngẫu nhiên, round-robin, hoặc một key tệ như region, hai event của cùng account hash về partition khác nhau và bị consume độc lập, nên withdraw có thể áp trước. Key theo account id thì mọi event của account đó hash về cùng partition, được consume theo thứ tự publish bởi một consumer. Ordering là thuộc tính bạn *thiết kế vào* bằng cách chọn key khớp consistency boundary — không phải thứ broker cho bạn ở global.

:::muted
**Trade-off** — Per-key ordering ép mọi event của một hot key vào một partition, nên một account cực active thành trần throughput và hotspot bạn không parallelize được. Key thô order mạnh hơn nhưng cân bằng tệ hơn; key mịn cân bằng tốt hơn nhưng chỉ order ở mức đó. Đổi số partition về sau sẽ rehash key và phá per-key ordering cho data in-flight trừ khi bạn dừng, drain và migrate.
:::

:::muted
**Bẫy thường gặp** — Ngay cả với key đúng, retry với `max.in.flight > 1` và không idempotent producer cho phép một message trước được retry rơi xuống sau một message sau trong cùng partition. Fan record của một partition ra thread pool sẽ reorder chúng — hãy xử lý một partition single-threaded. Và một rebalance giữa stream có thể reprocess từ offset commit gần nhất, nên handler không idempotent reorder effect khi recovery.
:::

*Đào sâu tiếp: làm sao giữ ordering mà vẫn parallelize trên nhiều account trong cùng một partition?*

**Từ khoá ăn điểm** — `per-partition ordering · partition key · account id · consistency boundary · max.in.flight · single-threaded consumer · rebalance`

## 3-card — senior — [StreamProcessing, Windowing]
**Question:** You compute per-minute "clicks" with a streaming job, but mobile clients buffer events offline and ship them minutes later, so closed minute-windows keep getting new data. How do windowing and watermarks let you emit results without either waiting forever or dropping the stragglers?

**Verdict:** KEEP — core stream-processing reasoning (event time, watermarks, allowed lateness) with a real latency/completeness trade-off.

### New answer (en)
**TL;DR** — Aggregate on **event time** in tumbling windows, and use a **watermark** — the engine's assertion that no event earlier than T will still arrive — to decide when a window is complete and emit it. Add an **allowed lateness** grace period so stragglers update and re-emit the result instead of being lost.

**How it works** — Group clicks by when they happened, not when they arrived. The watermark advances as data flows; when it passes a window's end, the window emits. To tolerate offline-buffering clients, keep the window's state for an extra grace period so late events arriving within it re-trigger the aggregate. Events later than the grace are routed to a side output rather than corrupting the main result.

:::muted
**Trade-off** — The watermark is the latency-vs-completeness knob: a conservative (laggy) watermark waits longer, so fewer events are late but latency and open-window memory rise; an aggressive one emits sooner but marks more events late. Allowed lateness improves correctness but forces longer-held state and updates to already-emitted results, so the sink must support upserts or retractions or you double-count.
:::

:::muted
**Common pitfall** — Using processing time "to keep it simple" miscounts whenever ingestion is bursty or replayed — a backfill dumps a day of old clicks into the current minute. A stalled or idle partition freezes the watermark (it advances at the slowest source), so windows never close; you need idle-source detection. And treating late data as droppable without monitoring the side output hides real data loss behind a dashboard that just looks "a bit low."
:::

*Go deeper: how do you choose the watermark delay and allowed-lateness values from the actual lateness distribution of your clients?*

**Keywords** — `event time · tumbling window · watermark · allowed lateness · side output · upsert/retraction · idle-source detection`

### New answer (vi)
**Chốt** — Aggregate theo **event time** trong tumbling window, và dùng một **watermark** — khẳng định của engine rằng không event nào sớm hơn T còn tới nữa — để quyết định khi nào window hoàn tất và emit nó. Thêm một khoảng grace **allowed lateness** để các straggler update và re-emit kết quả thay vì bị mất.

**Cơ chế** — Gom click theo lúc nó xảy ra, không phải lúc nó tới. Watermark tiến lên khi data chảy; khi nó vượt điểm kết thúc window, window emit. Để chịu được client buffer offline, giữ state của window thêm một khoảng grace để event trễ tới trong đó re-trigger aggregate. Event trễ hơn grace được route sang một side output thay vì làm hỏng kết quả chính.

:::muted
**Trade-off** — Watermark là núm vặn giữa latency và completeness: watermark bảo thủ (lag lớn) chờ lâu hơn nên ít event trễ nhưng latency và memory window mở tăng; watermark hung hăng emit sớm hơn nhưng đánh dấu nhiều event là trễ. Allowed lateness cải thiện tính đúng nhưng buộc giữ state lâu hơn và update kết quả đã emit, nên sink phải hỗ trợ upsert hoặc retraction nếu không bạn double-count.
:::

:::muted
**Bẫy thường gặp** — Dùng processing time "cho đơn giản" đếm sai mỗi khi ingestion bursty hoặc replay — một backfill đổ một ngày click cũ vào phút hiện tại. Một partition treo hoặc idle đóng băng watermark (nó tiến theo source chậm nhất), nên window không bao giờ đóng; bạn cần idle-source detection. Và coi late data là droppable mà không monitor side output sẽ giấu data loss thật sau một dashboard chỉ trông "hơi thấp".
:::

*Đào sâu tiếp: làm sao chọn giá trị watermark delay và allowed-lateness từ chính phân phối độ trễ thực tế của client?*

**Từ khoá ăn điểm** — `event time · tumbling window · watermark · allowed lateness · side output · upsert/retraction · idle-source detection`

## 4-card — middle — [EventSourcing, AuditLog]
**Question:** A compliance team wants to know "what did this account look like on March 3rd, and exactly why did the balance change?" Your current CRUD schema overwrites rows in place. Would event sourcing solve this, and what complexity and migration cost are you signing up for?

**Verdict:** KEEP — design decision with a clear "when is it worth it" trade-off and a brutal schema-evolution cost to reason about.

### New answer (en)
**TL;DR** — Yes — event sourcing stores the immutable sequence of events (`MoneyDeposited`, `MoneyWithdrawn`) as the source of truth, so you replay to March 3rd to reconstruct that day's state and each event carries the reason for the change. The cost is real: CQRS read models, snapshots, eventual consistency, and forever-replayable event schemas.

**How it works** — Current state becomes a fold/replay over the event log instead of an overwritten row, giving a built-in, tamper-evident audit log, temporal queries, replay-debugging, and the ability to derive brand-new read models retroactively from the same log. It's justified for domains where audit, correctness, and history are first-class (finance, ledgers) — not for simple CRUD apps.

:::muted
**Trade-off** — Reads now require replaying or maintaining projections (usually via CQRS), and you must add snapshots so you don't replay millions of events per query. A query trivial in CRUD ("all accounts with balance > X") needs a separately built read model, and you inherit eventual consistency between the event store and those models plus a steeper team learning curve.
:::

:::muted
**Common pitfall** — Schema evolution is the killer: events are immutable and live forever, so a v1 event must stay replayable — a careless rename breaks replay of old data and forces event versioning and upcasters. Non-deterministic data or external lookups inside handlers make replays diverge from the original run. And backfilling a credible history from state you no longer have is expensive; teams often pollute the log by storing derived/current state as an "event."
:::

*Go deeper: when migrating, how do you backfill a trustworthy event history from a CRUD database that already lost the original transitions?*

**Keywords** — `immutable event log · fold/replay · CQRS · snapshot · eventual consistency · event versioning · upcaster`

### New answer (vi)
**Chốt** — Có — event sourcing lưu chuỗi event bất biến (`MoneyDeposited`, `MoneyWithdrawn`) làm source of truth, nên bạn replay tới ngày 3 tháng 3 để tái dựng state ngày đó và mỗi event mang lý do thay đổi. Cái giá là thật: read model CQRS, snapshot, eventual consistency, và event schema phải replay được mãi mãi.

**Cơ chế** — State hiện tại trở thành một fold/replay trên event log thay vì một row bị ghi đè, cho một audit log có sẵn và tamper-evident, temporal query, replay-debug, và khả năng suy ra read model hoàn toàn mới một cách hồi tố từ cùng log. Nó chính đáng cho domain nơi audit, tính đúng và history là first-class (finance, ledger) — không phải cho app CRUD đơn giản.

:::muted
**Trade-off** — Read giờ đòi replay hoặc duy trì projection (thường qua CQRS), và bạn phải thêm snapshot để khỏi replay hàng triệu event mỗi query. Một query tầm thường trong CRUD ("tất cả account balance > X") cần một read model xây riêng, và bạn thừa hưởng eventual consistency giữa event store và các model đó cộng learning curve dốc hơn cho team.
:::

:::muted
**Bẫy thường gặp** — Schema evolution là sát thủ: event bất biến và sống mãi, nên một event v1 vẫn phải replay được — một rename cẩu thả phá replay data cũ và buộc event versioning cùng upcaster. Dữ liệu non-deterministic hoặc lookup ngoài trong handler khiến replay phân kỳ khỏi lần chạy gốc. Và backfill một history đáng tin từ state bạn không còn có là rất tốn; team thường làm ô nhiễm log bằng cách lưu derived/current state như một "event".
:::

*Đào sâu tiếp: khi migrate, làm sao backfill một event history đáng tin từ một DB CRUD đã mất các transition gốc?*

**Từ khoá ăn điểm** — `immutable event log · fold/replay · CQRS · snapshot · eventual consistency · event versioning · upcaster`

## 5-card — middle — [Backpressure, ConsumerLag]
**Question:** A marketing blast triples your event rate. Producers are fine, but a downstream enrichment consumer that does a slow DB lookup per event starts falling behind and dashboards go stale. How do you detect this, and what actually happens as the consumer keeps falling behind?

**Verdict:** KEEP — diagnosis (consumer lag) plus failure-mode reasoning (retention loss, rebalance spiral); scales with depth.

### New answer (en)
**TL;DR** — The signal is **consumer lag**: per partition, the gap between the latest produced offset and the consumer's committed offset — rising lag means processing is slower than arrival. If lag outruns retention, the oldest unconsumed events are deleted and silently skipped; that's the real danger.

**How it works** — Export lag to metrics/alerting (Kafka consumer-group lag or a Burrow-style monitor) and alert on lag that trends up or exceeds a time-to-drain threshold. Recover by speeding up the consumer (batch the DB lookups, cache, async I/O) or adding parallelism — scaling consumer instances up to the partition count, since lag is per partition and only more partitions/consumers add real horizontal headroom.

:::muted
**Trade-off** — A log broker like Kafka gives "free" buffering: producers never block, a spike just grows lag absorbed by retention — trading freshness for durability. A bounded queue applies true backpressure, slowing producers but pushing the problem upstream. Scaling consumers helps only up to the partition count, and more parallelism can overload the very DB the enrichment depends on, so you may need to deliberately rate-limit.
:::

:::muted
**Common pitfall** — Past the retention window, unconsumed events are dropped with no error — silent loss. A starved consumer can exceed `max.poll.interval`, so the broker considers it dead and triggers a rebalance that pauses the whole group and can spiral under load. Watching lag *count* not lag *time* misleads in low-traffic periods, and one hot partition can be badly lagged while the aggregate looks healthy — always alert per partition.
:::

*Go deeper: when scaling consumers risks overwhelming the downstream DB, how do you choose between repartitioning, caching, and intentional rate-limiting?*

**Keywords** — `consumer lag · committed offset · lag time vs count · retention · max.poll.interval · rebalance · backpressure`

### New answer (vi)
**Chốt** — Tín hiệu là **consumer lag**: theo từng partition, chênh lệch giữa offset produce mới nhất và offset consumer đã commit — lag tăng nghĩa là xử lý chậm hơn tốc độ tới. Nếu lag vượt retention, các event chưa consume cũ nhất bị xóa và skip âm thầm; đó là mối nguy thật.

**Cơ chế** — Export lag ra metrics/alerting (Kafka consumer-group lag hoặc monitor kiểu Burrow) và alert khi lag trend lên hoặc vượt ngưỡng time-to-drain. Recover bằng cách tăng tốc consumer (batch DB lookup, cache, async I/O) hoặc thêm parallelism — scale consumer instance lên tới số partition, vì lag là per partition và chỉ thêm partition/consumer mới tạo headroom ngang thực sự.

:::muted
**Trade-off** — Một log broker như Kafka cho buffering "miễn phí": producer không bao giờ block, một spike chỉ làm lag tăng và được retention hấp thụ — đánh đổi độ tươi lấy durability. Một queue có depth giới hạn áp backpressure thật, làm chậm producer nhưng đẩy vấn đề lên upstream. Scale consumer chỉ giúp tới số partition, và parallelism nhiều hơn có thể quá tải chính DB mà enrichment phụ thuộc, nên có khi bạn phải chủ động rate-limit.
:::

:::muted
**Bẫy thường gặp** — Vượt cửa sổ retention, event chưa consume bị drop không có lỗi — mất âm thầm. Một consumer bị đói có thể vượt `max.poll.interval`, nên broker coi nó đã chết và trigger rebalance làm pause cả group và có thể xoáy dưới tải. Nhìn lag *count* mà không nhìn lag *time* đánh lừa trong giai đoạn ít traffic, và một hot partition có thể lag nặng trong khi tổng thể trông khỏe — luôn alert theo từng partition.
:::

*Đào sâu tiếp: khi scale consumer có nguy cơ làm quá tải DB downstream, chọn giữa repartition, cache và rate-limit chủ động ra sao?*

**Từ khoá ăn điểm** — `consumer lag · committed offset · lag time vs count · retention · max.poll.interval · rebalance · backpressure`

## 6-card — junior — [DeadLetterQueue, ErrorHandling]
**Question:** One malformed message in a queue throws every time your consumer processes it, the consumer retries it forever, and the whole queue is now stuck behind it. What is this message called, and how do you get the queue moving again without losing the bad message?

**Verdict:** KEEP — names a concept (poison message) and asks for the standard remedy (DLQ); legitimately junior but reasoning-bearing.

### New answer (en)
**TL;DR** — It's a **poison message** — one that fails deterministically every time, so infinite retries block the queue. The fix is a **dead-letter queue (DLQ)**: after a bounded number of retries, stop retrying, move the message to the DLQ, and commit past it so the main queue proceeds — the bad message is preserved, not lost.

**How it works** — The two essentials are a retry *limit* plus a place to park failures. Once a message exceeds the limit it goes to a separate DLQ where engineers can inspect it, fix the bug or bad data, and optionally replay it into the main flow. Acknowledging past the parked message is what unblocks everything queued behind it.

:::muted
**Common pitfall** — The worst pattern is unlimited retries with no DLQ, letting one bad message halt a partition or queue indefinitely. A DLQ with no alerting becomes a silent graveyard where failures pile up until a customer reports missing data. And blindly replaying a whole DLQ without fixing the root cause just sends the same poison messages straight back, looping forever.
:::

*Go deeper: how do you pick the retry limit so a brief DB timeout isn't dead-lettered but a truly poison message is?*

**Keywords** — `poison message · dead-letter queue · retry limit · ack/commit past · replay · DLQ alerting`

### New answer (vi)
**Chốt** — Đây là một **poison message** — cái fail deterministic mỗi lần, nên retry vô hạn làm nghẽn queue. Cách sửa là một **dead-letter queue (DLQ)**: sau một số retry có giới hạn, ngừng retry, move message sang DLQ, và commit vượt qua nó để queue chính tiếp tục — message lỗi được giữ lại, không mất.

**Cơ chế** — Hai thứ cốt yếu là một *giới hạn* retry cộng một chỗ park failure. Khi một message vượt giới hạn, nó sang một DLQ riêng nơi kỹ sư inspect, fix bug hoặc bad data, và tùy chọn replay vào luồng chính. Ack vượt qua message bị park chính là cái gỡ nghẽn cho mọi thứ xếp phía sau.

:::muted
**Bẫy thường gặp** — Pattern tệ nhất là retry không giới hạn và không DLQ, để một message lỗi làm dừng cả một partition hoặc queue vô thời hạn. Một DLQ không alerting thành một nghĩa địa im lặng nơi failure chất đống tới khi khách hàng báo thiếu data. Và replay mù cả một DLQ mà không fix root cause chỉ gửi đúng các poison message đó quay lại, lặp mãi.
:::

*Đào sâu tiếp: chọn giới hạn retry sao cho một DB timeout ngắn không bị dead-letter nhưng một poison message thật thì có?*

**Từ khoá ăn điểm** — `poison message · dead-letter queue · retry limit · ack/commit past · replay · DLQ alerting`

## 7-card — staff — [SystemDesign, RealTimeAnalytics]
**Question:** Design an end-to-end real-time pipeline that ingests user activity (views, likes, follows) at hundreds of thousands of events per second and powers both a live "trending now" dashboard and a personalized activity feed. Walk through ingestion, processing, storage, and delivery, and name the hard decisions.

**Verdict:** KEEP — full staff-level open design with multiple genuine trade-offs (fan-out, accuracy/cost, Lambda/Kappa) and failure modes.

### New answer (en)
**TL;DR** — Ingest behind a load balancer into a partitioned log (Kafka), process with a stream engine (Flink/Kafka Streams) into two paths — event-time windowed top-K for trending and fan-out for the feed — serve from fast stores (Redis, an OLAP store), and push updates over WebSocket/SSE. The same durable log feeds both the real-time and replayable batch paths (Kappa/Lambda).

**How it works** — **Ingestion:** collectors publish to Kafka keyed by `userId` for feed ordering or `entityId` for trending, with a schema registry for forward compatibility. **Processing:** trending uses event-time windows with watermarks plus approximate top-K (Count-Min Sketch) to bound memory; the feed uses fan-out-on-write, appending event ids to each follower's list, with fan-out-on-read for celebrities. **Storage:** raw events to a data lake for replay; serving state to Redis (feeds, leaderboards) and an OLAP store (ClickHouse/Druid) for analytics. **Delivery:** the dashboard subscribes to incrementally updated aggregates; the feed reads precomputed per-user lists.

:::muted
**Trade-off** — Feed fan-out-on-write gives O(1) reads but explodes on high-follower accounts; on-read is cheap to write but slow to read — real systems go hybrid by follower count. Trending trades accuracy vs cost: exact counts over a huge key space are costly, so use probabilistic top-K and HyperLogLog. Kappa (one streaming path, reprocess by replay) is simpler to operate than Lambda's dual codebases but demands a durable, replayable log and idempotent sinks.
:::

:::muted
**Common pitfall** — Hot keys are the classic killer: a viral post concentrates load on one partition, so you need salting or sub-partitioning. Without idempotent, exactly-once-effect sinks, redelivery inflates trending counts and duplicates feed entries on rebalance. Unbounded windows or per-key state with no TTL leak memory until the processor OOMs; if lag outruns retention you undercount; and with no replay strategy a processor bug corrupts derived state irrecoverably — which is why the durable raw-event log is non-negotiable.
:::

*Go deeper: at what follower count do you flip a user from fan-out-on-write to on-read, and how do you backfill their feed when they cross the threshold?*

**Keywords** — `partitioned log · event-time windows · Count-Min Sketch / HyperLogLog · fan-out write vs read · Lambda/Kappa · idempotent sink · hot-key salting`

### New answer (vi)
**Chốt** — Ingest sau một load balancer vào một partitioned log (Kafka), process bằng một stream engine (Flink/Kafka Streams) thành hai path — event-time windowed top-K cho trending và fan-out cho feed — phục vụ từ các store nhanh (Redis, một OLAP store), và push update qua WebSocket/SSE. Cùng một log bền cấp cho cả path real-time lẫn batch replay được (Kappa/Lambda).

**Cơ chế** — **Ingestion:** collector publish vào Kafka key theo `userId` cho feed ordering hoặc `entityId` cho trending, với một schema registry để forward-compatible. **Processing:** trending dùng event-time window với watermark cộng approximate top-K (Count-Min Sketch) để bound memory; feed dùng fan-out-on-write, append event id vào list của mỗi follower, với fan-out-on-read cho celebrity. **Storage:** raw event vào một data lake cho replay; serving state vào Redis (feed, leaderboard) và một OLAP store (ClickHouse/Druid) cho analytics. **Delivery:** dashboard subscribe các aggregate update tăng dần; feed đọc list per-user đã precompute.

:::muted
**Trade-off** — Feed fan-out-on-write cho read O(1) nhưng bùng nổ ở account nhiều follower; on-read rẻ khi write nhưng chậm khi read — hệ thống thật đi hybrid theo số follower. Trending đánh đổi accuracy vs cost: đếm chính xác trên key space khổng lồ là đắt, nên dùng top-K xác suất và HyperLogLog. Kappa (một path streaming, reprocess bằng replay) vận hành đơn giản hơn cặp codebase của Lambda nhưng đòi một log bền, replay được và các sink idempotent.
:::

:::muted
**Bẫy thường gặp** — Hot key là sát thủ kinh điển: một post viral dồn tải vào một partition, nên bạn cần salting hoặc sub-partitioning. Không có sink idempotent, exactly-once-effect, redelivery thổi phồng trending count và duplicate feed entry khi rebalance. Window không bound hoặc per-key state không TTL leak memory tới khi processor OOM; nếu lag vượt retention bạn đếm thiếu; và không có chiến lược replay thì một bug processor làm hỏng derived state không cứu được — đó là vì sao raw-event log bền là không thể thương lượng.
:::

*Đào sâu tiếp: ở mức bao nhiêu follower thì bạn chuyển một user từ fan-out-on-write sang on-read, và làm sao backfill feed của họ khi vượt ngưỡng?*

**Từ khoá ăn điểm** — `partitioned log · event-time windows · Count-Min Sketch / HyperLogLog · fan-out write vs read · Lambda/Kappa · idempotent sink · hot-key salting`
