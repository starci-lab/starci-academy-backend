# 1-system-design-mastery / 6-distributed-coordination
Summary: kept 9, delete 0 of 9

## 0-card — staff — [Distributed]
**Question:** Redlock claims to be a safe distributed lock over N Redis instances. Describe the algorithm, then explain Martin Kleppmann's critique: under what exact failure scenario does Redlock fail to provide safety?
**Verdict:** KEEP — open-ended algorithm walkthrough plus a named correctness critique; scales with seniority and invites the fencing-token follow-up.

### New answer (en)
**TL;DR** — Redlock acquires a lock on a majority of N independent Redis nodes via `SET key uuid PX ttl NX`; Kleppmann's critique is that it is unsafe whenever a process pause (GC, page fault) outlasts the TTL — the lock expires mid-operation, a second client acquires it, and two clients believe they hold the lock at once.

**How it works** — Send `SET key uuid PX ttl NX` to all N nodes (typically 5). The lock is held if a majority (≥ N/2+1) acknowledge within a window smaller than the TTL; the effective lock time is `TTL − elapsed_acquisition_time`. Release deletes the key on every node with a check-and-delete Lua script (`if GET key == uuid then DEL key`). The failure: client A acquires, then pauses after acquisition but before finishing its write. The TTL expires while A is frozen, client B acquires cleanly, A resumes, and both act as lock holder — safety is violated. No retry logic or TTL tuning removes OS-level pauses.

:::muted
**Trade-off** — For non-safety-critical mutual exclusion (job dedup, cache-stampede prevention) Redlock is good enough. For safety-critical writes (ledger mutation, inventory decrement) you need a fencing token — a monotonically increasing number the storage layer enforces — which etcd/Zookeeper leases provide and Redlock does not.
:::

:::muted
**Common pitfall** — Relying on tight TTLs without accounting for clock drift across nodes; NTP drift of tens of ms against a 100 ms TTL is a ~10% uncertainty window. Set TTLs much larger than your worst-case clock drift and process pause.
:::

*Go deeper — if Redlock can't be made safe, what exactly does a fencing token add that makes stale lock holders harmless?*

**Keywords** — `SET NX PX` · majority quorum · TTL · process pause · fencing token · clock drift

### New answer (vi)
**Chốt** — Redlock acquire lock trên đa số trong N Redis node độc lập bằng `SET key uuid PX ttl NX`; phê bình của Kleppmann là nó không an toàn mỗi khi một process pause (GC, page fault) kéo dài hơn TTL — lock hết hạn giữa chừng operation, một client thứ hai acquire được, và cả hai client cùng tin mình giữ lock.

**Cơ chế** — Gửi `SET key uuid PX ttl NX` tới cả N node (thường 5). Lock được coi là held nếu đa số (≥ N/2+1) ack trong cửa sổ nhỏ hơn TTL; thời gian lock hiệu quả là `TTL − elapsed_acquisition_time`. Release xóa key trên mọi node bằng Lua script check-and-delete (`if GET key == uuid then DEL key`). Kịch bản lỗi: client A acquire, rồi pause sau khi acquire nhưng trước khi xong write. TTL hết hạn khi A đóng băng, client B acquire sạch, A resume, và cả hai hành xử như lock holder — safety bị vi phạm. Không retry logic hay TTL tuning nào loại bỏ được OS-level pause.

:::muted
**Trade-off** — Cho mutual exclusion không safety-critical (job dedup, ngăn cache stampede) Redlock đủ tốt. Cho write safety-critical (ledger mutation, inventory decrement) bạn cần fencing token — một số tăng đơn điệu được storage layer enforce — thứ etcd/Zookeeper lease cung cấp còn Redlock thì không.
:::

:::muted
**Bẫy thường gặp** — Dựa vào TTL ngắn mà bỏ qua clock drift giữa các node; NTP drift vài chục ms so với TTL 100 ms là cửa sổ bất định ~10%. Đặt TTL lớn hơn nhiều worst-case clock drift và process pause của bạn.
:::

*Đào sâu tiếp — nếu Redlock không thể làm an toàn được, fencing token thêm chính xác điều gì khiến lock holder cũ trở nên vô hại?*

**Từ khoá ăn điểm** — `SET NX PX` · majority quorum · TTL · process pause · fencing token · clock drift

## 1-card — staff — [Distributed]
**Question:** What is the Raft consensus algorithm? Walk through how a leader election and a log entry commit works, and what happens during a network partition.
**Verdict:** KEEP — multi-part protocol walkthrough with partition reasoning; classic deep consensus question with real design follow-ups.

