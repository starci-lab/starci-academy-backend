# 2-devops-mastery / 1-infrastructure-as-code-terraform
Summary: kept 8, delete 0 of 8

## 0-card — middle — [Terraform, IaC]
**Question:** What is Terraform state, why does it exist, and what specifically goes wrong if two engineers run `terraform apply` against the same local `terraform.tfstate` at the same time?
**Verdict:** KEEP — concept + failure-mode reasoning ("why state exists" and "what corrupts on concurrent apply"), not trivia; scales with seniority.

### New answer (en)
**TL;DR** — State is Terraform's map from your config to real resource IDs; it exists so Terraform can diff desired-vs-actual and compute a minimal plan. Two concurrent applies on unlocked local state interleave writes and corrupt it — so state must be shared and serialized via a remote backend with locking.

**How it works** — Your `.tf` files say *what* you want; state records *which* concrete resources (this VPC id, that instance id) fulfil it, and caches attributes + dependencies so the next run recreates nothing it can reuse. Because it's the single source of truth, use a remote backend (S3, GCS, Azure Blob, Terraform Cloud) with state locking (e.g. DynamoDB for S3) so only one apply mutates it at a time, plus versioning for recovery.

:::muted
**Trade-off** — Remote state is a chicken-and-egg bootstrap: you must provision and secure the backend before doing anything, and locking serializes concurrent applies into a queue. Splitting into smaller per-component states cuts lock contention and blast radius, at the cost of wiring outputs between them and more moving parts.
:::

:::muted
**Common pitfall** — Two unlocked concurrent applies lose track of created resources, then recreate live infra or orphan it (you keep paying for resources Terraform no longer manages). Committing `terraform.tfstate` to Git is the other classic disaster — state merge conflicts are unrecoverable and the file holds secrets in plaintext. Never hand-edit state; use `terraform state` subcommands.
:::

*Go deeper: how would you safely recover when a lock is stuck or state has already been corrupted?*

**Keywords** — `remote backend · state locking · DynamoDB · single source of truth · plaintext secrets in state`

### New answer (vi)
**Chốt** — State là bản đồ của Terraform từ config sang resource ID thật; nó tồn tại để Terraform diff mong-muốn-vs-thực-tế và tính ra plan tối thiểu. Hai apply đồng thời trên state cục bộ không khóa sẽ đan xen lệnh ghi và làm hỏng nó — nên state phải được chia sẻ và tuần tự hóa qua remote backend có locking.

**Cơ chế** — File `.tf` nói *bạn muốn gì*; state ghi *resource cụ thể nào* (VPC id này, instance id kia) đáp ứng điều đó, và cache thuộc tính + dependency để lần chạy sau không tạo lại thứ có thể tái dùng. Vì là nguồn sự thật duy nhất, dùng remote backend (S3, GCS, Azure Blob, Terraform Cloud) với state locking (ví dụ DynamoDB cho S3) để chỉ một apply mutate nó một lúc, cộng versioning để khôi phục.

:::muted
**Trade-off** — Remote state là một cú bootstrap con-gà-quả-trứng: phải provision và bảo vệ backend trước khi làm gì, và locking biến các apply đồng thời thành hàng đợi. Tách thành các state nhỏ theo component giảm tranh chấp lock và blast radius, đổi lại phải nối output giữa chúng và nhiều bộ phận hơn.
:::

:::muted
**Bẫy thường gặp** — Hai apply đồng thời không khóa làm mất dấu resource đã tạo, rồi tạo lại hạ tầng đang sống hoặc bỏ rơi nó (bạn vẫn trả tiền cho resource Terraform không còn quản). Commit `terraform.tfstate` vào Git là thảm họa kinh điển còn lại — merge conflict state không thể khôi phục và file chứa secret plaintext. Đừng sửa state bằng tay; dùng subcommand `terraform state`.
:::

*Đào sâu tiếp: bạn khôi phục an toàn thế nào khi lock bị kẹt hoặc state đã hỏng?*

**Từ khoá ăn điểm** — `remote backend · state locking · DynamoDB · single source of truth · secret plaintext trong state`

## 1-card — senior — [Terraform, IaC, Debugging]
**Question:** Someone changed a security-group rule by hand in the cloud console. Now `terraform plan` wants to delete their change and revert to the code. Walk through how you reconcile this — and when you'd `import` vs `ignore_changes` vs just let it revert.
**Verdict:** KEEP — diagnosis + decision-tree across `import`/`ignore_changes`/revert; carries real design judgment.

