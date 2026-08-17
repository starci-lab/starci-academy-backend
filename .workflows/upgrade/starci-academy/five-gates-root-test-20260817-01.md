<!-- starci-workflow: v2 -->

# five-gates-root-test-20260817-01

## plan

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Repo / branch | D:\Repositories\starci-academy-backend / mtp @ 5a5a544434171eb176af0c6d09e33c4d77731753 |
| Purpose | Tạm đưa năm canon shelf của chuỗi suy luận ra một root `/gates` dễ nhìn và dễ test, chưa nối workflow execution. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\starci-academy\five-gates-root-test-20260817-01.md |
| Language | vi |
| Phase | plan |
| Touching | Workflow này và relocation `.claude/fe/{layouts,blocks,principles,patterns,lints}` sang `.claude/fe/gates/{...}`, gồm active links, schema IDs/refs và gate-health path. Không đụng product source hoặc lịch sử workflow. |

### WITNESSES

| Refusal | Failure pattern |
|---|---|
| `designs/starci-academy/course-pricing-rail-rebrainstorm.md` từ chối nested intent cards và ownership sai. | Các shelf có luật nhưng bị ẩn dưới axis `fe`, nên chuỗi gate không hiện thành một lộ trình cần đi qua. |
| `fidel/starci-academy/course-detail-ownership-and-rail.md` từ chối đọc sai component boundary và giữ gap cũ. | Agent nhảy thẳng vào source/canon cục bộ thay vì nhận ra năm lớp kiểm tra liên tiếp. |
| `fidel/starci-academy/course-pricing-rail-trial-phase-density-20260815-01.md` nhiều lần từ chối flat gap. | Vấn đề lặp chứng minh discoverability/consumption của chuỗi chưa đủ, dù từng shelf đã có luật. |

### OUTPUTS

| Concept | Result |
|---|---|
| Approved experiment | `five-gates-root-test-r1`: một root `.claude/fe/gates/` chứa đúng `layouts`, `blocks`, `principles`, `patterns`, `lints`. |
| Non-goal | Chưa ép Design/Fidelity/Apply chạy năm gate; chưa thêm receipt; chưa đổi product source. |
| Identity | Không giữ bản sao ở `.claude/fe`; active links và schema identities phải phản ánh home mới. |
| Historical records | `.workflows` cũ không rewrite; đường dẫn cũ trong hồ sơ là bằng chứng lịch sử. |
| Reversibility | Trước/sau phải giữ nguyên số file và content hash của từng shelf, ngoại trừ các file có neo path/schema được rewrite có chủ đích. |

### CHANGES

| Tree | Planned change |
|---|---|
| `.claude/fe/gates/{layouts,blocks,principles,patterns,lints}` | Move năm shelf từ `.claude/fe`. |
| `.claude/**` | Rewrite active trust links, slugs and schema identities to `/gates/...`. |
| `.claude/scripts/gate-health.mjs` | Resolve shelves từ `gates`, không còn từ `fe`. |
| `.workflows/upgrade/starci-academy/five-gates-root-test-20260817-01.md` | Append Plan, Review approval and Apply evidence. |

### NEED APPROVALS

| Question | Status |
|---|---|
| Apply `five-gates-root-test-r1` | APPROVED by user: “tạm thời bỏ tất cả cannon vào /gates để thầy test trước”. |

### WARNINGS

| Warning | Impact |
|---|---|
| Đây là relocation thử nghiệm, không phải workflow enforcement. | Agent vẫn chưa bị chặn nếu bỏ qua một gate; lượt sau mới thiết kế execution/receipt nếu thầy giữ cấu trúc này. |
| `.claude` đang bị Source ignore. | Git không tự bảo vệ move; Apply phải kiểm đếm và chạy link/schema gates trực tiếp. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Move toàn bộ `.claude/fe` | Chỉ move năm shelf được gọi tên | `canon`, `senses`, `creativity`, `governance`, `baselines`, `references` không phải năm gate thử nghiệm. |
| Copy rồi giữ hai cây | Move một home duy nhất | Hai nguồn sẽ drift và làm gate identity mơ hồ. |
| Rewrite workflow history | Chỉ rewrite trust đang hoạt động | Hồ sơ cũ phải tiếp tục nói đúng đường dẫn tại thời điểm nó được ghi. |

