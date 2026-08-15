<!-- starci-workflow: v2 -->

## start

Session id: fidel-learn-legacy-ai-policy-20260815-01

Session status: open

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Repo / branch | D:\Repositories\starci-academy-fe @ main (`85f4e6663dfdea68bb56eec4956cc681641afe35`) |
| Purpose | Khôi phục `/learn` theo legacy binding và sửa policy StarCi AI theo route, entitlement, assessment safety và conversation continuity đã đo. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\learn-legacy-ai-policy.md |
| Language | vi |
| Phase | start |
| Touching | Workflow này; `src/app/[lang]/courses/[displayId]/learn/page.tsx`; `src/components/layouts/LearnShellLayout/index.tsx` và adjacent test; `src/modules/ai/content-ai-route-context.ts` và test; `src/components/blocks/ai/StarCiAiChat/index.tsx` và adjacent connected test. Không chạm dirty course-detail/auth paths. |

### BINDING EVIDENCE

| Concern | Binding evidence | Expected result |
|---|---|---|
| Default Learn route | Legacy `D:\Repositories\starci-academy\src\app\[locale]\courses\[courseId]\learn\page.tsx` | Bare `/learn` dẫn vào `/learn/content`; Today không thay default legacy. |
| Trial versus paid | Legacy `LearnShellLayout`, `useCourseEnrollment`; backend `GraphQLEnrollmentGuard`, `GraphQLMustEnrolledGuard`, `StartTrialHandler` | Trial row `is_enrolled=false` mở learning miễn phí nhưng không mở paid-only capability. |
| AI route grounding | Current real route tree dưới `src/app/[lang]/courses/[displayId]/learn`; legacy assessment predicates | Narrowest real route wins; AI không xuất hiện trong live evaluated work. |
| AI continuity | Approved global AI direction A plus legacy active-conversation behavior | Conversation không reset khi điều hướng; history/list và create/send đều nhận đúng visible scope. |
| Source/code coach | Approved source-face implementation and user feedback | Exact selected quote remains visible and persisted; compact context remains one line. |

### BASELINE DEFECT

| Defect | Measured difference |
|---|---|
| `/learn` | Current renders `CourseLearnTodayPage`; legacy redirects to `/learn/content`. |
| Challenge grounding | Current segment priority resolves nested challenge routes as `content`. |
| Assessment hiding | Current regexes name route shapes that do not exist for nested challenge, mock-interview `interview`, and singular playground. |
| Scoped history | `StarCiAiChat` creates/sends with `anchorRequest` but calls `useQueryContentAiSessionsSwr()` without it. |
| Live AI | Cold live proof showed no FAB while the app retained an account surface; auth/session restoration remains a separate measured warning unless this boundary proves the owner. |

### OUTPUTS

| Concept | Result |
|---|---|
| Active correction | Restore legacy Learn entry and make StarCi AI route/context policy truthful on the current deep-route tree. |
| Session state | Open; production correction and focused/live proof follow immediately inside the frozen boundary. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/fidel/starci-academy/learn-legacy-ai-policy.md` | added — fidelity session, binding evidence, baseline defects and production boundary. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | User explicitly requested Learn legacy parity and authorized chatbot policy judgment with legacy evidence. |

### WARNINGS

| Warning | Impact |
|---|---|
| FE worktree contains unrelated dirty auth/course-detail changes. | Preserve them and do not include them in this session's claims or edits. |
| Backend course-scope trial grounding and session creation currently disagree. | If FE cannot express a truthful policy without backend change, route the backend delta through feature Plan → Review → Apply; do not hide it in this session. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Current A+B Today default | Legacy `/learn` entry to `/learn/content` | User: “sửa learn để follow legacy”. |

### OWED

| Owed | Cleared by |
|---|---|
| Production correction | In-boundary source edits with adjacent tests. |
| Focused and live proof | Vitest/typecheck/lint plus canonical `http://localhost:3000` route checks. |
| User acceptance | Explicit confirmation; session remains open until Fidelity Finality. |

