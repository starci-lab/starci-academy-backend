<!-- starci-workflow: v2 -->

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
| Purpose | Apply the settled long-copy typography recipe to Course Detail. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-detail-content-typography.md |
| Language | vi |
| Phase | feedback |
| Touching | CourseDetailPage component/test; CurriculumModuleRow source/test; course signal contract; this workflow record. |

Session id: fidel-course-detail-content-typography-20260815-01
Session status: open
Linked recipe: fidel-dashboard-content-typography-20260815-01
Feedback classification: settled small patch

### Binding evidence

| State | Value |
|---|---|
| Request | “rồi tương tự cho” with signal value, value proposition, prerequisite and curriculum title highlighted. |
| Route | `http://localhost:3000/vi/courses/fullstack-mastery` equivalent current course-detail route. |
| Viewport / locale / theme | Desktop screenshot / `vi` / light. |
| Recipe | Long title/value `text-sm font-medium`; list content `text-sm font-normal`. |

### OUTPUTS

| Concept | Result |
|---|---|
| Signal values | `text-sm font-medium`. |
| Value proposition and prerequisite rows | Existing shared row contracts confirmed as `text-sm font-normal`. |
| Curriculum module title | `text-sm font-medium`. |

### CHANGES

| Tree | Details |
|---|---|
| FE source/tests/contracts | Exact typography correction plus assertions for all four highlighted areas. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Exact reference and inherited recipe are settled. |

### WARNINGS

| Warning | Impact |
|---|---|
| FE worktree has unrelated edits. | Preserve them; only exact typography lines are owned here. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| `text-base`/semibold signal values and plain long module titles | Compact medium hierarchy | User asked to apply the same settled recipe. |

### OWED

| Owed | Cleared by |
|---|---|
| Focused test/lint/type proof | Run after patch. |
| User visual acceptance | Refresh Course Detail. |
| Fidelity End/Finality | Only when requested. |

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
| Purpose | Record focused proof for Course Detail typography parity. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-detail-content-typography.md |
| Language | vi |
| Phase | feedback |
| Touching | Exact source/test/contract paths declared above plus this workflow record. |

Session id: fidel-course-detail-content-typography-20260815-01
Session status: open

### OUTPUTS

| Concept | Result |
|---|---|
| Highlighted signal value | `text-sm font-medium`. |
| Highlighted promise/prerequisite copy | `text-sm font-normal`, asserted through rendered `Text` attributes. |
| Highlighted curriculum module title | `text-sm font-medium`. |

### CHANGES

| Tree | Details |
|---|---|
| `CourseDetailPage/component.tsx` | Signal value changed from `md/semibold` to `sm/medium`. |
| `CurriculumModuleRow/index.tsx` | Long module title keeps `text-sm` and now explicitly owns `font-medium`. |
| `components/contracts/index.ts` | Signal contract updated to the same exact recipe. |
| Focused tests | Added assertions for signal, promise, prerequisite and curriculum title typography. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Upgrade Review | The now-qualified shared typography proposal needs explicit Review approval before canon changes. |

### WARNINGS

| Warning | Impact |
|---|---|
| Full typecheck still stops only at unrelated `GlobalAiChatLayout/index.test.tsx:27`. | AI session boundary remains preserved; no Course Detail type failure remains. |
| Vite and ESLint emit existing repository advisories. | Focused tests and lint both exit successfully. |
| Contracts file contains unrelated existing edits. | Only the signal typography line is owned by this correction. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Re-introduce `md/semibold` for compact signal values | `sm/medium` | Same rank recipe now has two page witnesses. |
| Promote body rows to medium | Keep `sm/normal` | Body copy must remain quieter than long titles. |

### OWED

| Owed | Cleared by |
|---|---|
| User visual acceptance | Refresh current Course Detail page. |
| Upgrade Review | Approve exact permanent canon wording and test boundary. |
| Fidelity End/Finality | Run only when requested. |

## feedback-shadow

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
| Purpose | Remove duplicate signal-board paint and retain one HeroUI Card elevation. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-detail-content-typography.md |
| Language | vi |
| Phase | feedback |
| Touching | Course signal contract, CourseDetailPage focused test and this workflow record. |

