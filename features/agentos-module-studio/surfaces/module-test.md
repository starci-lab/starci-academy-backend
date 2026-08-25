# Surface · Test module

> ID: `module-test` · Route: `/[locale]/agentos/workspaces/[workspaceId]/modules/[moduleId]/test`

## Job

Exercise the exact configured module through its kind-specific sandbox and inspect assertion evidence before applying context or operating it.

## Navigation

- module / Back to module — available
- module / Setup — available
- module / Test — active
- module / Operate — available

## Prototype contract

| Region | Kind | Real representative content | States | Actions | Evidence |
|---|---|---|---|---|---|
| `test-scenario` | flow | Context version; kind fixture; expected behavior | module-test-ready, module-test-running | Run safe test | `EV-017` |
| `test-trust-result` | summary | Result; context version; test contract; assertions; warnings | module-test-passed, module-test-warning, module-test-failed | Run again; Revise setup | `EV-017` |

## Context rule

Layout preview may use these identities, values, statuses and actions to show density and hierarchy. Block design owns final anatomy.
