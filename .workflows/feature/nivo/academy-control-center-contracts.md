<!-- starci-workflow: v2 -->
# Nivo Academy control center contracts

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
| Repo / branch | D:\Repositories\nivo-backend (`main`); D:\Repositories\nivo-fe (`main`); Source D:\Repositories\starci-academy-backend (`mtp`) |
| Purpose | Thiết kế contract backend site-scoped cho Academy control center: tăng trưởng, CRM học viên, lead và Integration Center gồm domain, Google Login, SMTP, PayOS/SePay, Zalo OA, Analytics và webhook. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\nivo\academy-control-center-contracts.md |
| Language | vi |
| Phase | plan |
| Touching | Chỉ workflow này; không sửa production source. |

### RUNTIME TARGET

| Concern | Owning app | Database / external state | Failure if wired to the wrong target |
|---|---|---|---|
| Owner-facing GraphQL door | `apps/core` | Named TypeORM connection `POSTGRESQL_PRIMARY` (`primary`) | Site ownership, lead, integration status và encrypted custody biến mất hoặc lẫn tenant. |
| Academy learner/admin runtime | `apps/expert-academy-api` inside namespace `nivo-<siteId>` | Per-release PostgreSQL `expert_app`, currently registered both unnamed and as `POSTGRESQL_EXPERT_ACADEMY` during migration | Members, course access, progress, orders và revenue của Academy không tồn tại trong core database. |
| Identity delivery | Per-release Keycloak at `auth-<siteId>.<baseDomain>` | Keycloak realm/client/identity-provider state | Google Login có thể báo saved nhưng học viên vẫn không đăng nhập được. |
| Pod secret delivery | Kubernetes namespace `nivo-<siteId>` | Academy `app-secrets` plus workload rollout | SMTP/payment/Zalo value được lưu nhưng process đang chạy vẫn dùng giá trị cũ. |
| Public routing | Expert Academy Helm release `nivo-<siteId>` | Traefik Ingress and DNS | Domain có thể được ghi vào DB nhưng không phục vụ đúng host. |

### LIVE SCHEMA EVIDENCE

| Evidence | Measured result | Consequence |
|---|---|---|
| Unfiltered introspection | `POST http://localhost:3067/graphql` returned the complete live query and mutation lists before filtering. | Plan is based on the running core schema, not filenames alone. |
| Settings query | `myAcademySettings` has no arguments. | It cannot identify the resource mounted at `/apps/[siteId]`. |
| Settings mutations | `saveAcademyCredential(input)`, `setAcademyCustomDomain(input)` and `recheckAcademyCredentials` carry no `siteId`. | All three depend on the single-site assumption and must migrate together. |
| Existing owner-scoped siblings | `myExpertSite(siteId)` and `myExpertSiteLeads(siteId, limit, offset)` already scope reads by both viewer and site. | New control-center operations must mirror this ownership shape. |
| Existing lead writes | `updateExpertSiteLead(input)` and `draftLeadReply(input)` exist. | Lead CRM is reuse, not a new storage model. |
| Missing owner bridge | No core query exposes Academy `members`, `studentDetail`, `completionFunnel` or `revenueSeries`. | FE cannot consume the expert runtime directly with a Nivo token. |

### SIBLING OPERATION EVIDENCE

| Sibling | Shape to mirror | Boundary retained |
|---|---|---|
| `queries/expert-sites/my-expert-site` | Auth guard → resolver → owner-scoped service → response envelope. | A site belonging to another viewer is indistinguishable from missing. |
| `queries/expert-sites/my-expert-site-leads` | Required `siteId`, bounded paging, ownership check before personal-data read. | No filter-after-read authorization. |
| `queries/agent-workspace/my-agent-workspace-control-center` | Query/handler/service/module family and aggregate response type. | CQRS operation composition remains in the feature slice. |
| `queries/academy-settings/my-academy-settings` | Query/handler/service/module family and separate credential/domain response fields. | Domain and credential delivery stay separate outcomes. |
| `mutations/academy-settings/save-academy-credential` | Write-only input, encrypted custody, provider verification, Secret sync and workload rollout. | A response never contains the stored value. |
| Expert `queries/members/list`, `queries/analytics/student-detail`, `completion-funnel`, `revenue-series` | Per-Academy database reads already own the learner semantics. | Core proxies typed outcomes; it does not recreate learner joins against `primary`. |

### ARCHITECTURE DECISIONS

| ID | Decision | Reason |
|---|---|---|
| A1 | Every owner-facing Academy operation accepts `siteId` and calls one shared `resolveOwnedSite(userId, siteId)` boundary. | The UI route is resource-scoped and an account may own several Academies. |
| A2 | Keep four independently loadable core reads: `myAcademyGrowthSnapshot`, `myAcademyStudents`, `myAcademyStudentDetail`, `myAcademyIntegrations`. | The approved FE has four independent blocks; one mega-query would couple loading and refusal. |
| A3 | Core reaches the Academy runtime through a typed internal GraphQL client, authenticated by a dedicated per-site platform token and addressed by the release's ClusterIP DNS. | Learner data stays in `expert_app`; browser never receives an internal token and core never reads another app's database. |
| A4 | The Academy runtime exposes platform-only GraphQL operations that delegate its existing member/analytics services. | Reuses domain logic while keeping the Nivo owner token outside the Academy's learner Keycloak model. |
| A5 | Google Login is a dedicated identity-provider operation, not a generic Academy credential key. | Its delivery target is Keycloak, not the app Secret, and verification is OIDC-specific. |
| A6 | SMTP, PayOS and SePay continue through `AcademyPodCredentialService`; Zalo gets Academy-owned credential keys and callback state, never AgentOS channel ownership. | Each product owns its own namespace, secrets and lifecycle. |
| A7 | Analytics identifiers and consent mode are non-secret integration config; webhook signing secret is encrypted and shown once only at create/rotate time. | Public identifiers must not be hidden as secrets; signing material must never be queryable later. |
| A8 | Provider save, verify, deliver and runtime readiness remain separate states. | “Stored” cannot be rendered as “working”. |
| A9 | No Saga is introduced for a single provider write. Multi-system writes use an explicit delivery result and idempotent retry; provisioning Saga remains the owner of initial chart install. | A long-lived Saga is justified only when the workflow crosses irreversible steps that need compensation/fencing. |

### CONTRACT SHAPES

| Operation | Input | Output | Error boundary |
|---|---|---|---|
| `myAcademyGrowthSnapshot` | `siteId: ID!` | revenue series, completion funnel, active/at-risk counts with measured timestamps | not found/foreign site; runtime unavailable; invalid runtime response |
| `myAcademyStudents` | `siteId: ID!`, bounded `limit`, `offset`, optional search/status | page items plus total and page identity | same ownership/runtime boundary; empty is success |
| `myAcademyStudentDetail` | `siteId: ID!`, `memberId: ID!` | identity, status, roles, orders, course progress/access | foreign site and missing member stay distinct only after site ownership is admitted |
| `myAcademyIntegrations` | `siteId: ID!` | provider discriminated union, public config, configured hint, delivery, verification, timestamps; never secret value | unsupported provider is impossible in read output; partial provider probe is represented, not thrown as whole-page failure |
| Existing Academy settings operations | Add required `siteId`; credential input remains key/value and domain remains nullable | Existing truthful status/result shapes | missing/foreign site maps to the same not-found exception |
| Academy student writes | `siteId` plus operation-specific member/course fields | updated student/detail payload | targeted concurrency conflict; not found; not permitted; validation |
| `saveAcademyGoogleOAuth` | `siteId`, client id, client secret | identity provider status without secret | provider rejected/unreachable; Keycloak delivery failed |
| `beginAcademyZaloAuthorization` | `siteId` | short-lived authorization URL and expiry | state mint failed; no token in URL other than opaque one-time state |
| `saveAcademyAnalytics` | `siteId`, GA4/Meta identifiers, consent mode | safe public config and delivery state | invalid identifier/consent combination |
| `createAcademyWebhook` / `rotateAcademyWebhookSecret` / `disableAcademyWebhook` | `siteId`, endpoint/events where applicable | status; raw signing secret only on create/rotate response | endpoint invalid; ownership; concurrent rotation; delivery failures remain per webhook |

### EXACT PRODUCTION FILE TREE

