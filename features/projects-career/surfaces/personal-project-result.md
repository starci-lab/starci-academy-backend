# Surface · Personal project result

> ID: `personal-project-result` · Route: `/[lang]/courses/[displayId]/learn/personal-project/tasks/[taskId]/result`

## Job

Inspect one immutable attempt, understand structured evidence and choose revision or next task.

## Navigation

- `personal-project-task` / Back to task — available

| Region | Kind | Real representative content | States | Actions | Evidence |
|---|---|---|---|---|---|
| `selected-attempt-result` | result | Attempt selector; Score; Verdict; Served model; Findings | pending, ready, partial, empty, failed | Revise task, Continue to next task | `EV-003`, `EV-010`, `EV-013` |
| `personal-project-attempt-history` | overlay | Newest-first attempts; paging; selected identity | pending, ready, empty, failed | View attempt | `EV-013` |

Layout preview may use these identities and states; frontend design owns final composition and adaptive container.
