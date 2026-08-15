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
| Repo / branch | D:\Repositories\starci-academy-fe / main |
| Purpose | Sửa ngay ownership đã rõ trên course detail và tách phần sáng tạo layout sang Design Plan. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-detail-ownership-and-rail.md |
| Language | vi |
| Phase | start |
| Touching | D:\Repositories\starci-academy-fe\src\components\blocks\courses\CoursePricingRail\component.tsx và workflow record này. |

Session id: fidel-course-detail-ownership-20260815-01
Session status: open
Baseline commit: 22da90047b8dfe2154d0b996209026b768c48063
Tracked diff: 22da90047b8dfe2154d0b996209026b768c48063..worktree

### Binding request and evidence

| Evidence | Result |
|---|---|
| Feedback trực tiếp của user | Vùng rail xanh lá phải có card và sticky như legacy; phần sáng tạo xanh lá/xanh dương cần preview nhiều concept. |
| Legacy `CoursePricingRail` | Wrapper sticky chứa HeroUI `Card`; đây là binding source cho small patch. |
| Source hiện tại | `main-then-rail` đã sở hữu sticky mechanics nhưng `course-pricing-rail` chỉ là `aside`, chưa có surface card. |
| Source hiện tại | Benefits đã đi qua `SurfaceListCard`; không được thay bằng wrapper khác hoặc tạo card tay. |

### Frozen comparison

| Field | Value |
|---|---|
| Route | `http://localhost:3000/vi/courses/fullstack-mastery` |
| Viewport | Desktop course-detail state theo ảnh feedback 2048×819; responsive proof bổ sung ở preview. |
| Locale | vi |
| Theme | light |
| Auth persona | signed-out guest |
| Fixture / seed | Fullstack Mastery với pricing phases, value propositions và 13 enrollment. |
| Owner state | pricing rail ready, phase Sớm active. |
| Reference commit | Legacy `D:\Repositories\starci-academy` @ `9a193423128efa1dc83f23ab0f79fb4ae66db847`; FE baseline `22da90047b8dfe2154d0b996209026b768c48063`. |

### OUTPUTS

| Concept | Result |
|---|---|
| Small patch | Khôi phục pricing rail thành card sticky bằng owner `SurfaceCard`; sticky mechanics hiện có được giữ lại. |
| Creative layout | Chuyển stats, tabs composition và rail treatment mới sang preview Design Plan v4; không đoán một concept vào production. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/fidel/starci-academy/course-detail-ownership-and-rail.md` | added — mở fidelity session trước production write. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | User đã yêu cầu small patch được sửa ngay; boundary chỉ gồm rail block đang clean. |

### WARNINGS

| Warning | Impact |
|---|---|
| `contracts/index.ts` và message files đang có diff từ learn work khác. | Fidelity patch không chạm các file đó; Tabs có behavior/layout chưa chốt được giữ trong Design Plan. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Breadcrumb và rail phẳng của render hiện tại | Tabs đúng concept và pricing card sticky như legacy | User: “đỏ vàng là sai concept” và “xanh lá phải có card và stick như legacy”. |

### OWED

| Owed | Cleared by |
|---|---|
| Apply và prove pricing card sticky | Patch one-file, focused lint/typecheck và browser render. |
| Chốt behavior/composition Tabs cùng stats/rail sáng tạo | User chọn một tab trong `course-detail-page-v4` preview, sau đó Design Review. |

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
| Repo / branch | D:\Repositories\starci-academy-fe / main |
| Purpose | Ghi small patch đã sửa ngay, related sticky-token bug và proof trên trang thật. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-detail-ownership-and-rail.md |
| Language | vi |
| Phase | feedback |
| Touching | D:\Repositories\starci-academy-fe\src\components\blocks\courses\CoursePricingRail\component.tsx, D:\Repositories\starci-academy-fe\src\app\globals.css và workflow record này. |

Session id: fidel-course-detail-ownership-20260815-01
Session status: open
Feedback classification: within-boundary

### Measured feedback

| Difference | Evidence | Correction |
|---|---|---|
| Pricing rail không có card | Trước patch contract `course-pricing-rail` render trực tiếp bằng `Tree`; legacy bọc nội dung trong HeroUI Card. | Đổi owner render sang `SurfaceCard` và giữ contract `aside` bên trong. |
| Sticky chỉ có position nhưng thiếu offset | Browser đo `position: sticky`, `top: auto`; CSS không sinh rule cho `top-rail` vì theme token đặt sai family là `--top-rail`. | Đổi token thành `--spacing-rail`, đúng Tailwind top spacing namespace. |
| Benefits phải là `SurfaceListCard` | Browser tìm thấy `[data-component="SurfaceListCardSurface"]`; source đã dùng branch đúng. | Không sửa hoặc bọc lại vùng benefits. |

### OUTPUTS

| Concept | Result |
|---|---|
| Pricing card sticky | Trang thật hiện có Card 24px radius chứa semantic `aside`, `position: sticky`, `top: 88px`, `max-height: 608px`, `overflow-y: auto`. |
| Small-patch rule | Fidelity sửa production ngay và ghi feedback; sáng tạo nhiều concept vẫn đi qua Design Plan preview. |

### CHANGES

| Tree | Details |
|---|---|
| `src/components/blocks/courses/CoursePricingRail/component.tsx` | modified — dùng `SurfaceCard` thay direct `Tree`; cập nhật ownership comment. |
| `src/app/globals.css` | modified — đổi rail offset token từ `--top-rail` sang `--spacing-rail`. |
| `.workflows/fidel/starci-academy/course-detail-ownership-and-rail.md` | modified — ghi correction và live proof. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Session fidelity vẫn mở để user xem và feedback tiếp. |

### WARNINGS

| Warning | Impact |
|---|---|
| `npx tsc --noEmit` còn 4 lỗi ở flashcards/mock-interview files ngoài scope. | Không chứng minh được full-repo typecheck xanh; focused ESLint, canon gate và diff check đều xanh. |
| `globals.css` cũng chứa icon-centering change từ fidelity session trước. | Không được stage/commit toàn file thiếu kiểm tra theo session boundaries. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Chờ Design Apply mới sửa rail small patch | Sửa ngay trong Fidelity feedback | User làm rõ: fidelity là sửa luôn rồi ghi feedback. |
| Tự chọn một layout mới cho stats/rail | Preview ba case | User làm rõ: khi nói “sáng tạo” thì HTML 3–4 case là đúng. |

### OWED

| Owed | Cleared by |
|---|---|
| User visual acceptance cho small patch | User xem trang thật và xác nhận ưng hoặc gửi feedback tiếp. |
| Tabs/stats/rail creative direction | User chọn A/B/C trong preview; Design Review chốt behavior và exact boundary. |

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
| Repo / branch | D:\Repositories\starci-academy-fe / main |
| Purpose | Sửa live-browser origin từ 127.0.0.1 sang canonical localhost và ghi proof. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-detail-ownership-and-rail.md |
| Language | vi |
| Phase | feedback |
| Touching | Browser runtime và workflow record này; không sửa FE source. |

Session id: fidel-course-detail-ownership-20260815-01
Session status: open
Feedback classification: within-boundary

### Measured feedback

| Difference | Evidence | Correction |
|---|---|---|
| Live app tab dùng `127.0.0.1:3000` dù Keycloak/CORS whitelist canonical `localhost`. | User chỉ ra origin sai; browser trước đó đã chứng minh 127 failed trong khi localhost trả catalog. | Navigate exact route sang `http://localhost:3000/vi/courses`. |
| Catalog sau correction | Browser body có “5 khóa học”, các course names và không có “Không tải được danh sách khóa học”. | Giữ localhost cho mọi live app proof; 127 chỉ có thể dùng cho static preview không gọi app API. |

### OUTPUTS

| Concept | Result |
|---|---|
| Canonical local origin | Live StarCi app chạy bằng `localhost:3000`; hostname không được coi là interchangeable với `127.0.0.1`. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/fidel/starci-academy/course-detail-ownership-and-rail.md` | modified — append origin correction và live catalog proof. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Browser correction an toàn và đúng runtime allow-list đã biết. |

### WARNINGS

| Warning | Impact |
|---|---|
| Static preview server vẫn có thể dùng `127.0.0.1` nếu không gọi API/auth. | Không được lấy preview origin làm app live-proof origin. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| `http://127.0.0.1:3000` cho live app | `http://localhost:3000` | User: origin 127 gây CORS; runtime proof xác nhận localhost tải 5 courses. |

### OWED

| Owed | Cleared by |
|---|---|
| None | None |

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
| Repo / branch | D:\Repositories\starci-academy-fe / main @ 22da90047b8dfe2154d0b996209026b768c48063 |
| Purpose | Cố định live FE dev/start ở canonical origin `http://localhost:3000` thay vì chỉ sửa tab browser tạm thời. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-detail-ownership-and-rail.md |
| Language | vi |
| Phase | feedback |
| Touching | D:\Repositories\starci-academy-fe\package.json, D:\Repositories\starci-academy-fe\HANDOFF.md và workflow record này. |

Session id: fidel-course-detail-ownership-20260815-01
Session status: open
Feedback classification: within-boundary

