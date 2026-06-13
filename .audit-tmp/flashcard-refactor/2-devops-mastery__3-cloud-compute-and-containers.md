# 2-devops-mastery / 3-cloud-compute-and-containers
Summary: kept 8, delete 0 of 8

## 0-card — middle — [Cloud, Compute]
**Question:** A service runs fine for hours on a cheap burstable instance, then mysteriously goes sluggish under sustained load even though CPU "isn't maxed." What's happening, and how do you choose an instance type properly?
**Verdict:** KEEP — diagnosis + design-decision question (CPU-credit throttling vs. saturation, then right-sizing) that scales with seniority.

### New answer (en)
**TL;DR** — The instance ran out of **CPU credits**: burstable families earn credits at a baseline rate and spend them to burst, so under sustained load the balance drains and the cloud throttles you back to baseline — the app crawls while the graph reads "not maxed" because you're capped, not saturated.

**How it works** — Burstable types (AWS `t`-family, GCP `e2`/shared-core, Azure `B`-series) don't grant a full vCPU continuously; they accumulate CPU credits when idle and burn them above baseline. Drain them and you're throttled to the baseline fraction (e.g. ~20% of a vCPU). Choosing properly means matching the **workload shape** to a **family**: burstable for spiky/idle-mostly, general-purpose (`m`/`n2`/`D`) for balanced, compute-optimized (`c`/`c2`/`F`) for CPU-bound, memory-optimized (`r`/`m2`/`E`) for caches/DBs — then right-size from real p95 CPU/memory/network metrics, not guesses.

:::muted
**Trade-off** — Burstable is genuinely cheaper for dev boxes, low-traffic services, and bursty APIs that idle between spikes. For steady production load it's a false economy: you either exhaust credits and throttle, or enable "unlimited" credit mode that quietly bills extra. Right-sizing is a continuous trade between paying for unused headroom and being one spike away from throttling or OOM.
:::

:::muted
**Common pitfall** — Classic "works in staging, dies in prod" because staging never sustained load long enough to drain credits. Memory is the silent killer: an undersized box doesn't throttle, it **OOM-kills** the process outright. Alarm on credit balance and memory pressure, not just average CPU.
:::

*Go deeper: how would you alarm on "about to be throttled" before the stall actually hits users?*

**Keywords:** `CPU credits · baseline rate · burstable t/e2/B · throttle · right-size · p95 · OOM`

### New answer (vi)
**Chốt** — Instance đã **cạn CPU credit**: họ burstable kiếm credit ở tốc độ baseline và tiêu chúng để burst, nên dưới tải kéo dài balance rút cạn rồi cloud throttle bạn về baseline — app bò trong khi đồ thị đọc "chưa max" vì bạn bị cap, không phải bão hòa.

**Cơ chế** — Các type burstable (AWS họ `t`, GCP `e2`/shared-core, Azure series `B`) không cấp một vCPU đầy đủ liên tục; chúng tích credit khi rảnh và đốt khi vượt baseline. Cạn credit là bị throttle về phần baseline (ví dụ ~20% một vCPU). Chọn cho đúng nghĩa là khớp **hình dạng workload** với một **họ**: burstable cho spiky/đa-phần-rảnh, general-purpose (`m`/`n2`/`D`) cho cân bằng, compute-optimized (`c`/`c2`/`F`) cho CPU-bound, memory-optimized (`r`/`m2`/`E`) cho cache/DB — rồi right-size từ metric p95 CPU/memory/network thật, không đoán.

:::muted
**Trade-off** — Burstable thực sự rẻ hơn cho máy dev, service traffic thấp, và API spiky ngồi rảnh giữa các đợt. Với tải production đều, đó là kinh tế giả: hoặc cạn credit và throttle, hoặc bật chế độ credit "unlimited" âm thầm tính thêm. Right-sizing là đánh đổi liên tục giữa trả cho dư địa ít dùng và cách một spike khỏi bị throttle hay OOM.
:::

:::muted
**Bẫy thường gặp** — Kinh điển "chạy được ở staging, chết ở prod" vì staging chưa bao giờ giữ tải đủ lâu để rút cạn credit. Memory là sát thủ thầm lặng: máy thiếu RAM không throttle, nó **OOM-kill** process thẳng tay. Alarm trên credit balance và memory pressure, không chỉ CPU trung bình.
:::

*Đào sâu tiếp: làm sao alarm "sắp bị throttle" trước khi cú đứng-hình thực sự chạm người dùng?*

**Từ khoá ăn điểm:** `CPU credits · baseline rate · burstable t/e2/B · throttle · right-size · p95 · OOM`

