# 2-devops-mastery / 5-iam-and-cloud-security
Summary: kept 8, delete 0 of 8

## 0-card — middle — [IAM, Security]
**Question:** A new hire asks why your project grants the analytics team a single shared "ReadOnly" group instead of attaching a policy to each person, and why the storage bucket itself also carries a policy. Walk through identities vs roles vs policies, and identity-based vs resource-based policies, framing it around least privilege.
**Verdict:** KEEP — Scenario-driven conceptual question with real "why", trade-offs, and a cross-cloud design framing; scales with seniority.

### New answer (en)
**TL;DR** — You attach the ReadOnly policy to a *group* so membership drives access — one change adds/removes a person with consistent permissions — and the bucket carries its own *resource-based* policy because access is governed from both the principal and the resource. Least privilege means starting from zero and granting only the actions the job needs.

**How it works** — An *identity* is the principal that acts (a user or a group of users). A *policy* is the JSON document of allowed/denied actions. A *role* is an identity with policies attached that is meant to be *assumed*, not logged into. *Identity-based* policies live on the principal ("this user/role may do X"); *resource-based* policies live on the resource (the bucket: "these principals may touch me"), which is also how cross-account access is granted. AWS uses IAM users/groups/roles + JSON policies; GCP binds members to predefined/custom roles via IAM bindings; Azure uses Entra ID identities with RBAC role assignments at a scope.

:::muted
**Trade-off** — Groups and managed/predefined roles scale and stay auditable but are coarse, so people accumulate more than they use. Fine-grained custom policies reach true least privilege but multiply the documents to author and review. Spreading authorization across both principal and resource means you must read both sides to know who really has access.
:::

:::muted
**Common pitfall** — Attaching broad policies directly to individuals: access drifts, nobody can answer "who can read this bucket," and offboarding misses stale grants. Equally dangerous is reasoning about only one side — a locked-down identity policy can sit next to a permissive bucket policy that silently opens access.
:::

*Go deeper — How would you actually answer "who can read this bucket?" across an account — what tooling (e.g. IAM Access Analyzer) makes effective access auditable?*

**Keywords** — `identity vs role vs policy` · `identity-based vs resource-based` · `least privilege` · `IAM binding` · `RBAC role assignment`

### New answer (vi)
**Chốt** — Bạn gắn policy ReadOnly vào *group* để việc là thành viên điều khiển quyền truy cập — thêm/bớt một người chỉ là một thay đổi với permission nhất quán — và bucket mang *resource-based* policy riêng vì quyền được điều khiển từ cả phía principal lẫn phía resource. Least privilege nghĩa là bắt đầu từ con số không và chỉ cấp đúng action mà công việc cần.

**Cơ chế** — *Identity* là principal thực hiện hành động (một user hoặc một group các user). *Policy* là tài liệu JSON liệt kê action được allow/deny. *Role* là một identity có policy gắn vào nhưng được thiết kế để *assume* chứ không phải đăng nhập trực tiếp. *Identity-based* policy nằm trên principal ("user/role này được làm X"); *resource-based* policy nằm trên resource (bucket: "các principal này được chạm vào tôi"), đây cũng là cách cấp quyền cross-account. AWS dùng IAM user/group/role + policy JSON; GCP gắn member vào predefined/custom role qua IAM binding; Azure dùng identity của Entra ID với RBAC role assignment tại một scope.

:::muted
**Trade-off** — Group và managed/predefined role scale tốt và dễ audit nhưng khá thô, nên người ta tích lũy nhiều quyền hơn mức dùng. Custom policy chi tiết đạt least privilege thực sự nhưng làm tăng số tài liệu phải viết và review. Rải authorization trên cả principal lẫn resource buộc bạn đọc cả hai phía mới biết ai thực sự có quyền.
:::

:::muted
**Bẫy thường gặp** — Gắn policy rộng trực tiếp cho từng cá nhân: quyền bị trôi dạt, không ai trả lời được "ai đọc được bucket này", và lúc offboard thì bỏ sót grant cũ. Nguy hiểm không kém là chỉ suy luận một phía — identity policy rất chặt có thể nằm cạnh một bucket policy nới lỏng âm thầm mở quyền.
:::

*Đào sâu tiếp — Bạn sẽ thực sự trả lời "ai đọc được bucket này?" trên toàn account thế nào — công cụ nào (ví dụ IAM Access Analyzer) làm cho effective access audit được?*

**Từ khoá ăn điểm** — `identity vs role vs policy` · `identity-based vs resource-based` · `least privilege` · `IAM binding` · `RBAC role assignment`

## 1-card — senior — [IAM, Security]
**Question:** A code review reveals an app server reads S3 using a long-lived access key baked into an environment variable on the box. The author argues it "works fine." Explain why the instance should assume a role for temporary credentials instead, and how that limits blast radius if the box is compromised.
**Verdict:** KEEP — Senior diagnosis + design question with a real compromise-scenario trade-off; invites IMDS/SSRF follow-ups.

