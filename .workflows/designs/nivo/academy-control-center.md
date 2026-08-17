<!-- starci-workflow: v2 -->
# Nivo Academy control center

## plan r1

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | nivo |
| Repo / branch | D:\Repositories\nivo-fe (`main`); D:\Repositories\nivo-backend (`main`); Source D:\Repositories\starci-academy-backend (`mtp`) |
| Purpose | Chọn hierarchy cho dashboard quản lý Học viện chuyên gia gồm domain riêng, Google OAuth và CRM học viên. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\nivo\academy-control-center.md |
| Language | vi |
| Phase | plan |
| Touching | D:\Repositories\starci-academy-backend\.workflows\designs\nivo\academy-control-center.md và D:\Repositories\starci-academy-backend\.workflows\.previews\designs\nivo\academy-control-center\r1\index.html |

### MODE

| Mode | Evidence | Consequence |
|---|---|---|
| Creative | Người dùng yêu cầu xây dashboard mới; không nêu màn legacy cần giữ nguyên. | Giữ product truth, canon và shell Nivo; cho phép thay đổi hierarchy, disclosure và CTA moment. |

### PRODUCT BRIEF

| Field | Decision |
|---|---|
| User | Chủ Học viện chuyên gia đã provision Template App và cần vận hành thương hiệu, đăng nhập, học viên và khách quan tâm. |
| Page thesis | Trang giúp chủ học viện đưa sản phẩm vào vận hành và chăm sóc đúng người bằng cách làm việc đang chặn học viên hoặc cần xử lý hôm nay dễ thấy nhất. |
| Primary action | Phụ thuộc direction: hoàn tất bước đang chặn, xử lý học viên cần chú ý, hoặc chọn nhịp Tăng trưởng/Hệ thống. |
| Supporting actions | Gắn domain, cấu hình Google OAuth, xem học viên, cập nhật lead, cấp/revoke course access, mở student detail. |
| Information order | Readiness/ưu tiên hiện tại → hành động kiếm giá trị → CRM detail → cấu hình ít dùng → trạng thái kỹ thuật chi tiết. |
| States | first-load, empty, refused, partial, pending save, saved-not-live, verified/rejected/unreachable, DNS pending/live, narrow viewport, signed-out. |
| Anti-goals | Không biến dashboard thành Kubernetes console; không trả secret về browser; không bịa activity, count, pagination hay health mà API không có. |

### EVIDENCE

| Claim | Best-belief source | Consequence |
|---|---|---|
| Học viện là Template App, không phải AgentOS sibling. | `.workflows/designs/nivo/provisioning-flows.md` và route `apps/[siteId]/provisioning`. | Dashboard nằm trong resource Học viện dưới Apps, không thành rail product độc lập. |
| Domain có trạng thái bình thường `pending`: domain, target, dnsReady, delivery, detail. | `academy-settings.graphql-types.ts`, `set-academy-custom-domain`. | UI tách “đã lưu”, “DNS đã trỏ” và “đang phục vụ”; không dùng một tick hai trạng thái. |
| Credential hiện tại là write-only và có delivery/verification. | `AcademyCredentialStatusType`, `SaveAcademyCredentialInput`, `myAcademySettings`. | Sau lưu chỉ hiển thị hint, syncedAt, verification, reason, verifiedAt; không có nút đọc lại secret. |
| Google OAuth theo từng Academy chưa thuộc credential contract hiện hành. | `ALLOWED_ACADEMY_CREDENTIAL_KEYS` chỉ có PayOS, SePay và SMTP; expert app dùng shared Keycloak client. | Mọi direction ghi Google OAuth là contract mới cần Backend Feature; preview không tuyên bố đã live. |
| CRM lead đã có list, trạng thái, note và draft reply. | `myExpertSiteLeads`, `updateExpertSiteLead`, `draftLeadReply`. | Có pipeline khách quan tâm khả thi mà không cần bịa entity CRM mới. |
| CRM học viên đã có admin members CRUD, role/status và course access. | `members`, `createMember`, `updateMember`, `setMemberStatus`, `grantCourseAccess`, `revokeCourseAccess`. | Danh sách và hồ sơ học viên có hành động thật; destructive actions cần confirm ở Review. |
| Student detail và funnel đã có aggregate thật. | `studentDetail`, `completionFunnel`, `revenueSeries`. | Có thể hiển thị progress/order/funnel; count/activity trong preview vẫn ghi fixture nếu API chưa chứng minh. |
| Console hiện dùng page/block/composite/contract tree và sidebar shell. | `AppsPage/component.tsx`, `packages/ui/src/contracts/index.ts`. | Apply phải dùng page twins, domain blocks và closed composites; không viết raw page chứa toàn bộ UI. |

### REUSE INVENTORY

| Candidate | Why match | Behavior/state match | Verdict |
|---|---|---|---|
| Console shell `sidebar-then-body-app` | Giữ navigation Nivo và routed body ổn định. | Match desktop/narrow shell. | REUSE |
| `titled-section-stack-page` | Một page title và các domain section độc lập. | Match direction A/B; loading/refusal tách theo block. | REUSE |
| `label-row-over-card`, `SurfaceCard` | Section có subject và body riêng. | Match domain, OAuth và CRM summaries. | REUSE |
| `ChoiceTabs` | Direction C có local choice Tăng trưởng/Hệ thống. | `primary`, vì là local parameter trong một owner. | REUSE |
| `Badge`, `Text`, `Heading`, `Button`, `Input` leaves | Vocabulary đã có. | Match states và actions. | REUSE |
| Student priority table | Chưa có closed shape tương ứng trong inventory hiện tại. | Cần responsive rows, progress, state và one action. | NEW contract/branch; chỉ extract composite khi có consumer thứ hai. |
| Academy readiness journey | Có `horizontal-lifecycle-run` và `LifecycleStep` từ provisioning. | Labels/states thay đổi theo Academy settings. | REUSE contract/composite; NEW domain block. |
| Google OAuth settings block | Không có backend owner/allowlist cho tenant-specific Google credential. | UI shape khả thi nhưng request chưa tồn tại. | NEW FE block sau một Backend Feature được duyệt. |

### DIRECTIONS

| ID | Direction | Causal sentence | Structural bet | State handling | Status |
|---|---|---|---|---|---|
| A | Hành trình vận hành | Vì domain và OAuth có pending state bình thường trước khi CRM tạo giá trị, direction này làm readiness journey dẫn đầu để chủ học viện biết chính xác việc tiếp theo. | Journey ngang → việc cần làm → học viên cần chú ý. | Pending DNS/OAuth đứng trong journey; CRM vẫn hiện partial. | Chờ chọn |
| B | CRM dẫn đầu | Vì công việc lặp lại hằng ngày là chăm sóc học viên, direction này để CRM làm home và chỉ nâng cấu hình thành banner khi nó chặn trải nghiệm. | CRM list/detail dẫn đầu; setup là cảnh báo có điều kiện. | Empty CRM có invite CTA; setup failure không thay thế list. | Chờ chọn |
| C | Hai chế độ | Vì growth work và system settings có tần suất/rủi ro khác nhau, direction này tách chúng thành local mode để giảm nhiễu nhưng vẫn trong một resource. | ChoiceTabs Tăng trưởng/Hệ thống; mỗi mode có block tree riêng. | Mỗi mode tự load/refuse; tab giữ selection cục bộ. | Chờ chọn |

### INTERACTION CONSEQUENCE

