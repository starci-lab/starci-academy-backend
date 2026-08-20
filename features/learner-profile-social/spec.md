# Hồ sơ học viên và bằng chứng công khai

> Business head: `4918556b21555242078594d54fcd5e78b2476920929e93531ebfff6a2316d9aa`
>
> This document is generated from the immutable business model. Update the model through `starci-business-analyze`; do not hand-edit this view.

## 1. Overview

Người xem mở hồ sơ theo username, xem activity, coding skills, challenge submissions, capstone projects, CV và Wrapped; thành viên có thể follow/unfollow người khác theo edge idempotent.

Included:
- Profile overview
- Activity
- Skills và coding proof
- Challenge proof
- Projects và roadmap
- Public CV
- Wrapped
- Follow state

Excluded:
- Profile editing surface chưa có route
- Direct chat
- Admin moderation

## 2. Source heads

| Role | Repository | Head |
|---|---|---|
| fe | https://github.com/starci-lab/miamia-fe2.git | `775bc711bafd48675d6dc44beab81fad712a31da` |
| be | https://github.com/starci-lab/miamia-be.git | `9dc84d7278abb34030e8c8e6957e925abe4bef70` |

## 3. Actors and access

### Khách hoặc thành viên xem hồ sơ

- Xem profile công khai
- Xem bằng chứng kỹ năng/dự án/challenge
- Follow hoặc unfollow khi đã đăng nhập

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`

## 4. Entry points and surfaces

### Hồ sơ học viên

- ID: `profile-overview`
- Route: `/[lang]/profile/[username]`
- Purpose: Tóm tắt identity, bio, follow state và tiến độ owner-only.
- Regions: `profile-overview-content`
- Navigation: none

Evidence: `EV-001`, `EV-002`, `EV-004`

### Kỹ năng coding

- ID: `profile-skills`
- Route: `/[lang]/profile/[username]/skills/[slug]`
- Purpose: Xem thống kê coding và submission đã accepted.
- Regions: `profile-skills-content`
- Navigation: none

Evidence: `EV-001`

### Dự án

- ID: `profile-projects`
- Route: `/[lang]/profile/[username]/projects/[courseId]`
- Purpose: Xem pinned projects, capstone và roadmap milestone.
- Regions: `profile-projects-content`
- Navigation: none

Evidence: `EV-001`

### Challenge proof

- ID: `profile-challenges`
- Route: `/[lang]/profile/[username]/challenges/[courseId]/[submissionId]`
- Purpose: Xem challenge đã pass theo course và submission.
- Regions: `profile-challenges-content`
- Navigation: none

Evidence: `EV-001`

### Hoạt động, CV và Wrapped

- ID: `profile-activity-cv-wrapped`
- Route: `/[lang]/profile/[username]/{activity|cv|wrapped}`
- Purpose: Xem thành tích, tài liệu CV công khai và tổng kết học tập.
- Regions: `profile-activity-cv-wrapped-content`
- Navigation: none

Evidence: `EV-001`

## 5. Business flows

### Xem bằng chứng hồ sơ

Trigger: Người xem mở /[lang]/profile/[username].

1. **viewer** — Mở profile và chọn nhóm bằng chứng. → Overview hoặc tab bằng chứng được mở.
2. **viewer** — Lọc history và mở một proof. → Chi tiết bài và accepted submission được hiển thị.
3. **viewer** — Chọn project hoặc capstone. → External project hoặc roadmap được mở.
4. **viewer** — Chọn course rồi submission. → Proof đã pass được hiển thị.
5. **viewer** — Chọn activity, CV hoặc Wrapped. → Bằng chứng tương ứng được hiển thị hoặc empty/error trung thực.

Outcomes:
- Mỗi nhóm bằng chứng có route riêng
- Follow edge phản ánh live counts và không trùng

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`

## 6. Business rules

### BR-01

