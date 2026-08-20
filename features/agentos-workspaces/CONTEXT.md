# AgentOS workspace lifecycle and control center

> Business identity: `nivo/agentos-workspaces@98099a2721d4b93505365cc4c9fc1f7259afe7a31e8d726d5044f1edb0eb9de6`
>
> Source heads: `fe@97eec8c5bb4c`, `be@947c6f4a117e`
>
> Load this file first. Load only the modules named by the current task.

## Decision capsule

**Purpose.** An authenticated owner orders an AgentOS workspace through billing, observes fulfillment, and manages the exact owned workspace across overview, solutions, applications, infrastructure, operations and access surfaces.

**Primary actor.** Authenticated AgentOS owner

**Primary outcome.** The ready workspace appears in AgentOS management

**Never does.** Runnable update, backup, reset or rebuild controls not published by Core GraphQL

## Invariants

- `BR-01` — Workspace state is settled from the latest owner-scoped order, invoice and workspace facts, with the later workspace fact taking precedence.
- `BR-02` — Secure OpenClaw access is issued, renewed and revoked as a short-lived launch rather than exposing reusable credentials.

## Primary flow

```text
request → submitting → awaiting-payment → accepted
```

## Surface map

| Surface | Route | Owns | Module |
|---|---|---|---|
| `agentos-order` | `/[locale]/agentos | /[locale]/agentos/orders/[orderId]` | Request or resume one AgentOS order until a workspace is ready. | [surface](surfaces/agentos-order.md) |
| `agentos-workspace` | `/[locale]/agentos/workspaces/[workspaceId]` | Manage one exact owned workspace across its product and runtime areas. | [surface](surfaces/agentos-workspace.md) |
| `agentos-solution-detail` | `/[locale]/agentos/workspaces/[workspaceId]/modules/[installationId]` | Inspect one owned immutable module installation and its generated bindings. | [surface](surfaces/agentos-solution-detail.md) |

## Data and operation map

| Operation | Owner | Input | Result |
|---|---|---|---|
| `orderAgentOs` | backend | catalogItemSlug, catalogTierId | catalog order |
| `myAgentWorkspaceControlCenter` | backend | workspaceId | workspace aggregate snapshot |
| `installAgentosSolutionModule` | backend | workspaceId, moduleKey | installation in provisioning |
| `issueAgentWorkspaceAppLaunch` | backend | workspaceId | short-lived secure launch |

## Explicit unknowns

- `workspace-operation-mutations` — When will update, plan change, backup, reset and rebuild mutations become public? Impact: The control center can read runtime state but intentionally does not render fake runnable controls.

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
