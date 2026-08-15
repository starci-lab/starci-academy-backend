<!-- starci-workflow: v2 -->

# Courses runtime projection and i18n fidelity

## start

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
| Repo / branch | D:\Repositories\starci-academy-fe / main; D:\Repositories\starci-academy-backend / mtp |
| Purpose | Khôi phục trang `/vi/courses` khi thiếu message `weeklyChallenge.claimed` và khi Elasticsearch chứa course document không còn course PostgreSQL tương ứng. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\courses-runtime-projection-i18n-20260815-01.md |
| Language | vi |
| Phase | start |
| Touching | Workflow này; FE `src/messages/vi.json`, `src/messages/en.json`; BE `src/modules/bussiness/projections/course-stats/course-stats-projection.service.ts` và focused spec; nếu bằng chứng xác nhận ghost search row thì `src/features/api/core/graphql/queries/courses/courses/courses.handler.ts` và focused spec. |

Session id: courses-runtime-projection-i18n-20260815-01
Session status: open

Binding evidence: lỗi runtime do thầy cung cấp tại `http://localhost:3000/vi/courses`; FE báo `MISSING_MESSAGE weeklyChallenge.claimed`, GraphQL báo FK `fk_course_id_course_stats_projections_courses` tại `courses.data.data[0].enrollmentCount`.

Frozen state: route `/vi/courses`, locale `vi`, canonical origin `http://localhost:3000`, backend `http://localhost:3001/graphql`, dữ liệu local StarCi hiện hành, worktree hiện hành được giữ nguyên ngoài boundary.

### OUTPUTS

| Concept | Result |
|---|---|
| FE message parity | `weeklyChallenge.claimed` phải tồn tại cho cả `vi` và `en`. |
| Projection integrity | Không được tạo projection cho course không tồn tại; ghost search document không được làm hỏng toàn bộ GraphQL response. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/fidel/starci-academy/courses-runtime-projection-i18n-20260815-01.md` | added — mở session và khóa bằng chứng/boundary. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Không có; đây là hai correction nhỏ đã có binding runtime evidence. |

### WARNINGS

| Warning | Impact |
|---|---|
| Elasticsearch có thể đang stale so với PostgreSQL sau reseed | Cần phân biệt repair dữ liệu local với guard đúng trong source. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Nuốt exception và trả `0` vô điều kiện | Xác minh course tồn tại và chặn ghost row tại owner phù hợp | Nuốt lỗi sẽ tiếp tục render khóa học đã bị xóa. |

### OWED

| Owed | Cleared by |
|---|---|
| Focused tests, typecheck và live proof trên `/vi/courses` | Patch trong boundary và gọi lại GraphQL/runtime. |
| User acceptance | Feedback của thầy; session vẫn `open`. |

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
| Repo / branch | D:\Repositories\starci-academy-fe / main; D:\Repositories\starci-academy-backend / mtp |
| Purpose | Ghi correction và live proof cho i18n + ghost course projection. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\courses-runtime-projection-i18n-20260815-01.md |
| Language | vi |
| Phase | feedback |
| Touching | Workflow này; FE `src/messages/vi.json`, `src/messages/en.json`; BE `src/modules/bussiness/projections/course-stats/course-stats-projection.service.ts` + spec, `src/features/api/core/graphql/queries/courses/courses/courses.resolver.ts` + spec. |

Session id: courses-runtime-projection-i18n-20260815-01
Session status: open

### OUTPUTS

| Concept | Result |
|---|---|
| Missing message | `weeklyChallenge.claimed` có bản dịch `vi/en`; Next.js không còn `MISSING_MESSAGE`. |
| Ghost course handling | Elasticsearch rows không tồn tại trong PostgreSQL bị loại trước field resolution. |
| FK integrity | Projection UPSERT chỉ select `courses.id` tồn tại, không thể tạo FK mồ côi. |
| Empty state | Khi PostgreSQL có `0` course, GraphQL trả `success: true`, `count: 0`, `data: []`; `/vi/courses` render empty content. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/fidel/starci-academy/courses-runtime-projection-i18n-20260815-01.md` | modified — append correction và proof. |
| `D:\Repositories\starci-academy-fe\src\messages\vi.json` | modified — thêm `weeklyChallenge.claimed`. |
| `D:\Repositories\starci-academy-fe\src\messages\en.json` | modified — thêm `weeklyChallenge.claimed`. |
| `src/modules/bussiness/projections/course-stats/course-stats-projection.service.ts` | modified — UPSERT projection chỉ từ course thật. |
| `src/modules/bussiness/projections/course-stats/course-stats-projection.service.spec.ts` | added — khóa SQL FK guard. |
| `src/features/api/core/graphql/queries/courses/courses/courses.resolver.ts` | modified — batch-filter stale ES rows bằng PostgreSQL. |
| `src/features/api/core/graphql/queries/courses/courses/courses.resolver.spec.ts` | added — khóa ghost-row filtering/count. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Không có. |

