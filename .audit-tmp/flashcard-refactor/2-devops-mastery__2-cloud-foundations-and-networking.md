# 2-devops-mastery / 2-cloud-foundations-and-networking
Summary: kept 8, delete 0 of 8

## 0-card — middle — [Cloud, Networking]
**Question:** What actually makes a subnet "public" vs "private" in a VPC? A private database instance needs to download OS updates from the internet but must not be reachable from it — how do you make that work?
**Verdict:** KEEP — genuine design question; "public" is routing not a checkbox, plus the NAT-vs-endpoint outbound-only design decision invites real follow-up.

### New answer (en)
**TL;DR** — A subnet is "public" *only* because its route table has a route to an Internet Gateway (IGW) — there's no checkbox, it's the routing. To let a private DB reach out for updates without being reachable inbound, route its outbound `0.0.0.0/0` through a NAT Gateway in a public subnet: NAT permits outbound-initiated connections and their replies, but blocks anything initiated from outside.

**How it works** — A public subnet has an IGW route and instances with public IPs; a private subnet has no IGW route, so nothing inside is directly reachable from the internet. The NAT Gateway lives in a public subnet and source-translates outbound traffic, so replies find their way back while unsolicited inbound has no path in. (AWS NAT Gateway; GCP Cloud NAT; Azure NAT Gateway; DigitalOcean exposes a simpler VPC public/private model.)

:::muted
**Trade-off** — NAT Gateways are managed and HA but cost per hour *and* per GB processed — a chatty fleet pulling large images runs up real bills. VPC endpoints / Private Link reach cloud services (S3, registries) without traversing NAT or the internet at all; a self-managed NAT instance is cheaper but becomes your SPOF to patch and scale.
:::

:::muted
**Common pitfall** — Putting a DB in a public subnet "because it needed updates" exposes it to the internet — a top breach cause. The mirror mistake: a private instance with no NAT and no endpoint silently fails every outbound call with confusing timeouts. And a single NAT Gateway in one AZ is a hidden SPOF — put one NAT per AZ for true HA.
:::

*Go deeper — when would you choose a VPC endpoint over a NAT Gateway, and which services support which endpoint type?*

**Keywords** — `route table · Internet Gateway · NAT Gateway · 0.0.0.0/0 · VPC endpoint / Private Link · outbound-initiated`

### New answer (vi)
**Chốt** — Một subnet là "public" *chỉ vì* route table của nó có route tới một Internet Gateway (IGW) — không có ô tick nào, chính là routing. Để DB private vươn ra ngoài lấy update mà không bị tiếp cận inbound, route lưu lượng outbound `0.0.0.0/0` của nó qua một NAT Gateway nằm trong public subnet: NAT cho phép kết nối khởi tạo-từ-trong-ra cùng các phản hồi, nhưng chặn mọi thứ khởi tạo từ ngoài vào.

**Cơ chế** — Public subnet có route IGW và instance có public IP; private subnet không có route IGW, nên không gì bên trong tiếp cận trực tiếp được từ internet. NAT Gateway nằm trong public subnet và source-translate lưu lượng outbound, nên phản hồi tìm được đường về còn inbound không-mời thì không có lối vào. (AWS NAT Gateway; GCP Cloud NAT; Azure NAT Gateway; DigitalOcean phơi mô hình VPC public/private đơn giản hơn.)

:::muted
**Trade-off** — NAT Gateway là managed và HA nhưng tốn theo giờ *và* theo GB xử lý — một fleet nói nhiều kéo image lớn sẽ đội hóa đơn thật. VPC endpoint / Private Link tới các cloud service (S3, registry) mà không đi qua NAT hay internet chút nào; một NAT instance tự quản rẻ hơn nhưng trở thành SPOF của bạn phải vá và scale.
:::

:::muted
**Bẫy thường gặp** — Đặt DB vào public subnet "vì nó cần update" phơi nó ra internet — một nguyên nhân rò rỉ hàng đầu. Lỗi đối xứng: instance private không NAT không endpoint sẽ lặng lẽ fail mọi lệnh outbound với timeout khó hiểu. Và một NAT Gateway đơn lẻ ở một AZ là SPOF ẩn — đặt một NAT mỗi AZ để HA thật.
:::

*Đào sâu tiếp — khi nào bạn chọn VPC endpoint thay vì NAT Gateway, và service nào hỗ trợ loại endpoint nào?*

**Từ khoá ăn điểm** — `route table · Internet Gateway · NAT Gateway · 0.0.0.0/0 · VPC endpoint / Private Link · outbound-initiated`

## 1-card — senior — [Cloud, Networking, Architecture]
**Question:** Explain the difference between a region and an availability zone. If you deploy across 3 AZs in one region, what failures survive and what failures still take you down? When is multi-region actually worth it?
**Verdict:** KEEP — senior failure-domain reasoning with a real blast-radius vs cost/complexity trade-off; scales clearly with seniority.

