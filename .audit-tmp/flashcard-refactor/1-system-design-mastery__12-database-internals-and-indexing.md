# 1-system-design-mastery / 12-database-internals-and-indexing
Summary: kept 8, delete 0 of 8

## 0-card — middle — [B-tree, Cardinality]
**Question:** A query `WHERE email = ?` on a 50M-row users table got 1000x faster after you added an index, but adding an index on `is_active` (a boolean) barely moved the needle on `WHERE is_active = true`. Explain to a teammate why the same tool helped wildly differently.
**Verdict:** KEEP — Diagnostic "why does the same tool behave differently" question; turns on selectivity reasoning, not recall.

### New answer (en)
**TL;DR** — An index only helps when the predicate is *selective* — when it narrows the result to a tiny fraction of rows. `email` is high-cardinality so a match returns one row; `is_active = true` matches ~half the table, so the planner correctly skips the index and scans.

**How it works** — A B-tree is a balanced sorted tree, so a point lookup is `O(log n)` — a few page reads instead of 50M. For `email` nearly every value is unique, so the lookup lands on one row: a massive win. For `is_active` there are two values, so `true` might match 30M rows; following the index back to 30M scattered heap rows is random I/O, far slower than one sequential scan. The deciding factor is selectivity (what fraction of rows survive the predicate), not the mere presence of an index.

:::muted
**Trade-off** — A high-selectivity index turns a scan into a pinpoint lookup but costs storage and slows every write. A low-cardinality index is usually dead weight. The exception is a *rare, skewed* value — e.g. `status = 'failed'` at 0.1% of rows — where a plain or partial index is genuinely selective and worth keeping.
:::

:::muted
**Common pitfall** — Reflexively indexing every `WHERE` column and assuming "indexed = fast", then being baffled when `EXPLAIN` still shows a Seq Scan. Worse: forcing a low-cardinality index via a hint, which defeats the planner and produces millions of random heap fetches slower than the scan it overrode.
:::

*Go deeper — when would a partial index on `is_active` actually pay off, and how would you write it?*

**Keywords** — `selectivity · cardinality · B-tree O(log n) · random heap fetch · partial index`

### New answer (vi)
**Chốt** — Index chỉ giúp khi điều kiện có *selectivity* — khi nó thu hẹp kết quả xuống một phần rất nhỏ số dòng. `email` cardinality cao nên một match trả về một dòng; `is_active = true` khớp ~nửa bảng, nên planner bỏ qua index và quét — đúng đắn.

**Cơ chế** — B-tree là cây cân bằng đã sắp xếp, nên point lookup là `O(log n)` — vài lần đọc page thay vì 50 triệu. Với `email` gần như mọi giá trị đều duy nhất, lookup rơi đúng một dòng: thắng lớn. Với `is_active` chỉ hai giá trị, nên `true` có thể khớp 30 triệu dòng; đi từ index về 30 triệu heap row rải rác là random I/O, chậm hơn nhiều so với một sequential scan. Yếu tố quyết định là selectivity (bao nhiêu phần trăm dòng sống sót qua điều kiện), chứ không phải bản thân việc có index.

:::muted
**Trade-off** — Index selectivity cao biến phép quét thành lookup chính xác nhưng tốn storage và làm chậm mọi lần ghi. Index cardinality thấp thường là gánh nặng vô ích. Ngoại lệ là giá trị *hiếm và lệch* — ví dụ `status = 'failed'` chỉ 0.1% số dòng — khi đó index thường hoặc partial index thực sự có selectivity và đáng giữ.
:::

:::muted
**Bẫy thường gặp** — Phản xạ index mọi cột trong `WHERE` và mặc định "đã index = nhanh", rồi ngơ ngác khi `EXPLAIN` vẫn cho Seq Scan. Tệ hơn: ép dùng index cardinality thấp bằng query hint, vô hiệu hóa planner và tạo hàng triệu random heap fetch chậm hơn cả phép quét mà nó vừa ghi đè.
:::

*Đào sâu tiếp — khi nào một partial index trên `is_active` mới thật sự đáng giá, và bạn viết nó thế nào?*

**Từ khoá ăn điểm** — `selectivity · cardinality · B-tree O(log n) · random heap fetch · partial index`

## 1-card — senior — [Composite Index, Leftmost Prefix]
**Question:** You have a composite index on `(tenant_id, created_at)`. A report that filters only by `created_at` (no `tenant_id`) is doing a full table scan despite the index existing. Why can't it use the index, and what would you change?
**Verdict:** KEEP — Diagnose-and-redesign question on leftmost-prefix; invites real column-ordering trade-offs.

