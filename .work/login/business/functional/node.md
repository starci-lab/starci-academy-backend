---
{
  "schema": "work/node@1",
  "id": "nivo.login.business.functional",
  "kind": "business",
  "required": true,
  "refs": ["repo.nivo-backend", "repo.nivo-frontend"],
  "assertions": ["login-functional-reviewed"],
  "state": "suspended",
  "suspensionReason": "The sign-in behavior is imported from source for review; the owner has not approved it as the module-UAT login requirement."
}
---
# Functional behavior

## Candidate scope
An anonymous TINO owner enters email and password, receives field-level validation, submits once, sees a generic refusal or a usable authenticated session, and returns to the same safe module route that requested authentication. A later reload restores the session through the refresh-cookie flow.

## Exclusions
Sign-up, forgot password, OTP sign-in, social-provider completion and 2FA UI are outside this login-form candidate.

## Done when
The owner confirms the actor, inputs, outcomes, excluded journeys and module-UAT entry/return behavior.
