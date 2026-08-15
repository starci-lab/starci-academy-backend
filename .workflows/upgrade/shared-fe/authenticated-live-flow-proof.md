<!-- starci-workflow: v2 -->

# Bắt buộc kiểm thử luồng đăng nhập thật trong FE Apply

## plan

### CONTEXT

| Field | Value |
|---|---|
| Workdir | `D:\Repositories\starci-academy-backend\.claude` |
| Source | D:\Repositories\starci-academy-backend |
| Project | Luật FE Apply dùng chung cho StarCi và Nivo |
| Frontend | Không có target product trong upgrade trust-only; mỗi Apply phải resolve frontend từ Project đã khai báo |
| Backend | `D:\Repositories\starci-academy-backend` — Source và Workflow owner, không được suy diễn là backend target của product run |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | `shared-fe` |
| Repo / branch | `D:\Repositories\starci-academy-backend\.claude` @ `main` |
| Purpose | Lập kế hoạch bắt buộc FE Apply đăng nhập bằng test account, chạy luồng thật và kiểm tra đồng thời UI, Network, Console và terminal. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\shared-fe\authenticated-live-flow-proof.md |
| Language | vi |
| Phase | plan |
| Touching | Chỉ workflow này; chưa sửa trust tree trong Plan |

### Bằng chứng và kế hoạch

| Hạng mục | Kết luận |
|---|---|
| Thiếu sót hiện tại | FE Apply có typecheck, lint, build và render nhưng chưa bắt buộc đăng nhập test account, kiểm tra browser Network/Console và đối chiếu terminal frontend/backend. |
| Quy tắc đề xuất | Mọi flow authenticated hoặc runtime-backed phải có một bảng `LIVE FLOW PROOF`; ảnh hoặc click thành công không đủ nếu Network, Console hoặc Terminal còn lỗi chưa giải thích. |
| An toàn credential | Chỉ ghi account label/persona đã redacted; không ghi password, token, cookie, authorization header hoặc URL chứa secret. |
| Phạm vi skill | `starci-fe-design-apply`, `starci-fe-consolidate-apply`, `starci-fe-lint-sync-apply`; trust-only Apply không cần đăng nhập product. |
| Test obligation | Shared reference phải tồn tại, ba Apply skill phải load reference và nhắc đủ Network, Console, terminal cùng workflow table. |

### OUTPUTS

| Concept | Result |
|---|---|
| Live flow proof | Đề xuất một chuẩn kiểm thử runtime chung cho các FE Apply của StarCi và Nivo. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/upgrade/shared-fe/authenticated-live-flow-proof.md` | `added` — ghi Plan tiếng Việt cho rule upgrade. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Có áp dụng rule cho ba FE Apply ghi product source và cho phép `not-applicable` chỉ khi có diff evidence không? | Có — đúng yêu cầu đăng nhập/test luồng của user; Không — giữ proof hiện tại. |

### WARNINGS

| Warning | Impact |
|---|---|
| Test account không được hardcode trong shared skill. | Mỗi product run phải resolve account/persona từ Project, test config, secret store hoặc user; thiếu account thì flow ở trạng thái `OWED`. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Apply chỉ dừng ở typecheck, lint, build hoặc screenshot. | Đăng nhập test account, chạy flow thật và kiểm tra UI + Network + Console + terminal. | User yêu cầu: “BƯỚC APPLY THÌ NHỚ ĐĂNG NHẬP ACC TEST NHƯ NIVO STARCI VÀO VÀ TEST CÁC LUỒNG ... CHECK TERMINAL NETWORK XEM CÓ FAIL KHÔNG”. |

### OWED

| Owed | Cleared by |
|---|---|
| Review wording, write boundary và test obligation. | `starci-fe-upgrade-review`. |

## review

### CONTEXT

| Field | Value |
|---|---|
| Workdir | `D:\Repositories\starci-academy-backend\.claude` |
| Source | D:\Repositories\starci-academy-backend |
| Project | Luật FE Apply dùng chung cho StarCi và Nivo |
| Frontend | Không có target product trong upgrade trust-only; mỗi Apply phải resolve frontend từ Project đã khai báo |
| Backend | `D:\Repositories\starci-academy-backend` — Source và Workflow owner, không được suy diễn là backend target của product run |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | `shared-fe` |
| Repo / branch | `D:\Repositories\starci-academy-backend\.claude` @ `main` |
| Purpose | Review và chốt wording, scope, credential safety cùng proof surfaces trước khi sửa skills. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\shared-fe\authenticated-live-flow-proof.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow này; không sửa trust tree trong Review |

Approved revision: `authenticated-live-flow-proof-r1`

### Quyết định đã duyệt

| Quyết định | Kết quả |
|---|---|
| Identity | Dùng account test riêng theo đúng app/persona; không dùng account cá nhân hoặc production. |
| Login | Dùng login UI thật ít nhất một lần trong test session, trừ khi boundary loại trừ auth và session có sẵn được ghi nhận. |
| Proof surfaces | Cùng time window phải kiểm tra UI, Network, Console và terminal frontend/backend. |
| Failure rule | UI xanh nhưng một surface còn lỗi chưa giải thích thì flow vẫn fail. |
| Workflow schema | Ghi `### LIVE FLOW PROOF` với Flow, Persona, Steps, UI, Network, Console, Terminal, Verdict và Evidence. |
| Write boundary | Shared reference, ba FE Apply skill, ba UI metadata file và một twin test mới. |

