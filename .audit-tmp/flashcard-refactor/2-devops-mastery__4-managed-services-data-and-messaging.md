# 2-devops-mastery / 4-managed-services-data-and-messaging
Summary: kept 8, delete 0 of 8

## 0-card — middle — [Cloud, Database]
**Question:** Your team runs PostgreSQL on a single EC2 VM you manage yourself. A teammate proposes moving to a managed database (RDS / Cloud SQL / Azure Database / DO Managed DB). What do you actually gain, what do you give up, and how does multi-AZ automatic failover change your availability story?
**Verdict:** KEEP — Open-ended gain/give-up/availability trade-off with real "why"; scales with seniority.

### New answer (en)
**TL;DR** — You gain the provider taking over the "undifferentiated heavy lifting" (patching, backups, monitoring) plus a tested standby-with-automatic-failover you'd otherwise build yourself; you give up root access and deep tuning, and pay more. Multi-AZ keeps a synchronous standby in another AZ and flips the endpoint to it in ~30–120s with no data loss.

**How it works** — Multi-AZ (RDS Multi-AZ, Cloud SQL HA, Azure zone-redundant, DO standby node) replicates writes synchronously to a standby in a second availability zone; writes are acknowledged on both nodes, so a primary host/disk/AZ failure triggers a DNS/endpoint flip to the standby with zero data loss. You stop getting paged at 3am for a dead VM and get a failover path you'd otherwise hand-roll with Patroni/repmgr.

:::muted
**Trade-off** — You lose root and deep tuning: no custom kernel settings, restricted `shared_preload_libraries`, no arbitrary extensions, and you ride the provider's upgrade cadence. It costs more per hour and the synchronous standby roughly doubles the HA bill. A workload needing an exotic extension or microsecond tuning may legitimately stay self-hosted.
:::

:::muted
**Common pitfall** — Assuming multi-AZ is read-scaling or backup — it is neither; the standby serves no traffic until failover and a `DROP TABLE` replicates instantly, so you still need backups. The other trap: failover changes the writer endpoint, so apps caching the old IP or holding long-lived connections must reconnect or you self-inflict an outage during a "highly available" failover.
:::

*Go deeper: how is multi-AZ different from a read replica you promote, in terms of data loss?*

**Keywords** — synchronous standby · multi-AZ · automatic failover · writer endpoint · undifferentiated heavy lifting

### New answer (vi)
**Chốt** — Bạn được nhà cung cấp gánh phần "undifferentiated heavy lifting" (vá lỗi, backup, monitoring) cộng một đường standby-kèm-automatic-failover đã kiểm chứng mà nếu không bạn phải tự dựng; bạn mất quyền root và tuning sâu, và trả nhiều tiền hơn. Multi-AZ giữ một standby đồng bộ ở AZ khác và chuyển endpoint sang nó trong ~30–120s không mất dữ liệu.

**Cơ chế** — Multi-AZ (RDS Multi-AZ, Cloud SQL HA, Azure zone-redundant, DO standby node) replicate write đồng bộ sang standby ở availability zone thứ hai; write được ack trên cả hai node, nên khi host/disk/AZ của primary chết sẽ kích một lần flip DNS/endpoint sang standby với không mất dữ liệu. Bạn không còn bị gọi dậy lúc 3 giờ sáng vì VM chết và có sẵn đường failover mà nếu không phải tự làm bằng Patroni/repmgr.

:::muted
**Trade-off** — Bạn mất root và tuning sâu: không chỉnh được kernel, bị giới hạn `shared_preload_libraries`, không cài extension tùy ý, và phải theo lịch nâng cấp của nhà cung cấp. Chi phí mỗi giờ cao hơn và standby đồng bộ gần như nhân đôi hóa đơn HA. Workload cần một extension lạ hoặc tuning mức microsecond thì ở lại self-hosted là chính đáng.
:::

:::muted
**Bẫy thường gặp** — Tưởng multi-AZ là read-scaling hay backup — nó không phải cả hai; standby không phục vụ traffic nào cho tới khi failover và `DROP TABLE` replicate sang standby ngay lập tức, nên bạn vẫn cần backup. Bẫy còn lại: failover đổi writer endpoint, nên app cache IP cũ hoặc giữ connection sống lâu phải reconnect, nếu không bạn tự gây outage ngay trong một lần failover "highly available".
:::

