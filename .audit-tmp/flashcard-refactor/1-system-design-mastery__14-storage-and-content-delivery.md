# 1-system-design-mastery / 14-storage-and-content-delivery
Summary: kept 8, delete 0 of 8

## 0-card — middle — [Storage, Architecture]
**Question:** You are designing a platform that stores user-uploaded videos, runs a Postgres database, and needs a shared home directory for a legacy rendering farm. A junior proposes putting all three on a single AWS service. Walk through object vs block vs file storage and which you pick for each workload.
**Verdict:** KEEP — Forces a real design decision mapping three storage models to three concrete workloads with trade-off reasoning; scales with seniority.

### New answer (en)
**TL;DR** — Three different workloads need three different storage models: **object** (S3) for the videos, **block** (EBS) for Postgres, **file** (EFS/NFS) for the rendering farm's shared home. Forcing all three onto one service mismatches at least two of them.

**How it works** — Object storage holds immutable blobs addressed by key over HTTP, near-infinite capacity and rich metadata — ideal for user-uploaded videos. Block storage exposes a raw device you format yourself, giving low-latency random read/write with `fsync` durability — exactly what a database wants, so Postgres sits on an EBS volume attached to its instance. File storage presents a POSIX filesystem multiple machines mount concurrently with `open()`/`read()` semantics — the fit for a legacy render farm expecting a shared home directory.

:::muted
**Trade-off** — Object is cheapest per GB and infinitely scalable but has higher per-request latency and no in-place mutation (you replace whole objects). Block is fast and mutable but single-attach and capacity-capped per volume, billed for provisioned size. File gives convenient shared-mount semantics but is the priciest, and NFS round-trips plus lock overhead make it a poor database backend.
:::

:::muted
**Common pitfall** — Forcing one model onto the wrong workload: a database on object storage (no random writes, no fsync durability), or millions of small public files served from a block volume behind one server (no horizontal scale, a single point of failure). Mounting EFS for a write-heavy DB degrades silently — NFS latency and lock contention tank throughput long before a hard error.
:::

*Go deeper — when would you deliberately put database data on object storage anyway (hint: separation of storage and compute, e.g. Aurora/Neon)?*

**Keywords** — `object · block · file · S3 · EBS · EFS/NFS · POSIX · fsync · single-attach`

### New answer (vi)
**Chốt** — Ba workload khác nhau cần ba mô hình storage khác nhau: **object** (S3) cho video, **block** (EBS) cho Postgres, **file** (EFS/NFS) cho thư mục home dùng chung của render farm. Ép cả ba lên một service là mismatch ít nhất hai cái.

**Cơ chế** — Object storage giữ các blob bất biến địa chỉ hóa bằng key qua HTTP, dung lượng gần như vô hạn cùng metadata phong phú — lý tưởng cho video user upload. Block storage phơi ra một device thô mà bạn tự format, cho random read/write latency thấp cùng durability `fsync` — đúng thứ database cần, nên Postgres nằm trên một EBS volume gắn vào instance của nó. File storage trình bày một filesystem POSIX nhiều máy mount đồng thời với semantics `open()`/`read()` — đúng fit cho render farm legacy kỳ vọng một thư mục home dùng chung.

:::muted
**Trade-off** — Object rẻ nhất mỗi GB và scale vô hạn nhưng latency mỗi request cao hơn và không mutate tại chỗ (thay cả object). Block nhanh và mutable nhưng single-attach và cap dung lượng mỗi volume, tính tiền theo size đã provision. File cho semantics shared-mount tiện nhưng đắt nhất, và round-trip NFS cùng overhead locking khiến nó là backend database tệ.
:::

:::muted
**Bẫy thường gặp** — Ép một mô hình lên sai workload: database trên object storage (không random write, không durability fsync), hoặc hàng triệu file public nhỏ serve từ một block volume sau một server (không scale ngang, single point of failure). Mount EFS cho DB write-heavy xuống cấp âm thầm — latency NFS và lock contention bóp throughput từ lâu trước khi gặp lỗi cứng.
:::

*Đào sâu tiếp — khi nào bạn cố tình đặt data database lên object storage (gợi ý: tách storage và compute, ví dụ Aurora/Neon)?*

**Từ khoá ăn điểm** — `object · block · file · S3 · EBS · EFS/NFS · POSIX · fsync · single-attach`

