<!-- starci-workflow: v2 -->
# Profile người học MiaMia

## plan r1

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\miamia-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | MiaMia |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | miamia |
| Repo / branch | D:\Repositories\miamia-fe @ codex/miamia-thi-thu |
| Purpose | Lập brief Profile kiểu Spotify dựa trên hành vi và tiến trình người học thật. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\miamia\profile-nguoi-hoc.md |
| Language | vi |
| Phase | plan |
| Touching | Workflow này và `.workflows/.previews/designs/miamia/profile-nguoi-hoc/r1/index.html`; không sửa production source. |

### BRIEF

**Page thesis:** Profile giúp người học nhận ra “mình học như thế nào và nên làm gì tiếp theo”, đồng thời cho phép họ chủ động kể một phiên bản công khai an toàn về hành trình đó.

**Nguyên tắc Spotify:** không chỉ đếm activity. Hệ thống ghi nhận tín hiệu, tổng hợp thành pattern dễ hiểu theo tuần/tháng/năm, rồi trả lại một recommendation hoặc câu chuyện. Không hiển thị raw tracking như log giám sát.

**Hai audience:** owner thấy insight riêng tư và CTA học tiếp; visitor chỉ thấy identity, social proof, thành tích/hoạt động mà owner cho phép.

**Privacy boundary:** `question_viewed`, dwell time, answer changes, skips, revisits và highlighted text không bao giờ là public profile fields. Public chỉ dùng projection tổng hợp đã được product/backend duyệt.

### EVIDENCE

| Claim | Best-belief source | Quan sát | Hệ quả thiết kế |
|---|---|---|---|
| Identity/public profile đã có | `userProfile`, `UserEntity` | username, displayName, avatar, bio, follower/following và profile lock/visibility | REUSE ProfileHero và route username; không tạo identity model mới |
| Owner progress đã có | `progressSummary` | streak, studyDays, phrasesKnown/total, attemptsCount, bestPercent, XP, level | Có thể render profile owner overview ngay |
| Wrapped đã có | `wrapped(period)` | weekly/monthly/yearly; studyDays, phrasesLearned, papers, longestStreak, XP, hardestPhrase, friendRank, topics, games | Có thể dựng archive/story và locked state không bịa |
| Học tiếp đã có | `continueLearning` | topic, paper, reviewPhrase có thể null | CTA owner có thể đưa về chỗ dở |
| Behavioral capture đã có | `AttemptEventKind` + append-only event entity | viewed/left, answer selected/changed, skipped/revisited, highlighted | Chỉ dùng làm nguyên liệu cho private aggregate |
| Behavioral insight query chưa thấy | GraphQL inventory | Chưa có query trả khung giờ học, hesitation, weak concept hoặc session pattern | Preview đánh dấu minh họa; cần Backend Plan trước production |
| Privacy controls đã có nền | `profileLocked`, section visibility guards | owner luôn xem được; visitor bị chặn theo toàn profile hoặc section | Hướng B khớp contract hiện tại nhất |
| FE có profile architecture | Profile routes, `ProfileHero`, `ProfileTabs`, overview/activity pages, contract registry | Có identity rail, tabs, activity/progress/card patterns | REUSE/EXTEND; không dựng profile tree song song |

### CONTRACT INVENTORY

| Candidate | Verdict | Boundary |
|---|---|---|
| Profile routes/layout/hero/tabs | REUSE/EXTEND | Đổi domain copy/data adapter cho MiaMia; giữ owner/visitor state |
| SurfaceCard, SurfaceListCard, progress/stat rows, tabs, badge, button | REUSE | Không thêm primitive hay hardcode brand trong component |
| MiaMia owner overview block | NEW | Compose progressSummary, continueLearning và Wrapped; không tự aggregate raw events |
| Public achievement projection | EXTEND/NEW backend-owned | Chỉ expose fields privacy guard cho phép |
| Learning insight projection | NEW backend-owned | Tổng hợp event → insight có explainability và retention; FE chỉ render result |
| Wrapped archive/story block | EXTEND | Query từng period hiện có; share-card generation là capability riêng nếu chưa có |
| Privacy section controls | REUSE/EXTEND | Map đúng profile lock/section visibility; raw behavior không có toggle public |

### DIRECTION ANALYSIS

| Direction | Product model | Strength | Trade-off |
|---|---|---|---|
| A · Nhật ký của tôi | Timeline và học tiếp dẫn đầu | Retention rõ; gần hành vi hằng ngày | Dễ trùng Dashboard, cần activity projection |
| B · Hai mặt của một hồ sơ — khuyến nghị | Private insights và public identity tách rõ | Khớp privacy, scale được, đúng ý “app hiểu mình” | Cần UX chuyển mặt rõ ràng |
| C · Wrapped là trung tâm | Archive story tuần/tháng/năm | Emotional/viral mạnh | Profile người mới nghèo khi Wrapped còn locked |

