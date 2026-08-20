# Phỏng vấn, dự án cá nhân và playground

> Business identity: `miamia/course-applied-learning@8a1cb573eb6cacb2c3473534f955d06bdc6b1474a8a16f1d657512ae3778f822`
>
> Source heads: `fe@775bc711bafd`, `be@9dc84d7278ab`
>
> Load this file first. Load only the modules named by the current task.

## Decision capsule

**Purpose.** Học viên luyện phỏng vấn theo session, hoàn thành milestone/task dự án cá nhân và khởi tạo playground guided/free có pairing code và các bước thực hành.

**Primary actor.** Học viên đã xác thực

**Primary outcome.** Mỗi hoạt động có identity session/task riêng

**Never does.** Content reader

## Invariants

- `BR-01` — Mock interview session trả sessionId, prompt, seed topics và deadline; không phải dữ liệu tạm chỉ có ở client.
- `BR-02` — Playground session yêu cầu auth và entitlement, trả pairingCode cùng các bước ordered.

## Primary flow

```text
pending → pending → ready
```

## Surface map

| Surface | Route | Owns | Module |
|---|---|---|---|
| `mock-interview` | `/[lang]/courses/[displayId]/learn/mock-interview/...` | Cấu hình, thực hiện và xem kết quả phỏng vấn. | [surface](surfaces/mock-interview.md) |
| `personal-project` | `/[lang]/courses/[displayId]/learn/personal-project/tasks/[taskId]` | Theo dõi tiến độ, mở task, nộp và đọc feedback. | [surface](surfaces/personal-project.md) |
| `course-playground` | `/[lang]/courses/[displayId]/learn/playground/[slug]/session` | Chọn playground, ghép cặp và chạy các bước guided/free. | [surface](surfaces/course-playground.md) |

## Data and operation map

| Operation | Owner | Input | Result |
|---|---|---|---|
| `startMockInterviewSession` | frontend | courseId, level, mode, language/question settings | sessionId, seedTopics, deadlineAt |
| `createPlaygroundSession` | frontend | playgroundId, guided/free mode | session id, pairingCode, ordered steps |

## Explicit unknowns

- `applied-learning-backend-contract` — Resolver current-head nào triển khai mock interview, personal project và playground operations? Impact: Không coi các mutation FE là backend-confirmed cho tới khi route current BE được tìm thấy.

## LOADS

| Need | Read |
|---|---|
| Scope, terminology and exclusions | [overview.md](overview.md) |
| Actor permissions and ownership | [actors.md](actors.md) |
| One user journey | `flows/<flow-id>.md` |
| One renderable screen | `surfaces/<surface-id>.md` |
| Business invariants | [rules.md](rules.md) |
| State transitions | [states.md](states.md) |
| Entities, inputs, outputs and failures | [contracts.md](contracts.md) |
| Completion and regression proof | [acceptance.md](acceptance.md) |
| Machine rendering/query | [model.json](model.json) |
| Exact source provenance | [evidence.json](evidence.json) |

## Context rule

Do not load every module by default. `CONTEXT.md` plus the one flow or surface being changed is the normal prompt. `model.json` is authoritative for machines; Markdown files are generated projections. Unknowns remain unknown until routed source or an explicit owner decision resolves them.
