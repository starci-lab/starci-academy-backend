# Draft — Lesson render: heading sâu vẫn phải ra heading + measure thuộc CỘT đọc (2026-06-21)

- File/§ đích khi `/merge`: `starci-ui.rules` (MarkdownContent/typography) + cập nhật [RENDER-AUDIT] + [READING-UX-BRAINSTORM].
- Bối cảnh: trang đọc lesson FS. Thầy chỉ 2 lỗi sau khi áp typography pass:
  1. *"sao màu đỏ nó lệch qua 1 bên"* — nội dung dồn TRÁI, thừa khoảng PHẢI.
  2. *"2.1.3.2. … lại là text-sm muted nhỉ?"* — heading sâu trông như chữ thường mờ.

## Luật (STRICT)
- **Đừng cap measure (line-length) BÊN TRONG `MarkdownContent` bằng `max-w-*`.** Cột đọc rộng → `max-w-prose` trên
  wrapper markdown làm nội dung **căn TRÁI**, chừa khoảng phải = **lệch 1 bên**. **Measure là việc của CỘT ĐỌC**
  (LessonReader column): muốn hẹp lại thì narrow + `mx-auto` chính cột đó (kéo theo code/sandbox), KHÔNG nhét
  max-width vào renderer markdown. (Đã gỡ `max-w-prose` khỏi `MarkdownContent/index.tsx`.)
- **Heading sâu (h4/h5/h6) trong reading PHẢI đọc ra heading, KHÔNG `text-muted` nhạt.** Lesson StarCi đánh số rất
  sâu (`2.1.3` = h4, `2.1.3.2` = h5) → h5/h6 là **mục thật**, không phải label phụ. Reading mode: **foreground +
  font-semibold + khoảng trên (`mt-4`)**; chỉ giữ kiểu muted/nhỏ cho **compact** (card/chat/flashcard). Thang vẫn
  giảm dần cỡ (h4 base → h5/h6 sm) nhưng **không mờ** — mắt vẫn thấy "mục mới" ở cấp sâu.
- **Nguyên tắc tổng quát:** mỗi quyết định ở đúng tầng — *cỡ/đậm/màu của chữ* = renderer (`map.tsx`); *bề rộng cột
  đọc / căn giữa* = layout cột (LessonReader), KHÔNG trộn. Trộn → lệch mép hoặc heading "mất chức".