### New answer (en)
**TL;DR** — Attach an identity to the workload itself (an instance profile / IAM role, IRSA for pods) and let the platform mint short-lived, auto-rotating STS credentials. No static secret exists to leak, and a compromise is capped to that role's scope and a short time window instead of an unexpiring, copy-everywhere key.

**How it works** — The instance metadata service hands the SDK temporary STS credentials that refresh transparently — nothing is written to disk, baked into an AMI, committed, or pasted into Slack. GCP uses Workload Identity / attached service accounts; Azure uses managed identities. Permissions are scoped to exactly what the workload needs, and every call is auditable back to the role. A static key, by contrast, doesn't expire, attributes only to "whoever has it," and revoking it means rotating a secret possibly copied across many hosts — often breaking things mid-flight.

:::muted
**Trade-off** — Temporary credentials remove storage/rotation but add a dependency on the metadata/identity endpoint and correct trust config; misconfigure it and the workload simply can't authenticate. Roles are bound to where the workload runs, so moving off-platform (a laptop, third-party CI) needs OIDC federation, not a copied key. You trade "one secret that works everywhere" for an identity correct in exactly one context.
:::

:::muted
**Common pitfall** — Two traps survive the switch: an over-broad role still hands an attacker wide access for the window, and an exposed metadata endpoint (SSRF, or a sidecar that can reach it) lets an attacker steal the role's tokens. Block metadata access from untrusted code and require IMDSv2-style hop limits.
:::

*Go deeper — Walk through exactly how an SSRF in this app could exfiltrate the role's credentials, and how IMDSv2's token + hop-limit defends against it.*

**Keywords** — `instance profile` · `IRSA` · `STS temporary credentials` · `IMDSv2` · `SSRF` · `OIDC federation` · `blast radius`

### New answer (vi)
**Chốt** — Gắn một identity vào chính workload (instance profile / IAM role, IRSA cho pod) và để nền tảng cấp credential STS ngắn hạn tự xoay vòng. Không có secret tĩnh nào để lộ, và khi bị chiếm thiệt hại bị giới hạn trong scope của role đó và một khung thời gian ngắn, thay vì một key không hết hạn bị copy khắp nơi.

**Cơ chế** — Instance metadata service đưa cho SDK temporary credential STS tự refresh trong suốt — không gì bị ghi ra đĩa, bake vào AMI, commit, hay dán vào Slack. GCP dùng Workload Identity / service account gắn vào; Azure dùng managed identity. Permission được scope đúng những gì workload cần, và mọi lời gọi audit ngược về role được. Ngược lại, key tĩnh không hết hạn, attribution chỉ là "ai cầm key", và thu hồi nghĩa là xoay một secret có thể đã copy khắp nhiều host — thường làm vỡ mọi thứ giữa chừng.

:::muted
**Trade-off** — Temporary credential loại bỏ bài toán lưu trữ/rotation nhưng thêm phụ thuộc vào endpoint metadata/identity và cấu hình trust đúng; sai cấu hình thì workload đơn giản là không xác thực được. Role gắn với nơi workload chạy, nên đưa app ra ngoài nền tảng (laptop, CI bên thứ ba) cần OIDC federation chứ không phải copy key. Bạn đánh đổi "một secret chạy mọi nơi" lấy một identity chỉ đúng trong đúng một ngữ cảnh.
:::

:::muted
**Bẫy thường gặp** — Hai bẫy còn lại sau khi chuyển: một role quá rộng vẫn trao cho kẻ tấn công quyền rộng trong khung đó, và một metadata endpoint bị phơi (SSRF, hoặc một sidecar chạm tới được) cho phép kẻ tấn công trộm token của role. Hãy chặn truy cập metadata từ code không tin cậy và bắt buộc hop limit kiểu IMDSv2.
:::

*Đào sâu tiếp — Hãy đi qua chính xác cách một SSRF trong app này có thể rút credential của role, và token + hop-limit của IMDSv2 phòng vệ ra sao.*

**Từ khoá ăn điểm** — `instance profile` · `IRSA` · `STS temporary credentials` · `IMDSv2` · `SSRF` · `OIDC federation` · `blast radius`

## 2-card — middle — [Secrets, Security]
**Question:** Your team keeps the production database password in a `.env` file committed to the repo and in the Terraform state. Compliance flags it. Design a secrets-management approach: where the secret lives, how the app gets it, how it rotates, and what envelope encryption buys you.
**Verdict:** KEEP — Multi-part design question (storage, retrieval, rotation, envelope encryption) with real trade-offs and failure modes.

### New answer (en)
**TL;DR** — Move the password into a dedicated secrets store (AWS Secrets Manager, GCP Secret Manager, Azure Key Vault, or Vault) and grant the app's *role* read on just that one secret. The app fetches it at runtime via its workload identity — nothing hardcoded, committed, or in Terraform state — with managed rotation and envelope encryption underneath.

**How it works** — The app reads the secret from the store's API at startup or per-request using its workload identity. Enable managed rotation so the store periodically generates a new password, updates the database, and serves the new value — ideally with dual-secret/two-version overlap so in-flight connections don't break. *Envelope encryption*: a KMS/Key Vault master key (KEK) encrypts a per-secret data key (DEK), and the DEK encrypts the payload — so bulk data is encrypted locally while only the small DEK round-trips to KMS, keeping the KEK in the HSM and minimising KMS calls.

