# Feature — Dashboard
> Trang chủ đăng nhập — 1 identity ổn định + 4 tab (Overview/Explore/Courses/Community). Nguồn: `features/dashboard` (composes `StreakStrip` · `WeeklyGoals` · `DailyQuest` · `TopLearners` · `RecommendedCourses` · `ContinueLearning`…).

- **Job**: "hôm nay tôi nên làm gì tiếp" — nhiều widget cùng identity, đổi bằng tab → shell [[dashboard-hub]] (mirror layout `PublicProfile`).
- **CTA**: KHÔNG 1 CTA toàn trang — mỗi widget mang micro-CTA riêng: `ContinueLearning` (primary "Tiếp tục học"), `DailyQuest` (nút "Nhận" chỉ hiện khi `allDone`), `StreakStrip` (nudge "học hôm nay" CHỈ khi hôm nay chưa active), `WeeklyGoals` ("Sửa mục tiêu" tertiary). → [[call-to-action]]
- **Links (onward)**: mỗi tab lazy-mount (chỉ tab mở mới fetch); `RecommendedCourses`/`TopLearners` dẫn ra course/profile; `WeeklyGoals` dẫn ra trang KPI editor. → [[content-linking]]
- **Psychology** — showcase đậm nhất, 4 cơ chế cùng lúc:
  1. **Hook loop / habit**: `StreakStrip` — dải 7 ngày + flame + nudge có ĐIỀU KIỆN (chỉ hiện khi `!activeToday`, không nag khi đã học).
  2. **Goal-gradient**: `WeeklyGoals` — % tổng hợp + bar per-metric luôn CHẠY (target mặc định hợp lý khi chưa tự đặt, [[meter-tracks-out-of-box-default-target]]) → luôn có "gần đích" để kéo.
  3. **Variable reward / quest-completion**: `DailyQuest` — checklist 3 việc → nút "Nhận" chỉ xuất hiện lúc xong hết, chip "Đã nhận" chốt trạng thái, gắn với reward wallet thật (không phải điểm ảo).
  4. **Social proof + reciprocity**: `TopLearners` — top-5 leaderboard + Follow inline trên hàng người lạ (Follow ngay tại điểm thấy thành tích của họ).
  5. **Cá nhân hoá có giá thật**: `RecommendedCourses` — giá đã áp loyalty discount thật của chính viewer + `discountReason`, không phải giảm giá giả để hối thúc. → [[persuasion-psychology]]
- **Ghi chú**: ví dụ chuẩn cho [[learning-surface-grounded-in-pedagogy-not-superficial-gamify]] — mọi phần thưởng bám tín hiệu học THẬT (KPI current/target, quest = đọc/challenge/flashcard, streak = ngày hoạt động thật), không phải điểm/tốc-độ ảo; mỗi widget tự `LabeledCard` + tự fetch/tự ẩn khi rỗng, không giả trạng thái để "trông đầy".
