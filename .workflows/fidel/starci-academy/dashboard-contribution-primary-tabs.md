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
| Repo / branch | D:\Repositories\starci-academy-fe / main @ 1bc591b73b0ad0fce8114d9d7f1c19e52bca6e9b |
| Purpose | Sửa year selector của Dashboard contribution calendar thành primary full-width underline run như ShellNav, không đổi hành vi chọn năm. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\dashboard-contribution-primary-tabs.md |
| Language | vi |
| Phase | start |
| Touching | D:\Repositories\starci-academy-fe\src\components\leaves\ChoiceTabs\index.tsx; D:\Repositories\starci-academy-fe\src\components\composites\ContributionCalendar\index.tsx; D:\Repositories\starci-academy-fe\src\components\composites\ContributionCalendar\index.test.tsx; D:\Repositories\starci-academy-fe\src\components\contracts\index.ts; workflow record này. |

Session id: fidel-dashboard-contribution-primary-tabs-20260815-01
Session status: open

### Binding evidence

| State | Value |
|---|---|
| Request | “cái này primary, không render secondary… nó phải là 1 line dài như shellnav”. |
| Route | `http://localhost:3000/vi/dashboard` |
| Viewport / locale / theme | Current desktop viewport / `vi` / light |
| Persona | Signed-in StarCi Test Learner |
| Target owner | `ContributionCalendar` → `contribution-calendar-heading-row` → year `ChoiceTabs` |
| Reference owner | `ShellNav` → `underlined-tab-strip` → full-width tab list |
| Preserved behavior | Stable choices `[current year, -1, -2]`; selected year and `selectYear(year)` remain unchanged. |

### Evidence conflicts

| Claim | Incumbent source | Competing source | Authority | Verdict | Stale-source action |
|---|---|---|---|---|---|
| Year choices are a compact secondary control at the trailing end of the summary row | Existing `ContributionCalendar` uses default secondary `ChoiceTabs`; contract says summary and choices share one header row | User identifies this selector as primary and binds it to ShellNav's full-width line | Explicit current product instruction plus named live reference | replace-incumbent | Add an explicit primary-line presentation to the existing leaf; update the contribution owner and contract why. |

### Baseline measurement

| Owner | Baseline |
|---|---|
| Contribution year tablist | Width `189.625px`, x `978.775px`; intrinsic trailing control. |
| ShellNav tablist | Width `1216.8px`, x `24px`; full-width run. |

### OUTPUTS

| Concept | Result |
|---|---|
| Primary year navigation | Expected result frozen as a full-width underline tab run below the contribution summary, matching ShellNav's line ownership. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/fidel/starci-academy/dashboard-contribution-primary-tabs.md` | added — records session context, reference identity, baseline and exact write boundary. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | User supplied exact target, reference and hierarchy; this is a settled fidelity correction. |

### WARNINGS

| Warning | Impact |
|---|---|
| HeroUI calls its underline paint `secondary`, while user means primary product hierarchy. | The leaf must expose product hierarchy separately from the vendor paint token so callers do not repeat this mismatch. |
| FE worktree contains unrelated user edits. | Preserve all unrelated hunks; write only declared paths. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Intrinsic secondary year control at the row end | Full-width primary underline run | User: “nó phải là 1 line dài như shellnav”. |
| Change year-selection behavior | Preserve existing years and callback | Feedback is about hierarchy and rendering only. |

### OWED

| Owed | Cleared by |
|---|---|
| Production correction | Patch the leaf presentation, contribution owner, contract and focused test. |
| Live proof | Fresh localhost measurement, interaction check and clean Console. |
| User acceptance | User reviews the corrected Dashboard render. |

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
| Repo / branch | D:\Repositories\starci-academy-fe / main @ 1bc591b73b0ad0fce8114d9d7f1c19e52bca6e9b |
| Purpose | Ghi production correction và focused proof cho primary full-width contribution year tabs. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\dashboard-contribution-primary-tabs.md |
| Language | vi |
| Phase | feedback |
| Touching | D:\Repositories\starci-academy-fe\src\components\leaves\ChoiceTabs\index.tsx; D:\Repositories\starci-academy-fe\src\components\composites\ContributionCalendar\index.tsx; D:\Repositories\starci-academy-fe\src\components\composites\ContributionCalendar\index.test.tsx; D:\Repositories\starci-academy-fe\src\components\contracts\index.ts; workflow record này. |