### New answer (en)
**TL;DR** — Raft is a leader-based consensus algorithm for replicated state machines: one elected leader serialises all writes, replicates each log entry to followers, and commits once a majority acknowledges. During a partition only the majority side can elect a leader and commit; the minority side stalls until the partition heals and adopts the majority's log.

**How it works** — *Leader election*: nodes start as Followers; if no leader heartbeat arrives within an election timeout (150–300 ms) a Follower becomes a Candidate, increments its term, and sends RequestVote RPCs — a majority of votes makes it Leader. *Log replication*: the Leader appends a client write as uncommitted, sends AppendEntries to all Followers, and commits + replies once a majority acknowledges. *Partition*: the majority partition keeps electing leaders and committing; the minority has no quorum so it cannot commit. On heal, minority nodes roll back any uncommitted entries and adopt the majority log.

:::muted
**Trade-off** — Raft is CP: it needs a stable majority to make progress (lose 3 of 5 nodes and you stall), and the single leader caps write throughput. High-throughput systems shard into many Raft groups (TiKV, CockroachDB); etcd/Zookeeper suit coordination metadata, not bulk data.
:::

:::muted
**Common pitfall** — Running an even node count or ignoring multi-way partitions. A 5-node cluster splitting 2+2+1 leaves no majority and the cluster stalls entirely; use odd counts (3, 5, 7) to maximise the chance a majority survives.
:::

*Go deeper — how does Raft guarantee a newly elected leader never has a shorter or stale log than the entries already committed by the previous term?*

**Keywords** — term · election timeout · RequestVote · AppendEntries · quorum/majority · CP

### New answer (vi)
**Chốt** — Raft là thuật toán consensus dựa trên leader cho replicated state machine: một leader được bầu serialize mọi write, replicate từng log entry tới follower, và commit khi đa số ack. Trong partition chỉ phía đa số mới bầu được leader và commit; phía thiểu số stall cho tới khi partition heal và adopt log của đa số.

**Cơ chế** — *Leader election*: node bắt đầu là Follower; nếu không có heartbeat leader trong election timeout (150–300 ms), Follower thành Candidate, tăng term, gửi RequestVote RPC — đa số vote thì thành Leader. *Log replication*: Leader append client write như uncommitted, gửi AppendEntries tới mọi Follower, và commit + reply khi đa số ack. *Partition*: phía đa số vẫn bầu leader và commit; phía thiểu số không có quorum nên không commit được. Khi heal, node thiểu số roll back mọi entry uncommitted và adopt log đa số.

:::muted
**Trade-off** — Raft là CP: cần đa số ổn định để tiến (mất 3/5 node là stall), và leader đơn giới hạn write throughput. Hệ thống high-throughput shard thành nhiều Raft group (TiKV, CockroachDB); etcd/Zookeeper hợp cho coordination metadata, không phải bulk data.
:::

:::muted
**Bẫy thường gặp** — Chạy số node chẵn hoặc bỏ qua multi-way partition. Cluster 5 node split 2+2+1 thì không phía nào có đa số và cả cluster stall; dùng số lẻ (3, 5, 7) để tối đa khả năng đa số sống sót.
:::

*Đào sâu tiếp — Raft đảm bảo thế nào rằng leader vừa bầu không bao giờ có log ngắn hơn hoặc cũ hơn các entry đã commit ở term trước?*

**Từ khoá ăn điểm** — term · election timeout · RequestVote · AppendEntries · quorum/majority · CP

## 2-card — staff — [Distributed]
**Question:** Explain clock skew and the "happened-before" relationship. How does Google Spanner use TrueTime to solve global ordering, and why can't you replicate this without atomic clocks?
**Verdict:** KEEP — combines theory (happened-before) with a real production system (TrueTime) and a sharp "why you can't copy it" hook.

### New answer (en)
**TL;DR** — Physical clocks skew by ms–seconds so timestamps can't order events across nodes; Lamport's happened-before captures only causal order. Spanner's TrueTime returns a bounded time *interval* and uses commit-wait to guarantee global ordering — and you can't replicate it without atomic clocks because cheap NTP intervals are too wide to wait out.

**How it works** — Lamport happened-before (→): A → B if A causes B (same process, or A is a send and B its receive); it gives partial order but cannot distinguish concurrent events. TrueTime exposes `now() = [earliest, latest]`, bounded by GPS receivers and atomic clocks in each datacenter. On commit, Spanner does commit-wait: after picking a commit timestamp it waits until `TrueTime.now().earliest > commit_ts`, so by the time the transaction is visible its timestamp is globally in the past — giving external consistency. Without atomic clocks the interval (`latest − earliest`) balloons to tens of ms of NTP drift, so commit-wait would stall every write.

