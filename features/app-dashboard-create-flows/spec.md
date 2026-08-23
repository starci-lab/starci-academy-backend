# Separated app dashboards and create flows

> Business head: `03017c0b919f9d0c2d81c364480a8649d88b12465d6e1d845372b76b16f61d88`
>
> This document is generated from the immutable business model. Update the model through `starci-business-analyze`; do not hand-edit this view.

## 1. Overview

Authenticated owners manage existing AgentOS workspaces and Template Apps on dashboard-only routes, start new resources on separate pre-persistence create routes, and resume persisted resources only on order-, workspace-, or site-owned routes.

Included:
- AgentOS management dashboard at /:locale/agentos without an embedded create or provisioning form.
- AgentOS pre-persistence creation at /:locale/agentos/create and post-persistence resume at /:locale/agentos/orders/:orderId.
- AgentOS terminal management at /:locale/agentos/workspaces/:workspaceId.
- Template Apps management dashboard at /:locale/apps without an embedded create or provisioning form.
- Template App pre-persistence creation at /:locale/apps/create/:templateKey and post-persistence resume at /:locale/apps/:siteId/provisioning.
- Template App terminal management at /:locale/apps/:siteId.

Excluded:
- Backend API, schema or lifecycle changes.
- Changes to AgentOS order, payment or provisioning semantics.
- Changes to Template App deployment semantics or template eligibility.
- Persisted order, workspace or site identifiers on a create route.
- A generic Template App order route that the current site-creation contract does not return.

## 2. Source heads

| Role | Repository | Head |
|---|---|---|
| fe | https://github.com/starci-lab/nivo-fe.git | `894e608bba73d791e5d2767cdc420da770c8c42b` |

## 3. Actors and access

### Authenticated Nivo app owner

- Manage existing AgentOS workspaces and Template Apps from product dashboards.
- Start a new AgentOS order or selected Template App from a dedicated pre-persistence route.
- Resume a persisted resource from its order, workspace or site route.

Evidence: `EV-001`, `EV-003`, `EV-004`, `EV-005`, `EV-009`, `EV-010`

## 4. Entry points and surfaces

### AgentOS

- ID: `agentos-dashboard`
- Route: `/:locale/agentos`
- Purpose: Manage existing AgentOS workspaces and navigate to the separate create flow.
- Regions: `agentos-workspace-collection`
- Navigation: Create workspace (available)

Evidence: `EV-001`, `EV-002`, `EV-004`

### Create AgentOS workspace

- ID: `agentos-create`
- Route: `/:locale/agentos/create`
- Purpose: Collect and submit a new AgentOS request before an order exists.
- Regions: `agentos-create-flow`
- Navigation: Back to AgentOS (available)

Evidence: `EV-001`, `EV-003`

### AgentOS order

- ID: `agentos-order-resume`
- Route: `/:locale/agentos/orders/:orderId`
- Purpose: Resume one persisted AgentOS order through payment and provisioning.
- Regions: `agentos-order-flow`
- Navigation: none

Evidence: `EV-001`, `EV-003`

### AgentOS workspace

- ID: `agentos-workspace`
- Route: `/:locale/agentos/workspaces/:workspaceId`
- Purpose: Manage one exact persisted AgentOS workspace.
- Regions: `agentos-workspace-management`
- Navigation: none

Evidence: `EV-001`, `EV-004`

### Apps

- ID: `apps-dashboard`
- Route: `/:locale/apps`
- Purpose: Manage existing Template Apps and choose an eligible template for a separate create flow.
- Regions: `owned-app-collection`
- Navigation: Build template (available)

Evidence: `EV-001`, `EV-005`, `EV-007`, `EV-010`

### Create Template App

- ID: `template-app-create`
- Route: `/:locale/apps/create/:templateKey`
- Purpose: Configure the selected template and create a site before any persisted site route is available.
- Regions: `template-create-flow`
- Navigation: Back to Apps (available)

Evidence: `EV-001`, `EV-006`, `EV-008`

### Template App provisioning

- ID: `template-app-provisioning`
- Route: `/:locale/apps/:siteId/provisioning`
- Purpose: Resume deployment for one persisted Template App site.
- Regions: `template-provisioning-flow`
- Navigation: none

Evidence: `EV-001`, `EV-008`, `EV-009`

### Template App

- ID: `template-app-control-center`
- Route: `/:locale/apps/:siteId`
- Purpose: Manage one exact persisted Template App site.
- Regions: `template-app-management`
- Navigation: none

Evidence: `EV-001`, `EV-010`

## 5. Business flows