## 1-card — middle — [CDN, Caching]
**Question:** Your team puts a CDN in front of an image API. Logos load fast, but personalized avatars sometimes show the wrong user's picture, and a CSS fix you shipped is still stale for some users an hour later. Explain cache keys, TTL, and why purge is the genuinely hard part.
**Verdict:** KEEP — Diagnostic scenario tying two distinct bugs (cache-key vs freshness) to CDN fundamentals; invites the content-hashing follow-up.

### New answer (en)
**TL;DR** — The wrong avatar is a **cache-key** bug (a personalized response keyed only by URL got shared between users); the stale CSS is a **TTL/freshness** bug (your TTL outlived the deploy). Purge is hard because a CDN is a distributed cache across hundreds of POPs that only converges eventually.

**How it works** — A CDN caches at edge POPs keyed by a cache key — by default the URL, so you must explicitly add anything that varies the response (query string, `Accept`, auth/cookie via `Vary`). Fix the avatar by keying on user identity, or marking the response `private`/`no-store` so it never enters the shared cache. TTL controls how long an object stays fresh before re-validation: long for immutable assets, short or `no-cache` for things that change.

:::muted
**Trade-off** — Long TTLs maximize hit ratio and shield origin but slow propagation; short TTLs stay fresh but push load to origin. The clean escape is **content-hashed filenames** (`app.4f3a.css`) with a near-infinite TTL: a new deploy emits a new URL, so there is nothing to invalidate — the old object just ages out. You trade a build-step indirection for eliminating purge on static assets.
:::

:::muted
**Common pitfall** — Purging by URL misses variants cached separately (other query strings, encodings, device classes), and propagation is eventually consistent (seconds to minutes) so users see different versions during the window. Aggressive wildcard purges can cold-start whole POPs at once and dump a spike on origin.
:::

*Go deeper — for the personalized avatar, would you rather key on user or never cache it at all, and how does that change your edge hit ratio?*

**Keywords** — `cache key · Vary · TTL · no-store · content-hash · purge · eventually consistent`

### New answer (vi)
**Chốt** — Avatar nhầm là một bug **cache-key** (response cá nhân hóa chỉ key bằng URL bị chia sẻ giữa các user); CSS stale là một bug **TTL/freshness** (TTL sống lâu hơn lần deploy). Purge khó vì CDN là một distributed cache trải trên hàng trăm POP, chỉ hội tụ dần dần.

**Cơ chế** — CDN cache tại edge POP, key bằng cache key — mặc định là URL, nên bạn phải chủ động thêm bất cứ thứ gì làm response đổi (query string, `Accept`, auth/cookie qua `Vary`). Fix avatar bằng cách đưa user identity vào key, hoặc đánh dấu response `private`/`no-store` để nó không bao giờ vào shared cache. TTL kiểm soát một object còn fresh bao lâu trước khi re-validate: dài cho asset bất biến, ngắn hoặc `no-cache` cho thứ hay đổi.

:::muted
**Trade-off** — TTL dài tối đa hóa hit ratio và che chắn origin nhưng propagate chậm; TTL ngắn giữ fresh nhưng đẩy tải về origin. Lối thoát sạch là **content-hashed filename** (`app.4f3a.css`) với TTL gần như vô hạn: một deploy mới phát một URL mới, nên không có gì để invalidate — object cũ chỉ già đi. Bạn đổi một bước indirection ở build lấy việc loại bỏ purge trên static asset.
:::

:::muted
**Bẫy thường gặp** — Purge theo URL bỏ sót các variant được cache riêng (query string khác, encoding khác, device class khác), và propagation là eventually consistent (vài giây tới vài phút) nên user thấy version khác nhau trong cửa sổ đó. Purge wildcard quá mạnh có thể cold-start cả POP cùng lúc và dội một spike xuống origin.
:::

*Đào sâu tiếp — với avatar cá nhân hóa, bạn key theo user hay không cache nó hẳn, và điều đó đổi edge hit ratio thế nào?*

**Từ khoá ăn điểm** — `cache key · Vary · TTL · no-store · content-hash · purge · eventually consistent`

## 2-card — senior — [Object Storage, Security]
**Question:** Users upload 2 GB video files and your API pods keep OOM-killing because every upload streams through the application server. A teammate suggests presigned URLs. Explain how presigned upload and download work, and what security and validation concerns they introduce.
**Verdict:** KEEP — Senior-level design + security scenario; the presign-then-validate gap and over-permissive-signature risk carry real depth.