*Đào sâu tiếp: multi-AZ khác gì so với promote một read replica, xét về lượng dữ liệu mất?*

**Từ khoá ăn điểm** — synchronous standby · multi-AZ · automatic failover · writer endpoint · undifferentiated heavy lifting

## 1-card — senior — [Database, Scalability]
**Question:** After adding read replicas to offload reporting traffic, users complain that a profile they just edited still shows the old value on refresh. Why does this happen, and how do replicas interact with failover when the primary dies?
**Verdict:** KEEP — Diagnosis of a real consistency bug plus failover reasoning; senior-level depth and a natural follow-up.

### New answer (en)
**TL;DR** — Read replicas stream from the primary **asynchronously**, so they trail it by some replication lag; a user who writes to the primary then reads a lagging replica sees their own stale data — a read-your-writes violation. Route reads that must reflect a just-completed write back to the primary, and reserve replicas for staleness-tolerant traffic.

**How it works** — RDS/Cloud SQL/Azure read replicas (DO read-only nodes) apply the primary's change stream with lag — usually milliseconds, but seconds-to-minutes under write bursts or long replica queries. The fix is to route read-after-write traffic to the primary, keep analytics/dashboards on replicas, and monitor lag so you can shed replicas that fall too far behind. On failover, promoting an async replica can **lose the last few un-replicated transactions** (loss bounded by lag at crash time) — unlike synchronous multi-AZ.

:::muted
**Trade-off** — Replicas scale reads horizontally and isolate heavy reporting, but each adds cost and lag surface area and does **not** scale writes — every write funnels through the single primary. Synchronous replication kills lag but adds write latency and can stall the primary if a replica is slow, so providers default to async; you trade strict consistency for read throughput.
:::

:::muted
**Common pitfall** — "Promote and forget": after promotion the old topology is gone, other replicas may not re-point automatically, and the app must learn the new writer endpoint. Piling reporting queries onto a replica inflates its own lag, ironically worsening the staleness you were trying to avoid.
:::

*Go deeper: how would you implement read-your-writes without sending all reads to the primary?*

**Keywords** — replication lag · read-your-writes · async replication · promote · writer endpoint

### New answer (vi)
**Chốt** — Read replica stream từ primary theo kiểu **bất đồng bộ**, nên chúng trễ hơn một khoảng replication lag; người dùng write vào primary rồi đọc từ replica đang lag sẽ thấy chính dữ liệu cũ của mình — vi phạm read-your-writes. Route những read bắt buộc phản ánh write vừa xong về primary, và dành replica cho traffic chịu được dữ liệu cũ.

**Cơ chế** — Read replica RDS/Cloud SQL/Azure (DO read-only node) áp change stream của primary kèm lag — thường mili-giây, nhưng có thể vài giây tới vài phút khi có write burst hay query chạy lâu trên replica. Cách sửa là route traffic read-after-write về primary, để analytics/dashboard trên replica, và monitor lag để loại replica nào tụt quá xa. Khi failover, promote một async replica có thể **mất vài transaction cuối chưa replicate** (lượng mất giới hạn bởi lag tại thời điểm crash) — khác với synchronous multi-AZ.

:::muted
**Trade-off** — Replica scale read theo chiều ngang và cô lập báo cáo nặng, nhưng mỗi cái thêm chi phí và bề mặt lag, và **không** scale write — mọi write vẫn dồn qua một primary duy nhất. Replication đồng bộ triệt tiêu lag nhưng thêm độ trễ write và có thể làm primary đứng nếu một replica chậm, nên nhà cung cấp mặc định async; bạn đánh đổi consistency chặt lấy read throughput.
:::

:::muted
**Bẫy thường gặp** — "Promote rồi quên": sau khi promote topology cũ biến mất, các replica khác có thể không tự trỏ lại, và app phải biết writer endpoint mới. Chất đống query báo cáo lên một replica làm chính nó lag thêm, trớ trêu khiến sự cũ kỹ bạn muốn tránh càng tệ hơn.
:::

*Đào sâu tiếp: bạn triển khai read-your-writes thế nào mà không phải đẩy mọi read về primary?*

**Từ khoá ăn điểm** — replication lag · read-your-writes · async replication · promote · writer endpoint

