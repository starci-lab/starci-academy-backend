# Học nội dung và làm thử thách khóa học

> Business head: `fca29fd742e7f48d54a7021439ff4c98d2d234b990d5e9aa8d74ed3003497554`
>
> This document is generated from the immutable business model. Update the model through `starci-business-analyze`; do not hand-edit this view.

## 1. Overview

Học viên đã ghi danh mở Today, module và bài đọc, xem trạng thái premium, thảo luận Q&A, gửi deliverable thử thách và đọc kết quả chấm bất đồng bộ.

Included:
- Today và spine nội dung
- Module và bài đọc
- Challenge và kết quả
- Q&A khóa học

Excluded:
- Flashcard
- Mock interview
- Personal project
- Playground

## 2. Source heads

| Role | Repository | Head |
|---|---|---|
| fe | https://github.com/starci-lab/miamia-fe2.git | `775bc711bafd48675d6dc44beab81fad712a31da` |
| be | https://github.com/starci-lab/miamia-be.git | `9dc84d7278abb34030e8c8e6957e925abe4bef70` |

## 3. Actors and access

### Học viên đã xác thực

- Tiếp tục bài học
- Đọc nội dung theo module
- Gửi thử thách
- Xem kết quả
- Đọc và gửi thảo luận

Evidence: `EV-001`, `EV-002`, `EV-003`

## 4. Entry points and surfaces

### Hôm nay

- ID: `course-today`
- Route: `/[lang]/courses/[displayId]/learn`
- Purpose: Đề xuất bước học kế tiếp.
- Regions: `course-today-content`
- Navigation: none

Evidence: `EV-001`

### Bài học

- ID: `course-content-reader`
- Route: `/[lang]/courses/[displayId]/learn/content/modules/[moduleId]/contents/[contentId]`
- Purpose: Đọc nội dung và hiểu vị trí trong module.
- Regions: `course-content-reader-content`
- Navigation: none

Evidence: `EV-001`, `EV-002`

### Thử thách

- ID: `course-challenge`
- Route: `/[lang]/courses/[displayId]/learn/content/modules/[moduleId]/contents/[contentId]/challenges/[challengeId]`
- Purpose: Chọn deliverable và gửi bài để chấm.
- Regions: `course-challenge-content`
- Navigation: none

Evidence: `EV-001`, `EV-003`

### Hỏi đáp khóa học

- ID: `course-qa`
- Route: `/[lang]/courses/[displayId]/learn/qa`
- Purpose: Tìm và trao đổi câu hỏi trong phạm vi khóa học.
- Regions: `course-qa-content`
- Navigation: none

Evidence: `EV-001`

## 5. Business flows

### Học và nộp thử thách

Trigger: Học viên mở một khóa đã ghi danh.

1. **learner** — Mở bước học hôm nay. → Học viên đi tới module hoặc nội dung tiếp theo.
2. **learner** — Đọc nội dung theo module. → Tiến tới nội dung hoặc challenge tiếp theo.
3. **learner** — Chọn deliverable và gửi bài. → Job chấm được tạo và route kết quả có thể theo dõi.
4. **learner** — Mở Q&A và tìm hoặc đặt câu hỏi. → Câu hỏi liên quan được hiển thị hoặc gửi.

Outcomes:
- Nội dung premium có thể bị rút gọn thành paywall
- Nộp challenge trả jobId để theo dõi chấm

Evidence: `EV-001`, `EV-002`, `EV-003`

## 6. Business rules

### BR-01

Content query yêu cầu bearer token và có thể trả body khác nhau theo quyền premium của viewer.

Strength: **partial** · Evidence: `EV-002`

### BR-02

Nộp challenge tạo một job chấm bất đồng bộ và trả jobId.

Strength: **partial** · Evidence: `EV-003`

## 7. State model

- **Đang tải hoặc đang xử lý** (`pending`, pending) → ready, empty, error — `EV-001`, `EV-002`, `EV-003`
- **Dữ liệu sẵn sàng** (`ready`, success) → Thực hiện hành động tiếp theo — `EV-001`, `EV-002`, `EV-003`
- **Không có dữ liệu phù hợp** (`empty`, empty) → Đổi bộ lọc, Quay lại — `EV-001`
- **Không thể hoàn tất yêu cầu** (`error`, error) → Thử lại — `EV-001`, `EV-002`, `EV-003`

## 8. Entities and data

- **Nội dung khóa học**: id, displayId, title, description, body, isPremium, minutesRead, module, challenges — `EV-001`, `EV-002`, `EV-003`
- **Bài nộp thử thách**: challengeSubmissionId, githubUrl, selectedModel, lang, jobId — `EV-001`, `EV-002`, `EV-003`

## 9. Operations and APIs

- **content** (query, frontend) — input: content request, bearer token; output: localized content, module position, challenges; failures: Not entitled, Not found, GraphQL error — `EV-002`, `EV-003`
- **submitChallengeSubmission** (mutation, frontend) — input: challengeSubmissionId, optional GitHub URL/model/lang; output: jobId; failures: Submission rejected, Grading job not queued — `EV-002`, `EV-003`

## 10. Acceptance conditions

- **AC-01** Route Today phải nhận displayId và có pending/ready/empty/failed. — `EV-001`
- **AC-02** Reader phải phân biệt content thật với body bị giới hạn premium. — `EV-001`, `EV-002`
- **AC-03** Nộp thành công phải trả jobId, không giả lập kết quả đồng bộ. — `EV-001`, `EV-003`
- **AC-04** Q&A phải có trạng thái empty và failed trung thực. — `EV-001`

## 11. Explicit unknowns

- **Resolver current-head nào triển khai content, challenge submission và course Q&A?** — Business model chỉ xác nhận bề mặt và GraphQL document phía FE; backend behavior chưa được coi là confirmed.

## 12. Evidence index

| ID | Role | Source | Kind | Claim |
|---|---|---|---|---|
| EV-001 | fe | `src/app/routes.spec.tsx:15` | route | Frontend khai báo challenge, result, content, module và content-home routes. |
| EV-002 | fe | `src/modules/api/graphql/queries/query-content.ts:6` | api | Content query yêu cầu auth, đọc body, premium flag, vị trí module và challenge data. |
| EV-003 | fe | `src/modules/api/graphql/mutations/mutation-submit-content-challenge.ts:27` | api | Frontend gửi challenge submission và nhận jobId chấm bất đồng bộ. |