| Interaction | Trigger | Product owner | Request / route | Visual states | Pending | Success | Failure | Persistence / shared effect | Evidence |
|---|---|---|---|---|---|---|---|---|---|
| Chuyển direction preview | Click tab A/B/C | Disposable preview | local DOM state | selected/unselected | N/A, local synchronous | Hiện đúng direction | N/A | Không persistence | `index.html` script |
| Mở resource section | Click sidebar/tab/CTA | Academy control-center page | proposed nested route or local tab | current/idle | route loading | Đúng section được mount | route error boundary | URL/local selection | Console shell + `ChoiceTabs` canon |
| Lưu domain | Submit domain | Academy domain block | `setAcademyCustomDomain(input)` | editing/submitting/stored/pending/live/refused | Disable form, keep value | Render returned target/dnsReady/delivery/detail | Field/domain error at owner | `myAcademySettings` revalidation; affects public host after deploy | Existing GraphQL types/service |
| Kiểm tra DNS | Recheck/refresh | Academy domain block | `myAcademySettings` today; dedicated probe only if backend adds one | checking/pending/live | Keep last truthful state | Refresh dnsReady/delivery/detail | Preserve last state + retry | Shared settings snapshot | Existing settings query |
| Lưu Google OAuth | Submit client id + secret | Academy OAuth block | NEW backend feature required | editing/submitting/stored/verifying/verified/rejected/unreachable | Secret remains only in input until submit | Clear secret input, show hint + verification | Field/provider error; never echo value | New encrypted store → pod/Keycloak delivery | Current allowlist proves gap |
| Mở hồ sơ học viên | Click student row/action | Student CRM block | `studentDetail(memberId)` or detail route | idle/loading/ready/refused | Keep selected identity skeleton | Render identity, orders, course progress | Owner-level refusal/retry | Route identity shareable | Existing query |
| Thêm/sửa học viên | Submit member form | Member CRM block | `createMember` / `updateMember` | editing/submitting/saved/failed | Disable exact submit | Refresh members list, select saved row | Field/domain error in form | Academy DB | Existing mutations |
| Đổi trạng thái/quyền học | Confirm action | Student detail block | `setMemberStatus`, `grantCourseAccess`, `revokeCourseAccess` | confirm/pending/saved/refused | Lock targeted action only | Refresh member/detail | Preserve previous state + explain refusal | Academy DB and course access | Existing mutations |
| Cập nhật lead | Change stage/note | Lead CRM block | `updateExpertSiteLead` | editing/saving/saved/failed | Target row pending | Returned status/note replaces row | Row-level retry | Owner-scoped lead list and Socket.IO if available | Existing core operations |
| Mở public Academy | Click header CTA | Academy resource page | external custom/default host | enabled/disabled | N/A | New tab opens serving domain | Explain domain not live | Separate browser context | Existing domain/deployment truth |

### ACCEPTANCE MATRIX

| State | Required render |
|---|---|
| First load | Page shell remains; every block owns its own skeleton. |
| No domain | Show target before save and one field to attach; no error styling. |
| DNS pending | Stored domain + exact CNAME target + detail + recheck path. |
| Domain live | Serving state and open-public-site action. |
| OAuth absent | Client ID/secret entry with redirect URI and security note. |
| OAuth stored | No secret value; only hint, sync and verification states. |
| Provider unreachable | Not rendered as rejected; show reason and last verified time. |
| No students/leads | Honest empty state with invite/create action; no invented zero KPI unless API owns total. |
| Partial queries | CRM remains visible when settings fail and vice versa. |
| Narrow viewport | Journey scrolls/wraps as whole steps; table becomes row/detail flow without horizontal page overflow. |
| Signed out/forbidden | Shell routes to auth or owner block renders permission refusal; no stale private data. |

### PREVIEW TRACKING

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| Academy control center r1 | `http://127.0.0.1:8080/` | `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\nivo\academy-control-center\r1\index.html` | `E19440EE01677CF56024999D870DB063C6A39C95605A63C8E78B08C12FCD4333` | Đã serve và browser-verify. |

### DIRECTION TRACKING

| Direction | Tab | Status |
|---|---|---|
| A — Hành trình vận hành | `A · Hành trình vận hành` | Chờ chọn |
| B — CRM dẫn đầu | `B · CRM dẫn đầu` | Chờ chọn |
| C — Hai chế độ | `C · Hai chế độ` | Chờ chọn |

### PREVIEW PROOF

| Proof | Result |
|---|---|
| Tab switching | Browser click A/B/C; heading riêng của cả ba đều visible. Direction C chuyển tiếp Tăng trưởng/Hệ thống và render Google OAuth block. |
| Desktop | `innerWidth=1280`, `scrollWidth=1265`; không tràn ngang viewport. |
| Narrow | Viewport 390×844: cả B/C visible; sau sửa `bodyWidth=375`, `scrollWidth=375`, không tràn ngang. Viewport đã reset. |
| Security copy | Google secret được mô tả write-only; stored state chỉ hint/sync/verification; fixture và backend contract gap đều có nhãn. |

### OUTPUTS

| Concept | Result |
|---|---|
| Academy control center brief | Đã khóa product truth, security boundary, state matrix và ba hierarchy khả thi. |
| Google OAuth verdict | Tenant-specific Google OAuth là backend contract gap; không được Apply như FE-only credential form. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\nivo\academy-control-center.md` | `added` — Design Plan r1. |
| `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\nivo\academy-control-center\r1\index.html` | `added` — một preview ba tab dùng một lần. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Direction nào sang Design Review? | A — Hành trình vận hành (recommended); B — CRM dẫn đầu; C — Hai chế độ; hoặc nêu phần muốn ghép. |

### WARNINGS

| Warning | Impact |
|---|---|
| Google OAuth client/secret theo từng Academy chưa có trong `ALLOWED_ACADEMY_CREDENTIAL_KEYS` và delivery owner hiện tại dùng shared Keycloak. | Apply FE trước backend sẽ tạo form không có request hợp lệ hoặc làm sai security ownership. |
| Preview dùng dữ liệu có nhãn fixture để so hierarchy. | Review phải loại mọi count/activity không được query thật chứng minh. |
| Nivo FE và BE đều đang có unrelated worktree changes. | Review/Apply phải freeze exact boundary và giữ nguyên các thay đổi đó. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| None | None | None |

### OWED

| Owed | Cleared by |
|---|---|
| Backend contract cho tenant Google OAuth | Chạy `starci-be-feature-plan` sau khi direction được chọn và Review khóa ownership. |
| Production component/props boundary | `starci-fe-design-review` trên direction được chọn. |

## plan r2

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | nivo |
| Repo / branch | D:\Repositories\nivo-fe (`main`); D:\Repositories\nivo-backend (`main`); Source D:\Repositories\starci-academy-backend (`mtp`) |
| Purpose | Mở rộng Academy control center thành trung tâm thiết lập nhiều provider gồm domain, đăng nhập, mail, thanh toán, Zalo và tracking. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\nivo\academy-control-center.md |
| Language | vi |
| Phase | plan |
| Touching | Workflow này và D:\Repositories\starci-academy-backend\.workflows\.previews\designs\nivo\academy-control-center\r1\index.html |

### FEEDBACK

| User correction | Revision consequence |
|---|---|
| “nhiều thứ á, Zalo, setup nhiều thứ, Google OAuth, mail...” | Không đóng settings vào hai card domain/OAuth. Thêm một Integration Center theo provider family và đưa readiness của kết nối vào cả ba direction. |

### PROVIDER CAPABILITY MAP

| Provider family | Current business evidence | Plan verdict | Customer-facing state |
|---|---|---|---|
| Custom domain | `setAcademyCustomDomain`, `myAcademySettings.customDomain` | REUSE | none, stored, awaiting DNS, live, refused |
| Email | Academy allowlist có `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | REUSE/EXTEND FE | incomplete, delivered, verified, rejected, unreachable |
| Payment | Academy allowlist có PayOS và SePay key sets | REUSE/EXTEND FE | incomplete, delivered, verified, rejected, unreachable |
| Google Login | Expert app dùng shared Keycloak; Academy allowlist chưa có tenant Google key | NEW Backend Feature | absent, saving, delivered, verified, rejected, unreachable |
| Zalo OA | Zalo credential/channel hiện thuộc AgentOS pod/channel owner | NEW Academy Backend Feature | absent, authorizing, connected, expired, webhook failed |
| Analytics | Chưa thấy Academy owner cho GA4/Meta Pixel và consent | NEW Backend Feature hoặc defer | absent, configured, consent-blocked, active |
| Webhook/automation | Chưa có Academy customer webhook subscription contract được chứng minh | NEW Backend Feature hoặc defer | absent, signing secret shown once, active, failing |

