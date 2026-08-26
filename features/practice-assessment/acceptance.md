# Acceptance · Practice and assessment

| ID | Observable result | Evidence/test |
|---|---|---|
| `AC-01` | Practice, coding problem, playground and mock interview route families mount their declared surfaces. | `EV-001`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`, `EV-008` |
| `AC-02` | Submitting code returns submission and job identities for asynchronous judging. | `EV-009` |
| `AC-03` | Starting a mock interview server-draws and persists a session for the chosen course, level and kind. | `EV-010` |
| `AC-04` | A first-time learner can understand the interview format, expected effort and assessment output before starting, without a decorative setup progress indicator. | `EV-006`, `EV-015` |
| `AC-05` | The Playground journey exposes catalog, explicit readiness setup and a guarded live session as distinct surfaces with reconnect behavior. | `EV-004`, `EV-005`, `EV-014` |
| `AC-06` | A learner with an unfinished interview sees Resume as the primary action with the last server-confirmed position, and starting new requires explicit abandonment. | `EV-015` |
| `AC-07` | The active interview shows progress only from a real server-confirmed current phase or turn and format total. | `EV-007`, `EV-015` |
| `AC-08` | Refresh, reconnect and leaving Learn preserve every submitted turn and the last confirmed interview position. | `EV-015` |
| `AC-09` | Completing the format passes through explicit submitting and grading states before any assessed result is shown. | `EV-008`, `EV-015` |
| `AC-10` | Delayed or failed assessment exposes retry or return-later recovery and never appears as a completed result. | `EV-015` |
| `AC-11` | The result connects rubric context, submitted-answer evidence, strengths, gaps, course content and a next practice action. | `EV-008`, `EV-015` |
| `AC-12` | History and progress distinguish no data, insufficient comparable data and a supported trend. | `EV-015` |
| `AC-13` | Concurrent or stale session advancement cannot silently overwrite the server-confirmed interview position. | `EV-015` |

## Completion

- Every current surface state is represented.
- Every business rule has evidence.
- Every operation has input, output and failure ownership.
- Unknowns are explicit and never rendered as facts.
- FE/BE source heads match the business head.
