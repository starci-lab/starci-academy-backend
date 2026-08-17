<!-- starci-workflow: v2 -->
# Nivo AgentOS module builder

## plan

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
| Repo / branch | Source D:\Repositories\starci-academy-backend @ mtp; Frontend D:\Repositories\nivo-fe @ main; Backend D:\Repositories\nivo-backend @ main |
| Purpose | Chốt hierarchy và hành trình để khách cài một module AgentOS, tạo nhiều agent, nối nhiều account cùng provider, gắn tri thức/prompt rồi theo dõi Saga provision. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\nivo\agentos-module-builder.md |
| Language | vi |
| Phase | plan |
| Touching | D:\Repositories\starci-academy-backend\.workflows\designs\nivo\agentos-module-builder.md; D:\Repositories\starci-academy-backend\.workflows\.previews\designs\nivo\agentos-module-builder\r1\index.html |

### MODE

| Claim | Result |
|---|---|
| Mode | Creative — đây là capability và hierarchy mới, không phải yêu cầu port một màn hình cũ. |
| Fixed product truth | AgentOS là sản phẩm riêng; một workspace chạy một OpenClaw gateway nhưng có thể quản nhiều agent và nhiều channel account. |
| Fixed UI grammar | Dùng console shell hiện tại, main-content tabs, page → block → composite → leaf, contract render và connected/pure split. |

### PAGE BRIEF

| Item | Decision |
|---|---|
| User | Chủ workspace AgentOS muốn dựng một chatbot/automation có thể chạy thật mà không phải tự sửa OpenClaw config hoặc K8s Secret. |
| Thesis | Trang này giúp chủ workspace biến một module thành agent đang hoạt động bằng cách làm rõ cấu hình còn thiếu và một hành động provision duy nhất. |
| Primary action | `Cài và provision module`, chỉ xuất hiện ở review khi module, agent, channel account, knowledge và prompt đã hợp lệ. |
| Supporting actions | Thêm agent, thêm channel account, gắn knowledge, sửa prompt, retry bước lỗi, mở module đã Ready. |
| Information order | Module intent → agent ownership → channel accounts → knowledge/prompt → review → Saga progress → operate. |
| Anti-goals | Không biến trang thành raw OpenClaw JSON editor; không đưa secret plaintext trở lại browser; không giả rằng provider `APPLIED` đồng nghĩa external traffic `CONNECTED`; không cho provider thứ hai ghi đè account thứ nhất. |

### BEST-BELIEF EVIDENCE

| Claim | Source | Confidence | Design consequence |
|---|---|---|---|
| Workspace control center và main-content tabs đã tồn tại | `D:\Repositories\nivo-fe\apps\app\src\components\pages\AgentOSWorkspacePage\component.tsx` | High | Module builder nằm trong workspace route/shell, không tạo sidebar sản phẩm thứ hai. |
| FE hiện chỉ consume control-center snapshot và app launch | `D:\Repositories\nivo-fe\apps\app\src\modules\api\console.ts` | High | Module read/write API là backend dependency mới; preview phải ghi rõ fixture. |
| Backend đã có `createAgent`, `myAgents`, `connectChannel`, `myChannels`, `addKnowledgeSource`, `myKnowledgeSources` | `D:\Repositories\nivo-backend\src\features\core\api\core\graphql\{mutations,queries}\agent-workspace` | High | Tái dùng business slices hiện có, nhưng cần aggregate/module orchestration thay vì FE gọi rời rạc rồi tự suy diễn. |
| Agent hiện nhận channel kind, không nhận account binding | `create-agent/graphql-types/input.ts` | High | Cần model binding `agentId ↔ channelAccountId`; một string `telegram` không phân biệt hai bot. |
| Channel hiện thuộc workspace và có nhiều row | `channel-connection.entity.ts`, `my-channels` | High | Có thể biểu diễn nhiều account, nhưng credential/reconcile hiện còn provider-scoped ở Channel Center r2; phải nâng identity lên `accountId`. |
| OpenClaw hỗ trợ nhiều account Telegram và bindings theo `accountId` | OpenClaw 2026.7.1 config/schema đã kiểm tra trong runtime image trước Plan này | High | Một gateway/workspace là đủ; không cần một OpenClaw pod cho mỗi bot. |
| Credential phải đi qua encrypted custody và K8s SecretRef | `openclaw-channel-center` backend workflow + current pod credential boundary | High | Form chỉ nhận secret write-only; read model chỉ trả masked hint/status/version. |

### REUSE INVENTORY

| Candidate | Why match | Behavior/state match | Verdict |
|---|---|---|---|
| `AgentOSWorkspacePage` | Đúng workspace identity và console shell | Có loading/refused/ready, tabs và realtime refetch | EXTEND — thêm destination/section cho Modules, không nhét builder JSX vào page. |
| `ChoiceTabs` + `tabbed-control-center-page` | Đúng peer navigation trong main content | Đã dùng ở workspace page | REUSE. |
| `SurfaceCard` | Đúng resting surface cho module/agent/account group | Có contract render | REUSE. |
| `StatusActionCard` | Đúng status + một action | Dùng cho app availability, chưa đủ nested account/agent composition | REUSE ở module catalog/list; không dùng làm toàn bộ builder. |
| `EmptyNotice` | Đúng loading/refused/empty leaf | Đã dùng trong workspace page | REUSE. |
| Existing agent/channel/knowledge GraphQL slices | Có owner-scoped CRUD nền | Chưa có module aggregate, account binding và Saga progress | EXTEND qua backend feature; FE không tự orchestrate chuỗi mutation. |

### PRODUCT MODEL

| Owner | Responsibility | Cardinality |
|---|---|---|
| Workspace | Runtime boundary, OpenClaw gateway, Nivo knowledge/MCP và quota | 1 |
| ModuleInstallation | Một capability khách cài, ví dụ Chatbot bán hàng | many/workspace |
| Agent | Persona/model/system prompt thực thi capability | many/module |
| ChannelAccount | Một account cụ thể như Telegram Sales Bot hoặc Telegram Support Bot | many/module; nhiều account cùng provider |
| CredentialBinding | Secret write-only cho đúng account và credential key | many/account |
| KnowledgeBinding | Bộ tri thức Nivo mà agent được phép retrieve | many/agent |
| PromptVersion | Prompt có version, draft/published state | many/agent |
| ProvisioningSaga | Reconcile module config → SecretRef → OpenClaw config → rollout/probes | 1 active/module installation |

### STATE MATRIX

| State | Must show |
|---|---|
| Catalog | Module purpose, required capabilities và CTA cài; không giả đã provision. |
| Draft incomplete | Checklist chỉ đúng field còn thiếu; primary provision bị disabled có lý do. |
| Secret saved | Chỉ masked hint + updatedAt/version; không echo secret. |
| Provisioning | Top journey, current Saga step, safe live events và retry policy; ngăn submit trùng. |
| Partially ready | Agent/account nào Ready hoặc Failed được phân biệt; module chưa được gọi Ready toàn phần. |
| Ready | Module health, agents, channel account probes và action `Mở module`. |
| Failed | Exact failed step, safe error, retry/repair action; giữ draft đã lưu. |
| Empty | Giải thích module giải quyết việc gì và bắt đầu từ catalog. |
| Responsive | Một DOM/reading/focus order; rail trở thành compact selector, journey top row có bounded horizontal scroll nếu cần. |

### INTERACTION CONSEQUENCE