Session id: fidel-dashboard-contribution-primary-tabs-20260815-01
Session status: open
Feedback classification: within-boundary

### Correction

| Owner | Before | After |
|---|---|---|
| `ChoiceTabs` | Vendor `variant` vừa mang paint vừa bị hiểu nhầm là product hierarchy | Public `hierarchy` phân biệt primary/secondary product ownership; primary forces full-width underline mechanics regardless of vendor token name. |
| `ContributionCalendar` | Year choices dùng default intrinsic secondary control | Declares `hierarchy: "primary"`. |
| `contribution-calendar-heading-row` | Summary và intrinsic tabs nằm hai đầu cùng row | Full-width column: summary trước, primary year tab line sau, rồi mới tới grid. |

### Proof

| Check | Result |
|---|---|
| Focused component test | PASS — 1 file, 1 test; proves primary tablist and owner are `w-full`, selected state and both year callbacks remain correct. |
| TypeScript | PASS — `npx tsc --noEmit --pretty false`. |
| Focused ESLint | PASS — four touched FE files; only repository React-version configuration warning. |
| Diff hygiene | PASS — no whitespace errors; only working-copy LF→CRLF notices. |
| Baseline live measurement | PASS — before correction, authenticated Dashboard measured year tablist `189.625px` against ShellNav `1216.8px`. |
| After live measurement | BLOCKED — refreshing the isolated in-app session required OTP for `test@starci.local`; connected Chrome browser was unavailable. No cookie/storage inspection or OTP bypass was attempted. |

### OUTPUTS

| Concept | Result |
|---|---|
| Primary contribution navigation | Year selector now owns a complete underline line like ShellNav instead of an intrinsic secondary control. |
| Selection behavior | Current year, alternatives and `selectYear(year)` are preserved and covered by test. |

### CHANGES

| Tree | Details |
|---|---|
| `src/components/leaves/ChoiceTabs/index.tsx` | modified — adds product `hierarchy`; primary hierarchy owns full-width underline mechanics. |
| `src/components/composites/ContributionCalendar/index.tsx` | modified — declares the year selector primary. |
| `src/components/composites/ContributionCalendar/index.test.tsx` | modified — proves full-width primary owner plus unchanged selected/callback behavior. |
| `src/components/contracts/index.ts` | modified — changes contribution heading to a full-width column and updates its ownership reason. |
| `.workflows/fidel/starci-academy/dashboard-contribution-primary-tabs.md` | modified — records correction, focused proof and live-auth blocker. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Product correction is complete; user can inspect the already-running authenticated localhost tab. |

### WARNINGS

| Warning | Impact |
|---|---|
| Automated after-render measurement remains blocked by OTP in the isolated browser. | Do not claim exact post-correction pixel width until an authenticated tab is available; source/test prove declared full-width ownership meanwhile. |
| FE worktree contains unrelated user edits. | No stage/commit and no claims outside the four exact FE paths. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Treat HeroUI's word `secondary` as StarCi hierarchy | Separate product hierarchy from vendor paint | User classifies this selector as primary even though the underline implementation comes from the vendor's secondary skin. |
| Keep year selector intrinsic at the summary row edge | Full-width primary line | User requires “1 line dài như shellnav”. |

### OWED

| Owed | Cleared by |
|---|---|
| Exact post-correction browser measurement and screenshot | Authenticated localhost Dashboard tab, then compare year tablist width against its contribution surface and read Console. |
| User visual acceptance | User refreshes the existing authenticated Dashboard and confirms or sends feedback. |
| Fidelity End | Run only when user asks for closing proof and related-bug scan. |

## feedback-correction

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
| Purpose | Correct primary/secondary tab semantics for ContributionCalendar. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\dashboard-contribution-primary-tabs.md |
| Language | vi |
| Phase | feedback |
| Touching | ChoiceTabs; ContributionCalendar source/test; contribution heading contract; this workflow record. |

Session id: fidel-dashboard-contribution-primary-tabs-20260815-01
Session status: open
Feedback classification: correction-of-prior-interpretation

### OUTPUTS

| Concept | Result |
|---|---|
| Primary tabs | Compact segmented/pill choice inside one bounded context. |
| Secondary tabs | Underline navigation between large content regions, including ShellNav. |
| Contribution years | Primary: year changes one calendar parameter, not the page region. |

### CHANGES

