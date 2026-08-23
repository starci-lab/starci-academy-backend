# AgentOS workspace lifecycle and control center

> Business head: `f5321acfa014b3daaa340f86d72da7ada0f5703e6ba1f138d0a1f983f0d0652d`
>
> This document is generated from the immutable business model. Update the model through `starci-business-analyze`; do not hand-edit this view.

## 1. Overview

An authenticated owner reaches the exact ready AgentOS workspace, securely opens OpenClaw or n8n as independent post-ready app launches, runs auditable workspace operations with explicit safety boundaries, and observes or reindexes the internal MCP-Qdrant knowledge runtime without receiving infrastructure credentials.

Included:
- AgentOS catalogue request and exact-order resume
- Wallet as the linked-invoice payment waypoint
- Workspace provisioning and the exact workspace as the primary terminal
- Solution module detail as an optional post-ready workspace branch
- Secure OpenClaw and n8n launch as optional app-bound post-ready branches
- Public owner-scoped update, paid plan change, verified backup, non-destructive restart and confirmed rebuild operations
- MCP-Qdrant runtime health, safe knowledge summary and asynchronous reindexing inside the exact workspace
- Application launch, workspace operation and knowledge runtime as independent block state axes

Excluded:
- Treating module detail or OpenClaw launch as required provisioning stages
- Wallet top-up, provider settlement and invoice anatomy owned by nivo/wallet-billing
- Destructive data reset or wipe under the Restart action
- Applying a plan change before its linked adjustment invoice is paid
- Reusable application or Qdrant credentials, Qdrant admin routes, raw document text, point identifiers and control-plane semantic search

## 2. Source heads

| Role | Repository | Head |
|---|---|---|
| fe | https://github.com/starci-lab/nivo-fe.git | `269c99b0cf974ee476bda48f916c3a5ad3cdd3bf` |
| be | https://github.com/starci-lab/nivo-backend.git | `947c6f4a117e1677e37ad98ba03f3dac0bca148e` |

## 3. Actors and access

### Authenticated AgentOS owner

- Request and pay for one AgentOS order
- Observe fulfillment and enter the exact owned workspace
- Open optional module detail, OpenClaw and n8n branches after readiness
- Run safe owner-scoped workspace operations and follow their asynchronous results
- Inspect MCP-Qdrant health and knowledge summary and request reindexing without infrastructure credentials

Evidence: `EV-001`, `EV-002`, `EV-005`, `EV-009`, `EV-025`

## 4. Entry points and surfaces

### AgentOS order

- ID: `agentos-order`
- Route: `/[locale]/agentos | /[locale]/agentos/orders/[orderId]`
- Purpose: Create an AgentOS order or resume one exact order through payment and provisioning.
- Regions: `order-progress`
- Navigation: AgentOS (active), Wallet (available)

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-005`

### Wallet payment waypoint

- ID: `wallet-waypoint`
- Route: `/[locale]/wallet`
- Purpose: Settle the invoice linked to the exact AgentOS order, then resume that order context.
- Regions: `linked-invoice`
- Navigation: Wallet (active), Return to AgentOS order (available)

Evidence: `EV-001`, `EV-003`, `EV-004`

### Exact AgentOS workspace

- ID: `agentos-workspace`
- Route: `/[locale]/agentos/workspaces/[workspaceId]`
- Purpose: Serve as the primary terminal for managing one exact owned ready workspace.
- Regions: `workspace-control-center`
- Navigation: Workspace (active), Solution module (available), OpenClaw (available), n8n (available)

Evidence: `EV-001`, `EV-005`, `EV-009`, `EV-010`, `EV-018`, `EV-022`, `EV-023`, `EV-025`

### Solution module detail

- ID: `agentos-module`
- Route: `/[locale]/agentos/workspaces/[workspaceId]/modules/[installationId]`
- Purpose: Inspect one installation that belongs to the exact ready workspace without extending the primary journey.
- Regions: `module-detail`
- Navigation: Module detail (active), Back to exact workspace (available)

Evidence: `EV-001`, `EV-006`, `EV-011`

### OpenClaw secure launch

- ID: `openclaw-launch`
- Route: `/[locale]/launch/agentos/[workspaceId]/openclaw`
- Purpose: Issue and relay a safe short-lived launch for the exact ready workspace on an independent state axis.
- Regions: `launch-bridge`
- Navigation: OpenClaw launch (active), Back to exact workspace (available)

Evidence: `EV-001`, `EV-007`, `EV-008`, `EV-012`, `EV-013`

### n8n secure launch

- ID: `n8n-launch`
- Route: `/[locale]/launch/agentos/[workspaceId]/n8n`
- Purpose: Issue and relay a safe short-lived n8n launch for the exact ready workspace on an independent app-bound state axis.
- Regions: `n8n-launch-bridge`
- Navigation: n8n launch (active), Back to exact workspace (available)

Evidence: `EV-019`, `EV-020`, `EV-025`

## 5. Business flows

### Request, pay, provision and enter the exact workspace

Trigger: The authenticated owner requests an AgentOS plan

1. **account-owner** — Choose an AgentOS plan and create the order → The owner continues on the exact order route
2. **account-owner** — Open Wallet for the invoice linked to that exact order → Wallet becomes a waypoint without replacing the AgentOS journey
3. **account-owner** — Settle the linked invoice from wallet balance → The owner resumes the same exact order and fulfillment can advance
4. **account-owner** — Observe accepted and preparing states on the exact order → The ready workspace identity is resolved
5. **account-owner** — Open the exact ready workspace → The exact workspace control center is the primary terminal

Outcomes:
- The owner lands in the exact owned workspace that fulfilled the paid order
- Wallet is a correlated payment waypoint rather than the journey terminal

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-010`, `EV-014`, `EV-015`

