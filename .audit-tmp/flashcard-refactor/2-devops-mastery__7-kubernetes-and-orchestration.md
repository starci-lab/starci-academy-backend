# 2-devops-mastery / 7-kubernetes-and-orchestration
Summary: kept 8, delete 0 of 8

## 0-card — junior — [Kubernetes, Networking]
**Question:** A user types your app's URL in their browser. Walk through how that request actually reaches one of your containers, naming the role of Pod, Deployment, Service, and Ingress along the way.
**Verdict:** KEEP — Open-ended "trace the request" walk-through tying four primitives together; scales from naming objects to reasoning about each indirection.

### New answer (en)
**TL;DR** — The request flows browser → Ingress (TLS + host/path routing) → Service (stable virtual IP, load-balances by label selector) → a specific Pod → container. Each layer exists to hide the churn of the layer below it.

**How it works** — A **Pod** is the smallest deployable unit; it wraps one or more containers sharing a network namespace and one IP, and it's ephemeral. A **Deployment** owns a ReplicaSet that keeps N identical Pods running, recreating them when they die or get rescheduled. Because Pod IPs change, a **Service** provides a stable ClusterIP and DNS name and load-balances across the Pods matching its label selector. An **Ingress** sits at the edge, terminating TLS and routing external HTTP(S) by host/path to the right Service — but only if an Ingress *controller* (nginx, Traefik, a cloud LB) is actually installed to watch it.

:::muted
**Trade-off** — The layering buys decoupling: Pods can crash and reschedule with new IPs while the Service name stays constant, and you scale replicas without clients knowing. The cost is several indirections to reason about when something breaks.
:::

:::muted
**Common pitfall** — Creating a bare Pod (nothing reconciles it after a node reboot) and a Service whose label selector doesn't match the Pod labels, so it has zero endpoints and every request times out. Always check `kubectl get endpoints` to confirm the Service actually found Pods.
:::

*Go deeper: a 404, a 503, and a connection-refused at the edge each point at a different layer — which one, and why?*

**Keywords:** `Pod · Deployment/ReplicaSet · Service ClusterIP · label selector · Ingress controller · kubectl get endpoints`

### New answer (vi)
**Chốt** — Request đi browser → Ingress (TLS + routing host/path) → Service (virtual IP ổn định, load-balance theo label selector) → một Pod cụ thể → container. Mỗi tầng tồn tại để che đi sự biến động của tầng dưới nó.

**Cơ chế** — **Pod** là đơn vị triển khai nhỏ nhất; nó bọc một hoặc nhiều container chia sẻ chung network namespace và một IP, và nó ephemeral. **Deployment** sở hữu một ReplicaSet giữ N Pod giống hệt nhau chạy, tạo lại chúng khi chết hoặc bị reschedule. Vì IP của Pod thay đổi, **Service** cấp một ClusterIP và tên DNS ổn định rồi load-balance qua các Pod khớp label selector. **Ingress** đứng ở rìa, terminate TLS và route HTTP(S) bên ngoài theo host/path tới đúng Service — nhưng chỉ khi một Ingress *controller* (nginx, Traefik, cloud LB) thực sự được cài để watch nó.

:::muted
**Trade-off** — Cách phân tầng mua sự decoupling: Pod có thể crash và reschedule với IP mới trong khi tên Service vẫn không đổi, và bạn scale replica mà client không cần biết. Cái giá là vài lớp gián tiếp phải suy luận khi có sự cố.
:::

:::muted
**Bẫy thường gặp** — Tạo một Pod trần (không gì reconcile nó sau khi node reboot) và một Service có label selector không khớp label của Pod, nên có zero endpoint và mọi request timeout. Luôn kiểm tra `kubectl get endpoints` để xác nhận Service thực sự tìm thấy Pod.
:::

*Đào sâu tiếp: một 404, một 503, và một connection-refused ở rìa mỗi cái chỉ vào một tầng khác nhau — cái nào, và vì sao?*

**Từ khoá ăn điểm:** `Pod · Deployment/ReplicaSet · Service ClusterIP · label selector · Ingress controller · kubectl get endpoints`

## 1-card — middle — [Kubernetes, Reliability]
**Question:** After you added a liveness probe, your service started flapping under load — Pods restart constantly and latency spikes. Explain the difference between liveness and readiness probes and how a misconfigured probe turned into a self-inflicted outage.
**Verdict:** KEEP — Diagnosis question with a concrete failure scenario; demands distinguishing two mechanisms and reasoning about a cascading-restart storm.

