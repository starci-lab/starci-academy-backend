# 1-system-design-mastery / 5-search-and-feed
Summary: kept 8, delete 0 of 8

## 0-card — staff — [Search]
**Question:** Fanout-on-write vs fanout-on-read for a social news feed — explain the celebrity-user (hot account) problem and exactly how hybrid fanout solves it.
**Verdict:** KEEP — Open-ended write/read trade-off with a real hot-key design problem and a multi-part solution; scales clearly junior→staff.

### New answer (en)
**TL;DR** — Push (fanout-on-write) pre-builds each follower's timeline for O(1) reads but explodes on celebrities; pull (fanout-on-read) assembles the feed at read time with no write amplification but O(N-followees) reads. Hybrid uses push for normal accounts and pull for celebrities, merging both at read time.

**How it works** — Push writes the new post ID into every follower's timeline on publish, so a read is a single timeline fetch. A celebrity with 50 M followers turns one post into 50 M writes, degrading the shared write path for everyone. Pull instead fetches recent posts from all followees at read time — no write fanout, but a user following 1 000 accounts pays 1 000 lookups per feed load. Hybrid classifies accounts: normal users keep push (fast reads), celebrities switch to pull, and at read time you merge the pre-built push timeline with a small pull query for the handful of celebrities followed.

:::muted
**Trade-off** — You now maintain a "celebrity" classification (follower-count threshold), handle accounts crossing it, and merge two result sets within a few ms. Celebrity posts are usually served from a dedicated hot-account cache rather than the main DB to keep the read-time merge fast.
:::

:::muted
**Common pitfall** — The threshold is static but accounts cross it dynamically. While the system is switching an account from push to pull, posts can be both pushed to existing followers and pulled at read time — producing duplicates. Add a grace period and a dedup step in feed assembly.
:::

*Go deeper — how would you keep an account that is mid-transition (just crossed the celebrity threshold) consistent without showing duplicate or missing posts?*

**Keywords** — `fanout-on-write/push` · `fanout-on-read/pull` · `write amplification` · `hybrid fanout` · `hot-account cache` · `dedup`

### New answer (vi)
**Chốt** — Push (fanout-on-write) dựng sẵn timeline cho từng follower nên read O(1) nhưng bùng nổ với celebrity; pull (fanout-on-read) ghép feed lúc đọc, không write amplification nhưng read O(N-followee). Hybrid dùng push cho tài khoản thường và pull cho celebrity, merge cả hai lúc đọc.

**Cơ chế** — Push ghi post ID vào timeline của mọi follower lúc đăng, nên một read chỉ là một lần fetch timeline. Celebrity 50 M follower biến một bài thành 50 M write, làm degrade write path dùng chung cho tất cả. Pull thay vào đó fetch post gần đây từ mọi followee lúc đọc — không write fanout, nhưng người dùng follow 1 000 tài khoản trả 1 000 lookup mỗi lần load feed. Hybrid phân loại tài khoản: user thường giữ push (read nhanh), celebrity chuyển sang pull, và lúc đọc bạn merge timeline push dựng sẵn với một pull query nhỏ cho số ít celebrity được follow.

:::muted
**Trade-off** — Bạn phải duy trì phân loại "celebrity" (ngưỡng follower count), xử lý tài khoản vượt ngưỡng, và merge hai result set trong vài ms. Celebrity post thường được phục vụ từ hot-account cache riêng thay vì main DB để giữ merge lúc đọc đủ nhanh.
:::

:::muted
**Bẫy thường gặp** — Ngưỡng được định nghĩa tĩnh nhưng tài khoản vượt ngưỡng động. Trong lúc hệ thống chuyển một account từ push sang pull, bài có thể vừa được push cho follower hiện tại vừa được pull lúc đọc — gây duplicate. Thêm grace period và bước dedup trong feed assembly.
:::

*Đào sâu tiếp — bạn giữ một account đang chuyển trạng thái (vừa vượt ngưỡng celebrity) nhất quán thế nào để không hiện post duplicate hay thiếu?*

**Từ khoá ăn điểm** — `fanout-on-write/push` · `fanout-on-read/pull` · `write amplification` · `hybrid fanout` · `hot-account cache` · `dedup`