## 2-card — middle — [Cloud, Storage]
**Question:** A developer mounts an object store (S3 / GCS / Azure Blob / Spaces) as a "filesystem" and runs an app that lists a directory and renames files in a hot loop. It's slow and occasionally reads stale data. What did they misunderstand, and how should storage classes and durability factor in?
**Verdict:** KEEP — Concept-misunderstanding diagnosis plus storage-class/durability judgment; strong middle-level scenario.

### New answer (en)
**TL;DR** — Object storage is a flat **key→blob HTTP API**, not a POSIX filesystem: there are no real directories, "rename" is a server-side copy-then-delete, and "list directory" is an expensive paginated prefix call — that's the slowness. Pick a storage class by access pattern and don't confuse durability with availability or backup.

**How it works** — Keys' "/" is just a prefix convention; you design by treating objects as immutable, writing under well-chosen prefixes, versioning instead of overwriting, and accessing by key rather than walking trees. Choose tier by access pattern: standard/hot for frequent reads, infrequent-access (S3-IA, GCS Nearline, Azure Cool) for occasional, archive (Glacier, GCS Archive, Azure Archive) for cold-but-retained data. "11 nines of durability" means objects are almost never *lost* across redundant copies — but durability is not availability: a region/service disruption can make objects temporarily *unreachable*.

:::muted
**Trade-off** — Cheaper tiers slash storage cost but add retrieval latency and per-GB retrieval fees, and archive restores take minutes-to-hours — great for compliance backups, terrible for user-facing reads. You trade money for access speed and trade simplicity for FS semantics you don't actually get.
:::

:::muted
**Common pitfall** — FUSE-mount-as-filesystem (s3fs) hides the HTTP cost and lack of atomic rename, producing exactly this slowness and stale reads. Lifecycle rules can silently transition objects to archive and break a feature needing millisecond reads. And durability is not backup: lifecycle deletes and accidental `DELETE`s are permanent unless versioning or object lock is on.
:::

*Go deeper: how would you serve millions of small files efficiently given expensive LIST and no cheap rename?*

**Keywords** — key→blob · prefix · copy-then-delete · storage class · 11 nines durability ≠ availability

### New answer (vi)
**Chốt** — Object storage là một **HTTP API key→blob** phẳng, không phải filesystem POSIX: không có thư mục thật, "rename" là copy-rồi-delete phía server, và "list directory" là một call prefix phân trang đắt đỏ — đó là nguyên nhân chậm. Chọn storage class theo access pattern và đừng nhầm durability với availability hay backup.

**Cơ chế** — Dấu "/" trong key chỉ là quy ước prefix; bạn thiết kế bằng cách coi object là bất biến, ghi dưới các prefix chọn kỹ, dùng versioning thay vì ghi đè, và truy cập theo key thay vì duyệt cây. Chọn tier theo access pattern: standard/hot cho đọc thường xuyên, infrequent-access (S3-IA, GCS Nearline, Azure Cool) cho đọc thi thoảng, archive (Glacier, GCS Archive, Azure Archive) cho dữ liệu lạnh nhưng phải giữ. "11 nines durability" nghĩa là object gần như không bao giờ *mất* nhờ các bản sao dư thừa — nhưng durability không phải availability: một sự cố region/dịch vụ có thể khiến object tạm thời *không truy cập được*.

:::muted
**Trade-off** — Tier rẻ hơn cắt mạnh chi phí lưu trữ nhưng thêm độ trễ truy xuất và phí retrieval theo GB, và archive restore mất vài phút tới vài giờ — tuyệt cho backup tuân thủ, tệ cho read user-facing. Bạn đánh đổi tiền lấy tốc độ truy cập, và đánh đổi sự đơn giản lấy thứ semantics FS mà bạn thực ra không có.
:::

:::muted
**Bẫy thường gặp** — Trò mount FUSE như filesystem (s3fs) giấu đi chi phí HTTP và việc thiếu rename nguyên tử, tạo ra đúng kiểu chậm và đọc dữ liệu cũ này. Lifecycle rule có thể lặng lẽ chuyển object sang archive rồi phá vỡ tính năng cần read mili-giây. Và durability không phải backup: lifecycle delete và `DELETE` lỡ tay vẫn vĩnh viễn trừ khi bật versioning hoặc object lock.
:::

*Đào sâu tiếp: bạn phục vụ hàng triệu file nhỏ hiệu quả ra sao khi LIST đắt và không có rename rẻ?*

**Từ khoá ăn điểm** — key→blob · prefix · copy-then-delete · storage class · 11 nines durability ≠ availability

