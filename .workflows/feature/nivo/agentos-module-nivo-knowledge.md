<!-- starci-workflow: v2 -->

## plan — nivo-agentos-module-nivo-knowledge-r1

### CONTEXT

| Field | Resolution |
|---|---|
| Workdir | `D:\Repositories\nivo-backend` |
| Source | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\nivo\agentos-module-nivo-knowledge.md |
| Project | Explicit targets |
| Frontend | `D:\Repositories\nivo-fe` |
| Backend | `D:\Repositories\nivo-backend` |
| Mounted data repository | `D:\Repositories\nivo-backend\.gitmounts\data` → `https://github.com/starci-lab/nivo-data.git`, branch `main` |
| App | `nivo` core + `agentos-controlplane` |
| Repo / branch | `D:\Repositories\nivo-backend` / `main`; mounted data / `main` |
| Purpose | Plan immutable Nivo knowledge packages for AgentOS solution modules. |
| Backend branch | `main` |
| Database | Primary PostgreSQL keeps the pinned desired-state reference; per-workspace PostgreSQL keeps the applied state; Qdrant keeps indexed chunks; `nivo-data` keeps non-secret source documents |
| Existing modules | `multichannel-chatbot@1.0.0`, `sales-copilot@1.0.0` |
| Candidate modules | `multichannel-chatbot@1.1.0`, `sales-copilot@1.1.0` |
| Phase | plan |
| Language | vi |
| Touching | Workflow only; no product source during Plan. |
| Revision | `nivo-agentos-module-nivo-knowledge-r1` |
| Status | Proposed for `$starci-be-feature-approve`; no product source or mounted data written |

### OBJECTIVE

Define **Tri thức Nivo** as a versioned, non-secret knowledge package in `.gitmounts/data` for every AgentOS solution module. Keep Nivo's shared operating corpus in `seed-knowledge/`; move each module's private playbook out of TypeScript and into its own immutable package; pin the Git SHA and content digest during the existing installation Saga; let the authenticated controlplane pull the exact package from Nivo API and index it into that installation's private Qdrant scope.

### LIVE SCHEMA AND SOURCE EVIDENCE

| Evidence | Observed result | Consequence |
|---|---|---|
| Full GraphQL introspection at `http://localhost:3067/graphql` | `installAgentosSolutionModule`, `myAgentosSolutionModules`, `myAgentosModuleInstallation` and `myAgentosModuleInstallations` already exist. | Do not add another customer API. The existing installation mutation remains the entry point. |
| `catalog/packages/*/private-knowledge.ts` | Three private documents for each first-party module are hard-coded into both runtime images through the manifest. | Move document bytes to `nivo-data`; code keeps only executable module configuration and a package locator. |
| `AgentosModuleDesiredStateCompiler` | Desired state already separates common, shared customer and private module knowledge, but carries only versions and private document keys. | Extend that reference with source SHA, package path and content digest; never put document bodies in Saga/Kafka/runtime-job payloads. |
| `ModuleKnowledgeReconcilerService` | Controlplane currently indexes `manifest.privateKnowledge` directly from its local image. | Replace local document resolution with a signed package pull from Nivo core and verify the digest before the first Qdrant write. |
| `PodRegistrationController` + `BackendClientService` | Pod-authenticated REST and RFC 7523 assertion flow already carries runtime jobs and results. | Add one pod-owned GET route in the same boundary; do not expose package download through viewer GraphQL or a public URL. |
| `DataGitSnapshotService` | GitHub SHA resolution and subtree download already exist, but are private and hard-wired to `seed-knowledge/` at boot. | Extract the generic Git reader and reuse it for both global and module package snapshots instead of creating a second Git transport. |
| `.gitmounts/data/seed-knowledge` | This is the global Nivo operating corpus and includes `SOUL.md` hard rules. | Keep it as the common layer. Module packages add specialist knowledge; they do not copy or override `SOUL.md`. |
| `docs/nivo-data-layout.md` | Top-level folders are domain names; operational data belongs here; secrets never do. | Add top-level `solution-modules/`; all channel tokens, model keys and customer data remain outside Git. |
| Current mounted data worktree | `seed-knowledge/` has modified/deleted/untracked user work and `subscription-plans/` is untracked. | Apply may stage only the new `solution-modules/` tree and documentation it owns; it must not reset, absorb or rewrite these unrelated changes. |
| Existing live proof | Module Saga/Kafka/Socket/UI passed, but controlplane response transport truncates successful bodies at 400 characters. | A package response requires a bounded full-body reader and a regression test; otherwise valid JSON will be cut before parsing. |

### KNOWLEDGE MODEL

| Layer | Source | Ownership | Runtime scope | Update rule |
|---|---|---|---|---|
| Common Nivo knowledge | `seed-knowledge/` | Nivo | `knowledgeLayer=common`, pinned by common version/SHA | Global knowledge release; hard rules in `SOUL.md` keep precedence. |
| Module Nivo knowledge | `solution-modules/<module>/<version>/` | Nivo | `knowledgeLayer=private`, `installationId`, `moduleKey`, `knowledgeVersion` | Immutable package; a new corpus requires a new module/package version. |
| Customer shared knowledge | Existing `KnowledgeSourceEntity` and workspace ingestion | Workspace owner | `knowledgeLayer=shared`, allowed source ids | Additive workspace data; never committed to `nivo-data`. |
| Credentials and provider configuration | Existing encrypted `.stacks/`/credential stores | Nivo or workspace owner | Secret references only | Never enters Git, desired state, Kafka, Socket.IO or package responses. |