## 1-card — senior — [Search]
**Question:** Describe how an inverted index works. What is the core data structure and what makes it efficient for full-text search at the cost of what write-time operation?
**Verdict:** KEEP — Requires explaining a data structure, its read/write trade-off, and a real idempotency failure mode; clear seniority scaling.

### New answer (en)
**TL;DR** — An inverted index maps each term to a posting list of the documents containing it (`{term → [doc_id, positions]}`), making reads fast by turning a query into list lookups and intersections — at the cost of write-time tokenisation and posting-list updates on every document.

**How it works** — A forward index is `{doc_id → content}`; the inverted index flips it to `{term → [doc_ids]}`. For "distributed systems" you fetch the posting lists for "distributed" and "systems", intersect them (AND), then rank by TF-IDF or BM25. Reads are efficient because each term lookup is O(1) in a hash/B-tree and intersection is linear in the smaller posting list. The write cost: every document must be tokenised and normalised (lowercase, stemming) and each term inserted into its posting list. That is why Lucene/Elasticsearch is write-heavy and batches writes into immutable segments that are merged periodically (LSM-tree-like segment merge).

:::muted
**Trade-off** — Read-optimised but write-amplified: one document can touch thousands of posting lists. Elasticsearch buffers writes in memory and only makes them searchable on refresh (default 1 s) — the "near real-time" trade-off. Setting `refresh_interval: -1` during bulk indexing speeds ingestion 5–10× but documents stay unsearchable until a manual refresh.
:::

:::muted
**Common pitfall** — Indexing the same document repeatedly (at-least-once delivery from a CDC pipeline) without a stable ID — Elasticsearch creates a new doc per delivery and bloats the index. Always pass an explicit `_id` (the source primary key) so re-indexing is an idempotent upsert, not an insert.
:::

*Go deeper — what changes in the posting list to support phrase queries ("distributed systems" as a phrase, not two AND terms)?*

**Keywords** — `posting list` · `inverted vs forward index` · `tokenisation/stemming` · `segment merge` · `refresh_interval` · `idempotent _id`

### New answer (vi)
**Chốt** — Inverted index ánh xạ mỗi term sang posting list các document chứa nó (`{term → [doc_id, positions]}`), làm read nhanh vì biến query thành lookup và intersection — với cái giá là tokenisation và cập nhật posting list ở write-time cho mỗi document.

**Cơ chế** — Forward index là `{doc_id → content}`; inverted index lật lại thành `{term → [doc_ids]}`. Với "distributed systems" bạn fetch posting list cho "distributed" và "systems", intersect (AND), rồi rank theo TF-IDF hoặc BM25. Read hiệu quả vì mỗi term lookup là O(1) trong hash/B-tree và intersection tuyến tính theo posting list nhỏ hơn. Chi phí write: mỗi document phải tokenise và normalise (lowercase, stemming) và chèn mỗi term vào posting list của nó. Đó là lý do Lucene/Elasticsearch write-heavy và batch write vào segment bất biến, merge định kỳ (segment merge kiểu LSM-tree).

:::muted
**Trade-off** — Tối ưu read nhưng write-amplified: một document có thể chạm hàng nghìn posting list. Elasticsearch buffer write trong memory và chỉ cho searchable lúc refresh (mặc định 1 s) — đánh đổi "near real-time". Set `refresh_interval: -1` lúc bulk index tăng tốc ingestion 5–10× nhưng document không searchable cho đến khi refresh thủ công.
:::

:::muted
**Bẫy thường gặp** — Index cùng document nhiều lần (at-least-once từ pipeline CDC) mà không có ID ổn định — Elasticsearch tạo doc mới mỗi lần và làm bloat index. Luôn truyền `_id` rõ ràng (primary key nguồn) để re-index là upsert idempotent, không phải insert.
:::

*Đào sâu tiếp — posting list cần thêm gì để hỗ trợ phrase query ("distributed systems" như một cụm, không phải hai term AND)?*

**Từ khoá ăn điểm** — `posting list` · `inverted vs forward index` · `tokenisation/stemming` · `segment merge` · `refresh_interval` · `idempotent _id`

