# Acceptance · Course learning and discussion

| ID | Observable result | Evidence/test |
|---|---|---|
| `AC-01` | Course home, content map, lesson, embedded challenge/result and course Q&A routes mount the declared learning surfaces. | `EV-001`, `EV-002`, `EV-004`, `EV-005`, `EV-006`, `EV-009`, `EV-010` |
| `AC-02` | Authenticated learners can persist lesson read state and create top-level comments or replies on content. | `EV-007`, `EV-008` |
| `AC-03` | The lesson workspace reuses existing nested layouts and presents the course map, centered reader, optional outline and current overlays as one composed full viewport without redesigning existing shell regions. | `EV-011` |
| `AC-04` | SCHEMA V2 lessons render every authored programming-language tab, resolve the routed locale with default-body fallback, and rebuild the on-page outline from the selected article. | `EV-012`, `EV-013` |
| `AC-05` | Module creation is rejected when its kind is missing. | `EV-014` |
| `AC-06` | A persisted module resolves to one and only one kind-specific workbench in addition to the shared conversation frame. | `EV-014`, `EV-015` |
| `AC-07` | Every resolved module exposes the shared conversation frame and exactly one workbench selected by its kind. | `EV-015` |
| `AC-08` | A new module kind can add a workbench contract without changing the base module or shared conversation contract. | `EV-014`, `EV-015` |
| `AC-09` | Missing, duplicated or kind-mismatched workbench state is rejected as an invariant violation. | `EV-014`, `EV-015` |

## Completion

- Every current surface state is represented.
- Every business rule has evidence.
- Every operation has input, output and failure ownership.
- Unknowns are explicit and never rendered as facts.
- FE/BE source heads match the business head.