### WARNINGS

| Warning | Impact |
|---|---|
| Local PostgreSQL hiện có `0` course và Elasticsearch mapping/index vẫn stale | UI đúng là empty; muốn lại 5 course cần full reseed/sync riêng, không nên tự chèn hoặc xóa index trong fidelity patch này. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Render ghost course với enrollment `0` | Lọc theo PostgreSQL source of truth | Course đã bị xóa không phải content hợp lệ. |

### OWED

| Owed | Cleared by |
|---|---|
| User acceptance | Feedback của thầy; session vẫn `open` cho tới Fidelity End/Finality. |

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
| Repo / branch | D:\Repositories\starci-academy-fe / main; D:\Repositories\starci-academy-backend / mtp |
| Purpose | Áp dụng correction sau khi chứng minh PostgreSQL có 0 course nhưng Elasticsearch vẫn trả stale course documents. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\courses-runtime-projection-i18n-20260815-01.md |
| Language | vi |
| Phase | feedback |
| Touching | Workflow này; FE `src/messages/vi.json`, `src/messages/en.json`; BE `src/modules/bussiness/projections/course-stats/course-stats-projection.service.ts` + new focused spec, `src/features/api/core/graphql/queries/courses/courses/courses.resolver.ts` + new focused spec. |

Session id: courses-runtime-projection-i18n-20260815-01
Session status: open

### OUTPUTS

