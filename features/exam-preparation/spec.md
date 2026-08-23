# Ôn tập ngôn ngữ và làm đề thi

> Business head: `d2bd19cee5b28a57fb18f843b840e3a3269e571bd6fcb02e90017ee0e101d096`
>
> This document is generated from the immutable business model. Update the model through `starci-business-analyze`; do not hand-edit this view.

## 1. Overview

Học viên khám phá topic, luyện phrase, mở catalog đề, làm bài không lộ đáp án, nhận điểm/giải thích, ghi study session và theo dõi progress/wrapped.

Included:
- Study home/explore/topic/practice
- Exam catalog/session
- Grade paper
- Progress and wrapped
- Exam download entitlement

Excluded:
- Course flashcards
- Coding judge
- Multiplayer games

## 2. Source heads

| Role | Repository | Head |
|---|---|---|
| fe | https://github.com/starci-lab/miamia-fe2.git | `775bc711bafd48675d6dc44beab81fad712a31da` |
| be | https://github.com/starci-lab/miamia-be.git | `9dc84d7278abb34030e8c8e6957e925abe4bef70` |

## 3. Actors and access

### Học viên đã xác thực

- Khám phá topic
- Luyện phrase
- Làm đề
- Xem kết quả
- Theo dõi tiến độ

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`

## 4. Entry points and surfaces

### Study

- ID: `study-home`
- Route: `/[lang]/study`
- Purpose: Tiếp tục topic/paper/phrase và nhìn tiến độ.
- Regions: `study-home-content`
- Navigation: none

Evidence: `EV-001`

### Chủ đề học

- ID: `study-topic`
- Route: `/[lang]/study/topics/[slug]`
- Purpose: Đọc tổng quan topic và bắt đầu luyện phrase.
- Regions: `study-topic-content`
- Navigation: none

Evidence: `EV-001`

### Kho đề

- ID: `exam-catalog`
- Route: `/[lang]/exam`
- Purpose: Duyệt đề visible cho learner và phân biệt demo/locked.
- Regions: `exam-catalog-content`
- Navigation: none

Evidence: `EV-001`, `EV-002`

### Phiên làm đề

- ID: `exam-session`
- Route: `/[lang]/exam/[slug]`
- Purpose: Trả lời câu hỏi và nhận kết quả chấm.
- Regions: `exam-session-content`
- Navigation: none

Evidence: `EV-001`, `EV-003`, `EV-004`

## 5. Business flows

### Ôn tập và làm đề

Trigger: Học viên mở Study hoặc Exam.

1. **learner** — Chọn điểm tiếp tục hoặc khám phá. → Topic, practice hoặc exam được mở.
2. **learner** — Mở topic và bắt đầu practice. → Phrase practice được mở theo slug.
3. **learner** — Chọn đề trong catalog. → Exam session được mở theo slug.
4. **learner** — Chọn đáp án và nộp đề. → Attempt, score và giải thích được trả về.

Outcomes:
- Attempt và answer rows được lưu
- Study session phản ánh thời gian làm bài
- Đáp án không lộ trước khi chấm

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`

## 6. Business rules

### BR-01

Paper detail đưa các lựa chọn cho thí sinh nhưng không chứa answer hay isCorrect trước khi nộp.

Strength: **confirmed** · Evidence: `EV-004`

### BR-02

Grade paper lưu attempt, answer và study session trong giao dịch; retake được tính attempt nhưng không farm thêm XP cho cùng paper.

Strength: **confirmed** · Evidence: `EV-004`

## 7. State model

- **Đang tải hoặc đang xử lý** (`pending`, pending) → ready, empty, error — `EV-001`, `EV-002`, `EV-003`, `EV-004`
- **Dữ liệu sẵn sàng** (`ready`, success) → Thực hiện hành động tiếp theo — `EV-001`, `EV-002`, `EV-003`, `EV-004`
- **Không có dữ liệu phù hợp** (`empty`, empty) → Đổi bộ lọc, Quay lại — `EV-001`
- **Không thể hoàn tất yêu cầu** (`error`, error) → Thử lại — `EV-001`, `EV-002`, `EV-003`, `EV-004`

## 8. Entities and data

- **Đề thi**: id, slug, kind, level, durationMinutes, questionCount, title, isDemo, isLocked — `EV-001`, `EV-002`, `EV-003`, `EV-004`
- **Lượt làm đề**: attemptId, paper, answers, score, maxScore, submittedAt, secondsSpent — `EV-001`, `EV-002`, `EV-003`, `EV-004`
- **Chủ đề học**: id, slug, phrases, progress — `EV-001`, `EV-002`, `EV-003`, `EV-004`

## 9. Operations and APIs

- **papers** (query, backend) — input: authenticated learner; output: visible paper catalog; failures: Unauthenticated, GraphQL error — `EV-002`, `EV-003`, `EV-004`
- **gradePaper** (mutation, backend) — input: paper slug, selected answers, seconds spent; output: attemptId, score, maxScore, graded answers; failures: Paper not found, Invalid answer payload — `EV-002`, `EV-003`, `EV-004`

## 10. Acceptance conditions

- **AC-01** Study route phải mount landing và có lối sang explore. — `EV-001`
- **AC-02** Topic và practice phải dùng cùng slug ổn định. — `EV-001`
- **AC-03** Catalog phải dùng paper visibility server trả về. — `EV-001`, `EV-002`
- **AC-04** Payload trước nộp không được chứa answer/isCorrect; submit phải lưu attempt và study session. — `EV-001`, `EV-003`, `EV-004`

## 11. Explicit unknowns

- **Bề mặt FE chuyên dụng nào hiển thị exam download entitlement và URL tải?** — Không thêm package/download panel ngoài pricing khi route hiện tại không chứng minh placement.

## 12. Evidence index

| ID | Role | Source | Kind | Claim |
|---|---|---|---|---|
| EV-001 | fe | `src/app/routes.spec.tsx:5` | route | Frontend khai báo exam catalog/session và study home/explore/topic/practice routes. |
| EV-002 | fe | `src/modules/api/graphql/queries/query-papers.ts:5` | api | Frontend đọc paper catalog được xác thực với metadata và demo/locked states. |
| EV-003 | fe | `src/modules/api/graphql/mutations/mutation-grade-paper.ts:5` | api | Frontend nộp answer request và đọc attemptId, score cùng graded answers. |
| EV-004 | be | `test/e2e/exam-progress.e2e-spec.ts:333` | test | Backend lưu attempt/answers/study session, chống farm XP khi retake và không lộ đáp án trước submit. |
