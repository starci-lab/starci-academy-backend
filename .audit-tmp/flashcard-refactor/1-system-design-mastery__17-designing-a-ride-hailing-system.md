# 1-system-design-mastery / 17-designing-a-ride-hailing-system
Summary: kept 8, delete 0 of 8

## 0-card — junior — [Matching, RealTime]
**Question:** A rider opens the app and taps "Request Ride." At a high level, what does the system have to do to put a nearby driver in their car, given that both the rider and dozens of candidate drivers are physically moving the entire time?
**Verdict:** KEEP — open-ended "walk me through the system" question with a real moving-target why; scales from junior overview to senior depth.

### New answer (en)
**TL;DR** — Continuously ingest driver GPS so you always know "who is near where," then on each request run a spatial "drivers near me" query, rank candidates by ETA, and offer the trip down the list until one accepts — the whole loop resolving in a few seconds.

**How it works** — Online drivers stream GPS pings that keep a fresh, queryable index of driver positions. When a rider requests, the matching service takes the pickup location, queries the candidate set near it, ranks them (usually by ETA, not raw distance), and sends an exclusive offer to the best driver. Decline or timeout moves to the next candidate, repeating until someone accepts — so the design is fundamentally a moving-target loop: request → candidate search → offer → accept.

:::muted
**Trade-off** — Location freshness fights cost: pinging and re-indexing every driver every second is accurate but enormously expensive at city scale, while slower updates make candidates stale. You also trade match quality (wider radius, real road ETA) against latency, since riders abandon when matching feels slow.
:::

:::muted
**Common pitfall** — Treating distance as a straight line (the nearest driver may be across a river), and forgetting the decline/timeout path so the rider waits forever — the dispatch loop must auto-advance to the next candidate.
:::

*Go deeper: how does the candidate "drivers near me" query stay fast across hundreds of thousands of online drivers?*

**Keywords** — `GPS pings · candidate set · ETA ranking · offer/accept loop · decline-timeout fallback`

### New answer (vi)
**Chốt** — Liên tục nạp GPS của tài xế để luôn biết "ai đang ở gần đâu," rồi mỗi lần đặt xe chạy một truy vấn không gian "tài xế gần tôi," xếp hạng ứng viên theo ETA, và mời chuyến lần lượt xuống danh sách cho đến khi có người nhận — toàn bộ vòng lặp xong trong vài giây.

**Cơ chế** — Tài xế online stream các ping GPS giữ một chỉ mục vị trí tươi mới, truy vấn được. Khi hành khách đặt, dịch vụ matching lấy điểm đón, truy vấn tập ứng viên ở gần, xếp hạng họ (thường theo ETA chứ không phải khoảng cách thô), rồi gửi lời mời độc quyền cho tài xế tốt nhất. Từ chối hoặc hết giờ thì chuyển sang ứng viên kế tiếp, lặp lại cho đến khi có người nhận — nên thiết kế về bản chất là một vòng lặp mục tiêu di động: đặt → tìm ứng viên → mời → nhận.

:::muted
**Trade-off** — Độ tươi của vị trí xung đột với chi phí: ping và lập lại chỉ mục mọi tài xế mỗi giây thì chính xác nhưng cực tốn ở quy mô thành phố, còn cập nhật chậm làm ứng viên cũ đi. Bạn cũng đánh đổi chất lượng match (bán kính rộng hơn, ETA đường thật) lấy độ trễ, vì hành khách bỏ cuộc khi thấy matching chậm.
:::

:::muted
**Bẫy thường gặp** — Coi khoảng cách là đường thẳng (tài xế gần nhất có thể ở bên kia sông), và bỏ quên nhánh từ chối/hết giờ khiến hành khách chờ mãi — vòng lặp điều phối phải tự động nhảy sang ứng viên kế tiếp.
:::

*Đào sâu tiếp: làm sao truy vấn "tài xế gần tôi" giữ được tốc độ trên hàng trăm nghìn tài xế đang online?*

**Từ khoá ăn điểm** — `GPS pings · candidate set · ETA ranking · offer/accept loop · decline-timeout fallback`

## 1-card — senior — [Geospatial, Indexing]
**Question:** You need a "drivers within 2 km of this pickup point" query to return in single-digit milliseconds across hundreds of thousands of online drivers. Walk through how a geospatial index (geohash, quadtree, or S2 cells) actually makes that query fast, and what happens at cell boundaries.
**Verdict:** KEEP — senior-grade "explain the mechanism + the boundary failure" question with real design trade-offs (cell size, index choice).

### New answer (en)
**TL;DR** — All three map 2D coordinates onto a 1D hierarchical key so nearby points share a prefix/cell and can be bucketed; you read only the cells covering the radius (a few hundred candidates, not the whole fleet), then apply an exact distance filter — and you must expand to neighbor cells or you silently miss the closest drivers at boundaries.

