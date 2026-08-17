<!-- starci-workflow: v2 -->

## plan — nivo-academy-langchain-rag-r1

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
| App | `expert-academy-api`; không chạm `core`, `agentos-cli` hoặc `agentos-controlplane`. |
| Database | Expert Academy PostgreSQL vẫn giữ lesson/attachment và citation title; Qdrant giữ derived vector index riêng theo `EXPERT_INSTANCE_ID`. Không thêm entity hoặc migration PostgreSQL. |
| Repo / branch | D:\Repositories\nivo-backend @ `main` (`74604ff863f5d216b386af27e4b4861486d27217`) |
| Purpose | Chuyển Academy RAG retrieval sang LangChain theo pattern StarCi mà vẫn giữ embedding lane, geometry, instance isolation, citation và payload Qdrant hiện tại. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\nivo\academy-langchain-rag.md |
| Language | vi |
| Phase | plan |
| Touching | Chỉ D:\Repositories\starci-academy-backend\.workflows\feature\nivo\academy-langchain-rag.md; Plan không ghi product source. |

### SCHEMA AND SIBLING EVIDENCE

Live schema được dump không lọc từ `http://127.0.0.1:3069/graphql` sau khi khởi động `expert-academy-api`.

Queries hiện có: `academyMailSettings`, `affiliates`, `askTutor`, `certificates`, `commissions`, `completionFunnel`, `coupons`, `course`, `courseProgress`, `courses`, `dashboardStats`, `downloadToken`, `lessonAttachments`, `listMediaAssets`, `me`, `members`, `myCertificates`, `myInstallmentPlans`, `myLeads`, `myNotifications`, `myXp`, `orders`, `platformGrowthSnapshot`, `platformStudentDetail`, `platformStudents`, `playbackToken`, `posts`, `revenueSeries`, `sentEmails`, `studentDetail`, `systemStatus`, `templatePresets`, `validateCoupon`.

Mutations hiện có: `addComment`, `applyTemplate`, `attachVideo`, `cancelOrder`, `confirmOrder`, `connectAcademyMail`, `createAffiliate`, `createCoupon`, `createCourse`, `createInstallmentPlan`, `createLesson`, `createMember`, `createOrder`, `createPost`, `deleteAttachment`, `deleteCourse`, `deleteLesson`, `deleteMediaAsset`, `exchangeOauthCode`, `forgotPasswordInit`, `forgotPasswordResend`, `forgotPasswordVerifyOtp`, `grantCourseAccess`, `hidePost`, `markAllNotificationsRead`, `markLessonComplete`, `markNotificationRead`, `payInstallment`, `pinPost`, `platformCreateStudent`, `platformGrantCourseAccess`, `platformRevokeCourseAccess`, `platformSetStudentStatus`, `platformUpdateStudent`, `reactPost`, `refreshSession`, `refundOrder`, `reindexRag`, `removeMember`, `removePost`, `restorePost`, `retryTranscode`, `revokeCourseAccess`, `saveLessonPosition`, `sendRemarketing`, `setAcademyMailTemplate`, `setAcademyMailVerification`, `setMemberRole`, `setMemberStatus`, `signIn`, `signInInit`, `signInResend`, `signInVerifyOtp`, `signOut`, `signUpInit`, `signUpResend`, `signUpVerifyOtp`, `submitLead`, `unpinPost`, `updateBrand`, `updateCoupon`, `updateCourse`, `updateCustomCss`, `updateLayoutConfig`, `updateLead`, `updateLesson`, `updateMember`, `updateStack`, `updateTheme`.

Hai operation được mở và ruled in:

| Operation | Current return | Decision |
|---|---|---|
| `askTutor` | `AskTutorResponse` với `answer` và `sources { lessonId title }` | Giữ nguyên GraphQL contract; chỉ thay retrieval engine phía sau `RagAskService`. |
| `reindexRag` | `ReindexRagResponse` với số chunk `indexed` | Giữ nguyên admin mutation; indexer tiếp tục direct-upsert để giữ top-level geometry/identity markers. |

