# Hồ sơ học viên và bằng chứng công khai

> Business identity: `miamia/learner-profile-social@4918556b21555242078594d54fcd5e78b2476920929e93531ebfff6a2316d9aa`
>
> Source heads: `fe@775bc711bafd`, `be@9dc84d7278ab`
>
> Load this file first. Load only the modules named by the current task.

## Decision capsule

**Purpose.** Người xem mở hồ sơ theo username, xem activity, coding skills, challenge submissions, capstone projects, CV và Wrapped; thành viên có thể follow/unfollow người khác theo edge idempotent.

**Primary actor.** Khách hoặc thành viên xem hồ sơ

**Primary outcome.** Mỗi nhóm bằng chứng có route riêng

**Never does.** Profile editing surface chưa có route

## Invariants

- `BR-01` — Profile lookup theo username là public và trả identity, bio, follow counts, lock/open-to-work cùng links nghề nghiệp.
- `BR-02` — Follow cùng target là idempotent, unfollow xóa edge, self-follow không ghi row và target deleted/missing bị từ chối.

## Primary flow

```text
pending → pending → pending → pending → ready
```

## Surface map

| Surface | Route | Owns | Module |
|---|---|---|---|
| `profile-overview` | `/[lang]/profile/[username]` | Tóm tắt identity, bio, follow state và tiến độ owner-only. | [surface](surfaces/profile-overview.md) |
| `profile-skills` | `/[lang]/profile/[username]/skills/[slug]` | Xem thống kê coding và submission đã accepted. | [surface](surfaces/profile-skills.md) |
| `profile-projects` | `/[lang]/profile/[username]/projects/[courseId]` | Xem pinned projects, capstone và roadmap milestone. | [surface](surfaces/profile-projects.md) |
| `profile-challenges` | `/[lang]/profile/[username]/challenges/[courseId]/[submissionId]` | Xem challenge đã pass theo course và submission. | [surface](surfaces/profile-challenges.md) |
| `profile-activity-cv-wrapped` | `/[lang]/profile/[username]/{activity|cv|wrapped}` | Xem thành tích, tài liệu CV công khai và tổng kết học tập. | [surface](surfaces/profile-activity-cv-wrapped.md) |

## Data and operation map

| Operation | Owner | Input | Result |
|---|---|---|---|
| `userProfile` | backend | username | public profile and follow state |
| `setFollow` | backend | target user, follow boolean, authenticated viewer | success envelope |

## Explicit unknowns

- `profile-evidence-backend-parity` — Các query profile evidence ngoài userProfile hiện do resolver current-head nào phục vụ? Impact: Không coi coding/challenge/project/CV/Wrapped public data là backend-confirmed nếu chưa tìm thấy resolver tương ứng.
- `profile-editing-route` — Bề mặt chỉnh sửa profile/avatar sẽ nằm ở route nào? Impact: Backend có update/presign operations nhưng FE routes hiện không chứng minh surface placement.

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