### New answer (en)
**TL;DR** — A region is a geographic area (`us-east-1`); an AZ is one or more physically isolated datacenters within it, independent power/cooling/network but linked at low latency. 3-AZ deployment survives a single-datacenter failure but *not* a region-wide outage or a bad global config/deploy. Multi-region is worth it only when your SLA can't tolerate losing a whole region, you need data residency, or global latency demands it.

**How it works** — Spreading across 3 AZs lets load balancers and quorum stores keep serving from the surviving two when one datacenter burns/loses power/floods. What it doesn't cover: a regional control-plane or API outage, a metro-wide disaster, or a global misconfig — none of which respect AZ boundaries. Multi-AZ is the default because it handles the overwhelmingly common failure modes at a fraction of the complexity.

:::muted
**Trade-off** — Multi-AZ is nearly free architecturally (sub-ms latency, sync-friendly replication) and should be standard for production. Multi-region buys region survival but explodes complexity: replication lag, conflict resolution, global DNS failover, ~2x cost. Active-passive is cheaper but has failover time/risk; active-active maximizes availability but demands conflict-free data design. Match spend to the blast radius you must survive.
:::

:::muted
**Common pitfall** — "We're HA" while everything sits in one AZ is the classic illusion — one AZ outage drops it all despite redundant instances. Subtler: spreading across AZs but parking a stateful singleton (primary DB, leader, NAT) in one AZ, so its failure still causes an outage. And cross-AZ traffic isn't free — chatty cross-AZ services rack up transfer charges.
:::

*Go deeper — for a 3-AZ multi-AZ database, how does the failover work and what's the actual RTO during an AZ loss?*

**Keywords** — `region · availability zone · quorum · blast radius · active-active vs active-passive · RTO/RPO · cross-AZ transfer`

### New answer (vi)
**Chốt** — Một region là một khu vực địa lý (`us-east-1`); một AZ là một hoặc nhiều datacenter cô lập vật lý trong đó, điện/làm mát/mạng độc lập nhưng liên kết latency thấp. Deploy qua 3 AZ sống sót qua lỗi single-datacenter nhưng *không* qua một outage toàn-region hay một config/deploy toàn cục tệ. Multi-region chỉ đáng khi SLA không chịu nổi mất cả một region, bạn cần data residency, hoặc latency toàn cầu đòi hỏi.

**Cơ chế** — Trải qua 3 AZ cho phép load balancer và kho dựa-quorum tiếp tục phục vụ từ hai cái còn lại khi một datacenter cháy/mất điện/ngập. Cái nó không phủ: một outage control-plane hay API cấp vùng, một thảm họa toàn khu đô thị, hay một misconfig toàn cục — không cái nào tôn trọng ranh giới AZ. Multi-AZ là mặc định vì nó xử lý phần lớn các kiểu lỗi phổ biến với một phần nhỏ độ phức tạp.

:::muted
**Trade-off** — Multi-AZ gần như miễn phí về kiến trúc (latency dưới mili-giây, replication thân thiện đồng bộ) và nên là chuẩn cho production. Multi-region mua được sống sót cả region nhưng làm bùng nổ độ phức tạp: replication lag, giải quyết xung đột, DNS failover toàn cục, chi phí ~gấp đôi. Active-passive rẻ hơn nhưng có thời gian/rủi ro failover; active-active tối đa availability nhưng đòi thiết kế dữ liệu không-xung-đột. Khớp chi tiêu với blast radius bạn phải sống sót.
:::

:::muted
**Bẫy thường gặp** — "Chúng tôi HA" trong khi mọi thứ ở một AZ là ảo tưởng kinh điển — một AZ outage quật cả hệ thống dù instance dư thừa. Tinh vi hơn: trải qua các AZ nhưng đậu một singleton có trạng thái (primary DB, leader, NAT) ở một AZ, nên lỗi của nó vẫn gây outage. Và lưu lượng xuyên-AZ không miễn phí — service nói nhiều xuyên-AZ đội phí transfer.
:::

*Đào sâu tiếp — với một database multi-AZ 3 AZ, failover hoạt động ra sao và RTO thực tế khi mất một AZ là bao nhiêu?*

**Từ khoá ăn điểm** — `region · availability zone · quorum · blast radius · active-active vs active-passive · RTO/RPO · cross-AZ transfer`

## 2-card — middle — [Cloud, Security, Networking]
**Question:** A security group allows inbound port 443 but no outbound rules, yet HTTPS responses still flow back to clients fine. With a network ACL configured the same way, the responses get dropped. Explain why.
**Verdict:** KEEP — diagnosis question rooted in the stateful-vs-stateless distinction and the ephemeral-port return path; exactly the kind of "why" an interviewer probes.

