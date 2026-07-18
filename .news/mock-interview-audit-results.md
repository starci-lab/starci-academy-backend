# Mock-interview audit — kết quả mẫu

Đã audit **209 câu** (coherent 209/209). Mỗi câu: checklist atomic (Sonnet gen→review→enhance) + 5 mức trả lời chấm bởi Sonnet & Haiku. Dưới là **12 câu mẫu** — full ở `.artifacts/interview-audit/results/batch_*.json`.

## idx 0 · theory · devops-mastery — 8 checkpoint · enhance 1 vòng · coherent=True

**Câu hỏi:** On DigitalOcean, what does "choosing a Droplet flavor" actually mean? Explain what the `size` slug prefixes (`s-`, `g-`, `c-`, `m-`, `so-`/`gd-`) mean, and explain clearly why picking a flavor is not "just pick the biggest one".

**Checklist:**

| # | Checkpoint |
|---|---|
| 1 | Choosing a flavor on DigitalOcean means changing a single argument, `size` — the slug itself already encodes the full spec, and there is no "custom machine type" concept for freely picking CPU/RAM like on GCP; DO only offers fixed presets. |
| 2 | The `s-` prefix denotes Basic shared-CPU. |
| 3 | The `g-` prefix denotes General-Purpose, with a balanced vCPU:RAM ratio (~1 vCPU : 4 GB), the default choice when the workload is unclear. |
| 4 | The `c-` prefix denotes CPU-Optimized, with dedicated vCPU and a 1 vCPU : 2 GB ratio, meant for CPU-heavy workloads. |
| 5 | The `m-` prefix denotes Memory-Optimized, with a 1 vCPU : 8 GB ratio, meant for RAM-hungry workloads. |
| 6 | The `so-`/`gd-` prefix denotes Storage-Optimized, with large-capacity NVMe storage. |
| 7 | Picking the wrong flavor doesn't break anything functionally — it just wastes real money, since the CPU:RAM ratio it locks you into may not match the workload's actual bottleneck. |
| 8 | Matching principle, illustrated by a concrete case: a single-threaded Node.js event-loop backend is CPU-bound, so `g-4vcpu-8gb` General-Purpose wastes money paying for 8 GB RAM while using only ~1 GB — the right pick is `c-2`/`c-4` CPU-Optimized for dedicated vCPU; generally, CPU-bound workloads (Node.js, build server, video encoding) → CPU-Optimized, memory-bound (Redis, OLTP Postgres, JVM heap) → Memory-Optimized, disk-heavy (ClickHouse, Elasticsearch, data lake) → Storage-Optimized, balanced/unclear workload → General-Purpose. |

**5 mức trả lời — điểm Sonnet / Haiku:**

| Mức | Câu trả lời | Sonnet | Haiku |
|---|---|---|---|
| L1 | So on DigitalOcean, a 'flavor' is basically the `size` slug you pass in — there's no custom CPU/RAM picker like GCP has, DO only gives you f… | 100% | 100% |
| L2 | Choosing a flavor on DO means picking the `size` slug — it's a fixed preset that encodes the whole spec, not something you dial in CPU and R… | 25% | 50% |
| L3 | I think choosing a flavor on DigitalOcean is about the size you select for the droplet, like how much CPU and RAM it has. The prefixes are t… | 0% | 25% |
| L4 | Um, I think the flavor is just like the size of the server you pick, small, medium, large kind of thing. The letters probably stand for diff… | 0% | 13% |
| L5 | DigitalOcean droplets, I think that's their cloud VM product, kind of like AWS EC2. Flavor might mean the OS image you choose, like Ubuntu o… | 0% | 0% |

---

## idx 1 · theory · devops-mastery — 6 checkpoint · enhance 1 vòng · coherent=True

**Câu hỏi:** On DigitalOcean Spaces, is a bucket's ACL always the same as an object's ACL inside it? Explain Spaces' ACL mechanism (how many values, which levels it applies at) and give an example where a bucket is private but an object inside it is still publicly readable.

**Checklist:**

