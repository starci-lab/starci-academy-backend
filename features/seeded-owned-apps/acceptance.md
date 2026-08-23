# Acceptance · Seeded owned apps

| ID | Observable result | Evidence/test |
|---|---|---|
| `AC-01` | Repeated backend boot does not duplicate either seeded owned app for tester@nivo.local. | `EV-001`, `EV-005` |
| `AC-02` | myInstances returns one ai_academy row labelled Học viện Chuyên gia and one mmo row labelled MMO for the demo owner. | `EV-003`, `EV-004`, `EV-005` |
| `AC-03` | The MMO seed creates no provisioning request, deployment, chart install, catalogue order or MMO-specific detail row. | `EV-002`, `EV-003`, `EV-005` |

## Completion

- Every current surface state is represented.
- Every business rule has evidence.
- Every operation has input, output and failure ownership.
- Unknowns are explicit and never rendered as facts.
- FE/BE source heads match the business head.