### New answer (en)
**TL;DR** — Security groups are stateful: an allowed inbound request has its return traffic auto-permitted regardless of outbound rules, so 443 replies "just work." Network ACLs are stateless: each packet is judged independently, so you must *also* explicitly allow the return path — outbound on the client's ephemeral port range (e.g. 1024–65535). Configure a NACL like a stateful SG and the response packets match no allow rule and get dropped.

**How it works** — An SG tracks the connection and remembers that the reply belongs to an allowed flow. A NACL has no memory, so the reply — which leaves the service but is addressed to the client's high-numbered ephemeral source port — needs its own explicit outbound allow. SGs attach to instances/ENIs (Azure NSG and GCP firewall rules are analogues); NACLs attach to subnets as a coarser stateless second layer.

:::muted
**Trade-off** — Stateful SGs are easier to reason about and the right default — you state intent ("allow 443 in") and the return path is handled. Stateless NACLs are more work and error-prone, but operate at the subnet boundary and can explicitly DENY (SGs are allow-only), useful as a blunt guardrail like blackholing a malicious CIDR for a whole subnet.
:::

:::muted
**Common pitfall** — The ephemeral-port gotcha is the #1 NACL bug: allow the inbound and outbound *service* ports, forget that replies are addressed to the client's high ephemeral port, and connections half-open and time out mysteriously. The other trap is using NACLs for fine-grained app rules — stateless eval plus numeric ordering makes complex NACLs unmaintainable fast.
:::

*Go deeper — how would you decide what to enforce at the NACL layer vs the SG layer in a defense-in-depth design?*

**Keywords** — `stateful vs stateless · security group · network ACL · ephemeral port range · return path · explicit DENY`

### New answer (vi)
**Chốt** — Security group là stateful: một request inbound được cho phép thì lưu lượng trả về được tự động cho qua bất kể rule outbound, nên phản hồi 443 "chạy luôn." Network ACL là stateless: mỗi gói được xử độc lập, nên bạn phải *cũng* cho phép tường minh đường về — outbound trên dải ephemeral port của client (ví dụ 1024–65535). Cấu hình NACL như một SG stateful thì gói phản hồi không trúng rule allow nào và bị drop.

**Cơ chế** — SG theo dõi kết nối và nhớ rằng phản hồi thuộc một flow đã được cho phép. NACL không nhớ gì, nên phản hồi — vốn rời service nhưng được địa chỉ tới source port ephemeral số cao của client — cần rule outbound allow tường minh riêng. SG gắn vào instance/ENI (NSG của Azure và firewall rule của GCP là tương đương); NACL gắn vào subnet như lớp thứ hai thô hơn, stateless.

:::muted
**Trade-off** — SG stateful dễ suy luận hơn và là mặc định đúng — bạn nêu ý định ("cho 443 vào") và đường về được xử lý. NACL stateless tốn công và dễ sai hơn, nhưng hoạt động ở ranh giới subnet và có thể DENY tường minh (SG chỉ allow), hữu ích như lan can thô như blackhole một CIDR độc hại cho cả subnet.
:::

:::muted
**Bẫy thường gặp** — Cú ephemeral-port là bug NACL số một: cho phép inbound và outbound *service* port, quên rằng phản hồi được địa chỉ tới ephemeral port cao của client, nên kết nối nửa-mở và timeout bí ẩn. Bẫy còn lại là dùng NACL cho rule app chi tiết — đánh giá stateless cộng thứ tự theo số khiến NACL phức tạp không bảo trì nổi nhanh chóng.
:::

*Đào sâu tiếp — bạn quyết định thực thi gì ở tầng NACL vs tầng SG trong một thiết kế phòng-thủ-theo-chiều-sâu như thế nào?*

**Từ khoá ăn điểm** — `stateful vs stateless · security group · network ACL · ephemeral port range · return path · explicit DENY`

## 3-card — senior — [Cloud, Networking, Architecture]
**Question:** You front your private instances with a managed load balancer. What's the difference between a Layer 4 and a Layer 7 load balancer, and why does the load balancer's health check decide whether a deploy causes an outage?
**Verdict:** KEEP — combines L4/L7 design distinction with the operational why behind safe rolling deploys; strong senior depth and natural follow-ups.

### New answer (en)
**TL;DR** — An L4 LB routes on TCP/UDP (IP + port) — fast, protocol-agnostic, blind to the request; an L7 LB understands HTTP, so it routes by path/host/header, terminates TLS, retries, and does sticky sessions. The health check decides deploy safety because the LB only sends traffic to targets that pass it — a new instance gets requests *after* it reports healthy, and a draining one stops receiving *before* it's killed.

