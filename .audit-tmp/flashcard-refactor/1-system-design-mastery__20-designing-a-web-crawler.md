# 1-system-design-mastery / 20-designing-a-web-crawler
Summary: kept 8, delete 0 of 8

## 0-card — junior — [Web Crawler, Fundamentals]
**Question:** You are asked to build a crawler that must fetch billions of pages across the public web to feed a search index. A junior teammate proposes a loop that takes a URL, downloads it, extracts links, and pushes them all back onto a list to download next. Why does this naive loop fall apart at web scale, and what two problems must any real crawler solve first?
**Verdict:** KEEP — genuine "why does the naive design break" reasoning question that scales with seniority and invites follow-ups on frontier/dedup design.

### New answer (en)
**TL;DR** — The naive loop conflates "to-fetch" with "already-fetched" and keeps everything in RAM, so it cycles forever and runs out of memory. The two problems every crawler must solve first are **deduplication** (never re-fetch the same URL/content) and **politeness** (don't hammer hosts you don't own).

**How it works** — Split the single list into two structures: a **URL frontier** (work still to do) and a durable **store** of already-crawled pages, plus a **seen-set** so each link is enqueued only once. Fetch politely by spacing requests per host. A correct skeleton: seed URLs → frontier → fetcher → parser → extract & normalize links → dedup against seen-set → enqueue new URLs → store page content, until the frontier drains or the crawl budget is spent.

:::muted
**Trade-off** — The in-memory list is fine for a few thousand pages, but at billions of URLs the gap between O(unique) work and O(re-fetch-forever) work is the difference between a crawl that finishes and one that never does. A real frontier + seen-set costs memory, code, and persistence so a restart doesn't re-crawl the web.
:::

:::muted
**Common pitfall** — Cycles (A→B→A) with no dedup so the frontier never shrinks; hammering one popular domain until your IP is blocked or the site goes down; and OOM because the seen-set/frontier were never designed for disk or sharding.
:::

*Go deeper: once you have a seen-set, how do you store billions of URLs without keeping them all in RAM?*

**Keywords** — `URL frontier · seen-set · dedup · politeness · crawl budget · normalize`

### New answer (vi)
**Chốt** — Vòng lặp ngây thơ trộn lẫn "cần-fetch" với "đã-fetch" và giữ mọi thứ trong RAM, nên nó chạy vòng mãi mãi và cạn bộ nhớ. Hai vấn đề mọi crawler phải giải trước tiên là **deduplication** (không re-fetch cùng URL/nội dung) và **politeness** (không dội bom các host bạn không sở hữu).

**Cơ chế** — Tách list đơn thành hai cấu trúc: một **URL frontier** (việc còn phải làm) và một **store** bền vững các trang đã crawl, kèm một **seen-set** để mỗi link chỉ enqueue một lần. Fetch một cách politely bằng cách giãn cách request theo từng host. Khung đúng: seed URLs → frontier → fetcher → parser → trích & normalize link → dedup với seen-set → enqueue URL mới → lưu nội dung trang, cho tới khi frontier cạn hoặc hết crawl budget.

:::muted
**Trade-off** — List trong bộ nhớ ổn với vài nghìn trang, nhưng ở quy mô hàng tỷ URL, khác biệt giữa lượng việc O(unique) và O(re-fetch-mãi-mãi) là khác biệt giữa một crawl hoàn thành và một crawl không bao giờ kết thúc. Frontier + seen-set đàng hoàng tốn bộ nhớ, code, và persistence để một lần restart không crawl lại cả web.
:::

:::muted
**Bẫy thường gặp** — Chu trình (A→B→A) không có dedup nên frontier không bao giờ co lại; dội bom một domain phổ biến tới khi bị block IP hoặc làm sập site; và OOM vì seen-set/frontier chưa từng được thiết kế cho đĩa hay sharding.
:::

*Đào sâu tiếp: khi đã có seen-set, bạn lưu hàng tỷ URL ra sao mà không giữ hết trong RAM?*

**Từ khoá ăn điểm** — `URL frontier · seen-set · dedup · politeness · crawl budget · normalize`

## 1-card — senior — [URL Frontier, Bloom Filter]
**Question:** Design the URL frontier for a large crawler. It must prioritize important pages, never enqueue a URL twice, and never let two requests to the same host fire back-to-back. How do you structure the frontier, why use a bloom filter for the seen-set, and how do the per-host politeness queues fit in?
**Verdict:** KEEP — open-ended design question (Mercator frontier, bloom filter trade-off, per-host scheduling) with real senior-level depth and follow-ups.

### New answer (en)
**TL;DR** — Use the Mercator two-stage frontier: **front queues** for priority and **back queues** for politeness (one back queue per host). The seen-set is a **bloom filter** because storing billions of full URLs in a hash set costs too much RAM — a bloom filter answers "seen this?" in a few bits per URL with a tiny, tunable false-positive rate.