### Measured feedback

| Difference | Evidence | Correction |
|---|---|---|
| Live tab đã đổi sang `localhost`, nhưng `npm run dev` và `npm run start` chưa khóa hostname/port. | `package.json` hiện dùng `next dev` và `next start`; HANDOFF và Keycloak allow-list xác định canonical app origin là `http://localhost:3000`. | Khóa cả hai scripts bằng `--hostname localhost --port 3000`, đồng thời ghi rõ invariant trong HANDOFF. |

### OUTPUTS

| Concept | Result |
|---|---|
| Permanent canonical origin | Mọi lần chạy FE qua scripts chuẩn phải bind `localhost:3000`; `127.0.0.1:3000` không còn là startup path được hỗ trợ. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/fidel/starci-academy/course-detail-ownership-and-rail.md` | modified — ghi boundary và binding evidence trước production write. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | User đã yêu cầu rõ “phải chạy localhost” và “update permanent”. |

### WARNINGS

| Warning | Impact |
|---|---|
| FE worktree có nhiều thay đổi không liên quan. | Patch chỉ chạm hai file runtime documentation/config hiện đang clean; không stage hoặc commit thay đổi khác. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Chỉ nhớ và sửa URL browser theo từng phiên | Khóa hostname/port trong scripts chuẩn của repository | User yêu cầu cập nhật vĩnh viễn. |

### OWED

| Owed | Cleared by |
|---|---|
| Apply và prove scripts đã khóa canonical origin | Parse `package.json`, chạy focused assertion và kiểm tra live URL. |

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
| Repo / branch | D:\Repositories\starci-academy-fe / main @ 22da90047b8dfe2154d0b996209026b768c48063 |
| Purpose | Ghi focused proof cho permanent localhost startup correction. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-detail-ownership-and-rail.md |
| Language | vi |
| Phase | feedback |
| Touching | Workflow record này; production correction đã nằm trong `package.json` và `HANDOFF.md`. |

Session id: fidel-course-detail-ownership-20260815-01
Session status: open
Feedback classification: within-boundary

### Proof

| Check | Result |
|---|---|
| Package scripts assertion | PASS — `dev` và `start` đều đúng `--hostname localhost --port 3000`. |
| Live route | PASS — `http://localhost:3000/vi/courses/1ab239c8-ebb5-53ee-b255-dc7839a6b959` trả HTTP 200. |
| Diff hygiene | PASS — `git diff --check -- package.json HANDOFF.md`; chỉ có Git line-ending warnings, không có whitespace error. |

### OUTPUTS

| Concept | Result |
|---|---|
| Permanent localhost startup | Canonical origin đã được khóa trong scripts chuẩn và chứng minh bằng live HTTP 200. |

### CHANGES

| Tree | Details |
|---|---|
| `package.json` | modified — khóa `dev` và `start` vào `localhost:3000`. |
| `HANDOFF.md` | modified — ghi explicit hostname invariant và failure modes của `127.0.0.1`. |
| `.workflows/fidel/starci-academy/course-detail-ownership-and-rail.md` | modified — append focused proof. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | None |

### WARNINGS

| Warning | Impact |
|---|---|
| Git báo LF sẽ chuyển thành CRLF khi chạm lại hai file. | Không phải diff-check failure và không đổi nội dung correction. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| `127.0.0.1:3000` live origin | `localhost:3000` được khóa trong repository scripts | CORS/auth/cookie origin phải khớp exact canonical hostname. |

### OWED

| Owed | Cleared by |
|---|---|
| User acceptance | User xác nhận correction này ổn; session vẫn mở và không tự stage/commit/finalize. |

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
| Purpose | Sửa seam Course Detail tabs cho liền với navbar như Dashboard và khôi phục breadcrumb legacy ở cột nội dung trái. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-detail-ownership-and-rail.md |
| Language | vi |
| Phase | feedback |
| Touching | D:\Repositories\starci-academy-fe\src\components\contracts\index.ts; D:\Repositories\starci-academy-fe\src\components\pages\CourseDetailPage\component.tsx; D:\Repositories\starci-academy-fe\src\components\pages\CourseDetailPage\index.tsx; D:\Repositories\starci-academy-fe\src\components\pages\CourseDetailPage\component.test.tsx; D:\Repositories\starci-academy-fe\src\messages\en.json; D:\Repositories\starci-academy-fe\src\messages\vi.json; workflow record này. |

Session id: fidel-course-detail-ownership-20260815-01
Session status: open
Feedback classification: within-boundary

### Binding evidence

| Difference | Evidence | Correction |
|---|---|---|
| Dashboard có navbar hai tầng liền nhau; Course Detail có khoảng trống 24px trước tabs. | Browser trước sửa: Dashboard `double-navbar` cao 97.6px và có 4 tabs; Course Detail navbar cao 64.8px, page tabs bắt đầu ở 88.8px. | Bỏ `pt-6` khỏi page root và để section navigation bắt đầu ngay sau primary navbar. Anchor behavior vẫn thuộc Course Detail page. |
| Course Detail không có breadcrumb. | Browser đếm `Breadcrumbs = 0`; legacy `CourseHero` dùng `LearnBreadcrumb` với `Home → Courses → course`. | Khôi phục leaf `Breadcrumbs` trước course heading, với `Trang chủ → Khóa học → tên khóa học`. |
| Contract cũ nói tabs không được “masquerade” thành breadcrumb và từ đó loại bỏ breadcrumb. | User chỉ rõ hai điều hướng có vai trò khác nhau. | Sửa contract `why`: tabs điều hướng section; breadcrumb giữ route ancestry. |

### OUTPUTS

| Concept | Result |
|---|---|
| Navbar seam | Course Detail section tabs phải chạm ngay tầng dưới primary navbar như Dashboard thay vì trôi trong body. |
| Breadcrumb ownership | Cột narrative bên trái khôi phục trail route thật; tabs không thay breadcrumb. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/fidel/starci-academy/course-detail-ownership-and-rail.md` | modified — ghi feedback, baseline đo được và exact production boundary trước khi viết. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | User đã đưa reference Dashboard và yêu cầu khôi phục breadcrumb trực tiếp. |

### WARNINGS

| Warning | Impact |
|---|---|
| Các path Course Detail/contracts/messages đang chứa FAQ r2 chưa commit. | Patch phải giữ nguyên FAQ và chỉ thêm navbar seam + breadcrumb hunks. |
| Không chuyển course tabs vào `ShellNav` trong small patch này. | Tránh tạo state/URL bridge giữa persistent layout và page; kết quả thị giác vẫn dùng cùng seam hai tầng, còn anchor state giữ đúng owner hiện tại. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Tabs page có khoảng cách như một block nội dung | Tabs liền dưới primary navbar | User: “tại sao cái navbar top bên phải không render kiểu như bên trái”. |
| Tabs thay thế breadcrumb | Tabs và breadcrumb cùng tồn tại, mỗi loại đúng vai trò | User hỏi trực tiếp vì sao bên trái không có breadcrumbs. Trò nhận sai vì đã loại nó khỏi concept. |

### OWED

| Owed | Cleared by |
|---|---|
| Apply small patch và focused proof | Source patch, test/type/lint, browser đo lại Dashboard/Course Detail. |
| User visual acceptance | User xem localhost sau correction và xác nhận hoặc feedback tiếp. |

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
| Repo / branch | D:\Repositories\starci-academy-fe / main; patch began at 1bc591b73b0ad0fce8114d9d7f1c19e52bca6e9b, concurrent HEAD moved to 6d07fcee8e56a095666930e6d8f3adc6b3a64f15 |
| Purpose | Gộp course evidence thành một ribbon sáu ô theo Weekly Goals, khôi phục pricing-card inset và trả lại trial/cart actions. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-detail-ownership-and-rail.md |
| Language | vi |
| Phase | feedback |
| Touching | D:\Repositories\starci-academy-fe\src\components\contracts\index.ts; D:\Repositories\starci-academy-fe\src\components\pages\CourseDetailPage\component.tsx; D:\Repositories\starci-academy-fe\src\components\pages\CourseDetailPage\index.tsx; D:\Repositories\starci-academy-fe\src\components\pages\CourseDetailPage\component.test.tsx; D:\Repositories\starci-academy-fe\src\components\blocks\courses\CoursePricingRail\component.tsx; D:\Repositories\starci-academy-fe\src\components\blocks\courses\CoursePricingRail\component.test.tsx; workflow record này. |

Session id: fidel-course-detail-ownership-20260815-01
Session status: open
Feedback classification: within-boundary

### Binding comparison

| Item | Before | Binding replacement |
|---|---|---|
| Course evidence | Năm independent `SurfaceCard` signal tiles; rating đứng riêng ở heading. | Một ordinary `SurfaceCard` chứa ribbon 2 cột × 3 hàng, sáu ruled cells như `weekly-goals-card`; rating là cell thứ sáu. |
| Rail inset | `SurfaceCard` zero vendor inset nhưng `course-pricing-rail` không bù content inset. | Contract owner mang `p-4`; live computed padding phải là 16px. |
| Commerce ways in | Component API chỉ có một `act`; guest bị đẩy thẳng vào `/learn`. | Primary enrol/continue, secondary trial và add-to-cart; enrol thêm cart rồi mở cart, trial mở learning preview, add-to-cart ở lại trang và khóa sau success. |

### Frozen live proof

| State | Value |
|---|---|
| Origin | `http://localhost:3000` — không dùng `127.0.0.1` |
| Route | `/vi/courses/1ab239c8-ebb5-53ee-b255-dc7839a6b959` |
| Locale / theme | `vi` / light |
| Course | System Design Mastery, public non-enrolled view |
| Ribbon | `cells = 6`; closest `[data-component=SurfaceCardSurface] = true` |
| Rail | computed `padding = 16px` |
| Actions | `Đăng ký học`; `Học thử`; `Thêm vào giỏ hàng` |