| Action | Exact path | Purpose / shape source |
|---|---|---|
| MODIFY | `src/modules/bussiness/expert-site/viewer-expert-site.service.ts` | Add `resolveOwnedSite(userId, siteId)`; mirror `my-expert-site.service.ts` ownership predicate. |
| MODIFY | `src/modules/bussiness/expert-site/viewer-expert-site.service.spec.ts` | Prove owned, missing, foreign and multi-site cases. |
| ADD | `src/modules/bussiness/academy-runtime/academy-runtime.module-definition.ts` | Configurable module family. |
| ADD | `src/modules/bussiness/academy-runtime/academy-runtime.module.ts` | Export typed client and platform-token signer/custodian. |
| ADD | `src/modules/bussiness/academy-runtime/academy-runtime-host.ts` | Pure ClusterIP DNS derivation for release `nivo-<siteId>` and service `<release>-expert-academy`. |
| ADD | `src/modules/bussiness/academy-runtime/academy-runtime.client.ts` | Typed internal GraphQL calls, timeout, envelope validation and secret-safe logging. |
| ADD | `src/modules/bussiness/academy-runtime/academy-runtime.client.spec.ts` | Success, timeout, GraphQL refusal, malformed envelope and secret-scrub proof. |
| ADD | `src/modules/bussiness/academy-runtime/academy-platform-token.service.ts` | Mint/hash/borrow a per-site platform token; raw value never leaves callback scope. |
| ADD | `src/modules/platform/exceptions/errors/academy-runtime/unavailable.ts` | Object-metadata `AbstractException` for unreachable runtime. |
| ADD | `src/modules/platform/exceptions/errors/academy-runtime/response-invalid.ts` | Object-metadata exception for invalid runtime contract. |
| ADD | `src/modules/platform/exceptions/errors/academy-runtime/index.ts` | Exception barrel. |
| MODIFY | `apps/core/src/app.module.ts` | Register `AcademyRuntimeModule` once at composition root. |
| MODIFY | `apps/expert-academy-api/src/app.module.ts` | Register platform guard/module once at the Academy composition root. |
| ADD | `src/modules/expert/platform-access/platform-access.module.ts` | Expert runtime platform-auth capability. |
| ADD | `src/modules/expert/platform-access/platform-access.guard.ts` | Constant-time bearer verification against the mounted per-site platform token. |
| ADD | `src/modules/expert/platform-access/platform-access.guard.spec.ts` | Missing, malformed, wrong and valid token branches. |
| ADD | `src/modules/expert/platform-access/platform-or-expert-admin.guard.ts` | Admit either the existing expert-admin identity or the internal platform token without weakening learner routes. |
| ADD | `src/modules/expert/platform-access/platform-or-expert-admin.guard.spec.ts` | Both admitted principals plus missing/wrong-role/wrong-token cases. |
| MODIFY | `src/modules/bussiness/expert-provision/secrets/provision-secret-keys.ts` | Add dedicated `platformAccessToken` provision secret spec. |
| MODIFY | `src/modules/bussiness/expert-provision/chart/build-expert-chart-values.ts` | Deliver the token through chart values without logging it. |
| MODIFY | `src/modules/bussiness/expert-provision/chart/build-expert-chart-values.spec.ts` | Assert key presence and scrubbed output. |
| MODIFY | `src/features/core/api/core/graphql/queries/academy-settings/my-academy-settings/my-academy-settings.resolver.ts` | Add required `siteId`; remove single-site claim. |
| MODIFY | `src/features/core/api/core/graphql/queries/academy-settings/my-academy-settings/my-academy-settings.query.ts` | Carry site identity. |
| MODIFY | `src/features/core/api/core/graphql/queries/academy-settings/my-academy-settings/my-academy-settings.handler.ts` | Resolve owned site before settings reads. |
| MODIFY | `src/features/core/api/core/graphql/queries/academy-settings/my-academy-settings/my-academy-settings.handler.spec.ts` | Prove site isolation and multi-site selection. |
| MODIFY | `src/features/core/api/core/graphql/mutations/academy-settings/save-academy-credential/graphql-types/request.ts` | Add validated `siteId`; retain write-only value. |
| MODIFY | `src/features/core/api/core/graphql/mutations/academy-settings/save-academy-credential/save-academy-credential.service.ts` | Resolve exact owned site instead of single-site inference. |
| MODIFY | `src/features/core/api/core/graphql/mutations/academy-settings/save-academy-credential/save-academy-credential.service.spec.ts` | Isolation, rejected, unreachable, delivery-failed and live cases. |
| MODIFY | `src/features/core/api/core/graphql/mutations/academy-settings/set-academy-custom-domain/graphql-types/request.ts` | Add validated `siteId`. |
| MODIFY | `src/features/core/api/core/graphql/mutations/academy-settings/set-academy-custom-domain/set-academy-custom-domain.command.ts` | Carry site identity. |
| MODIFY | `src/features/core/api/core/graphql/mutations/academy-settings/set-academy-custom-domain/set-academy-custom-domain.handler.ts` | Ownership gate before domain mutation. |
| MODIFY | `src/features/core/api/core/graphql/mutations/academy-settings/set-academy-custom-domain/set-academy-custom-domain.handler.spec.ts` | Owned/foreign/clear/taken/DNS pending cases. |
| MODIFY | `src/features/core/api/core/graphql/mutations/academy-settings/recheck-academy-credentials/recheck-academy-credentials.resolver.ts` | Add required `siteId`. |
| MODIFY | `src/features/core/api/core/graphql/mutations/academy-settings/recheck-academy-credentials/recheck-academy-credentials.command.ts` | Carry site identity. |
| MODIFY | `src/features/core/api/core/graphql/mutations/academy-settings/recheck-academy-credentials/recheck-academy-credentials.handler.ts` | Ownership gate before provider probes. |
| MODIFY | `src/features/core/api/core/graphql/mutations/academy-settings/recheck-academy-credentials/recheck-academy-credentials.handler.spec.ts` | Partial verification and isolation matrix. |
| ADD | `src/features/core/api/core/graphql/queries/academy-control-center/my-academy-growth-snapshot/index.ts` | Query slice barrel. |
| ADD | `src/features/core/api/core/graphql/queries/academy-control-center/my-academy-growth-snapshot/my-academy-growth-snapshot.module-definition.ts` | Sibling configurable module shape. |
| ADD | `src/features/core/api/core/graphql/queries/academy-control-center/my-academy-growth-snapshot/my-academy-growth-snapshot.module.ts` | Register resolver/service. |
| ADD | `src/features/core/api/core/graphql/queries/academy-control-center/my-academy-growth-snapshot/my-academy-growth-snapshot.resolver.ts` | Guarded GraphQL door with required `siteId`. |
| ADD | `src/features/core/api/core/graphql/queries/academy-control-center/my-academy-growth-snapshot/my-academy-growth-snapshot.service.ts` | Ownership gate then typed runtime call. |
| ADD | `src/features/core/api/core/graphql/queries/academy-control-center/my-academy-growth-snapshot/my-academy-growth-snapshot.service.spec.ts` | Twin service proof. |
| ADD | `src/features/core/api/core/graphql/queries/academy-control-center/my-academy-growth-snapshot/graphql-types/response.ts` | Stable owner-facing aggregate. |
| ADD | `src/features/core/api/core/graphql/queries/academy-control-center/my-academy-growth-snapshot/graphql-types/index.ts` | GraphQL type barrel. |
| ADD | `src/features/core/api/core/graphql/queries/academy-control-center/my-academy-students/index.ts` | Query slice barrel. |
| ADD | `src/features/core/api/core/graphql/queries/academy-control-center/my-academy-students/my-academy-students.module-definition.ts` | Sibling module options. |
| ADD | `src/features/core/api/core/graphql/queries/academy-control-center/my-academy-students/my-academy-students.module.ts` | Register resolver/service. |
| ADD | `src/features/core/api/core/graphql/queries/academy-control-center/my-academy-students/my-academy-students.resolver.ts` | Guarded paged query. |
| ADD | `src/features/core/api/core/graphql/queries/academy-control-center/my-academy-students/my-academy-students.service.ts` | Ownership gate then runtime list. |
| ADD | `src/features/core/api/core/graphql/queries/academy-control-center/my-academy-students/my-academy-students.service.spec.ts` | Bounds, empty, filters and isolation. |
| ADD | `src/features/core/api/core/graphql/queries/academy-control-center/my-academy-students/graphql-types/input.ts` | Validated filter/paging input. |
| ADD | `src/features/core/api/core/graphql/queries/academy-control-center/my-academy-students/graphql-types/response.ts` | Page items/total response. |
| ADD | `src/features/core/api/core/graphql/queries/academy-control-center/my-academy-students/graphql-types/index.ts` | GraphQL type barrel. |
| ADD | `src/features/core/api/core/graphql/queries/academy-control-center/my-academy-student-detail/index.ts` | Query slice barrel. |
| ADD | `src/features/core/api/core/graphql/queries/academy-control-center/my-academy-student-detail/my-academy-student-detail.module-definition.ts` | Sibling module options. |
| ADD | `src/features/core/api/core/graphql/queries/academy-control-center/my-academy-student-detail/my-academy-student-detail.module.ts` | Register resolver/service. |
| ADD | `src/features/core/api/core/graphql/queries/academy-control-center/my-academy-student-detail/my-academy-student-detail.resolver.ts` | Guarded site/member query. |
| ADD | `src/features/core/api/core/graphql/queries/academy-control-center/my-academy-student-detail/my-academy-student-detail.service.ts` | Ownership gate then runtime detail. |
| ADD | `src/features/core/api/core/graphql/queries/academy-control-center/my-academy-student-detail/my-academy-student-detail.service.spec.ts` | Missing member, foreign site and ready cases. |
| ADD | `src/features/core/api/core/graphql/queries/academy-control-center/my-academy-student-detail/graphql-types/response.ts` | Identity/order/progress/access response. |
| ADD | `src/features/core/api/core/graphql/queries/academy-control-center/my-academy-student-detail/graphql-types/index.ts` | GraphQL type barrel. |
| ADD | `src/features/core/api/core/graphql/queries/academy-control-center/my-academy-integrations/index.ts` | Query slice barrel. |
| ADD | `src/features/core/api/core/graphql/queries/academy-control-center/my-academy-integrations/my-academy-integrations.module-definition.ts` | Sibling module options. |
| ADD | `src/features/core/api/core/graphql/queries/academy-control-center/my-academy-integrations/my-academy-integrations.module.ts` | Register CQRS slice. |
| ADD | `src/features/core/api/core/graphql/queries/academy-control-center/my-academy-integrations/my-academy-integrations.resolver.ts` | Guarded site-scoped read. |
| ADD | `src/features/core/api/core/graphql/queries/academy-control-center/my-academy-integrations/my-academy-integrations.query.ts` | CQRS query. |
| ADD | `src/features/core/api/core/graphql/queries/academy-control-center/my-academy-integrations/my-academy-integrations.handler.ts` | Compose domain/credentials/identity/Zalo/analytics/webhook statuses independently. |
| ADD | `src/features/core/api/core/graphql/queries/academy-control-center/my-academy-integrations/my-academy-integrations.handler.spec.ts` | Provider union and partial-state matrix. |
| ADD | `src/features/core/api/core/graphql/queries/academy-control-center/my-academy-integrations/my-academy-integrations.service.ts` | QueryBus dispatcher. |
| ADD | `src/features/core/api/core/graphql/queries/academy-control-center/my-academy-integrations/graphql-types/response.ts` | Provider discriminated union; no raw secret fields. |
| ADD | `src/features/core/api/core/graphql/queries/academy-control-center/my-academy-integrations/graphql-types/index.ts` | GraphQL type barrel. |
| MODIFY | `src/features/core/api/core/graphql/queries/index.ts` | Register four core query slices. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-control-center/create-academy-student/index.ts` | Mutation barrel. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-control-center/create-academy-student/create-academy-student.module-definition.ts` | Sibling module options. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-control-center/create-academy-student/create-academy-student.module.ts` | Register resolver/service. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-control-center/create-academy-student/create-academy-student.resolver.ts` | Guarded site-scoped mutation. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-control-center/create-academy-student/create-academy-student.service.ts` | Ownership gate then typed runtime create. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-control-center/create-academy-student/create-academy-student.service.spec.ts` | Owned/foreign/duplicate/validation cases. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-control-center/create-academy-student/graphql-types/input.ts` | Site plus member fields. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-control-center/create-academy-student/graphql-types/response.ts` | Created student response. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-control-center/create-academy-student/graphql-types/index.ts` | GraphQL type barrel. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-control-center/update-academy-student/index.ts` | Mutation barrel. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-control-center/update-academy-student/update-academy-student.module-definition.ts` | Sibling module options. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-control-center/update-academy-student/update-academy-student.module.ts` | Register resolver/service. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-control-center/update-academy-student/update-academy-student.resolver.ts` | Guarded site/member mutation. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-control-center/update-academy-student/update-academy-student.service.ts` | Ownership gate then typed runtime update. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-control-center/update-academy-student/update-academy-student.service.spec.ts` | Missing/foreign/no-op/concurrent update cases. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-control-center/update-academy-student/graphql-types/input.ts` | Site/member plus editable fields. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-control-center/update-academy-student/graphql-types/response.ts` | Updated student response. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-control-center/update-academy-student/graphql-types/index.ts` | GraphQL type barrel. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-control-center/set-academy-student-status/index.ts` | Mutation barrel. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-control-center/set-academy-student-status/set-academy-student-status.module-definition.ts` | Sibling module options. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-control-center/set-academy-student-status/set-academy-student-status.module.ts` | Register resolver/service. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-control-center/set-academy-student-status/set-academy-student-status.resolver.ts` | Guarded status mutation. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-control-center/set-academy-student-status/set-academy-student-status.service.ts` | Ownership gate then typed runtime status write. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-control-center/set-academy-student-status/set-academy-student-status.service.spec.ts` | Every enum, already-done, conflict and isolation cases. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-control-center/set-academy-student-status/graphql-types/input.ts` | Site/member/status input. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-control-center/set-academy-student-status/graphql-types/response.ts` | Updated student response. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-control-center/set-academy-student-status/graphql-types/index.ts` | GraphQL type barrel. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-control-center/grant-academy-course-access/index.ts` | Mutation barrel. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-control-center/grant-academy-course-access/grant-academy-course-access.module-definition.ts` | Sibling module options. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-control-center/grant-academy-course-access/grant-academy-course-access.module.ts` | Register resolver/service. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-control-center/grant-academy-course-access/grant-academy-course-access.resolver.ts` | Guarded access mutation. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-control-center/grant-academy-course-access/grant-academy-course-access.service.ts` | Ownership gate then typed runtime grant. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-control-center/grant-academy-course-access/grant-academy-course-access.service.spec.ts` | Success/already-granted/missing/conflict/isolation cases. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-control-center/grant-academy-course-access/graphql-types/input.ts` | Site/member/course input. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-control-center/grant-academy-course-access/graphql-types/response.ts` | Updated access response. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-control-center/grant-academy-course-access/graphql-types/index.ts` | GraphQL type barrel. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-control-center/revoke-academy-course-access/index.ts` | Mutation barrel. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-control-center/revoke-academy-course-access/revoke-academy-course-access.module-definition.ts` | Sibling module options. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-control-center/revoke-academy-course-access/revoke-academy-course-access.module.ts` | Register resolver/service. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-control-center/revoke-academy-course-access/revoke-academy-course-access.resolver.ts` | Guarded access mutation. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-control-center/revoke-academy-course-access/revoke-academy-course-access.service.ts` | Ownership gate then typed runtime revoke. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-control-center/revoke-academy-course-access/revoke-academy-course-access.service.spec.ts` | Success/already-revoked/missing/conflict/isolation cases. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-control-center/revoke-academy-course-access/graphql-types/input.ts` | Site/member/course input. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-control-center/revoke-academy-course-access/graphql-types/response.ts` | Updated access response. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-control-center/revoke-academy-course-access/graphql-types/index.ts` | GraphQL type barrel. |
| ADD | `src/features/expert/graphql/queries/platform-control-center/growth-snapshot/index.ts` | Platform query barrel. |
| ADD | `src/features/expert/graphql/queries/platform-control-center/growth-snapshot/growth-snapshot.module-definition.ts` | Module options matching `completion-funnel`. |
| ADD | `src/features/expert/graphql/queries/platform-control-center/growth-snapshot/growth-snapshot.module.ts` | Register guarded resolver/service. |
| ADD | `src/features/expert/graphql/queries/platform-control-center/growth-snapshot/growth-snapshot.resolver.ts` | Platform-guarded GraphQL door. |
| ADD | `src/features/expert/graphql/queries/platform-control-center/growth-snapshot/growth-snapshot.service.ts` | Compose existing revenue/funnel/member measures. |
| ADD | `src/features/expert/graphql/queries/platform-control-center/growth-snapshot/growth-snapshot.service.spec.ts` | Empty, partial and measured aggregate cases. |
| ADD | `src/features/expert/graphql/queries/platform-control-center/growth-snapshot/graphql-types/response.ts` | Internal typed aggregate. |
| ADD | `src/features/expert/graphql/queries/platform-control-center/growth-snapshot/graphql-types/index.ts` | GraphQL type barrel. |
| ADD | `src/features/expert/graphql/queries/platform-control-center/students/index.ts` | Platform query barrel. |
| ADD | `src/features/expert/graphql/queries/platform-control-center/students/students.module-definition.ts` | Module options matching `members/list`. |
| ADD | `src/features/expert/graphql/queries/platform-control-center/students/students.module.ts` | Register guarded resolver/service. |
| ADD | `src/features/expert/graphql/queries/platform-control-center/students/students.resolver.ts` | Platform-guarded paged query. |
| ADD | `src/features/expert/graphql/queries/platform-control-center/students/students.service.ts` | Reuse named Academy connection and member semantics. |
| ADD | `src/features/expert/graphql/queries/platform-control-center/students/students.service.spec.ts` | Bounds, filters, empty and every status. |
| ADD | `src/features/expert/graphql/queries/platform-control-center/students/graphql-types/input.ts` | Internal paging/filter input. |
| ADD | `src/features/expert/graphql/queries/platform-control-center/students/graphql-types/response.ts` | Internal page output. |
| ADD | `src/features/expert/graphql/queries/platform-control-center/students/graphql-types/index.ts` | GraphQL type barrel. |
| ADD | `src/features/expert/graphql/queries/platform-control-center/student-detail/index.ts` | Platform query barrel. |
| ADD | `src/features/expert/graphql/queries/platform-control-center/student-detail/student-detail.module-definition.ts` | Module options matching analytics detail. |
| ADD | `src/features/expert/graphql/queries/platform-control-center/student-detail/student-detail.module.ts` | Register guarded resolver/service. |
| ADD | `src/features/expert/graphql/queries/platform-control-center/student-detail/student-detail.resolver.ts` | Platform-guarded member-detail query. |
| ADD | `src/features/expert/graphql/queries/platform-control-center/student-detail/student-detail.service.ts` | Compose identity, orders, progress and access. |
| ADD | `src/features/expert/graphql/queries/platform-control-center/student-detail/student-detail.service.spec.ts` | Missing and complete detail cases. |
| ADD | `src/features/expert/graphql/queries/platform-control-center/student-detail/graphql-types/input.ts` | Member identity input. |
| ADD | `src/features/expert/graphql/queries/platform-control-center/student-detail/graphql-types/response.ts` | Internal detail output. |
| ADD | `src/features/expert/graphql/queries/platform-control-center/student-detail/graphql-types/index.ts` | GraphQL type barrel. |
| MODIFY | `src/features/expert/graphql/queries/index.ts` | Register the three platform-only query modules. |
| MODIFY | `src/features/expert/graphql/mutations/members/create-member/create-member.resolver.ts` | Replace expert-admin-only guard with the bounded platform-or-admin guard; operation shape unchanged. |
| MODIFY | `src/features/expert/graphql/mutations/members/update-member/update-member.resolver.ts` | Same bounded dual-principal guard. |
| MODIFY | `src/features/expert/graphql/mutations/members/set-member-status/set-member-status.resolver.ts` | Same bounded dual-principal guard. |
| MODIFY | `src/features/expert/graphql/mutations/members/grant-course-access/grant-course-access.resolver.ts` | Same bounded dual-principal guard. |
| MODIFY | `src/features/expert/graphql/mutations/members/revoke-course-access/revoke-course-access.resolver.ts` | Same bounded dual-principal guard. |
| MODIFY | `src/features/expert/graphql/mutations/members/members-crud.spec.ts` | Prove platform path and preserve all existing expert-admin behavior. |
| ADD | `src/modules/bussiness/academy-integrations/academy-integrations.module-definition.ts` | Integration capability options. |
| ADD | `src/modules/bussiness/academy-integrations/academy-integrations.module.ts` | Export provider-specific services; no resolver in capability module. |
| ADD | `src/modules/bussiness/academy-integrations/academy-google-identity.service.ts` | Encrypt custody, configure per-site Keycloak Google IdP, verify and disconnect. |
| ADD | `src/modules/bussiness/academy-integrations/academy-zalo.service.ts` | Opaque state, token exchange/refresh and Academy Secret rollout. |
| ADD | `src/modules/bussiness/academy-integrations/academy-analytics.service.ts` | Validate/store safe IDs and consent mode. |
| ADD | `src/modules/bussiness/academy-integrations/academy-webhook.service.ts` | CRUD, signing-secret rotation and delivery health. |
| ADD | `src/modules/platform/databases/postgresql/primary/entities/academy-integration.entity.ts` | Site/provider public config and measured status; no raw secret. |
| ADD | `src/modules/platform/databases/postgresql/primary/entities/academy-integration-secret.entity.ts` | Encrypted Google/Zalo provider secret rows with key/version metadata; never GraphQL-decorated. |
| ADD | `src/modules/platform/databases/postgresql/primary/entities/academy-webhook.entity.ts` | Site endpoint/events, encrypted signing secret, health and version. |
| ADD | `src/modules/platform/databases/postgresql/primary/migrations/1789693200000-academy-integrations.ts` | Tables, FK, unique site/provider and webhook version constraints. |
| MODIFY | `src/modules/platform/databases/postgresql/primary/entities/index.ts` | Export all three entities. |
| MODIFY | `src/modules/platform/databases/postgresql/primary/primary.module.ts` | Register all three entities on `POSTGRESQL_PRIMARY`. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/save-academy-google-oauth/index.ts` | Mutation barrel. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/save-academy-google-oauth/save-academy-google-oauth.module-definition.ts` | Sibling module options. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/save-academy-google-oauth/save-academy-google-oauth.module.ts` | Register resolver/handler. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/save-academy-google-oauth/save-academy-google-oauth.resolver.ts` | Guarded write-only mutation. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/save-academy-google-oauth/save-academy-google-oauth.command.ts` | CQRS command. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/save-academy-google-oauth/save-academy-google-oauth.handler.ts` | Ownership, custody, Keycloak delivery and verification. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/save-academy-google-oauth/save-academy-google-oauth.handler.spec.ts` | Rejected/unreachable/delivery/live and secret-scrub cases. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/save-academy-google-oauth/graphql-types/input.ts` | Validated site/client id/write-only secret. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/save-academy-google-oauth/graphql-types/response.ts` | Status-only response. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/save-academy-google-oauth/graphql-types/index.ts` | GraphQL type barrel. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/begin-academy-zalo-authorization/index.ts` | Mutation barrel. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/begin-academy-zalo-authorization/begin-academy-zalo-authorization.module-definition.ts` | Sibling module options. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/begin-academy-zalo-authorization/begin-academy-zalo-authorization.module.ts` | Register resolver/handler. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/begin-academy-zalo-authorization/begin-academy-zalo-authorization.resolver.ts` | Guarded begin mutation. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/begin-academy-zalo-authorization/begin-academy-zalo-authorization.command.ts` | CQRS command. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/begin-academy-zalo-authorization/begin-academy-zalo-authorization.handler.ts` | Ownership and opaque state mint. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/begin-academy-zalo-authorization/begin-academy-zalo-authorization.handler.spec.ts` | Owned/foreign/expiry/state cases. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/begin-academy-zalo-authorization/graphql-types/input.ts` | Required site identity. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/begin-academy-zalo-authorization/graphql-types/response.ts` | Authorization URL/expiry response. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/begin-academy-zalo-authorization/graphql-types/index.ts` | GraphQL type barrel. |
| ADD | `src/features/core/api/core/http/academy-integrations/zalo-oauth-callback.controller.ts` | External provider callback, the allowed REST exception; consumes one-time state. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/save-academy-analytics/index.ts` | Mutation barrel. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/save-academy-analytics/save-academy-analytics.module-definition.ts` | Sibling module options. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/save-academy-analytics/save-academy-analytics.module.ts` | Register resolver/handler. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/save-academy-analytics/save-academy-analytics.resolver.ts` | Guarded public-config mutation. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/save-academy-analytics/save-academy-analytics.command.ts` | CQRS command. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/save-academy-analytics/save-academy-analytics.handler.ts` | Ownership, validation, persistence and delivery. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/save-academy-analytics/save-academy-analytics.handler.spec.ts` | Provider/consent/no-op/clear cases. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/save-academy-analytics/graphql-types/input.ts` | Discriminated provider config input. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/save-academy-analytics/graphql-types/response.ts` | Safe config/status response. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/save-academy-analytics/graphql-types/index.ts` | GraphQL type barrel. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/create-academy-webhook/index.ts` | Mutation barrel. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/create-academy-webhook/create-academy-webhook.module-definition.ts` | Sibling module options. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/create-academy-webhook/create-academy-webhook.module.ts` | Register resolver/handler. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/create-academy-webhook/create-academy-webhook.resolver.ts` | Guarded create mutation. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/create-academy-webhook/create-academy-webhook.command.ts` | CQRS command. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/create-academy-webhook/create-academy-webhook.handler.ts` | Ownership, endpoint policy, encrypted secret creation. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/create-academy-webhook/create-academy-webhook.handler.spec.ts` | Endpoint, events, secret-once and isolation cases. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/create-academy-webhook/graphql-types/input.ts` | Endpoint/events input. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/create-academy-webhook/graphql-types/response.ts` | One-time secret response. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/create-academy-webhook/graphql-types/index.ts` | GraphQL type barrel. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/rotate-academy-webhook-secret/index.ts` | Mutation barrel. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/rotate-academy-webhook-secret/rotate-academy-webhook-secret.module-definition.ts` | Sibling module options. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/rotate-academy-webhook-secret/rotate-academy-webhook-secret.module.ts` | Register resolver/handler. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/rotate-academy-webhook-secret/rotate-academy-webhook-secret.resolver.ts` | Guarded rotation mutation. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/rotate-academy-webhook-secret/rotate-academy-webhook-secret.command.ts` | CQRS command carrying expected version. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/rotate-academy-webhook-secret/rotate-academy-webhook-secret.handler.ts` | Ownership and optimistic rotation. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/rotate-academy-webhook-secret/rotate-academy-webhook-secret.handler.spec.ts` | Success, stale version, foreign and secret-once cases. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/rotate-academy-webhook-secret/graphql-types/input.ts` | Webhook id/version input. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/rotate-academy-webhook-secret/graphql-types/response.ts` | One-time rotated secret response. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/rotate-academy-webhook-secret/graphql-types/index.ts` | GraphQL type barrel. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/disable-academy-webhook/index.ts` | Mutation barrel. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/disable-academy-webhook/disable-academy-webhook.module-definition.ts` | Sibling module options. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/disable-academy-webhook/disable-academy-webhook.module.ts` | Register resolver/handler. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/disable-academy-webhook/disable-academy-webhook.resolver.ts` | Guarded disable mutation. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/disable-academy-webhook/disable-academy-webhook.command.ts` | CQRS command. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/disable-academy-webhook/disable-academy-webhook.handler.ts` | Ownership and idempotent disable. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/disable-academy-webhook/disable-academy-webhook.handler.spec.ts` | Enabled/already-disabled/foreign/missing cases. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/disable-academy-webhook/graphql-types/input.ts` | Webhook identity input. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/disable-academy-webhook/graphql-types/response.ts` | Disabled status response. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/disable-academy-webhook/graphql-types/index.ts` | GraphQL type barrel. |
| MODIFY | `src/features/core/api/core/graphql/mutations/index.ts` | Register provider mutation modules. |
| MODIFY | `src/features/core/api/core/http/http.module.ts` | Register Zalo callback controller. |
| ADD | `src/tests/e2e/controlplane/academy-control-center.e2e-spec.ts` | Full owner GraphQL flow across site isolation, runtime bridge and settings. |
| ADD | `src/tests/e2e/controlplane/academy-integrations.e2e-spec.ts` | Provider custody/callback/write-only/idempotency flow. |

### TEST MATRIX

| Area | Required cases |
|---|---|
| Ownership | owned site passes; foreign and missing site produce the same not-found surface; account with two sites selects the requested one; no operation falls back to newest/first. |
| Runtime bridge | valid token; missing/wrong token; timeout; DNS refusal; GraphQL error; malformed envelope; empty list; response for another request cannot be reused. |
| Paging/search | zero and max bounds; over-max rejected; first/last/empty page; search normalization; every member status enum. |
| Student writes | create/update/status/grant/revoke happy path; already done; missing member/course; not permitted; concurrent status/access writer. |
| Credentials | every allowed key; incomplete credential group; provider rejected; provider unreachable; Secret patch failed; rollout failed; successful re-read; secret absent from response/log. |
| Domain | set, normalize, clear, taken, invalid, DNS pending, live, Helm delivery failed and retry. |
| Google | absent, valid, rejected, unreachable, stored-but-Keycloak-failed, verified, rotate, disconnect; secret never returned. |
| Zalo | state mint, callback success, expired/replayed/wrong-site state, provider refusal, refresh expiry, webhook failure; AgentOS credential remains untouched. |
| Analytics | each supported provider identifier, invalid shape, consent-blocked, update/no-op, clear. |
| Webhook | create/rotate/disable; signing secret shown once; invalid/private endpoint policy; every event enum; failed/retried delivery; optimistic version conflict. |
| Partial aggregate | one provider probe fails while all other provider states and CRM blocks remain readable. |

### FLOW E2E

| Flow | Entry | Assertions |
|---|---|---|
| Owner opens Academy | Real `myAcademyGrowthSnapshot`, `myAcademyStudents`, `myAcademyIntegrations` over core GraphQL with a Keycloak owner token. | Core admits owned `siteId`, uses internal platform token, reads the correct `expert_app`, and never returns that token. |
| Foreign-site attack | Same operations with another owner's `siteId`. | Runtime is never called; response is not-found and leaks no provider/student existence. |
| Student operation | Owner changes status and grants then revokes course access through core GraphQL. | Academy DB changes once; retry is idempotent or returns already-done; detail query reflects the consequence. |
| Google setup | Save client id/secret, configure Keycloak, recheck. | Browser response and logs have no secret; returned state distinguishes stored, delivered and verified. |
| Zalo callback | Begin via GraphQL, then call real HTTP callback with one-time state. | State is site-bound and single-use; token is encrypted/delivered to that Academy only. |
| Webhook lifecycle | Create, emit test event, rotate, retry old signature, disable. | New secret shown once; old signature fails after rotation; disabled endpoint receives nothing. |

### ACCEPTANCE COMMANDS

| Gate | Command / evidence |
|---|---|
| Schema | Unfiltered introspection before and after; diff only the named Academy operations/types. |
| Lint | Backend root lint with zero errors and no suppressions. |
| Typecheck/build | Frozen backend typecheck and all four Nest app builds. |
| Twin specs | Every new/modified service or handler spec named in the production tree passes. |
| E2E | `academy-control-center.e2e-spec.ts` and `academy-integrations.e2e-spec.ts` pass through real transport. |
| Live call | Logged-in Nivo owner opens one real Academy, reads students/growth and saves a non-production provider test value; Network/Console/core terminal/Academy terminal have no unexplained failure or secret. |

### OUTPUTS

| Concept | Result |
|---|---|
| Site-scoped contract | Four independent owner reads and targeted mutations, all admitted by `userId + siteId`. |
| Cross-database boundary | Typed service-to-service GraphQL bridge; no cross-connection repository access. |
| Integration ownership | Google → per-site Keycloak; SMTP/payment/Zalo → Academy Secret; analytics → public config; webhook secret → encrypted custody. |
| FE handoff | Supplies the exact block-owned APIs approved by `nivo-academy-control-center-r1`. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\feature\nivo\academy-control-center-contracts.md` | `added` — Backend Feature Plan r1; no production source. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Review revision | Duyệt `nivo-academy-control-center-contracts-r1` để chạy `starci-be-feature-review` và challenge exact file/contract boundary trước Apply. |