**How it works** — A geohash interleaves lat/lng bits into a base-32 string where a longer prefix means a smaller cell; S2 projects the globe onto a cube and uses a Hilbert curve for 64-bit cell IDs across 30 levels; a quadtree recursively splits space into four quadrants, refining only where density is high. At query time you compute the covering cell(s), read just those buckets (e.g. Redis `GEOSEARCH`/sorted sets or in-memory grids keyed by cell), then finish with an exact haversine filter to drop false positives.

:::muted
**Trade-off** — Cell size is the central knob: large cells mean fewer buckets but more irrelevant drivers to distance-filter; small cells give tight candidate sets but a radius spans many cells, raising fan-out and re-indexing churn. Geohash is simple but distorts near poles/seams; S2 has near-uniform area and great neighbor math but is heavier; quadtrees adapt to density but add rebalancing/pointer-chasing cost.
:::

:::muted
**Common pitfall** — The boundary bug: a driver 50 m away sits in an adjacent cell, so querying only the home cell misses the nearest drivers — you must search the 8 neighbors (or all cells the circle touches) and apply the true distance. Also hotspots (airport, stadium) overloading one cell, and treating a geohash prefix as exact distance — prefix length only bounds cell size.
:::

*Go deeper: a single cell over an airport holds tens of thousands of drivers — how do you stop that hotspot from becoming a scan/lock bottleneck?*

**Keywords** — `geohash · S2/Hilbert curve · quadtree · covering cells · 8-neighbor expansion · haversine refine`

### New answer (vi)
**Chốt** — Cả ba đều ánh xạ tọa độ 2D xuống một khóa 1D phân cấp sao cho điểm gần nhau chia sẻ tiền tố/ô và gom được vào bucket; bạn chỉ đọc các ô phủ bán kính (vài trăm ứng viên, không phải cả đội xe), rồi áp một bộ lọc khoảng cách chính xác — và phải mở rộng ra ô hàng xóm, nếu không sẽ âm thầm bỏ sót tài xế gần nhất ở ranh giới.

**Cơ chế** — Geohash đan xen bit kinh/vĩ độ thành chuỗi base-32, tiền tố dài hơn nghĩa là ô nhỏ hơn; S2 chiếu địa cầu lên khối lập phương và dùng đường cong Hilbert sinh ID ô 64-bit qua 30 cấp; quadtree đệ quy chia không gian thành bốn góc phần tư, chỉ tinh chỉnh nơi mật độ cao. Lúc truy vấn bạn tính ô (các ô) phủ bán kính, chỉ đọc những bucket đó (ví dụ Redis `GEOSEARCH`/sorted set hoặc lưới in-memory khóa theo ô), rồi kết thúc bằng bộ lọc haversine chính xác để loại false positive.

:::muted
**Trade-off** — Kích thước ô là núm vặn trung tâm: ô lớn thì ít bucket nhưng nhiều tài xế không liên quan phải lọc khoảng cách; ô nhỏ cho tập ứng viên gọn nhưng bán kính trải qua nhiều ô, làm tăng fan-out và xáo trộn lập lại chỉ mục. Geohash đơn giản nhưng méo gần cực/đường nối; S2 có diện tích gần đồng đều và toán hàng xóm tốt nhưng nặng hơn; quadtree thích nghi theo mật độ nhưng thêm chi phí cân bằng lại/đi theo con trỏ.
:::

:::muted
**Bẫy thường gặp** — Lỗi ranh giới: một tài xế cách 50 m nằm trong ô liền kề, nên truy vấn chỉ ô nhà sẽ bỏ sót tài xế gần nhất — phải tìm 8 ô hàng xóm (hoặc mọi ô vòng tròn chạm tới) và áp khoảng cách thật. Ngoài ra hotspot (sân bay, sân vận động) làm quá tải một ô, và coi tiền tố geohash là khoảng cách chính xác — độ dài tiền tố chỉ chặn kích thước ô.
:::

*Đào sâu tiếp: một ô đơn lẻ phủ sân bay chứa hàng chục nghìn tài xế — làm sao chặn hotspot đó thành nút thắt quét/khóa?*

**Từ khoá ăn điểm** — `geohash · S2/Hilbert curve · quadtree · covering cells · 8-neighbor expansion · haversine refine`

## 2-card — senior — [LocationIngestion, Scalability]
**Question:** A million online drivers each send a GPS ping every 4 seconds — roughly 250k writes per second of constantly-changing location data. How do you ingest and store this without melting your database, while still keeping the matching index fresh enough to dispatch?
**Verdict:** KEEP — senior write-path scaling question with a clear hot/cold split design and concrete failure modes.

