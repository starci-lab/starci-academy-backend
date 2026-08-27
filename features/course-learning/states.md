# States · Course learning and discussion

| State | Kind | Reader sees | Transitions | Evidence |
|---|---|---|---|---|
| `course-home-ready` | initial | Course home ready | lesson-ready | `EV-009`, `EV-010` |
| `lesson-ready` | initial | Lesson ready | lesson-pending, lesson-error | `EV-001`, `EV-002`, `EV-003` |
| `lesson-pending` | pending | Engagement pending | lesson-ready, lesson-error | `EV-007`, `EV-008` |
| `lesson-locked` | partial | Lesson locked | terminal | `EV-003` |
| `lesson-error` | error | Lesson failed | lesson-ready | `EV-003` |
| `challenge-locked` | partial | Challenge locked | terminal | `EV-004`, `EV-016` |
| `challenge-ready` | initial | Challenge ready | challenge-draft | `EV-004`, `EV-016` |
| `challenge-draft` | pending | Challenge draft saved | challenge-draft, challenge-review | `EV-016` |
| `challenge-review` | pending | Challenge attempt review | challenge-draft, challenge-submitting | `EV-018`, `EV-020` |
| `challenge-submitting` | pending | Challenge submission accepted | challenge-evaluating, challenge-draft | `EV-016` |
| `challenge-evaluating` | pending | Challenge evaluating | challenge-result, challenge-evaluation-unavailable | `EV-016`, `EV-017` |
| `challenge-result` | success | Challenge result finalized | challenge-draft | `EV-005`, `EV-016`, `EV-017` |
| `challenge-evaluation-unavailable` | error | Challenge evaluation unavailable | challenge-evaluating, challenge-draft | `EV-016`, `EV-017` |
