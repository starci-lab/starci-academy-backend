# 1-system-design-mastery / 21-distributed-coordination-and-consensus
Summary: kept 8, delete 0 of 8

## 0-card — junior — [Distributed, Fundamentals]
**Question:** You have two backend instances behind a load balancer, and a bug only appears when both run a nightly cleanup job at the same time. A teammate suggests "just have each node check a timestamp and skip if another node ran recently." Why is coordinating two nodes fundamentally harder than coordinating two threads in one process?
**Verdict:** KEEP — open-ended "why", invites a follow-up about how to actually coordinate, scales with seniority.

### New answer (en)
**TL;DR** — Two threads share memory, a mutex, and one clock, so a lock is just an atomic flag. Two nodes share none of that — they only exchange messages over an unreliable network with no global clock — so safe coordination needs an external atomic agreement (an atomic store op or a consensus system), not a local check.

**How it works** — Two threads in one process read a single monotonic clock and a shared mutex atomically. Two nodes have three problems threads don't: there is no global clock, so "ran recently" means something different on each box; there is partial failure, so one node can crash or become unreachable while the other keeps going and cannot tell "crashed" from "slow"; and messages can be lost, duplicated, reordered, or arbitrarily delayed. The fix is to push the decision into something both nodes can agree on atomically — `Redis SET NX`, a database row lock, or a real coordinator like etcd/ZooKeeper — so exactly one node wins.

:::muted
**Trade-off** — The cheap fix (a shared "is anyone running?" flag in a DB) gives you one source of truth at the cost of a network round-trip and a dependency on that store's availability. A dedicated coordination service (ZooKeeper/etcd) adds leases, watches, and fencing but is another stateful system to run. For a nightly job the cheap atomic conditional-write is usually right.
:::

:::muted
**Common pitfall** — "Check the timestamp, then act" is a read-modify-write race: both nodes read "nobody ran", both run, both write. The check and the act must be one atomic operation. The deeper trap is assuming the network is reliable and instant (a classic fallacy of distributed computing) — a node that looks dead may be in a long GC pause and wake up minutes later still about to act.
:::

*Go deeper — if you do reach for `SET NX`, what does the TTL on that key protect against, and what new failure does it introduce?*

**Keywords** — `partial failure · no global clock · SET NX · atomic compare-and-set · read-modify-write race`

### New answer (vi)
**Chốt** — Hai thread chia sẻ bộ nhớ, một mutex và một đồng hồ, nên lock chỉ là một cờ atomic. Hai node không chia sẻ thứ nào trong số đó — chúng chỉ trao đổi message qua một network không tin cậy và không có global clock — nên phối hợp an toàn cần một sự đồng thuận atomic bên ngoài (một thao tác store atomic hoặc hệ consensus), chứ không phải một phép kiểm tra cục bộ.

**Cơ chế** — Hai thread trong cùng process đọc một đồng hồ monotonic duy nhất và một mutex chung một cách atomic. Hai node có ba vấn đề mà thread không có: không có global clock, nên "vừa chạy gần đây" mang nghĩa khác nhau trên mỗi máy; có partial failure, nên một node có thể crash hoặc mất kết nối trong khi node kia vẫn chạy và không phân biệt được "đã crash" với "đang chậm"; và message có thể bị mất, nhân đôi, đảo thứ tự hoặc trễ tùy ý. Cách sửa là đẩy quyết định vào thứ cả hai node đồng thuận được một cách atomic — `Redis SET NX`, một row lock trong database, hoặc một coordinator thực thụ như etcd/ZooKeeper — để đúng một node thắng.

:::muted
**Trade-off** — Cách rẻ (một cờ "có ai đang chạy không?" chung trong DB) cho bạn một nguồn sự thật duy nhất, đổi lại là một network round-trip và sự phụ thuộc vào tính sẵn sàng của store đó. Một coordination service chuyên dụng (ZooKeeper/etcd) thêm lease, watch và fencing nhưng là một hệ stateful nữa phải vận hành. Với một job ban đêm thì conditional-write atomic rẻ thường là đúng.
:::

:::muted
**Bẫy thường gặp** — "Kiểm tra timestamp rồi hành động" là một race read-modify-write: cả hai node đọc thấy "chưa ai chạy", cả hai chạy, cả hai ghi. Việc kiểm tra và việc hành động phải là một thao tác atomic duy nhất. Cái bẫy sâu hơn là giả định network tin cậy và tức thời (một fallacy of distributed computing kinh điển) — một node trông như đã chết có thể đang trong một GC pause dài rồi thức dậy sau nhiều phút và vẫn sắp hành động.
:::

*Đào sâu tiếp — nếu bạn dùng `SET NX`, TTL trên key đó bảo vệ điều gì, và nó tạo ra failure mới nào?*

**Từ khoá ăn điểm** — `partial failure · no global clock · SET NX · atomic compare-and-set · read-modify-write race`

## 1-card — senior — [Distributed, Locks]
**Question:** Your payment service uses a Redis lock so only one worker charges a given invoice. In production you occasionally see an invoice charged twice. The lock acquisition code is correct and the TTL is generous. Walk through how a single lock can be held by two workers at once, and what a fencing token changes.
**Verdict:** KEEP — diagnosis + design fix (fencing tokens), real trade-offs, classic senior depth.