### New answer (en)
**TL;DR** — Treat current location as hot, ephemeral state, not durable rows: each ping overwrites an in-memory/Redis geo-index that the matcher reads directly, while the firehose is also published to Kafka and batched into a durable time-series store for history. The dispatch-critical store then holds exactly one row per driver.

**How it works** — Drivers hold a persistent connection (WebSocket/gRPC stream) to a location-gateway tier. Each ping does an overwrite — `GEOADD` into per-cell sorted sets — so "latest position" is never an append. The same stream is published to a log like Kafka, partitioned by driver or geo-cell, and consumed asynchronously for telemetry, analytics, and batched durable history. This splits the firehose into a tiny fast path (current position for matching) and a buffered slow path (history).

:::muted
**Trade-off** — Higher ping frequency means fresher matches and smoother map animation but multiplies write load, bandwidth, and battery — so use adaptive cadence (fast on an active trip, slow when idle). Keeping current location only in Redis/memory gives microsecond reads but loses positions on node failure until drivers re-ping (acceptable within seconds); the matcher also reads a location up to one ping-interval stale, which is fine.
:::

:::muted
**Common pitfall** — `UPDATE drivers SET lat=?, lng=? WHERE id=?` on a primary SQL DB per ping — write amplification and lock contention saturate it before city scale. Also unbounded Kafka lag on the history consumer, sticky connections piling onto a few gateway nodes, and trusting client timestamps (key freshness off server receipt time and speed-gate implausible pings).
:::

*Go deeper: a node holding 100k driver connections dies — how do you redistribute those streams without a thundering-herd reconnect storm?*

**Keywords** — `overwrite not append · GEOADD · WebSocket gateway · Kafka partition · adaptive cadence · server-receipt time`

### New answer (vi)
**Chốt** — Coi vị trí hiện tại là trạng thái nóng, phù du, chứ không phải hàng bền vững: mỗi ping ghi đè một geo-index in-memory/Redis mà bộ matcher đọc trực tiếp, còn vòi rồng cũng được publish vào Kafka và ghi theo lô vào kho time-series bền vững cho lịch sử. Kho quan trọng cho điều phối khi đó chỉ giữ đúng một hàng mỗi tài xế.

**Cơ chế** — Tài xế giữ một kết nối lâu dài (WebSocket/gRPC stream) tới tầng location-gateway. Mỗi ping là một thao tác ghi đè — `GEOADD` vào sorted set theo từng ô — nên "vị trí mới nhất" không bao giờ là nối thêm. Cùng luồng đó được publish vào một log như Kafka, phân vùng theo tài xế hoặc ô địa lý, và tiêu thụ bất đồng bộ cho telemetry, phân tích, và lịch sử bền vững ghi theo lô. Cách này tách vòi rồng thành một đường nhanh tí hon (vị trí hiện tại cho matching) và một đường chậm có đệm (lịch sử).

:::muted
**Trade-off** — Tần suất ping cao hơn cho match tươi và animation mượt hơn nhưng nhân lên tải ghi, băng thông, và pin — nên dùng nhịp thích nghi (nhanh khi đang trong chuyến, chậm khi rảnh). Giữ vị trí hiện tại chỉ trong Redis/memory cho đọc cỡ micro-giây nhưng mất vị trí khi node hỏng cho tới khi tài xế ping lại (chấp nhận được trong vài giây); bộ matcher cũng đọc vị trí cũ tối đa một chu kỳ ping, điều này ổn.
:::

:::muted
**Bẫy thường gặp** — `UPDATE drivers SET lat=?, lng=? WHERE id=?` trên SQL chính cho mỗi ping — khuếch đại ghi và tranh chấp khóa làm nó bão hòa trước quy mô thành phố. Ngoài ra Kafka lag không giới hạn ở consumer lịch sử, kết nối sticky dồn lên vài node gateway, và tin timestamp của client (lấy độ tươi theo thời điểm server nhận và chặn ping phi lý theo tốc độ).
:::

*Đào sâu tiếp: một node giữ 100k kết nối tài xế chết — làm sao tái phân bố các stream đó mà không gây bão reconnect thundering-herd?*

**Từ khoá ăn điểm** — `overwrite not append · GEOADD · WebSocket gateway · Kafka partition · adaptive cadence · server-receipt time`

## 3-card — senior — [Matching, Concurrency]
**Question:** Two riders request a ride at the same instant and the same driver is the best candidate for both. Walk through your matching/dispatch design so that exactly one rider gets that driver, no driver is ever double-assigned, and you still favor good matches (nearest vs ETA-optimal).
**Verdict:** KEEP — senior concurrency/correctness question requiring an atomic-claim design with real TTL and fairness trade-offs.

