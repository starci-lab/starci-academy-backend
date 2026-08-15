<!-- starci-workflow: v2 -->

## plan

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | nivo |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | nivo-expert-academy / @nivo/expert |
| Repo / branch | Frontend D:\Repositories\nivo-fe @ session/surface-branch-and-dead-vocabulary; Backend D:\Repositories\nivo-backend @ main |
| Purpose | Preview cùng pattern A+B cho learner Expert Academy: sidebar là navigation, journey là flex row trên content, và classroom vẫn giữ cùng định vị. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\nivo-expert-academy\learner-journey.md |
| Language | vi |
| Phase | plan |
| Touching | Chỉ workflow này và D:\Repositories\starci-academy-backend\.workflows\.previews\designs\nivo-expert-academy\learner-journey\r1\ |

### Evidence

| Nguồn | Kết luận dùng cho preview |
|---|---|
| Legacy `D:\Repositories\nivo\apps\expert\app\learn\page.tsx` | Learner dashboard có các destination Tổng quan, Khóa của tôi, Tiếp tục học, Trợ giảng AI, Cộng đồng, Tài liệu, Chứng chỉ. |
| Legacy `D:\Repositories\nivo\apps\expert\app\classroom\[courseSlug]\LessonsPanel.tsx` | Classroom có lesson list, lesson hiện tại, trạng thái completed/in-progress và player/viewer. |
| Backend `D:\Repositories\nivo-backend\src\features\expert\graphql` | Có course progress, save lesson position, mark lesson complete, certificates, lesson attachments và classroom queries. |
| Canon target `D:\Repositories\nivo-fe\apps\expert\src` | Hiện đã có landing/catalogue contract; learner/classroom route chưa được port vào canon target. |

### Direction / ownership

| Surface | Phân loại | Quyết định |
|---|---|---|
| Sidebar learner | REUSE / EXTEND | Reuse DashboardShell idea từ legacy, giữ vai trò navigation; không đặt journey state vào đây. |
| Learner journey row | NEW | Flex row trên content: Bắt đầu → Đang học → Hoàn thành → Chứng chỉ. |
| Classroom journey row | NEW | Cùng grammar nhưng theo ngữ cảnh khóa học: Khóa học → Bài đang học → Bài tập → Hoàn tất. |
| Course/lesson progress | EXTEND | Bám backend progress rows và lesson completion; không tính phần trăm từ dữ liệu không có. |
| Certificates | REUSE capability / NEW surface | Backend đã có capability; learner surface cần owner hiển thị. |

Preview root: `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\nivo-expert-academy\learner-journey\r1\`  
PID: `53040`  
Port: `8091`

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| Expert learner journey r1 | http://127.0.0.1:8091/ | `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\nivo-expert-academy\learner-journey\r1\index.html` | `EEE47E483CD85176449D7B764C632C4C873865C6FD18606E1EFC7F9FE09DBA6E` | `đã chốt pattern A+B` |

| Direction | Tab | Status |
|---|---|---|
| Learner hub — journey flex row + sidebar navigation | `Tổng quan học viên` | `đã chọn` |
| Classroom — journey flex row + lesson context | `Trong lớp học` | `đã chọn` |

### Acceptance states

| State | Must show |
|---|---|
| Learner overview | Sidebar navigation, journey row trên content, khóa đang học, CTA tiếp tục học. |
| Classroom | Cùng journey row nhưng lesson hiện tại là trọng tâm; lesson list bên cạnh không thay vai trò navigation. |
| Progress loading/empty | Không giả phần trăm; hiển thị trạng thái trung thực và vẫn giữ layout. |
| Lesson completed | Cập nhật row lesson và bước journey; có đường đi rõ sang bài tiếp theo. |
| Course completed | Bước Hoàn thành/Chứng chỉ có trạng thái thật từ backend. |
| Signed out/refused | Auth gate hoặc refusal rõ ràng, không dựng classroom giả. |

### OUTPUTS

| Concept | Result |
|---|---|
| Learner pattern | Đã chuyển pattern A+B sang Expert Academy learner surface. |
| Preview | Một index có hai tab: overview learner và classroom lesson; cả hai giữ journey flex row trên content. |
| Backend truth | Preview chỉ dùng các capability đã thấy: course, lesson, progress, completion, certificate. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\nivo-expert-academy\learner-journey.md` | `added` — Plan brief, evidence, ownership, tabs và acceptance states. |
| `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\nivo-expert-academy\learner-journey\r1\index.html` | `added` — disposable tabbed HTML preview, không phải production source. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Xác nhận preview learner Expert Academy | **Đã chốt cùng pattern A+B**; nếu đúng, chuyển sang `$starci-fe-design-review`; nếu chưa, chỉ rõ tab/section cần chỉnh. |

