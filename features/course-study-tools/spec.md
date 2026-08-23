# Công cụ ôn tập trong khóa học

> Business head: `d77b54a12f55a97a7860bbe5b47129de67c16a2e299bcc008619c26177ab6698`
>
> This document is generated from the immutable business model. Update the model through `starci-business-analyze`; do not hand-edit this view.

## 1. Overview

Học viên dùng flashcard review/quiz có session lưu bền, đọc nền tảng theo danh mục, duyệt mind map và xem thông tin công ty tuyển dụng gắn với khóa học.

Included:
- Flashcard review và quiz
- Foundation catalog và reader
- Mind map
- Headhunting companies
- Course leaderboard

Excluded:
- Nội dung bài học chính
- Mock interview
- Coding practice ngoài khóa

## 2. Source heads

| Role | Repository | Head |
|---|---|---|
| fe | https://github.com/starci-lab/miamia-fe2.git | `775bc711bafd48675d6dc44beab81fad712a31da` |
| be | https://github.com/starci-lab/miamia-be.git | `9dc84d7278abb34030e8c8e6957e925abe4bef70` |

## 3. Actors and access

### Học viên đã xác thực

- Ôn flashcard
- Làm quiz flashcard
- Đọc foundation
- Tìm node mind map
- Xem công ty và leaderboard khóa

Evidence: `EV-001`, `EV-002`

## 4. Entry points and surfaces

### Flashcards

- ID: `course-flashcards`
- Route: `/[lang]/courses/[displayId]/learn/flashcards/{review|quiz}/...`
- Purpose: Chọn deck hoặc due queue, chạy session và xem result.
- Regions: `course-flashcards-content`
- Navigation: none

Evidence: `EV-001`, `EV-002`

### Foundations

- ID: `course-foundations`
- Route: `/[lang]/courses/[displayId]/learn/foundations/[categoryId]/[foundationId]`
- Purpose: Duyệt category và đọc tài nguyên nền tảng.
- Regions: `course-foundations-content`
- Navigation: none

Evidence: `EV-001`

### Mind map

- ID: `course-mind-map`
- Route: `/[lang]/courses/[displayId]/learn/mind-map`
- Purpose: Duyệt và tìm các node kiến thức của khóa.
- Regions: `course-mind-map-content`
- Navigation: none

Evidence: `EV-001`

### Cơ hội tuyển dụng

- ID: `course-headhunting`
- Route: `/[lang]/courses/[displayId]/learn/headhuntings`
- Purpose: Xem công ty tuyển dụng và gợi ý liên quan tới khóa.
- Regions: `course-headhunting-content`
- Navigation: none

Evidence: `EV-001`

### Bảng xếp hạng khóa

- ID: `course-leaderboard`
- Route: `/[lang]/courses/[displayId]/learn/leaderboard`
- Purpose: So sánh thứ hạng trong phạm vi khóa học.
- Regions: `course-leaderboard-content`
- Navigation: none

Evidence: `EV-001`

## 5. Business flows

### Dùng công cụ ôn tập

Trigger: Học viên chọn một công cụ từ learn shell.

1. **learner** — Chọn review hoặc quiz và mở session. → Session lưu bền được tạo hoặc tiếp tục.
2. **learner** — Mở category rồi chọn resource. → Tài nguyên nền tảng được hiển thị.
3. **learner** — Tìm và chọn node. → Chi tiết node hoặc liên kết liên quan được mở.
4. **learner** — Chọn một công ty. → Chi tiết và gợi ý công ty được hiển thị.
5. **learner** — Mở bảng xếp hạng khóa. → Standing được hiển thị.

Outcomes:
- Flashcard session có thể tiếp tục và có result riêng
- Catalog công cụ phân biệt empty và failed

Evidence: `EV-001`, `EV-002`

## 6. Business rules

### BR-01

Flashcard review có deck inventory, due queue và session lưu bền; quiz và review dùng URL session/result riêng.

Strength: **partial** · Evidence: `EV-001`, `EV-002`

## 7. State model

- **Đang tải hoặc đang xử lý** (`pending`, pending) → ready, empty, error — `EV-001`, `EV-002`
- **Dữ liệu sẵn sàng** (`ready`, success) → Thực hiện hành động tiếp theo — `EV-001`, `EV-002`
- **Không có dữ liệu phù hợp** (`empty`, empty) → Đổi bộ lọc, Quay lại — `EV-001`
- **Không thể hoàn tất yêu cầu** (`error`, error) → Thử lại — `EV-001`, `EV-002`

## 8. Entities and data

- **Bộ flashcard**: id, displayId, title, difficulty, dueCount, masteredCount, cards — `EV-001`, `EV-002`
- **Tài nguyên nền tảng**: categoryId, foundationId, title, body — `EV-001`, `EV-002`
- **Mục công cụ khóa học**: id, title, description, status — `EV-001`, `EV-002`

## 9. Operations and APIs

- **flashcardDecksByCourse / myDueFlashcards** (query, frontend) — input: courseId, limit; output: decks, due cards; failures: GraphQL error, Empty deck inventory — `EV-002`

## 10. Acceptance conditions

- **AC-01** Review/quiz phải dùng sessionId ổn định và result route tương ứng. — `EV-001`, `EV-002`
- **AC-02** Mỗi category/resource phải giữ identity route riêng. — `EV-001`
- **AC-03** Mind map phải phân biệt không có graph với không có kết quả tìm kiếm. — `EV-001`
- **AC-04** List và detail phải có empty/not-found/failed trung thực. — `EV-001`
- **AC-05** Bảng xếp hạng phải có pending/ready/empty/failed. — `EV-001`

## 11. Explicit unknowns

- **Các resolver flashcard, foundation, mind-map, headhunting và course leaderboard nằm ở đâu trong BE current head?** — Không coi các GraphQL documents và route FE là bằng chứng backend đã triển khai.

## 12. Evidence index

| ID | Role | Source | Kind | Claim |
|---|---|---|---|---|
| EV-001 | fe | `src/app/routes.spec.tsx:20` | route | Frontend khai báo đầy đủ route flashcard, foundation, headhunting, course leaderboard và mind-map. |
| EV-002 | fe | `src/modules/api/graphql/queries/query-flashcard-decks-by-course.ts:47` | api | Frontend đọc deck inventory, mastery counters và due queue được xác thực cho course. |
