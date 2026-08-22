# States · MMO application Helm chart

| State | Kind | Reader sees | Transitions | Evidence |
|---|---|---|---|---|
| `chart-unresolved` | initial | MMO chart accepted but runtime contract unresolved | chart-defined | `EV-001`, `EV-002` |
| `chart-defined` | pending | MMO chart package and values contract defined | chart-validated, chart-refused | `EV-001` |
| `chart-validated` | success | MMO chart passes deterministic Helm validation | terminal | `EV-001` |
| `chart-refused` | error | MMO chart source or rendered package is invalid | chart-defined | `EV-001`, `EV-004` |