**How it works** — A new URL is checked against the seen-set; if unseen, it gets a priority (PageRank, freshness need, depth) and lands in a front queue. A back-queue router maps each URL to the single back queue for its host, and a min-heap of per-host "next-fetch time" enforces the crawl delay — a worker pulls the host whose timer expired, fetches one URL, then re-schedules that host. Canonicalize URLs *before* the seen-set check.

:::muted
**Trade-off** — The bloom filter trades exactness for space: a false positive drops a genuinely new URL, acceptable because missing a few of billions barely dents coverage while the memory saving is huge. Splitting front (priority) from back (politeness) adds routing cost but is the only way to satisfy both goals — a single priority queue would fire ten requests at one host. More back queues than workers smooths host coverage but costs memory.
:::

:::muted
**Common pitfall** — A bloom filter can't delete, so recrawl scheduling must live in a separate store, not the dedup filter. Undersizing it silently raises the false-positive rate and you start skipping new URLs with no error. And inconsistent normalization (trailing slash, default port, query-param order, uppercase host) makes the same page hash to different keys and slip past dedup.
:::

*Go deeper: a bloom filter says "probably seen" — how do you ever schedule a legitimate recrawl of a page it already knows?*

**Keywords** — `Mercator · front/back queue · bloom filter · false positive · per-host heap · canonicalize · LSH`

### New answer (vi)
**Chốt** — Dùng frontier hai tầng Mercator: **front queue** cho ưu tiên và **back queue** cho politeness (một back queue mỗi host). Seen-set là một **bloom filter** vì lưu hàng tỷ URL đầy đủ trong một hash set tốn quá nhiều RAM — bloom filter trả lời "đã thấy chưa?" chỉ với vài bit mỗi URL kèm tỷ lệ false-positive nhỏ và chỉnh được.

**Cơ chế** — URL mới được đối chiếu với seen-set; nếu chưa thấy, nó nhận một mức ưu tiên (PageRank, nhu cầu freshness, độ sâu) và vào một front queue. Một back-queue router map mỗi URL vào đúng một back queue theo host, và một min-heap "thời điểm fetch kế tiếp" per-host thực thi crawl delay — worker kéo ra host nào đã hết timer, fetch một URL, rồi đặt lịch lại cho host đó. Canonicalize URL *trước* khi kiểm tra seen-set.

:::muted
**Trade-off** — Bloom filter đánh đổi tính chính xác lấy không gian: một false positive bỏ rớt một URL thật sự mới, chấp nhận được vì mất vài trang trên hàng tỷ gần như không suy giảm coverage trong khi bộ nhớ tiết kiệm là khổng lồ. Tách front (ưu tiên) khỏi back (politeness) thêm chi phí routing nhưng là cách duy nhất thỏa cả hai mục tiêu — một priority queue đơn sẽ bắn mười request tới một host. Nhiều back queue hơn số worker làm mượt coverage host nhưng tốn bộ nhớ.
:::

:::muted
**Bẫy thường gặp** — Bloom filter không xóa được, nên lịch recrawl phải nằm ở một store riêng, không phải trong dedup filter. Định cỡ thiếu sẽ âm thầm đẩy tỷ lệ false-positive lên và bạn bắt đầu bỏ qua URL mới mà không có lỗi báo. Và normalize không nhất quán (trailing slash, default port, thứ tự query-param, host viết hoa) khiến cùng một trang hash ra các key khác nhau và lọt qua dedup.
:::

*Đào sâu tiếp: bloom filter chỉ nói "chắc đã thấy" — vậy làm sao bạn lên lịch recrawl chính đáng cho một trang nó đã biết?*

**Từ khoá ăn điểm** — `Mercator · front/back queue · bloom filter · false positive · per-host heap · canonicalize · LSH`

## 2-card — middle — [Politeness, robots.txt]
**Question:** A site owner emails you angrily that your crawler is overwhelming their server and ignoring their rules. Walk through what "being polite" actually means: how do you handle robots.txt, per-host rate limiting, and crawl-delay so this never happens?
**Verdict:** KEEP — scenario-driven question forcing a structured walkthrough plus distributed-coordination follow-up; clears the middle bar easily.

### New answer (en)
**TL;DR** — Politeness has three pillars: obey `robots.txt`, rate-limit **per host** (not globally), and respect `Crawl-delay`. Identify yourself with a descriptive User-Agent and contact URL so owners can reach you instead of just blocking you.