| Concept | Result |
|---|---|
| Root cause | PostgreSQL hiện có `0` course trong khi Elasticsearch còn stale documents; GraphQL parent không phải aggregate hợp lệ để tạo FK projection. |
| Correct owner | Resolver lọc batched against PostgreSQL trước khi field resolvers chạy; projection UPSERT cũng chỉ được phép select từ course tồn tại. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/fidel/starci-academy/courses-runtime-projection-i18n-20260815-01.md` | modified — ghi root cause và boundary chính xác. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Không có; correction giữ PostgreSQL là source of truth và không thay đổi product behavior hợp lệ. |

### WARNINGS

| Warning | Impact |
|---|---|
| Local database đang trống | Sau source guard, `/courses` đúng ra phải render empty state cho tới khi reseed. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Chỉ sửa projection trả `0` | Lọc ghost documents trước GraphQL field resolution và thêm SQL FK guard | Course đã bị xóa không được render như course thật. |

### OWED

| Owed | Cleared by |
|---|---|
| Production patch và focused proof | Edit bốn owner/spec backend cùng hai locale files, rồi rerun live query. |
| User acceptance | Feedback của thầy; session vẫn `open`. |

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
| Repo / branch | D:\Repositories\starci-academy-fe / main; D:\Repositories\starci-academy-backend / mtp |
| Purpose | Khôi phục full data 5 course, rebuild Elasticsearch mapping và sửa checksum cho CDN orphan reconcile. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\courses-runtime-projection-i18n-20260815-01.md |
| Language | vi |
| Phase | feedback |
| Touching | Workflow này; runtime seed config tạm thời; `src/modules/integrations/s3/s3-delete.service.ts` + focused spec; verified PostgreSQL, Elasticsearch, MinIO và localhost render. |

Session id: courses-runtime-projection-i18n-20260815-01
Session status: open

### RUNTIME PROOF

| Claim | Evidence |
|---|---|
| PostgreSQL | `courses` có đúng 5 row: `ai-llm-mastery`, `claude-mastery`, `devops-mastery`, `fullstack-mastery`, `system-design-mastery`. |
| Elasticsearch | `courses-en` và `courses-vi` mỗi index có 5 document; `title` là `text`, `title.keyword` là `keyword`; sort ascending trả đủ 5 title. |
| Images | Cả 5 `coverImageUrl` trả HTTP 200; browser xác nhận 5 ảnh complete với `naturalWidth=1920`. |
| GraphQL | Anonymous courses query trả `success: true`, `count: 5`, đúng thứ tự title, không có GraphQL error và mọi cover đều present. |
| Localhost | `/vi/courses` render `5 khóa học`, đủ 5 card, CTA enabled sau loading; không còn empty state hoặc broken image. |
| Reconcile checksum | MinIO multi-delete với `ChecksumAlgorithm.MD5` trả HTTP 200, request id hiện diện và `0` error. |
| Gates | Focused Jest `2/2` pass; focused ESLint pass; TypeScript `tsc --noEmit` pass. |
| Safe default | `.stacks/dev/runtime/config/seed.yaml` đã trả về `enable: false`, `mode: none`, `seed.enabled: false`, `sync.enabled: false`; backend hot-reload và start thành công. |

### OUTPUTS

| Concept | Result |
|---|---|
| Full course recovery | PostgreSQL, Elasticsearch, GraphQL, MinIO và FE localhost cùng phản ánh đúng 5 khóa học với ảnh. |
| Stable title sort | Mapping stale đã được rebuild; `title.keyword` dùng được cho sort ở cả `vi` và `en`. |
| CDN reconcile compatibility | Multi-delete chỉ định MD5 để MinIO không còn dừng orchestration bằng `Missing required header: Content-Md5`. |

### CHANGES

| Tree | Details |
|---|---|
| `.stacks/dev/runtime/config/seed.yaml` | modified temporarily then restored — full seed/sync chỉ bật trong run này và đã tắt lại. |
| `.contexts` | generated ignored runtime seed source — copied full private data snapshot SHA `d5c88750ee882014f1ec37d46a6a4ad2612fb384`. |
| `src/modules/integrations/s3/s3-delete.service.ts` | modified — yêu cầu SDK tính Content-MD5 cho `DeleteObjects`. |
| `src/modules/integrations/s3/s3-delete.service.spec.ts` | added — khóa MD5 checksum và empty-delete guard. |
| `.workflows/fidel/starci-academy/courses-runtime-projection-i18n-20260815-01.md` | modified — appended reseed, mapping, image và reconcile proof. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Không có. |

### WARNINGS

| Warning | Impact |
|---|---|
| Dedicated `DATA_GIT_TOKEN_FILE` hiện trả 401; run dùng authenticated `gh` session để tải snapshot rồi copy vào ignored `.contexts`, không ghi đè token runtime | Lần force reseed sau vẫn cần refresh token riêng hoặc tiếp tục có local `.contexts` hợp lệ. |
| Một số challenge trong source thiếu locale file `en.md` và bị seeder skip có log | Không làm thiếu 5 course/module/image; nguồn challenge cần repair riêng nếu muốn coverage challenge tuyệt đối. |
| Browser còn cảnh báo HeroUI `PressResponder` ở course cards | Không ảnh hưởng data/image recovery; là related FE warning ngoài data boundary. |
| Hai thư mục tải tạm dưới OS temp chưa xóa được qua công cụ do policy chặn recursive delete | Không nằm trong repository hay datastore; có thể xóa thủ công sau khi không còn process giữ file. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Ghi đè runtime data token bằng personal `gh` token | Dùng credential hiện hành chỉ trong process tải snapshot | Không mở rộng quyền persistent token ngoài yêu cầu. |
| Gọi pipeline xanh dù reconcile đã báo thiếu Content-MD5 | Sửa checksum, test và gọi live MinIO proof | Không được che lỗi cuối phase. |

### OWED

| Owed | Cleared by |
|---|---|
| User acceptance | Feedback của thầy; session vẫn `open` tới Fidelity End/Finality. |
| Related HeroUI warning | Một fidelity continuation riêng nếu thầy muốn dọn `PressResponder`. |

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
| Repo / branch | D:\Repositories\starci-academy-fe / main; D:\Repositories\starci-academy-backend / mtp |
| Purpose | Đồng nhất semantic màu discount và giữ savings + price-detail action trên cùng một hàng ở catalog và pricing rail. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\courses-runtime-projection-i18n-20260815-01.md |
| Language | vi |
| Phase | feedback |
| Touching | Workflow này; FE `src/components/contracts/index.ts`, `src/components/blocks/courses/CoursePricingRail/component.tsx`, `src/components/blocks/courses/CoursePricingRail/component.test.tsx`. |

Session id: courses-runtime-projection-i18n-20260815-01
Session status: open

### FROZEN EVIDENCE

| Field | Value |
|---|---|
| Binding instruction | Discount phải dùng một semantic color giữa catalog và detail; `Tiết kiệm …` và `Vì sao giá này?` phải cùng hàng. |
| Route | `http://localhost:3000/vi/courses` list layout; `http://localhost:3000/vi/courses/1ab239c8-ebb5-53ee-b255-dc7839a6b959`. |
| Locale / theme | `vi` / light. |
| Comparison identity | Cùng preview-price payload và cùng `price-note-row` contract trên catalog + detail rail. |
| Baseline defect | Catalog discount dùng `success`, rail dùng `accent`; rail tách savings và detail thành hai sibling dọc trong `course-price-block`. |

