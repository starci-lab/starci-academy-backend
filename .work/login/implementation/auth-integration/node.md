---
{
  "schema": "work/node@1",
  "id": "nivo.login.implementation.auth-integration",
  "kind": "implementation",
  "required": true,
  "dependsOn": ["nivo.login.architecture.data-ownership", "nivo.login.architecture.api-contract", "nivo.login.architecture.code-scope"],
  "refs": ["repo.nivo-backend", "repo.nivo-frontend"],
  "assertions": ["login-auth-integration-implemented", "login-auth-integration-tests-pass"],
  "state": "suspended",
  "suspensionReason": "Auth/session code exists at the inspected HEADs, but the candidate contract, TINO cookie/origin behavior and current tests are not verified as completion."
}
---
# Authentication integration

## Observed source
Backend `SignInService` performs password grant, signature/issuer/expiry verification, local user sync and the 2FA gate; `SignInResolver` writes the refresh cookie only on a usable session. Frontend `SessionProvider` restores through `refreshSession` after reload and becomes anonymous on non-success.

## Candidate work
Verify cookie/CORS settings for TINO, generic refusal mapping, session restoration and module-route return behavior without exposing secret-bearing artifacts.

## Done when
Current integration tests and exact-commit evidence prove the approved contract.
