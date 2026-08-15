<!-- starci-workflow: v2 -->

# Học & ôn tập MiaMia

## plan r1

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\miamia-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | miamia |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | miamia |
| Repo / branch | FE `D:\Repositories\miamia-fe` @ `codex/miamia-thi-thu` (`5cf9f72`); BE `D:\Repositories\mia-mia-backend` @ `main` (`420b059`) |
| Purpose | Chốt hierarchy, CTA và disclosure cho nhánh Học & ôn tập gồm từ vựng, ngữ pháp và hàng ôn cá nhân |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\miamia\hoc-on-tap.md |
| Language | vi |
| Phase | plan |
| Touching | `D:\Repositories\starci-academy-backend\.workflows\designs\miamia\hoc-on-tap.md`; `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\miamia\hoc-on-tap\r1\index.html` |

### EVIDENCE

| Fact | Source | Consequence |
|---|---|---|
| Học gồm cụm từ + ngữ pháp; cả Free và Pro đều được dùng | `D:\Repositories\mia-mia-backend\biz.md` A1, A3, B1 | Không dùng Premium làm CTA chính của trang học |
| Mastery là đúng liên tiếp 3 lần; sai reset; hoàn thành phiên tạo study session, XP và Points | `PracticeService`, `recordPractice` | Buổi học phải có kết quả và một bước ôn tiếp cụ thể |
| “Học tiếp” là nguyên tắc giảm ma sát đã chốt | `biz.md` B6; query `continueLearning` | Hướng A có bằng chứng mạnh và chạy được với capability hiện tại |
| Kho local hiện có 2 topic/9 phrase | GraphQL live `learnTopics` trên `3071` | Preview dùng đúng Gọi món ăn và Từ vựng đề thi THPT, không phóng đại catalogue |
| DB có 8 grammar topic/11 grammar note đã seed | PostgreSQL local `grammar_topics`, `grammar_notes` | Có thể thiết kế grammar lane, nhưng phải ghi rõ API gap |
| Vocabulary đã có `learnTopics`, `topicDetail`, `phrasePractice`, `recordPractice` | Live backend source/schema | Học từ vựng có thể Apply end-to-end sau Review |
| Grammar chưa có catalogue/detail/practice GraphQL | Inventory GraphQL resolver | Hướng B cần backend feature trước khi hứa mở nội dung grammar |
| Hàng ôn ba nguồn đã chốt nhưng chưa có query tổng hợp | `biz.md` B1 và schema hiện tại | Hướng C là north-star đúng biz nhưng có backend boundary lớn hơn |
| MiaMia dùng shell desktop sidebar và mobile footbar 5 mục | `MiaMiaAppLayout`, `learn-shell-frame`, runtime `3070` | Cả ba hướng giữ cùng shell; responsive không tạo navigation mới |

### CONTRACT INVENTORY

| Candidate | Verdict | Reason |
|---|---|---|
| `learn-shell-frame`, `learn-mobile-tab-bar`, `learn-spine-column`, `learn-nav-group`, `learn-nav-row` | REUSE | Đã sở hữu sidebar/footbar và route body MiaMia |
| `centred-title-pair`, `title-with-end-action`, `title-with-baseline-fact`, `catalog-query-with-count` | REUSE | Đủ cho header, count và query hierarchy |
| `flashcard-review-due-card`, `flashcard-review-deck-card`, `flashcard-session-header`, `flashcard-session-card`, `flashcard-result-*` | EXTEND | Cùng grammar overview → session → result; cần đổi domain owner khỏi course-only khi Review chốt |
| `ChoiceTabs`, `LabelledProgressRow`, `EmptyNotice`, `Button`, `Heading`, `Text`, `Progress` | REUSE | Leaves/composites hiện có diễn đạt mode, tiến trình và recovery |
| Study hub page owner | NEW | MiaMia chưa có page/block owner cho tổng quan vocabulary + grammar + review |
| Personal review queue block | NEW nếu chọn C | Quan hệ ba nguồn + priority không thể nói thật bằng catalogue/deck card hiện tại |
| Grammar topic card/detail/session | NEW nếu chọn B hoặc grammar phase | Backend business shape khác phrase practice; không mượn flashcard prop để che gap |

### DIRECTIONS

| Direction | Hypothesis | Primary action | Backend fit |
|---|---|---|---|
| A — Học tiếp | Vì backend đã biết topic/review phrase đang dở, continuity dẫn đầu để người học không phải tìm lại | `Học tiếp “Gọi món ăn”` | Cao; vocabulary end-to-end có sẵn, grammar giữ trạng thái chưa mở đến khi có API |
| B — Lộ trình kép | Vì hai trụ nội dung ngang hàng, hai lane giúp người học thấy đường đi theo level | `Tiếp tục lộ trình B1` | Trung bình; cần grammar catalogue/detail và logic progression |
| C — Ôn đúng chỗ yếu | Vì hàng ôn cá nhân là nhiên liệu chung của học và game, nội dung vừa sai/tra/chưa thuộc phải dẫn đầu | `Bắt đầu hàng ôn cá nhân` | Thấp hơn hiện tại; cần review-queue aggregation và source evidence API |

### STATE MATRIX

