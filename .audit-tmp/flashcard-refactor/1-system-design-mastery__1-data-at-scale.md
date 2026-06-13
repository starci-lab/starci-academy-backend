# 1-system-design-mastery / 1-data-at-scale
Summary: kept 9, delete 0 of 9

## 0-card — staff — [Sharding]
**Question:** You shard a user table by user_id. Six months later, 80% of reads hit 3 of 16 shards. What went wrong and how do you fix a hot-partition problem in production without downtime?
**Verdict:** KEEP — diagnosis + zero-downtime migration design; scales clearly with seniority and invites follow-ups.

### New answer (en)
The shard key produced a skewed distribution — either organic clustering on sequential/range keys or a few celebrity keys read by millions. You rebalance live without downtime by splitting hot shards (or moving virtual nodes under consistent hashing) and absorbing read traffic with per-shard read replicas, always cutting over writes before reads.

The hot spot comes from the key, not the shard count: range-style or monotonically growing keys cluster recent/active users together, and a single viral account can saturate one shard regardless of how many you have. Three in-place fixes: (1) **Shard splitting** — divide each hot shard into sub-shards behind a router layer updated atomically per key-range. (2) **Virtual shards (consistent hashing)** — hash keys onto many virtual nodes mapped to physical shards; resharding just reassigns virtual nodes, so only ~1/N of keys move. (3) **Per-shard read replicas** — the fastest mitigation for a read-heavy hot shard; defers the expensive reshard while absorbing traffic immediately.

:::muted
**Trade-off** — Consistent hashing minimizes data movement on reshard but complicates ordered range scans. Range sharding gives ordered access but creates monotonic insert hot spots. There is no universal winner — range when queries need sequential access, consistent hashing when even write distribution matters more.
:::

:::muted
**Common pitfall** — Splitting a hot shard while it is still under load causes write amplification (writes hit both old and new during migration). Always route new writes to the new shard first, backfill old data, then cut over reads — never the reverse.
:::

*Go deeper: how do you make the router's cutover atomic so no read or write is lost during the key-range handoff?*

**Keywords:** `hot partition · celebrity key · shard splitting · consistent hashing · virtual nodes · read replica · write amplification`

### New answer (vi)
Shard key tạo phân bố lệch — hoặc do clustering hữu cơ trên key tuần tự/range, hoặc do vài celebrity key bị hàng triệu người đọc. Bạn rebalance live không downtime bằng cách split hot shard (hoặc di chuyển virtual node với consistent hashing) và hấp thụ read traffic bằng read replica per-shard, luôn cut over write trước read.

Hot spot đến từ key, không phải số lượng shard: key dạng range hoặc tăng đơn điệu gom user gần đây/active vào cùng chỗ, và một tài khoản viral có thể bão hòa một shard bất kể bạn có bao nhiêu shard. Ba cách fix in-place: (1) **Shard splitting** — chia mỗi hot shard thành sub-shard sau một router layer cập nhật atomic per key-range. (2) **Virtual shard (consistent hashing)** — hash key lên nhiều virtual node ánh xạ tới shard vật lý; reshard chỉ gán lại virtual node, nên chỉ ~1/N key phải di chuyển. (3) **Read replica per-shard** — cách giảm tải nhanh nhất cho hot shard nặng read; hoãn việc reshard tốn kém trong khi hấp thụ traffic ngay.

:::muted
**Trade-off** — Consistent hashing giảm thiểu data movement khi reshard nhưng làm phức tạp ordered range scan. Range sharding cho truy cập theo thứ tự nhưng tạo monotonic insert hot spot. Không có lựa chọn vạn năng — range khi query cần sequential access, consistent hashing khi phân bổ write đều quan trọng hơn.
:::

:::muted
**Bẫy thường gặp** — Split hot shard khi nó vẫn đang tải nặng gây write amplification (write ghi vào cả shard cũ lẫn mới khi migration). Luôn route write mới đến shard mới trước, backfill data cũ, rồi mới cut over read — không bao giờ làm ngược.
:::

*Đào sâu tiếp: làm sao để cutover của router atomic, không mất read/write nào trong lúc handoff key-range?*

**Từ khoá ăn điểm:** `hot partition · celebrity key · shard splitting · consistent hashing · virtual node · read replica · write amplification`