### New answer (en)
**TL;DR** — Rank candidates by road-network ETA, then prevent double-assignment by claiming the driver atomically before offering — a short-lived lock or single-owner per driver (e.g. Redis `SET driver:{id}:lock req {token} NX EX 15`) so only one request can hold a driver at a time, converting to an assignment on accept and releasing on decline/timeout.

**How it works** — Generate the candidate set from the geo-index, then rank by predicted ETA over the road network rather than crow-flies distance. To serialize, route all requests for a given driver through one owner (an actor keyed by driverId, or a per-driver Redis key): the matcher acquires the lock, sends an exclusive offer with a timeout, and on accept the lock becomes an assignment. That single serialized owner makes "offered to exactly one rider" a hard invariant.

:::muted
**Trade-off** — Nearest-by-distance is cheap but gives worse pickups; ETA-optimal needs live traffic/routing calls per match, so many systems use distance for the candidate cut and ETA only to rank the short list. A tighter lock TTL improves throughput but risks releasing a driver about to accept; batching requests over a short window solves a global assignment for better pairings at the cost of added wait.
:::

:::muted
**Common pitfall** — Without an atomic claim, both requests read the driver as "available" and both offer it — a double-assign race. TTL too long strands a driver "busy" after a crashed dispatcher (need expiry + heartbeat); too short lets the offer expire mid-accept. Also offering to a stale-location driver who already left, and ignoring anti-starvation so a request never wins the greedy pass.
:::

*Go deeper: how do you batch requests over a window and solve the assignment problem without making riders wait too long for the round to close?*

**Keywords** — `atomic claim · SET NX EX · per-driver actor/serialization · lock TTL + heartbeat · batch vs greedy · anti-starvation`

### New answer (vi)
**Chốt** — Xếp hạng ứng viên theo ETA trên mạng đường, rồi ngăn gán đôi bằng cách chiếm tài xế một cách atomic trước khi mời — một khóa ngắn hạn hoặc một chủ sở hữu đơn cho mỗi tài xế (ví dụ Redis `SET driver:{id}:lock req {token} NX EX 15`) sao cho chỉ một request giữ được một tài xế tại một thời điểm, chuyển thành phân công khi nhận và nhả khi từ chối/hết giờ.

**Cơ chế** — Sinh tập ứng viên từ geo-index, rồi xếp hạng theo ETA dự đoán trên mạng đường thay vì khoảng cách đường chim bay. Để tuần tự hóa, định tuyến mọi request cho một tài xế qua một chủ sở hữu (một actor khóa theo driverId, hoặc một Redis key mỗi tài xế): bộ matcher giành khóa, gửi lời mời độc quyền có timeout, và khi nhận thì khóa trở thành phân công. Chủ sở hữu được tuần tự hóa đó biến "chỉ mời cho đúng một hành khách" thành một bất biến cứng.

:::muted
**Trade-off** — Gần nhất theo khoảng cách thì rẻ nhưng điểm đón tệ hơn; ETA tối ưu cần traffic trực tiếp và lệnh định tuyến mỗi match, nên nhiều hệ thống dùng khoảng cách để cắt ứng viên và ETA chỉ để xếp hạng danh sách ngắn. TTL khóa chặt hơn cải thiện thông lượng nhưng có nguy cơ nhả một tài xế sắp nhận; gom request trong một cửa sổ ngắn giải bài toán phân công toàn cục cho cặp ghép tốt hơn, đổi lại thêm thời gian chờ.
:::

:::muted
**Bẫy thường gặp** — Không có thao tác chiếm atomic, cả hai request đọc tài xế là "rảnh" và cả hai mời — một race gán đôi. TTL quá dài kẹt tài xế "bận" sau khi dispatcher sập (cần expiry + heartbeat); quá ngắn để lời mời hết hạn giữa lúc nhận. Ngoài ra mời một tài xế có vị trí đã cũ đã rời đi, và bỏ qua chống đói khiến một request không bao giờ thắng lượt greedy.
:::

*Đào sâu tiếp: làm sao gom request trong một cửa sổ và giải bài toán phân công mà không bắt hành khách chờ quá lâu để vòng đóng lại?*

**Từ khoá ăn điểm** — `atomic claim · SET NX EX · per-driver actor/serialization · lock TTL + heartbeat · batch vs greedy · anti-starvation`

## 4-card — middle — [SurgePricing, Consistency]
**Question:** During a downpour, demand in a neighborhood spikes far past available drivers. Design surge pricing: how do you compute the demand/supply imbalance per area, and how do you make sure the multiplier a rider was quoted is the price they actually pay?
**Verdict:** KEEP — middle-level design question with a sharp consistency requirement (quote = charge) and concrete oscillation/edge failure modes.

