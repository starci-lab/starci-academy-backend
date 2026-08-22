# States · Seeded owned apps

| State | Kind | Reader sees | Transitions | Evidence |
|---|---|---|---|---|
| `owner-missing` | empty | Demo owner missing | seeded | `EV-001` |
| `seeded` | success | Demo apps seeded | available | `EV-001`, `EV-002`, `EV-005` |
| `available` | success | Owned apps available | terminal | `EV-003`, `EV-004`, `EV-005` |
