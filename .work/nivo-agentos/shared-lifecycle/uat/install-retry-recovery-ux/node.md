---
{
  "schema": "work/node@1",
  "id": "nivo.shared.uat.install-retry-recovery.ux",
  "kind": "uat.ux",
  "required": true,
  "dependsOn": ["nivo.shared.implementation.backend", "nivo.shared.implementation.frontend"],
  "refs": ["repo.nivo-backend", "repo.nivo-frontend", "env.tino-uat", "identity.tino-owner", "fixture.nivo-agentos-uat"],
  "assertions": ["shared-install-retry-recovery-behavior"],
  "state": "suspended",
  "suspensionReason": "The install/retry/recovery journey has not been driven in a current isolated browser session on TINO."
}
---
# Install, retry and recovery — UX

Drive one logical install through success, a controlled refusal, an idempotent retry and recovery. Confirm the same logical installation is reused, actionable feedback remains available, prior state is preserved and no unrelated installation changes.