### Inspect an installed solution module after workspace readiness

Trigger: The owner chooses a solution installation from the exact ready workspace

1. **account-owner** — Choose one installation belonging to the exact workspace → The nested module route preserves both workspace and installation identity
2. **account-owner** — Inspect package lifecycle and generated bindings → Module detail remains an optional branch from the ready workspace

Outcomes:
- The owner can inspect one installation without extending the primary provisioning journey

Evidence: `EV-001`, `EV-006`, `EV-009`, `EV-011`

### Open a short-lived OpenClaw launch after workspace readiness

Trigger: The owner chooses OpenClaw from the exact ready workspace

1. **account-owner** — Issue a secure launch for the exact workspace → The launch axis advances from idle to opening
2. **account-owner** — Connect, renew, expire or revoke the short-lived launch → Launch state changes without changing workspace readiness

Outcomes:
- OpenClaw access is optional, exact-workspace scoped and independently stateful

Evidence: `EV-001`, `EV-007`, `EV-008`, `EV-009`, `EV-012`, `EV-013`

### Open a short-lived n8n launch after workspace readiness

Trigger: The owner chooses n8n from the exact ready workspace

1. **account-owner** — Issue an app-bound n8n launch for the exact workspace → The n8n launch axis advances from idle to opening
2. **account-owner** — Connect, renew, expire or revoke the short-lived n8n launch → n8n launch state changes without changing workspace readiness

Outcomes:
- n8n access is optional, exact-workspace scoped, credential-free and independently stateful

Evidence: `EV-019`, `EV-020`, `EV-025`

### Operate one exact ready workspace safely

Trigger: The owner chooses one action in the Operations tab

1. **account-owner** — Choose update, plan change, backup, restart or rebuild → The action is evaluated against exact-workspace ownership and operation-specific preconditions
2. **account-owner** — Confirm only actions whose consequences require confirmation → The backend accepts one auditable asynchronous operation or returns an explicit refusal
3. **account-owner** — Observe completion or refusal without leaving the workspace → The operation settles independently from page anatomy and launch state

Outcomes:
- Every workspace action is real, owner-scoped, stateful and truthful about preconditions
- Restart preserves persistent data; rebuild requires confirmation plus a fresh verified backup
- Plan change applies only after its linked Wallet invoice is paid

Evidence: `EV-018`, `EV-021`, `EV-025`

### Inspect and reindex the workspace knowledge runtime

Trigger: The owner opens Infrastructure for the exact ready workspace

1. **account-owner** — Inspect MCP and Qdrant health, document counts by origin and last update time → Only owner-safe aggregate knowledge facts are returned
2. **account-owner** — Request asynchronous reindexing for the exact workspace → Reindexing advances on its own state axis and exposes completion or refusal

Outcomes:
- The owner can verify that internal knowledge infrastructure works without obtaining admin access or document contents

