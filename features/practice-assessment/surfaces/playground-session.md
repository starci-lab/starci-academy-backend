# Surface · Live Playground session

> ID: `playground-session` · Route: `/[lang]/courses/[displayId]/learn/playground/[slug]/session`

## Job

Follow the guide and use the playground-kind workspace while preserving reconnect context.

## Navigation

- Back to `playground-setup`

## Prototype contract

| Region | Kind | Real representative content | States | Actions | Evidence |
|---|---|---|---|---|---|
| `playground-workspace` | flow | Playground; Session status; guided steps; kind-specific workspace | pending, ready, reconnecting, success, error | Continue | `EV-005`, `EV-014` |

## Context rule

Layout preview may place guided steps beside a CLI/resource or RAG workspace. An unpaired deep link returns to setup; a connection drop after a prior pair remains here with reconnect guidance. Block design owns final anatomy.
