# Surface · Console navigation

> ID: `console-shell` · Route: `/:locale/(overview|apps|agentos|wallet)`

## Job

Keep navigation identity, state and interaction stable while routed console content changes.

## Navigation

- home / Overview — available
- services / Apps — available
- services / AgentOS — available
- services / Servers — unavailable
- services / Domains — unavailable
- account / Wallet — available
- account / Support — unavailable

## Prototype contract

| Region | Kind | Real representative content | States | Actions | Evidence |
|---|---|---|---|---|---|
| `desktop-console-navigation` | navigation | Current destination; Home, Services and Account destinations | expanded | none | `EV-001`, `EV-002`, `EV-003` |
| `mobile-console-navigation` | navigation | Complete console destinations | mobile-closed, mobile-open | Open navigation, Close navigation | `EV-001`, `EV-002`, `EV-004`, `EV-005` |

## Context rule

Layout preview may use these identities, values, statuses and actions to show density and hierarchy. Block design owns final anatomy.