## feedback

Session id: fidel-learn-legacy-ai-policy-20260815-01

Session status: open

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Legacy | D:\Repositories\starci-academy @ mtp |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Repo / branch | D:\Repositories\starci-academy-fe @ main; baseline `85f4e6663dfdea68bb56eec4956cc681641afe35` |
| Purpose | Finish legacy-parity Learn navigation and the real lesson Source code tab. StarCi AI is explicitly deferred and retained at its current boundary. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\learn-legacy-ai-policy.md |
| Language | vi |
| Phase | feedback |
| Touching | Learn entry/module/content routes, curriculum navigation, exact GraphQL projections, Source-code runtime proof, adjacent tests, and the already-started auth/layout seams required for live proof. |

### OUTPUTS

| Concept | Result |
|---|---|
| Default Learn entry | `/[lang]/courses/[displayId]/learn` redirects to legacy `/learn/content`; Today is not the default. |
| Curriculum flow | Module rows and nested lesson rows navigate to the real module/content routes. Trial/free learning does not require an enrollment row; premium entitlement remains authoritative. |
| Lesson Source code | `Reading`, `Source code`, and `Challenge` are distinct lesson faces. Source code opens the real file tree, editor, preview iframe, reset-local-edits action, and selected-file state. |
| Source ownership | Browser reads a synchronized MinIO lesson snapshot. GitHub is the sync-time origin, matching the legacy sandbox boundary; the browser does not fetch GitHub live. |
| StarCi AI | No further AI product expansion in this pass. The current broad-chat/context work is retained and deferred. |
| Live proof | `http://localhost:3000/en/courses/fullstack-mastery/learn/content/modules/dc528b81-7f4f-58d7-8da3-dc88911f681c/contents/dd3d74b1-80a1-5a17-af23-9b81f5123fdb` opened the populated Source code workspace. |

### CHANGES

| Tree | Details |
|---|---|
| `src/app/[lang]/courses/[displayId]/learn/page.tsx` and test | Restored legacy default redirect to `/learn/content`. |
| Learn content/module pages and `CurriculumModuleRow` plus tests | Connected module and lesson navigation without changing premium ownership. |
| `query-module.ts`, `query-content.ts`, related types/tests | Matched the backend handler's loaded graph exactly; removed non-loaded relation fields that caused non-null GraphQL failures. |
| `GlobalAiChatLayout` and adjacent test | Kept Learn context available during cold auth restoration while AI visibility remains independently gated. No new AI scope added here. |
| Sign-in init/types and adjacent tests | Preserved credentials/session semantics needed by the authorized local account proof. |
| `src/messages/en.json`, `src/messages/vi.json` | Added/updated Learn wording used by the restored flow. |
| Local runtime configuration | Pointed frontend MinIO reads to the actual local host port `9001`; no secret is recorded in this workflow. |
| Backend `.repo` and local MinIO | Provisioned the nine configured `fullstack-mastery` repositories and uploaded all 36 lesson sandbox snapshots using the existing synchronizer semantics. Runtime-only/ignored data; no production source claim. |
| Exact local test identity sessions | Cleared stale sessions for the authorized test identity only, then proved a fresh browser login. No learning data was reset. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | User explicitly said to defer AI, retain it as-is, and finish Learn with the Source code tab. |

### WARNINGS

| Warning | Impact |
|---|---|
| The frontend worktree contains extensive concurrent unrelated changes, especially `src/components/contracts/index.ts`. | Whole-project TypeScript currently emits app-wide `never` contract errors from that concurrent registry work. This session does not rewrite or claim those files. |
| Local `.repo` and MinIO provisioning are runtime evidence. | Deployment environments must run the normal repository synchronizer/source provisioning; local uploads are not a production migration. |
| Existing local next-intl time-zone and SMTP mail-job warnings remain. | They do not block the Learn/Source-code route proof and are outside this correction boundary. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Today as bare `/learn` default | Legacy `/learn/content` entry | Binding legacy behavior and the user's explicit direction. |
| Fetch GitHub directly from the learner browser | Synchronize GitHub into a MinIO lesson snapshot | Matches legacy sandbox ownership and prevents client credentials/rate-limit coupling. |
| Continue redesigning StarCi AI in this pass | Freeze current AI state | User explicitly deferred chatbot work until Learn is complete. |