| # | Checkpoint |
|---|---|
| 1 | Bucket ACL and object ACL are two independent levels with no automatic inheritance/sync between them — whether something on Spaces is public is decided by the combination of both layers together, not a single master switch controlling everything inside the bucket. |
| 2 | Spaces supports exactly two canned ACL values, `private` and `public-read`, a narrower set than S3 offers (no `authenticated-read`, no `aws-exec-read`, no canonical-id grantees). |
| 3 | The bucket itself carries its own ACL, set when the bucket is created (`digitalocean_spaces_bucket`), defaulting to `private`. |
| 4 | Each object also carries its own separate ACL, set at PUT time (`digitalocean_spaces_bucket_object`), also defaulting to `private` if unspecified. |
| 5 | When a bucket's ACL is `private` (e.g. bucket `assets`), it blocks public listing/reading of the bucket's contents by default. |
| 6 | An object explicitly uploaded with `acl = "public-read"` (e.g. `logo.png`) remains directly readable via its own URL (`bucket_domain_name/logo.png`) even though the parent bucket is private — the object's own ACL overrides for that object specifically, independent of the bucket's ACL. |

**5 mức trả lời — điểm Sonnet / Haiku:**

| Mức | Câu trả lời | Sonnet | Haiku |
|---|---|---|---|
| L1 | Không ạ, ACL của bucket và ACL của object là hai lớp hoàn toàn độc lập, không tự động giống nhau. Spaces chỉ hỗ trợ đúng 2 canned ACL thôi l… | 100% | 100% |
| L2 | Không, hai cái đó độc lập với nhau, bucket set ACL riêng còn object set ACL riêng. Spaces chỉ có 2 loại ACL là private với public-read thôi,… | 83% | 83% |
| L3 | Ừm em nghĩ là không giống nhau hoàn toàn, tại vì bucket có ACL riêng và object cũng có ACL riêng của nó. Spaces hình như chỉ có private với … | 33% | 33% |
| L4 | Chắc là ACL bucket với object nó khác nhau á, không nhất thiết phải giống. Với lại nếu bucket private thì có thể vẫn có cái gì đó public đượ… | 17% | 0% |
| L5 | Dạ Spaces ACL là để phân quyền IAM cho user truy cập bucket đúng không ạ, giống như policy JSON quy định ai được đọc ghi. Em nghĩ bucket với… | 0% | 0% |

---

## idx 2 · theory · devops-mastery — 5 checkpoint · enhance 1 vòng · coherent=True

**Câu hỏi:** On GCP, granting a service account permissions is NOT "attaching a policy to an identity" the way you're used to on AWS IAM. Explain what GCP's actual model is, and why saying "a member's effective permission is the union of every binding at every level" matters.

**Checklist:**

| # | Checkpoint |
|---|---|
| 1 | GCP không cho "attach một policy vào identity" theo kiểu AWS IAM; chiều gắn ngược nhau giữa hai nền tảng: AWS gắn policy VÀO identity (permission đi theo user/role khi di chuyển), còn GCP gắn role và member VÀO resource — permission "sống" ở phía resource chứ không phải phía identity. |
| 2 | Model thật của GCP: IAM policy của một resource (project/folder/organization) là một danh sách các binding, mỗi binding là cặp (role, một hoặc nhiều member). |
| 3 | Policy được kế thừa xuôi theo cấp bậc: organization → folder → project → resource. |
| 4 | Effective permission thật sự của một member là UNION của mọi binding áp dụng cho nó ở MỌI cấp, không chỉ binding tại cấp đang xem. |
| 5 | Hệ quả thực tế: để biết chính xác một service account có thể làm gì, không thể chỉ đọc IAM policy của project — phải kiểm tra cả folder và organization phía trên, vì một binding ở cấp cao hơn có thể âm thầm cấp thêm quyền mà người review chỉ nhìn ở project sẽ không thấy. |

**5 mức trả lời — điểm Sonnet / Haiku:**

| Mức | Câu trả lời | Sonnet | Haiku |
|---|---|---|---|
| L1 | Dạ, khác với AWS IAM là mình gắn policy trực tiếp vào identity, kiểu user hay role tự mang theo quyền của nó đi khắp nơi, thì GCP làm ngược … | 100% | 100% |
| L2 | Dạ theo em thì GCP không gắn policy vào identity như AWS IAM đâu ạ, mà gắn vào resource. Mỗi project, folder, org sẽ có một policy gồm nhiều… | 100% | 100% |
| L3 | Dạ, em nhớ bên GCP thì IAM nó hoạt động qua binding, tức là một role gắn với một danh sách member, chứ không giống AWS là attach policy thẳn… | 40% | 40% |
| L4 | Dạ, GCP với AWS thì IAM nó hơi khác nhau một chút ạ, kiểu GCP có project với folder gì đó phân cấp. Em nghĩ là cách cấp quyền cho service ac… | 0% | 0% |
| L5 | Dạ, service account trên GCP thì mình cần tạo key JSON rồi download về máy để xác thực đúng không ạ? Em nghĩ về bảo mật thì nên xoay key thư… | 0% | 0% |

