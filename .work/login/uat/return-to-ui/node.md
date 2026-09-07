---
{
  "schema": "work/node@1",
  "id": "nivo.login.uat.return-to.ui",
  "kind": "uat.ui",
  "required": true,
  "dependsOn": ["nivo.login.implementation.frontend", "nivo.login.implementation.auth-integration"],
  "refs": ["repo.nivo-backend", "repo.nivo-frontend", "env.tino-uat", "identity.tino-owner", "fixture.nivo-agentos-uat", "design.login-form"],
  "assertions": ["login-return-to-appearance"],
  "state": "suspended",
  "suspensionReason": "Login art direction and current TINO captures for the interrupted module route are unapproved/unavailable."
}
---
# Safe returnTo — UI

Capture the anonymous redirect from an installation Setup route, the login form and the same authenticated module destination. Any fallback for an unsafe return address must be visible only as normal safe navigation, not as leaked URL/error detail.
