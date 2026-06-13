# 1-system-design-mastery / 16-designing-a-flash-sale-system
Summary: kept 8, delete 0 of 8

## 0-card — junior — [Flash Sale, Fundamentals]
**Question:** Your team is launching a flash sale: 1,000 units of a phone go on sale at exactly 12:00, and marketing expects two million people to hit the page in the first minute. Why is this fundamentally harder than normal e-commerce traffic, and what is the core tension you must design around?
**Verdict:** KEEP — open-ended "why is this hard + name the core tension" question with real reasoning; scales with seniority.

### New answer (en)
**TL;DR** — Two properties make a flash sale unlike normal traffic: a *synchronized spike* (nearly all load arrives in seconds because of a known countdown) and *extreme scarcity* (millions compete for a tiny inventory). The core tension is that you must shed almost all traffic cheaply while staying perfectly correct about a tiny pool of stock.

**How it works** — Normal capacity planning assumes a smooth demand curve, but here the peak can be hundreds of times the average, so you design for the burst, not the mean. With two million people and 1,000 units, ~99.95% of requests are doomed to fail to buy — yet each still costs CPU, DB connections, and bandwidth. So the design splits into a cheap, scalable path that accepts and rejects the losing majority at the edge, and a thin, fiercely-protected hot path that decrements the real inventory correctly.

:::muted
**Trade-off** — You trade fairness and a rich, instant experience for survivability. Millisecond-exact first-come-first-served is nearly impossible at this scale, so most systems accept approximate fairness (queues, randomized admission) and push work to the edge (CDN, static page, client countdown), keeping only inventory decrement stateful.
:::

:::muted
**Common pitfall** — Treating it as ordinary peak and just autoscaling the web tier: the stateless tier scales fine, but all requests funnel into one inventory row and one cache key, and that single hot point melts. Letting losing traffic reach the DB, and forgetting the thundering herd at T-zero (no jitter/admission), make the spike even sharper.
:::

*Go deeper: how would you keep the losing 99.95% from ever touching the database?*

**Keywords** — synchronized spike · scarcity · burst vs mean · hot key · thundering herd · load shedding

### New answer (vi)
**Chốt** — Hai đặc tính khiến flash sale khác traffic thường: một *cú spike đồng bộ* (gần như toàn bộ tải dồn về trong vài giây vì có bộ đếm ngược biết trước) và *sự khan hiếm cực độ* (hàng triệu người tranh một lượng tồn kho tí hon). Mâu thuẫn cốt lõi: bạn phải loại bỏ gần như toàn bộ traffic một cách rẻ tiền mà vẫn phải hoàn toàn chính xác về lượng tồn kho nhỏ xíu.

**Cơ chế** — Capacity planning bình thường giả định đường cong nhu cầu mượt, nhưng ở đây đỉnh có thể gấp hàng trăm lần trung bình, nên bạn thiết kế cho burst chứ không cho mức trung bình. Hai triệu người tranh 1.000 suất nghĩa là ~99,95% request chắc chắn không mua được — nhưng mỗi cái vẫn tốn CPU, connection DB và băng thông. Vậy thiết kế tách thành một path rẻ và scale được để tiếp nhận rồi từ chối đa số thua cuộc ngay ở edge, và một hot path mỏng được bảo vệ gắt gao để decrement tồn kho thật một cách chính xác.

:::muted
**Trade-off** — Bạn đánh đổi tính công bằng và trải nghiệm tức thời phong phú lấy khả năng sống sót. First-come-first-served chính xác tới mili-giây gần như bất khả thi ở quy mô này, nên đa số hệ thống chấp nhận công bằng xấp xỉ (queue, admission ngẫu nhiên) và đẩy việc ra edge (CDN, trang tĩnh, đếm ngược phía client), chỉ giữ decrement tồn kho là có state.
:::

:::muted
**Bẫy thường gặp** — Coi nó như peak thông thường và chỉ autoscale tầng web: tầng stateless scale ổn, nhưng mọi request dồn vào một dòng tồn kho và một cache key, và điểm nóng duy nhất đó tan chảy. Để traffic thua cuộc chạm DB, và quên cú thundering herd tại T-zero (không jitter/admission), khiến spike còn dốc hơn.
:::

*Đào sâu tiếp: làm sao để 99,95% thua cuộc không bao giờ chạm tới database?*

**Từ khoá ăn điểm** — synchronized spike · scarcity · burst vs mean · hot key · thundering herd · load shedding

## 1-card — senior — [Concurrency, Inventory]
**Question:** During a flash sale your service sold 1,043 units of a 1,000-unit drop. Walk through why a naive "read stock, check > 0, write stock - 1" oversells under concurrency, and design an atomic decrement that makes oversell impossible.
**Verdict:** KEEP — classic concurrency-diagnosis + design question with deep trade-offs; strong senior card.