| Interaction | Trigger | Product owner | Request / route | Visual states | Pending | Success | Failure | Persistence / shared effect | Evidence |
|---|---|---|---|---|---|---|---|---|---|
| Chọn module | Press module card | Module catalog | Proposed workspace module catalog route/read model | idle, selected | N/A — local selection | Builder hiển thị requirement đúng module | Không có | Selection local đến khi tạo draft | Net-new aggregate; preview fixture. |
| Tạo module draft | Press `Cài module` | ModuleInstallation | Proposed `createAgentModuleInstallation` | idle, submitting, refused | Disable duplicate submit | Trả module installation id và mở builder | Owner/plan/capability error cạnh CTA | Durable row, visible ở workspace modules | Existing mutations rời rạc chưa sở hữu aggregate. |
| Thêm agent | Submit agent form | Agent | Existing `createAgent`, sau này nhận module installation relation | idle, saving, saved, failed | Button pending một lần | Agent xuất hiện trong module | Inline error; giữ input | Durable agent; shared module summary refresh | `create-agent` GraphQL slice. |
| Thêm channel account | Submit provider/account form | ChannelAccount | Proposed account-scoped connect/save credential mutation | idle, validating, saving, applied, failed | Secret field locked during request | Account row riêng, masked credential status | Provider validation/rollout error; không mất agent draft | Durable account; K8s SecretRef + OpenClaw reconcile | Current provider-scoped Channel Center is insufficient. |
| Gắn account vào agent | Toggle/select account | AgentChannelBinding | Proposed bind/unbind mutation | idle, saving, bound, failed | Prevent conflicting repeated toggle | Agent shows exact account label/id | Revert selected paint + show error | Durable binding; affects OpenClaw `bindings` | OpenClaw accountId mechanics; backend contract new. |
| Gắn knowledge | Select knowledge source | KnowledgeBinding | Existing knowledge source + proposed agent binding | idle, saving, indexed, failed | Show indexing separately from save | Agent shows source and index status | Keep source, expose retry indexing | Shared Nivo knowledge/MCP permissions | Existing source list/create; binding/probe incomplete. |
| Lưu prompt | Save prompt | PromptVersion | Existing agent prompt behavior, proposed versioned save/publish | draft, saving, saved, failed | Disable duplicate save | New version + dirty state cleared | Preserve text + error | Durable prompt version; reconcile input | Current `systemPrompt` is a field, versioning is new. |
| Provision module | Press primary review CTA | ProvisioningSaga | Proposed `provisionAgentModuleInstallation` | ready-to-submit, queued, running, ready, failed | Lock configuration or mark new revision while active | Realtime journey reaches Ready and management route opens | Failed step + safe retry/repair | Kafka/Saga/consumer/Socket updates module snapshot | Existing workspace Saga pattern; module Saga new. |
| Retry failed step | Press retry | ProvisioningSaga | Proposed idempotent retry mutation | failed, retrying, running | One active retry key | Continues from safe checkpoint | Same/new failure recorded | Audit trail, no duplicate secret/account | Requires backend feature review. |

### DIRECTIONS

| Direction | Causal sentence | Reading order | Primary action | Tradeoff |
|---|---|---|---|---|
| A — Hành trình cài module | Vì người mới cần biết bước kế tiếp, direction này đặt journey ngang ở đầu main content để hoàn tất một module từ trái sang phải. | Module → Agent → Channel → Knowledge/Prompt → Review | `Cài và provision` ở cuối journey | Dễ onboarding; đổi qua lại nhiều agent/account chậm hơn. |
| B — Điều phối theo agent | Vì operator quay lại thường xuyên để đổi bot/tri thức, direction này để danh sách agent dẫn đầu và cấu hình account theo agent đang chọn. | Agents → bindings → knowledge/prompt → health | `Lưu thay đổi agent` theo context | Nhanh vận hành; người mới khó thấy toàn bộ prerequisite module. |
| C — Xây dựng + Vận hành | Vì cùng sản phẩm có hai nhịp công việc, direction này tách `Xây dựng` theo journey và `Vận hành` theo module/agent health trong cùng workspace. | Mode switch → build journey hoặc operations matrix | `Provision revision` trong Build; `Mở module` khi Ready | Bao quát nhất và scale tốt; cần hierarchy/tabs rõ để không thành dashboard nặng. |

### PREVIEW TRACKING

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| AgentOS module builder r1 | `http://127.0.0.1:8082/` | `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\nivo\agentos-module-builder\r1\index.html` | `E0D222203F5153EA0FCFFF3D691E9A32F8FEFB73C7D9493E82A95EE2A5FEFE5E` | Đã serve và browser QA. |

| Direction | Tab | Status |
|---|---|---|
| A-journey | A · Hành trình | Đã render và click kiểm tra. |
| B-agent-first | B · Theo agent | Đã render và click kiểm tra. |
| C-build-operate | C · Xây dựng + Vận hành | Đã render cả Build/Operate; khuyến nghị sơ bộ. |

### PREVIEW PROOF

| Proof | Result |
|---|---|
| Server | `serve_proposals.py` chạy PID `52220`, port `8082`. |
| Tab switching | Browser đã click A, B, C; content đặc trưng của từng direction đều visible. |
| Direction C modes | Đã click `Vận hành`; bảng `Module health` visible, sau đó quay lại A. |
| Responsive | Viewport 390×844: `innerWidth=390`, `scrollWidth=375`, không horizontal overflow; mobile agent selector visible. Viewport đã reset. |
| Console | Không có warning/error trong preview. |

### OUTPUTS

