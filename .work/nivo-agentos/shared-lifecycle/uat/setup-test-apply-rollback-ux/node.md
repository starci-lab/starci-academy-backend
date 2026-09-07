---
{
  "schema": "work/node@1",
  "id": "nivo.shared.uat.setup-test-apply-rollback.ux",
  "kind": "uat.ux",
  "required": true,
  "dependsOn": ["nivo.shared.implementation.backend", "nivo.shared.implementation.frontend"],
  "refs": ["repo.nivo-backend", "repo.nivo-frontend", "env.tino-uat", "identity.tino-owner", "fixture.nivo-agentos-uat"],
  "assertions": ["shared-setup-test-apply-rollback-behavior"],
  "state": "suspended",
  "suspensionReason": "No current TINO browser journey proves the exact setup/test generation gate, activation, rollback and persistence behavior."
}
---
# Setup → Test → Apply/Rollback — UX

Drive a setup revision, confirm required gates, run acceptance tests against the exact digest/generations, apply the eligible context, reload, then roll back to a prior eligible context and reload again. Negative checks must refuse stale/failed test evidence without changing the active context.