:::muted
**Trade-off** — A central store adds a runtime dependency and a hard outage radius: if it's down apps may fail to start, so cache short-lived and design for graceful degradation. Automatic rotation is safest but requires the app to re-read on auth failure rather than caching forever, and rotation hooks must understand the target. Envelope encryption's two-tier key hierarchy is one more thing to reason about when auditing who can decrypt.
:::

:::muted
**Common pitfall** — Hardcoded secrets are unrevocable in practice: once a credential is in git history or TF state it's effectively public to anyone with repo/state access, and rotating it is a fire drill. A subtler failure is granting `secretsmanager:GetSecretValue` on `*` instead of one ARN — now a compromised app reads every secret. Scope reads to the exact secret, encrypt and lock down TF state, rotate on schedule (and immediately on suspected exposure), and never log a fetched secret.
:::

*Go deeper — How do you rotate a database password with zero downtime when many app instances hold live connection pools?*

**Keywords** — `secrets store` · `workload identity` · `managed rotation` · `envelope encryption` · `KEK / DEK` · `scope to ARN, not *`

### New answer (vi)
**Chốt** — Đưa mật khẩu vào một secrets store chuyên dụng (AWS Secrets Manager, GCP Secret Manager, Azure Key Vault, hoặc Vault) và cấp cho *role* của app quyền đọc đúng một secret đó. App lấy nó lúc runtime bằng workload identity của mình — không gì hardcode, commit, hay nằm trong Terraform state — với managed rotation và envelope encryption bên dưới.

**Cơ chế** — App đọc secret từ API của store lúc khởi động hoặc theo từng request bằng workload identity. Bật managed rotation để store định kỳ tạo mật khẩu mới, cập nhật database, và phục vụ giá trị mới — lý tưởng là có overlap dual-secret/hai-version để connection đang chạy không vỡ. *Envelope encryption*: một master key KMS/Key Vault (KEK) mã hóa một data key per-secret (DEK), và DEK mã hóa payload — nên khối dữ liệu lớn được mã hóa cục bộ trong khi chỉ DEK nhỏ đi vòng tới KMS, giữ KEK trong HSM và giảm thiểu số lời gọi KMS.

:::muted
**Trade-off** — Một store tập trung thêm một phụ thuộc runtime và một bán kính sự cố lớn: nếu nó sập, app có thể không khởi động được, nên cache ngắn hạn và thiết kế để degrade mềm mại. Rotation tự động an toàn nhất nhưng đòi hỏi app đọc lại khi auth thất bại thay vì cache mãi mãi, và hook rotation phải hiểu hệ thống đích. Phân cấp key hai tầng của envelope encryption là một thứ nữa phải suy luận khi audit ai có quyền decrypt.
:::

:::muted
**Bẫy thường gặp** — Secret hardcode trên thực tế không thể thu hồi: một khi credential đã nằm trong git history hay TF state, nó coi như công khai với bất kỳ ai có quyền truy cập repo/state, và xoay nó là một màn chữa cháy. Một failure tinh vi hơn là cấp `secretsmanager:GetSecretValue` trên `*` thay vì một ARN — giờ một app bị chiếm đọc được mọi secret. Hãy scope quyền đọc đúng secret cụ thể, mã hóa và khóa chặt TF state, rotate theo lịch (và ngay khi nghi ngờ lộ), và đừng bao giờ log một secret đã lấy về.
:::

*Đào sâu tiếp — Bạn rotate mật khẩu database với zero-downtime thế nào khi nhiều app instance đang giữ connection pool sống?*

**Từ khoá ăn điểm** — `secrets store` · `workload identity` · `managed rotation` · `envelope encryption` · `KEK / DEK` · `scope to ARN, not *`

## 3-card — senior — [IAM, Security]
**Question:** A developer has an Allow on `s3:GetObject` from their group, but their calls to one sensitive bucket still fail with AccessDenied, while other buckets work. Explain how allow/deny is actually evaluated, why an explicit deny wins, and where permission boundaries fit.
**Verdict:** KEEP — Diagnosis question about policy evaluation order with a genuine "the Allow is real but something denies" puzzle; senior depth.

### New answer (en)
**TL;DR** — Evaluation is default-deny with "explicit Deny > Allow > implicit deny": the developer's Allow is real, but a separate explicit Deny — a bucket policy, an SCP, or a permission boundary that doesn't include that bucket — is overriding it. A permission boundary is a *ceiling*, not a grant, so effective access is the intersection of the boundary and the granted policies.

**How it works** — The engine gathers all applicable policies — identity-based, resource-based, permission boundaries, and (in AWS) SCPs/session policies — and any one explicit Deny anywhere kills the request. A permission boundary doesn't grant anything; it caps the maximum an identity can ever be granted. So to debug this you read *every* layer on that one sensitive bucket, not just the group Allow. GCP is allow-only with deny policies layered on; Azure RBAC similarly resolves explicit deny assignments over allows.