### New answer (en)
**TL;DR** — This is drift, and Terraform treats code as the source of truth, so `plan` proposes to undo the manual change. The decision is *which* truth is right: codify a correct console change, let apply revert a mistaken one, `import` a resource born outside Terraform, or `ignore_changes` a field legitimately owned elsewhere.

**How it works** — Run `terraform plan -refresh-only` to see drift explicitly first. If the console change was correct → edit the `.tf` to match so the next apply is a no-op. If it was a mistake → let apply revert it. If a resource was created entirely outside Terraform and should now be managed → `terraform import` (or an `import` block) brings it into state without recreating. If a field is genuinely managed elsewhere (an autoscaler sets `desired_count`) → `lifecycle { ignore_changes = [...] }` so Terraform stops fighting it.

:::muted
**Trade-off** — `ignore_changes` ends the drift war but blinds Terraform to that field, so a real misconfiguration there goes unnoticed. Codifying every manual change keeps code authoritative but slows incidents where someone *had* to click-fix. Mature stance: treat console edits as exceptional, run `plan` in CI on a schedule to detect drift early, feed urgent fixes back into code promptly.
:::

:::muted
**Common pitfall** — Blindly running `apply` to "clear the plan" can revert a hand-applied production hotfix and cause an outage — read the plan and understand *why* it drifted first. Overusing `ignore_changes` until half your resources are unmanaged makes the code a comforting fiction. And `import` only writes state; you must still hand-write matching config or the very next plan tries to change the freshly-imported resource.
:::

*Go deeper: how would you build continuous drift detection so console changes surface in hours, not at the next deploy?*

**Keywords** — `drift · plan -refresh-only · terraform import · ignore_changes · moved/state mv`

### New answer (vi)
**Chốt** — Đây là drift, và Terraform coi code là nguồn sự thật, nên `plan` đề xuất hoàn tác thay đổi tay. Quyết định nằm ở *sự thật nào* đúng: đưa vào code nếu thay đổi console đúng, để apply revert nếu nó sai, `import` resource sinh ngoài Terraform, hoặc `ignore_changes` field thực sự được sở hữu nơi khác.

**Cơ chế** — Chạy `terraform plan -refresh-only` để thấy drift rõ trước. Nếu thay đổi console đúng → sửa `.tf` cho khớp để lần apply sau là no-op. Nếu sai → để apply revert. Nếu resource được tạo hoàn toàn ngoài Terraform và giờ cần quản → `terraform import` (hoặc `import` block) đưa nó vào state mà không tạo lại. Nếu field thực sự được quản nơi khác (autoscaler đặt `desired_count`) → `lifecycle { ignore_changes = [...] }` để Terraform ngừng tranh giành.

:::muted
**Trade-off** — `ignore_changes` chấm dứt cuộc chiến drift nhưng làm Terraform mù với field đó, nên cấu hình sai thật ở đó không bị phát hiện. Đưa mọi thay đổi tay vào code giữ code có thẩm quyền nhưng làm chậm các sự cố mà ai đó *buộc phải* click vá. Tư thế chín chắn: coi sửa console là ngoại lệ, chạy `plan` trong CI theo lịch để phát hiện drift sớm, đưa bản vá khẩn về code kịp thời.
:::

:::muted
**Bẫy thường gặp** — Mù quáng chạy `apply` để "dọn plan" có thể revert một hotfix production áp tay và gây outage — đọc plan và hiểu *vì sao* có drift trước. Lạm dụng `ignore_changes` tới mức nửa số resource không được quản khiến code thành hư cấu an ủi. Và `import` chỉ ghi state; bạn vẫn phải tự viết config khớp, nếu không chính plan ngay sau cố thay đổi resource vừa import.
:::

*Đào sâu tiếp: bạn dựng drift detection liên tục thế nào để thay đổi console hiện ra trong vài giờ, không phải tới lần deploy sau?*

**Từ khoá ăn điểm** — `drift · plan -refresh-only · terraform import · ignore_changes · moved/state mv`

## 2-card — senior — [Terraform, IaC]
**Question:** You provision 5 servers with `count = 5`. You remove the *second* one from the list and run `plan` — Terraform wants to destroy and recreate servers 2 through 5, not just delete one. Why, and how does `for_each` avoid it?
**Verdict:** KEEP — explains the index-identity mechanism + design trade-off between `count` and `for_each`; classic senior trap.

### New answer (en)
**TL;DR** — `count` keys resources by numeric position, so removing the second element shifts every later index down by one; Terraform sees a different identity in each slot and destroys+recreates the tail. `for_each` keys by a stable string instead, so removing one entry touches exactly that one.