Sibling được mirror:

| Evidence | What is mirrored | Deliberate divergence |
|---|---|---|
| StarCi `src/modules/integrations/langchain/embedding-model.service.ts` | Một LangChain `Embeddings` adapter; actual provider work chỉ xảy ra trong `embedDocuments`/`embedQuery`. | Nivo không dùng StarCi balancer. `embedDocuments` phải đi Cloud lane bằng instance key; `embedQuery` giữ Local lane. Không fallback vì hai lane là ownership policy. |
| StarCi `src/modules/integrations/rag/course-rag-retrieval.service.ts` | `QdrantVectorStore.fromExistingCollection(...)`, `similaritySearch(...)`, typed retrieval service và focused twin. | Academy collection tách cứng theo instance thay vì shared collection + tenant filter. Existing payload dùng `chunk_text`, `source_id`, `course_slug`; revision thêm nested `metadata` nhưng giữ các top-level marker. |
| Nivo `src/modules/integrations/rag/rag-index.service.ts` | Direct Qdrant lifecycle, geometry assertion, instance identity, advisory reindex lock và derived-index rebuild. | LangChain không được sở hữu collection lifecycle vì writer phải stamp `embed_model`, `embed_lane` và instance id ở top level. |
| Nivo `src/features/expert/graphql/queries/rag/ask` và `mutations/rag/reindex` | Existing auth, response envelopes và one-operation folder shape. | Không thêm resolver, mutation, query hoặc REST door. |

### PROPOSED CAPABILITY

Revision đề xuất: `nivo-academy-langchain-rag-r1`.

- Thêm `@langchain/core` và `@langchain/qdrant`; dùng chính `@qdrant/js-client-rest` đã có trong Nivo.
- Thêm global `LangchainModule` tại composition root của `expert-academy-api`. Module chỉ export `EmbeddingModelService`; không import ngang vào `RagModule`.
- `EmbeddingModelService` trả một LangChain `Embeddings`: `embedDocuments` gọi `CloudEmbeddingService` với `INSTANCE_OPENROUTER_API_KEY`; `embedQuery` gọi `EmbeddingService` local. Không fallback, không lưu key trong field, không log key.
- Thêm `RagRetrievalService`: geometry check chạy trước query embedding, sau đó mở existing collection bằng `QdrantVectorStore` với `contentPayloadKey = "chunk_text"`, `metadataPayloadKey = "metadata"`, top-k 6 và optional `metadata.courseSlug` filter.
- `RagAskService` chỉ orchestration: gọi retrieval, dựng context, gọi `AiService`, resolve title từ Expert Academy PostgreSQL và dedupe citations. GraphQL response không đổi.
- Indexer vẫn direct-upsert để giữ top-level `embed_model`, `embed_lane` và instance identity; mỗi point đồng thời có nested `metadata { sourceId, courseSlug }` cho LangChain.
- Collection cũ được backfill metadata bằng Qdrant payload update dựa trên `source_id`/`course_slug`, không drop collection và không re-embed. Backfill idempotent, không ghi vector, chạy sau identity check và trước khi app tuyên bố RAG index đã sẵn sàng.
- Direct Qdrant vẫn là low-level adapter cho health, identity, geometry, count, collection lifecycle và index writes. LangChain chỉ sở hữu application retrieval abstraction.

### PROPOSED FILE TREE