### WARNINGS

| Warning | Impact |
|---|---|
| Per-site platform token needs a matching chart env/Secret mapping in `D:\Repositories\nivo-charts`, which is not one of the explicit target repositories in this context. | Backend Apply cannot claim live runtime bridge until a separate chart boundary is approved and deployed. |
| `apps/expert-academy-api` still has duplicate default/named connections to the same `expert_app`. | New code must use the named connection; it must not broaden the existing migration debt. |
| Existing Academy settings comments and tests explicitly assert “no site id”. | Migration is intentional and must update all three settings operations atomically to avoid mixed tenant semantics. |
| Provider surface is large. | Review should freeze implementation slices in dependency order: ownership/runtime bridge → CRM/growth → existing settings → Google/Zalo → analytics/webhook. |
| Backend worktree contains unrelated AgentOS/OpenClaw changes. | Apply must preserve them and commit a clean baseline according to the selected Apply skill. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Core reads per-Academy PostgreSQL directly | Typed platform-only Academy GraphQL bridge | Database/schema ownership remains with the deployed app. |
| Browser calls the ClusterIP or receives a platform token | Core-only client | Prevents lateral tenant access and secret exposure. |
| Keep no-argument settings query | Required `siteId` plus ownership gate | The route and product model are multi-resource. |
| Put Google client secret in generic analytics config | Dedicated encrypted identity-provider custody | Secret and delivery target have different security semantics. |
| Reuse AgentOS Zalo channel | Academy-owned Zalo integration | Products have independent namespaces, credentials and lifecycle. |
| One mega-query for the whole page | Four block-owned reads | Partial failure must not blank unrelated work. |