### OUTPUTS

| Concept | Result |
|---|---|
| Discount semantics | Catalog, recommended course và pricing rail cùng render discount bằng `Badge tone="success"`. |
| Price explanation seam | `course-price-block` tái sử dụng `price-note-row`; savings và `Vì sao giá này?` là một supporting row `flex-nowrap items-center`. |
| Runtime proof | Catalog có 5/5 success discount badge và 5/5 no-wrap note row; detail rail có một no-wrap note row và `−13%` mang tone `success`. |
| Focused gates | CoursePricingRail Vitest `7/7` pass; focused ESLint pass. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-fe\src\components\contracts\index.ts` | modified — `price-note-row` khóa `flex-nowrap` và `course-price-block` dùng một nested note contract. |
| `D:\Repositories\starci-academy-fe\src\components\blocks\courses\CoursePricingRail\component.tsx` | modified — discount dùng `success`; savings/detail cùng render qua `price-note-row`. |
| `D:\Repositories\starci-academy-fe\src\components\blocks\courses\CoursePricingRail\component.test.tsx` | modified — khóa semantic tone và same-row ownership. |
| `.workflows/fidel/starci-academy/courses-runtime-projection-i18n-20260815-01.md` | modified — append feedback và live proof. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Không có. |

### WARNINGS

| Warning | Impact |
|---|---|
| Full `tsc --noEmit` đang đỏ trên hàng loạt contract/layout do dirty global-search contract work ngoài boundary; filtered output cũng đi qua degraded contract inference | Không dùng full typecheck để tuyên bố patch sạch; focused Vitest compile + ESLint + localhost proof là evidence hiện tại, và lỗi ngoài boundary được giữ nguyên. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Rail discount dùng accent hồng | Discount dùng success semantic giống catalog/recommended cards | Cùng một dữ kiện giá không được đổi nghĩa màu theo surface. |
| Savings và price-detail action là hai sibling dọc | Một `price-note-row` no-wrap | Hai phần là một ý giải thích giá; xuống dòng làm action trông như nội dung độc lập. |

### OWED

| Owed | Cleared by |
|---|---|
| User acceptance | Feedback của thầy; session vẫn `open` tới Fidelity End/Finality. |
| Full TypeScript gate | Hoàn tất hoặc tách work global-search đang làm contract inference toàn repo đỏ, rồi chạy lại `npx tsc --noEmit --pretty false`. |

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
| Repo / branch | D:\Repositories\starci-academy-fe / main; D:\Repositories\starci-academy-backend / mtp |
| Purpose | Sửa CTA arrow placement, giảm độ chật của rail và thay custom disclosure bằng HeroUI v3 Accordion. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\courses-runtime-projection-i18n-20260815-01.md |
| Language | vi |
| Phase | feedback |
| Touching | Workflow này; FE `src/components/contracts/index.ts`, `src/components/blocks/courses/CoursePricingRail/component.tsx` + test, `src/components/leaves/PricingPhaseDisclosure/index.tsx` + test. |

Session id: courses-runtime-projection-i18n-20260815-01
Session status: open

### FROZEN EVIDENCE

| Field | Value |
|---|---|
| Binding instruction | `Đăng ký học` phải có arrow ở cuối; pricing rail cần bớt chật; phase comparison phải tái sử dụng HeroUI Accordion. |
| Route | `http://localhost:3000/vi/courses/1ab239c8-ebb5-53ee-b255-dc7839a6b959`. |
| Viewport / zoom evidence | Desktop light `vi`; screenshot user tại browser zoom `150%`. |
| Vendor evidence | Runtime export của `@heroui/react 3.2.1` có `Accordion` compound API; HeroUI v3 docs xác nhận `Item/Heading/Trigger/Indicator/Panel/Body`. |
| Baseline defect | CTA dùng default leading icon; rail width `w-72`; `PricingPhaseDisclosure` tự dựng native `<details>/<summary>`. |

