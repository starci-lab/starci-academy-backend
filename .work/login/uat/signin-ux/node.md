---
{
  "schema": "work/node@1",
  "id": "nivo.login.uat.signin.ux",
  "kind": "uat.ux",
  "required": true,
  "dependsOn": ["nivo.login.implementation.frontend", "nivo.login.implementation.auth-integration"],
  "refs": ["repo.nivo-backend", "repo.nivo-frontend", "env.tino-uat", "identity.tino-owner", "fixture.nivo-agentos-uat"],
  "assertions": ["login-valid-behavior"],
  "state": "suspended",
  "suspensionReason": "No authorized current TINO browser run proves valid owner credentials produce a usable module session."
}
---
# Valid sign-in — UX

Resolve the existing sealed credentials at use time, submit through the rendered form, observe one successful request, authenticated session and reachable module route. Do not store credentials, tokens, cookies or browser storage in evidence.