**How it works** — `count` gives `aws_instance.web[0..4]` and state binds each real server to its index. Drop element 2 and `[3]`→`[2]`, `[4]`→`[3]`… — every downstream slot's identity changes. `for_each` addresses by map key (`aws_instance.web["api"]`, `["worker"]`): identity is the key, not position, so deleting `"api"` leaves the rest untouched. Rule of thumb: `count` for truly identical, interchangeable copies; `for_each` whenever items have stable identities you'll add/remove individually.

:::muted
**Trade-off** — `count` is simpler and ideal for "N identical replicas where order is meaningless." `for_each` needs a map/set of strings and slightly more verbose addressing, but buys stable identity — the difference between a one-line config change and an accidental rebuild of the whole fleet. If you started on `count` and must switch, `terraform state mv` (or `moved` blocks) re-keys resources instead of destroying them.
:::

:::muted
**Common pitfall** — The index-shift rebuild on stateful resources (databases, volumes, anything with an IP or data) is genuinely destructive — a "harmless" list edit can wipe production. A subtler `for_each` trap: keys must be known at plan time, so feeding it values derived from *other* resources' computed attributes throws "Invalid for_each argument" — key on stable inputs (names you control), not provider-assigned ids.
:::

*Go deeper: you already have a `count`-based fleet in production — how do you migrate it to `for_each` with zero replacements?*

**Keywords** — `count by index · for_each by key · index shift · state mv · moved block · known at plan time`

### New answer (vi)
**Chốt** — `count` đánh khóa resource theo vị trí numeric, nên xóa phần tử thứ hai làm mọi chỉ số sau dịch xuống một bậc; Terraform thấy danh tính khác ở mỗi ô và destroy+tạo lại phần đuôi. `for_each` đánh khóa bằng chuỗi ổn định, nên xóa một entry chỉ chạm đúng cái đó.

**Cơ chế** — `count` cho `aws_instance.web[0..4]` và state gắn mỗi server thật với chỉ số của nó. Bỏ phần tử 2 thì `[3]`→`[2]`, `[4]`→`[3]`… — danh tính mọi ô phía sau đổi. `for_each` đánh địa chỉ bằng map key (`aws_instance.web["api"]`, `["worker"]`): danh tính là key chứ không phải vị trí, nên xóa `"api"` để phần còn lại nguyên vẹn. Quy tắc: `count` cho bản sao giống hệt, thay thế lẫn nhau; `for_each` mỗi khi phần tử có danh tính ổn định mà bạn thêm/xóa từng cái.

:::muted
**Trade-off** — `count` đơn giản hơn và lý tưởng cho "N replica giống hệt mà thứ tự vô nghĩa." `for_each` cần map/set chuỗi và địa chỉ hơi dài hơn, nhưng mua được danh tính ổn định — khác biệt giữa một thay đổi config một dòng và một cú rebuild nhầm cả fleet. Nếu bắt đầu với `count` và buộc phải chuyển, `terraform state mv` (hoặc `moved` block) re-key resource thay vì destroy.
:::

:::muted
**Bẫy thường gặp** — Cú rebuild do dịch-chỉ-số trên resource có trạng thái (database, volume, bất cứ thứ gì có IP hay dữ liệu) thực sự hủy diệt — một chỉnh sửa list "vô hại" có thể xóa sạch production. Một bẫy `for_each` tinh vi hơn: khóa phải biết lúc plan, nên nạp giá trị dẫn xuất từ thuộc tính computed của *resource khác* sẽ ném "Invalid for_each argument" — đánh khóa trên input ổn định (tên bạn kiểm soát), không phải id provider gán.
:::

*Đào sâu tiếp: bạn đã có fleet dựa trên `count` trong production — di chuyển nó sang `for_each` với zero replacement thế nào?*

**Từ khoá ăn điểm** — `count theo index · for_each theo key · index shift · state mv · moved block · known at plan time`

## 3-card — senior — [Terraform, IaC, Architecture]
**Question:** You need dev, staging, and prod environments from the same Terraform code. Compare Terraform **workspaces** against a **directory-per-environment** layout — which do you choose for production and why?
**Verdict:** KEEP — architecture trade-off with a defended recommendation; scales with seniority and invites follow-up.

### New answer (en)
**TL;DR** — Workspaces give one codebase + one backend with a separate state per `terraform.workspace`; directory-per-env gives each environment a physically separate state, backend, and credentials. For production most teams pick directory-per-env because the isolation is explicit and the blast radius is bounded.

