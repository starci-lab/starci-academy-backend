# Draft — Section có NHÃN trên trang user mở: rỗng = render EMPTY-STATE, KHÔNG tự ẩn (2026-06-21)

- File/§ đích khi `/merge`: `starci-ui.rules` (empty-state / LabeledCard) + `main.md` §7 (AsyncContent).
- Bối cảnh: loạt feedback "render rỗng nhe" — tab Kỹ năng (ProfileCoding), Hoạt động (ProfileActivity) đều rỗng mà
  không có empty-state (lơ lửng / tự ẩn / kẹt skeleton). Thầy: *"không có gì cũng render rỗng nhe trò"*.

## Luật (STRICT)
- **Khối có NHÃN (LabeledCard / section tiêu đề) trên trang/tab người dùng CHỦ ĐỘNG mở → khi rỗng phải render
  EMPTY-STATE chuẩn** (`AsyncContent` `isEmpty` + `emptyContent` → `EmptyContent`: icon + title + hint), **KHÔNG
  `return null` tự ẩn**. Tự ẩn 1 section có nhãn = trang trống hoác / khối biến mất khó hiểu. (Self-hide chỉ hợp cho
  widget PHỤ không nhãn, vd 1 nudge trên dashboard, không phải section chính của tab.)
- **Bẫy hay gặp:** component đã wire `isEmpty`/`emptyContent` ĐÚNG nhưng có 1 `if (empty) return null` Ở TRÊN chặn
  mất → empty-state không bao giờ chạy tới. Gỡ early-return là xong (ProfileActivity vừa dính).
- **Empty-state đồng bộ:** title + **description hint** (vd "Đọc bài / vượt thử thách → hoạt động hiện ở đây"), khớp
  các tab anh em (challenges/skills). Đừng để tab này có hint, tab kia trơ mỗi title.
- Ref: [[frameless-section-empty-state-needs-card]] (empty cũng phải mặc đúng khung card).
