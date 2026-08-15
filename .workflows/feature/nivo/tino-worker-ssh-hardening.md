<!-- starci-workflow: v2 -->

## plan r1

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | nivo |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | nivo |
| Database | Primary PostgreSQL through `InjectPrimaryEntityManager`; durable hardening state belongs to the capacity action item. |
| Repo / branch | D:\Repositories\nivo-backend @ `main` (`6d4e68322bab900cfef17029dcc3a9fabd40a420`) |
| Purpose | Thiết kế bootstrap SSH retry-safe: tạo operator, xác minh key/sudo rồi tắt password và root login mà không tự khóa worker. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\nivo\tino-worker-ssh-hardening.md |
| Language | vi |
| Phase | plan |
| Touching | Chỉ D:\Repositories\starci-academy-backend\.workflows\feature\nivo\tino-worker-ssh-hardening.md; không ghi product source trong Plan. |

### SCHEMA AND SIBLING EVIDENCE

Live schema có đủ 113 mutation và không cần cửa SSH mới; hardening tiếp tục nằm sau Tino activation trong capacity worker. `ClusterNodeBootstrapService` hiện cài ED25519 key vào `root`, `join()` cũng dùng `TINO_SSH_USERNAME=root`, và chưa lưu trạng thái hardening. `ClusterScaleOutService` là orchestrator hiện hữu; entity/action-item và migration cùng primary PostgreSQL là nguồn retry state.

### PROPOSED CAPABILITY

Revision đề xuất: `nivo-tino-worker-ssh-hardening-r1`.

1. Dùng credential Tino tạm thời chỉ để mở phiên bootstrap root đã pin fingerprint.
2. Tạo user operator cấu hình được, mặc định `nivo`; home/authorized_keys mode chuẩn; thêm sudoers file giới hạn cho k3s/node operations cần thiết hoặc `NOPASSWD:ALL` ở dev revision theo quyết định Review.
3. Mở phiên ED25519 thứ hai bằng operator, chạy `sudo -n true` và xác minh fingerprint trước khi thay sshd.
4. Ghi atomically `/etc/ssh/sshd_config.d/99-nivo-hardening.conf`: `PasswordAuthentication no`, `KbdInteractiveAuthentication no`, `PermitRootLogin no`; chạy `sshd -t`, reload service.
5. Từ một kết nối mới, xác minh operator-key vẫn vào được và root/password bị từ chối; sau đó mới persist `ssh_operator_username` và `ssh_hardened_at`.
6. Retry nhận diện ba trạng thái: chưa bootstrap, operator sẵn sàng nhưng chưa harden, đã harden. Nếu crash sau reload nhưng trước DB save, operator-key probe tái lập state mà không cần password.
7. Mọi lần join/reconcile sau hardening dùng operator + `sudo`; không log password, private key hoặc command chứa secret.

### PROPOSED FILE TREE

| Tree | Details | Shape evidence |
|---|---|---|
| `D:\Repositories\nivo-backend\.env.example` | modified — bootstrap/operator username and hardening switch. | Existing Tino SSH env family. |
| `D:\Repositories\nivo-backend\src\modules\platform\env\config.ts` | modified — typed SSH bootstrap/operator settings. | Existing `tinoCapacity` owner. |
| `D:\Repositories\nivo-backend\src\modules\platform\databases\postgresql\primary\entities\cluster-capacity-action-item.entity.ts` | modified — durable operator/hardened state. | Existing per-provider-node ledger. |
| `D:\Repositories\nivo-backend\src\modules\platform\databases\postgresql\primary\migrations\1787961600000-tino-worker-ssh-hardening.ts` | added — additive nullable columns. | Existing primary migration family. |
| `D:\Repositories\nivo-backend\src\modules\bussiness\cluster-capacity\types\cluster-node.ts` | modified — observed SSH access state if needed by service boundary. | Existing cluster-node types. |
| `D:\Repositories\nivo-backend\src\modules\bussiness\cluster-capacity\cluster-node-bootstrap.service.ts` | modified — create/probe operator, atomic sshd hardening and operator-based join. | Existing SSH owner; no new shell orchestration service. |
| `D:\Repositories\nivo-backend\src\modules\bussiness\cluster-capacity\cluster-node-bootstrap.service.spec.ts` | modified — exhaustive bootstrap/hardening twin. | Existing twin. |
| `D:\Repositories\nivo-backend\src\modules\bussiness\cluster-capacity\cluster-scale-out.service.ts` | modified — persist/reconcile hardening phases before join. | Existing durable provider-to-Node orchestrator. |
| `D:\Repositories\nivo-backend\src\modules\bussiness\cluster-capacity\cluster-scale-out.service.spec.ts` | modified — crash/retry phase proof. | Existing orchestrator twin. |
| `D:\Repositories\nivo-backend\src\modules\platform\exceptions\errors\cluster-capacity\cluster-node-ssh-hardening-failed.ts` | added — structured domain exception with safe metadata only. | Existing cluster-capacity exception family. |
| `D:\Repositories\nivo-backend\src\tests\e2e\nivo\tino-worker-ssh-hardening.live-spec.ts` | added — opt-in real-worker access proof. | Existing live-spec family. |

