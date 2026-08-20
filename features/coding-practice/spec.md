# Luyện bài coding và nhận verdict

> Business head: `647e8e19e35baf9ac1c354c7d702583a4fbf40a93f808dddde7eca1ce110518b`
>
> This document is generated from the immutable business model. Update the model through `starci-business-analyze`; do not hand-edit this view.

## 1. Overview

Học viên duyệt các domain phỏng vấn, lọc bài toán, đọc đề, viết lời giải theo ngôn ngữ và gửi source/telemetry tới hàng đợi chấm; verdict đến bất đồng bộ theo job.

Included:
- Practice hub
- Danh sách theo domain
- Problem reader/editor
- Submit và async verdict

Excluded:
- Challenge trong course content
- Public profile coding proof

## 2. Source heads

| Role | Repository | Head |
|---|---|---|
| fe | https://github.com/starci-lab/miamia-fe2.git | `775bc711bafd48675d6dc44beab81fad712a31da` |
| be | https://github.com/starci-lab/miamia-be.git | `9dc84d7278abb34030e8c8e6957e925abe4bef70` |

## 3. Actors and access

### Học viên đã xác thực

- Duyệt domain
- Lọc bài theo độ khó/tag
- Viết lời giải
- Gửi chấm
- Theo dõi verdict

Evidence: `EV-001`, `EV-002`, `EV-003`

## 4. Entry points and surfaces

### Coding practice

- ID: `coding-practice-hub`
- Route: `/[lang]/practice`
- Purpose: Chọn domain và nhìn mức thành thạo.
- Regions: `coding-practice-hub-content`
- Navigation: none

Evidence: `EV-001`

### Bài theo domain

- ID: `coding-domain`
- Route: `/[lang]/practice/[domain]`
- Purpose: Lọc và chọn bài trong một domain.
- Regions: `coding-domain-content`
- Navigation: none

Evidence: `EV-001`, `EV-002`

### Trình giải bài

- ID: `coding-problem`
- Route: `/[lang]/practice/problem/[slug]`
- Purpose: Đọc đề, viết code, gửi chấm và theo dõi verdict.
- Regions: `coding-problem-content`
- Navigation: none

Evidence: `EV-001`, `EV-003`

## 5. Business flows

### Giải bài coding

Trigger: Học viên mở /[lang]/practice.

1. **learner** — Chọn domain. → Danh sách bài của domain được mở.
2. **learner** — Lọc rồi chọn bài. → Problem reader được mở theo slug.
3. **learner** — Viết và gửi lời giải. → submissionId/jobId được theo dõi tới verdict.

Outcomes:
- Submission và job identity được tạo
- Verdict không được giả lập từ response mutation

Evidence: `EV-001`, `EV-002`, `EV-003`

## 6. Business rules

### BR-01

Danh sách lọc domain riêng với tag; hai trường không được coi là tương đương.

Strength: **partial** · Evidence: `EV-002`

### BR-02

SubmitCodingSolution chỉ trả submissionId và jobId; verdict đến sau qua kênh job.

Strength: **partial** · Evidence: `EV-003`

## 7. State model

- **Đang tải hoặc đang xử lý** (`pending`, pending) → ready, empty, error — `EV-001`, `EV-002`, `EV-003`
- **Dữ liệu sẵn sàng** (`ready`, success) → Thực hiện hành động tiếp theo — `EV-001`, `EV-002`, `EV-003`
- **Không có dữ liệu phù hợp** (`empty`, empty) → Đổi bộ lọc, Quay lại — `EV-001`
- **Không thể hoàn tất yêu cầu** (`error`, error) → Thử lại — `EV-001`, `EV-002`, `EV-003`

## 8. Entities and data

- **Bài coding**: id, slug, title, difficulty, domain, points, tags — `EV-001`, `EV-002`, `EV-003`
- **Bài nộp coding**: submissionId, jobId, slug, language, sourceCode, telemetry, verdict — `EV-001`, `EV-002`, `EV-003`

## 9. Operations and APIs

- **codingProblems** (query, frontend) — input: domain, difficulty, tag, page, limit; output: total, problem rows; failures: GraphQL error — `EV-002`, `EV-003`
- **submitCodingSolution** (mutation, frontend) — input: slug, language, sourceCode, optional telemetry; output: submissionId, jobId; failures: Unsupported language, Judge queue failure, GraphQL error — `EV-002`, `EV-003`

## 10. Acceptance conditions

- **AC-01** Hub phải dẫn tới route domain ổn định. — `EV-001`
- **AC-02** Domain filter không được thay bằng tag filter. — `EV-001`, `EV-002`
- **AC-03** UI phải chờ verdict bất đồng bộ thay vì xem mutation response là kết quả chấm. — `EV-001`, `EV-003`

## 11. Explicit unknowns

- **Resolver và transport verdict current-head nào phục vụ codingProblems và submitCodingSolution?** — Không thể xác nhận danh sách ngôn ngữ, quota hoặc trạng thái verdict backend từ FE documents alone.

## 12. Evidence index

| ID | Role | Source | Kind | Claim |
|---|---|---|---|---|
| EV-001 | fe | `src/app/routes.spec.tsx:50` | route | Frontend khai báo practice hub, domain và problem routes. |
| EV-002 | fe | `src/modules/api/graphql/queries/query-coding-problems.ts:8` | api | Frontend đọc coding problems theo domain/difficulty/tag/page/limit và giữ domain khác tag. |
| EV-003 | fe | `src/modules/api/graphql/mutations/mutation-submit-coding-solution.ts:6` | api | Frontend gửi source và telemetry, nhận submissionId/jobId, rồi chờ verdict bất đồng bộ. |
