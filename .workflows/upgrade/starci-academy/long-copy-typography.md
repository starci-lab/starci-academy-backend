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
| Repo / branch | D:\Repositories\starci-academy-backend / mtp @ 0a590f2b58768a3b7e4183e998470c33fc05d726 |
| Purpose | Đánh giá rule typography cho title dài và content list. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\starci-academy\long-copy-typography.md |
| Language | vi |
| Phase | plan |
| Touching | Chỉ workflow upgrade này. |

Window: toàn bộ REJECTED records hiện có của app `starci-academy`.

### Witnesses

| Refusal | Rule gap | Proposed home | Status |
|---|---|---|---|
| `fidel/starci-academy/dashboard-content-typography.md`: từ chối trộn `text-base` và `text-sm`; chốt title dài `text-sm font-medium`, nội dung `text-sm` thường. | Canon có scale chung nhưng chưa có recipe rõ cho long-copy card/list title. | Typography canon plus a machine-checkable contract assertion if a second independent rejection confirms the pattern. | WATCHED — one witness only. |
| `fidel/starci-academy/course-detail-content-typography.md`: cùng mismatch tái diễn độc lập ở Course Detail signal, lists và curriculum title. | Shared canon chưa ngăn consumer chọn `md/semibold` hoặc plain weight cho long-copy cùng rank. | Typography canon plus contract-source regression tests. | QUALIFIES — second witness. |

### OUTPUTS

| Concept | Result |
|---|---|
| Candidate rule | Long-copy titles use `text-sm font-medium`; adjacent body/list copy uses plain `text-sm`. |
| Upgrade verdict | PROPOSED for Upgrade Review: two independent page witnesses now establish recurrence. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/upgrade/starci-academy/long-copy-typography.md` | added — records the candidate without changing canon or lint. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Review approval | Freeze exact canon wording, exceptions and machine-test boundary before trust-tree mutation. |

### WARNINGS

| Warning | Impact |
|---|---|
| The two-witness threshold is now met, but Plan still cannot edit trust-tree source. | Product source is corrected now; shared canon waits for Upgrade Review approval. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Editing typography canon directly from Apply feedback | Route the now-qualified proposal through Upgrade Review | Canon wording and exceptions need a frozen review boundary. |

### OWED

| Owed | Cleared by |
|---|---|
| Upgrade Review | Approve exact wording, home, test and write boundary. |