Session id: fidel-course-detail-content-typography-20260815-01
Session status: open
Feedback classification: existing-canon repair

### OUTPUTS

| Concept | Result |
|---|---|
| Card elevation | HeroUI `Card` default is the only page-card shadow owner. |
| Signal ribbon | Keeps internal cell separators but no longer paints a second outer border/radius/shadow. |

### CHANGES

| Tree | Details |
|---|---|
| `course-signal-board` | Removed outer `rounded-3xl border border-separator`; retained grid and cell rules. |
| Focused test | Rejects border/radius/shadow paint on the inner contract while proving the SurfaceCard owner remains. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Existing contract canon already settles the owner. |

### WARNINGS

| Warning | Impact |
|---|---|
| Nested joined lists intentionally use a border and no shadow per existing canon. | This is not a competing page-card shadow; it prevents nested double elevation. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Contract-owned outer border/radius layered inside HeroUI Card | Branch-owned HeroUI Card default only | The duplicate edge made the lower shadow appear heavier/brown. |

### OWED

| Owed | Cleared by |
|---|---|
| Focused proof | Run Course Detail test, lint and diff gate. |
| Visual acceptance | Refresh current Course Detail route. |

### Proof — shadow correction

| Gate | Result |
|---|---|
| Course Detail focused test | PASS — 5/5, including single SurfaceCard owner and no inner outer-paint classes. |
| Focused ESLint | PASS — repository React-version advisory only. |
| Diff check | PASS — line-ending advisory only. |

### OUTPUTS

| Concept | Result |
|---|---|
| Single page-card shadow | Proven through HeroUI `SurfaceCardSurface` ownership and contract paint rejection. |

### CHANGES

| Tree | Details |
|---|---|
| Workflow | Added focused proof; session remains open. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Continue visual feedback after refresh. |

### WARNINGS

| Warning | Impact |
|---|---|
| None new | None. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Re-add outer paint to signal contract | Keep HeroUI Card as sole surface owner | Regression test now blocks it. |

### OWED

| Owed | Cleared by |
|---|---|
| User visual acceptance | Refresh current route and inspect the lower edge. |
| Fidelity End/Finality | Only when requested. |

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
| Purpose | Đóng typography và single-shadow ownership trên Course Detail. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-detail-content-typography.md |
| Language | vi |
| Phase | end |
| Touching | Workflow record, recorded session source boundary và final evidence only. |

Session id: fidel-course-detail-content-typography-20260815-01
Session status: open

### RELATED BUGS

| Finding | Evidence | Classification | Route |
|---|---|---|---|
| Không có inner contract nào tái sở hữu shadow/radius trong bounded Course Detail surfaces. | Source scan, focused tests và localhost closure proof | not-a-bug | None |
| Owed ngoài production boundary | None — visual closure được user chốt. | new-boundary | None |

### OUTPUTS

| Concept | Result |
|---|---|
| End identity | fidel-course-detail-content-typography-20260815-01 tại FE baseline 85f4e6663dfdea68bb56eec4956cc681641afe35..worktree. |
| Current proof | Course Detail focused/connected tests đạt; live Course Detail render đúng typography và HeroUI surface ownership; build đạt. |
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
| None — visual closure được user chốt. | None |
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
| Purpose | Finalize fidel-course-detail-content-typography-20260815-01 sau End proof đã được user chốt. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-detail-content-typography.md |
| Language | vi |
| Phase | finality |
| Touching | Workflow record và final evidence only; không production correction. |

Session id: fidel-course-detail-content-typography-20260815-01
Session status: finalized
Session finalized: fidel-course-detail-content-typography-20260815-01
Final diff identity: FE 85f4e6663dfdea68bb56eec4956cc681641afe35..worktree; BE 7acd312a858be7ed58dc847c25ec86d801be17f8..worktree.

### OUTPUTS

| Concept | Result |
|---|---|
| Closure | Session finalized sau current End evidence. |
| Accepted | Toàn bộ feedback cuối cùng và superseding corrections trong record. |
| Routed | None — visual closure được user chốt. |
| Continuation | Feedback mới phải mở Fidelity Start mới với Continuation of: fidel-course-detail-content-typography-20260815-01. |

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
| None — visual closure được user chốt. | None |