## 1-card — senior — [Cloud, Compute, Scalability]
**Question:** You set CPU-based autoscaling at 70%, but during a traffic spike the service still returns errors for a few minutes before new instances help. Why does autoscaling lag, and how would you make it respond in time?
**Verdict:** KEEP — open-ended senior design question on reactive-scaling latency, leading vs. lagging signals, and warm capacity.

### New answer (en)
**TL;DR** — Autoscaling is **reactive and has a pipeline of delays**, and CPU is a **lagging** signal — by the time it crosses 70% you're already saturated. Fix it by scaling on a **leading** signal (requests-per-target, queue depth, p95 latency), pre-warming capacity, and shrinking boot time so new nodes arrive before the spike hurts.

**How it works** — The delay chain: the metric is averaged over a window → the alarm needs N datapoints → the action launches an instance → OS + app boot → health checks pass → only then does it take traffic — easily minutes end to end. Remedies: scale on demand-proximate signals instead of CPU; **pre-warm** with a higher baseline or scheduled scaling ahead of known peaks; speed boot with **pre-baked images** and lightweight containers; use **target-tracking** for steady setpoint control and reserve **step scaling** for aggressive reactions to big jumps.

:::muted
**Trade-off** — Aggressive scaling (low threshold, big steps, short cooldown) protects latency but over-provisions and can **flap** — churning instances and cost. Conservative scaling saves money but risks the exact error window. Scaling **out** is the cloud-native default (needs stateless apps); scaling **up** is simpler for stateful workloads but hits a ceiling and usually needs a restart.
:::

:::muted
**Common pitfall** — Slow boot is the silent killer: if a node takes 4 minutes to be ready, no threshold saves you from a 1-minute spike — the fix is faster boot or pre-provisioned warm capacity, not a lower CPU target. And the database or downstream dependency often can't scale with you, so adding app instances just relocates the bottleneck.
:::

*Go deeper: with warm pools or provisioned concurrency, how do you size the warm buffer without paying for idle the rest of the day?*

**Keywords:** `lagging vs leading signal · target-tracking · step scaling · pre-warm · pre-baked AMI · flapping · cooldown · downstream bottleneck`

### New answer (vi)
**Chốt** — Autoscaling là **phản ứng và có một chuỗi độ trễ**, và CPU là tín hiệu **trễ pha (lagging)** — tới lúc nó vượt 70% bạn đã bão hòa. Sửa bằng cách scale theo tín hiệu **sớm (leading)** (requests-per-target, độ sâu queue, p95 latency), pre-warm capacity, và rút ngắn boot để node mới tới trước khi spike gây hại.

**Cơ chế** — Chuỗi độ trễ: metric trung bình hóa qua một cửa sổ → alarm cần N datapoint → action launch một instance → OS + app boot → health check pass → chỉ khi đó nó nhận traffic — dễ dàng vài phút từ đầu tới cuối. Cách sửa: scale theo tín hiệu gần-cầu thay vì CPU; **pre-warm** bằng baseline cao hơn hoặc scheduled scaling trước các đỉnh đã biết; tăng tốc boot bằng **image bake sẵn** và container nhẹ; dùng **target-tracking** giữ setpoint đều và để dành **step scaling** cho phản ứng quyết liệt với cú nhảy lớn.

:::muted
**Trade-off** — Scaling quyết liệt (ngưỡng thấp, bước lớn, cooldown ngắn) bảo vệ latency nhưng over-provision và có thể **flap** — xáo trộn instance và chi phí. Scaling thận trọng tiết kiệm nhưng mạo hiểm đúng cửa sổ lỗi. Scale **ra** là mặc định cloud-native (cần app stateless); scale **lên** đơn giản hơn cho workload có trạng thái nhưng có trần và thường cần restart.
:::

:::muted
**Bẫy thường gặp** — Boot chậm là sát thủ thầm lặng: nếu một node mất 4 phút để sẵn sàng, không ngưỡng nào cứu bạn khỏi một spike 1 phút — cách sửa là boot nhanh hơn hoặc warm capacity pre-provision, không phải CPU target thấp hơn. Và database hay dependency phía dưới thường không scale theo bạn, nên thêm app instance chỉ dời nút thắt xuống dưới.
:::

*Đào sâu tiếp: với warm pool hay provisioned concurrency, làm sao size buffer ấm mà không trả cho phần rảnh suốt phần còn lại của ngày?*

**Từ khoá ăn điểm:** `lagging vs leading signal · target-tracking · step scaling · pre-warm · pre-baked AMI · flapping · cooldown · downstream bottleneck`

## 2-card — middle — [Cloud, Compute, Cost]
**Question:** Spot/preemptible instances are 60–90% cheaper than on-demand. Why can't you just run everything on spot? Lay out when spot, on-demand, and reserved/committed pricing each make sense.
**Verdict:** KEEP — trade-off and design-decision question across three pricing models tied to interruption tolerance.