### INTEGRATION INFORMATION ARCHITECTURE

| Layer | Contents | Rule |
|---|---|---|
| Readiness | Chỉ các kết nối đang chặn launch/campaign: domain, login, mail. | Hiện trong Overview; không biến mọi provider thành cảnh báo. |
| Integration Center | Identity, Communication, Commerce, Analytics/Automation. | Mỗi provider là một block owner; không tạo generic key/value form. |
| Provider detail | Setup guide, redirect/webhook URI, write-only credentials, verification and last check. | Secret không được seed lại; callback URL có nút copy; save/recheck là hai consequences khác nhau. |
| CRM usage | Học viên/lead cho biết kênh nào đang dùng được. | Không hiển thị Zalo campaign CTA trước khi Zalo Academy contract live. |

### INTERACTION CONSEQUENCE

| Interaction | Trigger | Product owner | Request / route | Visual states | Pending | Success | Failure | Persistence / shared effect | Evidence |
|---|---|---|---|---|---|---|---|---|---|
| Mở Integration Center | Overview warning/rail/action | Academy resource page | proposed `/apps/[siteId]/integrations` | current/idle | route loading | Provider groups visible | route refusal | URL shareable | Console route grammar |
| Lưu SMTP/PayOS/SePay field set | Provider detail submit | Academy credential block | Existing `saveAcademyCredential` per key; Review may require bounded batch owner | editing/saving/partial/delivered/verified | Exact field/set locked | Clear secret inputs, show status/hint | Preserve per-field outcomes and explain partial delivery | Existing credential query/recheck | Academy settings operations |
| Kết nối Zalo OA | Start provider authorization/setup | NEW Academy Zalo block | NEW backend feature, not AgentOS `connect-channel` | absent/authorizing/connected/expired/failed | Keep callback guidance | Show OA identity and webhook health | Retry/re-authorize without leaking token | Academy-owned credential + channel state | AgentOS owner mismatch proves gap |
| Lưu analytics | Submit measurement id/pixel | NEW analytics block | NEW public config + consent contract | absent/saving/configured/blocked | Targeted submit pending | Public site receives safe identifier | Explain consent/provider error | Academy public config | No current owner found |
| Recheck all | Click Integration Center action | Integration summary block | Existing Academy credential recheck plus future provider-specific probes | checking/partial/settled | Keep prior snapshot | Replace only returned provider verdicts | Preserve stale verdict with age and reason | Shared integration summary | Existing `recheckAcademyCredentials` semantics |

### PREVIEW TRACKING

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| Academy control center r2 | `http://127.0.0.1:8080/` | `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\nivo\academy-control-center\r1\index.html` | `BD68EA6C3EF3ED4546F12BCFD4E6865CDDC45DADD2A45BEC9B29983C9C17B164` | Đã serve và browser-verify. |

| Direction | Tab | Status |
|---|---|---|
| A — Hành trình vận hành | `A · Hành trình vận hành` | Chờ chọn; journey có bước “Kết nối vận hành”, setup list thêm email và payment/Zalo. |
| B — CRM dẫn đầu | `B · CRM dẫn đầu` | Chờ chọn; CRM giữ vị trí đầu, warning tổng hợp ba connection blockers. |
| C — Hai chế độ | `C · Hai chế độ` | Chờ chọn; System mode trở thành Integration Center sáu provider cards. |

### PREVIEW PROOF

| Proof | Result |
|---|---|
| Direction A | `Thiết lập email` visible; journey và setup list chứa domain, Google, email, payment/Zalo. |
| Direction B | Warning “3 kết nối chưa sẵn sàng cho chiến dịch tiếp theo” visible; CRM vẫn là main hierarchy. |
| Direction C | System mode render heading `Trung tâm kết nối` và đúng 6 provider cards. |
| Narrow | Viewport 390×844: Direction C/System visible; `bodyWidth=375`, `scrollWidth=375`, không tràn ngang; viewport đã reset. |

### OUTPUTS

| Concept | Result |
|---|---|
| Integration Center | Settings được tổ chức theo provider family và trạng thái thật, không còn chỉ domain + Google. |
| Capability boundary | Domain, SMTP, PayOS, SePay dùng contract hiện có; Google Login, Zalo OA, analytics và webhook cần backend owner riêng trước Apply. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\nivo\academy-control-center.md` | `modified` — appended Plan r2 scope and provider map. |
| `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\nivo\academy-control-center\r1\index.html` | `modified` — expanded all directions with multi-provider setup and Integration Center. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Chọn hierarchy sau khi đã mở rộng provider | A — journey dẫn tới Integration Center; B — CRM home + conditional connection alert; **C — Tăng trưởng/Hệ thống với Integration Center đầy đủ (recommended cho scope mới)**; hoặc ghép A journey phía trên + C System mode. |

### WARNINGS

| Warning | Impact |
|---|---|
| Zalo hiện có source mạnh nhưng thuộc AgentOS, không thuộc Academy. | Dùng lại mutation/credential owner sẽ sai authorization, pod delivery và product meaning. |
| Google OAuth tenant-specific, analytics và webhook chưa có Academy business owner. | Design Review phải route từng capability sang Backend Feature Plan; FE không được render chúng như đã connected. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Dashboard chỉ có domain + Google OAuth | Multi-provider Integration Center | Người dùng yêu cầu setup nhiều thứ, gồm Zalo và mail. |

### OWED

| Owed | Cleared by |
|---|---|
| Exact backend feature boundaries | Chọn direction rồi chạy `starci-fe-design-review`; route Google/Zalo/analytics/webhook sang `starci-be-feature-plan`. |

## plan r3

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | nivo |
| Repo / branch | D:\Repositories\nivo-fe (`main`); D:\Repositories\nivo-backend (`main`); Source D:\Repositories\starci-academy-backend (`mtp`) |
| Purpose | Ghi nhận lựa chọn Direction C và bàn giao hierarchy đã chọn sang Design Review. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\nivo\academy-control-center.md |
| Language | vi |
| Phase | plan |
| Touching | Chỉ workflow này; preview r2 giữ nguyên làm evidence. |

### SELECTION

| Field | Decision |
|---|---|
| Selected direction | C — Hai chế độ |
| Selection evidence | Người dùng trả lời “C”. |
| Page thesis | Một Academy control center có hai nhịp: `Tăng trưởng` cho CRM hằng ngày và `Hệ thống` cho domain/provider integrations ít đổi nhưng rủi ro cao. |
| Primary action | Trong `Tăng trưởng`: xử lý học viên/lead cần chú ý. Trong `Hệ thống`: hoàn tất hoặc sửa provider đang chặn vận hành. |
| Navigation ownership | Hai mode là local `ChoiceTabs` trong Academy resource owner, không thành hai sản phẩm hoặc hai global sidebar groups. |
| Integration Center | Domain, SMTP, PayOS/SePay dùng contract hiện có; Google Login, Zalo OA, Analytics và Webhook giữ nhãn capability mới cho tới khi Backend Feature được duyệt. |

### PREVIEW TRACKING

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| Academy control center r2 | `http://127.0.0.1:8080/` | `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\nivo\academy-control-center\r1\index.html` | `BD68EA6C3EF3ED4546F12BCFD4E6865CDDC45DADD2A45BEC9B29983C9C17B164` | Direction C đã chọn; browser proof giữ nguyên. |