### DIRECTION TABS

| Direction | Tab | Status |
|---|---|---|
| A | Nhật ký | Đang chờ |
| B | Hai mặt | Khuyến nghị; đang chờ |
| C | Wrapped | Đang chờ |

### PREVIEW TRACKING

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| r1 | http://127.0.0.1:8103/ | D:\Repositories\starci-academy-backend\.workflows\.previews\designs\miamia\profile-nguoi-hoc\r1\index.html | 24d4c5ac74c75a6336b9793a047b24a8549d3f340aea191d33721b11e763046c | Đang chờ |

| Server field | Value |
|---|---|
| Preview root | D:\Repositories\starci-academy-backend\.workflows\.previews\designs\miamia\profile-nguoi-hoc\r1 |
| PID | 68292 |
| Port | 8103 |

### ACCEPTANCE STATES

| Surface | States |
|---|---|
| Owner profile | loading, ready, partial, failed; continue item present/absent |
| Public profile | anonymous/authenticated; owner/visitor; unlocked/locked/not found |
| Wrapped | weekly/monthly/yearly; locked countdown/unlocked/partial/failed |
| Private insight | absent, insufficient evidence, ready, stale/failed |
| Responsive shell | sidebar desktop, footbar mobile, no overflow |

### PREVIEW PROOF

| Check | Result |
|---|---|
| Direction tabs | A, B, C đều đổi thesis và product model đúng |
| State tabs | `Dành cho tôi`, `Công khai`, `Wrapped`, `Quyền riêng tư` đều render trong từng direction; 12 tổ hợp |
| Desktop overflow | 12/12 tổ hợp không có horizontal overflow tại viewport browser đang mở |
| Visual hierarchy | Hướng B/Dành cho tôi đã kiểm tra trực quan: identity hỗ trợ, private insight dẫn đầu, CTA và cards đọc rõ |

### OUTPUTS

