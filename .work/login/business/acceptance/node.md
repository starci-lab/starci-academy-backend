---
{
  "schema": "work/node@1",
  "id": "nivo.login.business.acceptance",
  "kind": "business",
  "required": true,
  "dependsOn": ["nivo.login.business.functional", "nivo.login.business.nfr", "nivo.login.business.rules"],
  "refs": ["repo.nivo-backend", "repo.nivo-frontend"],
  "assertions": ["login-acceptance-approved"],
  "state": "suspended",
  "suspensionReason": "Functional, NFR and rule candidates remain unapproved, so login acceptance is not established."
}
---
# Sign-in acceptance boundary

Acceptance covers valid credentials, invalid credentials, safe return to the interrupted module route, and session persistence/restoration after reload. Each journey requires actual TINO UI and behavior evidence; source tests and design screenshots do not constitute approval or UAT.
