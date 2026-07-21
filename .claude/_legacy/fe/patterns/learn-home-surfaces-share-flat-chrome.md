# Concept — Các "home" trong khu Learn dùng CHUNG 1 chrome flat (content dashboard là chuẩn)

> Heuristic (họ `concepts/*`). Rút từ "dựa content dashboard để redesign personal project". Bổ trợ [[course-home-no-duplicate-surfaces]] + [[continue-resumes-content-not-capstone]].

## Quy tắc (STRICT)
- **Mọi trang "home/overview" của 1 surface trong khu Learn (content home, personal-project home…) dùng CHUNG 1 chrome flat**, KHÔNG mỗi trang một phong cách. Khuôn chuẩn:
  - **TIER-1 breadcrumb** → **TIER-2 header** (title H3 + desc + 1 hàng chip meta/trạng thái) → **TIER-3 khối continue+progress PHẲNG** (eyebrow + tên việc kế **semibold** + 1 nút primary "Tiếp tục" · `ProgressMeter` `showValue` · 1 dòng stat muted) → **lộ trình "Đi tiếp · <nhóm hiện tại>"** = list item của nhóm đang ở (rows icon trạng thái done/active/locked/todo, bấm → mở item).
  - **KHÔNG** dùng lưới card KPI + stat ribbon.
- **List ĐẦY ĐỦ của surface sống ở RAIL; body chỉ "bạn đang ở đâu + việc kế".** Content: rail = ContentMap (cây module→bài); body = lộ trình module hiện tại. Personal-project: rail = MilestoneOutline (chặng→task); body = lộ trình chặng hiện tại. Body KHÔNG vẽ lại cả cây (ref [[course-home-no-duplicate-surfaces]]).
- **Data riêng của surface fold vào chrome chung, không phá layout.** Vd GitHub của personal-project → **1 chip trạng thái** trong header (connected = repo·branch; chưa = "Chưa kết nối"), KHÔNG card riêng. Số phụ (lần nộp, điểm TB) gộp vào **1 dòng stat muted** dưới meter, không ribbon.
- **Mirror block + nhịp y nhau:** `ProgressMeter` + `ListRow` (leading icon: active=Play accent + tint, done=CheckCircle success, locked=Lock muted, todo=Circle muted) + spacing gap-3 trong vùng / gap-6 chia vùng. Skeleton mirror cùng cấu trúc.

## Nguyên tắc rút ra
- Khi 2 trang cùng vai "home/overview" → lấy 1 làm chuẩn rồi mirror, đừng để mỗi trang tự-chế chrome. Đọc như một bộ.

## Liên quan
- [[course-home-no-duplicate-surfaces]] (home = continue/progress/path, không lặp) · [[continue-resumes-content-not-capstone]] (resume đúng phạm vi) · [[surface-lands-on-dashboard-no-auto-forward]] · [[gap]] (nhịp: gap-3 trong vùng, gap-6 chia vùng).