### OUTPUTS

| Concept | Result |
|---|---|
| Approved revision | `authenticated-live-flow-proof-r1` khóa account safety, bốn proof surfaces và close condition. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/upgrade/shared-fe/authenticated-live-flow-proof.md` | `modified` — append Review revision đã được user cho tiếp tục. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | User đã yêu cầu tiếp tục, ghi workflow và push skills lên `main`. |

### WARNINGS

| Warning | Impact |
|---|---|
| Worktree trust có thay đổi Fidelity không thuộc task này. | Apply chỉ stage đúng tám path đã duyệt; không commit hoặc sửa các path Fidelity đang dở. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Hardcode tài khoản Nivo/StarCi trong skill. | Resolve account từ Project/test config/secret store/user ở từng run. | Shared trust phải dùng được trên máy/app khác và không làm lộ credential. |

### OWED

| Owed | Cleared by |
|---|---|
| Apply đúng write boundary và chạy gate. | `starci-fe-upgrade-apply`. |

## apply

### CONTEXT

| Field | Value |
|---|---|
| Workdir | `D:\Repositories\starci-academy-backend\.claude` |
| Source | D:\Repositories\starci-academy-backend |
| Project | Luật FE Apply dùng chung cho StarCi và Nivo |
| Frontend | Không có target product trong upgrade trust-only; mỗi Apply phải resolve frontend từ Project đã khai báo |
| Backend | `D:\Repositories\starci-academy-backend` — Source và Workflow owner, không được suy diễn là backend target của product run |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | `shared-fe` |
| Repo / branch | `D:\Repositories\starci-academy-backend\.claude` @ `main` |
| Purpose | Áp dụng revision đã duyệt, chứng minh gate xanh và chuẩn bị push trust commit lên `main`. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\shared-fe\authenticated-live-flow-proof.md |
| Language | vi |
| Phase | apply |
| Touching | Workflow này; shared live-flow reference; Design/Consolidate/Lint Sync Apply skill + metadata; twin test mới |

Applied revision: `authenticated-live-flow-proof-r1`
Baseline commit: `4168864`
Tracked diff: `4168864..428013d` cho tám path của task; mọi thay đổi Fidelity có sẵn được giữ ngoài commit

### Kết quả kiểm chứng

| Proof | Result |
|---|---|
| Skill validation | `starci-fe-design-apply`, `starci-fe-consolidate-apply`, `starci-fe-lint-sync-apply`: `Skill is valid!`. |
| Twin test | `node --test sources/live-flow-proof.test.mjs`: 1 pass, 0 fail. |
| Full trust gate | `npm test`: 187 pass, 0 fail. |
| Secret boundary | Reference cấm ghi password, token, cookie, authorization header và secret-bearing URL. |
| Commit | `428013d feat(skills): require authenticated FE flow proof`. |

### OUTPUTS

| Concept | Result |
|---|---|
| Authenticated FE Apply proof | Các FE Apply ghi product source phải chạy flow thật bằng test persona và kiểm tra đủ UI, Network, Console, Terminal. |
| Close condition | Flow `failed` hoặc `blocked` không được đóng Apply; thiếu test account/runtime/log surface phải ghi `OWED`. |

### CHANGES

| Tree | Details |
|---|---|
| `.claude/skills/starci-fe-design-review/references/live-flow-proof.md` | `added` — chuẩn account safety, real login, four-surface proof và workflow schema. |
| `.claude/skills/starci-fe-design-apply/SKILL.md` | `modified` — bắt buộc live proof cho authenticated/runtime-backed flow. |
| `.claude/skills/starci-fe-design-apply/agents/openai.yaml` | `modified` — prompt nêu live test obligation. |
| `.claude/skills/starci-fe-consolidate-apply/SKILL.md` | `modified` — runtime error làm parity fail. |
| `.claude/skills/starci-fe-consolidate-apply/agents/openai.yaml` | `modified` — prompt nêu four-surface proof. |
| `.claude/skills/starci-fe-lint-sync-apply/SKILL.md` | `modified` — visible/runtime repair phải live-test; config-only cần N/A evidence. |
| `.claude/skills/starci-fe-lint-sync-apply/agents/openai.yaml` | `modified` — prompt nêu live-test affected flows. |
| `.claude/sources/live-flow-proof.test.mjs` | `added` — twin gate giữ reference và ba Apply lane đồng bộ. |
| `.workflows/upgrade/shared-fe/authenticated-live-flow-proof.md` | `added` — Plan, Review, Apply và test evidence bằng tiếng Việt. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | User đã yêu cầu push skills lên `main`. |

### WARNINGS

| Warning | Impact |
|---|---|
| Workflow nằm ở Source repo, không nằm trong trust git commit. | Đúng single Workflow root; file được giữ tại `<Source>/.workflows`. |
| Worktree trust vẫn có thay đổi Fidelity không thuộc commit `428013d`. | Không ảnh hưởng commit live-flow; không được reset/clean trước khi task Fidelity kết thúc. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Xem screenshot/click thành công là đủ. | Correlate cùng flow trên UI, Network, Console và Terminal. | Backend/GraphQL có thể fail dù UI vẫn giữ state cũ hoặc optimistic state. |

### OWED

| Owed | Cleared by |
|---|---|
| Push commit `428013d` và các commit main đang ahead lên `origin/main`. | `git push origin main`, sau đó xác nhận local/remote SHA. |

## apply push confirmation

### CONTEXT

| Field | Value |
|---|---|
| Workdir | `D:\Repositories\starci-academy-backend\.claude` |
| Source | D:\Repositories\starci-academy-backend |
| Project | Luật FE Apply dùng chung cho StarCi và Nivo |
| Frontend | Không có target product trong upgrade trust-only; mỗi Apply phải resolve frontend từ Project đã khai báo |
| Backend | `D:\Repositories\starci-academy-backend` — Source và Workflow owner, không được suy diễn là backend target của product run |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | `shared-fe` |
| Repo / branch | `D:\Repositories\starci-academy-backend\.claude` @ `main` |
| Purpose | Xác nhận commit live-flow đã được push và local/remote cùng một SHA. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\shared-fe\authenticated-live-flow-proof.md |
| Language | vi |
| Phase | apply |
| Touching | Chỉ workflow này; không ghi thêm trust source |

Applied revision: `authenticated-live-flow-proof-r1`
Baseline commit: `4168864`
Tracked diff: `4168864..428013d`

### Push evidence

| Proof | Result |
|---|---|
| Push | `git push origin main`: `0fd3386..428013d main -> main`. |
| Local HEAD | `428013d08e21b66cb7e4e5edfedbcd77edb6c94c`. |
| Remote main | `428013d08e21b66cb7e4e5edfedbcd77edb6c94c`. |
| Unrelated worktree | Các thay đổi Fidelity chưa commit vẫn tồn tại cục bộ và không nằm trong remote commit. |

### OUTPUTS

| Concept | Result |
|---|---|
| Published skill rule | Live-flow proof đã có trên `origin/main` và local/remote SHA khớp nhau. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/upgrade/shared-fe/authenticated-live-flow-proof.md` | `modified` — append push confirmation và remote SHA. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | None |

### WARNINGS

| Warning | Impact |
|---|---|
| None | None |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| None | None | None |

### OWED

| Owed | Cleared by |
|---|---|
| None | None |