| State | Shared behavior |
|---|---|
| Tổng quan ready | Một primary CTA; progress Free không trộn weak-point Pro; topic cards dùng dữ liệu thật |
| Anonymous | Xem catalogue công khai; ghi mastery yêu cầu đăng nhập với `returnTo` về đúng session |
| First load | Giữ nguyên reading order, skeleton các fact/card chưa resolve |
| Empty | Giữ page identity; giải thích chưa có topic và một retry/path quay lại |
| Failed | Retry ở đúng owner; không thay toàn trang bằng spinner/error |
| Session | Một prompt, tiến trình, lựa chọn; có `Thoát & lưu` nếu backend owner hỗ trợ persistence |
| Pending record | Khoá double-submit và giữ feedback vừa trả lời |
| Result | Outcome → cụm cần ôn → một CTA cụ thể; XP/Points chỉ hiển thị khi response thật có field |
| Mobile | Sidebar đổi thành footbar 5 mục; source order không đổi; không overflow ngang |

### PREVIEW

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| `hoc-on-tap-r1` | `http://127.0.0.1:8081/` | `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\miamia\hoc-on-tap\r1\index.html` | `698239db0402f4cf9e3c098aa5b548ff01304d8a3b2560ab622f3b7a59963d3c` | đang chờ |

Preview root: `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\miamia\hoc-on-tap\r1`

Preview PID: `2324`

Preview port: `8081`

| Direction | Tab | Status |
|---|---|---|
| `study-a-continuity` | `A · Học tiếp` | đang chờ |
| `study-b-dual-path` | `B · Lộ trình kép` | đang chờ |
| `study-c-review-queue` | `C · Ôn đúng chỗ yếu` | đang chờ |

QA preview: ba direction tab và bốn state tab chuyển client-side tại một URL; desktop sidebar và mobile footbar render đúng; viewport `390×844` không overflow; console không có error.

### OUTPUTS

| Concept | Result |
|---|---|
| Brief Học & ôn tập r1 | Ba hướng khác nhau ở decision model: tiếp tục, lộ trình, hoặc hàng ôn cá nhân |
| Hướng A | Bản phát hành khả thi nhất với backend hiện tại và phù hợp nguyên tắc “Học tiếp” đã chốt |
| Hướng B | Cho vocabulary/grammar hai lane ngang hàng nhưng kéo theo grammar backend capability |
| Hướng C | North-star sát business nhất cho personalization, đổi lại cần review-queue backend capability |
| Bộ UI | Cream ground, pink primary, yellow attention, mint progress, ink boundary; giữ pattern StarCi FE và MiaMia chỉ override global CSS |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\miamia\hoc-on-tap.md` | added — brief, evidence, direction, state và approval record tiếng Việt |
| `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\miamia\hoc-on-tap\r1\index.html` | added — một preview HTML disposable có ba direction tab và bốn state tab |

### NEED APPROVALS

| Question | Options |
|---|---|
| Chọn decision model cho Học & ôn tập | `A · Học tiếp` (khuyến nghị cho phase đầu, backend fit cao); `B · Lộ trình kép` (ưu tiên curriculum, cần grammar API); `C · Ôn đúng chỗ yếu` (ưu tiên personalization, cần review-queue API) |

### WARNINGS

| Warning | Impact |
|---|---|
| Grammar có dữ liệu DB nhưng chưa có catalogue/detail/practice GraphQL | Không được mở card grammar như capability chạy thật trước backend Plan → Review → Apply |
| Personal review queue ba nguồn chưa có query tổng hợp | Hướng C chưa thể Apply chỉ bằng FE |
| Preview dùng một số số liệu fixture để so hierarchy | Fixture không phải promise API; Review phải bỏ hoặc map sang field thật |
| Worktree FE/BE đang có thay đổi dở | Plan không chạm production source và không stage/commit |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| None | None | Chưa nhận feedback chọn hướng |

### OWED

| Owed | Cleared by |
|---|---|
| Chọn một direction | Feedback của thầy trên preview r1 |
| Khóa component tree, props và source boundary | `starci-fe-design-review` sau khi direction được chọn |
| Grammar backend nếu chọn B hoặc mở grammar trong A | Backend feature Plan → Review → Apply riêng |
| Review queue backend nếu chọn C | Backend feature Plan → Review → Apply riêng |

### PREVIEW RESTART 2026-08-15 13:44 +07:00

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| `hoc-on-tap-r1` | `http://127.0.0.1:8080/` | `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\miamia\hoc-on-tap\r1\index.html` | `698239db0402f4cf9e3c098aa5b548ff01304d8a3b2560ab622f3b7a59963d3c` | đang chờ |

Preview PID mới: `35328`

Preview port mới: `8080`

Runtime MiaMia đã khởi động lại và kiểm tra: FE `http://localhost:3070/vi` trả HTTP `200`; GraphQL `http://localhost:3071/graphql` trả HTTP `200` với `Query`.

## plan r2

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\miamia-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | miamia |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | miamia |
| Repo / branch | FE D:\Repositories\miamia-fe @ codex/miamia-thi-thu (5cf9f72); BE D:\Repositories\mia-mia-backend @ main (420b059) |
| Purpose | Chỉnh hướng A thành landing Học tiếp và route Khám phá/Search riêng dựa trên domain backend thật |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\miamia\hoc-on-tap.md |
| Language | vi |
| Phase | plan |
| Touching | D:\Repositories\starci-academy-backend\.workflows\designs\miamia\hoc-on-tap.md; D:\Repositories\starci-academy-backend\.workflows\.previews\designs\miamia\hoc-on-tap\r2\index.html |

Selected direction: `study-a-continuity-catalog-r2`

Feedback của thầy: “theo học tiếp nhưng mà cũng phải có trang để search khóa học”.

### EVIDENCE R2

