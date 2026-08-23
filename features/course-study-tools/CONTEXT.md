# Công cụ ôn tập trong khóa học

> Business identity: `miamia/course-study-tools@d77b54a12f55a97a7860bbe5b47129de67c16a2e299bcc008619c26177ab6698`
>
> Source heads: `fe@775bc711bafd`, `be@9dc84d7278ab`
>
> Load this file first. Load only the modules named by the current task.

## Decision capsule

**Purpose.** Học viên dùng flashcard review/quiz có session lưu bền, đọc nền tảng theo danh mục, duyệt mind map và xem thông tin công ty tuyển dụng gắn với khóa học.

**Primary actor.** Học viên đã xác thực

**Primary outcome.** Flashcard session có thể tiếp tục và có result riêng

**Never does.** Nội dung bài học chính

## Invariants

- `BR-01` — Flashcard review có deck inventory, due queue và session lưu bền; quiz và review dùng URL session/result riêng.

## Primary flow

```text
pending → pending → pending → pending → ready
```

## Surface map

| Surface | Route | Owns | Module |
|---|---|---|---|
| `course-flashcards` | `/[lang]/courses/[displayId]/learn/flashcards/{review|quiz}/...` | Chọn deck hoặc due queue, chạy session và xem result. | [surface](surfaces/course-flashcards.md) |
| `course-foundations` | `/[lang]/courses/[displayId]/learn/foundations/[categoryId]/[foundationId]` | Duyệt category và đọc tài nguyên nền tảng. | [surface](surfaces/course-foundations.md) |
| `course-mind-map` | `/[lang]/courses/[displayId]/learn/mind-map` | Duyệt và tìm các node kiến thức của khóa. | [surface](surfaces/course-mind-map.md) |
| `course-headhunting` | `/[lang]/courses/[displayId]/learn/headhuntings` | Xem công ty tuyển dụng và gợi ý liên quan tới khóa. | [surface](surfaces/course-headhunting.md) |
| `course-leaderboard` | `/[lang]/courses/[displayId]/learn/leaderboard` | So sánh thứ hạng trong phạm vi khóa học. | [surface](surfaces/course-leaderboard.md) |

## Data and operation map

| Operation | Owner | Input | Result |
|---|---|---|---|
| `flashcardDecksByCourse / myDueFlashcards` | frontend | courseId, limit | decks, due cards |

## Explicit unknowns

- `study-tools-backend-contract` — Các resolver flashcard, foundation, mind-map, headhunting và course leaderboard nằm ở đâu trong BE current head? Impact: Không coi các GraphQL documents và route FE là bằng chứng backend đã triển khai.

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
