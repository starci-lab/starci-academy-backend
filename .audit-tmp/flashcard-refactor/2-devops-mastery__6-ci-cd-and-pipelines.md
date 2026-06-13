# 2-devops-mastery / 6-ci-cd-and-pipelines
Summary: kept 8, delete 0 of 8

## 0-card — junior — [CI/CD, Delivery]
**Question:** A teammate says "we do CI/CD" but every release to production still needs a manager to click "Approve". Walk through what CI, continuous delivery, and continuous deployment each actually automate, and where that human approval gate legitimately belongs.
**Verdict:** KEEP — Forces the candidate to disambiguate three commonly-conflated terms and place the human gate with reasoning, not recall.

### New answer (en)
**TL;DR** — They are doing continuous **delivery**, not continuous deployment — the manual approve gate is exactly what distinguishes the two, and it is a valid choice. CI automates up to a verified build; delivery keeps every green build deployable one button from prod; deployment removes that button.

**How it works** — **Continuous Integration**: every push merges, lints, tests, and produces an artifact, so integration breaks surface in minutes instead of at a big-bang merge. **Continuous Delivery**: every green build is automatically prepared and flows to staging, sitting one human-triggered button-press from prod — a person decides *when* to release. **Continuous Deployment**: that last button is removed, so every commit passing the full pipeline goes straight to prod with no human in the loop. The gate belongs only at the production-promotion step.

:::muted
**Trade-off** — A human gate buys a deliberate go/no-go moment (useful for regulated changes, coordinated launches, or low test confidence) but adds latency and a queue, and reviewers rarely re-read the diff. Continuous deployment maximises flow and shrinks each change to something tiny and debuggable, but demands strong tests, fast rollback, and feature flags. Most teams land on delivery for the riskiest environment and deployment everywhere upstream.
:::

:::muted
**Common pitfall** — Calling any automated deploy "CI/CD" while a human gate still blocks prod, then assuming you get deployment's tiny-diff safety while actually batching many changes into one large risky release. The other failure is gating the wrong step — gating every merge to the shared branch throttles integration and defeats CI; the gate belongs at prod promotion only.
:::

*Go deeper — if the gate keeps getting rubber-stamped, what objective criteria or automated checks would you put behind it so it stops being theatre?*

**Keywords** — `CI` · `continuous delivery` · `continuous deployment` · `feature flags` · `deploy ≠ release` · `production promotion gate`

### New answer (vi)
**Chốt** — Họ đang làm continuous **delivery**, không phải continuous deployment — chính cái manual approve gate là thứ phân biệt hai khái niệm, và đó là lựa chọn hợp lệ. CI tự động tới một build đã verify; delivery giữ mỗi build xanh sẵn sàng deploy chỉ cách prod một nút bấm; deployment bỏ luôn cái nút đó.

**Cơ chế** — **Continuous Integration**: mỗi lần push merge, lint, test và tạo artifact, để lỗi tích hợp lộ ra trong vài phút thay vì lúc merge dồn một cục. **Continuous Delivery**: mỗi build xanh tự động được chuẩn bị và chảy tới staging, chỉ cách prod một cú bấm nút do con người kích hoạt — con người quyết định *khi nào* release. **Continuous Deployment**: bỏ cái nút cuối đó, mỗi commit qua full pipeline vào thẳng prod không cần con người. Gate chỉ thuộc về bước promote lên production.

:::muted
**Trade-off** — Human gate mua một khoảnh khắc go/no-go có chủ đích (hữu ích cho thay đổi bị regulate, launch phối hợp, hay khi test confidence thấp) nhưng thêm độ trễ và hàng đợi, và reviewer hiếm khi đọc lại diff. Continuous deployment tối đa hóa flow và thu nhỏ mỗi thay đổi xuống mức bé dễ debug, nhưng đòi hỏi test mạnh, rollback nhanh và feature flag. Phần lớn team chọn delivery cho môi trường rủi ro nhất và deployment cho mọi tầng phía trên.
:::

:::muted
**Bẫy thường gặp** — Gọi mọi deploy tự động là "CI/CD" trong khi human gate vẫn chặn prod, rồi tưởng mình có lợi ích diff-bé của deployment trong khi thực ra gom nhiều thay đổi thành một release lớn rủi ro. Failure khác là gate sai bước — gate mọi merge vào shared branch bóp nghẹt tích hợp và phá CI; gate chỉ nên nằm ở bước promote lên prod.
:::

*Đào sâu tiếp — nếu cái gate cứ bị đóng dấu cho có, bạn đặt tiêu chí khách quan hay check tự động nào phía sau để nó hết là diễn?*

**Từ khoá ăn điểm** — `CI` · `continuous delivery` · `continuous deployment` · `feature flags` · `deploy ≠ release` · `production promotion gate`