**How it works** — The LB is your public entry point: it sits in the public subnet with the public IP and forwards to instances in private subnets, so app servers never face the internet. During a rolling deploy, the health check is the gate that sequences traffic shifts: pass → receive, fail/draining → no traffic. Examples: L4 = AWS NLB / GCP TCP-UDP LB / Azure LB; L7 = AWS ALB / GCP HTTPS LB / Azure Application Gateway.

:::muted
**Trade-off** — L4 is cheaper and lower-latency at millions of connections but can't do path/header routing or HTTP-aware retries — that complexity moves into the app. L7 gives rich routing and offloads TLS/retries but costs more and parses every request. A shallow health check (TCP / `GET /`) is cheap but can call a broken app "healthy"; a deep check (`/healthz` pinging the DB) catches real failures but risks cascading when the DB blips and every instance fails at once.
:::

:::muted
**Common pitfall** — A misconfigured health check is a top deploy-outage cause: too strict or pointed at a 404 path and the LB marks every fresh instance unhealthy, serving 5xx with no backends. Too shallow and it keeps routing to instances that accept TCP but can't serve. And forgetting connection draining (deregistration delay) cuts in-flight requests the instant an instance is removed — the graceful-shutdown problem surfacing at the LB.
:::

*Go deeper — how do you set health-check thresholds and deregistration delay so a rolling deploy is zero-downtime but a genuinely broken instance is still pulled fast?*

**Keywords** — `Layer 4 vs Layer 7 · health check · target group · connection draining / deregistration delay · TLS termination · rolling deploy`

### New answer (vi)
**Chốt** — Một LB L4 route theo TCP/UDP (IP + port) — nhanh, trung lập protocol, mù với request; một LB L7 hiểu HTTP, nên route theo path/host/header, terminate TLS, retry, và sticky session. Health check quyết định độ an toàn của deploy vì LB chỉ gửi traffic tới target qua được nó — instance mới nhận request *sau khi* báo healthy, và cái đang drain ngừng nhận *trước khi* bị kill.

**Cơ chế** — LB là điểm vào public của bạn: nó nằm trong public subnet với public IP và forward tới instance trong private subnet, nên app server không bao giờ đối mặt internet. Trong rolling deploy, health check là cổng sắp xếp các đợt dịch chuyển traffic: pass → nhận, fail/drain → không traffic. Ví dụ: L4 = AWS NLB / GCP TCP-UDP LB / Azure LB; L7 = AWS ALB / GCP HTTPS LB / Azure Application Gateway.

:::muted
**Trade-off** — L4 rẻ hơn và latency thấp hơn ở hàng triệu kết nối nhưng không làm path/header routing hay retry HTTP-aware — độ phức tạp đó dồn vào app. L7 cho routing phong phú và gánh hộ TLS/retry nhưng tốn hơn và parse mọi request. Health check nông (TCP / `GET /`) rẻ nhưng có thể gọi app hỏng là "healthy"; check sâu (`/healthz` ping DB) bắt lỗi thật nhưng nguy cơ lan truyền khi DB chớp và mọi instance fail cùng lúc.
:::

:::muted
**Bẫy thường gặp** — Health check sai cấu hình là nguyên nhân hàng đầu của deploy-outage: quá khắt khe hoặc trỏ vào path 404 thì LB đánh dấu mọi instance mới unhealthy, phục vụ 5xx không backend. Quá nông thì vẫn route tới instance chấp nhận TCP nhưng không phục vụ được. Và quên connection draining (deregistration delay) cắt các request đang xử lý ngay khi instance bị gỡ — vấn đề graceful-shutdown hiện ra ở tầng LB.
:::

*Đào sâu tiếp — bạn đặt ngưỡng health-check và deregistration delay sao cho rolling deploy zero-downtime mà instance hỏng thật vẫn bị gỡ nhanh?*

**Từ khoá ăn điểm** — `Layer 4 vs Layer 7 · health check · target group · connection draining / deregistration delay · TLS termination · rolling deploy`

## 4-card — senior — [Cloud, Networking, DNS]
**Question:** You point `app.example.com` at a load balancer and need DNS-based failover to a backup region. Why can't you use a plain CNAME at the zone apex, what does TTL control during an incident, and where does DNS failover fall short?
**Verdict:** KEEP — three layered sub-questions (apex CNAME limitation, TTL during incident, DNS failover limits) demanding real DNS reasoning; clearly senior.

### New answer (en)
**TL;DR** — The DNS spec forbids a CNAME at the zone apex (`example.com` itself) because the apex must coexist with SOA/NS records — so you use the provider's ALIAS/ANAME record to point an apex at a load balancer hostname. TTL controls how long resolvers cache an answer, so during failover clients keep hitting the old (dead) region until TTL expires. And DNS failover is best-effort — misbehaving resolvers ignore TTLs — so it's never instant or guaranteed.