### Proof commands

| Gate | Result |
|---|---|
| Focused Vitest — Course Detail + Course Pricing Rail | PASS — 2 files, 7 tests |
| `npm run typecheck` | PASS |
| Focused ESLint on six touched FE paths | PASS |
| `npm run lint` | FAIL outside boundary — 104 existing errors under `.artifacts/design-plan/**`, `plugins/eslint-canon/**` and stale candidate trees; no touched production path reported |
| `git diff --check` on touched production paths | PASS; line-ending warnings only |
| Fresh localhost DOM + screenshot | PASS — one six-cell card, 16px rail inset and three visible actions |

### OUTPUTS

| Concept | Result |
|---|---|
| Evidence ribbon | Một card chuẩn chứa sáu cell có shared seams; không còn card con/radius con. |
| Rating ownership | Rating đứng cùng năm course facts trong ribbon; review summary vẫn giữ verdict riêng của section đánh giá. |
| Pricing rail | Khôi phục ordinary card inset 16px quanh toàn bộ buy-box content. |
| Commerce behavior | Guest có đủ enrol, trial và cart paths; enrolled viewer tiếp tục học và không nhận action mua thừa. |

### CHANGES

| Tree | Details |
|---|---|
| `src/components/contracts/index.ts` | modified — six-cell ruled ribbon, bỏ child-card radius/padding, thêm rail `p-4` và action contracts. |
| `src/components/pages/CourseDetailPage/component.tsx` | modified — một shared SurfaceCard cho ribbon, bỏ heading rating duplicate và nối ba rail actions. |
| `src/components/pages/CourseDetailPage/index.tsx` | modified — tạo rating cell, resolve trial/cart labels và nối add/cart/trial navigation behavior. |
| `src/components/pages/CourseDetailPage/component.test.tsx` | modified — prove one SurfaceCard and six resting/ready cells. |
| `src/components/blocks/courses/CoursePricingRail/component.tsx` | modified — mở typed API cho trial/cart, render primary full line và secondary action row. |
| `src/components/blocks/courses/CoursePricingRail/component.test.tsx` | modified — prove all three actions and rail padding owner. |
| `.workflows/fidel/starci-academy/course-detail-ownership-and-rail.md` | modified — append feedback, correction and proof. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Binding reference và existing owners đủ để áp dụng small patch ngay. |

### WARNINGS

| Warning | Impact |
|---|---|
| Trong lúc proof, FE HEAD chuyển ngoài phiên từ `1bc591b` sang `6d07fce` (`chore: capture pre chatbot baseline`) và thu một phần touched files vào commit. | Không reset/rewrite commit; trạng thái cuối đã được proof ở current HEAD + worktree, nhưng attribution theo raw `git diff HEAD` không còn bao phủ toàn bộ correction. |
| Full lint còn 104 lỗi ở artifact/candidate/canon mirror ngoài production boundary. | Focused lint của sáu touched paths sạch; không nhận clean cho full-repo lint. |
| Không click cart trên live account. | Tránh thay đổi dữ liệu giỏ của user; focused component tests và typed connected mutation path prove wiring, còn live mutation success chưa được thực hiện. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Năm signal cards rời và rating đứng riêng | Một card chia sáu cell như “Mục tiêu tuần” | User: “xanh render kiểu ribbon… 1 card và chia làm 6”. |
| Buy box sát mép | Ordinary `p-4` content inset | User: “đỏ bị mất padding”. |
| Một CTA làm mất trial/cart | Primary enrol/continue cộng secondary trial và add-to-cart | User: “tính năng học thử và add to card đâu?”. |

### OWED

| Owed | Cleared by |
|---|---|
| User visual acceptance | User xem fresh localhost render và xác nhận hoặc feedback tiếp. |
| Live cart mutation proof | Chỉ chạy khi user cho phép thay đổi cart của account đang đăng nhập; không cần cho visual acceptance. |
| Fidelity End | Chỉ chạy khi user yêu cầu end/chốt proof và related-bug scan; Finality mới đóng session. |

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
| Purpose | Chứng minh hai compact grouped-card grids đã dùng đúng `gap-2` trên canonical localhost. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-detail-ownership-and-rail.md |
| Language | vi |
| Phase | feedback |
| Touching | D:\Repositories\starci-academy-fe\src\components\contracts\index.ts; workflow record này. |

Session id: fidel-course-detail-ownership-20260815-01
Session status: open
Feedback classification: within-boundary

### Evidence conflicts

| Claim | Incumbent source | Competing source | Authority | Verdict | Stale-source action |
|---|---|---|---|---|---|
| Hai grids dùng `gap-4` vì card peers lặp qua responsive grid | Existing contract và GAP-9 | User xác nhận hai vùng là compact grouped-card clusters; token rung compact là `gap-2` | Explicit current product instruction cho đúng hai owners | replace-incumbent | Contracts đã sửa; wording cạnh tranh được ghi vào Upgrade Plan ở mức WATCHED. |

### Proof

| Check | Result |
|---|---|
| Catalog computed seam | PASS — fresh `http://localhost:3000/vi/courses`: `catalog-card-grid` có `columnGap = 8px`, `rowGap = 8px`, 5 card children. |
| Detail computed seam | PASS — fresh `http://localhost:3000/vi/courses/1ab239c8-ebb5-53ee-b255-dc7839a6b959`: `course-signal-board` có `columnGap = 8px`, `rowGap = 8px`, 5 signal children. |
| Fresh Console | PASS — cả hai localhost tabs có zero error logs trong proof window. |
| Focused ESLint | PASS — `npx eslint src/components/contracts/index.ts`; chỉ warning cấu hình React version. |
| Diff hygiene | PASS — `git diff --check -- src/components/contracts/index.ts`; không có whitespace error, chỉ line-ending notice của working copy. |

### OUTPUTS

| Concept | Result |
|---|---|
| Catalog card cluster | Card-to-card seam là 8px ở grid render thật. |
| Course signal cluster | Signal-to-signal seam là 8px ở grid render thật. |

### CHANGES

| Tree | Details |
|---|---|
| `src/components/contracts/index.ts` | modified — `catalog-card-grid` và `course-signal-board` đổi `gap-4` thành `gap-2`; `why` ghi rõ compact grouped-card relationship. |
| `.workflows/fidel/starci-academy/course-detail-ownership-and-rail.md` | modified — ghi correction, computed-style proof và trust conflict routing. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Exact product correction đã có live proof; session vẫn mở để nhận feedback tiếp. |

### WARNINGS

| Warning | Impact |
|---|---|
| Canon vẫn có hai mô tả có thể cạnh tranh ở trường hợp card grid. | Không mở rộng `gap-2` sang grid khác; mỗi owner phải được phân loại theo relationship cho đến khi có đủ witness nâng rule. |
| FE worktree còn nhiều thay đổi song song của user. | Không stage/commit và không claim ngoài đúng hai contract hunks. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Đọc vùng xanh như khoảng cách heading-to-content | Đo trực tiếp card-to-card seam | User đang khoanh hai grid owners, không khoanh section seam. |
| Tin `gap-4` hiện tại chỉ vì contract đã ghi vậy | Dùng explicit relationship rồi cập nhật cả class và `why` | Contract là belief có thể stale khi binding feedback chứng minh ngược lại. |

### OWED

| Owed | Cleared by |
|---|---|
| User visual acceptance | User xem hai localhost tabs và xác nhận hoặc feedback tiếp. |
| Fidelity End | Chỉ chạy khi user yêu cầu end-pass; Finality mới đóng session. |

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
| Purpose | Ghi correction và focused/live proof cho divider và Course Detail tab icons. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-detail-ownership-and-rail.md |
| Language | vi |
| Phase | feedback |
| Touching | Workflow record này; production correction nằm trong three-path boundary của feedback ngay trước. |

Session id: fidel-course-detail-ownership-20260815-01
Session status: open
Feedback classification: within-boundary

### Proof