| Tree | Details | Shape evidence |
|---|---|---|
| `D:\Repositories\nivo-backend\package.json` | modified — add `@langchain/core` and `@langchain/qdrant`. | StarCi dependency pair; Nivo already owns compatible `@qdrant/js-client-rest`. |
| `D:\Repositories\nivo-backend\package-lock.json` | modified — lock exact transitive graph used by npm gates. | Tracked npm lock is updated with every recent dependency change. |
| `D:\Repositories\nivo-backend\apps\expert-academy-api\src\app.module.ts` | modified — register global `LangchainModule` at composition root. | LAYERING-3/4; same root registration used by embedding modules. |
| `D:\Repositories\nivo-backend\src\modules\integrations\langchain\langchain.module-definition.ts` | added — configurable module definition. | Mirrors StarCi LangChain module and Nivo configurable module family. |
| `D:\Repositories\nivo-backend\src\modules\integrations\langchain\langchain.module.ts` | added — global-capable provider/export wiring. | Composition-root registration; no sideways module import. |
| `D:\Repositories\nivo-backend\src\modules\integrations\langchain\embedding-model.service.ts` | added — LangChain `Embeddings` adapter over Nivo Cloud/Local lanes. | StarCi lazy embedding adapter, constrained by Nivo ownership policy. |
| `D:\Repositories\nivo-backend\src\modules\integrations\langchain\embedding-model.service.spec.ts` | added — lane, key custody, geometry and no-fallback twin. | TESTING-5/6; sibling StarCi focused spec. |
| `D:\Repositories\nivo-backend\src\modules\integrations\rag\rag-document.ts` | added — payload keys, typed metadata and legacy-to-LangChain metadata mapper. | One named source prevents writer/reader key drift. |
| `D:\Repositories\nivo-backend\src\modules\integrations\rag\rag-document.spec.ts` | added — metadata narrowing and legacy/current/idempotent cases. | TYPE-1 and TESTING-5; payload is untrusted `unknown`. |
| `D:\Repositories\nivo-backend\src\modules\integrations\rag\rag-retrieval.service.ts` | added — LangChain Qdrant retrieval and course scope. | Mirrors StarCi course retrieval service while preserving Academy hard collection boundary. |
| `D:\Repositories\nivo-backend\src\modules\integrations\rag\rag-retrieval.service.spec.ts` | added — geometry, filters, top-k, missing collection and provider failure cases. | Focused sibling twin. |
| `D:\Repositories\nivo-backend\src\modules\integrations\rag\rag-ask.service.ts` | modified — consume typed retrieval results instead of direct Qdrant query. | Existing public service/GraphQL contract remains stable. |
| `D:\Repositories\nivo-backend\src\modules\integrations\rag\rag.spec.ts` | modified — preserve answer/citation decisions while mocking retrieval boundary. | Existing RagAskService twin. |
| `D:\Repositories\nivo-backend\src\modules\integrations\rag\rag-index.service.ts` | modified — stamp nested metadata and backfill legacy payload without re-embedding. | Existing direct writer owns geometry/identity payload. |
| `D:\Repositories\nivo-backend\src\modules\integrations\rag\rag-index.service.spec.ts` | modified — current write payload and idempotent legacy backfill cases. | Existing index decision twin. |
| `D:\Repositories\nivo-backend\src\modules\integrations\rag\rag.module.ts` | modified — provide/export `RagRetrievalService`. | Existing global RAG capability wiring. |
| `D:\Repositories\nivo-backend\src\tests\container\rag.container-spec.ts` | modified — replace stale pgvector claims with real Qdrant container flow and deterministic external SDK doubles. | TESTING-3/9 and current Qdrant architecture. |
| `D:\Repositories\nivo-backend\src\tests\e2e\expert\rag.e2e-spec.ts` | modified — real Qdrant GraphQL flow, course isolation and auth consequences. | Existing Academy RAG E2E lane, corrected to production transport/store. |

### TEST MATRIX

