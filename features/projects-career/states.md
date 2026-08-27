# States · Projects and career

| State | Kind | Reader sees | Transitions | Evidence |
|---|---|---|---|---|
| `project-ready` | initial | Roadmap ready | task-ready, project-error | `EV-001`, `EV-004` |
| `task-ready` | ready | Task brief and submission workspace ready | settings-ready, submission-validating, project-error | `EV-002`, `EV-009`, `EV-011` |
| `settings-ready` | ready | Review settings ready | task-ready, submission-validating, project-error | `EV-011`, `EV-015` |
| `submission-validating` | pending | Review intent validating | grading-queued, retry-ready | `EV-012` |
| `grading-queued` | pending | Review queued | grading-processing, retry-ready | `EV-016` |
| `grading-processing` | pending | Review processing | result-ready, retry-ready | `EV-016` |
| `result-ready` | success | Selected attempt result ready | revision-ready, next-task-ready | `EV-003`, `EV-013` |
| `revision-ready` | ready | Failed attempt ready for revision | task-ready | `EV-010`, `EV-013` |
| `next-task-ready` | success | Passed attempt ready for next task | task-ready | `EV-004`, `EV-013` |
| `retry-ready` | error | Terminal review failure ready to retry | task-ready, submission-validating | `EV-010`, `EV-016` |
| `project-error` | error | Recoverable roadmap or task dependency failure | project-ready, task-ready | `EV-004`, `EV-009` |
| `career-ready` | ready | Career surface ready | career-error | `EV-005`, `EV-008` |
| `career-error` | error | Career request failed | career-ready | `EV-005`, `EV-008` |