### OWED

| Owed | Cleared by |
|---|---|
| Challenge exact operation paths and scope | `starci-be-feature-review` on `nivo-academy-control-center-contracts-r1`. |
| Chart platform-token env/Secret contract | Explicit `nivo-charts` target plus its own approved plan/review/apply boundary. |
| Backend implementation and proof | `starci-be-feature-apply` after exact Review approval. |
| FE production implementation | Approved backend schema live, then `starci-fe-design-apply` for `nivo-academy-control-center-r1`. |

## review r1

Candidate revision: `nivo-academy-control-center-contracts-r2`

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
| Repo / branch | D:\Repositories\nivo-backend (`main`); D:\Repositories\nivo-fe (`main`); Source D:\Repositories\starci-academy-backend (`mtp`) |
| Purpose | Challenge Plan r1 against the real Academy chart, auth principal model, databases and live schema; freeze a buildable end-to-end revision. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\nivo\academy-control-center-contracts.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ D:\Repositories\starci-academy-backend\.workflows\feature\nivo\academy-control-center-contracts.md |

### APPROVAL EVIDENCE

| Evidence | Review consequence |
|---|---|
| Người dùng yêu cầu “duyệt nivo-academy-control-center-contracts-r”. | Được hiểu là yêu cầu review Plan r1; không được coi là cho phép Apply khi Review tìm thấy production boundary còn thiếu. |