## 3-card — senior — [Caching, Reliability]
**Question:** You put a managed Redis cache (ElastiCache / Memorystore / Azure Cache for Redis) in front of your database with cache-aside. After a deploy that flushes the cache, the database briefly gets hammered and latency spikes. Explain what happened and how to design the cache so this doesn't take you down.
**Verdict:** KEEP — Diagnoses a cache stampede and asks for resilient design; senior-level with real failure modes.

### New answer (en)
**TL;DR** — A full flush makes every key a miss, so concurrent requests all miss at once and stampede the DB — a **thundering herd / cache stampede**. Avoid flushing everything at once, pre-warm hot keys, jitter TTLs, and use single-flight locking so only one request recomputes a key while others wait or serve a slightly stale value.

**How it works** — In cache-aside the app reads cache, and on a miss reads the DB and populates the cache; after a flush or cold start the whole working set misses simultaneously. The mitigations: staggered/partial invalidation, **pre-warming** hot keys, **TTL jitter** so keys don't expire together, and **single-flight/lock** per key. ElastiCache, Memorystore, and Azure Cache for Redis are the same Redis underneath, so these patterns are portable.

:::muted
**Trade-off** — Cache-aside is simple and resilient (a cache outage degrades to direct DB reads, not data loss) but tolerates brief staleness and needs explicit invalidation. Tighter consistency (write-through, short TTLs) means more churn and DB writes; looser TTLs mean cheaper but staler reads — you choose where to sit on the freshness/cost/latency triangle.
:::

:::muted
**Common pitfall** — Treating the cache as a database: it's volatile, **evicts under memory pressure** (LRU/LFU/`allkeys` silently drop keys), and can vanish on failover — so anything you can't recompute from the source of truth must not live only there. Watch eviction rate and hit ratio; and remember a single very hot key expiring can melt the DB, needing per-key locking or probabilistic early refresh.
:::

*Go deeper: how does probabilistic early expiration (XFetch) prevent a hot-key stampede?*

**Keywords** — cache-aside · thundering herd · TTL jitter · single-flight · eviction rate / hit ratio

### New answer (vi)
**Chốt** — Một lần flush toàn bộ làm mọi key đều miss, nên các request đồng thời cùng miss một lúc và giẫm đạp lên DB — đây là **thundering herd / cache stampede**. Tránh flush tất cả cùng lúc, pre-warm các key nóng, jitter TTL, và dùng single-flight lock để chỉ một request tính lại một key trong khi các request khác chờ hoặc phục vụ giá trị hơi cũ.

**Cơ chế** — Trong cache-aside, app đọc cache, khi miss thì đọc DB rồi nạp vào cache; sau một lần flush hay cold start, cả working set miss cùng lúc. Các biện pháp: invalidation rải/từng phần, **pre-warm** key nóng, **jitter TTL** để các key không hết hạn cùng lúc, và **single-flight/lock** theo từng key. ElastiCache, Memorystore và Azure Cache for Redis bên dưới đều là Redis, nên các pattern này dùng chung được.

:::muted
**Trade-off** — Cache-aside đơn giản và bền (cache chết thì suy giảm về đọc DB trực tiếp, không mất dữ liệu) nhưng chấp nhận dữ liệu cũ chốc lát và cần invalidation tường minh. Consistency chặt hơn (write-through, TTL ngắn) nghĩa là cache churn và write DB nhiều hơn; TTL lỏng hơn nghĩa là read rẻ hơn nhưng cũ hơn — bạn chọn ngồi ở đâu trên tam giác độ-tươi/chi-phí/độ-trễ.
:::

:::muted
**Bẫy thường gặp** — Coi cache như database: nó dễ bay hơi, **evict khi áp lực bộ nhớ** (LRU/LFU/`allkeys` lặng lẽ bỏ key), và có thể biến mất khi failover — nên thứ gì không tính lại được từ nguồn sự thật thì không được chỉ sống ở đó. Theo dõi eviction rate và hit ratio; và nhớ rằng chỉ một key cực nóng hết hạn cũng có thể làm chảy DB, cần lock theo từng key hoặc làm mới sớm theo xác suất.
:::

*Đào sâu tiếp: probabilistic early expiration (XFetch) ngăn stampede của hot-key như thế nào?*

**Từ khoá ăn điểm** — cache-aside · thundering herd · TTL jitter · single-flight · eviction rate / hit ratio