### New answer (en)
**TL;DR** — The naive read-check-write races: two requests both read stock=1, both pass `> 0`, both write 0, so two orders hit one unit. The fix is to make check-and-decrement a single atomic operation the storage engine serializes — a conditional `UPDATE` in SQL, or a Lua-guarded `DECR` in Redis.

**How it works** — In SQL: `UPDATE inventory SET stock = stock - 1 WHERE id = ? AND stock > 0`, and treat `rows affected = 0` as sold out — the row lock guarantees exactly one writer wins per unit. In Redis: wrap the read-and-decrement in a single Lua script (or `DECRBY` with a check) so it runs as one indivisible step, often pre-loading the counter before the sale to keep the hot path off the database entirely.

:::muted
**Trade-off** — Redis decrement is blazing fast and absorbs the spike, but Redis becomes the source of truth for a window, so you need durable reconciliation (write-behind, AOF/replication) or risk losing the count on crash. The SQL conditional update is perfectly durable but serializes on one hot row — fine for thousands/sec, not millions. Many designs combine them: Redis gates and reserves, the DB is the authoritative ledger.
:::

:::muted
**Common pitfall** — Using `SELECT` then `UPDATE` without `FOR UPDATE` or a conditional `WHERE` — the optimistic read still races unless the *write* enforces the predicate. Decrementing before inserting the order and crashing in between leaves phantom-reserved stock, so pair decrement with idempotent order creation and a release path. In Redis, splitting `GET` then `DECR` from the client reintroduces the race, and an unbounded `DECR` can go negative — silently overselling.
:::

*Go deeper: at millions/sec the single hot row caps you — how do you shard the counter without losing correctness?*

**Keywords** — read-check-write race · atomic decrement · conditional UPDATE · rows affected = 0 · row lock · Lua script · CAS

### New answer (vi)
**Chốt** — Luồng read-check-write ngây thơ bị race: hai request cùng đọc stock=1, cùng qua `> 0`, cùng ghi 0, nên hai đơn đè lên một suất. Cách sửa là biến check-and-decrement thành một thao tác atomic duy nhất được storage engine tuần tự hóa — một `UPDATE` có điều kiện trong SQL, hoặc một `DECR` bọc bởi Lua trong Redis.

**Cơ chế** — Trong SQL: `UPDATE inventory SET stock = stock - 1 WHERE id = ? AND stock > 0`, và coi `rows affected = 0` là hết hàng — row lock đảm bảo đúng một writer thắng mỗi suất. Trong Redis: bọc phần đọc-và-decrement trong một Lua script duy nhất (hoặc `DECRBY` kèm kiểm tra) để chạy như một bước không thể chia cắt, thường nạp sẵn counter trước đợt bán để giữ hot path hoàn toàn tách khỏi database.

:::muted
**Trade-off** — Decrement trên Redis cực nhanh và hấp thụ spike, nhưng Redis thành nguồn sự thật trong một khoảng thời gian, nên cần reconciliation bền (write-behind, AOF/replication) nếu không sẽ mất count khi crash. Conditional update trên SQL thì bền hoàn hảo nhưng tuần tự hóa trên một dòng nóng — ổn với vài nghìn/giây, không phải vài triệu. Nhiều thiết kế kết hợp: Redis làm cổng và reserve, DB là sổ cái thẩm quyền.
:::

:::muted
**Bẫy thường gặp** — Dùng `SELECT` rồi `UPDATE` mà không có `FOR UPDATE` hay `WHERE` điều kiện — bản đọc optimistic vẫn race trừ khi chính câu *ghi* thực thi predicate. Decrement trước rồi mới insert đơn rồi crash ở giữa để lại stock reserve ảo, nên ghép decrement với tạo đơn idempotent và một đường release. Trong Redis, tách `GET` rồi `DECR` từ client tái tạo race, và một `DECR` không chặn đáy có thể xuống âm — oversell âm thầm.
:::

*Đào sâu tiếp: ở vài triệu/giây một dòng nóng giới hạn bạn — làm sao shard counter mà không mất tính đúng đắn?*

**Từ khoá ăn điểm** — read-check-write race · atomic decrement · conditional UPDATE · rows affected = 0 · row lock · Lua script · CAS

## 2-card — senior — [Admission Control, Rate Limiting]
**Question:** Your inventory service can safely handle about 5,000 checkout attempts per second, but the flash sale will throw a million concurrent users at it. Design an admission-control layer (virtual waiting room plus token bucket) that ensures the backend is never stampeded.
**Verdict:** KEEP — concrete capacity-vs-load design question with layered trade-offs; strong senior card.

### New answer (en)
**TL;DR** — Put a gate in front of the buy path so inventory only ever sees traffic it can absorb: a virtual waiting room admits users at a controlled rate (e.g. 5,000/s), and a token bucket smooths even admitted requests to the safe ceiling, 429-ing the rest.

