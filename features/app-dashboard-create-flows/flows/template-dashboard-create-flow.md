# Flow · Manage and create Template Apps

> ID: `template-dashboard-create-flow` · Trigger: An authenticated owner opens the Apps dashboard or chooses a catalogue template to build.

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | `app-owner` | `apps-dashboard` | Review existing sites and available templates on the management-only Apps dashboard. | The owner can open an existing site or navigate to the selected template create route. |
| 2 | `app-owner` | `template-app-create` | Open /:locale/apps/create/:templateKey before a site exists. | The selected template provides create context without pretending to be a persisted site. |
| 3 | `app-owner` | `template-app-provisioning` | Continue on /:locale/apps/:siteId/provisioning after site persistence. | The persisted site owns deployment resume state. |
| 4 | `app-owner` | `template-app-control-center` | Open /:locale/apps/:siteId after deployment readiness. | The persisted site owns its terminal management experience. |

## Outcomes

- Template Apps dashboard management, template-keyed creation, site-owned provisioning and terminal site management each have one unambiguous route owner.

Evidence: `EV-001`, `EV-005`, `EV-006`, `EV-007`, `EV-008`, `EV-009`, `EV-010`