**How it works** — Before crawling a host, fetch and cache its `/robots.txt`, parse Allow/Disallow for your user-agent, and never request a disallowed path; honor the cache for a sensible TTL (hours) and re-fetch periodically. Rate-limit per host by keeping at most one in-flight request per host plus a next-allowed-time timestamp — exactly what the back-queue-per-host frontier gives you. Respect `Crawl-delay` if set; otherwise adapt, e.g. set the delay proportional to the host's observed response time so slow servers get fewer requests.

:::muted
**Trade-off** — Strict politeness (long delays, one request at a time per host) keeps you off blocklists but caps throughput — a huge site can take weeks. You recover speed by parallelizing *across* hosts, not within one. Adaptive delay reacts well to struggling servers but adds per-host latency bookkeeping, and being too conservative wastes crawl budget on sites that could serve more.
:::

:::muted
**Common pitfall** — Fetching robots.txt once and never refreshing (the site tightens its rules and you keep hitting now-disallowed paths); rate-limiting by IP/domain string when one physical server hosts thousands of vhosts; treating an unreachable/5xx robots.txt as "allow everything" instead of backing off; and distributed workers each thinking they're the only one on a host, so it sees N× the intended rate — per-host scheduling must be centralized or consistently partitioned.
:::

*Go deeper: with ten workers, how do you guarantee a single host never sees more than the agreed rate?*

**Keywords** — `robots.txt · Allow/Disallow · Crawl-delay · per-host rate limit · User-Agent · adaptive delay`

### New answer (vi)
**Chốt** — Politeness có ba trụ cột: tuân `robots.txt`, rate-limit **theo từng host** (không phải toàn cục), và tôn trọng `Crawl-delay`. Tự giới thiệu bằng một User-Agent mô tả rõ kèm URL liên hệ để chủ site tìm được bạn thay vì chỉ block.

**Cơ chế** — Trước khi crawl một host, fetch và cache `/robots.txt` của nó, parse Allow/Disallow cho user-agent của bạn, và không bao giờ request một path bị disallow; giữ cache với TTL hợp lý (vài giờ) và re-fetch định kỳ. Rate-limit theo host bằng cách giữ tối đa một request in-flight mỗi host kèm một timestamp next-allowed-time — đúng thứ mà frontier back-queue-mỗi-host mang lại. Tôn trọng `Crawl-delay` nếu được đặt; nếu không thì thích nghi, ví dụ đặt delay tỷ lệ với response time quan sát được của host nên server chậm nhận ít request hơn.

:::muted
**Trade-off** — Politeness chặt (delay dài, mỗi lúc một request mỗi host) giữ bạn khỏi blocklist nhưng giới hạn throughput — một site khổng lồ có thể mất hàng tuần. Bạn lấy lại tốc độ bằng cách song song hóa *qua* nhiều host, không phải trong một host. Adaptive delay phản ứng tốt với server đang vật lộn nhưng thêm bookkeeping latency per-host, và quá thận trọng thì phí crawl budget cho những site lẽ ra phục vụ thoải mái hơn.
:::

:::muted
**Bẫy thường gặp** — Fetch robots.txt một lần rồi không bao giờ refresh (site siết luật mà bạn cứ đập vào path nay đã disallow); rate-limit theo chuỗi IP/domain trong khi một server vật lý host hàng nghìn vhost; coi robots.txt không truy cập được/5xx như "allow everything" thay vì lùi lại; và worker phân tán mỗi cái tưởng mình là kẻ duy nhất trên một host, nên host thấy gấp N lần tốc độ dự kiến — lịch per-host phải được tập trung hóa hoặc phân vùng nhất quán.
:::

*Đào sâu tiếp: với mười worker, làm sao bạn đảm bảo một host không bao giờ thấy quá tốc độ đã thỏa thuận?*

**Từ khoá ăn điểm** — `robots.txt · Allow/Disallow · Crawl-delay · per-host rate limit · User-Agent · adaptive delay`

## 3-card — senior — [Deduplication, SimHash]
**Question:** Your index is bloated with duplicates: the same article appears under dozens of URLs, and near-identical pages differ only by a timestamp or a sidebar ad. URL dedup alone does not catch this. How do you detect exact duplicates and near-duplicates of page content?
**Verdict:** KEEP — strong senior question separating exact vs near-dup, fingerprinting choices (SimHash/MinHash/LSH) and threshold tuning trade-offs.

### New answer (en)
**TL;DR** — Two layers. For **exact** dups, hash the normalized body (e.g. SHA-256) and keep a seen-hash set — identical hash means index once, record the alias URLs. For **near**-dups you need a similarity-preserving fingerprint: **SimHash** (a 64-bit fingerprint where similar docs differ in only a few bits) or **MinHash/shingling**, declaring a near-dup when Hamming distance is below a threshold (commonly ~3 bits).