| Direction | Tab | Status |
|---|---|---|
| A — Hành trình vận hành | `A · Hành trình vận hành` | Không chọn. |
| B — CRM dẫn đầu | `B · CRM dẫn đầu` | Không chọn. |
| C — Hai chế độ | `C · Hai chế độ` | Đã chọn. |

### REVIEW HANDOFF

| Review must freeze | Evidence |
|---|---|
| Exact Academy resource route and shell placement | Existing Apps/Template App hierarchy and Console shell. |
| Page/layout/block/composite/contract tree for both modes | Direction C preview plus current contract registry. |
| Public props, action owners and every call site | Existing Academy settings hooks/operations plus backend feature gaps. |
| State unions per provider | Domain and credential GraphQL types; new providers must not borrow AgentOS states. |
| Backend split | Existing domain/SMTP/payment can stay in FE boundary; Google/Zalo/Analytics/Webhook route to separate Backend Feature Plan. |

### OUTPUTS

| Concept | Result |
|---|---|
| Selected direction | C — Hai chế độ, with CRM growth work separated from system integrations inside one Academy resource. |
| Review candidate | Direction C r2 preview and provider capability map are ready for `starci-fe-design-review`. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\nivo\academy-control-center.md` | `modified` — appended selected Direction C and Review handoff. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | None |

### WARNINGS

| Warning | Impact |
|---|---|
| Selection C approves hierarchy, not missing backend capabilities. | Review must not place Google/Zalo/Analytics/Webhook inside FE Apply until their backend contracts are separately approved. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| A — Hành trình vận hành | C — Hai chế độ | Người dùng chọn C. |
| B — CRM dẫn đầu | C — Hai chế độ | Người dùng chọn C. |

### OWED

| Owed | Cleared by |
|---|---|
| Freeze exact component and props deltas | Run `starci-fe-design-review` on selected Direction C. |
| Design missing provider contracts | Route Google Login, Zalo OA, Analytics and Webhook through `starci-be-feature-plan`. |

## review r1

Candidate revision: `nivo-academy-control-center-r1`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | nivo |
| Repo / branch | D:\Repositories\nivo-fe (`main`); D:\Repositories\nivo-backend (`main`); Source D:\Repositories\starci-academy-backend (`mtp`) |
| Purpose | Thử phá Direction C bằng source thật rồi khóa cây owner, public interface, trạng thái và ranh giới triển khai cho Academy control center. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\nivo\academy-control-center.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ D:\Repositories\starci-academy-backend\.workflows\designs\nivo\academy-control-center.md |

### CRITIQUE

| Claim | Failure sought | Evidence | Verdict | Smallest repair |
|---|---|---|---|---|
| Hai mode `Tăng trưởng` / `Hệ thống` cùng nằm trong một Academy resource. | Mode biến thành global navigation hoặc hai sản phẩm giả. | User chọn C; `ChoiceTabs` canon phân loại local parameter là `primary`; Academy là Template App dưới `/apps`. | KEEP | Giữ một route `/apps/[siteId]`, selection local, không thêm rail item. |
| Page có thể tự fetch CRM, settings và analytics rồi truyền xuống. | Một request chậm giữ toàn page; page trở thành data layer. | `page.md` PAGE-3/PAGE-4; source `AgentOSWorkspacePage` đã compose domain blocks. | REJECT | Page chỉ sở hữu session, `siteId` và mode; bốn block tự fetch và tự settle state. |
| Dùng `myAcademySettings` hiện tại cho route có `siteId`. | Tài khoản có nhiều Academy nhưng query không nhận site ID, nên route có thể đọc/sửa sai resource hoặc bị từ chối. | Resolver ghi rõ `myAcademySettings` takes no arguments; `AppsPage` và schema cho phép nhiều `myExpertSites`. | REVISE | Backend contract bắt buộc site-scoped cho settings, students, growth và integrations trước live Apply. |
| Tái dùng `agentos-workspace-control-center` cho Academy vì class/slot giống nhau. | Registry key nói dối về product owner ở consumer thứ hai. | CONTRACT-5/GRAPH-2; live key name và `why` chỉ nói AgentOS workspace. | REVISE | Đổi key thành `tabbed-control-center-page`, migrate AgentOS và dùng cho Academy. |
| Tạo một `AcademyIntegrationCard` mới giống `ApplicationLaunchCard`. | Hai composite cùng closed shape, khác tên miền theo consumer đầu tiên. | Live `ApplicationLaunchCard` đã có identity/state/detail/action đúng shape; COMPOSITE-2/7. | REVISE | Rename/neutralize thành `StatusActionCard`; migrate AgentOS và dùng cho provider cards. |
| Dùng một generic key/value form cho mọi provider. | Mất field semantics, callback flow và security boundary; Zalo OAuth bị giả thành secret form. | Provider map r2; current Academy allowlist chỉ có SMTP/PayOS/SePay; Zalo hiện thuộc AgentOS. | REJECT | `AcademyIntegrationCenter` dùng discriminated provider state và provider-specific form/action recipes nội bộ. |
| Hiển thị KPI/count từ chiều dài list đang tải. | Con số trông như total nhưng API chỉ trả page/list hiện có. | `console.ts` ghi rõ response không có total/cursor; BLOCK-1 cấm figure bịa. | REJECT | Growth summary chỉ dùng backend aggregate `revenueSeries`/`completionFunnel`; CRM list không tự tuyên bố total. |

### SELECTION VERDICT

| Field | Decision |
|---|---|
| Winner | Direction C, đã sửa thành một site-scoped Academy control center với hai local modes. |
| Why it wins | Tách việc hằng ngày (CRM/growth) khỏi cấu hình rủi ro cao (system) mà không tạo thêm product navigation; mỗi block vẫn load độc lập. |
| Nearest rival | A — journey-led. |
| Why rival loses | Readiness journey luôn đứng đầu sẽ đẩy CRM xuống dưới ngay cả khi domain/login/mail đã ổn; C chỉ nâng blocker lên đúng mode Hệ thống và giữ công việc hằng ngày ở Tăng trưởng. |
| Scope correction | Google Login, Zalo OA, Analytics và Webhook không được paint là live trước khi backend site-scoped contract tồn tại. |

### INTERACTION CONSEQUENCE

| Interaction | Trigger | Product owner | Request / route | Visual states | Pending | Success | Failure | Persistence / shared effect | Evidence |
|---|---|---|---|---|---|---|---|---|---|
| Chuyển mode | `ChoiceTabs` press | `AcademyControlCenterPage` | Local state `growth \| system`; route giữ `/apps/[siteId]` | resting, hover/focus, selected, selected-hover/focus | N/A, synchronous | Chỉ tree của mode được mount; title/resource giữ nguyên | N/A | Reset về `growth` sau reload; không có shared effect | User chọn C; ChoiceTabs ownership table |
| Mở public Academy | Header button | `AcademyControlCenterPage` | `window.open(publicUrl, "_blank", "noopener,noreferrer")` qua leaf owner | disabled khi chưa live; enabled/hover/focus khi live | N/A | Mở đúng custom/default host | Popup blocked giữ page nguyên và có refusal copy | Không đổi state Academy | `ExpertSiteRow`, domain delivery truth |
| Mở học viên | Row action | `AcademyStudentCrm` | `myAcademyStudentDetail(siteId, memberId)` | idle, selected, detail-loading, detail-ready, detail-refused | Khóa đúng row; list không biến mất | Detail progress/orders/access hiện dưới list | Giữ list và selected identity; detail có retry | Selection local; mutation revalidates detail + list | Existing `studentDetail`; new site-scoped bridge required |
| Đổi trạng thái/cấp quyền | Confirmed action | `AcademyStudentCrm` | `setAcademyMemberStatus`, `grantAcademyCourseAccess`, `revokeAcademyCourseAccess` | confirm, pending-target, saved, refused | Chỉ target action locked | Returned member/detail replaces local truth | Previous value remains; refusal beside action | Academy app DB; list/detail revalidated | Existing expert mutations; Nivo owner bridge required |
| Mở lead | Row action | `AcademyLeadPipeline` | Existing `myExpertSiteLeads(siteId, limit, offset)` | idle, selected | N/A | Lead note/stage/actions visible | Owner refusal; list remains | Selection local | Existing site-scoped query |
| Cập nhật lead | Save stage/note | `AcademyLeadPipeline` | Existing `updateExpertSiteLead(input)` | editing, saving-target, saved, refused | Chỉ selected lead locked | Returned lead replaces row/detail | Previous row remains; retry shown | Core lead record | Existing mutation ownership checks |
| Chọn provider | Card action | `AcademyIntegrationCenter` | Local provider selection | idle, selected, form-ready | N/A | Provider-specific detail appears beneath card grid | N/A | Selection local | Direction C preview; no overlay mechanics needed |
| Lưu domain | Provider form submit | `AcademyIntegrationCenter` | `setAcademyCustomDomain(siteId, domain)` | editing, saving, stored, awaiting-dns, live, refused | Exact submit pending; value stays | Returned target/dns/delivery replaces card/detail | Keep entered value and prior truthful state | Site-scoped settings snapshot revalidated | Existing mutation must gain explicit owned `siteId` |
| Lưu SMTP/PayOS/SePay | Provider form submit | `AcademyIntegrationCenter` | Site-scoped credential mutations with provider-specific fields | editing, saving, partial, delivered, verified, rejected, unreachable | Exact provider locked | Clear secret fields; show hint/sync/verification only | Per-field/provider refusal; never echo secret | Pod credential delivery and recheck | Existing write-only credential status |
| Kết nối Google/Zalo | Provider CTA | `AcademyIntegrationCenter` | New provider-specific authorization start/callback | absent, authorizing, connected, expired, refused | Preserve callback guidance | Provider identity + verification shown | Retry/re-authorize; no token displayed | Site-scoped provider connection | Current contract gap; AgentOS Zalo owner rejected |
| Lưu Analytics/Webhook | Provider action | `AcademyIntegrationCenter` | New site-scoped public-config/webhook operations | absent, saving, configured, consent-blocked/active/failing | Exact provider locked | Safe public ID/status or one-time webhook secret | Preserve previous state; explain provider failure | Academy public config / webhook subscription | Current contract gap |

### OWNER CHALLENGE

| Proposed owner | Layer | Purpose | Closest existing owners / contracts | REUSE verdict | ALTER verdict | Layer proof | Decision | Evidence |
|---|---|---|---|---|---|---|---|---|
| `AcademyGrowthSummary` | block | Nói doanh thu/funnel/progress có aggregate thật của đúng Academy. | `AgentOSWorkspaceSummary`, `captioned-cell-grid`, `progress-row-stack` | Không reuse block vì domain/request khác; reuse contracts/composites. | Không alter AgentOS block vì sẽ trộn domain. | Có request, copy, state và connected/pure twin riêng. | ADD | `revenueSeries`, `completionFunnel`; BLOCK-1/8 |
| `AcademyStudentCrm` | block | Quản lý học viên, detail và course access của đúng Academy. | `AgentOSWorkspaceList`, `avatar-identity-badge-action-row` | Không reuse block vì workspace lifecycle khác; reuse row contract/leaves. | Alter workspace block sẽ làm tên và request sai. | Domain sentence, site-scoped request, row action state, connected/pure twin. | ADD | members/studentDetail/course access operations |
| `AcademyLeadPipeline` | block | Quản lý lead stage/note/draft reply của site. | `AcademyStudentCrm`, `avatar-identity-badge-action-row` | Keep apart vì entity/request/actions khác; reuse cùng generic list grammar. | Gộp với Student CRM tạo block biết hai aggregate độc lập. | Domain sentence và request/refusal độc lập. | ADD | `myExpertSiteLeads`, `updateExpertSiteLead`, `draftLeadReply` |
| `AcademyIntegrationCenter` | block | Hiển thị readiness và setup provider theo family, không lộ secret. | `AgentOSWorkspaceApplications`, current Academy settings operations | Không reuse AgentOS block vì app launch khác provider configuration. | Reuse/alter generic card vocabulary, không alter domain block. | Một aggregate settings request, provider-specific action state, connected/pure twin. | ADD | Academy credential/domain types + provider gaps |
| `StatusActionCard` | composite | Closed identity/state/detail/one-action shape cho application và integration provider. | `ApplicationLaunchCard`, `application-launch-card` | Shape được reuse nhưng current name/domain comment nói application. | Rename type/path/contract và migrate current AgentOS consumer. | Closed props/on, không fetch/translate, consumer thứ hai có thật. | ALTER | COMPOSITE-2/7; live AgentOS consumer + selected Academy consumer |

### VISUAL JOB

| Visual element | Owner / state | Recognition, grouping or interaction job | Existing reference | Verdict | Evidence |
|---|---|---|---|---|---|
| Selected paint của `ChoiceTabs` | Page mode selected/focus family | Phân biệt tree Tăng trưởng với Hệ thống trong cùng resource. | Existing `ChoiceTabs primary` | KEEP | Local-choice canon; all selected/focus combinations required |
| Provider card surface | `AcademyIntegrationCenter`, every provider state | Gom identity, state, detail và đúng một action thành một object có thể scan. | `ApplicationLaunchCard` | ALTER/REUSE as `StatusActionCard` | Same closed shape, second consumer |
| Provider/state badge | Provider card absent/pending/verified/rejected/unreachable | Nhận ra capability state trước khi đọc detail; tone không thay thế label. | Existing `Badge` and AgentOS app states | KEEP | Backend verification enum; state labels stay textual |
| Student/lead joined-list border | Student and lead list ready/resting | Cho các peer rows thành một scan; full-width separators không biến mỗi row thành card. | `SurfaceListCard` joined-list grammar | KEEP | Branch canon BRANCH-9 |
| Progress bar | Student detail and growth funnel ready/loading | Biểu diễn numerator/denominator backend thật; skeleton không giả zero. | `LabelledProgressRow` | KEEP | Existing aggregate fields; Progress loading behavior |
| Integration warning copy | Partial/refused System mode | Phân biệt provider chưa cấu hình với provider bị từ chối/unreachable. | `body-with-refusal-note` | KEEP | Existing credential verification reasons |
| New decorative icon/chip/wrapper | N/A | Không có job mới. | Existing vocabulary sufficient | REJECT | CRITIQUE-6 |

### COMPONENT DELTA

| Layer | Owner | Action | Current path | Final path | Parent / call sites | Contract | Reason |
|---|---|---|---|---|---|---|---|
| route | Academy control-center route | ADD | None | `apps/app/src/app/[locale]/(console)/apps/[siteId]/page.tsx` | Next route `/apps/[siteId]` | N/A | Mount đúng resource page; route không fetch/draw. |
| page | `AcademyControlCenterPage` connected/pure twins | ADD | None | `apps/app/src/components/pages/AcademyControlCenterPage/index.tsx`; `component.tsx` | Academy route | `tabbed-control-center-page` | Sở hữu session, site identity, local mode và reading order; block tự fetch. |
| layout | Console route layout | REUSE | `apps/app/src/app/[locale]/(console)/layout.tsx` | Same | Parent of Academy route | `sidebar-then-body-app` → `console-body-main` | Academy vẫn là Apps resource trong existing shell. |
| overlay | None | REUSE | None | None | N/A | N/A | Provider detail mở inline trong System block; không phát minh modal/drawer. |
| block | `AcademyGrowthSummary` twins | ADD | None | `apps/app/src/components/blocks/academy/AcademyGrowthSummary/index.tsx`; `component.tsx` | Academy page growth mode | `label-row-over-card`, `captioned-cell-grid`, `progress-row-stack` | Aggregate growth tự load/refuse. |
| block | `AcademyStudentCrm` twins | ADD | None | `apps/app/src/components/blocks/academy/AcademyStudentCrm/index.tsx`; `component.tsx` | Academy page growth mode | `label-row-over-card`, `identity-action-list` | Student list/detail/actions là một domain owner. |
| block | `AcademyLeadPipeline` twins | ADD | None | `apps/app/src/components/blocks/academy/AcademyLeadPipeline/index.tsx`; `component.tsx` | Academy page growth mode | `label-row-over-card`, `identity-action-list` | Lead pipeline tự load và update độc lập. |
| block | `AcademyIntegrationCenter` twins | ADD | None | `apps/app/src/components/blocks/academy/AcademyIntegrationCenter/index.tsx`; `component.tsx` | Academy page system mode | `label-row-over-card`, `status-action-card-grid`, provider form contracts | Site/provider readiness và write-only setup ở một owner. |
| block | `AgentOSWorkspaceApplications` | MODIFY | `apps/app/src/components/blocks/agentos/AgentOSWorkspaceApplications/index.tsx` | Same | `AgentOSWorkspacePage` | `status-action-card-grid` | Migrate neutralized composite/contract names; behavior unchanged. |
| composite | `ApplicationLaunchCard` | MOVE | `packages/ui/src/composites/ApplicationLaunchCard/index.tsx` | `packages/ui/src/composites/StatusActionCard/index.tsx` | AgentOS applications; Academy integrations | `status-action-card` | Consumer thứ hai chứng minh shape trung lập; old name sẽ sai. |
| composite | `LabelledProgressRow` | REUSE | `packages/ui/src/composites/LabelledProgressRow/index.tsx` | Same | Growth/student pure blocks | `label-fact-over-progress` | Existing closed progress shape đúng dữ liệu aggregate. |
| branch | `Tree` | REUSE | `packages/ui/src/branches/Tree/index.tsx` | Same | Page and all pure blocks | Registry-selected keys | Sole contract host. |
| branch | `SurfaceCard` | REUSE | `packages/ui/src/branches/SurfaceCard/index.tsx` | Same | Four Academy blocks | `label-row-over-card` | Existing labelled section surface. |
| branch | `SurfaceListCard` | REUSE | `packages/ui/src/branches/SurfaceListCard/index.tsx` | Same | Student and lead blocks | `identity-action-list` | Joined rows own separators and resting count. |
| leaf | `ChoiceTabs` | REUSE | `packages/ui/src/leaves/ChoiceTabs/index.tsx` | Same | Academy page | `choice-tabs`, `variant: primary` | Local mode, not route navigation. |
| leaf | `Heading` / `Text` / `Button` / `Badge` / `Avatar` / `Input` / `Progress` | REUSE | Matching folders under `packages/ui/src/leaves/` | Same | Page and Academy blocks | Existing leaf identities | Current vocabulary covers all primitives; no vendor import above leaves. |
| shell | Console shell mechanics | REUSE | `apps/app/src/app/[locale]/(console)/layout.tsx` | Same | All console routes | Existing sidebar/body contracts | No new vendor mechanics. |

### PROPS DELTA

| Owner | Prop / API | Action | Before | After | Producers / call sites | Migration proof |
|---|---|---|---|---|---|---|
| Academy route | route params | ADD | None | `{ params: Promise<{ siteId: string }> }` | Next router → `AcademyControlCenterPage` | Exact sibling pattern from provisioning route. |
| `AcademyControlCenterPage` | public input | ADD | None | `{ siteId: string }`; pure twin gets `state`, `site`, `mode`, resolved `labels`, `onSelectMode`, `onOpenPublicSite` | Route → connected page → pure twin | Page has no CRM/settings payload props. |
| `AcademyControlCenterPage` | state union | ADD | None | `restoring \| refused \| ready`; `mode: growth \| system` only when screen admitted | Session + site identity lookup | Impossible combinations excluded. |
| `AcademyGrowthSummary` | public input/state | ADD | None | Connected `{ siteId }`; pure `resting \| empty \| refused \| answered` with resolved revenue/funnel rows | Academy page → block twins | Block owns `myAcademyGrowthSnapshot(siteId)`. |
| `AcademyStudentCrm` | public input/state/actions | ADD | None | Connected `{ siteId }`; pure states plus `onOpenStudent`, `onRetryDetail`, `onSetStatus`, `onGrantAccess`, `onRevokeAccess` | Academy page → block twins | Targeted action state includes `memberId` and action kind. |
| `AcademyLeadPipeline` | public input/state/actions | ADD | None | Connected `{ siteId }`; pure states plus `onOpenLead`, `onSaveLead`, `onDraftReply` | Academy page → block twins | Existing lead requests already ownership-check `siteId`/lead. |
| `AcademyIntegrationCenter` | public input/state/actions | ADD | None | Connected `{ siteId }`; pure `resting \| partial \| refused \| answered`, provider discriminated union and provider-specific `on` actions | Academy page → block twins | Secret values exist only in local form state until submit; server response contains status/hint only. |
| Contract registry | page key | RENAME | `agentos-workspace-control-center` | `tabbed-control-center-page` | `AgentOSWorkspacePage/component.tsx`; new Academy page | `rg` must return zero old key occurrences after migration. |
| Contract registry | card/grid keys | RENAME | `application-launch-grid`, `application-launch-card` | `status-action-card-grid`, `status-action-card` | `AgentOSWorkspaceApplications`; moved composite; Academy integrations | Slot grammar stays identity/state/detail/action; names become truthful for both consumers. |
| Contract registry | joined list key | ADD | None | `identity-action-list` repeats `avatar-identity-badge-action-row`, `restingCount: 3` | Student and lead blocks | Two consumers use one closed row recipe; no new row composite. |
| `StatusActionCard` | exports/types | RENAME | `ApplicationLaunchCardData/Actions/Props`, `ApplicationLaunchCard` | `StatusActionCardData/Actions/Props`, `StatusActionCard` | UI barrel; AgentOS block; Academy integration block | `rg ApplicationLaunchCard` zero after migration. |
| `StatusActionCardData` | data semantics | RETYPE | Application-specific comments with same fields | Neutral capability `id,title,description,statusLabel,statusTone,actionLabel,disabled,isPending,detail,actionHref,actionTarget` | Both consumers | Field set unchanged; comments/meta no longer claim application-only semantics. |
| `AgentOSWorkspaceApplications` | card import/key | RENAME | `ApplicationLaunchCard`; application contract names | `StatusActionCard`; status-action contract names | AgentOS page remains producer | Snapshot/browser parity required; no behavioral prop change. |
| `apps/app/src/modules/api/console.ts` | lead wrappers | ADD | No FE wrappers | `myExpertSiteLeads(siteId, limit?, offset?)`, `updateExpertSiteLead(input)`, `draftLeadReply(input)` | Lead connected block | Maps existing GraphQL operations exactly. |
| `apps/app/src/modules/api/console.ts` | site-scoped Academy APIs | ADD | Settings no-arg; student/growth operations not a Nivo site-scoped consumer contract | Exact wrappers `myAcademyGrowthSnapshot(siteId)`, `myAcademyStudents(siteId)`, `myAcademyStudentDetail(siteId, memberId)`, `myAcademyIntegrations(siteId)` and provider-specific mutations | Four connected Academy blocks | Backend Feature must ship exact ownership-scoped schema before FE live proof. |
| Messages | `console.academyControlCenter.*` | ADD | None | Resolved en/vi copy for page, states, provider families, actions and refusals | Connected page/blocks only | Pure twins receive strings, never translation keys. |

### STATE AND ACCEPTANCE EVIDENCE

| Identity | Required states | Proof |
|---|---|---|
| Page | restoring, signed-out redirect, site-not-found/forbidden, growth selected, system selected | Browser route with valid/invalid site and signed-out session; selected tab state family. |
| Growth summary | first-load, empty aggregate, partial aggregate, refused, ready | Pure fixture render plus live site-scoped query. |
| Student CRM | first-load, empty, ready, detail pending/ready/refused, targeted mutation pending/saved/refused | Pure state matrix; live create/status/access flow. |
| Lead pipeline | first-load, empty, ready, selected, save/draft pending/saved/refused | Pure state matrix; live lead query/update/draft flow. |
| Integration Center | first-load, partial providers, no domain, DNS pending/live, credential delivered/verified/rejected/unreachable, provider absent/authorizing/connected/expired/failing | Pure state matrix; live domain/SMTP/payment; contract tests for missing/new providers. |
| Responsive | 1280 desktop and 390×844 narrow; no page overflow; card grid stacks; joined rows preserve action access | Browser `scrollWidth <= clientWidth`, keyboard tab order, screenshots. |
| Security | No password/client secret/token in query response, DOM after save, console, Network response or workflow | Browser Network/Console plus API envelope inspection. |

### SUPPORTING PRODUCTION BOUNDARY

| Tree | Exact paths |
|---|---|
| Routes/pages | `apps/app/src/app/[locale]/(console)/apps/[siteId]/page.tsx`; `apps/app/src/components/pages/AcademyControlCenterPage/{index.tsx,component.tsx}` |
| Blocks | `apps/app/src/components/blocks/academy/AcademyGrowthSummary/{index.tsx,component.tsx}`; `AcademyStudentCrm/{index.tsx,component.tsx}`; `AcademyLeadPipeline/{index.tsx,component.tsx}`; `AcademyIntegrationCenter/{index.tsx,component.tsx}` |
| Shared vocabulary | `packages/ui/src/contracts/index.ts`; `packages/ui/src/index.ts`; move `packages/ui/src/composites/ApplicationLaunchCard/index.tsx` to `packages/ui/src/composites/StatusActionCard/index.tsx` |
| Existing consumer migration | `apps/app/src/components/pages/AgentOSWorkspacePage/component.tsx`; `apps/app/src/components/blocks/agentos/AgentOSWorkspaceApplications/index.tsx` |
| Transport/copy | `apps/app/src/modules/api/console.ts`; `apps/app/src/messages/en.json`; `apps/app/src/messages/vi.json` |
| Backend prerequisite | Separate `starci-be-feature-plan` must freeze exact schema/files for site-scoped Academy settings, growth, students and new Google/Zalo/Analytics/Webhook owners. |

### ACCEPTANCE COMMANDS

| Gate | Command / evidence |
|---|---|
| Canon/lint | `npm run lint` in `D:\Repositories\nivo-fe` |
| Typecheck | `npm run typecheck` in `D:\Repositories\nivo-fe` |
| Production build | `npm run build` in `D:\Repositories\nivo-fe` |
| Contract migration | `rg -n "agentos-workspace-control-center|application-launch-grid|application-launch-card|ApplicationLaunchCard" D:\Repositories\nivo-fe` returns no stale owner after move/rename. |
| Browser | Login test account; open owned Academy; exercise both modes, row/provider selection, pending/refused/success states at desktop/narrow. |
| Network/Console/Terminal | No failed unexplained request, console error or FE/BE terminal exception; no secret echoed. |
| Live flow | Domain save/recheck; SMTP/payment save; lead update/draft; student detail/status/access; new providers only after backend feature passes. Record under `### LIVE FLOW PROOF` in Apply. |

