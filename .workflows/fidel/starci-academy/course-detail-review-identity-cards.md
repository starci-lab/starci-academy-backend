<!-- starci-workflow: v2 -->

# course-detail-review-identity-cards

## start

### CONTEXT

| Field | Value |
|---|---|
| Source | `D:\Repositories\starci-academy-backend` |
| Project | Explicit StarCi Academy targets |
| Frontend | `D:\Repositories\starci-academy-fe` @ `main` (`85f4e6663dfdea68bb56eec4956cc681641afe35`) |
| Backend | `D:\Repositories\starci-academy-backend` @ `mtp` (`0a590f2b58768a3b7e4183e998470c33fc05d726`) |
| App | `starci-academy` |
| Session id | `course-detail-review-identity-cards` |
| Session status | `open` |
| Route | `http://localhost:3000/vi/courses/fullstack-mastery` |
| Frozen state | Desktop, Vietnamese, light theme, anonymous-readable course detail, seeded Fullstack Mastery reviews |
| User request | Student reviews must show a learner name instead of UUID and each review must render as a card. |
| Binding evidence | User screenshot `codex-clipboard-b170ca86-5778-448f-aa4a-47a970017213.png` and explicit instruction in this task. |
| Touching | Review block/card contracts and focused tests immediately; public author GraphQL shape is routed through backend Feature Plan before BE production writes. |

### OUTPUTS

| Correction | Current proof |
|---|---|
| Review identity | Baseline measured: FE maps `row.userId` directly to `author`; BE `courseReviews` exposes no public author projection. |
| Review surface | Baseline measured: reviews are flat `divide-y` rows and contract explicitly refuses per-opinion cards; user feedback supersedes that decision. |

### CHANGES

| Path | Change |
|---|---|
| `.workflows/fidel/starci-academy/course-detail-review-identity-cards.md` | Added open fidelity session before product writes. |

### NEED APPROVALS

| Item | Status |
|---|---|
| Public review author GraphQL extension | Requires Backend Feature Review approval after exact Plan; FE card correction does not wait on it. |

### WARNINGS

| Warning | Impact |
|---|---|
| FE and BE worktrees already contain unrelated changes | Preserve them; no reset, staging or broad formatting. |
| `UserEntity` exposes private fields such as email and Keycloak id in GraphQL | Do not expose the whole relation from the anonymous `courseReviews` query. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Render `userId` as the author | `displayName`, then `username`, then localized learner fallback | UUID is storage identity, not display identity. |
| Resolve one user query per review in FE | One joined BE read with a narrow public-author object | Avoid N+1 and keep data ownership in the query. |
| Expose `UserEntity` as review author | Dedicated public author shape | Anonymous buyers must not be able to select email or Keycloak id. |

### OWED

| Owed | Cleared by |
|---|---|
| FE card + rating correction and focused proof | Fidelity patch in this open session. |
| Public author name in live response | Approved Backend Feature Apply plus FE query mapping. |
| User acceptance | Direct feedback after localhost render. |
| Session closure | `starci-fe-fidelity-end`, then `starci-fe-fidelity-finality` only when requested. |

## feedback

### CONTEXT

| Field | Value |
|---|---|
| Session id | `course-detail-review-identity-cards` |
| Session status | `open` |
| Feedback | Use `react-rating-stars-component`; show half-capable read-only stars in yellow. |
| Classification | `within-boundary` |
| Binding evidence | User-linked npm package and explicit yellow-star instruction. |

### OUTPUTS

| Correction | Current proof |
|---|---|
| Rating glyph | Package API supports `value`, `edit=false`, half stars, custom icons and `activeColor`; wrapper compatibility still must pass React 19 render tests. |

### CHANGES

| Path | Change |
|---|---|
| `package.json`, `package-lock.json` | Added `react-rating-stars-component@2.2.0`. |

### NEED APPROVALS

| Item | Status |
|---|---|
| None for FE rating patch | Explicitly requested. |

### WARNINGS