### New answer (en)
**TL;DR** — The leftmost-prefix rule: an index on `(tenant_id, created_at)` is sorted by `tenant_id` first, so `created_at` is only ordered *within* a tenant. Filtering on `created_at` alone has no contiguous range to seek, so the planner scans. Fix it with a separate index leading on `created_at`, or reorder the index.

**How it works** — A composite B-tree sorts by the concatenation of its columns in order: first `tenant_id`, then `created_at` within each tenant. Entries for one date are scattered across every tenant's block, so there is no single range for `created_at = X` by itself. An `(a, b)` index serves `a` or `a AND b`, never `b` alone. To make the report fast: add `(created_at)` (or `(created_at, tenant_id)` if it often filters tenant too), or if it always scans a date range across all tenants, reorder the existing index to lead with the more globally selective column.

:::muted
**Trade-off** — Column order is the core decision: equality / highest-selectivity column first, range column last so the tail can still range-scan. A second index fixes the report but adds write cost and storage — prefer reordering or covering multiple access patterns with one well-chosen index. `(tenant_id, created_at)` is perfect for "this tenant's recent rows" and useless for "all tenants on this date"; pick by which query is hot.
:::

:::muted
**Common pitfall** — Assuming an index "covers all its columns" in any combination, then being surprised the planner ignores it. Or leading with a low-selectivity / rarely-filtered column "because it feels primary", stranding the useful trailing column. Also watch an `ORDER BY` that doesn't match the index order/direction — it forces an extra sort that quietly negates the index.
:::

*Go deeper — if the report filters `created_at` AND occasionally `tenant_id`, which single index would you build and why?*

**Keywords** — `leftmost prefix · composite index · column order · range scan · covering`

### New answer (vi)
**Chốt** — Quy tắc leftmost-prefix: index `(tenant_id, created_at)` sắp theo `tenant_id` trước, nên `created_at` chỉ được sắp *bên trong* một tenant. Lọc riêng `created_at` không có dải liên tục để seek, nên planner phải quét. Sửa bằng một index riêng dẫn đầu bằng `created_at`, hoặc đảo lại thứ tự cột.

**Cơ chế** — Composite B-tree sắp theo phép ghép nối các cột theo thứ tự: trước `tenant_id`, rồi `created_at` trong từng tenant. Các entry cho một ngày nằm rải rác qua block của mọi tenant, nên không có dải liên tục nào cho riêng `created_at = X`. Index `(a, b)` phục vụ `a` hoặc `a AND b`, không bao giờ phục vụ riêng `b`. Để report nhanh: thêm `(created_at)` (hoặc `(created_at, tenant_id)` nếu cũng hay lọc tenant), hoặc nếu luôn quét một khoảng ngày qua mọi tenant, đảo index hiện có để dẫn đầu bằng cột có selectivity toàn cục cao hơn.

:::muted
**Trade-off** — Thứ tự cột là quyết định cốt lõi: cột equality / selectivity cao nhất lên trước, cột range đặt cuối để phần đuôi vẫn range-scan được. Index thứ hai khắc phục report nhưng tăng chi phí ghi và storage — ưu tiên đảo cột hoặc phủ nhiều access pattern bằng một index chọn khéo. `(tenant_id, created_at)` hoàn hảo cho "các dòng gần đây của tenant này" và vô dụng cho "mọi tenant trong ngày này"; chọn theo query nào là hot.
:::

:::muted
**Bẫy thường gặp** — Cho rằng index "phủ mọi cột của nó" theo bất kỳ tổ hợp nào, rồi ngạc nhiên khi planner bỏ qua. Hoặc dẫn đầu bằng cột selectivity thấp / ít khi lọc "vì cảm giác nó là chính", khiến cột đuôi hữu ích bị mắc kẹt. Cũng để ý `ORDER BY` không khớp thứ tự/chiều cột của index — nó ép thêm một bước sort âm thầm triệt tiêu lợi ích index.
:::

*Đào sâu tiếp — nếu report lọc `created_at` VÀ thỉnh thoảng cả `tenant_id`, bạn dựng một index duy nhất nào và vì sao?*

**Từ khoá ăn điểm** — `leftmost prefix · composite index · column order · range scan · covering`

## 2-card — senior — [Covering Index, Write Amplification]
**Question:** A hot endpoint runs `SELECT status, total FROM orders WHERE user_id = ?` millions of times a day. The index on `user_id` helps but the plan still shows heap fetches. A colleague suggests a "covering index" — what is it, and what's the cost of leaning on this trick everywhere?
**Verdict:** KEEP — Concept-plus-judgment: explains index-only scans and the write-amplification cost of overusing them.