**How it works** — Workspaces are cheap to create and great for ephemeral, identical copies (per-PR preview stacks). Directory-per-env (`envs/dev`, `envs/prod`, each with its own backend config + `.tfvars`, sharing logic via modules) lets prod legitimately differ — bigger instances, extra resources — by composing modules differently, and you literally cannot apply to prod while "in" dev. The honest rule: workspaces for *identical, disposable* stacks; directories for *long-lived, differently-shaped, security-isolated* environments.

:::muted
**Trade-off** — Workspaces minimise duplication but hide the active environment behind one CLI flag and share a backend + provider config, so prod and dev secrets live closer together. Directory-per-env costs some repetition (or a thin wrapper like Terragrunt to DRY the backend blocks) but makes the environment obvious in the path and allows per-env access controls and state buckets.
:::

:::muted
**Common pitfall** — The signature workspace disaster is applying to the wrong environment because you forgot `workspace select` — same command, same directory, catastrophically different target. Workspaces also tempt `count = terraform.workspace == "prod" ? 3 : 1` conditionals that sprawl until prod's real shape is buried in ternaries. And HCP/Terraform Cloud "workspaces" are a *different concept* (full isolated configs) than CLI workspaces — conflating them in an interview is a tell.
:::

*Go deeper: where does Terragrunt fit, and does it change your answer for a 30-environment fleet?*

**Keywords** — `terraform.workspace · directory-per-env · blast radius · isolated backend/credentials · Terragrunt · HCP workspace ≠ CLI workspace`

### New answer (vi)
**Chốt** — Workspaces cho một codebase + một backend với state riêng theo từng `terraform.workspace`; thư-mục-mỗi-env cho mỗi môi trường một state, backend và credential tách biệt vật lý. Cho production đa số team chọn thư-mục-mỗi-env vì cô lập tường minh và blast radius bị giới hạn.

**Cơ chế** — Workspaces rẻ để tạo và tuyệt cho các bản sao tạm thời, giống hệt (preview stack theo PR). Thư-mục-mỗi-env (`envs/dev`, `envs/prod`, mỗi cái có backend config + `.tfvars` riêng, chia sẻ logic qua module) cho phép prod khác đi chính đáng — instance to hơn, resource thêm — bằng cách compose module khác nhau, và bạn thực sự không thể apply lên prod khi đang "ở trong" dev. Quy tắc thật thà: workspaces cho stack *giống hệt, vứt được*; thư mục cho môi trường *sống lâu, hình dạng khác nhau, cô lập bảo mật*.

:::muted
**Trade-off** — Workspaces giảm thiểu lặp lại nhưng giấu môi trường đang chạy sau một flag CLI và dùng chung backend + provider config, nên secret prod và dev nằm gần nhau hơn. Thư-mục-mỗi-env tốn chút lặp lại (hoặc một wrapper mỏng như Terragrunt để DRY các backend block) nhưng làm môi trường hiện rõ trong path và cho phép access control lẫn state bucket theo từng env.
:::

:::muted
**Bẫy thường gặp** — Thảm họa đặc trưng của workspace là apply nhầm môi trường vì bạn quên `workspace select` — cùng lệnh, cùng thư mục, mục tiêu khác nhau thảm khốc. Workspaces cũng cám dỗ các điều kiện `count = terraform.workspace == "prod" ? 3 : 1` lan tràn tới khi hình dạng thật của prod bị chôn trong ternary. Và "workspace" của HCP/Terraform Cloud là một *khái niệm khác* (config cô lập đầy đủ) với workspace CLI — gộp hai cái trong phỏng vấn là một dấu hiệu lộ.
:::

*Đào sâu tiếp: Terragrunt nằm ở đâu, và nó có đổi câu trả lời của bạn cho một fleet 30 môi trường không?*

**Từ khoá ăn điểm** — `terraform.workspace · directory-per-env · blast radius · backend/credential cô lập · Terragrunt · HCP workspace ≠ CLI workspace`

## 4-card — senior — [Terraform, IaC]
**Question:** A change to an instance forces replacement, and Terraform's default order — destroy the old one, then create the new — causes downtime. How do `create_before_destroy`, `prevent_destroy`, and `-replace` change this, and when do you reach for each?
**Verdict:** KEEP — mechanism + when-to-use-each across three lifecycle controls; real operational judgment.

### New answer (en)
**TL;DR** — Force-new changes make Terraform replace a resource, and its default destroy-then-create leaves a downtime gap. `create_before_destroy` flips the order for zero-downtime swaps, `prevent_destroy` hard-errors any plan that would delete a protected resource, and `-replace` forces an on-demand recreate of a healthy one.