| Case | Expected proof |
|---|---|
| LangChain document embedding | `embedDocuments` calls Cloud lane with the current instance key; Local lane is untouched. |
| LangChain query embedding | `embedQuery` calls Local `EmbeddingService`; customer Cloud lane is untouched. |
| Missing instance key | Cloud document embedding throws the existing domain exception; no fallback and no network call using a platform key. |
| Empty batch | Adapter preserves underlying service semantics and returns no invented vector. |
| Geometry before retrieval | Collection geometry is checked before `embedQuery`; mismatch propagates and no similarity search runs. |
| Existing collection | `QdrantVectorStore.fromExistingCollection` receives the Academy client, collection, `chunk_text` and `metadata` payload keys. |
| Default top-k | Retrieval asks for exactly 6 hits. |
| Course scope | `courseSlug` creates `metadata.courseSlug` must-filter; omitted scope sends no course filter. |
| Missing collection | Retrieval returns no hits and `RagAskService` returns the current no-content answer without calling AI. |
| Embedder/Qdrant outage | Existing loud failure policy is preserved; outage is not converted into a confident no-content answer. |
| Retrieved context | Similarity-ordered `pageContent` becomes numbered prompt context. |
| Duplicate source | Repeated chunks cite one source once. |
| Attachment source | Missing `LessonEntity` title keeps the `Tài liệu` fallback. |
| New index point | Top-level identity/geometry/lane fields remain and nested metadata carries `sourceId`/`courseSlug`. |
| Legacy payload backfill | Existing point gains nested metadata via payload update; vector and top-level fields are unchanged. |
| Current payload backfill | Already-current point is skipped. |
| Mixed collection | Only legacy points are patched; pagination is exhausted. |
| Repeated backfill | Second pass performs no writes. |
| Empty collection | No payload update and normal cold reindex behavior remains. |
| Admin reindex via GraphQL | Real Qdrant receives indexed lesson points and mutation returns persisted chunk count. |
| Member reindex | Existing admin guard rejects and Qdrant count does not change. |
| Authenticated ask | GraphQL retrieves real Qdrant chunks, deterministic AI double receives non-empty context, response cites seeded lesson. |
| Cross-course question | Course filter prevents a chunk belonging only to another course from appearing in context/citations. |
| Anonymous ask | Existing member guard rejects before embedding or Qdrant retrieval. |
| Build/lint | `npm run lint:check`, focused unit specs, RAG container lane, Academy E2E RAG spec and `npm run build:academy` all pass with zero unexplained errors. |

### ASSUMPTIONS AND EXCLUSIONS

| Item | Decision |
|---|---|
| GraphQL/FE | No schema or FE change. Existing `askTutor` and `reindexRag` consumers remain compatible. |
| AgentOS module knowledge | Excluded. AgentOS can reuse the new LangChain adapter only in a later approved capability; this revision does not alter module packages, MCP or controlplane. |
| Prompt/model invocation | `AiService.ask` remains the model gateway. Revision does not replace it with a LangChain chat model or chain. |
| Collection lifecycle | Direct Qdrant stays authoritative for create/count/identity/geometry/upsert/backfill. |
| Data migration | Qdrant payload-only backfill; no PostgreSQL migration, no collection drop, no vector re-embedding. |
| Credentials | Instance OpenRouter key remains server-side and is never returned through GraphQL, logged or written into workflow. |

### OUTPUTS