## 1-card — middle — [Pipeline, Feedback]
**Question:** Your pipeline runs a 25-minute integration-test suite first, then lint, then a 30-second build, and developers complain they wait half an hour only to fail on a missing semicolon. How would you order the stages — lint, test, build, scan, deploy — and what principle drives that order?
**Verdict:** KEEP — Tests the fast-feedback principle plus stage-dependency reasoning and parallelism trade-offs, not stage names.

### New answer (en)
**TL;DR** — Reorder by **fast feedback first: cheapest, most-likely-to-fail checks before slow expensive ones**. Lint/type-check → unit tests → build → scan → integration/e2e → deploy, so a missing semicolon fails in seconds, not after 25 minutes.

**How it works** — Each stage is a cheaper gate guarding a more expensive one. Lint/format and type-check run in seconds; unit tests are fast and isolated; the build produces the artifact; the security/dependency scan and the integration/e2e tests then run *against that built artifact*; deploy is last. Fan independent stages out in parallel (lint, unit tests, SAST concurrently) and gate the slow integration stage behind them, so common failures abort early and free the runners.

:::muted
**Trade-off** — Strict fail-fast can block tests whose results you also wanted, so some PRs prefer "run everything, report all failures at once" — more compute, fewer round-trips. Heavy parallelism cuts wall-clock but multiplies runner cost and hits concurrency limits, so fast-feedback ordering sometimes conflicts with resource efficiency. Scanning early gives fast signal but scanning the final image is more accurate — mature pipelines do both.
:::

:::muted
**Common pitfall** — Putting the slowest, most-likely-to-fail stage first makes every developer pay full cost to learn about a one-line problem, destroying pipeline trust and pushing people to skip CI. Testing source instead of the built artifact validates something you never ship. Forgetting to make the build a hard prerequisite lets stages "pass" on stale outputs.
:::

*Go deeper — once ordering is right, how do you decide which slow tests are worth keeping in the blocking path versus moving to a nightly/post-merge run?*

**Keywords** — `fail-fast` · `fast feedback` · `test the built artifact` · `sharding` · `SAST` · `stage dependencies`

### New answer (vi)
**Chốt** — Sắp lại theo **fast feedback trước: check rẻ nhất, dễ fail nhất đặt trước những thứ chậm và đắt**. Lint/type-check → unit test → build → scan → integration/e2e → deploy, để một dấu chấm phẩy thiếu fail trong vài giây, không phải sau 25 phút.

**Cơ chế** — Mỗi stage là một gate rẻ hơn canh một gate đắt hơn. Lint/format và type-check chạy vài giây; unit test nhanh và cô lập; build tạo artifact; rồi security/dependency scan và integration/e2e test chạy *trên artifact đã build*; deploy cuối cùng. Fan-out các stage độc lập song song (lint, unit test, SAST đồng thời) và gate stage integration chậm phía sau, để lỗi phổ biến abort sớm và giải phóng runner.

:::muted
**Trade-off** — Fail-fast nghiêm có thể chặn các test mà bạn cũng muốn xem kết quả, nên vài PR thích "chạy hết, báo mọi failure cùng lúc" — tốn compute hơn, ít vòng lặp hơn. Parallel mạnh cắt wall-clock nhưng nhân chi phí runner và đụng concurrency limit, nên sắp xếp cho fast feedback đôi khi xung đột với hiệu quả tài nguyên. Scan sớm cho tín hiệu nhanh nhưng scan image cuối chính xác hơn — pipeline trưởng thành làm cả hai.
:::

:::muted
**Bẫy thường gặp** — Đặt stage chậm nhất, dễ fail nhất lên đầu khiến mọi dev trả full chi phí chỉ để biết một vấn đề một dòng, phá lòng tin vào pipeline và đẩy người ta skip CI. Test source thay vì artifact đã build là validate thứ bạn không bao giờ ship. Quên đặt build làm tiền đề cứng khiến các stage "pass" trên output cũ.
:::

*Đào sâu tiếp — khi thứ tự đã đúng, bạn quyết định test chậm nào đáng giữ trong nhánh blocking so với chuyển sang chạy nightly/post-merge thế nào?*

**Từ khoá ăn điểm** — `fail-fast` · `fast feedback` · `test the built artifact` · `sharding` · `SAST` · `stage dependencies`

## 2-card — middle — [Artifacts, Promotion]
**Question:** Your pipeline rebuilds the application separately for dev, staging, and prod, each time running `docker build` with that environment's config baked in. A release that passed staging breaks in prod. Why is rebuilding per environment the root risk, and what's the alternative?
**Verdict:** KEEP — "Build once, promote the same artifact" is a core CD principle with real diagnosis (non-reproducible builds) and config-vs-code reasoning.