---

## idx 3 · scenario · devops-mastery — 7 checkpoint · enhance 1 vòng · coherent=True

**Câu hỏi:** You just SSH'd for the first time into an Ubuntu server running nginx that you've never touched. Your boss says: the nginx config is wrong somewhere, and the error log is ballooning. You are NOT allowed to use `find` or `locate` to scan the whole disk (the server is under heavy load). Walk me through how you'd navigate to the right config directory and log directory using only your knowledge of ho

**Checklist:**

| # | Checkpoint |
|---|---|
| 1 | Reasons from the Filesystem Hierarchy Standard (FHS) — a standard every Debian package follows — instead of scanning the whole disk with find/locate, grounding confidence in that reproducibility. |
| 2 | Knows system config lives under /etc, so nginx config is at /etc/nginx/, with the main file nginx.conf and sites under conf.d/ and sites-enabled/. |
| 3 | Knows runtime/log data lives under /var, so nginx logs are at /var/log/nginx/access.log and error.log. |
| 4 | Verifies via the package manager: dpkg -L nginx / grep -E 'etc/log' lists every installed nginx file and where it went. |
| 5 | Verifies via the running process: nginx -T dumps the config actually in use along with each file's path. |
| 6 | Confirms the service's binary path: systemctl cat nginx shows the ExecStart path. |
| 7 | Confirms nginx is actually listening: ss -tlnp shows it bound to a port. |

**5 mức trả lời — điểm Sonnet / Haiku:**

| Mức | Câu trả lời | Sonnet | Haiku |
|---|---|---|---|
| L1 | Em không quét đĩa, em dựa vào Filesystem Hierarchy Standard: config hệ thống luôn nằm ở /etc, nên nginx config chắc chắn ở /etc/nginx, file … | 86% | 86% |
| L2 | Em nghĩ theo chuẩn FHS thôi, config hệ thống thì nằm ở /etc nên nginx sẽ có thư mục /etc/nginx, trong đó có nginx.conf và mấy site config tr… | 14% | 57% |
| L3 | Dạ nginx thường thì config nó nằm ở /etc/nginx, em nhớ kiểu vậy vì hồi trước có config nginx rồi. Log thì chắc trong /var/log/nginx, error.l… | 14% | 29% |
| L4 | Em nghĩ nginx nó có mấy file config đâu đó trong hệ thống, chắc kiểu trong thư mục etc. Log thì chắc cũng có chỗ lưu, em sẽ tìm xem file nào… | 0% | 0% |
| L5 | Ơ nhưng mình được SSH vào rồi mà, chắc em cứ chạy find / -name nginx.conf cho nhanh thôi ạ, ra cái nào thì sửa cái đó. Còn log thì chắc là m… | 0% | 0% |

---

## idx 4 · theory · devops-mastery — 7 checkpoint · enhance 1 vòng · coherent=True

**Câu hỏi:** You just moved from AWS to working on Azure infrastructure. A colleague asks: "Why do we always have to create this Resource Group first, then put the VM, network, and disk inside it — isn't it just a folder for tidiness?" Explain what a Resource Group actually is on Azure, why it's mandatory, and how it differs from how AWS organizes resources.

**Checklist:**

| # | Checkpoint |
|---|---|
| 1 | A Resource Group is not a decorative folder — it is Azure's mandatory lifecycle and scope boundary that every resource (VM, network, disk, etc.) must belong to via `resource_group_name`, pointing at exactly one RG; a resource cannot be created without one. |
| 2 | Deleting the Resource Group deletes every child resource inside it, making cleanup safe with a single `az group delete` instead of manually deleting each resource and risking an orphaned resource that quietly keeps billing. |
| 3 | The Resource Group is where RBAC role assignment, resource locks, and cost views attach, making it the natural isolation unit for one environment (dev/staging/prod) or one workload. |
| 4 | The biggest difference from AWS is that AWS has no mandatory Resource-Group-equivalent layer — resources are grouped only by tags or split across accounts via Organizations, with no hard lifecycle boundary enforced. |
| 5 | GCP's project serves as its isolation boundary, but it sits at a different level in the hierarchy — above Azure's Resource Group. |
| 6 | Azure's full resource hierarchy is Management Group → Subscription → Resource Group → Resource. |
| 7 | RBAC role assignments inherit down this hierarchy — a role granted at a higher scope (Management Group or Subscription) automatically applies to the Resource Groups and individual resources beneath it. |