### TEST MATRIX

| Case | Expected proof |
|---|---|
| Missing key/fingerprint/operator name | Refuse before changing user or sshd. |
| Fresh VPS | Create operator once, install one key, validate non-interactive sudo. |
| Operator already exists | Idempotently keep account/key/sudoers; no duplicate key. |
| Invalid candidate config | `sshd -t` fails; old config remains and service is not reloaded. |
| Operator probe fails | Password/root auth remains enabled; action retries safely. |
| Successful hardening | New operator-key session works; root key and root/password login fail. |
| Crash after reload before DB save | Retry detects operator-key access and converges durable state without provider password. |
| Already hardened item | No password lookup and no duplicate config mutation; k3s join/reconcile still works. |
| Wrong host fingerprint | Refuse every connection before authentication. |
| Live retained worker | Worker remains Kubernetes Ready and schedulable after hardening; backend can reconnect as operator. |

### OUTPUTS

| Concept | Result |
|---|---|
| Tino worker SSH hardening brief | `nivo-tino-worker-ssh-hardening-r1`: operator-first verification, atomic sshd change, durable retry state. |
| Lockout protection | Password/root login is disabled only after a second operator-key session proves access and sudo. |
| Secret boundary | Provider password remains transient and disappears from retries once operator access is established. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\feature\nivo\tino-worker-ssh-hardening.md` | added — source evidence, state machine, file tree and test matrix. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Operator sudo boundary | Recommended for current dev cluster: `nivo` gets `NOPASSWD:ALL`, because k3s install/repair currently shells arbitrary root setup; later restrict commands after the bootstrap tool is split. Alternative: command allowlist now, with higher lockout/maintenance risk. |
| Apply to retained worker `357725` | Recommended: harden this one worker after unit/E2E gates, keep a current SSH session open until fresh operator and Kubernetes Ready proofs pass. Alternative: apply only to future workers and leave this worker as historical exception. |

### WARNINGS

| Warning | Impact |
|---|---|
| A wrong sshd write can permanently remove remote access. | Apply requires atomic config, syntax validation, second-session verification and an open recovery session. |
| Tino portal/API continues displaying the original root password. | After hardening it no longer authenticates over SSH, but it remains vendor-side recovery data. |
| Disabling root login changes retry assumptions in current scale-out code. | Durable phase and operator fallback are mandatory; a one-shot shell edit is not acceptable. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Disable password/root before testing operator | Verify operator key and sudo in a second session first | Prevent self-lockout. |
| Store root password for retry | Persist only operator username/hardening timestamp | Password must remain transient. |

### OWED

| Owed | Cleared by |
|---|---|
| Review approval | `$starci-be-feature-review` freezes sudo scope, retained-worker mutation and exact boundary. |
| Apply/live proof | `$starci-be-feature-apply` plus real fresh-session SSH and Kubernetes Ready checks. |

## review r1.1

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | nivo |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | nivo |
| Database | Primary PostgreSQL capacity action-item ledger. |
| Repo / branch | D:\Repositories\nivo-backend @ `main` (`6d4e68322bab900cfef17029dcc3a9fabd40a420`) |
| Purpose | Challenge lockout, crash windows, privilege scope và retained-worker mutation before SSH hardening Apply. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\nivo\tino-worker-ssh-hardening.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow này; production/worker mutation waits for explicit approval. |

Candidate revision: `nivo-tino-worker-ssh-hardening-r1.1`.

Approved revision: `nivo-tino-worker-ssh-hardening-r1.1` — owner approved all three r1.1 revisions with “ok” on 2026-08-15, including dev-only operator scope and retained worker `357725`.

### REVIEW FINDINGS

| Finding | Revision |
|---|---|
| Hardening trước k3s join làm tăng recovery path cần root. | Fresh worker: install key -> join k3s -> create/probe operator -> harden; retry after harden uses operator. |
| DB save sau reload có crash window. | Operator-key probe is source of reconciliation truth; nullable DB timestamp is projection, not the only truth. |
| `NOPASSWD:ALL` is broad but current bootstrap shells a full k3s installer. | Freeze it as dev-cluster-only r1.1; production command allowlist is a later revision after installer commands are decomposed. |
| Testing rejection can consume auth attempts. | One bounded password/root negative probe after positive operator session; no loops and no credential logging. |

### FROZEN CANDIDATE BOUNDARY

Use exactly the Plan r1 files. Additive migration stores `ssh_operator_username` and `ssh_hardened_at`. `ClusterNodeBootstrapService` remains sole SSH owner; `ClusterScaleOutService` persists/reconciles. Exception metadata contains node/service identity only. Apply may harden retained dev worker service `357725` only after all deterministic gates pass and while an existing recovery session remains open.

### OUTPUTS

| Concept | Result |
|---|---|
| Candidate revision | `nivo-tino-worker-ssh-hardening-r1.1` ready for explicit approval. |
| Sequence | Join first, verify operator, atomic harden, fresh-session prove, persist. |
| Retry model | Operator probe reconciles crash-after-reload state without stored password. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\feature\nivo\tino-worker-ssh-hardening.md` | modified — appended Review findings and frozen candidate boundary. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Approve SSH revision | Recommended: approve `nivo-tino-worker-ssh-hardening-r1.1`, dev-only `nivo` operator with `NOPASSWD:ALL`, and harden only retained worker `357725` after gates pass. |

