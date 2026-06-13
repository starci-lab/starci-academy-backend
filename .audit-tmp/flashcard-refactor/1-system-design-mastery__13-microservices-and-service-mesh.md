# 1-system-design-mastery / 13-microservices-and-service-mesh
Summary: kept 8, delete 0 of 8

## 0-card — junior — [Monolith, Microservices]
**Question:** Your team has a working monolith and a director says "let's go microservices so we can scale." Before agreeing, list the concrete new costs the team takes on the day a single in-process function call becomes a call to another service.
**Verdict:** KEEP — open-ended cost/judgment question with real reasoning, scales with seniority.

### New answer (en)
**TL;DR** — The instant a method call crosses a process boundary it becomes a network call, and you inherit three taxes at once: distributed failure (latency, serialization, the callee being slow/down/unreachable), distributed data (no more ACID across services — eventual consistency and compensating actions), and distributed operations (many pipelines, monitoring, on-call, service discovery, versioned contracts instead of one artifact).

**How it works** — A monolith resolves that call in-process: same memory, same transaction, instant and reliable. Split it, and the call rides the network, so the caller can be healthy while the callee times out. Data that lived in one transaction now spans multiple databases, so you reason about staleness and write compensating actions instead of relying on a rollback. Operationally you go from deploying one thing to running, observing, and on-calling many — each needing discovery and a versioned contract. The honest summary: microservices buy independent deployability and team autonomy, paid for with distributed-systems complexity from day one.

:::muted
**Trade-off** — A monolith gives simple local calls, one transaction, one deploy, and easy debugging, at the cost of coupling teams to a shared release cadence and a single scaling unit. Microservices let teams ship independently and scale hot paths separately, but every call can fail on its own and every read may be stale. A small team on moderate load usually ships faster on a well-structured monolith; many teams contending over one codebase is the signal that coordination cost has overtaken distribution cost.
:::

:::muted
**Common pitfall** — Splitting for "scale" before there is an organizational or load problem that justifies it, then debugging across five services with no distributed tracing or centralized logs. Teams also forget the network is unreliable: a synchronous fan-out that worked in-process now amplifies tail latency, and one slow dependency cascades into timeouts everywhere.
:::

*Go deeper — at what concrete signal (team size, deploy contention, scaling limit) would you say the distribution cost is finally worth paying?*

**Keywords** — `network call · partial failure · eventual consistency · independent deployability · service discovery · versioned contract`

### New answer (vi)
**Chốt** — Ngay khi một lời gọi hàm vượt ranh giới process, nó thành network call, và bạn gánh ba khoản thuế cùng lúc: lỗi phân tán (latency, serialization, bên được gọi có thể chậm/chết/không với tới được), dữ liệu phân tán (mất ACID xuyên service — phải sống với eventual consistency và hành động bù trừ), và vận hành phân tán (nhiều pipeline, monitoring, on-call, service discovery, contract có version thay vì một artifact).

**Cơ chế** — Monolith giải quyết lời gọi đó in-process: cùng bộ nhớ, cùng transaction, tức thời và đáng tin. Tách ra, lời gọi đi qua mạng, nên bên gọi vẫn khoẻ trong khi bên được gọi timeout. Dữ liệu vốn trong một transaction nay trải nhiều database, nên bạn phải suy nghĩ về stale và viết hành động bù trừ thay vì dựa vào rollback. Về vận hành, bạn đi từ deploy một thứ sang chạy, quan sát và on-call nhiều thứ — mỗi cái cần discovery và contract có version. Tóm gọn: microservices mua khả năng deploy độc lập và sự tự chủ của team, trả bằng độ phức tạp hệ phân tán ngay từ ngày đầu.

:::muted
**Trade-off** — Monolith cho lời gọi local đơn giản, một transaction, một lần deploy và debug dễ, đổi lại buộc các team vào cùng nhịp release và một đơn vị scale duy nhất. Microservices cho phép ship độc lập và scale riêng hot path, nhưng mỗi lời gọi có thể tự fail và mỗi lần đọc có thể stale. Một team nhỏ tải vừa thường ship nhanh hơn trên monolith có cấu trúc tốt; nhiều team tranh nhau một codebase mới là tín hiệu chi phí phối hợp đã vượt chi phí phân tán.
:::

:::muted
**Bẫy thường gặp** — Tách để "scale" trước khi có vấn đề tổ chức hay tải thực sự biện minh, rồi phải debug xuyên năm service mà không có distributed tracing hay log tập trung. Team cũng quên network không đáng tin: một fan-out đồng bộ vốn ngon in-process nay khuếch đại tail latency, và một dependency chậm cascade thành timeout khắp nơi.
:::

*Đào sâu tiếp — ở tín hiệu cụ thể nào (quy mô team, tranh chấp deploy, giới hạn scale) bạn mới nói chi phí phân tán đáng để trả?*

**Từ khoá ăn điểm** — `network call · partial failure · eventual consistency · independent deployability · service discovery · versioned contract`