### New answer (en)
**TL;DR** — Presigned URLs take your application server out of the data path: the client `PUT`s/`GET`s the 2 GB object directly to S3 using a short-lived, signed URL your backend issues — which fixes the OOM. The catch is you can no longer inspect bytes in-flight, so you must lock the signature down and validate the object after it lands.

**How it works** — Your backend authenticates the user, decides the object key, signs a URL with its credentials scoped to one operation (PUT or GET) on that key, and returns it. The client uploads directly; download works the same with a presigned GET for private objects. The object store handles bandwidth and multipart parallelism, so app memory pressure disappears.

:::muted
**Trade-off** — You swap a simple proxy for a two-step dance and lose in-flight control: no synchronous virus-scan or transcode, so those move to an async step triggered on `ObjectCreated`. Presigned downloads bypass your CDN unless you sign CDN URLs instead, and short expiries help security but can break slow or resumable uploads that outlive the signature.
:::

:::muted
**Common pitfall** — An over-permissive signature is the dangerous failure: if the client picks the key or content-type, an attacker can overwrite others' objects or upload an executable disguised as an image. Bake explicit conditions (key prefix, max content-length, content-type) into the signature, keep expiry short, never expose long-lived credentials — and never trust the presign as proof of a clean file; validate server-side after upload.
:::

*Go deeper — how do you enforce a max upload size when the client controls the PUT (hint: `content-length-range` in the POST policy)?*

**Keywords** — `presigned URL · PUT/GET · ObjectCreated · content-length-range · expiry · server-side validation`

### New answer (vi)
**Chốt** — Presigned URL gỡ application server khỏi data path: client `PUT`/`GET` object 2 GB trực tiếp lên S3 bằng một URL có ký, sống ngắn mà backend phát ra — fix được OOM. Cái bẫy là bạn không còn inspect được bytes đang truyền, nên phải khóa chặt signature và validate object sau khi nó đáp xuống.

**Cơ chế** — Backend xác thực user, quyết định object key, ký một URL bằng credential của nó giới hạn cho một thao tác (PUT hoặc GET) trên key đó, và trả về. Client upload trực tiếp; download y hệt với một presigned GET cho object private. Object store xử lý bandwidth cùng multipart parallelism, nên áp lực memory của app biến mất.

:::muted
**Trade-off** — Bạn đổi một proxy đơn giản lấy một điệu nhảy hai bước và mất quyền kiểm soát in-flight: không virus-scan hay transcode đồng bộ được, nên chúng chuyển sang một bước async trigger trên `ObjectCreated`. Presigned download bypass CDN của bạn trừ khi bạn ký CDN URL thay vào đó, và expiry ngắn giúp bảo mật nhưng có thể vỡ các upload chậm hoặc resumable sống lâu hơn signature.
:::

:::muted
**Bẫy thường gặp** — Một signature quá rộng quyền là failure nguy hiểm: nếu client chọn key hoặc content-type, kẻ tấn công có thể ghi đè object của user khác hoặc upload một file thực thi giả dạng ảnh. Nướng các điều kiện rõ ràng (key prefix, max content-length, content-type) vào signature, giữ expiry ngắn, không bao giờ phơi credential sống lâu — và không bao giờ tin presign như bằng chứng file sạch; validate phía server sau upload.
:::

*Đào sâu tiếp — làm sao ép max upload size khi client kiểm soát PUT (gợi ý: `content-length-range` trong POST policy)?*

**Từ khoá ăn điểm** — `presigned URL · PUT/GET · ObjectCreated · content-length-range · expiry · server-side validation`

## 3-card — senior — [Video, Streaming]
**Question:** You are building a video platform like YouTube. A creator uploads one 4K master file; viewers range from a 5G phone to a buffering 3G connection, and the UI needs scrubbable thumbnails. Design the delivery pipeline: transcoding, adaptive bitrate streaming, and on-the-fly thumbnails.
**Verdict:** KEEP — End-to-end senior design covering transcoding fan-out, ABR, packaging, and thumbnails with real trade-offs and failure modes.

