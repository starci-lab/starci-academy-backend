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
| App | nivo / core |
| Repo / branch | Backend D:\Repositories\nivo-backend @ main; dirty worktree contains unrelated user changes and must be preserved |
| Purpose | Chuyển publication owner của `publishExpertSite` từ legacy `ExpertDeployService` sang durable `ExpertProvisionDispatcher`. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\nivo\publish-expert-site-durable-owner.md |
| Language | vi |
| Phase | plan |
| Touching | Chỉ workflow này và source/test evidence đọc trong Plan; không viết backend production source. |

Invisible context rows: App = `nivo / core` vì monorepo có nhiều app/auth surface; Database = primary PostgreSQL vì site, deployment và job ledger dùng connection này.

### LIVE SCHEMA

| Evidence | Result |
|---|---|
| GraphQL introspection | Core `http://localhost:3067/graphql` trả `publishExpertSite` và `provisionExpertSite`; schema không cần đổi. |
| Current publish | Save Live rồi fire-and-forget `ExpertDeployService.deploy`, đang gọi legacy `tools/provision.mjs`. |
| Durable sibling | `provisionExpertSite` guard Live rồi gọi `ExpertProvisionDispatcher.dispatch`, tạo deployment + job và enqueue BullMQ. |
| Realtime | Durable watcher/gateway là owner của deployment transitions; FE subscribes exact deployment id. |

### SOURCE EVIDENCE

| File | Finding |
|---|---|
| `src/features/core/api/core/graphql/mutations/expert-sites/publish-expert-site/publish-expert-site.service.ts` | Wrong owner: `ExpertDeployService` legacy. |
| `src/modules/bussiness/expert-provision/expert-provision.dispatcher.ts` | Correct durable owner: transaction, deployment row, job ledger, queue. |
| `src/modules/bussiness/expert-provision/chart/expert-chart-installer.service.ts` | Helm direct với values stdin; dùng `EXPERT_PROVISION_REPO_PATH`. |
| `D:/Repositories/nivo/tools/provision-expert.mjs` | Template tool hiện có, nhận `apply --id` và values qua stdin. |
| `src/features/.../provision-expert-site/provision-expert-site.service.ts` | Sibling đã dùng durable dispatcher; không tạo owner thứ hai. |
| `publish-expert-site.service.spec.ts` | Twin hiện assert legacy deploy; cần migrate sang dispatcher. |
| `src/tests/e2e/nivo/expert-site-goes-live.e2e-spec.ts` | HTTP flow hiện override legacy service; cần chuyển durable boundary. |
| `src/tests/e2e/nivo/expert-site-publish.live-spec.ts` | Live flow hiện ghi legacy `provision.mjs`; cần chứng minh tool/chart durable. |

### PROPOSED FILE TREE

| Layer | Exact path | Action | Shape decision |
|---|---|---|---|
| mutation service | `src/features/core/api/core/graphql/mutations/expert-sites/publish-expert-site/publish-expert-site.service.ts` | MODIFY | Giữ ownership/publication guard; inject dispatcher; dispatch duy nhất khi Live. |
| mutation twin | `src/features/core/api/core/graphql/mutations/expert-sites/publish-expert-site/publish-expert-site.service.spec.ts` | MODIFY | Branch matrix cho missing, Draft/Live/Suspended, publish/unpublish, reject và exactly-one dispatch. |
| app module | `src/features/core/api/core/graphql/mutations/expert-sites/publish-expert-site/publish-expert-site.module.ts` | VERIFY / REUSE | Durable module đã global; chỉ đổi nếu DI runtime chứng minh thiếu, không thêm sideways import. |
| lifecycle e2e | `src/tests/e2e/nivo/expert-site-goes-live.e2e-spec.ts` | MODIFY | Vào qua GraphQL, real queue boundary, poll state/deployment và owner isolation. |
| live K8s e2e | `src/tests/e2e/nivo/expert-site-publish.live-spec.ts` | MODIFY | GraphQL → durable job → Helm/chart → K8s → watcher; không gọi worker nội bộ. |
| workflow | `D:\Repositories\starci-academy-backend\.workflows\feature\nivo\publish-expert-site-durable-owner.md` | WRITE | Plan/Review/Apply record. |

### TEST MATRIX

