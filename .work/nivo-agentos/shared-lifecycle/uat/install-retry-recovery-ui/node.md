---
{
  "schema": "work/node@1",
  "id": "nivo.shared.uat.install-retry-recovery.ui",
  "kind": "uat.ui",
  "required": true,
  "dependsOn": ["nivo.shared.implementation.backend", "nivo.shared.implementation.frontend"],
  "refs": ["design.agentos-shared-ui", "repo.nivo-backend", "repo.nivo-frontend", "env.tino-uat", "identity.tino-owner", "fixture.nivo-agentos-uat"],
  "assertions": ["shared-install-retry-recovery-appearance"],
  "state": "suspended",
  "suspensionReason": "No approved shared art direction or current TINO screenshot evidence exists for install, retry and recovery states."
}
---
# Install, retry and recovery — UI

At approved desktop and compact viewports, capture the install trigger, in-progress state, bounded refusal with retry, recovered installation and unchanged unrelated module rows. Verify hierarchy, focus visibility, status semantics and responsive layout.