**How it works** — Some attribute changes can't be updated in place, so the provider replaces the resource. `lifecycle { create_before_destroy = true }` stands up the replacement, cuts over, *then* destroys the old — essential behind a load balancer. `lifecycle { prevent_destroy = true }` is a guardrail protecting databases and stateful stores from accidental deletion. `terraform apply -replace=ADDRESS` (the modern replacement for `terraform taint`) forces a recreate on demand — e.g. to cycle a corrupted instance.

:::muted
**Trade-off** — `create_before_destroy` needs old and new to coexist briefly, requiring headroom (quota, capacity) and unique names — two resources can't share an identifier during overlap, so you often need `name_prefix`. `prevent_destroy` is great insurance but blocks legitimate teardown until removed, annoying in disposable environments. `-replace` is precise but manual — a scalpel for one resource, not a strategy.
:::

:::muted
**Common pitfall** — `create_before_destroy` with a fixed `name` deadlocks: the create fails on a duplicate-name conflict with the still-living old resource, so nothing progresses — always pair it with `name_prefix`/generated names. `prevent_destroy` can also trap you when the only path forward genuinely needs replacement, forcing a code edit under pressure. And reaching for `-replace` to "fix" drift instead of diagnosing it just churns infra and hides the real cause.
:::

*Go deeper: how does `create_before_destroy` interact with resources that have immutable, externally-referenced identifiers like a DNS name or a fixed EIP?*

**Keywords** — `force-new · create_before_destroy · prevent_destroy · -replace (taint) · name_prefix · zero-downtime`

### New answer (vi)
**Chốt** — Thay đổi force-new khiến Terraform replace resource, và mặc định destroy-rồi-create để lại khoảng downtime. `create_before_destroy` đảo thứ tự cho swap zero-downtime, `prevent_destroy` hard-error mọi plan định xóa resource được bảo vệ, và `-replace` ép tạo lại theo yêu cầu một resource khỏe mạnh.

**Cơ chế** — Một số thay đổi thuộc tính không update tại chỗ được, nên provider replace resource. `lifecycle { create_before_destroy = true }` dựng cái thay thế lên, chuyển lưu lượng sang, *rồi* destroy cái cũ — thiết yếu phía sau một load balancer. `lifecycle { prevent_destroy = true }` là lan can bảo vệ database và kho có trạng thái khỏi bị xóa nhầm. `terraform apply -replace=ADDRESS` (cách thay thế hiện đại cho `terraform taint`) ép tạo lại theo yêu cầu — ví dụ để quay vòng một instance bị hỏng.

:::muted
**Trade-off** — `create_before_destroy` cần cũ lẫn mới cùng tồn tại chốc lát, đòi hỏi dư địa (quota, capacity) và tên duy nhất — hai resource không thể chung identifier lúc chồng lấn, nên bạn thường cần `name_prefix`. `prevent_destroy` là bảo hiểm tốt nhưng chặn cả teardown chính đáng cho tới khi gỡ, gây phiền trong môi trường vứt được. `-replace` chính xác nhưng thủ công — dao mổ cho một resource, không phải một chiến lược.
:::

:::muted
**Bẫy thường gặp** — `create_before_destroy` với một `name` cố định gây deadlock: lệnh create fail vì trùng tên với resource cũ vẫn sống, nên không gì tiến triển — luôn ghép với `name_prefix`/tên sinh tự động. `prevent_destroy` cũng có thể bẫy khi con đường tiến lên duy nhất thực sự cần replacement, ép sửa code dưới áp lực. Và dùng `-replace` để "sửa" drift thay vì chẩn đoán chỉ làm hạ tầng xáo trộn và che giấu nguyên nhân thật.
:::

*Đào sâu tiếp: `create_before_destroy` tương tác thế nào với resource có identifier bất biến, được tham chiếu từ bên ngoài như một DNS name hay một EIP cố định?*

**Từ khoá ăn điểm** — `force-new · create_before_destroy · prevent_destroy · -replace (taint) · name_prefix · zero-downtime`

## 5-card — middle — [Terraform, Security, IaC]
**Question:** A teammate marks a database password variable `sensitive = true` and says "good, the secret is safe now." Is the secret actually protected? Where does it really live, and how should secrets be handled with Terraform?
**Verdict:** KEEP — corrects a common misconception with a real "where does it live" diagnosis; security reasoning, not recall.

### New answer (en)
**TL;DR** — No. `sensitive = true` only redacts the value from CLI output and plan logs — it does not encrypt anything, and the password is still written in plaintext into the state file. Real protection means keeping secrets out of Git and locking down the state itself.

