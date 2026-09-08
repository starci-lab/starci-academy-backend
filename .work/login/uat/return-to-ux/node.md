---
{
  "schema": "work/node@1",
  "id": "nivo.login.uat.return-to.ux",
  "kind": "uat.ux",
  "required": true,
  "dependsOn": ["nivo.login.implementation.frontend", "nivo.login.implementation.auth-integration"],
  "refs": ["repo.nivo-backend", "repo.nivo-frontend", "env.tino-uat", "identity.tino-owner", "fixture.nivo-agentos-uat"],
  "assertions": ["login-return-to-behavior"],
  "state": "suspended",
  "suspensionReason": "Source tests cover return address filtering, but no current TINO browser run proves the interrupted module journey or malicious-address fallback."
}
---
# Safe returnTo — UX

Start from a protected module Setup route, complete sign-in and verify navigation returns to that exact same-origin route. Repeat with absolute, protocol-relative and malformed return values and verify fallback to `/overview` without leaving the origin.