Retrieval precedence stays: hard safety and `SOUL.md` rules → customer facts from allowed shared sources → module playbook guidance. Module knowledge may guide behavior but may not invent customer prices, policies or commitments.

### MOUNTED DATA CONTRACT

```text
solution-modules/
  multichannel-chatbot/
    1.1.0/
      manifest.md
      knowledge/
        intent-and-grounding.md
        escalation-and-handoff.md
        channel-style.md
  sales-copilot/
    1.1.0/
      manifest.md
      knowledge/
        qualification-and-discovery.md
        objection-and-followup.md
        crm-and-approval.md
```

`manifest.md` is mount markdown and declares `moduleKey`, `moduleVersion`, `knowledgeVersion`, `commonKnowledgeVersion`, then an ordered `documents` array of `{ key, file }`. The directory path and manifest values must agree. Each knowledge file starts with exactly one H1 title followed by ordinary Markdown body. Package digest is SHA-256 over the canonical manifest plus every referenced file's normalized relative path and raw bytes in manifest order.

The parser rejects missing files, duplicate keys, path traversal, absolute paths, symlinks/submodules, undeclared Markdown files, empty bodies, files outside `knowledge/`, module/path mismatch and content larger than the locked per-file/package limits. Unknown manifest fields are rejected for package integrity rather than silently ignored.

### RUNTIME FLOW

1. Existing `installAgentosSolutionModule` accepts the module key and enters the existing Saga.
2. `pin-manifest` resolves the latest code manifest (`1.1.0`), resolves `nivo-data` branch tip to one Git SHA, downloads exactly that module subtree at the SHA, parses it and records the package digest/reference in the step result.
3. `compose-desired-state` uses the pinned step result; it never re-resolves branch tip. Desired state carries `repositorySha`, `packagePath`, `packageDigest`, `knowledgeVersion` and `documentKeys`, but no document body.
4. Runtime job reaches only the owning pod through the existing lease/fencing boundary.
5. Before reconciliation, controlplane calls `GET /pods/self/module-knowledge/:installationId` with its signed assertion.
6. Core verifies pod ownership, installation identity and pinned desired state, materializes the exact subtree by Git SHA, re-verifies its digest and returns a bounded package DTO.
7. Controlplane validates response shape, installation/module/version/document keys and digest before any Qdrant side effect.
8. Reconciler chunks and writes documents under the existing private-layer filters, then applies agent/MCP/OpenClaw configuration and reports the same desired digest.
9. Retry of the same desired digest is a no-op after `ready`; retry before completion reuses the same pinned SHA and package digest.

### COMPATIBILITY AND ROLLOUT

| Case | Required behavior |
|---|---|
| Existing `1.0.0` ready installation | Remains pinned and untouched; no silent re-index or agent behavior change. |
| Existing `1.0.0` retry/recovery | Legacy resolver remains readable until a separate explicit upgrade/recovery feature migrates it. |
| New installation after rollout | Catalog selects `1.1.0`, whose private knowledge comes only from `nivo-data`. |
| Git branch advances during one Saga | Installation continues with the SHA captured by `pin-manifest`. |
| GitHub/data repository unavailable | Typed retryable failure before runtime job creation; no partial installation is reported ready. |
| Package changes without version bump | Digest changes and validation fails the release gate; Apply does not publish mutable bytes under an existing version. |
| Package unavailable after job lease | Controlplane reports a typed failure; last-good applied state is preserved. |

### EXACT CHANGE TREE

#### Mounted data repository — create

| File | Responsibility |
|---|---|
| `.gitmounts/data/solution-modules/multichannel-chatbot/1.1.0/manifest.md` | Immutable Chatbot package inventory and common/private knowledge versions. |
| `.gitmounts/data/solution-modules/multichannel-chatbot/1.1.0/knowledge/intent-and-grounding.md` | Intent detection, grounding and no-invention rules. |
| `.gitmounts/data/solution-modules/multichannel-chatbot/1.1.0/knowledge/escalation-and-handoff.md` | Human escalation and handoff playbook. |
| `.gitmounts/data/solution-modules/multichannel-chatbot/1.1.0/knowledge/channel-style.md` | Channel-specific presentation while preserving one factual answer. |
| `.gitmounts/data/solution-modules/sales-copilot/1.1.0/manifest.md` | Immutable Sales package inventory and common/private knowledge versions. |
| `.gitmounts/data/solution-modules/sales-copilot/1.1.0/knowledge/qualification-and-discovery.md` | Qualification and discovery playbook. |
| `.gitmounts/data/solution-modules/sales-copilot/1.1.0/knowledge/objection-and-followup.md` | Evidence-based objection handling and follow-up. |
| `.gitmounts/data/solution-modules/sales-copilot/1.1.0/knowledge/crm-and-approval.md` | CRM note structure and human approval boundary. |