**5 mức trả lời — điểm Sonnet / Haiku:**

| Mức | Câu trả lời | Sonnet | Haiku |
|---|---|---|---|
| L1 | Resource Group không phải là cái thư mục cho gọn đâu ạ, nó là ranh giới vòng đời và scope bắt buộc của Azure — mọi resource như VM, network,… | 100% | 100% |
| L2 | Dạ Resource Group là ranh giới bắt buộc chứ không đơn thuần là thư mục sắp xếp, mọi resource tạo ra đều phải gắn vào đúng một RG, không có R… | 43% | 57% |
| L3 | Em nghĩ Resource Group thì đúng là hơn cái folder một chút, nó bắt buộc phải có trước khi tạo VM hay network gì đó, kiểu resource nào cũng p… | 0% | 43% |
| L4 | Dạ theo em biết thì Resource Group là chỗ để chứa các resource lại cho có tổ chức, đỡ bị lộn xộn thôi ạ. Với lại em nhớ là xóa Resource Grou… | 0% | 0% |
| L5 | À cái này thì em nghĩ Resource Group chắc giống như một cái tag hay label để đặt tên cho dễ tìm thôi ạ, kiểu mình đặt tên project vào đó cho… | 0% | 0% |

---

## idx 5 · theory · devops-mastery — 7 checkpoint · enhance 2 vòng · coherent=True

**Câu hỏi:** Your team needs to store three kinds of data on Azure Blob Storage: (1) product images read constantly by a website, (2) last month's logs — occasionally looked up, (3) quarterly database backups — legally required to be kept for 3 years but almost never read again. Explain Azure Blob's three access tiers and which one fits each type of data.

**Checklist:**

| # | Checkpoint |
|---|---|
| 1 | Core trade-off: all three tiers (Hot/Cool/Archive) sit on one axis balancing storage cost against access cost — the less frequently data is accessed, the lower the tier it should move to, saving on storage at the cost of paying more when it is occasionally read. |
| 2 | Hot tier has the highest storage cost but the lowest access cost, making it the right fit for the product images since the website reads them constantly and cheap reads matter more than cheap storage. |
| 3 | Cool tier is cheaper than Hot to store but pricier to read — fitting last month's logs, which are only occasionally looked up and don't need Hot-level read speed. |
| 4 | Cool tier carries a minimum storage duration (an early-deletion/tier-change penalty) — a structural cost distinct from the base storage/read price difference. |
| 5 | Archive tier is the cheapest to store, but the data sits offline and requires rehydration (a wait of hours) to read — a perfect fit for the legally-required 3-year quarterly backups that are almost never read again, since long-term storage cost dominates any concern about read speed. |
| 6 | Archive tier only accepts newly-written block blobs — a structural write-path constraint distinct from the storage/access cost trade-off, and a natural fit for write-once backup data. |
| 7 | Tiering can be set as a default at the storage-account level (overridable per individual blob), or automated entirely via a lifecycle-management policy that ages blobs down through the tiers over time. |

**5 mức trả lời — điểm Sonnet / Haiku:**

| Mức | Câu trả lời | Sonnet | Haiku |
|---|---|---|---|
| L1 | Dạ, Azure Blob có ba access tier là Hot, Cool và Archive, và về bản chất chúng nằm trên cùng một trục đánh đổi giữa chi phí lưu trữ và chi p… | 100% | 100% |
| L2 | Ba tier chính là Hot, Cool, Archive, khác nhau chủ yếu ở việc đánh đổi giữa giá lưu trữ và giá truy cập. Ảnh sản phẩm đọc liên tục thì dùng … | 43% | 57% |
| L3 | Thì Azure Blob có mấy loại tier để tối ưu chi phí, kiểu Hot là cho dữ liệu hay dùng, Cool là ít dùng hơn, còn Archive là lưu lâu dài rẻ nhất… | 0% | 14% |
| L4 | Em nhớ Azure Blob có tier Hot với Cool gì đó, Hot là nhanh hơn Cool là rẻ hơn. Ảnh sản phẩm chắc để Hot vì cần nhanh. Còn log với backup thì… | 0% | 14% |
| L5 | Dạ về lưu trữ trên Azure thì em nghĩ nên dùng replication kiểu LRS hay GRS để đảm bảo dữ liệu không bị mất, với lại nên bật versioning để ph… | 0% | 0% |

