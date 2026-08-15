<!-- starci-workflow: v2 -->

## start

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | starci-academy |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Repo / branch | D:\Repositories\starci-academy-fe / main @ 85f4e6663dfdea68bb56eec4956cc681641afe35 |
| Purpose | Đồng nhất typography của Streak, AI credit và Coins trên Dashboard. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\dashboard-identity-stats-typography.md |
| Language | vi |
| Phase | start |
| Touching | StatRow composite, contract, focused tests và workflow record này. |

Session id: fidel-dashboard-identity-stats-typography-20260815-01
Session status: open

### OUTPUTS

| Concept | Result |
|---|---|
| Ba nhãn thống kê | Streak, AI credit và Coins dùng text-sm. |
| Ba giá trị thống kê | Số ngày, hạn mức credit và số coin dùng text-sm. |
| Icon | Giữ nguyên kích thước và vai trò dẫn dòng. |

### CHANGES

| Tree | Details |
|---|---|
| FE source | Sửa typography tại owner dùng chung của ba dòng thống kê. |
| Tests | Khóa kích thước nhãn và giá trị bằng focused assertions. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | User đã chốt chính xác ba dòng và kích thước text-sm. |

### WARNINGS

| Warning | Impact |
|---|---|
| StatRow còn được tái sử dụng ngoài IdentityRail. | Chỉ đổi recipe dùng chung nếu mọi consumer giữ đúng hierarchy; focused và type gates sẽ kiểm tra. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Nhãn text-base, giá trị text-xs | Cả hai text-sm | Hai vế cùng cấp đọc trong một dòng thống kê và user đã chốt recipe. |

### OWED

| Owed | Cleared by |
|---|---|
| Focused tests, lint, typecheck và localhost proof | Chạy ngay sau small patch. |
| Fidelity End/Finality | Chỉ chạy khi user yêu cầu kết thúc/chốt session. |

## proof

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | starci-academy |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Repo / branch | D:\Repositories\starci-academy-fe / main @ 85f4e6663dfdea68bb56eec4956cc681641afe35 |
| Purpose | Chứng minh typography thống nhất của ba dòng IdentityRail. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\dashboard-identity-stats-typography.md |
| Language | vi |
| Phase | feedback |
| Touching | StatRow composite/test, glyph-title-fact-row contract và workflow record này. |

Session id: fidel-dashboard-identity-stats-typography-20260815-01
Session status: open

### OUTPUTS

| Concept | Result |
|---|---|
| Streak | Nhãn và 0 days đều data-size sm, computed 14px/20px. |
| AI credit | Nhãn và 500 of 500 đều data-size sm, computed 14px/20px. |
| Coins | Nhãn và 105 coins đều data-size sm, computed 14px/20px. |

### CHANGES

| Tree | Details |
|---|---|
| StatRow | Thêm hierarchy peer: title và fact cùng sm, fact vẫn giữ muted tone. |
| Dashboard owners | Chỉ StreakStatRow, CreditStatRow và RewardStatRow chọn hierarchy peer. |
| Contract | glyph-peer-fact-row khóa recipe sm/sm; label-led StatRow ngoài Dashboard giữ md/xs. |
| Regression | Thêm ready, loading và default-preservation assertions. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Patch đã render trực tiếp trên localhost theo feedback. |

### WARNINGS

| Warning | Impact |
|---|---|
| ESLint in advisory về React version; Vitest in advisory về Vite native config. | Cả hai command vẫn exit 0; không phát sinh lỗi patch. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Đổi mọi StatRow sang sm/sm | Variant peer tại đúng ba Dashboard owners | Không làm lan typography sang giá khóa học và profile. |

### OWED

| Owed | Cleared by |
|---|---|
| User visual acceptance | Feedback tiếp theo trên localhost. |
| Fidelity End/Finality | Chỉ chạy khi user yêu cầu kết thúc/chốt session. |

## end

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | starci-academy |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Repo / branch | D:\Repositories\starci-academy-fe / main @ 85f4e6663dfdea68bb56eec4956cc681641afe35..worktree |
| Purpose | Đóng Streak, AI credit và Coins typography. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\dashboard-identity-stats-typography.md |
| Language | vi |
| Phase | end |
| Touching | Workflow record, recorded session source boundary và final evidence only. |

