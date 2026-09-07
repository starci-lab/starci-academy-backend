---
{
  "schema": "work/node@1",
  "id": "nivo.shared.uat.multi-install-isolation.ux",
  "kind": "uat.ux",
  "required": true,
  "dependsOn": ["nivo.shared.implementation.backend", "nivo.shared.implementation.frontend"],
  "refs": ["repo.nivo-backend", "repo.nivo-frontend", "env.tino-uat", "identity.tino-owner", "fixture.nivo-agentos-uat"],
  "assertions": ["shared-multi-install-isolation-behavior"],
  "state": "suspended",
  "suspensionReason": "No current isolated TINO run proves concurrent operations remain scoped to separate installation and data namespaces."
}
---
# Multi-install isolation — UX

Using two distinct installation fixtures, start overlapping setup/test or recovery operations, switch between their routes, reload, and read back each installation. Confirm events, drafts, tests, active context, pending state and outcomes never cross installation boundaries.