### New answer (en)
**TL;DR** — Per pricing zone, count open requests vs available drivers over a short rolling window, turn that ratio into a smoothed surge multiplier published to a fast cache — and freeze the quote when the rider accepts (store the multiplier/price against the trip or a signed time-boxed token) so they are charged the number they saw, not whatever surge is at charge time.

**How it works** — Divide the city into pricing zones (often the same geo-cells used for indexing). A pricing service computes the supply/demand ratio per zone on a rolling window, maps it through a tuned, smoothed function to a multiplier, and publishes the current value per zone. On a quote request it reads the zone multiplier, computes the fare, and pins it to the trip so a later surge change cannot alter the agreed price. Drivers see a surge heat map to nudge supply toward demand.

:::muted
**Trade-off** — Smaller zones/shorter windows are responsive and locally accurate but jittery and noisy; larger zones/longer windows are stable but lag real conditions and blur hotspots. Freezing the quote builds trust but means the charged price can diverge from live conditions during validity — so that window must be short.
:::

:::muted
**Common pitfall** — Quoting one multiplier and charging another because price is re-read at charge time instead of pinned — destroys trust. Also feedback oscillation without damping, zone-edge unfairness (two riders 50 m apart pay very differently), and stale supply counts over-surging because just-offline drivers still appear available.
:::

*Go deeper: how do you damp the surge feedback loop so price doesn't oscillate as demand reacts to the multiplier itself?*

**Keywords** — `pricing zone · supply/demand ratio · rolling window · smoothed multiplier · frozen quote / signed token`

### New answer (vi)
**Chốt** — Theo từng vùng định giá, đếm số request đang mở so với tài xế sẵn có trên một cửa sổ trượt ngắn, biến tỷ lệ đó thành một hệ số surge đã làm mượt rồi publish vào cache nhanh — và đóng băng báo giá khi hành khách chấp nhận (lưu hệ số/giá gắn với chuyến hoặc một token đã ký, giới hạn thời gian) sao cho họ bị tính đúng con số đã thấy, không phải surge lúc tính tiền.

**Cơ chế** — Chia thành phố thành các vùng định giá (thường là chính các geo-cell dùng lập chỉ mục). Một dịch vụ pricing tính tỷ lệ cung/cầu theo vùng trên cửa sổ trượt, ánh xạ qua một hàm đã tinh chỉnh, làm mượt thành hệ số, và publish giá trị hiện tại mỗi vùng. Khi báo giá nó đọc hệ số của vùng, tính cước, và ghim vào chuyến để một thay đổi surge sau đó không thể đổi giá đã thỏa thuận. Tài xế thấy bản đồ nhiệt surge để nhích nguồn cung về phía nhu cầu.

:::muted
**Trade-off** — Vùng nhỏ/cửa sổ ngắn thì nhạy và chính xác cục bộ nhưng giật cục và nhiễu; vùng lớn/cửa sổ dài thì ổn định nhưng trễ so với điều kiện thật và làm mờ hotspot. Đóng băng báo giá xây niềm tin nhưng nghĩa là giá bị tính có thể lệch khỏi điều kiện trực tiếp trong thời gian hiệu lực — nên cửa sổ đó phải ngắn.
:::

:::muted
**Bẫy thường gặp** — Báo một hệ số rồi tính một hệ số khác vì giá được đọc lại lúc tính tiền thay vì được ghim — phá hủy niềm tin. Ngoài ra dao động phản hồi không giảm chấn, bất công ở rìa vùng (hai hành khách cách 50 m trả rất khác nhau), và số liệu cung cũ làm surge quá đà vì tài xế vừa offline vẫn hiện là sẵn có.
:::

*Đào sâu tiếp: làm sao giảm chấn vòng phản hồi surge để giá không dao động khi nhu cầu phản ứng với chính hệ số đó?*

**Từ khoá ăn điểm** — `pricing zone · supply/demand ratio · rolling window · smoothed multiplier · frozen quote / signed token`

## 5-card — middle — [StateMachine, Reliability]
**Question:** A trip moves through requested → accepted → driver-arrived → in-progress → completed. Halfway through the ride the rider's phone loses signal for two minutes. Design the trip state machine so the trip survives app/network drops and both sides end up consistent.
**Verdict:** KEEP — middle-level reliability/state-machine question with a concrete failure scenario and idempotency/split-brain depth.

### New answer (en)
**TL;DR** — Make the server an authoritative state machine that allows only legal transitions, with every transition an idempotent authenticated command (dedup key + monotonic version). Clients are thin views that re-fetch and resume on reconnect; the fare meter and progress follow the driver's stream and server clock, so a rider dropping offline never pauses or corrupts the trip.