### New answer (en)
**TL;DR** — A covering index includes every column the query needs, so it's answered entirely from index pages — an index-only scan with no heap fetch. Here `(user_id) INCLUDE (status, total)` or composite `(user_id, status, total)`. The cost of doing this everywhere is write amplification: each index is another copy to maintain on every write.

**How it works** — A plain secondary index finds matching rows fast, but reading columns not in the index needs a second random I/O back to the heap per row — the heap fetch in the plan. Putting `status` and `total` into the index means the query never touches the table: the index *covers* it. For a hot, narrow read this cuts I/O dramatically — it removes the random heap access and keeps the working set in a smaller, cache-friendly structure.

:::muted
**Trade-off** — Every index is a second copy of its columns, kept in sync on every INSERT/UPDATE/DELETE, so each one multiplies write cost — write amplification. Wide covering indexes are worse: they duplicate large columns, bloat, and consume cache. Cover only the few genuinely hot read paths, keep included columns narrow, and don't create a covering index per query; past a point the write/storage tax outweighs the read win.
:::

:::muted
**Common pitfall** — Adding indexes for every slow query and never removing old ones, ending with a dozen overlapping indexes whose writes dominate and which the planner never uses — audit with index-usage stats and drop dead ones. In Postgres an index-only scan still hits the heap if the visibility map is stale (rows not yet vacuumed), so the speedup quietly degrades on a write-heavy, under-vacuumed table.
:::

*Go deeper — how does the Postgres visibility map decide whether an index-only scan can skip the heap?*

**Keywords** — `index-only scan · INCLUDE · heap fetch · write amplification · visibility map`

### New answer (vi)
**Chốt** — Covering index bao gồm mọi cột query cần, nên query được trả lời hoàn toàn từ index page — một index-only scan, không heap fetch. Ở đây là `(user_id) INCLUDE (status, total)` hoặc composite `(user_id, status, total)`. Cái giá của việc lạm dụng khắp nơi là write amplification: mỗi index là một bản sao phải bảo trì ở mọi lần ghi.

**Cơ chế** — Một secondary index thường tìm nhanh các dòng khớp, nhưng đọc các cột không có trong index cần thêm một random I/O quay về heap cho mỗi dòng — chính là heap fetch trong plan. Đưa `status` và `total` vào index nghĩa là query không bao giờ chạm bảng: index *phủ* (cover) nó. Với một read hot và hẹp, điều này cắt I/O đáng kể — loại bỏ random heap access và giữ working set trong cấu trúc nhỏ, thân thiện cache.

:::muted
**Trade-off** — Mỗi index là một bản sao thứ hai của các cột của nó, đồng bộ ở mọi INSERT/UPDATE/DELETE, nên mỗi cái nhân chi phí ghi lên — write amplification. Covering index rộng còn tệ hơn: nhân đôi cột lớn, làm phình index, ngốn cache. Chỉ phủ vài read path thật sự hot, giữ các cột included thật hẹp, và đừng tạo một covering index cho mỗi query; quá một ngưỡng, thuế ghi/storage lấn át phần thắng đọc.
:::

:::muted
**Bẫy thường gặp** — Thêm index cho mọi query chậm và không bao giờ gỡ index cũ, cuối cùng có cả tá index chồng chéo mà phần ghi chiếm ưu thế còn planner không bao giờ dùng — audit bằng index-usage stats và drop những cái chết. Trong Postgres, index-only scan vẫn chạm heap nếu visibility map cũ (các dòng chưa được vacuum), nên cú tăng tốc âm thầm suy giảm trên bảng write-heavy thiếu vacuum.
:::

*Đào sâu tiếp — visibility map của Postgres quyết định một index-only scan có bỏ qua được heap hay không như thế nào?*

**Từ khoá ăn điểm** — `index-only scan · INCLUDE · heap fetch · write amplification · visibility map`

## 3-card — middle — [Query Plan, N+1]
**Question:** An endpoint that lists 50 orders with their customer name is slow. APM shows one `orders` query plus 50 tiny `customers` queries, and `EXPLAIN` on the orders query shows `Seq Scan`. Walk through reading the plan and fixing both problems.
**Verdict:** KEEP — Multi-step diagnosis (read a plan + spot N+1 + choose a batching strategy); scales with seniority.

### New answer (en)
**TL;DR** — Two separate problems: the `Seq Scan` means no usable index for the filter/join column (add one, it becomes an `Index Scan`), and the 50 `customers` queries are a classic N+1 from lazy-loading — fix it by batching into a JOIN or a single `IN (...)` fetch.