| Case | Boundary | Expected |
|---|---|---|
| Missing/other owner | GraphQL publish | Domain not-found; no dispatch. |
| Draft + publish true | GraphQL publish | Live, first publishedAt, one durable dispatch. |
| Live + publish false | GraphQL publish | Draft, publishedAt preserved, no dispatch. |
| Republish / Suspended | GraphQL publish | Explicit retry policy; Suspended remains unchanged/no dispatch. |
| Dispatcher reject | GraphQL publish | Saved Live response; deployment/job owns async failure. |
| Duplicate in-flight | Durable dispatcher | Existing already-running exception; no second job/deployment. |
| Worker install | Real queue/worker | `provision-expert.mjs`/Helm receives stdin values; Pending → Building/Running/Failed. |
| Watcher/socket | Real Socket.IO | Exact matching deployment event reaches owner; unrelated id is ignored. |
| Live K8s | GraphQL → queue → cluster | Read back namespace/chart objects and terminal status. |

### ASSUMPTIONS AND EXCLUSIONS

| Item | Decision |
|---|---|
| API shape | Keep existing `publishExpertSite`; no schema or FE API change. |
| Shell mechanism | No new `execa`; existing installer already uses `spawn` + stdin-safe Helm. |
| Worker | Live proof needs `EXPERT_PROVISION_WORKER_ENABLED=true`, valid cluster/kubeconfig and `D:/Repositories/nivo`. |
| Dirty worktree | Preserve unrelated changes; Apply must not baseline/commit them implicitly. |
| Excluded | FE source, schema redesign, chart/queue/secret redesign, legacy deploy retirement and unrelated cleanup. |

### OUTPUTS