### Manage and create AgentOS workspaces

Trigger: An authenticated owner opens the AgentOS product dashboard or chooses its create action.

1. **app-owner** — Review existing AgentOS workspaces on the management-only dashboard. → The owner can manage an existing workspace or navigate to the separate create route.
2. **app-owner** — Open /:locale/agentos/create without a persisted identifier. → A new AgentOS request can be entered independently of the workspace list.
3. **app-owner** — Continue on /:locale/agentos/orders/:orderId after order persistence. → The persisted order owns its payment and provisioning resume state.
4. **app-owner** — Open /:locale/agentos/workspaces/:workspaceId after workspace readiness. → The persisted workspace owns its terminal management experience.

Outcomes:
- AgentOS dashboard management, pre-persistence creation, persisted-order resume and terminal workspace management each have one unambiguous route owner.

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`

### Manage and create Template Apps

Trigger: An authenticated owner opens the Apps dashboard or chooses a catalogue template to build.

1. **app-owner** — Review existing sites and available templates on the management-only Apps dashboard. → The owner can open an existing site or navigate to the selected template create route.
2. **app-owner** — Open /:locale/apps/create/:templateKey before a site exists. → The selected template provides create context without pretending to be a persisted site.
3. **app-owner** — Continue on /:locale/apps/:siteId/provisioning after site persistence. → The persisted site owns deployment resume state.
4. **app-owner** — Open /:locale/apps/:siteId after deployment readiness. → The persisted site owns its terminal management experience.

Outcomes:
- Template Apps dashboard management, template-keyed creation, site-owned provisioning and terminal site management each have one unambiguous route owner.

Evidence: `EV-001`, `EV-005`, `EV-006`, `EV-007`, `EV-008`, `EV-009`, `EV-010`

## 6. Business rules

### BR-01

AgentOS and Template Apps dashboards manage and navigate existing instances; they never render an embedded create or provisioning form.

Strength: **confirmed** · Evidence: `EV-001`, `EV-002`, `EV-005`

### BR-02

A create route is pre-persistence and therefore carries no orderId, workspaceId or siteId.

Strength: **confirmed** · Evidence: `EV-001`, `EV-003`, `EV-004`, `EV-006`, `EV-009`, `EV-010`

### BR-03

AgentOS creation begins at /:locale/agentos/create and, after persistence, resumes at /:locale/agentos/orders/:orderId before terminal management at /:locale/agentos/workspaces/:workspaceId.

Strength: **confirmed** · Evidence: `EV-001`, `EV-003`, `EV-004`

### BR-04

A templateKey is allowed on /:locale/apps/create/:templateKey because it identifies the chosen template, not a persisted app instance.

Strength: **confirmed** · Evidence: `EV-001`, `EV-006`, `EV-007`

### BR-05

Template App creation resumes at /:locale/apps/:siteId/provisioning after site persistence and terminates at /:locale/apps/:siteId; it does not invent a separate order identity.

Strength: **confirmed** · Evidence: `EV-001`, `EV-008`, `EV-009`, `EV-010`

### BR-06

The route split changes frontend composition only and preserves the existing backend lifecycle and eligibility contracts.

Strength: **confirmed** · Evidence: `EV-001`, `EV-003`, `EV-008`, `EV-009`

## 7. State model

- **Dashboard loading** (`dashboard-loading`, pending) → dashboard-empty, dashboard-ready, dashboard-refused — `EV-001`, `EV-002`, `EV-005`
- **Dashboard empty** (`dashboard-empty`, empty) → create-ready — `EV-001`
- **Dashboard ready** (`dashboard-ready`, success) → create-ready, resource-ready — `EV-001`, `EV-004`, `EV-005`, `EV-010`
- **Dashboard refused** (`dashboard-refused`, error) → dashboard-loading — `EV-001`
- **Create ready** (`create-ready`, initial) → create-submitting — `EV-001`, `EV-006`
- **Create submitting** (`create-submitting`, pending) → create-refused, resource-resume — `EV-001`, `EV-008`
- **Create refused** (`create-refused`, error) → create-ready — `EV-001`, `EV-008`
- **Persisted resource resume** (`resource-resume`, partial) → resource-ready — `EV-001`, `EV-003`, `EV-009`
- **Persisted resource ready** (`resource-ready`, success) → dashboard-ready — `EV-001`, `EV-004`, `EV-010`

## 8. Entities and data

- **Pre-persistence create context**: productFamily, optional templateKey, no persisted resource identifier — `EV-001`, `EV-006`
- **Persisted AgentOS order reference**: orderId — `EV-001`, `EV-003`
- **Persisted Template App site reference**: siteId — `EV-001`, `EV-008`, `EV-009`, `EV-010`

## 9. Operations and APIs

- **Open AgentOS create route** (redirect, frontend) — input: locale; output: /:locale/agentos/create; failures: Create route cannot be resolved — `EV-001`, `EV-002`
- **Continue persisted AgentOS order** (redirect, frontend) — input: locale, orderId; output: /:locale/agentos/orders/:orderId; failures: Order persistence is refused, Persisted order identity is unavailable — `EV-001`, `EV-003`
- **Open selected Template App create route** (redirect, frontend) — input: locale, templateKey; output: /:locale/apps/create/:templateKey; failures: Template is unavailable, Create route cannot be resolved — `EV-001`, `EV-006`, `EV-007`
- **Continue persisted Template App provisioning** (redirect, frontend) — input: locale, siteId; output: /:locale/apps/:siteId/provisioning; failures: Site creation or publication is refused, Persisted site identity is unavailable — `EV-001`, `EV-008`, `EV-009`

## 10. Acceptance conditions

- **AC-01** The AgentOS and Template Apps dashboard routes never render an embedded create or provisioning form. — `EV-001`, `EV-002`, `EV-005`
- **AC-02** Each dashboard create action navigates to its dedicated pre-persistence route: /:locale/agentos/create or /:locale/apps/create/:templateKey. — `EV-001`, `EV-006`, `EV-007`
- **AC-03** Neither create route carries orderId, workspaceId or siteId; templateKey remains selection context only. — `EV-001`, `EV-003`, `EV-004`, `EV-006`, `EV-009`, `EV-010`
- **AC-04** After AgentOS order persistence, frontend navigation replaces the create route with /:locale/agentos/orders/:orderId. — `EV-001`, `EV-003`
- **AC-05** After Template App site persistence, frontend navigation replaces the create route with /:locale/apps/:siteId/provisioning. — `EV-001`, `EV-008`, `EV-009`
- **AC-06** Direct reload and resume remain owned by the persisted AgentOS order, AgentOS workspace or Template App site routes. — `EV-001`, `EV-003`, `EV-004`, `EV-009`, `EV-010`

## 11. Explicit unknowns

No unresolved question is recorded.

## 12. Evidence index

| ID | Role | Source | Kind | Claim |
|---|---|---|---|---|
| EV-001 | owner | `decision:1a64ef74f4cc208f2e4a26ce7a1fff0887c2fe40f78fe111b75b6accc36dbd53` | owner-decision | The owner approved separate management dashboards and pre-persistence create routes for both AgentOS and Template Apps, with persisted resources resuming only on order-, workspace-, or site-owned routes. |
| EV-002 | fe | `apps/app/src/app/[locale]/(console)/agentos/page.tsx:1` | route | The current AgentOS root route mounts new-order mode, demonstrating that management and creation are presently co-located at /agentos. |
| EV-003 | fe | `apps/app/src/app/[locale]/(console)/agentos/orders/[orderId]/page.tsx:1` | route | The frontend already owns a persisted AgentOS order resume route keyed by orderId. |
| EV-004 | fe | `apps/app/src/app/[locale]/(console)/agentos/workspaces/[workspaceId]/page.tsx:1` | route | The frontend already owns a terminal AgentOS workspace route keyed by workspaceId. |
| EV-005 | fe | `apps/app/src/app/[locale]/(console)/apps/page.tsx:1` | route | The frontend already owns the Apps dashboard route at /apps. |
| EV-006 | fe | `apps/app/src/app/[locale]/(console)/apps/new/[templateKey]/page.tsx:1` | route | The current Template App pre-persistence entry is keyed by templateKey and mounts new-request mode. |
| EV-007 | fe | `apps/app/src/components/pages/AppsPage/index.tsx:240` | ui | The Apps page already distinguishes template selection navigation from persisted site navigation. |
| EV-008 | fe | `apps/app/src/components/blocks/provisioning/TemplateAppProvisioning/index.tsx:174` | contract | Template App creation returns a siteId and replaces the route with the site-owned provisioning path after persistence. |
| EV-009 | fe | `apps/app/src/app/[locale]/(console)/apps/[siteId]/provisioning/page.tsx:1` | route | The frontend already owns a persisted Template App provisioning resume route keyed by siteId. |
| EV-010 | fe | `apps/app/src/app/[locale]/(console)/apps/[siteId]/page.tsx:1` | route | The frontend already owns a terminal Template App management route keyed by siteId. |