### OUTPUTS

| Concept | Result |
|---|---|
| CTA direction | `Đăng ký học` dùng `iconPlacement="trailing"`; arrow kết thúc câu và chỉ consequence. |
| Rail measure | Course detail `main-then-rail` tăng riêng rail từ `w-72` lên `w-80`; sibling `content-reader-frame` giữ `w-72`. |
| Phase disclosure | Custom `<details>` bị thay bằng HeroUI v3 `Accordion` compound API; trigger/panel có keyboard và `aria-expanded` do vendor sở hữu. |
| Runtime proof | CTA trailing; Accordion `false → true`; panel hiển thị đủ Tiên phong/Sớm/Tiêu chuẩn; live contract có `w-80`. |
| Focused gates | PricingPhaseDisclosure + CoursePricingRail Vitest `9/9` pass; focused ESLint và `git diff --check` pass. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-fe\src\components\contracts\index.ts` | modified — cho phép `w-80` và nới đúng course-detail rail; không đổi content-reader rail. |
| `D:\Repositories\starci-academy-fe\src\components\blocks\courses\CoursePricingRail\component.tsx` | modified — primary CTA dùng trailing arrow. |
| `D:\Repositories\starci-academy-fe\src\components\blocks\courses\CoursePricingRail\component.test.tsx` | modified — khóa trailing placement và tách CTA ownership khỏi Accordion trigger. |
| `D:\Repositories\starci-academy-fe\src\components\leaves\PricingPhaseDisclosure\index.tsx` | modified — dùng HeroUI v3 Accordion compound components. |
| `D:\Repositories\starci-academy-fe\src\components\leaves\PricingPhaseDisclosure\index.test.tsx` | modified — khóa collapsed/open `aria-expanded` và phase cardinality. |
| `.workflows/fidel/starci-academy/courses-runtime-projection-i18n-20260815-01.md` | modified — append feedback và proof. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Không có. |

### WARNINGS

| Warning | Impact |
|---|---|
| Full `tsc --noEmit` vẫn bị dirty global-search contract work ngoài boundary làm degraded inference | Focused runtime/tests/lint pass; full TypeScript gate vẫn owed như feedback trước. |
| Source comment cũ từng nói HeroUI 3.2.1 không có Accordion | Runtime export và docs hiện chứng minh comment đó stale; leaf pricing đã chuyển sang vendor owner thật. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Arrow đứng trước `Đăng ký học` | Trailing arrow | Arrow biểu thị hướng/consequence nên phải ở cuối CTA. |
| Custom native `<details>/<summary>` | HeroUI v3 Accordion | Repo đã cài vendor primitive đúng semantics, không được dựng lại. |
| Rail course detail `w-72` | `w-80` | Buy-vs-try copy và disclosure bị dồn ở zoom 150%. |
| Nới nhầm `content-reader-frame` sibling trong patch trung gian | Hoàn nguyên sibling `w-72`, chỉ nới `main-then-rail` | Live proof phát hiện wrong owner; không để correction lan sang trang học. |

### OWED

| Owed | Cleared by |
|---|---|
| User acceptance | Feedback của thầy; session vẫn `open` tới Fidelity End/Finality. |
| Full TypeScript gate | Hoàn tất hoặc tách dirty global-search contract work, rồi chạy lại `npx tsc --noEmit --pretty false`. |
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
| Repo / branch | D:\Repositories\starci-academy-fe / main; D:\Repositories\starci-academy-backend / mtp |
| Purpose | Khi course detail đã có tab strip ngữ cảnh, bỏ các route link chữ lặp lại ở primary navbar nhưng giữ brand, tools, tabs và breadcrumb. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\courses-runtime-projection-i18n-20260815-01.md |
| Language | vi |
| Phase | feedback |
| Touching | `D:\Repositories\starci-academy-fe\src\components\layouts\ShellNav\index.tsx`; `D:\Repositories\starci-academy-fe\src\components\layouts\ShellNav\index.test.tsx`; workflow record. |

Session id: courses-runtime-projection-i18n-20260815-01

Session status: open

### FROZEN EVIDENCE

| Field | Value |
|---|---|
| User correction | "với tabs này thì bỏ mấy cái nội dung ở navbars ở trên đi" |
| Route | `http://localhost:3000/vi/courses/1ab239c8-ebb5-53ee-b255-dc7839a6b959` |
| Comparison identity | Course-detail route có `Các phần của khóa học` tablist; primary navbar không lặp lại ba website route labels. |
| Preserved owners | Brand link, search, locale, theme, cart, account, course-detail tabs và breadcrumb. |
| Focused proof | ShellNav connected/pure tests: 2 files, 9/9 tests pass; focused ESLint pass. |
| Live proof | DOM snapshot không còn primary labels `Trang chủ`, `Khóa học`, `Liên hệ`; vẫn có 4 tabs và breadcrumb `Trang chủ / Khóa học / System Design Mastery`. |