### New answer (en)
**TL;DR** — Readiness controls *traffic* (fail → removed from endpoints, Pod keeps running); liveness controls *restarts* (fail → kubelet kills and recreates the container). Your flapping is a tight liveness probe restarting Pods that were merely busy, shedding load onto the rest and cascading.

**How it works** — A **readiness** probe answers "should I send this Pod traffic right now?" — on failure the Pod drops out of Service endpoints but is not killed, so it can warm up or drain. A **liveness** probe answers "is this process wedged so only a restart fixes it?" — past its `failureThreshold` the kubelet recreates the container. Use a **startup** probe for slow boots so liveness doesn't fire during init. Under load the fix is a cheap, lenient liveness (generous `timeoutSeconds`/`failureThreshold`/`periodSeconds`) with the real dependency checks pushed into readiness.

:::muted
**Trade-off** — Aggressive liveness catches truly hung processes faster but every false positive is a restart that drops in-flight requests and cold-starts caches; lenient probes tolerate transient slowness but let a real deadlock linger. Pointing liveness at a `/health` that checks the DB couples Pod life to a dependency — a DB hiccup restarts every replica at once.
:::

:::muted
**Common pitfall** — A tight-timeout liveness on a `/health` route that slows under load times out, the kubelet restarts a busy (not dead) Pod, its connections pile onto the rest, they slow and fail *their* probes — a restart storm. Also: using liveness where you meant readiness, and `initialDelaySeconds` shorter than real startup causing crash-loops. Diagnose with `kubectl describe pod` (restart count, last-state reason).
:::

*Go deeper: why is pointing a liveness probe at a deep dependency check almost always wrong, even though it "tests more"?*

**Keywords:** `readiness=traffic · liveness=restart · startup probe · failureThreshold · shallow liveness/deep readiness · restart storm`

### New answer (vi)
**Chốt** — Readiness kiểm soát *traffic* (fail → gỡ khỏi endpoints, Pod vẫn chạy); liveness kiểm soát *restart* (fail → kubelet giết và tạo lại container). Flapping của bạn là một liveness probe quá chặt restart những Pod chỉ đang bận, đẩy tải sang phần còn lại và lan truyền.

**Cơ chế** — **Readiness** probe trả lời "có nên gửi traffic cho Pod này ngay bây giờ không?" — khi fail Pod rớt khỏi Service endpoints nhưng không bị giết, nên có thể warm up hoặc drain. **Liveness** probe trả lời "process này có bị treo cứng đến mức chỉ restart mới sửa được không?" — vượt `failureThreshold` thì kubelet tạo lại container. Dùng **startup** probe cho app boot chậm để liveness không bắn trong lúc init. Dưới tải, cách sửa là một liveness rẻ và khoan dung (`timeoutSeconds`/`failureThreshold`/`periodSeconds` rộng rãi) với phần check dependency thật đẩy vào readiness.

:::muted
**Trade-off** — Liveness quyết liệt bắt process treo thật nhanh hơn nhưng mỗi false positive là một lần restart làm rớt request đang xử lý và cold-start cache; probe khoan dung dung thứ chậm nhất thời nhưng để deadlock thật kéo dài. Trỏ liveness vào một `/health` mà check DB sẽ ghép sự sống của Pod với một dependency — DB trục trặc là restart mọi replica cùng lúc.
:::

:::muted
**Bẫy thường gặp** — Một liveness timeout chặt gọi route `/health` bị chậm dưới tải sẽ timeout, kubelet restart một Pod đang bận (không chết), connection của nó dồn sang phần còn lại, chúng chậm theo rồi fail *probe của chúng* — một cơn bão restart. Ngoài ra: dùng liveness khi ý là readiness, và `initialDelaySeconds` ngắn hơn startup thật gây crash-loop. Chẩn đoán bằng `kubectl describe pod` (restart count, last-state reason).
:::

*Đào sâu tiếp: vì sao trỏ liveness probe vào một check dependency sâu gần như luôn sai, dù nó "test nhiều hơn"?*

**Từ khoá ăn điểm:** `readiness=traffic · liveness=restart · startup probe · failureThreshold · liveness nông/readiness sâu · restart storm`

## 2-card — senior — [Kubernetes, Resources]
**Question:** One of your Pods keeps getting OOMKilled while another sits idle yet is mysteriously slow. Explain how resource requests and limits drive scheduling, OOMKills, and CPU throttling, and how you'd set them.
**Verdict:** KEEP — Two-symptom diagnosis forcing the requests-vs-limits + compressible-vs-incompressible model and a real sizing judgment; strong senior depth.

