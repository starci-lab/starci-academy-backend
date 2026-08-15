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
| Purpose | Restore OAuth buttons từ outline đậm về secondary appearance ban đầu. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\auth-oauth-border.md |
| Language | vi |
| Phase | start |
| Touching | AuthenticationPanel component và focused test; workflow; không chạm global palette hay AI. |

Session id: fidel-auth-oauth-border-20260815-01
Session status: open

### EVIDENCE

| Evidence | Result |
|---|---|
| User render | OAuth button outline đang đậm bất thường; màu nền modal được xác nhận là đúng. |
| Git history | Bản legacy trước component rebuild dùng `variant="secondary"`; refactor sau đổi thành `outline`. |
| Smallest owner | `AuthenticationPanel/component.tsx` sở hữu riêng appearance của hai OAuth actions. |

### OUTPUTS

| Concept | Result |
|---|---|
| OAuth appearance boundary | Restore hai provider actions về secondary; giữ nguyên divider, palette và layout. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/fidel/starci-academy/auth-oauth-border.md` | added — mở fidelity session và đóng băng evidence/write boundary. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | User feedback và git history cùng xác nhận appearance ban đầu. |

### WARNINGS

| Warning | Impact |
|---|---|
| Browser đang zoom 200%. | Làm nét 1px trông dày hơn, nhưng không phải lý do để sửa global border token. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Sửa global border hoặc palette | Restore OAuth variant | User nói màu đang ổn và lịch sử xác nhận regression nằm ở variant. |

### OWED

| Owed | Cleared by |
|---|---|
| Production patch và proof | Restore exact two call sites; run focused test/lint/typecheck và localhost render. |
| User acceptance | User xem lại modal và xác nhận. |

## feedback

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
| Purpose | Sửa nhận định sai trước đó: OAuth đăng nhập/đăng ký phải là `outline`, không phải `secondary`. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\auth-oauth-border.md |
| Language | vi |
| Phase | feedback |
| Touching | `AuthenticationPanel/component.tsx`, focused test và workflow; không chạm palette, Button leaf hay AI. |

Session id: fidel-auth-oauth-border-20260815-01

Session status: open

Binding evidence: thầy xác nhận trực tiếp hai social actions là `outline`; render `secondary` trong ảnh hiện tại là sai hierarchy.

Frozen state: `http://localhost:3000/vi/authentication`, locale `vi`, light theme, anonymous, sign-in details state; cùng owner áp dụng cho sign-up details state.

### OUTPUTS

| Concept | Result |
|---|---|
| OAuth action hierarchy | Google và GitHub là lựa chọn thay thế dạng `outline`; submit đăng nhập/đăng ký vẫn là `primary`, chuyển luồng vẫn là text link. |
| Runtime proof | Cả hai social buttons có `data-variant="outline"`, nền trong suốt và border solid `0.8px` trên localhost. |

### CHANGES

| Tree | Details |
|---|---|
| `src/components/blocks/auth/AuthenticationPanel/component.tsx` | `modified` — đổi đúng hai OAuth call sites từ `secondary` sang `outline`. |
| `src/components/blocks/auth/AuthenticationPanel/component.test.tsx` | `modified` — khóa expected variant của Google và GitHub là `outline`. |
| `.workflows/fidel/starci-academy/auth-oauth-border.md` | `modified` — ghi nhận feedback, nhận sai và proof mới. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Expected result đã được thầy chỉ rõ. |

### WARNINGS

| Warning | Impact |
|---|---|
| Vitest và ESLint vẫn in hai warning cấu hình có sẵn. | 5 focused tests, ESLint và TypeScript đều pass; warnings không sinh từ patch này. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| OAuth dùng `secondary` theo nhận định trước của trò | OAuth dùng `outline` | Thầy xác nhận trực tiếp: “đang outline”, không phải secondary. |

### OWED

| Owed | Cleared by |
|---|---|
| User acceptance | Thầy reload modal đăng nhập/đăng ký và xác nhận border đúng. |
| Fidelity End/Finality | Chỉ chạy khi thầy yêu cầu chốt session. |

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
| Purpose | Đóng fidelity border của modal đăng nhập/đăng ký. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\auth-oauth-border.md |
| Language | vi |
| Phase | end |
| Touching | Workflow record, recorded session source boundary và final evidence only. |

Session id: fidel-auth-oauth-border-20260815-01
Session status: open

### RELATED BUGS

| Finding | Evidence | Classification | Route |
|---|---|---|---|
| Không có auth panel surface cùng cơ chế còn sót. | Source scan, focused tests và localhost closure proof | not-a-bug | None |
| Owed ngoài production boundary | None — user đã chốt closure. | new-boundary | None |

### OUTPUTS

| Concept | Result |
|---|---|
| End identity | fidel-auth-oauth-border-20260815-01 tại FE baseline 85f4e6663dfdea68bb56eec4956cc681641afe35..worktree. |
| Current proof | AuthenticationPanel focused test nằm trong closure suite 50/50; TypeScript và production build đạt. |
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
| None — user đã chốt closure. | None |
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
| Purpose | Finalize fidel-auth-oauth-border-20260815-01 sau End proof đã được user chốt. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\auth-oauth-border.md |
| Language | vi |
| Phase | finality |
| Touching | Workflow record và final evidence only; không production correction. |

Session id: fidel-auth-oauth-border-20260815-01
Session status: finalized
Session finalized: fidel-auth-oauth-border-20260815-01
Final diff identity: FE 85f4e6663dfdea68bb56eec4956cc681641afe35..worktree; BE 7acd312a858be7ed58dc847c25ec86d801be17f8..worktree.

### OUTPUTS

| Concept | Result |
|---|---|
| Closure | Session finalized sau current End evidence. |
| Accepted | Toàn bộ feedback cuối cùng và superseding corrections trong record. |
| Routed | None — user đã chốt closure. |
| Continuation | Feedback mới phải mở Fidelity Start mới với Continuation of: fidel-auth-oauth-border-20260815-01. |

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
| None — user đã chốt closure. | None |