:::muted
**Trade-off** — Commit-wait adds the clock-uncertainty bound (~7 ms worst case) to every cross-region write. That's the price of external consistency; most systems instead accept weaker guarantees (snapshot isolation, read-your-writes) because globally deployed atomic clocks are prohibitive outside Google.
:::

:::muted
**Common pitfall** — Using `Date.now()` / `CURRENT_TIMESTAMP` to order or establish causality across nodes. Events 500 ms apart by wall clock on different nodes may actually be concurrent or reversed; use logical clocks (Lamport, vector) or a central sequencer instead.
:::

*Go deeper — what specifically does commit-wait protect against that simply taking `max(local, received)` Lamport timestamps does not?*

**Keywords** — clock skew · happened-before (→) · TrueTime interval · commit-wait · external consistency · GPS/atomic clock

### New answer (vi)
**Chốt** — Đồng hồ vật lý lệch nhau ms–giây nên timestamp không thể order event qua node; happened-before của Lamport chỉ nắm được thứ tự nhân quả. TrueTime của Spanner trả một *interval* thời gian có biên và dùng commit-wait để đảm bảo global ordering — và bạn không thể replicate mà không có atomic clock vì interval NTP rẻ quá rộng để chờ qua.

**Cơ chế** — Lamport happened-before (→): A → B nếu A gây ra B (cùng process, hoặc A là send và B là receive của nó); cho partial order nhưng không phân biệt được concurrent event. TrueTime expose `now() = [earliest, latest]`, có biên nhờ GPS receiver và atomic clock trong mỗi datacenter. Khi commit, Spanner làm commit-wait: sau khi chọn commit timestamp nó chờ tới khi `TrueTime.now().earliest > commit_ts`, nên khi transaction visible thì timestamp của nó đã ở quá khứ globally — cho external consistency. Không có atomic clock, interval (`latest − earliest`) phình tới vài chục ms NTP drift, nên commit-wait sẽ stall mọi write.

:::muted
**Trade-off** — Commit-wait thêm biên clock-uncertainty (~7 ms worst case) vào mỗi cross-region write. Đó là giá của external consistency; hầu hết hệ thống thay vào đó chấp nhận đảm bảo yếu hơn (snapshot isolation, read-your-writes) vì atomic clock triển khai globally là quá đắt ngoài Google.
:::

:::muted
**Bẫy thường gặp** — Dùng `Date.now()` / `CURRENT_TIMESTAMP` để order hay xác định causality qua node. Hai event cách nhau 500 ms theo wall clock trên hai node khác nhau có thể thực sự concurrent hoặc đảo ngược; dùng logical clock (Lamport, vector) hoặc central sequencer.
:::

*Đào sâu tiếp — commit-wait bảo vệ chính xác điều gì mà việc chỉ lấy timestamp Lamport `max(local, received)` không bảo vệ được?*

**Từ khoá ăn điểm** — clock skew · happened-before (→) · TrueTime interval · commit-wait · external consistency · GPS/atomic clock

## 3-card — senior — [Distributed]
**Question:** In a leader election system built on Zookeeper or etcd, what is the "brain split" scenario and how do ephemeral nodes and session TTLs prevent it?
**Verdict:** KEEP — diagnosis-and-design question about split-brain with a real fencing follow-up; appropriately senior.

### New answer (en)
**TL;DR** — Split-brain is two nodes both believing they're leader and issuing conflicting mutations. Zookeeper-based election prevents it by giving each leader an ephemeral sequential node whose session expires automatically when the leader dies or is partitioned, so a stale leader loses its claim — but you still need fencing to close the expiry gap.

**How it works** — Candidates create ephemeral sequential nodes `/election/candidate-XXXXXXXXXX`; the lowest sequence number is leader. The node is *ephemeral*, so it is tied to the leader's session — when the leader dies or loses connectivity, the session expires within `session_timeout_ms` (typically 10–30 s), Zookeeper auto-deletes the node, and the next candidate is promoted. The TTL is what stops a disconnected old leader from holding leadership forever: once its session expires it can no longer touch the `/leader` lock.

:::muted
**Trade-off** — The TTL creates a danger window. After the old leader's session expires a new leader is elected and may start working, while the old leader — if merely paused, not dead — may still be executing. For up to `session_timeout_ms` two leaders can be active. Close it with fencing: store a monotonically increasing epoch in Zookeeper and have downstream systems reject any request carrying an epoch below the current max.
:::