**How it works** — A cryptographic hash changes completely on a one-byte edit, so it can't measure similarity — that's why SimHash/MinHash exist. Shingling breaks text into overlapping k-word sequences and compares sets via Jaccard. To find candidates at web scale you bucket fingerprints by partial bits with **LSH** instead of comparing every pair. Fingerprint the *extracted main content*, not raw HTML.

:::muted
**Trade-off** — Exact hashing is cheap and unambiguous but brittle: a rotating ad or session token in the HTML produces a new hash and the duplicate slips through. SimHash/MinHash catch near-dups but cost more to compute and tune, and the threshold is a dial — too tight keeps dups, too loose collapses distinct pages that share boilerplate. Stripping boilerplate before fingerprinting helps a lot but adds an extraction step with its own failure modes.
:::

:::muted
**Common pitfall** — Fingerprinting raw HTML so two different articles look near-identical because 80% is shared chrome — fingerprint the extracted content. Choosing a Hamming threshold without measuring. And forgetting LSH/bucketing: naive all-pairs is O(n²) and never finishes at web scale.
:::

*Go deeper: how do you tune the SimHash Hamming threshold — what data do you measure to set it?*

**Keywords** — `SHA-256 · SimHash · MinHash · shingling · Jaccard · Hamming distance · LSH · boilerplate stripping`

### New answer (vi)
**Chốt** — Hai tầng. Với dup **chính xác**, hash phần body đã normalize (ví dụ SHA-256) và giữ một tập seen-hash — hash trùng nghĩa là index một lần, ghi lại các URL alias. Với **near**-dup bạn cần một fingerprint bảo toàn độ tương đồng: **SimHash** (fingerprint 64-bit nơi các doc giống nhau chỉ khác vài bit) hoặc **MinHash/shingling**, tuyên bố near-dup khi Hamming distance dưới một ngưỡng (thường ~3 bit).

**Cơ chế** — Một hash mật mã đổi hoàn toàn chỉ với một byte thay đổi, nên không đo được độ tương đồng — đó là lý do SimHash/MinHash tồn tại. Shingling cắt văn bản thành các chuỗi k-từ chồng lấn và so các tập bằng Jaccard. Để tìm candidate ở quy mô web, bạn bucket fingerprint theo bit từng phần bằng **LSH** thay vì so từng cặp. Fingerprint *phần main content đã trích*, không phải HTML thô.

:::muted
**Trade-off** — Hash chính xác thì rẻ và rõ ràng nhưng giòn: một quảng cáo xoay vòng hay session token trong HTML tạo hash mới và duplicate lọt qua. SimHash/MinHash bắt được near-dup nhưng tốn hơn để tính và tune, và ngưỡng là một núm vặn — quá chặt thì giữ dup, quá lỏng thì gộp nhầm các trang khác biệt chia sẻ boilerplate. Bóc boilerplate trước khi fingerprint cải thiện rất nhiều nhưng thêm một bước extraction kèm failure mode riêng.
:::

:::muted
**Bẫy thường gặp** — Fingerprint trên HTML thô nên hai bài khác nhau trông gần-giống vì 80% là chrome dùng chung — hãy fingerprint phần content đã trích. Chọn ngưỡng Hamming mà không đo đạc. Và quên LSH/bucketing: so all-pairs ngây thơ là O(n²) và không bao giờ kết thúc ở quy mô web.
:::

*Đào sâu tiếp: bạn tune ngưỡng Hamming của SimHash ra sao — đo dữ liệu gì để đặt nó?*

**Từ khoá ăn điểm** — `SHA-256 · SimHash · MinHash · shingling · Jaccard · Hamming distance · LSH · boilerplate stripping`

## 4-card — senior — [Distributed Crawling, Partitioning]
**Question:** One machine cannot crawl the web in any reasonable time, so you run hundreds of crawler workers. How do you partition the URL space across them, keep two workers from crawling the same page or hammering the same host, and handle a worker dying mid-crawl?
**Verdict:** KEEP — meaty distributed-systems question covering partitioning, consistent hashing, fault tolerance and lease/ack semantics.

### New answer (en)
**TL;DR** — Partition **by host**, not by URL: hash the hostname and assign each host to exactly one shard via **consistent hashing**. That makes per-host politeness and dedup local (no cross-node coordination), and on a worker crash, lease/ack semantics redeliver its unfinished URLs.

**How it works** — All of a host's URLs land on the same worker, so back-queue scheduling and dedup state are colocated. The frontier and seen-set live in a distributed store (or are sharded by the same host hash); when a worker extracts a link to another shard's host, it forwards the URL there. Consistent hashing means adding/removing a worker only remaps a small fraction of hosts. A coordinator (e.g. ZooKeeper) handles membership, health checks, and rebalancing.