### New answer (en)
**TL;DR** — You can't run everything on spot because spot is **reclaimable spare capacity** (often ~2 minutes' warning), so it's only safe for interruptible, stateless, fault-tolerant work. The mature pattern **blends** all three: reserved for the steady floor, on-demand for normal variability, spot for the elastic interruption-tolerant top.

**How it works** — **Spot/preemptible** is spare capacity the cloud reclaims when it needs the hardware — fine for batch jobs, CI runners, stateless web tiers behind a load balancer, big-data workers that checkpoint and resume. **On-demand** is full price, no commitment, no interruption — right for unpredictable or short-lived workloads and as the safe baseline. **Reserved Instances / Savings Plans / committed-use** trade a 1–3 year commitment for ~30–70% off — right for steady, predictable baseline capacity you'll run continuously.

:::muted
**Trade-off** — Spot maximizes savings but you must engineer for interruption (graceful drain on the termination notice, spread across instance types/AZs, never irreplaceable state). Reserved maximizes discount but locks you in — over-commit and you pay for unused capacity; it's a bet on your future baseline. On-demand is the flexible, expensive middle. The blend is the answer, not any single mode.
:::

:::muted
**Common pitfall** — Running a **stateful DB or a leader on spot** invites data loss the moment it's reclaimed — the cardinal mistake. The opposite waste is paying **on-demand for a 24/7 baseline** that should be reserved (50%+ left on the table). Ignoring the spot **interruption signal** — not draining on the notice — turns a planned reclaim into dropped requests and corrupted in-flight work.
:::

*Go deeper: how would you architect a worker fleet to survive a whole spot capacity pool being reclaimed at once?*

**Keywords:** `spot/preemptible · 2-min termination notice · graceful drain · on-demand baseline · reserved / Savings Plan · committed-use · blend`

### New answer (vi)
**Chốt** — Bạn không thể chạy mọi thứ trên spot vì spot là **capacity dư có thể thu hồi** (thường cảnh báo ~2 phút), nên chỉ an toàn cho công việc ngắt được, stateless, chịu lỗi. Mẫu chín chắn **pha** cả ba: reserved cho sàn đều, on-demand cho biến động bình thường, spot cho phần đỉnh co giãn chịu-ngắt.

**Cơ chế** — **Spot/preemptible** là capacity dư cloud thu hồi khi cần phần cứng — ổn cho batch job, CI runner, tầng web stateless sau load balancer, worker big-data có thể checkpoint và tiếp tục. **On-demand** là giá đầy đủ, không cam kết, không bị ngắt — hợp cho workload khó đoán hoặc ngắn hạn và làm baseline an toàn. **Reserved Instance / Savings Plan / committed-use** đổi cam kết 1–3 năm lấy ~30–70% giảm — hợp cho capacity baseline đều, dự đoán được mà bạn chạy liên tục.

:::muted
**Trade-off** — Spot tối đa hóa tiết kiệm nhưng bạn phải thiết kế cho bị ngắt (drain duyên dáng khi có termination notice, trải qua nhiều instance type/AZ, không bao giờ đặt state không-thay-thế-được). Reserved tối đa hóa giảm giá nhưng khóa bạn — cam kết quá tay thì trả cho capacity không dùng; là ván cược vào baseline tương lai. On-demand là khoảng giữa linh hoạt, đắt. Sự pha trộn mới là câu trả lời, không phải một mode đơn lẻ.
:::

:::muted
**Bẫy thường gặp** — Chạy một **DB có trạng thái hay một leader trên spot** là cầu xin mất dữ liệu ngay khoảnh khắc nó bị thu hồi — sai lầm tối thượng. Lãng phí ngược lại là trả **on-demand cho baseline 24/7** đáng lẽ reserved (để 50%+ tiết kiệm trên bàn). Phớt lờ **tín hiệu ngắt** của spot — không drain khi có notice — biến một lần thu hồi có kế hoạch thành request rớt và việc đang xử lý bị hỏng.
:::

*Đào sâu tiếp: bạn sẽ kiến trúc một worker fleet thế nào để sống sót khi cả một spot capacity pool bị thu hồi cùng lúc?*

**Từ khoá ăn điểm:** `spot/preemptible · 2-min termination notice · graceful drain · on-demand baseline · reserved / Savings Plan · committed-use · blend`

## 3-card — senior — [Containers, Compute, Security]
**Question:** "A container is just a lightweight VM" — what's wrong with that statement? Explain what actually isolates a container, and why running untrusted multi-tenant workloads as plain containers is risky.
**Verdict:** KEEP — concept-correction + security-boundary reasoning that distinguishes junior from staff answers.

