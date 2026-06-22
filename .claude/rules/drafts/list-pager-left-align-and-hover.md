# Draft — Pager của list = căn TRÁI thẳng mép content + bắt buộc hover/cursor (2026-06-21)

- File/§ đích khi `/merge`: `starci-ui.rules` (pagination/list patterns) + [[interactive-needs-hover]].
- Bối cảnh: pager `< 1 >` cuối list Thử thách đang `justify-center` (căn giữa) + nút HeroUI Pagination KHÔNG có hover.
  Thầy: *"cái navigation ở dưới move sang trái luôn"* + *"không có hover nhé"*.

## Luật (STRICT)
- **Pager/nav-control cuối một list = căn TRÁI, thẳng mép với content (card/header/row), KHÔNG `justify-center`.**
  Pager là 1 control thuộc list → mép trái của nó phải trùng mép trái cột nội dung (cùng `max-w` + cùng left edge,
  xem [[three-tier-page-layout]]). Sửa cả wrapper `Pagination` lẫn `Pagination.Content`: `justify-center` → `justify-start`.
- **HeroUI `Pagination.{Link,Previous,Next}` KHÔNG tự bake `cursor-pointer`/hover** → phải tự thêm qua `className`
  (`cursor-pointer rounded-medium transition-colors hover:bg-default`; nút active giữ accent:
  `data-[active=true]:hover:bg-accent`). Đây là áp [[interactive-needs-hover]] cho control phân trang (mọi thứ bấm
  được phải có hover + con trỏ tay). Nút `isDisabled` (prev ở trang 1 / next ở trang cuối) tự bỏ pointer.
- **Hệ quả test:** hover bg chỉ lộ rõ khi list có **>1 trang** (số trang non-active + mũi tên enabled). List 1 trang
  thì prev/next disabled + số "1" active → đừng kết luận "hover hỏng"; verify cursor-pointer là đủ, hoặc test trên list
  nhiều trang. (Cân nhắc ẩn pager khi `totalPages <= 1` cho gọn — design restraint — nhưng chỉ khi thầy duyệt.)