| Concept | Result |
|---|---|
| Profile kiểu Spotify | Biến tiến trình thành insight và câu chuyện, không chỉ danh sách số |
| Privacy model | Tách owner-only learning memory khỏi public identity/achievement |
| Ba hướng | Nhật ký, Hai mặt, Wrapped trung tâm; B được khuyến nghị |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/designs/miamia/profile-nguoi-hoc.md` | `added` — Plan, evidence, privacy boundary và direction matrix |
| `.workflows/.previews/designs/miamia/profile-nguoi-hoc/r1/index.html` | `added` — một HTML với ba direction tabs và bốn state tabs |

### NEED APPROVALS

| Question | Options |
|---|---|
| Chọn hướng Profile để vào Design Review | **B · Hai mặt (khuyến nghị)**; A · Nhật ký; C · Wrapped |

### WARNINGS

| Warning | Impact |
|---|---|
| Learning insights chưa có GraphQL projection | Không được production hóa copy “Mia hiểu cách bạn học” chỉ bằng FE |
| Raw attempt events có dữ liệu nhạy cảm về hành vi | Public exposure sẽ phá privacy boundary và niềm tin người học |
| Worktree FE đang mang thay đổi Thi thử | Review/Apply phải baseline và bảo toàn toàn bộ worktree hiện tại |
| Viewport browser hiện tại là desktop | Mobile footbar có trong proposal CSS nhưng cần visual QA lại ở Review/Apply |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Tiếp tục Học từ vựng/Ngữ pháp ngay | Tạm lưu workflow đó và ưu tiên Profile | Thầy yêu cầu “tạo trang profiles trước” |

### OWED

| Owed | Cleared by |
|---|---|
| Chọn A/B/C | Feedback của thầy |
| Component/props delta | `starci-fe-design-review` sau khi chọn direction |
| Learning insight contract | Backend Feature Plan/Review/Apply riêng nếu direction duyệt dùng insight |
| Visual QA mobile thật | Browser viewport mobile trong Review hoặc Apply |

## review r1

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\miamia-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | MiaMia |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | miamia |
| Repo / branch | D:\Repositories\miamia-fe @ codex/miamia-thi-thu |
| Purpose | Review và khóa production tree cho Profile hướng B, gồm privacy và learning-memory boundary. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\miamia\profile-nguoi-hoc.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow này; không sửa HTML preview hay production source. |

Selected direction: **B · Hai mặt của một hồ sơ**.

Candidate revision: `profile-b1`

Approved revision: profile-b1

Approval evidence: thầy trả lời `duyệt profile-b1` ngày 2026-08-15.

### REVIEW VERDICT

| Planned claim | Verdict | Revision |
|---|---|---|
| Owner thấy XP, level, streak, ngày học, từ thuộc, số đề và best percent | ACCEPT | Dùng `progressSummary`; không suy từ client |
| Owner thấy Wrapped tuần/tháng/năm | ACCEPT | Dùng `wrapped(period)` và render đúng locked/unlocked union |
| Visitor thấy identity, follow counts và public activity | ACCEPT | Giữ `userProfile`, visibility guards và Activity hiện hữu |
| Mia nhận ra khung giờ/session phù hợp | REJECT FROM APPLY | Chưa có aggregate query; route sang Backend Feature Plan |
| Mia báo điểm đang vướng từ dwell/change/skip | REJECT FROM APPLY | Raw events không phải insight API; không aggregate trong FE |
| Raw behavior có thể công khai bằng toggle | REJECT | Privacy toggle không bao giờ expose raw attempt events |
| Public profile hiển thị XP/streak/Wrapped của người khác | REJECT FROM APPLY | `progressSummary` và `wrapped` chỉ trả authenticated learner; cần public projection riêng |
| Sidebar desktop có Profile; mobile giữ footbar 5 mục | ACCEPT | Thêm Profile vào spine data nhưng không thêm tab thứ sáu vào `mobileTabs` |

### FROZEN EXPERIENCE

| Audience / state | Reading order | Primary action |
|---|---|---|
| Owner private | Identity rail → Private/Public switch → progress metrics → level progress → Wrapped | Mở Wrapped khi unlocked; nếu locked chỉ giải thích số ngày còn thiếu |
| Owner public preview | Identity rail → switch → public-empty/activity direction | Xem Activity công khai; không giả lập số liệu public chưa có |
| Visitor unlocked | Identity rail → Overview/Activity tabs → public evidence | Follow/unfollow |
| Visitor locked | Identity rail tối thiểu → locked notice | Quay về app/browse; không lộ section data |
| Query failed | Giữ profile geometry và error notice đúng owner | Retry query bị lỗi |

### COMPONENT DELTA

| Layer | Owner | Action | Current path | Final path | Parent / call sites | Contract | Reason |
|---|---|---|---|---|---|---|---|
| route | ProfileRoute | REUSE | `src/app/[lang]/profile/page.tsx` | `src/app/[lang]/profile/page.tsx` | direct `/profile` entry | existing redirect | Giữ canonical self-profile redirect theo username |
| route | ProfileOverviewRoute | REUSE | `src/app/[lang]/profile/[username]/page.tsx` | `src/app/[lang]/profile/[username]/page.tsx` | Next route → ProfileOverviewPage | route mount | Route đã đúng identity; page đổi nội dung |
| route | ProfileActivityRoute | REUSE | `src/app/[lang]/profile/[username]/activity/page.tsx` | `src/app/[lang]/profile/[username]/activity/page.tsx` | PublicProfileLayout tab | route mount | Activity public hiện hữu là public face hợp lệ |
| route | ProfileWrappedRoute | ADD | None | `src/app/[lang]/profile/[username]/wrapped/page.tsx` | PublicProfileLayout tab, owner only | route mount | Wrapped có route ổn định để mở lại theo period |
| page | ProfileOverviewPage connected | MODIFY | `src/components/pages/ProfileOverviewPage/index.tsx` | `src/components/pages/ProfileOverviewPage/index.tsx` | ProfileOverviewRoute | connected/pure twin | Xác định owner/visitor và fetch owner-only progress |
| page | _ProfileOverviewPage pure | MODIFY | `src/components/pages/ProfileOverviewPage/component.tsx` | `src/components/pages/ProfileOverviewPage/component.tsx` | ProfileOverviewPage, component test | `learner-profile-overview` | Thay 5 coding sections bằng private/public profile model |
| page | ProfileWrappedPage connected | ADD | None | `src/components/pages/ProfileWrappedPage/index.tsx` | ProfileWrappedRoute | connected/pure twin | Chọn period và fetch Wrapped owner-only |
| page | _ProfileWrappedPage pure | ADD | None | `src/components/pages/ProfileWrappedPage/component.tsx` | ProfileWrappedPage, component test | `learner-wrapped-page` | Render locked/unlocked/error mà không trộn transport |
| layout | ProfileLayout | MODIFY | `src/app/[lang]/profile/layout.tsx` | `src/app/[lang]/profile/layout.tsx` | toàn bộ route con của `/profile` | `RouteShell` + `MiaMiaAppLayout` | Profile dùng chung MiaMia sidebar/footbar, bỏ ShellNav legacy |
| layout | MiaMiaAppLayout connected | MODIFY | `src/components/layouts/MiaMiaAppLayout/index.tsx` | `src/components/layouts/MiaMiaAppLayout/index.tsx` | ProfileLayout, app segment layout | existing pure layout | Profile là sidebar destination; mobile vẫn đúng 5 tabs |
| layout | _MiaMiaAppLayout pure | MODIFY | `src/components/layouts/MiaMiaAppLayout/component.tsx` | `src/components/layouts/MiaMiaAppLayout/component.tsx` | MiaMiaAppLayout, component test | `learn-shell-frame` | Mở rộng destination union; không đổi shell anatomy |
| layout | PublicProfileLayout connected | MODIFY | `src/components/layouts/PublicProfileLayout/index.tsx` | `src/components/layouts/PublicProfileLayout/index.tsx` | username profile layout | `profile-tabs-over-body` | Tab set đổi thành Overview/Activity và owner-only Wrapped |
| layout | _PublicProfileLayout pure | REUSE | `src/components/layouts/PublicProfileLayout/component.tsx` | `src/components/layouts/PublicProfileLayout/component.tsx` | PublicProfileLayout | existing profile contracts | State union loading/failed/not-found/locked/ready đã đủ |
| block | ProfileHero connected | MODIFY | `src/components/blocks/profile/ProfileHero/index.tsx` | `src/components/blocks/profile/ProfileHero/index.tsx` | _PublicProfileLayout | `profile-hero-rail` | Bỏ Hire/GitHub precedence; self Edit, visitor Follow |
| block | _ProfileHero pure | REUSE | `src/components/blocks/profile/ProfileHero/component.tsx` | `src/components/blocks/profile/ProfileHero/component.tsx` | ProfileHero | existing profile rail contracts | Optional role/work facts có thể vắng mà không đổi shape |
| block | LearnerProgressSnapshot | ADD | None | `src/components/blocks/profile/learner/LearnerProgressSnapshot/component.tsx` | _ProfileOverviewPage | `learner-progress-snapshot` | Một block sở hữu ý nghĩa XP/streak/mastery và state của nó |
| block | LearnerWrappedSummary | ADD | None | `src/components/blocks/profile/learner/LearnerWrappedSummary/component.tsx` | _ProfileOverviewPage | `learner-wrapped-summary` | Tóm tắt Wrapped, phân biệt locked/unlocked |
| block | ProfileViewSwitch | ADD | None | `src/components/blocks/profile/learner/ProfileViewSwitch/component.tsx` | _ProfileOverviewPage | `underlined-tab-strip` | Owner chuyển private/public preview; visitor không nhận block này |
| composite | ProfileMetric | REUSE | `src/components/composites/ProfileMetric/index.tsx` | `src/components/composites/ProfileMetric/index.tsx` | LearnerProgressSnapshot | `profile-proof-metric` | Value/label sentence đã biểu đạt đúng metric generic |
| composite | LabelledProgressRow | REUSE | `src/components/composites/LabelledProgressRow/index.tsx` | `src/components/composites/LabelledProgressRow/index.tsx` | LearnerProgressSnapshot | `label-fact-over-progress` | Level progress dùng arrangement hiện hữu |
| composite | EmptyNotice | REUSE | `src/components/composites/EmptyNotice/index.tsx` | `src/components/composites/EmptyNotice/index.tsx` | overview/wrapped recovery states | existing notice contracts | Không tạo notice đồng nghĩa |
| branch | Tree | REUSE | `src/components/branches/Tree/index.tsx` | `src/components/branches/Tree/index.tsx` | mọi pure owner | contract keys below | Giữ contract-checked assembly |
| branch | SurfaceCard | REUSE | `src/components/branches/SurfaceCard/index.tsx` | `src/components/branches/SurfaceCard/index.tsx` | progress/Wrapped surfaces | named contracts | Surface family hiện hữu sở hữu card chrome |
| leaf | ChoiceTabs | REUSE | `src/components/leaves/ChoiceTabs/index.tsx` | `src/components/leaves/ChoiceTabs/index.tsx` | ProfileViewSwitch, Wrapped period selector | leaf API hiện hữu | Hai peer choices không cần leaf mới |
| leaf | Text | REUSE | `src/components/leaves/Text/index.tsx` | `src/components/leaves/Text/index.tsx` | blocks/pages above | text leaf API | Không tạo typography MiaMia riêng |
| leaf | Heading | REUSE | `src/components/leaves/Heading/index.tsx` | `src/components/leaves/Heading/index.tsx` | pages above | heading leaf API | Giữ outline qua leaf hiện hữu |
| leaf | Button | REUSE | `src/components/leaves/Button/index.tsx` | `src/components/leaves/Button/index.tsx` | blocks/pages above | button leaf API | Một primary action theo surface |
| leaf | Badge | REUSE | `src/components/leaves/Badge/index.tsx` | `src/components/leaves/Badge/index.tsx` | Wrapped/progress facts | badge leaf API | Fact ngắn dùng primitive hiện hữu |
| leaf | Progress | REUSE | `src/components/leaves/Progress/index.tsx` | `src/components/leaves/Progress/index.tsx` | LabelledProgressRow | progress leaf API | Level percent dùng progress semantic hiện hữu |
| shell | RouteShell | REUSE | `src/components/shells/RouteShell/index.tsx` | `src/components/shells/RouteShell/index.tsx` | ProfileLayout | shell API hiện hữu | Mount MiaMia frame quanh routed children |

### PROPS DELTA

| Owner | Prop / API | Action | Before | After | Producers / call sites | Migration proof |
|---|---|---|---|---|---|---|
| _MiaMiaAppLayout | `MiaMiaDestination` | ADD | `home \| exam \| study \| game \| ranking` | thêm `profile` | MiaMiaAppLayout `ITEMS`, `open`, spine rows | typecheck bắt mọi switch/map thiếu destination |
| _MiaMiaAppLayout | `MiaMiaAppLayoutProps` | KEEP | spine + mobileTabs + surface | không đổi | MiaMiaAppLayout | component test chứng minh profile chỉ ở spine, mobile vẫn 5 |
| MiaMiaAppLayout | connected props | KEEP | `{ surface: ComponentType }` | không đổi | RouteShell in app/profile layouts | typecheck + route render |
| PublicProfileLayout | boundary props | KEEP | `{ content: ReactNode }` | không đổi | `[username]/layout.tsx` | existing layout test + typecheck |
| PublicProfileLayout | internal tab IDs | RETYPE | overview/projects/challenges/skills/cv/activity | overview/activity + wrapped chỉ khi self | pathname resolver và selectTab call sites | component test owner/visitor tab arrays |
| ProfileHero | connected action policy | CHANGE_DEFAULT | self Edit; visitor Hire/Follow | self Edit; visitor Follow only | PublicProfileLayout | test visitor có GitHub vẫn không hiện Hire |
| _ProfileHero | ProfileHeroProps | KEEP | pending/ready + optional rail fields | không đổi | ProfileHero | absent optional facts/meta render test |
| _ProfileOverviewPage | props | RETYPE | không có props | `state`, `audience`, `selectedView`, labels, progress, wrapped, actions | ProfileOverviewPage + tests | all union states rendered; no optional boolean soup |
| LearnerProgressSnapshot | props | ADD | None | state union + resolved metric labels/values + level percent | _ProfileOverviewPage | component tests ready/loading/error |
| LearnerWrappedSummary | props | ADD | None | locked/unlocked/error union + resolved period stats/action | _ProfileOverviewPage | impossible stats-on-locked rejected by typecheck |
| ProfileViewSwitch | props | ADD | None | selectedKey, two resolved tabs, `select` outcome | _ProfileOverviewPage | test selection only changes view, not geometry |
| _ProfileWrappedPage | props | ADD | None | period selector + locked/unlocked/error result + retry/back/share outcomes | ProfileWrappedPage | component matrix test |
| Contract registry | `learner-profile-overview` slots | ADD | None | optional `view`; repeated labelled `section`; notice alternative | _ProfileOverviewPage | contract typecheck and component test |
| Contract registry | `learner-progress-snapshot` slots | ADD | None | repeated ProfileMetric + LabelledProgressRow | LearnerProgressSnapshot | contract typecheck |
| Contract registry | `learner-wrapped-summary` slots | ADD | None | title, body, stats/lock fact, optional action | LearnerWrappedSummary | contract typecheck locked/unlocked fixtures |
| Contract registry | `learner-wrapped-page` slots | ADD | None | period ChoiceTabs + story/notice result | _ProfileWrappedPage | contract typecheck every result branch |
| queryProgressSummary | transport API | ADD | None | authenticated no-variable query returning exact ProgressSummary fields | SWR hook | query document test + live authenticated call |
| queryWrapped | transport API | ADD | None | authenticated `period` query returning locked/unlocked union | SWR hook | query document test for all selected fields |
| useQueryProgressSummarySwr | hook API | ADD | None | enabled only for owner; unwrap envelope once | ProfileOverviewPage | hook/component test visitor makes no owner query |
| useQueryWrappedSwr | hook API | ADD | None | period-keyed owner query; unwrap envelope once | overview + wrapped page | period cache-key test |
| ProfileWrappedRoute | route props | KEEP | route không nhận public props | không đổi | Next route mount | typecheck route build |
| ProfileOverviewPage connected | connected API | KEEP | không nhận caller props | không đổi; tự resolve params/viewer | ProfileOverviewRoute | typecheck + component boundary test |
| _ProfileOverviewPage pure | page contract | RETYPE | không props | state + resolved owner/public data + actions | ProfileOverviewPage và tests | owner/visitor component tests |
| ProfileWrappedPage connected | connected API | KEEP | không có trước | không nhận caller props; tự resolve params/viewer/period | ProfileWrappedRoute | typecheck + route build |
| _ProfileWrappedPage pure | page contract | ADD | không có trước | period selector + resolved summary + selection action | ProfileWrappedPage và test | component test |
| ProfileLayout | layout props | KEEP | children | children | profile route cluster | typecheck + production build |
| MiaMiaAppLayout connected | connected props | KEEP | surface | surface | RouteShell | typecheck + layout test |
| _MiaMiaAppLayout pure | destination union | RETYPE | 5 destination IDs | thêm profile cho spine producer; mobile array vẫn riêng | MiaMiaAppLayout và test | typecheck + footbar count test |
| PublicProfileLayout connected | boundary props | KEEP | content | content | username layout | typecheck + visible-tab runtime proof |
| ProfileHero connected | action policy | CHANGE_DEFAULT | self Edit; visitor Hire hoặc Follow | self Edit; visitor chỉ Follow | PublicProfileLayout | source search không còn canHire branch |

### SUPPORTING PRODUCTION BOUNDARY

| Tree | Action | Why |
|---|---|---|
| `src/components/contracts/index.ts` | MODIFY | Thêm đúng bốn contract keys đã khóa |
| `src/modules/api/graphql/queries/query-progress-summary.ts` | ADD | Adapter GraphQL owner progress |
| `src/modules/api/graphql/queries/query-wrapped.ts` | ADD | Adapter GraphQL Wrapped |
| `src/modules/api/graphql/queries/types/profile-learning.ts` | ADD | Exact response/period discriminated unions |
| `src/hooks/swr/useQueryProgressSummarySwr.ts` | ADD | Cache + envelope boundary |
| `src/hooks/swr/useQueryWrappedSwr.ts` | ADD | Period cache + envelope boundary |
| `src/hooks/index.ts` | MODIFY | Export hai hooks mới theo barrel hiện hữu |
| `src/messages/vi.json`, `src/messages/en.json` | MODIFY | Copy MiaMia profile, states, labels và actions |
| `src/components/pages/ProfileOverviewPage/component.test.tsx` | MODIFY | Owner/private/public/visitor matrix |
| `src/components/pages/ProfileWrappedPage/component.test.tsx` | ADD | Locked/unlocked/error/period matrix |
| `src/components/layouts/MiaMiaAppLayout/component.test.tsx` | ADD | Desktop profile row và đúng 5 mobile tabs |
| `src/components/blocks/profile/learner/LearnerProgressSnapshot/component.test.tsx` | ADD | Progress block state matrix |
| `src/components/blocks/profile/learner/LearnerWrappedSummary/component.test.tsx` | ADD | Wrapped summary locked/unlocked/error matrix |
| `src/components/blocks/profile/learner/ProfileViewSwitch/component.test.tsx` | ADD | Private/public selection and stable geometry |
| `src/modules/api/graphql/queries/query-progress-summary.test.ts` | ADD | Exact document contract |
| `src/modules/api/graphql/queries/query-wrapped.test.ts` | ADD | Exact document contract |

### ACCEPTANCE EVIDENCE

| Gate | Exact proof |
|---|---|
| Static | `npm run typecheck`; `npm run lint` |
| Unit/component | `npm test -- src/components/pages/ProfileOverviewPage/component.test.tsx src/components/pages/ProfileWrappedPage/component.test.tsx src/components/blocks/profile/learner src/modules/api/graphql/queries/query-progress-summary.test.ts src/modules/api/graphql/queries/query-wrapped.test.ts` |
| Build | `npm run build` |
| Runtime owner | đăng nhập test account → `/vi/profile` redirect canonical → private view → progress values → Wrapped locked/unlocked |
| Runtime visitor | anonymous/second account → unlocked profile → follow; locked profile → no private sections |
| Navigation | desktop sidebar mở Profile; mobile vẫn đúng 5 footbar items và Profile route không overflow |
| Network/terminal | không GraphQL 4xx/5xx; visitor không gọi `progressSummary`/`wrapped`; console không error |
| Diff | Sau baseline Apply: mọi source path khớp COMPONENT DELTA + boundary; không có design-code |

### OUTPUTS

| Concept | Result |
|---|---|
| Direction B | Được cụ thể hóa thành owner-private Profile + visitor-public Profile trên cùng identity route |
| Spotify memory phase 1 | Dùng progress và Wrapped thật; không giả inference hành vi |
| Privacy boundary | Raw attempt events và owner-only progress không bao giờ đi vào public face |
| Candidate revision | `profile-b1` sẵn sàng để thầy duyệt hoặc phản biện |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/designs/miamia/profile-nguoi-hoc.md` | `modified` — ghi lựa chọn B, review verdict, component tree, props delta và proof boundary |