**How it works** — On arrival each user gets a signed, single-use queue token and a position; the client holds a connection or polls with backoff, and a dispatcher releases a steady stream into real checkout. Behind the gate, enforce a token bucket — per node *and* globally in Redis — so the true ceiling is bounded. Because real inventory is only 1,000 units, you can stop admitting once roughly that many enter checkout, turning the waiting room into a coarse early sell-out signal.

:::muted
**Trade-off** — A waiting room trades immediacy for stability: users wait, but the backend stays healthy and conversions are reliable. Where you enforce the gate matters — edge/CDN admission is cheapest and stops load earliest, while a Redis distributed counter gives a precise global rate at the cost of a coordination round-trip; many do coarse edge admission *plus* a precise Redis bucket right before the inventory call.
:::

:::muted
**Common pitfall** — Making the waiting room itself the bottleneck: a million clients polling every second is a million RPS, so use long-lived connections, exponential backoff with jitter, or a signed "return at time T" token. Per-node-only limits don't bound global traffic — twenty nodes at 5,000/s each admit 100,000/s, so you need a shared limiter. And an unsigned token lets bots forge positions and jump the line.
:::

*Go deeper: how do you make queue position survive a node restart without a single global lock becoming the new hot spot?*

**Keywords** — admission control · virtual waiting room · token bucket · global vs per-node limit · signed single-use token · backoff + jitter · 429

### New answer (vi)
**Chốt** — Đặt một cổng trước buy path để inventory chỉ bao giờ thấy lượng traffic nó hấp thụ được: một virtual waiting room cho người vào với tốc độ kiểm soát (ví dụ 5.000/s), và một token bucket làm mượt cả request đã admit về trần an toàn, trả 429 cho phần còn lại.

**Cơ chế** — Khi đến, mỗi người nhận một queue token đã ký, dùng-một-lần kèm vị trí; client giữ connection hoặc poll kèm backoff, và một dispatcher xả một dòng đều vào checkout thật. Phía sau cổng, áp token bucket — theo từng node *và* toàn cục trong Redis — để bao được trần thật. Vì tồn kho thật chỉ 1.000 suất, bạn có thể ngừng admit khi đã có khoảng chừng đó người vào checkout, biến phòng chờ thành một tín hiệu hết hàng sớm thô.

:::muted
**Trade-off** — Phòng chờ đánh đổi tính tức thời lấy sự ổn định: người dùng phải chờ, nhưng backend khỏe và chuyển đổi đáng tin. Nơi đặt cổng quan trọng — admission ở edge/CDN rẻ nhất và chặn tải sớm nhất, còn counter phân tán Redis cho tốc độ toàn cục chính xác với cái giá là một round-trip phối hợp; nhiều hệ thống làm admission thô ở edge *cộng* một bucket Redis chính xác ngay trước lời gọi inventory.
:::

:::muted
**Bẫy thường gặp** — Biến chính phòng chờ thành nút thắt: một triệu client poll mỗi giây là một triệu RPS, nên dùng connection sống lâu, exponential backoff kèm jitter, hoặc token "quay lại lúc T" đã ký. Limit chỉ-theo-node không bao được traffic toàn cục — hai mươi node mỗi cái 5.000/s admit 100.000/s, nên cần một limiter chia sẻ. Và token không ký để bot giả vị trí, chen hàng.
:::

*Đào sâu tiếp: làm sao giữ vị trí hàng đợi sống sót qua một lần node restart mà không biến một global lock duy nhất thành hot spot mới?*

**Từ khoá ăn điểm** — admission control · virtual waiting room · token bucket · global vs per-node limit · signed single-use token · backoff + jitter · 429

## 3-card — middle — [Idempotency, Checkout]
**Question:** Anxious users frantically double-click "Buy", and flaky mobile networks make the client auto-retry the same checkout request. Some buyers end up with two orders for a one-per-customer item. Design an idempotent checkout so a retried or duplicated request never creates a second order.
**Verdict:** KEEP — concrete idempotency design problem with a sharp failure mode; solid middle card.

### New answer (en)
**TL;DR** — Require an idempotency key on the checkout request: the client generates one key *per buy intent* (not per request) and resends it on every retry. The server claims that key under a unique constraint, so the first request does the real work and any duplicate returns the stored result instead of creating a second order.

**How it works** — Store the key with a unique constraint — `INSERT ... ON CONFLICT DO NOTHING` on an `idempotency_keys` table, or `SET key value NX` in Redis. The first request wins the key and runs the decrement + order creation *under that same key*; any concurrent or later request with the same key is recognized and replayed the original response. So a retry sees the already-created order rather than reserving a second unit.

