# Surface · Authentication

> ID: `authentication-center` · Route: `/[lang]/authentication`

## Job

Collect sign-in credentials and guide the learner through the server-selected verification step until a session is established.

## Navigation

- Account / Authentication — active
- Learning / Dashboard after sign-in — available

## Prototype contract

| Region | Kind | Real representative content | States | Actions | Evidence |
|---|---|---|---|---|---|
| `credential-panel` | form | Email; Password; Verification status: credentials ready, pending, OTP required, established or failed | credentials-ready, verification-pending, otp-required, session-established, authentication-error | Continue, Try again | `EV-002`, `EV-003`, `EV-004` |

## Context rule

Layout preview may use these identities, values, statuses and actions to show density and hierarchy. Block design owns final anatomy.