| Check | Result |
|---|---|
| Divider seam | PASS — fresh localhost tab đo Course tab layer từ y=64, phủ navbar stroke kết thúc ở y=65; chỉ còn `border-bottom` dưới tabs. |
| Four tab icons | PASS — bốn `[role=tab]` lần lượt có `svgCount = 1`; trước correction cả bốn bằng 0. |
| Visual capture | PASS — primary navbar và tab layer đọc như một two-row navbar; icon hiển thị trước cả bốn label. |
| Fresh Console | PASS — zero error logs trên tab mới mở sau correction. |
| Focused tests | PASS — Course Detail 1 file, 5 tests. |
| Focused ESLint | PASS — component, test và contracts; chỉ warning cấu hình React version. |
| New TypeScript rows | PASS — không có error tại seam classes hoặc bốn icon rows. |
| Full TypeScript | BLOCKED BY EXISTING WORKTREE — contract-generated typing hiện báo nhiều lỗi rộng ở Profile/Auth/Learn và các FAQ hunks đã có trước feedback này; không suppress và không claim full gate green. |
| Diff hygiene | PASS — `git diff --check` sạch cho ba touched paths. |

### OUTPUTS

| Concept | Result |
|---|---|
| Clean two-row seam | Divider giữa primary navbar và Course tabs đã biến mất; baseline dưới tabs được giữ. |
| Navigation identity | `Khám phá`, `Nội dung`, `Kết quả học viên`, `FAQ` đều có leading icon qua closed vocabulary. |

### CHANGES

| Tree | Details |
|---|---|
| `src/components/contracts/index.ts` | modified — cho phép exact one-pixel overlap classes và cập nhật `course-section-navigation` để che divider trên, giữ divider dưới. |
| `src/components/pages/CourseDetailPage/component.tsx` | modified — truyền `explore`, `course`, `review`, `disclosure` cho bốn tabs. |
| `src/components/pages/CourseDetailPage/component.test.tsx` | modified — assert mỗi tab render một SVG icon. |
| `.workflows/fidel/starci-academy/course-detail-ownership-and-rail.md` | modified — ghi correction và proof. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Correction đã được áp dụng và prove trên localhost; session giữ mở cho feedback tiếp. |

### WARNINGS

| Warning | Impact |
|---|---|
| Full `tsc` đang đỏ bởi contract typing rộng trong dirty worktree, không phát sinh ở ba dòng correction mới. | Fidelity không được claim full TypeScript green; End phải phân loại hoặc sửa riêng nếu lỗi vẫn còn trong bounded related-bug scan. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Giữ kết luận seam cũ đã đạt | One-pixel measured overlap và fresh visual proof | User vẫn nhìn thấy divider thật; correction trước chưa đủ fidelity. |
| Mở glyph vendor hoặc thêm icon ad-hoc | Dùng `IconName` đóng sẵn qua `ChoiceTabs` | Giữ đúng canon Heroicons và vai trò leading navigation. |

### OWED

| Owed | Cleared by |
|---|---|
| User visual acceptance | User xem localhost đang mở và xác nhận hoặc feedback tiếp. |
| Full TypeScript classification | Fidelity End related-bug scan hoặc capability owner xử lý contract typing rộng. |

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
| Purpose | Giữ Course Detail tab layer sticky dưới primary navbar khi cuộn như Dashboard. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-detail-ownership-and-rail.md |
| Language | vi |
| Phase | feedback |
| Touching | D:\Repositories\starci-academy-fe\src\components\contracts\index.ts; workflow record này. |

Session id: fidel-course-detail-ownership-20260815-01
Session status: open
Feedback classification: within-boundary

### Measured feedback

| Difference | Evidence | Correction |
|---|---|---|
| Course tabs cuộn khỏi viewport thay vì stick như Dashboard. | Live localhost tại `scrollY=700`: course nav `position=relative`, top = `-636.2px`. | Đổi layer sang `sticky top-16 z-50`, giữ overlap 1px và background để tabs nằm ngay dưới primary navbar sticky `top-0`. |

### OUTPUTS

| Concept | Result |
|---|---|
| Sticky course navigation | Primary navbar và Course tabs phải giữ thành two-tier chrome trong toàn bộ scroll. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/fidel/starci-academy/course-detail-ownership-and-rail.md` | modified — ghi feedback và scroll measurement trước correction. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Dashboard là binding reference đã được user chỉ định. |

### WARNINGS

| Warning | Impact |
|---|---|
| Full TypeScript gate đang có lỗi rộng ngoài hunk này. | Proof tập trung vào contract class, browser scroll, lint và diff hygiene. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Chỉ sửa divider ở trạng thái top-of-page | Prove cả sticky scroll state | User hỏi trực tiếp behavior khi scroll; proof trước đã bỏ sót state này. |

### OWED

| Owed | Cleared by |
|---|---|
| Sticky correction và live scroll proof | Contract patch, focused lint và fresh browser measurement. |
| User visual acceptance | User scroll localhost và xác nhận hoặc feedback tiếp. |

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
| Purpose | Ghi live scroll proof sau sticky correction. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-detail-ownership-and-rail.md |
| Language | vi |
| Phase | feedback |
| Touching | Workflow record này; production correction nằm trong contract hunk của feedback ngay trước. |

Session id: fidel-course-detail-ownership-20260815-01
Session status: open
Feedback classification: within-boundary

### Proof

| Check | Result |
|---|---|
| Sticky at scroll | PASS — fresh localhost tab tại `scrollY=700`: Course nav `position=sticky`, top `64px`. |
| Two-tier seam | PASS — primary navbar bottom `64.8px`; Course tabs top `64px`, giữ overlap che divider và không tạo gap. |
| Icons while sticky | PASS — icon counts `[1,1,1,1]` sau scroll. |
| Fresh Console | PASS — zero error logs. |
| Focused ESLint | PASS — contracts path; chỉ warning cấu hình React version. |
| Diff hygiene | PASS — touched contract path sạch. |

### OUTPUTS

| Concept | Result |
|---|---|
| Dashboard-like sticky chrome | Course tabs giữ ngay dưới primary navbar trong lúc cuộn, không mất divider/icon correction trước. |

### CHANGES

| Tree | Details |
|---|---|
| `src/components/contracts/index.ts` | modified — `course-section-navigation` dùng `sticky top-16` và contract `why` ghi scroll ownership. |
| `.workflows/fidel/starci-academy/course-detail-ownership-and-rail.md` | modified — ghi correction và live scroll proof. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Behavior đã được prove trên localhost; session giữ mở. |

### WARNINGS

| Warning | Impact |
|---|---|
| Full TypeScript warning từ dirty worktree vẫn còn như feedback trước. | Không ảnh hưởng focused sticky/browser proof nhưng vẫn phải được phân loại tại End. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| `position=relative` khiến tabs biến mất khi scroll | `sticky top-16` dưới primary navbar | Dashboard reference giữ toàn bộ tab chrome nhìn thấy khi cuộn. |

### OWED

| Owed | Cleared by |
|---|---|
| User visual acceptance | User scroll tab localhost đang mở và xác nhận hoặc feedback tiếp. |
| Fidelity End | User yêu cầu chốt pass và scan related bugs. |

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
| Purpose | Trả page-level joined-list ownership về SurfaceListCard theo BRANCH-9. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-detail-ownership-and-rail.md |
| Language | vi |
| Phase | feedback |
| Touching | D:\Repositories\starci-academy-fe\src\components\contracts\index.ts; D:\Repositories\starci-academy-fe\src\components\pages\CourseDetailPage\component.tsx; D:\Repositories\starci-academy-fe\src\components\pages\CourseDetailPage\component.test.tsx; workflow record này. |

Session id: fidel-course-detail-ownership-20260815-01
Session status: open
Feedback classification: within-boundary

### Binding rule

| Difference | Evidence | Correction |
|---|---|---|
| `course-section` dựng heading ngoài rồi bốn page-level `SurfaceListCard` đặt `isLabelHidden=true`. | BRANCH-9: SurfaceListCard owns label + joined surface + caption; page-level list label không được ẩn. | Project trực tiếp bốn list contracts vào `course-hero`; bỏ wrapper heading và `isLabelHidden`. |
| Review body không phải SurfaceListCard. | `_CourseReviewBlock` owns rating summary and reviews state, không phải joined-list surface branch. | Giữ duy nhất review trong `course-section` với H2 owner riêng. |

### OUTPUTS

| Concept | Result |
|---|---|
| List-surface ownership | Green boundary trở thành một component thật: SurfaceListCard label + card, không phải heading giả cộng hidden-label card. |
| Review ownership | Review giữ section wrapper riêng vì khác component family. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/fidel/starci-academy/course-detail-ownership-and-rail.md` | modified — ghi canon evidence và exact boundary trước correction. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | User yêu cầu áp dụng correction đã được BRANCH-9 chốt. |

### WARNINGS

| Warning | Impact |
|---|---|
| SurfaceListCard dùng fixed heading level 3 theo branch implementation. | Đây là behavior canon hiện tại; không dựng H2 ngoài để lách owner. Nếu hierarchy cần đổi, phải nâng SurfaceListCard contract riêng. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| External heading + hidden page-list label | SurfaceListCard visible label | BRANCH-9 cấm page-level list ẩn label và xác định branch là owner của label. |
| Ép review vào SurfaceListCard | Giữ course-section review | Review block không có joined-list surface contract. |

### OWED