:::muted
**Trade-off** — Idempotency adds a write and a lookup on the hot path plus durable key storage — latency and space. You must pick a retention window: too long wastes space, too short lets a late retry slip through as a fresh order. You also choose between replaying the cached response immediately vs. blocking the duplicate until the in-flight original finishes (correct, but needs care to avoid deadlocks).
:::

:::muted
**Common pitfall** — Generating the key per request instead of per intent — then every retry carries a new key and the protection does nothing. Making the key-claim and the order-insert two non-atomic steps reintroduces the race; they must share one transaction or one unique constraint. Forgetting to cache and replay the original response means a duplicate gets an error or a confusing "already bought", so the client retries even harder.
:::

*Go deeper: where do you store the keys — Redis for speed or the DB for durability — and how do you reconcile if Redis loses one mid-sale?*

**Keywords** — idempotency key · per-intent not per-request · ON CONFLICT DO NOTHING · SET NX · unique constraint · exactly-once-effect · response replay

### New answer (vi)
**Chốt** — Yêu cầu một idempotency key trên request checkout: client sinh một key *cho mỗi ý định mua* (không phải mỗi request) và gửi lại trong mọi lần retry. Server giành key đó dưới một ràng buộc unique, nên request đầu làm việc thật còn mọi bản nhân đôi trả về kết quả đã lưu thay vì tạo đơn thứ hai.

**Cơ chế** — Lưu key với một ràng buộc unique — `INSERT ... ON CONFLICT DO NOTHING` trên bảng `idempotency_keys`, hoặc `SET key value NX` trong Redis. Request đầu tiên giành key và chạy decrement + tạo đơn *dưới cùng key đó*; bất kỳ request đồng thời hay đến sau mang cùng key đều được nhận diện và replay response gốc. Nên một retry thấy đơn đã tạo chứ không reserve một suất thứ hai.

:::muted
**Trade-off** — Idempotency thêm một lượt ghi và một lượt tra cứu trên hot path cộng nơi lưu key bền — tốn latency và bộ nhớ. Bạn phải chọn cửa sổ lưu giữ: dài quá thì lãng phí, ngắn quá để một retry muộn lọt thành đơn mới. Cũng phải chọn giữa replay response đã cache ngay và chặn bản nhân đôi cho tới khi bản gốc đang chạy xong (đúng, nhưng cần cẩn thận tránh deadlock).
:::

:::muted
**Bẫy thường gặp** — Sinh key theo từng request thay vì từng ý định — khi đó mỗi retry mang key mới và lớp bảo vệ vô tác dụng. Tách phần giành key và phần insert đơn thành hai bước không atomic tái tạo race; chúng phải chung một transaction hoặc một ràng buộc unique. Quên cache và replay response gốc khiến bản nhân đôi nhận lỗi hoặc thông báo "đã mua rồi" khó hiểu, nên client retry còn dữ hơn.
:::

*Đào sâu tiếp: lưu key ở đâu — Redis cho tốc độ hay DB cho độ bền — và reconcile thế nào nếu Redis mất một key giữa đợt bán?*

**Từ khoá ăn điểm** — idempotency key · per-intent not per-request · ON CONFLICT DO NOTHING · SET NX · unique constraint · exactly-once-effect · response replay

## 4-card — senior — [Hot Key, Sharding]
**Question:** Every request in the sale reads and writes the exact same product and the exact same stock counter, so one cache shard and one counter become a single melting hot key while the rest of your cluster sits idle. How do you mitigate the hot-key problem for both reads and writes?
**Verdict:** KEEP — meaty hot-key diagnosis + sharding design split into read/write paths; strong senior card.

### New answer (en)
**TL;DR** — Split the problem into the read hot key and the write hot key. For reads, serve the near-static product from the CDN and per-node local caches so most reads never touch the shared shard. For writes, shard the single counter into N sub-counters so contention spreads across N keys.

**How it works** — Reads: the product detail is nearly static, so cache it at the CDN and in per-node in-memory caches with short TTL; you can also replicate the key across nodes or add a small random suffix to fan reads across shards. Writes: split 1,000 units into, say, ten buckets of 100, route each decrement to a bucket by hashing the user, and report sold out only when all buckets hit zero. A common refinement is local in-memory aggregation: each app node reserves a small slice of stock in batches from the central counter and serves decrements locally, returning to the source only when its slice runs low.

:::muted
**Trade-off** — Splitting the counter trades an exact global view for write throughput: no single place knows the precise remaining total, so you accept approximate accounting plus reconciliation. Local slices are even faster but widen the window where a node holds reserved-but-unsold stock, stranding the last units while others see sold out. Replicating the read key improves fan-out but multiplies invalidation and risks brief inconsistency on mid-sale product changes.
:::

