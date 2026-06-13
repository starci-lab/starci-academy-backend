# 1-system-design-mastery / 8-consistency-and-transactions
Summary: kept 8, delete 0 of 8

## 0-card — junior — [ACID, BASE]
**Question:** Your team runs an order DB on Postgres (ACID) but the new product-catalog and recommendation services are moving to a BASE-style store. A junior asks why you'd "give up consistency on purpose" — how do you justify the split?
**Verdict:** KEEP — open-ended "why" with a real design-judgment payload (match the guarantee to the cost of being wrong); scales with seniority.

### New answer (en)
**TL;DR** — You're not giving up consistency carelessly; you're matching each store's guarantee to the cost of being wrong. Money paths get ACID; high-volume read-mostly paths that tolerate a few seconds of staleness get BASE.

**How it works** — ACID (Atomicity, Consistency, Isolation, Durability) makes a transaction all-or-nothing, leaves the DB valid, isolates concurrent work, and survives crashes — exactly what an order or payment needs, since a half-applied debit is unacceptable. BASE (Basically Available, Soft state, Eventually consistent) deliberately relaxes immediate consistency so writes never block on cross-node agreement and the system stays available. Catalog and recommendation reads tolerate staleness — an old rating shown for a few seconds harms nothing — so trading strong consistency for availability and latency there is sound. This is polyglot persistence: each bounded context picks the model its invariants demand.

:::muted
**Trade-off** — ACID buys correctness at the cost of write latency and harder horizontal scaling, since coordination (locks, quorum, single-leader writes) becomes a bottleneck under contention. BASE buys availability and scale but pushes conflict-resolution and read-your-own-write handling up into application code. "One store for everything" is rarely the right answer.
:::

:::muted
**Common pitfall** — Treating BASE as "no consistency" and letting it leak into a domain with invariants — e.g. computing a balance from an eventually-consistent replica and allowing overdrafts. The mirror failure is forcing ACID everywhere, creating a global write bottleneck and cross-region latency.
:::

*Go deeper — what would you ask, per use case, to decide which store a piece of data belongs in?*

**Keywords** — `ACID` · `BASE` · `eventual consistency` · `polyglot persistence` · `bounded context`

### New answer (vi)
**Chốt** — Bạn không bỏ consistency một cách cẩu thả; bạn khớp guarantee của từng store với cái giá của việc bị sai. Luồng tiền dùng ACID; luồng read-nhiều khối lượng lớn chịu được staleness vài giây thì dùng BASE.

**Cơ chế** — ACID (Atomicity, Consistency, Isolation, Durability) khiến một transaction là all-or-nothing, để DB ở trạng thái hợp lệ, cô lập công việc đồng thời, và sống sót sau crash — đúng những gì order hay payment cần, vì một lệnh debit áp dụng nửa chừng là không chấp nhận được. BASE (Basically Available, Soft state, Eventually consistent) cố tình nới lỏng consistency tức thời để write không bị block chờ đồng thuận cross-node và hệ thống luôn available. Read của catalog và recommendation chịu được staleness — một rating cũ hiển thị vài giây chẳng hại gì — nên đánh đổi strong consistency lấy availability và latency ở đó là hợp lý. Đây là polyglot persistence: mỗi bounded context chọn model mà invariant của nó đòi hỏi.

:::muted
**Trade-off** — ACID mua tính đúng đắn với cái giá write latency và scale ngang khó hơn, vì coordination (lock, quorum, single-leader write) thành bottleneck khi contention. BASE mua availability và scale nhưng đẩy conflict-resolution và xử lý read-your-own-write lên tầng application. "Một store cho tất cả" hiếm khi là câu trả lời đúng.
:::

:::muted
**Bẫy thường gặp** — Coi BASE như "không có consistency" và để nó rò vào domain cần invariant — ví dụ tính số dư từ một replica eventually-consistent và cho phép overdraft. Lỗi đối xứng là ép ACID mọi nơi, tạo global write bottleneck và cross-region latency.
:::

*Đào sâu tiếp — theo từng use case, bạn sẽ hỏi gì để quyết một mẩu dữ liệu thuộc store nào?*

**Từ khoá ăn điểm** — `ACID` · `BASE` · `eventual consistency` · `polyglot persistence` · `bounded context`

## 1-card — senior — [IsolationLevels, SQL]
**Question:** A nightly report reads the same rows twice in one transaction and gets different totals; meanwhile a "count rows then insert if under limit" path occasionally lets one row over the cap slip in under load. Which isolation anomalies are these, and what level do you pick?
**Verdict:** KEEP — diagnosis + level-selection + the write-skew nuance; classic deep senior question with natural follow-ups.

