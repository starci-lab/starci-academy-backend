# States · Practice and assessment

| State | Kind | Reader sees | Transitions | Evidence |
|---|---|---|---|---|
| `assessment-ready` | initial | Assessment ready | assessment-pending, assessment-error | `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-006` |
| `assessment-pending` | pending | Assessment pending | assessment-complete, assessment-error | `EV-009`, `EV-010` |
| `assessment-complete` | success | Assessment complete | terminal | `EV-008`, `EV-009`, `EV-010` |
| `assessment-error` | error | Assessment failed | assessment-ready | `EV-002`, `EV-009`, `EV-010` |
| `playground-catalog-ready` | initial | Playground catalog ready | playground-setup-pending | `EV-004`, `EV-014` |
| `playground-setup-pending` | pending | Playground setup pending | playground-setup-ready, playground-setup-error | `EV-014` |
| `playground-setup-ready` | success | Playground setup ready | playground-session-active | `EV-014` |
| `playground-setup-error` | error | Playground setup failed | playground-setup-pending | `EV-014` |
| `playground-session-active` | success | Playground session active | playground-session-reconnecting, playground-session-complete, playground-session-error | `EV-005`, `EV-014` |
| `playground-session-reconnecting` | pending | Playground session reconnecting | playground-session-active, playground-session-error | `EV-014` |
| `playground-session-complete` | success | Playground session complete | terminal | `EV-014` |
| `playground-session-error` | error | Playground session failed | playground-session-reconnecting | `EV-014` |
| `interview-no-session` | initial | No interview in progress | interview-setup-ready | `EV-015` |
| `interview-setup-ready` | initial | Interview setup ready | interview-creating, interview-active, interview-start-error | `EV-006`, `EV-010`, `EV-015` |
| `interview-creating` | pending | Creating interview | interview-active, interview-start-error | `EV-010`, `EV-015` |
| `interview-active` | success | Interview active | interview-saving-turn, interview-paused-resumable, interview-reconnecting, interview-completion-submitting, interview-abandoned | `EV-007`, `EV-010`, `EV-015` |
| `interview-saving-turn` | pending | Saving interview answer | interview-active, interview-completion-submitting, interview-save-error | `EV-015` |
| `interview-paused-resumable` | pending | Interview ready to resume | interview-active, interview-abandoned | `EV-015` |
| `interview-reconnecting` | pending | Restoring interview connection | interview-active, interview-save-error | `EV-015` |
| `interview-completion-submitting` | pending | Submitting completed interview | interview-grading, interview-save-error | `EV-015` |
| `interview-grading` | pending | Interview assessment in progress | interview-graded, interview-grading-delayed, interview-grading-error | `EV-008`, `EV-015` |
| `interview-graded` | success | Interview assessed | interview-setup-ready | `EV-008`, `EV-015` |
| `interview-start-error` | error | Interview could not start | interview-setup-ready | `EV-010`, `EV-015` |
| `interview-save-error` | error | Interview answer could not be confirmed | interview-active, interview-paused-resumable | `EV-015` |
| `interview-grading-delayed` | pending | Interview assessment delayed | interview-grading, interview-graded, interview-grading-error | `EV-015` |
| `interview-grading-error` | error | Interview assessment failed | interview-grading | `EV-015` |
| `interview-abandoned` | error | Interview abandoned | interview-setup-ready | `EV-015` |