:::muted
**Common pitfall** — The signature failure is silent: aggregate metrics show 10% cluster CPU while one node/shard is pinned at 100% and tail latency explodes. Skewed hashing drains some buckets while others stay full, so the sale reports sold out with stock still reservable — rebalance or let drained requests fall through to non-empty buckets. And a cache stampede is deadly: if the hot read key expires at peak, thousands regenerate it against the DB unless you use request coalescing or never-expire-with-async-refresh.
:::

*Go deeper: when buckets drain unevenly and one shows zero while another has stock, how do you reroute without a global lock?*

**Keywords** — hot key · read vs write split · bucketed counter · key replication / random suffix · local in-memory slice · cache stampede · request coalescing

### New answer (vi)
**Chốt** — Chia bài toán thành hot key đọc và hot key ghi. Với đọc, phục vụ sản phẩm gần-tĩnh từ CDN và cache cục bộ trên từng node để đa số lượt đọc không chạm shard chia sẻ. Với ghi, shard cái counter duy nhất thành N sub-counter để contention dàn qua N key.

**Cơ chế** — Đọc: chi tiết sản phẩm gần như tĩnh, nên cache ở CDN và cache in-memory cục bộ trên từng node với TTL ngắn; cũng có thể nhân bản key qua nhiều node hoặc thêm một hậu tố ngẫu nhiên nhỏ để dàn đọc qua nhiều shard. Ghi: chia 1.000 suất thành, ví dụ, mười bucket mỗi cái 100, định tuyến mỗi decrement về một bucket bằng hash người dùng, và chỉ báo hết hàng khi tất cả bucket về không. Một tinh chỉnh phổ biến là gộp in-memory cục bộ: mỗi app node reserve một lát stock nhỏ theo lô từ counter trung tâm và phục vụ decrement cục bộ, chỉ quay lại nguồn khi lát sắp cạn.

:::muted
**Trade-off** — Chia counter đánh đổi góc nhìn toàn cục chính xác lấy throughput ghi: không nơi nào biết chính xác tổng còn lại, nên chấp nhận hạch toán xấp xỉ kèm reconcile. Lát cục bộ còn nhanh hơn nhưng nới rộng cửa sổ nơi một node giữ stock đã reserve nhưng chưa bán, làm mắc kẹt vài suất cuối trong khi nơi khác thấy hết hàng. Nhân bản key đọc cải thiện fan-out nhưng nhân lên việc invalidate và rủi ro bất nhất ngắn khi sản phẩm thay đổi giữa đợt bán.
:::

:::muted
**Bẫy thường gặp** — Failure đặc trưng là âm thầm: metric tổng hợp cho thấy cluster 10% CPU trong khi một node/shard bị ghim 100% và tail latency bùng nổ. Hash lệch rút cạn vài bucket trong khi số khác còn đầy, nên đợt bán báo hết hàng dù stock vẫn reserve được — cân bằng lại hoặc cho request bị cạn rơi xuống bucket chưa rỗng. Và cache stampede là chí mạng: nếu hot read key hết hạn đúng đỉnh, hàng nghìn request tái sinh nó lên DB trừ khi dùng request coalescing hoặc never-expire kèm refresh bất đồng bộ.
:::

*Đào sâu tiếp: khi các bucket cạn không đều và một cái về không trong khi cái khác còn stock, làm sao reroute mà không cần global lock?*

**Từ khoá ăn điểm** — hot key · read vs write split · bucketed counter · key replication / random suffix · local in-memory slice · cache stampede · request coalescing

## 5-card — middle — [Reservation, Payment]
**Question:** A user wins a unit and moves to payment, but payment takes 30 seconds to a few minutes and many winners abandon it. Design the reservation-and-payment flow: how do you hold stock during payment, time it out, and release unpaid reservations back to the pool?
**Verdict:** KEEP — two-phase reservation design with a real expiry/payment race to reason about; solid middle card.

### New answer (en)
**TL;DR** — Model stock in two phases: a *reservation* that holds a unit while payment is pending, and a *confirmation* that converts it into a sold order. Reserve with an expiry; on payment success confirm it, and on failure or timeout release the unit back to the pool.

**How it works** — When a user wins, atomically decrement available stock and create a reservation with an expiry (e.g. two minutes) — the same atomic decrement that prevents oversell, just tagged "held". On successful payment you confirm; if payment fails or the timer expires you increment available stock back and mark the reservation expired. A background sweeper — a scheduled job, a Redis key TTL with keyspace notifications, or a delay queue — handles expiry so abandoned reservations don't lock inventory forever.

:::muted
**Trade-off** — Reserve-then-confirm trades effective availability for buyer experience: held units are unavailable to others even though some payments never complete. A short timeout maximizes throughput but risks cutting off slow-but-genuine payers; a long one strands inventory and can make a not-actually-sold-out sale look sold out. Eager release recovers stock fastest but is chatty; a periodic sweep is simpler but adds latency before stock returns.
:::