### New answer (en)
**TL;DR** — The re-read mismatch is a non-repeatable read; the over-cap insert is a phantom read. Use REPEATABLE READ (or a single snapshot) for the report, and SERIALIZABLE — or a narrower guard like `SELECT ... FOR UPDATE` / a unique constraint — for the cap-enforcement path.

**How it works** — A non-repeatable read happens when a row you read is updated and committed by another transaction before you read it again; a phantom read happens when a concurrent insert adds a row matching your predicate. The four SQL levels prevent progressively more: READ COMMITTED stops dirty reads, REPEATABLE READ also stops non-repeatable reads, and SERIALIZABLE additionally stops phantoms and behaves as if transactions ran one at a time. Raise isolation only on the invariant-critical transactions; keep the bulk at READ COMMITTED.

:::muted
**Trade-off** — Higher isolation costs concurrency. Postgres SERIALIZABLE uses SSI and aborts with a serialization failure (callers must retry); MySQL/InnoDB uses range/next-key locks that block writers and can deadlock. Note that snapshot isolation (Postgres REPEATABLE READ) stops non-repeatable and phantom reads but still allows write-skew — only SERIALIZABLE catches it.
:::

:::muted
**Common pitfall** — Assuming the DB default is strong: in Postgres and Oracle it is READ COMMITTED, so multi-statement invariants are unprotected unless you raise it. The subtler trap is write-skew under snapshot isolation — two transactions each read a consistent snapshot, each sees the constraint satisfied, both commit, jointly violating it (the "both on-call doctors go off shift" bug). These need concurrency to reproduce, so they pass every single-threaded test.
:::

*Go deeper — when would you fix this with a unique constraint or `FOR UPDATE` instead of raising the isolation level, and why?*

**Keywords** — `non-repeatable read` · `phantom read` · `write-skew` · `SSI` · `next-key lock` · `READ COMMITTED`

### New answer (vi)
**Chốt** — Đọc lại ra số khác là non-repeatable read; insert vượt cap là phantom read. Dùng REPEATABLE READ (hay một snapshot duy nhất) cho report, và SERIALIZABLE — hoặc một guard hẹp hơn như `SELECT ... FOR UPDATE` / một unique constraint — cho luồng enforce cap.

**Cơ chế** — Non-repeatable read xảy ra khi một row bạn đọc bị transaction khác update và commit trước khi bạn đọc lại; phantom read xảy ra khi một insert đồng thời thêm row khớp predicate của bạn. Bốn level SQL ngăn ngày càng nhiều: READ COMMITTED chặn dirty read, REPEATABLE READ chặn thêm non-repeatable read, và SERIALIZABLE chặn thêm phantom và hành xử như thể các transaction chạy lần lượt. Chỉ nâng isolation trên những transaction critical về invariant; giữ phần lớn ở READ COMMITTED.

:::muted
**Trade-off** — Isolation cao hơn tốn concurrency. SERIALIZABLE của Postgres dùng SSI và abort bằng serialization failure (caller phải retry); MySQL/InnoDB dùng range/next-key lock vốn block writer và có thể deadlock. Lưu ý snapshot isolation (REPEATABLE READ của Postgres) chặn non-repeatable và phantom read nhưng vẫn cho write-skew — chỉ SERIALIZABLE bắt được.
:::

:::muted
**Bẫy thường gặp** — Giả định default của DB là mạnh: trong Postgres và Oracle nó là READ COMMITTED, nên invariant nhiều câu lệnh không được bảo vệ trừ khi bạn nâng lên. Bẫy tinh vi hơn là write-skew dưới snapshot isolation — hai transaction mỗi cái đọc snapshot nhất quán, mỗi cái thấy constraint thỏa, cả hai commit, cùng nhau vi phạm (bug "cả hai bác sĩ trực cùng rời ca"). Chúng cần concurrency để tái hiện, nên vượt qua mọi test đơn luồng.
:::

*Đào sâu tiếp — khi nào bạn fix bằng unique constraint hoặc `FOR UPDATE` thay vì nâng isolation level, và tại sao?*

**Từ khoá ăn điểm** — `non-repeatable read` · `phantom read` · `write-skew` · `SSI` · `next-key lock` · `READ COMMITTED`