| Warning | Impact |
|---|---|
| Package has no bundled TypeScript declaration and was authored against React 16 | Keep it behind one typed leaf and prove React 19 rendering; remove it if that proof fails. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Copy an unowned “HeroUI star SVG” | Use the package’s own half-star clipping and the app warning/yellow token | HeroUI package contains no owned star asset; copying would duplicate icon ownership. |

### OWED

| Owed | Cleared by |
|---|---|
| Typed `RatingStars` leaf and test | Focused FE implementation. |
| Yellow read-only aggregate and review stars | Review block test and live render. |

## feedback proof

### CONTEXT

| Field | Value |
|---|---|
| Session id | `course-detail-review-identity-cards` |
| Session status | `open` |
| Frontend | `D:\Repositories\starci-academy-fe` |
| Backend | `D:\Repositories\starci-academy-backend` |
| Live route | `http://localhost:3000/vi/courses/fullstack-mastery` with API `http://localhost:3001/graphql` |
| Feedback applied | One card per learner review; yellow read-only aggregate and row ratings; never render a UUID as the learner name. |

### OUTPUTS

| Proof | Result |
|---|---|
| Live seeded page | `2` review cards, `3` rating runs, `2` localized `Học viên` labels and `0` UUID labels. |
| SVG ownership | The rating package receives semantic `Icon` leaf elements; the half state overlays the same outline/solid star and clips the solid half. |
| Package runtime defect found | The package's default character rendered five zero-width empty spans on React 19; explicit SVG elements fixed the live width without bypassing the package. |
| API runtime | Backend restarted and GraphQL mapped on `localhost:3001`; Fullstack Mastery live page again returned the seeded two reviews. |

### CHANGES

| Path | Change |
|---|---|
| `package.json`, `package-lock.json` | Added `react-rating-stars-component@2.2.0`. |
| `src/types/react-rating-stars-component.d.ts` | Added the narrow local declaration for the package surface used by StarCi. |
| `src/components/leaves/Icon/index.tsx` | Added closed meanings for empty and filled rating stars. |
| `src/components/leaves/RatingStars/index.tsx` | Added the typed read-only package adapter, warning-yellow token and clipped Heroicons half state. |
| `src/components/blocks/courses/CourseReviewBlock/component.tsx` | Replaced flat opinions and text scores with cards and yellow ratings. |
| `src/components/contracts/index.ts` | Updated the review block/card ownership and evidence tree. |
| `src/components/pages/CourseDetailPage/index.tsx`, `src/messages/{vi,en}.json` | Removed UUID display fallback; use a localized neutral learner label until the approved public-author projection lands. |
| Focused tests | Added rating and review-card tests and updated connected page assertions. |

### NEED APPROVALS

| Item | Status |
|---|---|
| Actual public learner name | Backend Feature candidate `course-review-public-author-r1` awaits explicit approval. |

### WARNINGS

| Warning | Impact |
|---|---|
| `react-rating-stars-component@2.2.0` has no bundled types and its default character path is incompatible with this React 19 render | It remains isolated behind one typed leaf and explicit SVG icons; focused runtime and component proofs cover this boundary. |
| Existing FE/BE worktrees are dirty | Only the files recorded above belong to this correction; unrelated work was preserved. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Package default star character | Explicit semantic SVG icon elements passed to the package | Live browser measured zero-width default glyphs. |
| Direct vendor icon imports in `RatingStars` | Closed `Icon` leaf meanings | Canonical lint forbids glyph ownership outside the icon leaf. |
| Continue displaying `userId` pending backend work | Localized `Học viên` / `Learner` | UUID is never a public name. |

### OWED

| Owed | Cleared by |
|---|---|
| Real `displayName` / `username` in each card | Approve and apply `course-review-public-author-r1`, then update FE query mapping. |
| End pass and related-bug scan | `starci-fe-fidelity-end` when requested. |
| Session closure | `starci-fe-fidelity-finality` after an End pass and explicit finality request. |

## feedback

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Repo / branch | D:\Repositories\starci-academy-fe @ main |
| Purpose | Xóa icon tím bị lặp sau từng nội dung trong accordion chương trình học. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-detail-review-identity-cards.md |
| Language | vi |
| Phase | feedback |
| Session id | course-detail-review-identity-cards |
| Session status | open |
| Touching | `src/components/leaves/CurriculumModuleRow/index.tsx`, test cùng thư mục và workflow hiện tại. |