## 2-card — senior — [Search]
**Question:** You need autocomplete for a search box with sub-50 ms response time, handling 10 k QPS globally. Compare trie in-memory vs Elasticsearch prefix query vs pre-computed suggestion list approaches.
**Verdict:** KEEP — Constraint-driven design comparison of three approaches with explicit latency/QPS budgets and a real anti-pattern.

### New answer (en)
**TL;DR** — Under a 50 ms / 10 k QPS budget, autocomplete must live on a dedicated low-latency path: an in-memory trie (or FST) gives the fastest reads, a pre-computed `prefix → suggestions` cache in Redis is sub-ms for short prefixes, and Elasticsearch's completion suggester is convenient but its cluster round-trip is tight at p99. Most systems blend them.

**How it works** — (1) Trie in-memory: built from the top-N popular queries, prefix lookup is O(prefix length), sub-ms after warm-up; cons are memory footprint and periodic rebuild (not real-time). (2) Elasticsearch completion/prefix suggester: a `completion` field backed by an FST (Finite State Transducer) does fast prefix matching; cons are the ~10–20 ms cluster round-trip, which is tight against a 50 ms p99 SLO. (3) Pre-computed suggestion lists: an offline job computes top-K for every 1–3 char prefix and stores `prefix → [suggestions]` in Redis, so a read is one GET (<1 ms); cons are combinatorial key explosion beyond short prefixes and no long-tail coverage.

:::muted
**Trade-off** — Trie has the best read latency but goes stale between rebuilds; pre-computed prefixes are fastest but miss personalised/trending suggestions; Elasticsearch is fresher and flexible but adds infra cost and latency. A common production blend serves pre-computed popular prefixes from Redis (≈80% of traffic) and falls back to Elasticsearch for the rest.
:::

:::muted
**Common pitfall** — Serving autocomplete from the main full-text search index — one query per keystroke. Typing "syst" fires a full-text query every ~250 ms; at 10 k concurrent users that is ~40 k QPS on the search cluster from typeahead alone. Autocomplete must be a separate path, never the main search query.
:::

*Go deeper — how would you fold in personalisation and trending queries without losing the sub-ms read on the hot path?*

**Keywords** — `trie/FST` · `completion suggester` · `pre-computed prefix → suggestions` · `p99 latency budget` · `dedicated low-latency path`

### New answer (vi)
**Chốt** — Với budget 50 ms / 10 k QPS, autocomplete phải nằm trên một path low-latency riêng: trie in-memory (hoặc FST) cho read nhanh nhất, cache `prefix → suggestions` dựng sẵn trong Redis dưới mili-giây cho prefix ngắn, còn completion suggester của Elasticsearch tiện nhưng round-trip cluster bị tight ở p99. Hầu hết hệ thống blend cả ba.

**Cơ chế** — (1) Trie in-memory: build từ top-N query phổ biến, prefix lookup O(độ dài prefix), dưới mili-giây sau warm-up; nhược điểm là footprint memory và rebuild định kỳ (không real-time). (2) Elasticsearch completion/prefix suggester: field `completion` dựa trên FST (Finite State Transducer) match prefix nhanh; nhược điểm là round-trip cluster ~10–20 ms, tight với SLO p99 50 ms. (3) Pre-computed suggestion list: job offline tính top-K cho mọi prefix 1–3 ký tự và lưu `prefix → [suggestions]` trong Redis, nên read là một GET (<1 ms); nhược điểm là bùng nổ tổ hợp key ngoài prefix ngắn và không phủ long-tail.

:::muted
**Trade-off** — Trie có read latency tốt nhất nhưng stale giữa các lần rebuild; pre-computed prefix nhanh nhất nhưng thiếu personalised/trending; Elasticsearch tươi hơn và linh hoạt nhưng thêm infra cost và latency. Blend production phổ biến: phục vụ pre-computed popular prefix từ Redis (≈80% traffic) và fallback Elasticsearch cho phần còn lại.
:::

