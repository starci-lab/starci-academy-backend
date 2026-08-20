# Acceptance · Account authentication

| ID | Observable result | Evidence/test |
|---|---|---|
| `AC-01` | Submitting refused sign-in credentials exposes the refusal on the authentication surface. | `EV-004` |
| `AC-02` | A successful password sign-in sets the refresh cookie only when the backend returns a usable refresh token. | `EV-005` |
| `AC-03` | The same route can advance account creation and password reset from details to OTP verification. | `EV-001`, `EV-002`, `EV-006` |
| `AC-04` | A two-factor-required payload is not adopted as a session by the frontend. | `EV-002`, `EV-003` |

## Completion

- Every current surface state is represented.
- Every business rule has evidence.
- Every operation has input, output and failure ownership.
- Unknowns are explicit and never rendered as facts.
- FE/BE source heads match the business head.