| Concept | Result |
|---|---|
| Academy LangChain RAG brief | `nivo-academy-langchain-rag-r1`: LangChain retrieval over the existing per-instance Qdrant collection. |
| Compatibility strategy | Payload-only metadata backfill preserves existing vectors and top-level safety markers. |
| Boundary | LangChain owns application retrieval; direct Qdrant owns storage lifecycle and safety checks. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\feature\nivo\academy-langchain-rag.md` | added — live schema evidence, sibling comparison, exact file boundary, migration strategy and test matrix. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Approve exact implementation boundary | Recommended: approve `nivo-academy-langchain-rag-r1` as written — Academy-only, payload backfill, no GraphQL change. Alternative: revise before Apply. |

### WARNINGS

| Warning | Impact |
|---|---|
| Local dev Qdrant server reports `1.10.1`, while the installed JS client resolves to `1.19.0`. | Academy starts but logs an incompatibility warning. This revision's isolated tests use a compatible Qdrant image; changing the shared dev stack image is excluded and remains a separate ops repair. |
| Current RAG E2E/container specs claim pgvector and do not start Qdrant. | They can touch an ambient local Qdrant or fail nondeterministically; r1 explicitly repairs both tests to own their Qdrant container. |
| `rag.spec.ts` uses type-washing double casts already present in the repository. | Apply must remove casts in touched tests where practical; it may not introduce lint suppression or new `as unknown as`. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Replace every direct Qdrant call with LangChain | Keep low-level lifecycle/safety calls direct; move retrieval only | LangChain's default payload cannot preserve Nivo's top-level geometry, lane and instance identity markers. |
| Drop and rebuild the collection for payload compatibility | Backfill nested metadata in place | Vectors are valid derived data; re-embedding costs customer credit and creates avoidable downtime. |
| Use StarCi's local-first cloud fallback | Fixed Cloud lane for documents and Local lane for queries, with identical checked geometry | Nivo lanes encode ownership/billing policy; availability must not silently change who pays or where customer content goes. |
| Add a new GraphQL query | Keep `askTutor` | Existing contract already names and returns the required capability. |
| Migrate AgentOS in the same revision | Academy-only boundary | AgentOS is multi-tenant and has different collection/filter/key ownership; combining them would hide two architectures in one approval. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval of `nivo-academy-langchain-rag-r1` | Invoke `$starci-be-feature-approve` with this exact revision. |
| Product implementation | `starci-be-feature-approve` after approval, limited to the proposed file tree. |
| Full proof | Focused twins, real-Qdrant container/E2E, lint and Academy build recorded in the same workflow. |
| Shared dev Qdrant version alignment | Separate bounded ops/audit revision; not claimed by r1. |

## review — nivo-academy-langchain-rag-r1

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
| App | `expert-academy-api` |
| Database | Expert Academy PostgreSQL + per-instance Qdrant derived index; no PostgreSQL migration. |
| Repo / branch | D:\Repositories\nivo-backend @ `main` (`74604ff863f5d216b386af27e4b4861486d27217`) |
| Purpose | Challenge and freeze the exact LangChain retrieval boundary before production write. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\nivo\academy-langchain-rag.md |
| Language | vi |
| Phase | review |
| Touching | Exact 18 product paths in `PROPOSED FILE TREE` plus this workflow; no FE, AgentOS, PostgreSQL schema or shared dev-stack image. |
| Context receipt | v1 |
| Workspace context | `.workspace/nivo/be/config.json` — read; routes to `D:\Repositories\nivo-backend`, `main`, approved origin. |
| Internal context | Backend canon `cqrs`, `module-layering`, `data-access`, `exceptions`, `transport`, `testing`, `e2e-flow`, `naming`, `type-safety`; skill shape; Feature Plan/Approve — read complete. |
| External context | Live unfiltered Academy schema at `:3069`; Nivo RAG source/tests/manifests; StarCi LangChain embedding/retrieval siblings; Git HEAD and clean status. |
| Context conflicts | StarCi allows balancer fallback, while Nivo lane ownership forbids it; higher-authority executable Nivo ownership policy wins. |
| Context missing | None |

Approved revision: `nivo-academy-langchain-rag-r1` — owner explicitly approved on 2026-08-17 with “Duyệt nivo-academy-langchain-rag-r1.”

### REVIEW FINDINGS

| Surface | Verdict |
|---|---|
| Schema/transport | Existing `askTutor` and `reindexRag` are sufficient; no door added. |
| Database | PostgreSQL remains citation source; Qdrant payload-only backfill avoids schema migration and re-embedding. |
| Exception identity | Existing embedding/geometry exceptions propagate; no generic `Error` is introduced in product code. |
| Module layering | `LangchainModule` is registered at app root; `RagModule` injects exported provider without sideways import. |
| Tests | Unit twins cover lane and payload branches; real Qdrant container/E2E own the external store and stub only external model/embedding outcomes. |
| Live proof | Academy API GraphQL remains production door; live test requires configured runtime and records no credentials. |

### OUTPUTS

| Concept | Result |
|---|---|
| Approved revision | `nivo-academy-langchain-rag-r1` with Academy-only LangChain retrieval and in-place payload backfill. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\feature\nivo\academy-langchain-rag.md` | modified — approval, challenge findings and frozen production boundary. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Exact revision and boundary approved. |

