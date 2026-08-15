<!-- starci-workflow: v2 -->

## plan

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | starci-academy |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Repo / branch | D:\Repositories\starci-academy-backend / mtp |
| Purpose | Đề xuất rule tách small patch khỏi creative direction trong Fidelity Start. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\starci-academy\fidelity-small-patch-and-creative-routing.md |
| Language | vi |
| Phase | plan |
| Touching | Chỉ workflow upgrade này. |

Window: toàn bộ workflow `starci-academy`, tập trung hai record course-detail hiện tại và lifecycle upgrade trước đó.

### Refusal groups

| Group | Refusals / witnesses | Rule at the time | Missing law | Home |
|---|---|---|---|---|
| Mixed feedback bị route cả khối | `fidel/starci-academy/course-detail-ownership-and-rail.md`, feedback: “Chờ Design Apply mới sửa rail small patch” → “Sửa ngay trong Fidelity feedback”; `designs/starci-academy/course-detail-page-v4.md`, plan: “Rail phẳng, không card” → `SurfaceCard` + sticky như legacy | Fidelity Start nói correction trong boundary sửa ngay và product choice route sang Design Plan, nhưng không nói phải tách từng item trong một feedback hỗn hợp. | Split feedback item-by-item. Settled small patch phải sửa/prove ngay; một item creative không được kéo các patch độc lập sang Design Plan. | `starci-fe-fidelity-start/SKILL.md` PROCESS. |
| Agent tự chọn concept sáng tạo | `fidel/starci-academy/course-detail-ownership-and-rail.md`, feedback: “Tự chọn một layout mới cho stats/rail” → “Preview ba case”; `designs/starci-academy/course-detail-page-v4.md`, plan: “Stats chỉ là dãy badge nhỏ” → một trong ba composition có hierarchy rõ | Fidelity Start chỉ nói route undecided product choice sang Design Plan, chưa khóa số lượng case và trigger “sáng tạo/concept mới”. | Khi user yêu cầu sáng tạo/concept mới, không chọn production layout; invoke Design Plan và dựng 3–4 case implementation-feasible, trong khi Fidelity session và mọi patch độc lập vẫn tiếp tục. | `starci-fe-fidelity-start/SKILL.md` PROCESS. |

### Proposed wording

| Rule | Exact intent |
|---|---|
| Item split | Classify each feedback item independently; never classify a mixed message as one block. |
| Small patch | If expected result/owner/reference is settled and boundary is authorized, edit production immediately, prove it, append `## feedback`; never wait for Design Plan/Review/Apply. |
| Creative request | Explicit “sáng tạo”, “concept mới”, “đề xuất layout” means no production choice: invoke `$starci-fe-design-plan` for 3–4 implementation-feasible HTML cases. |
| Acceptance | Proof is not user acceptance. Keep `OWED` until user says the correction is satisfactory; then append acceptance in the same open session. |

### OUTPUTS

| Concept | Result |
|---|---|
| Fidelity routing rule | Tách item-level small patch, creative direction và acceptance thay vì route nguyên feedback như một khối. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/upgrade/starci-academy/fidelity-small-patch-and-creative-routing.md` | added — Plan proposal và real rejection witnesses. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | User đã làm rõ rule rồi yêu cầu “sửa đi”; Review vẫn phải khóa exact wording/test/boundary trước trust write. |

### WARNINGS

| Warning | Impact |
|---|---|
| “Lưu workspace” không được diễn giải thành tự động commit/stage. | Skill chỉ ghi acceptance và giữ source diff; git mutation cần yêu cầu riêng. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Route toàn bộ mixed feedback sang Design Plan | Split item-by-item | Small patch đã rõ phải được sửa ngay. |
| Tự thiết kế production khi nghe “sáng tạo” | Preview 3–4 case | User phải chọn concept trước. |

### OWED

| Owed | Cleared by |
|---|---|
| Exact approved wording, home, test và write boundary | Upgrade Review bên dưới. |

## review

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | starci-academy |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Repo / branch | D:\Repositories\starci-academy-backend / mtp |
| Purpose | Khóa exact wording, home, test obligation và trust write boundary. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\starci-academy\fidelity-small-patch-and-creative-routing.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow upgrade này. |

Approved revision: fidelity-item-routing-v1
Approval evidence: User xác nhận mô hình “fidelity sửa luôn rồi ghi feedback; sáng tạo thì HTML 3–4 case” và tiếp tục bằng “sửa đi”.

### Review verdict

| Proposal | Approved wording | Home | Test obligation | Write boundary | Status |
|---|---|---|---|---|---|
| Item-level routing | “Split mixed feedback item by item. A creative item never delays an independent authorized small patch.” | Fidelity Start `Continuous feedback` | Skill test asserts item split and no-delay wording. | Fidelity Start SKILL + skill test | APPROVED |
| Immediate small patch | “When expected result and owner are settled, edit production immediately, run focused proof and append feedback; do not wait for Design Plan/Review/Apply.” | Fidelity Start `Continuous feedback` | Skill test asserts immediate correction and prohibited wait. | Fidelity Start SKILL + skill test | APPROVED |
| Creative preview | “Explicit creative/new-concept requests invoke Design Plan for 3–4 implementation-feasible HTML cases; do not choose a production layout.” | Fidelity Start routing preface + feedback table | Skill test asserts trigger, count and Design Plan route. | Fidelity Start SKILL + skill test + metadata prompt | APPROVED |
| Acceptance | “A passing proof is not user acceptance; keep acceptance owed until user confirms, then append it in the same open session.” | Fidelity Start `Continuous feedback` | Skill test asserts acceptance wording. | Fidelity Start SKILL + skill test | APPROVED |

### OUTPUTS

| Concept | Result |
|---|---|
| Approved revision | `fidelity-item-routing-v1` khóa small patch, creative preview, mixed-item split và acceptance semantics. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/upgrade/starci-academy/fidelity-small-patch-and-creative-routing.md` | modified — appended approved Review. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | “sửa đi” phê duyệt đúng revision vừa được mô tả, không mở rộng ngoài Fidelity Start. |