## 1-card — middle — [Service Discovery, Load Balancing]
**Question:** Service A needs to call Service B, but B runs as 12 pods that come and go as Kubernetes autoscales and reschedules them. How does A find a healthy instance of B, and what is the difference between client-side and server-side load balancing in this picture?
**Verdict:** KEEP — diagnosis + design-decision question contrasting two real strategies.

### New answer (en)
**TL;DR** — Instances register their address into a registry (Consul, etcd, or Kubernetes endpoints) kept fresh by health checks so dead pods drop out. With **server-side** LB, A calls a stable virtual address (a Service ClusterIP, a load balancer, or a mesh proxy) and the intermediary picks a healthy backend; with **client-side** LB, A pulls B's current endpoint list and chooses an instance itself, saving a hop.

**How it works** — In Kubernetes the default is server-side: A targets the Service abstraction and kube-proxy/DNS routes it to a live endpoint, so A never sees individual pods. Client-side LB hands A the endpoint list and the picking algorithm (round-robin, least-request, zone affinity), removing the intermediary hop and letting the caller make latency-aware choices. A service mesh is the modern blend: it moves the client-side load-balancing decision into a sidecar right next to A, so A's code gets smart balancing without knowing anything about it.

:::muted
**Trade-off** — Server-side keeps clients dumb and centralizes routing policy, but the balancer is an extra hop, a potential bottleneck or single point of failure, with coarse per-request visibility. Client-side removes the hop and enables smart, latency-aware choices, but pushes registry integration, retry, and policy into every client or language SDK. A mesh sidecar gives client-side smarts and rich policy without polluting app code, at the cost of running and updating that proxy fleet.
:::

:::muted
**Common pitfall** — Stale registry data: if health checks are slow or deregistration lags, A keeps routing to pods that are already gone. DNS-based discovery is especially treacherous because clients and runtimes cache DNS aggressively, so a scaled-down instance keeps getting traffic. Independent client-side round-robin over lists refreshed on different schedules also skews load — prefer least-request signals and fast, consistent endpoint propagation.
:::

*Go deeper — how do health-check timing and deregistration lag determine how long a dead pod keeps receiving traffic?*

**Keywords** — `service registry · health check · ClusterIP · kube-proxy · client-side vs server-side · least-request · sidecar`

### New answer (vi)
**Chốt** — Các instance đăng ký địa chỉ vào một registry (Consul, etcd, hoặc endpoints của Kubernetes) được giữ tươi bằng health check để pod chết bị loại. Với LB **server-side**, A gọi một địa chỉ ảo ổn định (Service ClusterIP, một load balancer, hoặc mesh proxy) và bên trung gian chọn backend khoẻ; với LB **client-side**, A tự kéo danh sách endpoint hiện tại của B rồi tự chọn instance, tiết kiệm một hop.

**Cơ chế** — Trong Kubernetes mặc định là server-side: A nhắm tới abstraction Service và kube-proxy/DNS route tới một endpoint sống, nên A không bao giờ thấy từng pod. LB client-side trao cho A danh sách endpoint và thuật toán chọn (round-robin, least-request, zone affinity), bỏ được hop trung gian và để bên gọi ra quyết định nhạy latency. Service mesh là cách pha trộn hiện đại: nó dời quyết định load balancing client-side vào một sidecar ngay cạnh A, nên code của A có "trí khôn" mà không cần biết gì.

:::muted
**Trade-off** — Server-side giữ client "ngu" và tập trung hoá policy định tuyến, nhưng balancer là một hop dư, có thể thành nút thắt cổ chai hay điểm chết đơn lẻ, và nhìn chi phí từng request khá thô. Client-side bỏ được hop và cho phép quyết định thông minh, nhạy latency, nhưng đẩy tích hợp registry, retry và policy vào từng client hoặc từng SDK. Sidecar mesh cho "trí khôn" client-side cùng policy phong phú mà không làm bẩn code app, đổi lại phải chạy và cập nhật cả đội proxy.
:::

:::muted
**Bẫy thường gặp** — Dữ liệu registry stale: nếu health check chậm hoặc deregistration trễ, A cứ route tới pod đã biến mất. Discovery dựa trên DNS đặc biệt nguy hiểm vì client và runtime cache DNS rất hăng, nên instance đã scale-down vẫn nhận traffic. Mỗi client tự round-robin trên danh sách refresh theo lịch riêng cũng làm tải lệch — hãy ưu tiên tín hiệu least-request và đảm bảo endpoint lan truyền nhanh, nhất quán.
:::

*Đào sâu tiếp — timing của health check và độ trễ deregistration quyết định một pod chết còn nhận traffic bao lâu như thế nào?*

**Từ khoá ăn điểm** — `service registry · health check · ClusterIP · kube-proxy · client-side vs server-side · least-request · sidecar`

## 2-card — senior — [Distributed Monolith, Coupling]
**Question:** Six months after splitting your monolith, rendering one product page makes synchronous calls to catalog, pricing, inventory, and reviews — and a deploy of any one of them can break checkout. Diagnose what went wrong and explain why this "distributed monolith" is worse than the monolith you left.
**Verdict:** KEEP — senior diagnosis with a clear "why it's worse" judgment and remediation design.