### WARNINGS

| Warning | Impact |
|---|---|
| Shared dev Qdrant remains older than JS client. | Live local proof may retain compatibility warning; isolated test Qdrant must match the client. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| None | None | None |

### OWED

| Owed | Cleared by |
|---|---|
| Implementation and proof | Apply exact approved revision. |

## apply — nivo-academy-langchain-rag-r1

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
| App | `expert-academy-api` |
| Database | Expert Academy PostgreSQL + per-instance Qdrant derived index. |
| Repo / branch | D:\Repositories\nivo-backend @ `main` (`74604ff863f5d216b386af27e4b4861486d27217`) |
| Purpose | Implement and prove the approved LangChain Academy RAG boundary. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\nivo\academy-langchain-rag.md |
| Language | vi |
| Phase | apply |
| Touching | Exact 18 product paths approved in r1 plus this append-only workflow. |
| Context receipt | v1 |
| Workspace context | `.workspace/nivo/be/config.json` — read and matched live Git target. |
| Internal context | Same approved backend canon and Feature Approve procedure — read complete. |
| External context | Approved plan, live schema, Nivo source/tests/package manifest and StarCi sibling implementation. |
| Context conflicts | Resolved in approved review: Nivo fixed lane ownership overrides StarCi fallback pattern. |
| Context missing | None |

Applied revision: `nivo-academy-langchain-rag-r1`.

Baseline commit: `74604ff863f5d216b386af27e4b4861486d27217`.

Tracked diff: `74604ff863f5d216b386af27e4b4861486d27217..worktree`.

Implementation commit: `257ca75f` (`feat: use LangChain for Academy RAG retrieval`).

### TEST PROOF

| Gate | Result | Evidence |
|---|---|---|
| Approved boundary | PASS | Exactly 18 changed product files, matching `PROPOSED FILE TREE`; commit `257ca75f`. |
| Focused lint | PASS | ESLint over all 18 approved TypeScript paths: 0 errors, 0 warnings. |
| Focused unit | PASS | 5 suites, 44 tests passed: embedding lanes, retrieval/filter, answer/citation, payload mapper and idempotent backfill. |
| Real Qdrant container | PASS | `rag.container-spec.ts`: 4/4 passed against owned `qdrant/qdrant:v1.19.0`, PostgreSQL, Redis and MinIO containers. |
| Academy RAG E2E | PASS | `rag.e2e-spec.ts`: 4/4 passed; 2 courses/3 chunks, admin reindex, member refusal with unchanged count, LangChain retrieval, course isolation, citation and anonymous refusal. |
| Academy build | PASS | `npm run build:academy`. |
| Repository lint | PASS WITH BASELINE WARNINGS | `npm run lint:check` exited 0. Existing warnings outside the 18-file boundary remain; approved boundary emits none. |
| Full unit regression run | OUTSIDE-BOUNDARY FAILURES | 2047/2049 tests passed. Stable pre-existing failures reproduced alone in `src/modules/integrations/cache/stores.spec.ts` and `src/modules/bussiness/expert-deploy/expert-deploy-k8s-watcher.service.spec.ts`; neither file nor owning source is in r1. |
| Full Academy E2E regression run | OUTSIDE-BOUNDARY FAILURES | RAG E2E passed inside the full run. Existing payment/affiliate scenarios produced 7 failures in two suites; no RAG assertion failed. |

### LIVE FLOW PROOF

