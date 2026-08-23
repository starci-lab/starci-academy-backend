# Flow · Bring common and module knowledge to the exact declared versions

> ID: `refresh-runtime-knowledge` · Trigger: A workspace is provisioned, its common knowledge changes or an immutable solution module is installed or upgraded

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | `workspace-owner` | `workspace-ai-knowledge` | Inspect common and installed-module knowledge versions and their current workspace status | The owner sees version and digest provenance without receiving the artifact URL or vector contents |
| 2 | `workspace-owner` | `workspace-ai-knowledge` | Observe recovery or import for the exact version set | Common and private module knowledge become searchable without deleting uploaded knowledge |

## Outcomes

- Knowledge refreshes are idempotent by artifact version and digest
- A failed refresh leaves the last verified knowledge and every customer upload recoverable

Evidence: `EV-001`, `EV-008`, `EV-009`, `EV-010`, `EV-013`
