---
{
  "schema": "work/node@1",
  "id": "nivo.login.business.rules",
  "kind": "business",
  "required": true,
  "refs": ["repo.nivo-backend", "repo.nivo-frontend"],
  "assertions": ["login-rules-reviewed"],
  "state": "suspended",
  "suspensionReason": "Sign-in and return/session rules are inferred from inspected code and tests, not accepted business policy."
}
---
# Sign-in rules

## Candidate rules
- Email must be valid and password must satisfy the client/API minimum before submission.
- Invalid credentials produce a generic refusal and no authenticated route transition.
- A usable session requires a verified access token; an enrolled 2FA account receives a challenge instead of access/cookie.
- `returnTo` must be a safe relative path on this origin; unsafe or malformed values fall back to `/overview`.
- Access tokens remain in memory; reload restoration uses the HttpOnly refresh cookie and becomes anonymous on refusal.

## Done when
The product/security owners accept these rules and settle the UAT owner's 2FA/remember-me policy.
