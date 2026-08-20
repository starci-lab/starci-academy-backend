# Surface · Sign in

> ID: `authentication-screen` · Route: `/[locale]/authentication`

## Job

Establish or recover the account session used by the protected operations console.

## Navigation

- authentication / Sign in — active
- authentication / Create one — available
- authentication / Forgot your password? — available

## Prototype contract

| Region | Kind | Real representative content | States | Actions | Evidence |
|---|---|---|---|---|---|
| `authentication-form` | form | Email: you@company.com; Password: 8 characters or more; Verification code: 6 digits; Current step: Enter details / verification code / done / refused | details, code, done, two-factor, refused | Sign in, Continue with Google, Send another code | `EV-001`, `EV-002` |

## Context rule

Layout preview may use these identities, values, statuses and actions to show density and hierarchy. Block design owns final anatomy.