### REVIEW FINDINGS

| Severity | Finding | Evidence | Required correction |
|---|---|---|---|
| BLOCKER | Plan r1 tạo `platformAccessToken` trong backend provision values nhưng không có chart consumer thuộc approved target. | Chart thật mà `ExpertChartValues` mô tả là `D:\Repositories\nivo\k8s\charts\expert`, không phải `D:\Repositories\nivo-charts\charts\expert-academy`; `values.yaml`/`templates/secrets.yaml` không có platform token. | Chart tự tạo/preserve một Secret riêng; API container nhận bằng explicit `secretKeyRef`; core đọc Secret qua Kubernetes API. Token không đi qua Helm values hoặc database. |
| BLOCKER | Guard “platform-or-expert-admin” trên resolver hiện tại không đủ. | `create-member.resolver.ts` vẫn lấy `@CurrentMember()` và tự kiểm `member.role`; platform bearer không tạo một Keycloak `MemberPrincipal`. | Giữ resolver public hiện tại nguyên vẹn; thêm platform-only mutations guarded solely by `PlatformAccessGuard`. |
| HIGH | Plan r1 chưa sở hữu durable one-time OAuth state cho Zalo. | Callback cần chống replay, expiry và wrong-site; `AcademyIntegrationEntity` không thể đồng thời là provider snapshot và one-time state. | Thêm `AcademyOauthStateEntity` với hash, site/provider, expiry, consumedAt và unique constraint. |
| HIGH | Webhook mới chỉ có CRUD, chưa có delivery owner. | E2E yêu cầu emit/retry/signature nhưng file tree không có outbox/dispatcher. | Thêm webhook outbox entity, dispatcher, signature service và retry tests, hoặc bỏ webhook khỏi revision. r2 giữ feature nên thêm đủ owner. |
| HIGH | Integration capability thiếu twin specs và exception identities. | Plan chỉ liệt kê bốn services; không có provider service specs hoặc exact integration exceptions. | Bổ sung specs và object-metadata `AbstractException` files. |
| MEDIUM | Tên `AcademyPlatformTokenService` nói “mint/hash/borrow” không đúng owner mới. | Token được chart tạo và core chỉ đọc tạm thời. | Rename thành `AcademyPlatformAccessSecretService`; read-only borrow từ exact Kubernetes Secret. |
| MEDIUM | Plan r1 sửa `PROVISION_SECRET_SPECS` và `buildExpertChartValues` không còn cần thiết sau chart-owned Secret. | Secret không được gửi qua values. | Loại ba production modifications đó khỏi r2. |

### REVISED ARCHITECTURE

| Concern | Frozen r2 decision |
|---|---|
| Site ownership | Mọi core operation nhận required `siteId`; `resolveOwnedSite(userId, siteId)` chạy trước bất kỳ runtime/provider access nào. |
| Learner data | Core uses typed internal GraphQL client; per-Academy runtime remains sole owner of `expert_app`. |
| Platform authentication | Helm chart creates `academy-platform-access` Secret once using `lookup`; API container alone receives `NIVO_PLATFORM_ACCESS_TOKEN`; core borrows the same Secret value through Kubernetes API only for the call. |
| Runtime operations | Dedicated `platformAcademy*` queries/mutations use `PlatformAccessGuard`; existing learner/expert operations and `KeycloakMemberGuard` remain unchanged. |
| Google | Encrypted control-plane secret custody → per-site Keycloak IdP; no generic app-secret delivery and no secret response. |
| Zalo | Academy-owned provider, durable single-use callback state and encrypted token custody; never AgentOS channel state. |
| Webhook | Durable outbox with HMAC signing, bounded retries and status projection; create/rotate response shows signing secret once. |
| Apply order | Chart secret boundary → runtime platform operations → core bridge/CRM → existing settings migration → provider integrations. Each slice must keep the full approved schema stable. |

### PRODUCTION BOUNDARY DELTA FROM PLAN R1

| Action | Exact path | Review verdict |
|---|---|---|
| REMOVE FROM BOUNDARY | `src/modules/bussiness/expert-provision/secrets/provision-secret-keys.ts` | Platform access secret is not a Helm value. |
| REMOVE FROM BOUNDARY | `src/modules/bussiness/expert-provision/chart/build-expert-chart-values.ts` | No token delivery through values. |
| REMOVE FROM BOUNDARY | `src/modules/bussiness/expert-provision/chart/build-expert-chart-values.spec.ts` | Replaced by chart render/upgrade proof. |
| RENAME | `src/modules/bussiness/academy-runtime/academy-platform-token.service.ts` → `src/modules/bussiness/academy-runtime/academy-platform-access-secret.service.ts` | Read-only scoped Secret borrow; no mint/hash claim. |
| ADD | `src/modules/bussiness/academy-runtime/academy-platform-access-secret.service.spec.ts` | Correct namespace/name/key, missing Secret, malformed value and no-log proof. |
| REMOVE FROM BOUNDARY | `src/modules/expert/platform-access/platform-or-expert-admin.guard.ts` | Dual-principal resolver path rejected. |
| REMOVE FROM BOUNDARY | `src/modules/expert/platform-access/platform-or-expert-admin.guard.spec.ts` | Dual-principal resolver path rejected. |
| REMOVE FROM BOUNDARY | `src/features/expert/graphql/mutations/members/create-member/create-member.resolver.ts` | Existing expert-admin surface remains unchanged. |
| REMOVE FROM BOUNDARY | `src/features/expert/graphql/mutations/members/update-member/update-member.resolver.ts` | Existing expert-admin surface remains unchanged. |
| REMOVE FROM BOUNDARY | `src/features/expert/graphql/mutations/members/set-member-status/set-member-status.resolver.ts` | Existing expert-admin surface remains unchanged. |
| REMOVE FROM BOUNDARY | `src/features/expert/graphql/mutations/members/grant-course-access/grant-course-access.resolver.ts` | Existing expert-admin surface remains unchanged. |
| REMOVE FROM BOUNDARY | `src/features/expert/graphql/mutations/members/revoke-course-access/revoke-course-access.resolver.ts` | Existing expert-admin surface remains unchanged. |
| REMOVE FROM BOUNDARY | `src/features/expert/graphql/mutations/members/members-crud.spec.ts` | Existing behavior is regression-tested unchanged, not edited. |
| ADD | `src/features/expert/graphql/mutations/platform-control-center/create-student/{index.ts,create-student.module-definition.ts,create-student.module.ts,create-student.resolver.ts,create-student.service.ts,create-student.service.spec.ts,graphql-types/input.ts,graphql-types/response.ts,graphql-types/index.ts}` | Dedicated platform-only create operation; braces enumerate the exact nine files. |
| ADD | `src/features/expert/graphql/mutations/platform-control-center/update-student/{index.ts,update-student.module-definition.ts,update-student.module.ts,update-student.resolver.ts,update-student.service.ts,update-student.service.spec.ts,graphql-types/input.ts,graphql-types/response.ts,graphql-types/index.ts}` | Dedicated platform-only update operation. |
| ADD | `src/features/expert/graphql/mutations/platform-control-center/set-student-status/{index.ts,set-student-status.module-definition.ts,set-student-status.module.ts,set-student-status.resolver.ts,set-student-status.service.ts,set-student-status.service.spec.ts,graphql-types/input.ts,graphql-types/response.ts,graphql-types/index.ts}` | Dedicated platform-only status operation. |
| ADD | `src/features/expert/graphql/mutations/platform-control-center/grant-course-access/{index.ts,grant-course-access.module-definition.ts,grant-course-access.module.ts,grant-course-access.resolver.ts,grant-course-access.service.ts,grant-course-access.service.spec.ts,graphql-types/input.ts,graphql-types/response.ts,graphql-types/index.ts}` | Dedicated platform-only grant operation. |
| ADD | `src/features/expert/graphql/mutations/platform-control-center/revoke-course-access/{index.ts,revoke-course-access.module-definition.ts,revoke-course-access.module.ts,revoke-course-access.resolver.ts,revoke-course-access.service.ts,revoke-course-access.service.spec.ts,graphql-types/input.ts,graphql-types/response.ts,graphql-types/index.ts}` | Dedicated platform-only revoke operation. |
| MODIFY | `src/features/expert/graphql/mutations/index.ts` | Register five platform-only mutation modules. |
| ADD | `src/modules/platform/databases/postgresql/primary/entities/academy-oauth-state.entity.ts` | Hashed, expiring, single-use provider callback state. |
| ADD | `src/modules/platform/databases/postgresql/primary/entities/academy-webhook-outbox.entity.ts` | Durable payload/event/attempt/nextAttempt/status projection. |
| ADD | `src/modules/bussiness/academy-integrations/academy-google-identity.service.spec.ts` | Google provider and Keycloak delivery matrix. |
| ADD | `src/modules/bussiness/academy-integrations/academy-zalo.service.spec.ts` | State/callback/replay/refresh/isolation matrix. |
| ADD | `src/modules/bussiness/academy-integrations/academy-analytics.service.spec.ts` | Identifier/consent/update/clear matrix. |
| ADD | `src/modules/bussiness/academy-integrations/academy-webhook.service.spec.ts` | CRUD/rotation/secret-once/version matrix. |
| ADD | `src/modules/bussiness/academy-integrations/academy-webhook-signature.service.ts` | Canonical HMAC payload/signature/version. |
| ADD | `src/modules/bussiness/academy-integrations/academy-webhook-signature.service.spec.ts` | Stable signature, tamper and rotated-secret proof. |
| ADD | `src/modules/bussiness/academy-integrations/academy-webhook-dispatcher.service.ts` | Claim, deliver, retry and terminal-failure outbox rows. |
| ADD | `src/modules/bussiness/academy-integrations/academy-webhook-dispatcher.service.spec.ts` | Success, timeout, 4xx, 5xx, retry ceiling and concurrent claimant. |
| ADD | `src/modules/platform/exceptions/errors/academy-integrations/provider-not-supported.ts` | Object metadata `{ provider }`. |
| ADD | `src/modules/platform/exceptions/errors/academy-integrations/oauth-state-invalid.ts` | Object metadata `{ provider, reason }`; no raw state. |
| ADD | `src/modules/platform/exceptions/errors/academy-integrations/webhook-not-found.ts` | Object metadata `{ webhookId }`. |
| ADD | `src/modules/platform/exceptions/errors/academy-integrations/webhook-version-conflict.ts` | Object metadata `{ webhookId, expectedVersion, actualVersion }`. |
| ADD | `src/modules/platform/exceptions/errors/academy-integrations/index.ts` | Exception barrel. |
| MODIFY | `src/modules/platform/databases/postgresql/primary/migrations/1789693200000-academy-integrations.ts` | Include integration secret, OAuth state, webhook and outbox tables/constraints. |
| MODIFY | `src/modules/platform/databases/postgresql/primary/entities/index.ts` | Export integration, integration-secret, OAuth-state, webhook and outbox entities. |
| MODIFY | `src/modules/platform/databases/postgresql/primary/primary.module.ts` | Register all five new entities on `POSTGRESQL_PRIMARY`. |
| ADD OUTSIDE CURRENT TARGET | `D:\Repositories\nivo\k8s\charts\expert\templates\secret-platform-access.yaml` | Generate/preserve the per-release token in `academy-platform-access`; never place it in values. |
| MODIFY OUTSIDE CURRENT TARGET | `D:\Repositories\nivo\k8s\charts\expert\templates\be.yaml` | API-only explicit `secretKeyRef` for `NIVO_PLATFORM_ACCESS_TOKEN`; worker does not receive it. |
| ADD OUTSIDE CURRENT TARGET | `D:\Repositories\nivo\k8s\charts\expert\tests\platform-access-secret_test.yaml` | Helm-unittest render, key/name/API-only wiring and upgrade-preservation assertions where supported. |