**How it works** — Model the trip as an explicit server-side state machine (in-progress only from accepted/arrived, completed only from in-progress). Each transition (`startTrip`, `completeTrip`) carries the trip ID plus a client request key, persisted durably with the new state and an increasing version. On reconnect the phone re-fetches the current trip and renders it, while the driver's still-connected app keeps the trip progressing — the backend is the single source of truth.

:::muted
**Trade-off** — Server-authoritative + idempotent transitions cost extra storage and a round trip per change but let either side reconnect safely; "trust the client's local state" is simpler offline but diverges the moment a packet is lost. You also balance auto-complete/cancel timeouts: eager ones free resources but can wrongly end a live trip; lenient ones leave zombie trips occupying a driver.
:::

:::muted
**Common pitfall** — Split-brain state (rider says "completed," driver says "in-progress") because each tracked state locally. Non-idempotent transitions double-charge on retry — the request key must dedupe. Tying the meter to the rider's heartbeat means a signal drop wrongly stalls or cancels the ride; progress must follow the driver and server, with reconnect just re-syncing the rider's view.
:::

*Go deeper: what reconciliation protocol does a reconnecting client run to resolve its stale local state against the server without losing an in-flight transition?*

**Keywords** — `server-authoritative SoT · legal transitions only · idempotent command + request key · optimistic version · split-brain`

### New answer (vi)
**Chốt** — Biến server thành một máy trạng thái có thẩm quyền chỉ cho phép các chuyển trạng thái hợp lệ, với mỗi chuyển là một lệnh idempotent có xác thực (request key khử trùng lặp + version tăng đơn điệu). Client là góc nhìn mỏng fetch lại và tiếp tục khi kết nối lại; đồng hồ cước và tiến độ đi theo luồng của tài xế và đồng hồ server, nên hành khách rớt mạng không bao giờ làm dừng hay hỏng chuyến.

**Cơ chế** — Mô hình hóa chuyến như một máy trạng thái tường minh phía server (vào in-progress chỉ từ accepted/arrived, vào completed chỉ từ in-progress). Mỗi chuyển trạng thái (`startTrip`, `completeTrip`) mang ID chuyến cộng một request key của client, persist bền vững cùng trạng thái mới và một version tăng dần. Khi kết nối lại, điện thoại fetch lại chuyến hiện tại và render nó, trong khi app tài xế vẫn còn kết nối tiếp tục đẩy chuyến tiến lên — backend là nguồn sự thật duy nhất.

:::muted
**Trade-off** — Server có thẩm quyền + chuyển trạng thái idempotent tốn thêm lưu trữ và một round trip mỗi thay đổi nhưng cho phép một trong hai phía kết nối lại an toàn; "tin trạng thái cục bộ của client" thì đơn giản hơn khi offline nhưng phân kỳ ngay khi mất một gói tin. Bạn cũng cân bằng timeout tự-hoàn-tất/hủy: vội vàng giải phóng tài nguyên nhưng có thể kết thúc nhầm một chuyến đang chạy; khoan dung để lại các chuyến zombie chiếm một tài xế.
:::

:::muted
**Bẫy thường gặp** — Trạng thái split-brain (hành khách nói "completed," tài xế nói "in-progress") vì mỗi bên theo dõi cục bộ. Chuyển trạng thái không idempotent gây tính tiền đôi khi thử lại — request key phải khử trùng lặp. Gắn đồng hồ cước vào heartbeat của hành khách khiến rớt sóng làm ngừng nhầm hoặc hủy chuyến; tiến độ phải đi theo tài xế và server, với kết nối lại chỉ đồng bộ lại góc nhìn của hành khách.
:::

*Đào sâu tiếp: client kết nối lại chạy giao thức đối chiếu nào để giải quyết trạng thái cục bộ cũ của nó so với server mà không mất một chuyển trạng thái đang dang dở?*

**Từ khoá ăn điểm** — `server-authoritative SoT · legal transitions only · idempotent command + request key · optimistic version · split-brain`

## 6-card — middle — [ETA, Caching]
**Question:** Every match candidate needs an ETA, every active trip needs a route, and the map renders for millions of users — that's a huge volume of routing work. How do you design ETA/routing: precompute versus on-demand, and how do you cache map and route data at scale?
**Verdict:** KEEP — middle-level scaling/caching question with the precompute-vs-on-demand trade-off and concrete cache failure modes.

### New answer (en)
**TL;DR** — Precompute the slow, stable parts offline (contraction-hierarchy / partitioned shortest-path structures over travel-time graphs) so request-time is a cheap lookup; use a cheap ETA estimate to rank all candidates and reserve exact routing for the chosen driver and active trip; cache aggressively in layers — CDN map tiles, Redis ETAs/zone-pair times with short TTLs, per-trip routes recomputed only on deviation.