## 4-card — senior — [Messaging, Reliability]
**Question:** A payments worker consuming from a managed queue (SQS / Pub/Sub / Service Bus) occasionally charges a customer twice, and unrelated messages sometimes get "stuck" forever. Walk through the delivery semantics causing both, and how to build the consumer correctly.
**Verdict:** KEEP — Two distinct failure modes from delivery semantics; classic senior messaging question with idempotency/ordering depth.

### New answer (en)
**TL;DR** — Both symptoms come from **at-least-once delivery**: the double-charge is a non-idempotent consumer meeting a redelivery, and the "stuck" messages are a poison-message head-of-line block or a no-DLQ retry loop. Make consumers **idempotent** (dedup on a stable id or use idempotent operations) and configure a **DLQ**.

**How it works** — Managed queues/streams (SQS standard, Pub/Sub, Service Bus, Kafka, Kinesis) redeliver when an ack is lost, a visibility timeout expires before the worker finishes, or the broker retries. Idempotency: key on a stable message/business id and either record processed ids or use idempotent operations (`INSERT ... ON CONFLICT`, conditional charge via idempotency key to the payment provider). Ordering is per-model: Kafka per **partition**, SQS FIFO / Service Bus sessions per group, plain SQS/Pub/Sub not at all — never assume global order.

:::muted
**Trade-off** — At-least-once buys durability and simple retries at the cost of duplicates you must engineer around. Exactly-once and strict ordering exist (Kafka EOS, SQS FIFO) but cap throughput and add latency/operational constraints. A DLQ is the pressure valve — after N attempts a message is parked instead of blocking the queue, trading forever-retry for visibility and manual triage.
:::

:::muted
**Common pitfall** — The double-charge is usually triggered when processing takes longer than the visibility/ack-deadline, so the broker redelivers while the first attempt is still running. The "stuck forever" case is a permanently-failing message retrying indefinitely with no DLQ, burning the worker. Always set visibility timeout above real processing time, configure a DLQ with a sane max-receive count, and never treat at-least-once as exactly-once.
:::

*Go deeper: where do you store the dedup keys, and how do you bound that store's growth?*

**Keywords** — at-least-once · idempotency key · visibility timeout · DLQ / max-receive · per-partition ordering

### New answer (vi)
**Chốt** — Cả hai triệu chứng đến từ **at-least-once delivery**: tính tiền hai lần là consumer không idempotent gặp redelivery, còn các message "kẹt" là poison-message head-of-line block hoặc vòng retry không-DLQ. Làm consumer **idempotent** (dedup theo một id ổn định hoặc dùng phép toán idempotent) và cấu hình một **DLQ**.

**Cơ chế** — Managed queue/stream (SQS standard, Pub/Sub, Service Bus, Kafka, Kinesis) giao lại khi ack bị mất, visibility timeout hết hạn trước khi worker xong, hoặc broker retry. Idempotency: khóa theo một message/business id ổn định và hoặc lưu các id đã xử lý hoặc dùng phép toán idempotent (`INSERT ... ON CONFLICT`, charge có điều kiện theo idempotency key truyền cho nhà cung cấp thanh toán). Ordering theo model: Kafka theo **partition**, SQS FIFO / Service Bus session theo group, SQS/Pub/Sub thường thì không — đừng giả định thứ tự toàn cục.

:::muted
**Trade-off** — At-least-once mua độ bền và retry đơn giản, đổi lại là các bản trùng bạn phải xử lý quanh. Exactly-once và thứ tự nghiêm ngặt có tồn tại (Kafka EOS, SQS FIFO) nhưng giới hạn throughput và thêm độ trễ/ràng buộc vận hành. DLQ là van xả — sau N lần thất bại, message bị đỗ vào DLQ thay vì chặn queue, đánh đổi retry-mãi-mãi lấy khả năng nhìn thấy và phân loại thủ công.
:::

:::muted
**Bẫy thường gặp** — Tính tiền hai lần thường bị kích khi xử lý lâu hơn visibility/ack-deadline, nên broker giao lại trong khi lần đầu vẫn đang chạy. Ca "kẹt mãi" là một message thất bại vĩnh viễn cứ retry vô tận khi không có DLQ, đốt worker. Luôn đặt visibility timeout cao hơn thời gian xử lý thực, cấu hình DLQ với max-receive count hợp lý, và đừng bao giờ coi at-least-once là exactly-once.
:::

