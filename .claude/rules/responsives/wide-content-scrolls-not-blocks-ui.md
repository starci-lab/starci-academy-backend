# Responsive — Khối RỘNG phải CUỘN (overflow-x-auto), KHÔNG block/giãn UI; flex cần `min-w-0`

> Heuristic (họ `responsives/*` — co giãn/overflow theo viewport). Rút từ vụ **mermaid** ở lesson reader + hero (2026-06-27): SVG mermaid rộng làm **cột đọc không co lại** khi thu nhỏ trình duyệt + **tràn ngang cả trang**. Thầy chốt: *"không co lại được thì làm cuộn phải, chứ đừng block ui"*.

## Quy tắc (STRICT)
- **Mọi khối có thể RỘNG hơn cột chứa → bọc `overflow-x-auto`** (cuộn ngang TRONG khung), KHÔNG để nó đẩy cột/trang rộng ra hay chặn trang co. Áp cho: **mermaid SVG**, **table**, **code/`<pre>`** (dòng dài), **iframe/embed**, ảnh/diagram cỡ cố định, sandbox. Triết lý: **thà cuộn còn hơn block UI** — nội dung không bao giờ được phá layout.
- **Bẫy min-content của flexbox:** 1 flex item **KHÔNG co dưới bề rộng nội dung** của nó trừ khi `min-width: 0` (`min-w-0`). Một khối con rộng (SVG/pre/table) sẽ **ép cả cột không nhỏ lại** (mặc định `min-width:auto`). Fix 2 lớp:
  1. **`min-w-0` trên CHUỖI flex item** (shell content column → reader → wrapper) để chúng co được.
  2. **`overflow-x-auto` trên chính khối rộng** — quan trọng: scroll-container có **`min-content = 0`** nên tổ tiên flex co lại được (đây là cái sửa thật sự cho "trang không nhỏ lại"), đồng thời nội dung rộng cuộn trong hộp thay vì tràn body.
- **ĐỪNG tin class utility ghì được INLINE STYLE của lib bên thứ 3.** Mermaid (v11) stamp **`style="max-width:Npx"` INLINE** lên `<svg>` → **thắng** class `[&_svg]:max-w-full` (`max-width:100%`) vì inline > class specificity → class vô dụng, SVG vẫn rộng N. Cách xử lý đúng:
  - **Ưu tiên: bọc `overflow-x-auto`** (an toàn nhất — bề rộng SVG dù bao nhiêu cũng không phá được layout, vẫn scale fit khi đủ chỗ).
  - Hoặc override bằng `!important` (`[&_svg]:!max-w-full`) khi muốn ÉP fit không cuộn — nhưng cuộn (overflow) là lựa chọn thầy chốt cho diagram (giữ diagram đọc được, không bị bóp tí xíu).
- **Cách chẩn "trang không co lại / tràn ngang":** không phải lỗi component cha (thường đã `min-w-0`) — soi **khối con rộng nhất** (mermaid/table/pre) xem có `overflow-x-auto` chưa + chuỗi flex có `min-w-0` chưa. 1 khối thiếu overflow là đủ chặn cả trang.

## Phân biệt
- **Khối rộng nội dung** (đọc được, cần giữ kích thước) → `overflow-x-auto` (cuộn). Vd diagram, bảng, code.
- **Rail/panel dài theo CHIỀU DỌC** vượt viewport → `ScrollShadow` (fade mép) — [[sticky-rail-overflow-wrap-scrollshadow]]. Khác trục (dọc vs ngang) nhưng cùng họ "container hóa overflow, đừng để tràn".
- **Jitter do scrollbar dọc hiện/ẩn** → `html { overflow-y: scroll; scrollbar-gutter: stable }` — [[scrollbar-gutter]].

## Áp đầu (2026-06-27)
- `MarkdownContent/MermaidDiagram`: div bọc SVG `[&_svg]:h-auto [&_svg]:max-w-full` → thêm **`overflow-x-auto`**. Diagram rộng giờ cuộn trong figure, cột đọc co lại bình thường, hết tràn body. (Code block/table trong MarkdownContent vốn đã tự cuộn — mermaid là khối thiếu overflow.)

## Liên quan
- [[scrollbar-gutter]] (overflow-y scroll + scrollbar-gutter chống jitter) · [[sticky-rail-overflow-wrap-scrollshadow]] (overflow DỌC của rail → ScrollShadow) · [[gap]] / [[three-tier-page-layout]] (cột đọc `max-w-3xl` + min-w-0).
