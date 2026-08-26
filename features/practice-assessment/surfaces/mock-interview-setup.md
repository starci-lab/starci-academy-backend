# Surface · Mock interview

> ID: `mock-interview-setup` · Route: `/[lang]/courses/[displayId]/learn/mock-interview`

## Job

Resume an unfinished course interview, prepare a new one, or inspect prior development without presenting fake setup progress.

## Navigation

- none

## Prototype contract

| Region | Kind | Real representative content | States | Actions | Evidence |
|---|---|---|---|---|---|
| `interview-entry` | flow | Current course; unfinished interview; last saved position; recent assessment | no-session, resumable, pending, empty, error | Resume interview; Prepare new interview; View history; View progress | `EV-006`, `EV-015` |
| `interview-setup` | form | Interview format; target level; format-defined phases or turns, duration and assessment output | ready, pending, resumable-conflict, error | Start interview; explicitly abandon unfinished interview and start new | `EV-006`, `EV-010`, `EV-015` |
| `interview-development` | collection | Graded attempt history; comparable progress | pending, ready, empty, insufficient-data, error | View attempt | `EV-015` |

## Context rule

Layout preview may use these identities, values, statuses and actions to show density and hierarchy. It must not render generic journey progress on setup. Block design owns final anatomy.