### OUTPUTS

| Concept | Result |
|---|---|
| Direction C review candidate | Giữ hai mode trong một Academy resource, nhưng tách thành bốn independent blocks và bắt buộc mọi request theo `siteId`. |
| Architecture verdict | Không có raw mega-page; page chỉ compose, blocks own domain/request/state, generic closed card shape được neutralize thay vì copy. |
| Security verdict | Secret write-only; không render lại credential; Google/Zalo/Analytics/Webhook không được giả live khi backend owner chưa tồn tại. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\nivo\academy-control-center.md` | `modified` — appended Design Review r1 candidate, exact owner/props deltas and acceptance boundary. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Duyệt candidate để khóa revision triển khai? | **Duyệt `nivo-academy-control-center-r1` (recommended)** — chạy Backend Feature Plan cho site-scoped contract trước, rồi quay lại ghi Approved revision và Apply FE; hoặc yêu cầu sửa exact owner/interaction/boundary. |

### WARNINGS

| Warning | Impact |
|---|---|
| `myAcademySettings` hiện không nhận `siteId`, trong khi account có thể có nhiều Academy. | Không được gọi trực tiếp từ resource route; có nguy cơ sai owner/resource hoặc refusal. |
| Student/growth APIs hiện là expert-admin capability, chưa phải Nivo-owner site bridge. | FE có thể render fixture nhưng không thể live-pass đúng persona cho tới khi backend contract được bổ sung. |
| FE/BE đang có dirty AgentOS/OpenClaw worktree changes, gồm đúng contract/composite sẽ được neutralize. | Apply phải baseline sau khi các thay đổi hiện tại được commit và không được ghi đè logic launch đang mở. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Page tự fetch toàn bộ dashboard | Bốn connected blocks độc lập | Page không được thành data layer hoặc shared loading owner. |
| Reuse key mang tên AgentOS cho Academy | Rename generic `tabbed-control-center-page` | Key phải nói đúng mọi consumer. |
| Copy `ApplicationLaunchCard` thành integration card | Neutralize `StatusActionCard` và migrate cả hai consumers | Second consumer chứng minh một shared closed shape; duplicate bị từ chối. |
| Generic provider key/value form | Provider-specific discriminated recipes trong Integration block | OAuth, credentials, analytics và webhook có hậu quả/bảo mật khác nhau. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval of `nivo-academy-control-center-r1` | User states approval of this exact revision. |
| Site-scoped Backend capability and exact source tree | Run `starci-be-feature-plan`, then Review/Apply for Academy settings, students, growth, Google, Zalo, Analytics and Webhook. |
| FE production implementation and live proof | After approved Review + backend contract, run `starci-fe-design-apply`; record browser/Network/Console/Terminal evidence. |

## review r2

Approved revision: `nivo-academy-control-center-r1`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | nivo |
| Repo / branch | D:\Repositories\nivo-fe (`main`); D:\Repositories\nivo-backend (`main`); Source D:\Repositories\starci-academy-backend (`mtp`) |
| Purpose | Ghi nhận phê duyệt Direction C và khóa Review r1 làm ranh giới FE sau khi backend site-scoped contract được thiết kế. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\nivo\academy-control-center.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ D:\Repositories\starci-academy-backend\.workflows\designs\nivo\academy-control-center.md |

### APPROVAL EVIDENCE

| Evidence | Consequence |
|---|---|
| Người dùng yêu cầu “làm cả 2 đi” sau khi được đề nghị duyệt exact candidate và chạy Backend Feature Plan. | Phê duyệt `nivo-academy-control-center-r1`; tiếp tục cả FE boundary và Backend Feature Plan, không mở lại lựa chọn A/B/C. |

### COMPONENT DELTA

| Layer | Owner | Action | Current path | Final path | Parent / call sites | Contract | Reason |
|---|---|---|---|---|---|---|---|
| page | Approved tree | REUSE | Review r1 `### COMPONENT DELTA` | Same | All rows in Review r1 | Same | Review r1 is frozen without amendment. |