:::muted
**Trade-off** — Host partitioning makes politeness trivial and keeps coordination low, but skews: a few giant hosts make their shard a hotspot while others idle. You can split very large hosts across shards (needing cross-shard politeness coordination for them) or weight the hash, but that reintroduces complexity. URL-based partitioning balances load evenly but destroys host-locality, forcing global politeness coordination — usually a worse trade.
:::

:::muted
**Common pitfall** — Partial work loss on crash: dequeued-but-unfinished URLs vanish unless the frontier uses lease/ack (a job is removed only after the fetch is durably recorded, else redelivered). Plain modulo hashing remaps almost every host when the cluster resizes, causing a re-crawl storm. And forwarding links without dedup at the destination lets the same URL be enqueued by multiple senders — the seen-set check must happen on the owning shard, *after* forwarding.
:::

*Go deeper: a single host has 40% of your URLs and is now a hotspot — how do you rebalance without breaking its politeness guarantee?*

**Keywords** — `consistent hashing · host partitioning · host-locality · lease/ack · redelivery · ZooKeeper · hotspot`

### New answer (vi)
**Chốt** — Phân vùng **theo host**, không theo URL: hash hostname và gán mỗi host cho đúng một shard qua **consistent hashing**. Điều đó làm politeness per-host và dedup cục bộ (không phối hợp xuyên node), và khi một worker crash, cơ chế lease/ack redeliver các URL chưa xong của nó.

**Cơ chế** — Mọi URL của một host rơi vào cùng một worker, nên lịch back-queue và state dedup được đặt cùng chỗ. Frontier và seen-set nằm trong một distributed store (hoặc được shard theo cùng host hash); khi một worker trích một link tới host của shard khác, nó forward URL tới đó. Consistent hashing nghĩa là thêm/bớt một worker chỉ remap một phần nhỏ các host. Một coordinator (ví dụ ZooKeeper) lo membership, health check, và rebalancing.

:::muted
**Trade-off** — Phân vùng theo host làm politeness đơn giản và giữ phối hợp ở mức thấp, nhưng lệch: vài host khổng lồ biến shard của chúng thành hotspot trong khi các shard khác ngồi không. Bạn có thể tách các host rất lớn ra nhiều shard (cần phối hợp politeness xuyên shard cho chúng) hoặc weight cái hash, nhưng điều đó tái nhập độ phức tạp. Phân vùng theo URL cân bằng tải đều nhưng phá vỡ host-locality, buộc phối hợp politeness toàn cục — thường là đánh đổi tệ hơn.
:::

:::muted
**Bẫy thường gặp** — Mất việc một phần khi crash: các URL đã dequeue nhưng chưa xong biến mất trừ khi frontier dùng lease/ack (một job chỉ bị xóa sau khi fetch được ghi bền vững, nếu không thì redeliver). Modulo hashing trơn remap gần như mọi host khi cluster đổi kích thước, gây một cơn bão re-crawl. Và forward link mà không dedup ở đích cho phép cùng một URL bị enqueue bởi nhiều bên gửi — kiểm tra seen-set phải xảy ra ở shard sở hữu, *sau* khi forward.
:::

*Đào sâu tiếp: một host đơn chiếm 40% URL của bạn và nay là hotspot — bạn rebalance ra sao mà không phá đảm bảo politeness của nó?*

**Từ khoá ăn điểm** — `consistent hashing · host partitioning · host-locality · lease/ack · redelivery · ZooKeeper · hotspot`

## 5-card — middle — [Freshness, Recrawl]
**Question:** Your index is going stale: news homepages change hourly but you last crawled them a week ago, while you keep re-crawling a static "About Us" page that never changes. How do you schedule recrawls and detect changes so freshness stays high without wasting crawl budget?
**Verdict:** KEEP — real scheduling/optimization question with adaptive change-rate reasoning, HTTP conditionals, and freshness-vs-coverage trade-off.

### New answer (en)
**TL;DR** — Make recrawl frequency **per-page and adaptive**, not a fixed interval: estimate each page's change rate from history and weight it by importance, crawling volatile important pages often and stable ones rarely. Detect change cheaply with HTTP conditionals (`If-Modified-Since`/`If-None-Match` → `304 Not Modified`), confirmed by a content hash.

**How it works** — Keep a priority queue keyed by "next recrawl due" time. Raise a page's interval when it keeps coming back unchanged, lower it when it changes. `304` costs almost nothing and avoids downloading unchanged bodies; on a real fetch, compare the content hash to the stored one to confirm a genuine change. Importance signals = popularity, PageRank, inbound clicks.

:::muted
**Trade-off** — Aggressive recrawling keeps the index maximally fresh but burns budget on pages that never change and re-pressures hosts; lazy recrawling saves budget but lets important pages go stale, hurting exactly the breaking-news queries users care about. Adaptive scheduling balances these but depends on good change-rate and importance estimates; noisy signals mean over-crawling stable pages or missing bursts. There's also a freshness-vs-coverage tension: budget on re-crawl is budget not spent discovering new pages.
:::