---

## idx 6 · theory · devops-mastery — 6 checkpoint · enhance 1 vòng · coherent=True

**Câu hỏi:** Your company needs to store 100 TB of logs, with a compliance-mandated 7-year retention, but the data is almost never read after the first 90 days (except during an audit). A coworker suggests: "Just store it all in one Standard bucket, keep it simple." How do you push back, and how would you design the storage classes?

**Checklist:**

| # | Checkpoint |
|---|---|
| 1 | "One Standard bucket" is the wrong choice because Standard is GCS's most expensive storage class (optimized for frequent access, low latency), while the logs are barely read after the first 90 days except during an audit — keeping 100 TB in Standard for 7 years would cost hundreds of thousands of USD for data that mostly just sits there. |
| 2 | The correct design is a lifecycle policy that automatically cascades objects across GCS's 4 storage classes as access frequency decreases, instead of keeping everything in one class. |
| 3 | The cascade timeline: newly created objects start in Standard (heavily accessed in the first 30 days), move to Nearline after 30 days (accessed <1x/month, lower storage price), then to Coldline after 90 days (accessed <1x/quarter, storage price drops further), then to Archive after 1 year (almost never read, cheapest storage price, kept purely for compliance). |
| 4 | Each tier trades in the opposite direction — retrieval price goes up as storage price goes down — but since old logs are rarely read, the total 7-year cost drops more than 90% compared to leaving everything in Standard. |
| 5 | This cascade is declared via a `lifecycle_rule` with `action`/`condition` blocks on `google_storage_bucket`, running fully automatically with no manual cron job needed to switch classes. |
| 6 | Because this is compliance data, a second layer independent of the storage-class choice is required: a retention policy setting the minimum number of days data must be kept, combined with bucket lock to make that constraint immutable so nobody — not even the project owner — can delete or modify objects during the retention period; storage class decides cost while retention + lock decide the legal/safety guarantee, two decisions that are both mandatory. |

**5 mức trả lời — điểm Sonnet / Haiku:**

| Mức | Câu trả lời | Sonnet | Haiku |
|---|---|---|---|
| L1 | Em sẽ không đồng ý với cách làm dồn hết vào một bucket Standard, vì Standard là class đắt nhất, tối ưu cho truy cập tần suất cao độ trễ thấp… | 100% | 100% |
| L2 | Em nghĩ để hết vào một bucket Standard là sai vì đó là class đắt nhất, trong khi log sau 90 ngày gần như không ai đụng tới ngoài lúc audit, … | 50% | 67% |
| L3 | Dạ em thấy để hết vào Standard thì hơi lãng phí vì log cũ ít khi đọc mà Standard lại là loại lưu trữ đắt. Em sẽ dùng lifecycle policy để tự … | 33% | 67% |
| L4 | Dạ thì em nghĩ có thể dùng thêm mấy loại lưu trữ khác cho rẻ hơn, kiểu như Nearline gì đó, để đỡ tốn tiền hơn Standard. Còn compliance thì c… | 0% | 0% |
| L5 | Dạ em nghĩ bạn đồng nghiệp nói đúng đó, cứ để một bucket Standard cho đơn giản, dễ quản lý, khỏi phải cấu hình nhiều thứ phức tạp. Cần thì m… | 0% | 0% |

---

## idx 7 · theory · devops-mastery — 6 checkpoint · enhance 1 vòng · coherent=True

**Câu hỏi:** A new colleague says: "I gave user A the `Contributor` role, done with permissions." You notice this conflates two concepts. Explain precisely how role definition and role assignment differ in Azure RBAC, and why keeping these two concepts separate matters.

**Checklist:**