### New answer (en)
**TL;DR** — Wrong because a VM has its **own kernel** behind a hypervisor (a hard isolation boundary), while a container is just **processes on the host's shared kernel** fenced off by namespaces and cgroups. Sharing the kernel means a kernel bug or container escape reaches the host and every sibling — so plain containers are not a safe boundary for untrusted multi-tenant code.

**How it works** — A container's isolation is Linux primitives: **namespaces** (separate PID/network/mount/user views), **cgroups** (CPU/memory/IO limits), plus capabilities/seccomp/AppArmor restricting syscalls. That makes containers light, millisecond-fast (no OS boot), and dense, shipping app + deps as an image — but the shared kernel is the catch. For untrusted/multi-tenant code, add a real boundary: micro-VM runtimes (**Firecracker / Kata / gVisor**) or one tenant per VM.

:::muted
**Trade-off** — Containers win on density, startup speed, and dev ergonomics — the right default for your *own* trusted services. VMs win on isolation strength and running different kernels/OSes, at the cost of overhead and slower boot. Kata/gVisor/Firecracker buy VM-like isolation with container-like packaging, adding complexity and some performance cost. The decision hinges on trust.
:::

:::muted
**Common pitfall** — Treating a container as a sandbox for hostile code is the dangerous misconception — one shared-kernel exploit breaches every container on the node. Own-goals amplify it: running as **root inside the container**, mounting the **Docker socket** (instant host takeover), or `--privileged`. The "lightweight VM" framing also misleads ops into expecting per-container kernels and VM-grade isolation.
:::

*Go deeper: where does gVisor sit between a namespace container and a Firecracker micro-VM, and what does it trade for that?*

**Keywords:** `shared kernel · namespaces · cgroups · seccomp/AppArmor/capabilities · container escape · Firecracker/Kata/gVisor · root-in-container · Docker socket · --privileged`

### New answer (vi)
**Chốt** — Sai vì một VM có **kernel riêng** sau một hypervisor (ranh giới cô lập cứng), còn một container chỉ là **các process trên kernel dùng chung của host** được rào bằng namespace và cgroup. Dùng chung kernel nghĩa là một lỗ hổng kernel hay container escape tới được host và mọi container anh em — nên container thường không phải ranh giới an toàn cho code multi-tenant không tin cậy.

**Cơ chế** — Cô lập của container là các nguyên thủy Linux: **namespace** (góc nhìn PID/network/mount/user riêng), **cgroup** (giới hạn CPU/memory/IO), cộng capability/seccomp/AppArmor hạn chế syscall. Điều đó làm container nhẹ, nhanh mili-giây (không boot OS), và dày, ship app + dep như một image — nhưng kernel dùng chung là điểm gài. Với code không-tin-cậy/multi-tenant, thêm ranh giới thật: runtime micro-VM (**Firecracker / Kata / gVisor**) hoặc một tenant một VM.

:::muted
**Trade-off** — Container thắng về mật độ, tốc độ khởi động, và trải nghiệm developer — mặc định đúng cho service tin cậy *của chính bạn*. VM thắng về độ mạnh cô lập và chạy kernel/OS khác nhau, đổi lại overhead và boot chậm hơn. Kata/gVisor/Firecracker mua cô lập kiểu-VM với đóng gói kiểu-container, thêm độ phức tạp và một ít chi phí hiệu năng. Quyết định xoay quanh sự tin cậy.
:::

:::muted
**Bẫy thường gặp** — Coi một container như sandbox cho code thù địch là hiểu lầm nguy hiểm — một exploit kernel-dùng-chung phá vỡ mọi container trên node. Bàn-thua-tự-gây khuếch đại nó: chạy **root bên trong container**, mount **Docker socket** (chiếm host tức thì), hoặc `--privileged`. Khung "VM nhẹ" cũng đánh lừa ops mong kernel riêng từng container và cô lập cấp-VM.
:::

*Đào sâu tiếp: gVisor nằm ở đâu giữa một namespace container và một Firecracker micro-VM, và nó đánh đổi gì để có cô lập đó?*

**Từ khoá ăn điểm:** `shared kernel · namespaces · cgroups · seccomp/AppArmor/capabilities · container escape · Firecracker/Kata/gVisor · root-in-container · Docker socket · --privileged`

## 4-card — senior — [Kubernetes, Compute, Architecture]
**Question:** With managed Kubernetes (EKS / GKE / AKS / DOKS), what does the cloud run for you versus what you still own? And how do you answer a team that wants Kubernetes for a three-service app?
**Verdict:** KEEP — shared-responsibility reasoning plus an architecture judgment call (when k8s is overkill).