### New answer (en)
**TL;DR** — On upload, fan out an async transcoding pipeline that produces a **bitrate ladder** packaged as short segments with an HLS/DASH manifest; the player uses **adaptive bitrate (ABR)** to pick the best rendition it can sustain. Scrubbable thumbnails are a pre-baked sprite sheet plus a WebVTT index, all served through a CDN.

**How it works** — The master lands in object storage and emits an event; a worker fleet splits it into segments and re-encodes each into renditions (240p–4K) and codecs (H.264 for compatibility, AV1/HEVC for efficiency). Renditions are packaged into 2–6 s segments with a manifest (`.m3u8` / `.mpd`). The player downloads the manifest and switches renditions segment-by-segment based on measured throughput and buffer health. Thumbnails are a sprite grid + WebVTT so the scrubber maps a hover position to a frame without per-frame requests.

:::muted
**Trade-off** — A deeper ladder and more codecs give smoother adaptation and smaller bytes-per-quality but multiply transcoding compute, storage, and time-to-watchable. Larger segments compress better and cut request overhead but make ABR switching coarser and raise live latency. On-the-fly thumbnails save storage but add request-time CPU and cache poorly; pre-baked sprites cost storage but cache cleanly.
:::

:::muted
**Common pitfall** — Transcoding the whole file in one synchronous job is a head-of-line block — a 2-hour 4K upload starves shorter videos; use segment-level parallelism and a priority queue. ABR reacting only to instantaneous bandwidth oscillates (visible quality flapping) — smooth estimates and weigh buffer occupancy. Missing cache headers / `Range` support on segments forces full re-downloads and breaks seeking, and absolute origin URLs in manifests bypass the CDN.
:::

*Go deeper — how do you keep live-stream latency low when small segments hurt compression (hint: LL-HLS, chunked CMAF)?*

**Keywords** — `bitrate ladder · ABR · HLS/DASH · manifest · segment · sprite sheet · WebVTT · Range · priority queue`

### New answer (vi)
**Chốt** — Khi upload, fan-out một pipeline transcoding async tạo ra một **bitrate ladder** package thành các segment ngắn cùng một manifest HLS/DASH; player dùng **adaptive bitrate (ABR)** để chọn rendition tốt nhất nó kham được. Thumbnail scrub được là một sprite sheet pre-baked cùng một index WebVTT, tất cả serve qua một CDN.

**Cơ chế** — Master đáp xuống object storage và phát một event; một fleet worker chia nó thành segment và re-encode mỗi cái thành các rendition (240p–4K) và codec (H.264 cho tương thích, AV1/HEVC cho hiệu quả). Rendition được package thành segment 2–6 s với một manifest (`.m3u8` / `.mpd`). Player tải manifest và chuyển rendition theo từng segment dựa trên throughput đo được và buffer health. Thumbnail là một lưới sprite + WebVTT để scrubber ánh xạ vị trí hover sang một frame mà không cần request mỗi frame.

:::muted
**Trade-off** — Một ladder sâu hơn và nhiều codec hơn cho adaptation mượt hơn và ít bytes mỗi mức chất lượng nhưng nhân lên compute transcoding, storage, và thời gian tới khi xem được. Segment lớn hơn nén tốt hơn và giảm overhead request nhưng làm chuyển ABR thô hơn và tăng latency live. Thumbnail on-the-fly tiết kiệm storage nhưng thêm CPU lúc request và cache kém; sprite pre-baked tốn storage nhưng cache sạch.
:::

:::muted
**Bẫy thường gặp** — Transcode cả file trong một job đồng bộ là một block head-of-line — một upload 4K dài 2 tiếng bỏ đói các video ngắn; dùng parallelism mức segment và một priority queue. ABR chỉ phản ứng với bandwidth tức thời sẽ dao động (chất lượng flap thấy rõ) — smooth ước lượng và cân nhắc buffer occupancy. Thiếu cache header / hỗ trợ `Range` trên segment ép re-download toàn bộ và vỡ seeking, và absolute origin URL trong manifest bypass CDN.
:::

*Đào sâu tiếp — làm sao giữ latency live-stream thấp khi segment nhỏ làm hại nén (gợi ý: LL-HLS, chunked CMAF)?*

**Từ khoá ăn điểm** — `bitrate ladder · ABR · HLS/DASH · manifest · segment · sprite sheet · WebVTT · Range · priority queue`