:::muted
**Bẫy thường gặp** — Phục vụ autocomplete từ main full-text search index — một query mỗi keystroke. Gõ "syst" bắn full-text query mỗi ~250 ms; ở 10 k user đồng thời đó là ~40 k QPS lên search cluster chỉ từ typeahead. Autocomplete phải là path riêng, không bao giờ là main search query.
:::

*Đào sâu tiếp — bạn lồng personalisation và trending query vào thế nào mà không mất read dưới mili-giây trên hot path?*

**Từ khoá ăn điểm** — `trie/FST` · `completion suggester` · `pre-computed prefix → suggestions` · `p99 latency budget` · `dedicated low-latency path`

## 3-card — senior — [Search]
**Question:** How does pagination at scale differ from simple OFFSET/LIMIT queries, and what specific problem does cursor-based pagination solve?
**Verdict:** KEEP — Diagnoses an O(offset) performance cliff and the stability problem cursors solve, with a real indexing pitfall.

### New answer (en)
**TL;DR** — `OFFSET N LIMIT k` makes the DB scan and discard N rows before returning k, an O(offset) cost that collapses on deep pages. Cursor (keyset) pagination replaces the offset with the last-seen value (`WHERE id > last_seen_id ORDER BY id LIMIT k`), so it uses the index to jump straight to the start position and stays stable as data changes.

**How it works** — At page 10 000 (offset 100 000), `OFFSET 100000 LIMIT 10` reads 100 010 rows to return 10 — cost grows with depth. Keyset pagination sends a cursor (e.g. `last_seen_id` or `last_seen_timestamp`) and filters `WHERE id > cursor ORDER BY id LIMIT k`, which is an indexed seek — effectively O(1) to locate the start. It is also stable: inserts/deletes between page loads don't shift an absolute offset, so you never skip or duplicate rows the way offset pagination does when the underlying data changes.

:::muted
**Trade-off** — Cursors give up random access — you can't "jump to page 50", only walk forward/back. They also require a unique sort key or a tie-breaker (composite cursor like `timestamp + id`). Offset pagination is simpler and allows page jumps, which is fine for small, stable datasets.
:::

:::muted
**Common pitfall** — Using a cursor on a non-indexed sort column: `WHERE created_at > cursor ORDER BY created_at` still does a full scan to locate the cursor. The cursor column must be indexed — add a composite index on `(created_at, id)` so it covers both the filter and the deterministic sort.
:::

*Go deeper — how do you build a stable cursor when the sort key (e.g. a relevance score) is neither unique nor monotonic?*

**Keywords** — `OFFSET/LIMIT O(offset)` · `keyset/cursor pagination` · `last_seen_id` · `composite cursor (timestamp + id)` · `covering index`

### New answer (vi)
**Chốt** — `OFFSET N LIMIT k` bắt DB scan và discard N row trước khi trả k, chi phí O(offset) sụp đổ ở trang sâu. Cursor (keyset) pagination thay offset bằng giá trị thấy cuối cùng (`WHERE id > last_seen_id ORDER BY id LIMIT k`), nên dùng index nhảy thẳng tới vị trí bắt đầu và ổn định khi data thay đổi.

**Cơ chế** — Ở trang 10 000 (offset 100 000), `OFFSET 100000 LIMIT 10` đọc 100 010 row để trả 10 — chi phí tăng theo độ sâu. Keyset pagination gửi cursor (vd `last_seen_id` hoặc `last_seen_timestamp`) và filter `WHERE id > cursor ORDER BY id LIMIT k`, một indexed seek — gần như O(1) để định vị start. Nó cũng ổn định: insert/delete giữa các lần load không làm lệch offset tuyệt đối, nên bạn không bao giờ bỏ qua hay duplicate row như offset pagination khi data thay đổi.

:::muted
**Trade-off** — Cursor bỏ random access — không "nhảy tới trang 50" được, chỉ đi tiến/lùi. Nó cũng đòi sort key unique hoặc tie-breaker (composite cursor như `timestamp + id`). Offset pagination đơn giản hơn và cho nhảy trang, ổn cho dataset nhỏ, ổn định.
:::