### New answer (en)
**TL;DR** — A TTL lock is a *lease*: if holder A pauses past the TTL, Redis expires the key, B legitimately acquires it, then A resumes still believing it holds the lock — two valid leases, not at the same instant. A **fencing token** (a monotonic number issued per grant, checked and rejected-if-stale at the protected resource) makes A's late write provably out of date.

**How it works** — Worker A acquires the lease, then suffers a pause longer than the TTL — GC, a CPU-starved container, a slow downstream call. Redis expires the key, B acquires it and charges, A wakes and charges too. No TTL eliminates this because process pauses are unbounded. The fix: the lock server hands out a monotonically increasing fencing token with each grant; the resource (DB row, payment gateway) records the highest token it has accepted and rejects any write carrying a smaller one, so A's stale write is refused.

:::muted
**Trade-off** — A plain single-Redis lease or Redlock is simple and fast and fine for *efficiency* locks, where a rare double-run is just wasteful (regenerating a cache). Fencing needs the downstream resource to persist and compare tokens, which a third-party payment API often can't. When you can't fence, fall back to **idempotency keys** at the gateway so duplicates dedup server-side — same safety, different mechanism.
:::

:::muted
**Common pitfall** — Treating a TTL lock as a *correctness* lock when it's only an *efficiency* lock; no TTL closes the unbounded pause window. A second trap is unsafe release: deleting the key by name lets A delete B's fresh lock, so release must be a compare-and-delete on the unique token (a Lua script). Clock drift between Redis replicas also makes the effective lease shorter than you think.
:::

*Go deeper — Redlock claims safety across multiple Redis masters; why does Kleppmann argue it still doesn't give you a correctness lock without fencing?*

**Keywords** — `lease · fencing token · monotonic · efficiency vs correctness lock · idempotency key · compare-and-delete (Lua)`

### New answer (vi)
**Chốt** — Một TTL lock là một *lease*: nếu holder A pause quá TTL, Redis expire key, B acquire một cách hợp lệ, rồi A hồi phục vẫn tin mình giữ lock — hai lease hợp lệ, nhưng không tại cùng một khoảnh khắc. Một **fencing token** (một con số tăng đơn điệu phát ra mỗi lần grant, được kiểm và từ chối-nếu-cũ tại tài nguyên được bảo vệ) làm cho write trễ của A chứng minh được là đã lỗi thời.

**Cơ chế** — Worker A acquire lease, rồi chịu một pause dài hơn TTL — GC, một container đói CPU, một downstream call chậm. Redis expire key, B acquire và charge, A thức dậy và cũng charge. Không TTL nào loại bỏ được điều này vì process pause là không bị chặn trên. Cách sửa: lock server phát một fencing token tăng đơn điệu mỗi lần grant; tài nguyên (row DB, payment gateway) ghi lại token cao nhất đã chấp nhận và từ chối write nào mang token nhỏ hơn, nên write cũ của A bị từ chối.

:::muted
**Trade-off** — Một lease single-Redis thuần hoặc Redlock thì đơn giản, nhanh và ổn cho lock *efficiency*, nơi một lần chạy kép hiếm hoi chỉ là lãng phí (regenerate một cache). Fencing đòi tài nguyên downstream phải lưu và so sánh token, điều mà một payment API bên thứ ba thường không làm được. Khi không fence được, hãy lùi về **idempotency key** tại gateway để bản trùng được dedup phía server — cùng tính an toàn, cơ chế khác.
:::

:::muted
**Bẫy thường gặp** — Coi một TTL lock như lock *correctness* trong khi nó chỉ là lock *efficiency*; không TTL nào đóng được cửa sổ pause không chặn trên. Bẫy thứ hai là release không an toàn: xóa key theo tên cho phép A xóa nhầm lock vừa được B acquire, nên release phải là compare-and-delete trên token duy nhất (một Lua script). Clock drift giữa các Redis replica cũng làm lease hiệu dụng ngắn hơn bạn tưởng.
:::

*Đào sâu tiếp — Redlock tuyên bố an toàn xuyên nhiều Redis master; vì sao Kleppmann lập luận nó vẫn không cho bạn một correctness lock nếu thiếu fencing?*

**Từ khoá ăn điểm** — `lease · fencing token · monotonic · efficiency vs correctness lock · idempotency key · compare-and-delete (Lua)`

## 2-card — senior — [Distributed, Leader Election]
**Question:** A replicated job scheduler elects one leader to assign work so jobs aren't run twice. After a brief network partition, you discover two nodes both believed they were leader and both dispatched the same jobs. Why do these systems need a single leader at all, how does split-brain arise, and how do you prevent it?
**Verdict:** KEEP — three-part reasoning (why leader / how split-brain / how to prevent), CAP trade-off, strong senior question.

### New answer (en)
**TL;DR** — A single leader serializes decisions so concurrent actions never conflict. Split-brain happens when a partition (or a paused leader) lets two nodes each believe they lead. Prevent it with **majority quorum + monotonic terms**: only a node winning a majority of votes can lead, and stale-term actions are rejected.

