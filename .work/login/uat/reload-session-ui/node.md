---
{
  "schema": "work/node@1",
  "id": "nivo.login.uat.reload-session.ui",
  "kind": "uat.ui",
  "required": true,
  "dependsOn": ["nivo.login.implementation.frontend", "nivo.login.implementation.auth-integration"],
  "refs": ["repo.nivo-backend", "repo.nivo-frontend", "env.tino-uat", "identity.tino-owner", "fixture.nivo-agentos-uat", "design.login-form"],
  "assertions": ["login-reload-session-appearance"],
  "state": "suspended",
  "suspensionReason": "Login/session art direction is not approved and no current TINO capture covers restoring, restored and refused session states."
}
---
# Reload/session — UI

Capture the module page before reload, the bounded restoring state and the restored authenticated view. Also capture an expired/refused refresh outcome returning safely to login without flashing protected module data.