:::muted
**Bẫy thường gặp** — Dùng cursor trên sort column không index: `WHERE created_at > cursor ORDER BY created_at` vẫn full scan để định vị cursor. Cursor column phải được index — thêm composite index `(created_at, id)` để phủ cả filter lẫn sort xác định.
:::

*Đào sâu tiếp — bạn dựng cursor ổn định thế nào khi sort key (vd relevance score) vừa không unique vừa không đơn điệu?*

**Từ khoá ăn điểm** — `OFFSET/LIMIT O(offset)` · `keyset/cursor pagination` · `last_seen_id` · `composite cursor (timestamp + id)` · `covering index`

## 4-card — senior — [Search]
**Question:** In a ranking system, what is TF-IDF and why does BM25 replace it in modern search engines?
**Verdict:** KEEP — Concept + the precise reason one model replaces another, with a real evaluation pitfall; scales junior→senior.

### New answer (en)
**TL;DR** — TF-IDF scores a term by how often it appears in a document (TF) times how rare it is across the corpus (IDF), but its TF grows unbounded. BM25 fixes that with TF saturation and document-length normalisation, which is why it's the default in Lucene/Elasticsearch and beats TF-IDF on most benchmarks.

**How it works** — TF-IDF = TF × IDF, where IDF = log(N / df) (N = total docs, df = docs containing the term), so rare terms weigh more. The flaw: TF has no saturation — a term appearing 1 000 times scores ~1 000× one appearance, even though the 1 000th hit adds almost no relevance. BM25 (Okapi BM25) adds (1) TF saturation — a curve that caps the TF contribution, tuned by `k1` (typically 1.2–2.0); and (2) length normalisation — a short doc with one mention can outscore a long doc with the same count, tuned by `b` (typically 0.75).

:::muted
**Trade-off** — BM25 is still lexical: "automobile" and "car" are unrelated tokens. Semantic recall needs dense vector embeddings + cosine similarity. Modern systems run hybrid search — BM25 for keyword precision plus vector search for semantic recall — fused with Reciprocal Rank Fusion (RRF).
:::

:::muted
**Common pitfall** — Tuning `k1`/`b` without a human-relevance-annotated test set. Defaults are fine on average, but domain corpora (medical, legal, code) often need different saturation/length settings — optimise against NDCG or MAP on labelled queries, not by feel.
:::

*Go deeper — concretely, how would you combine BM25 and vector scores into one ranked list, and why RRF over a simple weighted sum?*

**Keywords** — `TF-IDF` · `IDF = log(N/df)` · `BM25 k1 / b` · `TF saturation` · `length normalisation` · `RRF / hybrid search` · `NDCG/MAP`

### New answer (vi)
**Chốt** — TF-IDF chấm một term bằng tần suất xuất hiện trong document (TF) nhân độ hiếm trong corpus (IDF), nhưng TF tăng không giới hạn. BM25 sửa điều đó bằng TF saturation và length normalisation, đó là lý do nó là mặc định trong Lucene/Elasticsearch và vượt TF-IDF trên hầu hết benchmark.

**Cơ chế** — TF-IDF = TF × IDF, với IDF = log(N / df) (N = tổng doc, df = doc chứa term), nên term hiếm nặng hơn. Khuyết điểm: TF không saturation — term xuất hiện 1 000 lần score ~1 000× một lần, dù lần thứ 1 000 gần như không thêm relevance. BM25 (Okapi BM25) thêm (1) TF saturation — đường cong giới hạn đóng góp của TF, tune bằng `k1` (thường 1.2–2.0); và (2) length normalisation — doc ngắn với một mention có thể score cao hơn doc dài cùng count, tune bằng `b` (thường 0.75).

:::muted
**Trade-off** — BM25 vẫn lexical: "automobile" và "car" là token không liên quan. Semantic recall cần dense vector embedding + cosine similarity. Hệ thống hiện đại chạy hybrid search — BM25 cho keyword precision cộng vector search cho semantic recall — fuse bằng Reciprocal Rank Fusion (RRF).
:::

:::muted
**Bẫy thường gặp** — Tune `k1`/`b` mà không có test set annotate relevance bởi người. Mặc định ổn trung bình, nhưng corpus theo domain (y tế, pháp lý, code) thường cần saturation/length khác — tối ưu theo NDCG hoặc MAP trên query gán nhãn, không theo cảm tính.
:::