### WARNINGS

| Warning | Impact |
|---|---|
| Retained worker is a real remote machine. | A failed reload/probe can require Tino console recovery; Apply must stop before closing the recovery session if any fresh-session proof fails. |
| `NOPASSWD:ALL` is not the production least-privilege endpoint. | It removes password/root exposure now but retains root-equivalent access through the dedicated operator key. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Harden before k3s join | Join first, harden after operator proof | Keeps initial bootstrap and recovery path simple. |
| Trust DB timestamp alone after retry | Probe actual operator access | Crash may happen between sshd reload and DB save. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval | Owner approves `nivo-tino-worker-ssh-hardening-r1.1` and retained-worker mutation. |
| Apply | Baseline commit, deterministic specs, migration proof and fresh-session live hardening proof. |

## review r1.2

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | nivo |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | nivo |
| Database | Primary PostgreSQL capacity action-item ledger. |
| Repo / branch | D:\Repositories\nivo-backend @ `main` (`511e9bf`) |
| Purpose | Correct the frozen boundary so the additive SSH hardening migration is actually registered at runtime. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\nivo\tino-worker-ssh-hardening.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow này; `primary.module.ts` chờ owner duyệt r1.2. |

Candidate revision: `nivo-tino-worker-ssh-hardening-r1.2`.

### REVIEW FINDINGS

| Finding | Revision |
|---|---|
| `primary.module.ts` đăng ký migrations bằng mảng tĩnh; chỉ tạo file `1787961600000-tino-worker-ssh-hardening.ts` sẽ khiến production không bao giờ chạy migration. | Bổ sung đúng một path vào boundary: import và append `TinoWorkerSshHardening1787961600000` trong migration array; không đổi connection/module behavior khác. |

### REVISED FILE TREE

Giữ nguyên toàn bộ boundary r1.1 và bổ sung duy nhất `D:\Repositories\nivo-backend\src\modules\platform\databases\postgresql\primary\primary.module.ts` — modified: import và register migration `TinoWorkerSshHardening1787961600000` ở cuối migration array.

### OUTPUTS