#### Backend — create

| File | Responsibility |
|---|---|
| `src/modules/shared/data-git/data-git-repository.client.ts` | Generic GitHub ref/tree reader extracted from the existing snapshot mechanism. |
| `src/modules/shared/data-git/data-git-repository.client.spec.ts` | Ref pinning, recursive tree download, binary/raw-byte preservation and typed HTTP failures. |
| `src/modules/shared/data-git/types.ts` | Narrow repository ref and downloaded-file contracts. |
| `src/modules/bussiness/agentos-solution-modules/knowledge/module-knowledge-package.types.ts` | Manifest, locator, pinned reference, document and response contracts. |
| `src/modules/bussiness/agentos-solution-modules/knowledge/module-knowledge-package.parser.ts` | Strict mount-Markdown parser, path checks and canonical digest. |
| `src/modules/bussiness/agentos-solution-modules/knowledge/module-knowledge-package.parser.spec.ts` | Valid twins plus every malformed/path/size/digest branch. |
| `src/modules/bussiness/agentos-solution-modules/knowledge/module-knowledge-package.service.ts` | Resolve one package at one immutable Git SHA and re-materialize the same package for delivery. |
| `src/modules/bussiness/agentos-solution-modules/knowledge/module-knowledge-package.service.spec.ts` | SHA pinning, changed branch tip, retry, digest mismatch and unavailable repository cases. |
| `src/modules/bussiness/agentos-solution-modules/knowledge/module-knowledge-delivery.service.ts` | Verify pod/installation ownership and return only the package pinned in desired state. |
| `src/modules/bussiness/agentos-solution-modules/knowledge/module-knowledge-delivery.service.spec.ts` | Owned, foreign, missing and tampered installation cases. |
| `src/modules/platform/exceptions/errors/agentos-solution-modules/module-knowledge-package-invalid.ts` | Typed invalid-package exception with object constructor payload. |
| `src/modules/platform/exceptions/errors/agentos-solution-modules/module-knowledge-package-unavailable.ts` | Typed retryable source-unavailable exception. |
| `src/modules/platform/exceptions/errors/agentos-solution-modules/module-knowledge-package-digest-mismatch.ts` | Typed immutable-content mismatch exception. |
| `apps/agentos-controlplane/src/module-runtime/module-knowledge-package.reader.ts` | Bounded response validation and independent digest verification before Qdrant. |
| `apps/agentos-controlplane/src/module-runtime/module-knowledge-package.reader.spec.ts` | Valid package, wrong installation/module/version/key/digest and oversized response cases. |
| `apps/agentos-controlplane/src/backend/transport.spec.ts` | Regression for complete bounded success bodies larger than 400 characters and redacted bounded error text. |

#### Backend — modify