| Fact | Source | Consequence |
|---|---|---|
| `learnTopics` trả toàn bộ topic đã publish, gồm `slug`, `level`, `phraseCount`, tên và mô tả song ngữ | `LearnTopicsResolver`, `LearnService.listTopics()` | Phase đầu có thể tìm theo tên, mô tả và level trên danh sách thật |
| Backend MiaMia hiện không expose Course catalogue/query; module content course legacy đã bị gỡ khỏi app owner | Inventory resolver và `apps/api/src/app.module.ts` | Không gọi topic card là khóa học và không dùng Course commerce catalogue legacy để hứa capability |
| FE có `SearchBox` và contract `catalog-query-with-count` | `ExamCatalog`, `CoursesCatalogPage`, registry contracts | REUSE search leaf và search-count composite; không tạo input pattern mới |
| `MiaMiaAppLayout` hiện khóa destination Study và chỉ mở Exam/Profile | `src/components/layouts/MiaMiaAppLayout/index.tsx` | Apply sau Review phải mở route Study và giữ cùng sidebar/mobile footbar |

### CONTRACT INVENTORY R2

| Candidate | Verdict | Reason |
|---|---|---|
| `MiaMiaAppLayout` và mobile footbar | EXTEND | Mở destination Study tới landing Học & ôn tập; không tạo shell mới |
| `SearchBox` | REUSE | Đủ label, placeholder, clear và search action |
| `catalog-query-with-count` | REUSE | Search và result count thuộc cùng một owner |
| Study landing page owner | NEW | Sở hữu Học tiếp, nhịp học và đường sang catalogue |
| Topic catalogue page owner | NEW | Sở hữu query, filter, count, list và empty/failed states cho `learnTopics` |
| Course catalogue commerce owner | REJECT | Sai domain và sai backend capability của MiaMia hiện tại |

### DIRECTIONS R2

| Direction | Tab | Status |
|---|---|---|
| `study-a-continuity-catalog-r2` | `A · Học tiếp + Khám phá` | đã chọn |
| `study-b-dual-path` | `B · Lộ trình kép` | đã từ chối |
| `study-c-review-queue` | `C · Ôn đúng chỗ yếu` | đã từ chối |

Hướng A r2 có hai page owner: landing `Học tiếp` ưu tiên continuity; route `Khám phá chủ đề` cho search/filter catalogue. CTA phụ trên landing mở catalogue mà không cạnh tranh với primary CTA tiếp tục học.

### STATE MATRIX R2

| Surface | Ready | Pending / empty / failed | Mobile |
|---|---|---|---|
| Học tiếp | Resume card, next review, next topic, learning rhythm | Giữ page title; skeleton đúng owner; retry cục bộ | Sidebar đổi footbar; primary CTA giữ trước |
| Khám phá | Search, count, level/type filters, topic cards | Search empty giữ query và clear; failed retry list; pending giữ toolbar | Một cột, search trước filter, không overflow |
| Buổi học | Một prompt và một quyết định | Chặn double-submit, giữ prompt cũ khi record pending | Choice xếp một cột |
| Hoàn thành | Outcome, điểm cần ôn, một CTA tiếp theo | Không dựng XP/Points nếu response không có field | CTA xếp theo priority |

### PREVIEW R2

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| `hoc-on-tap-r2` | `http://127.0.0.1:8081/` | `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\miamia\hoc-on-tap\r2\index.html` | `2b3ecfa7a16dac533d1ac33116ea53693ec0bbc49106fbeab2b182bee226c8b2` | đang chờ |

Preview root: `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\miamia\hoc-on-tap\r2`

Preview PID: `2380`

Preview port: `8081`

QA preview: năm surface tab chuyển client-side tại một URL; search `B2` trả đúng 1 topic và ẩn topic không khớp; console không có error; viewport `390×844` ẩn sidebar, hiện footbar và không overflow ngang.

### OUTPUTS