| Concept | Result |
|---|---|
| Product model | Một workspace có nhiều module installation; mỗi module có nhiều agent và nhiều channel account, kể cả nhiều account cùng provider. |
| Secret boundary | Browser chỉ write secret; runtime nhận SecretRef theo account, không nhận plaintext từ read model. |
| Direction set | Ba hướng khác nhau về hierarchy, CTA moment và disclosure; C được khuyến nghị sơ bộ. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\nivo\agentos-module-builder.md` | `added` — Design Plan và evidence packet. |
| `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\nivo\agentos-module-builder\r1\index.html` | `added` — preview ba direction. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Chọn hierarchy để sang Design Review | **C — Xây dựng + Vận hành** (khuyến nghị); A — Hành trình cài module; B — Điều phối theo agent; hoặc chỉ rõ phần muốn ghép. |

### WARNINGS

| Warning | Impact |
|---|---|
| ModuleInstallation, account-scoped credential identity, agent-account binding và module Saga chưa có contract hoàn chỉnh. | FE Apply phải chờ Backend Feature Plan/Review/Apply; preview dùng fixture có nhãn. |
| Existing `createAgent.channels` chỉ là provider kind. | Không thể biểu diễn hai Telegram bot khác nhau trên cùng/multiple agent một cách an toàn. |
| Channel Center r2 báo `APPLIED`, chưa chứng minh external traffic. | UI phải tách delivery state và provider probe state. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Một OpenClaw pod cho mỗi Telegram bot | Một gateway/workspace, nhiều account + bindings | OpenClaw hỗ trợ accountId; tách pod làm tăng chi phí và khó chia sẻ knowledge/runtime. |
| Raw OpenClaw JSON editor | Module/agent/account/knowledge owners có contract | Khách không nên sửa schema vendor và secret reference bằng tay. |
| Một credential row theo provider | Identity theo workspace + provider + accountId + credentialKey | Account thứ hai không được ghi đè account thứ nhất. |

### OWED

| Owed | Cleared by |
|---|---|
| User chọn direction | Ghi selected direction rồi chạy `$starci-fe-design-review`. |
| Backend aggregate/account/Saga contracts | `$starci-be-feature-plan` sau khi direction được chọn; không viết trong FE Plan. |

## plan revision 2

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
| Repo / branch | Source D:\Repositories\starci-academy-backend @ mtp; Frontend D:\Repositories\nivo-fe @ main; Backend D:\Repositories\nivo-backend @ main |
| Purpose | Sửa product model từ một module builder đơn lẻ thành catalog nhiều solution module được Nivo đóng gói, mỗi module có agents, prompt, tools và knowledge namespace riêng. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\nivo\agentos-module-builder.md |
| Language | vi |
| Phase | plan |
| Touching | D:\Repositories\starci-academy-backend\.workflows\designs\nivo\agentos-module-builder.md; D:\Repositories\starci-academy-backend\.workflows\.previews\designs\nivo\agentos-module-builder\r2\index.html |

### USER CLARIFICATION

| Claim | Revised truth |
|---|---|
| Nivo sells | Các giải pháp đóng gói sẵn: Chatbot, Sales, Marketing và các module tương lai. |
| Customer installs | Một hoặc nhiều module vào cùng AgentOS workspace. |
| Module owns | Module manifest, agent templates, prompts, tools/MCP bindings, channel requirements, knowledge package và provisioning recipe. |
| Knowledge composition | Mỗi module dùng Nivo common knowledge + workspace shared knowledge được bind + module private knowledge; không tự nhìn thấy private knowledge của module khác. |
| Nivo provisions | Clone/pin package version, tạo module resources, index knowledge, inject SecretRef, reconcile OpenClaw config, rollout và probe. |
| Customer controls | Chọn module, nhập business overrides/credentials, theo dõi Saga, quản lý module sau khi Ready; không sửa raw Helm/OpenClaw config. |

### REVISED PRODUCT MODEL

| Owner | Responsibility | Identity / isolation |
|---|---|---|
| `SolutionModuleDefinition` | Gói chuẩn do Nivo phát hành, ví dụ `chatbot`, `sales`, `marketing` | `moduleKey + version`; immutable sau publish. |
| `ModuleManifest` | Khai báo agent templates, prompt templates, tools, channel prerequisites, knowledge package và provisioning recipe | Thuộc đúng definition version. |
| `ModuleInstallation` | Một lần cài module vào workspace, giữ lifecycle và customer overrides | `workspaceId + installationId`; cùng module có thể có policy giới hạn số installation. |
| `NivoCommonKnowledge` | Kiến thức nền dùng chung do Nivo phát hành và version | Read-only theo `commonKnowledgeVersion`; Nivo rollout/rollback. |
| `WorkspaceSharedKnowledge` | Kiến thức doanh nghiệp dùng chung cho các module được owner cho phép | `workspaceId + sourceId`; explicit bind theo module. |
| `ModulePrivateKnowledge` | Corpus/index riêng của installation | `installationId + knowledgeVersion`; deny module khác theo mặc định. |
| `ModuleAgent` | Agent được materialize từ template và chỉ nhận bindings được manifest/customer cho phép | `installationId + agentId`. |
| `ChannelAccountBinding` | Gắn account cụ thể vào agent/module role | `installationId + provider + accountId + role`. |
| `ModuleProvisioningSaga` | Materialize toàn bundle và phát progress event | Một active revision/installation; idempotent. |

### KNOWLEDGE POLICY

| Situation | Decision |
|---|---|
| Mọi module | Luôn nhận đúng version `NivoCommonKnowledge` mà manifest khai báo. |
| Chatbot module | Common nền + workspace FAQ/product source được bind + private conversation/playbook của Chatbot. |
| Sales module | Common nền + workspace catalog/customer policy được bind + private sales playbook, objection handling và CRM context; không tự đọc private corpus Marketing. |
| Marketing module | Common nền + workspace brand/company source được bind + private campaign/content knowledge; không tự đọc private hội thoại Sales. |
| Workspace shared knowledge | Owner explicit bind từng source vào một hay nhiều module; audit được module nào có quyền. |
| Retrieval order | Module policy hợp nhất common/shared/private bằng source ACL và namespace filter; không trộn index chỉ vì cùng workspace. |
| Upgrade module | Knowledge version mới được index song song, probe xong mới switch alias; rollback giữ version trước. |
| Uninstall module | Gỡ bindings/runtime của installation; retention/delete knowledge namespace theo policy rõ ràng, không xóa shared source. |

### PROVISIONING SEQUENCE

| Step | Saga owner | Visible consequence |
|---|---|---|
| 1. Reserve installation | Nivo Core | Module xuất hiện `QUEUED`, chống submit trùng. |
| 2. Resolve manifest/version | Module Catalog | UI khóa exact package version và requirement. |
| 3. Materialize agents/prompts/tools | Module Provisioner | Checklist hiển thị từng resource, không chỉ một spinner. |
| 4. Compose common/shared/private knowledge | Knowledge Provisioner | Pin common version, bind shared source ACL, tạo/index private namespace và probe từng lớp. |
| 5. Apply channel credentials/bindings | Credential + Channel owners | SecretRef theo account, không secret plaintext trong event/UI. |
| 6. Reconcile OpenClaw/MCP config | Runtime reconciler | OpenClaw nhận nhiều module/agent/account bindings trong cùng gateway. |
| 7. Rollout + probes | K8s/runtime probe owners | Module chỉ `READY` khi runtime, knowledge và required channel probes đạt. |
| 8. Publish snapshot/events | Kafka consumer → Socket.IO | FE render snapshot theo exact installation id; reconnect refetch snapshot. |

### REVISED DIRECTIONS

| Direction | Causal sentence | Product hierarchy | Tradeoff |
|---|---|---|---|
| A — Solution marketplace | Vì khách bắt đầu từ việc muốn giải quyết, catalog Chatbot/Sales/Marketing dẫn đầu rồi mở setup journey cho module đã chọn. | Catalog → package detail → install journey → Ready | Tốt cho discovery; quản nhiều module phải đi sâu từng card. |
| B — Module fleet | Vì operator quản nhiều solution đã cài, installed modules và health dẫn đầu; catalog là secondary action. | Installed modules → health/progress → module detail → add module | Tốt cho vận hành; onboarding module đầu tiên kém cảm hứng. |
| C — Giải pháp + Hệ thống | Vì mua/cài và vận hành là hai nhịp khác nhau, tách `Giải pháp` và `Đã cài` trong main content, rồi mỗi module có Build/Operate riêng. | Solution catalog / Installed switch → module → Build/Operate | Bao quát vòng đời, scale tới nhiều module; khuyến nghị. |

### INTERACTION CONSEQUENCE

| Interaction | Trigger | Product owner | Request / route | Visual states | Pending | Success | Failure | Persistence / shared effect | Evidence |
|---|---|---|---|---|---|---|---|---|---|
| Mở solution module | Press catalog card | `SolutionModuleDefinition` | Proposed catalog detail route | idle, selected | N/A | Hiện manifest summary/version/requirements | Definition unavailable | Không tạo installation | Capability mới từ user clarification. |
| Cài module | Submit overrides | `ModuleInstallation` | Proposed `installSolutionModule` | reviewing, submitting, queued | Disable duplicate by idempotency key | Tạo installation và chuyển sang Saga journey | Plan/quota/validation error, giữ overrides | Durable installation scoped workspace | Aggregate mới; FE không gọi chuỗi mutation rời. |
| Mở module đã cài | Press installed module row/card | `ModuleInstallation` | Proposed `/agentos/workspaces/[workspaceId]/modules/[installationId]` | loading, ready, degraded, failed | Stable skeleton | Build/Operate detail đúng installation | Owner/not-found state | Exact installation identity | Existing workspace route provides parent identity. |
| Gắn shared knowledge | Explicit bind action | `ModuleKnowledgeNamespace` | Proposed bind mutation | unbound, saving, indexing, bound, failed | One active bind | Source visible only to selected module | Roll back selected paint; retain source | Audited ACL and index alias update | Isolation requirement from user. |
| Upgrade package | Press upgrade after diff review | `ModuleInstallation` | Proposed `upgradeSolutionModuleInstallation` | available, reviewing, provisioning, ready, rollback | Lock active revision | New manifest/knowledge version promoted | Old version remains active or rollback | Versioned installation + Saga events | Requires backend feature design. |
| Uninstall module | Confirm destructive action | `ModuleInstallation` | Proposed uninstall Saga | reviewing, deleting, retained/deleted | Block new operations | Runtime/bindings removed per retention policy | Compensate/retry exact step | Shared sources unaffected; namespace policy explicit | Requires separate destructive approval in Review. |

### PREVIEW TRACKING

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| AgentOS module solutions r2 | `http://127.0.0.1:8083/` | `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\nivo\agentos-module-builder\r2\index.html` | `C5282B861CBD6488566391C670BA771D6E26F8EF6A0977A4C1BECFB78A0AA25F` | Đã serve và browser QA. |

