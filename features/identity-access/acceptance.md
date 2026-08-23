# Acceptance · Identity and access

| ID | Observable result | Evidence/test |
|---|---|---|
| `AC-01` | Opening /[lang]/authentication mounts exactly the AuthenticationPage and its centred authentication panel. | `EV-001`, `EV-002` |
| `AC-02` | Valid ordinary credentials produce an OTP challenge whose id and expiry are returned after the email is queued. | `EV-004` |
| `AC-03` | When the mutation returns the direct-session result, refresh and CSRF cookies are issued and the application session starts before the response returns. | `EV-003` |

## Completion

- Every current surface state is represented.
- Every business rule has evidence.
- Every operation has input, output and failure ownership.
- Unknowns are explicit and never rendered as facts.
- FE/BE source heads match the business head.
