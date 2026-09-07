---
{
  "schema": "work/node@1",
  "id": "nivo.login.uat.invalid.ux",
  "kind": "uat.ux",
  "required": true,
  "dependsOn": ["nivo.login.implementation.frontend", "nivo.login.implementation.auth-integration"],
  "refs": ["repo.nivo-backend", "repo.nivo-frontend", "env.tino-uat", "identity.tino-owner", "fixture.nivo-agentos-uat"],
  "assertions": ["login-invalid-behavior"],
  "state": "suspended",
  "suspensionReason": "No current TINO browser run proves client-side validation blocks transport and invalid credentials create neither cookie nor authenticated navigation."
}
---
# Invalid sign-in — UX

Drive empty/invalid fields and verify no request is sent; then submit an authorized invalid test credential and confirm a generic refusal, no module navigation, no authenticated state and no secret/provider detail in the UI or retained evidence.