### NEED APPROVALS

| Question | Options |
|---|---|
| Duyệt revision `profile-b1` để vào Apply | **Duyệt (khuyến nghị):** Apply progress + Wrapped thật, loại behavioral insights chưa có API; hoặc phản biện chính xác row cần sửa |

### WARNINGS

| Warning | Impact |
|---|---|
| Public XP/streak/Wrapped-by-username chưa có contract | Visitor face phase 1 chỉ có identity, achievements/activity đã được guard |
| Behavioral insight projection chưa có | “Mia hiểu cách bạn học” chưa được ship trong revision này |
| Profile route cluster đang giữ nhiều route coding legacy | Revision chỉ bỏ chúng khỏi visible tabs; không xóa source ngoài boundary |
| Apply bắt đầu bằng baseline commit toàn bộ worktree FE hiện tại | Commit sẽ bao gồm thay đổi Thi thử đang dở như user đã quy định cho lifecycle Apply |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| A · Nhật ký | B · Hai mặt | Thầy chốt tiếp phương án khuyến nghị B |
| C · Wrapped trung tâm | B · Hai mặt | Wrapped là một owner route/section, không thay toàn bộ Profile cho người mới |
| FE tự suy khung giờ học/điểm yếu từ raw events | Backend-owned aggregate insight contract | Raw event không phải public or presentation contract |
| Public hóa raw behavior bằng toggle | Public projection đã tổng hợp và guard | Bảo vệ riêng tư và tránh surveillance UX |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval revision `profile-b1` | Thầy trả lời duyệt hoặc nêu row cần sửa |
| Baseline commit và production diff | `starci-fe-design-apply` sau approval |
| Behavioral learning insights | Backend Feature Plan/Review/Apply riêng |