### PROPS DELTA

| Owner | Prop / API | Action | Before | After | Producers / call sites | Migration proof |
|---|---|---|---|---|---|---|
| Approved interfaces | All rows | KEEP | Review r1 `### PROPS DELTA` | Same | All producers/call sites named in Review r1 | No feedback changed the interface boundary. |

### OUTPUTS

| Concept | Result |
|---|---|
| Approved FE revision | `nivo-academy-control-center-r1` is frozen for Apply after its backend prerequisite is approved and implemented. |
| Next phase | Run `starci-be-feature-plan` for the site-scoped Academy contract, then Review/Apply backend before FE Apply. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\nivo\academy-control-center.md` | `modified` — appended explicit approval record. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | None |

### WARNINGS

| Warning | Impact |
|---|---|
| FE Apply remains ordered after the backend site-scoped feature. | Starting FE live integration first would violate the approved API/security boundary. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| None | None | None |

### OWED

| Owed | Cleared by |
|---|---|
| Backend site-scoped contract | `starci-be-feature-plan` → Review → Apply. |
| FE implementation | `starci-fe-design-apply` after backend prerequisite passes. |

## apply r1

Applied revision: `nivo-academy-control-center-r1`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| App | nivo |
| Frontend baseline | `9749235f48715cc2220a259b9c3d510d669cc619` (`feat: baseline workspace app launch flow`) |
| Frontend implementation | `7bc2ff4` (`feat: add academy control center`) |
| Phase | apply |

### OUTPUTS

| Concept | Result |
|---|---|
| Academy destination | Added `/[locale]/apps/[siteId]`; owned Academy rows now open their control center. |
| Growth mode | Added growth snapshot, student CRM and lead CRM blocks with independent request/state ownership. |
| System mode | Added self-service domain, Google OAuth, SMTP, PayOS/SePay, Zalo OA, GA4, Meta Pixel and webhook configuration. |
| Secret boundary | Secret inputs stay in local form state, are submitted write-only and are never rendered back; one-time webhook secret is copied without entering the DOM. |
| Shared vocabulary | Renamed the application-only shared card and contracts to neutral status-action vocabulary, migrating the existing AgentOS consumer. |
| Runtime correction | Deferred the HeroUI `ChoiceTabs` tree until client mount; the hydration mismatch found during browser proof no longer reproduces. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\nivo-fe\apps\app\src\app\[locale]\(console)\apps\[siteId]\page.tsx` | Added the owned Academy route. |
| `D:\Repositories\nivo-fe\apps\app\src\components\pages\AcademyControlCenterPage` | Added connected/pure page twins and Growth/System mode composition. |
| `D:\Repositories\nivo-fe\apps\app\src\components\blocks\academy` | Added growth, student CRM, lead CRM and Integration Center connected/pure blocks. |
| `D:\Repositories\nivo-fe\apps\app\src\modules\api\console.ts` | Added site-scoped Academy query/mutation wrappers. |
| `D:\Repositories\nivo-fe\packages\ui\src` | Migrated `ApplicationLaunchCard` to `StatusActionCard` and generalized the contract registry. |
| Apps page | Added the resource-route producer omitted from Review's supporting boundary; without it an owned Academy had no discoverable path to the approved destination. |

