# 1-system-design-mastery / 9-api-and-communication-design
Summary: kept 8, delete 0 of 8

## 0-card — middle — [REST, gRPC]
**Question:** You are designing three surfaces at once: a public API consumed by third parties, high-throughput internal service-to-service calls, and a mobile app that wants to fetch exactly the fields it needs in one round trip. Pick REST, gRPC, or GraphQL for each and justify the boundaries.
**Verdict:** KEEP — Open-ended design question forcing a protocol trade-off per surface; scales with seniority and invites follow-ups.

### New answer (en)
**TL;DR** — REST for the public API, gRPC for internal service-to-service, GraphQL for the mobile/BFF surface. The deciding axes are audience reach, payload efficiency, and how much the client needs to shape the response.

**How it works** — **REST** rides plain HTTP/JSON: cacheable via standard HTTP semantics, debuggable with curl, first-class support in every language — exactly what external integrators expect. **gRPC** gives HTTP/2 multiplexing, binary Protobuf framing, code-generated typed stubs, and streaming — low latency and high throughput between services you control. **GraphQL** lets the mobile client declare the exact graph of fields it wants in one query, killing the over-fetching and N+1 round trips that hurt high-latency mobile networks.

:::muted
**Trade-off** — REST is the most interoperable and cache-friendly but tends toward chatty multi-endpoint flows and over/under-fetching. gRPC is fastest and most type-safe but awkward through browsers and proxies (needs gRPC-Web or a gateway). GraphQL collapses round trips but trades away HTTP caching and exposes an arbitrarily expensive query surface you must guard with depth limits, complexity scoring, and persisted queries.
:::

:::muted
**Common pitfall** — Forcing one protocol everywhere: GraphQL on internal hot paths adds resolver overhead where a flat gRPC call would do; gRPC on a public API alienates integrators who just want JSON. An unbounded GraphQL query can melt the backend (thousands of resolver calls per request) without DataLoader batching and cost limits, and reusing/renumbering Protobuf field numbers silently corrupts data across deploys.
:::

*Go deeper: how would you protect a public GraphQL endpoint from a single malicious deeply-nested query?*

**Keywords** — `HTTP/JSON cacheability · Protobuf field numbers · HTTP/2 multiplexing · over-fetching · N+1 · DataLoader · persisted queries`

### New answer (vi)
**Chốt** — REST cho public API, gRPC cho internal service-to-service, GraphQL cho bề mặt mobile/BFF. Các trục quyết định là độ phủ đối tượng, hiệu quả payload, và mức độ client cần định hình response.

**Cơ chế** — **REST** chạy trên HTTP/JSON thuần: cacheable qua HTTP semantics chuẩn, debug bằng curl, hỗ trợ hạng nhất ở mọi ngôn ngữ — đúng thứ integrator bên ngoài kỳ vọng. **gRPC** cho HTTP/2 multiplexing, binary Protobuf framing, stub typed sinh tự động và streaming — latency thấp, throughput cao giữa các service bạn kiểm soát. **GraphQL** cho client mobile khai báo đúng graph các field nó muốn trong một query, loại bỏ over-fetching và các round trip N+1 vốn gây hại trên mạng mobile latency cao.

:::muted
**Trade-off** — REST interoperable và cache-friendly nhất nhưng thiên về flow nhiều endpoint chatty và over/under-fetching. gRPC nhanh và type-safe nhất nhưng vướng víu qua browser và proxy (cần gRPC-Web hoặc gateway). GraphQL gộp round trip nhưng đánh đổi mất HTTP caching và phơi bày một bề mặt query chi phí tùy ý phải guard bằng depth limit, complexity scoring và persisted query.
:::

:::muted
**Bẫy thường gặp** — Ép một protocol cho mọi nơi: GraphQL trên internal hot path thêm resolver overhead nơi một lời gọi gRPC phẳng là đủ; gRPC trên public API làm xa lánh integrator chỉ muốn JSON. Một query GraphQL không giới hạn có thể làm nóng chảy backend (hàng nghìn resolver call mỗi request) nếu thiếu DataLoader batching và cost limit, và tái dùng/đánh số lại field-number trong Protobuf âm thầm làm hỏng dữ liệu qua các lần deploy.
:::

*Đào sâu tiếp: bạn sẽ bảo vệ một public GraphQL endpoint khỏi một query nested sâu độc hại đơn lẻ thế nào?*

**Từ khoá ăn điểm** — `HTTP/JSON cacheability · Protobuf field numbers · HTTP/2 multiplexing · over-fetching · N+1 · DataLoader · persisted queries`

