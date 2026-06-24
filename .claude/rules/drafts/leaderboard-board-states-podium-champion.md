# Draft — Leaderboard board: adaptive theo SỐ người (1→champion · ≥3→podium · else→list) + refresh dời khỏi PageHeader (2026-06-25)

- File/§ đích khi `/merge`: `concepts/` (leaderboard/ranking) + [[highlight-accent-as-detail-not-block-fill]] + [[progress-block-growing-quantity-headline-not-vanity-strip]] + [[elements/header.md]].
- Bối cảnh: thầy: *"render bên phải lại cho đẹp · hồng nguyên khối nhìn ghê · podium cũng được · xóa coding · bỏ icon làm mới render ở dưới không ngang hàng PageHeader"*.

## Luật (STRICT)
- **Board xếp hạng ADAPT theo số người (đừng 1 layout cho mọi cỡ data):**
  - **1 người** → 1 **champion card** (surface + crown + "Hạng #1 · đang dẫn đầu" + XP), KHÔNG để 1 row trơ trọi/1 card hồng. (Khoá ít học viên — vd System Design.)
  - **≥3 người** → **podium top-3** (rank-1 giữa + crown, bệ surface trung tính; viewer = ring accent + bệ `bg-accent/15` nhỏ) + **list** rank 4+.
  - **2 người** → list phẳng (không podium, không champion).
- **Podium = surface trung tính, accent chỉ cho pedestal CỦA TÔI** (ring + `bg-accent/15`), crown cho #1. KHÔNG tô hồng cả 3 bệ. Ref [[highlight-accent-as-detail-not-block-fill]].
- **Nút refresh KHÔNG nằm ở PageHeader `actions` (top, ngang hàng tiêu đề).** Dời xuống **toolbar của board** (hàng "Xếp hạng theo X" + "Cập nhật {time}") + **bỏ icon** (text-only `variant="ghost"`). Lý do thầy: refresh là thao tác phụ của board → ở cạnh board, không tranh chỗ với tiêu đề trang. (Đính chính: PageHeader `actions` để dành cho CTA chính của trang, không phải refresh phụ.)
- **Xóa hạng mục chưa có data** (Coding — global, chưa course-scope) khỏi rail/chips thay vì để placeholder "Sắp có". Bật lại khi BE có (hướng B).

## Seed demo (BE, local)
- Leaderboard đọc `user_course_progress_projections` (jsonb `value.totalXp/totalScore/lessonsRead/milestoneProgress/completedChallenges`) JOIN `users` + `enrollments`, WHERE totalXp>0. Cột thật: `created_at/updated_at/value/default_locale/user_id/course_id` (KHÔNG có refreshed_at). Enrollment cần `pricing_phase` enum (`pioneer|earlyBird|regular`).
- Local **KHÔNG có Debezium/Connect** (chỉ Kafka) → CDC không chạy → **direct-upsert projection persist** (app không recompute khi ghi thẳng DB). Seed: reuse 8 fake user seed sẵn + enroll + upsert projection. Script `scratch/seed-leaderboard.cjs`. FS=5 (minh 42·huyen 27·viewer 9 #3·thanh 6·linh 3), SD=1.

## ĐÃ ÁP DỤNG 2026-06-25 (FE)
- `Leaderboard`: `LeaderboardPodium` (top-3) + `LeaderboardChampion` (1 người) mới; `LeaderboardTable` softening (bỏ bg-accent/10, XP accent chỉ viewer, crown #1); index adaptive (isSole/showPodium/list); refresh → toolbar board (no icon, ghost); bỏ Coding (rail+chips+categories); xoá `MyRankCard`+`XpBreakdown`. i18n `leaderboard.champion`. tsc/eslint/JSON sạch.