## 2-card — senior — [CAP, Partitions]
**Question:** An interviewer says "we're a CA system — we picked consistency and availability and skipped partition tolerance." Your replicas span three availability zones. Why is that statement a red flag, and what choice do you actually face during a partition?
**Verdict:** KEEP — corrects a famous misconception and forces per-operation CP/AP reasoning plus PACELC; strong senior depth.

### New answer (en)
**TL;DR** — "CA" is a red flag because partition tolerance isn't optional once you replicate over a network — partitions are a fact, not a design choice. During a partition your real, per-operation decision is CP (reject/stall writes to stay consistent) versus AP (accept writes on both sides and reconcile later).

**How it works** — CAP says that when a partition (P) occurs, you can preserve at most one of Consistency (every read sees the latest write) or Availability (every request gets a non-error response). "CA" only describes a single-node DB where no partition is possible; the moment you have replicas across three AZs, you are choosing CP or AP. CP looks like a leader-based store refusing writes without quorum; AP looks like a Dynamo-style store accepting writes everywhere. Mature systems are PACELC: CP-vs-AP during a partition, and latency-vs-consistency in the normal case — tuned per operation, not per database.

:::muted
**Trade-off** — CP keeps data correct but a minority partition stops serving (right for balances and inventory, but a user-visible outage). AP keeps serving but exposes stale or conflicting reads that must be merged (fine for carts, likes, presence). The decision is per-operation, not a global label on the database.
:::

:::muted
**Common pitfall** — Treating CAP as a permanent label and then assuming a synchronous read on an "AP" store is strongly consistent. The dangerous failure is split-brain: an AP system takes writes on both sides of a partition and on heal has divergent histories with no automatic correct answer, forcing lossy last-write-wins or manual reconciliation. Quorum (R + W > N) reduces but doesn't eliminate this, and clock skew can make "latest" wrong.
:::

*Go deeper — for one concrete write path in your system, would you pick CP or AP during a partition, and how would you reconcile afterward?*

**Keywords** — `CAP` · `partition tolerance` · `CP/AP` · `PACELC` · `split-brain` · `quorum (R+W>N)`

### New answer (vi)
**Chốt** — "CA" là red flag vì partition tolerance không phải tùy chọn một khi bạn replicate qua network — partition là sự thật, không phải lựa chọn thiết kế. Khi partition, quyết định thật theo từng operation là CP (từ chối/giữ write để giữ consistency) hay AP (chấp nhận write cả hai phía rồi reconcile sau).

**Cơ chế** — CAP nói khi xảy ra partition (P), bạn chỉ giữ được nhiều nhất một trong Consistency (mọi read thấy write mới nhất) hoặc Availability (mọi request nhận phản hồi không lỗi). "CA" chỉ mô tả một DB single-node không thể có partition; ngay khi có replica trên ba AZ, bạn đang chọn CP hoặc AP. CP trông như một store dựa trên leader từ chối write khi không đủ quorum; AP trông như một store kiểu Dynamo chấp nhận write mọi nơi. Hệ trưởng thành theo PACELC: CP-vs-AP khi partition, và latency-vs-consistency lúc bình thường — tinh chỉnh theo operation, không theo database.

:::muted
**Trade-off** — CP giữ dữ liệu đúng nhưng một partition thiểu số ngừng phục vụ (đúng cho balance và inventory, nhưng là outage người dùng thấy được). AP vẫn phục vụ nhưng phơi read cũ hoặc xung đột phải merge (ổn cho cart, like, presence). Quyết định theo từng operation, không phải nhãn toàn cục trên database.
:::

:::muted
**Bẫy thường gặp** — Coi CAP như nhãn vĩnh viễn rồi cho rằng một read đồng bộ trên store "AP" là strongly consistent. Failure nguy hiểm là split-brain: hệ AP nhận write cả hai phía partition và khi lành có lịch sử phân kỳ không đáp án đúng tự động, buộc last-write-wins mất dữ liệu hoặc reconcile thủ công. Quorum (R + W > N) giảm chứ không loại bỏ, và clock skew có thể khiến "mới nhất" sai.
:::

*Đào sâu tiếp — với một luồng write cụ thể trong hệ của bạn, bạn chọn CP hay AP khi partition, và reconcile sau đó thế nào?*

**Từ khoá ăn điểm** — `CAP` · `partition tolerance` · `CP/AP` · `PACELC` · `split-brain` · `quorum (R+W>N)`

## 3-card — senior — [Saga, TwoPhaseCommit]
**Question:** Placing an order must reserve inventory, charge payment, and create a shipment — three separate services with their own databases. You can't wrap them in one ACID transaction. Walk through 2PC versus a Saga and when you'd choose each.
**Verdict:** KEEP — compare-and-choose across distributed-transaction patterns with real failure modes; canonical senior design question.