Session id: course-detail-review-identity-cards
Session status: open

### OUTPUTS

| Concept | Result |
|---|---|
| Nội dung accordion | Chỉ còn số thứ tự và text nội dung; trạng thái preview không còn gắn icon tím lặp ở cuối dòng. |
| Disclosure | Chevron mở/đóng của module được giữ nguyên vì nó thuộc điều khiển accordion, không phải logo bị từ chối. |
| Live proof | Module đầu tiên mở trên `localhost:3000` có `5` dòng và `0` SVG bên trong danh sách nội dung. |

### CHANGES

| Tree | Details |
|---|---|
| `src/components/leaves/CurriculumModuleRow/index.tsx` | modified — xóa nhánh render `Icon review` theo `lesson.isPreview`. |
| `src/components/leaves/CurriculumModuleRow/index.test.tsx` | modified — khóa invariant danh sách preview không chứa SVG lặp. |
| `.workflows/fidel/starci-academy/course-detail-review-identity-cards.md` | modified — ghi feedback và proof mới trong session đang mở. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Không cần phê duyệt cho patch fidelity đã chỉ rõ. |

### WARNINGS

| Warning | Impact |
|---|---|
| Worktree FE đang chứa thay đổi từ các session khác | Không reset, stage hoặc sửa lan sang các file ngoài boundary. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Icon tím `review` sau từng lesson preview | Danh sách text thuần có đánh số | Thầy yêu cầu “xóa cái logo màu tím kia đi”. |

### OWED

| Owed | Cleared by |
|---|---|
| Tên học viên thật trong review card | Duyệt và apply `course-review-public-author-r1`. |
| End pass và related-bug scan | `starci-fe-fidelity-end` khi thầy yêu cầu chốt session. |
| Session closure | `starci-fe-fidelity-finality` sau End và yêu cầu finality rõ ràng. |

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
| Purpose | Nối các learner review thành một SurfaceListCard và tăng rating star lên size-6. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-detail-review-identity-cards.md |
| Language | vi |
| Phase | feedback |
| Touching | CourseReviewBlock component/test, RatingStars leaf/test, course review contracts và workflow record này. |

Session id: course-detail-review-identity-cards
Session status: open

### OUTPUTS

| Concept | Result |
|---|---|
| Review ownership | Mọi learner review là row trong một SurfaceListCard, có divider giữa rows. |
| Card chrome | Không còn SurfaceCard/shadow riêng trên từng review. |
| Rating stars | Mọi empty/full/half star dùng size-6. |

### CHANGES

| Tree | Details |
|---|---|
| FE source/contracts/tests | Small patch tại exact owners đã nêu. |
| Workflow | Feedback được ghi trước production write. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | User chỉ rõ SurfaceListCard và size-6. |

### WARNINGS

| Warning | Impact |
|---|---|
| CourseReviewBlock và contracts file đang có thay đổi từ feedback trước. | Chỉ sửa anatomy review list và rating size; giữ nguyên identity/data behavior. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Một SurfaceCard cho mỗi review | Một SurfaceListCard chứa các review rows | User yêu cầu “dính lại vào nhau kiểu surface list card”. |
| Star size-4 | Star size-6 | User chốt kích thước cụ thể. |

### OWED

| Owed | Cleared by |
|---|---|
| Focused tests, lint, typecheck và localhost proof | Chạy ngay sau patch. |
| End/Finality | Chỉ chạy lại sau khi feedback này được chứng minh. |

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
| Purpose | Điều chỉnh toàn bộ rating star từ size-6 xuống size-5. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-detail-review-identity-cards.md |
| Language | vi |
| Phase | feedback |
| Touching | RatingStars leaf/test và workflow record này. |

Session id: course-detail-review-identity-cards
Session status: open

### OUTPUTS

| Concept | Result |
|---|---|
| Rating stars | Full, empty và half stars đều size-5. |

### CHANGES