### New answer (en)
**TL;DR** — The services were split by technical layer or by table, not by business capability, so one user action chains synchronous calls across all of them — that chatty request graph is the tell. It's worse than the original because you pay the full network, data, and ops tax of microservices while keeping the lockstep coupling of a monolith, and you lost atomic transactions and easy debugging on top.

**How it works** — The fix is to redraw boundaries around capabilities that own their data and can answer a request mostly on their own, then cut the synchronous chain: denormalize or cache locally the data a service needs, and move non-critical work to asynchronous events. For the product page specifically, compose at the edge (a BFF that fans out and degrades gracefully) and let services publish events so that, say, pricing changes are projected into the catalog's read model rather than fetched live on every render. The defining property you're restoring is that each service can deploy and fail independently without taking a sibling down.

:::muted
**Trade-off** — Event-driven decoupling buys independent deployability and failure isolation, but costs eventual consistency, denormalized/duplicated data, and the weight of a message bus and projections. Synchronous composition is simpler to reason about and always fresh, but re-couples lifecycles and multiplies latency and failure probability across the chain. The honest middle: keep synchronous calls only on the critical, latency-sensitive path and only to dependencies you can fall back on; push everything else to events.
:::

:::muted
**Common pitfall** — The acute failure is cascading latency and outages: each synchronous hop adds tail latency and a failure point, so one slow dependency times out the whole page, and without circuit breakers, bulkheads, and timeouts the failure propagates outward. The deeper trap is deploy coupling itself — when teams must coordinate releases across services to ship any feature, you have re-created the shared-release-cadence pain you were escaping, now spread across a network.
:::

*Go deeper — which of these synchronous calls truly belong on the critical render path, and which could become an event-driven read-model projection?*

**Keywords** — `business capability · bounded context · distributed monolith · chatty calls · BFF · read model · circuit breaker · deploy coupling`

### New answer (vi)
**Chốt** — Các service đã bị tách theo tầng kỹ thuật hoặc theo bảng, chứ không theo năng lực nghiệp vụ, nên một hành động của người dùng kéo theo chuỗi lời gọi đồng bộ qua tất cả — chính cái request graph "chatty" đó là dấu hiệu. Nó tệ hơn cái cũ vì bạn trả đủ thuế network, dữ liệu và vận hành của microservices trong khi vẫn giữ coupling lockstep của monolith, lại còn mất luôn transaction nguyên tử và khả năng debug dễ.

**Cơ chế** — Cách sửa là vẽ lại ranh giới quanh các capability sở hữu dữ liệu của riêng nó và tự trả lời được phần lớn một request, rồi cắt chuỗi đồng bộ: denormalize hoặc cache cục bộ dữ liệu service cần, và đẩy việc không quan trọng sang sự kiện bất đồng bộ. Riêng với trang sản phẩm, compose ở edge (một BFF fan-out và degrade duyên dáng) và để các service publish sự kiện, ví dụ thay đổi giá được chiếu (project) vào read model của catalog thay vì fetch trực tiếp mỗi lần render. Tính chất bạn đang khôi phục là mỗi service có thể deploy và fail độc lập mà không kéo theo service anh em.

:::muted
**Trade-off** — Tách rời event-driven mua được deploy độc lập và cô lập lỗi, nhưng cái giá là eventual consistency, dữ liệu trùng lặp/denormalized, và sức nặng của message bus cùng các projection. Compose đồng bộ dễ suy luận hơn và luôn tươi, nhưng re-couple vòng đời và nhân lên độ trễ cùng xác suất lỗi dọc chuỗi. Điểm dung hoà: chỉ giữ lời gọi đồng bộ trên đường đi quan trọng, nhạy latency và chỉ tới dependency bạn có thể fallback; còn lại đẩy hết sang sự kiện.
:::

:::muted
**Bẫy thường gặp** — Failure-mode cấp tính là độ trễ và sự cố cascade: mỗi hop đồng bộ thêm tail latency và một điểm lỗi, nên một dependency chậm timeout cả trang, và không có circuit breaker, bulkhead, timeout thì lỗi lan ra ngoài. Cái bẫy sâu hơn là deploy coupling — khi các team buộc phải phối hợp release xuyên service mới ship được feature, bạn đã tái tạo đúng nỗi đau "cùng nhịp release", nay trải khắp một mạng.
:::

*Đào sâu tiếp — trong các lời gọi đồng bộ này, cái nào thực sự thuộc đường render quan trọng, cái nào có thể thành projection read-model event-driven?*

**Từ khoá ăn điểm** — `business capability · bounded context · distributed monolith · chatty calls · BFF · read model · circuit breaker · deploy coupling`

## 3-card — senior — [Service Mesh, Sidecar]
**Question:** Every team has hand-rolled its own retry, timeout, TLS, and metrics code in five different languages, and the implementations disagree. A platform engineer proposes a service mesh with sidecars. What does the mesh actually offload from application code, and what new costs does the sidecar introduce?
**Verdict:** KEEP — senior trade-off question on a platform decision with concrete offload vs cost.