**How it works** — Read `EXPLAIN` from the innermost/most-indented node outward, where execution starts and rows flow up. A `Seq Scan` behind a selective `WHERE` is the first red flag: the planner read every page because no index matched. Use `EXPLAIN (ANALYZE, BUFFERS)` for *actual* rows and buffer reads, and compare estimated vs actual rows — a large gap means stale stats, fixed with `ANALYZE`. The 50 follow-up queries are the application-level N+1: the ORM lazy-loads each order's customer one round-trip at a time.

:::muted
**Trade-off** — Batch the N+1: a single `JOIN`, an `IN (...)` fetch of all customer ids, or the ORM's eager-load/dataloader, turning 51 round-trips into 1–2. A JOIN is usually fastest but can over-fetch or duplicate parent rows; a separate batched query keeps payloads clean and maps to a dataloader but adds a round-trip. At 50 rows a JOIN wins; for deeply nested graphs a per-level batched loader often scales better than one giant row-exploding join.
:::

:::muted
**Common pitfall** — N+1 hides in dev where data is tiny and latency near zero, then melts production — always test realistic row counts and watch query *count*, not just per-query time. Also: `EXPLAIN` without `ANALYZE` is only the planner's estimate, which can be wildly wrong on stale stats. And blindly indexing to kill a Seq Scan backfires if the predicate is low-selectivity — the planner keeps scanning and you've only added write overhead.
:::

*Go deeper — at what nesting depth does a JOIN stop being the right N+1 fix, and what replaces it?*

**Keywords** — `EXPLAIN ANALYZE · Seq Scan · N+1 · dataloader · estimated vs actual rows`

### New answer (vi)
**Chốt** — Hai vấn đề tách biệt: `Seq Scan` nghĩa là không có index dùng được cho cột filter/join (thêm vào, nó thành `Index Scan`), và 50 query `customers` là N+1 kinh điển do lazy-load — sửa bằng cách batch thành một JOIN hoặc một lần fetch `IN (...)`.

**Cơ chế** — Đọc `EXPLAIN` từ node trong cùng/thụt sâu nhất ra ngoài, nơi execution bắt đầu và các dòng chảy lên. `Seq Scan` sau một `WHERE` có selectivity là cờ đỏ đầu tiên: planner đọc mọi page vì không index nào khớp. Dùng `EXPLAIN (ANALYZE, BUFFERS)` để thấy số dòng *thực tế* và buffer read, so estimated với actual rows — chênh lớn nghĩa là stats cũ, sửa bằng `ANALYZE`. 50 query theo sau là N+1 ở tầng ứng dụng: ORM lazy-load customer của từng order, mỗi cái một round-trip.

:::muted
**Trade-off** — Batch N+1: một `JOIN`, một lần fetch `IN (...)` toàn bộ customer id, hoặc eager-load/dataloader của ORM, biến 51 round-trip thành 1–2. JOIN thường nhanh nhất nhưng có thể over-fetch hoặc nhân đôi dòng cha; query batch riêng giữ payload sạch và map vào dataloader nhưng thêm một round-trip. Ở 50 dòng JOIN thắng; với đồ thị lồng sâu, loader batch theo từng tầng thường scale tốt hơn một join khổng lồ làm nổ số dòng.
:::

:::muted
**Bẫy thường gặp** — N+1 ẩn mình ở dev nơi dữ liệu bé tí và latency gần bằng không, rồi tan chảy ở production — luôn test với số dòng thực tế và để mắt tới *số lượng* query, không chỉ thời gian mỗi query. Và: `EXPLAIN` không kèm `ANALYZE` chỉ là ước lượng của planner, có thể sai be bét khi stats cũ. Mù quáng thêm index để diệt Seq Scan phản tác dụng nếu điều kiện selectivity thấp — planner vẫn quét còn bạn chỉ thêm chi phí ghi.
:::

*Đào sâu tiếp — ở độ lồng nào thì JOIN không còn là cách sửa N+1 đúng nữa, và cái gì thay thế?*

**Từ khoá ăn điểm** — `EXPLAIN ANALYZE · Seq Scan · N+1 · dataloader · estimated vs actual rows`

## 4-card — middle — [OLTP vs OLAP, Column Store]
**Question:** The analytics team keeps running `SUM(amount) GROUP BY day` over the full 200M-row orders table on the production Postgres, and it's both slow and hurting checkout latency. Why is the row-store the wrong engine for this, and what would you stand up instead?
**Verdict:** KEEP — Engine-choice reasoning (OLTP vs OLAP, row vs column store) plus an isolation design decision.

### New answer (en)
**TL;DR** — A row-store is tuned for small point reads/writes, not full-table aggregations: reading two columns over 200M rows drags in every other column and floods the cache, evicting the pages checkout needs. Move analytics off the OLTP primary — to a read replica for light reporting, or a columnar warehouse for heavy scans.