## apply

Applied revision: `profile-b1` (đang mở; chưa đóng Apply)

Baseline commit: `5cf9f72edd54b79492ad44e30ab6785820c0ef6a`

Tracked diff: `5cf9f72edd54b79492ad44e30ab6785820c0ef6a..worktree`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\miamia-fe |
| Project | miamia |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Source | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| App | miamia |
| Repo / branch | D:\Repositories\miamia-fe @ codex/miamia-thi-thu |
| Purpose | Apply revision profile-b1 trực tiếp vào source và chứng minh diff từ baseline. |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\miamia\profile-nguoi-hoc.md |
| Language | vi |
| Phase | apply |
| Touching | Workflow này và đúng production/test boundary đã duyệt trong Review. |

### LIVE FLOW PROOF

| Time window | Persona / route | UI | Network | Console | FE / BE terminal | Verdict |
|---|---|---|---|---|---|---|
| 2026-08-15 | Anonymous, `/vi/profile`, desktop 1440×900 | Sidebar hiện 6 mục và có `Hồ sơ`; footbar ẩn; không horizontal overflow | GraphQL `progressSummary` tới `127.0.0.1:3071/graphql` trả `401 Unauthorized` khi không có session, chứng minh API đang reachable và guard hoạt động | Không có console error; có warning `PressResponder ... without a pressable child` từ navigation primitive hiện hữu | Runtime đang chạy: `miamia-fe` port 3097; `mia-mia-backend` ports 3071/3072 | PARTIAL |
| 2026-08-15 | Anonymous, `/vi/profile`, mobile 390×844 | Footbar hiện đúng 5 mục: Trang chủ, Thi thử, Học & ôn tập, Trò chơi, Xếp hạng; `scrollWidth = clientWidth = 390` | Không gọi owner-only proof được khi chưa đăng nhập | Không có console error; warning navigation như desktop | Process FE/BE vẫn listen trong cùng cửa sổ kiểm tra | PASS cho responsive shell |
| Chưa chạy | Test account owner, đăng nhập → `/vi/profile` → canonical username → progress → Wrapped | Chưa có credentials để gửi qua form đăng nhập thật | Chưa thể xác nhận authenticated `progressSummary`/`wrapped` 2xx | Chưa thể xác nhận sau auth | Chưa thể đối chiếu request auth với log FE/BE | BLOCKED |
| Chưa chạy | Visitor/second account → public/unlocked/locked profile | Chưa có fixture username/public visibility | Chưa thể chứng minh visitor không gọi owner-only queries trên runtime | Chưa chạy | Chưa chạy | BLOCKED |