:::muted
**Common pitfall** — Setting the session TTL shorter than the app's worst GC pause or peak-load heartbeat delay. A healthy-but-paused leader then loses its session, triggering an unnecessary failover and orphaning in-flight work; set the TTL to at least 3× the maximum expected GC pause.
:::

*Go deeper — even with a correct ephemeral-node election, why is fencing still mandatory rather than optional for a safety-critical workload?*

**Keywords** — split-brain · ephemeral sequential node · session_timeout_ms · fencing epoch · failover

### New answer (vi)
**Chốt** — Split-brain là hai node cùng tin mình là leader và phát ra mutation xung đột. Election dựa trên Zookeeper ngăn nó bằng cách cấp cho mỗi leader một ephemeral sequential node mà session tự hết hạn khi leader chết hoặc bị partition, nên leader cũ mất quyền — nhưng bạn vẫn cần fencing để bịt khoảng trống lúc hết hạn.

**Cơ chế** — Candidate tạo ephemeral sequential node `/election/candidate-XXXXXXXXXX`; sequence number nhỏ nhất là leader. Node là *ephemeral*, nên gắn với session của leader — khi leader chết hoặc mất kết nối, session hết hạn trong `session_timeout_ms` (thường 10–30 s), Zookeeper tự xóa node, và candidate kế tiếp được lên. TTL chính là thứ chặn old leader mất kết nối giữ leadership mãi: một khi session hết hạn nó không còn chạm được lock `/leader`.

:::muted
**Trade-off** — TTL tạo một cửa sổ nguy hiểm. Sau khi session của old leader hết hạn, leader mới được bầu và có thể bắt đầu làm việc, trong khi old leader — nếu chỉ pause chứ chưa chết — vẫn có thể đang thực thi. Trong tối đa `session_timeout_ms`, hai leader có thể active. Bịt nó bằng fencing: lưu một epoch tăng đơn điệu trong Zookeeper và để hệ thống downstream từ chối mọi request mang epoch thấp hơn max hiện tại.
:::

:::muted
**Bẫy thường gặp** — Đặt session TTL ngắn hơn GC pause tệ nhất hoặc heartbeat delay lúc peak-load. Một leader khỏe-nhưng-đang-pause sẽ mất session, gây failover không cần thiết và bỏ rơi in-flight work; đặt TTL ít nhất 3× maximum expected GC pause.
:::

*Đào sâu tiếp — ngay cả với election ephemeral-node đúng, vì sao fencing vẫn bắt buộc chứ không tùy chọn với workload safety-critical?*

**Từ khoá ăn điểm** — split-brain · ephemeral sequential node · session_timeout_ms · fencing epoch · failover

## 4-card — staff — [Distributed]
**Question:** 2PC vs Saga for a distributed transaction spanning a payment service and an inventory service. Under what failure scenario does each leave the system in an inconsistent state?
**Verdict:** KEEP — comparative design question forcing failure-mode analysis on both protocols; strong staff-level depth.

### New answer (en)
**TL;DR** — 2PC's bad case is a coordinator crash after "prepare" but before "commit": both participants sit holding locks forever, blocked. Saga's bad case is a compensating transaction that itself fails and isn't retried, leaving the work partially undone (payment charged, inventory not decremented). 2PC trades availability for atomicity; Saga trades strong consistency for availability.

**How it works** — *2PC failure*: the coordinator sends "prepare", both participants vote Yes and hold locks, then the coordinator dies before sending "commit"/"abort". Participants cannot safely decide alone, so they block indefinitely — the classic 2PC blocking problem. *Saga failure*: a step fails partway, its compensating transaction for an earlier step is triggered, but the compensation itself fails (network/DB) and isn't retried — the system is left partially compensated with no automatic recovery. A pragmatic middle ground for payment + inventory is the outbox pattern: write the inventory-decrement event into an outbox in the same DB transaction as the payment, then a relay delivers it, retrying until success.

:::muted
**Trade-off** — 2PC gives atomicity but blocks the moment the coordinator is unavailable; Saga gives availability but only eventual consistency, and compensation is not guaranteed to succeed atomically. Choose based on whether you can tolerate a blocked-but-correct system or an available-but-temporarily-inconsistent one.
:::

:::muted
**Common pitfall** — Writing compensating transactions that aren't idempotent. If "refund payment" runs twice (Saga engine plus a retry) the customer is refunded twice; guard every compensation with an idempotency key.
:::

*Go deeper — why does the outbox pattern sidestep both the 2PC blocking problem and Saga's failed-compensation problem at once?*

**Keywords** — 2PC prepare/commit · coordinator blocking · Saga compensation · outbox pattern · idempotency key · eventual consistency

