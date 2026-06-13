# 1-system-design-mastery / 11-security-and-identity
Summary: kept 8, delete 0 of 8

## 0-card — junior — [AuthN, AuthZ]
**Question:** A teammate says "the user is logged in, so they can hit the admin delete endpoint." Walk through why that reasoning is wrong, and where authentication and authorization each belong in the request path.
**Verdict:** KEEP — scenario forces reasoning about why "logged in" ≠ "allowed" and where each check lives; scales junior→senior.

### New answer (en)
**TL;DR** — Being logged in only proves *authentication* (who you are). Hitting an admin-only action also requires *authorization* (are you allowed) — a separate, later check. "Logged in" says nothing about "may delete."

**How it works** — Authentication runs first: it validates a credential (password, token, session cookie) and attaches a verified identity to the request. Authorization runs after: it checks that the now-known identity has the role/permission the specific action requires. In a typical path an auth middleware/gateway resolves identity at the edge, then each protected handler enforces its own authorization check against that identity before touching data.

:::muted
**Trade-off** — Authentication centralizes cleanly at a gateway, but authorization is contextual and usually can't be fully centralized — "can this user edit *this* document" depends on resource ownership the gateway doesn't know. Coarse checks (is this an admin?) can live at the edge; fine-grained, resource-scoped checks must live close to the data.
:::

:::muted
**Common pitfall** — Conflating the two: trusting "authenticated" as if it meant "authorized," which yields broken access control / BOLA / IDOR. The other trap is authorizing only in the UI (hiding a button) while leaving the API open. Every state-changing endpoint must enforce authorization server-side.
:::

*Go deeper — where would you put the "can edit this specific document" check, and why not at the gateway?*

**Keywords** — AuthN vs AuthZ · identity on request · per-handler authZ · broken access control · IDOR/BOLA

### New answer (vi)
**Chốt** — Đã đăng nhập chỉ chứng minh *authentication* (bạn là ai). Gọi được hành động admin còn cần *authorization* (bạn có được phép) — một check riêng, chạy sau. "Đăng nhập rồi" không nói gì về "được xóa".

**Cơ chế** — Authentication chạy trước: xác thực một credential (password, token, session cookie) rồi gắn một identity đã verify vào request. Authorization chạy sau: kiểm tra identity đã biết đó có role/permission mà hành động cụ thể yêu cầu không. Trong request path điển hình, một auth middleware/gateway giải quyết identity ở edge, rồi mỗi handler được bảo vệ tự enforce authorization check trên identity đó trước khi đụng vào data.

:::muted
**Trade-off** — Authentication tập trung gọn ở gateway, nhưng authorization mang tính ngữ cảnh và thường không thể tập trung hoàn toàn — "user này có được sửa *tài liệu này* không" phụ thuộc quyền sở hữu resource mà gateway không biết. Check thô (có phải admin không?) có thể nằm ở edge; check fine-grained, scope theo resource phải nằm gần data.
:::

:::muted
**Bẫy thường gặp** — Gộp hai khái niệm: tin "đã authenticated" như thể nghĩa là "đã authorized", dẫn tới broken access control / BOLA / IDOR. Bẫy khác là chỉ authorize ở UI (ẩn một cái nút) trong khi để API mở. Mọi endpoint thay đổi state phải enforce authorization ở server-side.
:::

*Đào sâu tiếp — bạn đặt check "được sửa đúng tài liệu này" ở đâu, và tại sao không phải ở gateway?*

**Từ khoá ăn điểm** — AuthN vs AuthZ · identity on request · per-handler authZ · broken access control · IDOR/BOLA

## 1-card — senior — [Sessions, JWT]
**Question:** You've moved from a single server with sticky-session cookies to a horizontally scaled fleet behind a load balancer, and product now wants "log out all my devices" to work instantly. Should you keep server-side sessions or switch to stateless JWTs, and how do you handle revocation?
**Verdict:** KEEP — real design trade-off (statefulness vs scale vs instant revocation) with strong follow-ups.

### New answer (en)
**TL;DR** — Don't pick a pure model — go hybrid: short-lived access JWTs (minutes) plus a long-lived refresh token tracked server-side. "Log out all devices" deletes/rotates the refresh records, so every device is forced to re-auth within one access-token lifetime.