| Owed | Cleared by |
|---|---|
| Production correction và owner proof | Source patch, focused test/lint và live DOM ownership check. |
| User visual acceptance | User xem localhost và feedback tiếp. |

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
| Purpose | Reuse exact “điểm nổi bật” render từ CourseCatalogCard cho Course Detail promises. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-detail-ownership-and-rail.md |
| Language | vi |
| Phase | feedback |
| Touching | D:\Repositories\starci-academy-fe\src\components\blocks\courses\CourseValuePropositionList\component.tsx; D:\Repositories\starci-academy-fe\src\components\blocks\courses\CourseCatalogCard\component.tsx; D:\Repositories\starci-academy-fe\src\components\contracts\index.ts; D:\Repositories\starci-academy-fe\src\components\pages\CourseDetailPage\component.tsx; D:\Repositories\starci-academy-fe\src\components\pages\CourseDetailPage\component.test.tsx; workflow record này. |

Session id: fidel-course-detail-ownership-20260815-01
Session status: open
Feedback classification: within-boundary

### Binding reference

| Difference | Evidence | Correction |
|---|---|---|
| Course Detail promises dùng private `course-promise-list` + text icon row; catalog “điểm nổi bật” dùng `marked-row-list` + `TaskProgressRow`. | User named live `/vi/courses` render as exact reference; catalog source explicitly says one tick, one owner. | Extract one shared `CourseValuePropositionList` content owner; cả catalog và detail dùng cùng contract/render component. |
| Catalog list nằm trong raised course card. | Existing catalog passes `isNested:true`. | Giữ `isNested` chỉ ở catalog; detail dùng page surface treatment nhưng row anatomy/contract/render giống hệt. |

### OUTPUTS

| Concept | Result |
|---|---|
| Exact promise-list reuse | Course Detail và catalog share one marked-row-list + TaskProgressRow owner, không còn hai checklist chỉ giống nhau bằng mắt. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/fidel/starci-academy/course-detail-ownership-and-rail.md` | modified — ghi stronger live reference và expanded exact boundary. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | User yêu cầu exact reuse từ named live render. |

### WARNINGS

| Warning | Impact |
|---|---|
| Shared extraction thêm một block path và sửa catalog call site. | Chỉ di chuyển existing render owner; catalog props/state và visual treatment không đổi. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Chỉ sửa label ownership nhưng giữ detail checklist riêng | Shared `marked-row-list` + `TaskProgressRow` | User yêu cầu render y chang catalog; same-looking private implementation không phải reuse parity. |

### OWED

| Owed | Cleared by |
|---|---|
| Shared extraction và twin render proof | Catalog/detail tests, lint, source search và live localhost comparison. |
| User visual acceptance | User xem corrected Course Detail. |

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
| Purpose | Ghi shared-owner correction và twin live proof cho catalog/detail promise list. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-detail-ownership-and-rail.md |
| Language | vi |
| Phase | feedback |
| Touching | Workflow record này; production paths nằm trong expanded boundary của feedback ngay trước. |

Session id: fidel-course-detail-ownership-20260815-01
Session status: open
Feedback classification: within-boundary

### Proof

| Check | Result |
|---|---|
| Shared source owner | PASS — catalog và detail cùng import `CourseValuePropositionList`; private `ValuePropositionsView` và detail `CoursePromiseListView` đã bị loại. |
| Shared contract | PASS — cả hai live DOM dùng `data-node=marked-row-list`. |
| Surface ownership | PASS — cả hai heading nằm trong ancestor `data-component=SurfaceListCard`, cùng H3 theo branch implementation. |
| Row parity | PASS — System Design catalog và detail đều render 3 rows từ cùng TaskProgressRow owner. |
| Context variant | PASS — catalog giữ `isNested=true`; detail page surface không giả nested treatment. |
| Focused tests | PASS — Course Detail 1 file, 5 tests. |
| Focused ESLint | PASS — shared block, catalog, prerequisite, detail, tests và contracts; chỉ warning cấu hình React version. |
| Touched TypeScript filter | PASS — không có TypeScript error được báo trên shared/catalog/detail/contracts/prerequisite paths. |
| Twin fresh Console | PASS — catalog và detail đều zero error logs. |
| Diff hygiene | PASS — touched production paths sạch. |

### OUTPUTS

| Concept | Result |
|---|---|
| Exact “điểm nổi bật” reuse | Course Detail promises và catalog highlights dùng chung một SurfaceListCard content owner, marked-row-list và TaskProgressRow anatomy. |
| Page-level list ownership | Promise, prerequisite, curriculum và FAQ labels do SurfaceListCard vẽ; review giữ section owner riêng. |

### CHANGES

| Tree | Details |
|---|---|
| `src/components/blocks/courses/CourseValuePropositionList/component.tsx` | added — shared marked-row-list + TaskProgressRow content owner. |
| `src/components/blocks/courses/CourseCatalogCard/component.tsx` | modified — reuse shared promise-list owner, bỏ private duplicate. |
| `src/components/blocks/courses/CoursePrerequisiteList/component.tsx` | modified — cập nhật stale ownership comment sau khi promise contract cũ bị bỏ. |
| `src/components/contracts/index.ts` | modified — Course hero nhận direct list projections; course-section chỉ nhận review; bỏ duplicate course-promise contracts. |
| `src/components/pages/CourseDetailPage/component.tsx` | modified — direct SurfaceListCard ownership và reuse shared promise-list owner. |
| `src/components/pages/CourseDetailPage/component.test.tsx` | modified — prove visible label nằm trong SurfaceListCard và promise body dùng marked-row-list. |
| `.workflows/fidel/starci-academy/course-detail-ownership-and-rail.md` | modified — ghi feedback, correction và proof. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Correction đã được áp dụng theo named live reference; session giữ mở cho feedback tiếp. |

### WARNINGS

| Warning | Impact |
|---|---|
| Full-worktree TypeScript warning từ concurrent dirty changes vẫn chưa được claim green. | Focused touched-path filter sạch; End vẫn phải phân loại full gate. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Detail-specific ticked checklist | Shared catalog/detail CourseValuePropositionList | User yêu cầu render y chang “điểm nổi bật”; same-looking duplicate không phải reuse. |
| Ép page surface dùng nested outline | Giữ branch context variant | `isNested` chỉ đúng khi list nằm trong raised catalog card; row/label owner vẫn giống hệt. |

### OWED

| Owed | Cleared by |
|---|---|
| User visual acceptance | User xem localhost detail đang mở và xác nhận hoặc feedback tiếp. |
| Fidelity End | User yêu cầu chốt pass và related-bug scan. |

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
| Purpose | Sửa compact card-grid seams từ gap-4 về gap-2 theo user-confirmed relationship. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-detail-ownership-and-rail.md |
| Language | vi |
| Phase | feedback |
| Touching | D:\Repositories\starci-academy-fe\src\components\contracts\index.ts; workflow record này. |

Session id: fidel-course-detail-ownership-20260815-01
Session status: open
Feedback classification: within-boundary

### Evidence conflict

| Claim | Incumbent source | Competing source | Authority | Verdict | Stale-source action |
|---|---|---|---|---|---|
| Catalog và signal grids dùng gap-4 | Existing contracts; GAP-9 mô tả peer cards across grid ở group rung | User-confirmed screenshots và `tokens.md` grouped-card example chỉ định hai grid này là compact grouped cards gap-2 | Current explicit product instruction for exact relationship | replace-incumbent | Patch two contracts; route canon wording conflict to Upgrade Plan WATCHED/proposal by witness count. |

### Measured difference

| Owner | Before | Expected |
|---|---|---|
| `catalog-card-grid` | `gap-4` = 16px | `gap-2` = 8px |
| `course-signal-board` | `gap-4` = 16px | `gap-2` = 8px |

### OUTPUTS

| Concept | Result |
|---|---|
| Compact grouped-card seam | Cả catalog cards và course signal cards dùng 8px gap-2. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/fidel/starci-academy/course-detail-ownership-and-rail.md` | modified — ghi boundary correction, rule conflict và expected measurement. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | User đã chỉ đúng hai owner và exact `gap-2`. |

### WARNINGS

| Warning | Impact |
|---|---|
| Gap canon có wording cạnh tranh giữa grouped cards gap-2 và peer cards in grid gap-4. | Product patch rõ theo explicit instruction; trust wording cần Upgrade lifecycle, không sửa trong Fidelity. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Đọc vùng xanh như heading-to-content seam | Đo card-to-card seams trong hai grid | User: “2 cái này phải gap-2”; lỗi trước là đọc sai component boundary. |
| Giữ `gap-4` vì contract hiện tại | `gap-2` cho hai compact grouped-card grids | User xác nhận relationship cụ thể và chỉ ra correction lặp lại. |

### OWED

| Owed | Cleared by |
|---|---|
| Product patch và twin computed-gap proof | Contract edit, lint/diff và localhost measurement. |
| Trust contradiction audit | `starci-fe-upgrade-plan` đọc REJECTED window và ghi WATCHED/proposal theo witness count. |
| User visual acceptance | User xem hai routes sau correction. |

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
| Purpose | Sửa hydration mismatch làm cụm navbar tools bên phải không có server/client render ổn định. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-detail-ownership-and-rail.md |
| Language | vi |
| Phase | feedback |
| Touching | D:\Repositories\starci-academy-fe\src\components\layouts\ShellNav\index.tsx và workflow record này. |