**How it works** — OLTP stores a row's columns together, so fetching one order is one cheap page access. An aggregation needs only `amount` and `day` across all rows, but a row-store still reads whole pages, scanning the entire table. OLAP engines use a column-store: each column is stored contiguously and heavily compressed, so `SUM(amount)` reads only those two columns, scans far less, and vectorizes. Stop running analytics on the primary: a read replica for modest reporting, or a dedicated columnar warehouse (ClickHouse, BigQuery, Redshift, Snowflake) for heavy scans.

:::muted
**Trade-off** — A replica is cheap and near-real-time and isolates load, but it's the same row-store engine, so huge scans are still slow and you inherit replication lag. A columnar warehouse gives orders-of-magnitude faster aggregations and protects OLTP, but adds an ETL/CDC pipeline, data duplication, eventual-consistency lag, and ops cost. Decide by scan size and freshness need: replica for modest, latency-tolerant reporting; warehouse for terabyte-scale or interactive analytics.
:::

:::muted
**Common pitfall** — Running heavy analytics on the OLTP primary and letting one `GROUP BY` saturate I/O and cache, degrading customer latency — analytics should never share the hot path. With a warehouse, forgetting it's eventually consistent: dashboards lag by minutes, so never use it for "do we have stock right now". And a column-store is poor at single-row lookups and frequent updates, so it complements, never replaces, OLTP.
:::

*Go deeper — would you feed the warehouse via nightly ETL or streaming CDC, and what does that change about the dashboards?*

**Keywords** — `OLTP vs OLAP · row store vs column store · vectorization · CDC/ETL · read replica`

### New answer (vi)
**Chốt** — Row-store được tối ưu cho point read/write nhỏ, không phải aggregation toàn bảng: đọc hai cột trên 200 triệu dòng vẫn kéo theo mọi cột khác và làm ngập cache, đẩy ra những page mà checkout cần. Tách analytics khỏi OLTP primary — sang read replica cho báo cáo nhẹ, hoặc columnar warehouse cho scan nặng.

**Cơ chế** — OLTP lưu các cột của một dòng cạnh nhau, nên lấy một order là một lần truy cập page rẻ. Một aggregation chỉ cần `amount` và `day` trên mọi dòng, nhưng row-store vẫn đọc trọn page, quét cả bảng. OLAP engine dùng column-store: mỗi cột lưu liền nhau và nén mạnh, nên `SUM(amount)` chỉ đọc hai cột đó, quét ít hơn nhiều, và vectorize. Ngừng chạy analytics trên primary: read replica cho báo cáo vừa phải, hoặc columnar warehouse chuyên dụng (ClickHouse, BigQuery, Redshift, Snowflake) cho scan nặng.

:::muted
**Trade-off** — Replica rẻ, gần real-time, cô lập tải, nhưng cùng là row-store engine, nên scan thật lớn vẫn chậm và bạn thừa hưởng replication lag. Columnar warehouse cho aggregation nhanh hơn nhiều bậc và bảo vệ OLTP, nhưng thêm pipeline ETL/CDC, nhân đôi dữ liệu, lag eventual-consistency và chi phí vận hành. Quyết theo kích thước scan và nhu cầu freshness: replica cho báo cáo vừa, chịu được latency; warehouse cho analytics quy mô terabyte hoặc tương tác.
:::

:::muted
**Bẫy thường gặp** — Chạy analytics nặng trực tiếp trên OLTP primary và để một `GROUP BY` bão hòa I/O và cache, làm giảm latency phía khách hàng — analytics không bao giờ nên chia sẻ hot path. Với warehouse, quên rằng nó eventual consistent: dashboard trễ vài phút, nên đừng dùng cho "ngay bây giờ còn hàng không". Và column-store kém ở point lookup một dòng và update thường xuyên, nên nó bổ trợ chứ không thay thế OLTP.
:::

*Đào sâu tiếp — bạn nạp warehouse bằng ETL hằng đêm hay streaming CDC, và điều đó thay đổi gì ở dashboard?*

**Từ khoá ăn điểm** — `OLTP vs OLAP · row store vs column store · vectorization · CDC/ETL · read replica`

## 5-card — senior — [Sharding, Shard Key]
**Question:** You're sharding a multi-tenant orders database. One proposal is to shard by `order_id` hash, another by `tenant_id`. A few whale tenants generate 60% of traffic. Argue the shard-key choice and the failure you most fear.
**Verdict:** KEEP — Open design debate on shard-key trade-offs plus skew/hot-shard failure analysis; clearly senior-level.

