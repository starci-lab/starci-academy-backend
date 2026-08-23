# States · Separated app dashboards and create flows

| State | Kind | Reader sees | Transitions | Evidence |
|---|---|---|---|---|
| `dashboard-loading` | pending | Dashboard loading | dashboard-empty, dashboard-ready, dashboard-refused | `EV-001`, `EV-002`, `EV-005` |
| `dashboard-empty` | empty | Dashboard empty | create-ready | `EV-001` |
| `dashboard-ready` | success | Dashboard ready | create-ready, resource-ready | `EV-001`, `EV-004`, `EV-005`, `EV-010` |
| `dashboard-refused` | error | Dashboard refused | dashboard-loading | `EV-001` |
| `create-ready` | initial | Create ready | create-submitting | `EV-001`, `EV-006` |
| `create-submitting` | pending | Create submitting | create-refused, resource-resume | `EV-001`, `EV-008` |
| `create-refused` | error | Create refused | create-ready | `EV-001`, `EV-008` |
| `resource-resume` | partial | Persisted resource resume | resource-ready | `EV-001`, `EV-003`, `EV-009` |
| `resource-ready` | success | Persisted resource ready | dashboard-ready | `EV-001`, `EV-004`, `EV-010` |