| Direction | Tab | Status |
|---|---|---|
| A-marketplace | A · Marketplace | Chờ browser QA. |
| B-fleet | B · Module fleet | Chờ browser QA. |
| C-solutions-system | C · Giải pháp + Hệ thống | Chờ browser QA; khuyến nghị. |

### OUTPUTS

| Concept | Result |
|---|---|
| Nivo solution catalog | Chatbot, Sales, Marketing là các package/version do Nivo sở hữu và provision. |
| Knowledge composition | Mỗi installation có ba lớp common/shared/private; shared được explicit bind, private vẫn scoped theo module. |
| Recommended direction | C — Giải pháp + Hệ thống, vì giữ discovery và operations tách bạch khi số module tăng. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\nivo\agentos-module-builder.md` | `modified` — append Plan revision 2. |
| `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\nivo\agentos-module-builder\r2\index.html` | `added` — preview nhiều module solution. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Chọn hierarchy nhiều module | **C — Giải pháp + Hệ thống** (khuyến nghị); A — Solution marketplace; B — Module fleet. |

### WARNINGS

| Warning | Impact |
|---|---|
| Existing backend CRUD chưa tạo ra package/version/namespace isolation và installation Saga. | Cần Backend Feature Plan riêng sau FE Design Review; không thể chỉ đổi FE. |
| Workspace shared knowledge nếu tự động mở cho mọi module sẽ phá least privilege. | Nivo common được manifest pin; workspace shared phải explicit bind; module private luôn scoped theo installation. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Một module tổng hợp chứa mọi agent/tri thức | Nhiều versioned solution module độc lập | Không phản ánh sản phẩm Nivo đóng gói và khó upgrade/rollback từng giải pháp. |
| Một vector namespace phẳng toàn workspace | Composition common/shared/private bằng source ACL và namespace filter | Vẫn dùng được tri thức chung mà không làm rò private context giữa Chatbot, Sales, Marketing. |

### OWED

| Owed | Cleared by |
|---|---|
| Serve + QA preview r2 | Chạy proposal server, click ba direction và kiểm tra mobile. |
| User chọn direction r2 | Ghi lựa chọn rồi chạy `$starci-fe-design-review`. |
| Backend package/installation/knowledge/Saga contracts | `$starci-be-feature-plan` sau khi direction được khóa. |

## selected direction — nivo-agentos-module-builder-r2

### CONTEXT

| Field | Resolution |
|---|---|
| Source | `D:\Repositories\starci-academy-backend` |
| Project | Explicit targets |
| Frontend | `D:\Repositories\nivo-fe` |
| Backend | `D:\Repositories\nivo-backend` |
| Charts | `D:\Repositories\nivo-charts` |
| App | `nivo` |
| Direction | **C — Giải pháp + Hệ thống** |
| Runtime | OpenClaw multi-agent gateway |
| Initial modules | `multichannel-chatbot`, `sales-copilot` |
| Phase | plan |

### OUTPUTS

| Concept | Result |
|---|---|
| Product hierarchy | Chốt hai nhịp `Giải pháp` và `Đã cài`; mỗi installation có Build/Operate riêng. |
| Runtime boundary | OpenClaw là runtime; Nivo sở hữu catalog, desired state, Saga, secret custody và compiler/reconciler. |
| First release | Chỉ đóng gói Chatbot đa kênh và Sales Copilot trước; các module sau dùng cùng engine và manifest contract. |
| Knowledge | Mỗi module ghép Nivo common + workspace shared được explicit bind + module private; không tự đọc private corpus của module khác. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\nivo\agentos-module-builder.md` | `modified` — ghi direction và hai module đầu đã chốt. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Direction đã được user chốt; chuyển sang Backend Feature Plan. |

### WARNINGS

| Warning | Impact |
|---|---|
| FE không được tự tạo agent/tool/channel theo một chuỗi mutation rời. | Một aggregate install command phải tạo desired state và trả installation/Saga identity. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Hermes thay OpenClaw trong release đầu | OpenClaw multi-agent gateway | OpenClaw hiện khớp mô hình nhiều agent, nhiều auth profile và nhiều channel account trong một workspace. |
| Browser gọi thẳng controlplane | FE gọi Nivo GraphQL; controlplane pull signed jobs | Giữ một tenant boundary và không mở inbound management surface vào pod. |

### OWED

| Owed | Cleared by |
|---|---|
| Exact backend source/test boundary | Workflow Feature Plan `agentos-solution-modules.md`. |
| Component tree và FE props | `$starci-fe-design-review` sau khi backend contract được Review khóa. |

## review — nivo-agentos-module-center-fe-r1

Approved revision: `nivo-agentos-module-center-fe-r1`

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
| Repo / branch | D:\Repositories\nivo-fe / main |
| Purpose | Khóa FE tree tiêu thụ bốn AgentOS solution-module GraphQL operations và render tiến trình theo exact installation id. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\nivo\agentos-module-builder.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow này; Review không viết production source. |

### CONTRACT EVIDENCE

| Owner | Live evidence | Review consequence |
|---|---|---|
| Workspace control center | `AgentOSWorkspacePage` đã sở hữu `overview`, `applications`, `infrastructure`, `operations`, `access`; `applications` chỉ render `OPENCLAW` và `N8N`. | Thêm peer section `solutions`; không đổi nghĩa `applications`. |
| Backend module catalog | `myAgentosSolutionModules` trả `key`, `version`, `name`, `summary`, `agentRoles`, `channelRoles`, `safetyMode`. | Catalog card chỉ render các field thật này. |
| Backend installation list | `myAgentosModuleInstallations(agentWorkspaceId)` trả entity GraphQL fields `id`, `agentWorkspaceId`, `moduleKey`, `moduleVersion`, `status`, `failureCode`, `createdAt`, `updatedAt`. | Installed card không phát minh progress phần trăm hoặc resource count. |
| Backend installation detail | `myAgentosModuleInstallation(installationId)` trả generated agents, shared source ids, channel refs và common/private knowledge version. | Route detail render đúng snapshot này; chưa dựng editor. |
| Backend install | `installAgentosSolutionModule(input)` nhận workspace, exact module key, idempotency key, fixed `nivo-default`, channel refs và shared source ids. | Release đầu cài default với hai mảng rỗng; setup channel/knowledge là feature riêng. |
| Realtime | `provisioning.saga.status` chứa `resourceKind`, `resourceId`, `status`, `stepKey`, `reason`; module Saga dùng `agentos_module_installation`. | Mở rộng hook bằng exact target `module-installation`; event khác id bị loại và reconnect refetch GraphQL snapshot. |