### New answer (vi)
**Chốt** — Ca xấu của 2PC là coordinator crash sau "prepare" nhưng trước "commit": cả hai participant giữ lock mãi mãi, bị block. Ca xấu của Saga là một compensating transaction tự nó fail và không được retry, để công việc dở dang (payment đã charge, inventory chưa giảm). 2PC đánh đổi availability lấy atomicity; Saga đánh đổi strong consistency lấy availability.

**Cơ chế** — *Lỗi 2PC*: coordinator gửi "prepare", cả hai participant vote Yes và giữ lock, rồi coordinator chết trước khi gửi "commit"/"abort". Participant không thể tự quyết an toàn, nên block vô thời hạn — đúng bài toán blocking kinh điển của 2PC. *Lỗi Saga*: một step fail giữa chừng, compensating transaction cho step trước được trigger, nhưng chính compensation đó fail (network/DB) và không được retry — hệ thống ở trạng thái partially compensated, không tự phục hồi. Một trung dung thực tế cho payment + inventory là outbox pattern: ghi event giảm inventory vào outbox trong cùng DB transaction với payment, rồi một relay giao nó, retry tới khi thành công.

:::muted
**Trade-off** — 2PC cho atomicity nhưng block ngay khi coordinator không khả dụng; Saga cho availability nhưng chỉ eventual consistency, và compensation không được đảm bảo thành công atomic. Chọn dựa trên việc bạn chịu được hệ thống bị-block-nhưng-đúng hay khả-dụng-nhưng-tạm-thời-không-nhất-quán.
:::

:::muted
**Bẫy thường gặp** — Viết compensating transaction không idempotent. Nếu "refund payment" chạy hai lần (Saga engine cộng một retry) thì khách bị refund hai lần; guard mọi compensation bằng idempotency key.
:::

*Đào sâu tiếp — vì sao outbox pattern né được cả blocking của 2PC lẫn vấn đề compensation-fail của Saga cùng lúc?*

**Từ khoá ăn điểm** — 2PC prepare/commit · coordinator blocking · Saga compensation · outbox pattern · idempotency key · eventual consistency

## 5-card — staff — [Distributed]
**Question:** What is a fencing token and how does it solve the problem of a process that holds a distributed lock but is paused (GC, network partition) so long that the lock expires?
**Verdict:** KEEP — mechanism-plus-why question with a real TOCTOU pitfall; pairs with the Redlock card without duplicating it (different focus: the fix, not the failure).

### New answer (en)
**TL;DR** — A fencing token is a monotonically increasing number the lock service issues on every grant; the protected storage records the highest token it has seen and rejects any write carrying a smaller one. A paused-then-resumed lock holder writes with a stale (smaller) token, so the storage rejects it — safety holds even though the client never noticed its lock expired.

**How it works** — Each lock grant returns a strictly increasing token (it bumps even across different holders). Every write to the protected resource carries its token, and the storage layer tracks the max token seen and rejects writes with token ≤ that max. Scenario: client A holds the lock with token 33 and pauses; the lock expires; client B acquires with token 34; A resumes and writes with token 33; storage rejects it (33 < 34), while B's token-34 writes succeed. Correctness no longer depends on the client checking lock validity — the storage enforces it.

:::muted
**Trade-off** — Fencing requires the storage layer to cooperate by checking and persisting tokens on every write, coupling the lock protocol to the storage. etcd lease revision numbers and Zookeeper epoch numbers serve as ready-made tokens; bespoke stores must implement token tracking themselves.
:::

:::muted
**Common pitfall** — Enforcing the token at the application layer ("is my lock still valid?" before writing) instead of the storage layer. That reintroduces a TOCTOU race — the lock is valid at check time but expires before the write lands; only storage-side rejection of stale tokens actually closes the window.
:::

*Go deeper — why can a fencing token be enforced safely at the storage layer but not at the application layer, even with a re-check right before the write?*

**Keywords** — fencing token · monotonic counter · stale-token reject · TOCTOU · etcd revision · Zookeeper epoch

### New answer (vi)
**Chốt** — Fencing token là một số tăng đơn điệu mà lock service phát ra ở mỗi lần cấp; storage được bảo vệ ghi lại token cao nhất từng thấy và từ chối mọi write mang token nhỏ hơn. Một lock holder pause-rồi-resume sẽ write với token cũ (nhỏ hơn), nên storage từ chối — safety vẫn giữ dù client chẳng hề biết lock của mình đã hết hạn.