:::muted
**Trade-off** — An explicit Deny is a blunt, reliable guardrail — a new Allow can't accidentally override it — which is why it's used for hard org rules, but it's easy to make too broad and break legitimate access in confusing ways. Permission boundaries safely delegate policy creation to teams (they can grant, never above the ceiling), at the cost of a second layer everyone must remember when access "should work but doesn't."
:::

:::muted
**Common pitfall** — Reasoning from a single Allow and assuming access; effective access is the combination of every layer. The opposite failure is over-relying on Allows for security: a missing Deny plus one overly broad Allow somewhere silently opens access. Put hard prohibitions (no public buckets, no leaving the region) as explicit Denies at the org level rather than hoping no Allow ever contradicts them.
:::

*Go deeper — Given this exact symptom, how would you use the IAM policy simulator / "why was this denied" tooling to find which statement produced the Deny?*

**Keywords** — `default-deny` · `explicit Deny > Allow > implicit deny` · `permission boundary` · `intersection` · `SCP` · `bucket policy`

### New answer (vi)
**Chốt** — Đánh giá là default-deny với "explicit Deny > Allow > implicit deny": Allow của developer là thật, nhưng một explicit Deny khác — một bucket policy, một SCP, hoặc một permission boundary không bao gồm bucket đó — đang ghi đè nó. Permission boundary là một *trần*, không phải một grant, nên quyền hiệu lực là *giao* của boundary và các policy được cấp.

**Cơ chế** — Engine gom mọi policy áp dụng được — identity-based, resource-based, permission boundary, và (trong AWS) SCP/session policy — và bất kỳ một explicit Deny nào ở đâu đó đều giết request. Permission boundary không cấp gì cả; nó giới hạn mức tối đa một identity có thể được cấp. Nên để debug việc này, bạn đọc *mọi* tầng trên đúng bucket nhạy cảm đó, không chỉ Allow của group. GCP là allow-only với deny policy phủ thêm lên; Azure RBAC tương tự giải quyết explicit deny assignment thắng allow.

:::muted
**Trade-off** — Một explicit Deny là một guardrail thô nhưng đáng tin — một Allow mới không thể ghi đè nó một cách tình cờ — đó là lý do nó được dùng cho các quy tắc cứng của tổ chức, nhưng rất dễ làm nó quá rộng và phá vỡ truy cập hợp lệ theo những cách khó hiểu. Permission boundary ủy quyền việc tạo policy cho team một cách an toàn (họ có thể cấp, không bao giờ vượt trần), đổi lại là một tầng thứ hai ai cũng phải nhớ khi quyền "đáng ra phải chạy mà lại không".
:::

:::muted
**Bẫy thường gặp** — Suy luận từ một Allow duy nhất rồi cho rằng có quyền; quyền hiệu lực là tổ hợp của mọi tầng. Failure ngược lại là quá dựa vào Allow để bảo mật: một Deny bị thiếu cộng một Allow quá rộng ở đâu đó âm thầm mở quyền. Hãy đặt các lệnh cấm cứng (không bucket public, không rời region) thành explicit Deny ở cấp tổ chức thay vì hy vọng không có Allow nào mâu thuẫn với chúng.
:::

*Đào sâu tiếp — Với đúng triệu chứng này, bạn dùng IAM policy simulator / công cụ "tại sao bị deny" thế nào để tìm ra statement nào tạo ra Deny?*

**Từ khoá ăn điểm** — `default-deny` · `explicit Deny > Allow > implicit deny` · `permission boundary` · `intersection` · `SCP` · `bucket policy`

## 4-card — senior — [IAM, Federation]
**Question:** Your CI pipeline deploys into three separate cloud accounts, and right now each account's long-lived access key is stored as a CI secret. Engineers also create personal IAM users per account. Redesign this with cross-account assume-role and federation so no long-lived keys exist for humans or CI.
**Verdict:** KEEP — Full redesign question spanning OIDC, cross-account trust, and human SSO; senior-level trade-offs and trust-policy pitfalls.

### New answer (en)
**TL;DR** — For CI, use OIDC federation — the pipeline presents a signed identity token and each target account has a role whose *trust policy* accepts that issuer scoped to the exact repo/branch/environment, exchanged via STS for short-lived credentials. For humans, replace per-account IAM users with SSO/IdP federation. No long-lived keys for either.

**How it works** — CI: the account's STS swaps the OIDC token for temporary credentials — no stored key. Cross-account between your own accounts: a role in the target account trusts the source account/identity, and callers `AssumeRole` for temporary credentials — the trust policy says *who* may assume, the permission policy says *what* they can do. Humans authenticate once against the IdP (AWS IAM Identity Center, GCP Workforce Identity, Entra ID) and assume roles into accounts. GCP uses Workload Identity Federation for CI and service-account impersonation across projects; Azure uses federated credentials and managed identities.