*Đào sâu tiếp — cụ thể bạn kết hợp BM25 và vector score vào một danh sách rank thế nào, và tại sao RRF thay vì weighted sum đơn giản?*

**Từ khoá ăn điểm** — `TF-IDF` · `IDF = log(N/df)` · `BM25 k1 / b` · `TF saturation` · `length normalisation` · `RRF / hybrid search` · `NDCG/MAP`

## 5-card — staff — [Search]
**Question:** A social media feed has to merge posts from 1 000 followees, ranked by a score. What is the N-way merge algorithm and how do you do it efficiently at sub-100 ms?
**Verdict:** KEEP — Algorithm + latency-budget engineering + a memory-blowup failure mode; genuinely staff-level.

### New answer (en)
**TL;DR** — Use a heap-based N-way merge of pre-sorted per-followee timelines: seed a heap with the top post from each list, repeatedly pop the best and push that followee's next post until you have K results. The bottleneck isn't the merge — it's the 1 000 reads, which you must parallelise (Redis pipeline) to stay under 100 ms.

**How it works** — Each followee's timeline is pre-sorted reverse-chronologically in a Redis sorted set (`ZREVRANGE`, O(1) to grab the head). (1) Fetch the top post from each of the 1 000 followees; (2) push each into a heap keyed by score/timestamp; (3) pop the max into the result; (4) fetch the next post from that followee and push it; (5) repeat to K. Heap ops are O(log N) with N = 1 000, so K results cost O(K log 1000) ≈ O(10K) — the merge itself is negligible.

:::muted
**Trade-off** — The real cost is the 1 000 reads in step 1. Issue them sequentially and you blow the budget; pipeline/fan them out in parallel and 1 000 lookups land in ~5–10 ms, leaving the ~10–20 ms merge and ~80 ms for rendering inside a 100 ms SLO.
:::

:::muted
**Common pitfall** — Over-fetching per followee for re-ranking — e.g. 100 posts × 1 000 followees = 100 k posts (50–100 MB) loaded per request. Cap per-followee fetch to ~10–20 posts and rely on the heap's score ordering plus pruning to still surface the best results.
:::

*Go deeper — if posts must be re-ranked by an ML model (not just score/time), where does that model run in this pipeline without breaking the 100 ms budget?*

**Keywords** — `N-way merge` · `min/max-heap` · `ZREVRANGE` · `Redis pipeline/fan-out` · `O(K log N)` · `per-followee fetch cap`

### New answer (vi)
**Chốt** — Dùng N-way merge bằng heap trên các timeline per-followee đã sort sẵn: seed heap bằng top post mỗi list, liên tục pop bài tốt nhất và push bài kế của followee đó cho đến khi đủ K kết quả. Bottleneck không phải merge — mà là 1 000 read, phải parallelise (Redis pipeline) để giữ dưới 100 ms.

**Cơ chế** — Timeline mỗi followee được pre-sort reverse-chronological trong Redis sorted set (`ZREVRANGE`, O(1) lấy head). (1) Fetch top post từ mỗi trong 1 000 followee; (2) push từng cái vào heap keyed theo score/timestamp; (3) pop max vào result; (4) fetch post kế từ followee đó và push; (5) lặp đến K. Heap op là O(log N) với N = 1 000, nên K kết quả tốn O(K log 1000) ≈ O(10K) — bản thân merge không đáng kể.

:::muted
**Trade-off** — Chi phí thật là 1 000 read ở bước 1. Phát tuần tự là vỡ budget; pipeline/fan-out song song thì 1 000 lookup mất ~5–10 ms, để lại ~10–20 ms merge và ~80 ms render trong SLO 100 ms.
:::

:::muted
**Bẫy thường gặp** — Over-fetch per followee cho re-ranking — vd 100 post × 1 000 followee = 100 k post (50–100 MB) load mỗi request. Cap fetch per followee ở ~10–20 post và dựa vào thứ tự score của heap cộng pruning để vẫn surface kết quả tốt nhất.
:::