**How it works** — An A record maps a name to an IP; a CNAME aliases a name to another name. ALIAS records (Route 53 Alias, Cloud DNS, Azure) resolve the LB hostname to its IPs at query time, for free, even at the apex. A 300 s TTL means up to 5 minutes of clients still using the cached answer after you flip the record, so providers layer on health-checked failover routing that automatically serves the healthy target.

:::muted
**Trade-off** — Low TTLs (30–60 s) make failover fast but multiply query volume and lean harder on your DNS provider's uptime; high TTLs cache well and cut cost but make any change slow to propagate. ALIAS solves the apex problem and tracks LB IP changes automatically, but is provider-specific (not portable like a CNAME). Pragmatic setup: ALIAS at the apex, modest TTLs on flip-able records, health-check-driven failover.
:::

:::muted
**Common pitfall** — Teams set a 24-hour TTL, then during an outage find failover won't take effect for hours because the world cached the old IP — TTL is a decision you make *before* the incident. And because resolvers/clients ignore TTLs and cache stale answers, DNS alone can't give true fast failover — pair it with an anycast global LB or network-layer health-checked routing where you control timing.
:::

*Go deeper — how would you combine an anycast global load balancer with DNS so failover doesn't depend on every resolver honoring your TTL?*

**Keywords** — `zone apex · CNAME vs ALIAS/ANAME · A record · TTL · health-checked failover routing · anycast · best-effort`

### New answer (vi)
**Chốt** — Spec DNS cấm CNAME ở zone apex (`example.com` chính nó) vì apex phải cùng tồn tại với record SOA/NS — nên bạn dùng record ALIAS/ANAME của provider để trỏ apex vào hostname của load balancer. TTL kiểm soát resolver cache một câu trả lời bao lâu, nên khi failover client vẫn đập vào region cũ (đã chết) cho tới khi TTL hết hạn. Và DNS failover là best-effort — các resolver cư xử sai phớt lờ TTL — nên không bao giờ tức thì hay bảo đảm.

**Cơ chế** — Record A ánh xạ một tên tới một IP; CNAME alias một tên tới một tên khác. Record ALIAS (Route 53 Alias, Cloud DNS, Azure) resolve hostname của LB ra các IP lúc query, miễn phí, ngay cả ở apex. TTL 300 giây nghĩa là tới 5 phút client vẫn dùng câu trả lời đã cache sau khi bạn lật record, nên provider thêm health-checked failover routing tự động phục vụ target khỏe mạnh.

:::muted
**Trade-off** — TTL thấp (30–60 giây) làm failover nhanh nhưng nhân lượng query và dựa nặng hơn vào uptime của DNS provider; TTL cao cache tốt và cắt chi phí nhưng làm mọi thay đổi chậm lan truyền. ALIAS giải quyết bài toán apex và tự theo IP đổi của LB, nhưng đặc-thù-provider (không portable như CNAME). Thiết lập thực dụng: ALIAS ở apex, TTL vừa phải trên record có thể cần lật, failover dựa-health-check.
:::

:::muted
**Bẫy thường gặp** — Team đặt TTL 24 giờ, rồi trong outage phát hiện failover không hiệu lực trong nhiều giờ vì cả thế giới đã cache IP cũ — TTL là quyết định bạn làm *trước* sự cố. Và vì resolver/client phớt lờ TTL và cache câu trả lời cũ, riêng DNS không cho failover nhanh thật — ghép nó với một global LB anycast hoặc health-checked routing ở tầng mạng nơi bạn kiểm soát thời gian.
:::

*Đào sâu tiếp — bạn kết hợp một global load balancer anycast với DNS ra sao để failover không phụ thuộc vào mỗi resolver tôn trọng TTL của bạn?*

**Từ khoá ăn điểm** — `zone apex · CNAME vs ALIAS/ANAME · A record · TTL · health-checked failover routing · anycast · best-effort`

## 5-card — middle — [Cloud, Networking]
**Question:** You're assigning a CIDR block to a new VPC. Why does picking `10.0.0.0/16` vs `10.0.0.0/24` matter, and why is reusing `10.0.0.0/16` in two VPCs you'll later need to connect a serious mistake?
**Verdict:** KEEP — sizing trade-off plus the irreversible overlapping-CIDR design mistake; real judgment, not trivia.

### New answer (en)
**TL;DR** — The `/N` sets your VPC's total address budget — `/16` gives ~65k addresses, `/24` only 256 — so pick too small and you run out of room for subnets/services, too large and you waste private space. Reusing `10.0.0.0/16` in two VPCs is serious because overlapping CIDRs **cannot be peered, VPN-ed, or routed to each other** — the router can't tell which `10.0.1.5` you mean, and re-IPing a live VPC to fix it is brutal.