## 4-card — middle — [CDN, Origin Protection]
**Question:** A viral post sends 500k requests/sec to a popular image. Your CDN hit ratio is 95%, yet every few minutes the origin gets a sudden burst of thousands of identical requests and nearly falls over. Explain the cache hierarchy, the cost of a miss, and origin shielding.
**Verdict:** KEEP — Diagnostic of a thundering-herd / miss-storm with concrete mitigations (shielding, coalescing, SWR, jitter); strong middle-level depth.

### New answer (en)
**TL;DR** — That burst is a **miss storm**: a hot object's TTL expires at many edge POPs at once, they all miss simultaneously, and the identical requests stampede the origin. Fix it with **origin shielding** plus **request coalescing**, and soften TTL expiry with jitter and stale-while-revalidate.

**How it works** — Requests flow browser → edge POP → regional/parent tier → origin; a hit at any layer is cheap, a miss cascades to the origin and pays a slow fetch plus origin compute. Origin shielding designates one parent POP that all edges fetch through, so the origin sees one request instead of hundreds. Request coalescing (collapsed forwarding) holds concurrent requests for the same key and lets only one reach origin, then fans the single response back.

:::muted
**Trade-off** — Shielding cuts origin load and raises the effective hit ratio but adds a hop on a miss and concentrates load on the shield POP — if it's far or overloaded it becomes the bottleneck. Coalescing protects origin but briefly serializes requests on a cold key, adding tail latency. Longer TTLs reduce miss frequency but worsen staleness.
:::

:::muted
**Common pitfall** — Synchronized TTL expiry causes thundering herds; stagger with TTL jitter and serve **stale-while-revalidate** so the edge returns the old object and refreshes in the background. A silently non-cacheable response (stray `Set-Cookie`, `Cache-Control: private`, or a cached 500) collapses the hit ratio and routes the flood to origin. Without coalescing, even 99% hit ratio leaves enough concurrent misses on a hot key to saturate origin.
:::

*Go deeper — coalescing helps when the same key is missing everywhere; what protects you when 500k requests hit 500k distinct cold keys instead?*

**Keywords** — `cache hierarchy · miss storm · thundering herd · origin shield · request coalescing · TTL jitter · stale-while-revalidate`

### New answer (vi)
**Chốt** — Burst đó là một **miss storm**: TTL của một hot object hết hạn ở nhiều edge POP cùng lúc, chúng đồng loạt miss, và các request giống hệt nhau stampede origin. Fix bằng **origin shielding** cùng **request coalescing**, và làm mềm TTL expiry bằng jitter và stale-while-revalidate.

**Cơ chế** — Request chảy browser → edge POP → tier regional/parent → origin; một hit ở bất kỳ layer nào đều rẻ, một miss cascade tới origin và trả một fetch chậm cùng compute của origin. Origin shielding chỉ định một parent POP mà mọi edge fetch qua, để origin thấy một request thay vì hàng trăm. Request coalescing (collapsed forwarding) giữ các request đồng thời cho cùng một key và chỉ cho một cái tới origin, rồi fan response duy nhất trở lại.

:::muted
**Trade-off** — Shielding cắt tải origin và nâng hit ratio hiệu dụng nhưng thêm một hop khi miss và tập trung tải lên shield POP — nếu nó xa hoặc quá tải nó thành bottleneck. Coalescing bảo vệ origin nhưng tạm thời serialize các request trên một cold key, thêm tail latency. TTL dài hơn giảm tần suất miss nhưng làm staleness tệ hơn.
:::

:::muted
**Bẫy thường gặp** — TTL expiry đồng bộ gây thundering herd; rải bằng TTL jitter và serve **stale-while-revalidate** để edge trả object cũ và refresh nền. Một response âm thầm không cacheable (`Set-Cookie` lạc, `Cache-Control: private`, hay một 500 bị cache) làm sập hit ratio và route cơn lũ về origin. Không có coalescing, kể cả hit ratio 99% vẫn để đủ miss đồng thời trên một hot key để bão hòa origin.
:::

*Đào sâu tiếp — coalescing giúp khi cùng một key miss ở mọi nơi; cái gì bảo vệ bạn khi 500k request trúng 500k cold key khác nhau thay vào đó?*

**Từ khoá ăn điểm** — `cache hierarchy · miss storm · thundering herd · origin shield · request coalescing · TTL jitter · stale-while-revalidate`