| Concept | Result |
|---|---|
| Candidate revision | `nivo-tino-worker-ssh-hardening-r1.2` sửa thiếu sót registration của r1.1. |
| Runtime migration | Additive columns chỉ được coi là triển khai khi class migration nằm trong static registry. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\feature\nivo\tino-worker-ssh-hardening.md` | modified — appended boundary correction r1.2. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Approve SSH revision correction | Recommended: approve `nivo-tino-worker-ssh-hardening-r1.2`, adding only `primary.module.ts` import + migration-array registration to r1.1. |

### WARNINGS

| Warning | Impact |
|---|---|
| Chạy live hardening trước migration registration sẽ tạo lệch giữa host state và durable projection. | VPS 357725 chưa bị mutate; live gate tiếp tục chờ r1.2. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Migration file không đăng ký | Static registry import + append | Runtime hiện không auto-discover migration files. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval | Owner approves `nivo-tino-worker-ssh-hardening-r1.2`. |
| Apply + live proof | Register migration, prove migration/build/tests, then harden retained service 357725 only. |

Approved revision: `nivo-tino-worker-ssh-hardening-r1.2`.

## review r1.3

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | nivo |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| App | nivo |
| Repo / branch | D:\Repositories\nivo-backend @ `main` (`511e9bf`) |
| Purpose | Repair the live Ubuntu/Tino OpenSSH precedence and crash-retry convergence found by the retained-worker proof. |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\nivo\tino-worker-ssh-hardening.md |
| Phase | review |
| Touching | This workflow only; no further VPS mutation or production-source edit before approval. |

Candidate revision: `nivo-tino-worker-ssh-hardening-r1.3`.

Approved revision: `nivo-tino-worker-ssh-hardening-r1.3`.

### LIVE FINDING

| Evidence | Result |
|---|---|
| Retained worker | `nivo-worker-357725` remains Kubernetes `Ready`. |
| Atomic script | Stopped before reload because `sshd -T` still reported `passwordauthentication yes`. |
| Root cause | Ubuntu cloud image owns `/etc/ssh/sshd_config.d/60-cloudimg-settings.conf`; OpenSSH first-value precedence means `99-nivo-hardening.conf` cannot override its `PasswordAuthentication yes`. |
| Partial state | Operator `nivo`, authorized key, sudoers file and the ineffective `99-` drop-in exist; current sshd was not reloaded. No secret was logged. |

### REVISED BOUNDARY

Keep the approved r1.2 file tree. Inside `ClusterNodeBootstrapService` and its existing spec only:

1. Converge policy in `/etc/ssh/sshd_config.d/00-nivo-hardening.conf`, then remove stale `99-nivo-hardening.conf`.
2. Separate operator bootstrap from policy convergence. If operator already works after a crash, run the policy phase through that operator with non-interactive sudo instead of skipping it.
3. Validate sudoers, `sshd -t`, all three effective `sshd -T` values, then reload.
4. Open fresh sessions: operator must succeed, root must fail. Preserve bounded retries and structured errors.
5. Re-run the same retained-worker live spec; do not create or mutate another VPS.

### OUTPUTS

| Concept | Result |
|---|---|
| Candidate revision | `nivo-tino-worker-ssh-hardening-r1.3` |
| Source boundary | No new production file; behavior correction stays in the already approved bootstrap service/spec. |
| Remote boundary | Finish convergence on service `357725` only. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\feature\nivo\tino-worker-ssh-hardening.md` | modified — recorded failed live proof, root cause and r1.3 correction. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Approve SSH repair | Recommended: approve `nivo-tino-worker-ssh-hardening-r1.3` and finish hardening retained worker `357725` only. |

### WARNINGS

| Warning | Impact |
|---|---|
| Worker is in an intermediate but recoverable state. | Operator key exists; current sshd was not reloaded. A reboot would apply the existing `PermitRootLogin no`, so r1.3 should be completed before planned reboot. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Keep `99-` drop-in | Use `00-` drop-in | Ubuntu's `60-cloudimg-settings.conf` wins by first-value precedence. |
| Treat operator connectivity as fully hardened | Reconcile effective sshd policy through operator sudo | A crash can leave operator ready while policy remains incomplete. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval | Owner approves `nivo-tino-worker-ssh-hardening-r1.3`. |
| Apply proof | Unit/build/lint plus retained-worker fresh-session live proof and Kubernetes Ready check. |