| Concept | Result |
|---|---|
| Hướng A r2 | Học tiếp là landing ưu tiên; Khám phá là route search catalogue riêng |
| Domain catalogue | Hiển thị “chủ đề học” theo capability thật, chưa gọi là “khóa học” |
| Search phase đầu | Tìm theo tên, mô tả và level trên payload `learnTopics`; giữ chỗ rõ cho server search khi catalogue lớn |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\miamia\hoc-on-tap.md` | modified — append feedback, evidence, direction được chọn và preview r2 |
| `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\miamia\hoc-on-tap\r2\index.html` | added — một HTML có direction tabs và năm surface tabs, gồm search tương tác |

### NEED APPROVALS

| Question | Options |
|---|---|
| Chốt cấu trúc A r2 để chuyển sang Design Review | `Duyệt A r2` — Học tiếp landing + Khám phá chủ đề route riêng; hoặc feedback tiếp trên preview |

### WARNINGS

| Warning | Impact |
|---|---|
| `learnTopics` chưa nhận search/filter/pagination input | Client search phù hợp catalogue hiện tại chỉ có 2 topic; catalogue lớn cần Backend Feature Plan cho server search |
| Grammar catalogue vẫn chưa có GraphQL owner | Filter Ngữ pháp phải disabled/coming soon cho tới khi backend capability được duyệt và triển khai |
| FE vẫn chứa Course catalogue legacy từ StarCi | Review phải khóa không reuse connected course commerce owner trong MiaMia Study |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| A r1 chỉ đặt hai topic dưới landing, chưa có bề mặt tìm kiếm riêng | A r2 tách `Học tiếp` và `Khám phá chủ đề` thành hai page owner | “theo học tiếp nhưng mà cũng phải có trang để search khóa học” |
| Gọi topic hiện tại là khóa học | Gọi đúng là chủ đề học; chỉ nâng thành Course khi backend có owner | Backend hiện chỉ expose topic/phrase learning |
| B · Lộ trình kép | A · Học tiếp + Khám phá | Thầy chọn theo Học tiếp |
| C · Ôn đúng chỗ yếu | A · Học tiếp + Khám phá | Thầy chọn theo Học tiếp |

### OWED

| Owed | Cleared by |
|---|---|
| Khóa exact route/page/layout/block/composite/leaf tree và props migrations | `starci-fe-design-review` sau khi thầy duyệt A r2 |
| Server-side search khi số topic tăng | Backend Feature Plan riêng với pagination/search contract |
| Grammar catalogue | Backend Feature Plan riêng |

## review r1

Approved revision: `hoc-on-tap-review-r1`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\miamia-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | miamia |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | miamia |
| Repo / branch | FE `codex/miamia-thi-thu` @ `5cf9f72`; BE `main` @ `420b059` |
| Purpose | Review và khóa exact implementation boundary cho direction A r2 đã chọn |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\miamia\hoc-on-tap.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ append workflow này; không sửa HTML preview hoặc production source |

### REVIEW VERDICT

Giữ decision model A r2: `/study` ưu tiên học tiếp và `/study/explore` là catalogue tìm chủ đề riêng. Review sửa bốn promise chưa được contract hiện tại bảo đảm: topic không phải Course; `recordPractice` không trả XP; không có save/pause mutation; và `recordPractice` chưa gắn `topic` cho `study_sessions`, nên `continueLearning.topic` chưa thể phản ánh buổi phrase practice vừa hoàn thành.

### COMPONENT DELTA

| Layer | Owner | Action | Current path | Final path | Parent / call sites | Contract | Reason |
|---|---|---|---|---|---|---|---|
| route | Study route | ADD | — | `src/app/[lang]/(app)/study/page.tsx` | Next App Router → `StudyHomePage` | Next route | Landing Học tiếp |
| route | Study explore route | ADD | — | `src/app/[lang]/(app)/study/explore/page.tsx` | Next App Router → `StudyCatalogPage` | Next route | Search catalogue riêng |
| route | Study topic route | ADD | — | `src/app/[lang]/(app)/study/topics/[slug]/page.tsx` | Next App Router → `StudyTopicPage` | Next dynamic route | Topic detail bằng slug thật |
| route | Study practice route | ADD | — | `src/app/[lang]/(app)/study/topics/[slug]/practice/page.tsx` | Next App Router → `StudyPracticePage` | Next dynamic route | Session và result cùng một route stateful |
| page | StudyHomePage connected/pure | ADD | — | `src/components/pages/StudyHomePage/index.tsx`; `component.tsx` | Study route; mounts `StudyContinue` + `StudyProgress` | `routed-page-main`; `study-home-grid` | Tách hai request owner nhưng giữ một page reading order |
| page | StudyCatalogPage connected/pure | ADD | — | `src/components/pages/StudyCatalogPage/index.tsx`; `component.tsx` | Explore route; mounts `StudyTopicCatalog` | `routed-page-main` | Catalogue/search owner riêng |
| page | StudyTopicPage connected/pure | ADD | — | `src/components/pages/StudyTopicPage/index.tsx`; `component.tsx` | Topic route; mounts `StudyTopicOverview` | `routed-page-main` | Detail không trộn session state |
| page | StudyPracticePage connected/pure | ADD | — | `src/components/pages/StudyPracticePage/index.tsx`; `component.tsx` | Practice route; mounts `PhrasePractice` + `SignInOverlay` | `routed-page-main` | Page giữ overlay; block giữ session answers |
| layout | MiaMiaAppLayout connected | MODIFY | `src/components/layouts/MiaMiaAppLayout/index.tsx` | same | `src/app/[lang]/(app)/layout.tsx`; `/study` và mọi route có prefix `/study/` | `learn-shell-frame`; `learn-mobile-tab-bar` | Mở destination `study`, current state cho nhánh study và push `/study` |
| layout | _MiaMiaAppLayout pure | REUSE | `src/components/layouts/MiaMiaAppLayout/component.tsx` | same | `MiaMiaAppLayout/index.tsx` | `learn-shell-frame`; `learn-mobile-tab-bar` | Sidebar → footbar đã đúng; không đổi props |
| overlay | SignInOverlay | REUSE | `src/components/overlays/auth/SignInOverlay/index.tsx`; `component.tsx` | same | `StudyPracticePage/index.tsx` | `centred-page-column` | Anonymous xem public; chỉ mở auth khi ghi mastery |
| block | StudyContinue connected/pure | ADD | — | `src/components/blocks/study/StudyContinue/index.tsx`; `component.tsx` | `StudyHomePage/index.tsx` | `study-resume-hero` | Own `continueLearning`; không dựng resume fixture |
| block | StudyProgress connected/pure | ADD | — | `src/components/blocks/study/StudyProgress/index.tsx`; `component.tsx` | `StudyHomePage/index.tsx` | `study-progress-card` | Own `progressSummary`; guest/pending/failed/ready độc lập |
| block | StudyTopicCatalog connected/pure | ADD | — | `src/components/blocks/study/StudyTopicCatalog/index.tsx`; `component.tsx` | `StudyCatalogPage/index.tsx` | `study-catalog-stack`; `study-topic-grid`; `study-topic-card` | Own `learnTopics`, locale, query và level filter |
| block | StudyTopicOverview connected/pure | ADD | — | `src/components/blocks/study/StudyTopicOverview/index.tsx`; `component.tsx` | `StudyTopicPage/index.tsx` | `study-topic-overview`; `study-phrase-list`; `study-phrase-row` | Own `topicDetail`; public detail và CTA practice |
| block | PhrasePractice connected/pure | ADD | — | `src/components/blocks/study/PhrasePractice/index.tsx`; `component.tsx` | `StudyPracticePage/index.tsx` | `study-practice-stack`; `study-option-grid`; `study-result-stack` | Own `phrasePractice`, local answers và `recordPractice` |
| composite | EmptyNotice | REUSE | `src/components/composites/EmptyNotice/index.tsx` | same | Các block study pure: empty/failed/filtered-empty | `empty-notice-stack` | Recovery shape đã có |
| composite | StatRow | REUSE | `src/components/composites/StatRow/index.tsx` | same | `StudyProgress/component.tsx`; result facts | `glyph-title-fact-row` | Fact row cố định đã có |
| composite | LabelledProgressRow | REUSE | `src/components/composites/LabelledProgressRow/index.tsx` | same | `StudyProgress/component.tsx`; topic progress | `label-fact-over-progress` | Không tạo progress composite mới |
| branch | Tree | REUSE | `src/components/branches/Tree/index.tsx`; `component.tsx` | same | Mọi pure page/block mới | Các study contract mới | Canonical typed contract renderer |
| branch | SurfaceCard | REUSE | `src/components/branches/SurfaceCard/index.tsx`; `component.tsx` | same | Resume, progress, topic và result surfaces | Existing surface contract | Giữ StarCi pattern; MiaMia chỉ theme qua global CSS |
| leaf | SearchBox | REUSE | `src/components/leaves/SearchBox/index.tsx` | same | `StudyTopicCatalog/component.tsx` | `catalog-query-with-count` | Có label, placeholder, clear và search action |
| leaf | ChoiceTabs | REUSE | `src/components/leaves/ChoiceTabs/index.tsx`; `component.tsx` | same | Level/type filter ở catalogue | Leaf API hiện tại | Grammar hiển thị disabled/coming soon, không giả data |
| leaf | Heading, Text, Button, Badge, Progress | REUSE | `src/components/leaves/Heading/index.tsx`; `src/components/leaves/Text/index.tsx`; `src/components/leaves/Button/index.tsx`; `src/components/leaves/Badge/index.tsx`; `src/components/leaves/Progress/index.tsx` | same | Các block study pure | Slots của study contracts | Đủ typography, CTA, status và progress |
| shell | RouteShell | REUSE | `src/components/shells/RouteShell/index.tsx`; `component.tsx` | same | `src/app/[lang]/(app)/layout.tsx` | Existing shell | Route mới dùng nguyên app shell |

### PROPS DELTA

| Owner | Prop / API | Action | Before | After | Producers / call sites | Migration proof |
|---|---|---|---|---|---|---|
| Study route | default page API | ADD | — | default page render `StudyHomePage` | Next App Router | Route import resolves đúng owner |
| Study explore route | default page API | ADD | — | default page render `StudyCatalogPage` | Next App Router | Route import resolves đúng owner |
| Study topic route | params API | ADD | — | async Next params chứa `slug: string`, truyền vào `StudyTopicPage` | Next App Router | Dynamic slug passed once |
| Study practice route | params API | ADD | — | async Next params chứa `slug: string`, truyền vào `StudyPracticePage` | Next App Router | Dynamic slug passed once |
| StudyHomePage connected/pure | connected/pure surfaces | ADD | — | connected no props; pure `{continueSurface: ComponentType; progressSurface: ComponentType}` | Study route; connected page | Pure test proves two slots and reading order |
| StudyCatalogPage connected/pure | connected/pure surface | ADD | — | connected no props; pure `{surface: ComponentType}` | Explore route; connected page | Mirrors inspected ExamCatalogPage family |
| StudyTopicPage connected/pure | connected/pure API | ADD | — | connected `{slug:string}`; pure `{surface: ComponentType}` | Topic route; connected page | Component test + route typecheck |
| StudyPracticePage connected/pure | connected/pure API | ADD | — | connected `{slug:string}`; pure `{surface: ComponentType}`; page owns `signInOpen` | Practice route; connected page | Overlay test proves auth opens without losing mounted block |
| MiaMiaAppLayout connected | `MiaMiaAppLayoutProps` | KEEP | `{surface: ComponentType}` | same | `src/app/[lang]/(app)/layout.tsx` | Existing consumers unchanged; focused layout test adds study routing/current state |
| StudyContinue connected/pure | connected API + state union | ADD | — | `{onBrowse():void; onResumeTopic(slug:string):void}`; pure `pending | failed | empty | ready` | StudyHomePage | Pure state tests; ready requires response-backed slug |
| StudyProgress connected/pure | connected API + state union | ADD | — | `{onBrowse():void; onRequireSignIn():void}`; pure `guest | pending | failed | ready` | StudyHomePage | Pure state tests; no fabricated metric |
| StudyTopicCatalog connected/pure | connected API + state union | ADD | — | `{onOpenTopic(slug:string):void}`; pure `pending | failed | empty | filtered-empty | ready` with resolved copy/topic rows | StudyCatalogPage | Search/filter tests against fixture identities from live topics |
| StudyTopicOverview connected/pure | connected API + state union | ADD | — | `{slug:string; onStartPractice():void; onBack():void}`; pure `pending | failed | empty | ready` | StudyTopicPage | Query slug and action tests |
| PhrasePractice connected/pure | connected API + state union | ADD | — | `{slug:string; onRequireSignIn():void; onExit():void}`; pure `pending | failed | empty | answering | submitting | result` | StudyPracticePage | Tests cover answer, double-submit, guest auth, mutation result and retry |
| Study contracts registry | contract keys/slots | ADD | — | `study-home-grid`, `study-resume-hero`, `study-progress-card`, `study-catalog-stack`, `study-topic-grid`, `study-topic-card`, `study-topic-overview`, `study-phrase-list`, `study-phrase-row`, `study-practice-stack`, `study-option-grid`, `study-result-stack` with only slots rendered by owners above | Pure study components | Contract tests/lint reject missing, extra or dead slots |

### OWNER STATES

| Owner | Binding behavior |
|---|---|
| StudyContinue | `continueLearning.topic` có slug → ready; null → empty + CTA Khám phá; request fail → local retry. Không suy từ fixture/localStorage |
| StudyProgress | Không token → guest; token + unresolved → pending; lỗi → failed; data → ready. Chỉ hiện field `progressSummary` thật |
| StudyTopicCatalog | Client search theo localized name/blurb/level trên payload hiện tại; query rỗng + zero data là empty; query có text + zero match là filtered-empty |
| StudyTopicOverview | Render `topicDetail(slug)` và phrase list; không đưa grammar/card commerce vào tree |
| PhrasePractice | Mỗi phrase chọn một option; submit một lần; anonymous giữ answers trong mounted block và mở SignInOverlay; result chỉ dùng `phrasesStudied`, `phrasesKnown` và correct count tính từ local answers |

### SUPPORTING PRODUCTION BOUNDARY

| Kind | Exact paths |
|---|---|
| Contracts | `src/components/contracts/index.ts` |
| Messages | `src/messages/vi.json`; `src/messages/en.json` dưới `miamia.study.*` |
| Query types/docs | `src/modules/api/graphql/queries/types/study.ts`; `query-learn-topics.ts`; `query-topic-detail.ts`; `query-phrase-practice.ts`; `query-continue-learning.ts` |
| Mutation types/doc | `src/modules/api/graphql/mutations/types/record-practice.ts`; `mutation-record-practice.ts` |
| Hooks | `src/hooks/swr/useQueryLearnTopicsSwr.ts`; `useQueryTopicDetailSwr.ts`; `useQueryPhrasePracticeSwr.ts`; `useQueryContinueLearningSwr.ts`; `src/hooks/index.ts` |
| Component tests | Mỗi pure study page/block có `component.test.tsx`; `MiaMiaAppLayout/component.test.tsx` và connected layout test cập nhật cho study destination |
| Transport tests | Mỗi query/mutation mới có sibling `.test.ts`; authenticated client bắt buộc cho `continueLearning` và `recordPractice` |

### ACCEPTANCE EVIDENCE

| Gate | Proof |
|---|---|
| Static | `npm run typecheck`; focused ESLint trên toàn bộ boundary; sau đó `npm run lint` |
| Unit | Focused Vitest cho routes/pages/layout/blocks/query/mutation; sau đó `npm run test` |
| Build | `npm run build` |
| Runtime anonymous | `/vi/study` và `/vi/study/explore`; search/filter/detail; desktop sidebar + mobile footbar; console/network không lỗi |
| Runtime authenticated | Test account: đăng nhập → mở topic → làm hết phrase practice → submit đúng một lần → result → quay lại Study |
| Runtime contract | Network phải có `learnTopics`, `topicDetail`, `phrasePractice`, `recordPractice`; ghi status/GraphQL errors vào workflow |
| Responsive | `390×844` và `1440×900`, không overflow; source order không đổi |

### OUTPUTS

| Concept | Result |
|---|---|
| A r2 đã review | `/study` là landing Học tiếp; `/study/explore` là catalogue tìm chủ đề; detail và practice dùng route riêng |
| Acceptance meaning | UI chỉ hiện capability thật; anonymous khám phá được, authenticated mới ghi mastery; mobile dùng footbar hiện có |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\miamia\hoc-on-tap.md` | modified — append Review r1, exact component/props tree, production boundary, states và proof gates; chưa sửa source |