| Tree | Details |
|---|---|
| `ChoiceTabs` | Removed contradictory `hierarchy` adapter that called primary while rendering HeroUI secondary. |
| `ContributionCalendar` | Declares `variant: "primary"`; selector returns to intrinsic trailing placement. |
| Contract/test | Restored row ownership and added explicit segmented/no-indicator regression proof. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | User said “chốt” after approving the classification. |

### WARNINGS

| Warning | Impact |
|---|---|
| Earlier session evidence called a full-width underline “primary”. | This feedback supersedes that interpretation; old evidence remains as rejection history. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| `hierarchy="primary"` that forces HeroUI secondary underline | Honest `variant="primary"` segmented control | Name and render must describe the same product. |
| Treat year parameter as ShellNav-level navigation | Compact control beside the plot summary | It changes one visualization parameter, not the page's content region. |

### OWED

| Owed | Cleared by |
|---|---|
| Focused test/lint/type proof | Run after patch. |
| User visual acceptance | Refresh Dashboard. |
| Fidelity End/Finality | Only when requested. |

### Proof — corrected tab semantics

| Gate | Result |
|---|---|
| ContributionCalendar + ShellNav focused tests | PASS — 5/5. |
| Removed hierarchy adapter search | PASS — no `hierarchy`/`data-hierarchy` consumer remains. |
| Focused ESLint | PASS — repository React-version advisory only. |
| Diff check | PASS — line-ending advisory only. |
| Full TypeScript | BLOCKED only by unrelated `GlobalAiChatLayout/index.test.tsx:27`; no tabs error remains. |

### OUTPUTS

| Concept | Result |
|---|---|
| Contribution year choice | Primary segmented/pill, intrinsic at the summary row edge. |
| ShellNav | Secondary underline remains unchanged and its focused test passes. |

### CHANGES

| Tree | Details |
|---|---|
| Workflow | Recorded corrected implementation and proof; session remains open. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Continue visual feedback after refresh. |

### WARNINGS

| Warning | Impact |
|---|---|
| Unrelated AI typecheck failure remains. | Preserve the other session boundary. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Full-width underline years | Intrinsic segmented years | The former is secondary region navigation, not a local calendar parameter. |

### OWED

| Owed | Cleared by |
|---|---|
| User visual acceptance | Refresh Dashboard. |
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
| Purpose | Đóng primary year choice và secondary ShellNav semantics. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\dashboard-contribution-primary-tabs.md |
| Language | vi |
| Phase | end |
| Touching | Workflow record, recorded session source boundary và final evidence only. |

Session id: fidel-dashboard-contribution-primary-tabs-20260815-01
Session status: open

### RELATED BUGS

| Finding | Evidence | Classification | Route |
|---|---|---|---|
| Các tablists có ownership khác nhau đúng canon; không còn hierarchy adapter cũ. | Source scan, focused tests và localhost closure proof | not-a-bug | None |
| Owed ngoài production boundary | None — user chốt closure. | new-boundary | None |

### OUTPUTS

| Concept | Result |
|---|---|
| End identity | fidel-dashboard-contribution-primary-tabs-20260815-01 tại FE baseline 85f4e6663dfdea68bb56eec4956cc681641afe35..worktree. |
| Current proof | ContributionCalendar focused test đạt; live year tab 2026 là rounded primary pill, ShellNav vẫn underline secondary. |
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
| Purpose | Finalize fidel-dashboard-contribution-primary-tabs-20260815-01 sau End proof đã được user chốt. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\dashboard-contribution-primary-tabs.md |
| Language | vi |
| Phase | finality |
| Touching | Workflow record và final evidence only; không production correction. |

Session id: fidel-dashboard-contribution-primary-tabs-20260815-01
Session status: finalized
Session finalized: fidel-dashboard-contribution-primary-tabs-20260815-01
Final diff identity: FE 85f4e6663dfdea68bb56eec4956cc681641afe35..worktree; BE 7acd312a858be7ed58dc847c25ec86d801be17f8..worktree.

### OUTPUTS

| Concept | Result |
|---|---|
| Closure | Session finalized sau current End evidence. |
| Accepted | Toàn bộ feedback cuối cùng và superseding corrections trong record. |
| Routed | None — user chốt closure. |
| Continuation | Feedback mới phải mở Fidelity Start mới với Continuation of: fidel-dashboard-contribution-primary-tabs-20260815-01. |

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
