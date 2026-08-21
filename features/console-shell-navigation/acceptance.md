# Acceptance · Shared console shell navigation

| ID | Observable result | Evidence/test |
|---|---|---|
| `AC-01` | Every authenticated console route renders the same expanded or collapsed desktop rail state without remounting its host. | `EV-001`, `EV-002`, `EV-006` |
| `AC-02` | A visible keyboard-operable toggle changes the desktop rail between 256px and 64px, persists the choice and reflows the routed body. | `EV-006` |
| `AC-03` | Compact mode retains circular icon targets, accessible labels, selected state and destination order. | `EV-003`, `EV-006` |
| `AC-04` | Only destination groups scroll; toggle and Overview remain pinned. | `EV-006` |
| `AC-05` | A narrow viewport exposes all destinations in a right-edge drawer and renders neither desktop rail nor bottom tab bar. | `EV-001`, `EV-004`, `EV-005`, `EV-006` |

## Completion

- Every current surface state is represented.
- Every business rule has evidence.
- Every operation has input, output and failure ownership.
- Unknowns are explicit and never rendered as facts.
- FE/BE source heads match the business head.
