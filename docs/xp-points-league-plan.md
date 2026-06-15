# XP · Points · Weekly League — plan

Mục tiêu: gamification **công bằng** cho nhiều khóa có "hệ XP" khác nhau, theo đúng
chuẩn ngành (Duolingo league + Khan % completion + flat effort currency).

---

## 1. Mô hình 2 currency (đặt tên chốt)

| Tên | Cột / field | Tính chất | Dùng cho | Công bằng vì |
|---|---|---|---|---|
| **XP** | `xp_histories.amount`, projection `totalXp` | **weighted, per-course** (challenge=raw score, read=3, milestone=10) | **Leaderboard per-course** (đua trong khóa) | cùng khóa = cùng bộ challenge |
| **Points (Điểm)** | `xp_histories.points`, `users.reward_points` | **phẳng, toàn cục** (mỗi hành động = số cố định ở MỌI khóa) | Widget "Tuần này" + **Weekly League** (đua toàn hệ) | 1 hành động = 1 số, bất kể khóa |

> Plumbing đã có sẵn: `writeXpHistory({amount, points})` ghi cả 2 + credit `users.reward_points`.
> Vấn đề hiện tại: **mọi caller đang truyền `points = amount`** → points đang bị weighted. Phase 1 sửa cái này.

---

## 2. Phase 1 — Flat Points (nhỏ, làm ngay)

### 2.1 Config bảng điểm phẳng → `app.yaml` (business config)
`systemConfig.points` (course-agnostic):
```yaml
systemConfig:
  points:
    lessonRead: 5
    challengePassed: 20      # cố định, KHÔNG theo raw score
    milestonePassed: 30
    codingSolved: 15
    aiLabPassed: 25
```
Thêm interface vào `filesystem/types/config.ts`, đọc qua `mountStorageService.appConfig`.

### 2.2 Decouple `points` khỏi `amount` ở 5 caller `writeXpHistory`
| Source | File | amount (giữ) | points (đổi → flat) |
|---|---|---|---|
| Challenge (git) | `process-git-submission-complete-step` | `grade.evaluation.score` | `points.challengePassed` |
| Challenge (gdocs) | `process-submission-complete-step` | `grade.evaluation.score` | `points.challengePassed` |
| Milestone | `review-milestone-task-complete-step` | `MILESTONE_PASS_XP` (10) | `points.milestonePassed` |
| Lesson read | `mark-as-readed.handler` | `LESSON_READ_XP` (3) | `points.lessonRead` |
| Coding | judge step (`awardPointsIfEligible`) | (score?) | `points.codingSolved` |
| AI Lab | `review-ai-lab-eval-complete-step` | (xp) | `points.aiLabPassed` |

### 2.3 Widget "Tuần này" đọc points
- `user-stats` projection: weekly đổi `SUM(amount)` → `SUM(points)` (rolling 7d). Field `weeklyXp` → `weeklyPoints`.
- FE: label "XP" → **"điểm"**; type `weeklyStats.xp` → `points`.
- Leaderboard per-course: **không đụng** (vẫn raw XP).

### 2.4 Lịch sử
`xp_histories.points` cũ đang = amount (weighted). Để nguyên (audit), hoặc 1 lần
`UPDATE` set points theo bảng phẳng cho row cũ (optional; weekly chỉ nhìn 7 ngày nên ít ảnh hưởng).

---

## 3. Phase 2 — Weekly League (cohort + reset, kiểu Duolingo)

### 3.1 Cohort + reset hoạt động ra sao
- **Tier (hạng)**: Bronze → Silver → Gold → Sapphire → Ruby → Emerald → Diamond (config được).
- **Cohort**: đầu mỗi tuần, gom người **cùng tier** thành nhóm ~**30 người**. Bạn chỉ đua với 30 người đó (không đua cả hệ → người mới không bị cày-thủ đè).
- **Trong tuần**: bảng xếp hạng cohort = **Points kiếm trong tuần** (flat → fair cross-course). Đọc thẳng từ ledger `xp_histories.points` trong cửa sổ [đầu tuần, cuối tuần].
- **Cuối tuần (reset, cron)**:
  1. **Đóng tuần**: mỗi cohort xếp hạng theo points tuần → **top K thăng hạng**, **đáy J xuống hạng**, giữa giữ nguyên.
  2. **Tạo cohort mới**: gom user "active" theo tier mới → shuffle → chia nhóm 30 → tuần mới bắt đầu.
  - "Reset" points tuần = **ngầm theo cửa sổ thời gian + cohort mới**, KHÔNG cần counter để xoá.

### 3.2 Data model
- `enum LeagueTier` (+ thứ tự, config promote/demote/size ở `app.yaml`).
- `LeagueCohortEntity` (`id`, `tier`, `week_start_at`, `week_end_at`).
- `UserLeagueEntity` (`user_id` PK, `tier`, `cohort_id` FK, `joined_week_at`).
  → **weekly points KHÔNG lưu** — derive từ `xp_histories.points` theo cửa sổ tuần (hoặc projection `league_standing` nếu cần tốc độ).

### 3.3 Reset cron (chạy mỗi tuần)
- `@Cron(envConfig().league.weeklyResetCron)` (vd Thứ 2 00:00 Asia/Ho_Chi_Minh).
- Bước: close-week (rank → update tier) → form-cohorts (bucket tier → shuffle → chunk 30 → insert + assign).
- Idempotent theo `week_start_at` (chạy lại không tạo trùng).

### 3.4 Đọc bảng xếp hạng (trong tuần)
- Query: members của cohort của tôi + SUM(points trong cửa sổ tuần) → rank.
- Hiển thị **promotion zone** (top K) / **demotion zone** (đáy J) + đếm ngược tới reset.
- Cân nhắc projection `user_league_standing` (eager + CDC trên xp_histories) nếu N lớn.

### 3.5 FE
- Trang/route League: badge tier, bảng cohort (avatar + points tuần + rank), vùng thăng/xuống hạng tô màu, countdown.
- Widget rail có thể thêm dòng "Hạng: Gold · #7".

### 3.6 New user / active
- User mới: vào **Bronze**, cohort kế tiếp.
- "Active" = kiếm ≥1 point trong tuần (người không học không chiếm slot cohort).

---

## 4. Open questions (cần thầy chốt cho Phase 2)
1. Danh sách tier + số **K thăng / J xuống** + **size cohort** (mặc định: 7 tier, K=10, J=5, size=30).
2. Mốc tuần + timezone (mặc định Thứ 2 00:00 +07).
3. League **global** (đúng tinh thần flat points) hay vẫn tách theo khóa? (khuyến nghị: global).
4. Có cần projection riêng cho standing không, hay query thẳng ledger (đủ với quy mô hiện tại ~89 user).

---

## 5. Phasing
- **P1 (nhỏ, làm ngay)**: flat points + widget đọc points. Không cần migration nặng.
- **P2 (feature)**: weekly league (entity + cron + read + FE). Sau khi chốt §4.