| Tree | Details |
|---|---|
| RatingStars source/test | Sửa exact size recipe và assertion. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | User chốt “star 5 hết”. |

### WARNINGS

| Warning | Impact |
|---|---|
| None | Không đổi anatomy hoặc dữ liệu review. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| size-6 | size-5 | User sửa lại kích thước sau khi nhìn render. |

### OWED

| Owed | Cleared by |
|---|---|
| Focused proof và localhost | Chạy ngay sau patch. |

## evidence

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
| Purpose | End-pass Course Detail review identity, joined surface, yellow rating stars và accordion preview cleanup. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-detail-review-identity-cards.md |
| Language | vi |
| Phase | end |
| Touching | Package manifest/lock; review, rating, icon, curriculum, Course Detail mapping/contracts/tests/messages; workflow evidence. |

Session id: course-detail-review-identity-cards
Session status: open

### RELATED BUGS

| Finding | Evidence | Classification | Route |
|---|---|---|---|
| Không có rating seam cùng cơ chế còn sót | `rg` cho thấy `RatingStars` chỉ được sở hữu bởi `CourseReviewBlock`; aggregate và hai row đều live `items-center`, SVG `size-5` | not-a-bug | None |
| Các contract khác còn `items-baseline` | Price, profile, order và fact rows không chứa `RatingStars` và cần baseline typography riêng | not-a-bug | None |
| Public learner name chưa có trong anonymous review projection | Live render dùng `Learner`; BE query chưa trả public `displayName`/`username` | new-boundary | Backend Feature `course-review-public-author-r1`, sau đó FE query mapping |

### OUTPUTS

| Concept | Result |
|---|---|
| End identity | `course-detail-review-identity-cards` end-pass tại baseline `85f4e6663dfdea68bb56eec4956cc681641afe35..worktree`; session vẫn open. |
| Review ownership | Hai review nằm trong một `SurfaceListCard`, divider giữa rows, không còn card/shadow riêng từng review. |
| Rating | Aggregate và review rows dùng rating vàng read-only, hỗ trợ half-star; mọi SVG dùng `size-5`. |
| Alignment | Aggregate rating row và author rating rows đều `items-center`; correction `justify-between` đã bị bác. |
| Identity | UUID không còn được render; localized `Learner` là fallback an toàn cho tới khi backend public-author projection được apply. |
| Accordion | Lesson preview list giữ số thứ tự/text và không còn icon tím lặp; chevron disclosure của module được giữ. |
| Automated proof | 3 focused files, 8 tests pass; ESLint pass; TypeScript pass; production build pass. |
| Live proof | `localhost:3000/en/courses/fullstack-mastery`: 2 review rows; 2 author lines; summary `items-center`; author line `items-center`; first SVG `size-5 shrink-0`; dữ liệu nạp lại sau build vẫn đủ 2 rows. |

### CHANGES

| Tree | Details |
|---|---|
| `package.json`, `package-lock.json`, `src/types/react-rating-stars-component.d.ts` | Vendor rating dependency và narrow local type boundary. |
| `src/components/leaves/Icon/index.tsx`, `src/components/leaves/RatingStars/index.tsx`, `index.test.tsx` | Closed star meanings, yellow/half-star adapter và exact `size-5` proof. |
| `src/components/blocks/courses/CourseReviewBlock/component.tsx`, `component.test.tsx` | Joined SurfaceListCard, review rows, aggregate/row rating ownership và alignment assertions. |
| `src/components/contracts/index.ts` | Review list/row/summary/author-line recipes; final rating rows use `items-center`. |
| `src/components/pages/CourseDetailPage/index.tsx`, connected tests, `src/messages/vi.json`, `src/messages/en.json` | UUID-safe localized learner fallback và connected render proof. |
| `src/components/leaves/CurriculumModuleRow/index.tsx`, `index.test.tsx` | Removed repeated purple preview icon while retaining disclosure chevron. |
| `.workflows/fidel/starci-academy/course-detail-review-identity-cards.md` | Ordered feedback decisions, proof, related scan và End evidence. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None for End | User explicitly invoked `starci-fe-fidelity-end`; backend public-author remains separately routed. |

### WARNINGS