:::muted
**Common pitfall** — The dangerous race is expiry vs. a late payment success: if the sweeper releases just as the payment webhook confirms, you can oversell or lose a paid order. Guard confirm with a conditional update that only succeeds if the reservation is still "held", and make release equally conditional so only one can win. Also invalidate the user's checkout session on release, and make release idempotent so a double-fired expiry can't over-credit the counter.
:::

*Go deeper: how do you keep confirm and release from both winning during a partial outage where the webhook and the sweeper run on different nodes?*

**Keywords** — two-phase reserve/confirm · reservation expiry · sweeper / delay queue · Redis TTL + keyspace notification · conditional confirm · idempotent release

### New answer (vi)
**Chốt** — Mô hình hóa stock thành hai pha: một *reservation* giữ suất khi thanh toán đang chờ, và một *confirmation* chuyển nó thành đơn đã bán. Reserve kèm thời điểm hết hạn; khi thanh toán thành công thì confirm, còn khi thất bại hoặc hết giờ thì release suất về lại pool.

**Cơ chế** — Khi một người thắng, atomic decrement stock khả dụng và tạo một reservation kèm thời điểm hết hạn (ví dụ hai phút) — chính cùng atomic decrement chống oversell, chỉ gắn nhãn "đang giữ". Khi thanh toán thành công bạn confirm; nếu thất bại hoặc bộ đếm hết giờ thì cộng lại stock khả dụng và đánh dấu reservation hết hạn. Một sweeper nền — một job định lịch, một Redis key TTL kèm keyspace notification, hoặc một delay queue — lo phần hết hạn để các reservation bị bỏ không khóa tồn kho vĩnh viễn.

:::muted
**Trade-off** — Reserve-rồi-confirm đánh đổi tính khả dụng thực tế lấy trải nghiệm mua: các suất đang giữ không khả dụng với người khác dù một số thanh toán sẽ không bao giờ hoàn tất. Timeout ngắn tối đa hóa throughput nhưng rủi ro cắt mất người trả chậm-nhưng-thật; timeout dài làm mắc kẹt tồn kho và có thể khiến đợt bán chưa hết hàng trông như hết hàng. Release ngay thu hồi stock nhanh nhất nhưng ồn ào; sweep định kỳ đơn giản hơn nhưng thêm độ trễ trước khi stock quay lại.
:::

:::muted
**Bẫy thường gặp** — Race nguy hiểm là hết hạn vs một thanh toán thành công muộn: nếu sweeper release đúng lúc webhook thanh toán confirm, bạn có thể oversell hoặc mất một đơn đã trả tiền. Bảo vệ confirm bằng một conditional update chỉ thành công nếu reservation còn "đang giữ", và làm release cũng có điều kiện để chỉ một bên thắng. Đồng thời vô hiệu hóa checkout session của người dùng khi release, và làm release idempotent để một lần hết hạn bắn đôi không cộng dư counter.
:::

*Đào sâu tiếp: làm sao để confirm và release không cùng thắng trong một outage cục bộ khi webhook và sweeper chạy trên các node khác nhau?*

**Từ khoá ăn điểm** — two-phase reserve/confirm · reservation expiry · sweeper / delay queue · Redis TTL + keyspace notification · conditional confirm · idempotent release

## 6-card — middle — [CDN, Caching]
**Question:** Millions of people refresh the product/landing page in the seconds before launch. Your origin can't serve that, yet the buy endpoint must be strongly consistent about stock. How do you split the page so most of it is served from the CDN while the buy path stays correct?
**Verdict:** KEEP — static-shell vs dynamic-truth split with concrete cache trade-offs; solid middle card.

### New answer (en)
**TL;DR** — Separate the static shell from the dynamic truth: render the landing page as a static asset on the CDN with a long TTL so millions of loads terminate at the edge, fetch the tiny "is it live / how many left" bit separately and briefly cached, and never cache the buy endpoint — that thin path carries correctness.

**How it works** — The page (images, copy, layout, even countdown logic) is identical for everyone, so it's a static asset on the CDN. The only dynamic bits — "is it live" and "how many left" — come from a tiny separate request cached for ~a second or served from a fast in-memory layer, and are explicitly approximate. The buy/checkout endpoint goes through admission control to the inventory service and does the atomic decrement, so strong consistency lives only there while everything cacheable is offloaded.

:::muted
**Trade-off** — Caching the page and stock indicator trades freshness for survivability: displayed "items left" may lag by a second or be coarse ("almost gone"), which is fine because the buy endpoint, not the page, is the source of truth. You accept that some users click buy on stock that's already gone and handle it gracefully at checkout. A client-side countdown synced to server time trades a small clock-skew risk for removing a synchronized wave of "is it live yet" polls.
:::