Session id: fidel-course-detail-ownership-20260815-01
Session status: open
Feedback classification: within-boundary

### Measured feedback

| Difference | Evidence | Correction |
|---|---|---|
| Navbar tools có thể đổi từ guest owner trên server sang bell/account owner trên client trong hydration. | Live Console báo React hydration mismatch; ID của Course tabs bị lệch theo cây control đứng trước nó. `ShellNav` truyền `isSignedIn: sessionToken !== undefined` trong khi token có thể cập nhật trước khi hydration ổn định. | Giữ `isSignedIn=false` cho server và first client render bằng `isMounted && sessionToken !== undefined`; sau mount mới vẽ signed-in tools. |

### OUTPUTS

| Concept | Result |
|---|---|
| Stable navbar tools | Navbar phải hydrate cùng guest shape rồi mới chuyển sang signed-in notification/account shape sau mount. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/fidel/starci-academy/course-detail-ownership-and-rail.md` | modified — mở rộng exact boundary theo lỗi Console vừa đo được. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Đây là owner trực tiếp của feedback navbar và correction chỉ khóa first-render state. |

### WARNINGS

| Warning | Impact |
|---|---|
| Signed-in icons xuất hiện sau mount thay vì được đoán trên server. | Một paint guest shape ngắn là đúng hơn hydration mismatch; server không có bearer session để render chắc chắn. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Kết luận navbar đã ổn chỉ vì dùng chung component | Đo Console và khóa server/client first shape | Cùng owner không đảm bảo cùng render khi auth state hydrate khác nhau; trò nhận sai chẩn đoán ban đầu. |

### OWED

| Owed | Cleared by |
|---|---|
| Apply và reload sạch Console | One-line ShellNav patch, focused lint/type/test và browser reload mới. |

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
| Purpose | Ghi correction và focused/live proof cho navbar seam, breadcrumb và signed-in tools hydration. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-detail-ownership-and-rail.md |
| Language | vi |
| Phase | feedback |
| Touching | Workflow record này; production corrections đã nằm trong seven-path boundary của hai feedback ngay trước. |

Session id: fidel-course-detail-ownership-20260815-01
Session status: open
Feedback classification: within-boundary

### Proof

| Check | Result |
|---|---|
| Course Detail navbar seam | PASS — tabs bắt đầu ngay dưới primary header và baseline chạy full width như Dashboard layer. |
| Breadcrumb | PASS — live tab đọc `Trang chủ → Khóa học → System Design Mastery`. |
| Signed-in tools | PASS — fresh localhost tab có đúng một `Thông báo` và một `Tài khoản`. |
| Fresh Console | PASS — zero error logs; hydration mismatch không tái hiện. |
| Focused tests | PASS — 2 files, 9 tests. |
| TypeScript | PASS — `npx tsc --noEmit --pretty false`. |
| Focused ESLint | PASS — ShellNav và Course Detail boundary; chỉ warning cấu hình React version. |
| Diff hygiene | PASS — `git diff --check` không có whitespace error. |

### OUTPUTS

| Concept | Result |
|---|---|
| Navbar parity | Course Detail có cùng two-tier seam với Dashboard và signed-in tools hydrate ổn định. |
| Route ancestry | Breadcrumb legacy đã trở lại ở đầu cột narrative, độc lập với section tabs. |

### CHANGES

| Tree | Details |
|---|---|
| `src/components/contracts/index.ts` | modified — bỏ top gap, cho tab baseline full width và thêm breadcrumb slot/ownership. |
| `src/components/pages/CourseDetailPage/component.tsx` | modified — render breadcrumb trước course heading. |
| `src/components/pages/CourseDetailPage/index.tsx` | modified — resolve breadcrumb copy và route actions. |
| `src/components/pages/CourseDetailPage/component.test.tsx` | modified — prove breadcrumb content, actions và disabled current crumb. |
| `src/messages/en.json` | modified — thêm EN breadcrumb copy. |
| `src/messages/vi.json` | modified — thêm VI breadcrumb copy. |
| `src/components/layouts/ShellNav/index.tsx` | modified — khóa signed-in tools đến sau mount để server/client first tree giống nhau. |
| `.workflows/fidel/starci-academy/course-detail-ownership-and-rail.md` | modified — ghi feedback, nhận sai, correction và proof. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Correction đã có binding render và live proof; session giữ mở để user feedback tiếp. |

### WARNINGS

| Warning | Impact |
|---|---|
| FAQ r2 và các concurrent Learn edits vẫn chưa commit trong cùng FE worktree. | Không stage/commit/finalize tự động; chỉ claim exact hunks ở CHANGES. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Tabs trôi trong body và breadcrumb bị loại | Navbar-adjacent tab layer cộng route breadcrumb | User chỉ rõ hai vùng không cùng vai trò và yêu cầu follow Dashboard/legacy. |
| Chẩn đoán “tools đã dùng chung nên không lỗi” | First-render auth gate sau mount | Live Console chứng minh cùng component vẫn hydration mismatch; trò nhận sai chẩn đoán ban đầu. |

### OWED

| Owed | Cleared by |
|---|---|
| User visual acceptance | User xem tab localhost sạch đang mở và xác nhận hoặc feedback tiếp. |
| Fidelity End | Chỉ chạy khi user yêu cầu chốt pass và scan related bugs; Finality mới đóng session. |

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
| Purpose | Bỏ divider thừa giữa primary navbar và Course Detail tabs; khôi phục icon cho bốn navigation peers. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-detail-ownership-and-rail.md |
| Language | vi |
| Phase | feedback |
| Touching | D:\Repositories\starci-academy-fe\src\components\contracts\index.ts; D:\Repositories\starci-academy-fe\src\components\pages\CourseDetailPage\component.tsx; D:\Repositories\starci-academy-fe\src\components\pages\CourseDetailPage\component.test.tsx; workflow record này. |

Session id: fidel-course-detail-ownership-20260815-01
Session status: open
Feedback classification: within-boundary

### Measured feedback

| Difference | Evidence | Correction |
|---|---|---|
| Divider 1px nằm đúng seam giữa primary navbar và Course tabs. | Live `localhost`: `double-navbar` bottom = 65px và có `border-bottom: 1px`; `course-section-navigation` top = 65px và cũng có bottom baseline. | Course tab layer che seam trên bằng background và stacking tại đúng 1px, vẫn giữ baseline dưới tabs. |
| Bốn Course tabs không có icon. | Live DOM: cả bốn `[role=tab]` có `svgCount = 0`; source chỉ truyền `{ id, label }` dù `ChoiceTabs` đã hỗ trợ `icon`. | Truyền closed `IconName` cho bốn navigation peers: `explore`, `course`, `community`, `review`; không import glyph vendor và không mở vocabulary mới. |

### OUTPUTS

| Concept | Result |
|---|---|
| Course tab seam | Chỉ còn một divider dưới toàn bộ tab layer, không còn divider chia primary navbar khỏi tabs. |
| Course tab identity | Mỗi navigation peer có leading icon từ closed Heroicons vocabulary hiện có. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/fidel/starci-academy/course-detail-ownership-and-rail.md` | modified — ghi feedback và live measurement trước correction. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Đây là hai small patches trực tiếp theo binding screenshot và owner hiện có. |

### WARNINGS

| Warning | Impact |
|---|---|
| FE worktree còn FAQ/Learn edits chưa commit. | Chỉ sửa exact Course Detail hunks; không stage hoặc ghi đè thay đổi ngoài boundary. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Gọi seam cũ là đã follow Dashboard | Đo hai border thật và sửa phần divider còn nhìn thấy | User vẫn thấy divider; proof cũ chỉ xác nhận tabs đã sát navbar, chưa xác nhận seam sạch. |
| Tabs text-only | Leading icons theo navigation vocabulary | User chỉ rõ icon còn thiếu so với reference. |

### OWED

| Owed | Cleared by |
|---|---|
| Production correction và focused proof | Patch contracts/page/tests, chạy test/type/lint và đo lại fresh localhost tab. |
| User visual acceptance | User xem localhost sau correction và xác nhận hoặc feedback tiếp. |

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
| Repo / branch | D:\Repositories\starci-academy-fe / main @ 6d07fcee8e56a095666930e6d8f3adc6b3a64f15 |
| Purpose | Re-read binding legacy source and restore all three Course Detail commerce flows, not merely three visible buttons. |
| Legacy binding | D:\Repositories\starci-academy @ 9a193423128efa1dc83f23ab0f79fb4ae66db847 |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-detail-ownership-and-rail.md |
| Language | vi |
| Phase | feedback |
| Touching | CoursePricingRail contract/component/test; CourseDetailPage connected owner; startTrial mutation/types/SWR export; workflow record. |

Session id: fidel-course-detail-ownership-20260815-01
Session status: open
Feedback classification: within-boundary

### Measured feedback

