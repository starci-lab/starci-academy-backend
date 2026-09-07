---
{
  "schema": "work/node@1",
  "id": "nivo.shared.uat.multi-install-isolation.ui",
  "kind": "uat.ui",
  "required": true,
  "dependsOn": ["nivo.shared.implementation.backend", "nivo.shared.implementation.frontend"],
  "refs": ["design.agentos-shared-ui", "repo.nivo-backend", "repo.nivo-frontend", "env.tino-uat", "identity.tino-owner", "fixture.nivo-agentos-uat"],
  "assertions": ["shared-multi-install-isolation-appearance"],
  "state": "suspended",
  "suspensionReason": "No approved shared art direction or current paired-installation captures demonstrate visible identity and isolated status."
}
---
# Multi-install isolation — UI

Capture at least two installation rows and their detail/setup/test surfaces with unambiguous installation identity, independent status/progress and no visual data bleed at desktop and compact viewports.