### WARNINGS

| Warning | Impact |
|---|---|
| `nivo-fe/apps/expert` hiện chưa có learner/classroom source tương ứng với legacy. | Preview là direction evidence, chưa phải baseline để Apply. |
| Một số legacy helper/API không nằm trong canon target hiện tại. | Review phải lập exact backend/FE enabler boundary trước khi viết source. |
| Progress và certificate phải đọc backend result thật. | Không được hardcode phần trăm, streak hoặc certificate state trong production. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Đặt journey vào sidebar | Flex row trên content | Đã chốt hierarchy ở flow Nivo trước: sidebar là navigation, journey là tiến trình của surface. |

### OWED

| Owed | Cleared by |
|---|---|
| Review learner/classroom ownership và live contracts | `$starci-fe-design-review`. |
| Chốt exact production route/file tree | Review phê duyệt trước Apply. |

## review

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | nivo |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | nivo-expert-academy / @nivo/expert |
| Repo / branch | Frontend D:\Repositories\nivo-fe @ session/surface-branch-and-dead-vocabulary; Backend D:\Repositories\nivo-backend @ main |
| Purpose | Review preview learner Expert Academy theo pattern A+B: sidebar navigation, journey flex row trên content, classroom giữ cùng grammar. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\nivo-expert-academy\learner-journey.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow này; không chạm production source. |

### REVIEW FINDINGS

| Check | Result | Consequence |
|---|---|---|
| Hierarchy | Pass | Sidebar chỉ giữ điều hướng; journey là flex row ở đầu vùng content của learner và classroom. |
| Existing FE canon | Pass with boundary | `AcademyChrome` hiện chỉ sở hữu theme/document ground; không nhồi learner navigation vào đó. Cần một learner chrome/page owner riêng hoặc mở rộng có tên rõ ràng ở Apply. |
| Page ownership | Pass with boundary | Mỗi route learner/classroom sẽ có `page.tsx` mount và `components/pages/*/index.tsx` resolve world; `component.tsx` chỉ nhận resolved props và draw. |
| Backend truth | Pass | Backend đã đăng ký progress, save position, mark complete và certificates; Apply phải gọi đúng envelope/field shape, không hardcode phần trăm, streak hoặc certificate state. |
| Loading/empty/refused | Required | Mỗi block progress/classroom phải giữ cùng layout khi loading, empty, refused; auth refusal không được dựng classroom giả. |
| Preview fixture | Review note | Các số 42%, 8/19 và mốc thời gian chỉ là fixture để kiểm tra hierarchy; không phải acceptance data production. |
| Optional surfaces | Defer | AI tutor, tài liệu và community không nằm trong slice đầu nếu chưa có contract FE đã khóa; sidebar có thể mở slot điều hướng nhưng không hứa nội dung chưa có owner. |

### APPROVED DIRECTION CANDIDATE

| Surface | Verdict | Review decision |
|---|---|---|
| Learner overview | Keep | Giữ journey row trên content, course đang học và CTA tiếp tục bài học. |
| Classroom | Keep | Giữ journey row trên content, lesson hiện tại là trọng tâm, lesson rail là context của lớp chứ không thay journey. |
| Sidebar | Keep | Navigation-only; không sở hữu progress, lesson hoặc certificate state. |
| Certificate | Keep as guarded state | Chỉ render khi backend trả trạng thái/record thật; nếu chưa đủ field thì giữ entry ở trạng thái unavailable rõ ràng. |
| AI tutor/docs/community | Defer | Không đưa vào production boundary đầu tiên. |

### PRODUCTION BOUNDARY CANDIDATE