**Cơ chế** — Mỗi lần cấp lock trả về một token tăng nghiêm ngặt (tăng cả khi đổi holder). Mỗi write tới protected resource mang token của nó, và storage layer theo dõi token max đã thấy và từ chối write có token ≤ max đó. Kịch bản: client A giữ lock với token 33 và pause; lock hết hạn; client B acquire với token 34; A resume và write với token 33; storage từ chối (33 < 34), trong khi write token-34 của B thành công. Tính đúng không còn phụ thuộc client tự kiểm tra lock validity — storage enforce nó.

:::muted
**Trade-off** — Fencing đòi storage layer hợp tác bằng cách kiểm tra và persist token ở mỗi write, gắn lock protocol với storage. etcd lease revision number và Zookeeper epoch number dùng được luôn như token có sẵn; store tự chế phải tự implement việc theo dõi token.
:::

:::muted
**Bẫy thường gặp** — Enforce token ở application layer ("lock của tôi còn valid không?" trước khi write) thay vì storage layer. Điều đó tái tạo race TOCTOU — lock valid lúc check nhưng hết hạn trước khi write tới; chỉ việc storage từ chối stale token mới thực sự bịt được cửa sổ.
:::

*Đào sâu tiếp — vì sao fencing token enforce an toàn được ở storage layer nhưng không ở application layer, ngay cả khi re-check ngay trước write?*

**Từ khoá ăn điểm** — fencing token · monotonic counter · stale-token reject · TOCTOU · etcd revision · Zookeeper epoch

## 6-card — staff — [Distributed]
**Question:** Describe the Double-Entry Ledger pattern for a wallet system. Why is it immune to certain classes of race conditions that a simple balance update is not?
**Verdict:** KEEP — pattern design plus a precise concurrency argument (lost-update vs append-only), with a sharp overdraft pitfall.

### New answer (en)
**TL;DR** — A double-entry ledger records every transfer as immutable append-only rows (a debit and a credit) and derives the balance as `SUM(amount)` instead of mutating a stored field. It's immune to the lost-update race that a `balance = balance - x` update suffers, because two concurrent inserts both persist — neither overwrites the other.

**How it works** — A naive `UPDATE wallets SET balance = balance - 100` races: two transfers both read 500, both compute 400, both write 400, and one is silently lost. The ledger instead does `INSERT INTO ledger (tx_id, user_id, amount) VALUES (uuid, X, -100), (uuid, Y, +100)` as a single atomic statement (or within a DB transaction); the balance is computed at read time from the append-only history. Concurrent inserts don't conflict the way concurrent read-modify-write on one row does — both rows land and the balance reflects both. As a bonus the immutable log is a built-in audit trail.

:::muted
**Trade-off** — Reads cost `SELECT SUM(amount) WHERE user_id = X`, which gets slower as the ledger grows; mitigate with periodic balance snapshots (materialise a running total every N rows, then SUM only rows after the snapshot).
:::

:::muted
**Common pitfall** — Assuming append-only also prevents overdrafts — it doesn't. Two concurrent transfers can each read `balance >= 100` as true and both insert debits, driving the balance negative. Guard the debit with an optimistic lock (include the checked SUM in the insert's WHERE clause, retry on conflict) or a pessimistic row lock.
:::

*Go deeper — what's the minimal concurrency control you'd add to a double-entry ledger to make overdrafts impossible without serialising all transfers on one account?*

**Keywords** — double-entry · debit/credit · append-only · SUM(amount) · lost update · overdraft · optimistic lock

### New answer (vi)
**Chốt** — Double-entry ledger ghi mỗi transfer thành các row immutable append-only (một debit và một credit) và suy ra số dư bằng `SUM(amount)` thay vì mutate một field đã lưu. Nó miễn nhiễm với race lost-update mà update `balance = balance - x` mắc phải, vì hai insert đồng thời đều persist — không cái nào ghi đè cái kia.

**Cơ chế** — Một `UPDATE wallets SET balance = balance - 100` ngây thơ bị race: hai transfer cùng đọc 500, cùng tính 400, cùng ghi 400, và một bị mất im lặng. Ledger thay vào đó làm `INSERT INTO ledger (tx_id, user_id, amount) VALUES (uuid, X, -100), (uuid, Y, +100)` như một câu lệnh atomic đơn (hoặc trong DB transaction); số dư được tính lúc read từ lịch sử append-only. Insert đồng thời không xung đột theo kiểu read-modify-write đồng thời trên một row — cả hai row đều landed và số dư phản ánh cả hai. Phần thưởng kèm theo: log immutable là audit trail có sẵn.

:::muted
**Trade-off** — Read tốn `SELECT SUM(amount) WHERE user_id = X`, chậm dần khi ledger lớn; giảm thiểu bằng periodic balance snapshot (materialise running total mỗi N row, rồi chỉ SUM các row sau snapshot).
:::

