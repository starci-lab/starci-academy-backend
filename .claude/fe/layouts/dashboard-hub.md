# Pattern — Dashboard hub (navbar tab-strip + centered bare-identity/panel 2-col)

> Shell/route: `Dashboard` (`src/components/features/dashboard/index.tsx`, route `/dashboard`) — "logged-in home", GitHub-style. `PublicProfile` (route `/profile/[username]`) tái dùng CÙNG layout ("rebuilt on the proven PROFILE page layout" — 1 archetype, 2 chủ thể).

## Khi nào dùng
- Nhiều KHU nội dung ngang hàng cùng 1 identity/scope (Overview · Explore · Courses · Community…), KHÔNG phải nav phân cấp (không cần rail — xem [[when-rail]]). Đổi khu = đổi TAB (single-select loại-trừ), không phải button-group.

## Region map
1. **Tab strip** = navbar BOTTOM-LAYER (`DashboardTabsBar`, đăng ký qua `useRegisterNavbarBottomLayer`) — KHÔNG sticky/border riêng; navbar root chỉ mang 1 `border-b` duy nhất, rơi dưới lớp cuối.
2. **Body** = `mx-auto max-w-6xl` 2 cột từ `md:`:
   - **Aside trái** (`w-72 shrink-0`) — identity/standing BARE (không bọc card), ĐỨNG YÊN qua mọi tab (`DashboardIdentity`).
   - **Main phải** (`min-w-0 flex-1`) — panel của tab ĐANG chọn; **chỉ panel active MOUNT** (mỗi tab tự query, lazy — tab khác không render, không fetch idle).
3. **Mobile:** aside rồi content xếp DỌC (không rail, không drawer, cùng thứ tự DOM).
- URL sync: tab hiện tại đọc/ghi `?tab=` qua store dùng chung (`useDashboardTabStore`) — không chỉ local state (share được link).
- **★ 1 QUERY-PARAM = 1 WRITER tại 1 thời điểm (CHỐT 2026-07-13):** khi ≥2 component CÙNG mount trên 1 route và cùng mirror state của mình vào CÙNG 1 param (`?tab=`) bằng `router.replace` trong `useEffect`, chúng sẽ **giành param → ghi đè lẫn nhau vòng lặp = URL "giật"** (mỗi lần A ghi `?tab=history`, B thấy khác state của B → xoá/đổi → A thấy khác → ghi lại…). Fix: **GATE effect ghi-param theo ĐÚNG điều kiện UI của component đó ĐANG HIỂN THỊ** — chỉ owner đang-hiện mới ghi. Ca thật: `Flashcards` hub — parent mirror `overviewTab` (Học thẻ) + child `QuizSession` mirror `setupTab` (Hỏi nhanh) cùng ghi `?tab=`; parent effect chạy VÔ ĐIỀU KIỆN (kể cả ở quiz mode) → giành với child → giật. Sửa: parent gate `mode==="study" && session!=="due" && !deckId` (đúng điều kiện overview-tabs render); quiz mode để `QuizSession` sở hữu param. Nguyên tắc: shared param OK, nhưng effect-ghi phải chết khi UI của nó không hiện.

## Liên quan
[[when-rail]] (vì sao KHÔNG rail ở đây) · tabs (component canon: navbar-bottomlayer, single-select→tabs) · [[course-home-no-duplicate-surfaces]] / [[surface-lands-on-dashboard-no-auto-forward]] (IA quanh home/dashboard — không lặp surface, không auto-forward khỏi hub) · [[page-shell-selection]].
