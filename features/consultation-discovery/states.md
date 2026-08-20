# States · Consultation and project discovery

| State | Kind | Reader sees | Transitions | Evidence |
|---|---|---|---|---|
| `conversation-ready` | initial | Conversation ready | conversation-pending, lead-pending, conversation-error | `EV-001`, `EV-002`, `EV-003` |
| `conversation-pending` | pending | Message pending | discovery-partial, conversation-ready, conversation-error | `EV-005`, `EV-006` |
| `discovery-partial` | partial | Requirements incomplete | conversation-pending, lead-pending | `EV-006`, `EV-008` |
| `lead-pending` | pending | Lead submission pending | lead-saved, conversation-error | `EV-004`, `EV-007` |
| `lead-saved` | success | Lead saved | terminal | `EV-007` |
| `conversation-error` | error | Consultation failed | conversation-ready | `EV-005`, `EV-006` |