### NEED APPROVALS

| Question | Options |
|---|---|
| Chốt Review revision | Duyệt `hoc-on-tap-review-r1` để ghi Approved revision và mở Apply |
| Capability “Học tiếp” sau buổi phrase practice | Cho phép mở Backend Feature Plan riêng để `recordPractice` gắn topic vào study session trước FE Apply; hoặc chấp nhận empty state cho đến khi backend được bổ sung |

### WARNINGS

| Warning | Impact |
|---|---|
| `recordPractice` tạo `StudySessionEntity` nhưng không gắn topic | `continueLearning.topic` không resume được luồng phrase practice hiện tại |
| `recordPractice` không trả XP/Points và không có pause/save mutation | Không được hiện `+10 XP` hoặc CTA `Thoát & lưu` trong Apply này |
| `learnTopics` không có server search/pagination | Client search chỉ là phase đầu; khi catalogue lớn cần Backend Feature Plan |
| Grammar chưa có GraphQL owner | Filter grammar disabled/coming soon; không render dữ liệu giả |
| FE worktree đang có nhiều thay đổi dở | Apply phải commit nguyên trạng baseline trước khi sửa và chỉ đánh giá diff sau baseline |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Gọi topic là “khóa học” | “Chủ đề học” | Backend hiện chỉ có topic/phrase, không có Course owner |
| Result `+10 XP` | `phrasesStudied`, `phrasesKnown`, correct count | Mutation không trả XP delta |
| CTA `Thoát & lưu` | `Thoát`; cảnh báo nếu còn câu chưa submit | Không có persistence mutation |
| Resume bằng fixture/local state | Empty + CTA Khám phá cho tới khi `continueLearning.topic` có dữ liệu | Không được che contract gap |
| Reuse connected Course/ContinueLearning legacy | Study owners mới nhưng reuse leaves/branches/contracts phù hợp | Legacy owner gọi course/lesson/challenge API sai domain MiaMia |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval cho `hoc-on-tap-review-r1` | Feedback của thầy |
| Backend topic-linked practice session | `starci-be-feature-plan` → Review → Apply riêng, hoặc quyết định chấp nhận empty |
| Ghi `Approved revision` rồi mới Apply | Cùng workflow sau explicit approval |

