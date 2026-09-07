---
{
  "schema": "work/node@1",
  "id": "nivo.login.implementation.frontend",
  "kind": "implementation",
  "required": true,
  "dependsOn": ["nivo.login.architecture.data-ownership", "nivo.login.architecture.api-contract", "nivo.login.architecture.code-scope"],
  "refs": ["repo.nivo-frontend", "design.login-form"],
  "assertions": ["login-frontend-implemented", "login-frontend-tests-pass"],
  "state": "suspended",
  "suspensionReason": "The form exists at the inspected frontend HEAD, but visual direction is unapproved and no current rendered/completion evidence is bound."
}
---
# Frontend sign-in form

## Observed source
`AuthenticationPanel` renders email/password, remember-me, provider and submit controls with field validation and pending/refused states. `AuthenticationPage` submits password sign-in, adopts a usable access token and follows only a safe return address. Unit/component tests exercise blank/invalid input, masked refusal and return-address filtering.

## Candidate work
Constrain the approved form to module-UAT sign-in, implement approved responsive/accessibility details, and avoid inheriting sign-up/forgot-password changes.

## Done when
Scoped tests and rendered review pass at the exact frontend commit after design approval.