## 5-card — junior — [Storage, Cost]
**Question:** Your S3 bill is climbing because you keep every user upload in standard storage forever, but 90% of files are never touched after the first week. How would hot/cold storage tiering and lifecycle policies bring the cost down?
**Verdict:** KEEP — Junior-appropriate but has real "why" (tiering bet, retrieval cost, minimum-duration) and a clear design decision, not single-fact recall.

### New answer (en)
**TL;DR** — Use storage **tiers** (hot → cool/infrequent-access → cold/archive) and a **lifecycle policy** that automatically demotes objects as they age. Since 90% of files go cold after a week, moving them to a cheaper tier slashes the bill with zero migration code.

**How it works** — Tiers trade access speed and retrieval cost for a lower per-GB price: hot (S3 Standard) for frequent access, cool for rarely read, cold/archive (Glacier) for almost-never read. A lifecycle policy defines rules like "after 30 days → infrequent-access, after 90 days → archive, after 1 year → delete." The platform transitions objects on a schedule based on age or last access.

:::muted
**Common pitfall** — Applying one lifecycle to mixed access patterns hurts the files that stay hot — demoting an actively served file to archive turns a millisecond read into a multi-hour restore and a surprise retrieval bill. When access is unpredictable, intelligent-tiering (auto-moves on observed access) beats a fixed age rule. And a delete rule with the wrong filter can silently expire data you needed — scope by prefix/tag and test before enabling. Watch minimum-storage-duration charges: demoting too aggressively can cost more than staying hot.
:::

*Go deeper — at what crossover point does intelligent-tiering's per-object monitoring fee stop being worth it (hint: tiny objects)?*

**Keywords** — `hot/cool/cold · Glacier · lifecycle policy · transition · retrieval cost · intelligent-tiering · minimum-storage-duration`

### New answer (vi)
**Chốt** — Dùng các **tier** storage (hot → cool/infrequent-access → cold/archive) và một **lifecycle policy** tự động hạ object khi chúng già đi. Vì 90% file nguội sau một tuần, chuyển chúng xuống tier rẻ hơn chém mạnh hóa đơn mà không cần code migration nào.

**Cơ chế** — Các tier đánh đổi tốc độ truy cập và chi phí retrieval lấy giá mỗi GB thấp hơn: hot (S3 Standard) cho truy cập thường xuyên, cool cho đọc hiếm, cold/archive (Glacier) cho gần như không bao giờ đọc. Một lifecycle policy định nghĩa rule như "sau 30 ngày → infrequent-access, sau 90 ngày → archive, sau 1 năm → xóa." Nền tảng transition object theo lịch dựa trên tuổi hoặc last-access.

:::muted
**Bẫy thường gặp** — Áp một lifecycle cho pattern truy cập hỗn hợp làm hại những file còn nóng — hạ một file đang được serve tích cực xuống archive biến một read mili-giây thành một restore nhiều giờ và một hóa đơn retrieval bất ngờ. Khi truy cập không đoán được, intelligent-tiering (tự chuyển theo truy cập quan sát được) hơn một age rule cố định. Và một delete rule với filter sai có thể âm thầm hết hạn data bạn cần — scope theo prefix/tag và test trước khi enable. Để ý phí minimum-storage-duration: hạ quá hung hăng có thể tốn hơn để ở hot.
:::

*Đào sâu tiếp — tới điểm crossover nào thì phí monitoring mỗi object của intelligent-tiering hết đáng (gợi ý: object nhỏ xíu)?*

**Từ khoá ăn điểm** — `hot/cool/cold · Glacier · lifecycle policy · transition · retrieval cost · intelligent-tiering · minimum-storage-duration`

## 6-card — senior — [Object Storage, Consistency]
**Question:** A user uploads a profile photo, your service immediately reads it back to generate a thumbnail, and sometimes gets a 404 or the previous image. Explain read-after-write vs eventual consistency in object storage and what a client actually observes.
**Verdict:** KEEP — Senior diagnostic distinguishing store-level consistency from cache-layer staleness; the "consistency is the whole read path" insight has real depth.

### New answer (en)
**TL;DR** — The 404-or-old-image symptom is either an eventual-consistency window in the store, or — more likely on modern S3, which is strongly read-after-write consistent for new objects, overwrites, and deletes — a CDN/cache layer in front returning a cached miss or stale copy. Consistency is a property of the **whole read path**, not just the backend.