## apply

Applied revision: `hoc-on-tap-review-r1`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\miamia-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | miamia |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | miamia |
| Repo / branch | FE `codex/miamia-thi-thu` @ `a662e371e2e073fcabfda650ce999ce8abe65dd4`; BE `main` @ `a486a58856206d1dc8e9d36a562cc371670763d2` |
| Purpose | Apply direction A r2 đã duyệt cho Học & ôn tập trực tiếp vào source MiaMia |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\miamia\hoc-on-tap.md |
| Language | vi |
| Phase | apply |
| Touching | Chỉ exact production boundary và test boundary của `hoc-on-tap-review-r1` |

### BASELINE

| Field | Value |
|---|---|
| Baseline commit | `a662e371e2e073fcabfda650ce999ce8abe65dd4` |
| Tracked diff | `a662e37..worktree` |
| Baseline meaning | Toàn bộ worktree FE đang dở trước Study đã được checkpoint; không đánh đồng thay đổi cũ với Apply này |

### OUTPUTS

| Concept | Result |
|---|---|
| Học & ôn tập | Đang triển khai landing Học tiếp, catalogue chủ đề, detail và phrase practice theo Review r1 |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\miamia-fe` | baseline đã commit; chưa ghi production diff Study tại thời điểm mở Apply |
| `D:\Repositories\starci-academy-backend\.workflows\designs\miamia\hoc-on-tap.md` | append metadata Apply và baseline để track diff |

### NEED APPROVALS

| Item | Status |
|---|---|
| `hoc-on-tap-review-r1` | Đã được thầy duyệt; không còn approval trước khi ghi source |

### WARNINGS

| Warning | Impact |
|---|---|
| Typecheck/build của baseline FE đang có lỗi contract `never` lịch sử | Apply sẽ đo lại sau khi thêm contract Study; chỉ sửa phần nằm trong exact boundary đã duyệt |

### APPLY RESULT

Baseline commit: `a662e371e2e073fcabfda650ce999ce8abe65dd4`

Tracked diff: `a662e37..worktree`

| Field | Value |
|---|---|
| Applied revision | `hoc-on-tap-review-r1` |
| Baseline | `a662e371e2e073fcabfda650ce999ce8abe65dd4` |
| Diff identity | `a662e37..worktree` |
| Backend contract | `a486a58856206d1dc8e9d36a562cc371670763d2` |
| Status | Source Study đã triển khai và chứng minh ở runtime thật; còn hai gate toàn repo lịch sử được tách ở WARNINGS/OWED |

#### OUTPUTS

| Concept | Result |
|---|---|
| Học tiếp | `/study` ưu tiên chủ đề gần nhất từ `continueLearning`; chưa có lịch sử thì dẫn sang catalogue |
| Khám phá chủ đề | `/study/explore` có tìm kiếm, lọc trình độ, empty state và mở detail bằng slug thật |
| Học theo chủ đề | Topic detail hiển thị phrase thật; practice giữ đáp án cục bộ, chỉ yêu cầu đăng nhập lúc ghi mastery |
| Kết quả | Submit đúng một mutation, hiện số câu đúng và counters backend xác nhận, rồi quay lại Study |
| Responsive | Desktop giữ sidebar; mobile dùng footbar hiện có; không tạo navigation song song |

#### CHANGES

| Tree | Details |
|---|---|
| `src/app/[lang]/(app)/study/` | added — bốn route final source: landing, explore, topic detail và topic practice |
| `src/components/pages/StudyHomePage/` | added — connected/pure page ghép Học tiếp và tiến trình |
| `src/components/pages/StudyCatalogPage/` | added — connected/pure catalogue page |
| `src/components/pages/StudyTopicPage/` | added — connected/pure topic detail page |
| `src/components/pages/StudyPracticePage/` | added — connected/pure practice page, giữ auth overlay tại page owner |
| `src/components/blocks/study/StudyContinue/` | added — states pending/failed/empty/ready từ `continueLearning` thật |
| `src/components/blocks/study/StudyProgress/` | added — states guest/pending/failed/ready từ progress thật |
| `src/components/blocks/study/StudyTopicCatalog/` | added — client search, level filter và catalogue cards |
| `src/components/blocks/study/StudyTopicOverview/` | added — topic detail và danh sách phrase |
| `src/components/blocks/study/PhrasePractice/` | added — answer state, auth boundary, single submit và verified result |
| `src/components/layouts/MiaMiaAppLayout/` | modified — mở destination Study, current state cho toàn nhánh `/study`, giữ sidebar → footbar |
| `src/components/contracts/index.ts` | modified — thêm 12 study contracts, hai layout classes được phép và giữ literal contract types với TypeScript 5.9 |
| `src/modules/api/graphql/queries/` | added — types/docs/tests cho `learnTopics`, `topicDetail`, `phrasePractice`, `continueLearning` |
| `src/modules/api/graphql/mutations/` | added — types/doc/test cho `recordPractice` |
| `src/hooks/swr/`; `src/hooks/index.ts` | added/modified — bốn SWR query hooks và public exports |
| `src/messages/vi.json`; `src/messages/en.json` | modified — copy `miamia.study.*`, tiếng Việt là ngôn ngữ hiển thị chính |
| `**/component.test.tsx`; `MiaMiaAppLayout/index.test.tsx` | added/modified — focused pure/connected behavior, transport và navigation proof |
| `D:\Repositories\starci-academy-backend\.workflows\designs\miamia\hoc-on-tap.md` | modified — append baseline, diff, source tree, gate và runtime evidence bằng tiếng Việt |

#### GATES

| Gate | Result | Evidence |
|---|---|---|
| Diff hygiene | PASS | `git diff --check` không có whitespace error; chỉ có cảnh báo line-ending LF/CRLF của Git |
| Typecheck FE | PASS | `npm run typecheck` |
| ESLint source FE | PASS | `npx eslint .`; 0 error, chỉ cảnh báo generic React version |
| Focused Study tests | PASS | 16 files, 17 tests |
| Production build FE | PASS | `npm run build`; đủ bốn Study routes |
| Build BE | PASS | `npm run build` tại backend |
| Lint BE | PASS có nợ lịch sử | `npm run lint:check`: 0 error, 367 warning lịch sử |
| Live backend query | PASS | `learnTopics` trả topic thật `ordering-food` và `exam-glossary-01` từ `http://localhost:3071/graphql` |
| Canonical `npm run lint` FE | BLOCKED ngoài boundary | Dừng trước ESLint vì `plugins/eslint-canon/` drift khỏi trust tree; không tự rewrite generated mirror trong Apply Study |
| Full FE test | BASELINE DEBT | 154 files/536 tests pass; 11 files/15 tests fail ở dashboard/navigation, stale roster/selectors, ResizeObserver và Apollo expectations ngoài Study |

