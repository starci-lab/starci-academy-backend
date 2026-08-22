# AgentOS workspace lifecycle and control center

> Business identity: `nivo/agentos-workspaces@f5321acfa014b3daaa340f86d72da7ada0f5703e6ba1f138d0a1f983f0d0652d`
>
> Source heads: authority `in-progress` · base `bdbf7b91da960c25d2dcdd8787c60d078381b34382984329210c78ebb93c8dca` · `fe@269c99b0cf97`, `be@947c6f4a117e`
>
> Load this file first. Load only the modules named by the current task.

## Decision capsule

**Purpose.** An authenticated owner reaches the exact ready AgentOS workspace, securely opens OpenClaw or n8n as independent post-ready app launches, runs auditable workspace operations with explicit safety boundaries, and observes or reindexes the internal MCP-Qdrant knowledge runtime without receiving infrastructure credentials.

**Primary actor.** Authenticated AgentOS owner

**Primary outcome.** The owner lands in the exact owned workspace that fulfilled the paid order

**Never does.** Treating module detail or OpenClaw launch as required provisioning stages

## Invariants

- `BR-01` — Wallet is the payment waypoint for the invoice linked to the exact AgentOS order, and completion returns the owner to that same order context.
- `BR-02` — The primary journey terminates at /[locale]/agentos/workspaces/[workspaceId] for the exact workspace that fulfilled the order.
- `BR-03` — Module detail and OpenClaw launch are optional branches available only after the exact workspace is ready; neither is a required provisioning stage.
- `BR-04` — Workspace provisioning and OpenClaw launch are independent state axes; a launch transition never changes the workspace lifecycle state.
- `BR-05` — Workspace lifecycle is reconciled from owner-scoped order, invoice and workspace facts, with the later workspace fact taking precedence.

## Primary flow

```text
order-submitting → wallet-awaiting-payment → wallet-paying → workspace-preparing → workspace-ready
```

## Surface map

| Surface | Route | Owns | Module |
|---|---|---|---|
| `agentos-order` | `/[locale]/agentos | /[locale]/agentos/orders/[orderId]` | Create an AgentOS order or resume one exact order through payment and provisioning. | [surface](surfaces/agentos-order.md) |
| `wallet-waypoint` | `/[locale]/wallet` | Settle the invoice linked to the exact AgentOS order, then resume that order context. | [surface](surfaces/wallet-waypoint.md) |
| `agentos-workspace` | `/[locale]/agentos/workspaces/[workspaceId]` | Serve as the primary terminal for managing one exact owned ready workspace. | [surface](surfaces/agentos-workspace.md) |
| `agentos-module` | `/[locale]/agentos/workspaces/[workspaceId]/modules/[installationId]` | Inspect one installation that belongs to the exact ready workspace without extending the primary journey. | [surface](surfaces/agentos-module.md) |
| `openclaw-launch` | `/[locale]/launch/agentos/[workspaceId]/openclaw` | Issue and relay a safe short-lived launch for the exact ready workspace on an independent state axis. | [surface](surfaces/openclaw-launch.md) |
| `n8n-launch` | `/[locale]/launch/agentos/[workspaceId]/n8n` | Issue and relay a safe short-lived n8n launch for the exact ready workspace on an independent app-bound state axis. | [surface](surfaces/n8n-launch.md) |

## Data and operation map

| Operation | Owner | Input | Result |
|---|---|---|---|
| `orderCatalogItem` | backend | catalogItemSlug = nivo-ai-agent, catalogTierId | PendingPayment catalogue order, linked Unpaid invoice |
| `openAgentosPaymentWaypoint` | frontend | orderId, linked invoiceId, safe internal returnTo | Wallet route preserving exact AgentOS continuation |
| `payInvoice` | backend | invoiceId | paid invoice |
| `myAgentWorkspaceControlCenter` | backend | workspaceId | exact owner-scoped workspace aggregate |
| `installAgentosSolutionModule` | backend | workspaceId, moduleKey | installation in provisioning |
| `issueAgentWorkspaceAppLaunch` | backend | workspaceId, app = OPENCLAW | N8N | launchId, safe redirectUrl, expiresAt |
| `renewAgentWorkspaceAppLaunch` | backend | launchId | launchId, expiresAt |
| `revokeAgentWorkspaceAppLaunch` | backend | launchId | launchId, revoked |

## Explicit unknowns

- `wallet-order-correlation` — Which route or durable correlation contract carries orderId and invoiceId into Wallet and back to the exact AgentOS order? Impact: Current Wallet pays the first unpaid invoice, so AC-02 is not yet implemented.
- `post-ready-guard` — Which shared guard makes module detail and OpenClaw unavailable until the workspace status is ready? Impact: The branches exist under the workspace today, but the frontend does not enforce the requested readiness boundary.
- `launch-disconnected-transition` — Which observable event moves an active OpenClaw launch into disconnected? Impact: The state is declared but its production transition is not yet proven.

## LOADS

| Need | Read |
|---|---|
| Scope, terminology and exclusions | [overview.md](overview.md) |
| Actor permissions and ownership | [actors.md](actors.md) |
| One user journey | `flows/<flow-id>.md` |
| One renderable screen | `surfaces/<surface-id>.md` |
| Business invariants | [rules.md](rules.md) |
| State transitions | [states.md](states.md) |
| Entities, inputs, outputs and failures | [contracts.md](contracts.md) |
| Completion and regression proof | [acceptance.md](acceptance.md) |
| Machine rendering/query | [model.json](model.json) |
| Exact source provenance | [evidence.json](evidence.json) |

## Context rule

Do not load every module by default. `CONTEXT.md` plus the one flow or surface being changed is the normal prompt. `model.json` is authoritative for machines; Markdown files are generated projections. Unknowns remain unknown until routed source or an explicit owner decision resolves them.
