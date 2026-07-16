# Principle — Visual Hierarchy (Phân cấp thị giác)

> Nguyên tắc xuyên-suốt (họ `principles/*`). Tổng quát hoá luật "1 primary/màn" (button) + "eyebrow câm" (challenge-section) thành 1 nguyên tắc: cấp bậc là việc của TYPOGRAPHY/MÀU, không phải việc của thêm khung/hộp.

## Rule of thumb
**Tối đa 1 hành động CHÍNH mỗi màn; phân cấp giữa các phần tử dùng CỠ + ĐẬM + MÀU của cùng 1 hệ — KHÔNG dùng cách thêm border/background/box mới để "nhấn".**

## Nguyên tắc
- **1 `primary` (solid accent) / surface.** Mọi hành động khác hạ xuống `secondary`/`tertiary`/`ghost`. Thêm 1 nút solid thứ 2 cạnh nó = 2 tiếng nói ngang nhau = mất phân cấp, user không biết bấm gì trước.
- **Nhãn phụ/định danh phụ** (số thứ tự "Thử thách N", eyebrow, meta/đếm) luôn ở dưới TITLE về cấp: nhỏ hơn + mờ hơn (`text-xs text-muted`) — KHÔNG được to/đậm/màu hơn title. Đảo cấp (phụ nổi hơn chính) là lỗi cần sửa ngay, không phải "làm nổi hơn" là tốt.
- **Cấp bậc trong 1 nhóm text = SIZE + WEIGHT + màu-token**, không phải thêm chip/border cho phần muốn nhấn — element càng nhiều "trang sức" không tương ứng cấp bậc thật = nhiễu đọc.
- **Accent là 1 trong các công cụ phân cấp** (không phải tất cả) — chỉ dùng cho đúng 4 vai của [[accent-system]], không tô accent để "nhấn" tuỳ ý.

> Đã áp: [[button]] §2 (CTA chính = solid + size lg + arrow, tối đa 1 primary/surface) · [[challenge-section-labeledcard-quiet-eyebrow-icon-once]] (nhãn phụ = eyebrow câm, không nâng thành heading) · [[accent-system]] §1 (accent giới hạn 4 vai, CTA là 1 vai trong đó).

## Liên quan
- [[button]] · [[accent-system]] · [[challenge-section-labeledcard-quiet-eyebrow-icon-once]] · [[design-restraint]] · [[header]].