| Warning | Impact |
|---|---|
| FE worktree contains unrelated concurrent changes | End diff identity is scoped to recorded session paths; no unrelated file was reset, staged or rewritten. |
| `react-rating-stars-component@2.2.0` has no bundled types and old peer assumptions | It remains isolated behind the typed `RatingStars` leaf; React 19 component/live/build proofs pass. |
| Next build reports deprecated middleware convention | Existing unrelated warning; production build still exits 0. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| UUID as learner name | Localized learner fallback now; public display name through routed backend projection | Storage identity is not public identity. |
| One card per review | One joined SurfaceListCard with divider rows | Latest visual feedback superseded separate cards. |
| Package default glyph / direct vendor SVG ownership | Semantic Icon leaf elements passed into the package | Default characters collapsed in React 19; icon ownership stays closed. |
| Star `size-6` | Star `size-5` everywhere | User corrected the requested scale after render. |
| `justify-between` on author/rating line | Compact row with `items-center` | User clarified the intended alignment. |
| `items-baseline` on aggregate rating row | `items-center` | User extended the same alignment to the top rating row. |
| Purple preview icon after every lesson | Numbered text-only preview list | Repeated icon was visual noise, not disclosure state. |

### OWED

| Owed | Cleared by |
|---|---|
| Real `displayName` / `username` in anonymous review response | Backend Feature `course-review-public-author-r1`, then FE query mapping in a linked capability boundary. |
| Session closure | Explicit `starci-fe-fidelity-finality`; End intentionally leaves session open for more feedback. |

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
| Purpose | Căn giữa dọc cả hàng tổng quan rating phía trên. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-detail-review-identity-cards.md |
| Language | vi |
| Phase | feedback |
| Touching | Course review summary contract/test và workflow record này. |

Session id: course-detail-review-identity-cards
Session status: open

### OUTPUTS

| Concept | Result |
|---|---|
| Aggregate rating row | Điểm, sao và review count cùng `items-center`. |

### CHANGES

| Tree | Details |
|---|---|
| course-review-summary | Thay `items-baseline` bằng `items-center`. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | User chốt “cho cả hàng sao ở trên nữa”. |

### WARNINGS

| Warning | Impact |
|---|---|
| None | Không đổi spacing, typography hoặc rating value. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Summary `items-baseline` | Summary `items-center` | Cụm star cần căn giữa với số và count giống review rows. |

### OWED

| Owed | Cleared by |
|---|---|
| Focused proof và localhost | Chạy ngay sau patch. |

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
| Purpose | Sửa lại alignment hàng tên và sao theo feedback trực tiếp. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-detail-review-identity-cards.md |
| Language | vi |
| Phase | feedback |
| Touching | Course review author-line contract/test và workflow record này. |

Session id: course-detail-review-identity-cards
Session status: open

### OUTPUTS

| Concept | Result |
|---|---|
| Review header | Tên và sao giữ thành một cụm, căn giữa dọc bằng `items-center`. |

### CHANGES

| Tree | Details |
|---|---|
| course-review-author-line | Bỏ `w-full`/`justify-between`, thay `items-baseline` bằng `items-center`. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | User sửa rõ: “không justify-between… là items-center”. |

### WARNINGS

| Warning | Impact |
|---|---|
| None | Đây là correction thay thế feedback liền trước. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| `justify-between` | `items-center` | User xác nhận feedback trước bị hiểu nhầm. |

### OWED

| Owed | Cleared by |
|---|---|
| Focused proof và localhost | Chạy ngay sau patch. |

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
| Purpose | Căn tên học viên và rating về hai đầu của review row. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-detail-review-identity-cards.md |
| Language | vi |
| Phase | feedback |
| Touching | Course review author-line contract và workflow record này. |

Session id: course-detail-review-identity-cards
Session status: open

### OUTPUTS

| Concept | Result |
|---|---|
| Review header | Tên ở đầu dòng, cụm sao ở cuối dòng bằng `justify-between`. |

### CHANGES

| Tree | Details |
|---|---|
| course-review-author-line | Thêm ownership layout `w-full justify-between`; giữ wrap cho viewport hẹp. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | User chốt “và justify between”. |