*Đào sâu tiếp — nếu post phải re-rank bằng model ML (không chỉ score/time), model đó chạy ở đâu trong pipeline mà không phá budget 100 ms?*

**Từ khoá ăn điểm** — `N-way merge` · `min/max-heap` · `ZREVRANGE` · `Redis pipeline/fan-out` · `O(K log N)` · `per-followee fetch cap`

## 6-card — senior — [Search, Distributed]
**Question:** How does Elasticsearch handle index sharding and what happens to query performance when you over-shard?
**Verdict:** KEEP — Explains scatter-gather, the over-shard cost curve, and a time-series ILM pitfall; clear design judgment.

### New answer (en)
**TL;DR** — An index is split into N primary shards (each a self-contained Lucene index), and a query runs scatter-gather: the coordinating node fans the query to all shards in parallel, then merges their top-K. Over-sharding makes the scatter-gather overhead grow linearly with shard count, eventually slowing queries instead of speeding them.

**How it works** — (1) Scatter: the coordinating node sends the query to every shard in parallel; each returns its local top-K. (2) Gather: the coordinator merges all shard results, re-ranks globally, and returns the final top-K. With 1 000 shards for a 10 GB index, the coordinator must manage 1 000 requests/responses and merge 1 000 × K results — burning CPU and memory on coordination. Rule of thumb: keep ~10–50 GB per shard; for time-series data use ILM (Index Lifecycle Management) to roll over into new indices and shrink old ones.

:::muted
**Trade-off** — Under-sharding leaves you stuck at one shard's capacity (a shard can't be split in place); over-sharding wastes resources and inflates scatter-gather. The sweet spot balances parallelism (more shards = faster per-shard work) against coordination overhead; ~2–8 shards per node is a common starting point for search-heavy workloads.
:::

:::muted
**Common pitfall** — One index per day for time-series without an alias/ILM policy: after 6 months you have 180 indices, and an "all indices" query hits 180 × N shards, ballooning scatter-gather. Use a write alias pointing at the current index plus ILM to roll over and merge old indices into fewer shards.
:::

*Go deeper — once an index already has too many primary shards, what are your options short of full reindex (e.g. shrink/split APIs, and their constraints)?*

**Keywords** — `primary shards` · `scatter-gather` · `coordinating node` · `10–50 GB/shard` · `ILM/rollover` · `write alias` · `shrink/split`

### New answer (vi)
**Chốt** — Một index được chia thành N primary shard (mỗi shard là một Lucene index độc lập), và query chạy scatter-gather: coordinating node fan query tới mọi shard song song, rồi merge top-K của chúng. Over-shard làm overhead scatter-gather tăng tuyến tính theo số shard, cuối cùng làm chậm query thay vì nhanh hơn.

**Cơ chế** — (1) Scatter: coordinating node gửi query tới mọi shard song song; mỗi shard trả local top-K. (2) Gather: coordinator merge tất cả result, re-rank globally, trả top-K cuối. Với 1 000 shard cho index 10 GB, coordinator phải quản 1 000 request/response và merge 1 000 × K result — đốt CPU và memory cho coordination. Rule of thumb: giữ ~10–50 GB per shard; với time-series dùng ILM (Index Lifecycle Management) để rollover vào index mới và shrink index cũ.

:::muted
**Trade-off** — Under-shard khiến bạn kẹt ở capacity một shard (shard không split tại chỗ được); over-shard lãng phí tài nguyên và phình scatter-gather. Điểm tối ưu cân bằng song song (nhiều shard = việc per-shard nhanh hơn) với coordination overhead; ~2–8 shard per node là điểm khởi đầu phổ biến cho workload search-heavy.
:::

:::muted
**Bẫy thường gặp** — Một index mỗi ngày cho time-series mà không có alias/ILM: sau 6 tháng bạn có 180 index, và query "all indices" hit 180 × N shard, phình scatter-gather. Dùng write alias trỏ index hiện tại cộng ILM để rollover và merge index cũ vào ít shard hơn.
:::

*Đào sâu tiếp — khi một index đã quá nhiều primary shard, bạn có lựa chọn nào ngoài full reindex (vd shrink/split API, và ràng buộc của chúng)?*