| # | Checkpoint |
|---|---|
| 1 | Role definition answers "what can be done": it's a list of `actions` (control-plane operations like creating/deleting/reading resources) and `dataActions` (data-plane operations like reading blob contents, reading a secret), using either a built-in role (Contributor/Reader) or a custom-written one. |
| 2 | The definition alone grants NOBODY any permission — it's just a "permission template" waiting to be used. |
| 3 | Role assignment is what actually grants permission: it's a pairing of THREE pieces — a principal (who: user/group/service principal/managed identity, from Entra ID), a role definition (what: e.g. Contributor), and a scope (where: a specific point in the Management Group → Subscription → Resource Group → Resource tree). |
| 4 | The statement "gave user A Contributor" is missing the single most important piece — WHAT SCOPE? Without it, nobody knows whether user A has Contributor across the entire subscription (very broad) or just on one specific Resource Group (much closer to least-privilege) — a huge difference in risk level. |
| 5 | Keeping the two concepts separate matters because a definition is reusable across countless different assignments, with no need to redefine "what Contributor means" every time it's assigned to someone — this reusability is also what lets an organization standardize permissions consistently. |
| 6 | Separation also makes RBAC easier to audit — you can list every assignment (who, what permission, where) independently of re-understanding what each role means each time. |

**5 mức trả lời — điểm Sonnet / Haiku:**

| Mức | Câu trả lời | Sonnet | Haiku |
|---|---|---|---|
| L1 | Dạ đúng là bạn đồng nghiệp đang gộp hai khái niệm khác nhau. Role definition chỉ là bản mô tả 'làm được gì' thôi — gồm actions cho control-p… | 100% | 100% |
| L2 | Em nghĩ ở đây có sự nhầm lẫn giữa role definition và role assignment. Role definition là định nghĩa quyền — ví dụ Contributor gồm những acti… | 83% | 83% |
| L3 | Dạ, role definition với role assignment là hai cái khác nhau ạ. Definition là cái quy định Contributor được làm những gì, còn assignment là … | 17% | 33% |
| L4 | À thì role definition với role assignment nó khác nhau, definition là định nghĩa role còn assignment là gán role. Cái bạn đồng nghiệp nói th… | 17% | 17% |
| L5 | Dạ theo em thì Contributor là một role có quyền khá cao, gần như admin luôn nên gán cho user A vậy là ổn rồi. RBAC là Role-Based Access Cont… | 0% | 0% |

---

## idx 8 · theory · devops-mastery — 6 checkpoint · enhance 1 vòng · coherent=True

**Câu hỏi:** You tell a new colleague: "I'm running 10 containers from the same `node:20-alpine` image, and disk usage only grew by a few dozen MB, not 10x the image size." The colleague doesn't believe it, thinking each container must have its own full copy of the image. Explain precisely how an image and a container differ, and what mechanism keeps 10 containers from costing 10x the disk space.

**Checklist:**

| # | Checkpoint |
|---|---|
| 1 | An image is a set of immutable filesystem layers plus metadata (env, entrypoint, history) — it has no state and cannot run on its own, more like a static "mold" sitting on disk. |
| 2 | A container is a process launched from an image — the image itself never runs. |
| 3 | Docker gives each container its own writable layer (Copy-on-Write mechanism) on top of the image's read-only layer stack — this is the only part each container owns individually. |
| 4 | Every change a container makes (new file, edited file) is written to its own writable layer, never touching the image's original layers. |
| 5 | Docker uses a union filesystem (OverlayFS) to mount the same read-only image layers into every container, so those layers exist only once on physical disk no matter how many containers share the image — Docker never duplicates the image data per container. |
| 6 | The extra disk usage from running N containers off the same image is only N times the size of each container's writable layer (usually a few MB if the container doesn't write much new data), not N times the whole image size — which is exactly why disk usage grew only a few dozen MB instead of several GB. |

**5 mức trả lời — điểm Sonnet / Haiku:**

| Mức | Câu trả lời | Sonnet | Haiku |
|---|---|---|---|
| L1 | Dạ, vì image và container về bản chất là hai thứ khác nhau. Image là tập hợp các layer filesystem chỉ đọc, immutable, cộng với metadata thôi… | 83% | 100% |
| L2 | Em nghĩ điểm mấu chốt là image với container không giống nhau, image là các layer read-only nằm sẵn trên đĩa, còn container chỉ là một proce… | 83% | 83% |
| L3 | Tại vì các container nó share chung layer của image, không phải mỗi container có bản riêng đâu ạ. Image thì gồm nhiều layer xếp chồng lên nh… | 50% | 33% |
| L4 | Dạ do Docker nó cache lại image nên chạy nhiều container không bị tốn thêm nhiều disk. Mấy container dùng chung một image nên không cần tải … | 0% | 0% |
| L5 | Chắc do Alpine nó nhẹ sẵn nên 10 container chạy cũng không nặng lắm đâu ạ. Với lại Docker chắc có nén file lại nên dung lượng nó nhỏ, chứ em… | 0% | 0% |