## 1-card — senior — [Consistency]
**Question:** CAP theorem says you can only have two of Consistency, Availability, and Partition tolerance. Why is "CA without P" essentially meaningless in a distributed system?
**Verdict:** KEEP — conceptual "why" with a common misconception to dispel; classic senior design question.

### New answer (en)
Because in any multi-node system network partitions are a fact of life, not a design option you can opt out of — so "P" is mandatory. The real choice is never CA; it is CP (refuse to answer during a partition) vs AP (answer with possibly stale data and reconcile later).

A partition happens whenever nodes can't talk — hardware failure, packet loss, a cut cable. "CA" would require guaranteeing that never happens, which is only true of a single node. Once you have more than one node you must tolerate partitions, and during one you must pick: CP sacrifices availability (etcd, Zookeeper, synchronous RDBMS block or error rather than serve stale data); AP sacrifices consistency (Cassandra, DynamoDB by default keep serving and reconcile divergent replicas later). PACELC sharpens this: even with no partition (the "Else" case), every write still trades latency vs consistency.

:::muted
**Trade-off** — CP gives correctness but goes unavailable exactly when the network is flaky; AP gives availability but pushes conflict resolution into your application. The right pick is a business decision: what costs more, a stale read or a refused request?
:::

:::muted
**Common pitfall** — Conflating CAP "consistency" (linearizability) with ACID "consistency" (integrity constraints). A Cassandra cluster can serve stale reads (breaking CAP-consistency) while still enforcing application-level invariants. Mixing the two definitions in a design doc leads to wrong architectural calls.
:::

*Go deeper: name a system marketed as "CA" and explain what it actually does the moment a partition hits.*

**Keywords:** `partition tolerance mandatory · CP vs AP · linearizability ≠ ACID · PACELC · eventual reconciliation`

### New answer (vi)
Vì trong bất kỳ hệ multi-node nào, network partition là điều tất yếu chứ không phải lựa chọn thiết kế bạn có thể bỏ — nên "P" là bắt buộc. Lựa chọn thật sự không bao giờ là CA; mà là CP (từ chối trả lời khi partition) vs AP (trả lời với dữ liệu có thể stale rồi reconcile sau).

Partition xảy ra bất cứ khi nào các node không liên lạc được — lỗi phần cứng, mất gói, đứt cáp. "CA" đòi đảm bảo điều đó không bao giờ xảy ra, chỉ đúng với single-node. Khi có hơn một node, bạn buộc phải tolerate partition, và trong lúc đó phải chọn: CP hy sinh availability (etcd, Zookeeper, RDBMS synchronous block hoặc trả error thay vì phục vụ dữ liệu stale); AP hy sinh consistency (Cassandra, DynamoDB mặc định tiếp tục phục vụ và reconcile các replica phân kỳ sau). PACELC làm rõ thêm: ngay cả khi không partition (nhánh "Else"), mỗi write vẫn đánh đổi latency vs consistency.

:::muted
**Trade-off** — CP cho correctness nhưng mất availability đúng lúc mạng chập chờn; AP cho availability nhưng đẩy conflict resolution vào ứng dụng. Lựa chọn đúng là quyết định kinh doanh: cái nào đắt hơn, một stale read hay một request bị từ chối?
:::

:::muted
**Bẫy thường gặp** — Nhầm CAP "consistency" (linearizability) với ACID "consistency" (ràng buộc toàn vẹn). Cluster Cassandra có thể trả stale read (vi phạm CAP-consistency) trong khi vẫn enforce invariant ở application level. Trộn hai định nghĩa trong design doc dẫn tới quyết định kiến trúc sai.
:::

*Đào sâu tiếp: kể tên một hệ được quảng cáo là "CA" và giải thích nó thực sự làm gì ngay khi partition xảy ra.*

**Từ khoá ăn điểm:** `partition tolerance bắt buộc · CP vs AP · linearizability ≠ ACID · PACELC · eventual reconciliation`