:::muted
**Common pitfall** — Rendering the stock count into cached HTML, which either makes the page uncacheable or freezes a stale number for everyone for the whole TTL. Leaving the "how many left" endpoint uncached so every client hammers it each second recreates the origin overload — cache briefly with jitter or push updates. Pre-warm the CDN and stagger expiries so the static page doesn't stampede at T-zero. And never let the buy endpoint share a cache: a misconfigured rule that caches a checkout response can leak one user's confirmation or a stale sold-out to thousands.
:::

*Go deeper: the "how many left" number is approximate — how do you reconcile the page showing "5 left" while the buy endpoint already sold out?*

**Keywords** — static shell vs dynamic truth · CDN long TTL · approximate stock indicator · client-side countdown · cache stampede / pre-warm · never cache checkout

### New answer (vi)
**Chốt** — Tách phần vỏ tĩnh khỏi sự thật động: render trang landing thành một asset tĩnh trên CDN với TTL dài để hàng triệu lượt tải kết thúc ở edge, lấy phần nhỏ "đã mở bán chưa / còn bao nhiêu" riêng và cache ngắn, và không bao giờ cache buy endpoint — path mỏng đó mang tính đúng đắn.

**Cơ chế** — Trang (hình ảnh, nội dung, bố cục, kể cả logic đếm ngược) giống hệt với mọi người, nên là một asset tĩnh trên CDN. Phần động duy nhất — "đã mở bán chưa" và "còn bao nhiêu" — đến từ một request nhỏ riêng cache trong ~một giây hoặc phục vụ từ một tầng in-memory nhanh, và được nói rõ là xấp xỉ. Buy/checkout endpoint đi qua admission control tới inventory service và làm atomic decrement, nên nhất quán mạnh chỉ sống ở đó trong khi mọi thứ cache được đều được đẩy ra ngoài.

:::muted
**Trade-off** — Cache trang và chỉ báo tồn kho đánh đổi độ tươi lấy khả năng sống sót: số "còn lại" hiển thị có thể trễ một giây hoặc thô ("sắp hết"), điều đó ổn vì buy endpoint, chứ không phải trang, mới là nguồn sự thật. Bạn chấp nhận một số người bấm mua trên stock đã hết và xử lý nhã nhặn ở checkout. Đếm ngược phía client đồng bộ với thời gian server đánh đổi một rủi ro lệch đồng hồ nhỏ để loại bỏ một làn sóng poll "đã mở bán chưa" đồng loạt.
:::

:::muted
**Bẫy thường gặp** — Render số tồn kho vào HTML đã cache, khiến trang hoặc không cache được hoặc đóng băng một con số cũ cho tất cả suốt cả TTL. Để endpoint "còn bao nhiêu" không cache và bị mọi client nện mỗi giây tái tạo overload origin — cache ngắn kèm jitter hoặc push cập nhật. Pre-warm CDN và so le các thời điểm hết hạn để trang tĩnh không stampede tại T-zero. Và đừng bao giờ để buy endpoint dùng chung cache: một rule cấu hình sai cache response checkout có thể lộ xác nhận của một người hoặc trạng thái hết-hàng cũ cho hàng nghìn người.
:::

*Đào sâu tiếp: số "còn bao nhiêu" là xấp xỉ — làm sao xử lý khi trang hiện "còn 5" trong khi buy endpoint đã hết hàng?*

**Từ khoá ăn điểm** — static shell vs dynamic truth · CDN long TTL · approximate stock indicator · client-side countdown · cache stampede / pre-warm · never cache checkout

## 7-card — staff — [System Design, Graceful Degradation]
**Question:** Put it all together: design the end-to-end flash-sale system at scale — from the CDN edge through the waiting room, inventory service, and payment — and explain how each layer degrades gracefully so that overload sheds load instead of corrupting inventory or crashing the platform.
**Verdict:** KEEP — synthesis / whiteboard capstone question that genuinely scales with seniority; ideal staff card.

### New answer (en)
**TL;DR** — Layer the system so each tier absorbs what it can and protects the next: CDN edge → waiting room + global token bucket → thin stateful inventory core (atomic decrement + idempotency + reservation) → async payment + sweeper. The hard correctness constraint lives only in the small inventory path, so everything else autoscales and sheds load cheaply.

**How it works** — The CDN serves the static landing page and a briefly-cached approximate stock indicator, terminating the vast majority of traffic at the edge. A virtual waiting room admits signed, authenticated tokens into checkout at the inventory service's safe rate, a global token bucket enforces the ceiling, and admission stops once roughly the available units enter. The inventory service does an atomic decrement (Redis counter, possibly bucketed, with the DB as durable ledger) guarded by an idempotency key, creating a time-boxed reservation. Payment runs async; on success the reservation confirms into an order; a sweeper releases expired reservations. Stateless tiers autoscale freely.