---

## idx 9 · scenario · devops-mastery — 7 checkpoint · enhance 1 vòng · coherent=True

**Câu hỏi:** A coworker quickly deployed a service with `kubectl run web --image=nginx` (a bare Pod) and said "done — `restartPolicy: Always` means it'll bring itself back if anything goes wrong." That night the node got restarted for an OS patch, and by morning customers reported the service was fully down. Explain to the coworker exactly what `restartPolicy: Always` protects this Pod against, what it does NO

**Checklist:**

| # | Checkpoint |
|---|---|
| 1 | restartPolicy: Always is enforced by the kubelet on the node and only governs the container inside a Pod that still exists: on a container crash, the kubelet restarts it in place, the Pod keeps its same name/IP, and the RESTARTS counter increments. |
| 2 | restartPolicy: Always does NOT cover a Pod being deleted or lost along with its node — recreating a missing Pod is a controller's responsibility, not something the kubelet's restart mechanism does. |
| 3 | A bare Pod created via `kubectl run` (no Deployment) has empty ownerReferences — nobody owns or manages it. |
| 4 | When the node goes down, every Pod scheduled on it disappears with it; for a bare Pod that's the end — nothing rebuilds it, regardless of restartPolicy, because it has no controller watching over it. |
| 5 | The fix is to wrap the service in a Deployment, which in turn creates a ReplicaSet to own the Pod. |
| 6 | The ReplicaSet runs a continuous reconcile loop that compares Pods matching its label selector against the desired `replicas` count; when the node restart wipes out the Pod, it detects the shortfall and creates a new Pod (different name/IP) on a surviving node, so the service self-heals without manual intervention. |
| 7 | General rule: bare Pods should only be used for one-off debug purposes (e.g. `kubectl run -it --rm`); every real workload needs a controller (like a Deployment/ReplicaSet) behind it. |

**5 mức trả lời — điểm Sonnet / Haiku:**

| Mức | Câu trả lời | Sonnet | Haiku |
|---|---|---|---|
| L1 | restartPolicy: Always là do kubelet trên node quản lý, nó chỉ restart lại container bên trong một Pod vẫn còn tồn tại thôi — ví dụ container… | 100% | 100% |
| L2 | restartPolicy: Always chỉ có tác dụng khi container bên trong Pod bị crash thôi, kubelet trên node sẽ khởi động lại nó, Pod vẫn giữ tên và I… | 43% | 71% |
| L3 | Cái restartPolicy: Always đó chỉ restart container khi nó bị lỗi hay crash thôi, chứ không phải restart cả Pod đâu. Vấn đề là con Pod này tạ… | 29% | 57% |
| L4 | Restart policy Always thì nó restart Pod khi có sự cố xảy ra thôi ạ. Còn vụ tối qua chắc do node restart nên Pod cũng bị ảnh hưởng theo. Em … | 0% | 14% |
| L5 | À cái này chắc là do image nginx bị lỗi hoặc là do cấu hình port sai nên service mới down đó anh. Restart policy Always thì em nghĩ nó tự độ… | 0% | 0% |

---

## idx 10 · theory · devops-mastery — 8 checkpoint · enhance 1 vòng · coherent=True

**Câu hỏi:** When you run `kubectl apply -f pod.yaml`, which control-plane components does the request pass through before the Pod actually runs on a node? Walk through the full path.

**Checklist:**

| # | Checkpoint |
|---|---|
| 1 | kubectl talks directly to the apiserver over HTTPS using a client certificate. |
| 2 | The apiserver first authenticates the request, verifying identity via client certificate, bearer token, or OIDC. |
| 3 | The apiserver then authorizes the request through RBAC, checking whether the subject has the required verb on the resource. |
| 4 | Admission controllers run next: mutating admission executes first and can modify the object (e.g., injecting defaults); validating admission runs after and only accepts or rejects the object. |
| 5 | After passing schema validation, the object is written to etcd under the key path /registry/pods/<namespace>/<name>; etcd is the single source of truth and uses Raft consensus, replicating the write across a quorum of members before it is considered committed. |
| 6 | kube-scheduler watches the apiserver for Pods without spec.nodeName and runs a predicate (filtering) phase that eliminates nodes with untolerated taints, insufficient resources, or a non-matching nodeSelector, followed by a priority (scoring) phase using plugins like LeastAllocated and ImageLocality, with the highest-scoring node winning. |
| 7 | The scheduler binds the Pod to the chosen node by calling the apiserver's /binding subresource. |
| 8 | kubelet on that specific node, watching the apiserver filtered to its own nodeName, detects the newly bound Pod and calls the CRI (e.g., containerd over gRPC) to pull the image and start the container. |