:::muted
**Trade-off** — Federation eliminates secret-sprawl and rotation and gives central, MFA-backed, centrally-revocable control, but adds dependence on the IdP (an outage blocks access) and on tightly-scoped trust policies that are easy to get subtly wrong. Short-lived sessions are safer but long jobs must refresh, and very granular per-repo/branch trust is more secure yet more config to maintain.
:::

:::muted
**Common pitfall** — An over-broad trust policy: a wildcarded OIDC `sub` (or trusting an entire org instead of one repo/branch) lets *any* workflow in that scope assume your deploy role and push to prod. Equally dangerous is leaving the old long-lived keys active "just in case." Pin trust conditions to the narrowest principal, delete the static keys once federation works, prefer many small scoped roles over one god-role, and log assume-role events.
:::

*Go deeper — What exactly do you put in the GitHub Actions OIDC trust condition to pin it to one repo and one branch, and what does each claim (`sub`, `aud`) defend against?*

**Keywords** — `OIDC federation` · `trust policy` · `AssumeRole` · `STS` · `IAM Identity Center` · `sub condition` · `Workload Identity Federation`

### New answer (vi)
**Chốt** — Cho CI, dùng OIDC federation — pipeline trình một identity token đã ký và mỗi account đích có một role mà *trust policy* chấp nhận issuer đó, scope đúng repo/branch/environment, đổi qua STS lấy credential ngắn hạn. Cho con người, thay IAM user per-account bằng SSO/federation qua IdP. Không key dài hạn nào cho cả hai.

**Cơ chế** — CI: STS của account đổi OIDC token lấy temporary credential — không key nào lưu lại. Cross-account giữa các account của bạn: một role trong account đích tin tưởng account/identity nguồn, và caller `AssumeRole` để lấy temporary credential — trust policy nói *ai* được assume, permission policy nói *làm gì*. Con người xác thực một lần với IdP (AWS IAM Identity Center, GCP Workforce Identity, Entra ID) rồi assume role vào các account. GCP dùng Workload Identity Federation cho CI và service-account impersonation xuyên project; Azure dùng federated credential và managed identity.

:::muted
**Trade-off** — Federation loại bỏ tình trạng secret rải khắp và gánh nặng rotation, cho kiểm soát tập trung có MFA và thu hồi tập trung được, nhưng thêm phụ thuộc vào IdP (IdP sập là chặn truy cập) và vào các trust policy scope chặt mà rất dễ sai một cách tinh vi. Session ngắn hạn an toàn hơn nhưng job dài phải refresh, và điều kiện trust rất chi tiết theo từng repo/branch thì bảo mật hơn nhưng cũng nhiều config phải bảo trì hơn.
:::

:::muted
**Bẫy thường gặp** — Một trust policy quá rộng: một điều kiện OIDC `sub` để wildcard (hoặc tin tưởng cả một org thay vì đúng một repo/branch) cho phép *bất kỳ* workflow nào trong scope đó assume role deploy của bạn và đẩy lên prod. Nguy hiểm không kém là để các key dài hạn cũ còn sống "đề phòng". Hãy ghim điều kiện trust vào principal hẹp nhất, xóa key tĩnh một khi federation chạy, ưu tiên nhiều role nhỏ có scope thay vì một god-role, và log các sự kiện assume-role.
:::

*Đào sâu tiếp — Bạn đặt chính xác gì vào điều kiện trust OIDC của GitHub Actions để ghim nó vào đúng một repo và một branch, và mỗi claim (`sub`, `aud`) phòng vệ điều gì?*

**Từ khoá ăn điểm** — `OIDC federation` · `trust policy` · `AssumeRole` · `STS` · `IAM Identity Center` · `sub condition` · `Workload Identity Federation`

## 5-card — middle — [Encryption, Security]
**Question:** An auditor asks you to prove that a customer-data bucket and its database are "encrypted, with rotating keys, and only the billing service can read them," and that nothing talks to them in plaintext. Explain encryption at rest and in transit, KMS-managed keys, rotation, who can decrypt, and enforcing TLS.
**Verdict:** KEEP — Audit/proof scenario covering at-rest, in-transit, key policy, and rotation; real "key policy is the access control" insight.

### New answer (en)
**TL;DR** — Encrypt at rest with a KMS key whose *key policy* grants `kms:Decrypt` only to the billing service's role (so the key policy — not just storage access — controls who can decrypt), turn on automatic key rotation, and enforce TLS in transit with an explicit deny on non-TLS. To the auditor you point at the key policy, the rotation setting, and the deny-plaintext policy as concrete proof.

**How it works** — At rest: the service encrypts each object/page with a data key wrapped by the KMS master key (envelope encryption), so "who can decrypt" is governed by the KMS key policy/IAM. Automatic rotation rolls the master key material on a schedule while the key ID stays stable. In transit: require TLS end to end — minimum TLS versions, and enforcement such as an S3 bucket policy that denies any request where `aws:SecureTransport` is false, plus a database that rejects non-TLS connections. (AWS KMS, GCP Cloud KMS, Azure Key Vault keys.)