#### RUNTIME EVIDENCE

| Flow | Result |
|---|---|
| Anonymous/public discovery | `/vi/study/explore` load; search `không-có` ra filtered-empty; search `gọi món` chỉ còn topic Gọi món |
| Topic detail | Mở `ordering-food`; hiển thị đúng 4 phrase từ backend |
| Authenticated practice | Test account mở practice, trả lời đúng 4/4, submit đúng một lần |
| Mutation/result | `recordPractice` thành công; result hiện 4/4, `phrasesStudied=4`, `phrasesKnown=0` |
| Continue learning | Quay về `/vi/study`; `continueLearning.topic` đổi sang trạng thái resume và hiện “Tiếp tục chủ đề gần nhất” |
| Progress | Sau practice hiển thị 1 ngày và 5/100 XP theo response hiện có |
| Network contract | PASS cho `learnTopics`, `topicDetail`, `phrasePractice`, `recordPractice`, `continueLearning`; không có GraphQL error trong flow |
| Console | Không có console error sau fresh reload; còn warning HeroUI `PressResponder` từ shared shell/navigation |
| Mobile | CSS viewport `390×843`, `scrollWidth=379`; không overflow; catalogue/search/tabs/footbar hoạt động |
| Desktop | CSS viewport `1440×900`, `scrollWidth=1440`; không overflow; sidebar hoạt động |