**5 mức trả lời — điểm Sonnet / Haiku:**

| Mức | Câu trả lời | Sonnet | Haiku |
|---|---|---|---|
| L1 | Kubectl gọi thẳng tới apiserver qua HTTPS bằng client cert, rồi request đi qua một chuỗi: authentication để xác định danh tính từ cert hoặc … | 88% | 100% |
| L2 | Đầu tiên kubectl gửi request tới apiserver, ở đó nó phải qua authentication xác thực danh tính rồi authorization dùng RBAC để check quyền. S… | 13% | 38% |
| L3 | Request đi từ kubectl tới apiserver, apiserver check quyền truy cập rồi lưu vào etcd. Sau đó scheduler sẽ chọn node nào phù hợp để chạy Pod,… | 0% | 0% |
| L4 | Thì kubectl apply nó gửi request lên apiserver, apiserver sẽ xử lý rồi lưu vào etcd, sau đó Kubernetes tự tìm node nào rảnh để chạy Pod đó. … | 0% | 0% |
| L5 | À cái này liên quan tới YAML file, mình định nghĩa Pod trong file yaml rồi apply lên là Kubernetes tự động deploy nó lên cluster thôi ạ. Em … | 0% | 0% |

---

## idx 11 · theory · devops-mastery — 8 checkpoint · enhance 1 vòng · coherent=True

**Câu hỏi:** Your manager says: "just use the root account's access key for the Terraform provider, faster than creating an IAM user for this." How do you respond? Explain how the root account differs from an IAM user/role, and how the least-privilege principle should actually apply here.

**Checklist:**

| # | Checkpoint |
|---|---|
| 1 | Decline the manager's suggestion — would not use the root account's access key for Terraform. |
| 2 | Root account = the email that registered the AWS account, holding absolute power such as changing billing, closing the account, or removing any security restriction. |
| 3 | Root's power cannot be restricted — no policy can ever be attached to root to limit it; because of this, AWS recommends enabling MFA on root, never creating an access key for it, and only using it for the handful of mandatory actions like billing changes or closing the account. |
| 4 | Everyday work — including Terraform calling the API — should go through IAM instead of root. |
| 5 | IAM is built from four blocks: user (a person/service identity), group (a bucket of users for centralized permission management), role (a temporary identity issuing short-lived credentials for services/cross-account access), and policy (a JSON document defining allowed/denied actions). |
| 6 | An identity's effective permission is the sum of every policy attached to it, directly or via a group. |
| 7 | Applying least-privilege here: create a dedicated IAM user (or role if running from CI/EC2) for Terraform, attaching only the policy it actually needs for the resources it manages, absolutely not AdministratorAccess. |
| 8 | Reasoning: if the IAM user's access key leaks, damage is bounded to the granted scope (can't touch billing or resources outside it), whereas leaking a root access key means losing the entire account with no way to revoke or bound the damage, since root simply doesn't accept a limiting policy. |

**5 mức trả lời — điểm Sonnet / Haiku:**

| Mức | Câu trả lời | Sonnet | Haiku |
|---|---|---|---|
| L1 | Em sẽ không làm theo đề xuất đó. Root account là danh tính đăng ký tài khoản AWS, có quyền tuyệt đối như đổi billing hay đóng cả account, và… | 100% | 100% |
| L2 | Em sẽ từ chối và giải thích là root account có quyền tối cao, không policy nào giới hạn được nó, nên AWS khuyên không bao giờ tạo access key… | 50% | 75% |
| L3 | Dạ em nghĩ không nên dùng root vì root là tài khoản cấp cao nhất, quyền rất lớn nên nếu lộ key thì rất nguy hiểm. Mình nên tạo một IAM user … | 38% | 50% |
| L4 | Dạ em nghĩ dùng root cũng được nếu cho nhanh, nhưng nói chung là nên cẩn thận với quyền admin. IAM user thì an toàn hơn root một chút. Em kh… | 0% | 0% |
| L5 | Dạ em thấy sếp nói vậy cũng hợp lý, dùng access key nào chạy được Terraform là được rồi, quan trọng là code chạy đúng. IAM với root thì em t… | 0% | 0% |

---