### New answer (en)
**TL;DR** — A service mesh injects a sidecar proxy (e.g. Envoy) next to each service and transparently intercepts all traffic, moving cross-cutting concerns out of app code into the data plane: mutual TLS and identity, retries, timeouts, circuit breaking, load balancing, traffic shaping (canary, fault injection), and uniform telemetry — all configured centrally by the control plane (e.g. istiod) instead of coded per language. The new cost is two extra proxy hops per request, per-pod CPU/memory, and a complex control plane to operate.

**How it works** — Because the sidecar owns the wire, resilience and security become a platform capability written once and enforced everywhere, replacing five divergent libraries. Every hop emits consistent metrics, access logs, and trace spans, so you finally get one coherent view regardless of service language. Policy lives in the control plane's config surface (VirtualServices, DestinationRules), so changing a timeout or a canary split is a config push, not a redeploy of app code.

:::muted
**Trade-off** — You gain language-agnostic, uniform security/resilience/observability with zero app code change, but every request traverses two added proxy hops (out of the caller's sidecar, into the callee's), adding latency and per-pod resource cost fleet-wide. The control plane is itself a complex distributed system to operate, upgrade, and debug, with a steep configuration learning curve. So you trade per-app library complexity for platform complexity.
:::

:::muted
**Common pitfall** — The mesh becomes a central failure domain and a debugging black box: a bad config push (wrong timeout, retry storm, an mTLS policy that rejects a caller) can break traffic mesh-wide, and engineers waste hours unsure whether the fault is app or proxy. Layered retries are the notorious trap — if both mesh and app retry, you multiply load and can amplify an overload into an outage. Sidecar resource overhead and startup ordering at scale are why sidecarless/ambient modes exist.
:::

*Go deeper — if both the mesh and the app retry on failure, how do you prevent the combined retry budget from amplifying an overload?*

**Keywords** — `data plane · control plane · Envoy · istiod · mTLS · sidecar hops · layered retries · ambient mesh`

### New answer (vi)
**Chốt** — Service mesh inject một sidecar proxy (ví dụ Envoy) cạnh mỗi service và chặn trong suốt toàn bộ traffic, dời các mối quan tâm cross-cutting khỏi code app xuống data plane: mutual TLS và identity, retry, timeout, circuit breaking, load balancing, traffic shaping (canary, fault injection) và telemetry đồng nhất — tất cả cấu hình tập trung bởi control plane (ví dụ istiod) thay vì code theo từng ngôn ngữ. Chi phí mới là hai hop proxy dư mỗi request, CPU/RAM mỗi pod, và một control plane phức tạp phải vận hành.

**Cơ chế** — Vì sidecar nắm đường truyền, resilience và bảo mật trở thành một năng lực platform viết một lần và enforce mọi nơi, thay cho năm thư viện lệch nhau. Mỗi hop phát ra metrics, access log và trace span nhất quán, nên cuối cùng bạn có một bức tranh mạch lạc bất kể service viết bằng ngôn ngữ nào. Policy sống ở bề mặt config của control plane (VirtualService, DestinationRule), nên đổi một timeout hay canary split là một lần đẩy config, không phải redeploy code app.

:::muted
**Trade-off** — Bạn được bảo mật/resilience/observability đồng nhất, không phụ thuộc ngôn ngữ, không đổi dòng code nào, nhưng mỗi request đi qua hai hop proxy dư (ra sidecar bên gọi, vào sidecar bên được gọi), thêm độ trễ và chi phí tài nguyên mỗi pod trên toàn fleet. Control plane bản thân là một hệ phân tán phức tạp phải vận hành, nâng cấp, debug, với đường học config dốc. Vậy bạn đổi độ phức tạp thư viện per-app lấy độ phức tạp platform.
:::

:::muted
**Bẫy thường gặp** — Mesh thành một failure domain trung tâm và một hộp đen khi debug: một lần đẩy config sai (timeout sai, retry storm, một policy mTLS từ chối bên gọi) có thể làm hỏng traffic toàn mesh, kỹ sư mất hàng giờ không biết lỗi ở app hay proxy. Retry chồng tầng là cái bẫy nổi tiếng — nếu cả mesh lẫn app cùng retry, bạn nhân tải lên và có thể biến quá tải thành sự cố. Overhead tài nguyên sidecar và thứ tự khởi động ở quy mô lớn là lý do tồn tại chế độ sidecarless/ambient.
:::

*Đào sâu tiếp — nếu cả mesh lẫn app cùng retry khi lỗi, làm sao tránh để tổng retry budget khuếch đại một tình huống quá tải?*

**Từ khoá ăn điểm** — `data plane · control plane · Envoy · istiod · mTLS · sidecar hops · layered retries · ambient mesh`

