# States · Proposal and document delivery

| State | Kind | Reader sees | Transitions | Evidence |
|---|---|---|---|---|
| `requirements-partial` | partial | Requirements incomplete | proposal-pending | `EV-002`, `EV-007` |
| `proposal-pending` | pending | Proposal generating | proposal-ready, proposal-manual-review, proposal-error | `EV-001`, `EV-003`, `EV-004`, `EV-008` |
| `proposal-ready` | success | Proposal documents ready | terminal | `EV-001`, `EV-004`, `EV-005`, `EV-006`, `EV-008` |
| `proposal-manual-review` | partial | Commercial review required | terminal | `EV-007`, `EV-008` |
| `proposal-error` | error | Proposal generation failed | proposal-pending | `EV-001`, `EV-003`, `EV-004` |
