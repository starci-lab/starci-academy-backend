# Flow · Inspect and reindex the workspace knowledge runtime

> ID: `knowledge-runtime-branch` · Trigger: The owner opens Infrastructure for the exact ready workspace

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | `account-owner` | `agentos-workspace` | Inspect MCP and Qdrant health, document counts by origin and last update time | Only owner-safe aggregate knowledge facts are returned |
| 2 | `account-owner` | `agentos-workspace` | Request asynchronous reindexing for the exact workspace | Reindexing advances on its own state axis and exposes completion or refusal |

## Outcomes

- The owner can verify that internal knowledge infrastructure works without obtaining admin access or document contents

Evidence: `EV-022`, `EV-023`, `EV-024`, `EV-025`