| Field | Evidence |
|---|---|
| Flow | GraphQL `reindexRag` → direct Qdrant index write → LangChain `QdrantVectorStore` retrieval → `askTutor` answer/citation. |
| Persona | Admin, authenticated member and anonymous caller; deterministic JWKS verifier double, no credential persisted or printed. |
| Steps | Start real PostgreSQL/Qdrant/Redis/MinIO containers; boot `expert-academy-api`; reindex two courses; reject member reindex without changing Qdrant count; ask within one course; reject anonymous ask. |
| UI | N/A — approved revision changes no FE or GraphQL schema. |
| Network | Real HTTP GraphQL requests against a listening Nest app; real Qdrant REST calls through LangChain; external AI/embedding providers are deterministic doubles. |
| Console | No unhandled RAG exception. App indexed 3 chunks and returned non-empty grounded context with citations. |
| Terminal | Focused unit 44/44, container 4/4, RAG E2E 4/4, build PASS. |
| Verdict | PASS for the approved API/store boundary. A credentialed OpenRouter/self-hosted-embedding smoke remains owed because no live provider credential was supplied for this run. |

### OUTPUTS

| Concept | Result |
|---|---|
| Academy retrieval | `askTutor` now retrieves through LangChain `QdrantVectorStore` while preserving the existing GraphQL response. |
| Lane ownership | Documents use the Cloud lane with the Academy instance key; questions use the Local lane; neither lane falls back to the other. |
| Compatibility | New points keep all top-level Nivo safety markers and add nested LangChain metadata; legacy points are backfilled in place without vectors or re-embedding. |
| Commit | Nivo backend `257ca75f`. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\nivo-backend` | 18 approved files committed: dependencies, Academy root wiring, LangChain adapter, retrieval service, payload mapper/backfill and unit/container/E2E proof. |
| `D:\Repositories\starci-academy-backend\.workflows\feature\nivo\academy-langchain-rag.md` | appended approval implementation evidence, live flow proof and residual gates. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None for r1 implementation | Approved boundary is implemented and committed. |

### WARNINGS

| Warning | Impact |
|---|---|
| Shared dev Qdrant is still `1.10.1`, while the JS client is `1.18.0`. | Isolated proof uses Qdrant `1.19.0`; shared local runtime can continue to log compatibility warnings until a separate ops revision upgrades it. |
| Full repository unit and Academy E2E runs are not globally green. | Failures are stable and outside r1; this workflow does not silently classify the repository as globally clean. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Expand r1 to repair cache, K8s watcher, payment or affiliate tests | Record exact failures and route separately | Those capabilities were not in the approved 18-file boundary. |
| Use live provider secrets in deterministic E2E | Provider doubles plus an owed credentialed smoke | Tests must be reproducible and must not store credentials. |

### OWED

| Owed | Cleared by |
|---|---|
| Credentialed Academy RAG smoke against the configured Cloud document lane and Local query lane | Supply runtime credentials/config after code review; run `reindexRag` and `askTutor` without recording secret values. |
| Shared dev Qdrant version alignment | Separate bounded ops/audit revision. |
| Existing full-suite failures | Separate backend audit plan for cache take atomicity, K8s watcher terminal polling and payment/affiliate E2E. |

## apply r1.1 — credentialed live smoke readiness

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
| App | `expert-academy-api` |
| Database | Expert Academy PostgreSQL + shared dev Qdrant. |
| Repo / branch | D:\Repositories\nivo-backend @ `main` (`257ca75f`) |
| Purpose | Attempt the owed credentialed Cloud-document/Local-query live smoke without weakening lane ownership. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\nivo\academy-langchain-rag.md |
| Language | vi |
| Phase | apply |
| Touching | Runtime inspection, temporary managed secret materialization and this append-only workflow; no product source. |
| Context receipt | v1 |
| Workspace context | `.workspace/nivo/be/config.json` refreshed to live backend HEAD with `starci-setup-workspace`. |
| Internal context | Backend Feature Approve and workspace setup gates — read complete. |
| External context | Listening FE/core/Academy processes, Academy readiness endpoint, live GraphQL introspection, Docker services and environment-key presence only. |
| Context conflicts | Shared OpenRouter pool exists, but approved ownership requires an Academy instance key; the shared pool was not substituted. |
| Context missing | Academy instance identity/key and Local embedding endpoint credentials. |

Continuation of approved revision: `nivo-academy-langchain-rag-r1`.

### LIVE FLOW PROOF

| Field | Evidence |
|---|---|
| Flow | Inspect running Academy API → verify GraphQL doors → verify readiness → resolve provider configuration → run credentialed `reindexRag` and `askTutor`. |
| Persona | Runtime operator preparing an Academy tenant; no browser credential, token or cookie was inspected. |
| Steps | Confirmed FE `:3066`, core BE `:3067`, Academy API `:3069` and Qdrant `:6400`; introspected `askTutor` and `reindexRag`; called readiness; materialized managed dev secrets only long enough to check key presence; cleaned them immediately. |
| UI | Login page is reachable at `http://localhost:3066/en/authentication`; no authenticated Academy session was available, so no UI action was claimed. |
| Network | Academy GraphQL schema is reachable. `/health/ready` returns `503` because `rag_collection_identity` has no `EXPERT_INSTANCE_ID`. |
| Console | No browser storage/cookies inspected and no secret value printed. |
| Terminal | `npm run dev:env` materialized 5 managed files; `npm run dev:env:clean` removed all 5 and the managed `.env.local` block. Presence check found the shared OpenRouter pool only; the approved per-instance and Local-lane settings are absent. |
| Verdict | OWED — runtime is up and the feature doors exist, but a valid credentialed smoke cannot start until the exact Academy and Local embedding configuration is installed. |