| Tree | Ownership | Status |
|---|---|---|
| `D:\Repositories\nivo-fe\apps\expert\src\app\[locale]\learn\page.tsx` | Route mount | NEW |
| `D:\Repositories\nivo-fe\apps\expert\src\app\[locale]\classroom\[courseSlug]\page.tsx` | Route mount | NEW |
| `D:\Repositories\nivo-fe\apps\expert\src\components\pages\LearnerPage\index.tsx` + `component.tsx` | Resolve/draw learner overview | NEW |
| `D:\Repositories\nivo-fe\apps\expert\src\components\pages\ClassroomPage\index.tsx` + `component.tsx` | Resolve/draw classroom | NEW |
| `D:\Repositories\nivo-fe\apps\expert\src\components\layouts\LearnerChrome\index.tsx` | Sidebar + learner shell; theme remains owned by `AcademyChrome` | NEW |
| `D:\Repositories\nivo-fe\apps\expert\src\components\blocks\learning\LearningJourney\` | Shared learner journey row | NEW |
| `D:\Repositories\nivo-fe\apps\expert\src\components\blocks\learning\CourseProgress\` | Course progress/empty/refused states | NEW |
| `D:\Repositories\nivo-fe\apps\expert\src\components\blocks\classroom\LessonRail\` | Lesson context and completion states | NEW |
| `D:\Repositories\nivo-fe\apps\expert\src\modules\api\learning.ts` + `classroom.ts` | Typed GraphQL reads/writes matching backend | NEW |
| `D:\Repositories\nivo-fe\apps\expert\src\messages\vi.json` + `en.json` | Product copy and states | EXTEND |
| Shared `@nivo/ui` contract registry | Named structural contracts only where required by canon | EXTEND after source inspection |

### ACCEPTANCE EVIDENCE

| Evidence | Command/state |
|---|---|
| Overview route | Open `/vi/learn` signed in; sidebar and top journey row visible; CTA follows real resumable lesson. |
| Classroom route | Open `/vi/classroom/:courseSlug`; current lesson, rail and same journey row visible. |
| Progress truth | Fixture/test covers loading, empty, refused, partial progress and completed course without invented percentage. |
| Lesson mutation | Save position and mark complete use backend operation names and update the visible lesson/journey state. |
| Certificate guard | No certificate claim when backend has no eligible record. |
| Visual | Preview r1 remains reference for hierarchy only; production render must be checked at learner overview and classroom states. |

### OUTPUTS

| Concept | Result |
|---|---|
| Review verdict | Pattern A+B phù hợp: sidebar navigation-only, journey flex row trên content ở cả overview và classroom. |
| Production boundary | Candidate đã được khóa cho learner route, classroom route, learner chrome, journey/progress/lesson blocks, API modules và messages. |
| Backend truth | Capability đủ cho progress, resume position, mark complete và certificates; exact response mapping vẫn là Apply gate. |
| Scope decision | AI tutor/docs/community defer khỏi slice đầu; certificate chỉ guarded theo backend state. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\nivo-expert-academy\learner-journey.md` | Appended `review`: canon checks, ownership verdicts, boundary candidate, acceptance evidence, warnings và approval gate. |
| `D:\Repositories\nivo-fe` | No production source changed; only inspected current canon target. |
| `D:\Repositories\nivo-backend` | No backend source changed; only inspected existing classroom/certificate capability. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Xác nhận revision để Apply | **Duyệt boundary candidate**: implement overview + classroom + progress/lesson completion + guarded certificate; defer AI tutor/docs/community. Hoặc chỉ rõ mục cần thêm/bớt trước khi Apply. |

### WARNINGS

| Warning | Impact |
|---|---|
| FE target chưa có auth/session learner adapter trong source đã đọc. | Apply phải dùng adapter canon nếu tồn tại; nếu không có, cần dừng ở boundary enabler thay vì dựng auth giả. |
| Backend capability có nhưng exact response fields chưa được port vào FE. | API module phải được khóa bằng schema/operation evidence trước khi page gọi dữ liệu. |
| `AcademyChrome` là document/theme shell, không phải learner navigation shell. | Không mở rộng component này bằng domain state. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Hardcode progress/certificate từ preview | Đọc backend result và render guarded states | Preview values chỉ phục vụ kiểm tra layout. |
| Đặt journey vào sidebar | Flex row trên content | Giữ đúng quyết định hierarchy đã chốt ở luồng AgentOS. |
| Đưa AI tutor/docs/community vào slice đầu | Defer sau khi có owner/contract | Tránh route hứa surface chưa có production contract. |

### OWED

| Owed | Cleared by |
|---|---|
| User approval cho exact production boundary candidate | User xác nhận rồi mới kết thúc Review bằng `Approved revision`. |
| Exact GraphQL response fields và learner auth adapter | Apply discovery gate; nếu thiếu thì route sang backend/FE feature plan tương ứng. |
