# Account authentication

> Business head: `90667ae7206e0c5a282a579796572c369962b2dd7681d4d61c06f5fbfb267231`
>
> This document is generated from the immutable business model. Update the model through `starci-business-analyze`; do not hand-edit this view.

## 1. Overview

One public authentication surface lets a visitor sign in, create an account through an emailed OTP, or reset a password through an emailed OTP before entering the protected console.

Included:
- Email/password sign-in
- Email OTP account creation
- Email OTP password reset
- Session restoration and protected-console redirect
- Backend two-factor challenge contract

Excluded:
- Two-factor code completion in the current frontend
- Account profile management
- Authorization roles beyond authenticated versus anonymous

## 2. Source heads

| Role | Repository | Head |
|---|---|---|
| fe | https://github.com/starci-lab/nivo-fe.git | `97eec8c5bb4c8f4b9e4bb7c59ea771ed829841d9` |
| be | https://github.com/starci-lab/nivo-backend.git | `947c6f4a117e1677e37ad98ba03f3dac0bca148e` |

## 3. Actors and access

### Visitor

- Choose sign in, account creation, or password reset
- Submit an email/password or emailed verification code
- Continue to the console after a usable session is established

Evidence: `EV-001`, `EV-002`, `EV-004`

## 4. Entry points and surfaces

### Sign in

- ID: `authentication-screen`
- Route: `/[locale]/authentication`
- Purpose: Establish or recover the account session used by the protected operations console.
- Regions: `authentication-form`
- Navigation: Sign in (active), Create one (available), Forgot your password? (available)

Evidence: `EV-001`, `EV-002`, `EV-004`

## 5. Business flows

### Sign in

Trigger: A visitor submits an email and password on /authentication.

1. **visitor** — Enter email and password and press Sign in → The frontend sends signIn
2. **visitor** — Receive a usable auth payload → The session is adopted and the console becomes available

Outcomes:
- A usable session is established
- Invalid credentials are shown as a refusal
- A two-factor-enabled account remains a pending challenge rather than becoming a session

Evidence: `EV-002`, `EV-003`, `EV-005`

### Create an account

Trigger: A visitor switches the authentication surface to Create one.

1. **visitor** — Submit email and a new password → An emailed OTP challenge starts
2. **visitor** — Submit the six-digit code → The account is created and the returned session is adopted

Outcomes:
- The account is created and signed in
- A refused or expired code stays visible without inventing success

Evidence: `EV-001`, `EV-002`, `EV-006`

### Reset a password

Trigger: A visitor chooses Forgot your password?.

1. **visitor** — Submit the account email → A generic emailed OTP challenge starts
2. **visitor** — Submit the code and new password → The password is changed but no session is created

Outcomes:
- The visitor is returned to sign in with the new password
- The surface does not reveal whether the submitted email owns an account

Evidence: `EV-001`, `EV-002`, `EV-006`

## 6. Business rules

### BR-01

Sign in, account creation, and password reset are modes of the same /authentication surface, not separate routes.

Strength: **confirmed** · Evidence: `EV-001`

### BR-02

A two-factor challenge is not a usable session: accessToken is null until verifyTwoFactor succeeds, while the refresh token remains in an HttpOnly cookie.

Strength: **confirmed** · Evidence: `EV-003`, `EV-005`, `EV-007`

### BR-03

Completing password reset changes the password and returns a boolean; it does not sign the visitor in.

Strength: **confirmed** · Evidence: `EV-002`

## 7. State model

- **Enter details** (`details`, initial) → code, authenticated, two-factor, refused — `EV-002`
- **Verification code requested** (`code`, pending) → authenticated, done, refused — `EV-002`, `EV-006`
- **Authenticated session** (`authenticated`, success) → terminal — `EV-002`, `EV-005`
- **Password changed** (`done`, success) → details — `EV-001`, `EV-002`
- **Two-factor verification required** (`two-factor`, partial) → details — `EV-002`, `EV-003`
- **Credentials or code refused** (`refused`, error) → details, code — `EV-002`, `EV-004`

## 8. Entities and data

- **Authentication payload**: accessToken, requiresTwoFactor, twoFactorToken — `EV-007`
- **Email OTP challenge**: challengeId, expiresInSeconds, otp — `EV-006`

## 9. Operations and APIs

- **signIn** (mutation, backend) — input: email, password; output: AuthPayload, refresh cookie when usable; failures: invalid credentials, two-factor challenge instead of session — `EV-002`, `EV-005`
- **signUpInit** (mutation, backend) — input: email, password; output: OtpChallenge; failures: email already used, request refused — `EV-002`, `EV-006`
- **signUpVerifyOtp** (mutation, backend) — input: challengeId, otp; output: AuthPayload; failures: invalid or expired code — `EV-002`, `EV-006`
- **forgotPasswordInit** (mutation, backend) — input: email; output: OtpChallenge; failures: request refused — `EV-002`, `EV-006`
- **forgotPasswordVerifyOtp** (mutation, backend) — input: challengeId, otp, newPassword; output: password changed boolean; failures: invalid or expired code — `EV-002`, `EV-006`

## 10. Acceptance conditions

- **AC-01** Submitting refused sign-in credentials exposes the refusal on the authentication surface. — `EV-004`
- **AC-02** A successful password sign-in sets the refresh cookie only when the backend returns a usable refresh token. — `EV-005`
- **AC-03** The same route can advance account creation and password reset from details to OTP verification. — `EV-001`, `EV-002`, `EV-006`
- **AC-04** A two-factor-required payload is not adopted as a session by the frontend. — `EV-002`, `EV-003`

## 11. Explicit unknowns

- **When will the frontend accept the TOTP code and call verifyTwoFactor?** — The backend contract supports two-factor completion, but the current surface explicitly tells affected users that this step is unsupported in this build.

## 12. Evidence index

| ID | Role | Source | Kind | Claim |
|---|---|---|---|---|
| EV-001 | fe | `apps/app/src/components/pages/AuthenticationPage/component.tsx:5` | ui | The authentication page is one bounded card at one route for the three authentication journeys. |
| EV-002 | fe | `apps/app/src/components/pages/AuthenticationPage/index.tsx:33` | ui | The connected page implements sign-in, emailed-OTP sign-up, emailed-OTP password reset, two-factor branching, refusal handling and session adoption. |
| EV-003 | fe | `apps/app/src/modules/auth/session.tsx:26` | policy | Session state restores on mount and refuses to adopt an auth payload that still requires two-factor verification or lacks an access token. |
| EV-004 | fe | `apps/app/src/components/pages/authentication-page-interaction.spec.tsx:8` | test | The interaction test submits sign-in credentials and verifies that an API refusal is rendered. |
| EV-005 | be | `src/features/core/api/core/graphql/mutations/auth/sign-in/sign-in.resolver.ts:38` | api | The signIn mutation accepts email/password, delegates to the service, conditionally sets the refresh cookie, and returns either an access payload or pending two-factor challenge. |
| EV-006 | fe | `apps/app/src/modules/api/auth.ts:195` | contract | Frontend GraphQL operations define sign-up and forgot-password OTP initiation, resend and verification contracts, including the boolean password-reset result. |
| EV-007 | be | `src/features/core/api/core/graphql/mutations/auth/graphql-types/auth-payload.ts:6` | schema | The backend AuthPayload distinguishes usable access from a pending two-factor challenge and keeps refresh tokens out of the GraphQL payload. |