All exact Plan r1 production rows not removed or renamed above remain in r2 unchanged. The brace rows above are shorthand for a closed literal list, not a wildcard and not permission to add another member.

### SCHEMA AND TEST VERDICT

| Boundary | Verdict |
|---|---|
| Live core schema | Existing operations measured; four block reads and targeted mutations remain additive except the intentional site-scoping migration of three Academy settings operations. |
| Database connection | Core integration entities only on `POSTGRESQL_PRIMARY`; platform operations only on named `POSTGRESQL_EXPERT_ACADEMY`. |
| Transport | User operations remain GraphQL; only Zalo's external callback is REST. |
| Exceptions | New failures use stable class identities and object metadata; no string-only throw and no provider secret/state value in metadata. |
| E2E | Must enter through core GraphQL, traverse the real internal GraphQL transport, then assert the per-Academy database consequence. |
| Live proof | Requires the chart Secret boundary; mocks cannot clear it. |

### OUTPUTS

| Concept | Result |
|---|---|
| Review candidate | `nivo-academy-control-center-contracts-r2` closes the missing chart/auth/outbox boundaries while retaining Direction C's four independent backend reads. |
| Security architecture | Chart-owned per-release token, API-only delivery, core-only Secret borrow, platform-only operations and no cross-database access. |
| Provider architecture | Google, Zalo, analytics and webhook each keep distinct storage, delivery and failure semantics. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\feature\nivo\academy-control-center-contracts.md` | `modified` — appended Backend Feature Review r1 and candidate r2 boundary. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Duyệt revised production boundary? | **Duyệt `nivo-academy-control-center-contracts-r2` và thêm `D:\Repositories\nivo` làm chart target (recommended)**; hoặc giữ backend-only thì phải bỏ live runtime bridge/CRM khỏi feature. |

### WARNINGS

| Warning | Impact |
|---|---|
| `D:\Repositories\nivo\k8s\charts\expert` mới là chart khớp `ExpertChartValues`; `D:\Repositories\nivo-charts\charts\expert-academy` là một shape khác. | Apply nhầm chart sẽ tạo code build được nhưng deployment thật không nhận token. |
| Feature vẫn lớn và phải Apply theo dependency slices nhưng trong một frozen schema/boundary. | Không được báo hoàn tất sau slice đầu; lint/build/twin/E2E/live gates chỉ pass khi toàn bộ revision hoạt động. |
| Chart Secret generated by `lookup` needs an upgrade test against a live cluster in addition to `helm template`. | Render-only proof cannot prove value preservation across upgrade. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Plan r1 token through provision values | Chart-generated/preserved Secret read by core | Values can be recovered with Helm and the target chart did not consume the field. |
| Dual platform-or-admin guard on existing member resolvers | Dedicated platform-only operations | Existing resolvers require a real `MemberPrincipal`; synthesizing one hides service identity and weakens audit. |
| CRUD-only webhook | Durable outbox, signer and dispatcher | A configured endpoint with no delivery owner is not a working integration. |
| Treat `nivo-charts/expert-academy` as the runtime chart | `nivo/k8s/charts/expert` | Source types and current installer comments point at the latter values contract. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval of r2 and chart target | User states `Duyệt nivo-academy-control-center-contracts-r2, cho phép sửa D:\Repositories\nivo\k8s\charts\expert`. |
| Backend/chart implementation | `starci-be-feature-apply` after approved Review append. |
| Live Helm upgrade token-preservation proof | Apply against the dev cluster, then real core → Academy GraphQL call. |
| FE implementation | Backend schema and live bridge pass, then `starci-fe-design-apply`. |

## review r2

Approved revision: `nivo-academy-control-center-contracts-r2`

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
| Repo / branch | D:\Repositories\nivo-backend (`main`); D:\Repositories\nivo (`main`); D:\Repositories\nivo-fe (`main`); Source D:\Repositories\starci-academy-backend (`mtp`) |
| Purpose | Ghi nhận phê duyệt exact revision r2 và khóa backend/chart production boundary cho Apply. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\nivo\academy-control-center-contracts.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ D:\Repositories\starci-academy-backend\.workflows\feature\nivo\academy-control-center-contracts.md |

### APPROVAL EVIDENCE

| Evidence | Consequence |
|---|---|
| Người dùng xác nhận “Duyệt nivo-academy-control-center-contracts-r2”. | Khóa toàn bộ Revised Architecture, Plan r1 rows retained by Review r1, Review r1 boundary delta và chart target `D:\Repositories\nivo\k8s\charts\expert`; không mở lại quyết định trong Apply. |

### APPROVED PRODUCTION BOUNDARY

| Repository | Boundary | Status before Apply |
|---|---|---|
| `D:\Repositories\nivo-backend` | Toàn bộ exact production rows trong Plan r1, trừ các `REMOVE FROM BOUNDARY`, cộng các `ADD`/`RENAME`/`MODIFY` của Review r1. | Approved; Apply must capture a baseline commit before the first production write. |
| `D:\Repositories\nivo` | `k8s/charts/expert/templates/secret-platform-access.yaml`; `k8s/charts/expert/templates/be.yaml`; `k8s/charts/expert/tests/platform-access-secret_test.yaml`. | Approved; chart subtree is clean at Review time. |
| `D:\Repositories\nivo-fe` | None in Backend Feature Apply. | FE remains a later approved Design Apply. |

### ACCEPTANCE FREEZE

| Gate | Approved requirement |
|---|---|
| Schema | Four independent site-scoped reads, targeted student/settings/provider mutations, additive platform-only runtime operations. |
| Ownership | `userId + siteId` admitted before runtime/provider access; foreign and missing site share one public not-found surface. |
| Secret custody | No platform/provider secret in browser, GraphQL read payload, log, exception metadata or Helm values. |
| Chart | Generated Secret survives Helm upgrade and reaches API container only. |
| Data | Core uses `POSTGRESQL_PRIMARY`; Academy platform operations use `POSTGRESQL_EXPERT_ACADEMY`; no cross-database repository. |
| Tests | Lint zero errors, all Nest builds/typecheck, every named twin spec, two control-plane E2Es and live core → Academy call. |
| Completion | Apply remains incomplete while any unexplained Network, Console, core terminal, Academy terminal or live Helm failure remains. |

### OUTPUTS

| Concept | Result |
|---|---|
| Approved capability | Site-scoped Academy control center backend covering growth, students, settings and provider integrations. |
| Approved architecture | Chart-owned platform access Secret, API-only platform operations, core bridge and independent provider ownership. |
| Approved revision | `nivo-academy-control-center-contracts-r2`. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\feature\nivo\academy-control-center-contracts.md` | `modified` — appended explicit Review approval and frozen Apply boundary. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | None |

### WARNINGS

| Warning | Impact |
|---|---|
| Apply spans backend and chart repositories and must baseline each independently before writing. | A partly edited baseline or a path outside the frozen boundary requires return to Review. |
| The feature is intentionally large. | Passing only ownership/runtime bridge or only CRM does not satisfy the approved capability. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| None in this approval round | Review r1 replacements remain binding | User approved r2 without further correction. |

### OWED