### OWED

| Owed | Cleared by |
|---|---|
| Relocation and active-link repair | Apply below. |
| Workflow enforcement through all five gates | A later Upgrade Plan after the user tests this root. |

## review r1

### OUTPUTS

| Concept | Result |
|---|---|
| Approved revision | `five-gates-root-test-r1` |
| Exact home | `.claude/fe/gates/<gate>` |
| Exact gates | `layouts -> blocks -> principles -> patterns -> lints` |
| Test boundary | File inventory, old-home absence, active link gate, gate-health, full trust test with pre-existing failures classified. |
| Write boundary | The workflow and active `.claude` trust tree only. |

Approved revision: five-gates-root-test-r1

### NEED APPROVALS

| Question | Status |
|---|---|
| Apply | Cleared by the user's explicit temporary-relocation instruction and the announced Touching boundary. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Add redirects/symlinks at old home | Repair active consumers | Compatibility aliases would hide stale ownership and defeat this test. |

### OWED

| Owed | Cleared by |
|---|---|
| Apply evidence | Append after gates run. |

## review r2

### OUTPUTS

| Concept | Result |
|---|---|
| Corrected revision | `five-gates-root-test-r2` |
| Exact home | `.claude/fe/gates/<gate>` |
| Reason | User corrected the temporary root from `.claude/gates` to `.claude/fe/gates` before commit. |
| Scope continuity | The same five shelves, active-link repair, schema repair and no workflow enforcement. |

Approved revision: five-gates-root-test-r2

### NEED APPROVALS

| Question | Status |
|---|---|
| Apply corrected home | Cleared by the user's explicit correction: “`.claude/fe/gates`”. |

## apply

### CONTEXT

| Field | Value |
|---|---|
| Phase | apply |
| Approved revision | `five-gates-root-test-r2` |
| Touching | Active trust tree only: five shelf moves, links, schema identities, gate-health and trust indexes. No product source. |

### OUTPUTS

| Result | Evidence |
|---|---|
| Five shelves relocated | `layouts -> blocks -> principles -> patterns -> lints` now live under `.claude/fe/gates/`. |
| Inventory preserved | 84 + 119 + 135 + 95 + 85 = 518 files; every old `.claude/fe/<shelf>` home is absent. |
| One active identity | `.claude/gates` is absent and no active `.claude/gates/`, `schema/gates/` or old gate-health root remains. |
| Links | `node --test sources/links.test.mjs`: 1/1 pass. |
| Schemas | 5 schema IDs, 17 gate refs, 0 missing refs under `schema/fe/gates/`. |
| Execution boundary | The root is discoverable but skills are not yet forced through all five gates. |

### CHANGES

| Tree | Applied change |
|---|---|
| `.claude/fe/gates/` | Added the temporary ordered gate root and moved the five shelves into it. |
| `.claude/INDEX.md`, `.claude/docs.md` | Repointed active documentation to `fe/gates`. |
| `.claude/fe/baselines/`, `.claude/fe/senses/`, moved shelves | Repaired relative links after the extra nesting level. |
| `.claude/scripts/gate-health.mjs` | Reads shelves from `fe/gates`. |

### NEED APPROVALS

None.

### WARNINGS

| Warning | Impact |
|---|---|
| Gate execution is not enforced yet. | This commit tests discoverability and ownership only. |
| Full trust suite still has three pre-existing failures and gate-health has 47 pre-existing guesses. | They were measured before the corrected home and are not relocation regressions; link/schema relocation gates are green. |

### REJECTED

| Rejected | Instead |
|---|---|
| Root `.claude/gates` | Corrected to `.claude/fe/gates` before commit. |
| Compatibility copies at old homes | One home only; all active consumers were repaired. |
| Product-source changes | Trust relocation only. |

### OWED

| Owed | Cleared by |
|---|---|
| User tests the temporary root | Current commit on the trust repository's `main`. |
| Enforce execution and receipts if the root is accepted | A later Upgrade Plan. |