Profile lookup theo username là public và trả identity, bio, follow counts, lock/open-to-work cùng links nghề nghiệp.

Strength: **confirmed** · Evidence: `EV-002`

### BR-02

Follow cùng target là idempotent, unfollow xóa edge, self-follow không ghi row và target deleted/missing bị từ chối.

Strength: **confirmed** · Evidence: `EV-004`

## 7. State model

- **Đang tải hoặc đang xử lý** (`pending`, pending) → ready, empty, error — `EV-001`, `EV-002`, `EV-003`, `EV-004`
- **Dữ liệu sẵn sàng** (`ready`, success) → Thực hiện hành động tiếp theo — `EV-001`, `EV-002`, `EV-003`, `EV-004`
- **Không có dữ liệu phù hợp** (`empty`, empty) → Đổi bộ lọc, Quay lại — `EV-001`
- **Không thể hoàn tất yêu cầu** (`error`, error) → Thử lại — `EV-001`, `EV-002`, `EV-003`, `EV-004`

## 8. Entities and data

- **Hồ sơ công khai**: id, username, displayName, bio, avatar, githubUsername, followerCount, followingCount, isFollowedByMe, profileLocked, openToWork, roleTitle, location, workMode, links — `EV-001`, `EV-002`, `EV-003`, `EV-004`
- **Bằng chứng hồ sơ**: skills, coding history, challenges, projects, CV, activity, wrapped — `EV-001`, `EV-002`, `EV-003`, `EV-004`
- **Quan hệ theo dõi**: followerId, followingId — `EV-001`, `EV-002`, `EV-003`, `EV-004`

## 9. Operations and APIs

- **userProfile** (query, backend) — input: username; output: public profile and follow state; failures: User not found, Profile locked — `EV-002`, `EV-003`, `EV-004`
- **setFollow** (mutation, backend) — input: target user, follow boolean, authenticated viewer; output: success envelope; failures: Target missing/deleted — `EV-002`, `EV-003`, `EV-004`

## 10. Acceptance conditions

- **AC-01** Public profile dùng username và follow state live; owner-only progress không lộ cho visitor. — `EV-001`, `EV-002`, `EV-004`
- **AC-02** Không có accepted submission phải hiển thị empty proof trung thực. — `EV-001`
- **AC-03** Pinned và capstone phải có loading/error/empty độc lập. — `EV-001`
- **AC-04** Route phải giữ courseId và submissionId của bằng chứng. — `EV-001`
- **AC-05** CV phải phân biệt empty, uncompiled, ready và error; Wrapped phải giữ route riêng. — `EV-001`

## 11. Explicit unknowns

- **Các query profile evidence ngoài userProfile hiện do resolver current-head nào phục vụ?** — Không coi coding/challenge/project/CV/Wrapped public data là backend-confirmed nếu chưa tìm thấy resolver tương ứng.
- **Bề mặt chỉnh sửa profile/avatar sẽ nằm ở route nào?** — Backend có update/presign operations nhưng FE routes hiện không chứng minh surface placement.

## 12. Evidence index

| ID | Role | Source | Kind | Claim |
|---|---|---|---|---|
| EV-001 | fe | `src/app/routes.spec.tsx:53` | route | Frontend khai báo activity, challenges, CV, overview, projects, skills, wrapped và self-profile routes. |
| EV-002 | fe | `src/modules/api/graphql/queries/query-user-profile.ts:6` | api | Frontend public lookup theo username đọc identity, bio, follow counts/state, lock/open-to-work và career links. |
| EV-003 | fe | `src/modules/api/graphql/mutations/mutation-set-follow.ts:8` | api | Frontend gửi follow boolean cho target user bằng mutation có auth. |
| EV-004 | be | `test/e2e/social-follows.e2e-spec.ts:72` | test | Backend follow edge idempotent, unfollow xóa row, self-follow no-op và missing/deleted target bị từ chối sạch. |