**How it works** — Object stores replicate across many nodes; the consistency model defines what a reader sees after a write. Read-after-write guarantees a GET after a successful PUT of a new key returns that object. Under weaker eventual consistency, a read issued right after a write can hit a replica that hasn't received the update — a 404 for a brand-new key or the previous version after an overwrite. A CDN or proxy cache reintroduces staleness because it's a separate copy with its own TTL.

:::muted
**Trade-off** — Stronger consistency simplifies application logic — read-your-own-write without retries — but historically required more cross-replica coordination, which is why some systems offered only eventual consistency for lower latency and higher availability. Even a strongly consistent store gains staleness the moment you layer a cache in front.
:::

:::muted
**Common pitfall** — Assuming overwrites are instantly visible everywhere bites you: caches and lagging list indexes still surface old data. Use **immutable, versioned keys** (`photo-v2.jpg` instead of overwriting `photo.jpg`) so there's no stale-overwrite window, and invalidate/bypass the CDN for the freshly written object. Blindly retrying on a 404 hides the symptom, adds latency, and still fails if a cache pins the stale copy.
:::

*Go deeper — even with strong store consistency, why can `LIST` still lag a `PUT`, and how do you make a "read your own upload" flow robust?*

**Keywords** — `read-after-write · eventual consistency · replica · versioned key · CDN staleness · read-your-own-write`

### New answer (vi)
**Chốt** — Triệu chứng 404-hoặc-ảnh-cũ hoặc là một cửa sổ eventual-consistency trong store, hoặc — khả năng cao hơn trên S3 hiện đại, vốn strongly read-after-write consistent cho object mới, overwrite, và delete — một layer CDN/cache phía trước trả một cached miss hoặc bản stale. Consistency là thuộc tính của **toàn bộ read path**, không chỉ backend.

**Cơ chế** — Object store replicate qua nhiều node; consistency model định nghĩa reader thấy gì sau một write. Read-after-write đảm bảo một GET sau một PUT thành công của một key mới trả về object đó. Dưới eventual consistency yếu hơn, một read phát ngay sau một write có thể trúng một replica chưa nhận update — một 404 cho một key tinh mới hoặc version trước sau một overwrite. Một CDN hoặc proxy cache đưa staleness trở lại vì nó là một bản sao riêng với TTL riêng.

:::muted
**Trade-off** — Consistency mạnh hơn làm logic ứng dụng đơn giản hơn — read-your-own-write mà không retry — nhưng lịch sử đòi nhiều coordination qua replica hơn, đó là lý do một số hệ thống chỉ cho eventual consistency để latency thấp hơn và availability cao hơn. Kể cả một store strongly consistent cũng nhiễm staleness ngay khi bạn xếp một cache phía trước.
:::

:::muted
**Bẫy thường gặp** — Giả định overwrite hiện tức thì ở mọi nơi sẽ cắn bạn: cache và list index trễ vẫn nổi lên data cũ. Dùng **key bất biến, versioned** (`photo-v2.jpg` thay vì overwrite `photo.jpg`) để không có cửa sổ stale-overwrite, và invalidate/bypass CDN cho object vừa ghi. Retry mù trên một 404 che triệu chứng, thêm latency, và vẫn fail nếu một cache đang ghim bản stale.
:::

*Đào sâu tiếp — kể cả với strong consistency ở store, vì sao `LIST` vẫn có thể trễ một `PUT`, và làm sao để flow "đọc lại chính upload của mình" bền bỉ?*

**Từ khoá ăn điểm** — `read-after-write · eventual consistency · replica · versioned key · CDN staleness · read-your-own-write`

## 7-card — staff — [CDN, Global Scale]
**Question:** You are the architect for a global media platform serving users on every continent with sub-100ms asset latency and a strict requirement that a takedown (legal removal) propagate worldwide within seconds. Design the content-delivery system: multi-region origins, edge POPs, and invalidation at scale.
**Verdict:** KEEP — Staff-level design with a hard constraint (seconds-to-global takedown) that forces the purge-plus-edge-deny insight; full arc of trade-offs and failure modes.

