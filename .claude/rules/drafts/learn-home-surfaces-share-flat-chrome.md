# Draft — Các "home" trong khu Learn dùng CHUNG 1 chrome flat (content dashboard là chuẩn) (2026-06-21)

- File/§ đích khi `/merge`: `main.md` §3/§6 + [[course-home-no-duplicate-surfaces]] + [[three-tier-page-layout]].
- Bối cảnh: thầy chốt *"dựa vào content dashboard để redesign personal project"*. Trang Dự án cá nhân trước đó là
  3-card KPI + 4-stat ribbon; content home là flat (continue + progress + lộ trình). Thầy muốn **2 trang home cùng
  1 kiểu** = lấy content làm chuẩn, KHÔNG để mỗi trang một phong cách.

## Luật (STRICT)
- **Mọi trang "home/overview" của một surface trong khu Learn (content home, personal-project home, …) dùng CHUNG
  một chrome flat:** TIER-1 breadcrumb → TIER-2 header (title H3 + desc + 1 hàng chip meta/trạng thái) → TIER-3
  **khối continue+progress PHẲNG** (eyebrow + tên việc kế **semibold** + 1 nút primary "Tiếp tục" · `ProgressMeter`
  `showValue` · 1 dòng stat muted) → **lộ trình "Đi tiếp · <nhóm hiện tại>"** = list item của **nhóm đang ở** (rows
  có icon trạng thái done/active/locked/todo, bấm vào → mở item). **KHÔNG** dùng lưới card KPI + stat ribbon nữa.
- **List ĐẦY ĐỦ của surface sống ở RAIL, body chỉ "bạn đang ở đâu + việc kế".** Content: rail = ContentMap (cây
  module→bài); body = lộ trình module hiện tại. Personal-project: rail = MilestoneOutline (chặng→task); body = lộ
  trình **chặng hiện tại**. Body KHÔNG vẽ lại cả cây (ref [[course-home-no-duplicate-surfaces]]).
- **Data riêng của surface fold vào chrome chung, không phá layout.** Vd GitHub của personal-project → **1 chip
  trạng thái** trong header (connected = repo·branch xanh; chưa = "Chưa kết nối"), KHÔNG còn card riêng. Các số phụ
  (lần nộp, điểm TB, đang khoá) gộp vào **1 dòng stat muted** dưới meter, không dựng ribbon.
- **Mirror block + nhịp y nhau:** `ProgressMeter` + `ListRow` (icon leading: active=Play accent + `bg-accent/10`,
  done=CheckCircle success, locked=Lock muted, todo=Circle muted) + spacing gap-3 trong vùng / gap-6 chia vùng.
  Skeleton mirror cùng cấu trúc (continue block + path rows), KHÔNG còn skeleton 3-card+ribbon.
- **Hệ quả đã làm:** viết lại `PersonalProjectDashboard` theo chuẩn content (`CourseContents`); bỏ `LabeledCard`/
  `StatPair` ribbon; thêm key i18n `finalProject.dashboard.{completion,keepGoing,statsLine,taskDone,taskTodo}`.
  Cả 2 trang giờ đọc như một bộ.