Session id: fidel-dashboard-identity-stats-typography-20260815-01
Session status: open

### RELATED BUGS

| Finding | Evidence | Classification | Route |
|---|---|---|---|
| Các StatRow ngoài Dashboard giữ recipe riêng và không bị thay đổi. | Source scan, focused tests và localhost closure proof | not-a-bug | None |
| Owed ngoài production boundary | None — user chốt closure. | new-boundary | None |

### OUTPUTS

| Concept | Result |
|---|---|
| End identity | fidel-dashboard-identity-stats-typography-20260815-01 tại FE baseline 85f4e6663dfdea68bb56eec4956cc681641afe35..worktree. |
| Current proof | StatRow và ba connected stat tests đạt; live cả ba label đều data-size sm. |
| Shared gates | TypeScript pass; 14 focused files / 50 tests pass; Next production build pass. |
| Whole-suite audit | 630/645 tests pass; 15 failures được phân loại là concurrent stale tests/environment ngoài session boundary. |

### CHANGES

| Tree | Details |
|---|---|
| Session production boundary | Giữ nguyên correction đã được feedback chấp nhận; End không mở rộng source. |
| Workflow | Append proof, related-bug classification và closure readiness. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | User đã chốt closure run cho toàn bộ fidelity sessions. |

### WARNINGS

| Warning | Impact |
|---|---|
| Whole-repo ESLint quét cả artifacts và mirror đang có 104 lỗi ngoài boundary | Focused lint/proofs đã đạt; không sửa artifacts hoặc concurrent lint source trong Finality. |
| Workflow validator có legacy schema errors | Closure record mới vẫn giữ đủ canonical tables; trust-tree cleanup thuộc Upgrade boundary. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Mở rộng End sang lỗi concurrent | Route theo owning capability | End chỉ sửa same-boundary regression và không chiếm work của session khác. |

### OWED

| Owed | Cleared by |
|---|---|
| None — user chốt closure. | None |
| Session closure | Fidelity Finality ngay sau End theo yêu cầu đã chốt. |

## finality

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
| Repo / branch | FE main @ 85f4e6663dfdea68bb56eec4956cc681641afe35..worktree; BE mtp @ 7acd312a858be7ed58dc847c25ec86d801be17f8..worktree |
| Purpose | Finalize fidel-dashboard-identity-stats-typography-20260815-01 sau End proof đã được user chốt. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\dashboard-identity-stats-typography.md |
| Language | vi |
| Phase | finality |
| Touching | Workflow record và final evidence only; không production correction. |

Session id: fidel-dashboard-identity-stats-typography-20260815-01
Session status: finalized
Session finalized: fidel-dashboard-identity-stats-typography-20260815-01
Final diff identity: FE 85f4e6663dfdea68bb56eec4956cc681641afe35..worktree; BE 7acd312a858be7ed58dc847c25ec86d801be17f8..worktree.

### OUTPUTS

| Concept | Result |
|---|---|
| Closure | Session finalized sau current End evidence. |
| Accepted | Toàn bộ feedback cuối cùng và superseding corrections trong record. |
| Routed | None — user chốt closure. |
| Continuation | Feedback mới phải mở Fidelity Start mới với Continuation of: fidel-dashboard-identity-stats-typography-20260815-01. |

### CHANGES

| Tree | Details |
|---|---|
| Workflow | Added immutable Finality closure identity. |
| Production | None — Finality không sửa source. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | User đã nói “ok chốt đi”. |

### WARNINGS

| Warning | Impact |
|---|---|
| Linked owed không bị tuyên bố hoàn thành | None |
| Concurrent whole-repo failures vẫn được giữ nguyên | Không làm sai lệch focused proof của session này. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Append feedback vào session đã finalized | Mở linked continuation session | Finality đóng vĩnh viễn session id này. |

### OWED

| Owed | Cleared by |
|---|---|
| None — user chốt closure. | None |