*Đào sâu tiếp: bạn lưu các dedup key ở đâu, và giới hạn sự phình to của kho đó thế nào?*

**Từ khoá ăn điểm** — at-least-once · idempotency key · visibility timeout · DLQ / max-receive · per-partition ordering

## 5-card — senior — [Backup, Reliability]
**Question:** At 14:32 an engineer runs a bad migration that corrupts a table. Your managed DB has nightly automated backups and you took a manual snapshot last week. The business asks "how much data will we lose and how long until we're back?" How do you answer, and what should you have set up?
**Verdict:** KEEP — Frames an incident in RPO/RTO/PITR terms with real recovery reasoning; senior disaster-recovery question.

### New answer (en)
**TL;DR** — Answer in **RPO** (how much data you can lose) and **RTO** (how long recovery takes). **Point-in-time recovery (PITR)** saves you here: restore to 14:31:59, just before the bad migration, losing seconds rather than rolling back to last night's backup. Data loss is bounded by PITR granularity; recovery time is measured, not guessed.

**How it works** — Managed DBs (RDS, Cloud SQL, Azure DB) continuously archive transaction logs, giving a continuous PITR window (often 7–35 days retention); manual snapshots are deliberate point-in-time images you keep. So you restore to just before the corruption from logs/snapshot, and RTO is how long it takes to provision a fresh instance from them — a number you should already know from drills.

:::muted
**Trade-off** — Tighter RPO (continuous logs, frequent snapshots) costs more storage/I/O; tighter RTO (warm standbys, pre-provisioned restore) costs money sitting idle. Automated backups are convenient but bounded by retention and tied to the instance lifecycle; manual snapshots persist beyond the instance but you must manage and prune them. Those targets should come from the business, not from defaults.
:::

:::muted
**Common pitfall** — **An untested backup is not a backup.** Teams discover at restore time the snapshot is corrupt, missing a table, encrypted with a lost key, or nobody knows the runbook — so real RTO is hours of panic. Other traps: automated backups deleted with the instance, backups in the same region/account as the primary (one blast radius), and never running a restore drill — so RPO/RTO are aspirations, not verified facts.
:::

*Go deeper: how often should you run a restore drill, and what exactly do you measure during it?*

**Keywords** — RPO · RTO · PITR · transaction logs · untested backup ≠ backup

### New answer (vi)
**Chốt** — Trả lời bằng **RPO** (chịu được mất bao nhiêu dữ liệu) và **RTO** (khôi phục mất bao lâu). **Point-in-time recovery (PITR)** cứu bạn ở đây: restore về 14:31:59, ngay trước migration sai, mất vài giây thay vì lùi về backup đêm qua. Lượng mất dữ liệu giới hạn bởi độ mịn PITR; thời gian khôi phục là đo đạc, không đoán.

**Cơ chế** — Managed DB (RDS, Cloud SQL, Azure DB) liên tục lưu trữ transaction log, cho một cửa sổ PITR liên tục (thường giữ 7–35 ngày); manual snapshot là ảnh tại một thời điểm mà bạn chủ động giữ. Vậy bạn restore về ngay trước thời điểm hỏng từ log/snapshot, và RTO là thời gian provision một instance mới từ chúng — một con số bạn lẽ ra đã biết từ các bài diễn tập.

:::muted
**Trade-off** — RPO chặt hơn (log liên tục, snapshot thường xuyên) tốn thêm storage/I/O; RTO chặt hơn (warm standby, năng lực restore dựng sẵn) tốn tiền nằm chờ không. Backup tự động tiện nhưng bị giới hạn retention và gắn vòng đời instance; manual snapshot tồn tại ngoài instance nhưng bạn phải tự quản lý và dọn. Những mục tiêu đó phải đến từ business, không phải từ mặc định.
:::

:::muted
**Bẫy thường gặp** — **Một backup chưa được test thì không phải backup.** Team phát hiện ngay lúc restore rằng snapshot bị hỏng, thiếu một bảng, mã hóa bằng key đã mất, hoặc không ai biết runbook — nên RTO thật là vài giờ hoảng loạn. Cạm bẫy khác: backup tự động bị xóa cùng instance, backup cùng region/account với primary (cùng một bán kính sát thương), và không bao giờ chạy bài diễn tập restore — nên RPO/RTO là khát vọng chứ không phải sự thật đã kiểm chứng.
:::