| Owed | Cleared by |
|---|---|
| Backend/chart implementation and all frozen gates | Run `starci-be-feature-apply` for `nivo-academy-control-center-contracts-r2`. |
| FE implementation | After backend live proof, run `starci-fe-design-apply` for `nivo-academy-control-center-r1`. |

## review r3

Candidate revision: `nivo-academy-control-center-contracts-r2.1`

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
| Repo / branch | D:\Repositories\nivo-backend (`main`); D:\Repositories\nivo (`main`); D:\Repositories\nivo-fe (`main`); Source D:\Repositories\starci-academy-backend (`mtp`) |
| Purpose | Sửa chính xác các lệch boundary được phát hiện khi Apply r2 đối chiếu với source và chart runtime thật. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\nivo\academy-control-center-contracts.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ D:\Repositories\starci-academy-backend\.workflows\feature\nivo\academy-control-center-contracts.md |

### APPLY DISCOVERY EVIDENCE

| Evidence | Result |
|---|---|
| Backend baseline | `bbee1cec6d6466585e99dc0cc7bddb857006c93e` on `D:\Repositories\nivo-backend`; unrelated dirty work was not staged. |
| Chart baseline | `384bd8e02c83b4489bc11be270dc65b7ef0d33d8` on `D:\Repositories\nivo`; unrelated dirty work was not staged. |
| Approved chart writes already made | `k8s/charts/expert/templates/secret-platform-access.yaml`, `k8s/charts/expert/templates/be.yaml`, `k8s/charts/expert/tests/platform-access-secret_test.yaml`; all remain inside r2's approved chart boundary. |
| Backend production writes | None after the baseline; Apply stopped before crossing the incomplete boundary. |
| Runtime chart evidence | `k8s/charts/expert/templates/be.yaml` declares the namespace-local Service as `be`, not `<release>-expert-academy`. |
| Environment evidence | `PlatformAccessGuard` must consume `NIVO_PLATFORM_ACCESS_TOKEN` through canonical `envConfig`; direct `process.env` is forbidden, but `src/modules/platform/env/config.ts` was absent from r2. |
| Operation evidence | Acceptance requires Google disconnect, but r2 only named the save operation family. |
| Migration evidence | `src/modules/platform/databases/postgresql/primary/migrations/1789693200000-academy-integrations.ts` does not exist, so its action cannot be `MODIFY`. |

### REVISED PRODUCTION BOUNDARY DELTA

All r2 architecture, acceptance criteria and exact production rows remain frozen except for the following corrections.

| Action | Path / decision | Reason |
|---|---|---|
| MODIFY | `src/modules/platform/env/config.ts` | Add canonical parsing for `NIVO_PLATFORM_ACCESS_TOKEN` so `PlatformAccessGuard` does not read `process.env` directly. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/disconnect-academy-google-oauth/index.ts` | Export the approved Google disconnect operation. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/disconnect-academy-google-oauth/disconnect-academy-google-oauth.module-definition.ts` | Declare the operation module contract. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/disconnect-academy-google-oauth/disconnect-academy-google-oauth.module.ts` | Register resolver and handler. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/disconnect-academy-google-oauth/disconnect-academy-google-oauth.resolver.ts` | Expose the site-scoped mutation. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/disconnect-academy-google-oauth/disconnect-academy-google-oauth.command.ts` | Carry admitted user/site ownership into the handler. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/disconnect-academy-google-oauth/disconnect-academy-google-oauth.handler.ts` | Disconnect Google and clear tenant delivery state idempotently. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/disconnect-academy-google-oauth/disconnect-academy-google-oauth.handler.spec.ts` | Prove ownership, idempotency, secret cleanup and unchanged sibling providers. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/disconnect-academy-google-oauth/graphql-types/input.ts` | Define the site-scoped input. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/disconnect-academy-google-oauth/graphql-types/response.ts` | Define the stable mutation response. |
| ADD | `src/features/core/api/core/graphql/mutations/academy-integrations/disconnect-academy-google-oauth/graphql-types/index.ts` | Export GraphQL types. |
| CORRECT SEMANTICS; SAME APPROVED PATH | `src/modules/bussiness/academy-control-center/academy-runtime-host.ts` | Resolve `http://be.nivo-<siteId>.svc.cluster.local:4000/graphql`, derived from the actual namespace and Service manifest; do not invent `<release>-expert-academy`. |
| CHANGE ACTION `MODIFY` TO `ADD`; SAME PATH | `src/modules/platform/databases/postgresql/primary/migrations/1789693200000-academy-integrations.ts` | The migration is new in the current tree. Its approved schema contents and constraints do not change. |

### ACCEPTANCE IMPACT

| Gate | r2.1 effect |
|---|---|
| Security | Strengthens the gate by keeping environment access behind canonical config. |
| Runtime bridge | Corrects service discovery to the Service Helm actually installs. |
| Google lifecycle | Makes the already-promised disconnect behavior implementable and testable. |
| Database | Changes only the file action from modification to creation; schema semantics remain r2. |
| Chart | No boundary expansion. The three existing approved chart edits remain valid. |

### OUTPUTS

| Concept | Result |
|---|---|
| Review candidate | `nivo-academy-control-center-contracts-r2.1` closes four Apply-discovered boundary defects without changing the selected product direction. |
| Backend state | No backend product file has been written after its baseline. |
| Chart state | Approved Secret/API-only wiring is present but not yet committed or proven. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\feature\nivo\academy-control-center-contracts.md` | `modified` — appended Apply discovery and candidate r2.1 boundary. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Duyệt boundary sửa lỗi để tiếp tục Apply? | **Duyệt `nivo-academy-control-center-contracts-r2.1` (recommended)**; hoặc dừng và bỏ các phần platform guard, live runtime bridge và Google disconnect khỏi feature. |

### WARNINGS

| Warning | Impact |
|---|---|
| Ba file chart đã được sửa sau baseline nhưng vẫn nằm đúng trong boundary r2. | Chúng được giữ nguyên; Apply chỉ tiếp tục backend sau khi r2.1 được duyệt. |
| r2.1 không cấp quyền sửa thêm FE hoặc file backend ngoài các dòng chính xác ở trên và r2. | Mọi phát hiện mới ngoài boundary vẫn phải quay lại Review. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Đọc token bằng `process.env` ngay trong guard | Sửa `envConfig` rồi inject canonical config | Trust rules cấm environment access phân tán. |
| Dùng hostname `<release>-expert-academy` theo suy đoán | Dùng Service `be` trong namespace `nivo-<siteId>` | Chart runtime thật là bằng chứng ràng buộc. |
| Im lặng bỏ Google disconnect | Thêm một operation family chính xác | Acceptance r2 đã hứa lifecycle disconnect. |
| Ghi `MODIFY` cho migration chưa tồn tại | `ADD` đúng cùng path | Apply không được giả định file có sẵn. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval of r2.1 | User states `Duyệt nivo-academy-control-center-contracts-r2.1`. |
| Continue backend/chart implementation | Append Review approval, then resume `starci-be-feature-apply` from the recorded baselines. |
| Frozen proof gates | Lint, all Nest builds/typecheck, twin specs, E2E, live Helm upgrade and live core → Academy call. |

## review r4

Approved revision: `nivo-academy-control-center-contracts-r2.1`

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
| Repo / branch | D:\Repositories\nivo-backend (`main`); D:\Repositories\nivo (`main`); D:\Repositories\nivo-fe (`main`); Source D:\Repositories\starci-academy-backend (`mtp`) |
| Purpose | Ghi nhận phê duyệt r2.1 và cho phép tiếp tục Apply trên boundary r2 cộng bốn delta sửa lỗi. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\nivo\academy-control-center-contracts.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ D:\Repositories\starci-academy-backend\.workflows\feature\nivo\academy-control-center-contracts.md |

### APPROVAL EVIDENCE

| Evidence | Consequence |
|---|---|
| Người dùng xác nhận “Duyệt nivo-academy-control-center-contracts-r2.1”. | Khóa r2 cùng bốn delta trong Review r3; Apply được tiếp tục từ backend baseline `bbee1cec6d6466585e99dc0cc7bddb857006c93e` và chart baseline `384bd8e02c83b4489bc11be270dc65b7ef0d33d8`. |

### OUTPUTS

| Concept | Result |
|---|---|
| Approved revision | `nivo-academy-control-center-contracts-r2.1`. |
| Backend boundary | r2 exact rows plus env config, Google disconnect family, corrected runtime DNS semantics and migration action `ADD`. |
| Chart boundary | Unchanged three exact chart files from r2. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\feature\nivo\academy-control-center-contracts.md` | `modified` — appended explicit r2.1 approval. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | None |

### WARNINGS

| Warning | Impact |
|---|---|
| Apply must still remain inside the combined r2 + Review r3 exact boundary. | Any further missing production path requires another Review revision. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| None in this approval round | Apply approved r2.1 | User accepted the exact corrections. |

### OWED

| Owed | Cleared by |
|---|---|
| Backend/chart implementation and frozen proof | Complete `starci-be-feature-apply` and append live evidence. |
| FE implementation | Run the separately approved FE Design Apply after backend contracts pass live proof. |

## review r5

Candidate revision: `nivo-academy-control-center-contracts-r2.2`

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
| Repo / branch | D:\Repositories\nivo-backend (`main`); D:\Repositories\nivo (`main`); Source D:\Repositories\starci-academy-backend (`mtp`) |
| Purpose | Bổ sung hai dispatcher type paths bắt buộc được core build phát hiện sau khi settings chuyển sang explicit `siteId`. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\nivo\academy-control-center-contracts.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow này; chưa sửa hai production paths mới. |

### APPLY DISCOVERY EVIDENCE

| Evidence | Result |
|---|---|
| Targeted CRM platform/core query tests | 6/6 pass. |
| Runtime/auth/settings tests accumulated | 31 targeted tests pass before the new query slice; settings 15/15 pass. |
| `nest build core` | Fails only because two dispatcher services still declare the pre-r2 request types (`Record<string, never>` and `{ userId: string }`). |
| Domain routing | Existing `k8s/charts/expert/templates/ingress.yaml` already routes `/graphql` and `/api` to `be`, `/` to `fe` on every app/custom host; no production change required. |

### REVISED PRODUCTION BOUNDARY DELTA

All approved r2.1 rows remain frozen. Add exactly:

| Action | Path | Reason |
|---|---|---|
| MODIFY | `src/features/core/api/core/graphql/queries/academy-settings/my-academy-settings/my-academy-settings.service.ts` | Change dispatcher request type from `Record<string, never>` to `{ siteId: string }`; no behavior change. |
| MODIFY | `src/features/core/api/core/graphql/mutations/academy-settings/recheck-academy-credentials/recheck-academy-credentials.service.ts` | Change dispatcher request type from `{ userId: string }` to `{ userId: string; siteId: string }`; no behavior change. |

### OUTPUTS

| Concept | Result |
|---|---|
| Candidate | `nivo-academy-control-center-contracts-r2.2` is a compile-only boundary correction for two existing dispatchers. |
| Product architecture | Unchanged: Nivo FE → Nivo Core for control-center configuration; Academy FE → Academy BE directly; same-origin ingress path split. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\feature\nivo\academy-control-center-contracts.md` | `modified` — appended r2.2 candidate. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Duyệt hai dispatcher type paths để Apply tiếp tục? | **Duyệt `nivo-academy-control-center-contracts-r2.2` (recommended)**; hoặc bỏ explicit `siteId` khỏi settings, trái acceptance đã duyệt. |

### WARNINGS

| Warning | Impact |
|---|---|
| Không sửa hai file này thì core không thể compile; cast sẽ chỉ che contract drift. | Apply phải dừng ở Review thay vì báo source pass giả. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Ép cast request mới về type cũ | Sửa hai dispatcher signatures | Cast làm mất compile-time tenant contract. |
| Sửa ingress/domain chart | Giữ chart hiện tại | Path routing FE/BE đã đúng và custom host đã được render từ values. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit r2.2 approval | User states `Duyệt nivo-academy-control-center-contracts-r2.2`. |
| Resume remaining code | Update two dispatcher types, rerun core build, then continue five CRM mutations and integrations. |

## review r6

Approved revision: `nivo-academy-control-center-contracts-r2.2`

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
| Repo / branch | D:\Repositories\nivo-backend (`main`); D:\Repositories\nivo (`main`); Source D:\Repositories\starci-academy-backend (`mtp`) |
| Purpose | Ghi nhận phê duyệt hai dispatcher type paths của r2.2. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\nivo\academy-control-center-contracts.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow này. |

### APPROVAL EVIDENCE

| Evidence | Consequence |
|---|---|
| Người dùng xác nhận “Duyệt nivo-academy-control-center-contracts-r2.2”. | Apply được sửa đúng hai dispatcher service paths trong Review r5 và tiếp tục toàn bộ r2.1 boundary. |

### OUTPUTS

| Concept | Result |
|---|---|
| Approved revision | `nivo-academy-control-center-contracts-r2.2`. |
| Architecture | Không đổi. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\feature\nivo\academy-control-center-contracts.md` | `modified` — appended r2.2 approval. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | None |

### WARNINGS

| Warning | Impact |
|---|---|
| Apply remains incomplete until all frozen code and proof gates pass. | No partial completion claim. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| None | Approved r2.2 | Exact delta accepted. |

### OWED

| Owed | Cleared by |
|---|---|
| Remaining implementation and proof | Continue Apply. |

## apply r2.2

Applied revision: `nivo-academy-control-center-contracts-r2.2`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| Chart | D:\Repositories\nivo |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | nivo |
| Repo / branch | Backend `main`; chart `main`; Source `mtp` |
| Purpose | Implement Academy control-center CRM, provider integrations, platform runtime bridge, domain routing contract and durable webhook delivery. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\nivo\academy-control-center-contracts.md |
| Language | vi |
| Phase | apply — source and deterministic proof complete; credentialed live proof owed |
| Baseline | Backend `bbee1cec6d6466585e99dc0cc7bddb857006c93e`; chart `384bd8e02c83b4489bc11be270dc65b7ef0d33d8` |

### OUTPUTS

| Concept | Result |
|---|---|
| Academy CRM | Added owner-scoped create, update, status, grant-access and revoke-access operations through the Academy runtime bridge. |
| Provider integrations | Added Google identity, Zalo OA OAuth, GA4/Meta analytics and webhook contracts with encrypted secret persistence and safe read models. |
| Webhook delivery | Added durable outbox, HMAC signing, bounded interval worker, stale-claim recovery and five-attempt exponential retry. |
| Platform runtime | Added token-protected Academy-side queries/mutations and Core-to-Academy runtime client boundary. |
| Domain routing | Preserved the existing tenant-host ingress: FE `/`, BE `/graphql` and `/api`; custom-domain verification supports CNAME and apex A-record resolution. |
| Data model | Added five Academy integration entities and migration `1789693200000-academy-integrations.ts`. |
| Chart | Added a dedicated platform-access Secret and injected its token only into the Academy API container. |
| Qdrant build | Restored the lockfile-pinned `@qdrant/js-client-rest@1.18.0` with `npm ci`; Academy and Core compile without changing RAG source. |

### CHANGES

| Tree | Details |
|---|---|
| `src/features/core/api/core/graphql/mutations/academy-control-center/**` | Added five CRM mutation families and event dispatch. |
| `src/features/core/api/core/graphql/mutations/academy-integrations/**` | Added Google, Zalo, analytics and webhook mutations. |
| `src/features/core/api/core/graphql/queries/academy-control-center/**` | Added owner-scoped Academy control-center read contracts. |
| `src/features/core/api/core/graphql/queries/academy-integrations/**` | Added partial-failure-safe provider aggregate query. |
| `src/features/core/api/core/http/academy-integrations/**` | Added Zalo OAuth callback boundary. |
| `src/features/expert/graphql/{queries,mutations}/platform-control-center/**` | Added token-protected Academy runtime operations. |
| `src/modules/bussiness/academy-{runtime,integrations}/**` | Added runtime client, provider services, encryption boundary, OAuth state and durable webhook worker. |
| `src/modules/expert/platform-access/**` | Added Academy platform-access guard/module. |
| `src/modules/platform/databases/postgresql/primary/**` | Added entities, registrations and migration. |
| `src/tests/e2e/controlplane/academy-*.e2e-spec.ts` | Added flow E2E for CRM ownership/runtime and webhook outbox/retry/signature. |
| `k8s/charts/expert/templates/{be,secret-platform-access}.yaml` | Added API-only platform token injection. |
| `k8s/charts/expert/tests/platform-access-secret_test.yaml` | Added chart contract test; plugin execution remains unavailable locally. |

### PROOF

| Gate | Command / evidence | Verdict |
|---|---|---|
| Backend lint | `npx eslint "{src,apps}/**/*.ts" --quiet` | PASS — 0 errors, 0 warnings. |
| Core build | `npm run build` | PASS. |
| Academy build | `npm run build:academy` | PASS. |
| Controlplane build | `npm run build:controlplane` | PASS. |
| CLI build | `npm run build:cli` | PASS. |
| Feature twin specs | 33 suites, 51 tests | PASS. |
| Existing Academy/settings specs | 6 suites, 33 tests | PASS. |
| Flow E2E | Both Academy controlplane files in one final run | PASS — 2 suites, 3 tests, 38.199 s. |
| Diff integrity | `git diff --check` | PASS; only existing LF/CRLF conversion warnings. |
| Helm lint | `helm lint` | PASS — 1 chart, 0 failed. |
| Helm render | `helm template` plus platform token reference inspection | PASS — dedicated Secret and exactly one API-container reference. |

### LIVE FLOW PROOF

| Field | Evidence |
|---|---|
| Flow | Owner reads Academy dashboard, mutates CRM, configures providers, receives durable webhook events and serves tenant FE/BE through the custom host. |
| Persona | Local E2E owner and foreign tenant personas passed; real customer/test persona is OWED. |
| Steps | Real Core GraphQL transport called the Academy runtime stub; CRM create generated an outbox event; delivery returned 503 once, retried to 204 and verified the rotated HMAC secret. |
| UI | OWED until FE Apply consumes the approved contracts and a credentialed live Academy is available. |
| Network | Deterministic E2E passed; external Google, Zalo, SMTP/payment and DNS calls are OWED until credentials/domain are supplied. |
| Console | No feature JavaScript console proof yet; live browser run is OWED. |
| Terminal | Final lint/build/E2E gates passed. Boot emitted existing environment warnings for Qdrant server compatibility, missing knowledge corpus/embedding config and unset SePay credentials. |
| Verdict | SOURCE COMPLETE / LIVE OWED — implementation is ready for credentials; do not claim production-live completion yet. |
| Evidence | `src/tests/e2e/controlplane/academy-control-center.e2e-spec.ts`; `src/tests/e2e/controlplane/academy-integrations.e2e-spec.ts`. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Code boundary is implemented; live credentials may be supplied through the approved secret location. |

### WARNINGS

| Warning | Impact |
|---|---|
| Local Qdrant server is `1.10.1`, while the lockfile-pinned client is `1.18.0`. | Builds pass, but runtime prints a compatibility warning; align the Qdrant server before exercising RAG. |
| `npm ci` reports 14 dependency vulnerabilities. | Existing dependency maintenance item; no forced major upgrade was mixed into this feature. |
| `helm unittest` is not installed. | The committed chart test was not executable locally; lint and rendered-manifest proof passed. |
| Repository contains unrelated dirty work. | No unrelated file was reset, overwritten or committed. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Return provider secrets to browser | Write-only mutations and safe status projections | Prevent credential disclosure. |
| FE calls Academy internal API directly | FE calls Core Nivo; Core calls Academy runtime | Keeps ownership, authorization and provider secrets in the control plane. |
| In-memory webhook retries | Durable outbox with claim fencing and retry schedule | Survives process restart and avoids duplicate uncontrolled delivery. |
| Change RAG source to accommodate the wrong installed SDK | Restore exact lockfile dependencies with `npm ci` | The source already matches the committed dependency contract. |

### OWED

| Owed | Cleared by |
|---|---|
| Credentialed Google Login live proof | Mount Google client ID/secret in the approved secret store and run authorize/callback through browser. |
| Credentialed Zalo OA live proof | Mount Zalo app ID/secret, register callback URL and run authorize/callback. |
| SMTP and payment live proof | Mount test provider credentials and exercise one delivery/payment flow if included in release acceptance. |
| Analytics and webhook live proof | Supply test measurement IDs and one reachable HTTPS webhook endpoint. |
| Custom domain live proof | Supply the selected domain and publish its A/CNAME record, then verify FE `/`, BE `/graphql` and `/api`. |
| Full FE browser proof | Run FE Design Review/Apply against these contracts, then inspect UI, Network, Console and FE/BE terminal with the test account. |
| Helm unit plugin proof | Install `helm-unittest` and execute `tests/platform-access-secret_test.yaml`, or run it in CI where the plugin exists. |
