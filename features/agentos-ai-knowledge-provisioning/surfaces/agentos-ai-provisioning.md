# Surface · AI runtime provisioning

> ID: `agentos-ai-provisioning` · Route: `/[locale]/agentos/orders/[orderId]`

## Job

Show the credential, model, knowledge recovery and readiness milestones that must pass before the exact workspace AI runtime is ready.

## Navigation

- agentos / AgentOS order — active
- agentos / Exact workspace — unavailable

## Prototype contract

| Region | Kind | Real representative content | States | Actions | Evidence |
|---|---|---|---|---|---|
| `ai-provision-progress` | flow | Workspace key; DeepSeek model; Knowledge artifacts; Workspace Qdrant; AI test | ai-provision-pending, ai-key-configuring, ai-knowledge-recovering, ai-readiness-testing, ai-ready, ai-readiness-refused | none | `EV-001`, `EV-005`, `EV-006`, `EV-007`, `EV-008` |

## Context rule

Layout preview may use these identities, values, statuses and actions to show density and hierarchy. Block design owns final anatomy.
