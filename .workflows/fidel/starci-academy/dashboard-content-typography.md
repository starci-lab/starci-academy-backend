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
| Purpose | Đồng nhất typography nội dung dài trên Dashboard. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\dashboard-content-typography.md |
| Language | vi |
| Phase | feedback |
| Touching | ContinueLearning component/test; DailyQuest test; TaskProgressRow; CodingProblemList; CodingPracticeHubPage; CourseLearnTodayPage; component contracts; workflow record này. |

Session id: fidel-dashboard-content-typography-20260815-01
Session status: open
Feedback classification: settled small patch

### Binding evidence

| State | Value |
|---|---|
| Request | “text-sm hết cho các title dài; tiêu đề text-sm font-medium; nội dung text-sm thuần”. |
| Route | `http://localhost:3000/vi/dashboard` |
| Viewport / locale / theme | Desktop screenshot / `vi` / light |
| Persona | Signed-in learner |
| Target owners | `ContinueLearning` resume cards and `DailyQuest` task rows. |
| Preserved behavior | Data order, resume action, task completion and reward behavior. |

### OUTPUTS

| Concept | Result |
|---|---|
| Long resume title | `text-sm font-medium`. |
| Supporting content and task copy | `text-sm font-normal`. |

### CHANGES

| Tree | Details |
|---|---|
| FE source | Contract-owned typography correction and focused regression assertions. |
| Workflow | Open Fidelity feedback session recorded before proof. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | User supplied the exact typography recipe and exact Dashboard sections. |

### WARNINGS

| Warning | Impact |
|---|---|
| The two corrected contracts also serve Learn/Coding surfaces. | TypeScript requires every consumer to honor the same settled long-title recipe; those exact consumers are included without changing behavior. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Mixed default `text-base` and explicit `text-sm` in these content surfaces | Explicit `text-sm` ownership | User identified the visible inconsistency. |
| Heavy long-copy treatment | Medium only for titles; normal for body/task copy | Keeps hierarchy without making long lines shout. |

### OWED

| Owed | Cleared by |
|---|---|
| Focused tests, lint and typecheck | Run after patch. |
| Live visual acceptance | User refreshes authenticated Dashboard. |
| Fidelity End/Finality | Run only when requested. |

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
| Purpose | Prove the settled Dashboard typography correction. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\dashboard-content-typography.md |
| Language | vi |
| Phase | feedback |
| Touching | Exact FE paths named in the feedback boundary plus this workflow record. |

Session id: fidel-dashboard-content-typography-20260815-01
Session status: open

### OUTPUTS

| Concept | Result |
|---|---|
| Continue Learning | Resume titles are `text-sm font-medium`; kind/content remains `text-sm font-normal`. |
| Daily Quest | Task copy is `text-sm font-normal`; loading skeleton uses the same size. |
| Shared contract parity | Learn and Coding consumers of the same long-title contracts now satisfy the exact recipe. |

### CHANGES

| Tree | Details |
|---|---|
| `ContinueLearning` | Changed title `md → sm`; added title/content typography regression test. |
| `TaskProgressRow` / `DailyQuest` | Made task title size explicit `sm`; updated ready and pending assertions. |
| `resume-item-card` / `task-mark-title-fact-row` | Contract metadata now enforces the recipe across all consumers. |
| Learn/Coding consumers | Updated only the type declarations and `Text` size needed to satisfy those contracts. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Refresh the authenticated Dashboard and continue feedback in this open session. |

### WARNINGS

| Warning | Impact |
|---|---|
| Full `tsc --noEmit` reaches one pre-existing error at `src/components/layouts/GlobalAiChatLayout/index.test.tsx:27` (`ContentAiRouteAnchor.kind`). | AI belongs to another active session and was intentionally not modified; all typography-related TypeScript errors are cleared. |
| `src/components/contracts/index.ts` contains unrelated existing course-detail edits. | Only the two typography contract lines were changed here; unrelated hunks were preserved. |
| Vitest prints the repository's Vite native-loader advisory; ESLint prints the repository React-version advisory. | Both commands exit successfully. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Keep other consumers at `md` while the shared contract says `sm` | Align every exact contract consumer | TypeScript correctly rejected contradictory contract ownership. |
| Fix unrelated AI type failure | Preserve AI session boundary | User explicitly separated the AI work. |

### OWED

| Owed | Cleared by |
|---|---|
| User visual acceptance | Refresh `http://localhost:3000/vi/dashboard` and inspect both sections. |
| Full repo typecheck | The separate AI session clears `GlobalAiChatLayout/index.test.tsx:27`, then rerun `npx tsc --noEmit --pretty false`. |
| Fidelity End/Finality | Run only when the user asks to end/finalize this session. |

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
| Purpose | Đóng Continue Learning và Daily Quest typography. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\dashboard-content-typography.md |
| Language | vi |
| Phase | end |
| Touching | Workflow record, recorded session source boundary và final evidence only. |

Session id: fidel-dashboard-content-typography-20260815-01
Session status: open

### RELATED BUGS

| Finding | Evidence | Classification | Route |
|---|---|---|---|
| Không có title dài nào trong hai block còn dùng hierarchy bị bác. | Source scan, focused tests và localhost closure proof | not-a-bug | None |
| Owed ngoài production boundary | None — lỗi AI typecheck cũ không còn tái hiện trong current tsc. | new-boundary | None |

### OUTPUTS

| Concept | Result |
|---|---|
| End identity | fidel-dashboard-content-typography-20260815-01 tại FE baseline 85f4e6663dfdea68bb56eec4956cc681641afe35..worktree. |
| Current proof | ContinueLearning và DailyQuest focused tests đạt trong closure suite; TypeScript đạt; live Daily Quest có 5 rows. |
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
| None — lỗi AI typecheck cũ không còn tái hiện trong current tsc. | None |
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
| Purpose | Finalize fidel-dashboard-content-typography-20260815-01 sau End proof đã được user chốt. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\dashboard-content-typography.md |
| Language | vi |
| Phase | finality |
| Touching | Workflow record và final evidence only; không production correction. |

Session id: fidel-dashboard-content-typography-20260815-01
Session status: finalized
Session finalized: fidel-dashboard-content-typography-20260815-01
Final diff identity: FE 85f4e6663dfdea68bb56eec4956cc681641afe35..worktree; BE 7acd312a858be7ed58dc847c25ec86d801be17f8..worktree.

### OUTPUTS

| Concept | Result |
|---|---|
| Closure | Session finalized sau current End evidence. |
| Accepted | Toàn bộ feedback cuối cùng và superseding corrections trong record. |
| Routed | None — lỗi AI typecheck cũ không còn tái hiện trong current tsc. |
| Continuation | Feedback mới phải mở Fidelity Start mới với Continuation of: fidel-dashboard-content-typography-20260815-01. |

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
| None — lỗi AI typecheck cũ không còn tái hiện trong current tsc. | None |
