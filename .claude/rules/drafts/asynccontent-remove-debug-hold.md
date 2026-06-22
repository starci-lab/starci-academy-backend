# Draft — BỎ HẲN cơ chế `debug` (3s hold) khỏi AsyncContent — nó là footgun gây "giật" (2026-06-22)

- File/§ đích khi `/merge`: `starci-async` (AsyncContent) + `main.md` §7 + **đính chính skill `starci-fe-skeleton-apply`**.
- Bối cảnh: thầy thấy dashboard/profile "skeleton giật giật". Gốc: prop `debug` của AsyncContent **giữ skeleton
  3000ms** (`DEBUG_HOLD_MS`, gated `publicEnv().debug` mặc định BẬT ở dev). `debug` được thêm để soi loading,
  nhưng **bị để sót `debug={true}` ở ~18 chỗ** khắp app (các lần skeleton-apply trước không gỡ) → mọi vùng giữ
  skeleton 3s → giật toàn app. Thầy: *"xóa hẳn debug khỏi AsyncContent luôn"*.

## Luật (STRICT)
- **AsyncContent KHÔNG còn prop `debug` / không còn 3s-hold.** Đã bỏ hẳn `debug`, `held` state, `useEffect` timer,
  `holdEnabled`, `DEBUG_HOLD_MS`, import `publicEnv`. Priority gọn lại: **`error → loading → empty → content`**.
  Lý do: 1 dev-affordance mà **mặc định bật + dễ để sót** = footgun → giữ skeleton 3s cho user thật = giật. Bỏ
  nguồn cơ = hết bệnh tận gốc, không ai bật lại được.
- **Soi loading từ giờ KHÔNG dùng `debug` prop** — dùng **Network throttle (DevTools)** hoặc tạm thêm `await sleep`
  ở fetcher khi cần. ĐÍNH CHÍNH skill `starci-fe-skeleton-apply`: bỏ bước "set `debug={true}` → hold 3s → gỡ".
- **Skeleton CHỈ cho vùng sẽ-có-nội-dung hoặc có empty-state HIỂN THỊ** (feed có "feedEmpty"). **Card TỰ ẨN**
  (`isEmpty` + KHÔNG `emptyContent` → `null`) thì skeleton vẫn OK *khi không còn 3s-hold* (chỉ nháy đúng thời gian
  load thật, rất ngắn) — nhưng nếu acc thường rỗng mà vẫn thấy nháy thì cân nhắc bỏ skeleton (chỉ hiện khi có data).
  Đừng bao giờ ép giữ skeleton bằng timer.
- **`isLoading` truyền vào = điều kiện ĐÃ RESOLVE** (`isLoading && !data` / `isLoading && items.length === 0`):
  SWR `isLoading` chỉ true ở lần load đầu (chưa có cache); revalidation (focus/mutate) KHÔNG bật lại skeleton.

## ĐÃ LÀM 2026-06-22
- `blocks/async/AsyncContent/index.tsx`: gỡ toàn bộ debug-hold. Quét sạch `debug={true}`/`debug` ở ~18 file
  (dashboard: ContinueLearning/DailyQuest/StreakStrip/WeeklyGoals/OverviewContributions/ChangelogList/GlobalStanding/
  TopLearners/FeedTabs; profile: ProfileHero/ProfileActivity/ProfileAchievements/OverviewCourses/OverviewCodeSkills/
  OverviewChallengeSkills/OverviewContributions/ProfileCapstone/ProfilePinned). tsc/lint sạch.
- Giữ skeleton (AsyncContent) cho Trending/WhoToFollow/WeeklyChallenge/Feed — chỉ bỏ debug.