Evidence: `EV-022`, `EV-023`, `EV-024`, `EV-025`

## 6. Business rules

### BR-01

Wallet is the payment waypoint for the invoice linked to the exact AgentOS order, and completion returns the owner to that same order context.

Strength: **partial** · Evidence: `EV-001`, `EV-003`, `EV-004`

### BR-02

The primary journey terminates at /[locale]/agentos/workspaces/[workspaceId] for the exact workspace that fulfilled the order.

Strength: **partial** · Evidence: `EV-001`, `EV-003`, `EV-005`, `EV-010`

### BR-03

Module detail and OpenClaw launch are optional branches available only after the exact workspace is ready; neither is a required provisioning stage.

Strength: **partial** · Evidence: `EV-001`, `EV-006`, `EV-007`, `EV-009`

### BR-04

Workspace provisioning and OpenClaw launch are independent state axes; a launch transition never changes the workspace lifecycle state.

Strength: **confirmed** · Evidence: `EV-001`, `EV-008`, `EV-009`, `EV-012`

### BR-05

Workspace lifecycle is reconciled from owner-scoped order, invoice and workspace facts, with the later workspace fact taking precedence.

Strength: **confirmed** · Evidence: `EV-002`

### BR-06

OpenClaw access uses short-lived issue, renew and revoke operations and never exposes reusable credentials.

Strength: **confirmed** · Evidence: `EV-008`, `EV-012`, `EV-013`

### BR-07

OpenClaw launch requires an active exact workspace, active instance and ready runtime; module post-ready sequencing remains owner intent until an equivalent guard exists.

Strength: **partial** · Evidence: `EV-001`, `EV-011`, `EV-012`

### BR-08

n8n uses the same short-lived app-bound issue, renew and revoke security boundary as OpenClaw and never exposes a reusable credential.

Strength: **partial** · Evidence: `EV-019`, `EV-020`, `EV-025`

### BR-09

Update, plan change, backup, restart and rebuild are exact-owner-scoped asynchronous operations with explicit accepted, running, succeeded and refused results.

Strength: **partial** · Evidence: `EV-018`, `EV-025`

### BR-10

Restart is the non-destructive recovery action and preserves persistent workspace data; no action labelled Restart may reset or wipe data.

Strength: **confirmed** · Evidence: `EV-021`, `EV-025`

### BR-11

A plan change creates an exact adjustment order and linked Wallet invoice and is applied only after that invoice is paid.

Strength: **confirmed** · Evidence: `EV-001`, `EV-025`

### BR-12

Backup reports success only after verification; rebuild requires explicit confirmation and a fresh verified backup before the release is replaced without deleting persistent volumes.

Strength: **confirmed** · Evidence: `EV-021`, `EV-025`

### BR-13

MCP and Qdrant remain internal runtime components; the owner may receive health, document counts by origin, last update and reindex state, but no credential, raw text, point id, admin route or control-plane semantic search.

Strength: **confirmed** · Evidence: `EV-022`, `EV-023`, `EV-024`, `EV-025`

### BR-14

Application launch, workspace operation and knowledge reindex transitions are independent block state axes and never redefine workspace lifecycle or page anatomy.

Strength: **confirmed** · Evidence: `EV-025`

## 7. State model