### New answer (en)
**TL;DR** — Shard by `tenant_id` so the dominant per-tenant query hits a single shard and intra-tenant joins stay local — but because a few whales are 60% of traffic, address skew up front (composite `(tenant_id, order_id)` to sub-shard whales, or dedicated shards for the biggest). The failure I fear most is a hot shard.

**How it works** — The shard key should match how data is queried. Most order queries filter by tenant, so `tenant_id` keeps a tenant's data co-located: single-shard reads and local joins. Hashing by `order_id` spreads writes perfectly evenly but scatters a tenant's orders across every shard, turning the dominant per-tenant query into a scatter-gather. So `tenant_id` for locality — with skew mitigation, since one huge tenant on one shard is a hotspot.

:::muted
**Trade-off** — `tenant_id` gives locality and cheap intra-tenant joins but risks load imbalance from skewed tenants; hashing `order_id` gives near-perfect write distribution but makes per-tenant reads, joins, and ordering expensive scatter-gathers. No key is both perfectly even *and* perfectly local when access is tenant-centric and tenant sizes are skewed — you trade hotspot risk against fan-out cost, and getting it wrong is expensive to undo.
:::

:::muted
**Common pitfall** — The hot shard: one whale saturates a node's CPU/I/O while others idle, and you can't scale it out without re-sharding. Re-sharding a live hot shard means splitting and migrating terabytes while serving traffic — dual-writes, backfill, careful cutover. Cross-shard joins and distributed transactions are the other tax: any cross-shard query loses single-node ACID, so denormalize or restrict cross-shard access up front.
:::

*Go deeper — how would you migrate one whale tenant onto a dedicated shard with zero downtime?*

**Keywords** — `shard key · data locality · scatter-gather · hot shard · re-sharding · dual-write`

### New answer (vi)
**Chốt** — Shard theo `tenant_id` để query per-tenant chủ đạo chạm một shard và join nội-tenant vẫn local — nhưng vì vài cá voi chiếm 60% lưu lượng, xử lý skew ngay từ đầu (composite `(tenant_id, order_id)` để sub-shard cá voi, hoặc shard riêng cho các tenant lớn nhất). Failure tôi sợ nhất là hot shard.

**Cơ chế** — Shard key nên khớp cách dữ liệu được truy vấn. Phần lớn query order lọc theo tenant, nên `tenant_id` giữ dữ liệu một tenant cùng chỗ: read single-shard và join local. Hash theo `order_id` rải write cực đều nhưng phân tán order của một tenant qua mọi shard, biến query per-tenant chủ đạo thành scatter-gather. Vậy chọn `tenant_id` để có locality — kèm giảm thiểu skew, vì một tenant khổng lồ trên một shard là hotspot.

:::muted
**Trade-off** — `tenant_id` cho locality và join nội-tenant rẻ nhưng nguy cơ mất cân bằng tải do tenant lệch; hash `order_id` cho phân phối write gần hoàn hảo nhưng biến read, join, ordering per-tenant thành scatter-gather đắt. Không key nào vừa hoàn toàn đều *vừa* hoàn toàn local khi access lấy tenant làm trung tâm và kích thước tenant lệch — bạn đánh đổi nguy cơ hotspot lấy chi phí fan-out, và chọn sai rất đắt để sửa.
:::

:::muted
**Bẫy thường gặp** — Hot shard: một cá voi bão hòa CPU/I/O của một node trong khi các node khác nhàn, và bạn không scale nó ra được mà không re-shard. Re-shard một hot shard đang sống nghĩa là tách và migrate hàng terabyte khi vẫn phục vụ traffic — dual-write, backfill, cutover cẩn thận. Cross-shard join và distributed transaction là khoản thuế còn lại: mọi query cross-shard mất single-node ACID, nên denormalize hoặc hạn chế access cross-shard ngay từ đầu.
:::

*Đào sâu tiếp — bạn migrate một tenant cá voi sang shard riêng với zero downtime như thế nào?*

**Từ khoá ăn điểm** — `shard key · data locality · scatter-gather · hot shard · re-sharding · dual-write`

## 6-card — senior — [MVCC, Vacuum]
**Question:** On Postgres, a reporting job opens a transaction and runs for two hours. During that window table sizes balloon and write performance degrades across the whole DB. Explain the MVCC mechanism behind both the "readers don't block writers" benefit and this bloat problem.
**Verdict:** KEEP — Deep mechanism question linking MVCC snapshots to both the benefit and the bloat failure mode; strongly senior.

### New answer (en)
**TL;DR** — MVCC keeps multiple row versions and each transaction reads a snapshot, so readers never block writers — but VACUUM can't reclaim any dead tuple newer than the oldest running snapshot. A two-hour transaction pins that horizon, so dead rows pile up DB-wide and everything bloats.

