# Acceptance · Progress, profile and league

| ID | Observable result | Evidence/test |
|---|---|---|
| `AC-01` | Dashboard, public profile and league routes mount their declared progress surfaces. | `EV-001`, `EV-003`, `EV-005` |
| `AC-02` | Profile updates persist only submitted fields and return a refreshed user row. | `EV-007` |
| `AC-03` | Daily quest claim grants the completed reward once per day or returns the typed incomplete/already-claimed failure. | `EV-008` |
| `AC-04` | myLeague returns the authenticated viewer's weekly tier and ranked cohort. | `EV-009` |

## Completion

- Every current surface state is represented.
- Every business rule has evidence.
- Every operation has input, output and failure ownership.
- Unknowns are explicit and never rendered as facts.
- FE/BE source heads match the business head.
