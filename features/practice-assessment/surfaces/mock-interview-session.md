# Surface · Interview session

> ID: `mock-interview-session` · Route: `/[lang]/courses/[displayId]/learn/mock-interview/interview/[sessionId]`

## Job

Answer one prompt at a time while preserving submitted turns and exposing only real session progress.

## Navigation

- `mock-interview-setup`

## Prototype contract

| Region | Kind | Real representative content | States | Actions | Evidence |
|---|---|---|---|---|---|
| `interview-run` | flow | Current prompt; answer workspace; confirmed phase or turn progress; save and connection status | pending, ready, saving, reconnecting, resumable, completion-ready, error, conflict | Submit answer; Leave and resume later; Complete interview | `EV-007`, `EV-010`, `EV-015` |

## Context rule

Layout preview may use these identities, values, statuses and actions to show density and hierarchy. Progress requires a server-confirmed current position and format total. Block design owns final anatomy.
