---
{
  "schema": "work/node@1",
  "id": "nivo.login.architecture.api-contract",
  "kind": "architecture",
  "required": true,
  "dependsOn": ["nivo.login.business.acceptance"],
  "refs": ["repo.nivo-backend", "repo.nivo-frontend"],
  "assertions": ["login-api-contract-reviewed"],
  "state": "suspended",
  "suspensionReason": "Current signIn/refreshSession behavior is observed but not approved as the candidate compatibility contract."
}
---
# API contract

## Observed source
Frontend calls GraphQL `signIn(input: {email,password})` and `refreshSession`; the auth payload contains access-token/2FA state while refresh token transport is cookie-only. Backend input validation checks email/string/minimum password; sign-in verifies the issued access token, syncs the user and refuses a usable session when 2FA remains.

## Candidate contract
Responses distinguish success, generic refusal and pending 2FA without leaking provider detail. Cookie attributes, CORS/credentials behavior and refresh failure semantics must be compatibility-reviewed against the actual TINO origin.