### New answer (en)
**TL;DR** — Use a Saga for this order flow: a sequence of local transactions, each committed immediately, with a compensating action per step (release the reservation, refund the charge) run backward on failure. Reserve 2PC for short, tightly-coupled operations that genuinely need all-or-nothing and can tolerate blocking.

**How it works** — 2PC uses a coordinator: phase one asks every participant to prepare (lock resources, promise it can commit); if all vote yes, phase two commits everyone, else everyone aborts. It gives true cross-service atomicity but holds locks for the whole round-trip and blocks if the coordinator dies mid-protocol. A Saga avoids cross-service locks and keeps each service autonomous by committing each local step and compensating on failure. Sagas can be orchestrated (one central state machine — easier to reason about) or choreographed (events between services — looser coupling, harder to trace).

:::muted
**Trade-off** — 2PC gives atomicity and isolation but couples availability to the slowest participant and the coordinator, and held locks crush throughput under contention. A Saga gives availability and scale but only atomicity, not isolation — intermediate states are visible (payment charged before the shipment exists), so you design for those windows and make compensations semantically correct (you can't un-send an email, only send an apology).
:::

:::muted
**Common pitfall** — 2PC's signature failure: the coordinator crashes after participants voted to commit, leaving them locked and blocked indefinitely. Sagas fail when compensations aren't idempotent or aren't truly reversible — a double-fired compensation refunds twice. And lack of isolation means another transaction can read the half-done state, so Sagas need semantic locks or status flags (e.g. order PENDING).
:::

*Go deeper — for the payment step specifically, what makes a clean compensating action, and what would you do if it's irreversible?*

**Keywords** — `2PC` · `coordinator` · `Saga` · `compensating transaction` · `orchestration vs choreography` · `semantic lock`

### New answer (vi)
**Chốt** — Dùng Saga cho luồng order này: một chuỗi local transaction, mỗi cái commit ngay, với một compensating action cho mỗi bước (release reservation, refund charge) chạy ngược khi fail. Để dành 2PC cho operation ngắn, gắn kết chặt, thực sự cần all-or-nothing và chịu được blocking.

**Cơ chế** — 2PC dùng một coordinator: pha một hỏi mọi participant prepare (lock resource, hứa có thể commit); nếu tất cả vote yes, pha hai commit mọi người, ngược lại tất cả abort. Nó cho atomicity thật xuyên service nhưng giữ lock suốt round-trip và block nếu coordinator chết giữa protocol. Saga tránh lock cross-service và giữ mỗi service tự chủ bằng cách commit từng bước local và compensate khi fail. Saga có thể orchestration (một state machine trung tâm — dễ suy luận) hoặc choreography (event giữa các service — coupling lỏng hơn, khó trace hơn).

:::muted
**Trade-off** — 2PC cho atomicity và isolation nhưng cột availability vào participant chậm nhất và coordinator, và lock bị giữ bóp nghẹt throughput khi contention. Saga cho availability và scale nhưng chỉ atomicity, không isolation — trạng thái trung gian lộ ra (payment đã charge trước khi shipment tồn tại), nên bạn thiết kế cho những cửa sổ đó và làm compensation đúng ngữ nghĩa (không un-send được email, chỉ gửi lời xin lỗi).
:::

:::muted
**Bẫy thường gặp** — Failure đặc trưng của 2PC: coordinator crash sau khi participant vote commit, để chúng bị lock và block vô thời hạn. Saga fail khi compensation không idempotent hoặc không thực sự reversible — một compensation bắn hai lần thì refund hai lần. Và thiếu isolation nghĩa là một transaction khác có thể đọc trạng thái nửa chừng, nên Saga cần semantic lock hoặc status flag (ví dụ order PENDING).
:::

*Đào sâu tiếp — riêng bước payment, điều gì làm nên một compensating action sạch, và bạn làm gì nếu nó không đảo ngược được?*

**Từ khoá ăn điểm** — `2PC` · `coordinator` · `Saga` · `compensating transaction` · `orchestration vs choreography` · `semantic lock`

## 4-card — middle — [EventualConsistency, CRDT]
**Question:** A shared shopping cart syncs across a user's phone and laptop, both editing offline. With plain last-write-wins, items silently disappear when the two sync. How do LWW, CRDTs, and version vectors differ in what the user ends up seeing?
**Verdict:** KEEP — compares three merge strategies through observable user outcomes; solid middle-level depth with a real "why".

### New answer (en)
**TL;DR** — LWW keeps only the highest-timestamp write and silently drops the other, so one concurrently-added item vanishes. A CRDT (e.g. an OR-Set) merges both adds automatically so nothing disappears. Version vectors don't merge — they detect that two writes were concurrent and surface a real conflict for app/user resolution. For a cart, a CRDT gives the behavior users expect.

**How it works** — Under eventual consistency, concurrent writes collide and you must decide how to merge. LWW picks by timestamp and discards the loser. A CRDT (Conflict-free Replicated Data Type) has a built-in commutative merge: an OR-Set unions both adds and tracks removals so the merged cart holds socks and the hat with no coordination. Version vectors record per-replica causality, letting the system detect that neither write happened-before the other and raise a conflict instead of guessing.

:::muted
**Trade-off** — LWW is trivial and storage-cheap but lossy and depends on synchronized clocks. CRDTs converge with no central coordinator and great availability, but carry metadata (tombstones, per-element causality) that grows over time and constrain you to CRDT-expressible operations. Version vectors never silently drop data but push conflict resolution back to you — you must define merge semantics or prompt the user.
:::

:::muted
**Common pitfall** — The classic LWW failure is the Amazon-Dynamo cart bug: a removed item reappears or an added item vanishes because a stale write wins on timestamp. CRDTs fail subtly through unbounded tombstone growth that bloats storage and merge cost. Version vectors fail when developers ignore the detected conflict and just pick a side — reintroducing the data loss the vectors were meant to prevent.
:::

*Go deeper — what bounds CRDT tombstone growth in practice, and how would you garbage-collect them safely?*

**Keywords** — `eventual consistency` · `LWW` · `CRDT` · `OR-Set` · `version vector` · `happened-before` · `tombstone`

### New answer (vi)
**Chốt** — LWW chỉ giữ write có timestamp cao nhất và âm thầm bỏ cái kia, nên một item thêm đồng thời biến mất. Một CRDT (ví dụ OR-Set) merge cả hai lần add tự động nên không gì biến mất. Version vector không merge — nó phát hiện hai write là đồng thời và đẩy ra một conflict thật cho app/user giải quyết. Với cart, CRDT cho hành vi user mong đợi.

**Cơ chế** — Dưới eventual consistency, write đồng thời va nhau và bạn phải quyết merge thế nào. LWW chọn theo timestamp và vứt cái thua. Một CRDT (Conflict-free Replicated Data Type) có merge giao hoán tích hợp: một OR-Set union cả hai lần add và theo dõi remove để cart đã merge chứa cả socks lẫn hat mà không cần coordination. Version vector ghi causality theo từng replica, cho hệ thống phát hiện không write nào happened-before write kia và nêu một conflict thay vì đoán.

:::muted
**Trade-off** — LWW cực dễ và rẻ storage nhưng lossy và phụ thuộc clock đồng bộ. CRDT hội tụ không cần coordinator trung tâm và availability tuyệt vời, nhưng mang metadata (tombstone, causality theo từng phần tử) tăng dần và ràng buộc bạn vào operation biểu diễn được dưới dạng CRDT. Version vector không bao giờ âm thầm bỏ dữ liệu nhưng đẩy conflict resolution lại cho bạn — bạn phải định nghĩa merge semantics hoặc hỏi user.
:::

:::muted
**Bẫy thường gặp** — Failure kinh điển của LWW là bug cart Amazon-Dynamo: một item đã xóa lại hiện ra hoặc một item đã thêm biến mất vì một write cũ thắng theo timestamp. CRDT fail tinh vi qua việc tombstone tăng không giới hạn làm phình storage và chi phí merge. Version vector fail khi developer bỏ qua conflict đã phát hiện và cứ chọn đại một phía — tái tạo đúng data loss mà vector lẽ ra phải ngăn.
:::

*Đào sâu tiếp — thực tế cái gì giới hạn việc tombstone của CRDT phình ra, và bạn garbage-collect chúng an toàn thế nào?*

**Từ khoá ăn điểm** — `eventual consistency` · `LWW` · `CRDT` · `OR-Set` · `version vector` · `happened-before` · `tombstone`

## 5-card — senior — [Idempotency, Deduplication]
**Question:** A mobile client times out after a "pay $50" call and retries, but the first request had actually succeeded — the customer is charged twice. Your queue is at-least-once. How do you make payment effectively-once with idempotency keys?
**Verdict:** KEEP — designs effectively-once on top of at-least-once with the atomicity nuance that trips most people; strong senior question.

### New answer (en)
**TL;DR** — The client generates one idempotency key (a UUID) for the logical payment and sends it on the original request and every retry. The server stores it in a dedup table with a unique constraint, written in the same transaction as the charge; a retry collides on the key, so the server returns the original result instead of charging again — turning at-least-once into effectively-once.

**How it works** — The key must be tied to the operation's identity (same key = same intended charge), kept for a sensible retention window, and the check-and-act must be atomic so two concurrent retries can't both pass the "have I seen this?" test. Writing the dedup row in the same DB transaction that records the charge is what makes it airtight — the key and the side effect commit together or not at all.

:::muted
**Trade-off** — Idempotency keys add a write and a lookup per request plus storage you must expire, and require the client to generate and persist the key across retries (complicating the API contract). You choose where to dedup: at the API edge (simple, misses internal queue redelivery) or at the DB transaction (airtight, couples dedup to storage). Storing the full response lets retries replay the exact result; storing only "seen" is cheaper but forces a re-query.
:::

:::muted
**Common pitfall** — The deadliest bug is a non-atomic check-then-act: two retries both read "not seen," both charge, double-billing despite the key. Equally bad: generating a new key per attempt (retries look distinct), or keying on a request hash containing a changing timestamp. Watch retention — expire too soon and a late retry charges again; keep forever and the table grows unbounded. And if the charge commits but the key write fails, the retry double-charges anyway.
:::

*Go deeper — how do you enforce atomicity of the dedup write and the charge when the charge is at an external payment provider, not your own DB?*

**Keywords** — `idempotency key` · `at-least-once` · `effectively-once` · `unique constraint` · `dedup table` · `atomic check-and-act`

### New answer (vi)
**Chốt** — Client sinh một idempotency key (một UUID) cho logical payment và gửi nó trên request gốc lẫn mọi retry. Server lưu nó vào dedup table có unique constraint, ghi trong cùng transaction với khoản charge; một retry va vào key, nên server trả về kết quả gốc thay vì charge lại — biến at-least-once thành effectively-once.

**Cơ chế** — Key phải gắn với identity của operation (cùng key = cùng ý định charge), giữ trong một cửa sổ retention hợp lý, và check-and-act phải atomic để hai retry đồng thời không cùng vượt qua bài kiểm tra "đã thấy cái này chưa?". Ghi dedup row trong cùng DB transaction ghi nhận charge là thứ làm nó kín kẽ — key và side effect commit chung hoặc không cái nào cả.

:::muted
**Trade-off** — Idempotency key thêm một write và một lookup mỗi request cùng storage phải expire, và đòi client sinh rồi giữ key qua các retry (làm phức tạp API contract). Bạn chọn dedup ở đâu: tại API edge (đơn giản, sót redelivery của queue nội bộ) hay tại DB transaction (kín kẽ, cột dedup vào storage). Lưu cả response cho retry replay đúng kết quả; chỉ lưu "đã thấy" rẻ hơn nhưng buộc query lại.
:::

:::muted
**Bẫy thường gặp** — Bug chí mạng nhất là check-then-act không atomic: hai retry cùng đọc "chưa thấy", cùng charge, double-bill dù có key. Tệ ngang: sinh key mới mỗi lần thử (retry trông như khác nhau), hoặc key dựa trên hash request có timestamp thay đổi. Để ý retention — expire quá sớm thì retry muộn charge lại; giữ mãi thì table phình vô hạn. Và nếu charge commit nhưng ghi key fail, retry vẫn double-charge.
:::

*Đào sâu tiếp — bạn enforce atomicity của dedup write và charge thế nào khi charge nằm ở một payment provider bên ngoài, không phải DB của bạn?*

**Từ khoá ăn điểm** — `idempotency key` · `at-least-once` · `effectively-once` · `unique constraint` · `dedup table` · `atomic check-and-act`

## 6-card — middle — [ReadAfterWrite, Replication]
**Question:** A user edits their profile bio, the save returns 200, but on the very next page load the old bio is back — then it fixes itself seconds later. Reads go to replicas, writes to the primary. What's happening and how do you fix it without killing read scale?
**Verdict:** KEEP — diagnosis of replication lag + a scale-aware fix with the monotonic-read follow-up; good middle depth.

### New answer (en)
**TL;DR** — It's a read-after-write (read-your-own-writes) violation from asynchronous replication lag: the write committed on the primary, but the read hit a replica that hadn't applied it yet. Fix it narrowly — for N seconds after a user's write, route that user's reads to the primary ("sticky" reads) — so the symptom disappears while most reads stay on replicas.

**How it works** — Options, chosen per operation: route a user's potentially-self-observing reads to the primary briefly after they write; or do LSN/token-based routing — track the write's position (WAL/LSN or logical timestamp) and only serve from a replica that has caught up past it; or pin a session to the primary briefly after any write. The pragmatic default is the sticky-read window, scoped to the writing user, briefly, on the affected entities.

:::muted
**Trade-off** — Sending all post-write reads to the primary is simplest but erodes read-scaling if writes are frequent, so scope it tightly. LSN/token routing is more precise — it keeps reads on replicas whenever they're fresh enough — but adds the complexity of propagating and comparing positions per request. Synchronous replication or always-read-primary give correctness at the cost of write latency or lost scale; give read-your-writes only where the user expects it.
:::

:::muted
**Common pitfall** — Assuming "the write returned 200, so reads see it" — true on one node, false the moment you add async replicas. Cross-device makes it worse: writing on the phone and reading on the laptop defeats naive session-stickiness that only pins the writing connection. Related is the monotonic-read violation — successive reads land on replicas with different lag, so the user sees new bio, then old — which may force pinning a user to one replica to avoid going backward in time.
:::

*Go deeper — how would you give read-your-writes across devices, where there's no single sticky connection to pin?*

**Keywords** — `read-after-write` · `read-your-own-writes` · `replication lag` · `sticky reads` · `WAL/LSN` · `monotonic reads`

### New answer (vi)
**Chốt** — Đây là vi phạm read-after-write (read-your-own-writes) do replication lag bất đồng bộ: write đã commit trên primary, nhưng read trúng một replica chưa apply nó. Fix hẹp lại — trong N giây sau write của user, route read của user đó về primary ("sticky" read) — nên triệu chứng biến mất trong khi đa số read vẫn trên replica.

**Cơ chế** — Các lựa chọn, chọn theo từng operation: route các read có thể tự-quan-sát của user về primary một lúc ngắn sau khi họ write; hoặc làm routing dựa trên LSN/token — theo dõi vị trí của write (WAL/LSN hay logical timestamp) và chỉ phục vụ từ replica đã bắt kịp vượt qua nó; hoặc pin một session vào primary một lúc ngắn sau mỗi write. Default thực dụng là cửa sổ sticky-read, khoanh vào user đang write, một lúc ngắn, trên entity bị ảnh hưởng.

:::muted
**Trade-off** — Gửi mọi read sau write về primary là đơn giản nhất nhưng bào mòn read-scaling nếu write thường xuyên, nên khoanh thật hẹp. Routing LSN/token chính xác hơn — giữ read trên replica bất cứ khi nào nó đủ tươi — nhưng thêm độ phức tạp của việc propagate và so sánh vị trí theo từng request. Synchronous replication hoặc luôn read-primary cho tính đúng với cái giá write latency hoặc mất scale; chỉ cho read-your-writes ở nơi user mong đợi.
:::

:::muted
**Bẫy thường gặp** — Giả định "write trả 200 nên read thấy nó" — đúng trên một node, sai ngay khi thêm async replica. Cross-device làm tệ hơn: write trên điện thoại và read trên laptop đánh bại session-stickiness ngây thơ chỉ pin connection đang write. Liên quan là vi phạm monotonic-read — các read liên tiếp trúng replica có lag khác nhau, nên user thấy bio mới rồi bio cũ — có thể buộc pin một user vào một replica để khỏi đi lùi trong thời gian.
:::

*Đào sâu tiếp — bạn cho read-your-writes xuyên thiết bị thế nào, khi không có một sticky connection duy nhất để pin?*

**Từ khoá ăn điểm** — `read-after-write` · `read-your-own-writes` · `replication lag` · `sticky reads` · `WAL/LSN` · `monotonic reads`

## 7-card — staff — [Outbox, Reconciliation]
**Question:** Design wallet-to-wallet transfers across a ledger service, a notification service, and an external bank rail, at millions of transfers a day. Money can never be created or destroyed. How do you get reliable cross-service movement when "exactly-once" doesn't truly exist?
**Verdict:** KEEP — full staff-level system design tying ledger, outbox, idempotency, Saga, and reconciliation together; rich follow-ups.

### New answer (en)
**TL;DR** — Model money as a double-entry ledger (balanced debit/credit per transfer, so the total never changes), propagate events with the transactional outbox, build the exactly-once illusion from at-least-once delivery + idempotent consumers, integrate the external rail via a Saga, and backstop everything with continuous reconciliation and an append-only audit log.

**How it works** — Each transfer is one atomic local transaction writing balanced ledger entries. In that same transaction you write an event row to an outbox table; a relay or CDC then publishes those events at-least-once to the notification service and downstream consumers. Since there is no true exactly-once over a network, idempotent consumers keyed by a stable transfer/idempotency id absorb duplicates. You can't 2PC a third party, so the external bank rail is a Saga with compensations and status polling. A continuous reconciliation job re-derives balances against an independent source of truth, and the audit log records every state transition.

:::muted
**Trade-off** — The outbox guarantees the event is never lost once the write commits (no DB-vs-broker dual-write race) but costs a relay/CDC pipeline and adds lag before downstream sees it. Async propagation buys throughput and availability at the price of temporary inter-service inconsistency — the ledger is authoritative, the notification may trail — which is fine because the ledger owns the money invariant. The external rail forces eventual settlement: you optimize for safety over latency, accepting pending states and reversals.
:::

:::muted
**Common pitfall** — The signature failure is the dual-write problem: writing the DB and publishing to a broker as two steps means a crash in between loses or phantoms the event — the outbox exists to avoid exactly this. Non-idempotent downstream handling turns at-least-once redelivery into double credits, literally creating money. Trusting "exactly-once" as real and skipping reconciliation lets silent drift accumulate with no way to find when it broke; and without an immutable audit log you can't prove what happened in a dispute or chargeback.
:::

*Go deeper — when the external bank rail returns "unknown" (neither success nor failure), how does your Saga and reconciliation resolve the transfer without double-spending or losing funds?*

**Keywords** — `double-entry ledger` · `transactional outbox` · `CDC` · `at-least-once + idempotent` · `Saga` · `reconciliation` · `audit log`

### New answer (vi)
**Chốt** — Mô hình tiền như một double-entry ledger (cặp debit/credit cân bằng mỗi transfer, nên tổng không bao giờ đổi), propagate event bằng transactional outbox, dựng ảo giác exactly-once từ at-least-once delivery + consumer idempotent, tích hợp external rail qua một Saga, và chốt chặn mọi thứ bằng reconciliation liên tục và một audit log append-only.

**Cơ chế** — Mỗi transfer là một local transaction atomic ghi các ledger entry cân bằng. Trong cùng transaction đó bạn ghi một event row vào outbox table; một relay hoặc CDC sau đó publish các event này at-least-once tới notification service và consumer downstream. Vì không có exactly-once thật xuyên network, consumer idempotent key theo một transfer/idempotency id ổn định hấp thụ duplicate. Bạn không thể 2PC một bên thứ ba, nên external bank rail là một Saga có compensation và status polling. Một job reconciliation liên tục tính lại balance so với một nguồn sự thật độc lập, và audit log ghi mọi state transition.

:::muted
**Trade-off** — Outbox đảm bảo event không bao giờ mất một khi write đã commit (không có dual-write race DB-vs-broker) nhưng tốn một pipeline relay/CDC và thêm lag trước khi downstream thấy. Async propagation mua throughput và availability với cái giá inconsistency tạm thời giữa các service — ledger là authoritative, notification có thể trễ theo — điều này ổn vì ledger sở hữu invariant về tiền. External rail buộc eventual settlement: bạn tối ưu cho an toàn hơn latency, chấp nhận trạng thái pending và reversal.
:::

:::muted
**Bẫy thường gặp** — Failure đặc trưng là dual-write problem: ghi DB và publish lên broker như hai bước nghĩa là một crash ở giữa mất hoặc tạo event ma — outbox tồn tại chính để tránh điều này. Xử lý downstream không idempotent biến at-least-once redelivery thành double credit, tạo tiền theo nghĩa đen. Tin "exactly-once" là thật và bỏ qua reconciliation để drift âm thầm tích lũy mà không tìm được nó vỡ khi nào; và không có audit log bất biến bạn không chứng minh được chuyện gì đã xảy ra khi dispute hay chargeback.
:::

*Đào sâu tiếp — khi external bank rail trả "unknown" (không thành công cũng không thất bại), Saga và reconciliation của bạn giải quyết transfer thế nào mà không double-spend hay mất tiền?*

**Từ khoá ăn điểm** — `double-entry ledger` · `transactional outbox` · `CDC` · `at-least-once + idempotent` · `Saga` · `reconciliation` · `audit log`
