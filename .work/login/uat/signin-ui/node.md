---
{
  "schema": "work/node@1",
  "id": "nivo.login.uat.signin.ui",
  "kind": "uat.ui",
  "required": true,
  "dependsOn": ["nivo.login.implementation.frontend", "nivo.login.implementation.auth-integration"],
  "refs": ["repo.nivo-backend", "repo.nivo-frontend", "env.tino-uat", "identity.tino-owner", "fixture.nivo-agentos-uat", "design.login-form"],
  "assertions": ["login-valid-appearance"],
  "state": "suspended",
  "suspensionReason": "Login art direction is not approved and no current TINO capture of the valid sign-in journey has been inspected."
}
---
# Valid sign-in — UI

Capture anonymous form, populated valid state, submit pending feedback and the authenticated module landing at approved desktop and compact viewports. Inspect labels, focus, contrast, error-free settled state and responsive layout.
