# Surface · Exact AgentOS workspace

> ID: `agentos-workspace` · Route: `/[locale]/agentos/workspaces/[workspaceId]`

## Job

Serve as the primary terminal for managing one exact owned ready workspace.

## Navigation

- agentos-workspaces / Workspace — active
- post-ready / Solution module — available
- post-ready / OpenClaw — available
- post-ready / n8n — available

## Prototype contract

| Region | Kind | Real representative content | States | Actions | Evidence |
|---|---|---|---|---|---|
| `workspace-control-center` | navigation | Overview; Solutions; Applications; Infrastructure; Operations; Access | workspace-preparing, workspace-ready, workspace-failed, operation-idle, operation-running, operation-succeeded, operation-refused, plan-awaiting-payment, plan-applying, knowledge-loading, knowledge-ready, knowledge-degraded, knowledge-reindexing, knowledge-refused | Open module detail, Open OpenClaw, Open n8n, Update runtime, Change plan, Create backup, Restart runtime, Rebuild runtime, Reindex knowledge | `EV-001`, `EV-005`, `EV-009`, `EV-010`, `EV-018`, `EV-022`, `EV-023`, `EV-025` |

## Context rule

Layout preview may use these identities, values, statuses and actions to show density and hierarchy. Block design owns final anatomy.