**How it works** — One leader is the single place to order "who runs which job" and "what order writes commit", so you don't need every node to agree on every operation. Split-brain: the old leader doesn't realize it lost contact while the rest time out and elect a new one — now both dispatch. The standard prevention is majority quorum plus terms: a node leads only after winning votes from a majority of the cluster, and each leadership carries a strictly increasing term number. A minority partition can never assemble a majority, so it can't elect; and any action from a stale leader carries an old term that followers reject. Pair this with a fencing token so dispatched work is stamped with the term.

:::muted
**Trade-off** — Requiring a majority for election sacrifices availability during a partition: the minority stops accepting writes rather than risk a second leader (a CP choice). Right for a scheduler where double-dispatch is harmful; for tolerable-stale-read systems an AP design that stays up and reconciles later may be better. Election also adds a re-election gap (a few timeouts) where there is no leader and the system pauses — a deliberate cost for safety.
:::

:::muted
**Common pitfall** — Treating "I haven't heard a heartbeat" as proof the old leader is dead; it may be alive and partitioned, still acting — close the gap with fencing tokens stamped with the term. Another trap is an even voter count (allows tie/no-majority deadlock) or a too-aggressive heartbeat timeout (spurious failovers under normal latency spikes, churning leadership and widening the split-brain window).
:::

*Go deeper — once you have terms and quorum, what extra step makes a leader's reads linearizable, not just its writes?*

**Keywords** — `majority quorum · term/epoch · split-brain · fencing token · CP · heartbeat timeout`

### New answer (vi)
**Chốt** — Một leader duy nhất serialize các quyết định nên các hành động đồng thời không bao giờ xung đột. Split-brain xảy ra khi một partition (hoặc một leader bị pause) khiến hai node mỗi bên tin mình lãnh đạo. Ngăn nó bằng **majority quorum + term tăng đơn điệu**: chỉ node thắng đa số phiếu mới lãnh đạo, và hành động mang term cũ bị từ chối.

**Cơ chế** — Một leader là nơi duy nhất sắp thứ tự "ai chạy job nào" và "write commit theo thứ tự nào", nên không cần mọi node đồng thuận trên mọi thao tác. Split-brain: leader cũ chưa nhận ra mình mất liên lạc trong khi các node còn lại time out và bầu một leader mới — giờ cả hai cùng dispatch. Cách ngăn chuẩn là majority quorum cộng term: một node chỉ lãnh đạo sau khi thắng phiếu từ đa số cluster, và mỗi nhiệm kỳ mang một term number tăng đơn điệu nghiêm ngặt. Một partition thiểu số không bao giờ gom được đa số nên không thể bầu; và bất kỳ hành động nào từ leader cũ mang term cũ đều bị follower từ chối. Ghép thêm fencing token để việc được dispatch đóng dấu term.

:::muted
**Trade-off** — Yêu cầu đa số để bầu cử hy sinh tính sẵn sàng trong lúc partition: phía thiểu số ngừng nhận write thay vì mạo hiểm có leader thứ hai (lựa chọn CP). Đúng cho một scheduler nơi double-dispatch có hại; với hệ chấp nhận stale read thì một thiết kế AP vẫn sống và reconcile sau có thể tốt hơn. Bầu cử cũng thêm một khoảng re-election (vài timeout) nơi không có leader và hệ thống tạm dừng — một cái giá cố ý cho tính an toàn.
:::

:::muted
**Bẫy thường gặp** — Coi "tôi không nghe thấy heartbeat" như bằng chứng leader cũ đã chết; nó có thể vẫn sống và bị partition, vẫn đang hành động — bịt khe hở bằng fencing token đóng dấu term. Bẫy khác là số voter chẵn (cho phép deadlock hòa phiếu/không đa số) hoặc heartbeat timeout quá gắt (failover giả khi latency tăng vọt bình thường, làm leadership đảo liên tục và nới rộng cửa sổ split-brain).
:::

*Đào sâu tiếp — khi đã có term và quorum, bước thêm nào làm read của leader trở nên linearizable chứ không chỉ write?*

**Từ khoá ăn điểm** — `majority quorum · term/epoch · split-brain · fencing token · CP · heartbeat timeout`

## 3-card — senior — [Distributed, Consensus]
**Question:** Your team is standing up a Raft-backed config store and debates the node count: someone proposes 4 nodes "for extra redundancy." In the interview you're asked to explain quorum, why an odd number is standard, and exactly what guarantee the Raft leader gives a client on a successful write. How do you answer?
**Verdict:** KEEP — explains quorum overlap, odd-vs-even fault tolerance, and the linearizability guarantee; precise senior consensus question.

### New answer (en)
**TL;DR** — Quorum is a majority, floor(N/2)+1; any two majorities overlap in ≥1 node, so conflicting decisions can't both commit. An odd size is standard because 4 nodes tolerate the same 1 failure as 3 while costing more and adding tie risk. A successful Raft write is **majority-persisted, ordered, and durable across any future leader — linearizable.**