| Concept | Result |
|---|---|
| Capability brief | `publishExpertSite` is the publication door and durable provisioning is the sole deployment owner. |
| Architecture | `publish → durable dispatch → queue worker → Helm/chart → K8s watcher → Socket.IO`. |
| Plan verdict | Narrow service/twin/e2e migration; no new GraphQL operation. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\feature\nivo\publish-expert-site-durable-owner.md` | `added` — Plan only; no product source. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Durable owner | **Use `ExpertProvisionDispatcher` as sole owner after publish** (user-approved); or retain broken legacy owner. |
| Live worker proof | Enable durable worker with valid local chart/tool and K8s credentials; or record K8s proof as OWED. |

### WARNINGS

| Warning | Impact |
|---|---|
| Backend worktree is heavily dirty. | Apply baseline/commit must be isolated; unrelated changes cannot be staged implicitly. |
| Publish and provision mutations currently represent different owners. | Calling both from FE double-dispatches; fix publish owner itself. |
| Browser proof hit `tools/provision.mjs failed: unknown`. | Direct evidence of legacy owner drift, not missing template or FE Socket failure. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Add `execa` inside publish | Existing durable dispatcher/installer | Keeps queue, retry, secrets, deployment row and watcher semantics. |
| Publish then provision from FE | One publish-owned durable dispatch | Avoids two pipelines. |
| Rename/copy current tool to legacy name | Route to current durable owner | Prevents split chart/tool ownership. |

### OWED

| Owed | Cleared by |
|---|---|
| Review approval | Run `starci-be-feature-review` against this tree and matrix. |
| Safe Apply baseline | Isolate the intended backend write boundary from dirty user changes. |
| Live ready/Socket proof | Enable durable worker and run real GraphQL → queue → K8s → Socket flow. |

Invite: `$starci-be-feature-review`

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
| App | nivo / core |
| Repo / branch | Backend D:\Repositories\nivo-backend @ main; dirty worktree preserved |
| Purpose | Challenge and freeze the durable publication-owner boundary before Apply. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\nivo\publish-expert-site-durable-owner.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow này và review evidence; không viết production source. |

### REVIEW FINDINGS

| Finding | Verdict |
|---|---|
| Schema | Keep existing `publishExpertSite`; no GraphQL change. |
| Dependency wiring | `ExpertProvisionModule` is `@Global`, exported and registered by `apps/core/src/app.module.ts`; publish module stays unchanged. |
| Deployment owner | Replace only `ExpertDeployService` injection/call in publish service with `ExpertProvisionDispatcher.dispatch({ site: saved, ownerUserId: user.id })`. |
| Async behavior | Keep fire-and-forget mutation response; dispatcher rejection is logged, while durable deployment/job rows own failure. |
| Tool boundary | Do not add execa. Durable installer already runs Helm with `spawn`, stdin values and `D:/Repositories/nivo` chart source. |
| Double dispatch | FE remains `create → publish`; no FE `provisionExpertSite` call. Publish becomes the sole owner. |
| E2E boundary | Existing lifecycle flow's fake must move from `ExpertDeployService` to the durable boundary or be replaced by a real queue/worker path; live spec must enter through GraphQL and prove real cluster/chart/watch. |

### COMPONENT DELTA

| Layer | Owner | Action | Current path | Final path | Parent / call sites | Contract | Reason |
|---|---|---|---|---|---|---|---|
| mutation service | PublishExpertSiteService | MODIFY | `src/features/core/api/core/graphql/mutations/expert-sites/publish-expert-site/publish-expert-site.service.ts` | same | PublishExpertSiteResolver | save publication + durable dispatch | Existing mutation is the correct public door; only owner changes. |
| unit twin | PublishExpertSiteService spec | MODIFY | `src/features/core/api/core/graphql/mutations/expert-sites/publish-expert-site/publish-expert-site.service.spec.ts` | same | service | branch matrix + dispatch consequence | Existing twin encodes old owner and must follow the approved owner. |
| lifecycle e2e | Expert-site-goes-live flow | MODIFY | `src/tests/e2e/nivo/expert-site-goes-live.e2e-spec.ts` | same | GraphQL flow | real HTTP entry + durable consequence | Prevent stale legacy override; preserve owner/isolation assertions. |
| live e2e | Expert-site-publish live flow | MODIFY | `src/tests/e2e/nivo/expert-site-publish.live-spec.ts` | same | GraphQL → queue → cluster | real K8s chart/tool/watcher | Existing live proof names retired legacy path. |
| mutation module | PublishExpertSiteSingleMutationModule | REUSE | `src/features/core/api/core/graphql/mutations/expert-sites/publish-expert-site/publish-expert-site.module.ts` | same | app composition root | global durable provider | `ExpertProvisionModule` already owns cross-capability wiring. |

### PROPS DELTA

| Owner | Prop / API | Action | Before | After | Producers / call sites | Migration proof |
|---|---|---|---|---|---|---|
| PublishExpertSiteService | GraphQL input | KEEP | `PublishExpertSiteInput { siteId, published }` | same | Nivo FE/other GraphQL clients | Existing schema introspection and resolver unchanged. |
| PublishExpertSiteService | deployment collaborator | MODIFY | `ExpertDeployService.deploy(site, userId)` | `ExpertProvisionDispatcher.dispatch({ site, ownerUserId: userId })` | publish service only | Twin spec + durable live e2e. |
| FE Template App | mutation sequence | KEEP | create → publish | same, with publish now durable-owned | `TemplateAppProvisioning` | FE code remains unchanged in this BE feature. |

### APPROVED ACCEPTANCE

| Proof | Required result |
|---|---|
| Unit | All publish branches and exactly-one durable dispatch are green. |
| Flow | GraphQL publish creates/updates Live site and durable deployment/job consequence; no worker method is called directly by e2e. |
| Runtime | With worker enabled and valid `D:/Repositories/nivo` + K8s, Helm/chart applies and watcher emits matching Socket.IO status. |
| Negative | Unrelated owner/id is refused; duplicate in-flight dispatch does not create a second job/deployment. |
| FE regression | Existing Nivo browser flow reaches accepted/preparing/ready or honest failed from the durable deployment snapshot. |

### OUTPUTS

| Concept | Result |
|---|---|
| Approved capability | `publishExpertSite` becomes the durable publication/provisioning door. |
| Approved revision | `nivo-publish-expert-site-durable-owner-r1`. |
| Preserved boundary | Existing schema, FE API, global module wiring and exact Socket.IO identity remain unchanged. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\feature\nivo\publish-expert-site-durable-owner.md` | `modified` — appended Review r1; no production source. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Apply write boundary | **Modify exactly the two publish service/test files and two named e2e files; leave module, schema, FE and unrelated dirty changes untouched** (recommended), or broaden the boundary. |
| Dirty backend worktree | Preserve unrelated changes and create an isolated baseline/patch for only the approved files, or stop Apply until the worktree is cleaned by its owner. |

### WARNINGS

| Warning | Impact |
|---|---|
| `EXPERT_PROVISION_WORKER_ENABLED` is currently off in local runtime. | Unit/flow proof can run, but ready/Socket runtime proof remains OWED until the worker is explicitly enabled. |
| Existing live E2E references old Tino kubeconfig and legacy tool names. | It must be updated in the approved test boundary; it cannot be called green before that. |
| Backend worktree has unrelated modifications. | Apply cannot commit a whole-tree baseline without capturing user work. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| `execa` from publish service | Durable dispatcher | Shell invocation would bypass the queue/ledger/watcher contract. |
| Add a module import edge from publish mutation to expert-provision module | Reuse existing `@Global` composition | Module-layering requires cross-capability wiring at app root. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit confirmation of exact Apply boundary and dirty-worktree handling | User confirms the two service/test files + two e2e files and preservation rule. |
| Ready/Socket proof | Enable durable worker and provide valid cluster runtime; then execute the approved live flow. |

Approved revision: `nivo-publish-expert-site-durable-owner-r1` (architecture/product direction approved; Apply write boundary awaits confirmation).

Invite: `$starci-be-feature-apply`

