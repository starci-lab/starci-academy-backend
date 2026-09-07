---
{
  "schema": "work/node@1",
  "id": "nivo.login.uat.invalid.ui",
  "kind": "uat.ui",
  "required": true,
  "dependsOn": ["nivo.login.implementation.frontend", "nivo.login.implementation.auth-integration"],
  "refs": ["repo.nivo-backend", "repo.nivo-frontend", "env.tino-uat", "identity.tino-owner", "fixture.nivo-agentos-uat", "design.login-form"],
  "assertions": ["login-invalid-appearance"],
  "state": "suspended",
  "suspensionReason": "Login art direction is not approved and no current TINO images cover field validation and generic credential refusal."
}
---
# Invalid sign-in — UI

Capture empty/invalid field errors and a generic invalid-credential refusal. Inspect field association, `aria-invalid`, live feedback, focus recovery, preserved safe input and absence of provider/transport details.