### New answer (en)
**TL;DR** — Rebuilding per environment makes prod a *different* artifact than the one staging validated, so staging proves nothing. Fix it by **build once, promote the same immutable artifact** everywhere — only config changes between environments.

**How it works** — The pipeline builds exactly one artifact per commit (a container image, a versioned jar/zip), tags it with an immutable identity (git SHA or semantic version plus a digest), and pushes it to a registry. Every environment then deploys that identical artifact; configuration is injected at deploy time via env vars, config maps, or secrets. Because the bytes that passed staging are the exact bytes that reach prod, staging becomes a meaningful gate and rollback is trivial — redeploy the previous known-good digest.

:::muted
**Trade-off** — This forces clean config/code separation (twelve-factor externalised config, parameterised deploys) and an artifact that contains nothing environment-specific, plus a registry, retention policies, and disciplined immutable tagging instead of overwriting `latest`. Builds that legitimately need per-target compilation may require a small matrix of artifacts — still built once, never rebuilt per environment.
:::

:::muted
**Common pitfall** — Per-environment rebuilds can pull different dependency versions, a different base image, or a moving `latest`, so prod silently diverges — the canonical "works in staging, breaks in prod". Baking config into the image leaks secrets into layers and forces a rebuild for any config change. Mutable tags like `latest`/`prod` destroy the audit trail and rollback story, and a re-tag can swap prod under your feet.
:::

*Go deeper — with one immutable image across environments, how do you handle a config value that must differ per environment but is also a secret?*

**Keywords** — `build once` · `immutable artifact` · `digest` · `git SHA tag` · `config injection` · `twelve-factor` · `reproducible build`

### New answer (vi)
**Chốt** — Build lại theo từng môi trường khiến prod là một artifact *khác* với thứ staging đã validate, nên staging chẳng chứng minh gì. Sửa bằng **build một lần, promote cùng một immutable artifact** ở mọi nơi — chỉ config khác nhau giữa các môi trường.

**Cơ chế** — Pipeline build đúng một artifact cho mỗi commit (một container image, một jar/zip có version), tag bằng identity bất biến (git SHA hoặc semantic version kèm digest), và push lên registry. Mỗi môi trường sau đó deploy đúng artifact giống hệt; config được tiêm lúc deploy qua env var, config map, hay secret. Vì các byte đã pass staging chính là byte đến prod, staging trở thành gate có ý nghĩa và rollback dễ — redeploy lại digest known-good trước đó.

:::muted
**Trade-off** — Cách này buộc tách config/code sạch sẽ (externalised config kiểu twelve-factor, deploy có tham số) và một artifact không chứa gì gắn riêng môi trường, cộng thêm một registry, retention policy, và tag bất biến có kỷ luật thay vì ghi đè `latest`. Các build thực sự cần compile theo target có thể cần một matrix nhỏ các artifact — vẫn build một lần, không build lại theo môi trường.
:::

:::muted
**Bẫy thường gặp** — Build lại theo môi trường có thể kéo về phiên bản dependency khác, base image khác, hay một `latest` đang trôi, nên prod âm thầm lệch — đúng kiểu kinh điển "chạy được ở staging, vỡ ở prod". Bake config vào image rò secret vào các layer và buộc build lại cho mọi thay đổi config. Mutable tag như `latest`/`prod` phá audit trail và khả năng rollback, và một lần re-tag có thể tráo prod ngay dưới chân bạn.
:::

*Đào sâu tiếp — với một image bất biến qua mọi môi trường, bạn xử lý thế nào một config value vừa phải khác theo môi trường vừa là secret?*

**Từ khoá ăn điểm** — `build once` · `immutable artifact` · `digest` · `git SHA tag` · `config injection` · `twelve-factor` · `reproducible build`

## 3-card — senior — [Secrets, OIDC]
**Question:** A security review flags that your GitHub Actions stores a long-lived AWS access key as a repo secret to run `terraform apply`. The key never rotates and any workflow can read it. How do you eliminate the static key, and what do masked variables and OIDC give you here?
**Verdict:** KEEP — Real senior security design: OIDC federation, trust-policy scoping, and why masking is a net not a control.

### New answer (en)
**TL;DR** — Replace the static key with **OIDC federation**: CI mints a short-lived signed identity token, the cloud's IAM trusts that issuer, and the job exchanges it for temporary credentials that expire in minutes — no long-lived secret stored. Masked variables only redact known literals from logs; they are a safety net, not the fix.

**How it works** — The CI provider (GitHub Actions, GitLab) issues a signed OIDC token describing the workflow (repo, branch, environment). The cloud trusts that issuer via a federated identity provider, and the job calls `AssumeRoleWithWebIdentity` to swap the token for short-lived credentials. The role's trust policy is scoped with conditions — e.g. a `sub` claim restricting to a specific repo and branch. Values that genuinely must stay secrets (a third-party API token) live in the encrypted secret store, are masked in logs, and are scoped to environments with required reviewers.