### INTERACTION CONSEQUENCE

| Interaction | Trigger | Product owner | Request / route | Visual states | Pending | Success | Failure | Persistence / shared effect | Evidence |
|---|---|---|---|---|---|---|---|---|---|
| Mở section Giải pháp | Press workspace tab | `AgentWorkspaceControlCenter` | Local section state | selected / unselected | N/A | Render module center trong cùng workspace | N/A | Không đổi server state | Existing `AgentOSWorkspaceSection` và `ChoiceTabs`. |
| Đổi Khám phá / Đã cài | Press secondary mode tab | `AgentOSSolutionModuleCenter` | Local mode state | catalog / installed | Giữ skeleton của mode đang tải | Hiện đúng card set | Refusal chỉ thay panel đang chọn | Không đổi installation | Direction C đã chọn; `ChoiceTabs` là leaf hiện hữu. |
| Cài solution module | Press Install trên catalog card | `ModuleInstallation` | `installAgentosSolutionModule` | idle / submitting / provisioning | Disable toàn bộ install CTA trong round trip; một `idempotencyKey` cho lần submit | Lưu installation id, chuyển `Đã cài`, refetch list và subscribe exact id | Hiện API refusal bằng live text; card trở lại actionable nếu chưa có installation | Durable installation + Saga | Backend r2 mutation và idempotency unique boundary. |
| Theo dõi provision | Socket receives exact module Saga event | `ModuleInstallation` | `provisioning.saga.status` | requested / provisioning / ready / degraded / failed | Card status phản ánh snapshot, không tự đoán phần trăm | Refetch list/detail khi event đến | Hiện `reason`/`failureCode` khi backend có | Owner-room event; exact installation id | Backend outbox/Kafka/gateway contract. |
| Reconnect realtime | Socket reconnects | `ModuleInstallation` | Refetch GraphQL list/detail | connecting / connected | Giữ snapshot cuối | Snapshot canonical thay event cũ | Giữ snapshot và hiện refusal nếu query fail | Không replay state từ browser | Existing hook reconnect behavior plus Review requirement. |
| Mở module đã cài | Press View details | `ModuleInstallation` | `/{locale}/agentos/workspaces/{workspaceId}/modules/{installationId}` | loading / ready / refused | Stable two-section skeleton | Hiện trạng thái và bindings đúng installation | Owner/not-found refusal | Route identity gồm workspace + installation | Backend owner-scoped detail query. |

### OWNER CHALLENGE

| Proposed owner | Live candidate challenged | Verdict | Evidence | Layer proof |
|---|---|---|---|---|
| `AgentOSSolutionModuleCenter` block | `AgentOSWorkspaceApplications` | `ADD` | Existing block owns runtime application capability and secure launch, không sở hữu package catalog/install/Saga. | Một block có query/mutation/loading/error riêng và một surface owner cho module fleet. |
| `_AgentOSSolutionModuleCenter` block twin | `AcademyIntegrationCenter` | `KEEP_APART` | Academy block owns provider credentials và write-only forms; module center owns package/install cards. Chỉ reuse leaves/composite. | Khác product owner và state union; copy shape bị cấm nên reuse `StatusActionCard`, `ChoiceTabs`, `SurfaceCard`. |
| `AgentOSSolutionModulePage` page | `AgentOSWorkspacePage` | `ADD` | Workspace page là peer-section control center; installation id cần route owner riêng và owner/not-found state riêng. | `L5`: route động phải có page owner; parent console shell vẫn reuse. |
| `AgentOSSolutionModuleSummary` block | `AgentOSWorkspaceSummary` | `ADD` | Workspace summary fields là plan/host/chart; module summary fields là package version/status/failure. | Một named business object, một surface và state family riêng. |
| `AgentOSSolutionModuleBindings` block | `HelmStackSnapshot` | `ADD` | Helm block owns components/storage; module bindings own agents/channels/knowledge versions. | Không cùng members hoặc contract; reuse `labelled-fact-stack` thay vì copy Helm table. |

### VISUAL JOB

| Visual element | Owner | Observable job | Complete states | Evidence / ruling |
|---|---|---|---|---|
| Workspace primary tab selected paint | `AgentOSWorkspacePage` | Phân biệt peer section cấp workspace với mode con của module center. | selected / unselected / focus-visible / disabled N/A | Set existing `ChoiceTabs.variant="primary"`; không thêm class hoặc icon. |
| Module secondary mode selected paint | `_AgentOSSolutionModuleCenter` | Cho biết người dùng đang duyệt catalog hay installation fleet. | selected / unselected / focus-visible | Reuse `ChoiceTabs` default secondary variant. |
| Module card surface | `StatusActionCard` trong `SurfaceCard` grid | Mỗi package/installation là một capability độc lập có identity, status và một action. | loading / idle / pending / ready / degraded / failed / disabled-installed | Reuse existing composite and `status-action-card-grid`; không thêm wrapper surface. |
| Status badge tone | `StatusActionCard` | Nhận biết lifecycle từ backend snapshot. | neutral=requested, warning=provisioning/degraded, success=ready, danger=failed | Mapping đóng trong connected block; unknown status về neutral, không ghép class. |
| Detail page surfaces | `AgentOSSolutionModuleSummary`, `AgentOSSolutionModuleBindings` | Tách package lifecycle khỏi runtime bindings/knowledge ACL vì hai nhóm có thành viên khác nhau. | loading / ready / refused / empty members | Hai block ngang hàng trên nền page; không card-in-card. |

### COMPONENT DELTA