**How it works** — Split the road network into tiles/regions and precompute shortest-path structures over a travel-time-weighted graph, refreshed periodically with live traffic, so a request runs a cheap query instead of a cold Dijkstra. For matching you don't need exact routes per candidate — estimate ETA cheaply (haversine × road-factor, or a coarse zone-to-zone matrix) to rank, then compute a precise route only for the chosen driver. Cache map tiles on a CDN, popular ETAs/zone-pairs in Redis with short TTLs.

:::muted
**Trade-off** — Precomputation gives millisecond reads but goes stale as traffic shifts, so you re-run/patch on a cadence; on-demand is always current but too slow per candidate. Coarse ETA scales to every candidate but is less accurate; exact routing is accurate but reserved for the few requests that justify it. Long cache TTL maximizes hit rate but serves outdated times during incidents.
:::

:::muted
**Common pitfall** — Full graph search per candidate at dispatch blows up latency. Serving stale cached ETAs through an incident routes drivers into jams — you need live-traffic invalidation, not just time-based expiry. A thundering herd on a popular route after eviction hammers routing — use request coalescing / stale-while-revalidate. And ranking by straight-line distance picks geometrically-near but road-far drivers.
:::

*Go deeper: a highway suddenly closes — how do you invalidate exactly the cached ETAs and precomputed paths that crossed it without flushing the whole cache?*

**Keywords** — `contraction hierarchies · precompute vs on-demand · haversine × road-factor · zone-pair matrix · CDN tiles · stale-while-revalidate`

### New answer (vi)
**Chốt** — Tính trước phần chậm, ổn định một cách offline (cấu trúc contraction-hierarchy / shortest-path đã phân vùng trên đồ thị thời gian-di-chuyển) để lúc request chỉ là một lượt tra cứu rẻ; dùng ước lượng ETA rẻ để xếp hạng mọi ứng viên và dành định tuyến chính xác cho tài xế được chọn và chuyến đang chạy; cache mạnh tay theo tầng — map tile trên CDN, ETA/thời gian cặp-vùng trong Redis với TTL ngắn, tuyến theo chuyến chỉ tính lại khi đi lệch.

**Cơ chế** — Chia mạng đường thành tile/vùng và tính trước cấu trúc shortest-path trên đồ thị trọng số là thời gian di chuyển, làm mới định kỳ bằng traffic trực tiếp, để một request chạy truy vấn rẻ thay vì Dijkstra nguội. Với matching bạn không cần tuyến chính xác cho mỗi ứng viên — ước lượng ETA rẻ (haversine × road-factor, hoặc ma trận vùng-tới-vùng thô) để xếp hạng, rồi chỉ tính tuyến chính xác cho tài xế được chọn. Cache map tile trên CDN, các ETA/cặp-vùng phổ biến trong Redis với TTL ngắn.

:::muted
**Trade-off** — Tính trước cho đọc cỡ mili-giây nhưng cũ đi khi traffic thay đổi, nên phải chạy lại/vá theo một nhịp; theo nhu cầu thì luôn cập nhật nhưng quá chậm cho mỗi ứng viên. ETA thô mở rộng tới mọi ứng viên nhưng kém chính xác; định tuyến chính xác thì chính xác nhưng dành cho số ít request xứng đáng. TTL cache dài tối đa hóa tỷ lệ hit nhưng phục vụ thời gian lỗi thời trong các sự cố.
:::

:::muted
**Bẫy thường gặp** — Tìm kiếm đồ thị đầy đủ cho mỗi ứng viên lúc điều phối làm nổ độ trễ. Phục vụ ETA cache cũ qua một sự cố dẫn tài xế vào kẹt xe — cần vô hiệu hóa theo traffic trực tiếp, không chỉ hết hạn theo thời gian. Một thundering herd trên tuyến phổ biến sau khi cache bị đẩy ra sẽ nện vào định tuyến — dùng request coalescing / stale-while-revalidate. Và xếp hạng theo khoảng cách đường thẳng chọn tài xế gần về hình học nhưng xa về đường.
:::

*Đào sâu tiếp: một đường cao tốc đột ngột đóng — làm sao vô hiệu hóa đúng các ETA cache và đường tính trước đi qua nó mà không xả toàn bộ cache?*

**Từ khoá ăn điểm** — `contraction hierarchies · precompute vs on-demand · haversine × road-factor · zone-pair matrix · CDN tiles · stale-while-revalidate`

## 7-card — staff — [Architecture, Sharding]
**Question:** Put it all together: design the end-to-end ride-hailing platform — location ingestion, matching, pricing, and trip lifecycle — running across many cities on several continents. How do you decompose the services and shard by region so the whole thing scales and stays available?
**Verdict:** KEEP — staff-level "tie it all together" architecture question with real region-sharding, consistency-boundary, and blast-radius reasoning.

