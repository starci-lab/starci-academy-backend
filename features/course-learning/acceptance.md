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
| `AC-10` | An eligible learner can enter the exact Challenge, understand the rubric, save and resume a draft, submit once, receive a finalized result and retry without losing prior attempt history. | `EV-004`, `EV-005`, `EV-016` |
| `AC-11` | Every finalized result shows a platform-owned outcome and criterion-level attempt evidence, gaps, uncertainty and a concrete next learning action. | `EV-016`, `EV-017` |
| `AC-12` | AI output cannot directly mark a Challenge passed, change course progress, weaken the rubric, invoke undeclared tools or follow instructions embedded in learner content. | `EV-016`, `EV-017` |
| `AC-13` | AI UAT covers canonical correct, semantically equivalent, partially correct, incorrect and off-topic answers with evidence-linked criterion decisions. | `EV-017` |
| `AC-14` | AI UAT covers empty, malformed, oversized, unsupported-artifact, multilingual and adversarial prompt-injection submissions without answer leakage or cross-boundary data exposure. | `EV-017` |
| `AC-15` | Timeout, provider failure, malformed structured output and low confidence produce evaluation-unavailable, preserve the submitted attempt, do not consume a retry and expose a safe resume action. | `EV-016`, `EV-017` |
| `AC-16` | Duplicate submissions, duplicate callbacks, concurrent finalization and interrupted resume settle idempotently to one auditable result and one progress transition. | `EV-016`, `EV-017` |
| `AC-17` | Equivalent answers receive materially consistent rubric outcomes across supported locales while explanatory wording may vary. | `EV-017` |
| `AC-18` | Product UAT begins only after implementation fidelity passes and proves the complete Challenge journey with keyboard operation and approved responsive layouts. | `EV-016`, `EV-017` |

## Completion

- Every current surface state is represented.
- Every business rule has evidence.
- Every operation has input, output and failure ownership.
- Unknowns are explicit and never rendered as facts.
- FE/BE source heads match the business head.