**How it works** — Quorum is the minimum set that must agree before a decision counts. Because any two majorities of the same cluster overlap in at least one node, two conflicting decisions can never both reach quorum — that's what guarantees a single consistent history. The leader commits a write only after replicating the log entry to a majority and getting their acks; once committed it survives every future election, because Raft's election restriction lets only a node holding all committed entries win. So "write succeeded" means: persisted on a majority, ordered in the log, never lost or reordered.

:::muted
**Trade-off** — Odd size maximizes fault tolerance per node: 3 and 4 both tolerate 1 failure (quorum 2 vs 3), so the 4th adds cost, write latency, and tie-proneness without buying availability; 5 tolerates 2. The real axis is durability vs latency — a bigger quorum survives more failures but every write waits on more replicas, raising tail latency. Most clusters pick 3 or 5 and scale reads with followers/learners, not more voters.
:::

:::muted
**Common pitfall** — Believing consensus means "always available": if you can't reach a majority the cluster correctly refuses writes rather than fork its history. Another trap is reading from the leader with no read barrier — a deposed leader can serve a stale linearizable-looking read, so safe reads need a lease or a ReadIndex quorum round-trip. And don't push high-throughput app data through Raft; it's built for small, critical, low-volume coordination state.
:::

*Go deeper — how does ReadIndex give a linearizable read without writing to the log on every read?*

**Keywords** — `quorum floor(N/2)+1 · majority overlap · election restriction · linearizable · ReadIndex/lease read`

### New answer (vi)
**Chốt** — Quorum là một đa số, floor(N/2)+1; hai đa số bất kỳ giao nhau ở ≥1 node, nên hai quyết định xung đột không thể cùng commit. Số lẻ là chuẩn vì 4 node chịu được cùng 1 lỗi như 3 mà tốn hơn và thêm rủi ro hòa phiếu. Một write Raft thành công là **đã persist ở đa số, đã sắp thứ tự, và durable qua mọi leader tương lai — linearizable.**

**Cơ chế** — Quorum là tập tối thiểu phải đồng thuận trước khi một quyết định có hiệu lực. Vì hai đa số bất kỳ của cùng cluster giao nhau ở ít nhất một node, hai quyết định xung đột không bao giờ cùng đạt quorum — đó là thứ đảm bảo một lịch sử nhất quán duy nhất. Leader chỉ commit một write sau khi replicate log entry tới đa số và nhận ack; một khi đã commit nó sống sót qua mọi lần bầu, vì election restriction của Raft chỉ cho node giữ toàn bộ entry đã commit thắng. Nên "write thành công" nghĩa là: đã persist ở đa số, đã sắp thứ tự trong log, không bao giờ mất hay đảo thứ tự.

:::muted
**Trade-off** — Số lẻ tối đa hóa khả năng chịu lỗi trên mỗi node: 3 và 4 đều chịu được 1 lỗi (quorum 2 với 3), nên node thứ 4 thêm chi phí, độ trễ write và độ dễ hòa phiếu mà không mua thêm sẵn sàng; 5 chịu được 2. Trục thật là độ bền với độ trễ — quorum lớn hơn sống sót qua nhiều lỗi nhưng mỗi write chờ thêm replica, đẩy tail latency lên. Hầu hết cluster chọn 3 hoặc 5 và scale read bằng follower/learner, không phải thêm voter.
:::

:::muted
**Bẫy thường gặp** — Tin rằng consensus nghĩa là "luôn sẵn sàng": nếu không chạm tới đa số, cluster đúng đắn từ chối write thay vì tách đôi lịch sử. Bẫy khác là đọc từ leader mà không có read barrier — một leader đã bị phế có thể phục vụ một read trông như linearizable nhưng đã cũ, nên read an toàn cần một lease hoặc một quorum round-trip ReadIndex. Và đừng đẩy dữ liệu ứng dụng throughput cao qua Raft; nó được xây cho coordination state nhỏ, quan trọng, lưu lượng thấp.
:::

*Đào sâu tiếp — ReadIndex cho một linearizable read thế nào mà không cần ghi vào log mỗi lần đọc?*

**Từ khoá ăn điểm** — `quorum floor(N/2)+1 · majority overlap · election restriction · linearizable · ReadIndex/lease read`

## 4-card — middle — [Distributed, Coordination]
**Question:** A teammate wants to build leader election and service discovery by hand on top of your primary Postgres database with polling. You suggest ZooKeeper or etcd instead. What coordination primitives do those systems actually give you, and when is reaching for one justified versus overkill?
**Verdict:** KEEP — concept + judgment (primitives and when-to-use vs overkill), good middle-level decision question.

### New answer (en)
**TL;DR** — ZooKeeper/etcd are consensus-backed (ZAB/Raft) KV stores built for coordination, not bulk data. Their primitives — **ephemeral nodes/leases, watches, compare-and-swap, sequential keys** — give you correct membership, leader election, and fencing out of the box. Reach for one when you need strongly-consistent coordination state; it's overkill for plain data or low-stakes flags.