### New answer (en)
**TL;DR** — Managed Kubernetes splits at the **control plane / data plane** line: the provider runs and patches the control plane (API server, scheduler, controller-manager, etcd); **you** own the worker node pools and everything inside the cluster. For a three-service app, k8s is usually **overkill** — its power only pays off past a complexity threshold; a managed container service fits better.

**How it works** — The provider keeps the control plane HA and patched (Autopilot/Fargate go further and manage nodes too). You still own **node pools** (instance types, scaling, OS/kernel patching unless fully managed), plus workloads, network policy, ingress, RBAC, secrets, observability, and manifest/version upgrades. Kubernetes earns its keep with self-healing, declarative rollouts, bin-packing, and service discovery — value that appears with many services and teams, not three. A small app is better on ECS/Fargate, Cloud Run, App Runner, Azure Container Apps, DO App Platform, or a few autoscaled VMs.

:::muted
**Trade-off** — Kubernetes buys a portable, declarative platform with a huge ecosystem — worth it across many services and teams needing consistent deploy/scale. The cost is steep operational complexity: cluster upgrades, CNI, RBAC, a permanent learning curve and on-call surface. Simpler PaaS/runtimes deploy with near-zero ops but give up fine-grained control and some portability. Adopt k8s for the complexity you *have*, not the scale you imagine.
:::

:::muted
**Common pitfall** — Forgetting what "managed" does *not* cover: teams assume the provider patches everything and neglect **node OS patching, manifest security, RBAC, and cluster version upgrades** — then a stale node or over-permissive ServiceAccount becomes the incident. "Managed" means the control plane is handled, not that the cluster runs itself.
:::

*Go deeper: at what concrete signals (team count, service count, deploy cadence) would you actually flip a small shop onto Kubernetes?*

**Keywords:** `control plane / data plane · managed etcd · node pools · CNI · RBAC · Autopilot/Fargate · ECS/Cloud Run/App Runner · complexity threshold`

### New answer (vi)
**Chốt** — Managed Kubernetes chia ở lằn **control plane / data plane**: provider chạy và vá control plane (API server, scheduler, controller-manager, etcd); **bạn** sở hữu worker node pool và mọi thứ bên trong cluster. Với một app ba-service, k8s thường **quá đà** — sức mạnh của nó chỉ có lời sau một ngưỡng độ phức tạp; một managed container service hợp hơn.

**Cơ chế** — Provider giữ control plane HA và được vá (Autopilot/Fargate đi xa hơn, quản cả node). Bạn vẫn sở hữu **node pool** (instance type, scaling, vá OS/kernel trừ khi fully managed), cộng workload, network policy, ingress, RBAC, secret, observability, và nâng cấp manifest/version. Kubernetes đáng giá nhờ tự-chữa, rollout khai báo, bin-packing, và service discovery — giá trị xuất hiện với nhiều service và team, không phải ba. Một app nhỏ tốt hơn trên ECS/Fargate, Cloud Run, App Runner, Azure Container Apps, DO App Platform, hay vài VM autoscale.

:::muted
**Trade-off** — Kubernetes mua một nền tảng khai báo, portable với hệ sinh thái khổng lồ — đáng khi có nhiều service, nhiều team cần deploy/scale nhất quán. Cái giá là độ phức tạp vận hành dốc đứng: nâng cấp cluster, CNI, RBAC, đường cong học tập vĩnh viễn cùng bề mặt on-call. Các PaaS/runtime đơn giản hơn deploy với gần-như-không-ops nhưng từ bỏ kiểm soát chi tiết và một phần portability. Chọn k8s cho độ phức tạp bạn *thực sự có*, không phải quy mô bạn tưởng tượng.
:::

:::muted
**Bẫy thường gặp** — Quên cái "managed" *không* phủ: team tưởng provider vá mọi thứ và bỏ bê **vá OS node, bảo mật manifest, RBAC, và nâng cấp version cluster** — rồi một node cũ hay một ServiceAccount quá-quyền trở thành sự cố. "Managed" nghĩa là control plane được lo, không phải cluster tự chạy.
:::

*Đào sâu tiếp: ở những tín hiệu cụ thể nào (số team, số service, nhịp deploy) bạn mới thực sự chuyển một shop nhỏ lên Kubernetes?*

**Từ khoá ăn điểm:** `control plane / data plane · managed etcd · node pools · CNI · RBAC · Autopilot/Fargate · ECS/Cloud Run/App Runner · complexity threshold`

## 5-card — middle — [Containers, Docker, Performance]
**Question:** Your production image is 1.2 GB, builds are slow, and a tiny code change rebuilds everything from scratch. Explain image layers and caching, and how multi-stage builds and a minimal base fix both the size and the build time.
**Verdict:** KEEP — mechanism + diagnosis question (layer caching, instruction order, multi-stage) with real trade-offs.