## 2-card — staff — [Replication, Consistency]
**Question:** Your OLTP database uses synchronous replication to a standby replica. The standby falls 30 seconds behind during a write spike. What are the exact consistency risks, and how do you mitigate them without dropping to async replication?
**Verdict:** KEEP — sharp diagnosis (true sync can't lag) plus concrete staff-level mitigations and an operational trap.

### New answer (en)
The premise has a tell: if replication were truly synchronous the primary would wait for the standby's ack before committing, so it couldn't fall 30s behind. What you actually have is semi-synchronous or sync-with-timeout-fallback — meaning it quietly degraded to async, and your real risk is RPO > 0 (lost committed transactions) on an unexpected failover.

In PostgreSQL `synchronous_commit = on`, the primary waits for the standby's WAL flush; under a write spike the standby's apply queue grows and commit latency climbs, which is what tempts the system into falling back. Mitigations that keep sync semantics: (1) quorum commit — set `synchronous_standby_names` to require only 1-of-N standbys to ack, so one slow node doesn't stall commits; (2) split roles — physical replication for the failover standby, a separate logical replica for analytics so reporting load doesn't slow the critical path; (3) pre-warm the standby's buffer cache in low-traffic windows so it applies WAL faster.

:::muted
**Trade-off** — Synchronous replication caps write throughput at the slowest replica's speed, and a cross-region sync replica adds 50–100 ms RTT to every commit. Async avoids that but accepts RPO > 0 on failover. The choice is your RPO tolerance, not a default.
:::

:::muted
**Common pitfall** — Silent fallback to async when the standby lags is the default in many engines. Without an alert on that transition, operators believe they have sync replication but are running async — only discovered at failover, when data is already lost.
:::

*Go deeper: how do you detect, in monitoring, that sync replication has silently degraded to async right now?*

**Keywords:** `semi-synchronous · synchronous_commit · WAL flush · quorum commit · synchronous_standby_names · RPO > 0`

### New answer (vi)
Đề bài có một điểm gợn: nếu replication thực sự synchronous thì primary chờ standby ack trước khi commit, nên không thể tụt 30s. Cái bạn thực sự đang chạy là semi-synchronous hoặc sync-có-timeout-fallback — tức nó đã lặng lẽ degrade về async, và rủi ro thật là RPO > 0 (mất committed transaction) khi failover bất ngờ.

Trong PostgreSQL `synchronous_commit = on`, primary chờ standby flush WAL; khi write spike, apply queue của standby phình ra và commit latency tăng, chính điều này dụ hệ thống fallback. Cách giảm thiểu mà vẫn giữ sync: (1) quorum commit — đặt `synchronous_standby_names` chỉ cần 1-of-N standby ack, để một node chậm không làm nghẽn commit; (2) tách vai trò — physical replication cho failover standby, một logical replica riêng cho analytics để tải báo cáo không làm chậm critical path; (3) pre-warm buffer cache của standby trong cửa sổ traffic thấp để nó apply WAL nhanh hơn.

:::muted
**Trade-off** — Synchronous replication giới hạn write throughput ở tốc độ replica chậm nhất, và một sync replica cross-region thêm 50–100 ms RTT vào mỗi commit. Async tránh điều đó nhưng chấp nhận RPO > 0 khi failover. Lựa chọn là RPO tolerance của bạn, không phải mặc định.
:::

:::muted
**Bẫy thường gặp** — Silent fallback sang async khi standby chậm là mặc định trong nhiều engine. Không có alert về transition đó, operator tin mình đang chạy sync nhưng thực ra là async — chỉ phát hiện lúc failover, khi data đã mất.
:::

*Đào sâu tiếp: trong monitoring, làm sao phát hiện rằng sync replication vừa lặng lẽ degrade về async ngay lúc này?*

**Từ khoá ăn điểm:** `semi-synchronous · synchronous_commit · WAL flush · quorum commit · synchronous_standby_names · RPO > 0`

## 3-card — senior — [Consistency]
**Question:** Compare eventual consistency vs strong consistency (linearisability). Give a concrete scenario where accidentally using eventual consistency causes a real user-facing bug.
**Verdict:** KEEP — comparison plus a concrete, high-stakes failure scenario; strong "explain with an example" question.

### New answer (en)
Linearizability guarantees every read sees the most recent write, as if there were one machine; eventual consistency only guarantees replicas converge once writes stop, so reads can be stale. The dangerous accidental case is a read-your-writes violation on a money path — e.g. a wallet debit lands on the primary, a concurrent read off a lagging replica sees the old non-zero balance, and a second debit slips through: a double-spend.

A milder version: a user updates their email; the write is acknowledged on the primary, but the confirmation page reads a not-yet-replicated replica and shows the old email, so they "fix" it again and create a duplicate. The root cause both times is routing a follow-up read to a replica that hasn't caught up. You fix it by pinning reads to the primary (or a session-consistent replica) on read-your-writes paths, and reserving eventual consistency for data where staleness is harmless.

:::muted
**Trade-off** — Strong consistency needs quorum reads (a majority must agree), adding latency and cutting availability — DynamoDB strongly-consistent reads cost 2× the RCUs. Eventual consistency is cheap and highly available but forces idempotent, conflict-aware logic (CRDTs, last-write-wins, compensations).
:::

:::muted
**Common pitfall** — Mixing consistency levels inside one logical flow: a strongly-consistent write paired with an eventually-consistent confirmation read produces a read-your-writes violation — the user thinks their change didn't apply and retries, amplifying the problem.
:::

*Go deeper: which read-your-writes technique would you use — sticky routing to primary, session tokens, or monotonic-read versioning — and why?*

**Keywords:** `linearizability · read-your-writes · monotonic reads · double-spend · quorum read · stale replica`

### New answer (vi)
Linearizability đảm bảo mọi read thấy write gần nhất, như thể chỉ có một máy; eventual consistency chỉ đảm bảo replica hội tụ khi ngừng write, nên read có thể stale. Trường hợp vô tình nguy hiểm là vi phạm read-your-writes trên money path — ví dụ một debit ví ghi vào primary, một read đồng thời từ replica đang lag thấy số dư cũ (chưa bằng 0), và một debit thứ hai lọt qua: double-spend.

Phiên bản nhẹ hơn: user cập nhật email; write được ack trên primary, nhưng trang xác nhận đọc một replica chưa replicate và hiển thị email cũ, nên họ "sửa" lại lần nữa và tạo duplicate. Gốc rễ cả hai lần là route một follow-up read tới replica chưa kịp bắt theo. Bạn fix bằng cách ghim read về primary (hoặc replica session-consistent) trên các path read-your-writes, và chỉ dùng eventual consistency cho dữ liệu mà staleness vô hại.

:::muted
**Trade-off** — Strong consistency cần quorum read (đa số phải đồng ý), thêm latency và giảm availability — strongly-consistent read của DynamoDB tốn 2× RCU. Eventual consistency rẻ và highly available nhưng ép logic idempotent, conflict-aware (CRDT, last-write-wins, compensation).
:::

:::muted
**Bẫy thường gặp** — Trộn consistency level trong một luồng logic: một strongly-consistent write ghép với một eventually-consistent confirmation read tạo vi phạm read-your-writes — user tưởng thay đổi không áp dụng nên retry, khuếch đại vấn đề.
:::

*Đào sâu tiếp: bạn sẽ dùng kỹ thuật read-your-writes nào — sticky routing về primary, session token, hay monotonic-read versioning — và tại sao?*

**Từ khoá ăn điểm:** `linearizability · read-your-writes · monotonic reads · double-spend · quorum read · stale replica`

## 4-card — senior — [Replication]
**Question:** What is the "leader/follower" replication topology and what specific failure scenario requires you to promote a follower to leader — what are the risks of that promotion?
**Verdict:** KEEP — definition plus failover mechanics and the split-brain risk; layered enough to scale with seniority.

### New answer (en)
In leader/follower replication the leader takes all writes and streams a change log (WAL/binlog) to followers, which serve reads and stand by for failover. You promote a follower when the leader crashes, becomes unreachable via a partition, or fails a health check — and the central risk is split-brain: two nodes accepting writes for the same keys.

A safe automated promotion (Patroni, Pacemaker, RDS Multi-AZ) runs in order: (1) **fence the old leader first** (STONITH, or revoke its IAM/network access) so it can't keep taking writes; (2) elect the most up-to-date follower (lowest replication lag) to minimize data loss; (3) repoint application connections to the new leader. The fencing step is what prevents split-brain, which is why it must come before, not after, electing a new leader.

:::muted
**Trade-off** — With async replication the promoted follower may be missing the old leader's last writes (RPO > 0), and the cluster is unavailable until promotion finishes (RTO typically 30–120 s). Active-active multi-master cuts RTO but adds write-conflict resolution complexity.
:::

:::muted
**Common pitfall** — Split-brain: the old leader recovers from a transient blip and keeps accepting writes while the new leader is also live. Both take writes for overlapping keys and data diverges with no automatic reconciliation. Fencing must be step one, before any promotion.
:::

*Go deeper: if the old leader was network-isolated but still up and serving stale writes, how do you fence a node you can't reach?*

**Keywords:** `WAL / binlog · failover · STONITH / fencing · split-brain · replication lag · RPO / RTO`

### New answer (vi)
Trong leader/follower replication, leader nhận tất cả write và stream change log (WAL/binlog) tới follower, vốn phục vụ read và đứng standby cho failover. Bạn promote một follower khi leader crash, mất kết nối do partition, hoặc fail health check — và rủi ro trung tâm là split-brain: hai node cùng nhận write cho cùng key.

Một promotion tự động an toàn (Patroni, Pacemaker, RDS Multi-AZ) chạy theo thứ tự: (1) **fence old leader trước** (STONITH, hoặc thu hồi IAM/network access của nó) để nó không thể tiếp tục nhận write; (2) bầu follower up-to-date nhất (replication lag thấp nhất) để giảm thiểu mất data; (3) trỏ lại connection của ứng dụng về leader mới. Chính bước fencing ngăn split-brain, nên nó phải đến trước, không phải sau, khi bầu leader mới.

:::muted
**Trade-off** — Với async replication, follower được promote có thể thiếu các write cuối của old leader (RPO > 0), và cluster không khả dụng cho tới khi promotion xong (RTO thường 30–120 s). Active-active multi-master giảm RTO nhưng thêm độ phức tạp write-conflict resolution.
:::

:::muted
**Bẫy thường gặp** — Split-brain: old leader phục hồi từ một blip tạm thời và tiếp tục nhận write trong khi new leader cũng đang live. Cả hai nhận write cho key chồng lấn và data phân kỳ không có reconciliation tự động. Fencing phải là bước một, trước mọi promotion.
:::

*Đào sâu tiếp: nếu old leader bị cô lập mạng nhưng vẫn sống và đang phục vụ stale write, làm sao fence một node bạn không liên lạc được?*

**Từ khoá ăn điểm:** `WAL / binlog · failover · STONITH / fencing · split-brain · replication lag · RPO / RTO`

## 5-card — senior — [Sharding]
**Question:** You need to shard a table that does not have a natural high-cardinality key. What strategies exist, and what does each sacrifice?
**Verdict:** KEEP — enumerates strategies with explicit sacrifices; design-decision question that scales with depth.

### New answer (en)
You synthesize cardinality you don't have: hash a surrogate key (UUID/Snowflake), build a composite key from low-cardinality dimensions, use a directory lookup, or shard by geography. Each buys even distribution by giving up something — usually ordered access, an extra hop, or future flexibility.

The four options: (1) **Hash on a surrogate key** — generate a UUID/Snowflake ID and hash it; distributes evenly but kills range scans. (2) **Composite key** — combine dimensions like region + timestamp bucket to manufacture higher cardinality; tightly coupled to one query pattern. (3) **Directory-based** — a lookup table maps entity → shard, allowing arbitrary placement at the cost of one extra hop. (4) **Geo-based** — if data has a geographic dimension, shard by region to co-locate data with users and cut cross-region latency.

:::muted
**Trade-off** — Hash sharding destroys ordering, so range queries become scatter-gather across all shards. Directory sharding is flexible but the lookup table is itself a single point of failure and write bottleneck — it must be distributed or heavily cached. Composite keys are query-pattern-specific; changing access patterns later is expensive.
:::

:::muted
**Common pitfall** — Designing the shard key around today's query pattern, then changing the primary access pattern post-launch (e.g. you sharded by user_id but now must query by organisation_id). Queries on the new dimension turn into scatter-gather across every shard — a latency regression.
:::

*Go deeper: with directory-based sharding, how do you keep the lookup table from becoming the bottleneck you were trying to avoid?*

**Keywords:** `surrogate key · Snowflake ID · composite key · directory sharding · geo-sharding · scatter-gather`

### New answer (vi)
Bạn tổng hợp cardinality mình không có sẵn: hash một surrogate key (UUID/Snowflake), dựng composite key từ các chiều low-cardinality, dùng directory lookup, hoặc shard theo địa lý. Mỗi cách mua được phân bố đều bằng cách đánh đổi một thứ — thường là ordered access, một hop phụ, hoặc tính linh hoạt tương lai.

Bốn lựa chọn: (1) **Hash trên surrogate key** — generate UUID/Snowflake ID rồi hash; phân bố đều nhưng giết range scan. (2) **Composite key** — kết hợp các chiều như region + timestamp bucket để chế ra cardinality cao hơn; bám chặt vào một query pattern. (3) **Directory-based** — một lookup table ánh xạ entity → shard, cho phép đặt tùy ý với giá một hop phụ. (4) **Geo-based** — nếu data có chiều địa lý, shard theo region để co-locate data với user và giảm cross-region latency.

:::muted
**Trade-off** — Hash sharding phá hủy ordering, nên range query thành scatter-gather qua mọi shard. Directory sharding linh hoạt nhưng lookup table tự nó là single point of failure và write bottleneck — phải được phân tán hoặc cache nặng. Composite key đặc thù theo query pattern; đổi access pattern sau này rất tốn kém.
:::

:::muted
**Bẫy thường gặp** — Thiết kế shard key quanh query pattern hôm nay, rồi đổi primary access pattern sau launch (ví dụ shard theo user_id nhưng giờ phải query theo organisation_id). Query trên chiều mới biến thành scatter-gather qua mọi shard — một latency regression.
:::

*Đào sâu tiếp: với directory-based sharding, làm sao để lookup table không trở thành chính cái bottleneck bạn đang muốn tránh?*

**Từ khoá ăn điểm:** `surrogate key · Snowflake ID · composite key · directory sharding · geo-sharding · scatter-gather`

## 6-card — staff — [Consistency]
**Question:** PACELC extends CAP. What additional tradeoff does it expose, and when does it matter more than the partition scenario?
**Verdict:** KEEP — exposes the latency-vs-consistency axis with concrete coordinates; staff-level depth.

### New answer (en)
PACELC adds the "Else" branch: if there's a Partition, trade Availability vs Consistency (the CAP choice); Else — in normal operation — trade Latency vs Consistency. The Else branch matters more in practice because partitions are rare, but the latency-vs-consistency tradeoff is live on every single write.

A strongly consistent write must wait for quorum acknowledgement — roughly 1–5 ms on a local cluster, 50–150 ms cross-region — while eventual consistency returns to the client immediately but may serve stale reads for hundreds of milliseconds. For feeds, counters, and recommendations the latency win usually outweighs the staleness. Real systems sit at different PACELC coordinates: DynamoDB lets you tune consistency per read; Spanner chooses global strong consistency but leans on TrueTime GPS/atomic clocks to bound clock skew (~7 ms), which is what makes cross-region strong consistency practical at all.

:::muted
**Trade-off** — Spanner's globally-strong stance buys correctness but carries real operational cost and is rarely justified unless you genuinely need global transactions. Tunable stores (DynamoDB/Cassandra) push the decision per-operation, which is cheaper but offloads correctness reasoning onto the application.
:::

:::muted
**Common pitfall** — Using eventual consistency on a path that actually needs monotonic reads (once you've read a value you should never read an older one). The classic case is shopping carts: an add-to-cart write lands, but a refresh reads an older replica and the cart looks empty — the user re-adds and checks out with duplicates.
:::

*Go deeper: how does Spanner's TrueTime turn bounded clock uncertainty into a linearizable commit — what is the "commit wait"?*

**Keywords:** `PACELC · Else branch · latency vs consistency · quorum ack · TrueTime · monotonic reads`

### New answer (vi)
PACELC thêm nhánh "Else": nếu có Partition, đánh đổi Availability vs Consistency (lựa chọn CAP); Else — lúc hoạt động bình thường — đánh đổi Latency vs Consistency. Nhánh Else quan trọng hơn trong thực tế vì partition hiếm, nhưng đánh đổi latency-vs-consistency thì live trên mỗi write.

Một write strongly consistent phải chờ quorum ack — khoảng 1–5 ms trên cluster local, 50–150 ms cross-region — trong khi eventual consistency trả về client ngay nhưng có thể phục vụ stale read hàng trăm millisecond. Với feed, counter, recommendation thì cái lợi latency thường vượt staleness. Các hệ thật nằm ở tọa độ PACELC khác nhau: DynamoDB cho tune consistency per-read; Spanner chọn global strong consistency nhưng dựa vào TrueTime (đồng hồ GPS/nguyên tử) để bound clock skew (~7 ms), chính điều này mới làm cross-region strong consistency khả thi.

:::muted
**Trade-off** — Lập trường globally-strong của Spanner mua correctness nhưng kèm chi phí vận hành thật và hiếm khi đáng trừ phi bạn thực sự cần global transaction. Các store tunable (DynamoDB/Cassandra) đẩy quyết định xuống per-operation, rẻ hơn nhưng dồn việc lý luận correctness lên ứng dụng.
:::

:::muted
**Bẫy thường gặp** — Dùng eventual consistency trên path thực ra cần monotonic read (một khi đã đọc một giá trị, không bao giờ đọc giá trị cũ hơn). Ví dụ kinh điển là shopping cart: write add-to-cart thành công, nhưng refresh đọc replica cũ và giỏ trông rỗng — user thêm lại và checkout với duplicate.
:::

*Đào sâu tiếp: TrueTime của Spanner biến clock uncertainty có biên thành một commit linearizable thế nào — "commit wait" là gì?*

**Từ khoá ăn điểm:** `PACELC · nhánh Else · latency vs consistency · quorum ack · TrueTime · monotonic reads`

## 7-card — staff — [Consistency, Distributed]
**Question:** In a multi-region database setup, describe the two-phase commit (2PC) protocol, why it is avoided at internet scale, and what replaces it.
**Verdict:** KEEP — protocol explanation, failure mode, and alternatives; canonical distributed-transactions staff question.

### New answer (en)
2PC has a coordinator run two rounds: Phase 1 (prepare) — ask every participant "can you commit?"; Phase 2 — if all say yes, send commit, otherwise global abort. It guarantees atomicity but blocks if the coordinator crashes after prepare: participants hold locks indefinitely waiting for a verdict that never arrives. That coordinator-failure blocking is why it's avoided across services at internet scale; the usual replacement is the Saga pattern (or the Outbox pattern) trading atomicity for eventual consistency.

The alternatives: (1) **Saga** — split the transaction into local steps each with a compensating action to roll back; no distributed locks, eventually consistent. (2) **Outbox** — write the business change plus an outbox row in one local ACID transaction, then relay to other services via CDC or a polling worker, so the message can't be lost. (3) **Choreography** with idempotent event handlers so retries are safe.

:::muted
**Trade-off** — Sagas are hard to get right: partial failure leaves intermediate states that compensations must unwind, and compensations can fail too. Outbox adds polling latency and needs a durable relay. 2PC is still correct and used inside a single datacenter — e.g. Citus uses it for cross-shard Postgres queries.
:::

:::muted
**Common pitfall** — Assuming compensations are always semantically reversible. "Cancel order" after the warehouse has picked and packed is technically possible but a real customer-experience problem. Make compensations idempotent and check whether a business-level undo is even feasible before committing to Sagas.
:::

*Go deeper: how does a Saga preserve isolation — how do you stop another transaction from reading the half-applied intermediate state?*

**Keywords:** `prepare / commit · coordinator blocking · Saga · compensating transaction · Outbox · CDC · idempotency`

### New answer (vi)
2PC để một coordinator chạy hai vòng: Phase 1 (prepare) — hỏi mọi participant "bạn có thể commit không?"; Phase 2 — nếu tất cả nói yes thì gửi commit, ngược lại global abort. Nó đảm bảo atomicity nhưng block nếu coordinator crash sau prepare: participant giữ lock vô thời hạn chờ một verdict không bao giờ đến. Chính việc block khi coordinator lỗi là lý do nó bị tránh giữa các service ở internet scale; thay thế thường là Saga pattern (hoặc Outbox pattern), đổi atomicity lấy eventual consistency.

Các thay thế: (1) **Saga** — chia transaction thành các bước local, mỗi bước có một compensating action để rollback; không distributed lock, eventually consistent. (2) **Outbox** — ghi thay đổi nghiệp vụ cùng một dòng outbox trong một ACID transaction local, rồi relay tới service khác qua CDC hoặc polling worker, để message không bị mất. (3) **Choreography** với idempotent event handler để retry an toàn.

:::muted
**Trade-off** — Saga khó làm đúng: partial failure để lại trạng thái trung gian mà compensation phải hoàn tác, và compensation cũng có thể fail. Outbox thêm polling latency và cần một relay bền. 2PC vẫn đúng và được dùng trong một datacenter — ví dụ Citus dùng nó cho cross-shard query Postgres.
:::

:::muted
**Bẫy thường gặp** — Giả định compensation luôn reversible về ngữ nghĩa. "Hủy đơn" sau khi kho đã nhặt và đóng gói là khả thi kỹ thuật nhưng là vấn đề trải nghiệm khách hàng thật. Làm compensation idempotent và kiểm tra xem một undo ở mức nghiệp vụ có khả thi không trước khi chọn Saga.
:::

*Đào sâu tiếp: Saga giữ isolation thế nào — làm sao ngăn một transaction khác đọc trạng thái trung gian đang áp dụng dở?*

**Từ khoá ăn điểm:** `prepare / commit · coordinator blocking · Saga · compensating transaction · Outbox · CDC · idempotency`

## 8-card — senior — [Sharding]
**Question:** Your team debates hash partitioning vs range partitioning for a time-series events table. Make the case for each and explain when each will cause a production incident.
**Verdict:** KEEP — contextual decision with concrete incident modes; strong applied-design question.

### New answer (en)
For a time-series events table, range partitioning by time is the right default — "last 7 days" queries prune to recent partitions, old partitions drop instantly (O(1) pruning), and data is co-located temporally for fast sequential scans. Hash partitioning spreads writes evenly but scatters every time-range query across all partitions, so it loses on the dominant query pattern. The catch: range-by-time creates a monotonic write hotspot, and both schemes have a distinct incident mode.

Range's hotspot is that all new events land on the latest partition; fix it by adding a secondary dimension to the key (e.g. `partition = time_bucket × N + (event_id % N)`) to fan writes across N sub-partitions while keeping time locality. Hash's weakness is the opposite — fine for writes, terrible for the time-window reads this table exists to serve.

:::muted
**Trade-off** — Range partitioning is sensitive to partition size: too small means too many partitions and planning overhead; too large means slow bulk operations. Detaching or dropping cold partitions while live queries still reference them can cause brief lock contention.
:::

:::muted
**Common pitfall** — End-of-period thundering herd: at midnight or month-end the partition key rolls over. If partitions aren't pre-created, the first insert of the new period triggers DDL under write load — taking a lock that queues all concurrent inserts and produces a latency spike that looks like an outage. Pre-create partitions ahead of the boundary.
:::

*Go deeper: how would you automate pre-creating future partitions safely, and how far ahead is enough?*

**Keywords:** `range partitioning · partition pruning · monotonic write hotspot · scatter-gather · pre-create partitions · DDL under load`

### New answer (vi)
Với bảng events time-series, range partitioning theo thời gian là mặc định đúng — query "7 ngày gần đây" prune về partition gần nhất, partition cũ drop ngay (pruning O(1)), và data co-locate theo thời gian cho sequential scan nhanh. Hash partitioning rải write đều nhưng phân tán mọi time-range query qua tất cả partition, nên thua ở chính query pattern chủ đạo. Điểm gài: range-theo-thời-gian tạo một monotonic write hotspot, và cả hai cách đều có một incident mode riêng.

Hotspot của range là mọi event mới đổ vào partition mới nhất; fix bằng cách thêm một chiều phụ vào key (ví dụ `partition = time_bucket × N + (event_id % N)`) để fan write qua N sub-partition mà vẫn giữ time locality. Điểm yếu của hash thì ngược lại — ổn cho write, tệ cho chính các read theo time-window mà bảng này sinh ra để phục vụ.

:::muted
**Trade-off** — Range partitioning nhạy với partition size: quá nhỏ thì quá nhiều partition và tốn planning; quá lớn thì bulk operation chậm. Detach hoặc drop partition cold trong khi live query còn tham chiếu chúng có thể gây lock contention ngắn.
:::

:::muted
**Bẫy thường gặp** — End-of-period thundering herd: lúc nửa đêm hoặc cuối tháng, partition key rollover. Nếu partition không được pre-create, insert đầu tiên của period mới trigger DDL dưới write load — chiếm một lock xếp hàng mọi insert đồng thời và tạo latency spike trông như outage. Hãy pre-create partition trước mốc thời gian.
:::

*Đào sâu tiếp: bạn sẽ tự động hóa việc pre-create partition tương lai an toàn thế nào, và trước bao xa là đủ?*

**Từ khoá ăn điểm:** `range partitioning · partition pruning · monotonic write hotspot · scatter-gather · pre-create partition · DDL under load`