:::muted
**Trade-off** — OIDC removes the standing credential and gives per-run, auditable, auto-rotating access, but costs setup: configuring the IdP, writing precise trust conditions, a steeper mental model than pasting a key. Over-broad conditions (any branch, `pull_request` from forks) can be worse than a vaulted key, because anyone who can trigger a workflow inherits cloud access. Masking pairs with OIDC and least-privilege roles, it never replaces them.
:::

:::muted
**Common pitfall** — Long-lived keys leak via logs, fork PRs, compromised actions, or a printed `env`, and since they never rotate, one leak grants indefinite access. Masking is easily defeated — base64-encode or split a secret across lines and it prints in clear. The classic OIDC failure is a sloppy trust policy: omitting the `sub` condition lets any repo in the org (or attacker-controlled refs) assume the role — a wider hole than the key it replaced.
:::

*Go deeper — how do you scope the trust policy so a fork's `pull_request` workflow can never assume the deploy role, yet legitimate branch pipelines still can?*

**Keywords** — `OIDC federation` · `AssumeRoleWithWebIdentity` · `short-lived credentials` · `sub claim` · `trust policy` · `least privilege` · `masking ≠ control`

### New answer (vi)
**Chốt** — Thay static key bằng **OIDC federation**: CI phát một identity token ngắn hạn có chữ ký, IAM của cloud tin issuer đó, và job đổi nó lấy credential tạm thời hết hạn trong vài phút — không lưu secret dài hạn. Masked variable chỉ che các literal đã biết khỏi log; chúng là lưới an toàn, không phải giải pháp.

**Cơ chế** — CI provider (GitHub Actions, GitLab) phát một OIDC token có chữ ký mô tả workflow (repo, branch, environment). Cloud tin issuer đó qua một federated identity provider, và job gọi `AssumeRoleWithWebIdentity` để đổi token lấy credential ngắn hạn. Trust policy của role được giới hạn bằng condition — ví dụ claim `sub` chỉ cho một repo và branch cụ thể. Những giá trị thực sự buộc là secret (một API token bên thứ ba) nằm trong encrypted secret store, bị mask trong log, và giới hạn theo environment với required reviewer.

:::muted
**Trade-off** — OIDC gỡ credential thường trực và cho quyền theo từng run, có audit, tự xoay vòng, nhưng tốn setup: cấu hình IdP, viết trust condition chính xác, mô hình tư duy khó hơn dán một key. Condition quá rộng (mọi branch, `pull_request` từ fork) có thể tệ hơn key trong vault, vì bất kỳ ai trigger được workflow đều thừa hưởng quyền cloud. Masking đi cùng OIDC và role least-privilege, nó không bao giờ thay thế chúng.
:::

:::muted
**Bẫy thường gặp** — Key dài hạn lộ qua log, fork PR, action bị xâm nhập, hay một lệnh in `env`, và vì không xoay vòng, một lần lộ cho quyền vô thời hạn. Masking dễ bị qua mặt — base64-encode hoặc tách secret qua nhiều dòng là nó in ra rõ. Failure OIDC kinh điển là trust policy cẩu thả: bỏ condition `sub` khiến bất kỳ repo nào trong org (hoặc ref do attacker kiểm soát) assume được role — một lỗ hổng rộng hơn cả key nó thay thế.
:::

*Đào sâu tiếp — bạn scope trust policy thế nào để workflow `pull_request` từ một fork không bao giờ assume được deploy role, mà pipeline của branch hợp lệ vẫn assume được?*

**Từ khoá ăn điểm** — `OIDC federation` · `AssumeRoleWithWebIdentity` · `short-lived credentials` · `sub claim` · `trust policy` · `least privilege` · `masking ≠ control`

## 4-card — middle — [Performance, Flaky-tests]
**Question:** Your CI run has crept to 40 minutes, re-downloads all dependencies every time, runs tests strictly sequentially, and one notorious test fails about 10% of the time forcing constant reruns. What three levers do you pull, and how do you handle the flaky test responsibly?
**Verdict:** KEEP — Concrete optimization levers plus the judgment call on flaky tests (quarantine vs blanket retry) — strong middle-level depth.

### New answer (en)
**TL;DR** — Pull three levers — **caching** dependencies/build outputs, **parallelism** by sharding the suite, and **quarantining** the flaky test into a non-blocking lane with a ticket to fix the root cause — never a blanket retry-all that hides real bugs.