**How it works** — Under MVCC an UPDATE doesn't overwrite in place; it writes a new version and marks the old one valid only up to a transaction id. Each transaction reads against a snapshot — the versions visible as of its start — so a reader sees a consistent point-in-time view and never waits on a writer, and vice versa: snapshot isolation. The cost is that obsolete (dead) tuples must be physically removed later by a background process — VACUUM — once no snapshot can still see them.

:::muted
**Trade-off** — MVCC buys concurrency and consistent reads at the price of storage churn and continuous cleanup: every update/delete leaves a dead tuple VACUUM must reclaim. Aggressive autovacuum keeps tables tight but spends CPU/I/O; lazy autovacuum saves resources but risks bloat. Versus a lock-based in-place engine, MVCC avoids read/write contention but you must budget for vacuum and accept space is reclaimed asynchronously.
:::

:::muted
**Common pitfall** — The long transaction is the classic killer: VACUUM can't remove dead tuples newer than the oldest snapshot, so for two hours dead rows pile up DB-wide, tables and indexes bloat, scans read more pages, write latency climbs. An idle-in-transaction connection does the same damage doing no work. In the extreme it threatens transaction-id wraparound, which can force the DB read-only. Defenses: short transactions, report on a replica, statement/idle-transaction timeouts, and monitor the oldest transaction (`xmin` horizon).
:::

*Go deeper — how does the `xmin` horizon translate into VACUUM deciding a specific tuple is safe to remove?*

**Keywords** — `MVCC · snapshot isolation · dead tuple · VACUUM · xmin horizon · txid wraparound`

### New answer (vi)
**Chốt** — MVCC giữ nhiều version dòng và mỗi transaction đọc một snapshot, nên reader không bao giờ block writer — nhưng VACUUM không thể thu hồi bất kỳ dead tuple nào mới hơn snapshot đang chạy lâu đời nhất. Transaction hai tiếng ghim chân trời đó, nên dead row chất đống trên toàn DB và mọi thứ bloat.

**Cơ chế** — Dưới MVCC, một UPDATE không ghi đè tại chỗ; nó ghi một version mới và đánh dấu version cũ chỉ hợp lệ tới một transaction id. Mỗi transaction đọc theo một snapshot — các version nhìn thấy tính từ lúc nó bắt đầu — nên reader thấy góc nhìn nhất quán tại một thời điểm và không bao giờ chờ writer, và ngược lại: snapshot isolation. Cái giá là các tuple lỗi thời (chết) phải được xóa vật lý về sau bởi một tiến trình nền — VACUUM — một khi không snapshot nào còn nhìn thấy chúng.

:::muted
**Trade-off** — MVCC đổi lấy concurrency và read nhất quán bằng cái giá storage churn và dọn dẹp liên tục: mỗi update/delete để lại một dead tuple VACUUM phải thu hồi. Autovacuum quyết liệt giữ bảng gọn nhưng tốn CPU/I/O; autovacuum lười tiết kiệm tài nguyên nhưng rủi ro bloat. So với lock-based engine update tại chỗ, MVCC tránh tranh chấp read/write nhưng bạn phải dự trù cho vacuum và chấp nhận không gian được thu hồi bất đồng bộ.
:::

:::muted
**Bẫy thường gặp** — Transaction dài là sát thủ kinh điển: VACUUM không thể xóa dead tuple mới hơn snapshot lâu đời nhất, nên suốt hai tiếng dead row chất đống toàn DB, bảng và index bloat, scan đọc nhiều page hơn, write latency leo thang. Một connection idle-in-transaction gây thiệt hại y hệt mà chẳng làm gì. Ở mức cực đoan nó đe dọa transaction-id wraparound, có thể buộc DB về read-only. Phòng thủ: transaction ngắn, báo cáo trên replica, timeout statement/idle-transaction, và theo dõi transaction lâu đời nhất (chân trời `xmin`).
:::

*Đào sâu tiếp — chân trời `xmin` chuyển thành việc VACUUM quyết một tuple cụ thể an toàn để xóa như thế nào?*

**Từ khoá ăn điểm** — `MVCC · snapshot isolation · dead tuple · VACUUM · xmin horizon · txid wraparound`

## 7-card — staff — [Read Scaling, CQRS]
**Question:** You own the data layer for a product page that serves 100k reads/sec against a write rate 100x lower. Walk through how you'd architect for reads — indexing, denormalization, caching, replicas, CQRS — and where each layer can bite you.
**Verdict:** KEEP — Open-ended staff-level architecture walk-through with layered trade-offs and operational failure modes.