## APPLY

### CONTEXT

| Field | Resolved value |
|---|---|
| Workdir | `D:\Repositories\nivo-backend` |
| Source | `D:\Repositories\starci-academy-backend` |
| Project | `nivo` |
| Frontend | `D:\Repositories\nivo-fe` |
| Backend | `D:\Repositories\nivo-backend` |
| Trust | `D:\Repositories\starci-academy-backend\.claude` |
| Skills | `D:\Repositories\starci-academy-backend\.claude\skills` |
| App | `nivo` |
| Workflow root | `D:\Repositories\starci-academy-backend\.workflows` |
| Workflow | `feature/nivo/publish-expert-site-durable-owner.md` |
| Phase | Apply |
| Approved revision | `nivo-publish-expert-site-durable-owner-r1` |
| Baseline | `c98bd2b chore: baseline publish durable owner boundary` |

### APPLIED CHANGE

The publish mutation now injects `ExpertProvisionDispatcher` and calls `dispatch({ site: saved, ownerUserId: user.id })` after a Live publication. The legacy `ExpertDeployService` owner and direct shell/execa proposal were not used. The approved four backend files were updated; module, schema, frontend source and unrelated worktree changes were left untouched.

### PROOF

| Check | Result | Evidence |
|---|---|---|
| Twin spec | PASS | 9/9 tests passed for `publish-expert-site.service.spec.ts`. |
| Build | PASS | `npm run build` completed successfully. |
| Target lint | PASS with 1 pre-existing-style warning | `npx eslint` on the four approved files: 0 errors; one `starci-be/no-inline-param-type` warning in the existing lifecycle test. |
| Direct GraphQL flow | PASS through durable enqueue | Test account sign-in HTTP 200; create and publish HTTP 200; site became Live; deployment row `017215a9-1bc4-4498-aa65-708235e73795` was created as `pending`; job `e81b32f3-4cf3-467c-a3a0-d2313fb91d13` was enqueued on `provision-expert-site`. |
| Queue owner log | PASS | Backend log recorded `ExpertProvisionDispatcher dispatched provision ...` for the published site. |
| K8s readiness / Socket.IO | OWED | Cluster and kubeconfig are healthy, but the running backend reports `expert provisioning worker disabled; not draining the queue`; no ready/watch event can be claimed. |
| Full lifecycle E2E | OWED | The Jest E2E bootstrap hung and was terminated without a test result; only startup warnings were observed. |

### LIVE FLOW PROOF

| Flow | Persona | Steps | UI | Network | Console | Terminal | Verdict |
|---|---|---|---|---|---|---|---|
| Publish expert site durable handoff | `tester@nivo.local` | sign in → create site → publish Live → query deployment | Not applicable to direct backend proof | token HTTP 200; create/publish HTTP 200; GraphQL returned no errors | no browser console proof in this backend Apply | enqueue and dispatcher logs present; cluster namespace listing succeeded; worker disabled | PASS for publish → queue/ledger, OWED for K8s ready/Socket |

No password, token, cookie or secret was written to this workflow.

### OUTPUTS

| File | Result |
|---|---|
| `D:\Repositories\nivo-backend\src\features\core\api\core\graphql\mutations\expert-sites\publish-expert-site\publish-expert-site.service.ts` | durable owner applied |
| `D:\Repositories\nivo-backend\src\features\core\api\core\graphql\mutations\expert-sites\publish-expert-site\publish-expert-site.service.spec.ts` | twin migrated and green |
| `D:\Repositories\nivo-backend\src\tests\e2e\nivo\expert-site-goes-live.e2e-spec.ts` | durable boundary override applied |
| `D:\Repositories\nivo-backend\src\tests\e2e\nivo\expert-site-publish.live-spec.ts` | legacy ownership wording/boundary updated |

### WARNINGS

| Warning | Impact |
|---|---|
| Baseline commit was created while unrelated files were already staged | `c98bd2b` contains the pre-existing staged user changes as well as the baseline boundary; no reset/revert was performed. |
| Worker remains disabled in the normal local runtime | Ready, Helm completion and Socket.IO watch proof remain OWED. |
| Workflow validator | The new workflow is structurally recorded; validator still reports four unrelated historical errors in `designs/starci-academy/learn-branch.md`. |

### OWED

| Owed | Next proof |
|---|---|
| K8s Helm provision reaches Ready | Start the approved durable worker against the existing local kubeconfig, then rerun the live GraphQL flow. |
| Socket.IO `workspace.status` event | Capture the matching watch event and browser Network/Console evidence during the same live flow. |
| Full E2E result | Resolve or isolate the bootstrap hang, then rerun `expert-site-goes-live.e2e-spec.ts`. |