:::muted
**Common pitfall** — Trusting `Last-Modified` blindly — many CMSes set it to "now" on every request or never update it, so corroborate with a content hash. Recrawling on a flat global interval over-crawls static pages and under-crawls volatile ones at once. And ignoring sitemaps/`lastmod` hints or push feeds, which signal change far cheaper than blind polling.
:::

*Go deeper: how do you estimate a page's change rate from a noisy crawl history — and how do you bootstrap it for a brand-new URL?*

**Keywords** — `change rate · adaptive recrawl · If-Modified-Since · If-None-Match · 304 · content hash · sitemap/lastmod · freshness-vs-coverage`

### New answer (vi)
**Chốt** — Làm tần suất recrawl **per-page và thích nghi**, không phải khoảng cố định: ước lượng change rate của mỗi trang từ lịch sử và weight theo độ quan trọng, crawl các trang quan trọng hay biến động thường xuyên còn trang ổn định thì hiếm khi. Phát hiện thay đổi rẻ bằng HTTP conditional (`If-Modified-Since`/`If-None-Match` → `304 Not Modified`), xác nhận bằng content hash.

**Cơ chế** — Giữ một priority queue khóa theo thời điểm "next recrawl due". Tăng interval của một trang khi nó cứ trở về không đổi, giảm khi nó đổi. `304` gần như không tốn gì và tránh tải lại body không đổi; khi fetch thật, so content hash với hash đã lưu để xác nhận thay đổi thật. Tín hiệu độ quan trọng = độ phổ biến, PageRank, click vào.

:::muted
**Trade-off** — Recrawl hung hăng giữ index tươi tối đa nhưng đốt budget vào các trang chẳng bao giờ đổi và tái gây áp lực lên host; recrawl lười tiết kiệm budget nhưng để các trang quan trọng bị cũ, làm hại đúng các truy vấn tin nóng người dùng quan tâm. Lịch thích nghi cân bằng được nhưng phụ thuộc ước lượng change-rate và độ quan trọng tốt; tín hiệu nhiễu thì over-crawl trang ổn định hoặc bỏ lỡ các đợt thay đổi. Còn có căng thẳng freshness-vs-coverage: budget cho re-crawl là budget không tiêu vào khám phá trang mới.
:::

:::muted
**Bẫy thường gặp** — Tin mù quáng vào `Last-Modified` — nhiều CMS đặt nó thành "now" trên mỗi request hoặc không bao giờ update, nên hãy đối chiếu bằng content hash. Recrawl theo một interval toàn cục phẳng đồng thời over-crawl trang tĩnh và under-crawl trang biến động. Và bỏ qua sitemap/gợi ý `lastmod` hay push feed, vốn báo thay đổi rẻ hơn nhiều so với poll mù.
:::

*Đào sâu tiếp: bạn ước lượng change rate của một trang từ lịch sử crawl nhiễu ra sao — và bootstrap nó cho một URL hoàn toàn mới thế nào?*

**Từ khoá ăn điểm** — `change rate · adaptive recrawl · If-Modified-Since · If-None-Match · 304 · content hash · sitemap/lastmod · freshness-vs-coverage`

## 6-card — middle — [Crawler Traps, Robustness]
**Question:** Your crawler has spent two days stuck on a single domain, fetching millions of URLs like `/calendar?date=2099-01-01&next=...` and `/page?sid=abc123`, and the frontier for that host never drains. What is happening, and how do you defend against crawler traps?
**Verdict:** KEEP — diagnosis-then-defense question; identifying the trap and layering caps/normalization/content-dedup is real middle-to-senior reasoning.

### New answer (en)
**TL;DR** — You've hit a **crawler trap** — an effectively infinite URL space. The calendar generates a fresh "next month" link forever, and session-id URLs make every visit look new though the content is identical. Defend with layered defenses: per-host depth/URL caps, URL normalization to strip junk params, and content-based dedup.

**How it works** — Cap crawl depth and URLs per host so no domain monopolizes the frontier. Normalize URLs to strip known junk params (session ids, tracking) so they collapse to one canonical form and dedup catches them. Use content-based dedup (the content-hash/SimHash layer) so identical bodies behind different URLs aren't re-indexed or re-expanded. Monitor per-host fan-out and content-uniqueness, then throttle or blacklist offending URL patterns.