## 4-card — senior — [Outbox Pattern, CDC]
**Question:** Your Orders service must save an order to its database and publish an "OrderPlaced" event to Kafka so downstream services react. Doing both in sequence sometimes saves the order but loses the event (or vice versa) when a crash hits between them. Explain the dual-write problem and how the outbox pattern with CDC fixes it.
**Verdict:** KEEP — senior correctness/consistency design question with a precise mechanism.

### New answer (en)
**TL;DR** — The dual-write problem: the database and the broker are two separate systems with no shared transaction, so any "write DB, then publish" ordering can leave them inconsistent if the process dies in between. The outbox pattern removes the second system from the write path — in the *same* local transaction that saves the order you insert a row into an `outbox` table, so either both commit or neither does — and a CDC relay then turns each committed outbox row into a Kafka event.

**How it works** — Atomicity is restored because writing the order and the outbox row is now one transaction in one store. A separate relay reads the outbox and publishes; with Change Data Capture (e.g. Debezium tailing the database's write-ahead log) that relay is driven by the committed log itself, so every committed row reliably becomes an event with no application polling. The service writes only to its own database, and the event is guaranteed to follow.

:::muted
**Trade-off** — You trade the illusion of synchronous "save and publish" for guaranteed at-least-once delivery with a small publish delay, since events now flow asynchronously after commit. CDC adds infrastructure (a connector, the broker, care around log retention and connector lag) and the outbox table needs periodic cleanup. The payoff is correctness without distributed transactions or two-phase commit, which are heavyweight and poorly supported across a DB and a broker.
:::

:::muted
**Common pitfall** — At-least-once means duplicates are normal (a relay can publish, crash before recording progress, and re-publish), so every consumer must be idempotent, keyed by event id or order id. Ordering is the other trap: Kafka does not guarantee global order across partitions, so tolerate reordering or partition by aggregate id. And never "shortcut" by having the app publish to Kafka right after the DB commit — that reintroduces the exact dual-write race; nothing but the database may be in the write path.
:::

*Go deeper — how would you keep all events for one order in sequence while still spreading load across Kafka partitions?*

**Keywords** — `dual-write · outbox table · single local transaction · CDC · Debezium · WAL · at-least-once · idempotent consumer · partition by aggregate id`

### New answer (vi)
**Chốt** — Dual-write problem: database và broker là hai hệ thống riêng biệt không chia sẻ transaction, nên bất kỳ thứ tự "ghi DB rồi publish" nào cũng có thể để chúng lệch nếu process chết ở giữa. Outbox pattern loại hệ thống thứ hai khỏi write path — trong *cùng* một transaction local lưu đơn hàng, bạn insert một dòng vào bảng `outbox`, nên hoặc cả hai cùng commit hoặc không cái nào — và một relay CDC sau đó biến mỗi dòng outbox đã commit thành sự kiện Kafka.

**Cơ chế** — Tính nguyên tử được khôi phục vì ghi đơn hàng và dòng outbox giờ là một transaction trong một store. Một relay riêng đọc outbox và publish; với Change Data Capture (ví dụ Debezium đọc write-ahead log của database) relay được điều khiển bởi chính log đã commit, nên mọi dòng đã commit đáng tin cậy thành sự kiện mà không cần app poll. Service chỉ ghi vào database của riêng nó, và sự kiện được đảm bảo theo sau.

:::muted
**Trade-off** — Bạn đánh đổi ảo giác "lưu và publish" đồng bộ lấy đảm bảo giao at-least-once với một độ trễ publish nhỏ, vì sự kiện giờ chảy bất đồng bộ sau commit. CDC thêm hạ tầng (một connector, broker, sự chăm sóc quanh log retention và connector lag) và bảng outbox cần dọn định kỳ. Phần thưởng là tính đúng đắn mà không cần distributed transaction hay two-phase commit, vốn nặng nề và được hỗ trợ kém giữa một DB và một broker.
:::

:::muted
**Bẫy thường gặp** — At-least-once nghĩa là trùng lặp là bình thường (một relay có thể publish, crash trước khi ghi tiến độ, rồi publish lại), nên mọi consumer phải idempotent, key theo id sự kiện hoặc id đơn. Thứ tự là bẫy còn lại: Kafka không đảm bảo thứ tự toàn cục qua nhiều partition, nên hãy chịu được reordering hoặc partition theo aggregate id. Và đừng "đi tắt" bằng cách cho app publish lên Kafka ngay sau commit DB — điều đó tái sinh đúng cái race dual-write; không gì ngoài database được nằm trong write path.
:::

*Đào sâu tiếp — làm sao giữ tất cả sự kiện của một đơn theo đúng trình tự mà vẫn trải tải qua nhiều partition Kafka?*

**Từ khoá ăn điểm** — `dual-write · outbox table · single local transaction · CDC · Debezium · WAL · at-least-once · idempotent consumer · partition by aggregate id`

## 5-card — middle — [API Gateway, Service Mesh]
**Question:** A teammate says "we already have an API gateway, so we don't need a service mesh — they do the same thing." Explain why both can coexist by distinguishing north-south from east-west traffic, and give an example responsibility that belongs to each.
**Verdict:** KEEP — concept-distinction question that invites a clear coexistence design.

### New answer (en)
**TL;DR** — An API gateway governs **north-south** traffic (requests crossing the edge between external clients and your cluster); a service mesh governs **east-west** traffic (internal service-to-service calls). They operate at different planes, so a typical architecture runs both: the gateway protects the perimeter, the mesh hardens the interior.

**How it works** — The gateway is the single front door: it terminates public TLS, authenticates and authorizes end users (API keys, OAuth/JWT), enforces per-client rate limits and quotas, and routes/aggregates external requests to internal services. The mesh secures and controls the dense internal call graph: mutual TLS and workload identity between services, retries, timeouts, circuit breaking, and per-hop telemetry. Example split — public OAuth/JWT validation and client rate limiting belong to the gateway; service-to-service mTLS and per-hop retries belong to the mesh.

:::muted
**Trade-off** — Gateway-only leaves internal calls unencrypted and unobserved, with each service reimplementing resilience; mesh-only leaves you without a coherent edge for public auth, client rate limiting, and external contract aggregation. Running both means more moving parts and some functional overlap (both can do TLS, routing, retries), so you must decide clearly where each concern lives. Many meshes now ship a gateway component, blurring the boundary but not the responsibilities.
:::

:::muted
**Common pitfall** — Conflating them: pushing edge concerns (user auth, public rate limiting) into the mesh or internal concerns (mTLS, per-hop retries) into the gateway, leaving gaps where neither owns a control. Duplicated logic colliding (both applying retries/timeouts on one path) amplifies load. And treating the gateway as the only security boundary is dangerous — without east-west mTLS, anything inside the perimeter can talk to any service, the lateral-movement risk zero-trust internal identity is meant to close.
:::

*Go deeper — when a mesh ships its own gateway component, how do you decide whether public auth still belongs at the dedicated edge gateway?*

**Keywords** — `north-south vs east-west · perimeter vs interior · OAuth/JWT at edge · mTLS · workload identity · zero-trust · lateral movement`

### New answer (vi)
**Chốt** — API gateway quản traffic **north-south** (request vượt edge giữa client bên ngoài và cluster); service mesh quản traffic **east-west** (lời gọi service-to-service nội bộ). Chúng hoạt động ở các tầng khác nhau, nên một kiến trúc điển hình chạy cả hai: gateway bảo vệ vành đai, mesh làm cứng phần bên trong.

**Cơ chế** — Gateway là cánh cửa trước duy nhất: terminate TLS công khai, xác thực và phân quyền người dùng cuối (API key, OAuth/JWT), enforce rate limit và quota theo từng client, rồi route/aggregate request bên ngoài tới service nội bộ. Mesh bảo mật và điều khiển cái call graph nội bộ dày đặc: mutual TLS và workload identity giữa các service, retry, timeout, circuit breaking và telemetry theo từng hop. Ví dụ chia — xác thực OAuth/JWT công khai và rate limit theo client thuộc gateway; mTLS service-to-service và retry theo hop thuộc mesh.

:::muted
**Trade-off** — Chỉ gateway sẽ để mọi lời gọi nội bộ không mã hoá và không quan sát được, mỗi service tự cài lại resilience; chỉ mesh sẽ thiếu một edge mạch lạc cho auth công khai, rate limit theo client và aggregate contract bên ngoài. Chạy cả hai nghĩa là nhiều bộ phận hơn và một chút chồng chéo (cả hai làm được TLS, routing, retry), nên phải quyết rõ mỗi mối quan tâm sống ở đâu. Nhiều mesh nay cũng có thành phần gateway, làm mờ ranh giới nhưng không làm mờ trách nhiệm.
:::

:::muted
**Bẫy thường gặp** — Gộp lẫn chúng: đẩy mối quan tâm edge (xác thực người dùng, rate limit công khai) vào mesh hoặc mối quan tâm nội bộ (mTLS, retry theo hop) vào gateway, để lại lỗ hổng nơi không bên nào sở hữu một control. Logic trùng va nhau (cả hai cùng áp retry/timeout lên một path) khuếch đại tải. Và coi gateway là ranh giới bảo mật duy nhất rất nguy hiểm — không có mTLS east-west thì bất cứ thứ gì lọt vào vành đai đều nói chuyện tự do với mọi service, đúng là rủi ro lateral-movement mà zero-trust identity nội bộ sinh ra để bịt.
:::

*Đào sâu tiếp — khi một mesh có sẵn thành phần gateway riêng, bạn quyết định auth công khai có còn thuộc edge gateway chuyên dụng hay không thế nào?*

**Từ khoá ăn điểm** — `north-south vs east-west · perimeter vs interior · OAuth/JWT at edge · mTLS · workload identity · zero-trust · lateral movement`

## 6-card — middle — [Distributed Tracing, Observability]
**Question:** A customer reports checkout was slow, but the request fanned out across seven services and each service's logs look fine in isolation. How do you make that one request debuggable end to end, and what exactly has to be propagated for it to work?
**Verdict:** KEEP — diagnosis question with a precise "what must propagate" mechanism.

### New answer (en)
**TL;DR** — Use distributed tracing: the edge assigns one **trace id** to the request, every service creates a **span** (its own timed work) carrying that trace id plus a parent-span id, and a backend (Jaeger, Tempo, Zipkin) stitches the spans into one waterfall so you instantly see which hop was slow. The thing that *must* be propagated on every outbound call is the trace context — trace id, span id, and the sampling flag — via standard headers (W3C `traceparent`, or B3).

**How it works** — Context propagation is the load-bearing mechanic: the trace context rides every call across HTTP, gRPC, and message queues, so the chain stays connected. The backend assembles the spans into a waterfall where you can see, say, the inventory call took 1.8s while the other six were fast. Pair the trace id into your structured logs and you pivot from a slow span straight to that service's log lines for the exact request.

:::muted
**Trade-off** — Tracing every request is most accurate but generates huge span volume, so you sample — head-based decides at ingress (cheap but may drop the rare slow request you care about); tail-based buffers and keeps the interesting traces (errors, high latency) at the cost of more infrastructure. Instrumentation has runtime cost and must be applied consistently; OpenTelemetry standardizes it so you instrument once and export anywhere, but rollout across many services and languages is real work.
:::

:::muted
**Common pitfall** — A broken trace: one service forgets to forward the propagation headers — often across an async boundary like a queue or thread pool, or through a library that doesn't propagate context — and the trace splits into disconnected fragments. Inconsistent sampling along the path also corrupts traces, so the sampling flag must propagate with the context, not be re-decided per hop. And beware cardinality/PII: stuffing high-cardinality or sensitive values into span attributes blows up cost and leaks data.
:::

*Go deeper — at an async boundary like a Kafka consumer, how do you carry the trace context so the consumer span links back to the producer?*

**Keywords** — `trace id · span · parent-span id · context propagation · traceparent · B3 · head vs tail sampling · OpenTelemetry · broken trace`

### New answer (vi)
**Chốt** — Dùng distributed tracing: edge gán một **trace id** duy nhất cho request, mỗi service tạo một **span** (phần việc có thời điểm của riêng nó) mang theo trace id đó cùng một parent-span id, và một backend (Jaeger, Tempo, Zipkin) ghép các span thành một waterfall để bạn thấy ngay hop nào chậm. Thứ *bắt buộc* phải propagate trên mỗi lời gọi đi ra là trace context — trace id, span id, và cờ sampling — qua các header chuẩn (W3C `traceparent`, hoặc B3).

**Cơ chế** — Context propagation là cơ chế chịu lực: trace context đi cùng mỗi lời gọi qua HTTP, gRPC và message queue, để chuỗi luôn nối liền. Backend ghép các span thành một waterfall nơi bạn thấy, ví dụ, lời gọi inventory mất 1.8s trong khi sáu cái còn lại đều nhanh. Gắn thêm trace id vào structured log thì bạn nhảy từ một span chậm thẳng tới các dòng log của service đó cho đúng request.

:::muted
**Trade-off** — Trace mọi request là chính xác nhất nhưng sinh khối lượng span khổng lồ, nên bạn phải sampling — head-based quyết định ngay ở ingress (rẻ nhưng có thể bỏ đúng cái request chậm hiếm gặp bạn quan tâm); tail-based buffer lại và giữ các trace thú vị (lỗi, latency cao) với cái giá là nhiều hạ tầng hơn. Instrumentation có chi phí runtime và phải thêm nhất quán; OpenTelemetry chuẩn hoá để bạn instrument một lần và export đi bất cứ đâu, nhưng triển khai qua nhiều service và ngôn ngữ là công việc thực sự.
:::

:::muted
**Bẫy thường gặp** — Trace bị đứt: một service quên forward các propagation header — thường ở ranh giới bất đồng bộ như queue hay thread pool, hoặc qua một thư viện không propagate context — và trace tách thành các mảnh rời rạc. Quyết định sampling không nhất quán dọc đường cũng làm hỏng trace, nên cờ sampling phải propagate cùng context chứ không tự quyết lại ở mỗi hop. Và cẩn thận cardinality/PII: nhồi giá trị high-cardinality hay nhạy cảm vào span attribute sẽ thổi phồng chi phí và rò rỉ dữ liệu.
:::

*Đào sâu tiếp — ở một ranh giới bất đồng bộ như Kafka consumer, làm sao mang trace context để span của consumer link ngược về producer?*

**Từ khoá ăn điểm** — `trace id · span · parent-span id · context propagation · traceparent · B3 · head vs tail sampling · OpenTelemetry · broken trace`

## 7-card — staff — [Strangler Fig, Decomposition]
**Question:** Leadership wants the seven-year-old monolith "broken into microservices" by year-end. As the staff engineer owning the plan, how do you decide where the seams are, how do you migrate without a risky big-bang rewrite, and when do you push back and recommend NOT splitting?
**Verdict:** KEEP — staff-level design + judgment, including the "push back" dimension; full arc.

### New answer (en)
**TL;DR** — Find seams along business capabilities and data ownership (not technical layers), migrate incrementally with the **strangler-fig pattern** behind a routing facade so you never do a big-bang cutover, and push back on splitting entirely when the team is small, the domain boundaries are still unclear, or the real pain is a messy codebase rather than a scaling/team-autonomy limit — in which case a modular monolith is the better answer.

**How it works** — Use domain-driven bounded contexts and let the code's change/coupling map (which modules churn together, which transactions span which tables) reveal cut lines where coupling is low and cohesion is high. With strangler-fig, put a facade in front of the monolith, carve out one capability at a time into a new service, route just that traffic to it, and let the monolith serve the rest — the new services "strangle" the old code until it retires. Start with a low-risk, high-value slice, build the data-extraction and dual-write/backfill plumbing for it, validate, then repeat; the defining property is you ship incrementally and can stop or roll back at any step.

:::muted
**Trade-off** — Incremental strangling is slower and means running a hybrid monolith-plus-services system for a long time, with a routing facade, temporary data syncs, and two coexisting architectures. But it buys dramatically lower risk: each step is small, reversible, independently shippable, versus a big-bang rewrite famously prone to ballooning scope, stalling, and shipping a system that no longer matches the business. You accept duplicated effort (anti-corruption layers, temporary bridges) as the price of never having a flag day.
:::

:::muted
**Common pitfall** — Splitting on premature or incorrect boundaries produces chatty cross-service calls and shared databases — a distributed monolith with all the operational tax and none of the independence. And cutting a seam without owning the data — leaving two services reading and writing the same tables — quietly recreates the coupling you set out to remove. Data decomposition, not just code decomposition, is the part that must be done right.
:::

*Go deeper — for the first slice you carve out, would you dual-write and backfill, or use CDC to keep the monolith and new service's data in sync during the transition?*

**Keywords** — `bounded context · seam by capability + data · strangler-fig · routing facade · anti-corruption layer · modular monolith · data decomposition · big-bang risk`

### New answer (vi)
**Chốt** — Tìm seam dọc theo business capability và quyền sở hữu dữ liệu (không theo tầng kỹ thuật), migrate từng phần bằng **strangler-fig pattern** sau một facade routing để không bao giờ có cú cutover big-bang, và phản biện việc tách hẳn khi team nhỏ, ranh giới domain còn mơ hồ, hoặc nỗi đau thật chỉ là một codebase lộn xộn chứ không phải giới hạn scaling/tự chủ team — khi đó một modular monolith là câu trả lời tốt hơn.

**Cơ chế** — Dùng bounded context theo domain-driven design và để bản đồ thay đổi/coupling của code (module nào churn cùng nhau, transaction nào trải qua bảng nào) lộ ra những đường cắt nơi coupling thấp và cohesion cao. Với strangler-fig, đặt một facade trước monolith, tách từng capability một thành service mới, chỉ route đúng phần traffic đó sang nó, và để monolith phục vụ phần còn lại — các service mới "bóp nghẹt" code cũ cho tới khi nó nghỉ hưu. Bắt đầu từ một lát rủi ro thấp, giá trị cao, dựng phần plumbing trích xuất dữ liệu và dual-write/backfill cho lát đó, validate, rồi lặp lại; tính chất định nghĩa là bạn ship từng phần và có thể dừng hoặc roll back ở bất kỳ bước nào.

:::muted
**Trade-off** — Bóp nghẹt từng phần thì chậm hơn và nghĩa là chạy một hệ lai monolith-cộng-service trong thời gian dài, với facade routing, các đồng bộ dữ liệu tạm thời, và hai kiến trúc cùng tồn tại. Nhưng nó mua được rủi ro thấp hơn rất nhiều: mỗi bước nhỏ, đảo ngược được, ship độc lập, so với một cuộc rewrite big-bang nổi tiếng dễ phình scope, đình trệ và cho ra hệ thống không còn khớp nghiệp vụ. Bạn chấp nhận công sức trùng lặp (anti-corruption layer, cầu nối tạm thời) như cái giá để không bao giờ có "ngày D".
:::

:::muted
**Bẫy thường gặp** — Tách trên ranh giới non hoặc sai sẽ tạo ra lời gọi cross-service chatty và database dùng chung — một distributed monolith với đủ thuế vận hành và không chút độc lập nào. Và cắt một seam mà không sở hữu dữ liệu — để hai service cùng đọc ghi chung các bảng — sẽ âm thầm tái tạo đúng cái coupling bạn định loại bỏ. Decomposition dữ liệu, chứ không chỉ decomposition code, mới là phần phải làm cho đúng.
:::

*Đào sâu tiếp — với lát đầu tiên bạn tách ra, bạn sẽ dual-write và backfill, hay dùng CDC để giữ dữ liệu của monolith và service mới đồng bộ trong giai đoạn chuyển tiếp?*

**Từ khoá ăn điểm** — `bounded context · seam by capability + data · strangler-fig · routing facade · anti-corruption layer · modular monolith · data decomposition · big-bang risk`
