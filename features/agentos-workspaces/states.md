# States · AgentOS workspace lifecycle and control center

| State | Kind | Reader sees | Transitions | Evidence |
|---|---|---|---|---|
| `request` | initial | request | submitting | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007` |
| `submitting` | pending | submitting | awaiting-payment | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007` |
| `awaiting-payment` | pending | awaiting-payment | accepted | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007` |
| `accepted` | pending | accepted | preparing | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007` |
| `preparing` | pending | preparing | ready | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007` |
| `ready` | success | ready | failed | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007` |
| `failed` | error | failed | launch-opening | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007` |
| `launch-opening` | pending | launch-opening | launch-connected | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007` |
| `launch-connected` | pending | launch-connected | launch-expired | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007` |
| `launch-expired` | error | launch-expired | terminal | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007` |