### New answer (en)
**TL;DR** — Decompose by capability (location-ingestion, matching/dispatch, pricing, trip/billing, plus routing/notification/payment), then shard the entire stack by geography because a ride is intrinsically local — each region is an almost-independent unit with its own geo-index, dispatcher, and trip store, glued by a thin global plane for identity, payments, and config.

**How it works** — Region-pinned cells routed by a geo-aware gateway: a driver and rider in the same city only touch that region's cells, matcher, and database, so cross-region traffic is rare (long airport trips, global account/config). Location stays hot in per-region Redis/memory with Kafka for history; the trip service owns the durable state machine and billing. A global service mesh handles identity/payments/config, and events (trip completed, payment captured) stream onto a backbone for analytics and fraud asynchronously.

:::muted
**Trade-off** — Regional sharding gives horizontal scale, data locality, fault isolation, and low latency, but complicates the rare cross-boundary case and needs routing + rebalancing as cities grow. You keep per-region strong consistency where money and safety live (no double-assignment, exact billing) and accept eventual consistency on the global plane (analytics, heat maps, cross-region profile sync).
:::

:::muted
**Common pitfall** — A single global DB or matcher becomes a chokepoint and blast radius — one region's spike takes down everyone — so a flat non-sharded design won't survive multi-continent scale. Boundary cells between regions drop or double-handle drivers unless ownership is explicit. And synchronous global dependencies on the hot path (payment auth, central config before a match) couple every dispatch to a distant service — keep matching local, push payments/fraud/analytics async.
:::

*Go deeper: a megacity outgrows one region's capacity — how do you split it into two shards live without dropping in-flight trips at the new boundary?*

**Keywords** — `decompose by capability · geo-sharding · region-pinned cells · geo-aware gateway · blast-radius isolation · strong-local/eventual-global`

### New answer (vi)
**Chốt** — Phân rã theo năng lực (nạp vị trí, matching/điều phối, pricing, trip/billing, cộng routing/thông báo/thanh toán), rồi shard toàn bộ stack theo địa lý vì một chuyến đi vốn cục bộ — mỗi vùng là một đơn vị gần như độc lập với geo-index, bộ điều phối, và kho trip riêng, được dán lại bằng một mặt phẳng toàn cục mỏng cho danh tính, thanh toán, và config.

**Cơ chế** — Các cell ghim theo vùng được định tuyến bởi một gateway nhận biết địa lý: một tài xế và hành khách trong cùng thành phố chỉ chạm vào các ô, bộ matcher, và database của vùng đó, nên lưu lượng xuyên vùng là hiếm (chuyến sân bay dài, account/config toàn cục). Vị trí giữ nóng trong Redis/memory theo từng vùng với Kafka cho lịch sử; dịch vụ trip sở hữu máy trạng thái bền vững và tính cước. Một service mesh toàn cục lo danh tính/thanh toán/config, và các sự kiện (chuyến hoàn tất, thanh toán đã thu) stream lên một backbone cho phân tích và chống gian lận một cách bất đồng bộ.

:::muted
**Trade-off** — Sharding theo vùng cho mở rộng ngang, tính cục bộ của dữ liệu, cô lập lỗi, và độ trễ thấp, nhưng làm phức tạp trường hợp xuyên ranh giới hiếm gặp và cần định tuyến + cân bằng lại khi các thành phố lớn lên. Bạn giữ nhất quán mạnh theo từng vùng ở nơi tiền bạc và an toàn hiện diện (không gán đôi, tính cước chính xác) và chấp nhận nhất quán cuối cùng ở mặt phẳng toàn cục (phân tích, bản đồ nhiệt, đồng bộ profile xuyên vùng).
:::

:::muted
**Bẫy thường gặp** — Một database hoặc bộ matcher toàn cục đơn lẻ trở thành điểm nghẽn và bán kính nổ — một đỉnh tải của một vùng kéo sập tất cả — nên thiết kế phẳng không shard sẽ không sống sót ở quy mô đa châu lục. Các ô ranh giới giữa các vùng bỏ rơi hoặc xử lý đôi tài xế trừ khi quyền sở hữu là tường minh. Và các phụ thuộc toàn cục đồng bộ trên đường nóng (xác thực thanh toán, config trung tâm trước một match) ghép mọi điều phối vào một dịch vụ xa — giữ matching cục bộ, đẩy thanh toán/chống gian lận/phân tích sang bất đồng bộ.
:::

*Đào sâu tiếp: một siêu đô thị vượt quá năng lực của một vùng — làm sao tách nó thành hai shard ngay lúc đang chạy mà không làm rớt các chuyến đang dang dở ở ranh giới mới?*

**Từ khoá ăn điểm** — `decompose by capability · geo-sharding · region-pinned cells · geo-aware gateway · blast-radius isolation · strong-local/eventual-global`