**How it works** — They give a small set of powerful primitives over a strongly-consistent keyspace: ephemeral nodes/leases that vanish when a client's session dies (membership, liveness); watches that push a change notification instead of forcing you to poll; CAS/transactions for atomic updates; and sequential keys, from which you build locks, queues, and election (lowest sequence is leader). etcd adds explicit-TTL leases and backs Kubernetes. You reach for one when you need reliable membership, election, or fencing — coordination state that must be strongly consistent and correct under partitions, which a hand-rolled poll-plus-row-lock scheme on Postgres gets subtly wrong.

:::muted
**Trade-off** — They trade throughput for consistency: every write goes through consensus, so thousands of small writes/sec, not millions, and they're not a general DB — store pointers and small metadata, not blobs. Running them adds a stateful 3/5-node cluster, backups, and upgrade care. The payoff is that election, ephemeral membership, and watch-based propagation come correct instead of being hand-rolled and racy.
:::

:::muted
**Common pitfall** — Using ZK/etcd as a data store and saturating it, starving the coordination it exists to provide. Another is mishandling session expiry: ephemeral liveness depends on heartbeats, so a long GC pause can expire your session and silently drop your lock/leadership — your code must handle "I may have lost leadership" via watches and fencing. And ZooKeeper watches are one-shot and can miss intermediate states — treat them as "something changed, go re-read", not an event log.
:::

*Go deeper — how would you build leader election specifically from sequential ephemeral keys, and how does a follower avoid the herd effect while watching?*

**Keywords** — `ephemeral node · lease · watch · CAS/txn · sequential key · ZAB/Raft · session expiry`

### New answer (vi)
**Chốt** — ZooKeeper/etcd là các KV store được hậu thuẫn bởi consensus (ZAB/Raft), xây cho coordination chứ không phải dữ liệu khối lớn. Các primitive của chúng — **ephemeral node/lease, watch, compare-and-swap, sequential key** — cho bạn membership, leader election và fencing đúng sẵn từ đầu. Hãy dùng khi cần coordination state strongly-consistent; nó quá mức cho dữ liệu thuần hoặc cờ ít rủi ro.

**Cơ chế** — Chúng cho một tập nhỏ primitive mạnh trên một keyspace strongly-consistent: ephemeral node/lease tự biến mất khi session của client chết (membership, liveness); watch đẩy thông báo thay đổi thay vì bắt bạn poll; CAS/transaction cho cập nhật atomic; và sequential key, từ đó dựng lock, queue và election (sequence nhỏ nhất là leader). etcd thêm lease với TTL tường minh và là backing store cho Kubernetes. Hãy dùng khi cần membership, election hay fencing đáng tin cậy — coordination state phải strongly consistent và đúng khi có partition, điều mà một sơ đồ poll-cộng-row-lock tự chế trên Postgres làm sai một cách tinh vi.

:::muted
**Trade-off** — Chúng đánh đổi throughput lấy consistency: mọi write đi qua consensus, nên hàng nghìn write nhỏ/giây chứ không phải hàng triệu, và không phải DB tổng quát — lưu con trỏ và metadata nhỏ, không phải blob. Vận hành chúng thêm một stateful cluster 3/5 node, backup và sự cẩn trọng khi upgrade. Lợi ích là election, ephemeral membership và propagate dựa trên watch đến đúng sẵn thay vì tự chế đầy race.
:::

:::muted
**Bẫy thường gặp** — Dùng ZK/etcd như một data store và làm bão hòa nó, bóp nghẹt chính sự coordination mà nó sinh ra để cung cấp. Một cái nữa là xử lý sai session expiry: liveness ephemeral phụ thuộc heartbeat, nên một GC pause dài có thể expire session và âm thầm làm rớt lock/leadership của bạn — code phải xử lý "tôi có thể đã mất leadership" qua watch và fencing. Và watch của ZooKeeper là one-shot và có thể bỏ lỡ trạng thái trung gian — coi chúng như "có gì đó đã đổi, đi đọc lại", không phải một event log.
:::

*Đào sâu tiếp — bạn dựng leader election cụ thể từ sequential ephemeral key thế nào, và một follower tránh herd effect khi watch ra sao?*

**Từ khoá ăn điểm** — `ephemeral node · lease · watch · CAS/txn · sequential key · ZAB/Raft · session expiry`

## 5-card — middle — [Distributed, Idempotency]
**Question:** A worker holds a lock and runs a multi-step operation — debit an account, then publish an event, then mark the task done. It crashes after the debit but before marking done; the lock expires, another worker picks the task up and debits again. How do you design this so a holder dying mid-operation is safe?
**Verdict:** KEEP — design question forcing idempotency/outbox/state-machine reasoning; strong middle-level depth.

### New answer (en)
**TL;DR** — A lock can't make a multi-step operation atomic across a crash. Make the work **idempotent and recoverable**: a stable idempotency key, each effect recorded in the same transaction as the effect, a persisted state machine, and a transactional outbox — so re-execution after a crash is a no-op, not a double-debit.