## 1-card — senior — [AsyncMessaging, Coupling]
**Question:** Your checkout service calls the email, analytics, and loyalty services synchronously inside the order request. When the loyalty service slows to 3 seconds, checkout latency spikes and orders start failing. Redesign the communication and explain what changes about coupling and failure isolation.
**Verdict:** KEEP — Senior-level redesign with real coupling/consistency trade-offs and a clear "why"; invites outbox/idempotency follow-ups.

### New answer (en)
**TL;DR** — Keep synchronous request/response only for what the user must wait on (charge the card, reserve inventory) and move the side effects — email, analytics, loyalty — onto async messaging: checkout publishes `OrderPlaced` and returns immediately. This converts temporal coupling into temporal decoupling, so a slow loyalty service no longer adds latency to checkout or fails the order.

**How it works** — Checkout commits the order and emits an event to a broker; downstream services consume it on their own schedule. To make the publish atomic with the DB write, use the **transactional outbox**: the event row commits in the same transaction as the order, and a relay ships it afterward. The caller is no longer blocked until every callee responds, so each consumer's availability stops compounding into checkout's.

:::muted
**Trade-off** — Synchronous calls give an immediate result and one end-to-end stack trace, but they chain availability (effective uptime is the product of every dependency's) and stack tail latency. Async buys failure isolation and independent scaling, but you pay in eventual consistency (loyalty points appear seconds later), harder debugging across topics, and you now own a broker, dead-letter queues, and idempotent consumers.
:::

:::muted
**Common pitfall** — "Fire and forget" without durability: publish after the DB commit and crash in between, and the event is lost (loyalty silently never runs) — hence the outbox. The mirror mistake is publishing inside the transaction then rolling back, leaking a phantom event. At-least-once delivery reintroduces duplicates, so every consumer must be idempotent. And never async-ify a call the user genuinely needs synchronously (e.g. payment authorization) — that just hides a required failure in a worse place.
:::

*Go deeper: how does the relay in the outbox pattern guarantee at-least-once without double-publishing on restart?*

**Keywords** — `temporal coupling · transactional outbox · at-least-once · idempotent consumer · dead-letter queue · eventual consistency`

### New answer (vi)
**Chốt** — Giữ synchronous request/response chỉ cho thứ user buộc phải chờ (charge thẻ, reserve inventory) và chuyển các side effect — email, analytics, loyalty — sang async messaging: checkout publish `OrderPlaced` rồi trả về ngay. Điều này biến temporal coupling thành temporal decoupling, nên loyalty service chậm không còn thêm latency vào checkout hay làm fail order.

**Cơ chế** — Checkout commit order rồi emit event lên broker; các downstream service consume theo lịch riêng. Để publish atomic với DB write, dùng **transactional outbox**: row event commit cùng transaction với order, và một relay ship nó sau đó. Caller không còn bị block tới khi mọi callee trả lời, nên availability của từng consumer ngừng cộng dồn vào checkout.

:::muted
**Trade-off** — Synchronous call cho kết quả tức thì và một stack trace end-to-end, nhưng xâu chuỗi availability (uptime hiệu dụng là tích của mọi dependency) và cộng dồn tail latency. Async mua được failure isolation và scaling độc lập, nhưng trả giá bằng eventual consistency (loyalty point xuất hiện vài giây sau), debug khó hơn xuyên các topic, và giờ phải tự vận hành broker, dead-letter queue và idempotent consumer.
:::

:::muted
**Bẫy thường gặp** — "Fire and forget" không có durability: publish sau DB commit rồi crash giữa chừng, event bị mất (loyalty âm thầm không chạy) — vì vậy mới cần outbox. Sai lầm ngược lại là publish bên trong transaction rồi rollback, rò rỉ phantom event. At-least-once delivery tái xuất hiện duplicate, nên mọi consumer phải idempotent. Và đừng bao giờ async-hóa một lời gọi user thực sự cần đồng bộ (ví dụ payment authorization) — chỉ là giấu một failure bắt buộc ở chỗ tệ hơn.
:::

*Đào sâu tiếp: relay trong outbox pattern đảm bảo at-least-once mà không double-publish khi restart như thế nào?*

**Từ khoá ăn điểm** — `temporal coupling · transactional outbox · at-least-once · idempotent consumer · dead-letter queue · eventual consistency`

## 2-card — middle — [Idempotency, Retries]
**Question:** A client times out on `POST /payments`, retries, and the customer gets charged twice. Walk through which HTTP methods are inherently idempotent, why POST is not, and how an idempotency key makes the retry safe.
**Verdict:** KEEP — Diagnosis + mechanism + concurrency edge cases; a classic deep middle/senior question with real follow-ups.

### New answer (en)
**TL;DR** — GET, HEAD, PUT, and DELETE are idempotent by the HTTP spec; POST is not, because each call is meant to create a new side effect — so a retry creates a second charge. An **idempotency key** (a client-generated UUID per logical operation, sent as a header) makes the non-idempotent retry safe without changing the verb.

**How it works** — PUT sets a resource to a value, DELETE removes it, GET has no side effect — repeating any of them lands the same server state. For POST, the server records the idempotency key with the result of the first execution; on any retry with the same key it returns the stored result instead of charging again. The key turns "create a charge" into a once-only operation keyed on client intent.

:::muted
**Trade-off** — Keys require server-side (key → result) storage with a TTL, a uniqueness constraint, and a concurrency guard so two simultaneous retries don't both execute — you trade a little storage and a hot-path write for safe retries. The alternative of "make everything PUT" fits resource replacement but not "create a charge" semantics, and natural idempotency (DELETE on an already-gone row) still needs a sane status code rather than a confusing 404.
:::

:::muted
**Common pitfall** — The dangerous race: two retries arrive concurrently, both miss the key lookup, both charge — guard the insert with a unique constraint or `INSERT ... ON CONFLICT` so the second blocks or short-circuits. Reusing the same key for a *different* request body must be rejected (409), not silently served the old result. And idempotency is not dedup forever: keys expire, so a retry after the TTL re-executes — size the TTL to comfortably exceed the client's max retry window.
:::

*Go deeper: how do you return the right response for a retry that arrives while the first execution is still in flight?*

**Keywords** — `idempotent verbs · idempotency key · TTL · unique constraint · INSERT ... ON CONFLICT · 409 conflict · at-least-once`

### New answer (vi)
**Chốt** — GET, HEAD, PUT và DELETE idempotent theo HTTP spec; POST thì không, vì mỗi lời gọi nhằm tạo một side effect mới — nên một retry tạo charge thứ hai. Một **idempotency key** (UUID client sinh cho mỗi operation logic, gửi dưới dạng header) làm retry không idempotent trở nên an toàn mà không đổi verb.

**Cơ chế** — PUT set resource về một giá trị, DELETE xóa nó, GET không có side effect — lặp lại bất kỳ cái nào cũng cho cùng server state. Với POST, server ghi idempotency key cùng kết quả của lần thực thi đầu; với bất kỳ retry nào mang cùng key, nó trả về kết quả đã lưu thay vì charge lại. Key biến "tạo một charge" thành operation chỉ-một-lần neo theo ý định của client.

:::muted
**Trade-off** — Key đòi lưu trữ server-side (key → result) kèm TTL, một uniqueness constraint và một concurrency guard để hai retry đồng thời không cùng thực thi — bạn đánh đổi một chút storage và một write trên hot path lấy retry an toàn. Phương án "biến mọi thứ thành PUT" hợp cho resource replacement nhưng không khớp semantics "tạo charge", và natural idempotency (DELETE trên row đã xóa) vẫn cần một status code hợp lý thay vì một 404 khó hiểu.
:::

:::muted
**Bẫy thường gặp** — Race nguy hiểm: hai retry đến đồng thời, cả hai miss lookup key, cả hai charge — guard insert bằng unique constraint hoặc `INSERT ... ON CONFLICT` để cái thứ hai block hoặc short-circuit. Tái dùng cùng key cho một request body *khác* phải bị từ chối (409), không được âm thầm phục vụ kết quả cũ. Và idempotency không phải dedup vĩnh viễn: key hết hạn, nên một retry sau TTL sẽ thực thi lại — chọn TTL đủ lớn vượt thoải mái cửa sổ retry tối đa của client.
:::

*Đào sâu tiếp: bạn trả response đúng thế nào cho một retry đến khi lần thực thi đầu vẫn đang dang dở?*

**Từ khoá ăn điểm** — `idempotent verbs · idempotency key · TTL · unique constraint · INSERT ... ON CONFLICT · 409 conflict · at-least-once`

## 3-card — middle — [Pagination, Performance]
**Question:** Your `GET /events?page=5000&limit=20` endpoint is fast on page 1 but takes seconds by page 5000, and users occasionally see duplicate or skipped rows while scrolling. Diagnose why offset pagination degrades and redesign with cursor/keyset pagination.
**Verdict:** KEEP — Performance diagnosis + correctness bug + redesign with index reasoning; strong middle-level depth.

### New answer (en)
**TL;DR** — Offset pagination (`LIMIT 20 OFFSET 100000`) forces the DB to scan and discard all 100,000 preceding rows on every deep page, so cost grows linearly with the offset. Replace it with **keyset (cursor) pagination**, which seeks directly to the boundary and reads exactly 20 rows regardless of depth — page 5000 is as fast as page 1.

**How it works** — Order by a stable, indexed, unique key like `(created_at, id)`. Instead of an offset, the client passes the last seen key: `WHERE (created_at, id) < (:lastTs, :lastId) ORDER BY created_at DESC, id DESC LIMIT 20`. With an index on that tuple the planner seeks to the boundary instead of counting from the top. The cursor is just an opaque token encoding that last-key tuple.

:::muted
**Trade-off** — Keyset gives O(limit) deep-page performance and a stable window even as rows are inserted, but you lose random access: no jumping straight to "page 5000", only walking from a cursor, and total counts / "page N of M" become expensive. Offset is simpler and supports arbitrary jumps and counts — keep it for small, mostly-static datasets and admin tables; use keyset for infinite scroll, feeds, exports, and any large or actively-changing dataset.
:::

:::muted
**Common pitfall** — Offset's correctness bug is the moving window: a row inserted before your current offset between requests shifts every later row by one, so you re-see a row (duplicate) or skip one. Keyset avoids this because the cursor anchors to a value, not a position. Keyset's own trap is ordering on a non-unique column alone (only `created_at`): ties at the boundary drop or repeat rows — always add a tiebreaker like the primary key, and match the composite index to the ORDER BY direction or the planner falls back to a sort.
:::

*Go deeper: how do you implement bidirectional (forward and backward) cursor paging from a single keyset query?*

**Keywords** — `OFFSET scan cost · keyset/cursor · row-value comparison · composite index · tiebreaker · moving-window skip/duplicate`

### New answer (vi)
**Chốt** — Offset pagination (`LIMIT 20 OFFSET 100000`) buộc DB scan và bỏ đi toàn bộ 100.000 row trước đó ở mỗi deep page, nên chi phí tăng tuyến tính theo offset. Thay bằng **keyset (cursor) pagination**, vốn seek thẳng tới ranh giới và đọc đúng 20 row bất kể độ sâu — page 5000 nhanh như page 1.

**Cơ chế** — Order theo một key ổn định, có index, duy nhất như `(created_at, id)`. Thay vì offset, client truyền key cuối đã thấy: `WHERE (created_at, id) < (:lastTs, :lastId) ORDER BY created_at DESC, id DESC LIMIT 20`. Với một index trên tuple đó, planner seek tới ranh giới thay vì đếm từ đầu. Cursor chỉ là một token mờ encode cái last-key tuple đó.

:::muted
**Trade-off** — Keyset cho hiệu năng deep-page O(limit) và một cửa sổ ổn định ngay cả khi row được chèn vào, nhưng bạn mất random access: không nhảy thẳng tới "page 5000", chỉ đi từ một cursor, và total count / "page N of M" trở nên đắt. Offset đơn giản hơn và hỗ trợ nhảy tùy ý cùng count — giữ nó cho dataset nhỏ, gần như tĩnh và bảng admin; dùng keyset cho infinite scroll, feed, export và mọi dataset lớn hoặc đang thay đổi.
:::

:::muted
**Bẫy thường gặp** — Bug đúng-sai của offset là cửa sổ dịch chuyển: một row chèn trước offset hiện tại giữa các request làm mọi row sau dịch một, nên bạn thấy lại một row (duplicate) hoặc skip một. Keyset tránh điều này vì cursor neo vào một giá trị, không phải vị trí. Cạm bẫy riêng của keyset là order trên một cột không duy nhất đơn lẻ (chỉ `created_at`): các tie ở ranh giới làm drop hoặc lặp row — luôn thêm tiebreaker như primary key, và khớp composite index với hướng ORDER BY nếu không planner rơi về một sort.
:::

*Đào sâu tiếp: bạn cài cursor paging hai chiều (tới và lui) từ một query keyset duy nhất thế nào?*

**Từ khoá ăn điểm** — `OFFSET scan cost · keyset/cursor · row-value comparison · composite index · tiebreaker · moving-window skip/duplicate`

## 4-card — senior — [Versioning, APIContract]
**Question:** You need to rename a field and change a response shape in a public API that thousands of clients depend on, none of which you control. Compare URI versioning, header versioning, and content negotiation, and lay out a strategy to evolve the contract without breaking anyone.
**Verdict:** KEEP — Senior contract-evolution question with three real mechanisms and a deprecation strategy; rich trade-offs and follow-ups.

### New answer (en)
**TL;DR** — Compare three mechanisms, then default to **URI versioning for major breaking changes plus an additive-only rule within a version**: prefer non-breaking evolution (add fields, never remove or repurpose) and reserve a version bump for genuinely incompatible shape changes.

**How it works** — **URI versioning** (`/v2/orders`) is the most visible and cache-friendly, trivial to route and test, but pollutes URLs and implies the whole API moves in lockstep. **Header versioning** (`API-Version: 2`) keeps URLs stable and lets you version per-resource, but it's invisible in a browser, easy to forget, and harder to cache. **Content negotiation** (`Accept: application/vnd.myapi.v2+json`) is the most RESTful and serves multiple representations from one URL, but it's the most awkward for clients and tooling.

:::muted
**Trade-off** — URI versioning is operationally simplest and easiest to communicate, but every new major version multiplies the surfaces to maintain, document, and deprecate. Header/content negotiation keeps a clean URL space and finer granularity but raises support burden because failures are subtler (a missing or wrong header silently serves the default). The deeper trade-off is maintenance cost versus client safety — fewer versions is always better, achieved by making most changes additive.
:::

:::muted
**Common pitfall** — Breaking-change traps: renaming/removing a field, changing a type, tightening validation, or changing the meaning of an existing value — any can crash a client mid-flight. Safe evolution: add the new field alongside the old, dual-write for a deprecation window, retire the old field only after telemetry shows no traffic. The worst failure is shipping a "minor" change that's actually breaking (optional→required, changed default sort) — pair every version with a published deprecation policy, sunset headers, and per-field usage metrics so you retire on evidence, not hope.
:::

*Go deeper: how do you measure that no client still depends on a deprecated field before you delete it?*

**Keywords** — `URI vs header vs content negotiation · additive-only · dual-write · deprecation window · Sunset header · per-field usage metrics`

### New answer (vi)
**Chốt** — So sánh ba cơ chế, rồi mặc định **URI versioning cho các breaking change lớn cộng quy tắc chỉ-additive trong một version**: ưu tiên tiến hóa non-breaking (thêm field, không bao giờ xóa hay repurpose) và dành một bump version cho các thay đổi shape thực sự không tương thích.

**Cơ chế** — **URI versioning** (`/v2/orders`) dễ thấy nhất và cache-friendly, route và test cực dễ, nhưng làm bẩn URL và ngụ ý cả API di chuyển đồng loạt. **Header versioning** (`API-Version: 2`) giữ URL ổn định và cho version theo từng resource, nhưng vô hình trên browser, dễ quên, và khó cache hơn. **Content negotiation** (`Accept: application/vnd.myapi.v2+json`) RESTful nhất và phục vụ nhiều representation từ một URL, nhưng vướng víu nhất cho client và tooling.

:::muted
**Trade-off** — URI versioning đơn giản nhất về vận hành và dễ truyền đạt nhất, nhưng mỗi major version mới nhân lên các bề mặt phải bảo trì, document và deprecate. Header/content negotiation giữ không gian URL sạch và độ chi tiết mịn hơn nhưng tăng gánh nặng support vì failure tinh vi hơn (header thiếu hoặc sai âm thầm phục vụ default). Trade-off sâu hơn là chi phí bảo trì so với an toàn của client — càng ít version càng tốt, đạt được bằng cách làm phần lớn thay đổi mang tính additive.
:::

:::muted
**Bẫy thường gặp** — Các bẫy breaking-change: đổi tên/xóa một field, đổi type, siết validation, hoặc đổi ý nghĩa một giá trị hiện hữu — bất kỳ cái nào cũng có thể crash một client giữa chừng. Tiến hóa an toàn: thêm field mới bên cạnh field cũ, dual-write trong một cửa sổ deprecation, chỉ rút field cũ sau khi telemetry cho thấy không còn traffic. Failure tệ nhất là ship một thay đổi "minor" mà thực ra là breaking (optional→required, đổi default sort) — đi kèm mỗi version một deprecation policy công bố, sunset header và metric usage theo từng field để rút lui dựa trên bằng chứng, không phải hy vọng.
:::

*Đào sâu tiếp: bạn đo bằng cách nào rằng không client nào còn phụ thuộc một field deprecated trước khi xóa nó?*

**Từ khoá ăn điểm** — `URI vs header vs content negotiation · additive-only · dual-write · deprecation window · Sunset header · per-field usage metrics`

## 5-card — senior — [Backpressure, RateLimiting]
**Question:** A downstream service starts responding slowly under load. Your upstream services, configured with aggressive retries, pile on more requests and the downstream collapses entirely — a retry storm. Explain backpressure and rate limiting between services and how to stop the cascade.
**Verdict:** KEEP — Senior resilience question: feedback-loop diagnosis plus a coordinated set of mitigations and their trade-offs.

### New answer (en)
**TL;DR** — Stop the amplification with three coordinated controls: **backpressure** (bound queues/pools and shed load fast with 429/503 instead of buffering unbounded), a **circuit breaker** on the caller (fail fast once downstream error/latency crosses a threshold), and **rate limiting** (token bucket at the boundary), with retries capped and given exponential backoff + jitter. Together they convert unbounded amplification into controlled, recoverable degradation.

**How it works** — Bounded queues and connection pools mean that when they fill you reject rather than buffering to OOM. The circuit breaker opens during a cooldown so callers stop hammering a dying service, then half-opens to probe recovery. The token bucket caps the rate any single caller can impose. Backoff with jitter spreads retries so clients don't all retry in lockstep.

:::muted
**Trade-off** — Backpressure and breakers deliberately drop the marginal request now for system survival and faster recovery. Aggressive retries raise success on transient blips but, unbounded, multiply load exactly when the system can least absorb it. Rate limits protect the downstream but can throttle legitimate bursts, so tune them against real capacity and add priority tiers so critical traffic survives while best-effort traffic is shed first.
:::

:::muted
**Common pitfall** — The retry storm is positive feedback: slow downstream → timeouts → retries → more load → slower; amplification can be 3x+ when every layer retries independently (it compounds multiplicatively up the stack). Failure modes that bite: fixed-interval retries (thundering-herd lockstep — always add jitter), unbounded retry budgets, and missing breakers so callers keep dialing a corpse. Beware retrying non-idempotent calls, and breakers with no half-open probe that either never recover or slam the downstream the instant they close.
:::

*Go deeper: how do you tune a circuit breaker's open-duration and half-open probe count so it recovers fast without re-triggering the collapse?*

**Keywords** — `backpressure · load shedding 429/503 · circuit breaker (half-open) · token bucket · exponential backoff + jitter · retry budget · thundering herd`

### New answer (vi)
**Chốt** — Chặn amplification bằng ba kiểm soát phối hợp: **backpressure** (giới hạn queue/pool và shed load nhanh bằng 429/503 thay vì buffer không giới hạn), một **circuit breaker** ở phía caller (fail fast khi error/latency downstream vượt ngưỡng), và **rate limiting** (token bucket ở ranh giới), với retry được cap và cho exponential backoff + jitter. Cùng nhau chúng biến amplification không giới hạn thành degradation có kiểm soát, hồi phục được.

**Cơ chế** — Queue và connection pool có giới hạn nghĩa là khi đầy bạn từ chối thay vì buffer tới OOM. Circuit breaker mở trong một cooldown để caller ngừng nện một service đang chết, rồi half-open để probe hồi phục. Token bucket cap tốc độ mà bất kỳ caller đơn lẻ nào áp đặt. Backoff với jitter rải retry để client không cùng retry đồng loạt.

:::muted
**Trade-off** — Backpressure và breaker cố ý drop request biên ngay bây giờ để hệ thống sống còn và hồi phục nhanh hơn. Retry hung hãn nâng tỷ lệ thành công cho trục trặc transient nhưng, không giới hạn, nhân tải lên đúng lúc hệ thống kém khả năng hấp thụ nhất. Rate limit bảo vệ downstream nhưng có thể throttle burst hợp lệ, nên tinh chỉnh theo capacity thực và thêm priority tier để traffic quan trọng sống sót còn traffic best-effort bị shed trước.
:::

:::muted
**Bẫy thường gặp** — Retry storm là feedback dương: downstream chậm → timeout → retry → thêm tải → chậm hơn; amplification có thể 3x+ khi mỗi tầng retry độc lập (cộng dồn theo cấp số nhân lên stack). Các failure-mode cắn người: retry interval cố định (thundering-herd đồng loạt — luôn thêm jitter), retry budget không giới hạn, và thiếu breaker khiến caller cứ quay số một cái xác. Cảnh giác retry các lời gọi không idempotent, và breaker không có half-open probe vốn hoặc không bao giờ hồi phục hoặc nện downstream ngay khoảnh khắc nó đóng.
:::

*Đào sâu tiếp: bạn tinh chỉnh open-duration và số half-open probe của circuit breaker thế nào để nó hồi phục nhanh mà không kích lại cú sụp?*

**Từ khoá ăn điểm** — `backpressure · load shedding 429/503 · circuit breaker (half-open) · token bucket · exponential backoff + jitter · retry budget · thundering herd`

## 6-card — junior — [Webhooks, RealTime]
**Question:** You need to notify clients when a payment settles. A teammate suggests the client just poll `GET /payment/status` every second. Compare polling, webhooks, and long-poll/SSE/WebSocket for server-to-client events in terms of delivery guarantees and operational cost.
**Verdict:** KEEP — Even at junior level this is a genuine comparison-and-choose question with real cost/latency reasoning, not single-fact recall.

### New answer (en)
**TL;DR** — Match the channel to the consumer: **webhooks** for server-to-server events like a settled payment (server pushes immediately, zero idle traffic); **SSE** for a one-way live update to a browser status page; **WebSocket** for genuinely bidirectional low-latency needs like chat. Per-second **polling** is the worst fit here — it wastes requests and adds latency equal to the interval.

**How it works** — Polling has the client repeatedly ask "is it done yet?" — dead simple and firewall-friendly, but inefficient. Webhooks invert control: the server makes an HTTP callback to a URL the client registered, so the client learns the instant the payment settles. SSE is a one-way server→browser stream over a single long-lived HTTP connection. WebSocket is full-duplex over one persistent connection.

:::muted
**Common pitfall** — Webhooks are at-least-once at best: the receiver can be down or slow, so the sender retries with backoff and the receiver must be idempotent or it double-processes a payment. Always verify authenticity (HMAC signature) or anyone can POST a fake "payment succeeded." Polling's failure is silent waste — a 1-second poll on a million clients is a million mostly-empty requests/sec. SSE/WebSocket connections silently die behind proxies and idle timeouts, so without heartbeats and reconnection the client thinks it's connected while receiving nothing.
:::

**Keywords** — `polling interval latency · webhook callback · at-least-once · HMAC signature verification · SSE one-way · WebSocket full-duplex · heartbeat/reconnect`

### New answer (vi)
**Chốt** — Khớp kênh với bên tiêu thụ: **webhooks** cho server-to-server event như payment settle (server push ngay, zero idle traffic); **SSE** cho live update một chiều tới một trang status trên browser; **WebSocket** cho nhu cầu thực sự hai chiều latency thấp như chat. **Polling** mỗi giây là lựa chọn tệ nhất ở đây — lãng phí request và thêm latency bằng đúng interval.

**Cơ chế** — Polling để client liên tục hỏi "xong chưa?" — cực đơn giản và thân thiện firewall, nhưng kém hiệu quả. Webhooks đảo ngược control: server thực hiện một HTTP callback tới URL client đã đăng ký, nên client biết ngay khoảnh khắc payment settle. SSE là một stream một chiều server→browser trên một kết nối HTTP long-lived duy nhất. WebSocket là full-duplex trên một kết nối persistent.

:::muted
**Bẫy thường gặp** — Webhooks tốt nhất là at-least-once: bên nhận có thể down hoặc chậm, nên bên gửi retry với backoff và bên nhận phải idempotent nếu không sẽ double-process một payment. Luôn verify tính xác thực (HMAC signature) hoặc bất kỳ ai cũng có thể POST một "payment succeeded" giả. Failure của polling là lãng phí âm thầm — một poll mỗi giây trên một triệu client là một triệu request/giây toàn câu trả lời rỗng. Kết nối SSE/WebSocket âm thầm chết sau proxy và idle timeout, nên không có heartbeat và reconnection thì client tưởng đang kết nối trong khi chẳng nhận được gì.
:::

**Từ khoá ăn điểm** — `polling interval latency · webhook callback · at-least-once · HMAC signature verification · SSE one-way · WebSocket full-duplex · heartbeat/reconnect`

## 7-card — staff — [APIGateway, BFF]
**Question:** You have a web app, an iOS app, and partner integrations all talking to 30 microservices, and each client reimplements auth, retries, and response stitching. Design an API gateway / BFF layer covering auth, aggregation, and rate limiting — and explain how to keep it from becoming a fat, fragile chokepoint.
**Verdict:** KEEP — Staff-level architecture question with a centralization-vs-autonomy tension and concrete anti-pattern (fat gateway); strong design reasoning.

### New answer (en)
**TL;DR** — Put a **thin API gateway** at the edge for the cross-cutting concerns every client needs identically (TLS termination, auth/token validation, rate limiting, routing, basic observability), and give each client family its own **BFF** (web, mobile, partner) that aggregates and shapes responses for that client's exact needs. The gateway centralizes policy; the BFFs absorb client-specific aggregation — so clients stop reimplementing auth, retries, and stitching.

**How it works** — The gateway is the single enforcement point for auth and limits and routes to services; it does not decide business logic. Each BFF sits behind it, stitching the 30 services into one tailored payload — the mobile BFF can return a leaner shape than the web BFF. This removes duplicated auth/retry logic from clients while keeping each surface tailored and independently deployable.

:::muted
**Trade-off** — A gateway/BFF removes duplication and gives one enforcement point, but adds a network hop and a powerful shared component that becomes a SPOF if it's down or misconfigured. Per-client BFFs keep each surface thin and independently deployable but multiply the number of services to own. The deep tension is centralization vs team autonomy: too much logic in one gateway and every team blocks behind one deploy queue; too little and you re-duplicate concerns — the BFF-per-team split is what buys autonomy back.
:::

:::muted
**Common pitfall** — The dominant failure is the **fat gateway**: business logic, transformations, and orchestration creep into the edge until it's a distributed monolith no one fully understands and every team must coordinate to change — a deploy bottleneck and a blast-radius bomb. Keep business logic in the services; the gateway routes and enforces, it does not decide. Operationally it's a SPOF and saturation target, so it needs horizontal scaling, health checks, circuit breakers to downstreams, and careful timeout budgets — a slow downstream behind a gateway aggregating ten calls can exhaust its connection pool and take down every client at once.
:::

*Go deeper: where do you draw the line between "aggregation" that belongs in a BFF and "orchestration" that's really business logic that belongs in a service?*

**Keywords** — `thin gateway vs BFF · cross-cutting concerns · fat gateway / distributed monolith · SPOF · connection-pool exhaustion · centralization vs autonomy`

### New answer (vi)
**Chốt** — Đặt một **API gateway mỏng** ở edge cho các mối quan tâm cross-cutting mà mọi client cần giống hệt (TLS termination, auth/token validation, rate limiting, routing, observability cơ bản), và cho mỗi họ client một **BFF** riêng (web, mobile, partner) aggregate và định hình response cho đúng nhu cầu client đó. Gateway tập trung hóa policy; các BFF hấp thụ aggregation đặc thù client — nên client ngừng tự cài lại auth, retry và stitching.

**Cơ chế** — Gateway là điểm enforce duy nhất cho auth và limit và route tới các service; nó không quyết định business logic. Mỗi BFF nằm sau nó, stitch 30 service thành một payload may đo — mobile BFF có thể trả về một shape gọn hơn web BFF. Điều này gỡ logic auth/retry trùng lặp khỏi client trong khi giữ mỗi bề mặt được may đo và deploy độc lập.

:::muted
**Trade-off** — Một gateway/BFF gỡ trùng lặp và cho một điểm enforce duy nhất, nhưng thêm một network hop và một thành phần dùng chung đầy quyền lực trở thành SPOF nếu nó down hoặc cấu hình sai. BFF theo từng client giữ mỗi bề mặt mỏng và deploy độc lập nhưng nhân số service phải sở hữu. Căng thẳng sâu là tập trung hóa so với quyền tự chủ của team: quá nhiều logic trong một gateway thì mọi team kẹt sau một hàng deploy; quá ít thì bạn lại trùng lặp các mối quan tâm — cách chia BFF-theo-team mua lại quyền tự chủ.
:::

:::muted
**Bẫy thường gặp** — Failure chủ đạo là **fat gateway**: business logic, transformation và orchestration bò vào edge tới khi nó thành một distributed monolith không ai hiểu trọn vẹn và mọi team phải phối hợp để thay đổi — một bottleneck deploy và một quả bom blast-radius. Giữ business logic trong các service; gateway route và enforce, nó không quyết định. Về vận hành nó là một SPOF và mục tiêu saturation, nên cần horizontal scaling, health check, circuit breaker tới downstream, và budget timeout cẩn thận — một downstream chậm sau một gateway aggregate mười lời gọi có thể vắt kiệt connection pool và làm sập mọi client cùng lúc.
:::

*Đào sâu tiếp: bạn vạch ranh giới ở đâu giữa "aggregation" thuộc về BFF và "orchestration" thực ra là business logic thuộc về một service?*

**Từ khoá ăn điểm** — `thin gateway vs BFF · cross-cutting concerns · fat gateway / distributed monolith · SPOF · connection-pool exhaustion · centralization vs autonomy`
