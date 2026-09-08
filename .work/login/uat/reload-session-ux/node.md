---
{
  "schema": "work/node@1",
  "id": "nivo.login.uat.reload-session.ux",
  "kind": "uat.ux",
  "required": true,
  "dependsOn": ["nivo.login.implementation.frontend", "nivo.login.implementation.auth-integration"],
  "refs": ["repo.nivo-backend", "repo.nivo-frontend", "env.tino-uat", "identity.tino-owner", "fixture.nivo-agentos-uat"],
  "assertions": ["login-reload-session-behavior"],
  "state": "suspended",
  "suspensionReason": "Session restoration is implemented in source but has not been driven and read back on the current TINO served build."
}
---
# Reload/session — UX

After a valid sign-in, reload the module route and verify the in-memory access token is restored only through the HttpOnly refresh-cookie exchange, the protected page remains reachable and no secret enters client storage. Repeat with a refused/expired refresh and verify anonymous state plus safe login redirect.