:::muted
**Trade-off** — Hard depth/count caps bound the damage but set too low they stop you fully crawling legitimately huge sites (a big forum genuinely has millions of pages). Aggressive normalization risks collapsing meaningful params (`?page=2` is real pagination, `?sid=` is not), so you need site-specific, imperfect rules. Content dedup is robust but fires only *after* the fetch, so it limits indexing waste, not fetch waste — combine it with budget caps to cover both.
:::

:::muted
**Common pitfall** — One host's frontier growing unbounded, starving every other host and never finishing. Plain URL-dedup doesn't help because each trap URL is genuinely unique — only normalization or content-similarity catches them. Over-correcting is its own failure: blanket param stripping or a tiny depth cap silently under-crawls large legitimate sites. The right posture is monitoring per-host fan-out/uniqueness and reacting to outliers, not one global rule.
:::

*Go deeper: how do you automatically distinguish a meaningful query param (`?page=2`) from a junk one (`?sid=`) without per-site rules?*

**Keywords** — `crawler trap · infinite URL space · depth cap · per-host URL cap · URL normalization · session-id · content dedup · fan-out monitoring`

### New answer (vi)
**Chốt** — Bạn đã sa vào một **crawler trap** — một không gian URL gần như vô hạn. Lịch sinh ra một link "tháng kế tiếp" mới mãi mãi, và URL session-id khiến mỗi lần ghé trông như trang mới dù nội dung giống hệt. Phòng thủ theo nhiều tầng: cap depth/URL per-host, normalize URL để bóc param rác, và dedup theo nội dung.

**Cơ chế** — Giới hạn crawl depth và số URL mỗi host để không domain nào độc chiếm frontier. Normalize URL để bóc các param rác đã biết (session id, tracking) sao cho chúng gập về một dạng canonical và dedup bắt được. Dùng dedup theo nội dung (tầng content-hash/SimHash) để các body giống hệt sau các URL khác nhau không bị re-index hay re-expand. Monitor fan-out per-host và độ duy-nhất nội dung, rồi throttle hoặc blacklist các URL pattern phạm lỗi.

:::muted
**Trade-off** — Cap cứng depth/số lượng bó được thiệt hại nhưng đặt quá thấp sẽ ngăn bạn crawl đầy đủ các site khổng lồ chính đáng (một forum lớn thật sự có hàng triệu trang). Normalize hung hăng có nguy cơ gập nhầm các param có nghĩa (`?page=2` là pagination thật, `?sid=` thì không), nên cần luật đặc thù theo site và không hoàn hảo. Dedup theo nội dung bền vững nhưng chỉ kích hoạt *sau* khi đã fetch, nên hạn chế phí index chứ không hẳn phí fetch — kết hợp với cap budget để phủ cả hai.
:::

:::muted
**Bẫy thường gặp** — Frontier của một host phình không giới hạn, bỏ đói mọi host khác và không bao giờ kết thúc. URL-dedup đơn giản không giúp được vì mỗi trap URL thật sự là duy nhất — chỉ normalization hay content-similarity bắt được. Sửa quá tay là một failure riêng: bóc param tràn lan hay cap depth quá nhỏ âm thầm làm các site lớn chính đáng bị under-crawl. Tư thế đúng là monitor fan-out/uniqueness per-host và phản ứng với outlier, không phải một luật toàn cục đơn.
:::

*Đào sâu tiếp: làm sao bạn tự động phân biệt một query param có nghĩa (`?page=2`) với một param rác (`?sid=`) mà không cần luật riêng từng site?*

**Từ khoá ăn điểm** — `crawler trap · infinite URL space · depth cap · per-host URL cap · URL normalization · session-id · content dedup · fan-out monitoring`

## 7-card — staff — [System Design, Architecture]
**Question:** On a whiteboard, design the end-to-end crawler that feeds a web-scale search engine. Tie together the frontier, fetchers, parser, dedup, storage, and indexer into one coherent pipeline, and call out where the hard bottlenecks and consistency boundaries are.
**Verdict:** KEEP — capstone staff-level synthesis question demanding the full pipeline, shared-state trade-offs, bottlenecks, idempotency, and graceful degradation.

### New answer (en)
**TL;DR** — Pipeline: seed URLs → URL frontier (priority front queues + per-host back queues, host-partitioned) → fetcher workers (robots cache, async cached DNS, download) → parser (extract text + links) → normalize + bloom-filter seen-set → dedup (content hash + SimHash) → raw HTML to blob store, cleaned content to the indexer's inverted index. The hard bottlenecks are DNS, robots fetches, and the shared seen-set/frontier store.

**How it works** — Fetchers pull a politeness-eligible URL, check robots.txt cache, resolve DNS (cached — DNS is a real bottleneck), download, and hand raw bytes to storage. The parser extracts links; new ones are normalized, checked against the bloom seen-set, and forwarded to the owning shard's frontier. Dedup keeps redundant pages out of the indexer. Raw HTML lands in a blob/Bigtable-like store keyed by URL; cleaned content + metadata stream to the indexer. DNS cache, robots cache, frontier store, and seen-set are the shared services every fetcher leans on.