- **Order · request** (`order-request`, initial) → order-submitting — `EV-002`
- **Order · submitting** (`order-submitting`, pending) → order-awaiting-payment, workspace-failed — `EV-002`
- **Order · awaiting payment** (`order-awaiting-payment`, pending) → order-accepted, workspace-failed — `EV-002`, `EV-003`
- **Order · accepted** (`order-accepted`, pending) → workspace-preparing, workspace-failed — `EV-002`
- **Wallet · awaiting payment** (`wallet-awaiting-payment`, initial) → wallet-paying — `EV-001`, `EV-004`
- **Wallet · paying** (`wallet-paying`, pending) → wallet-paid, wallet-refused — `EV-004`
- **Wallet · paid** (`wallet-paid`, success) → terminal — `EV-001`, `EV-004`
- **Wallet · refused** (`wallet-refused`, error) → wallet-paying — `EV-004`
- **Workspace · preparing** (`workspace-preparing`, pending) → workspace-ready, workspace-failed — `EV-002`
- **Workspace · ready** (`workspace-ready`, success) → terminal — `EV-001`, `EV-002`, `EV-005`, `EV-010`
- **Workspace · failed** (`workspace-failed`, error) → terminal — `EV-002`
- **Module · loading** (`module-loading`, pending) → module-ready, module-refused — `EV-006`, `EV-011`
- **Module · ready** (`module-ready`, success) → terminal — `EV-006`, `EV-011`
- **Module · refused** (`module-refused`, error) → terminal — `EV-006`, `EV-011`
- **Launch · idle** (`launch-idle`, initial) → launch-opening — `EV-008`
- **Launch · opening** (`launch-opening`, pending) → launch-connected, launch-blocked, launch-expired — `EV-008`, `EV-012`, `EV-013`
- **Launch · connected** (`launch-connected`, success) → launch-expired, launch-disconnected — `EV-008`, `EV-013`
- **Launch · blocked** (`launch-blocked`, error) → launch-opening — `EV-008`, `EV-012`, `EV-013`
- **Launch · expired** (`launch-expired`, error) → launch-opening — `EV-008`, `EV-013`
- **Launch · disconnected** (`launch-disconnected`, partial) → launch-opening — `EV-008`
- **Operation · idle** (`operation-idle`, initial) → operation-running — `EV-018`, `EV-025`
- **Operation · running** (`operation-running`, pending) → operation-succeeded, operation-refused — `EV-025`
- **Operation · succeeded** (`operation-succeeded`, success) → terminal — `EV-025`
- **Operation · refused** (`operation-refused`, error) → operation-idle — `EV-025`
- **Plan change · awaiting payment** (`plan-awaiting-payment`, pending) → plan-applying, operation-refused — `EV-001`, `EV-025`
- **Plan change · applying** (`plan-applying`, pending) → operation-succeeded, operation-refused — `EV-025`
- **Knowledge runtime · loading** (`knowledge-loading`, pending) → knowledge-ready, knowledge-degraded — `EV-022`, `EV-025`
- **Knowledge runtime · ready** (`knowledge-ready`, success) → knowledge-reindexing — `EV-022`, `EV-025`
- **Knowledge runtime · degraded** (`knowledge-degraded`, partial) → knowledge-loading, knowledge-reindexing — `EV-022`, `EV-025`
- **Knowledge runtime · reindexing** (`knowledge-reindexing`, pending) → knowledge-ready, knowledge-refused — `EV-025`
- **Knowledge runtime · refused** (`knowledge-refused`, error) → knowledge-reindexing — `EV-025`

## 8. Entities and data

- **AgentOS catalogue order**: id, status, catalogItemSlug, catalogTierId, invoiceId, workspaceId — `EV-002`, `EV-003`, `EV-014`
- **Wallet invoice**: id, status, amount, currency, orderId — `EV-001`, `EV-004`, `EV-014`, `EV-015`
- **AgentOS workspace**: id, name, status, hostname, plan, runtime, stack — `EV-002`, `EV-005`, `EV-010`
- **Solution installation**: installationId, workspaceId, moduleKey, version, status, generated agents, knowledge bindings — `EV-006`, `EV-011`
- **Short-lived OpenClaw launch**: workspaceId, launchUrl, expiresAt, state — `EV-007`, `EV-008`, `EV-012`, `EV-013`
- **Short-lived n8n launch**: workspaceId, app = N8N, launchId, redirectUrl, expiresAt, state — `EV-019`, `EV-020`, `EV-025`
- **Workspace operation**: operationId, workspaceId, kind, status, requestedAt, completedAt, failure — `EV-018`, `EV-021`, `EV-025`
- **Verified workspace backup**: backupId, workspaceId, reason, status, checksum, verifiedAt — `EV-021`, `EV-025`
- **MCP-Qdrant knowledge runtime**: mcpHealth, qdrantHealth, documentCount, origins, lastUpdatedAt, reindexStatus — `EV-022`, `EV-023`, `EV-024`, `EV-025`

## 9. Operations and APIs