**How it works** — **Caching**: persist dependency dirs and build outputs (node_modules, Go/Maven cache, Docker layers) keyed by a lockfile hash, so unchanged deps restore instead of re-downloading and only changed layers rebuild. **Parallelism**: shard tests across runners by file/timing and run independent jobs concurrently, turning one long serial run into several short ones. **Quarantine**: isolate that one flaky test out of the blocking path, file a ticket for the real cause (timing, shared state, network), and keep the main pipeline deterministic so green means green.

:::muted
**Trade-off** — Aggressive caching can serve stale or poisoned artifacts if the key is too coarse, so correctness depends on hashing the right inputs and occasionally busting the cache. Parallelism cuts wall-clock but multiplies runner cost and adds orchestration (balancing shards, merging coverage) with diminishing returns. A quarantine lane nobody drains becomes a graveyard where coverage rots — it needs an owner and an SLA.
:::

:::muted
**Common pitfall** — The worst "fix" for flakiness is a global retry that re-runs failures until they pass: it hides intermittent bugs, doubles cost, and trains the team to ignore red. Over-coarse cache keys cause "works only after clearing the cache" bugs, and caching a compromised dependency persists a supply-chain issue across runs. Naive parallelism on tests sharing a DB, fixed ports, or global state creates *new* flakiness — isolation must come before fan-out.
:::

*Go deeper — how do you tell a genuinely flaky test (non-deterministic) from one that is correctly catching a real race in the product code?*

**Keywords** — `cache key = lockfile hash` · `layer caching` · `sharding` · `test isolation` · `quarantine lane` · `no blanket retry`

### New answer (vi)
**Chốt** — Kéo ba cần gạt — **caching** dependency/build output, **parallelism** bằng shard test suite, và **quarantine** cái flaky test vào một lane không-blocking kèm ticket sửa nguyên nhân gốc — không bao giờ dùng retry-all tổng che bug thật.

**Cơ chế** — **Caching**: lưu các thư mục dependency và build output (node_modules, cache Go/Maven, Docker layer) đánh key theo hash lockfile, để dep không đổi được restore thay vì tải lại và chỉ layer thay đổi mới rebuild. **Parallelism**: shard test ra nhiều runner theo file/thời lượng và chạy job độc lập đồng thời, biến một run serial dài thành vài run ngắn. **Quarantine**: cô lập đúng test flaky đó ra khỏi nhánh blocking, mở ticket sửa nguyên nhân thật (timing, shared state, network), và giữ pipeline chính deterministic để xanh nghĩa là xanh.

:::muted
**Trade-off** — Caching mạnh tay có thể phục vụ artifact cũ hoặc bị nhiễm nếu key quá thô, nên tính đúng đắn phụ thuộc hash đúng input và thi thoảng bust cache. Parallelism cắt wall-clock nhưng nhân chi phí runner và thêm orchestration (cân bằng shard, gộp coverage) với lợi ích giảm dần. Một lane quarantine không ai dọn thành nghĩa địa nơi coverage mục rữa — nó cần một owner và một SLA.
:::

:::muted
**Bẫy thường gặp** — "Cách sửa" tệ nhất cho flakiness là retry toàn cục chạy lại failure tới khi pass: nó che bug ngắt quãng, gấp đôi chi phí, và tập cho team phớt lờ màu đỏ. Cache key quá thô gây bug "chỉ chạy được sau khi clear cache", còn cache một dependency bị xâm nhập giữ một vấn đề supply-chain xuyên nhiều run. Parallelism ngây thơ trên test dùng chung DB, port cố định, hay global state tạo flakiness *mới* — isolation phải có trước khi fan-out.
:::

*Đào sâu tiếp — bạn phân biệt thế nào một test flaky thật (non-deterministic) với một test đang bắt đúng một race thật trong product code?*

**Từ khoá ăn điểm** — `cache key = lockfile hash` · `layer caching` · `sharding` · `test isolation` · `quarantine lane` · `no blanket retry`

## 5-card — senior — [Progressive-delivery, Rollback]
**Question:** Leadership wants zero-downtime deploys and automatic rollback if a release degrades error rate or latency, without a human watching a dashboard at 2am. Contrast blue/green and canary as the pipeline's deploy gate, and explain how automated rollback actually decides to abort.
**Verdict:** KEEP — Senior progressive-delivery contrast plus the metric-driven analysis loop and the code-vs-data rollback trap.

### New answer (en)
**TL;DR** — Both keep two versions alive so you shift traffic instead of replacing in place. **Blue/green** flips the load balancer to the full new version all at once (instant rollback by flipping back); **canary** ramps real traffic in steps and gates each step on automated **metric analysis** — that analysis loop is how rollback aborts with nobody awake.