| File | Responsibility |
|---|---|
| `docs/nivo-data-layout.md` | Document `solution-modules/`, immutability, manifest fields and secret boundary. |
| `.gitmounts/README.md` | List module knowledge as supported operational data. |
| `src/modules/platform/env/config.ts` | Add explicit solution-module subtree and package size limits beside existing data-Git config. |
| `src/modules/init/data-git/data-git-snapshot.service.ts` | Delegate generic Git operations to the shared client while preserving current `seed-knowledge` behavior. |
| `src/modules/init/init.module.ts` | Register the shared Git client for the existing snapshot service. |
| `src/modules/bussiness/agentos-solution-modules/types/manifest.ts` | Replace body-bearing `privateKnowledge` with a typed package locator and support legacy `1.0.0` plus mounted `1.1.0`. |
| `src/modules/bussiness/agentos-solution-modules/types/desired-state.ts` | Carry the pinned private package reference and no document bodies. |
| `src/modules/bussiness/agentos-solution-modules/types/index.ts` | Export package reference contracts. |
| `src/modules/bussiness/agentos-solution-modules/catalog/packages/multichannel-chatbot/manifest.ts` | Retain executable Chatbot config and point `1.1.0` at its mounted package. |
| `src/modules/bussiness/agentos-solution-modules/catalog/packages/sales-copilot/manifest.ts` | Retain executable Sales config and point `1.1.0` at its mounted package. |
| `src/modules/bussiness/agentos-solution-modules/catalog/agentos-solution-module-catalog.service.ts` | Resolve latest `1.1.0` for new installs while retaining explicit legacy resolution. |
| `src/modules/bussiness/agentos-solution-modules/catalog/agentos-solution-module-catalog.service.spec.ts` | Prove latest selection, legacy lookup and stable code-manifest digest. |
| `src/modules/bussiness/agentos-solution-modules/agentos-module-desired-state.compiler.ts` | Compile only from the pinned package result produced by `pin-manifest`. |
| `src/modules/bussiness/agentos-solution-modules/agentos-module-desired-state.compiler.spec.ts` | Prove package refs affect desired digest and bodies never appear in state. |
| `src/modules/bussiness/agentos-solution-modules/steps/pin-manifest.step.ts` | Pin code manifest + repository SHA + package digest once, with retryable failure semantics. |
| `src/modules/bussiness/agentos-solution-modules/steps/compose-desired-state.step.ts` | Read the pin step result rather than resolving mutable branch state again. |
| `src/modules/bussiness/agentos-solution-modules/agentos-solution-modules.module.ts` | Register/export package resolve and delivery providers plus shared Git client. |
| `src/modules/platform/exceptions/errors/agentos-solution-modules/index.ts` | Export the three typed exceptions. |
| `src/features/core/api/core/http/pod-registration/pod-registration.controller.ts` | Add signed `GET /pods/self/module-knowledge/:installationId`; pod id comes only from the guard. |
| `src/modules/bussiness/pod-registration/pod-registration.types.ts` | Add public-safe module package response type. |
| `apps/agentos-controlplane/src/backend/types/backend-client.ts` | Add bounded module package response contract. |
| `apps/agentos-controlplane/src/backend/backend-client.service.ts` | Pull the package through the existing signed backend call. |
| `apps/agentos-controlplane/src/backend/chores.service.ts` | Fetch and validate the pinned package before dispatching module reconcile. |
| `apps/agentos-controlplane/src/backend/transport.ts` | Replace 400-character success truncation with an explicit maximum body limit; keep log/error excerpts bounded. |
| `apps/agentos-controlplane/src/module-runtime/module-runtime-payload.reader.ts` | Validate the new pinned reference and reject document bodies/unknown fields. |
| `apps/agentos-controlplane/src/module-runtime/module-runtime-reconciler.service.ts` | Accept an already-verified package and preserve last-good state on pull/index failure. |
| `apps/agentos-controlplane/src/module-runtime/module-runtime-reconciler.service.spec.ts` | Prove verification precedes Qdrant/OpenClaw side effects and retry remains idempotent. |
| `apps/agentos-controlplane/src/module-runtime/module-knowledge-reconciler.service.ts` | Chunk and index pulled documents under existing installation-private filters. |
| `apps/agentos-controlplane/src/module-runtime/module-runtime.module.ts` | Register/export the package reader. |
| `src/tests/e2e/nivo/agentos-solution-module-install.e2e-spec.ts` | Extend the real GraphQL/Saga/signed-pod flow through package pull and terminal result. |
| `src/tests/e2e/nivo/agentos-solution-module-concurrency.e2e-spec.ts` | Prove concurrent same-key requests pin one SHA/package and one runtime job. |
| `src/tests/e2e/controlplane/knowledge-ingest.e2e-spec.ts` | Prove common/shared/private isolation with mounted module documents. |

#### Backend — retain for compatibility, then remove only after explicit upgrade support

| File | Responsibility |
|---|---|
| `src/modules/bussiness/agentos-solution-modules/catalog/packages/multichannel-chatbot/private-knowledge.ts` | Legacy `1.0.0` recovery twin only; no new installation may resolve it. |
| `src/modules/bussiness/agentos-solution-modules/catalog/packages/sales-copilot/private-knowledge.ts` | Legacy `1.0.0` recovery twin only; no new installation may resolve it. |

No database migration, GraphQL schema change, frontend change, Kafka topic change, Socket.IO event change or Helm/chart change belongs to r1.

### EXHAUSTIVE TEST MATRIX

| Area | Cases |
|---|---|
| Package parser | Valid Chatbot/Sales twins; order-independent object fields; ordered documents; CRLF/BOM; missing/duplicate key; path traversal; absolute path; undeclared/missing/empty file; extra Markdown; symlink/submodule; module/version mismatch; per-file and total-size ceiling. |
| Digest | Same bytes/path/order → same digest; changed byte/path/order/manifest → changed digest; parser and controlplane reader produce the same digest; deliberately wrong digest fails before Qdrant. |
| Git pinning | Branch tip resolved once; all files fetched by pinned SHA; branch moves after pin with no effect; HTTP 404/403/429/5xx become typed failures with correct retryability; no token is logged. |
| Saga | Pin result survives retry; compose cannot run without pin result; five concurrent identical requests create one installation/Saga/runtime job/package ref; failure before queue does not report ready. |
| Ownership | Owning pod can pull only its installation; foreign pod, foreign installation id, missing desired state and mismatched module are rejected without revealing package contents. |
| Transport | Successful JSON >400 characters remains complete up to the limit; over-limit response is rejected; error/log excerpts remain bounded; secrets are absent from response and logs. |
| Runtime reader | Reject unknown keys, bodies in desired state, wrong installation/module/version/SHA/path/digest, duplicate docs and oversized package. |
| Qdrant | Documents carry `source=nivo`, private layer, installation id, module key and knowledge version; Chatbot cannot retrieve Sales chunks; retry upserts deterministically; failed package verification performs zero writes. |
| Compatibility | New install resolves `1.1.0`; explicit `1.0.0` resolution remains available for recovery; existing ready row is not mutated by boot/deploy. |
| Full flow | GraphQL install → Saga pin → runtime job → signed package pull → controlplane verify/index/config → signed result → Kafka relay → Socket.IO/UI ready. |

### PROOF COMMANDS