**How it works** — In CIDR, `/N` fixes how many leading bits are the network part; the rest are host addresses. The VPC block is the budget you carve into subnets — a `/16` split into `/24`s yields 256 subnets of ~254 usable hosts each (the cloud reserves a few per subnet). The cardinal rule is to plan non-overlapping ranges across all VPCs/environments up front, before you ever need to connect them.

:::muted
**Trade-off** — A generous `/16` per VPC leaves room to grow and slice per-AZ subnets cleanly, but burns private IP space fast across many VPCs/accounts — you can exhaust RFC 1918 at scale. Tighter blocks conserve space but constrain future subnetting and may force a painful re-IP. The discipline is an IPAM plan: distinct, non-overlapping super-blocks per environment/region/account from day one.
:::

:::muted
**Common pitfall** — Overlapping CIDRs is the mistake you can't undo cheaply — the day you peer dev and prod, connect a partner, or merge after an acquisition, identical ranges make it impossible without re-IPing or NAT gymnastics. Sizing too small also bites: cloud-reserved addresses plus a load balancer plus autoscaling can exhaust a `/28`, and `Insufficient IP addresses` blocks scaling at the worst time.
:::

*Go deeper — how would you structure an IPAM allocation scheme across multiple accounts and regions so you never hit overlap or exhaustion?*

**Keywords** — `CIDR /N · address budget · subnet carving · overlapping CIDR · RFC 1918 · IPAM · re-IP`

### New answer (vi)
**Chốt** — Cái `/N` đặt ngân sách địa chỉ tổng của VPC — `/16` cho ~65k địa chỉ, `/24` chỉ 256 — nên chọn quá nhỏ thì hết chỗ cho subnet/service, quá lớn thì lãng phí không gian private. Tái dùng `10.0.0.0/16` ở hai VPC là nghiêm trọng vì CIDR chồng lấn **không thể peer, VPN, hay route tới nhau** — router không phân biệt được bạn nói tới `10.0.1.5` nào, và re-IP một VPC đang sống để sửa là tàn khốc.

**Cơ chế** — Trong CIDR, `/N` cố định bao nhiêu bit đầu là phần network; phần còn lại là địa chỉ host. Block của VPC là ngân sách bạn xẻ thành subnet — một `/16` chia thành các `/24` cho 256 subnet, mỗi cái ~254 host dùng được (cloud giữ vài cái mỗi subnet). Quy tắc tối thượng là quy hoạch các dải không-chồng-lấn cho mọi VPC/môi trường ngay từ đầu, trước khi bạn cần kết nối chúng.

:::muted
**Trade-off** — Một `/16` rộng rãi mỗi VPC chừa chỗ để lớn và cắt subnet theo AZ gọn gàng, nhưng đốt không gian IP private nhanh khi có nhiều VPC/account — bạn có thể cạn RFC 1918 ở quy mô lớn. Block chặt hơn tiết kiệm không gian nhưng bó hẹp chia subnet tương lai và có thể buộc một cú re-IP đau. Kỷ luật là một kế hoạch IPAM: super-block riêng biệt, không-chồng-lấn cho mỗi môi trường/region/account từ ngày đầu.
:::

:::muted
**Bẫy thường gặp** — CIDR chồng lấn là sai lầm không thể hoàn tác rẻ — cái ngày bạn peer dev và prod, kết nối đối tác, hay sáp nhập sau thương vụ, các dải giống hệt khiến nó bất khả thi nếu không re-IP hay NAT vòng vo. Chia subnet quá nhỏ cũng cắn: địa chỉ cloud-giữ cộng một load balancer cộng autoscaling có thể làm cạn một `/28`, và `Insufficient IP addresses` chặn scaling vào lúc tệ nhất.
:::

*Đào sâu tiếp — bạn cấu trúc một sơ đồ cấp phát IPAM xuyên nhiều account và region ra sao để không bao giờ đụng overlap hay cạn kiệt?*

**Từ khoá ăn điểm** — `CIDR /N · address budget · subnet carving · overlapping CIDR · RFC 1918 · IPAM · re-IP`

## 6-card — staff — [Cloud, Networking, Architecture]
**Question:** You have a dozen VPCs across accounts plus an on-prem datacenter, and they all need to talk. Compare VPC peering, a transit gateway/hub, site-to-site VPN, and private endpoints — when does each fit?
**Verdict:** KEEP — staff-level connectivity-topology comparison with scaling math (mesh N²/2), transitivity, and on-prem vs service-access nuances; rich follow-ups.

### New answer (en)
**TL;DR** — VPC peering is a direct 1:1 link — simple and cheap but non-transitive, so a full mesh of N VPCs needs N²/2 peerings and doesn't scale. A transit gateway/hub turns that mesh into hub-and-spoke with transitive routing. Site-to-site VPN connects cloud to on-prem over IPsec across the internet. Private Link/endpoints are different in kind — they expose a *single service* privately, not whole-network routing.