**How it works** — Canary routes a growing slice of real traffic (1% → 5% → 25% → 100%) to the new version. A controller (Argo Rollouts, Flagger, a service mesh) queries metrics — error rate, p99 latency, saturation — compares canary vs baseline over a window, and promotes only if they stay within thresholds, otherwise it auto-aborts and shifts traffic back. Blue/green instead runs green beside blue and flips the LB after smoke checks; rollback is an instant flip to blue.

:::muted
**Trade-off** — Blue/green is simple with instant rollback but doubles infrastructure during cut-over and exposes 100% of users the moment you flip, so a bad release hits everyone (briefly). Canary limits blast radius and catches subtle regressions real traffic reveals, but is slower, needs solid metric pipelines and a sensible baseline, and stateful changes (DB schema migrations) don't canary cleanly because both versions hit the same data.
:::

:::muted
**Common pitfall** — Automated rollback is only as good as its signals: too short a window or noisy metrics cause false aborts; too-lenient thresholds promote a degrading canary to 100%. A canary with too little or unrepresentative traffic gives no meaningful signal, so the gate rubber-stamps. The deadliest trap: rollback rolls back *code*, not *data* — an irreversible migration or a message consumed in a new format means flipping back to blue leaves state the old version can't read, so migrations must be backward-compatible (expand/contract) first.
:::

*Go deeper — for a release that includes a schema migration, what ordering of migrate-vs-deploy lets you still roll back safely under expand/contract?*

**Keywords** — `blue/green` · `canary` · `analysis run` · `error rate · p99 · saturation` · `baseline vs canary` · `expand/contract migration` · `rollback ≠ data`

### New answer (vi)
**Chốt** — Cả hai đều giữ hai phiên bản cùng sống để bạn dịch traffic thay vì thay tại chỗ. **Blue/green** lật load balancer sang full phiên bản mới cùng một lúc (rollback tức thì bằng lật ngược lại); **canary** tăng traffic thật theo từng bước và gate mỗi bước bằng **metric analysis** tự động — chính cái vòng analysis đó là cách rollback abort mà không cần ai thức.

**Cơ chế** — Canary định tuyến một lát traffic thật ngày càng lớn (1% → 5% → 25% → 100%) sang phiên bản mới. Một controller (Argo Rollouts, Flagger, một service mesh) truy vấn metric — error rate, latency p99, saturation — so canary với baseline qua một cửa sổ, và chỉ promote nếu nằm trong ngưỡng, ngược lại tự abort và dịch traffic về lại. Blue/green thì chạy green bên cạnh blue và lật LB sau smoke check; rollback là lật về blue tức thì.

:::muted
**Trade-off** — Blue/green đơn giản với rollback tức thì nhưng nhân đôi hạ tầng trong lúc cut-over và phơi 100% người dùng ngay khoảnh khắc lật, nên một release tệ giáng vào tất cả (trong chốc lát). Canary giới hạn blast radius và bắt regression tinh vi mà traffic thật mới lộ, nhưng chậm hơn, cần metric pipeline vững và một baseline hợp lý, và thay đổi stateful (migration schema DB) không canary gọn vì cả hai phiên bản đụng cùng dữ liệu.
:::

:::muted
**Bẫy thường gặp** — Automated rollback chỉ tốt ngang tín hiệu của nó: cửa sổ quá ngắn hay metric nhiễu gây false abort; ngưỡng quá lỏng promote một canary đang xuống cấp lên 100%. Một canary nhận quá ít hoặc không-đại-diện traffic không cho tín hiệu có ý nghĩa, nên gate đóng dấu cho có. Bẫy chết người nhất: rollback roll back *code*, không phải *data* — một migration không đảo ngược được hay một message đã consume ở format mới nghĩa là lật về blue để lại state mà phiên bản cũ không đọc nổi, nên migration phải tương thích ngược (expand/contract) trước.
:::

*Đào sâu tiếp — với một release có migration schema, thứ tự migrate-vs-deploy nào cho phép bạn vẫn rollback an toàn theo expand/contract?*

**Từ khoá ăn điểm** — `blue/green` · `canary` · `analysis run` · `error rate · p99 · saturation` · `baseline vs canary` · `expand/contract migration` · `rollback ≠ data`

## 6-card — senior — [GitOps, Reconciliation]
**Question:** Today your pipeline ends with `kubectl apply` using prod cluster credentials handed to the CI runner, and nobody can tell whether the live cluster matches what's in git after someone hotfixed it by hand. How does a GitOps pull model (Argo CD / Flux) change this, versus the push approach you have?
**Verdict:** KEEP — Push vs pull, drift reconciliation, and credential-surface reasoning — strong senior GitOps depth.

### New answer (en)
**TL;DR** — A GitOps pull model makes **git the single source of truth and an in-cluster agent (Argo CD, Flux) continuously pulls and reconciles** the live cluster toward it. CI stops deploying and never holds cluster credentials, and the reconcile loop continuously detects drift — so "does live match git?" becomes a verifiable answer.