**How it works** — Terraform must record what it set, so the value lands in state regardless. Proper handling: (1) keep secrets out of `.tf`/`.tfvars` in Git — inject via `TF_VAR_*` env vars, a secrets-manager data source (Vault, AWS Secrets Manager), or a CI secret store; (2) protect state — remote backend with encryption at rest, TLS in transit, and tight IAM so only the pipeline can read it; (3) prefer having the cloud *generate* the secret (a managed random password) so it never transits your laptop.

:::muted
**Trade-off** — Pulling secrets from Vault/Secrets Manager removes them from Git but adds a runtime dependency and a bootstrap question (who provisions the secrets store?). `random_password` is convenient but the value still lands in state — you've moved, not eliminated, the exposure. Pragmatic stance: minimise where secrets *appear* (never Git, never logs) and lock down the one place they unavoidably persist.
:::

:::muted
**Common pitfall** — Teams routinely commit `terraform.tfstate` or a password-filled `*.tfvars` to a repo, leaking every credential to anyone with read access — and to Git history forever, even after deletion. `sensitive` also propagates awkwardly: outputs derived from a sensitive value must themselves be marked sensitive, and a sensitive value interpolated into a non-sensitive string can still leak through it. Redaction is shallow, not a security boundary.
:::

*Go deeper: your state is in an encrypted S3 backend — what's still exposed, and who can read that secret?*

**Keywords** — `sensitive = redaction not encryption · plaintext in state · TF_VAR_* · Vault/Secrets Manager · encryption at rest · random_password`

### New answer (vi)
**Chốt** — Không. `sensitive = true` chỉ che giá trị khỏi output CLI và plan log — nó không mã hóa gì cả, và password vẫn được ghi plaintext vào state file. Bảo vệ thật nghĩa là giữ secret ngoài Git và siết chặt chính state.

**Cơ chế** — Terraform phải ghi lại cái nó đã đặt, nên giá trị vẫn rơi vào state. Xử lý đúng: (1) giữ secret ngoài `.tf`/`.tfvars` trong Git — nạp qua biến môi trường `TF_VAR_*`, một data source từ secrets manager (Vault, AWS Secrets Manager), hoặc CI secret store; (2) bảo vệ state — remote backend với encryption at rest, TLS khi truyền, và IAM chặt để chỉ pipeline đọc được; (3) ưu tiên để cloud *tự sinh* secret (một managed random password) để nó không bao giờ đi qua laptop của bạn.

:::muted
**Trade-off** — Kéo secret từ Vault/Secrets Manager loại nó khỏi Git nhưng thêm một dependency lúc chạy và một câu hỏi bootstrap (ai provision cái kho secret?). `random_password` tiện nhưng giá trị vẫn rơi vào state — bạn đã dời chứ chưa loại bỏ phơi nhiễm. Tư thế thực dụng: giảm thiểu *nơi* secret xuất hiện (không bao giờ Git, không bao giờ log) và siết chặt cái một-nơi nó buộc phải tồn tại.
:::

:::muted
**Bẫy thường gặp** — Các team thường xuyên commit `terraform.tfstate` hoặc một `*.tfvars` đầy password vào repo, rò rỉ mọi credential cho bất kỳ ai có quyền đọc — và vào lịch sử Git mãi mãi, kể cả sau khi xóa. `sensitive` cũng lan truyền phiền: output dẫn xuất từ giá trị sensitive thì bản thân phải được đánh sensitive, và một giá trị sensitive nội suy vào chuỗi non-sensitive vẫn có thể rò qua nó. Che chắn là nông, không phải một ranh giới bảo mật.
:::

*Đào sâu tiếp: state của bạn nằm trong S3 backend đã mã hóa — cái gì vẫn phơi nhiễm, và ai đọc được secret đó?*

**Từ khoá ăn điểm** — `sensitive = che chứ không mã hóa · plaintext trong state · TF_VAR_* · Vault/Secrets Manager · encryption at rest · random_password`

## 6-card — senior — [Terraform, IaC, Architecture]
**Question:** How does Terraform decide what order to create resources in? When is `depends_on` actually necessary, and why does a `data` source sometimes read stale or missing values on the first apply?
**Verdict:** KEEP — explains the dependency-graph mechanism, a precise "when is depends_on needed" rule, and a first-apply race diagnosis.

### New answer (en)
**TL;DR** — Terraform builds a dependency graph from references and applies in topological order; most edges are implicit. `depends_on` is only needed for a real ordering requirement with no data reference between the resources. A `data` source reads stale/empty on first apply when it queries something Terraform is creating in the same run without a dependency edge.