**How it works** — Give each task a stable idempotency key derived from its identity. Before debiting, write a row keyed by (task_id, "debit") in the *same transaction* as the balance change, so a retry sees the effect already happened and skips it. Persist the operation as a state machine (PENDING → DEBITED → PUBLISHED → DONE) so a second worker resumes from the last durable state instead of restarting. For the event, use the transactional outbox pattern so it commits atomically with the debit and is delivered at-least-once, with consumers deduplicating on the key. The lock then only reduces contention; correctness comes from idempotency and durable state, not the lock.

:::muted
**Trade-off** — Idempotency keys plus a state machine add storage and a uniqueness check per effect, and exactly-once delivery is generally impossible — you pick at-least-once + idempotent consumers, or at-most-once and accept lost work. The cost is real schema/code complexity, but crashes, retries, lock expiries, and duplicate deliveries all become non-events. The alternative — trusting the lock to never expire mid-operation — isn't a trade-off, it's a latent bug.
:::

:::muted
**Common pitfall** — Doing the side effect and recording that you did it in two separate transactions: crash in between and you double-apply or lose the record, reintroducing the race. The effect and its idempotency marker must commit together. Also, an idempotency key with a short TTL can expire before a slow retry arrives — size the dedup window to your max retry horizon. And never use a non-deterministic key (per-attempt timestamp/random ID); derive it from the task identity so every retry computes the same one.
:::

*Go deeper — where exactly does the outbox event get published from, and how do you keep that relay itself idempotent and crash-safe?*

**Keywords** — `idempotency key · transactional outbox · state machine · at-least-once + dedup · single transaction`

### New answer (vi)
**Chốt** — Một lock không thể làm một thao tác nhiều bước atomic xuyên qua một lần crash. Hãy làm công việc **idempotent và recoverable**: một idempotency key ổn định, mỗi effect được ghi trong cùng transaction với effect đó, một state machine persist, và một transactional outbox — để thực thi lại sau crash là một no-op, không phải debit kép.

**Cơ chế** — Cho mỗi task một idempotency key ổn định suy ra từ identity của nó. Trước khi debit, ghi một row khóa theo (task_id, "debit") trong *cùng transaction* với việc đổi balance, để một retry thấy effect đã xảy ra và bỏ qua. Persist thao tác thành một state machine (PENDING → DEBITED → PUBLISHED → DONE) để worker thứ hai resume từ trạng thái durable cuối thay vì bắt đầu lại. Với event, dùng pattern transactional outbox để nó commit atomic cùng với debit và được giao at-least-once, với consumer dedup theo key. Lúc đó lock chỉ giảm contention; tính đúng đắn đến từ idempotency và durable state, không phải lock.

:::muted
**Trade-off** — Idempotency key cộng một state machine thêm storage và một uniqueness check mỗi effect, và exactly-once delivery nhìn chung bất khả thi — bạn chọn at-least-once + consumer idempotent, hoặc at-most-once và chấp nhận mất việc. Cái giá là độ phức tạp thật về schema/code, nhưng crash, retry, lock expire và delivery trùng đều trở thành chuyện không đáng kể. Lựa chọn thay thế — tin lock không bao giờ hết hạn giữa chừng — không phải trade-off, mà là một bug tiềm ẩn.
:::

:::muted
**Bẫy thường gặp** — Làm side effect và ghi lại rằng đã làm trong hai transaction tách rời: crash ở giữa và bạn áp dụng hai lần hoặc mất bản ghi, tái tạo lại đúng cái race. Effect và marker idempotency của nó phải commit cùng nhau. Ngoài ra, một idempotency key với TTL ngắn có thể hết hạn trước khi một retry chậm đến — chỉnh cửa sổ dedup theo chân trời retry tối đa. Và đừng bao giờ dùng key không tất định (timestamp/random ID theo từng lần thử); suy nó từ task identity để mọi retry tính ra cùng một key.
:::

*Đào sâu tiếp — event outbox được publish ra từ đâu chính xác, và bạn giữ chính cái relay đó idempotent và crash-safe thế nào?*

**Từ khoá ăn điểm** — `idempotency key · transactional outbox · state machine · at-least-once + dedup · single transaction`

## 6-card — middle — [Distributed, Clocks]
**Question:** Your service decides which of two concurrent updates "wins" by comparing the wall-clock timestamps each server attached. Occasionally an older edit overwrites a newer one. Why can't you trust wall clocks to order events across machines, and how do logical/Lamport clocks fix it?
**Verdict:** KEEP — diagnosis (clock skew breaks LWW) plus the Lamport/vector-clock concept; solid middle question.

### New answer (en)
**TL;DR** — Wall clocks on different machines aren't synchronized — NTP is only good to tens of ms, can step backward, and drifts — so a "later" timestamp can be the older write, and last-write-wins silently drops newer data. **Lamport clocks** order events by causality instead of physical time: an integer counter set to max(local, received)+1, so cause < effect always.

**How it works** — NTP keeps wall clocks within tens of ms at best, they can step backward on correction, and drift between syncs — so a write stamped 10:00:00.100 on A may truly be *after* one stamped 10:00:00.150 on B. Lamport clocks sidestep physical time: each node keeps an integer counter, increments on every event, attaches it to outgoing messages, and on receipt sets counter = max(local, received) + 1. This guarantees that if X caused Y, X's Lamport timestamp is strictly less than Y's — capturing happens-before order with no synchronized clock.