**How it works** — Peering connects two VPCs directly; A↔B and B↔C does *not* give A↔C. A transit gateway (AWS Transit Gateway, Azure Virtual WAN, GCP NCC) is a central router every VPC attaches to once, giving one place to manage routes. VPN rides the public internet (encrypted, cheap, bandwidth/latency-limited); for heavy/sensitive links you upgrade to a dedicated connection (Direct Connect / ExpressRoute / Cloud Interconnect). Private Link consumes a SaaS/managed service without internet exposure or CIDR coordination.

:::muted
**Trade-off** — Peering: lowest cost/latency, zero extra hops, but non-transitivity and mesh explosion limit it to a few VPCs. Transit gateway: scales to hundreds and centralizes routing/segmentation, but adds per-attachment + per-GB cost and a central component to secure. VPN is quick and cheap but rides variable public internet; dedicated circuits are fast/consistent but expensive and slow to provision. Private Link avoids CIDR/peering concerns but gives no general reachability.
:::

:::muted
**Common pitfall** — Assuming peering is transitive is the classic trap — A↔B and B↔C, then hours wondering why A can't reach C. Overlapping CIDRs block peering/VPN entirely, surfacing only when you try to connect. With a transit gateway, routing must be configured on *both* the gateway and each VPC's route tables, or attachments are connected-but-silent. And VPN to on-prem without tight route/firewall scoping can make the whole corporate network reachable from a compromised cloud workload.
:::

*Go deeper — at what number of VPCs (and what segmentation needs) do you migrate from peering to a transit gateway, and how do you handle shared services across spokes?*

**Keywords** — `VPC peering (non-transitive) · transit gateway / hub-and-spoke · site-to-site VPN / IPsec · Direct Connect / ExpressRoute · Private Link · overlapping CIDR`

### New answer (vi)
**Chốt** — VPC peering là một liên kết 1:1 trực tiếp — đơn giản và rẻ nhưng không bắc cầu, nên một mesh đầy đủ N VPC cần N²/2 peering và không scale. Một transit gateway/hub biến mesh đó thành hub-and-spoke với routing bắc cầu. Site-to-site VPN kết nối cloud tới on-prem qua IPsec trên internet. Private Link/endpoint khác về bản chất — chúng phơi *một service đơn lẻ* một cách private, không phải routing toàn-mạng.

**Cơ chế** — Peering kết nối hai VPC trực tiếp; A↔B và B↔C *không* cho A↔C. Một transit gateway (AWS Transit Gateway, Azure Virtual WAN, GCP NCC) là một router trung tâm mỗi VPC attach vào một lần, cho một nơi để quản lý route. VPN cưỡi internet công cộng (mã hóa, rẻ, giới hạn băng thông/latency); với link nặng/nhạy cảm bạn nâng lên kết nối chuyên dụng (Direct Connect / ExpressRoute / Cloud Interconnect). Private Link dùng một SaaS/managed service mà không phơi internet hay phải phối hợp CIDR.

:::muted
**Trade-off** — Peering: chi phí/latency thấp nhất, không hop thừa, nhưng không-bắc-cầu và bùng nổ mesh giới hạn nó ở vài VPC. Transit gateway: scale tới hàng trăm và tập trung hóa routing/phân đoạn, nhưng thêm chi phí per-attachment + per-GB và một component trung tâm phải bảo vệ. VPN nhanh và rẻ nhưng cưỡi internet công cộng biến động; mạch chuyên dụng nhanh/ổn định nhưng đắt và chậm provision. Private Link tránh lo CIDR/peering nhưng không cho tiếp cận mạng tổng quát.
:::

:::muted
**Bẫy thường gặp** — Tưởng peering bắc cầu là bẫy kinh điển — A↔B và B↔C, rồi mất hàng giờ tự hỏi vì sao A không tới được C. CIDR chồng lấn chặn hẳn peering/VPN, chỉ lộ ra khi bạn thử kết nối. Với một transit gateway, routing phải được cấu hình trên *cả* gateway lẫn route table của từng VPC, không thì attachment kết-nối-mà-câm. Và VPN tới on-prem mà không khoanh route/firewall chặt có thể khiến cả mạng doanh nghiệp reachable từ một cloud workload bị xâm nhập.
:::

*Đào sâu tiếp — ở số lượng VPC nào (và nhu cầu phân đoạn nào) bạn chuyển từ peering sang transit gateway, và bạn xử lý shared service xuyên các spoke ra sao?*

**Từ khoá ăn điểm** — `VPC peering (non-transitive) · transit gateway / hub-and-spoke · site-to-site VPN / IPsec · Direct Connect / ExpressRoute · Private Link · overlapping CIDR`