| Difference | Binding legacy evidence | Correction |
|---|---|---|
| Current source put Trial and Cart in one nested secondary row. | `CourseCtaButtons/index.tsx` binds one `StackV gap={2}` ordered Enroll, AddToCartButton, Try free. | Removed the nested row contract; all actions are full-width siblings ordered primary, cart, trial at gap two. |
| Enroll added to cart and navigated to `/cart`. | `useCourseEnrollment.ts` opens `PaymentFlow.CourseEnroll`. | Enroll now opens the current FE payment handoff for only this course; it no longer mutates cart. Signed-out viewers are routed to authentication first. |
| Trial only navigated to `/learn`. | Legacy calls `startTrial({ courseId })` best-effort and always enters `/learn/content`. | Added typed `startTrial` GraphQL mutation/SWR hook; handler catches mutation failure and always navigates to `/courses/{displayId}/learn/content`. |
| Cart was local state, add-only, then disabled. | `AddToCartButton` reads real cart, hides for free/owned courses and toggles add/remove. | Course Detail now reads `myCart`, hides cart for free/owned courses, toggles add/remove, invalidates the shared cart cache and keeps the button enabled in remove state. |
| Continue used the removed `/learn` surface. | Legacy content owner builds `/learn/content`. | Continue now enters `/courses/{displayId}/learn/content`. |

### OUTPUTS

| Flow | Result |
|---|---|
| Enroll | One-course checkout handoff; no implicit cart mutation. |
| Add/remove cart | Paid + unowned only; real shared cart state; reversible toggle. |
| Trial / continue | Trial records best-effort then enters content; continue enters the same content owner. |

### CHANGES

| Tree | Details |
|---|---|
| `src/components/contracts/index.ts` | corrected Course Pricing CTA stack from nested secondary row to one legacy-ordered sibling stack. |
| `src/components/blocks/courses/CoursePricingRail/component.tsx` | full-width Enroll → Cart → Trial; cart is an enabled add/remove toggle. |
| `src/components/blocks/courses/CoursePricingRail/component.test.tsx` | proves exact button order and enabled remove action. |
| `src/components/pages/CourseDetailPage/index.tsx` | connects checkout, shared cart add/remove, startTrial and `/learn/content`. |
| `src/modules/api/graphql/mutations/{mutation-start-trial.ts,types/start-trial.ts}` | typed backend `startTrial` transport. |
| `src/hooks/swr/useMutateStartTrialSwr.ts`, `src/hooks/index.ts` | per-course mutation owner and export. |

### PROOF

| Gate | Result |
|---|---|
| Focused ESLint excluding shared dirty contracts table | PASS. |
| `CoursePricingRail` + `CourseDetailPage` focused Vitest | PASS: 2 files, 8 tests. |
| `git diff --check` | PASS. |
| Full typecheck / contracts lint | BLOCKED by concurrent AI trust-tree work outside this fidelity boundary: missing `GlobalAiChatLayout` children and pre-existing contract inference failures. |
| Fresh `localhost:3000` render | BLOCKED by the same concurrent root-layout imports: `StarCiAiFab`, `StarCiAiSelectionAsk`, and `StarCiAiDrawer` do not exist yet. No Course Detail runtime error was observed before compilation stopped at the root layout. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Inferring three flows from the current API surface | Binding the behavior from legacy owners first | Visible buttons are not fidelity when their mutation, route and post-click state disagree. |
| Two secondary controls sharing one row | One vertical full-width sibling stack at gap two | Legacy explicitly owns this conversion order and the user asked to preserve all three flows. |
| Local `isInCart` state and disabled “in cart” label | Shared `myCart` truth and add/remove toggle | The local flag cannot survive another cart surface and removes the legacy reversible action. |

### OWED

| Owed | Cleared by |
|---|---|
| Fresh localhost visual proof | Re-run after the concurrent Global AI root-layout branch supplies its missing imports and the app compiles. |
| Exact guest cart intent replay in the sign-in overlay | Current FE has no pending-cart-intent owner; signed-out presses currently enter `/authentication`. Route through a linked capability/design task if exact modal replay remains required. |
| Fidelity End / Finality | End only on user request; Finality alone closes this session. |

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
| Repo / branch | D:\Repositories\starci-academy-fe / main @ d428f0e75aa4db5a4ed00fa69b56d426fdf88b51 |
| Purpose | Hoàn tất Add/Remove Cart và Trial bằng auth gate, business-success gate và connected proof. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-detail-ownership-and-rail.md |
| Language | vi |
| Phase | feedback |
| Touching | CourseDetailPage/index.tsx; CourseDetailPage/index.test.tsx; mutation-start-trial.test.ts; workflow record; không chạm AI. |

Session id: fidel-course-detail-ownership-20260815-01
Session status: open
Feedback classification: within-boundary

### Measured feedback

| Difference | Evidence | Correction |
|---|---|---|
| Guest bấm Trial vẫn gọi mutation có auth rồi nuốt lỗi. | `StartTrialHandler` yêu cầu `user`; connected FE không kiểm tra `sessionToken`. | Guest đi `/authentication` trước mutation. |
| Trial thất bại vẫn điều hướng vào nội dung. | Handler dùng `.catch(...).finally(router.push)`, nên transport hoặc business failure đều giả như thành công. | Chỉ điều hướng khi `startTrial.success === true`; failure giữ nguyên trang để retry. |
| Add/remove cart mới có pure-button test. | Connected handler đã dùng mutation + shared cache nhưng chưa có proof cho guest/success/rejection. | Thêm connected fixtures chứng minh auth redirect, add/remove dispatch và cache chỉ refresh sau business success. |

### OUTPUTS

| Concept | Result |
|---|---|
| Course conversion actions | Đang sửa hai luồng để navigation phản ánh đúng quyền và kết quả backend. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/fidel/starci-academy/course-detail-ownership-and-rail.md` | modified — ghi feedback và frozen write boundary trước production patch. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | User đã yêu cầu sửa trực tiếp. |

### WARNINGS

| Warning | Impact |
|---|---|
| AI đang do session khác chỉnh trong cùng worktree. | Không sửa, stage hoặc claim bất kỳ AI hunk nào. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Trial best-effort luôn vào học | Auth gate và success gate | User yêu cầu hoàn tất luồng thật sau khi được báo lỗi hiện tại. |

### OWED

| Owed | Cleared by |
|---|---|
| Production correction và connected proof | Patch exact boundary, chạy focused test/lint/typecheck/build. |
| User acceptance | User thử hai nút trên localhost và phản hồi. |

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
| Repo / branch | D:\Repositories\starci-academy-fe / main @ d428f0e75aa4db5a4ed00fa69b56d426fdf88b51 |
| Purpose | Ghi correction và proof cho Add/Remove Cart, Trial và pending ownership. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-detail-ownership-and-rail.md |
| Language | vi |
| Phase | feedback |
| Touching | CoursePricingRail component/test; CourseDetailPage connected owner/test; workflow record; không chạm AI. |

Session id: fidel-course-detail-ownership-20260815-01
Session status: open
Feedback classification: within-boundary

### PROOF

| Gate | Result |
|---|---|
| Course pricing + connected commerce Vitest | PASS — 3 files, 17 tests. |
| Focused ESLint | PASS. |
| Backend `StartTrialHandler` unit | PASS — 1 suite, 6 tests. |
| FE TypeScript | PASS — `tsc --noEmit --incremental false`. |
| FE production build | PASS — Next.js compiled, typed và generated routes. |
| `git diff --check` | PASS. |

### OUTPUTS

| Concept | Result |
|---|---|
| Trial authorization | Guest đi authentication trước mutation; learner chỉ vào content sau business success. |
| Cart truth | Add/remove dùng shared cart và chỉ revalidate sau backend success. |
| Pending ownership | Checkout, cart và trial chỉ khóa/quay đúng nút đang sở hữu request. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/fidel/starci-academy/course-detail-ownership-and-rail.md` | modified — ghi correction và proof. |
| `src/components/pages/CourseDetailPage/index.tsx` | modified — auth/success gate cho Trial và state owner cho ba commerce requests. |
| `src/components/pages/CourseDetailPage/index.test.tsx` | added — connected proof cho guest, trial success/rejection, cart add/remove và cache gate. |
| `src/components/blocks/courses/CoursePricingRail/component.tsx` | modified — `checking-out` và `trialing` pending states. |
| `src/components/blocks/courses/CoursePricingRail/component.test.tsx` | modified — proof mỗi pending state chỉ thuộc một action. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Correction đã có automated proof; session vẫn mở cho user feedback. |

### WARNINGS

| Warning | Impact |
|---|---|
| Chưa bấm mutation bằng tài khoản thật trên browser trong turn này. | Automated connected/backend proof đạt, nhưng user visual acceptance vẫn còn owed. |
| AI có session riêng trong cùng worktree. | Không file AI nào thuộc correction hoặc proof này. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Nuốt lỗi Trial rồi luôn điều hướng | Chỉ điều hướng sau `startTrial.success === true` | Navigation phải phản ánh backend truth. |
| Một state `adding` cho cả checkout/cart | Ba pending owners riêng | Spinner sai nút làm người dùng hiểu sai request đang chạy. |

### OWED