| Layer | Owner | Action | Current path | Final path | Parent / call sites | Contract | Reason |
|---|---|---|---|---|---|---|---|
| shell | Console route-group shell | REUSE | `apps/app/src/app/[locale]/(console)/layout.tsx` | same | Workspace route và module detail route | `sidebar-then-body-app` → `console-body-main` | Cả hai là console destination đã auth-guarded. |
| layout | `ConsoleNav` | REUSE | `apps/app/src/components/layouts/ConsoleNav/index.tsx` | same | Console shell | `home-services-account-nav` | Module detail không phải global sidebar destination. |
| route | AgentOS workspace route | REUSE | `apps/app/src/app/[locale]/(console)/agentos/workspaces/[workspaceId]/page.tsx` | same | Next router | Existing route owner | Chỉ page subtree đổi. |
| route | AgentOS module detail route | ADD | N/A | `apps/app/src/app/[locale]/(console)/agentos/workspaces/[workspaceId]/modules/[installationId]/page.tsx` | Next router → `AgentOSSolutionModulePage` | Dynamic route owner | Exact workspace + installation identity. |
| page | `AgentOSWorkspacePage` connected | MODIFY | `apps/app/src/components/pages/AgentOSWorkspacePage/index.tsx` | same | Workspace route | Connected page twin | Thêm resolved `solutions` tab label; API ownership của module nằm trong block. |
| page | `_AgentOSWorkspacePage` pure | MODIFY | `apps/app/src/components/pages/AgentOSWorkspacePage/component.tsx` | same | Connected page twin | `tabbed-control-center-page` | Render `AgentOSSolutionModuleCenter` ở section mới và đổi parent tabs sang primary. |
| page | `AgentOSSolutionModulePage` connected | ADD | N/A | `apps/app/src/components/pages/AgentOSSolutionModulePage/index.tsx` | Module detail route | Connected page twin | Query detail, exact realtime target và reconnect refetch. |
| page | `_AgentOSSolutionModulePage` pure | ADD | N/A | `apps/app/src/components/pages/AgentOSSolutionModulePage/component.tsx` | Connected page twin | `titled-section-stack-page` | Compose title + hai domain blocks; không API JSX. |
| block | `AgentOSSolutionModuleCenter` connected | ADD | N/A | `apps/app/src/components/blocks/agentos/AgentOSSolutionModuleCenter/index.tsx` | `_AgentOSWorkspacePage` | Connected block twin | Sở hữu catalog/list/install/realtime state. |
| block | `_AgentOSSolutionModuleCenter` pure | ADD | N/A | `apps/app/src/components/blocks/agentos/AgentOSSolutionModuleCenter/component.tsx` | Connected block twin | `status-action-card-grid`, `body-with-refusal-note` | Render closed card projection cho từng mode. |
| block | `AgentOSSolutionModuleSummary` | ADD | N/A | `apps/app/src/components/blocks/agentos/AgentOSSolutionModuleSummary/index.tsx` | `_AgentOSSolutionModulePage` | `labelled-fact-stack` trong `SurfaceCard` | Lifecycle/package facts. |
| block | `AgentOSSolutionModuleBindings` | ADD | N/A | `apps/app/src/components/blocks/agentos/AgentOSSolutionModuleBindings/index.tsx` | `_AgentOSSolutionModulePage` | `labelled-fact-stack` trong `SurfaceCard` | Agent/channel/knowledge bindings. |
| branch | `Tree` | REUSE | `packages/ui/src/branches/Tree/index.tsx` | same | Pure pages | Existing contract frame | Không mở structural element bằng tay. |
| branch | `SurfaceCard` | REUSE | `packages/ui/src/branches/SurfaceCard/index.tsx` | same | Ba module blocks | Existing surface owner | Không thêm card primitive. |
| composite | `StatusActionCard` | REUSE | `packages/ui/src/composites/StatusActionCard/index.tsx` | same | Module center cards | `status-action-card` | Đúng identity/status/action shape. |
| composite | `EmptyNotice` | REUSE | `packages/ui/src/composites/EmptyNotice/index.tsx` | same | Installed empty state | Existing empty-state owner | Empty là state thật. |
| leaf | `ChoiceTabs` | REUSE | `packages/ui/src/leaves/ChoiceTabs/index.tsx` | same | Workspace tabs + center modes | Existing peer-choice leaf | Primary/secondary variants đã có. |
| leaf | `Heading`, `Text` | REUSE | `packages/ui/src/leaves/{Heading,Text}/index.tsx` | same | Pure page/blocks | Existing leaves | Không thêm typography primitive. |

### PROPS DELTA

| Owner | Prop / API | Action | Before | After | Producers / call sites | Migration proof |
|---|---|---|---|---|---|---|
| `AgentOSWorkspaceSection` | union | ADD | `overview \| applications \| infrastructure \| operations \| access` | thêm `solutions` | `AgentOSWorkspacePage` labels và `_AgentOSWorkspacePage` branch | Search hiện chỉ có hai files sở hữu union/call site. |
| `AgentOSWorkspacePageProps` | `workspaceId` | KEEP | required string | same | Workspace route | Không đổi route contract. |
| `AgentOSWorkspacePageLabels` | `tabs` data | KEEP | array theo section union | same type, thêm resolved item `solutions` | Connected page | Không thêm label prop riêng cho module block; block tự sở hữu translations. |
| `AgentOSWorkspacePageViewProps` | public props | KEEP | state/data/section/labels/actions | same | Connected page only | Module center lấy `data.workspace.id`; không mở rộng page prop surface. |
| `AgentOSSolutionModuleCenterProps` | `workspaceId` | ADD | N/A | required string | `_AgentOSWorkspacePage` | Exact owner scope, không nhận whole control-center aggregate. |
| `AgentOSSolutionModuleCenterViewProps` | pure state contract | ADD | N/A | closed `state`, `mode`, `cards`, `pendingId`, `outcome`, mode/action callbacks | Connected center only | Connected/pure twin boundary; không truyền raw `Result` hoặc API function. |
| `AgentOSSolutionModulePageProps` | route identities | ADD | N/A | required `workspaceId`, `installationId` | Dynamic route only | Cả hai param được await và truyền nguyên vẹn. |
| `AgentOSSolutionModulePageViewProps` | pure page contract | ADD | N/A | closed loading/refused/ready state, detail data, labels | Connected detail page only | Pure page không import API/session/realtime. |
| `AgentOSSolutionModuleSummaryProps` | detail + labels | ADD | N/A | required `installation`, resolved labels | Pure module page | Chỉ nhận read-model fields dùng để vẽ. |
| `AgentOSSolutionModuleBindingsProps` | detail + labels | ADD | N/A | required `installation`, resolved labels | Pure module page | Empty arrays được render bằng translated empty value. |
| `ProvisioningTarget` | target union | ADD | order/deployment/workspace | thêm exact `{ kind: "module-installation"; id: string }` | Module center/detail; existing callers unchanged | Exhaustive saga mapping cập nhật; event khác id bị loại. |
| `ProvisioningEvent` | event union | ADD | workspace/runtime/deployment/order | thêm module-installation event với step/reason | Hook consumers | Existing workspace narrowing vẫn compile; new consumers narrow exact kind. |
| `console.ts` | four module API functions/types | ADD | N/A | catalog, list, detail, install typed results | Module center/detail connected owners | Mỗi document giữ đúng một root field theo transport invariant. |
| `ChoiceTabsProps` | `variant` | KEEP | optional primary/secondary | same | Existing workspace call now supplies `primary`; center uses default secondary | Không sửa UI package API. |
| AgentOS module detail route | route params | KEEP | N/A | `workspaceId` + `installationId` | Next route → connected page | Route chỉ chuyển exact identities; không mở public component props. |
| `AgentOSWorkspacePage` connected | public props | KEEP | `workspaceId` | same | Existing workspace route | Connected owner vẫn chỉ nhận workspace identity. |
| `_AgentOSWorkspacePage` pure | public props | KEEP | closed view props | same shape; union có `solutions` | Connected workspace page | Không truyền API functions hoặc raw Result vào pure twin. |
| `AgentOSSolutionModulePage` connected | public props | ADD | N/A | `workspaceId` + `installationId` | Module detail route | Exact owner identities; query và realtime ở connected twin. |
| `_AgentOSSolutionModulePage` pure | public props | ADD | N/A | closed state/data/labels | Connected module page | Pure twin không import transport/session. |
| `AgentOSSolutionModuleCenter` connected | public props | ADD | N/A | `workspaceId` | Pure workspace page | Block chỉ nhận exact owner scope. |
| `_AgentOSSolutionModuleCenter` pure | public props | ADD | N/A | closed state/mode/cards/actions | Connected module center | Pure twin không nhận raw API result. |
| `AgentOSSolutionModuleSummary` | public props | ADD | N/A | installation + resolved labels | Pure module detail page | Chỉ nhận package/lifecycle read fields. |
| `AgentOSSolutionModuleBindings` | public props | ADD | N/A | installation + resolved labels | Pure module detail page | Chỉ nhận agent/channel/knowledge read fields. |

### SUPPORTING PRODUCTION BOUNDARY

