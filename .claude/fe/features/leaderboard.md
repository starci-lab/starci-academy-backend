# Feature — Leaderboard
> Bảng xếp hạng theo khóa, chọn hạng mục XP (total/challenge/reading/milestone) — podium + table hoặc champion card khi chỉ 1 học viên. Nguồn: `features/learn/Leaderboard`.

- **Job**: xem-hạng + tự-đối-chiếu-XP-của-mình → shell [[master-detail-rail]]: `LeaderboardCategoryRail variant="rail"` (desktop, trong `LearnShell.leftRail`) làm trục lọc/sort, fold thành chip-row ngang (`variant="chips"`) trên mobile; board (podium/table/champion) là detail pane, re-rank client-side theo `?category=` — không refetch, chỉ đổi cách sort dữ liệu đã có.
- **CTA**: KHÔNG có 1 CTA hành động — đây là surface consumption/status. Chỉ có nút "refresh" (`ghost`, nhỏ) revalidate cache, và `TrialEnrollHook` ambient (tự ẩn khi đã trả phí) làm funnel enroll phụ. → [[call-to-action]]
- **Links (onward)**: category rail row click KHÔNG navigate route khác — chỉ đổi `?category=` để re-rank cùng board (rail-kiêm-filter, không phải rail-kiêm-nav); `TrialEnrollHook` funnel non-enrolled sang trang enroll khóa. → [[content-linking]]
- **Psychology**: mỗi rail row hiện *"XP của bạn trong hạng mục này"* = self-relevance/ego-involvement (lý do quay lại kiểm tra định kỳ); accent ring + chip "Bạn" trên row/podium của viewer = highlight-as-detail (KHÔNG tô nền cả row — đúng [[accent-system]]); `myRank`/`enrollmentCount` đều là số THẬT, không có social-proof giả. → [[persuasion-psychology]]
- **Ghi chú**: `LeaderboardCategoryRail` là ví dụ tốt cho "rail kiêm filter/sort, không chỉ nav" (elements/list §4) — cùng 1 component render cả rail dọc và chip ngang từ 1 nguồn data.
