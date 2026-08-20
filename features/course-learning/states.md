# States · Course learning and discussion

| State | Kind | Reader sees | Transitions | Evidence |
|---|---|---|---|---|
| `course-home-ready` | initial | Course home ready | lesson-ready | `EV-009`, `EV-010` |
| `lesson-ready` | initial | Lesson ready | lesson-pending, lesson-error | `EV-001`, `EV-002`, `EV-003` |
| `lesson-pending` | pending | Engagement pending | lesson-ready, lesson-error | `EV-007`, `EV-008` |
| `lesson-locked` | partial | Lesson locked | terminal | `EV-003` |
| `lesson-error` | error | Lesson failed | lesson-ready | `EV-003` |