| Action | Exact path | Responsibility |
|---|---|---|
| MODIFY | `apps/app/src/modules/api/console.ts` | Thêm closed wire types và bốn GraphQL calls đúng backend r2. |
| MODIFY | `apps/app/src/modules/realtime/provisioning.ts` | Exact module-installation target/event và Saga mapping. |
| MODIFY | `apps/app/src/messages/en.json` | Module center/detail copy và workspace tab. |
| MODIFY | `apps/app/src/messages/vi.json` | Module center/detail copy và workspace tab. |
| MODIFY | `apps/app/src/components/pages/AgentOSWorkspacePage/index.tsx` | Resolve tab copy. |
| MODIFY | `apps/app/src/components/pages/AgentOSWorkspacePage/component.tsx` | Mount module center. |
| ADD | `apps/app/src/components/blocks/agentos/AgentOSSolutionModuleCenter/{index.tsx,component.tsx}` | Connected/pure module catalog + fleet. |
| ADD | `apps/app/src/app/[locale]/(console)/agentos/workspaces/[workspaceId]/modules/[installationId]/page.tsx` | Route owner. |
| ADD | `apps/app/src/components/pages/AgentOSSolutionModulePage/{index.tsx,component.tsx}` | Connected/pure detail page. |
| ADD | `apps/app/src/components/blocks/agentos/AgentOSSolutionModuleSummary/index.tsx` | Package/lifecycle facts. |
| ADD | `apps/app/src/components/blocks/agentos/AgentOSSolutionModuleBindings/index.tsx` | Agents/channels/knowledge facts. |

### OWNER STATES

| Owner | Loading | Empty | Pending | Success | Failure |
|---|---|---|---|---|---|
| Module catalog mode | Hai `StatusActionCard` skeletons | Không hợp lệ với immutable two-package backend; empty payload hiển thị translated empty notice | Install card pending, peer install actions disabled | Exact two catalog cards | Section refusal; installed mode vẫn độc lập. |
| Installed mode | Hai card skeletons | `EmptyNotice` với CTA ngữ cảnh quay lại Khám phá | Newly created installation card lấy status từ snapshot/event | Cards link exact detail route | Query refusal hoặc per-card failed/degraded status. |
| Install mutation | Giữ catalog | N/A | Một active submit; duplicate press disabled | Switch installed + refetch + subscribe id | API refusal trong `aria-live`; không giả rollback. |
| Detail page | Hai settled-shape skeleton sections | Arrays rỗng dùng translated empty value | Realtime giữ last snapshot | Summary + bindings | Owner/not-found refusal thay toàn page body. |

### ACCEPTANCE EVIDENCE

| Claim | Proof |
|---|---|
| Contract parity | Network documents select only backend r2 fields; catalog/list/detail/install each has one root field. |
| Component boundary | Baseline diff khớp từng non-REUSE `COMPONENT DELTA` và `PROPS DELTA`; không sửa `packages/ui`. |
| Static gates | `npm run lint`, `npm run typecheck`, `npm run build`. |
| Desktop render | Signed-in test account mở workspace → Giải pháp; kiểm Khám phá, Đã cài, detail tại 1440×900. |
| Mobile render | Cùng flow tại 390×844; cards stack, tabs không clip/overflow, CTA vẫn đạt target. |
| Live install | Cài Chatbot rồi Sales; Network mutation 200/envelope success, UI chuyển provisioning → ready từ Kafka/Socket event và GraphQL refetch. |
| Reconnect | Ngắt/kết nối lại socket hoặc reload giữa provisioning; detail/list lấy canonical snapshot, không lùi status. |
| Runtime evidence | Browser Console không error; core/controlplane/FE terminal không exception chưa giải thích; workflow ghi UI, Network, Console, Terminal và verdict. |

### OUTPUTS

| Concept | Result |
|---|---|
| Reviewed direction | C — `Giải pháp` + `Đã cài`, được đặt trong workspace control center với detail route riêng. |
| Candidate revision | `nivo-agentos-module-center-fe-r1`. |
| Acceptance meaning | FE chỉ được báo hoàn tất khi hai module cài qua GraphQL thật, nhận exact Socket.IO Saga status và refetch snapshot sau reconnect. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\nivo\agentos-module-builder.md` | `modified` — append Review r1, component/props delta và acceptance evidence. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Duyệt exact FE production boundary để Apply? | **Duyệt `nivo-agentos-module-center-fe-r1`**; hoặc nêu một thay đổi cụ thể. |

### WARNINGS

| Warning | Impact |
|---|---|
| Các reference `fe/creativity/{critique,selection,contract-graph,verification,research}.md` và `fe/canon/uxui/layers` mà skill trỏ tới không còn tồn tại sau trust-tree migration. | Review dùng live source cùng các tài liệu thay thế dưới `fe/gates/{patterns,blocks,layouts,principles}`; cần sửa skill path bằng workflow upgrade riêng. |
| Backend r2 chưa có bind shared knowledge, channel setup, upgrade, retry-failed hoặc uninstall mutation. | FE release này chỉ cài default, theo dõi, liệt kê và xem snapshot; không dựng control giả. |
| Gateway vẫn phát thêm fallback `workspace.status` cho module resource ngoài generic Saga event. | FE chỉ consume exact `provisioning.saga.status`; backend cleanup enum/routing nên đi qua Backend Feature/Audit riêng. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Nhét solution modules vào `Applications` | Thêm workspace tab `Giải pháp` | `Applications` đang sở hữu OpenClaw/n8n runtime capabilities, không phải package catalog. |
| Dựng Build/Operate editor ngay | Detail read-only từ contract thật | Backend chưa có mutations cho bind/upgrade/uninstall; UI không được phát minh capability. |
| Tạo module-specific card/composite mới | Reuse `StatusActionCard`, `ChoiceTabs`, `SurfaceCard` | Existing contracts đã khớp identity/status/action và peer mode. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval `nivo-agentos-module-center-fe-r1` | User replies `Duyệt nivo-agentos-module-center-fe-r1`. |
| Production implementation và browser live proof | `$starci-fe-design-apply` sau approval. |
| Channel/shared knowledge setup, upgrade, retry, uninstall UX | Backend Feature Plan/Review/Apply tương ứng, rồi FE Design continuation. |
| Repair stale skill reference paths | `$starci-fe-upgrade-plan` dựa trên warning này. |

## apply r1

Applied revision: `nivo-agentos-module-center-fe-r1`

Baseline commit: `7bc2ff4`

Tracked diff: `7bc2ff4..019947b`

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
| Repo / branch | Source D:\Repositories\starci-academy-backend @ mtp; Frontend D:\Repositories\nivo-fe @ main; Backend D:\Repositories\nivo-backend @ main |
| Purpose | Apply module catalog, install fleet, detail route và exact module Saga realtime target đã được duyệt. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\nivo\agentos-module-builder.md |
| Language | vi |
| Frontend baseline | `7bc2ff4` (`feat: add academy control center`) |
| Frontend implementation | `019947b` (`feat: add AgentOS solution module center`) |
| Backend capability | `8ae521e` (`feat: add AgentOS solution module provisioning`) |
| Phase | apply |
| Touching | D:\Repositories\nivo-fe approved 13-path boundary; D:\Repositories\starci-academy-backend\.workflows\designs\nivo\agentos-module-builder.md |

### OUTPUTS

| Concept | Result |
|---|---|
| Workspace destination | Thêm tab cấp chính `Giải pháp` trong AgentOS workspace, tách khỏi `Applications`. |
| Module catalog | Render hai package backend thật: Chatbot đa kênh và Sales Copilot; package đã cài bị khóa đúng trạng thái. |
| Installation fleet | Thêm mode `Đã cài`, lifecycle badge, version và link chi tiết theo đúng installation identity. |
| Installation detail | Thêm route động và hai block độc lập cho package/lifecycle cùng agents/channels/knowledge bindings. |
| Realtime | Mở rộng target/event bằng exact `module-installation`; chỉ nhận generic `provisioning.saga.status` đúng resource id rồi refetch snapshot canonical. |
| Runtime correction | Trì hoãn cây HeroUI tabs đến client mount; hydration mismatch tìm thấy trong browser proof không còn tái hiện. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\nivo-fe\apps\app\src\modules\api\console.ts` | Thêm closed wire types và bốn GraphQL operations catalog/list/detail/install. |
| `D:\Repositories\nivo-fe\apps\app\src\modules\realtime\provisioning.ts` | Thêm exact module installation target/event mapping. |
| `D:\Repositories\nivo-fe\apps\app\src\components\pages\AgentOSWorkspacePage` | Thêm primary Solutions section và client-mount hydration guard. |
| `D:\Repositories\nivo-fe\apps\app\src\components\blocks\agentos\AgentOSSolutionModuleCenter` | Thêm connected/pure module catalog, installed fleet và install action. |
| `D:\Repositories\nivo-fe\apps\app\src\app\[locale]\(console)\agentos\workspaces\[workspaceId]\modules\[installationId]\page.tsx` | Thêm route owner cho installation detail. |
| `D:\Repositories\nivo-fe\apps\app\src\components\pages\AgentOSSolutionModulePage` | Thêm connected/pure detail page với exact realtime subscription. |
| `D:\Repositories\nivo-fe\apps\app\src\components\blocks\agentos\AgentOSSolutionModuleSummary` | Thêm block package/lifecycle facts. |
| `D:\Repositories\nivo-fe\apps\app\src\components\blocks\agentos\AgentOSSolutionModuleBindings` | Thêm block generated agents, channels và knowledge facts. |
| `D:\Repositories\nivo-fe\apps\app\src\messages\{en,vi}.json` | Thêm copy song ngữ cho tab, catalog, fleet và detail. |

