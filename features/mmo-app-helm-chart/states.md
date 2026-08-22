# States · MMO application Helm chart

| State | Kind | Reader sees | Transitions | Evidence |
|---|---|---|---|---|
| `chart-unresolved` | initial | MMO generic chart implementation opened | chart-defined | `EV-001`, `EV-002`, `EV-006` |
| `chart-defined` | pending | charts/mmo package and generic values contract defined | chart-validated, chart-refused | `EV-001`, `EV-006`, `EV-009`, `EV-010`, `EV-011`, `EV-012`, `EV-013`, `EV-014` |
| `chart-validated` | success | MMO chart passes deterministic Helm validation | terminal | `EV-001` |
| `chart-refused` | error | MMO chart source or rendered package is invalid | chart-defined | `EV-001`, `EV-004` |