### OUTPUTS

| Concept | Result |
|---|---|
| Runtime availability | FE, core BE, Academy API and Qdrant are listening. |
| Feature availability | Live Academy schema exposes `reindexRag` and `askTutor`. |
| Secret hygiene | No secret value was logged or recorded; temporary plaintext files were removed. |
| Ownership enforcement | Shared OpenRouter pool was deliberately rejected as a replacement for `INSTANCE_OPENROUTER_API_KEY`. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workspace\nivo\be\config.json` | refreshed ignored local routing metadata to backend commit `257ca75f`. |
| `D:\Repositories\starci-academy-backend\.workflows\feature\nivo\academy-langchain-rag.md` | appended the credentialed live-smoke attempt and exact remaining configuration. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None for code | r1 product implementation is already approved and committed. Installing new runtime secrets remains an operator action. |

### WARNINGS

| Warning | Impact |
|---|---|
| `EXPERT_INSTANCE_ID` is absent. | Readiness cannot derive the tenant-specific Qdrant collection. |
| `INSTANCE_OPENROUTER_API_KEY` is absent. | Cloud document embedding cannot run under the Academy tenant's own provider identity. |
| `SELF_HOSTED_EMBEDDING_URL`, token, model and dimension are absent. | Local query embedding cannot run; fixed lane ownership forbids Cloud fallback. |
| Shared dev Qdrant remains `qdrant/qdrant:v1.10.1`. | A separate approved ops revision is still required for version alignment. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Use `OPENROUTER_API_KEYS_FILE` as the Academy instance key | Wait for `INSTANCE_OPENROUTER_API_KEY` | The approved architecture assigns document cost and ownership to the Academy instance, not the platform pool. |
| Claim live PASS from deterministic E2E | Keep E2E PASS and live smoke OWED separately | Deterministic provider doubles do not prove real provider credentials or runtime routing. |

### OWED

| Owed | Cleared by |
|---|---|
| Academy instance identity | Set a dev `EXPERT_INSTANCE_ID` before starting `expert-academy-api`. |
| Cloud document lane | Install `INSTANCE_OPENROUTER_API_KEY` through managed runtime secret delivery. |
| Local query lane | Install `SELF_HOSTED_EMBEDDING_URL`, `SELF_HOSTED_EMBEDDING_TOKEN`, `SELF_HOSTED_EMBEDDING_MODEL` and `SELF_HOSTED_EMBEDDING_DIMENSION`; expected Qwen3 dimension is `4096` unless the deployed model differs. |
| Credentialed proof | Restart Academy API, obtain an authenticated admin/member session, run `reindexRag` then `askTutor`, and record Network, Console and Terminal evidence without secret values. |
