# Draft — Course-home/hub KHÔNG lặp lại surface đã có trang riêng / đã có trong sidebar (2026-06-21)

- File/§ đích khi `/merge`: `main.md` §14 (heuristics) + `starci-ui.rules` (page/hub patterns) + cập nhật
  doc [[three-tier-page-layout]] / brainstorm course-home.
- Bối cảnh: brainstorm course-home `/learn` (hướng "Hub of surfaces + path strip") định dựng **lưới launch card**
  ra mọi surface (leaderboard, flashcards, practice, mind-map, foundations…) + bê **rank** lên dải "tuần này".
  Thầy chốt: *"trang này sao cần leaderboard, leaderboard ở trang khác rồi mà"*.

## Luật (STRICT)
- **Đừng biến course-home thành DANH BẠ LINK trùng sidebar.** Khu Learn **đã có sidebar** điều hướng tới mọi
  surface (mind-map · modules · foundations · flashcards · practice · personal-project · leaderboard). Dựng thêm 1
  lưới "launch card" trỏ lại đúng các surface đó = **điều hướng lặp 2 lần** (sidebar + card) → bỏ. Home không phải
  app-drawer.
- **Đừng bê DATA của trang khác lên home.** Thông tin đã có **trang chủ riêng** (vd `rank` thuộc trang Leaderboard,
  bảng xếp hạng đầy đủ) thì KHÔNG nhân bản 1 mẩu của nó lên home. Mỗi dữ liệu có **đúng một "nhà"**; home chỉ giữ
  cái mà home là nhà của nó.
- **Home = job riêng của home, không tổng hợp mọi thứ.** Course-home chỉ ôm thứ **không có chỗ nào khác**:
  (a) **Tiếp tục học** (resume — 1 primary action), (b) **tiến độ tổng** của khóa, (c) **lộ trình "bạn đang ở đâu"**
  (module hiện tại + bài kế). Cái gì đã có surface/trang riêng → để người học vào surface đó qua sidebar.
- **Tiêu chí giữ 1 khối trên home:** chỉ giữ khi nó **(1)** là việc home phải làm (continue/progress/path), HOẶC
  **(2)** là một *nudge hành động theo thời điểm* mà nơi khác KHÔNG nhắc (vd "N thẻ flashcard đến hạn hôm nay" =
  lời nhắc, không phải link tĩnh). KHÔNG giữ vì "cho phong phú" / "vanity dashboard". Ref: [[one-progress-bar-at-a-time]]
  (design restraint) + vanity-engineering (cắt khối không phục vụ job chính).
- **Hệ quả cho brainstorm course-home:** bỏ lưới launch card + bỏ rank khỏi dải tuần. Cân nhắc giữ lại CHỈ những
  khối là "nhà" của home (continue · progress · path) + tối đa 1–2 nudge thật sự (capstone nếu là outcome chính,
  flashcard-due nếu là nhắc-hành-động) — và phải hỏi thầy trước khi thêm, mặc định CẮT.