:::muted
**Trade-off** — The architecture trades simplicity and a perfectly real-time feel for survivability and correctness: a waiting room, sharded counters, eventual reconciliation, and async payment add moving parts and approximate views, but they bound load on the one place that must never be wrong. You favor shedding early and cheaply over serving everyone, and approximate global counts over exact ones — "sold out" may show a moment before the last reservation confirms. Each degradation step (cached stock, queue, throttle, friendly sold-out page) is a deliberate trade of richness for staying up.
:::

:::muted
**Common pitfall** — The platform-level failure is correlated collapse: if losing traffic reaches the DB, the hot counter is a single key, or waiting-room polls hammer the origin, one hot point takes down the sale and threatens the rest of the platform — so isolate the path with separate pools, bulkheads, and circuit breakers. Make degradation explicit: when admission is full, return a fast cacheable "sold out / try again", never a timeout, and never let a failure open the door to oversell. The most insidious bug is a correctness gap under degradation — confirm and release racing during a partial outage — so every transition (decrement, reserve, confirm, release) must be atomic and idempotent, and the ledger reconcilable after the storm.
:::

*Go deeper: after the sale, how do you prove from the durable ledger that you sold exactly the units you had, despite all the approximate counters and async payments?*

**Keywords** — layered shedding · edge → waiting room → inventory → payment · bulkhead / circuit breaker · graceful degradation · atomic + idempotent transitions · reconcilable ledger

### New answer (vi)
**Chốt** — Phân tầng hệ thống để mỗi tầng hấp thụ phần nó làm được và bảo vệ tầng kế: CDN edge → waiting room + token bucket toàn cục → lõi inventory có state mỏng (atomic decrement + idempotency + reservation) → payment bất đồng bộ + sweeper. Ràng buộc đúng đắn cứng chỉ sống trong cái path inventory nhỏ, nên mọi thứ còn lại autoscale và loại bỏ tải một cách rẻ tiền.

**Cơ chế** — CDN phục vụ trang landing tĩnh và một chỉ báo tồn kho xấp xỉ cache ngắn, kết thúc đại đa số traffic ở edge. Một virtual waiting room cho các token đã ký, xác thực vào checkout với tốc độ an toàn của inventory service, một token bucket toàn cục giữ trần, và admission ngừng khi đã có khoảng chừng số suất khả dụng đi vào. Inventory service làm atomic decrement (counter Redis, có thể chia bucket, với DB làm sổ cái bền) được bảo vệ bằng idempotency key, tạo một reservation có giới hạn thời gian. Payment chạy bất đồng bộ; khi thành công reservation confirm thành đơn; một sweeper release các reservation hết hạn. Tầng stateless autoscale thoải mái.

:::muted
**Trade-off** — Kiến trúc đánh đổi sự đơn giản và cảm giác real-time hoàn hảo lấy khả năng sống sót và tính đúng đắn: waiting room, counter chia shard, reconcile eventual, và payment bất đồng bộ đều thêm bộ phận chuyển động và góc nhìn xấp xỉ, nhưng chúng bao tải lên cái nơi duy nhất không bao giờ được sai. Bạn ưu tiên loại bỏ tải sớm và rẻ hơn là phục vụ tất cả, và đếm toàn cục xấp xỉ hơn là chính xác — "hết hàng" có thể hiện ra một khoảnh khắc trước khi reservation cuối confirm. Mỗi bước degrade (tồn kho đã cache, queue, throttle, trang hết-hàng thân thiện) là một đánh đổi có chủ ý giữa sự phong phú và việc trụ vững.
:::

:::muted
**Bẫy thường gặp** — Failure cấp nền tảng là sụp đổ tương quan: nếu traffic thua cuộc chạm DB, hot counter là một key duy nhất, hoặc các lượt poll của waiting room nện vào origin, thì một điểm nóng kéo sập cả đợt bán và đe dọa phần còn lại của nền tảng — nên cô lập path bằng pool riêng, bulkhead và circuit breaker. Làm degrade tường minh: khi admission đầy, trả về nhanh một trang "hết hàng / thử lại" có thể cache, đừng bao giờ một timeout, và đừng để một failure mở cửa cho oversell. Bug thâm hiểm nhất là một khe hở đúng đắn dưới degrade — confirm và release race nhau trong một outage cục bộ — nên mọi chuyển trạng thái (decrement, reserve, confirm, release) phải atomic và idempotent, và sổ cái phải reconcile được sau cơn bão.
:::

*Đào sâu tiếp: sau đợt bán, làm sao chứng minh từ sổ cái bền rằng bạn đã bán đúng số suất bạn có, bất chấp mọi counter xấp xỉ và payment bất đồng bộ?*

**Từ khoá ăn điểm** — layered shedding · edge → waiting room → inventory → payment · bulkhead / circuit breaker · graceful degradation · atomic + idempotent transitions · reconcilable ledger
