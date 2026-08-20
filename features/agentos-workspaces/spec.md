# AgentOS workspace lifecycle and control center

> Business head: `98099a2721d4b93505365cc4c9fc1f7259afe7a31e8d726d5044f1edb0eb9de6`
>
> This document is generated from the immutable business model. Update the model through `starci-business-analyze`; do not hand-edit this view.

## 1. Overview

An authenticated owner orders an AgentOS workspace through billing, observes fulfillment, and manages the exact owned workspace across overview, solutions, applications, infrastructure, operations and access surfaces.

Included:
- AgentOS catalogue order and payment wait
- Workspace provisioning
- Exact workspace control center
- Solution module discovery and installation
- Secure OpenClaw launch lifecycle

Excluded:
- Runnable update, backup, reset or rebuild controls not published by Core GraphQL
- Secure n8n launch before its adapter exists

## 2. Source heads

| Role | Repository | Head |
|---|---|---|
| fe | https://github.com/starci-lab/nivo-fe.git | `97eec8c5bb4c8f4b9e4bb7c59ea771ed829841d9` |
| be | https://github.com/starci-lab/nivo-backend.git | `947c6f4a117e1677e37ad98ba03f3dac0bca148e` |

## 3. Actors and access

### Authenticated AgentOS owner

- Order, monitor and manage an owned AgentOS workspace and its installable solution modules

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`

## 4. Entry points and surfaces

### AgentOS

- ID: `agentos-order`
- Route: `/[locale]/agentos | /[locale]/agentos/orders/[orderId]`
- Purpose: Request or resume one AgentOS order until a workspace is ready.
- Regions: `agentos-progress`
- Navigation: AgentOS (active), AgentOS workspace (available), Solution module (available)

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`

### AgentOS workspace

- ID: `agentos-workspace`
- Route: `/[locale]/agentos/workspaces/[workspaceId]`
- Purpose: Manage one exact owned workspace across its product and runtime areas.
- Regions: `workspace-tabs`, `workspace-body`
- Navigation: none

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`

### Solution module

- ID: `agentos-solution-detail`
- Route: `/[locale]/agentos/workspaces/[workspaceId]/modules/[installationId]`
- Purpose: Inspect one owned immutable module installation and its generated bindings.
- Regions: `module-summary`, `module-bindings`
- Navigation: none

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`

## 5. Business flows

### AgentOS workspace lifecycle and control center

Trigger: Request an AgentOS plan

1. **account-actor** — Request an AgentOS plan → Settle the linked invoice
2. **account-actor** — Settle the linked invoice → Wait for workspace fulfillment
3. **account-actor** — Wait for workspace fulfillment → Open the workspace and manage a solution or application
4. **account-actor** — Open the workspace and manage a solution or application → The ready workspace appears in AgentOS management

Outcomes:
- The ready workspace appears in AgentOS management
- Unsupported operations remain descriptive rather than fake controls

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`

## 6. Business rules

### BR-01

Workspace state is settled from the latest owner-scoped order, invoice and workspace facts, with the later workspace fact taking precedence.

Strength: **confirmed** · Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`

### BR-02

Secure OpenClaw access is issued, renewed and revoked as a short-lived launch rather than exposing reusable credentials.

Strength: **confirmed** · Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`

## 7. State model

- **request** (`request`, initial) → submitting — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`
- **submitting** (`submitting`, pending) → awaiting-payment — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`
- **awaiting-payment** (`awaiting-payment`, pending) → accepted — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`
- **accepted** (`accepted`, pending) → preparing — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`
- **preparing** (`preparing`, pending) → ready — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`
- **ready** (`ready`, success) → failed — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`
- **failed** (`failed`, error) → launch-opening — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`
- **launch-opening** (`launch-opening`, pending) → launch-connected — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`
- **launch-connected** (`launch-connected`, pending) → launch-expired — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`
- **launch-expired** (`launch-expired`, error) → terminal — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`

## 8. Entities and data

- **AgentOS workspace**: id, name, status, hostname, plan, runtime, stack — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`
- **Solution installation**: installationId, moduleKey, version, status, generated agents, knowledge bindings — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`

## 9. Operations and APIs

- **orderAgentOs** (mutation, backend) — input: catalogItemSlug, catalogTierId; output: catalog order; failures: order refused — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`
- **myAgentWorkspaceControlCenter** (query, backend) — input: workspaceId; output: workspace aggregate snapshot; failures: not owned or not found — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`
- **installAgentosSolutionModule** (mutation, backend) — input: workspaceId, moduleKey; output: installation in provisioning; failures: catalog or ownership refusal — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`
- **issueAgentWorkspaceAppLaunch** (mutation, backend) — input: workspaceId; output: short-lived secure launch; failures: workspace inactive or not owned — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`

## 10. Acceptance conditions

- **AC-01** The ready workspace appears in AgentOS management — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`
- **AC-02** The AgentOS workspace lifecycle and control center surface renders only the states, identities and actions proven by current routed source. — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`

## 11. Explicit unknowns

- **When will update, plan change, backup, reset and rebuild mutations become public?** — The control center can read runtime state but intentionally does not render fake runnable controls.

## 12. Evidence index

| ID | Role | Source | Kind | Claim |
|---|---|---|---|---|
| EV-001 | fe | `apps/app/src/components/blocks/provisioning/AgentOSProvisioning/index.tsx:9` | ui | The order flow settles catalogue, order, invoice and workspace facts into payment, provisioning, ready or failed states. |
| EV-002 | fe | `apps/app/src/components/pages/AgentOSWorkspacePage/index.tsx:18` | ui | The connected workspace page queries an exact workspace, reacts to runtime invalidation and manages secure launch state. |
| EV-003 | fe | `apps/app/src/components/pages/AgentOSWorkspacePage/component.tsx:18` | ui | The workspace surface exposes overview, solutions, applications, infrastructure, operations and access sections with loading/refused/ready states. |
| EV-004 | be | `src/features/core/api/core/graphql/queries/agent-workspace/my-agent-workspace-control-center/my-agent-workspace-control-center.resolver.ts:50` | api | The backend exposes one exact viewer-owned AgentOS control-center snapshot. |
| EV-005 | be | `src/features/core/api/core/graphql/queries/agent-workspace/my-agent-workspace-control-center/my-agent-workspace-control-center.handler.spec.ts:100` | test | The aggregate handler test proves owned workspace lookup and fail-closed application capabilities. |
| EV-006 | be | `src/features/core/api/core/graphql/mutations/agent-workspace/install-agentos-solution-module/install-agentos-solution-module.resolver.ts:31` | api | The install mutation binds the authenticated user to the requested solution installation. |
| EV-007 | be | `src/features/core/api/core/graphql/mutations/agent-workspace/issue-agent-workspace-app-launch/issue-agent-workspace-app-launch.handler.spec.ts:17` | test | Secure launch handler tests cover active workspace issuance and refusal cases. |