### New answer (en)
**TL;DR** — An image is a stack of **cached layers**, one per instruction; a rebuild reuses layers until the first changed instruction, then rebuilds everything after — so a `COPY . .` early on busts the cache on every code change. Fix size and speed with **instruction order** (install deps before copying source) plus a **multi-stage build** into a **minimal runtime base**.

**How it works** — Order matters: copy dependency manifests and install deps *before* the source, so a code change only invalidates the cheap final layers, not the expensive `npm install`/`pip install`. For size, a **multi-stage build** uses a fat builder stage to compile/install, then `COPY`s only the artifact into a slim base (`alpine`, `distroless`, `scratch`), leaving compilers, dev headers, and build caches behind. Result: a small final image and fast, cache-friendly rebuilds.

:::muted
**Trade-off** — Smaller images pull faster (lower cold-start/autoscale latency), have a smaller attack surface, and cost less to store. The cost is friability: `distroless`/`scratch` have **no shell or package manager**, so `docker exec` debugging needs ephemeral debug containers; `alpine` uses **musl** libc, which can break glibc binaries or subtly change DNS/timezone behavior. Pick the smallest base your runtime and debugging workflow can tolerate.
:::

:::muted
**Common pitfall** — `COPY . .` early re-runs dependency installs every build; shipping the build toolchain in the runtime image bloats it and leaks compilers/secrets to prod. Also: `latest` base tags break reproducibility, a missing `.dockerignore` balloons the context with `node_modules`/`.git`, and a 1 GB image is "fine" until autoscaling must pull it onto 50 cold nodes mid-spike and the pull time *is* the outage.
:::

*Go deeper: how does BuildKit cache mounts (e.g. for `~/.npm`) change this picture versus plain layer caching?*

**Keywords:** `layer cache · instruction order · cache busting · multi-stage build · distroless/alpine/scratch · musl vs glibc · .dockerignore · latest tag`

### New answer (vi)
**Chốt** — Một image là một chồng **layer được cache**, một cái mỗi instruction; rebuild tái dùng layer tới instruction đầu tiên thay đổi, rồi rebuild mọi thứ sau đó — nên `COPY . .` sớm phá cache ở mọi thay đổi code. Sửa kích thước và tốc độ bằng **thứ tự instruction** (cài dep trước khi copy source) cộng một **multi-stage build** vào một **runtime base tối thiểu**.

**Cơ chế** — Thứ tự quan trọng: copy file manifest dependency và cài dep *trước* source, để một thay đổi code chỉ vô hiệu các layer cuối rẻ tiền, không phải `npm install`/`pip install` đắt đỏ. Về kích thước, một **multi-stage build** dùng một stage builder mập để compile/cài, rồi `COPY` chỉ artifact vào một base mảnh (`alpine`, `distroless`, `scratch`), bỏ lại compiler, dev header, và build cache. Kết quả: một final image nhỏ và rebuild nhanh, thân-thiện-cache.

:::muted
**Trade-off** — Image nhỏ hơn pull nhanh hơn (latency cold-start/autoscale thấp hơn), bề mặt tấn công nhỏ hơn, và tốn ít hơn để lưu. Cái giá là tính dễ vỡ: `distroless`/`scratch` **không có shell hay package manager**, nên debug bằng `docker exec` cần ephemeral debug container; `alpine` dùng libc **musl**, vốn có thể vỡ binary glibc hay đổi hành vi DNS/timezone tinh vi. Chọn base nhỏ nhất mà runtime và quy trình debug của bạn chịu được.
:::

:::muted
**Bẫy thường gặp** — `COPY . .` sớm chạy lại cài dependency mỗi lần build; ship cả build toolchain trong runtime image làm nó phình và rò compiler/secret lên prod. Ngoài ra: tag base `latest` phá tái lập, thiếu `.dockerignore` thổi phồng context với `node_modules`/`.git`, và một image 1 GB là "ổn" cho tới khi autoscaling phải pull nó về 50 node lạnh giữa spike và thời gian pull *chính là* outage.
:::

*Đào sâu tiếp: BuildKit cache mount (ví dụ cho `~/.npm`) thay đổi bức tranh này thế nào so với layer cache thường?*

**Từ khoá ăn điểm:** `layer cache · instruction order · cache busting · multi-stage build · distroless/alpine/scratch · musl vs glibc · .dockerignore · latest tag`

## 6-card — staff — [Serverless, Compute, Architecture]
**Question:** A team wants to move their entire API to serverless functions "to never manage servers again." Explain cold starts and the statelessness constraint, and give them a decision framework for serverless vs containers vs VMs.
**Verdict:** KEEP — staff-level architecture judgment with a decision framework, cost reasoning, and a sharp failure mode (connection exhaustion).