*Đào sâu tiếp: bạn nên chạy bài diễn tập restore bao lâu một lần, và đo chính xác cái gì trong đó?*

**Từ khoá ăn điểm** — RPO · RTO · PITR · transaction log · untested backup ≠ backup

## 6-card — middle — [Database, Scalability]
**Question:** You move an API to serverless functions, and under traffic the database starts rejecting connections with "too many clients" even though CPU on the DB is low. Why does serverless break database connections, and what fixes it?
**Verdict:** KEEP — Diagnoses a connection-exhaustion failure and asks for the pooler fix with real trade-offs; strong middle scenario.

### New answer (en)
**TL;DR** — A relational DB has a hard **max-connections** limit because each connection costs a backend process/thread and memory regardless of CPU; hundreds/thousands of short-lived function instances each open their own connection and blow past it. The fix is a **connection pooler** that multiplexes many client connections onto a few real DB connections.

**How it works** — Traditional servers keep a small pool of long-lived connections; serverless does the opposite, so the count explodes. A pooler — PgBouncer (often transaction mode), RDS Proxy, Cloud SQL Auth Proxy / built-in pooling, Azure pooling, DO Managed DB built-in pool — sits in front: functions connect to the pooler, and the pooler holds a bounded set of real connections to the database.

:::muted
**Trade-off** — A pooler protects the DB and lets you scale the app tier independently, but adds a hop (latency), another component to run/monitor, and constraints: transaction-mode pooling breaks session-level features like prepared statements, `SET` session state, and some advisory locks. Sizing is a balance too — too few real connections and requests queue at the pooler; too many and you re-exhaust the DB.
:::

:::muted
**Common pitfall** — Opening a connection **per request/invocation** and never reusing it turns a spike into a connection storm that rejects everyone, including healthy services sharing that DB. Pointing the pooler at the DB but leaving the app connecting directly defeats the purpose. And transaction-mode poolers silently break code relying on session state — a bug that only shows under the pooler, not in local dev where you talk to the DB directly.
:::

*Go deeper: when would you use transaction-mode vs session-mode pooling, and what do you give up with each?*

**Keywords** — max-connections · connection pooler · PgBouncer · transaction mode · RDS Proxy

### New answer (vi)
**Chốt** — Một relational DB có giới hạn cứng **max-connections** vì mỗi connection tốn một process/thread backend và bộ nhớ bất kể CPU; hàng trăm/nghìn instance function sống ngắn mỗi cái mở connection riêng và vượt qua nó. Cách sửa là một **connection pooler** ghép nhiều client connection lên vài connection DB thật.

**Cơ chế** — Server truyền thống giữ một pool nhỏ các connection sống lâu; serverless làm ngược lại, nên con số bùng nổ. Một pooler — PgBouncer (thường transaction mode), RDS Proxy, Cloud SQL Auth Proxy / pooling tích hợp, pooling Azure, pool tích hợp DO Managed DB — đứng phía trước: các function kết nối tới pooler, và pooler giữ một tập connection thật có giới hạn tới database.

:::muted
**Trade-off** — Pooler bảo vệ DB và cho phép scale tầng app độc lập, nhưng thêm một hop (độ trễ), thêm một thành phần phải chạy/monitor, và thêm ràng buộc: pooling transaction-mode phá vỡ các tính năng mức session như prepared statement, trạng thái `SET` session, và một số advisory lock. Sizing cũng là cân bằng — quá ít connection thật thì request xếp hàng ở pooler; quá nhiều thì lại làm cạn DB.
:::

:::muted
**Bẫy thường gặp** — Mở connection **theo từng request/lần gọi** rồi không tái sử dụng biến một cú spike thành bão connection từ chối tất cả, kể cả các service khỏe mạnh dùng chung DB đó. Trỏ pooler vào DB nhưng để app vẫn trỏ thẳng DB làm hỏng cả mục đích. Và pooler transaction-mode âm thầm phá vỡ code dựa vào session state — một bug chỉ lộ dưới pooler, không thấy ở local dev nơi bạn nói chuyện trực tiếp với DB.
:::

*Đào sâu tiếp: khi nào dùng transaction-mode vs session-mode pooling, và bạn mất gì ở mỗi loại?*

**Từ khoá ăn điểm** — max-connections · connection pooler · PgBouncer · transaction mode · RDS Proxy