:::muted
**Trade-off** — Lamport gives a consistent total order (break ties by node id) but is weaker than it looks: a smaller timestamp does *not* prove happens-before — concurrent events get ordered arbitrarily. To *detect* concurrency (surface a real conflict instead of silently picking a winner) you need **vector clocks**, which distinguish before/after/concurrent at the cost of O(N) metadata per message. Total-order-but-conflict-blind (Lamport) vs conflict-aware-but-heavier (vector).
:::

:::muted
**Common pitfall** — Trusting wall-clock last-write-wins for anything correctness-sensitive: clock skew, leap seconds, and VM clock jumps silently corrupt order and lose writes. A subtler trap is reading causality backward from Lamport order — a smaller timestamp doesn't imply "A caused B". When physical time genuinely matters (cross-datacenter), use bounded-uncertainty clocks like TrueTime (wait out the error interval) or hybrid logical clocks (HLC) that stay near real time while preserving causality.
:::

*Go deeper — how does a hybrid logical clock combine NTP time with a logical counter so it tracks real time but never goes backward?*

**Keywords** — `clock skew · NTP drift · Lamport (max+1) · happens-before · vector clock · HLC · TrueTime`

### New answer (vi)
**Chốt** — Wall clock trên các máy khác nhau không được đồng bộ — NTP giỏi lắm chỉ tới vài chục ms, có thể nhảy lùi, và trôi — nên một timestamp "muộn hơn" có thể là write cũ hơn, và last-write-wins âm thầm làm rớt dữ liệu mới hơn. **Lamport clock** sắp thứ tự event theo nhân quả thay vì thời gian vật lý: một bộ đếm số nguyên đặt thành max(local, received)+1, nên nguyên nhân < kết quả luôn đúng.

**Cơ chế** — NTP giữ wall clock trong vài chục ms là cùng, chúng có thể nhảy lùi khi hiệu chỉnh, và trôi giữa các lần sync — nên một write đóng dấu 10:00:00.100 trên A có thể thực sự *sau* một write đóng dấu 10:00:00.150 trên B. Lamport clock né thời gian vật lý: mỗi node giữ một bộ đếm số nguyên, tăng trên mỗi event, gắn vào message gửi đi, và khi nhận đặt counter = max(local, received) + 1. Điều này đảm bảo nếu X gây ra Y thì Lamport timestamp của X nhỏ hơn hẳn của Y — nắm bắt thứ tự happens-before mà không cần đồng hồ đồng bộ.

:::muted
**Trade-off** — Lamport cho một total order nhất quán (phá hòa bằng node id) nhưng yếu hơn vẻ ngoài: một timestamp nhỏ hơn *không* chứng minh happens-before — các event đồng thời bị sắp thứ tự tùy ý. Để *phát hiện* tính đồng thời (phơi bày conflict thật thay vì âm thầm chọn người thắng) bạn cần **vector clock**, phân biệt được trước/sau/đồng thời đổi lại O(N) metadata mỗi message. Total-order-nhưng-mù-conflict (Lamport) so với nhận-biết-conflict-nhưng-nặng-hơn (vector).
:::

:::muted
**Bẫy thường gặp** — Tin vào wall-clock last-write-wins cho bất cứ thứ gì nhạy cảm với tính đúng đắn: clock skew, leap second và VM clock jump âm thầm làm hỏng thứ tự và mất write. Một bẫy tinh vi hơn là suy nhân quả ngược từ Lamport order — một timestamp nhỏ hơn không hàm ý "A gây ra B". Khi thời gian vật lý thực sự quan trọng (xuyên datacenter), dùng đồng hồ có biên bất định như TrueTime (chờ hết khoảng sai số) hoặc hybrid logical clock (HLC) bám sát thời gian thực mà vẫn giữ nhân quả.
:::

*Đào sâu tiếp — một hybrid logical clock kết hợp thời gian NTP với một bộ đếm logic thế nào để bám thời gian thực mà không bao giờ lùi?*

**Từ khoá ăn điểm** — `clock skew · NTP drift · Lamport (max+1) · happens-before · vector clock · HLC · TrueTime`

## 7-card — staff — [Distributed, System Design]
**Question:** Design a distributed lock / scheduler service that hundreds of internal teams will depend on to guarantee "exactly one runner executes this job." Walk through the architecture: where the lock state lives, how you make it highly available without sacrificing safety, how fencing works, and what happens during failover.
**Verdict:** KEEP — open-ended staff system-design question with HA-vs-safety, sharding, fencing, failover; carries real design reasoning.

### New answer (en)
**TL;DR** — Put lock state in a 5-node consensus store (etcd/ZooKeeper) so "who holds this lock" is linearizable and survives 2 failures; each lock is a heartbeat-renewed lease; every grant issues a **monotonic fencing token** the protected resource enforces; stateless API frontends scale request handling; shard the keyspace to scale throughput; failover blocks the minority rather than risk two runners.