### OUTPUTS

| Concept | Result |
|---|---|
| Course-detail navigation hierarchy | Primary shell chỉ giữ brand và tools; page tab strip sở hữu điều hướng ngữ cảnh, breadcrumb tiếp tục sở hữu dấu vết vị trí. |
| Scope guard | Chỉ exact route `/courses/:displayId` ẩn website route labels; catalog và nested learning routes giữ recipe cũ. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-fe\src\components\layouts\ShellNav\index.tsx` | modified — chiếu `routes: []` trên exact course-detail path, không đổi owner của brand/tools/tabs. |
| `D:\Repositories\starci-academy-fe\src\components\layouts\ShellNav\index.test.tsx` | modified — thêm proof course detail ẩn route labels và catalog vẫn giữ đủ ba labels. |
| `D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\courses-runtime-projection-i18n-20260815-01.md` | modified — append feedback và proof vào session đang mở. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | None |

### WARNINGS

| Warning | Impact |
|---|---|
| Frontend worktree có thay đổi không liên quan từ các session khác. | Focused proof chỉ tuyên bố boundary ShellNav hiện tại; không nhận ownership các diff khác. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Lặp `Trang chủ / Khóa học / Liên hệ` trên primary navbar ngay phía trên course-detail tabs. | Giữ brand + tools ở primary row và để tabs làm điều hướng ngữ cảnh. | "với tabs này thì bỏ mấy cái nội dung ở navbars ở trên đi" |

### OWED

| Owed | Cleared by |
|---|---|
| User acceptance cho hierarchy navbar mới. | Thầy xác nhận render course detail đạt. |
| Fidelity End/Finality. | Chạy `$starci-fe-fidelity-end`, rồi `$starci-fe-fidelity-finality` khi thầy muốn đóng session. |

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
| Repo / branch | D:\Repositories\starci-academy-fe / main; D:\Repositories\starci-academy-backend / mtp |
| Purpose | Hoàn nguyên việc ẩn primary navbar copy và bỏ đúng icon khỏi bốn course-detail tabs. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\courses-runtime-projection-i18n-20260815-01.md |
| Language | vi |
| Phase | feedback |
| Touching | Workflow này; FE `src/components/layouts/ShellNav/index.tsx` + connected test để hoàn nguyên; `src/components/pages/CourseDetailPage/component.tsx` + test để bỏ icon. |

Session id: courses-runtime-projection-i18n-20260815-01
Session status: open

### FROZEN EVIDENCE

| Field | Value |
|---|---|
| User correction | `nhầm không phải bỏ nội dung, mà là bỏ icon` |
| Route | `http://localhost:3000/vi/courses/1ab239c8-ebb5-53ee-b255-dc7839a6b959` |
| Correct comparison identity | Primary navbar vẫn có `Trang chủ / Khóa học / Liên hệ`; 4 course-detail tabs giữ label nhưng không render leading SVG. |
| Focused proof | CourseDetailPage + ShellNav tests: 3 files, 12/12 pass; focused ESLint pass. |
| Live proof | DOM snapshot có ba primary route links và bốn text tabs; `[role="tab"] svg` count bằng `0`. |