### New answer (en)
**TL;DR** — Multi-region replicated origins fronted by a global CDN with hundreds of edge POPs, users steered to the nearest via anycast/geo-DNS. For the seconds-fast takedown, don't rely on purge alone (it's eventually consistent) — pair a fast-purge with an **edge auth/deny** that takes effect immediately so the asset is blocked even while cached copies linger.

**How it works** — Content sits in object storage replicated to a few continents; a POP miss fetches from a regional shield, then the closest origin replica. Normal updates use immutable, content-hashed URLs (new content = new URL, no purge needed), reserving active purge for the rare takedown. A takedown publishes a control-plane event: fire the CDN's fast-purge API to every POP *and* flip an access-control/token check at the edge so a denied asset stops serving instantly.

:::muted
**Trade-off** — More origin regions cut cross-ocean latency and add DR headroom but multiply replication cost, write-propagation lag, and consistency-bug surface. A deep POP footprint maximizes proximity but lowers per-POP hit ratio (cache fragmentation) and makes global invalidation slower; a parent-shield tier mitigates that at one extra hop. Token-based edge revocation is instant and purge-free but adds per-request validation cost and key-distribution complexity.
:::

:::muted
**Common pitfall** — Treating purge as instant and total is the cardinal mistake: it's eventually consistent across POPs, leaving a window where some region still serves the content — hence pairing it with immediate edge deny. Replication lag means a takedown at one origin can be re-pulled from a lagging replica, so you must block re-fetch at the edge, not just delete the source. A global wildcard purge can cold-start every POP at once and stampede origins, so scope purges and protect origins with shielding, coalescing, and stale-while-revalidate.
:::

*Go deeper — if signed tokens grant edge revocation, how do you revoke an already-issued long-lived token worldwide within seconds (hint: short token TTL + a deny-list / key rotation)?*

**Keywords** — `multi-region origin · anycast/geo-DNS · edge POP · shield · fast-purge · edge auth/deny · content-hash · replication lag`

### New answer (vi)
**Chốt** — Multi-region origin replicate được front bởi một CDN toàn cầu với hàng trăm edge POP, user được steer tới cái gần nhất qua anycast/geo-DNS. Với takedown nhanh trong-vài-giây, đừng chỉ dựa vào purge (nó eventually consistent) — ghép một fast-purge với một **edge auth/deny** có hiệu lực ngay để asset bị chặn kể cả khi các bản cached còn lảng vảng.

**Cơ chế** — Content nằm trong object storage replicate sang một vài châu lục; một POP miss fetch từ một regional shield, rồi origin replica gần nhất. Update bình thường dùng URL bất biến, content-hashed (content mới = URL mới, không cần purge), dành active purge cho takedown hiếm. Một takedown publish một event control-plane: bắn fast-purge API của CDN tới mọi POP *và* flip một check access-control/token tại edge để một asset bị từ chối ngừng serve tức thì.

:::muted
**Trade-off** — Nhiều origin region hơn cắt latency xuyên đại dương và thêm headroom DR nhưng nhân lên chi phí replication, độ trễ write-propagation, và bề mặt bug consistency. Một footprint POP sâu tối đa hóa proximity nhưng giảm hit ratio mỗi POP (cache fragmentation) và làm global invalidation chậm hơn; một tier parent-shield giảm thiểu điều đó với một hop thêm. Edge revocation dựa token là tức thì và không cần purge nhưng thêm chi phí validation mỗi request và độ phức tạp key-distribution.
:::

:::muted
**Bẫy thường gặp** — Coi purge là tức thì và toàn bộ là sai lầm cốt tử: nó eventually consistent qua các POP, để lại một cửa sổ mà một vài region vẫn serve content — vì thế ghép nó với edge deny tức thì. Replication lag nghĩa là một takedown ở một origin có thể bị re-pull từ một replica trễ, nên bạn phải block re-fetch tại edge, không chỉ xóa source. Một global wildcard purge có thể cold-start mọi POP cùng lúc và stampede origin, nên scope purge và bảo vệ origin bằng shielding, coalescing, và stale-while-revalidate.
:::

*Đào sâu tiếp — nếu signed token cấp edge revocation, làm sao revoke một token sống lâu đã phát ra trên toàn cầu trong vài giây (gợi ý: token TTL ngắn + một deny-list / key rotation)?*

**Từ khoá ăn điểm** — `multi-region origin · anycast/geo-DNS · edge POP · shield · fast-purge · edge auth/deny · content-hash · replication lag`