:::muted
**Trade-off** — Cloud-managed keys are simplest and rotate for you; customer-managed keys (CMKs) give control over the key policy, rotation cadence, and revocation by disabling the key — at the cost of operating it and risking lockout if you delete it. Strict TLS-only and decrypt-scoped-to-one-role maximise security but can break legacy clients, so roll out carefully. Per-service key segregation limits blast radius but multiplies keys.
:::

:::muted
**Common pitfall** — Enabling bucket encryption while leaving the KMS key policy wide open is theatre — anyone who can call `Decrypt` reads the data, so the *key* policy is the real access control, not the encrypt toggle. The other gap is "encrypted at rest" with plaintext in transit: without an explicit deny on non-TLS a client can still connect unencrypted unnoticed. Also remember disabling/scheduling-deletion of a CMK makes all data under it unreadable — guard that action tightly.
:::

*Go deeper — How does automatic key rotation keep old ciphertext readable after the key material rolls — what stays stable and what actually changes?*

**Keywords** — `encryption at rest / in transit` · `KMS key policy` · `kms:Decrypt scoped to role` · `envelope encryption` · `aws:SecureTransport` · `CMK rotation`

### New answer (vi)
**Chốt** — Mã hóa at rest bằng một KMS key mà *key policy* của nó chỉ cấp `kms:Decrypt` cho role của billing service (nên key policy — không chỉ quyền truy cập storage — điều khiển ai decrypt được), bật key rotation tự động, và ép TLS in transit bằng một explicit deny với non-TLS. Với auditor, bạn chỉ vào key policy, thiết lập rotation, và policy deny-plaintext làm bằng chứng cụ thể.

**Cơ chế** — At rest: service mã hóa mỗi object/page bằng một data key được bọc bởi master key của KMS (envelope encryption), nên "ai decrypt được" do key policy/IAM của KMS điều khiển. Rotation tự động xoay vật liệu master key theo lịch trong khi key ID vẫn ổn định. In transit: bắt buộc TLS đầu cuối — đặt phiên bản TLS tối thiểu, và ép nó như một bucket policy S3 deny mọi request mà `aws:SecureTransport` là false, cộng một database từ chối connection không TLS. (AWS KMS, GCP Cloud KMS, Azure Key Vault key.)

:::muted
**Trade-off** — Key do cloud quản lý đơn giản nhất và tự rotate cho bạn; customer-managed key (CMK) cho bạn quyền kiểm soát key policy, nhịp rotation, và thu hồi bằng cách disable key — đổi lại là phải vận hành nó và rủi ro tự khóa mình nếu xóa nó. Ép chỉ-TLS nghiêm ngặt và decrypt-scope-vào-một-role tối đa hóa bảo mật nhưng có thể làm vỡ các client cũ, nên rollout cần cẩn thận. Tách key per-service giới hạn blast radius nhưng làm tăng số key.
:::

:::muted
**Bẫy thường gặp** — Bật mã hóa bucket trong khi để key policy của KMS mở toang là diễn — bất kỳ ai gọi được `Decrypt` đều đọc được dữ liệu, nên *key* policy mới là kiểm soát truy cập thật, không phải cái toggle encrypt. Khoảng hở khác là "mã hóa at rest" nhưng plaintext in transit: thiếu một explicit deny với non-TLS, một client vẫn có thể kết nối không mã hóa mà không bị nhận ra. Cũng nhớ rằng disable/lên-lịch-xóa một CMK khiến mọi dữ liệu dưới nó không đọc được — hãy canh chặt hành động đó.
:::

*Đào sâu tiếp — Key rotation tự động giữ ciphertext cũ vẫn đọc được sau khi vật liệu key xoay bằng cách nào — cái gì ổn định và cái gì thực sự thay đổi?*

**Từ khoá ăn điểm** — `encryption at rest / in transit` · `KMS key policy` · `kms:Decrypt scoped to role` · `envelope encryption` · `aws:SecureTransport` · `CMK rotation`

## 6-card — senior — [IAM, Security]
**Question:** A microservice has a role with `Action: "*"`, `Resource: "*"` and `iam:PassRole` on everything "so we stop hitting permission errors." Explain the confused-deputy problem, how this enables privilege escalation, and how to scope it down.
**Verdict:** KEEP — Deep security question: confused deputy, PassRole escalation chain, and concrete scoping; strong senior signal.

### New answer (en)
**TL;DR** — A `*`/`*` role with `iam:PassRole` on everything is a maximal *confused deputy*: any compromise of that service inherits every permission in the account, and `PassRole` lets it hand an admin role to a resource it creates and then act as admin. Scope it to the exact actions/ARNs it actually calls, restrict `PassRole` to one named role with a service condition, and cap it with a permission boundary.

**How it works** — A *confused deputy* is a privileged component tricked into using its authority on behalf of a less-privileged caller — the deputy has the rights, the attacker supplies the target. `iam:PassRole` on `*` is the escalation engine: the service can pass an admin role to a resource it can create (an EC2 with an admin instance profile, a Lambda with an admin execution role) and then act as that role, climbing from limited to god. The fix: only the specific actions on the specific ARNs it calls; `PassRole` limited to a named minimal role plus a condition on which service may receive it; permission boundaries so even mistaken grants can't exceed a ceiling. GCP's analogues are broad primitive roles (Owner/Editor) and `iam.serviceAccounts.actAs`; Azure's are Owner/Contributor and roles that can write role assignments.