**How it works** — If resource B references `aws_vpc.main.id`, Terraform infers B comes after the VPC — no annotation. You only reach for `depends_on` when ordering matters but nothing is interpolated — e.g. an app instance that needs an IAM policy attached before boot but never reads the policy's attributes. The graph also enables safe parallelism: independent resources create concurrently. A `data` source is slotted in by its references; with no edge to a resource being created this run, it may read before that thing exists.

:::muted
**Trade-off** — Implicit dependencies are self-maintaining and precise — prefer them. `depends_on` is blunt: it forces ordering on the *entire* resource and everything it contains, over-serialising the graph and slowing applies, and it's easy to sprinkle defensively until the real data flow is obscured. For data sources depending on created resources, the clean fix is to reference the resource attribute directly (an implicit edge) rather than bolt on `depends_on`.
:::

:::muted
**Common pitfall** — The classic first-apply bug: a `data` source reads a not-yet-created resource, returns empty/old data, and dependents get wrong inputs — or the plan can't resolve because the value is unknown until apply. Hidden ordering needs cause intermittent failures that *look* random because parallel scheduling changes the race each run. Circular dependencies (A→B→A) make Terraform refuse to build the graph — usually a sign to merge two resources or extract an attribute.
:::

*Go deeper: you genuinely need a `data` lookup of a resource created in the same config — how do you make it deterministic without `depends_on` everywhere?*

**Keywords** — `dependency graph · topological order · implicit vs explicit deps · depends_on · data source race · unknown at plan time · cycle`

### New answer (vi)
**Chốt** — Terraform xây một dependency graph từ các tham chiếu và apply theo thứ tự topo; đa số cạnh là ngầm định. `depends_on` chỉ cần khi có yêu cầu thứ tự thật mà không có tham chiếu dữ liệu nào giữa các resource. Một `data` source đọc cũ/rỗng ở lần apply đầu khi nó truy vấn thứ Terraform đang tạo trong cùng lần chạy mà không có cạnh dependency.

**Cơ chế** — Nếu resource B tham chiếu `aws_vpc.main.id`, Terraform suy ra B sau VPC — không cần chú thích. Bạn chỉ dùng `depends_on` khi thứ tự quan trọng nhưng không nội suy gì — ví dụ một app instance cần một IAM policy gắn trước khi boot nhưng không bao giờ đọc thuộc tính của policy đó. Graph cũng cho phép song song an toàn: các resource độc lập tạo đồng thời. Một `data` source được cài vào qua các tham chiếu của nó; không có cạnh tới resource đang tạo lần này, nó có thể đọc trước khi thứ đó tồn tại.

:::muted
**Trade-off** — Dependency ngầm tự bảo trì và chính xác — hãy ưu tiên chúng. `depends_on` là công cụ thô: nó ép thứ tự lên *toàn bộ* resource và mọi thứ bên trong, khiến graph quá tuần tự và chậm apply, và dễ rắc một cách phòng thủ tới khi luồng dữ liệu thật bị che mờ. Với data source phụ thuộc resource được tạo, cách sửa sạch là tham chiếu trực tiếp thuộc tính resource (một cạnh ngầm) thay vì gắn thêm `depends_on`.
:::

:::muted
**Bẫy thường gặp** — Bug kinh điển lần-apply-đầu: một `data` source đọc resource chưa được tạo, trả về dữ liệu rỗng/cũ, nên resource phụ thuộc nhận input sai — hoặc plan không resolve được vì giá trị unknown tới lúc apply. Nhu cầu thứ tự ẩn gây lỗi chập chờn *trông* ngẫu nhiên vì lịch song song đổi race mỗi lần chạy. Dependency vòng (A→B→A) khiến Terraform từ chối xây graph — thường là dấu hiệu nên gộp hai resource hoặc tách một thuộc tính ra.
:::

*Đào sâu tiếp: bạn thực sự cần một `data` lookup của resource được tạo trong cùng config — làm sao cho nó deterministic mà không rắc `depends_on` khắp nơi?*

**Từ khoá ăn điểm** — `dependency graph · thứ tự topo · implicit vs explicit deps · depends_on · data source race · unknown at plan time · cycle`

## 7-card — staff — [Terraform, IaC, Architecture]
**Question:** Your Terraform is one giant root module that 12 engineers apply from their laptops. Plans take 20 minutes and one bad apply can touch everything. Design how you'd run Terraform safely at team scale.
**Verdict:** KEEP — open-ended staff-level system design with explicit trade-offs and failure modes; the full arc applies.

### New answer (en)
**TL;DR** — Three moves: shrink blast radius by splitting the monolith into smaller, independently-applied state units along ownership/lifecycle lines; take apply off laptops and into CI/CD or Terraform Cloud with the only credentials in the pipeline; and add guardrails — plan-on-PR review, policy-as-code, pinned versions, scheduled drift detection.