#### NEED APPROVALS

| Question | Options |
|---|---|
| Source boundary Study | Không còn approval; đã Apply đúng `hoc-on-tap-review-r1` |
| Sửa canonical lint mirror hoặc baseline full-test debt | Không nằm trong approval này; nếu muốn xử lý phải mở Plan/Review riêng |

#### WARNINGS

| Warning | Impact |
|---|---|
| Canonical lint mirror của FE đang drift khỏi Trust | `npm run lint` wrapper chưa thể xanh dù `npx eslint .` của source đạt 0 lỗi |
| Full FE suite có 15 failure ngoài Study | Không được tuyên bố toàn repo test xanh; focused Study suite và production build vẫn đạt |
| Shared shell phát warning HeroUI `PressResponder` | Không làm hỏng Study flow, nhưng cần fidelity/audit riêng nếu muốn console hoàn toàn sạch |
| Grammar chưa có GraphQL owner | Catalogue hiện không giả dữ liệu grammar; cần Backend Feature Plan trước khi mở filter |

#### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Tạo parallel design source | Ghi trực tiếp vào final source sau baseline commit | Giữ đúng Apply lifecycle và diff identity |
| Giả course/grammar/XP delta | Chỉ render topic, phrase và counters response thật | Không vượt backend contract |
| Tự sync generated ESLint mirror trong Apply Study | Ghi blocker và route sang audit/lint-sync riêng | Ngoài exact approved boundary |

#### OWED

| Owed | Cleared by |
|---|---|
| Canonical lint mirror drift | `starci-fe-lint-sync-plan` → Review → Apply riêng |
| 15 full-test failure lịch sử | FE audit Plan/Review/Apply với baseline đo riêng |
| HeroUI shared-shell warnings | Fidelity continuation hoặc audit đúng owner |
| Grammar catalogue | Backend Feature Plan khi product chốt contract |