**How it works** — CI only builds the artifact and writes the new image tag into the git manifests (often via a PR). The agent watches the repo, sees the diff, and applies it from *inside* the cluster, so prod credentials never leave the cluster. Because reconciliation runs in a loop, a hand-edited resource is flagged OutOfSync and can be auto-corrected back to what git declares — versus push, where after `kubectl apply` nothing reconciles and manual edits silently diverge.

:::muted
**Trade-off** — Pull removes standing cluster credentials from CI (smaller attack surface), gives a full git audit trail and trivial rollback (revert the commit), and makes drift visible — but adds a component to operate, introduces eventual-consistency latency (you wait for the next reconcile), and emergency break-glass changes must still go through git or you reintroduce drift. It also pushes complexity into repo structure: modelling environments, secrets, and promotion between clusters.
:::

:::muted
**Common pitfall** — Push `kubectl apply` needs powerful prod credentials on the runner (a juicy target) and nothing reconciles afterward, so any `kubectl edit` silently diverges. With GitOps: secrets — you can't commit plaintext, so forgetting sealed/external secrets leaks credentials; auto-sync fighting a legitimate emergency fix and reverting it mid-incident; and treating git as truth while the image tag is a mutable `latest`, so the "declared" state still drifts.
:::

*Go deeper — during an incident the on-call must hotfix the cluster faster than a PR-and-reconcile cycle allows; how do you reconcile that need with auto-sync without reintroducing untracked drift?*

**Keywords** — `pull model` · `reconciliation loop` · `desired state in git` · `OutOfSync / drift` · `no cluster creds in CI` · `sealed/external secrets`

### New answer (vi)
**Chốt** — GitOps pull model biến **git thành nguồn sự thật duy nhất và một agent trong cluster (Argo CD, Flux) liên tục pull và reconcile** cluster live về phía nó. CI ngừng deploy và không bao giờ giữ credential cluster, và vòng reconcile liên tục phát hiện drift — nên "live có khớp git không?" trở thành câu trả lời kiểm chứng được.

**Cơ chế** — CI chỉ build artifact và ghi image tag mới vào manifest trong git (thường qua một PR). Agent theo dõi repo, thấy diff, và apply nó từ *bên trong* cluster, nên credential prod không bao giờ rời cluster. Vì reconciliation chạy theo vòng lặp, một resource bị sửa tay bị đánh dấu OutOfSync và có thể tự sửa về đúng thứ git khai báo — so với push, nơi sau `kubectl apply` không gì reconcile và sửa tay âm thầm lệch.

:::muted
**Trade-off** — Pull gỡ credential cluster thường trực khỏi CI (attack surface nhỏ hơn), cho audit trail git đầy đủ và rollback dễ (revert commit), và làm drift hiện ra — nhưng thêm một component phải vận hành, đưa vào độ trễ eventual-consistency (bạn chờ lần reconcile tiếp), và thay đổi break-glass khẩn cấp vẫn phải đi qua git nếu không bạn tái tạo drift. Nó cũng đẩy phức tạp vào cấu trúc repo: mô hình hóa environment, secret, và promotion giữa các cluster.
:::

:::muted
**Bẫy thường gặp** — Push `kubectl apply` cần credential prod mạnh trên runner (một mục tiêu béo bở) và không gì reconcile sau đó, nên mọi `kubectl edit` âm thầm lệch. Với GitOps: secret — không thể commit plaintext, nên quên sealed/external secret là rò credential; auto-sync đánh nhau với một fix khẩn cấp hợp lệ và revert nó giữa sự cố; và coi git là sự thật trong khi image tag là `latest` mutable, nên state "đã khai báo" vẫn drift.
:::

*Đào sâu tiếp — trong sự cố, on-call phải hotfix cluster nhanh hơn chu kỳ PR-rồi-reconcile cho phép; bạn dung hòa nhu cầu đó với auto-sync thế nào mà không tái tạo drift không-track?*

**Từ khoá ăn điểm** — `pull model` · `reconciliation loop` · `desired state in git` · `OutOfSync / drift` · `no cluster creds in CI` · `sealed/external secrets`

## 7-card — staff — [Scale, Trunk-based]
**Question:** You're asked to design the delivery setup for 40 services owned by 8 teams that want to ship multiple times a day. Reason through the big levers — monorepo vs poly-repo, trunk-based development vs long-lived branches, and per-PR preview environments — and where each one helps or hurts at this scale.
**Verdict:** KEEP — Open-ended staff-level design across three coupled levers with scale-specific failure modes — exactly the breadth a real interviewer probes.