- **orderCatalogItem** (mutation, backend) — input: catalogItemSlug = nivo-ai-agent, catalogTierId; output: PendingPayment catalogue order, linked Unpaid invoice; failures: catalogue or order refusal — `EV-003`, `EV-014`
- **openAgentosPaymentWaypoint** (redirect, frontend) — input: orderId, linked invoiceId, safe internal returnTo; output: Wallet route preserving exact AgentOS continuation; failures: missing order correlation or unsafe return target — `EV-001`, `EV-003`, `EV-004`
- **payInvoice** (mutation, backend) — input: invoiceId; output: paid invoice; failures: insufficient balance or payment refusal — `EV-004`, `EV-015`
- **myAgentWorkspaceControlCenter** (query, backend) — input: workspaceId; output: exact owner-scoped workspace aggregate; failures: not owned or not found — `EV-010`
- **installAgentosSolutionModule** (mutation, backend) — input: workspaceId, moduleKey; output: installation in provisioning; failures: catalogue, duplicate installation or ownership refusal — `EV-011`
- **issueAgentWorkspaceAppLaunch** (mutation, backend) — input: workspaceId, app = OPENCLAW | N8N; output: launchId, safe redirectUrl, expiresAt; failures: workspace inactive, application unavailable or not owned — `EV-012`, `EV-019`, `EV-020`, `EV-025`
- **renewAgentWorkspaceAppLaunch** (mutation, backend) — input: launchId; output: launchId, expiresAt; failures: launch not renewable — `EV-008`, `EV-013`
- **revokeAgentWorkspaceAppLaunch** (mutation, backend) — input: launchId; output: launchId, revoked; failures: launch not revocable — `EV-008`, `EV-013`
- **updateAgentWorkspaceRuntime** (mutation, backend) — input: workspaceId, idempotencyKey; output: operationId, accepted status, target supported release; failures: not owned, workspace not ready, update already running, unsupported release — `EV-018`, `EV-025`
- **requestAgentWorkspacePlanChange** (mutation, backend) — input: workspaceId, catalogTierId, idempotencyKey; output: adjustment orderId, linked invoiceId, awaiting-payment status; failures: not owned, same or invalid plan, catalogue refusal — `EV-001`, `EV-025`
- **applyPaidAgentWorkspacePlanChange** (command, backend) — input: paid adjustment orderId, workspaceId; output: operationId, plan-applying status; failures: invoice not paid, capacity unavailable, workspace no longer eligible — `EV-001`, `EV-025`
- **createAgentWorkspaceBackup** (mutation, backend) — input: workspaceId, idempotencyKey; output: operationId, backupId after verification; failures: not owned, workspace not ready, snapshot or verification failure — `EV-021`, `EV-025`
- **restartAgentWorkspaceRuntime** (mutation, backend) — input: workspaceId, idempotencyKey; output: operationId, non-destructive restart accepted; failures: not owned, workspace not ready, restart already running — `EV-021`, `EV-025`
- **rebuildAgentWorkspaceRuntime** (mutation, backend) — input: workspaceId, acknowledgedRebuild = true, idempotencyKey; output: operationId, fresh verified backupId, rebuild accepted; failures: not owned, confirmation missing, backup or verification failure, reinstall failure — `EV-021`, `EV-025`
- **myAgentWorkspaceOperations** (query, backend) — input: workspaceId; output: owner-scoped operation history and current operation; failures: not owned or not found — `EV-025`
- **myAgentWorkspaceKnowledgeRuntime** (query, backend) — input: workspaceId; output: MCP health, Qdrant health, documentCount, origins, lastUpdatedAt, reindexStatus; failures: not owned, runtime unavailable — `EV-022`, `EV-023`, `EV-024`, `EV-025`
- **reindexAgentWorkspaceKnowledge** (mutation, backend) — input: workspaceId, idempotencyKey; output: operationId, knowledge-reindexing status; failures: not owned, runtime unavailable, reindex already running — `EV-022`, `EV-025`

## 10. Acceptance conditions

