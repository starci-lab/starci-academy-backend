---
{
  "schema": "work/node@1",
  "id": "nivo.login.business.nfr",
  "kind": "business",
  "required": true,
  "refs": ["repo.nivo-backend", "repo.nivo-frontend"],
  "assertions": ["login-nfr-reviewed"],
  "state": "suspended",
  "suspensionReason": "Security/accessibility behavior is visible in source, but measurable sign-in NFRs and owner acceptance are absent."
}
---
# Non-functional requirements

## Candidate scope
The form is keyboard and assistive-technology operable, exposes accessible invalid/pending/refused states, prevents duplicate submit, never leaks raw credentials or refresh tokens to client storage, masks provider/transport detail, permits only same-origin relative return routes and restores or refuses session within an approved time budget.

## Done when
Security, accessibility, responsiveness, latency and recovery targets are measurable and approved.