### WARNINGS

| Warning | Impact |
|---|---|
| None | Không đổi dữ liệu, typography hoặc star size. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Tên và sao dồn cùng phía | Hai đầu một dòng | User yêu cầu rõ `justify-between`. |

### OWED

| Owed | Cleared by |
|---|---|
| Focused proof và localhost | Chạy ngay sau patch. |

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
| Purpose | End-pass Course Detail review identity, rating, joined surface và preview-list corrections. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-detail-review-identity-cards.md |
| Language | vi |
| Phase | end |
| Touching | Recorded package, rating, icon, review, curriculum, Course Detail, contract, test, message và workflow paths only. |

Session id: course-detail-review-identity-cards
Session status: open

### RELATED BUGS

| Finding | Evidence | Classification | Route |
|---|---|---|---|
| Không có rating seam cùng cơ chế còn sót | `RatingStars` chỉ do `CourseReviewBlock` gọi; aggregate và hai review rows đều live `items-center`, SVG `size-5` | not-a-bug | None |
| Contract khác còn `items-baseline` | Price/profile/order/fact rows không chứa RatingStars và có baseline typography riêng | not-a-bug | None |
| Public learner name chưa có trong anonymous review projection | Live render dùng localized `Learner`; BE chưa trả public `displayName`/`username` | new-boundary | Backend Feature `course-review-public-author-r1`, sau đó FE query mapping |

### OUTPUTS

| Concept | Result |
|---|---|
| End identity | End-pass `course-detail-review-identity-cards` tại `85f4e6663dfdea68bb56eec4956cc681641afe35..worktree`; session vẫn open. |
| Feedback sequence | Separate cards → joined SurfaceListCard; size-6 → size-5; justify-between → compact `items-center`; sau đó aggregate row cũng `items-center`. |
| Review result | Một joined SurfaceListCard chứa 2 review rows và divider; không có card/shadow riêng cho từng review. |
| Rating result | Yellow read-only half-capable rating; tất cả SVG dùng `size-5`. |
| Identity result | UUID không render; localized Learner fallback giữ an toàn tới khi public-author feature hoàn thành. |
| Preview result | Danh sách lesson preview không còn icon tím lặp; disclosure chevron vẫn giữ. |
| Automated proof | 3 focused files, 8 tests pass; ESLint pass; TypeScript pass; `next build` pass. |
| Live proof | Sau build/reload: 2 review rows, 2 author lines; summary `items-center gap-3`; author line `items-center gap-2`; star SVG class `size-5 shrink-0`. |

### CHANGES

| Tree | Details |
|---|---|
| Rating boundary | `package.json`, lock, local vendor type, Icon meanings, RatingStars source/test. |
| Review boundary | CourseReviewBlock source/test và course-review contracts. |
| Connected Course Detail | Page mapping/tests và vi/en learner fallback messages. |
| Curriculum preview | CurriculumModuleRow source/test. |
| Workflow | Toàn bộ feedback, corrections, proof và related-bug scan của session. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None for End | User explicitly invoked `starci-fe-fidelity-end`; public-author feature remains routed separately. |

### WARNINGS

| Warning | Impact |
|---|---|
| FE worktree có thay đổi đồng thời ngoài session | Không reset/stage/rewrite; End identity chỉ nhận ownership các path đã ghi. |
| Vendor rating cũ, không có bundled types | Đã cô lập sau typed leaf; React 19 tests, localhost và production build đều pass. |
| Workflow validator tổng còn lỗi lịch sử ở nhiều record | Lỗi đã tồn tại ngoài End patch; không dùng kết quả tổng để tuyên bố trust tree sạch. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| UUID public; per-review card; package glyph mặc định | Learner fallback; joined list surface; semantic SVG through Icon leaf | Khớp identity, surface ownership và React 19 runtime. |
| Star size-6; author-line justify-between; rating baseline alignment | Star size-5; compact author line và aggregate đều items-center | Các feedback sau đã supersede các lựa chọn trước. |
| Purple icon ở từng preview lesson | Numbered text-only rows | Icon lặp không biểu diễn disclosure state. |

