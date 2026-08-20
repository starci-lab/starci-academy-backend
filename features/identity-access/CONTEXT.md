# Identity and access

> Business identity: `starci-academy/identity-access@3464f5814817ca1f95f18613412cc3d40ef019abcdcc2533f8fb9744c0614aba`
>
> Source heads: `fe@84bf3be6565a`, `be@eca4e018044f`
>
> Load this file first. Load only the modules named by the current task.

## Decision capsule

**Purpose.** Learners enter the localized authentication route, submit credentials, complete the server-selected verification path, and receive an application session before protected learning surfaces become available.

**Primary actor.** Learner

**Primary outcome.** A valid learner receives an authenticated application session

**Never does.** Provider account linking and two-factor settings outside the mounted authentication journey

## Invariants

- `BR-01` — Credential sign-in initiation is protected by captcha and strict throttling before the mutation executes.
- `BR-02` — The ordinary sign-in path verifies the password, creates an OTP challenge, queues the OTP email and returns the challenge id plus expiry.
- `BR-03` — A direct local-test session is permitted only for the explicitly configured test account outside production; successful direct completion attaches refresh and CSRF cookies and starts the server session.

## Primary flow

```text
credentials-ready → verification-pending → session-established
```

## Surface map

| Surface | Route | Owns | Module |
|---|---|---|---|
| `authentication-center` | `/[lang]/authentication` | Collect sign-in credentials and guide the learner through the server-selected verification step until a session is established. | [surface](surfaces/authentication-center.md) |

## Data and operation map

| Operation | Owner | Input | Result |
|---|---|---|---|
| `signInInit` | backend | email, password | challengeId and expiresInSeconds, or accessToken-backed application session |

## Explicit unknowns

- `post-sign-in-destination` — Which exact route should each authentication entry context open after session establishment? Impact: The page exposes a signed-in callback, but the cited route and mutation do not establish one universal redirect target, so prototypes must show completion without inventing a destination.
- `shared-auth-panel-modes` — Which sign-up, forgot-password and provider-link modes are simultaneously available in this mounted panel? Impact: Those operations exist elsewhere in source, but their complete composition is not proven by the evidence for this stable feature surface.

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
