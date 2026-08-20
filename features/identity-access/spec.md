# Identity and access

> Business head: `d9170beac6e480043156399203ea3fb6afd58a3c77f6ebfc9fee1d8aa56c1388`
>
> This document is generated from the immutable business model. Update the model through `starci-business-analyze`; do not hand-edit this view.

## 1. Overview

Learners enter the localized authentication route, submit credentials, complete the server-selected verification path, and receive an application session before protected learning surfaces become available.

Included:
- Authentication route and centred authentication panel
- Credential sign-in initiation
- OTP challenge or explicitly enabled local-test direct session
- Session cookie, CSRF cookie and server session establishment

Excluded:
- Provider account linking and two-factor settings outside the mounted authentication journey
- Any identity behavior not exercised by the current route or cited mutation

## 2. Source heads

| Role | Repository | Head |
|---|---|---|
| fe | https://github.com/starci-lab/starci-academy-fe.git | `84bf3be6565a20b1fee9c83cab8b9ba810d13e11` |
| be | https://github.com/starci-lab/starci-academy-backend | `0066625ed94b10bf5b6892af775e45bdd6823558` |

## 3. Actors and access

### Learner

- Open the authentication route
- Submit username and password
- Complete the verification path returned by the server

Evidence: `EV-001`, `EV-002`, `EV-003`

### Identity service

- Verify credentials
- Issue an OTP challenge
- Establish the authenticated session after successful verification

Evidence: `EV-003`, `EV-004`

## 4. Entry points and surfaces

### Authentication

- ID: `authentication-center`
- Route: `/[lang]/authentication`
- Purpose: Collect sign-in credentials and guide the learner through the server-selected verification step until a session is established.
- Regions: `credential-panel`
- Navigation: Authentication (active), Dashboard after sign-in (available)

Evidence: `EV-001`, `EV-002`

## 5. Business flows

### Sign in

Trigger: A learner opens the authentication route and submits credentials.

1. **learner** — Open the localized authentication route → The centred authentication panel is displayed
2. **learner** — Submit username and password → The server verifies credentials under captcha and strict throttling
3. **identity-service** — Return an OTP challenge or the explicitly enabled local-test session path → The learner receives a challenge handle or an established session

Outcomes:
- A valid learner receives an authenticated application session
- An ordinary production sign-in continues through an OTP challenge

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`

## 6. Business rules

### BR-01

Credential sign-in initiation is protected by captcha and strict throttling before the mutation executes.

Strength: **confirmed** · Evidence: `EV-003`

### BR-02

The ordinary sign-in path verifies the password, creates an OTP challenge, queues the OTP email and returns the challenge id plus expiry.

Strength: **confirmed** · Evidence: `EV-004`

### BR-03

A direct local-test session is permitted only for the explicitly configured test account outside production; successful direct completion attaches refresh and CSRF cookies and starts the server session.

Strength: **confirmed** · Evidence: `EV-003`, `EV-004`

## 7. State model

- **Credentials ready** (`credentials-ready`, initial) → verification-pending — `EV-001`, `EV-002`
- **Verification pending** (`verification-pending`, pending) → otp-required, session-established, authentication-error — `EV-003`, `EV-004`
- **OTP required** (`otp-required`, partial) → session-established, authentication-error — `EV-004`
- **Session established** (`session-established`, success) → terminal — `EV-002`, `EV-003`
- **Authentication failed** (`authentication-error`, error) → credentials-ready — `EV-003`, `EV-004`

## 8. Entities and data

- **Sign-in request**: email, password — `EV-003`, `EV-004`
- **OTP challenge**: challengeId, expiresInSeconds — `EV-004`
- **Application session**: accessToken, refreshToken cookie, CSRF cookie — `EV-003`, `EV-004`

## 9. Operations and APIs

- **signInInit** (mutation, backend) — input: email, password; output: challengeId and expiresInSeconds, or accessToken-backed application session; failures: captcha rejected, strict throttle rejected, credentials rejected, OTP or mail hand-off failed — `EV-003`, `EV-004`

## 10. Acceptance conditions

- **AC-01** Opening /[lang]/authentication mounts exactly the AuthenticationPage and its centred authentication panel. — `EV-001`, `EV-002`
- **AC-02** Valid ordinary credentials produce an OTP challenge whose id and expiry are returned after the email is queued. — `EV-004`
- **AC-03** When the mutation returns the direct-session result, refresh and CSRF cookies are issued and the application session starts before the response returns. — `EV-003`

## 11. Explicit unknowns

- **Which exact route should each authentication entry context open after session establishment?** — The page exposes a signed-in callback, but the cited route and mutation do not establish one universal redirect target, so prototypes must show completion without inventing a destination.
- **Which sign-up, forgot-password and provider-link modes are simultaneously available in this mounted panel?** — Those operations exist elsewhere in source, but their complete composition is not proven by the evidence for this stable feature surface.

## 12. Evidence index

| ID | Role | Source | Kind | Claim |
|---|---|---|---|---|
| EV-001 | fe | `src/app/[lang]/authentication/page.tsx:1` | route | The localized authentication route mounts AuthenticationPage. |
| EV-002 | fe | `src/components/pages/AuthenticationPage/component.tsx:6` | ui | The authentication page renders one centred form-card panel and reports successful session establishment through signedIn. |
| EV-003 | be | `src/features/api/core/graphql/mutations/keycloak/sign-in/init/sign-in-init.resolver.ts:53` | api | signInInit is captcha-guarded and strictly throttled, returns a challenge when required, or attaches cookies and starts the server session for a direct-session result. |
| EV-004 | be | `src/features/api/core/graphql/mutations/keycloak/sign-in/init/sign-in-init.handler.spec.ts:168` | test | The handler verifies credentials, creates and mails an OTP challenge with expiry, while the explicitly enabled local test account can return a direct session. |