### New answer (en)
**TL;DR** — Don't move the *whole* API to serverless. FaaS runs **ephemeral, event-triggered, stateless** instances, so you inherit **cold starts** (init latency on a fresh instance) and a statelessness constraint (no durable local state). Serverless suits spiky/event-driven edges; steady request/response cores belong on containers; legacy/stateful/special-hardware on VMs.

**How it works** — A **cold start** is the latency to initialize a new instance (download code, boot runtime, run init) before it serves — ms to seconds by runtime and package size; warm instances are reused but you can't depend on them. **Stateless** means sessions, files, and connections must live in external stores. Framework: **serverless** for spiky/bursty/event-driven traffic where per-request billing and zero-idle-cost win (webhooks, cron, async, glue); **containers** for steady services needing control, long-lived connections, or consistent latency; **VMs** for legacy/stateful/special-hardware.

:::muted
**Trade-off** — Serverless removes server management, scales to zero, and scales out automatically — unbeatable for sporadic load. But at **steady high volume** per-invocation pricing often costs more than a reserved container/VM, cold starts hurt latency-critical paths, time/memory caps and statelessness constrain design, and you trade ops for **vendor lock-in**. The mature answer is a blend: serverless at the bursty edges, containers/VMs for the steady core.
:::

:::muted
**Common pitfall** — The connection trap is acute: thousands of concurrent function instances each opening a DB connection **exhaust the connection pool** — you need a proxy/pooler (RDS Proxy, PgBouncer). A high-traffic synchronous API also fights cold-start tail latency and burns money versus a cheap always-on container, and deep platform coupling (proprietary triggers/runtimes/IAM) makes leaving expensive.
:::

*Go deeper: which of provisioned concurrency, a connection pooler, or re-platforming to containers would you reach for first, and why?*

**Keywords:** `cold start · stateless · per-invocation billing · scale to zero · connection pool exhaustion · proxy/pooler · vendor lock-in · blend`

### New answer (vi)
**Chốt** — Đừng chuyển *cả* API sang serverless. FaaS chạy các instance **tạm thời, kích-bởi-sự-kiện, stateless**, nên bạn thừa hưởng **cold start** (latency init trên instance mới) và ràng buộc statelessness (không state cục bộ bền vững). Serverless hợp các rìa spiky/event-driven; lõi request/response đều thuộc về container; legacy/stateful/phần-cứng-đặc-biệt trên VM.

**Cơ chế** — Một **cold start** là độ trễ để khởi tạo một instance mới (tải code, boot runtime, chạy init) trước khi nó phục vụ — ms tới giây tùy runtime và kích thước package; instance ấm được tái dùng nhưng bạn không thể dựa vào. **Stateless** nghĩa là session, file, và connection phải sống trong kho ngoài. Khung: **serverless** cho traffic spiky/bùng-nổ/event-driven nơi tính-phí-per-request và zero-idle-cost thắng (webhook, cron, async, glue); **container** cho service đều cần kiểm soát, connection sống-lâu, hay latency nhất quán; **VM** cho legacy/stateful/phần-cứng-đặc-biệt.

:::muted
**Trade-off** — Serverless loại bỏ quản server, scale về zero, và scale ra tự động — vô địch cho tải thưa thớt. Nhưng ở **volume cao đều**, giá per-invocation thường tốn nhiều hơn một container/VM reserved, cold start hại các path nhạy-latency, giới hạn thời-gian/memory và statelessness bó hẹp thiết kế, và bạn đổi ops lấy **vendor lock-in**. Câu trả lời chín chắn là một sự pha trộn: serverless ở các rìa bùng-nổ, container/VM cho lõi đều.
:::

:::muted
**Bẫy thường gặp** — Bẫy connection rất gắt: hàng nghìn instance function đồng thời, mỗi cái mở một DB connection, **làm cạn connection pool** — bạn cần một proxy/pooler (RDS Proxy, PgBouncer). Một API đồng bộ traffic cao cũng đánh nhau với tail latency cold-start và đốt tiền so với một container always-on rẻ, và ghép-cặp sâu với nền tảng (trigger/runtime/IAM độc quyền) làm việc rời đi đắt đỏ.
:::

*Đào sâu tiếp: trong provisioned concurrency, một connection pooler, hay re-platform sang container, bạn chọn cái nào trước và vì sao?*

**Từ khoá ăn điểm:** `cold start · stateless · per-invocation billing · scale to zero · connection pool exhaustion · proxy/pooler · vendor lock-in · blend`