### PROOF

| Gate | Result |
|---|---|
| Typecheck | PASS — `npm run typecheck`, 4/4 packages. |
| Product lint | PASS — `npx turbo run lint`, 4/4 packages, zero error. |
| Production build | PASS — `npm run build`, 3/3 tasks; route `/[locale]/agentos/workspaces/[workspaceId]/modules/[installationId]` được emit. |
| Backend lint | PASS — `npm run lint:check` exit 0, zero error; 1792 warning cũ ngoài FE boundary. |
| Diff integrity | PASS — staged `git diff --check`; commit đúng 13 approved paths, 660 insertions và 11 deletions. |
| Component boundary | PASS — không sửa `packages/ui`; mọi ADD/MODIFY khớp `COMPONENT DELTA`, `PROPS DELTA` và supporting boundary đã duyệt. |

### CROSS-REPOSITORY LINT PROOF

| Repository | Command | Result |
|---|---|---|
| Frontend | `npx turbo run lint` | PASS — App/UI/Expert/Landing đều thành công. |
| Backend | `npm run lint:check` | PASS — zero error; warning debt đã tồn tại trước feature. |
| Canon mirror | Root `npm run lint` preflight | OWED — local plugin mirror lệch trust-tree ngoài approved boundary; không chạy `--write` trong feature Apply. |

### LIVE FLOW PROOF

| Field | Evidence |
|---|---|
| Flow | Sign in → AgentOS workspace → Giải pháp → cài Chatbot đa kênh → cài Sales Copilot → Đã cài → mở detail. |
| Persona | Local Nivo tester owner; credential omitted. |
| Fixture repair | Historical workspace là `agent_os` nhưng `instances.app_id` NULL. Apply backfill đúng một instance sang registry key `agentos`; không xóa hoặc sửa workspace khác. |
| Steps | Đăng nhập UI thật; mở workspace `d44a8fed-6e31-4634-9dae-44dd00165f2d`; cài lần lượt hai module; mở cả catalog, fleet và detail; reload bằng tab browser mới; kiểm 390×844 rồi reset viewport. |
| UI | Catalog trả đúng hai solution; mutation chuyển sang `Đã cài`; cả hai installation hiện `Provisioning`; detail hiển thị version, generated agents, empty channel/shared knowledge và common/private knowledge version. Mobile stack không overflow. |
| Network | Hai GraphQL install requests trả application envelope thành công, thể hiện bằng hai installation id và durable rows. Catalog/list/detail refetch đều trả data thật. Browser control không expose DevTools Network status trực tiếp nên không ghi mã HTTP suy đoán. |
| Saga | Cả hai Saga hoàn thành `reserve-installation`, `pin-manifest`, `compose-desired-state`, `queue-runtime-reconcile`; mỗi installation có một `RECONCILE_AGENTOS_MODULE` job queued và đang chờ pod-side callback. |
| Socket.IO | FE subscribe exact module installation id và giữ snapshot canonical qua reload. Không có terminal event Ready vì cluster hiện không có tenant AgentOS pod để poll runtime job; không giả lập callback. |
| Console | Run đầu phát hiện HeroUI hydration mismatch. Sau sửa, fresh browser tab đi qua workspace → Solutions → Installed → detail với zero warning/error mới. |
| Terminal | FE trả 200 cho workspace/detail routes. BE bật AgentOS worker, enqueue cả hai BullMQ jobs và khởi động thành công; Qdrant compatibility, data mount và embedding warning là runtime debt cũ. Tino cluster có 3 node Ready nhưng chỉ còn system pods, không có tenant pod. |
| Verdict | FE/UI/API/Saga enqueue PASS. End-to-end `queued → Ready` và Socket Ready event OWED vì tenant AgentOS pod đã bị dọn khỏi cluster. |
| Evidence | Browser để tại module detail; FE `3066`, BE `3067`; implementation commit `019947b`. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | None |

### WARNINGS

| Warning | Impact |
|---|---|
| Tino cluster hiện chỉ có system pods, không có AgentOS tenant pod cho historical workspace. | Pod runtime job không thể được poll/ack; installation giữ đúng trạng thái `Provisioning`. |
| Root FE lint preflight thấy canonical plugin mirror drift. | Cần FE lint-sync lifecycle riêng; product workspace lint hiện xanh. |
| Apply skill còn trỏ tới hai creativity reference đã bị trust-tree migration xóa. | Cần FE upgrade lifecycle sửa skill path; không ảnh hưởng source implementation đã proof. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Giả callback pod để ép installation thành Ready | Giữ queued state và ghi OWED | Live proof không được biến fixture thành bằng chứng runtime giả. |
| Thêm bind/upgrade/uninstall/retry controls | Detail read-only theo contract backend hiện có | Backend r2 chưa sở hữu các mutations này. |
| Sửa `ChoiceTabs` package ngoài boundary | Client-mount guard ở approved workspace page | Giữ nguyên UI package và exact production boundary. |

### OWED

| Owed | Cleared by |
|---|---|
| Runtime reconcile và Socket.IO Ready cho hai installation | Provision/restore một AgentOS tenant pod có registration key, để pod poll hai `RECONCILE_AGENTOS_MODULE` jobs; rerun UI reload/reconnect proof. |
| Root canon mirror gate | Chạy `starci-fe-lint-sync-plan` → Review → Apply cho `D:\Repositories\nivo-fe`. |
| Channel/shared knowledge setup, upgrade, retry và uninstall UX | Backend Feature Plan/Review/Apply tương ứng, rồi FE Design continuation. |
| Repair stale Apply skill reference paths | Chạy `starci-fe-upgrade-plan` theo warning đã ghi. |