:::muted
**Trade-off** — Wildcards make today's error messages stop, which is why tired teams reach for them, but they convert any single compromise into total account takeover. Tightly scoped policies and constrained `PassRole` mean more iteration to find the exact actions and more policies to maintain, but cap blast radius to one service's real job. Permission boundaries add a safety net at the cost of a second layer — usually worth it for high-trust services.
:::

:::muted
**Common pitfall** — The deadliest combination is broad permissions *plus* `iam:PassRole`/`actAs` *plus* the ability to create compute or write IAM policies — a direct path from "read-only-looking" service to admin. People also miss that `*` on `iam:CreatePolicyVersion`, `iam:AttachRolePolicy`, or assume-role on a powerful role is escalation even without PassRole. Audit any principal that can grant itself permissions; always pair `PassRole` with a resource ARN and an `iam:PassedToService` condition.
:::

*Go deeper — Walk a concrete escalation chain: starting from this role, how exactly do you go from `PassRole` to running code as an account admin?*

**Keywords** — `confused deputy` · `iam:PassRole` · `iam:PassedToService` · `privilege escalation` · `permission boundary` · `actAs` · `CreatePolicyVersion`

### New answer (vi)
**Chốt** — Một role `*`/`*` với `iam:PassRole` trên mọi thứ là một *confused deputy* tối đa: bất kỳ lần chiếm nào lên service đó đều thừa hưởng mọi permission trong account, và `PassRole` cho phép nó trao một admin role cho một resource nó tạo ra rồi hành động như admin. Hãy scope nó về đúng action/ARN nó thực sự gọi, giới hạn `PassRole` vào một role có tên cộng một điều kiện service, và chặn nó bằng một permission boundary.

**Cơ chế** — *Confused deputy* là một thành phần có đặc quyền bị lừa dùng quyền của mình thay mặt cho một caller ít quyền hơn — deputy có quyền, kẻ tấn công cung cấp mục tiêu. `iam:PassRole` trên `*` là động cơ leo thang: service có thể trao một admin role cho một resource mà nó tạo ra (một EC2 với instance profile admin, một Lambda với execution role admin) rồi hành động như role đó, leo từ hạn chế lên god. Cách sửa: chỉ các action cụ thể trên đúng các ARN nó gọi; `PassRole` giới hạn vào một role tối thiểu có tên cộng một điều kiện về service nào được nhận; permission boundary để ngay cả grant nhầm cũng không vượt trần. Tương đương ở GCP là các primitive role rộng (Owner/Editor) và `iam.serviceAccounts.actAs`; ở Azure là Owner/Contributor và các role ghi được role assignment.

:::muted
**Trade-off** — Wildcard làm các thông báo lỗi hôm nay ngừng lại, đó là lý do các team mệt mỏi với nó, nhưng nó biến bất kỳ một lần bị chiếm nào thành chiếm trọn account. Policy scope chặt và `PassRole` bị ràng buộc nghĩa là phải lặp nhiều hơn để tìm đúng các action và nhiều policy hơn để bảo trì, nhưng giới hạn blast radius vào đúng công việc thật của một service. Permission boundary thêm một lưới an toàn đổi lại một tầng thứ hai — thường đáng giá cho các service được tin tưởng cao.
:::

:::muted
**Bẫy thường gặp** — Tổ hợp chí mạng nhất là permission rộng *cộng* `iam:PassRole`/`actAs` *cộng* khả năng tạo compute hoặc ghi được IAM policy — con đường trực tiếp từ một service "nhìn như read-only" thành admin. Người ta cũng quên rằng `*` trên `iam:CreatePolicyVersion`, `iam:AttachRolePolicy`, hay assume-role lên một role mạnh đều là leo thang ngay cả khi không có PassRole. Hãy audit mọi principal có thể tự cấp quyền cho chính nó; luôn ghép `PassRole` với một resource ARN và một điều kiện `iam:PassedToService`.
:::

*Đào sâu tiếp — Hãy đi qua một chuỗi leo thang cụ thể: bắt đầu từ role này, chính xác bạn đi từ `PassRole` tới chạy code như một account admin thế nào?*

**Từ khoá ăn điểm** — `confused deputy` · `iam:PassRole` · `iam:PassedToService` · `privilege escalation` · `permission boundary` · `actAs` · `CreatePolicyVersion`

## 7-card — staff — [IAM, Governance]
**Question:** You own security for an org with 80 cloud accounts across many teams, and each team needs autonomy to grant their own IAM. Leadership wants a guarantee that "no one, not even an account admin, can disable logging, create public buckets, or operate outside approved regions." Design least privilege at organization scale.
**Verdict:** KEEP — Staff-level org-scale design: guardrails vs grants, SCP/permission-boundary delegation, break-glass; full design reasoning.