**How it works** — Server-side sessions map a session ID to data in a shared store (Redis/DB) any node can read; JWTs are self-contained signed tokens verified by signature alone, no lookup. The hybrid keeps the per-request path stateless (just verify the access JWT) while keeping revocation power at the refresh layer, which *is* stateful. Revocation = invalidate the server-side refresh records; the short access TTL bounds how long a still-valid token survives.

:::muted
**Trade-off** — Pure sessions give instant revocation and tiny opaque cookies, but every request pays a lookup against a hot shared store. Pure JWTs remove the lookup and scale beautifully, but you can't truly revoke before expiry without reintroducing state (denylist or token-version check) — which defeats the point. Token size also grows with claims and rides every request.
:::

:::muted
**Common pitfall** — Adopting JWTs for "stateless logout," then discovering a stolen token lives until expiry, so teams set long TTLs for UX and open a wide exposure window. Also: trusting `alg: none`, confusing HS256/RS256, storing JWTs in localStorage (XSS), and putting sensitive data in the payload (it's signed, not encrypted — anyone can base64-decode it). Keep access TTLs short, refresh tokens in HttpOnly cookies, and pin the algorithm.
:::

*Go deeper — with short access TTLs, how do you stop the refresh endpoint from itself becoming the hot dependency you were trying to avoid?*

**Keywords** — access vs refresh token · short TTL · server-side refresh store · denylist/token-version · HttpOnly · pin `alg`

### New answer (vi)
**Chốt** — Đừng chọn mô hình thuần — đi hybrid: access JWT ngắn hạn (vài phút) cộng một refresh token dài hạn track ở server-side. "Đăng xuất tất cả thiết bị" xóa/rotate các bản ghi refresh, nên mọi thiết bị bị buộc re-auth trong vòng một access-token lifetime.

**Cơ chế** — Server-side session map một session ID tới data trong shared store (Redis/DB) mà node nào cũng đọc được; JWT là token đã ký, tự chứa, verify chỉ bằng chữ ký, không cần tra cứu. Hybrid giữ đường per-request stateless (chỉ verify access JWT) trong khi giữ quyền revocation ở tầng refresh — tầng *có* state. Revocation = vô hiệu các bản ghi refresh ở server; access TTL ngắn giới hạn token còn-hợp-lệ sống được bao lâu.

:::muted
**Trade-off** — Session thuần cho revocation tức thì và cookie opaque nhỏ gọn, nhưng mỗi request phải trả một lookup vào shared store nóng. JWT thuần loại bỏ lookup và scale rất đẹp, nhưng không thể thực sự revoke trước khi hết hạn mà không tái lập state (denylist hoặc token-version check) — triệt tiêu lợi thế. Token cũng phình theo claims và đi kèm mọi request.
:::

:::muted
**Bẫy thường gặp** — Chọn JWT để "logout stateless" rồi phát hiện token bị đánh cắp sống tới khi hết hạn, nên team đặt TTL dài cho UX và mở một cửa sổ phơi nhiễm rộng. Còn: tin `alg: none`, nhầm HS256/RS256, lưu JWT trong localStorage (XSS), và nhét dữ liệu nhạy cảm vào payload (nó được ký, không mã hóa — ai cũng base64-decode được). Giữ access TTL ngắn, refresh token trong HttpOnly cookie, và pin thuật toán.
:::

*Đào sâu tiếp — với access TTL ngắn, làm sao để refresh endpoint không tự biến thành hot dependency mà bạn đang muốn tránh?*

**Từ khoá ăn điểm** — access vs refresh token · short TTL · server-side refresh store · denylist/token-version · HttpOnly · pin `alg`

## 2-card — senior — [OAuth2, OIDC]
**Question:** You're integrating a public SPA that logs users in via an external identity provider, and separately a nightly batch service that calls an internal API with no human present. Which OAuth2 flow fits each, and what's the difference between the access token and the ID token you get back?
**Verdict:** KEEP — flow-selection per actor plus the access/ID-token distinction is a classic senior discriminator.

### New answer (en)
**TL;DR** — SPA → authorization-code flow with PKCE (there's a user to redirect). Batch job → client-credentials (no user). Access token = authorization to call APIs; ID token (OIDC) = authentication describing *who* the user is, meant for the client app, not for calling APIs.

**How it works** — The SPA redirects the user to the IdP, the user authenticates there, and the app gets a short-lived code it exchanges for tokens; PKCE binds that exchange to the originating client so an intercepted code is useless. The batch job authenticates as itself with its own client ID/secret and gets an access token directly. The access token is a bearer credential the resource API checks against scopes; the ID token is a signed JWT of identity claims (subject, name, email) for the client.

:::muted
**Trade-off** — Auth-code-with-PKCE adds redirect round-trips and IdP coupling, but keeps tokens out of URL/history and supports refresh and consent — right for interactive users. Client-credentials is simple and fast but represents an application, not a person: no user context, and its secret is a long-lived high-value target that must be vaulted and rotated.
:::

:::muted
**Common pitfall** — Sending the ID token to call APIs (the resource server should validate the access token's audience/scopes, not identity claims); skipping PKCE on public clients (code-interception); the deprecated implicit flow leaking tokens in redirect fragments. Always validate `iss`, `aud`, `exp`, and signature — accepting a token without checking `aud` lets a token minted for one service be replayed against another.
:::

*Go deeper — your resource API receives a valid, correctly-signed token from your IdP but issued for a different service — what single check rejects it?*

**Keywords** — auth-code + PKCE · client-credentials · access vs ID token · `aud`/`iss`/`exp` · bearer scope · no implicit flow

### New answer (vi)
**Chốt** — SPA → authorization-code flow với PKCE (có user để redirect). Batch job → client-credentials (không có user). Access token = authorization để gọi API; ID token (OIDC) = authentication mô tả user *là ai*, dành cho client app, không phải để gọi API.

**Cơ chế** — SPA redirect user tới IdP, user xác thực ở đó, app nhận một code ngắn hạn để đổi lấy token; PKCE buộc cuộc trao đổi gắn với đúng client khởi tạo nên code bị chặn cũng vô dụng. Batch job tự authenticate bằng client ID/secret của chính nó và nhận access token trực tiếp. Access token là bearer credential mà resource API kiểm tra theo scope; ID token là JWT đã ký chứa identity claim (subject, name, email) cho client.

:::muted
**Trade-off** — Auth-code-with-PKCE thêm round-trip redirect và coupling với IdP, nhưng giữ token ra khỏi URL/history và hỗ trợ refresh lẫn consent — đúng cho user tương tác. Client-credentials đơn giản và nhanh nhưng đại diện một application, không phải con người: không có user context, và secret của nó là mục tiêu giá trị cao, dài hạn, phải vault và rotate.
:::

:::muted
**Bẫy thường gặp** — Gửi ID token để gọi API (resource server nên validate audience/scope của access token, không phải identity claim); bỏ PKCE trên public client (code-interception); implicit flow đã deprecated làm rò token trong redirect fragment. Luôn validate `iss`, `aud`, `exp` và chữ ký — chấp nhận token mà không kiểm `aud` cho phép token đúc cho service này bị replay sang service khác.
:::

*Đào sâu tiếp — resource API nhận một token hợp lệ, ký đúng từ IdP của bạn nhưng phát cho service khác — check duy nhất nào loại nó ra?*

**Từ khoá ăn điểm** — auth-code + PKCE · client-credentials · access vs ID token · `aud`/`iss`/`exp` · bearer scope · no implicit flow

## 3-card — middle — [Secrets, Vault]
**Question:** A code review shows the production database password hardcoded in a config file that's committed to git and baked into the Docker image. Beyond "move it to an env var," explain why that's dangerous and how a secrets manager with rotation actually fixes it.
**Verdict:** KEEP — pushes past the surface answer into runtime fetching, secret-zero, and rotation; real "why".

### New answer (en)
**TL;DR** — A secret in code or an image is effectively published — readable by anyone with repo access, a leaked image layer, or git history, and identical everywhere. The fix is to keep secrets out of the artifact and fetch them at runtime from a secrets manager via a workload identity, with rotation issuing short-lived credentials.

**How it works** — A secrets manager (Vault, KMS-backed stores) centralizes access control and audit, encrypts at rest, and supports rotation — replacing the value the app holds on a schedule, ideally with dynamic/short-lived credentials. The app authenticates to the manager using platform identity (IAM role, Kubernetes service-account token) rather than another static secret. Env vars are a step up from hardcoding but still static and leak via logs, crash dumps, or `/proc`.

:::muted
**Trade-off** — You add an external dependency on the startup/request path and the "secret-zero" bootstrap problem (how does the app authenticate to the manager — solved by platform identity). Dynamic short-lived credentials shrink the exposure window but require the app to handle refresh and brief unavailability. You trade simplicity for a far smaller blast radius and real auditability.
:::

:::muted
**Common pitfall** — Rotating in the manager but never re-reading in long-lived processes, so the app keeps using the old, now-revoked credential and breaks at rotation. Also: secrets in logs/error traces, committed `.env` files, treating rotation as one-time. Once a secret has touched git history, rotation is mandatory — scrubbing the file doesn't un-leak it; the old value lives in every clone.
:::

*Go deeper — how does the very first process authenticate to the secrets manager without a stored secret (the secret-zero problem)?*

**Keywords** — runtime fetch · workload/platform identity · secret-zero bootstrap · dynamic/short-lived creds · rotation re-read · scrub ≠ un-leak

### New answer (vi)
**Chốt** — Secret trong code hay image là đã thực sự công bố — đọc được bởi bất kỳ ai có quyền repo, một image layer bị rò, hay git history, và giống hệt ở mọi nơi. Cách sửa là giữ secret ra khỏi artifact và fetch lúc runtime từ một secrets manager qua workload identity, với rotation cấp credential ngắn hạn.

**Cơ chế** — Secrets manager (Vault, store có KMS) tập trung access control và audit, mã hóa at rest, và hỗ trợ rotation — thay giá trị app đang giữ định kỳ, lý tưởng là credential dynamic/ngắn hạn. App authenticate tới manager bằng platform identity (IAM role, Kubernetes service-account token) thay vì một static secret khác. Env var là bước tiến so với hardcode nhưng vẫn static và rò qua logs, crash dump, hay `/proc`.

:::muted
**Trade-off** — Bạn thêm một external dependency vào đường startup/request và bài toán bootstrap "secret-zero" (app authenticate tới manager bằng gì — giải bằng platform identity). Credential dynamic ngắn hạn thu hẹp cửa sổ phơi nhiễm nhưng đòi app xử lý refresh và gián đoạn ngắn. Bạn đánh đổi sự đơn giản lấy blast radius nhỏ hơn nhiều và khả năng audit thật sự.
:::

:::muted
**Bẫy thường gặp** — Rotate trong manager nhưng không bao giờ đọc lại trong process dài hạn, nên app vẫn dùng credential cũ đã bị revoke và vỡ ngay lúc rotation. Còn: secret lọt vào logs/error trace, commit file `.env`, coi rotation là một-lần. Một khi secret đã chạm git history, rotate là bắt buộc — xóa file không un-leak được; giá trị cũ vẫn sống trong mọi bản clone.
:::

*Đào sâu tiếp — process đầu tiên authenticate tới secrets manager thế nào khi không có secret nào được lưu sẵn (bài toán secret-zero)?*

**Từ khoá ăn điểm** — runtime fetch · workload/platform identity · secret-zero bootstrap · dynamic/short-lived creds · rotation re-read · scrub ≠ un-leak

## 4-card — middle — [DefenseInDepth, LeastPrivilege]
**Question:** An attacker phishes one developer's credentials and lands inside your network. Explain how defense in depth and least privilege are supposed to make that one breach not the end of the world, with concrete layers.
**Verdict:** KEEP — demands concrete layered controls and the "soft interior" failure mode; strong middle/senior question.

### New answer (en)
**TL;DR** — Defense in depth layers independent controls so no single failure is fatal; least privilege then caps what the breached account can reach. Together, the phished account does its narrow job and nothing more, and lateral movement keeps hitting fresh walls.

**How it works** — Layer independent controls: network (segmentation, security groups, no flat network so the dev's box can't reach the DB directly), identity (MFA so a stolen password alone isn't enough, short-lived credentials), and application (per-endpoint authorization, input validation). Least privilege scopes each identity — human or service — to the minimum permissions for its job, tightly scoped and time-bound, so a compromise unlocks a sliver, not the whole estate.

:::muted
**Trade-off** — More layers and tighter scopes mean operational friction: permission denials, explicit service-to-service grants, and the temptation to create broad "break-glass" roles that quietly become the default. The balance is to make the secure path the easy path — well-scoped roles provisioned automatically — so least privilege isn't bypassed for convenience.
:::

:::muted
**Common pitfall** — A hard perimeter with a soft, flat interior: once inside, the attacker has admin everywhere because everything trusted the network. Other anti-patterns: wildcard IAM policies (`*:*`), long-lived static keys shared across services, and privilege creep where roles accumulate permissions but never shed them. Without least privilege, one credential equals full compromise.
:::

*Go deeper — the phished account is a developer with legitimate prod read access — how does least privilege still bound the blast radius here?*

**Keywords** — defense in depth · least privilege · network segmentation · MFA · per-endpoint authZ · no flat interior · privilege creep · `*:*`

### New answer (vi)
**Chốt** — Defense in depth xếp các control độc lập để không một thất bại đơn lẻ nào là chí mạng; least privilege sau đó giới hạn những gì account bị xâm phạm chạm tới được. Cùng nhau, account bị phishing chỉ làm vai trò hẹp của nó, và lateral movement liên tục đụng tường mới.

**Cơ chế** — Xếp các control độc lập: network (segmentation, security group, không network phẳng để máy dev không chạm thẳng DB), identity (MFA để password đánh cắp một mình không đủ, credential ngắn hạn), và application (authorization theo từng endpoint, validate input). Least privilege scope mỗi identity — người hay service — về tối thiểu quyền cho công việc, scope chặt và giới hạn thời gian, nên một vụ xâm phạm chỉ mở một lát, không phải cả khu.

:::muted
**Trade-off** — Càng nhiều lớp và scope càng chặt thì friction vận hành càng cao: permission denial, grant service-to-service tường minh, và cám dỗ tạo các role "break-glass" rộng âm thầm thành default. Cân bằng là làm con đường an toàn thành con đường dễ — role scope tốt được provision tự động — để least privilege không bị bypass vì tiện.
:::

:::muted
**Bẫy thường gặp** — Perimeter cứng với bên trong mềm, phẳng: một khi vào trong, attacker có admin khắp nơi vì mọi thứ đều tin network. Anti-pattern khác: IAM policy wildcard (`*:*`), static key dài hạn dùng chung giữa các service, và privilege creep nơi role tích lũy quyền nhưng không bỏ bớt. Không có least privilege, một credential bằng full compromise.
:::

*Đào sâu tiếp — account bị phishing là một developer có quyền đọc prod hợp lệ — least privilege vẫn giới hạn blast radius ở đây bằng cách nào?*

**Từ khoá ăn điểm** — defense in depth · least privilege · network segmentation · MFA · per-endpoint authZ · no flat interior · privilege creep · `*:*`

## 5-card — senior — [RateLimiting, AbusePrevention]
**Question:** Your login endpoint is being hit by a credential-stuffing botnet: millions of attempts spread across thousands of IPs, each IP staying just under a naive per-IP limit. How do you protect the auth endpoint without locking out or annoying legitimate users?
**Verdict:** KEEP — multi-dimensional rate limiting, progressive friction, and the false-positive trade-off — strong senior design question.

### New answer (en)
**TL;DR** — A single per-IP limit fails against a distributed botnet. Layer the dimensions (per-IP *and* per-target-account *and* per-endpoint) in a shared store, and apply progressive friction — backoff, CAPTCHA, step-up — instead of hard blocks, so real users see a speed bump while bots stall.

**How it works** — Rate-limit on multiple keys at once: per IP, per target account (failed logins for one username from anywhere), and across the whole endpoint, using a shared store (Redis) with token-bucket or sliding-window so limits hold across the fleet. Escalate friction after N failures rather than blocking outright, and pair with MFA and breached-password detection so even correct stuffed credentials don't yield a takeover.

:::muted
**Trade-off** — Tighten and you risk false positives: shared NATs, corporate proxies, and carrier IPs put many real users behind one address, so per-IP-only throttling locks out the innocent. Loosen and the attacker slips under the threshold. Per-account limits stop targeted stuffing but enable a DoS where an attacker deliberately fails logins to lock a victim out — so prefer slowing/challenging over hard account lockout.
:::

:::muted
**Common pitfall** — In-memory per-node counters: behind a load balancer each node sees only a slice of traffic, so the effective limit is N× higher than intended. Also: limiting on a spoofable IP without honoring the real client behind the proxy, leaking via timing or distinct error messages whether a username exists (enumeration), and forgetting the limiter itself is a hot single-point dependency that must stay available and low-latency.
:::

*Go deeper — per-account limits invite a lockout-DoS against a chosen victim; how do you defend the account dimension without handing the attacker that weapon?*

**Keywords** — multi-dimension limit · shared Redis store · token-bucket/sliding-window · progressive friction/CAPTCHA · per-node counter trap · lockout-DoS · user enumeration

### New answer (vi)
**Chốt** — Một per-IP limit đơn lẻ thất bại trước botnet phân tán. Xếp lớp các chiều (theo IP *và* theo account đích *và* theo endpoint) trong một shared store, và áp friction tăng dần — backoff, CAPTCHA, step-up — thay vì hard block, để user thật chỉ thấy gờ giảm tốc còn bot bị chặn đứng.

**Cơ chế** — Rate-limit trên nhiều key cùng lúc: theo IP, theo account đích (login thất bại cho một username từ bất cứ đâu), và trên toàn endpoint, dùng shared store (Redis) với token-bucket hay sliding-window để limit giữ được xuyên fleet. Tăng friction sau N lần thất bại thay vì chặn thẳng, và kết hợp MFA cùng phát hiện password đã lộ để ngay cả credential stuff đúng cũng không dẫn tới takeover.

:::muted
**Trade-off** — Siết thì rủi ro false positive: NAT dùng chung, corporate proxy và IP nhà mạng đặt nhiều user thật sau một địa chỉ, nên throttling chỉ-theo-IP khóa nhầm người vô tội. Nới thì attacker lách dưới ngưỡng. Per-account limit chặn stuffing có chủ đích nhưng mở ra một DoS nơi attacker cố tình login thất bại để khóa nạn nhân — nên ưu tiên làm-chậm/challenge hơn hard account lockout.
:::

:::muted
**Bẫy thường gặp** — Counter per-node trong bộ nhớ: sau load balancer mỗi node chỉ thấy một lát traffic, nên limit hiệu dụng cao gấp N lần dự kiến. Còn: limit trên IP có thể spoof mà không tôn trọng real client phía sau proxy, rò qua timing hay error message khác nhau cho biết một username có tồn tại không (enumeration), và quên rằng chính limiter là một hot dependency single-point phải sẵn sàng và độ trễ thấp.
:::

*Đào sâu tiếp — per-account limit mời gọi một lockout-DoS nhắm vào nạn nhân chọn sẵn; bạn bảo vệ chiều account thế nào mà không trao vũ khí đó cho attacker?*

**Từ khoá ăn điểm** — multi-dimension limit · shared Redis store · token-bucket/sliding-window · progressive friction/CAPTCHA · per-node counter trap · lockout-DoS · user enumeration

## 6-card — middle — [Encryption, KeyManagement]
**Question:** A compliance reviewer says "the database has encryption at rest enabled, so user data is safe." Pick that claim apart: what does at-rest encryption actually protect against, what does it not, and where does in-transit encryption fit?
**Verdict:** KEEP — forces precise threat-model reasoning (what at-rest does/doesn't cover) and key management; "decrypt by whom" is real depth.

### New answer (en)
**TL;DR** — At-rest encryption protects bytes on disk against physical/backup/volume theft — but transparent at-rest decrypts automatically for anyone with a live DB connection, so it does nothing against a compromised app or stolen credentials. In-transit (TLS) protects data moving over the network; the real question is always *who holds the key*.

**How it works** — At-rest closes the storage gap (stolen drives, leaked backups). In-transit (TLS) closes the network gap against eavesdropping and tampering — and must cover service-to-service and the app-to-DB hop, not just the public edge. They're complementary, not substitutes. The pivotal axis is key management: where keys live (a KMS/HSM, separate from the data) and who can call decrypt.

:::muted
**Trade-off** — Storage-level (transparent) encryption is cheap and invisible but decrypts for anyone reaching the live DB. Application/field-level encryption protects specific fields even from a DBA, but adds key-management complexity and breaks querying/indexing on those fields. Envelope encryption with a KMS balances it: data keys encrypt the data, the KMS master key encrypts the data keys, centralizing rotation and access control.
:::

:::muted
**Common pitfall** — The reviewer's over-reach: transparent at-rest never protected against the most common breach — an attacker with a valid DB connection reads plaintext. Other failures: keys stored next to the data, never rotating, TLS at the edge but plaintext internally, and skipping certificate validation so a MITM terminates TLS unnoticed. Always ask "decrypt by whom."
:::

*Go deeper — which threat does field-level (application) encryption stop that transparent at-rest can't — and what does it cost you on queries?*

**Keywords** — at-rest vs in-transit · transparent decrypt · live-connection threat · KMS/HSM · envelope encryption · key rotation · cert validation · "decrypt by whom"

### New answer (vi)
**Chốt** — Encryption at rest bảo vệ byte trên disk chống đánh cắp vật lý/backup/volume — nhưng at-rest transparent tự động decrypt cho bất cứ ai có một DB connection đang chạy, nên nó không làm gì được trước một app bị xâm phạm hay credential bị đánh cắp. In-transit (TLS) bảo vệ dữ liệu di chuyển trên network; câu hỏi thật sự luôn là *ai giữ key*.

**Cơ chế** — At-rest bịt khoảng trống storage (ổ đĩa bị đánh cắp, backup bị rò). In-transit (TLS) bịt khoảng trống network chống nghe lén và can thiệp — và phải phủ cả service-to-service lẫn chặng app-to-DB, không chỉ public edge. Chúng bổ trợ nhau, không thay thế nhau. Trục then chốt là key management: key nằm ở đâu (một KMS/HSM, tách khỏi data) và ai được gọi decrypt.

:::muted
**Trade-off** — Encryption ở mức storage (transparent) rẻ và vô hình nhưng decrypt cho bất cứ ai chạm tới DB đang chạy. Encryption ở mức application/field bảo vệ field cụ thể ngay cả khỏi một DBA, nhưng thêm độ phức tạp key-management và phá querying/indexing trên các field đó. Envelope encryption với KMS cân bằng: data key mã hóa data, KMS master key mã hóa các data key, tập trung rotation và access control.
:::

:::muted
**Bẫy thường gặp** — Cái over-reach của người review: at-rest transparent chưa bao giờ bảo vệ chống lại breach phổ biến nhất — một attacker có DB connection hợp lệ đọc plaintext. Các failure khác: lưu key ngay cạnh data, không bao giờ rotate, TLS ở edge nhưng plaintext bên trong, và bỏ certificate validation để một MITM terminate TLS mà không bị phát hiện. Luôn hỏi "decrypt bởi ai".
:::

*Đào sâu tiếp — field-level (application) encryption chặn được threat nào mà at-rest transparent không chặn được — và nó tốn gì trên query?*

**Từ khoá ăn điểm** — at-rest vs in-transit · transparent decrypt · live-connection threat · KMS/HSM · envelope encryption · key rotation · cert validation · "decrypt by whom"

## 7-card — staff — [MultiTenancy, Identity]
**Question:** You're designing identity for a B2B SaaS where each customer (tenant) has its own users and data on shared infrastructure. A single tenant-admin token leaks. How do you architect tenant isolation, token scoping, and blast-radius containment so that leak can't read another tenant's data?
**Verdict:** KEEP — open-ended staff-level architecture with isolation tiers, tenant-scoped authZ, and containment; deep follow-ups.

### New answer (en)
**TL;DR** — Make tenant a first-class dimension of every identity and every authZ decision: tokens carry a `tenant_id` claim bound at issuance, and the data layer filters every query by tenant, never trusting a client-supplied tenant. A leaked token then unlocks exactly one tenant — its own — and nothing more.

**How it works** — Bind `tenant_id` (and scopes) into the token at issuance; the resource layer enforces that the request's tenant matches the data's tenant on every query and hop, validating audience and tenant. Layer isolation by risk: row-level isolation with a mandatory tenant predicate (or Postgres RLS) as baseline, schema- or database-per-tenant for high-value customers, and per-tenant keys/encryption where feasible so even storage can't cross tenants.

:::muted
**Trade-off** — Stronger isolation costs density and operability. Database-per-tenant gives the hardest boundary and easy per-tenant backup/restore but explodes connection counts, migrations, and cost; shared-schema row-level isolation is cheap and dense but one missing `WHERE tenant_id` is a cross-tenant leak. Per-tenant keys shrink blast radius but multiply key-management overhead. The staff call is matching isolation tier to tenant risk — pooled for the long tail, siloed for regulated/enterprise — not one model for everyone.
:::

:::muted
**Common pitfall** — The dominant multi-tenant breach is a missing tenant scope on one query or endpoint: authZ checked "valid admin" but not "admin of *this* tenant," so an IDOR-style request reads across the boundary. Others: trusting a `tenant_id` from the request body instead of the verified token, caches/connection pools keyed without tenant so data bleeds between contexts, and over-broad admin tokens with no scope or expiry. Containment = short-lived scoped tokens, per-tenant data-layer enforcement, and per-tenant audit logging.
:::

*Go deeper — how do you make the tenant predicate impossible to forget on a new query, rather than relying on every developer to remember `WHERE tenant_id`?*

**Keywords** — `tenant_id` claim · per-tenant data filter · Postgres RLS · pooled vs siloed isolation · IDOR cross-tenant · tenant-keyed cache/pool · per-tenant audit

### New answer (vi)
**Chốt** — Biến tenant thành chiều first-class của mọi identity và mọi quyết định authZ: token mang một claim `tenant_id` gắn lúc phát hành, và data layer filter mọi query theo tenant, không bao giờ tin một tenant do client cung cấp. Một token bị rò khi đó mở khóa đúng một tenant — của chính nó — và không gì hơn.

**Cơ chế** — Gắn `tenant_id` (và các scope) vào token lúc phát hành; resource layer enforce rằng tenant của request khớp tenant của data trên mọi query và mọi hop, validate audience và tenant. Xếp lớp isolation theo rủi ro: row-level isolation với tenant predicate bắt buộc (hoặc Postgres RLS) làm baseline, schema- hoặc database-per-tenant cho khách hàng giá trị cao, và key/encryption per-tenant ở nơi khả thi để ngay cả storage cũng không vượt tenant.

:::muted
**Trade-off** — Isolation càng mạnh càng tốn density và khả năng vận hành. Database-per-tenant cho boundary cứng nhất và backup/restore per-tenant dễ nhưng làm nổ số connection, migration và chi phí; shared-schema row-level isolation rẻ và dày đặc nhưng một câu thiếu `WHERE tenant_id` là một cross-tenant leak. Per-tenant key thu nhỏ blast radius nhưng nhân overhead key-management. Quyết định tầm staff là khớp tier isolation với rủi ro của tenant — pooled cho long tail, siloed cho regulated/enterprise — không phải một mô hình cho tất cả.
:::

:::muted
**Bẫy thường gặp** — Breach multi-tenant chủ đạo là thiếu tenant scope trên một query hay một endpoint: authZ check "admin hợp lệ" nhưng không check "admin của *tenant này*", nên một request kiểu IDOR đọc xuyên boundary. Còn: tin một `tenant_id` từ request body thay vì token đã verify, cache/connection pool key mà không có tenant nên data bleed giữa các context, và token admin quá rộng không scope hay expiry. Containment = token scope ngắn hạn, enforce per-tenant ở data layer, và audit logging per-tenant.
:::

*Đào sâu tiếp — làm sao để tenant predicate không thể bị quên trên một query mới, thay vì trông cậy mọi developer nhớ `WHERE tenant_id`?*

**Từ khoá ăn điểm** — `tenant_id` claim · per-tenant data filter · Postgres RLS · pooled vs siloed isolation · IDOR cross-tenant · tenant-keyed cache/pool · per-tenant audit