### OWED

| Owed | Cleared by |
|---|---|
| User visual acceptance | Review the retained live Source-code proof; session remains open until Fidelity End/Finality. |
| Production source provisioning | Run the normal repository synchronizer in the target environment. |
| Whole-project TypeScript green | Resolve/finish the separate concurrent contracts-registry change, then rerun the global gate. |

### PROOF

| Gate | Result |
|---|---|
| Focused Vitest | PASS — 12 files, 53 tests. |
| Targeted ESLint | PASS — zero errors; only the repository's React-version configuration warning. |
| Message JSON parse | PASS — English and Vietnamese catalogs parse. |
| Live browser | PASS — fresh authenticated session, lesson route, Source code tab, populated file tree/editor/preview. |
| Snapshot availability | PASS — 36 lesson snapshots uploaded; public lesson object returned HTTP 200. |
| Whole-project TypeScript | BLOCKED OUTSIDE BOUNDARY — concurrent dirty contracts registry produces broad `never` errors. |

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
| Purpose | Đóng Learn legacy parity và giữ AI ngoài boundary. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\learn-legacy-ai-policy.md |
| Language | vi |
| Phase | end |
| Touching | Workflow record, recorded session source boundary và final evidence only. |

Session id: fidel-learn-legacy-ai-policy-20260815-01
Session status: open

### RELATED BUGS

| Finding | Evidence | Classification | Route |
|---|---|---|---|
| Không có preview icon tím lặp; production source provisioning là deployment boundary. | Source scan, focused tests và localhost closure proof | not-a-bug | None |
| Owed ngoài production boundary | Production repository synchronizer/provisioning được route sang deployment continuation. | new-boundary | Linked deployment capability |

### OUTPUTS

| Concept | Result |
|---|---|
| End identity | fidel-learn-legacy-ai-policy-20260815-01 tại FE baseline 85f4e6663dfdea68bb56eec4956cc681641afe35..worktree. |
| Current proof | Curriculum/Learn focused proof đạt; live lesson Source code mở file tree và Preview; AI vẫn hiện theo policy đã chốt. |
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
| Production repository synchronizer/provisioning được route sang deployment continuation. | Linked deployment capability |
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
| Purpose | Finalize fidel-learn-legacy-ai-policy-20260815-01 sau End proof đã được user chốt. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\learn-legacy-ai-policy.md |
| Language | vi |
| Phase | finality |
| Touching | Workflow record và final evidence only; không production correction. |

Session id: fidel-learn-legacy-ai-policy-20260815-01
Session status: finalized
Session finalized: fidel-learn-legacy-ai-policy-20260815-01
Final diff identity: FE 85f4e6663dfdea68bb56eec4956cc681641afe35..worktree; BE 7acd312a858be7ed58dc847c25ec86d801be17f8..worktree.

### OUTPUTS

| Concept | Result |
|---|---|
| Closure | Session finalized sau current End evidence. |
| Accepted | Toàn bộ feedback cuối cùng và superseding corrections trong record. |
| Routed | Production repository synchronizer/provisioning được route sang deployment continuation. |
| Continuation | Feedback mới phải mở Fidelity Start mới với Continuation of: fidel-learn-legacy-ai-policy-20260815-01. |

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
| Linked owed không bị tuyên bố hoàn thành | Linked deployment capability |
| Concurrent whole-repo failures vẫn được giữ nguyên | Không làm sai lệch focused proof của session này. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Append feedback vào session đã finalized | Mở linked continuation session | Finality đóng vĩnh viễn session id này. |

### OWED

| Owed | Cleared by |
|---|---|
| Production repository synchronizer/provisioning được route sang deployment continuation. | Linked deployment capability |