## apply

### CONTEXT

| Field | Value |
|---|---|
| Source | D:\Repositories\starci-academy-backend |
| Project | nivo |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| App | nivo |
| Applied revision | `nivo-tino-worker-ssh-hardening-r1.3` |
| Baseline commit | `511e9bf` |
| Apply commit | `0ecdf00` |
| Live target | Tino service `357725`, node `nivo-worker-357725`, and no other VPS. |

### OUTPUTS

| Capability | Result |
|---|---|
| Durable SSH state | Added and registered additive operator/timestamp columns; local runtime schema contains both columns. |
| Crash-safe hardening | Dedicated `nivo` operator, ED25519 authorized key, sudo validation, effective `00-` OpenSSH policy, fresh operator success and root refusal. |
| Scale-out integration | Persists node identity before hardening and records operator/timestamp after verified convergence. |
| Live result | PASS on retained worker; Kubernetes node remained `Ready`; exact existing action-item row was backfilled after host proof. |

### CHANGES

| Path | Change |
|---|---|
| `D:\Repositories\nivo-backend\.env.example` | Added operator username and opt-in hardening flag. |
| `D:\Repositories\nivo-backend\src\modules\platform\env\config.ts` | Added typed hardening configuration. |
| `D:\Repositories\nivo-backend\src\modules\platform\databases\postgresql\primary\entities\cluster-capacity-action-item.entity.ts` | Added nullable durable SSH projection. |
| `D:\Repositories\nivo-backend\src\modules\platform\databases\postgresql\primary\migrations\1787961600000-tino-worker-ssh-hardening.ts` | Added reversible migration. |
| `D:\Repositories\nivo-backend\src\modules\platform\databases\postgresql\primary\primary.module.ts` | Registered migration in the static runtime array. |
| `D:\Repositories\nivo-backend\src\modules\platform\exceptions\errors\cluster-capacity\cluster-node-ssh-hardening-failed.ts` | Added structured failure with object metadata only. |
| `D:\Repositories\nivo-backend\src\modules\bussiness\cluster-capacity\types\cluster-node.ts` | Added verified SSH access result. |
| `D:\Repositories\nivo-backend\src\modules\bussiness\cluster-capacity\cluster-node-bootstrap.service.ts` | Added idempotent operator bootstrap and policy convergence through sudo. |
| `D:\Repositories\nivo-backend\src\modules\bussiness\cluster-capacity\cluster-node-bootstrap.service.spec.ts` | Added bootstrap, effective-policy and retry twins. |
| `D:\Repositories\nivo-backend\src\modules\bussiness\cluster-capacity\cluster-scale-out.service.ts` | Integrated persistence and retry ordering. |
| `D:\Repositories\nivo-backend\src\modules\bussiness\cluster-capacity\cluster-scale-out.service.spec.ts` | Proved persistence ordering and retry behavior. |
| `D:\Repositories\nivo-backend\src\tests\e2e\nivo\tino-worker-ssh-hardening.live-spec.ts` | Added exact-target opt-in live proof. |

### NEED APPROVALS

| Item | State |
|---|---|
| Additional VPS | None; no authorization requested and none created. |

### WARNINGS

| Warning | Evidence / disposition |
|---|---|
| First live attempt stopped before reload because Ubuntu `60-cloudimg-settings.conf` beat the reviewed `99-` drop-in. | Recorded in Review r1.3; fixed with `00-` and operator-sudo convergence. Worker stayed recoverable and `Ready`. |
| `NOPASSWD:ALL` is dev-only. | Preserved exactly as approved; production command allowlist remains separate future work. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Retry based only on operator connectivity | Re-apply and validate effective policy through operator sudo | A crash can occur after operator creation but before sshd reload. |
| Mutate another worker or create a VPS | Exact retained service `357725` only | Keeps the approved external boundary. |

### OWED

| Owed | State |
|---|---|
| SSH hardening source/runtime proof | Cleared: exact lint 0 errors; build PASS; focused unit 10/10; full unit 1860/1860; live 1/1; node `Ready=True`. |
| Production least-privilege sudo command allowlist | Deferred by approved dev-only r1.3. |
