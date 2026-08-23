# Học nội dung và làm thử thách khóa học

> Business identity: `miamia/course-learning@fca29fd742e7f48d54a7021439ff4c98d2d234b990d5e9aa8d74ed3003497554`
>
> Source heads: `fe@775bc711bafd`, `be@9dc84d7278ab`
>
> Load this file first. Load only the modules named by the current task.

## Decision capsule

**Purpose.** Học viên đã ghi danh mở Today, module và bài đọc, xem trạng thái premium, thảo luận Q&A, gửi deliverable thử thách và đọc kết quả chấm bất đồng bộ.

**Primary actor.** Học viên đã xác thực

**Primary outcome.** Nội dung premium có thể bị rút gọn thành paywall

**Never does.** Flashcard

## Invariants

- `BR-01` — Content query yêu cầu bearer token và có thể trả body khác nhau theo quyền premium của viewer.
- `BR-02` — Nộp challenge tạo một job chấm bất đồng bộ và trả jobId.

## Primary flow

```text
pending → pending → pending → ready
```

## Surface map

| Surface | Route | Owns | Module |
|---|---|---|---|
| `course-today` | `/[lang]/courses/[displayId]/learn` | Đề xuất bước học kế tiếp. | [surface](surfaces/course-today.md) |
| `course-content-reader` | `/[lang]/courses/[displayId]/learn/content/modules/[moduleId]/contents/[contentId]` | Đọc nội dung và hiểu vị trí trong module. | [surface](surfaces/course-content-reader.md) |
| `course-challenge` | `/[lang]/courses/[displayId]/learn/content/modules/[moduleId]/contents/[contentId]/challenges/[challengeId]` | Chọn deliverable và gửi bài để chấm. | [surface](surfaces/course-challenge.md) |
| `course-qa` | `/[lang]/courses/[displayId]/learn/qa` | Tìm và trao đổi câu hỏi trong phạm vi khóa học. | [surface](surfaces/course-qa.md) |

## Data and operation map

| Operation | Owner | Input | Result |
|---|---|---|---|
| `content` | frontend | content request, bearer token | localized content, module position, challenges |
| `submitChallengeSubmission` | frontend | challengeSubmissionId, optional GitHub URL/model/lang | jobId |

## Explicit unknowns

- `course-learning-backend-contract` — Resolver current-head nào triển khai content, challenge submission và course Q&A? Impact: Business model chỉ xác nhận bề mặt và GraphQL document phía FE; backend behavior chưa được coi là confirmed.

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
