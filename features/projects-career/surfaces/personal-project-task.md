# Surface · Personal project task

> ID: `personal-project-task` · Route: `/[lang]/courses/[displayId]/learn/personal-project/tasks/[taskId]`

## Job

Read the task, configure one explicit review intent, submit repository evidence and observe grading without losing the brief.

## Navigation

- `personal-project-roadmap` / Back to personal project — available in ready and recovery states

| Region | Kind | Real representative content | States | Actions | Evidence |
|---|---|---|---|---|---|
| `project-task-brief` | content | Brief; Criteria; Implementation guidance | pending, ready, error | none | `EV-002`, `EV-009` |
| `project-task-evaluation` | form | GitHub URL; language/model/branch summary; grading state; latest attempt | pending, ready, invalid, queued, processing, success, error, unavailable, forbidden | Grading settings, Evaluate, View result, Attempt history, Try again | `EV-002`, `EV-009`, `EV-011`, `EV-012`, `EV-016` |
| `personal-project-grading-settings` | overlay | Language; Auto or concrete model; Branch; Private token | pending, ready, saving, saved, failed, unavailable | Save settings | `EV-010`, `EV-011`, `EV-012`, `EV-014`, `EV-015` |

Layout preview may use these identities and states; frontend design owns final composition and adaptive container.
