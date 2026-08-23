# Surface · AI and Knowledge

> ID: `workspace-ai-knowledge` · Route: `/[locale]/agentos/workspaces/[workspaceId]`

## Job

Let the exact workspace owner understand whether its AI can answer, what knowledge origins are current and which safe recovery action is available.

## Navigation

- agentos / Workspace — available
- workspace / AI and Knowledge — active

## Prototype contract

| Region | Kind | Real representative content | States | Actions | Evidence |
|---|---|---|---|---|---|
| `ai-runtime-readiness` | summary | OpenRouter key; Chat model; Embedding; Qdrant; Scoped retrieval; Last tested | ai-readiness-testing, ai-ready, ai-readiness-refused | Run AI test | `EV-001`, `EV-012`, `EV-014`, `EV-015` |
| `knowledge-origins` | collection | Nivo common; Installed modules; Uploaded documents; Version and digest; Documents | knowledge-refreshing, knowledge-current, knowledge-refused | Reindex knowledge | `EV-001`, `EV-009`, `EV-010`, `EV-012`, `EV-013` |

## Context rule

Layout preview may use these identities, values, statuses and actions to show density and hierarchy. Block design owns final anatomy.