## 7-card — senior — [Compute, Deployment, Architecture]
**Question:** What does "immutable infrastructure" mean, and why is it better than SSH-ing in to patch a running server? Compare rolling, blue/green, and canary deployments — when do you pick each?
**Verdict:** KEEP — concept + comparative design question across three deploy strategies tied to risk and statefulness.

### New answer (en)
**TL;DR** — **Immutable infrastructure** means you never modify a running server — you build a **new image** with the change baked in and **replace** the old instances, so there's no SSH-and-patch and no configuration drift. On top of it: **rolling** for low-risk stateless services, **blue/green** for high-stakes cutovers with instant rollback, **canary** for high-risk or high-traffic changes.

**How it works** — Replacing instead of patching makes every environment reproducible from the image, kills **configuration drift**, makes rollback a redeploy of the previous image, and launches identical scaled nodes. Strategies: **rolling** replaces in batches (no extra fleet, but mixed versions briefly and slow rollback); **blue/green** stands up a full parallel environment and cuts over at once (instant rollback by switching back, ~2× cost during the swap); **canary** sends a small traffic % to the new version, watches metrics, then ramps (minimal blast radius, but needs good metrics and routing control).

:::muted
**Trade-off** — Rolling is resource-efficient but rollback means rolling *back* (slow) with mixed versions in the window. Blue/green gives the fastest, safest rollback and a clean cutover at the price of double capacity briefly, and needs care with shared stateful resources. Canary minimizes blast radius for risky changes but demands solid observability, automated analysis, and traffic-splitting infra. Match strategy to **risk and statefulness**.
:::

:::muted
**Common pitfall** — Blue/green with a **shared database** doesn't isolate the risky part — a bad migration breaks both colors. Canary with **no real metrics or too-short bake time** just exposes a fraction of users to the bug without catching it. Rolling without health-checked readiness and connection draining drops in-flight requests on every batch. The deploy strategy is only as safe as the health checks and rollback path behind it.
:::

*Go deeper: a backward-incompatible schema migration has to ship with blue/green — how do you sequence it so both colors stay healthy?*

**Keywords:** `immutable infra · configuration drift · golden image/AMI · rolling · blue/green · canary · blast radius · connection draining · expand-contract migration`

### New answer (vi)
**Chốt** — **Immutable infrastructure** nghĩa là bạn không bao giờ sửa một server đang chạy — bạn build một **image mới** với thay đổi bake sẵn và **thay thế** các instance cũ, nên không SSH-và-vá và không configuration drift. Bên trên nó: **rolling** cho service stateless rủi-ro-thấp, **blue/green** cho cutover quan trọng với rollback tức thì, **canary** cho thay đổi rủi-ro-cao hay traffic-cao.

**Cơ chế** — Thay thế thay vì vá làm mọi môi trường tái lập được từ image, diệt **configuration drift**, biến rollback thành redeploy image trước, và launch các node scale giống hệt. Chiến lược: **rolling** thay theo lô (không cần fleet thừa, nhưng lẫn version trong chốc lát và rollback chậm); **blue/green** dựng một môi trường song song đầy đủ và cắt sang một lúc (rollback tức thì bằng cách chuyển lại, ~2× chi phí trong lúc swap); **canary** gửi một % nhỏ traffic sang version mới, theo dõi metric, rồi tăng dần (blast radius tối thiểu, nhưng cần metric tốt và kiểm soát routing).

:::muted
**Trade-off** — Rolling tiết kiệm tài nguyên nhưng rollback nghĩa là roll *ngược* (chậm) với lẫn version trong cửa sổ. Blue/green cho rollback nhanh nhất, an toàn nhất và một cutover sạch với cái giá gấp đôi capacity trong chốc lát, và cần cẩn thận với resource có trạng thái dùng chung. Canary giảm thiểu blast radius cho thay đổi rủi ro nhưng đòi hỏi observability vững, phân tích tự động, và hạ tầng chia traffic. Khớp chiến lược với **rủi ro và tính-có-trạng-thái**.
:::

:::muted
**Bẫy thường gặp** — Blue/green với một **database dùng chung** không cô lập phần rủi ro — một migration tệ vỡ cả hai màu. Canary **không metric thật hay bake time quá ngắn** chỉ phơi một phần người dùng cho bug mà không bắt được. Rolling không có readiness health-check và connection draining rớt request đang xử lý ở mỗi lô. Chiến lược deploy chỉ an toàn bằng health check và đường rollback phía sau nó.
:::

*Đào sâu tiếp: một schema migration không-tương-thích-ngược phải ship với blue/green — bạn sắp xếp thứ tự thế nào để cả hai màu vẫn khỏe?*

**Từ khoá ăn điểm:** `immutable infra · configuration drift · golden image/AMI · rolling · blue/green · canary · blast radius · connection draining · expand-contract migration`
