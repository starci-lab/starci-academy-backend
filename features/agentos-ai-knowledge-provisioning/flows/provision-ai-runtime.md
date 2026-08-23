# Flow · Provision a usable workspace AI runtime

> ID: `provision-ai-runtime` · Trigger: A paid AgentOS order begins provisioning one exact workspace

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | `workspace-owner` | `agentos-ai-provisioning` | Observe the exact order while Nivo idempotently mints and delivers the workspace credential and pins the DeepSeek model | Credential and model configuration progress without exposing the raw key |
| 2 | `workspace-owner` | `agentos-ai-provisioning` | Observe immutable Nivo and installed-module knowledge artifacts being recovered or imported into workspace Qdrant | Artifact versions and Qdrant recovery status are bound to the exact workspace |
| 3 | `workspace-owner` | `agentos-ai-provisioning` | Observe the bounded model, embedding, Qdrant and scoped-retrieval verification | The workspace becomes AI-ready only after every required check passes |

## Outcomes

- The owner reaches an exact workspace whose AI runtime is proven usable rather than merely installed
- A failure remains attributable to credential, model, embedding, Qdrant, knowledge recovery or scoped retrieval

Evidence: `EV-001`, `EV-005`, `EV-006`, `EV-007`, `EV-008`, `EV-015`