### PROOF

| Gate | Result |
|---|---|
| App/UI/Expert/Landing lint | PASS — all four workspace lint commands exit 0. |
| Typecheck | PASS — `npm run typecheck`, 4/4 packages. |
| Production build | PASS — `npm run build`, 3/3 build tasks; `/[locale]/apps/[siteId]` emitted as a dynamic route. |
| Contract migration | PASS — no stale `agentos-workspace-control-center`, `application-launch-grid`, `application-launch-card` or `ApplicationLaunchCard` occurrence. |
| Backend feature scope lint | PASS — six Academy control-center/integration scopes exit 0 with no warning or error. |
| Backend build | PASS — `npm run build`. |
| Diff integrity | PASS — `git diff --check` and staged diff check report no whitespace error. |

### LIVE FLOW PROOF

| Field | Evidence |
|---|---|
| Flow | Sign in → Apps → owned Academy → Growth/System → select every integration form. |
| Persona | Local Nivo tester owner (`tester@nivo.local`); password omitted. |
| Steps | Signed in through the real UI; opened Academy `4d50e1a7-1b6c-41f1-9039-bd824d564f85`; exercised both tabs; opened all eight provider forms; reloaded after the hydration repair; checked 390×844 narrow rendering. |
| UI | Route renders the owned site, Growth states, self-service provider cards and provider-specific forms. All eight `Thiết lập` actions resolve; Zalo has an OAuth action and the other providers expose only their required fields. Narrow view stacks cards and preserves actions. |
| Network | Ownership and integration queries returned real data. Growth/student requests were refused because this historical Academy is `Failed` and has no Academy runtime token; this is an explained backend state, not an FE transport failure. No credential mutation was sent without user-supplied provider credentials. |
| Console | Initial live run found a HeroUI tab hydration mismatch. Apply repaired it; a fresh reload and tab interaction produced zero new console errors. |
| Terminal | FE dev server remained healthy. BE compiled with 0 errors and started on 3067; logs explain `ACADEMY_RUNTIME_UNAVAILABLE_EXCEPTION` for the failed historical Academy. |
| Verdict | UI/runtime path PASS. Credential mutations and runtime-backed CRM success remain OWED until a Ready Academy and provider credentials are supplied. |
| Evidence | Browser left on `http://localhost:3066/apps/4d50e1a7-1b6c-41f1-9039-bd824d564f85`; implementation commit `7bc2ff4`. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | None |

