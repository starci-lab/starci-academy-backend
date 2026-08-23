# Luyện bài coding và nhận verdict

> Business identity: `miamia/coding-practice@647e8e19e35baf9ac1c354c7d702583a4fbf40a93f808dddde7eca1ce110518b`
>
> Source heads: `fe@775bc711bafd`, `be@9dc84d7278ab`
>
> Load this file first. Load only the modules named by the current task.

## Decision capsule

**Purpose.** Học viên duyệt các domain phỏng vấn, lọc bài toán, đọc đề, viết lời giải theo ngôn ngữ và gửi source/telemetry tới hàng đợi chấm; verdict đến bất đồng bộ theo job.

**Primary actor.** Học viên đã xác thực

**Primary outcome.** Submission và job identity được tạo

**Never does.** Challenge trong course content

## Invariants

- `BR-01` — Danh sách lọc domain riêng với tag; hai trường không được coi là tương đương.
- `BR-02` — SubmitCodingSolution chỉ trả submissionId và jobId; verdict đến sau qua kênh job.

## Primary flow

```text
pending → pending → ready
```

## Surface map

| Surface | Route | Owns | Module |
|---|---|---|---|
| `coding-practice-hub` | `/[lang]/practice` | Chọn domain và nhìn mức thành thạo. | [surface](surfaces/coding-practice-hub.md) |
| `coding-domain` | `/[lang]/practice/[domain]` | Lọc và chọn bài trong một domain. | [surface](surfaces/coding-domain.md) |
| `coding-problem` | `/[lang]/practice/problem/[slug]` | Đọc đề, viết code, gửi chấm và theo dõi verdict. | [surface](surfaces/coding-problem.md) |

## Data and operation map

| Operation | Owner | Input | Result |
|---|---|---|---|
| `codingProblems` | frontend | domain, difficulty, tag, page, limit | total, problem rows |
| `submitCodingSolution` | frontend | slug, language, sourceCode, optional telemetry | submissionId, jobId |

## Explicit unknowns

- `coding-backend-contract` — Resolver và transport verdict current-head nào phục vụ codingProblems và submitCodingSolution? Impact: Không thể xác nhận danh sách ngôn ngữ, quota hoặc trạng thái verdict backend từ FE documents alone.

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