## 7-card — staff — [Architecture, Cloud]
**Question:** At scale your managed-database and managed-Kafka bills have grown large enough that a director asks, "why don't we just run these ourselves on cheaper VMs?" As the staff engineer, how do you frame the managed-vs-self-managed decision honestly?
**Verdict:** KEEP — Open-ended staff-level architecture/TCO judgment with lock-in and team-maturity reasoning; exactly a staff question.

### New answer (en)
**TL;DR** — Frame it as **total cost of ownership**, not the line-item bill: the managed premium buys away the "undifferentiated heavy lifting" (patching, HA, backups, failover, on-call) that has no competitive value. Decide per-service and quantified — usually only your highest-cost, most-specialized workloads justify self-managing.

**How it works** — Estimate the fully-loaded cost of the engineers and incident risk you'd take on (kernel tuning, replication topology, upgrade orchestration, the pager), compare against the managed premium, and weigh **control** (do you genuinely need tuning the managed tier won't give?) against focus. There's a maturity dimension: a 5-person startup self-hosting Kafka buys a second full-time job; a 500-engineer company with a platform team may run it cheaper and better.

:::muted
**Trade-off** — Managed: higher unit cost, less control, potential **lock-in** to proprietary APIs, but minimal ops burden and faster delivery. Self-managed: cheaper hardware, full control, portability/no lock-in, but you must staff and retain deep ops expertise and own the 3am outage. It's not a one-time call — revisit as scale and team maturity change.
:::

:::muted
**Common pitfall** — Comparing **only the cloud bill** and ignoring salaried hours, incident cost, and the opportunity cost of engineers not building product — self-hosting often looks cheaper on a spreadsheet and is more expensive in reality. The opposite failure is **lock-in by default**: adopting deeply proprietary features with no abstraction or exit plan, then finding migration prohibitively expensive when pricing/strategy shifts.
:::

*Go deeper: which workloads would you keep portable, and what's the cheapest abstraction that preserves an exit?*

**Keywords** — total cost of ownership · undifferentiated heavy lifting · lock-in · opportunity cost · per-workload decision

### New answer (vi)
**Chốt** — Khung nó là **total cost of ownership**, không phải con số trên hóa đơn: phần premium managed mua đứt phần "undifferentiated heavy lifting" (vá lỗi, HA, backup, failover, on-call) vốn không tạo giá trị cạnh tranh. Quyết định theo từng service và có định lượng — thường chỉ những workload tốn kém nhất, chuyên biệt nhất mới đáng tự quản.

**Cơ chế** — Ước tính chi phí đầy đủ của kỹ sư và rủi ro sự cố bạn sẽ nhận (kernel tuning, replication topology, điều phối nâng cấp, cái pager), so với phần premium managed, và cân **control** (bạn có thực sự cần tuning mà tier managed không cho?) với sự tập trung. Có chiều trưởng thành: một startup 5 người tự host Kafka là tự mua thêm một công việc full-time; một công ty 500 kỹ sư có platform team có thể chạy rẻ và tốt hơn.

:::muted
**Trade-off** — Managed: chi phí đơn vị cao hơn, ít control hơn, có nguy cơ **lock-in** vào API độc quyền, nhưng gánh nặng ops tối thiểu và giao hàng nhanh hơn. Self-managed: phần cứng rẻ hơn, full control, tính di động/không lock-in, nhưng phải tuyển và giữ chuyên môn ops sâu và sở hữu cái outage 3 giờ sáng. Đây không phải quyết định một lần — xem lại khi quy mô và độ trưởng thành của team thay đổi.
:::

:::muted
**Bẫy thường gặp** — Chỉ so **mỗi hóa đơn cloud** mà bỏ qua giờ lương, chi phí sự cố, và chi phí cơ hội của kỹ sư không xây sản phẩm — self-host thường trông rẻ hơn trên bảng tính và đắt hơn trong thực tế. Thất bại ngược lại là **lock-in theo mặc định**: dùng sâu các tính năng độc quyền mà không có lớp trừu tượng hay kế hoạch thoát, rồi phát hiện migrate đắt cắt cổ khi giá/chiến lược thay đổi.
:::

*Đào sâu tiếp: workload nào bạn sẽ giữ portable, và lớp trừu tượng rẻ nhất giữ được đường thoát là gì?*

**Từ khoá ăn điểm** — total cost of ownership · undifferentiated heavy lifting · lock-in · opportunity cost · per-workload decision