### New answer (en)
**TL;DR** — Separate org-wide *guardrails* (ceilings nobody — not even an account admin — can exceed) from *grants* (what teams hand out within them). Enforce the non-negotiables as preventive controls at the org root (AWS SCPs, GCP Organization Policy, Azure Management Group policy), delegate to teams under permission boundaries, and pair every guardrail with org-wide detection.

**How it works** — Put accounts into an organization with an OU/folder/management-group hierarchy by environment and trust level. Org-level controls don't grant anything — they cap the maximum available in every account beneath them, so an explicit Deny on `cloudtrail:StopLogging`, on making buckets public, plus a region allow-list, overrides even a local account admin's Allow. Below the ceiling, give each team admin rights *bounded* by permission boundaries: they create roles and grant access for their own workloads but never above the org limit. Layer detective controls (org-wide log aggregation, config rules, drift/posture scanning) on top — preventive guardrails plus continuous detection is the durable combination.

:::muted
**Trade-off** — Strong guardrails give a hard, account-admin-proof guarantee and bound blast radius across all 80 accounts, but they're blunt: an over-broad SCP can block legitimate work everywhere at once and is debugged top-down, which teams find opaque ("my policy allows it but it still denies"). Tight central control trades team velocity for consistency — too loose and you get drift, too strict and you get shadow workarounds. Permission boundaries restore autonomy under the ceiling but add a layer everyone must understand.
:::

:::muted
**Common pitfall** — Relying on per-account discipline for org-wide invariants — with 80 accounts, *someone* eventually grants `*`, turns off logging, or opens a bucket, so non-negotiables must live as preventive guardrails at the org root. Watch for SCPs that accidentally lock out break-glass/security roles (keep a tested emergency path), region allow-lists that forget global services, and the false comfort of detection-only with no prevention. Test guardrails in a sandbox OU before rolling wide.
:::

*Go deeper — How do you design and protect a break-glass role that even your most restrictive SCPs can't lock out, without it becoming the soft target?*

**Keywords** — `guardrails vs grants` · `Service Control Policy` · `Organization Policy` · `permission boundary` · `break-glass` · `region allow-list` · `preventive + detective`

### New answer (vi)
**Chốt** — Tách *guardrail* toàn tổ chức (trần không ai — kể cả account admin — vượt được) khỏi *grant* (những gì team cấp phát trong trần đó). Ép các điều không-thương-lượng thành control phòng ngừa ở org root (AWS SCP, GCP Organization Policy, Azure Management Group policy), ủy quyền cho team dưới permission boundary, và ghép mỗi guardrail với phát hiện toàn tổ chức.

**Cơ chế** — Đặt các account vào một organization với phân cấp OU/folder/management-group theo environment và mức tin cậy. Control cấp tổ chức không cấp gì cả — chúng giới hạn mức tối đa khả dụng trong mọi account bên dưới, nên một explicit Deny trên `cloudtrail:StopLogging`, trên việc làm bucket public, cộng một region allow-list, ghi đè cả Allow của một local account admin. Dưới trần, cho mỗi team quyền admin *bị giới hạn* bởi permission boundary: họ tạo role và cấp quyền cho workload của mình nhưng không bao giờ vượt giới hạn tổ chức. Phủ thêm detective control (gom log toàn tổ chức, config rule, quét drift/posture) lên trên — guardrail phòng ngừa cộng phát hiện liên tục là tổ hợp bền vững.

:::muted
**Trade-off** — Guardrail mạnh cho một đảm bảo cứng, chống được cả account-admin và giới hạn blast radius trên cả 80 account, nhưng chúng thô: một SCP quá rộng có thể chặn công việc hợp lệ ở mọi nơi cùng lúc và phải debug từ trên xuống, điều team thấy mờ mịt ("policy của tôi cho phép mà vẫn bị deny"). Kiểm soát tập trung chặt đánh đổi tốc độ của team lấy sự nhất quán — quá lỏng thì bị drift, quá chặt thì bị shadow workaround. Permission boundary khôi phục quyền tự chủ dưới trần nhưng thêm một tầng ai cũng phải hiểu.
:::

:::muted
**Bẫy thường gặp** — Dựa vào kỷ luật per-account cho các bất biến toàn tổ chức — với 80 account, *ai đó* rồi sẽ cấp `*`, tắt logging, hay mở một bucket, nên các điều không-thương-lượng phải sống dưới dạng guardrail phòng ngừa ở org root. Hãy để ý các SCP vô tình khóa luôn role break-glass/bảo mật (giữ một đường khẩn cấp đã được test), region allow-list quên các global service, và sự an tâm giả tạo của chỉ-phát-hiện mà không phòng ngừa. Hãy test guardrail trong một sandbox OU trước khi triển khai rộng.
:::

*Đào sâu tiếp — Bạn thiết kế và bảo vệ một role break-glass mà ngay cả các SCP nghiêm ngặt nhất cũng không khóa được nó thế nào, mà không biến nó thành mục tiêu mềm?*

**Từ khoá ăn điểm** — `guardrails vs grants` · `Service Control Policy` · `Organization Policy` · `permission boundary` · `break-glass` · `region allow-list` · `preventive + detective`
