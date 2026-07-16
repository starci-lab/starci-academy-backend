# Principle — Design Restraint (Tiết chế thị giác)

> Nguyên tắc xuyên-suốt (họ `principles/*`). Rút "kernel" chung từ [[whitespace-over-dividers]] + phần anti-pattern của [[accent-system]] + [[progress-block-growing-quantity-headline-not-vanity-strip]] — cả 3 đều là 1 nguyên tắc: TRỌNG LƯỢNG THỊ GIÁC TỐI THIỂU.

## Rule of thumb
**Mỗi màn chỉ nên mang ĐÚNG lượng trọng lượng thị giác cần để truyền đạt — cắt mọi thứ trang trí/lặp/vanity không mang thêm thông tin.**

## Nguyên tắc
- **Accent theo tỉ lệ 60-30-10** — accent là GIA VỊ ở vài điểm nhỏ (icon/chip/value/border), KHÔNG tô nền cả khối/section lớn (accent-flood là anti-pattern, không phải "cho nổi bật hơn").
- **Ngăn cách bằng WHITESPACE trước divider.** `gap` giữa 2 section đã đủ phân tách; chỉ thêm `border-t`/`Separator` khi 2 vùng KHÔNG thể tách bằng gap (bên trong 1 khối bounded, hoặc 2 vùng dính buộc phải chung khối).
- **Cắt số liệu vanity:** count lặp lại thông tin mắt đã thấy (list đã hiện item thì đừng thêm dòng "N item" dưới nó), hoặc số vô nghĩa vì mẫu quá nhỏ (retention 100% từ đúng 1 lần) → ẨN, đừng phô ra "cho đầy dashboard".
- **1 đại lượng CÓ NGHĨA (1 meter/headline) tốt hơn N con số ngang hàng.** Stat-strip nhiều số cùng cỡ = "dashboard cho có", không phân cấp được cái nào quan trọng.
- **Icon/màu KHÔNG dùng cho phần tử TĨNH không-tương-tác chỉ để "cho đẹp"** — mọi điểm nhấn thị giác phải mang nghĩa thật (tương tác được, hoặc là tín hiệu trạng thái).

> Đã áp: [[whitespace-over-dividers]] (ngăn section rail bằng gap-6, bỏ Separator + count thừa) · [[accent-system]] §5 (anti-pattern: accent-flood, decorative-accent) · [[progress-block-growing-quantity-headline-not-vanity-strip]] (1 meter mastery thay stat-strip 3 số rời).

## Liên quan
- [[whitespace-over-dividers]] · [[accent-system]] · [[progress-block-growing-quantity-headline-not-vanity-strip]] · [[card]] (không xếp 2 card bordered liên tiếp — cùng họ tiết chế).
