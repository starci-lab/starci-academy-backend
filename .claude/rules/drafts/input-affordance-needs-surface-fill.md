# Draft — Ô input/composer (pill, search box…) phải có FILL `bg-surface`, không để trong suốt (ăn nền tối) (2026-06-25)

- File/§ đích khi `/merge`: `elements/` (input/field) hoặc `concepts/` (surface) + liên quan [[surface-in-surface-inner-has-border]].
- Bối cảnh: composer thảo luận bài học ("Đặt câu hỏi hoặc chia sẻ…") — pill `border border-default` nhưng **không có bg** → trong suốt, ăn nền `bg-background` (tối) phía dưới → trông tối, không ra "ô nhập". Thầy: *"đặt câu hỏi… màu hơi tối, dùng surface, giữa bg là surface"*.

## Luật (STRICT)
- **Mọi ô nhập / affordance bấm-để-nhập (composer pill, search box, fake-input mở editor) đặt trên surface đọc → PHẢI có fill `bg-surface`**, KHÔNG để trong suốt. Trong suốt = nó ăn màu nền phía dưới (thường là `bg-background` tối) → đọc như "vùng tối", không ra field. Field là 1 **surface có nghĩa** (chỗ để gõ) → cần nền sáng hơn nền trang.
- **Pattern chuẩn cho 1 ô input:** `rounded-xl border border-default bg-surface px-4 py-2` + hover đổi nền (`hover:bg-default`). Border + surface fill = field nổi rõ trên nền.
- **Radius = radius của FIELD, KHÔNG `rounded-full`.** Theo thang concentric ([[gap]]/main §spacing): khung `rounded-2xl` → **ô/field `rounded-xl`** → chỉ chip/avatar mới `rounded-full`. Ô nhập (composer/search) là field → `rounded-xl` cho khớp các input khác (thầy chốt 2026-06-25: *"rounded theo size input"*), KHÔNG bo tròn pill.
- **Phân biệt với "surface phẳng không cần fill":** chỉ phần TĨNH hiển thị (text/row/divider) mới để trong suốt; còn INPUT (chỗ tương tác nhập) luôn có fill surface (ref [[surface-in-surface-inner-has-border]]: surface-in-surface có border + fill). Input là surface-in-surface cố ý → có nền.
- **Nguyên tắc:** "trong suốt mặc định" hợp cho phần đọc; KHÔNG hợp cho ô nhập — ô nhập cần đọc ra là field ngay cả trên nền tối → luôn `bg-surface`.

## ĐÃ ÁP DỤNG 2026-06-25
- `reuseable/Discussion/CommentComposer` ô collapsed: thêm `bg-surface` + đổi `rounded-full` → `rounded-xl` (radius field). Giữ `border border-default` + `hover:bg-default`. eslint sạch.
- Quét các composer/search-pill khác khi đụng (community composer, search box) nếu cũng trong suốt trên nền tối.