- **AC-01** Creating an AgentOS order establishes /[locale]/agentos/orders/[orderId] as the exact resumable journey context. — `EV-001`, `EV-003`
- **AC-02** The Wallet waypoint identifies and pays the invoice linked to that exact order and exposes a return to the same order rather than choosing an unrelated unpaid invoice. — `EV-001`, `EV-003`, `EV-004`
- **AC-03** When provisioning resolves a ready workspaceId, the primary action opens /[locale]/agentos/workspaces/[workspaceId], not the generic AgentOS index. — `EV-001`, `EV-003`, `EV-005`
- **AC-04** Module detail and OpenClaw launch are reachable only as optional branches from a ready exact workspace and are absent from required primary progress. — `EV-001`, `EV-006`, `EV-007`, `EV-009`
- **AC-05** Launch idle, opening, connected, blocked, expired and disconnected transitions remain independent from request, payment, provisioning and workspace readiness states. — `EV-001`, `EV-008`, `EV-012`, `EV-013`
- **AC-06** Update, plan change, backup, restart and rebuild controls become runnable only through their corresponding public owner-scoped backend operations and expose real pending, success and refusal states. — `EV-018`, `EV-025`
- **AC-07** A ready exact workspace can issue, renew and revoke n8n launch with the same app-bound short-lived security and independent launch state used by OpenClaw. — `EV-019`, `EV-020`, `EV-025`
- **AC-08** Restart preserves persistent data; backup verifies its artifact; rebuild requires explicit confirmation plus a fresh verified backup and never masquerades as Restart. — `EV-021`, `EV-025`
- **AC-09** Plan change returns an exact adjustment order and linked Wallet invoice and does not apply the new plan until payment succeeds. — `EV-001`, `EV-025`
- **AC-10** Infrastructure exposes MCP and Qdrant health, knowledge document counts by origin, last update and reindex state without credentials, raw text, point ids, admin routes or control-plane search. — `EV-022`, `EV-023`, `EV-024`, `EV-025`
- **AC-11** Launch, operation and knowledge reindex conditions render as block states inside the existing workspace page architecture; they do not become page states unless page anatomy changes. — `EV-025`

## 11. Explicit unknowns

- **Which route or durable correlation contract carries orderId and invoiceId into Wallet and back to the exact AgentOS order?** — Current Wallet pays the first unpaid invoice, so AC-02 is not yet implemented.
- **Which shared guard makes module detail and OpenClaw unavailable until the workspace status is ready?** — The branches exist under the workspace today, but the frontend does not enforce the requested readiness boundary.
- **Which observable event moves an active OpenClaw launch into disconnected?** — The state is declared but its production transition is not yet proven.

## 12. Evidence index

