# Concept — Icon TRẠNG THÁI ghi đè icon gốc, KHÔNG cộng dồn

> Heuristic (họ `concepts/*`). Rút từ tab "Thử thách" khoá hiện puzzle + lock cạnh nhau (2026-06-24).

## Quy tắc (STRICT)
- **Khi 1 phần tử có icon định-danh (puzzle/file/deck…) chuyển sang TRẠNG THÁI đặc biệt (khoá / lỗi / disabled), icon trạng thái GHI ĐÈ icon gốc — render ĐÚNG 1 icon, KHÔNG hiện 2 (gốc + trạng thái).** Vd tab "Thử thách" khi khoá → icon = ổ khoá (puzzle ẩn), KHÔNG "puzzle + lock" song song. Pattern: `const Icon = locked ? LockIcon : BaseIcon` → render `<Icon/>`.
- **Vì sao:** 2 icon cạnh nhau = nhiễu, mơ hồ (icon nào là chính?), tốn chỗ. Trạng thái là thông tin QUAN TRỌNG HƠN định-danh lúc đó → nó chiếm slot icon. 1 slot icon = 1 nghĩa tại 1 thời điểm.
- **A11y:** vì icon đổi nghĩa, thêm `aria-label`/title mô tả (vd nhãn tab) cho icon trạng thái — screen-reader vẫn biết đây là tab gì + đang khoá.
- **Phân biệt:** đây là icon **THAY THẾ** (mutually exclusive state). Khác với badge/biểu tượng phụ CỐ Ý chồng (vd avatar + chấm online) — cái đó là overlay nhỏ ở góc, không phải 2 icon ngang hàng. Quy tắc này chống "icon gốc + lock đặt cạnh nhau như 2 glyph bình đẳng".

## Áp đầu (2026-06-24)
- `ContentTabBar/TabTrigger`: bỏ `<LockIcon/>` trailing; `const Icon = locked ? LockIcon : TabIcon` → 1 icon. Khoá → lock thay puzzle, `aria-label` = nhãn tab.
