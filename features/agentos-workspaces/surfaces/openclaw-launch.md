# Surface · OpenClaw secure launch

> ID: `openclaw-launch` · Route: `/[locale]/launch/agentos/[workspaceId]/openclaw`

## Job

Issue and relay a safe short-lived launch for the exact ready workspace on an independent state axis.

## Navigation

- post-ready / OpenClaw launch — active
- agentos-workspaces / Back to exact workspace — available

## Prototype contract

| Region | Kind | Real representative content | States | Actions | Evidence |
|---|---|---|---|---|---|
| `launch-bridge` | flow | Exact workspace; Launch status; Expiry | launch-idle, launch-opening, launch-connected, launch-blocked, launch-expired, launch-disconnected | Open OpenClaw, Renew launch, Revoke launch | `EV-001`, `EV-007`, `EV-008`, `EV-012`, `EV-013` |

## Context rule

Layout preview may use these identities, values, statuses and actions to show density and hierarchy. Block design owns final anatomy.