### OUTPUTS

| Concept | Result |
|---|---|
| Profile hướng B | Đã materialize owner-private overview, public preview và owner-only Wrapped route bằng source thật. |
| Privacy | Hai hooks progress/Wrapped chỉ có SWR key khi connected owner boundary xác nhận `isSelf`. |
| Navigation responsive | Desktop sidebar có Profile; mobile footbar giữ đúng 5 destination và không overflow. |
| Proof tĩnh | Typecheck, lint strict, 9 targeted tests và production build đều xanh. |

### CHANGES

| Tree | Details |
|---|---|
| `src/app/[lang]/profile/layout.tsx` | `modified` — thay ShellNav legacy bằng `RouteShell` + `MiaMiaAppLayout`. |
| `src/app/[lang]/profile/[username]/wrapped/page.tsx` | `added` — mount owner Wrapped page. |
| `src/components/layouts/MiaMiaAppLayout/{index,component}.tsx` | `modified` — thêm Profile vào desktop spine, tách mobile list giữ 5 mục. |
| `src/components/layouts/PublicProfileLayout/index.tsx` | `modified` — visible tabs còn Overview/Activity và owner-only Wrapped. |
| `src/components/blocks/profile/ProfileHero/index.tsx` | `modified` — visitor CTA chỉ Follow, bỏ Hire/GitHub precedence. |
| `src/components/blocks/profile/learner/**` | `added` — ProfileViewSwitch, LearnerProgressSnapshot, LearnerWrappedSummary cùng component tests. |
| `src/components/pages/ProfileOverviewPage/**` | `modified` — owner/private/public/visitor orchestration và tests. |
| `src/components/pages/ProfileWrappedPage/**` | `added` — period selector, locked/unlocked/failure rendering và test. |
| `src/components/contracts/index.ts` | `modified` — thêm 4 contract keys đã duyệt. |
| `src/modules/api/graphql/queries/{query-progress-summary,query-wrapped}.ts` | `added` — authenticated adapters đúng backend schema. |
| `src/modules/api/graphql/queries/types/profile-learning.ts` | `added` — exact progress/Wrapped types. |
| `src/hooks/swr/{useQueryProgressSummarySwr,useQueryWrappedSwr}.ts` | `added` — owner-enabled cache boundaries. |
| `src/hooks/index.ts` | `modified` — export hooks mới và profile query qua barrel. |
| `src/messages/{vi,en}.json` | `modified` — Profile learning, Wrapped và nav copy. |
| `src/components/layouts/MiaMiaAppLayout/component.test.tsx` | `added` — khóa mobile footbar đúng 5 mục. |
| `src/modules/api/graphql/queries/{query-progress-summary,query-wrapped}.test.ts` | `added` — khóa exact documents/auth/variables. |
| `.workflows/designs/miamia/profile-nguoi-hoc.md` | `modified` — ghi baseline, diff, gates và live-flow blocker bằng tiếng Việt. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Test account local để hoàn tất owner flow | Tạo `D:\Repositories\miamia-fe\.env.local` với `KEYCLOAK_ADMIN_PASSWORD`, `DEV_TEST_ACCOUNT_EMAIL`, `DEV_TEST_ACCOUNT_PASSWORD`, sau đó báo trò; trò sẽ chạy `npm run seed:test-account` và đăng nhập bằng UI thật. Không gửi password vào chat/workflow. |
| Visitor fixtures | Cho username public và, nếu có, username locked/second account; hoặc xác nhận chỉ owner runtime proof trong revision này. |

