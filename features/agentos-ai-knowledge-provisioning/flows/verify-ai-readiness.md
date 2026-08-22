# Flow · Verify that the exact workspace can answer with its own AI and knowledge

> ID: `verify-ai-readiness` · Trigger: Automatic provisioning reaches verification or the owner runs the test from AI and Knowledge

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | `workspace-owner` | `workspace-ai-knowledge` | Run a bounded readiness test for the exact workspace | The backend asks the workspace runtime to verify its credential, model, embedding, Qdrant and scoped retrieval |
| 2 | `workspace-owner` | `workspace-ai-knowledge` | Read the component verdicts, timestamp and safe failure code | The owner receives an actionable pass or refusal without raw provider output, secrets or document contents |

## Outcomes

- A passing result proves the call used the workspace credential and the declared knowledge scope
- A refusal preserves the existing workspace and exposes which readiness component requires recovery

Evidence: `EV-001`, `EV-014`, `EV-015`, `EV-016`
