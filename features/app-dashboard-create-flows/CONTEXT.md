# Separated app dashboards and create flows

> Business identity: `nivo/app-dashboard-create-flows@ab4229558269b09532a106f599f59806372cc5bf517861b90846d29a39c91f00`
>
> Source heads: authority `pending` · `fe@894e608bba73`
>
> Load this file first. Load only the modules named by the current task.

## Decision capsule

**Purpose.** Authenticated owners manage existing AgentOS workspaces and Template Apps on dashboard-only routes, start new resources on separate pre-persistence create routes, and resume persisted resources only on order-, workspace-, or site-owned routes.

**Primary actor.** Authenticated Nivo app owner

**Primary outcome.** AgentOS dashboard management, pre-persistence creation, persisted-order resume and terminal workspace management each have one unambiguous route owner.

**Never does.** Backend API, schema or lifecycle changes.

## Invariants

- `BR-01` — AgentOS and Template Apps dashboards manage and navigate existing instances; they never render an embedded create or provisioning form.
- `BR-02` — A create route is pre-persistence and therefore carries no orderId, workspaceId or siteId.
- `BR-03` — AgentOS creation begins at /:locale/agentos/create and, after persistence, resumes at /:locale/agentos/orders/:orderId before terminal management at /:locale/agentos/workspaces/:workspaceId.
- `BR-04` — A templateKey is allowed on /:locale/apps/create/:templateKey because it identifies the chosen template, not a persisted app instance.
- `BR-05` — Template App creation resumes at /:locale/apps/:siteId/provisioning after site persistence and terminates at /:locale/apps/:siteId; it does not invent a separate order identity.

## Primary flow

```text
dashboard-ready → create-ready → resource-resume → resource-ready
```

## Surface map

| Surface | Route | Owns | Module |
|---|---|---|---|
| `agentos-dashboard` | `/:locale/agentos` | Manage existing AgentOS workspaces and navigate to the separate create flow. | [surface](surfaces/agentos-dashboard.md) |
| `agentos-create` | `/:locale/agentos/create` | Collect and submit a new AgentOS request before an order exists. | [surface](surfaces/agentos-create.md) |
| `agentos-order-resume` | `/:locale/agentos/orders/:orderId` | Resume one persisted AgentOS order through payment and provisioning. | [surface](surfaces/agentos-order-resume.md) |
| `agentos-workspace` | `/:locale/agentos/workspaces/:workspaceId` | Manage one exact persisted AgentOS workspace. | [surface](surfaces/agentos-workspace.md) |
| `apps-dashboard` | `/:locale/apps` | Manage existing Template Apps and choose an eligible template for a separate create flow. | [surface](surfaces/apps-dashboard.md) |
| `template-app-create` | `/:locale/apps/create/:templateKey` | Configure the selected template and create a site before any persisted site route is available. | [surface](surfaces/template-app-create.md) |
| `template-app-provisioning` | `/:locale/apps/:siteId/provisioning` | Resume deployment for one persisted Template App site. | [surface](surfaces/template-app-provisioning.md) |
| `template-app-control-center` | `/:locale/apps/:siteId` | Manage one exact persisted Template App site. | [surface](surfaces/template-app-control-center.md) |

## Data and operation map

| Operation | Owner | Input | Result |
|---|---|---|---|
| `Open AgentOS create route` | frontend | locale | /:locale/agentos/create |
| `Continue persisted AgentOS order` | frontend | locale, orderId | /:locale/agentos/orders/:orderId |
| `Open selected Template App create route` | frontend | locale, templateKey | /:locale/apps/create/:templateKey |
| `Continue persisted Template App provisioning` | frontend | locale, siteId | /:locale/apps/:siteId/provisioning |

## Explicit unknowns

- No unresolved question is recorded.

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
