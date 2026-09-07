---
{
  "schema": "work/node@1",
  "id": "nivo.login.architecture.data-ownership",
  "kind": "architecture",
  "required": true,
  "dependsOn": ["nivo.login.business.acceptance"],
  "refs": ["repo.nivo-backend", "repo.nivo-frontend"],
  "assertions": ["login-data-ownership-reviewed"],
  "state": "suspended",
  "suspensionReason": "Observed token/session ownership is mapped, but architecture and business acceptance are pending."
}
---
# Data ownership

## Observed source
Keycloak owns credential verification and refresh-token issuance; backend verifies token claims and syncs the local user. The resolver writes the refresh token as an HttpOnly cookie. Frontend `SessionProvider` retains the access token only in memory, restores it through `refreshSession`, and holds safe `returnTo` transiently in session storage.

## Candidate decision
No credential, refresh token, raw cookie or browser storage state belongs in Work/evidence. The identity resource is a custody reference only.