### WARNINGS

| Warning | Impact |
|---|---|
| Chưa có test-account config ở FE hoặc Backend | Apply không được đóng vì authenticated progress/Wrapped chưa có live proof. |
| `/vi/profile` anonymous giữ loading shell thay vì tự sang Authentication khi `me` request bị 401 | Đây là behavior hiện hữu của ProfileRedirect error path; không nằm trong `profile-b1` delta, cần Fidelity hoặc Review mở boundary nếu muốn sửa. |
| Browser ghi nhận warning `PressResponder was rendered without a pressable child` từ nav primitive | Không có console error hay overflow, nhưng warning phải được audit riêng; không được ghi zero-warning. |
| `git diff` mặc định không liệt kê untracked paths | Reconciliation dùng thêm `git status --short`; hiện có 23 modified/untracked rows, tất cả thuộc boundary đã duyệt. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Dùng anonymous 401 làm bằng chứng owner flow | Giữ Apply mở và chờ test account | Authenticated result phải đi qua UI thật. |
| Ghi behavioral insight từ attempt events | Chỉ render aggregate progress/Wrapped backend trả về | Revision không có aggregate insight API. |
| Thêm Profile thành mobile tab thứ sáu | Profile chỉ ở desktop spine | Thầy đã khóa mobile sidebar → footbar 5 mục. |

### OWED

| Owed | Cleared by |
|---|---|
| Login → canonical profile → progress → Wrapped live proof | Test-account `.env.local`, `npm run seed:test-account`, thao tác UI và network/console/terminal evidence. |
| Visitor không gọi owner queries | Public/locked fixture và browser Network proof. |
| Final row-to-diff reconciliation | Chạy name-status gồm tracked + untracked sau khi live proof xanh. |
| Apply closure | Không còn BLOCKED/FAILED row trong LIVE FLOW PROOF. |