### New answer (en)
**TL;DR** — Layer defenses in front of the primary by access pattern: cover the hot query with an index, denormalize into a read model, cache aggressively (Redis/CDN absorbs most of 100k rps), scale out with read replicas, and only formalize to CQRS when needed. Each layer buys throughput with a consistency/staleness budget — spend it where users won't notice.

**How it works** — Start from the read shape. First, index for the exact query (covering index → index-only reads). Second, denormalize: precompute the page's joined view into a read model so a request is one keyed lookup. Third, cache — an in-memory/Redis cache or CDN absorbs the bulk of 100k rps, DB fills on miss. Fourth, read replicas spread residual reads off the write-only primary. At the far end, CQRS: the write side keeps the normalized source of truth, a separate denormalized read store (built via CDC/events) is shaped purely for queries.

:::muted
**Trade-off** — Every layer trades freshness and complexity for throughput. Caches and replicas add staleness and replication lag; read models and CQRS add eventual consistency and duplicated data to rebuild on change; more indexes speed reads but tax the rare writes. Match each read's staleness tolerance to the cheapest layer that satisfies it — a description tolerates seconds of TTL, "in stock right now" may need the primary. You buy read scale with a consistency budget.
:::

:::muted
**Common pitfall** — The dangerous failures are operational. A thundering herd on hot-key expiry can dump 100k rps onto the DB at once — mitigate with request coalescing, jittered TTLs, stale-while-revalidate. Read-your-own-write breaks when a user writes the primary then reads a lagging replica or stale cache — route post-write reads to the primary or invalidate synchronously. CQRS adds an async pipeline that can lag silently — monitor lag, replay, idempotent projections. And over-engineering is itself a failure: if a well-indexed primary plus a cache meets the SLO, replicas and CQRS just buy consistency bugs.
:::

*Go deeper — which specific reads on this product page would you allow to be stale, and which must always hit the primary?*

**Keywords** — `CQRS · read replica · cache stampede · read-your-own-write · CDC · stale-while-revalidate`

### New answer (vi)
**Chốt** — Xếp lớp phòng thủ trước primary theo access pattern: phủ query hot bằng index, denormalize vào một read model, cache mạnh tay (Redis/CDN hấp thụ phần lớn 100k rps), scale ngang bằng read replica, và chỉ chính thức hóa thành CQRS khi cần. Mỗi tầng mua throughput bằng một ngân sách consistency/staleness — tiêu nó ở nơi người dùng không nhận ra.

**Cơ chế** — Bắt đầu từ hình dạng read. Trước hết, index theo đúng query (covering index → read index-only). Thứ hai, denormalize: tính sẵn view đã join của trang vào một read model để một request là một keyed lookup. Thứ ba, cache — một cache in-memory/Redis hoặc CDN hấp thụ phần lớn 100k rps, DB fill khi miss. Thứ tư, read replica rải phần read còn lại khỏi primary vốn chỉ còn lo write. Ở đầu xa, CQRS: phía write giữ source of truth chuẩn hóa, một read store denormalize riêng (dựng qua CDC/event) định hình thuần cho query.

:::muted
**Trade-off** — Mỗi tầng đánh đổi freshness và độ phức tạp lấy throughput. Cache và replica thêm staleness và replication lag; read model và CQRS thêm eventual consistency và dữ liệu trùng lặp phải dựng lại khi nguồn đổi; nhiều index làm read nhanh nhưng đánh thuế lên các write hiếm. Khớp mức chịu staleness của mỗi read với tầng rẻ nhất thỏa mãn nó — mô tả chịu được vài giây TTL, "còn hàng ngay lúc này" có thể cần primary. Bạn mua read scale bằng ngân sách consistency.
:::

:::muted
**Bẫy thường gặp** — Các failure nguy hiểm là về vận hành. Thundering herd khi hot-key hết hạn có thể đổ trọn 100k rps lên DB cùng lúc — giảm thiểu bằng request coalescing, TTL có jitter, stale-while-revalidate. Read-your-own-write vỡ khi user ghi primary rồi đọc replica trễ hoặc cache cũ — route read sau ghi về primary hoặc invalidate đồng bộ. CQRS thêm một async pipeline có thể lag âm thầm — monitor lag, replay, projection idempotent. Và over-engineering bản thân là một failure: nếu một primary index tốt cộng một cache đã đạt SLO, replica và CQRS chỉ mua thêm bug consistency.
:::

*Đào sâu tiếp — những read cụ thể nào trên trang sản phẩm này bạn cho phép cũ, và những read nào phải luôn chạm primary?*

**Từ khoá ăn điểm** — `CQRS · read replica · cache stampede · read-your-own-write · CDC · stale-while-revalidate`