| Gate | Command / evidence |
|---|---|
| Mounted data integrity | Dedicated parser twin over both real package directories plus `git -C .gitmounts/data diff --check`. |
| Focused specs | Jest for shared Git client, package parser/service/delivery, catalog/compiler/Saga steps, transport, controlplane reader/reconciler and Qdrant filtering. |
| E2E | Existing `agentos-solution-module-install`, concurrency and controlplane knowledge-ingest suites with the new signed pull step. |
| Lint | `npx eslint "{src,apps}/**/*.ts" --max-warnings 0`. |
| Build | `npm run build` and `npm run build:controlplane`. |
| Regression | Repository test command frozen by Apply after reading `package.json`; unexplained failures remain blockers. |
| Live proof | Test owner installs both modules from Nivo UI; record UI, GraphQL, signed package GET, Kafka, Socket.IO, core/controlplane logs and Qdrant metadata. |
| Secret scan | Search new data/package/API payloads for tokens, passwords, private keys, cookies and provider credentials; any hit blocks publish. |

### OUTPUTS

| Concept | Result |
|---|---|
| Tri thức Nivo | Defined as common Nivo corpus plus immutable per-module specialist packages in `nivo-data`. |
| First packages | Exact mounted-data trees planned for Chatbot đa kênh and Sales Copilot. |
| Provision path | Reuses the current GraphQL → Saga → signed controlplane job path and adds one signed package pull. |
| Immutability | Every installation pins Git SHA, package path, version, document keys and content digest. |
| Compatibility | Existing `1.0.0` installations stay stable; new installs select mounted `1.1.0`. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\feature\nivo\agentos-module-nivo-knowledge.md` | `added` — exact backend/data boundary, contracts, compatibility and proof matrix for revision r1. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Approve this exact backend + mounted-data boundary? | **Duyệt `nivo-agentos-module-nivo-knowledge-r1`**; hoặc nêu thay đổi cụ thể trước khi `$starci-be-feature-approve` writes product source. |

### WARNINGS

| Warning | Impact |
|---|---|
| `.gitmounts/data` is a separate dirty Git repository with substantial user edits in `seed-knowledge/` and untracked `subscription-plans/`. | Apply must stage/commit only the new `solution-modules/` paths it owns and preserve every unrelated byte; no reset, clean or bulk add. |
| Runtime package delivery depends on the pinned Git commit being reachable from the configured data repository. | The data commit must be pushed before backend rollout; otherwise new installs fail safely before runtime reconciliation. |
| The current controlplane transport truncates success bodies at 400 characters. | r1 must repair and bound this transport before package pull can be considered functional. |
| Legacy `1.0.0` hard-coded corpus remains temporarily for recovery compatibility. | Removing it requires an explicit upgrade/recovery operation and proof that no installed desired state references the old digest. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Put Markdown bodies in manifest TypeScript | Versioned files in `nivo-data` | Operational knowledge must change independently of image releases and have its own reviewable history. |
| Send all documents through Saga/Kafka/runtime-job payload | Send immutable reference + digest; pull package over signed pod API | Keeps orchestration payload small and prevents document duplication across events. |
| Let controlplane read the mutable branch tip directly | Core pins SHA and authorizes delivery by installation | Prevents branch races and keeps tenant ownership enforcement in Nivo. |
| Copy `seed-knowledge/` into every module | Reference the common layer and store only specialist documents per module | Avoids divergence and keeps `SOUL.md` globally authoritative. |
| Auto-update installed agents when Markdown changes | Immutable version and explicit future upgrade | Silent behavior changes are unsafe and make rollback/audit impossible. |
| Store customer documents or channel/model credentials in `.gitmounts` | Existing knowledge-source and encrypted credential boundaries | `nivo-data` is public-safe operational data, never tenant data or secrets. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval of r1 | User replies `Duyệt nivo-agentos-module-nivo-knowledge-r1`. |
| Backend and mounted-data implementation | `$starci-be-feature-approve` after approval, constrained to the exact tree above. |
| Push of the isolated `nivo-data` package commit | Apply verifies staged paths and pushes only after repository ownership/auth are available. |
| Upgrade existing `1.0.0` installations to mounted packages | Separate Backend Feature Plan for explicit upgrade, rollback and late-success recovery. |
| Full browser proof | Apply uses the existing test account and live workspace runtime; missing runtime/credentials are recorded as `OWED`, never PASS. |

Approved revision: `nivo-agentos-module-nivo-knowledge-r1`

Approval evidence: User replied `thầy duyệt: nivo-agentos-module-nivo-knowledge-r1.` on 2026-08-17.

## review — nivo-agentos-module-nivo-knowledge-r1

### CONTEXT

| Field | Value |
|---|---|
| Workdir | `D:\Repositories\nivo-backend` |
| Source | D:\Repositories\starci-academy-backend |
| Project | `Explicit targets` |
| Frontend | `D:\Repositories\nivo-fe` |
| Backend | `D:\Repositories\nivo-backend` |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | `nivo` core + `agentos-controlplane` |
| Repo / branch | `D:\Repositories\nivo-backend` / `main`; mounted data / `main` |
| Purpose | Freeze and approve revision r1 for implementation. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\nivo\agentos-module-nivo-knowledge.md |
| Language | vi |
| Phase | review |
| Touching | Workflow approval record only. |

Approved revision: `nivo-agentos-module-nivo-knowledge-r1`

Approval evidence: User replied `thầy duyệt: nivo-agentos-module-nivo-knowledge-r1.` on 2026-08-17.

### OUTPUTS

| Concept | Result |
|---|---|
| Revision | r1 approved without a requested boundary change. |

### CHANGES

| Tree | Details |
|---|---|
| Workflow | Recorded explicit owner approval. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Exact revision r1 is approved. |

### WARNINGS

| Warning | Impact |
|---|---|
| Mounted data repository contains unrelated user work. | Apply must stage only its eight package files. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| None | Approved r1 | Owner accepted the frozen boundary. |

### OWED

| Owed | Cleared by |
|---|---|
| Implementation and proof | Apply revision r1. |

## apply — nivo-agentos-module-nivo-knowledge-r1

### CONTEXT

| Field | Value |
|---|---|
| Workdir | `D:\Repositories\nivo-backend` |
| Source | D:\Repositories\starci-academy-backend |
| Project | `Explicit targets` |
| Frontend | `D:\Repositories\nivo-fe` |
| Backend | `D:\Repositories\nivo-backend` |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | `nivo` core + `agentos-controlplane` |
| Repo / branch | `D:\Repositories\nivo-backend` / `main`; `D:\Repositories\nivo-backend\.gitmounts\data` / `main` |
| Purpose | Triển khai đúng revision `nivo-agentos-module-nivo-knowledge-r1` đã duyệt. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\nivo\agentos-module-nivo-knowledge.md |
| Language | vi |
| Phase | apply |
| Touching | Exact backend files and eight new `solution-modules/` data files named in Plan r1; không chạm FE, migration, chart, Kafka hay Socket contract. |

Applied revision: `nivo-agentos-module-nivo-knowledge-r1`

Baseline commit: `8ae521ee225d5ec90abd4a1c41d11e14da445239`

Mounted-data baseline: `9f33b1ce6362367c111940d3e2bfd9d74c58c006`; unrelated dirty `seed-knowledge/` and `subscription-plans/` paths are preserved and excluded from staging.

Tracked diff: `8ae521ee225d5ec90abd4a1c41d11e14da445239..worktree`

### LIVE FLOW PROOF

| Flow | Persona | Steps | UI | Network | Console | Terminal | Verdict | Evidence |
|---|---|---|---|---|---|---|---|---|
| Publish immutable module packages | Release owner | Stage only eight `solution-modules/` files → commit → push → resolve through authenticated GitHub API | N/A — backend/data release | Private `starci-lab/nivo-data` resolves commit `39e1f07d4f16d729e49e6c92b79bd0df03944299` with authenticated access; unauthenticated access correctly returns `404` | No credential or token printed | Commit integrity and secret scan pass | PASS | Data commit `39e1f07d4f16d729e49e6c92b79bd0df03944299` is present on the remote. |
| Install Chatbot and Sales modules | Authenticated Nivo workspace owner / owning pod | GraphQL install → Saga pin → immutable Git package → signed pod job → terminal result | Browser UI was not rerun against a deployed build in this Apply | E2E covers GraphQL, Saga, remote Git SHA and signed pod boundary | No feature error in focused runs | `agentos-solution-module-install.e2e-spec.ts`: 3/3 passed | PASS for backend flow | Both module packages resolve at knowledge version `1.1.0`; desired state carries SHA/path/digest and no Markdown body. |
| Concurrent installation | Authenticated Nivo workspace owner | Submit five identical requests, then submit two distinct module requests concurrently | N/A — backend concurrency proof | Same idempotency key collapses to one installation/Saga/job; different modules both reach ready | No feature error | `agentos-solution-module-concurrency.e2e-spec.ts`: 2/2 passed | PASS | Runtime job asserts a 40-character Git SHA, package path, 64-character digest and `knowledgeVersion=1.1.0`. |
| Controlplane knowledge reconciliation | AgentOS controlplane | Pull bounded package → validate identity/digest → preserve knowledge ingest guarantees | N/A — controlplane process | Signed reader/reconciler specs and controlplane knowledge-ingest E2E pass | Existing self-hosted embedding warning remains non-fatal | `knowledge-ingest.e2e-spec.ts`: 6/6 passed | PASS for automated boundary | Reader rejects malformed/tampered packages before Qdrant side effects; existing commit-last and rollback tests remain green. |
| Deployed Nivo UI → live Qdrant | Test owner | Login → install both modules → observe Kafka/Socket.IO → inspect Qdrant metadata | Not executed after deploying this worktree | Persistent `DATA_GIT_TOKEN_FILE` and core/controlplane rollout were not performed | Not inspected on a deployed revision | No live deployment command run | OWED | Requires stack secret mount, rollout and browser proof; automated E2E is not reported as live proof. |

### OUTPUTS

| Concept | Result |
|---|---|
| Immutable Nivo knowledge | Implemented two `1.1.0` packages in `nivo-data`, pinned by repository SHA, path and SHA-256 package digest. |
| Saga delivery | `pin-manifest` resolves once; desired state and runtime jobs carry references only; the owning controlplane pulls through the signed pod API. |
| Independent verification | Core and controlplane both parse and verify package identity, document inventory, limits and digest before reconciliation. |
| Compatibility | New installs select `1.1.0`; explicit legacy `1.0.0` resolution remains available and existing ready installations are not mutated. |
| Data release | Isolated commit `39e1f07d4f16d729e49e6c92b79bd0df03944299` was pushed without staging unrelated mounted-data work. |
| Automated proof | Focused specs, three E2E suites, both builds, changed-boundary lint, diff integrity and secret scan pass. |

### CHANGES

| Tree | Details |
|---|---|
| `.gitmounts/data/solution-modules/` | Added exactly eight versioned Chatbot and Sales knowledge-package files; committed and pushed separately. |
| `src/modules/shared/data-git/` | Added generic authenticated immutable Git ref/tree client and typed contracts. |
| `src/modules/bussiness/agentos-solution-modules/` | Added package parser/service/delivery, `1.1.0` catalog entries and immutable Saga pin/desired-state contracts. |
| `src/features/core/api/core/http/pod-registration/` | Added ownership-checked signed package delivery endpoint. |
| `apps/agentos-controlplane/src/` | Added bounded package pull, independent validation and reconciliation wiring; repaired success-body truncation. |
| `src/tests/e2e/` and focused specs | Added package, transport, ownership, Saga, concurrency and compatibility proof. |
| `docs/nivo-data-layout.md` and `.gitmounts/README.md` | Documented package layout, immutability and secret boundaries. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Approved revision r1 was implemented within its frozen backend/data boundary. |

### WARNINGS

| Warning | Impact |
|---|---|
| Full unit regression has 442 passing suites and 2 failing suites outside this feature: `expert-deploy-k8s-watcher.service.spec.ts` and `integrations/cache/stores.spec.ts`. | This Apply does not claim a repository-wide green unit gate; both failures reproduce independently and require their owning audit/feature boundary. |
| Whole-repository lint exits successfully with zero errors but reports 1,826 pre-existing warnings. | Changed files pass ESLint with `--max-warnings 0`; repository-wide strict zero-warning status remains false. |
| Git reports LF-to-CRLF conversion warnings for changed backend files. | `git diff --check` is clean; no whitespace defect was introduced, but line-ending policy remains repository-owned debt. |
| The private data repository needs `DATA_GIT_TOKEN` or `DATA_GIT_TOKEN_FILE` in deployed core runtime. | Without the secret mount, new package resolution fails safely before a runtime job is created. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Mark automated E2E as live browser proof | Record deployed UI/Qdrant flow as `OWED` | The worktree was not rolled out to the live core/controlplane stack during this Apply. |
| Fix unrelated watcher/cache unit failures inside r1 | Preserve evidence and route to the owning repair boundary | Expanding the approved feature tree would hide unrelated debt and violate the frozen revision. |
| Commit all dirty mounted-data paths | Commit only the eight `solution-modules/` files | Existing `seed-knowledge/` and `subscription-plans/` edits belong to the user. |

### OWED

| Owed | Cleared by |
|---|---|
| Persistent private-repository credential wiring | Mount `DATA_GIT_TOKEN_FILE` into the deployed Nivo core secret boundary and prove startup without printing the token. |
| Full live UI/Kafka/Socket.IO/Qdrant proof | Roll out core and controlplane, install both modules with the test account, inspect UI/network/console/terminal and verify private-layer Qdrant metadata. |
| Two unrelated unit failures | Route `expert-deploy-k8s-watcher` call-count behavior and atomic `MemoryCacheStore.take` semantics through their owning backend audit/feature workflow. |
| Repository-wide strict lint | Separate backend audit removes the 1,826 pre-existing warnings without suppressions or weakened gates. |

Apply implementation status: `implemented`; deployed live proof remains `OWED` and is not reported as pass.

Implementation commit: `b1c3126` (`feat: provision AgentOS module knowledge packages`).

Runtime continuation evidence: Nivo core booted on 2026-08-17, resolved private `nivo-data` ref `main` to `39e1f07d4f16d729e49e6c92b79bd0df03944299`, mapped `GET /pods/self/module-knowledge/:installationId`, and started successfully. Tino kubeconfig reports three `Ready` nodes and the existing workspace `d44a8fed-6e31-4634-9dae-44dd00165f2d` workloads running. Browser live installation remains pending authenticated test-account entry.

## apply continuation — private transport and live UI proof

### CONTEXT

| Field | Value |
|---|---|
| Workdir | `D:\Repositories\nivo-backend` |
| Source | D:\Repositories\starci-academy-backend |
| Project | `Explicit targets` |
| Frontend | `D:\Repositories\nivo-fe` |
| Backend | `D:\Repositories\nivo-backend` |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | `nivo` core + `agentos-controlplane` + `expert-academy-api` build compatibility |
| Repo / branch | `D:\Repositories\nivo-backend` / `main` |
| Purpose | Close private package transport, live UI, concurrency and frozen build evidence. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\nivo\agentos-module-nivo-knowledge.md |
| Language | vi |
| Phase | apply |
| Touching | Data Git transport and tests inside r1; Academy Qdrant compatibility repair explicitly requested by the owner. |

### LIVE FLOW PROOF

| Flow | Persona | Steps | UI | Network | Console | Terminal | Verdict | Evidence |
|---|---|---|---|---|---|---|---|---|
| Install Sales Copilot `1.1.0` from the live UI | Google-authenticated workspace owner | Open workspace `72f1e31f-c04d-4ab5-bdeb-0d9a160ad0c2` → Solutions → install Sales Copilot | Installed view renders `Provisioning` and `Version 1.1.0` | GraphQL accepted installation `5497c30b-3623-4fe3-b1af-05f28a5a7ea8`; Saga completed pin and compose steps | No browser-side feature error was observed | Desired state pins repository SHA `39e1f07d4f16d729e49e6c92b79bd0df03944299`, package digest and three private document keys; runtime job `189e13ee-e6a6-44be-87fa-00c828530422` is queued | PASS through immutable package delivery; runtime Ready OWED | The selected workspace has no connected AgentOS pod, so the honest terminal state is `await-runtime-reconcile`, not Ready. |
| Concurrent module provisioning | Isolated E2E owner and two signed pod clients | Five duplicate requests → two different module requests → poll jobs → report applied digests | N/A — backend E2E | Private Git package fetched through authenticated Contents API at pinned SHA | No feature error | `agentos-solution-module-concurrency.e2e-spec.ts`: 2/2 passed with the live backend worker stopped to prevent cross-database BullMQ queue theft | PASS | Five requests collapse to one installation/Saga/job; Chatbot and Sales both reach Ready concurrently. |
| Private Git transport fallback | Nivo core | REST branch lookup → GraphQL ref fallback → authenticated Contents API raw response | N/A | REST branch visibility returned `404`; GraphQL resolved the same private ref and Contents API returned package bytes | No token printed | Data Git focused specs: 3/3 passed; core startup reports `init.data-git.up-to-date` at the expected SHA | PASS | Avoids unauthenticated `raw.githubusercontent.com` rate limits while preserving immutable SHA pinning. |
| Academy Qdrant compatibility | Academy API | Query nearest vectors through Qdrant SDK 1.19 | N/A | Uses `query()` and consumes `response.points` | N/A | RAG specs: 6/6 passed; Academy build passed | PASS | Removes the prior build failure caused by the removed `QdrantClient.search()` method. |

### OUTPUTS

| Concept | Result |
|---|---|
| Private package reliability | Package bytes now stay on authenticated GitHub API transport; branch resolution has a GraphQL fallback for the observed private-repository REST visibility mismatch. |
| Live package proof | A real UI install reached immutable desired state and queued a signed pod runtime job. |
| Concurrency proof | Isolated E2E proves both idempotent fan-in and two-module parallel completion. |
| Build proof | Core, AgentOS controlplane and Academy builds pass after the Qdrant SDK compatibility repair. |
| Runtime | FE remains on `3066`; BE restarted on `3067` with zero TypeScript compile errors and the expected data SHA. |

### CHANGES

| Tree | Details |
|---|---|
| `src/modules/shared/data-git/` | Replaced private raw downloads with authenticated Contents API reads and added GraphQL ref fallback. |
| `src/tests/e2e/nivo/agentos-solution-module-concurrency.e2e-spec.ts` | Added failure-state diagnostics without weakening the 15-second completion assertions. |
| `src/modules/integrations/rag/` | Migrated Academy retrieval from removed `search()` to Qdrant `query()`. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | The approved implementation and owner-requested build repair are complete. |

### WARNINGS

| Warning | Impact |
|---|---|
| Backend live and E2E originally shared the same BullMQ Redis queue. | One live worker consumed an E2E job backed by another database. The proof was rerun with the live worker stopped, then the live backend was restarted. |
| Whole-repository lint reports 1,792 warnings and zero errors. | All five files changed in this continuation pass ESLint with `--max-warnings 0`; repository-wide warning cleanup remains a separate audit. |
| Live workspace `72f1e31f-c04d-4ab5-bdeb-0d9a160ad0c2` has no connected pod. | Package pinning and runtime-job creation are proven live; a deployed-pod reconciliation cannot honestly be marked Ready for this workspace. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Extend the E2E timeout to hide the queued saga | Isolate the shared BullMQ worker and retain the original 15-second assertions | The competing live worker, not product latency, consumed the test job. |
| Edit live installation rows to simulate Ready | Preserve the queued runtime job and report the missing pod honestly | Direct database mutation would not prove signed pod delivery or reconciliation. |

### OWED

| Owed | Cleared by |
|---|---|
| Live pod consumes the queued `1.1.0` package and reports Ready | Provision or reconnect the AgentOS pod for workspace `72f1e31f-c04d-4ab5-bdeb-0d9a160ad0c2`, then inspect Socket.IO and Qdrant metadata. |
| Existing deployed workspace upgrade | A separate approved upgrade flow migrates the `d44a8fed-6e31-4634-9dae-44dd00165f2d` installations from immutable `1.0.0` to `1.1.0`. |

Continuation commits: `2d6ef2c` (`fix: harden private module package provisioning`) and `74604ff` (`fix: migrate academy retrieval to Qdrant query API`).
