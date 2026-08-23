# Phỏng vấn, dự án cá nhân và playground

> Business head: `8a1cb573eb6cacb2c3473534f955d06bdc6b1474a8a16f1d657512ae3778f822`
>
> This document is generated from the immutable business model. Update the model through `starci-business-analyze`; do not hand-edit this view.

## 1. Overview

Học viên luyện phỏng vấn theo session, hoàn thành milestone/task dự án cá nhân và khởi tạo playground guided/free có pairing code và các bước thực hành.

Included:
- Mock interview setup/session/result
- Personal project/tasks/results
- Playground catalog/setup/session

Excluded:
- Content reader
- Flashcards
- Coding interview problem catalog

## 2. Source heads

| Role | Repository | Head |
|---|---|---|
| fe | https://github.com/starci-lab/miamia-fe2.git | `775bc711bafd48675d6dc44beab81fad712a31da` |
| be | https://github.com/starci-lab/miamia-be.git | `9dc84d7278abb34030e8c8e6957e925abe4bef70` |

## 3. Actors and access

### Học viên đã xác thực

- Bắt đầu và tiếp tục mock interview
- Nộp task dự án
- Xem feedback
- Chạy playground guided hoặc free

Evidence: `EV-001`, `EV-002`, `EV-003`

## 4. Entry points and surfaces

### Mock interview

- ID: `mock-interview`
- Route: `/[lang]/courses/[displayId]/learn/mock-interview/...`
- Purpose: Cấu hình, thực hiện và xem kết quả phỏng vấn.
- Regions: `mock-interview-content`
- Navigation: none

Evidence: `EV-001`, `EV-002`

### Personal project

- ID: `personal-project`
- Route: `/[lang]/courses/[displayId]/learn/personal-project/tasks/[taskId]`
- Purpose: Theo dõi tiến độ, mở task, nộp và đọc feedback.
- Regions: `personal-project-content`
- Navigation: none

Evidence: `EV-001`

### Playground

- ID: `course-playground`
- Route: `/[lang]/courses/[displayId]/learn/playground/[slug]/session`
- Purpose: Chọn playground, ghép cặp và chạy các bước guided/free.
- Regions: `course-playground-content`
- Navigation: none

Evidence: `EV-001`, `EV-003`

## 5. Business flows

### Hoàn thành hoạt động ứng dụng

Trigger: Học viên chọn mock interview, personal project hoặc playground.

1. **learner** — Chọn cấu hình và chạy phiên phỏng vấn. → Session và result được lưu theo sessionId.
2. **learner** — Chọn task, nộp và mở result. → Feedback của attempt được hiển thị.
3. **learner** — Chọn playground và khởi tạo session. → Live session nhận pairing code và ordered steps.

Outcomes:
- Mỗi hoạt động có identity session/task riêng
- Kết quả được xem ở route riêng

Evidence: `EV-001`, `EV-002`, `EV-003`

## 6. Business rules

### BR-01

Mock interview session trả sessionId, prompt, seed topics và deadline; không phải dữ liệu tạm chỉ có ở client.

Strength: **partial** · Evidence: `EV-002`

### BR-02

Playground session yêu cầu auth và entitlement, trả pairingCode cùng các bước ordered.

Strength: **partial** · Evidence: `EV-003`

## 7. State model

- **Đang tải hoặc đang xử lý** (`pending`, pending) → ready, empty, error — `EV-001`, `EV-002`, `EV-003`
- **Dữ liệu sẵn sàng** (`ready`, success) → Thực hiện hành động tiếp theo — `EV-001`, `EV-002`, `EV-003`
- **Không có dữ liệu phù hợp** (`empty`, empty) → Đổi bộ lọc, Quay lại — `EV-001`
- **Không thể hoàn tất yêu cầu** (`error`, error) → Thử lại — `EV-001`, `EV-002`, `EV-003`

## 8. Entities and data

- **Phiên phỏng vấn**: sessionId, promptId, difficulty, level, mode, seedTopics, deadlineAt — `EV-001`, `EV-002`, `EV-003`
- **Task dự án cá nhân**: taskId, title, status, completionPercent, attempt, feedback — `EV-001`, `EV-002`, `EV-003`
- **Phiên playground**: id, pairingCode, mode, steps — `EV-001`, `EV-002`, `EV-003`

## 9. Operations and APIs

- **startMockInterviewSession** (mutation, frontend) — input: courseId, level, mode, language/question settings; output: sessionId, seedTopics, deadlineAt; failures: Not entitled, No question bank, GraphQL error — `EV-002`, `EV-003`
- **createPlaygroundSession** (mutation, frontend) — input: playgroundId, guided/free mode; output: session id, pairingCode, ordered steps; failures: Not enrolled, Not entitled, GraphQL error — `EV-002`, `EV-003`

## 10. Acceptance conditions

- **AC-01** Setup phải phân biệt phiên đang có với tạo phiên mới và không tự dựng seed topics. — `EV-001`, `EV-002`
- **AC-02** Task và result phải giữ taskId và displayId trong route. — `EV-001`
- **AC-03** Session chỉ bắt đầu khi backend trả id, pairingCode và steps. — `EV-001`, `EV-003`

## 11. Explicit unknowns

- **Resolver current-head nào triển khai mock interview, personal project và playground operations?** — Không coi các mutation FE là backend-confirmed cho tới khi route current BE được tìm thấy.

## 12. Evidence index

| ID | Role | Source | Kind | Claim |
|---|---|---|---|---|
| EV-001 | fe | `src/app/routes.spec.tsx:34` | route | Frontend khai báo setup/session/result cho mock interview, personal project và playground. |
| EV-002 | fe | `src/modules/api/graphql/mutations/mutation-start-mock-interview-session.ts:6` | api | Frontend khởi tạo durable mock interview session với prompt, seed topics và deadline. |
| EV-003 | fe | `src/modules/api/graphql/mutations/mutation-start-playground-session.ts:6` | api | Frontend khởi tạo playground session authenticated có guided/free mode, pairing code và ordered steps. |