**How it works** — (1) Split along ownership/lifecycle boundaries (networking, data, per-service), wiring units with remote-state outputs — a bad apply now touches one unit and plans are fast because each state is small. (2) Humans open PRs, the pipeline plans, a reviewer approves, the pipeline applies against a single shared locked backend. (3) `plan` posts the diff on every PR, policy-as-code (OPA/Sentinel/`tflint`) blocks "no public S3 / must-have-tags / no oversized instances," `~>` pins module and provider versions so upgrades are deliberate, and drift detection runs on a schedule.

:::muted
**Trade-off** — Splitting state cuts blast radius and plan time but multiplies states to bootstrap, wire, and order, making cross-state dependencies explicit coordination. Centralising apply removes "works on my laptop" and adds audit + approval, at the cost of slower iteration and a pipeline you must keep healthy. Policy-as-code prevents whole classes of mistakes but adds friction and false-positives to tune. The split *points* matter more than the count: cut along blast-radius and ownership lines.
:::

:::muted
**Common pitfall** — The monolith's real danger is the 20-minute plan nobody reads — reviewers rubber-stamp a 400-resource diff and miss the line that drops a database. Laptop applies mean inconsistent provider/CLI versions, leaked credentials, and no audit trail of who changed prod. Pinning everything but never upgrading on a cadence strands you on an ancient provider with a painful jump later. And splitting too finely — dozens of micro-states with brittle output-wiring — can be harder to reason about than one well-bounded module.
:::

*Go deeper: how do you sequence the migration from monolith to split states without a risky big-bang `state mv`?*

**Keywords** — `blast radius · split state · remote-state outputs · CI/CD apply · locked backend · policy-as-code (OPA/Sentinel/tflint) · version pinning ~> · drift detection`

### New answer (vi)
**Chốt** — Ba nước đi: thu nhỏ blast radius bằng cách tách monolith thành các đơn vị state nhỏ hơn, apply độc lập, theo lằn quyền-sở-hữu/vòng-đời; đưa apply ra khỏi laptop vào CI/CD hoặc Terraform Cloud với credential duy nhất trong pipeline; và thêm lan can — plan-on-PR review, policy-as-code, ghim version, drift detection theo lịch.

**Cơ chế** — (1) Tách theo ranh giới quyền-sở-hữu/vòng-đời (networking, data, từng service), nối các đơn vị bằng remote-state output — một apply tệ giờ chỉ chạm một đơn vị và plan nhanh vì mỗi state nhỏ. (2) Con người mở PR, pipeline plan, một reviewer duyệt, pipeline apply lên một backend dùng chung đã khóa. (3) `plan` đăng diff trên mọi PR, policy-as-code (OPA/Sentinel/`tflint`) chặn "không S3 public / phải có tag / không instance quá khổ," `~>` ghim version module và provider để nâng cấp có chủ đích, và drift detection chạy theo lịch.

:::muted
**Trade-off** — Tách state cắt blast radius và thời gian plan nhưng nhân lên số state phải bootstrap, nối và sắp thứ tự, biến phụ thuộc liên-state thành phối hợp tường minh. Tập trung apply loại bỏ "chạy được trên laptop tôi" và thêm audit + duyệt, đổi lại lặp chậm hơn và một pipeline bạn phải giữ khỏe. Policy-as-code ngăn cả lớp lỗi nhưng thêm ma sát và false-positive cần tinh chỉnh. *Điểm* tách quan trọng hơn số lượng: cắt theo lằn blast-radius và quyền sở hữu.
:::

:::muted
**Bẫy thường gặp** — Nguy hiểm thật của monolith là cái plan 20 phút không ai đọc — reviewer đóng dấu một diff 400-resource và bỏ sót đúng dòng xóa một database. Apply từ laptop nghĩa là version provider/CLI không nhất quán, credential rò rỉ, và không dấu vết audit ai đã đổi prod. Ghim mọi thứ nhưng không bao giờ nâng cấp theo nhịp khiến bạn mắc kẹt trên một provider cổ với một cú nhảy đau sau này. Và tách quá vụn — hàng chục micro-state với output-wiring giòn — có thể khó suy luận hơn một module được khoanh vùng tốt.
:::

*Đào sâu tiếp: bạn sắp xếp việc di chuyển từ monolith sang state tách thế nào mà không cần một cú `state mv` big-bang rủi ro?*

**Từ khoá ăn điểm** — `blast radius · tách state · remote-state output · CI/CD apply · locked backend · policy-as-code (OPA/Sentinel/tflint) · ghim version ~> · drift detection`