**Từ khoá ăn điểm** — `primary shards` · `scatter-gather` · `coordinating node` · `10–50 GB/shard` · `ILM/rollover` · `write alias` · `shrink/split`

## 7-card — senior — [Search]
**Question:** Search relevance vs recency in a news feed: how do you blend them in a scoring function and what are the failure modes of each pure approach?
**Verdict:** KEEP — Design of a blended scoring function with named failure modes and an engagement-normalisation pitfall.

### New answer (en)
**TL;DR** — Pure recency drowns quality under high-volume accounts; pure relevance lets stale viral posts squat the top and starves new content. Blend them with a time-decayed relevance score, `score = relevance × exp(-λ × age_hours)`, and tune λ per content type.

**How it works** — Reverse-chronological (pure recency) always shows newest first, so a user following 1 000 accounts sees noisy high-volume accounts bury quiet high-quality ones — a 2-hour-old good post hides behind 200 newer low-quality ones. Pure relevance (rank by engagement) lets a 3-day-old viral post hold the top indefinitely while new content can't break in (cold start). The blend multiplies a relevance score by a time-decay factor `exp(-λ × age_in_hours)`; larger λ decays faster. Calibrate λ by content type — breaking news decays fast (λ≈0.5), evergreen long-form decays slowly (λ≈0.05).

:::muted
**Trade-off** — Tuning the decay is delicate: too fast and viral content vanishes before most users see it; too slow and new content can't compete with established posts. A/B test λ against session length and scroll depth rather than picking it analytically.
:::

:::muted
**Common pitfall** — Using raw engagement counts as the relevance signal without normalising for reach. 100 likes from 200 impressions (50%) is far more relevant than 10 000 likes from 5 M impressions (0.2%). Always normalise to an engagement rate, not raw counts.
:::

*Go deeper — how would you stop a feedback loop where the ranker only ever surfaces already-popular posts, so new creators never accumulate the engagement needed to rank?*

**Keywords** — `time decay exp(-λ·age)` · `relevance × recency` · `cold start` · `engagement rate vs raw count` · `A/B test λ`

### New answer (vi)
**Chốt** — Pure recency nhấn chìm chất lượng dưới các account high-volume; pure relevance để viral post cũ chiếm top và bỏ đói nội dung mới. Blend chúng bằng relevance score có time-decay, `score = relevance × exp(-λ × age_hours)`, và tune λ theo content type.

**Cơ chế** — Reverse-chronological (pure recency) luôn hiện mới nhất, nên user follow 1 000 account thấy account high-volume ồn ào chôn vùi account chất lượng ít đăng — bài tốt 2 giờ trước nấp sau 200 bài mới hơn low-quality. Pure relevance (rank theo engagement) để viral post 3 ngày tuổi giữ top vô thời hạn trong khi nội dung mới không chen vào được (cold start). Blend nhân relevance score với time-decay factor `exp(-λ × age_in_hours)`; λ lớn hơn decay nhanh hơn. Hiệu chỉnh λ theo content type — tin nóng decay nhanh (λ≈0.5), evergreen long-form decay chậm (λ≈0.05).

:::muted
**Trade-off** — Tune decay tinh tế: quá nhanh thì viral content biến mất trước khi hầu hết user thấy; quá chậm thì nội dung mới không cạnh tranh nổi post đã established. A/B test λ theo session length và scroll depth thay vì chọn theo phân tích.
:::

:::muted
**Bẫy thường gặp** — Dùng raw engagement count làm relevance signal mà không normalise theo reach. 100 like từ 200 impression (50%) liên quan hơn nhiều 10 000 like từ 5 M impression (0.2%). Luôn normalise về engagement rate, không phải raw count.
:::

*Đào sâu tiếp — bạn chặn vòng lặp phản hồi nơi ranker chỉ surface post đã phổ biến, khiến creator mới không bao giờ tích đủ engagement để rank, bằng cách nào?*

**Từ khoá ăn điểm** — `time decay exp(-λ·age)` · `relevance × recency` · `cold start` · `engagement rate vs raw count` · `A/B test λ`
