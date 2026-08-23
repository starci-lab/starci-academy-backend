# Ôn tập ngôn ngữ và làm đề thi

> Business identity: `miamia/exam-preparation@d2bd19cee5b28a57fb18f843b840e3a3269e571bd6fcb02e90017ee0e101d096`
>
> Source heads: `fe@775bc711bafd`, `be@9dc84d7278ab`
>
> Load this file first. Load only the modules named by the current task.

## Decision capsule

**Purpose.** Học viên khám phá topic, luyện phrase, mở catalog đề, làm bài không lộ đáp án, nhận điểm/giải thích, ghi study session và theo dõi progress/wrapped.

**Primary actor.** Học viên đã xác thực

**Primary outcome.** Attempt và answer rows được lưu

**Never does.** Course flashcards

## Invariants

- `BR-01` — Paper detail đưa các lựa chọn cho thí sinh nhưng không chứa answer hay isCorrect trước khi nộp.
- `BR-02` — Grade paper lưu attempt, answer và study session trong giao dịch; retake được tính attempt nhưng không farm thêm XP cho cùng paper.

## Primary flow

```text
pending → pending → pending → ready
```

## Surface map

| Surface | Route | Owns | Module |
|---|---|---|---|
| `study-home` | `/[lang]/study` | Tiếp tục topic/paper/phrase và nhìn tiến độ. | [surface](surfaces/study-home.md) |
| `study-topic` | `/[lang]/study/topics/[slug]` | Đọc tổng quan topic và bắt đầu luyện phrase. | [surface](surfaces/study-topic.md) |
| `exam-catalog` | `/[lang]/exam` | Duyệt đề visible cho learner và phân biệt demo/locked. | [surface](surfaces/exam-catalog.md) |
| `exam-session` | `/[lang]/exam/[slug]` | Trả lời câu hỏi và nhận kết quả chấm. | [surface](surfaces/exam-session.md) |

## Data and operation map

| Operation | Owner | Input | Result |
|---|---|---|---|
| `papers` | backend | authenticated learner | visible paper catalog |
| `gradePaper` | backend | paper slug, selected answers, seconds spent | attemptId, score, maxScore, graded answers |

## Explicit unknowns

- `exam-download-ui` — Bề mặt FE chuyên dụng nào hiển thị exam download entitlement và URL tải? Impact: Không thêm package/download panel ngoài pricing khi route hiện tại không chứng minh placement.

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