:::muted
**Bẫy thường gặp** — Tưởng append-only cũng ngăn overdraft — không phải vậy. Hai transfer đồng thời có thể cùng đọc `balance >= 100` là đúng và cùng insert debit, đẩy số dư âm. Guard phía debit bằng optimistic lock (đưa SUM đã check vào WHERE clause của insert, retry khi conflict) hoặc pessimistic row lock.
:::

*Đào sâu tiếp — control concurrency tối thiểu nào bạn thêm vào double-entry ledger để overdraft thành bất khả mà không serialize mọi transfer trên một account?*

**Từ khoá ăn điểm** — double-entry · debit/credit · append-only · SUM(amount) · lost update · overdraft · optimistic lock

## 7-card — senior — [Distributed]
**Question:** How does vector clock differ from a Lamport clock, and in what system is a vector clock strictly necessary?
**Verdict:** KEEP — contrast question with a "when is it strictly necessary" judgment and a conflict-resolution pitfall; solidly senior.

### New answer (en)
**TL;DR** — A Lamport clock is a single scalar that totally orders causally related events but cannot tell concurrent events apart; a vector clock keeps one counter per node and can detect that two writes are concurrent (and thus in conflict). Vector clocks are strictly necessary wherever you must detect concurrent conflicting writes — e.g. Dynamo/DynamoDB version vectors, Riak conflict detection.

**How it works** — Lamport: a scalar incremented on each event and reconciled on receive as `max(local, received) + 1`; timestamps 10 and 15 might be causal or concurrent — you can't distinguish. Vector clock: each node holds a vector of per-node counters; increment your own on a local event, attach the vector on send, and on receive take the component-wise max then increment your own. Compare: `A < B` iff every component of A ≤ B with at least one strictly less; if neither A < B nor B < A, the events are concurrent. That concurrency detection is exactly what a scalar Lamport clock cannot provide.

:::muted
**Trade-off** — Vector clocks grow with the node count — 100 nodes means 100 counters per message, real overhead. Mitigations include dotted version vectors (Riak), pruning, and bounded clocks; Dynamo used pruned vector clocks but found client complexity too high and moved toward last-write-wins with per-server timestamps.
:::

:::muted
**Common pitfall** — Treating "vector clock detected concurrency" as if it resolved the conflict. It only flags that a conflict exists; resolution still needs application logic (merge both versions, last-write-wins, or prompt the user). Shopping-cart merge is the classic application-level resolution.
:::

*Go deeper — given vector clocks' per-node growth, what would make you choose last-write-wins instead, and what correctness do you knowingly give up?*

**Keywords** — Lamport scalar · vector clock · component-wise max · concurrent vs causal · version vector · conflict resolution

### New answer (vi)
**Chốt** — Lamport clock là một scalar đơn, total-order các event causally related nhưng không phân biệt được concurrent event; vector clock giữ một counter per node và phát hiện được hai write là concurrent (do đó conflict). Vector clock bắt buộc ở bất cứ đâu bạn phải phát hiện concurrent conflicting write — ví dụ version vector của Dynamo/DynamoDB, conflict detection của Riak.

**Cơ chế** — Lamport: một scalar tăng ở mỗi event và reconcile khi nhận bằng `max(local, received) + 1`; timestamp 10 và 15 có thể causal hoặc concurrent — không phân biệt được. Vector clock: mỗi node giữ một vector counter per node; tăng counter của mình khi có local event, attach vector khi gửi, và khi nhận thì lấy component-wise max rồi tăng counter của mình. So sánh: `A < B` khi và chỉ khi mọi component của A ≤ B với ít nhất một nhỏ hơn hẳn; nếu cả A < B lẫn B < A đều sai, event là concurrent. Khả năng phát hiện concurrency đó chính là thứ Lamport scalar không cho được.

:::muted
**Trade-off** — Vector clock lớn theo số node — 100 node nghĩa là 100 counter mỗi message, overhead thật. Giảm thiểu gồm dotted version vector (Riak), pruning, và bounded clock; Dynamo dùng vector clock có pruning nhưng thấy client complexity quá cao và chuyển sang last-write-wins với per-server timestamp.
:::

:::muted
**Bẫy thường gặp** — Coi "vector clock phát hiện concurrency" như thể nó đã resolve conflict. Nó chỉ flag rằng conflict tồn tại; resolve vẫn cần application logic (merge cả hai version, last-write-wins, hoặc nhắc user). Shopping-cart merge là resolution application-level kinh điển.
:::

*Đào sâu tiếp — với việc vector clock lớn theo số node, điều gì khiến bạn chọn last-write-wins thay thế, và bạn cố ý từ bỏ tính đúng nào?*