| Owed | Cleared by |
|---|---|
| User acceptance | User thử Add/Remove Cart và Trial trên localhost rồi xác nhận hoặc feedback. |
| Fidelity End / Finality | Chỉ chạy khi user yêu cầu chốt; Finality mới đóng session. |

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
| Repo / branch | D:\Repositories\starci-academy-fe / main @ 6a3cf191991e5e1e5ef4a39956f3473da4f18c9a |
| Purpose | Tiếp nhận feedback về signal ribbon trung tính, màu ngữ nghĩa theo cấp độ module và danh sách nội dung disclosure. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-detail-ownership-and-rail.md |
| Language | vi |
| Phase | feedback |
| Touching | CourseDetailPage owner/component/test; CurriculumModuleRow leaf/focused test; course-detail contracts; workflow; không chạm AI. |

Session id: fidel-course-detail-ownership-20260815-01
Session status: open
Feedback classification: within-boundary

### OUTPUTS

| Concept | Result |
|---|---|
| Signal ribbon | Bỏ nền màu trang trí; sáu số liệu cùng một card trung tính. |
| Module tier | Nền tảng, Trung cấp và Nâng cao nhận ba tone ngữ nghĩa khác nhau. |
| Disclosure content | Nội dung module phải đọc như một danh sách có thứ tự, không phải các dòng text rời. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/fidel/starci-academy/course-detail-ownership-and-rail.md` | modified — đóng băng feedback và write boundary trước production patch. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Feedback có reference và owner hiện hữu rõ; sửa trực tiếp trong session mở. |

### WARNINGS

| Warning | Impact |
|---|---|
| Worktree có thay đổi từ session AI riêng. | Không sửa, stage hoặc claim bất kỳ file AI nào. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Nền màu khác nhau trên signal ribbon | Một ribbon trung tính | User yêu cầu bỏ màu sắc khỏi cụm này. |
| Một badge xanh cho mọi cấp độ | Ba tone theo tier | User yêu cầu Nền tảng, Trung cấp, Nâng cao phải khác màu. |

### OWED

| Owed | Cleared by |
|---|---|
| Production correction và focused proof | Patch exact boundary; chạy tests, lint, typecheck và localhost render. |
| User acceptance | User xem lại Course Detail trên localhost và feedback. |

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
| Repo / branch | D:\Repositories\starci-academy-fe / main @ 6a3cf191991e5e1e5ef4a39956f3473da4f18c9a |
| Purpose | Ghi correction và proof cho signal ribbon, module tier và disclosure content list. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-detail-ownership-and-rail.md |
| Language | vi |
| Phase | feedback |
| Touching | CourseDetailPage owner/component/test; CurriculumModuleRow leaf/focused test; course-detail contracts; workflow; không chạm AI. |

Session id: fidel-course-detail-ownership-20260815-01
Session status: open
Feedback classification: within-boundary

### PROOF

| Gate | Result |
|---|---|
| Focused Vitest | PASS — 4 files, 21 tests. |
| Focused ESLint | PASS. |
| FE TypeScript | PASS — `tsc --noEmit --incremental false`. |
| FE production build | PASS — Next.js compiled, typed và generated routes. |
| `git diff --check` | PASS; chỉ có line-ending warnings. |
| Live canonical localhost | PASS — `http://localhost:3000/vi/courses/fullstack-mastery`; signal colored backgrounds = 0; tier tones = success/warning/danger; opened content is `OL` với 5 direct `LI`; console errors = 0. |

### OUTPUTS

| Concept | Result |
|---|---|
| Neutral evidence ribbon | Sáu signal là peer facts trong một card, không còn nền accent/success/warning. |
| Tier identity | Nền tảng, Trung cấp và Nâng cao có tone success, warning và danger riêng. |
| Ordered module contents | Disclosure render preview contents thành danh sách đánh số, có divider và type scale nội dung. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/fidel/starci-academy/course-detail-ownership-and-rail.md` | modified — ghi feedback, boundary và proof. |
| `src/components/contracts/index.ts` | modified — signal board chỉ nhận neutral signal card; loại ba colored signal contracts. |
| `src/components/pages/CourseDetailPage/component.tsx` | modified — bỏ emphasis khỏi signal data và truyền stable module tier. |
| `src/components/pages/CourseDetailPage/index.tsx` | modified — bỏ decorative signal emphasis và project `contentTier` sang curriculum row. |
| `src/components/pages/CourseDetailPage/component.test.tsx` | modified — proof ribbon/module tier/disclosure list trong page composition. |
| `src/components/leaves/CurriculumModuleRow/index.tsx` | modified — map tier sang semantic Badge tone và render contents bằng ordered list. |
| `src/components/leaves/CurriculumModuleRow/index.test.tsx` | added — proof đủ ba tier và ordered content list. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Correction và live proof đã hoàn tất; session vẫn mở cho feedback. |

### WARNINGS

| Warning | Impact |
|---|---|
| Build báo Next.js middleware convention deprecated. | Không liên quan boundary này; build vẫn PASS. |
| Worktree có session AI riêng. | Không file AI nào thuộc correction hoặc proof này. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Colored signal cells | Neutral ruled ribbon | User yêu cầu bỏ màu sắc ở cụm thống kê. |
| Tất cả tier cùng badge xanh | success / warning / danger theo tier | User yêu cầu ba cấp độ phải khác màu. |
| Preview contents như text rows không marker | Ordered list có số và divider | User yêu cầu nội dung accordion render list chuẩn. |

### OWED

| Owed | Cleared by |
|---|---|
| User acceptance | User xem lại localhost và xác nhận hoặc feedback tiếp. |
| Fidelity End / Finality | Chỉ chạy khi user yêu cầu chốt; Finality mới đóng session. |

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
| Repo / branch | D:\Repositories\starci-academy-fe / main @ d428f0e75aa4db5a4ed00fa69b56d426fdf88b51 |
| Purpose | Ghi live guest Trial proof trên canonical localhost sau correction. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-detail-ownership-and-rail.md |
| Language | vi |
| Phase | feedback |
| Touching | Workflow evidence only; không chạm AI. |

Session id: fidel-course-detail-ownership-20260815-01
Session status: open
Feedback classification: within-boundary

### OUTPUTS

| Concept | Result |
|---|---|
| Guest Trial live flow | `localhost:3000/vi/courses/system-design-mastery` bấm `Học thử` chuyển đúng sang `/vi/authentication`; console error bằng 0. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/fidel/starci-academy/course-detail-ownership-and-rail.md` | modified — thêm canonical-localhost guest flow proof. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Live guest flow đã xác nhận correction. |

### WARNINGS

| Warning | Impact |
|---|---|
| Signed-in live mutation chưa chạy bằng browser account thật. | Được bao phủ bởi connected FE tests và 6 backend unit cases; user acceptance vẫn mở. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| None | None | Không có rejection mới trong live proof. |

### OWED

| Owed | Cleared by |
|---|---|
| User acceptance | User thử signed-in Add/Remove Cart và Trial rồi xác nhận hoặc feedback. |
| Fidelity End / Finality | Chỉ chạy khi user yêu cầu chốt; Finality mới đóng session. |


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
| Purpose | Đóng shell, breadcrumb, sticky pricing rail, FAQ và ba conversion actions. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-detail-ownership-and-rail.md |
| Language | vi |
| Phase | end |
| Touching | Workflow record, recorded session source boundary và final evidence only. |

Session id: fidel-course-detail-ownership-20260815-01
Session status: open

### RELATED BUGS

| Finding | Evidence | Classification | Route |
|---|---|---|---|
| Không có pricing action state cùng cơ chế bị mất; signed-in mutation được giữ bởi connected tests. | Source scan, focused tests và localhost closure proof | not-a-bug | None |
| Owed ngoài production boundary | None — user chốt closure; live mutation thủ công không còn là approval pending. | new-boundary | None |

### OUTPUTS

| Concept | Result |
|---|---|
| End identity | fidel-course-detail-ownership-20260815-01 tại FE baseline 85f4e6663dfdea68bb56eec4956cc681641afe35..worktree. |
| Current proof | CoursePricingRail và CourseDetail focused tests đạt; live pricing rail có 3 buttons; localhost render và build đạt. |
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
| None — user chốt closure; live mutation thủ công không còn là approval pending. | None |

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
| Purpose | Finalize fidel-course-detail-ownership-20260815-01 sau End proof đã được user chốt. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-detail-ownership-and-rail.md |
| Language | vi |
| Phase | finality |
| Touching | Workflow record và final evidence only; không production correction. |

Session id: fidel-course-detail-ownership-20260815-01
Session status: finalized
Session finalized: fidel-course-detail-ownership-20260815-01
Final diff identity: FE 85f4e6663dfdea68bb56eec4956cc681641afe35..worktree; BE 7acd312a858be7ed58dc847c25ec86d801be17f8..worktree.

### OUTPUTS

| Concept | Result |
|---|---|
| Closure | Session finalized sau current End evidence. |
| Accepted | Toàn bộ feedback cuối cùng và superseding corrections trong record. |
| Routed | None — user chốt closure; live mutation thủ công không còn là approval pending. |
| Continuation | Feedback mới phải mở Fidelity Start mới với Continuation of: fidel-course-detail-ownership-20260815-01. |

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
| None — user chốt closure; live mutation thủ công không còn là approval pending. | None |