### WARNINGS

| Warning | Impact |
|---|---|
| Fidelity Start vẫn không commit/stage tự động. | Acceptance được lưu vào workflow; git persistence chỉ theo yêu cầu git rõ ràng. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Sửa Design Plan hoặc mọi Fidelity skill | Chỉ Fidelity Start | Rule điều khiển lúc nhận/act on feedback; End/Finality không sở hữu correction routing. |

### OWED

| Owed | Cleared by |
|---|---|
| Apply trust wording and prove gates | Upgrade Apply với exact boundary đã approved. |

## apply

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | starci-academy |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Repo / branch | D:\Repositories\starci-academy-backend / mtp |
| Purpose | Apply revision `fidelity-item-routing-v1` và prove trust gates. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\starci-academy\fidelity-small-patch-and-creative-routing.md |
| Language | vi |
| Phase | apply |
| Touching | `.claude/skills/starci-fe-fidelity-start/SKILL.md`, metadata của skill, `.claude/sources/skills.test.mjs` và workflow upgrade này. |

Applied revision: fidelity-item-routing-v1

### Applied rules

| Rule | Result |
|---|---|
| Mixed feedback | Bắt buộc split từng item; creative item không được delay small patch độc lập. |
| Small patch | Khi expected result, owner và boundary đã rõ thì sửa production, prove và append feedback ngay; không chờ Design Plan/Review/Apply. |
| Creative request | “sáng tạo”, new concept hoặc several layout directions route sang Design Plan với 3–4 HTML cases; Fidelity không tự chọn production layout. |
| Acceptance | Proof pass chưa phải user acceptance; giữ acceptance trong `OWED`, append khi user xác nhận; không tự Finality/stage/commit. |

### Verification

| Gate | Result |
|---|---|
| Trust fetch | `git fetch origin --prune` thành công trước trust write. |
| Skill validation | `quick_validate.py` chạy UTF-8: `Skill is valid!`. |
| Focused skill tests | 13/13 pass. |
| Full trust tests | 188/188 pass. |
| Diff check | Target trust diff không có whitespace error. |

### OUTPUTS

| Concept | Result |
|---|---|
| Fidelity item routing | Fidelity Start giờ sửa small patch ngay, tách mixed feedback và chỉ mở 3–4 case preview cho phần user yêu cầu sáng tạo. |
| Acceptance discipline | Workspace correction chỉ được gọi là accepted sau khi user xác nhận; skill không tự suy ra git mutation hoặc Finality. |

### CHANGES

| Tree | Details |
|---|---|
| `.claude/skills/starci-fe-fidelity-start/SKILL.md` | modified — thêm item split, immediate small patch, creative preview và acceptance rules. |
| `.claude/skills/starci-fe-fidelity-start/agents/openai.yaml` | modified — metadata phản ánh routing mới. |
| `.claude/sources/skills.test.mjs` | modified — regression gate cho bốn semantics mới. |
| `.workflows/upgrade/starci-academy/fidelity-small-patch-and-creative-routing.md` | modified — Plan, approved Review và Apply proof. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Exact user-requested rule đã applied; không stage/commit. |

### WARNINGS

| Warning | Impact |
|---|---|
| Validator Python mặc định dùng Windows-1252. | Phải chạy `python -X utf8`; skill content hợp lệ và UTF-8. |
| Global workflow validator còn lỗi cũ trong `learn-branch.md`. | Không liên quan trust tests hoặc revision này. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Regex test phụ thuộc một dòng Markdown | Whitespace-tolerant assertion | Wording đúng nhưng Markdown wrap làm focused test fail lần đầu. |

### OWED

| Owed | Cleared by |
|---|---|
| None | None |

### Fetch correction

The first `git fetch origin --prune` targeted Source, not the nested `.claude` trust repository, so
the “Trust fetch” verification row above was premature. Before handoff, Apply detected the nested
repository and ran `git -C .claude fetch --all --prune` against
`https://github.com/starci183/starci-claude-skills.git`. It completed without conflict; the intended
skill directory remains the untracked Start rename from the earlier lifecycle upgrade and
`sources/skills.test.mjs` contains the measured test addition.