| ID | Role | Source | Kind | Claim |
|---|---|---|---|---|
| EV-001 | owner | `decision:cf85c26b10c02a67a9b79ffe2b4a80bdd4f6afa71310638c9e1e784d96fda02e` | owner-decision | The owner standardizes Wallet as the payment waypoint, the exact workspace as the primary terminal, module detail and OpenClaw as post-ready branches, and launch as an independent state axis. |
| EV-002 | fe | `apps/app/src/components/blocks/provisioning/AgentOSProvisioning/index.tsx:30` | ui | The frontend reconciles exact owner order, invoice and workspace facts into separate order and workspace lifecycle phases, with the later workspace fact taking precedence. |
| EV-003 | fe | `apps/app/src/components/blocks/provisioning/AgentOSProvisioning/index.tsx:201` | ui | Ordering establishes the exact resume URL and awaiting-payment opens Wallet, while the current ready action still targets the generic AgentOS index. |
| EV-004 | fe | `apps/app/src/components/pages/WalletPage/index.tsx:106` | ui | Wallet renders owner invoices and currently pays the first unpaid invoice without receiving exact AgentOS order or invoice identity. |
| EV-005 | fe | `apps/app/src/app/[locale]/(console)/agentos/workspaces/[workspaceId]/page.tsx:3` | route | The frontend publishes a control-center route bound to one exact workspaceId. |
| EV-006 | fe | `apps/app/src/app/[locale]/(console)/agentos/workspaces/[workspaceId]/modules/[installationId]/page.tsx:3` | route | Solution module detail is nested beneath the exact workspace and binds both workspaceId and installationId. |
| EV-007 | fe | `apps/app/src/app/[locale]/launch/agentos/[workspaceId]/openclaw/page.tsx:3` | route | OpenClaw launch is an exact-workspace launch bridge route outside the required provisioning surface. |
| EV-008 | fe | `apps/app/src/components/pages/AgentOSWorkspacePage/index.tsx:29` | ui | The workspace snapshot and OpenClaw issue, renew, revoke and broadcast lifecycle are held as separate frontend state owners. |
| EV-009 | fe | `apps/app/src/components/pages/AgentOSWorkspacePage/component.tsx:48` | ui | Solutions and OpenClaw applications are peer branches within the answered exact workspace control center rather than provisioning stages. |
| EV-010 | be | `src/features/core/api/core/graphql/queries/agent-workspace/my-agent-workspace-control-center/my-agent-workspace-control-center.resolver.ts:50` | api | The backend exposes one exact viewer-owned AgentOS control-center aggregate. |
| EV-011 | be | `src/features/core/api/core/graphql/mutations/agent-workspace/install-agentos-solution-module/install-agentos-solution-module.resolver.ts:31` | api | The install mutation binds the authenticated owner and exact workspace to the requested solution installation. |
| EV-012 | be | `src/features/core/api/core/graphql/mutations/agent-workspace/issue-agent-workspace-app-launch/issue-agent-workspace-app-launch.handler.ts:44` | api | Issue launch is exact-owner scoped and refuses non-AgentOS, inactive workspace or instance, missing hostname, unavailable capability and unready runtime before returning a credential-free launch. |
| EV-013 | be | `src/modules/bussiness/workspace-app-launch/workspace-app-launch.service.ts:35` | api | OpenClaw access uses a hashed one-use grant and owner-scoped short-lived Redis lease with independent redeem, renew, revoke and validate behavior. |
| EV-014 | be | `src/features/core/api/core/graphql/mutations/catalog/order-catalog-item/order-catalog-item.resolver.ts:41` | api | The authenticated orderCatalogItem operation creates the catalogue order and linked invoice but does not itself provision AgentOS. |
| EV-015 | be | `src/features/core/api/core/graphql/mutations/invoices/pay-invoice/pay-invoice.resolver.ts:42` | api | The authenticated payInvoice operation settles one exact invoice by invoiceId and returns its updated payment state. |
| EV-016 | owner | `decision:ac2edd83cbb0439eb877516085bb1fb40a861549b349bbebf5bf675200150313` | owner-decision | Supersede the current in-progress AgentOS workspace scope so a later accepted intent can add secure n8n launch, public owner-scoped workspace operations, and owner-safe MCP-Qdrant knowledge runtime without reusable credentials. |
| EV-018 | fe | `apps/app/src/components/blocks/operations/AgentOSWorkspaceOperations/index.tsx:1` | ui | The committed frontend names update, plan, backup, reset and rebuild but deliberately disables every action because no public operation is wired. |
| EV-019 | be | `src/modules/bussiness/workspace-app-launch/workspace-app-launch.types.ts:1` | contract | The current app-bound launch contract contains only OpenClaw, proving n8n launch requires an explicit backend capability expansion rather than credential reuse. |
| EV-020 | be | `src/features/core/api/core/graphql/queries/agent-workspace/my-agent-workspace-control-center/my-agent-workspace-control-center.handler.ts:118` | api | The current owner-scoped workspace aggregate marks n8n unavailable with SECURITY_UPGRADE_REQUIRED while exposing its observed version. |
| EV-021 | be | `src/modules/bussiness/instance-lifecycle/wipe-instance.service.ts:268` | api | The internal rebuild capability requires acknowledgement, takes and verifies a fresh backup, refuses without verified backup, uninstalls only the release and dispatches reinstall. |
| EV-022 | be | `src/modules/bussiness/pod-knowledge/pod-knowledge.types.ts:30` | contract | The backend defines an owner-safe Qdrant knowledge summary of document count, origins and last update while explicitly excluding raw text, search and identifiers. |
| EV-023 | be | `src/modules/bussiness/agentos-provision/chart/build-agentos-chart-values.ts:20` | contract | AgentOS provisioning already declares n8n, MCP and Qdrant runtime components and bounded resources inside the workspace chart. |
| EV-024 | be | `src/modules/bussiness/openclaw-runtime-config/openclaw-module-config.service.ts:12` | contract | Installed agents already receive an internal MCP server binding with per-agent capability headers, proving MCP is runtime infrastructure rather than an owner credential. |
| EV-025 | owner | `decision:a4cd1c08cb912bf2f09057c0b8f8eb77ca8e696b39bd036991f0a4bcf7227b5f` | owner-decision | The owner accepts a pending AgentOS workspace expansion: secure app-bound n8n launch; public owner-scoped update, paid plan change, verified backup, non-destructive restart and confirmed rebuild operations; and owner-safe MCP-Qdrant health, knowledge summary and reindexing without reusable credentials, raw document access, point identifiers, admin routes or control-plane semantic search. |
