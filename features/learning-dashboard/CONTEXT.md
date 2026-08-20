# Trung tâm học tập cá nhân

> Business identity: `miamia/learning-dashboard@3590f9b4e7bb17050a6097bc4fd83741e1ce473f8c7e155a388f4ab6cbcdd1be`
>
> Source heads: `fe@775bc711bafd`, `be@9dc84d7278ab`
>
> Load this file first. Load only the modules named by the current task.

## Decision capsule

**Purpose.** Dashboard chỉ mở khi có phiên và tổ chức tổng quan, khám phá, khóa học và cộng đồng thành các tab; các khối đọc tiến độ, mục tiêu, hoạt động và gợi ý độc lập.

**Primary actor.** Học viên đã xác thực

**Primary outcome.** Người chưa có token được đưa tới /authentication

**Never does.** Định nghĩa lại dữ liệu của từng widget

## Invariants

- `BR-01` — Dashboard không mount nội dung khi chưa có session token và chuyển người đọc sang /authentication.
- `BR-02` — Chỉ overview, explore, courses và community là tab hợp lệ; giá trị khác trở về overview.
- `BR-03` — ContinueLearning trả con trỏ topic, paper và reviewPhrase cho người dùng đã xác thực.

## Primary flow

```text
ready
```

## Surface map

| Surface | Route | Owns | Module |
|---|---|---|---|
| `dashboard` | `/[lang]/dashboard` | Đưa người học tới tổng quan và các nhóm nội dung chính. | [surface](surfaces/dashboard.md) |

## Data and operation map

| Operation | Owner | Input | Result |
|---|---|---|---|
| `continueLearning` | backend | authenticated viewer | topic, paper, reviewPhrase |

## Explicit unknowns

- `dashboard-backend-parity` — Những query dashboard ngoài continueLearning hiện được resolver nào trong BE current head phục vụ? Impact: Các widget không có resolver tương ứng không được xem là contract backend đã xác nhận.

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
