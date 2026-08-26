# Acceptance · Study library

| ID | Observable result | Evidence |
|---|---|---|
| `AC-01` | Flashcard, foundation and mind-map routes mount their declared study surfaces. | `EV-001`, `EV-003`, `EV-005` |
| `AC-02` | Starting a review persists a resumable session for the selected deck and card order. | `EV-006` |
| `AC-03` | Foundation queries return a paginated list for the selected category. | `EV-007` |
| `AC-04` | Flashcard entry keeps existing Study separate from the scored cloze assessment and preserves route identity. | `EV-012`, `EV-013` |
| `AC-05` | Study can start from due work or a selected deck and can restrict a deck run to due cards when available. | `EV-002`, `EV-010`, `EV-011` |
| `AC-06` | Study persists before focused work, restores acknowledged progress, supports answer reveal and four recall ratings, and routes completion to a dedicated result. | `EV-006`, `EV-010`, `EV-011` |
| `AC-07` | The assessment exposes Begin, History and Stats, shows eligible cloze-question availability, and persists only a fully playable run. | `EV-012`, `EV-013`, `EV-014` |
| `AC-08` | The assessment restores a valid cloze-only unfinished run and safely recovers from invalid, expired, malformed or legacy mixed-card identity. | `EV-012`, `EV-013`, `EV-014` |
| `AC-09` | Study and assessment both preserve acknowledged work on safe leave, but only Study exposes recall ratings and scheduling behavior. | `EV-012`, `EV-013` |
| `AC-10` | Study results retain scheduling and grade evidence; assessment results expose correct and total blanks, coverage, XP and per-question outcomes. | `EV-012`, `EV-014` |
| `AC-11` | Every remote-data surface exposes loading, ready, empty, failed and retry or recovery behavior. | `EV-002`, `EV-010`, `EV-011` |
| `AC-12` | The revision preserves Study behavior, scheduling, access gates and route identity while tightening assessment playability to cloze-valid cards and rejecting zero-blank outcomes. | `EV-012`, `EV-013`, `EV-014` |
| `AC-13` | Every persisted assessment card has at least one valid cloze blank and every scored outcome has totalBlanks greater than zero. | `EV-012`, `EV-013`, `EV-014` |
| `AC-14` | Each assessment question presents blanks and a word bank, permits unchecked choice revision, and checks selections before showing the solution. | `EV-012`, `EV-013`, `EV-015` |
| `AC-15` | No assessment state exposes reveal-and-rate, Again/Hard/Good/Easy or any SM-2 fallback. | `EV-012`, `EV-013` |
| `AC-16` | Insufficient eligible questions block start with an explicit explanation rather than silently drawing ordinary flashcards. | `EV-012`, `EV-013`, `EV-014` |
| `AC-17` | A client-supplied non-cloze card or zero-blank result is rejected by backend-owned validation. | `EV-012`, `EV-014` |
| `AC-18` | The existing Study branch is regression-proven unchanged. | `EV-012` |

## Completion

- Every current surface state is represented.
- Every business rule has evidence.
- Every operation has input, output, failure and owner.
- Unknowns are explicit and never rendered as facts.
- FE/BE source heads match this business head.
- Study remains regression-proven unchanged.
