# Account authentication

> Business identity: `nivo/authentication@90667ae7206e0c5a282a579796572c369962b2dd7681d4d61c06f5fbfb267231`
>
> Source heads: `fe@97eec8c5bb4c`, `be@947c6f4a117e`
>
> Load this file first. Load only the modules named by the current task.

## Decision capsule

**Purpose.** One public authentication surface lets a visitor sign in, create an account through an emailed OTP, or reset a password through an emailed OTP before entering the protected console.

**Primary actor.** Visitor

**Primary outcome.** A usable session is established

**Never does.** Two-factor code completion in the current frontend

## Invariants

- `BR-01` — Sign in, account creation, and password reset are modes of the same /authentication surface, not separate routes.
- `BR-02` — A two-factor challenge is not a usable session: accessToken is null until verifyTwoFactor succeeds, while the refresh token remains in an HttpOnly cookie.
- `BR-03` — Completing password reset changes the password and returns a boolean; it does not sign the visitor in.

## Primary flow

```text
details → authenticated
```

## Surface map

| Surface | Route | Owns | Module |
|---|---|---|---|
| `authentication-screen` | `/[locale]/authentication` | Establish or recover the account session used by the protected operations console. | [surface](surfaces/authentication-screen.md) |

## Data and operation map

| Operation | Owner | Input | Result |
|---|---|---|---|
| `signIn` | backend | email, password | AuthPayload, refresh cookie when usable |
| `signUpInit` | backend | email, password | OtpChallenge |
| `signUpVerifyOtp` | backend | challengeId, otp | AuthPayload |
| `forgotPasswordInit` | backend | email | OtpChallenge |
| `forgotPasswordVerifyOtp` | backend | challengeId, otp, newPassword | password changed boolean |

## Explicit unknowns

- `two-factor-ui-completion` — When will the frontend accept the TOTP code and call verifyTwoFactor? Impact: The backend contract supports two-factor completion, but the current surface explicitly tells affected users that this step is unsupported in this build.

## LOADS

| Need | Read |
|---|---|
| Scope, terminology and exclusions | [overview.md](overview.md) |
| Actor permissions and ownership | [actors.md](actors.md) |
| One user journey | `flows/<flow-id>.md` |
| One renderable screen | `surfaces/<surface-id>.md` |
| Business invariants | [rules.md](rules.md) |
| State transitions | [states.md](states.md) |
| Entities, inputs, outputs and failures | [contracts.md](contracts.md) |
| Completion and regression proof | [acceptance.md](acceptance.md) |
| Machine rendering/query | [model.json](model.json) |
| Exact source provenance | [evidence.json](evidence.json) |

## Context rule

Do not load every module by default. `CONTEXT.md` plus the one flow or surface being changed is the normal prompt. `model.json` is authoritative for machines; Markdown files are generated projections. Unknowns remain unknown until routed source or an explicit owner decision resolves them.