## 7-card — senior — [Cloud, Networking, Cost]
**Question:** A finance team flags a surprise five-figure "data transfer" line on the cloud bill. Explain the cloud egress cost model, and name the architecture decisions that quietly drive that number up.
**Verdict:** KEEP — cost-model diagnosis tying architecture choices to a real bill; demands tracing invisible drivers, strong senior FinOps reasoning.

### New answer (en)
**TL;DR** — The near-universal model is **ingress free, egress paid**: data into the cloud is free, data leaving to the internet is billed per GB, and internal movement is tiered — same-AZ usually free, cross-AZ and cross-region charged, with NAT Gateway adding a per-GB processing fee on top. The bill is driven by internet egress to users, chatty cross-AZ services, cross-region replication, and traffic funneled through NAT.

**How it works** — Trace the number with cost-explorer breakdowns by service/AZ and VPC flow logs. The usual culprits: (1) internet egress to users (a CDN fronts/reduces this), (2) services spread across AZs replicating or calling each other, (3) cross-region replication, and (4) everything pulled through NAT — big container images, OS packages — paying both NAT processing *and* egress.

:::muted
**Trade-off** — Spreading across AZs buys availability but costs cross-AZ transfer; co-locating chatty components in one AZ saves money but concentrates failure — dollars against resilience. A CDN cuts internet egress dramatically for cacheable content (often at cheaper rates) but adds a layer and cost. VPC endpoints / Private Link keep service traffic off NAT and the internet, saving both fees — at per-endpoint charges that only pay off above some volume.
:::

:::muted
**Common pitfall** — The classic bill-shock sources are invisible on the diagram: a logging/metrics pipeline shipping terabytes cross-region, microservices gossiping across AZs, or a multi-AZ DB replicating heavily — all "working fine," all metering egress. Pulling large images through NAT on every autoscale event is another silent drain (use a registry endpoint or cache). And serving static assets straight from object storage with no CDN bills full egress on every byte.
:::

*Go deeper — how would you instrument and attribute egress cost per team/service so the next surprise gets caught before it hits the bill?*

**Keywords** — `ingress free / egress paid · cross-AZ & cross-region transfer · NAT processing fee · CDN · VPC endpoint / Private Link · VPC flow logs`

### New answer (vi)
**Chốt** — Mô hình gần-như-phổ-quát là **ingress miễn phí, egress trả tiền**: dữ liệu vào cloud miễn phí, dữ liệu rời ra internet bị tính theo GB, và di chuyển nội bộ có bậc — cùng-AZ thường miễn phí, xuyên-AZ và xuyên-region bị tính phí, với NAT Gateway thêm một phí xử lý per-GB lên trên. Hóa đơn bị đẩy bởi egress internet tới người dùng, các service nói nhiều xuyên-AZ, replication xuyên-region, và traffic dồn qua NAT.

**Cơ chế** — Truy con số bằng cost-explorer chia theo service/AZ và VPC flow log. Các thủ phạm quen thuộc: (1) egress internet tới người dùng (một CDN che/giảm cái này), (2) các service trải qua các AZ replicate hay gọi nhau, (3) replication xuyên-region, và (4) mọi thứ kéo qua NAT — image container lớn, OS package — trả cả phí xử lý NAT *lẫn* egress.

:::muted
**Trade-off** — Trải qua các AZ mua được availability nhưng tốn transfer xuyên-AZ; gom component nói nhiều vào một AZ tiết kiệm tiền nhưng tập trung lỗi — đô-la đổi khả năng phục hồi. Một CDN cắt mạnh egress internet cho nội dung cache được (thường rate rẻ hơn) nhưng thêm một lớp và chi phí. VPC endpoint / Private Link giữ traffic service ngoài NAT và internet, tiết kiệm cả hai phí — đổi lại phí per-endpoint chỉ có lời trên một ngưỡng volume.
:::

:::muted
**Bẫy thường gặp** — Các nguồn shock-hóa-đơn kinh điển vô hình trên sơ đồ: một pipeline logging/metrics đẩy hàng terabyte xuyên-region, các microservice tán gẫu qua các AZ, hay một database multi-AZ replicate nặng — tất cả "chạy ổn," tất cả đang đo egress. Kéo image lớn qua NAT ở mỗi sự kiện autoscale là một cú rò âm thầm khác (dùng registry endpoint hoặc cache). Và phục vụ asset tĩnh thẳng từ object storage không CDN tính full egress trên mỗi byte.
:::

*Đào sâu tiếp — bạn đo và quy trách nhiệm chi phí egress theo team/service ra sao để cú bất ngờ tiếp theo bị bắt trước khi lên hóa đơn?*

**Từ khoá ăn điểm** — `ingress free / egress paid · cross-AZ & cross-region transfer · NAT processing fee · CDN · VPC endpoint / Private Link · VPC flow logs`
