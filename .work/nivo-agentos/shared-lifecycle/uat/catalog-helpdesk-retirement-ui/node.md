---
{
  "schema": "work/node@1",
  "id": "nivo.shared.uat.catalog-helpdesk-retirement.ui",
  "kind": "uat.ui",
  "required": true,
  "dependsOn": ["nivo.shared.implementation.backend", "nivo.shared.implementation.frontend"],
  "refs": ["design.agentos-shared-ui", "repo.nivo-backend", "repo.nivo-frontend", "env.tino-uat", "identity.tino-owner", "fixture.nivo-agentos-uat"],
  "assertions": ["shared-catalog-helpdesk-retirement-appearance"],
  "state": "suspended",
  "suspensionReason": "Retirement intent is unresolved and current source still exposes catalogue UI and Support Desk wording; no approved replacement captures exist."
}
---
# Catalogue/helpdesk retirement — UI

## Contradiction to resolve
At frontend commit `f234d1abe6dd8f59fa4031959f8c55934e8997b0`, `AgentOSSolutionModuleCenter` and locale copy still expose catalogue/installed views, while module fixtures and defaults still use Support Desk labels. This is observed source, not evidence of intended retention or retirement.

## Candidate acceptance
After the owner defines retirement, capture all approved replacement entry points and the absence or explicit redirect of each retired surface.