### New answer (en)
**TL;DR** — The OOMKilled Pod's memory limit is below its real working set (memory is incompressible — over the limit, it's killed). The "idle but slow" Pod is CPU-throttled by a low CPU limit (CPU is compressible — over the limit, CFS pauses it, it isn't killed).

**How it works** — **Requests** are what the scheduler reserves and what sets the Pod's QoS class — a Pod only lands on a node with enough unreserved CPU/memory. **Limits** are the runtime-enforced ceiling. Over the **memory** limit → **OOMKilled**. Over the **CPU** limit → **throttled** via CFS quota (paused until the next period). Sane defaults: memory request ≈ limit for predictable scheduling, size both from observed P95/P99, and be cautious with CPU limits because throttling adds latency even when the node has spare cores.

:::muted
**Trade-off** — `requests == limits` everywhere gives the Guaranteed QoS class and the most predictable behaviour but reserves capacity you rarely use, lowering bin-packing density and raising cost. Loose requests + high limits (Burstable) pack more Pods and let bursts borrow idle capacity but risk memory pressure and noisy neighbors. CPU limits trade tail-latency for fairness — removing them often *improves* P99.
:::

:::muted
**Common pitfall** — A JVM/Node heap that doesn't see the cgroup limit grows past it and gets OOMKilled — fix both the limit and the runtime's memory awareness. The other trap is **no requests at all**: Pods become BestEffort (first evicted under pressure) and the scheduler over-packs nodes thinking they're empty. Watch `container_cpu_cfs_throttled_periods` and the OOMKilled reason in `kubectl describe`.
:::

*Go deeper: why do many teams set a CPU request but deliberately leave the CPU limit off?*

**Keywords:** `request=reserve/schedule · limit=ceiling · OOMKill (incompressible) · CFS throttle (compressible) · QoS Guaranteed/Burstable/BestEffort · cgroup-aware heap`

### New answer (vi)
**Chốt** — Pod bị OOMKilled có memory limit dưới working set thật (memory không nén được — vượt limit là bị giết). Pod "rảnh nhưng chậm" bị CPU-throttle do CPU limit thấp (CPU nén được — vượt limit thì CFS pause nó, không giết).

**Cơ chế** — **Requests** là phần scheduler reserve và là thứ quyết định QoS class của Pod — Pod chỉ đáp xuống node đủ CPU/memory chưa reserve. **Limits** là trần do runtime ép buộc. Vượt limit **memory** → **OOMKilled**. Vượt limit **CPU** → **throttle** qua CFS quota (pause đến period tiếp theo). Mặc định hợp lý: memory request ≈ limit để scheduling dễ đoán, size cả hai từ P95/P99 quan sát được, và thận trọng với CPU limit vì throttling thêm latency ngay cả khi node còn core rảnh.

:::muted
**Trade-off** — `requests == limits` cho mọi thứ cho QoS Guaranteed và hành vi dễ đoán nhất nhưng reserve capacity hiếm dùng, giảm mật độ bin-packing và tăng cost. Request lỏng + limit cao (Burstable) pack nhiều Pod hơn và cho burst mượn capacity rảnh nhưng rủi ro memory pressure và noisy neighbor. CPU limit đánh đổi tail-latency lấy fairness — bỏ chúng thường *cải thiện* P99.
:::

:::muted
**Bẫy thường gặp** — Một JVM/Node heap không thấy cgroup limit sẽ lớn vượt qua và bị OOMKilled — sửa cả limit lẫn nhận thức memory của runtime. Bẫy khác là **không có request nào**: Pod thành BestEffort (bị evict đầu tiên khi có pressure) và scheduler over-pack node vì tưởng chúng trống. Theo dõi `container_cpu_cfs_throttled_periods` và reason OOMKilled trong `kubectl describe`.
:::

*Đào sâu tiếp: vì sao nhiều team đặt CPU request nhưng cố ý bỏ CPU limit?*

**Từ khoá ăn điểm:** `request=reserve/schedule · limit=trần · OOMKill (không nén) · CFS throttle (nén được) · QoS Guaranteed/Burstable/BestEffort · heap nhận cgroup`

## 3-card — middle — [Kubernetes, Deployments]
**Question:** You ran `kubectl apply` for a new image and the rollout has been "in progress" for ten minutes with old and new Pods both running. Explain how `maxSurge`/`maxUnavailable` control a rolling update, what a stuck rollout looks like, and how you'd roll back.
**Verdict:** KEEP — Operational diagnosis + mechanism + recovery; the stuck-rollout reasoning (readiness gating scale-down) shows real understanding.

### New answer (en)
**TL;DR** — A stuck rollout is almost always new Pods never becoming Ready, so Kubernetes correctly refuses to scale down the old ReplicaSet and both run on. Roll back with `kubectl rollout undo deployment/<name>` and debug the image offline.

**How it works** — `RollingUpdate` creates a new ReplicaSet and shifts replicas over gradually. **`maxSurge`** is how many Pods above desired may exist during the update; **`maxUnavailable`** is how many below desired may be missing at once. A new Pod only counts toward progress once it passes its **readiness** probe — that gating is what gives zero-downtime cutover and is exactly why a never-Ready Pod stalls the rollout. Kubernetes keeps prior ReplicaSets in revision history; check `kubectl rollout status` and roll back with `rollout undo` (optionally `--to-revision`).

:::muted
**Trade-off** — `maxSurge: 0` never exceeds capacity (good with strict quotas/per-replica licenses) but drops old Pods before new ones are up. High `maxSurge` is fast and capacity-safe but temporarily doubles resource use and can hit quotas. `maxUnavailable: 0` guarantees full capacity but can't progress with no headroom. Rolling updates are cheap but can't do instant switching or percentage shifts like blue-green/canary.
:::

:::muted
**Common pitfall** — Your hang is a crashing container, failing readiness probe, image-pull error, or no room to schedule the surge Pods; `progressDeadlineSeconds` eventually marks it failed. Don't delete Pods blindly — `kubectl rollout status`, then `get pods` + `describe` the new Pods for the real error, then `rollout undo`.
:::

*Go deeper: with `maxUnavailable: 0` and `maxSurge: 0` set together, what happens to the rollout — and why?*

**Keywords:** `RollingUpdate · maxSurge/maxUnavailable · readiness gates progress · progressDeadlineSeconds · revision history · rollout undo`

### New answer (vi)
**Chốt** — Rollout kẹt gần như luôn là Pod mới không bao giờ Ready, nên Kubernetes đúng đắn từ chối scale down ReplicaSet cũ và cả hai cùng chạy. Rollback bằng `kubectl rollout undo deployment/<name>` và debug image offline.

**Cơ chế** — `RollingUpdate` tạo một ReplicaSet mới và dịch replica sang dần. **`maxSurge`** là số Pod vượt trên desired được phép tồn tại trong lúc update; **`maxUnavailable`** là số Pod dưới desired được phép thiếu một lúc. Một Pod mới chỉ được tính vào progress khi pass **readiness** probe — chính việc gating đó cho cú chuyển zero-downtime và cũng đúng là lý do một Pod mãi-không-Ready làm kẹt rollout. Kubernetes giữ các ReplicaSet trước trong revision history; kiểm tra `kubectl rollout status` và rollback bằng `rollout undo` (tùy chọn `--to-revision`).

:::muted
**Trade-off** — `maxSurge: 0` không bao giờ vượt capacity (tốt với quota chặt/license theo replica) nhưng gỡ Pod cũ trước khi Pod mới lên. `maxSurge` cao thì nhanh và an toàn capacity nhưng tạm thời gấp đôi resource và có thể đụng quota. `maxUnavailable: 0` bảo đảm đủ capacity nhưng không tiến được khi không có headroom. Rolling update rẻ nhưng không chuyển tức thì hay dịch phần trăm như blue-green/canary.
:::

:::muted
**Bẫy thường gặp** — Kẹt của bạn là container crash, readiness probe fail, image-pull error, hoặc không đủ chỗ schedule Pod surge; `progressDeadlineSeconds` cuối cùng đánh dấu failed. Đừng xóa Pod mù quáng — `kubectl rollout status`, rồi `get pods` + `describe` các Pod mới để thấy lỗi thật, rồi `rollout undo`.
:::

*Đào sâu tiếp: khi đặt đồng thời `maxUnavailable: 0` và `maxSurge: 0`, rollout sẽ ra sao — và vì sao?*

**Từ khoá ăn điểm:** `RollingUpdate · maxSurge/maxUnavailable · readiness gate progress · progressDeadlineSeconds · revision history · rollout undo`

## 4-card — middle — [Kubernetes, Configuration]
**Question:** Your team wants to inject database URLs and API keys into Pods without rebuilding images per environment, and someone claims "Secrets are encrypted so we're safe." How do ConfigMaps and Secrets support 12-factor config, and what's the catch with secret-at-rest?
**Verdict:** KEEP — Combines a design principle (12-factor) with a security misconception to debunk (base64 ≠ encrypted); rich follow-up surface.

### New answer (en)
**TL;DR** — ConfigMaps/Secrets externalize config from the image (the 12-factor principle), injected as env vars or mounted files so one image runs everywhere. The catch: Secrets are **base64-encoded, not encrypted** — by default they sit in etcd in plaintext unless you enable encryption-at-rest.

**How it works** — Both keep config in the environment, not the build, swapped per namespace. ConfigMaps hold non-sensitive values (flags, URLs, tuning); Secrets hold credentials and are treated specially (kept out of normal logs, mountable as tmpfs). Mounting Secrets as files is generally preferred over env vars — file mounts can update live, and env vars can leak via crash dumps or `/proc`. Real at-rest protection needs an `EncryptionConfiguration` plus locked-down etcd and RBAC, or an external manager (Vault, cloud KMS-backed).

:::muted
**Trade-off** — Env vars are dead simple but read once at process start, so rotating a Secret needs a restart; volume mounts update in place but the app must re-read the file. Config in Kubernetes objects is GitOps-friendly but raw Secrets in Git are dangerous (hence sealed-secrets/SOPS). An external manager adds real encryption and audit but also a boot-path dependency.
:::

:::muted
**Common pitfall** — Believing base64 means encrypted: anyone with `get secret` or etcd access reads them in the clear. Also: committing Secret manifests to Git, oversized ConfigMaps hitting the etcd object-size limit, and env-var injection silently not picking up a rotated value until restart. Treat namespace RBAC on Secrets as the real boundary.
:::

*Go deeper: what does enabling `EncryptionConfiguration` actually protect against, and what does it not?*

**Keywords:** `12-factor config · ConfigMap vs Secret · base64 ≠ encrypted · etcd plaintext · EncryptionConfiguration · RBAC get secret · file mount vs env var`

### New answer (vi)
**Chốt** — ConfigMaps/Secrets externalize config ra khỏi image (nguyên tắc 12-factor), inject dưới dạng env var hoặc file mount nên một image chạy ở mọi nơi. Cái bẫy: Secrets chỉ **base64-encode, không mã hóa** — mặc định nằm trong etcd ở dạng plaintext trừ khi bạn bật encryption-at-rest.

**Cơ chế** — Cả hai giữ config trong môi trường chứ không phải bản build, hoán đổi theo namespace. ConfigMaps giữ giá trị không nhạy cảm (flag, URL, tuning); Secrets giữ credential và được xử lý đặc biệt (để ngoài log thường, mount được dưới dạng tmpfs). Mount Secret thành file thường được ưu tiên hơn env var — file mount cập nhật live, còn env var có thể rò qua crash dump hoặc `/proc`. Bảo vệ at-rest thật cần một `EncryptionConfiguration` cộng siết etcd và RBAC, hoặc một external manager (Vault, dựa cloud KMS).

:::muted
**Trade-off** — Env var cực đơn giản nhưng đọc một lần lúc process start, nên rotate Secret cần restart; volume mount cập nhật tại chỗ nhưng app phải đọc lại file. Config trong object Kubernetes thân thiện GitOps nhưng Secret thô trong Git là nguy hiểm (vì vậy mới có sealed-secrets/SOPS). External manager thêm mã hóa thật và audit nhưng cũng thêm dependency trong đường boot.
:::

:::muted
**Bẫy thường gặp** — Tin base64 nghĩa là mã hóa: bất cứ ai có `get secret` hoặc truy cập etcd đều đọc được dạng rõ. Ngoài ra: commit manifest Secret vào Git, ConfigMap quá lớn đụng giới hạn object-size của etcd, và inject env-var lặng lẽ không nhận giá trị đã rotate cho đến khi restart. Coi RBAC namespace trên Secrets là ranh giới thật.
:::

*Đào sâu tiếp: bật `EncryptionConfiguration` thực sự bảo vệ chống lại điều gì, và không bảo vệ điều gì?*

**Từ khoá ăn điểm:** `12-factor config · ConfigMap vs Secret · base64 ≠ mã hóa · etcd plaintext · EncryptionConfiguration · RBAC get secret · file mount vs env var`

## 5-card — senior — [Kubernetes, Autoscaling]
**Question:** A traffic spike hits and your service is overwhelmed for two minutes before more capacity appears. Distinguish the HPA from the cluster autoscaler, and explain why autoscaling structurally lags a sudden spike.
**Verdict:** KEEP — Forces the HPA-vs-cluster-autoscaler distinction plus a first-principles latency-stacking argument; clear senior reasoning.

### New answer (en)
**TL;DR** — HPA changes the *replica count* of a Deployment on metrics; the cluster autoscaler changes the *number of nodes* when Pods go Pending. Autoscaling lags because reaction latencies stack — metrics window + HPA reconcile + Pod scheduling/readiness + (if needed) cloud node boot — so a sub-minute spike is over before capacity arrives.

**How it works** — **HPA** compares observed metrics (CPU, memory, or custom/external like queue depth or RPS) to a target and scales Pods. **Cluster Autoscaler** adds nodes when Pods can't be scheduled and removes underused ones. They compose: HPA adds Pods, and if those don't fit, the cluster autoscaler adds nodes. For spiky load: sane requests, HPA targets with headroom, and tuned scale-up/down stabilization windows so you react fast without thrashing.

:::muted
**Trade-off** — CPU is a simple but lagging signal; a leading signal (queue length, RPS/Pod) reacts sooner but needs a custom-metrics pipeline. Aggressive scale-up handles spikes but over-provisions; conservative scaling saves money but risks brownouts. Warm headroom (extra replicas or pause-Pod "balloons") trades steady-state cost for spike latency. HPA and VPA touching one workload can also fight.
:::

:::muted
**Common pitfall** — No resource requests: HPA can't compute utilization and the autoscaler can't size nodes. Also a misconfigured metrics-server and `minReplicas` set so low you cold-start from near-zero every time. Mitigate with pre-warmed headroom, PodDisruptionBudgets, and faster-booting node pools.
:::

*Go deeper: which single change cuts the most latency off a cold spike — and why isn't it "scale faster"?*

**Keywords:** `HPA=replicas · cluster-autoscaler=nodes · Pending → add node · metrics window · stabilization window · node boot latency · custom metrics`

### New answer (vi)
**Chốt** — HPA thay đổi *số replica* của một Deployment theo metric; cluster autoscaler thay đổi *số node* khi Pod chuyển Pending. Autoscaling trễ vì các latency phản ứng xếp chồng — metrics window + HPA reconcile + scheduling/readiness của Pod + (nếu cần) boot node cloud — nên một spike dưới một phút đã qua trước khi capacity tới.

**Cơ chế** — **HPA** so sánh metric quan sát (CPU, memory, hoặc custom/external như queue depth hay RPS) với một target và scale Pod. **Cluster Autoscaler** thêm node khi Pod không schedule được và gỡ node ít dùng. Chúng kết hợp: HPA thêm Pod, nếu không vừa thì cluster autoscaler thêm node. Với tải spiky: request hợp lý, HPA target có headroom, và stabilization window scale-up/down được tinh chỉnh để phản ứng nhanh mà không thrash.

:::muted
**Trade-off** — CPU là tín hiệu đơn giản nhưng trễ; tín hiệu dẫn (queue length, RPS/Pod) phản ứng sớm hơn nhưng cần pipeline custom metric. Scale-up quyết liệt xử lý spike nhưng over-provision; scale dè dặt tiết kiệm tiền nhưng rủi ro brownout. Warm headroom (replica dư hoặc "balloon" pause-Pod) đánh đổi cost ổn-định lấy latency lúc spike. HPA và VPA chạm cùng workload cũng có thể đánh nhau.
:::

:::muted
**Bẫy thường gặp** — Không có resource request: HPA không tính được utilization và autoscaler không size được node. Ngoài ra metrics-server cấu hình sai và `minReplicas` đặt quá thấp nên cold-start từ gần-zero mỗi lần. Giảm thiểu bằng warm headroom pre-warm, PodDisruptionBudget, và node pool boot nhanh hơn.
:::

*Đào sâu tiếp: thay đổi đơn lẻ nào cắt được nhiều latency nhất khỏi một cold spike — và vì sao đó không phải "scale nhanh hơn"?*

**Từ khoá ăn điểm:** `HPA=replica · cluster-autoscaler=node · Pending → thêm node · metrics window · stabilization window · latency boot node · custom metrics`

## 6-card — senior — [Kubernetes, Networking]
**Question:** You need to expose a frontend to the internet, keep an internal API private, and guarantee that only the frontend can reach a payments service. Walk through ClusterIP, NodePort, LoadBalancer, Ingress, and NetworkPolicy for this.
**Verdict:** KEEP — Concrete design scenario mapping five primitives to three requirements; the default-allow segmentation trap is strong senior material.

### New answer (en)
**TL;DR** — Internal API + payments stay **ClusterIP** (in-cluster only); expose the frontend via **Ingress** (one L7 entry, host/path + TLS over a single LB); then a default-deny **NetworkPolicy** on payments that only allows ingress from the frontend's labels. NodePort/LoadBalancer are the lower-level building blocks Ingress sits on.

**How it works** — **ClusterIP** is the default in-cluster virtual IP. **NodePort** opens the Service on a high port of every node — useful for bare-metal or as the target a cloud LB points at. **LoadBalancer** provisions an external cloud LB with a public IP per service (expensive at scale). **Ingress** fronts many Services behind one LB with routing and TLS. **NetworkPolicy** is L3/L4 allow rules by label/namespace; a default-deny plus a frontend-only allow on payments enforces the isolation requirement.

:::muted
**Trade-off** — A LoadBalancer per service is simple but costs one LB+IP each; Ingress consolidates them at the price of running and securing a controller. NodePort is cheap and dependency-free but exposes high ports cluster-wide and needs external LB/DNS plumbing. NetworkPolicy gives strong segmentation only if your CNI enforces it (Calico/Cilium do; some don't), and fine-grained policies risk breaking legitimate traffic.
:::

:::muted
**Common pitfall** — Assuming the cluster is segmented by default — **without a NetworkPolicy, every Pod can reach every other Pod**, so "private" payments is open to any compromised Pod. Applying a policy on a CNI that ignores it gives false confidence. Policies are **additive allow-lists**: forgetting to allow DNS (kube-dns UDP/TCP 53) silently breaks name resolution for locked-down Pods.
:::

*Go deeper: why does a fresh default-deny NetworkPolicy often break the very Pods it protects until you add one specific egress rule?*

**Keywords:** `ClusterIP internal · NodePort · LoadBalancer per-svc · Ingress L7/TLS · NetworkPolicy default-deny · CNI enforcement · allow DNS 53`

### New answer (vi)
**Chốt** — Internal API + payments giữ **ClusterIP** (chỉ trong cluster); expose frontend qua **Ingress** (một điểm vào L7, host/path + TLS trên một LB); rồi một **NetworkPolicy** default-deny lên payments chỉ allow ingress từ label của frontend. NodePort/LoadBalancer là các khối nền tảng cấp thấp mà Ingress đứng trên.

**Cơ chế** — **ClusterIP** là virtual IP trong-cluster mặc định. **NodePort** mở Service trên một port cao của mọi node — hữu ích cho bare-metal hoặc làm target mà cloud LB trỏ tới. **LoadBalancer** provision một cloud LB bên ngoài với một public IP mỗi service (đắt khi scale). **Ingress** đứng trước nhiều Service sau một LB với routing và TLS. **NetworkPolicy** là allow rule L3/L4 theo label/namespace; một default-deny cộng một allow chỉ-frontend lên payments ép buộc yêu cầu isolation.

:::muted
**Trade-off** — Mỗi service một LoadBalancer thì đơn giản nhưng tốn một LB+IP mỗi cái; Ingress gom chúng lại đổi lại phải chạy và bảo vệ một controller. NodePort rẻ và không phụ thuộc nhưng expose port cao toàn cluster và cần đấu nối LB/DNS bên ngoài. NetworkPolicy cho segmentation mạnh chỉ khi CNI của bạn ép buộc nó (Calico/Cilium có; vài cái không), và policy chi tiết rủi ro chặn nhầm traffic hợp lệ.
:::

:::muted
**Bẫy thường gặp** — Giả định cluster được segment sẵn — **không có NetworkPolicy thì mọi Pod chạm tới được mọi Pod khác**, nên payments "riêng tư" mở toang với bất kỳ Pod bị xâm nhập nào. Áp policy trên một CNI bỏ qua nó cho cảm giác an toàn giả. Policy là **allow-list cộng dồn**: quên allow DNS (kube-dns UDP/TCP 53) sẽ lặng lẽ phá name resolution cho các Pod bị khóa.
:::

*Đào sâu tiếp: vì sao một NetworkPolicy default-deny mới thường phá chính các Pod nó bảo vệ cho đến khi bạn thêm một egress rule cụ thể?*

**Từ khoá ăn điểm:** `ClusterIP nội bộ · NodePort · LoadBalancer mỗi svc · Ingress L7/TLS · NetworkPolicy default-deny · CNI ép buộc · allow DNS 53`

## 7-card — staff — [Kubernetes, Architecture]
**Question:** You're asked to design one production cluster shared by a dozen teams, with safe upgrades and no team able to starve or snoop on another. How do you use namespaces, RBAC, resource quotas, and multi-tenancy boundaries, and how do you handle upgrades?
**Verdict:** KEEP — Open-ended staff-level system design spanning tenancy, isolation tiers, and upgrade strategy; the namespace-is-not-a-security-boundary insight is exactly the staff differentiator.

### New answer (en)
**TL;DR** — Make the **namespace** the unit of tenancy — per-team RBAC + ResourceQuota + LimitRange + default-deny NetworkPolicy + PodSecurity — but treat soft multi-tenancy as a cost choice, not a hard security boundary. Upgrade control plane first, then node pools one at a time via surge/drain with PodDisruptionBudgets, validated in non-prod.

**How it works** — Per namespace: **RBAC** RoleBindings scoped to it, **ResourceQuotas** capping aggregate CPU/memory/objects, **LimitRanges** forcing per-Pod defaults, a **default-deny NetworkPolicy** with explicit allows, and PodSecurity (or OPA/Kyverno) blocking privileged Pods and host mounts. Use dedicated node pools (taints/affinity) for noisy or sensitive workloads. For upgrades: managed or HA control plane, step minor versions respecting the control-plane/kubelet skew policy, drain with PDBs, keep etcd backups, watch the deprecation guide.

:::muted
**Trade-off** — Soft multi-tenancy (shared cluster) is cost-efficient and simple but shares the kernel and control plane, so a container escape or noisy neighbor can cross boundaries — quotas and NetworkPolicy reduce, not eliminate, that. Hard isolation (cluster-per-team, per-tenant pools, Kata/gVisor) is stronger but far costlier. Tight quotas prevent starvation but cause Pending Pods; generous quotas invite contention. Match the isolation tier to the threat model.
:::

:::muted
**Common pitfall** — Treating namespaces as a security boundary they aren't: without NetworkPolicy and PodSecurity a Pod can reach another's Services and, if privileged, the node. Forgetting LimitRanges lets one team ship limitless Pods and OOM neighbors despite a quota. On upgrades the killers are **skipping minor versions**, **draining without PDBs** (dropping quorum-sensitive workloads below minimum), and deprecated-API removals breaking manifests.
:::

*Go deeper: at what point do you stop adding guardrails to a shared cluster and split a team into its own cluster instead?*

**Keywords:** `namespace=tenancy unit · RBAC RoleBinding · ResourceQuota/LimitRange · default-deny NetworkPolicy · PodSecurity/OPA · soft vs hard multi-tenancy · version skew · drain + PDB · etcd backup`

### New answer (vi)
**Chốt** — Lấy **namespace** làm đơn vị tenancy — RBAC + ResourceQuota + LimitRange + default-deny NetworkPolicy + PodSecurity cho mỗi team — nhưng coi soft multi-tenancy là một lựa chọn cost, không phải ranh giới bảo mật cứng. Upgrade control plane trước, rồi node pool mỗi lần một cái qua surge/drain với PodDisruptionBudget, validate ở non-prod.

**Cơ chế** — Mỗi namespace: **RBAC** RoleBinding scope vào nó, **ResourceQuota** giới hạn tổng CPU/memory/object, **LimitRange** ép default per-Pod, một **default-deny NetworkPolicy** với allow tường minh, và PodSecurity (hoặc OPA/Kyverno) chặn Pod privileged và host mount. Dùng node pool riêng (taint/affinity) cho workload noisy hay nhạy cảm. Với upgrade: managed hoặc HA control plane, bước qua từng minor tôn trọng chính sách skew control-plane/kubelet, drain với PDB, giữ backup etcd, theo dõi deprecation guide.

:::muted
**Trade-off** — Soft multi-tenancy (cluster chung) tiết kiệm cost và đơn giản nhưng dùng chung kernel và control plane, nên một container escape hoặc noisy neighbor có thể vượt ranh giới — quota và NetworkPolicy giảm chứ không loại bỏ điều đó. Hard isolation (mỗi team một cluster, pool theo tenant, Kata/gVisor) mạnh hơn nhưng tốn hơn nhiều. Quota chặt ngăn starvation nhưng gây Pending Pod; quota rộng rãi mời gọi tranh chấp. Khớp tier isolation với threat model.
:::

:::muted
**Bẫy thường gặp** — Coi namespace là một ranh giới bảo mật mà nó không phải: không có NetworkPolicy và PodSecurity, một Pod có thể chạm Service của namespace khác và, nếu privileged, chạm node. Quên LimitRange để một team ship Pod không limit và OOM hàng xóm dù có quota. Về upgrade, các sát thủ là **nhảy minor version**, **drain không có PDB** (đưa workload nhạy-quorum xuống dưới tối thiểu), và việc gỡ deprecated-API phá manifest.
:::

*Đào sâu tiếp: tới điểm nào thì bạn ngừng thêm guardrail cho một cluster chung và tách một team ra cluster riêng của nó?*

**Từ khoá ăn điểm:** `namespace=đơn vị tenancy · RBAC RoleBinding · ResourceQuota/LimitRange · default-deny NetworkPolicy · PodSecurity/OPA · soft vs hard multi-tenancy · version skew · drain + PDB · backup etcd`
