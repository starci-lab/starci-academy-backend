---
{
  "schema": "work/node@1",
  "id": "nivo.shared.uat.setup-test-apply-rollback.ui",
  "kind": "uat.ui",
  "required": true,
  "dependsOn": ["nivo.shared.implementation.backend", "nivo.shared.implementation.frontend"],
  "refs": ["design.agentos-shared-ui", "repo.nivo-backend", "repo.nivo-frontend", "env.tino-uat", "identity.tino-owner", "fixture.nivo-agentos-uat"],
  "assertions": ["shared-setup-test-apply-rollback-appearance"],
  "state": "suspended",
  "suspensionReason": "No approved shared art direction or current TINO captures cover Setup, Test, Apply and Rollback states."
}
---
# Setup → Test → Apply/Rollback — UI

Capture setup conversation/context/version panes, exact test status/evidence, Apply gating, active version, rollback choice and settled outcome. Verify stale/failed results are visually distinct and controls expose disabled/pending/refused states accessibly.