**How it works** — Lock state lives in a 5-node etcd/ZooKeeper cluster — the source of truth is itself linearizable and tolerates 2 node failures. Each lock is a key with a lease/TTL the holder renews via heartbeat; if it dies or partitions, the lease lapses and the lock frees automatically. On every grant the service issues a monotonically increasing fencing token (etcd's mod-revision works directly), and the resource records the highest token seen and rejects smaller ones — turning "I think I hold the lock" into a verifiable claim. Stateless API frontends sit in front to handle connections, rate-limit, and translate requests into consensus ops, scaling horizontally over a single consistent core. For scheduling, a leader (elected the same way) owns assignment and writes job→runner ownership through the same store.

:::muted
**Trade-off** — A deliberate CP design: during a partition the minority can't renew leases or grant locks, so clients block rather than risk two runners — availability traded for safety, correct when double-execution is harmful. The consensus core caps write throughput (thousands/sec), so shard the keyspace across independent clusters by lock-key hash, accepting that cross-shard locks are hard and should be designed out. Aggressive lease TTLs free dead holders fast but cause spurious failovers; long TTLs are stable but stall jobs longer after a real crash — expose TTL as a per-lock knob.
:::

:::muted
**Common pitfall** — Treating the lock as sufficient without fencing: a paused holder whose lease expired resumes and acts, so if downstream can't enforce tokens you have an efficiency lock masquerading as a safety lock — make fencing mandatory in the client SDK and reject integrations that ignore the token. Failover has an unavoidable window (lease TTL + election time) where no one holds the lock; clients must handle "lock lost" callbacks and abort in-flight work. Watch for thundering herds when a popular lock frees — use jittered backoff and queue-style sequential keys — and never let the coordination cluster double as a data store.
:::

*Go deeper — how do you migrate a hot lock from one shard to another without ever allowing two holders during the move?*

**Keywords** — `consensus store (etcd/ZK) · lease + heartbeat · fencing token (mod-revision) · CP · keyspace sharding · failover window · thundering herd`

### New answer (vi)
**Chốt** — Đặt lock state vào một store consensus 5 node (etcd/ZooKeeper) để "ai giữ lock này" là linearizable và sống sót qua 2 lỗi; mỗi lock là một lease renew bằng heartbeat; mỗi lần grant phát một **fencing token tăng đơn điệu** mà tài nguyên được bảo vệ ép; các API frontend stateless scale việc xử lý request; shard keyspace để scale throughput; khi failover, phía thiểu số block thay vì mạo hiểm có hai runner.

**Cơ chế** — Lock state nằm trong một cluster etcd/ZooKeeper 5 node — nguồn sự thật tự nó là linearizable và chịu được 2 node hỏng. Mỗi lock là một key với một lease/TTL mà holder renew qua heartbeat; nếu nó chết hoặc bị partition, lease hết hạn và lock tự giải phóng. Trên mỗi lần grant, service phát một fencing token tăng đơn điệu (mod-revision của etcd dùng được trực tiếp), và tài nguyên ghi lại token cao nhất từng thấy và từ chối token nhỏ hơn — biến "tôi nghĩ mình giữ lock" thành một tuyên bố kiểm chứng được. Các API frontend stateless đứng trước để xử lý kết nối, rate-limit và dịch request thành thao tác consensus, scale theo chiều ngang trên một lõi nhất quán duy nhất. Riêng với scheduling, một leader (bầu theo cùng cách) sở hữu việc assignment và ghi quyền sở hữu job→runner qua chính store đó.

:::muted
**Trade-off** — Một thiết kế CP có chủ đích: trong lúc partition, phía thiểu số không thể renew lease hay grant lock, nên client block thay vì mạo hiểm có hai runner — đổi tính sẵn sàng lấy tính an toàn, đúng khi double-execution có hại. Lõi consensus giới hạn write throughput (hàng nghìn/giây), nên shard keyspace ra nhiều cluster độc lập theo hash của lock-key, chấp nhận rằng lock xuyên shard khó và nên thiết kế để loại bỏ. TTL lease gắt giải phóng holder chết nhanh nhưng gây failover giả; TTL dài thì ổn định nhưng để job đình trệ lâu hơn sau một crash thật — expose TTL như một núm per-lock.
:::

:::muted
**Bẫy thường gặp** — Coi lock là đủ mà không có fencing: một holder bị pause có lease đã hết hạn sẽ resume và hành động, nên nếu downstream không ép được token, bạn có một efficiency lock cải trang thành safety lock — bắt buộc fencing trong client SDK và từ chối các integration phớt lờ token. Failover có một cửa sổ không tránh được (lease TTL + thời gian election) nơi không ai giữ lock; client phải xử lý callback "lock lost" và hủy việc đang dở. Coi chừng thundering herd khi một lock phổ biến được giải phóng — dùng jittered backoff và sequential key kiểu queue — và đừng bao giờ để coordination cluster kiêm luôn data store.
:::

*Đào sâu tiếp — bạn migrate một hot lock từ shard này sang shard khác thế nào mà không bao giờ cho phép hai holder trong lúc chuyển?*

**Từ khoá ăn điểm** — `consensus store (etcd/ZK) · lease + heartbeat · fencing token (mod-revision) · CP · keyspace sharding · failover window · thundering herd`