### OUTPUTS

| Concept | Result |
|---|---|
| Corrected ownership | Website navigation copy thuộc primary navbar và được giữ nguyên; decorative icons của course-detail tab labels bị bỏ. |
| Course tabs | `Khám phá khóa học`, `Nội dung`, `Kết quả học viên`, `FAQ` render text-only, vẫn giữ selection và tab semantics. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-fe\src\components\pages\CourseDetailPage\component.tsx` | modified — bỏ `icon` khỏi bốn `ChoiceTabs` rows của course detail. |
| `D:\Repositories\starci-academy-fe\src\components\pages\CourseDetailPage\component.test.tsx` | modified — khóa cả bốn tabs không chứa SVG. |
| `D:\Repositories\starci-academy-fe\src\components\layouts\ShellNav\index.tsx` | restored — hoàn nguyên điều kiện ẩn route labels; giữ nguyên các thay đổi global-search có trước. |
| `D:\Repositories\starci-academy-fe\src\components\layouts\ShellNav\index.test.tsx` | restored — bỏ hai assertions dựa trên cách hiểu sai; giữ nguyên connected-search tests có trước. |
| `D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\courses-runtime-projection-i18n-20260815-01.md` | modified — append correction và live proof. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Không có. |

### WARNINGS

| Warning | Impact |
|---|---|
| Frontend worktree có thay đổi không liên quan từ các session khác. | Focused proof chỉ nhận ownership CourseDetail tab icon delta và hoàn nguyên chính xác patch ShellNav vừa làm. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Bỏ nội dung `Trang chủ / Khóa học / Liên hệ` khỏi primary navbar. | Giữ nguyên nội dung navbar; chỉ bỏ icon khỏi course-detail tabs. | `nhầm không phải bỏ nội dung, mà là bỏ icon` |

### OWED

| Owed | Cleared by |
|---|---|
| User acceptance cho text-only course tabs. | Thầy xác nhận render đạt. |
| Fidelity End/Finality. | Chạy `$starci-fe-fidelity-end`, rồi `$starci-fe-fidelity-finality` khi thầy muốn đóng session. |
