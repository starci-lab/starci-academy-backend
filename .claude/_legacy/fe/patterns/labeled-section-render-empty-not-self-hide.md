# Concept — Section có NHÃN trên trang user CHỦ ĐỘNG mở: rỗng = render EMPTY-STATE, KHÔNG tự ẩn

> Heuristic (họ `concepts/*`, FE empty-state). Rút từ loạt "render rỗng nhe" — tab Kỹ năng (ProfileCoding), Hoạt động (ProfileActivity) rỗng mà không có empty-state (lơ lửng / tự ẩn / kẹt skeleton).

## Luật (STRICT)
- **Khối có NHÃN (LabeledCard / section tiêu đề) trên trang/tab người dùng CHỦ ĐỘNG mở → rỗng phải render EMPTY-STATE chuẩn** (`AsyncContent` `isEmpty` + `emptyContent` → `EmptyContent`: icon + title + hint), **KHÔNG `return null` tự ẩn**. Tự ẩn 1 section có nhãn = trang trống hoác / khối biến mất khó hiểu. (Self-hide chỉ hợp cho widget PHỤ KHÔNG nhãn — vd 1 nudge dashboard, không phải section chính của tab.)
- **Bẫy hay gặp:** component đã wire `isEmpty`/`emptyContent` ĐÚNG nhưng có 1 `if (empty) return null` Ở TRÊN chặn mất → empty-state không bao giờ chạy tới. Gỡ early-return là xong.
- **Empty-state đồng bộ:** title + **description hint** (vd "Đọc bài / vượt thử thách → hoạt động hiện ở đây"), khớp các tab anh em. Đừng để tab này có hint, tab kia trơ mỗi title.

## Liên quan
- [[frameless-section-empty-state-needs-card]] (empty mặc đúng khung card) · [[asynccontent-remove-debug-hold]] · [[layout-must-funnel-to-courses-and-cover-full-data-state-matrix]] (rỗng = phễu về khóa).