### New answer (en)
**TL;DR** — Optimise for **small, frequent, independent changes**: trunk-based development behind feature flags, a repo layout chosen for the team's coupling (monorepo with change-detection, or poly-repo with version discipline), and ephemeral per-PR preview environments. Each lever trades coordination cost against autonomy and CI scale.

**How it works** — **Trunk-based**: short-lived branches merged to main daily behind feature flags, so integration is continuous and flags decouple deploy from release (half-done work ships dark). **Monorepo** gives atomic cross-service changes and one toolchain but *requires* change-detection so CI only builds affected services; **poly-repo** gives autonomy and independent pipelines but spreads cross-cutting changes across many PRs with version skew. **Per-PR previews** ephemerally deploy the changed services wired to shared deps, so QA tests real behaviour before merge, then tear down automatically.

:::muted
**Trade-off** — Monorepo centralises tooling and makes lockstep changes trivial but needs heavy investment in build graphs, remote caching, and affected-target detection or CI time explodes; poly-repo keeps each pipeline small but turns a shared-contract change into a multi-repo coordination dance. Trunk-based maximises flow but only works with strong tests, flags, and fast CI — without them a broken main blocks everyone. Full-fidelity previews are expensive, so most teams stub or share heavy backing services.
:::

:::muted
**Common pitfall** — At scale the silent killers: a monorepo rebuilding *everything* on every commit (no change detection) makes CI the bottleneck and pushes people to batch — the opposite of the goal; poly-repo version skew ships a contract service B hasn't adopted, breaking prod despite green individual pipelines. Long-lived branches reintroduce merge hell. Previews leak cost if not reliably torn down, go flaky when sharing mutable state across PRs, and give false confidence if they diverge from prod topology.
:::

*Go deeper — for the shared-contract change that spans many services, what mechanism (consumer-driven contracts, versioned APIs, expand/contract) lets you roll it out without a synchronized multi-repo deploy?*

**Keywords** — `trunk-based` · `feature flags` · `monorepo + change detection` · `affected targets` · `version skew` · `ephemeral preview envs` · `deploy ≠ release`

### New answer (vi)
**Chốt** — Tối ưu cho **thay đổi nhỏ, thường xuyên, độc lập**: trunk-based development sau feature flag, một bố cục repo chọn theo độ coupling của team (monorepo có change-detection, hoặc poly-repo có kỷ luật version), và preview environment ephemeral theo từng PR. Mỗi cần gạt đánh đổi chi phí phối hợp với autonomy và quy mô CI.

**Cơ chế** — **Trunk-based**: branch ngắn hạn merge vào main hằng ngày sau feature flag, để tích hợp liên tục và flag tách deploy khỏi release (việc dở dang ship được ở chế độ dark). **Monorepo** cho thay đổi cross-service nguyên tử và một toolchain nhưng *đòi hỏi* change-detection để CI chỉ build service bị ảnh hưởng; **poly-repo** cho autonomy và pipeline độc lập nhưng rải thay đổi xuyên suốt qua nhiều PR với version skew. **Preview theo từng PR** deploy ephemeral các service thay đổi nối với shared dep, để QA test hành vi thật trước merge, rồi tự động dọn.

:::muted
**Trade-off** — Monorepo tập trung tooling và làm thay đổi đồng bộ tầm thường nhưng cần đầu tư nặng vào build graph, remote cache, và affected-target detection nếu không thời gian CI bùng nổ; poly-repo giữ mỗi pipeline nhỏ nhưng biến một thay đổi shared-contract thành một điệu nhảy phối hợp đa repo. Trunk-based tối đa hóa flow nhưng chỉ chạy được với test mạnh, flag, và CI nhanh — thiếu chúng, main vỡ chặn tất cả. Preview đầy đủ đắt, nên đa số team stub hoặc dùng chung các backing service nặng.
:::

:::muted
**Bẫy thường gặp** — Ở quy mô này các sát thủ thầm lặng: một monorepo rebuild *mọi thứ* trên mỗi commit (không change detection) khiến CI thành nút cổ chai và đẩy người ta gom thay đổi — ngược mục tiêu; poly-repo version skew ship một contract mà service B chưa adopt, làm vỡ prod dù từng pipeline đều xanh. Branch dài hạn tái tạo merge hell. Preview rò chi phí nếu không được dọn đáng tin cậy, trở nên flaky khi dùng chung mutable state qua các PR, và cho cảm giác tự tin giả nếu lệch khỏi topology prod.
:::

*Đào sâu tiếp — với một thay đổi shared-contract trải nhiều service, cơ chế nào (consumer-driven contract, versioned API, expand/contract) cho phép bạn roll out mà không cần một deploy đa-repo đồng bộ?*

**Từ khoá ăn điểm** — `trunk-based` · `feature flags` · `monorepo + change detection` · `affected targets` · `version skew` · `ephemeral preview envs` · `deploy ≠ release`
