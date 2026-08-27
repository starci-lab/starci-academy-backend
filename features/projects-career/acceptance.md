# Acceptance · Projects and career

| ID | Observable result | Evidence/test |
|---|---|---|
| `PP-AC-01` | Roadmap, task, result, settings and history render pending, ready, empty, denied, partial and recoverable failure states without losing semantic navigation. | `EV-001`, `EV-002`, `EV-003`, `EV-009`, `EV-010` |
| `PP-AC-02` | Changing language changes the selected brief or implementation where authored and the same language is included in the review request. | `EV-011`, `EV-012`, `EV-014` |
| `PP-AC-03` | Selecting a concrete model sends its model and provider; selecting Auto omits both; the result shows the actual served model. | `EV-010`, `EV-011`, `EV-012`, `EV-013`, `EV-014` |
| `PP-AC-04` | Unavailable or unentitled models cannot be submitted and explain why; availability changing during submit returns an actionable error. | `EV-011`, `EV-012` |
| `PP-AC-05` | Private-token save, replace and clear never expose the token and only return the last-four indicator. | `EV-015` |
| `PP-AC-06` | Queued and processing grading survives reload, prevents accidental duplicate review and resolves to completed or retryable failed state. | `EV-010`, `EV-016` |
| `PP-AC-07` | Attempt history is newest-first; selecting an attempt changes score, served model and feedback together; paging preserves selected identity. | `EV-013` |
| `PP-AC-08` | A failed result links back to revision with settings preserved; a passed result links to the backend-determined next task. | `EV-004`, `EV-010`, `EV-013` |
| `PP-AC-09` | The task brief remains usable when repository, model catalog, attempt-history or feedback data is unavailable. | `EV-009`, `EV-010` |
| `PP-AC-10` | Joint UAT runs Challenge and Personal Project after both are delivered while defects and authority remain attributed to their owning branch. | `EV-010` |
| `AC-03` | The backend exposes the headhunting company list used by the career directory. | `EV-008` |

## Completion

- Every declared state is represented.
- Every explicit model choice changes the submitted review intent.
- Secret repository credentials remain write-only.
- Personal Project and Challenge are jointly UAT-tested only after both deliveries, with defects attributed to their owning branch.