### OWED

| Owed | Cleared by |
|---|---|
| Real `displayName` / `username` | Backend Feature `course-review-public-author-r1`, rồi FE query mapping trong linked boundary. |
| Session closure | `starci-fe-fidelity-finality`; End không đóng session. |

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
| Repo / branch | D:\Repositories\starci-academy-fe / main @ 85f4e6663dfdea68bb56eec4956cc681641afe35..worktree |
| Purpose | Đồng bộ connected Course Detail ownership assertion với joined review SurfaceListCard đã được chấp nhận. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-detail-review-identity-cards.md |
| Language | vi |
| Phase | feedback |
| Touching | Connected CourseDetailPage test và workflow record này. |

Session id: course-detail-review-identity-cards
Session status: open

### OUTPUTS

| Concept | Result |
|---|---|
| Related regression | Connected test recognizes the fifth SurfaceListCard as the accepted joined learner-review surface. |

### CHANGES

| Tree | Details |
|---|---|
| CourseDetailPage connected test | Update exact surface count and assert the review list contract exists. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | End related-bug scan classified this as same-boundary stale proof. |

### WARNINGS

| Warning | Impact |
|---|---|
| None | Production source is unchanged. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Preserve stale count 4 | Count 5 plus named review-list assertion | The accepted joined review surface is real page ownership, not accidental chrome. |

### OWED

| Owed | Cleared by |
|---|---|
| Focused connected proof and repeated End | Run immediately before Finality. |

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
| Purpose | End lại sau connected-test correction rồi đóng review surface/rating session. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-detail-review-identity-cards.md |
| Language | vi |
| Phase | end |
| Touching | Workflow record, recorded session source boundary và final evidence only. |

Session id: course-detail-review-identity-cards
Session status: open

### RELATED BUGS

| Finding | Evidence | Classification | Route |
|---|---|---|---|
| Connected SurfaceListCard count đã được sửa ngay trong same-boundary; không còn rating seam liên quan. | Source scan, focused tests và localhost closure proof | not-a-bug | None |
| Owed ngoài production boundary | Real displayName/username được route sang backend feature course-review-public-author-r1. | new-boundary | Linked backend feature rồi FE continuation |

### OUTPUTS

| Concept | Result |
|---|---|
| End identity | course-detail-review-identity-cards tại FE baseline 85f4e6663dfdea68bb56eec4956cc681641afe35..worktree. |
| Current proof | Course Detail review tests và connected tests đạt; live có 2 rows, sao size-5, summary/author items-center, 0 icon preview tím. |
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
| Real displayName/username được route sang backend feature course-review-public-author-r1. | Linked backend feature rồi FE continuation |
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
| Purpose | Finalize course-detail-review-identity-cards sau End proof đã được user chốt. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\course-detail-review-identity-cards.md |
| Language | vi |
| Phase | finality |
| Touching | Workflow record và final evidence only; không production correction. |

Session id: course-detail-review-identity-cards
Session status: finalized
Session finalized: course-detail-review-identity-cards
Final diff identity: FE 85f4e6663dfdea68bb56eec4956cc681641afe35..worktree; BE 7acd312a858be7ed58dc847c25ec86d801be17f8..worktree.

### OUTPUTS

| Concept | Result |
|---|---|
| Closure | Session finalized sau current End evidence. |
| Accepted | Toàn bộ feedback cuối cùng và superseding corrections trong record. |
| Routed | Real displayName/username được route sang backend feature course-review-public-author-r1. |
| Continuation | Feedback mới phải mở Fidelity Start mới với Continuation of: course-detail-review-identity-cards. |

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
| Linked owed không bị tuyên bố hoàn thành | Linked backend feature rồi FE continuation |
| Concurrent whole-repo failures vẫn được giữ nguyên | Không làm sai lệch focused proof của session này. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Append feedback vào session đã finalized | Mở linked continuation session | Finality đóng vĩnh viễn session id này. |

### OWED

| Owed | Cleared by |
|---|---|
| Real displayName/username được route sang backend feature course-review-public-author-r1. | Linked backend feature rồi FE continuation |
