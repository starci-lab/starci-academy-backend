---
{
  "schema": "work/node@1",
  "id": "nivo.login",
  "kind": "business",
  "required": true,
  "refs": ["repo.nivo-backend", "repo.nivo-frontend", "design.login-form"]
}
---
# Module-UAT sign-in

## Pilot boundary
The sign-in form and session handoff needed to enter authenticated AgentOS module UAT. Sign-up, forgot-password, password reset, OTP enrollment and provider-specific design expansion are excluded.

## Observed source mapping
- Frontend observation at `repo.nivo-frontend` commit `f234d1abe6dd8f59fa4031959f8c55934e8997b0`: `/authentication` uses `AuthenticationPage` and `AuthenticationPanel`; email/password submit calls `signIn`, safe `returnTo` is retained on-origin, and `SessionProvider` restores access from the backend refresh-session cookie flow.
- Backend observation at `repo.nivo-backend` commit `51248f75e0bf1c36a088afb57a04b2d7440a62c4`: `SignInService` performs password grant, verifies the access token, syncs the user and gates enrolled 2FA; `SignInResolver` writes the refresh cookie only for a usable session.
- Design observation: `design-plans/app-authentication/design-record.md` describes one route/one panel and notes post-capture UI deltas and unresolved behavior. It is navigation/context, not current visual approval.

## Approved intent
The request authorizes importing a login candidate tree for module UAT. It does not approve the legacy design record, screenshots, current implementation, account access or a successful sign-in.

## Unknowns
Final visual direction, exact TINO owner credential custody, served build identity, 2FA handling for the UAT owner and remember-me semantics remain unverified.