**Từ khoá ăn điểm** — Lamport scalar · vector clock · component-wise max · concurrent vs causal · version vector · conflict resolution

## 8-card — staff — [Distributed]
**Question:** How do you design a distributed job scheduler that guarantees each job runs exactly once, even when the scheduler itself can crash and restart?
**Verdict:** KEEP — open-ended system design with a hard correctness claim (exactly-once) and a deep atomicity pitfall; strong staff question.

### New answer (en)
**TL;DR** — You can't get true exactly-once across a crash, so you build at-least-once delivery plus idempotent jobs: store jobs in a durable registry, have workers atomically claim a job with an expiring lock, heartbeat the lock while running, reclaim expired locks, and make the job's own side effects idempotent. The atomic claim and idempotency together give the *effect* of exactly-once.

**How it works** — (1) Durable registry: a jobs table with `job_id, scheduled_at, status (PENDING/RUNNING/DONE/FAILED), locked_by, lock_expires_at`. (2) Atomic claim: `UPDATE jobs SET status='RUNNING', locked_by=worker, lock_expires_at=now()+30s WHERE status='PENDING' AND scheduled_at <= now() LIMIT 1` — the row-level lock guarantees exactly one worker wins. (3) Heartbeat: the worker extends `lock_expires_at` periodically. (4) Reclaim: a recovery sweep resets jobs that are `RUNNING AND lock_expires_at < now()` back to PENDING. (5) Idempotent job logic so a crash after doing the work but before marking DONE is harmless.

:::muted
**Trade-off** — Polling for PENDING jobs adds DB load; cut latency with PostgreSQL NOTIFY/LISTEN or a Redis pub/sub wake-up on insert. The expiring-lock model is fundamentally at-least-once, so it's only safe when the job is idempotent.
:::

:::muted
**Common pitfall** — Not committing the side effect and the DONE status in one atomic step. If the job writes its result and then separately marks itself DONE, a crash between the two re-runs the job. The only true fix is to write the result and flip the status to DONE in the same DB transaction on the DB that owns the registry.
:::

*Go deeper — if the job's side effect lands in an external system (charging a card), how do you still get exactly-once effect when you can't share a transaction with the job registry?*

**Keywords** — durable registry · atomic claim (row lock) · lock_expires_at · heartbeat · reclaim stale · idempotency · at-least-once

### New answer (vi)
**Chốt** — Bạn không thể có exactly-once thật qua một lần crash, nên bạn xây at-least-once delivery cộng idempotent job: lưu job trong một registry bền, để worker atomically claim job bằng một lock có hạn, heartbeat lock khi đang chạy, reclaim lock hết hạn, và làm side effect của job idempotent. Atomic claim cộng idempotency cùng nhau cho *hiệu ứng* exactly-once.

**Cơ chế** — (1) Durable registry: bảng jobs với `job_id, scheduled_at, status (PENDING/RUNNING/DONE/FAILED), locked_by, lock_expires_at`. (2) Atomic claim: `UPDATE jobs SET status='RUNNING', locked_by=worker, lock_expires_at=now()+30s WHERE status='PENDING' AND scheduled_at <= now() LIMIT 1` — row-level lock đảm bảo đúng một worker thắng. (3) Heartbeat: worker gia hạn `lock_expires_at` định kỳ. (4) Reclaim: một recovery sweep reset các job `RUNNING AND lock_expires_at < now()` về PENDING. (5) Idempotent job logic để một crash sau khi làm xong việc nhưng trước khi mark DONE là vô hại.

:::muted
**Trade-off** — Polling cho PENDING job thêm DB load; giảm latency bằng PostgreSQL NOTIFY/LISTEN hoặc Redis pub/sub đánh thức khi insert. Mô hình lock-có-hạn về bản chất là at-least-once, nên chỉ an toàn khi job idempotent.
:::

:::muted
**Bẫy thường gặp** — Không commit side effect và status DONE trong một bước atomic. Nếu job ghi kết quả rồi mark DONE riêng, một crash giữa hai bước sẽ re-run job. Fix đúng duy nhất là ghi kết quả và lật status sang DONE trong cùng DB transaction trên DB sở hữu registry.
:::

*Đào sâu tiếp — nếu side effect của job xảy ra ở hệ thống ngoài (charge thẻ), làm sao vẫn có hiệu ứng exactly-once khi bạn không thể chia sẻ transaction với job registry?*

**Từ khoá ăn điểm** — durable registry · atomic claim (row lock) · lock_expires_at · heartbeat · reclaim stale · idempotency · at-least-once
