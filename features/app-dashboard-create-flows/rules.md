# Business rules · Separated app dashboards and create flows

## BR-01

AgentOS and Template Apps dashboards manage and navigate existing instances; they never render an embedded create or provisioning form.

- Strength: `confirmed`
- Evidence: `EV-001`, `EV-002`, `EV-005`

## BR-02

A create route is pre-persistence and therefore carries no orderId, workspaceId or siteId.

- Strength: `confirmed`
- Evidence: `EV-001`, `EV-003`, `EV-004`, `EV-006`, `EV-009`, `EV-010`

## BR-03

AgentOS creation begins at /:locale/agentos/create and, after persistence, resumes at /:locale/agentos/orders/:orderId before terminal management at /:locale/agentos/workspaces/:workspaceId.

- Strength: `confirmed`
- Evidence: `EV-001`, `EV-003`, `EV-004`

## BR-04

A templateKey is allowed on /:locale/apps/create/:templateKey because it identifies the chosen template, not a persisted app instance.

- Strength: `confirmed`
- Evidence: `EV-001`, `EV-006`, `EV-007`

## BR-05

Template App creation resumes at /:locale/apps/:siteId/provisioning after site persistence and terminates at /:locale/apps/:siteId; it does not invent a separate order identity.

- Strength: `confirmed`
- Evidence: `EV-001`, `EV-008`, `EV-009`, `EV-010`

## BR-06

The route split changes frontend composition only and preserves the existing backend lifecycle and eligibility contracts.

- Strength: `confirmed`
- Evidence: `EV-001`, `EV-003`, `EV-008`, `EV-009`
