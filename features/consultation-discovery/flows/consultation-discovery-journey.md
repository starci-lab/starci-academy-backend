# Flow · Consultation and project discovery

> ID: `consultation-discovery-journey` · Trigger: A buyer submits a project prompt from the landing page or opens the consultation route.

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | `buyer` | `consultation-chat` | Submit a free-text project prompt or a suggestion | A new consultation message is sent |
| 2 | `platform` | `consultation-chat` | Extract known scope and ask the next applicable missing questions | The durable requirements revision advances |
| 3 | `buyer` | `saved-consultation` | Open a validated saved conversation id | Message history and current requirements are restored |
| 4 | `buyer` | `consultation-chat` | Submit contact details, preferred channel and consent | A reachable lead is saved against the conversation |

## Outcomes

- TEDO holds a durable consultation, its current requirements revision and an optional consented follow-up lead

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`, `EV-008`