:::muted
**Trade-off** — The central axis is shared vs local state: host-partitioning keeps politeness/dedup/frontier local and cheap but creates hotspots on giant hosts, while a fully shared frontier balances load but needs a high-throughput store and constant cross-node traffic. Storage: keeping every raw page is invaluable for reprocessing but costs petabytes; storing only extracted content is cheaper but a parser bug forces a full re-crawl. Tightly coupling parse→dedup→index lowers freshness latency; decoupling via queues gives resilience and independent scaling at the cost of end-to-end lag.
:::

:::muted
**Common pitfall** — Non-obvious bottlenecks bite first: DNS and robots fetches dominate without aggressive caching, and the seen-set/frontier store is the hottest shared dependency — if it falls over, every fetcher stalls. The crawler is at-least-once, so storage and indexer must be idempotent on URL/content key or duplicates leak. Backpressure is essential: if the parser/indexer slows, the frontier must stop growing unboundedly. And it must degrade gracefully — a slow shard can't block others, dead workers' in-flight URLs must be lease-redelivered, and politeness must stay globally correct across rebalances or you start DoS-ing sites.
:::

*Go deeper: how do you keep politeness globally correct during a live shard rebalance, when host ownership is moving underneath in-flight fetches?*

**Keywords** — `URL frontier · host partitioning · async DNS cache · robots cache · bloom seen-set · SimHash dedup · blob/Bigtable store · inverted index · at-least-once · idempotency · backpressure · lease redelivery`

### New answer (vi)
**Chốt** — Pipeline: seed URL → URL frontier (front queue ưu tiên + back queue per-host, phân vùng theo host) → fetcher worker (robots cache, DNS bất đồng bộ có cache, download) → parser (trích text + link) → normalize + seen-set bloom-filter → dedup (content hash + SimHash) → HTML thô vào blob store, content đã làm sạch vào inverted index của indexer. Các bottleneck khó là DNS, fetch robots, và shared seen-set/frontier store.

**Cơ chế** — Fetcher kéo ra một URL đủ điều kiện politeness, kiểm tra robots.txt cache, resolve DNS (có cache — DNS là một bottleneck thật), download, và giao raw bytes cho storage. Parser trích link; link mới được normalize, đối chiếu với seen-set bloom, và forward tới frontier của shard sở hữu. Dedup giữ các trang dư thừa khỏi indexer. HTML thô đáp xuống một blob/Bigtable-like store khóa theo URL; content đã làm sạch + metadata stream tới indexer. DNS cache, robots cache, frontier store, và seen-set là các shared service mà mọi fetcher đều dựa vào.

:::muted
**Trade-off** — Trục trung tâm là state dùng chung vs cục bộ: host-partitioning giữ politeness/dedup/frontier cục bộ và rẻ nhưng tạo hotspot trên các host khổng lồ, còn một frontier dùng chung hoàn toàn cân bằng tải nhưng cần một store throughput cao và lưu lượng xuyên-node liên tục. Storage: giữ mọi raw page vô giá cho reprocess nhưng tốn hàng petabyte; chỉ lưu content đã trích thì rẻ hơn nhưng một bug parser buộc re-crawl toàn bộ. Ghép chặt parse→dedup→index giảm latency freshness; tách rời qua queue cho resilience và scale độc lập với cái giá là độ trễ end-to-end.
:::

:::muted
**Bẫy thường gặp** — Các bottleneck không hiển nhiên cắn trước: DNS và fetch robots chiếm ưu thế nếu không cache hung hăng, và seen-set/frontier store là dependency dùng chung nóng nhất — nếu nó đổ, mọi fetcher đình trệ. Crawler là at-least-once, nên storage và indexer phải idempotent theo key URL/content nếu không duplicate sẽ rò. Backpressure thiết yếu: nếu parser/indexer chậm, frontier phải ngừng phình vô giới hạn. Và nó phải suy giảm duyên dáng — một shard chậm không được chặn các shard khác, URL in-flight của worker chết phải được lease-redeliver, và politeness phải luôn đúng toàn cục qua các lần rebalance nếu không bạn bắt đầu DoS các site.
:::

*Đào sâu tiếp: làm sao bạn giữ politeness đúng toàn cục trong một lần rebalance shard trực tiếp, khi quyền sở hữu host đang dịch chuyển bên dưới các fetch in-flight?*

**Từ khoá ăn điểm** — `URL frontier · host partitioning · async DNS cache · robots cache · bloom seen-set · SimHash dedup · blob/Bigtable store · inverted index · at-least-once · idempotency · backpressure · lease redelivery`