### WARNINGS

| Warning | Impact |
|---|---|
| Root `npm run lint` stops before ESLint because `plugins/eslint-canon` differs from the current trust-tree mirror (8 changed, 2 missing files). | Product package lint is green, but the repository-wide canon gate remains OWED and must go through FE lint-sync Plan → Review → Apply rather than silently overwriting lint rules inside this feature Apply. |
| The only owned Academy in the local test account is already `Failed`. | Integration settings can be read/configured, but growth/student success responses require a newly Ready Academy runtime. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Echoing saved client secrets/API keys back into the UI | Write-only forms and status/hint responses | Prevents credential exposure in DOM, Console, Network proof and workflow evidence. |
| Auto-syncing changed canonical lint rules during feature Apply | Route to FE lint-sync lifecycle | Canon changes are outside the approved production boundary and can alter enforcement. |

### OWED

| Owed | Cleared by |
|---|---|
| Root canon mirror gate | Run `starci-fe-lint-sync-plan` → Review → Apply for `D:\Repositories\nivo-fe`. |
| Domain, Google, SMTP, payment, Zalo, analytics and webhook successful live mutations | Supply test credentials after a Ready Academy exists; rerun the same UI forms and record Network/Terminal responses without secrets. |
| Runtime-backed growth/student/lead success states | Provision or restore one Ready Academy, then repeat the owner flow. |
