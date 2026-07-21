# Principle — Grounded in Data (Thiết kế theo dữ liệu THẬT)

> Nguyên tắc xuyên-suốt (họ `principles/*`). Rút kernel cross-cutting từ [[landing-marketing]] §1 (viết riêng cho surface landing) — áp dụng chung cho MỌI surface, không chỉ marketing.

## Rule of thumb
**Dựng UI cho dữ liệu THẬT đang có (kể cả null/rỗng phổ biến) — KHÔNG cho schema lý tưởng mà chưa ai từng điền.**

## Nguyên tắc
- **Field TỒN TẠI trong schema nhưng content THẬT luôn null/rỗng → KHÔNG thiết kế PHỤ THUỘC nó.** Layout phải đẹp khi field vắng; chỉ render field đó khi CÓ (cơ hội), đừng bắt buộc nó xuất hiện (ảnh cover null → text-first, không image-grid rỗng-hộp-buồn).
- **Soi seed/data thật TRƯỚC khi chọn pattern.** Ít item (early-stage) → thêm 1 điểm nhấn (featured anchor) thay vì N section đều mỏng/trống; đa số nhóm còn rỗng → đừng chọn pattern "section theo nhóm".
- **KHÔNG bịa số/nhãn cho UI.** Không có count từ BE → không nhồi "n bài" vào chip; không có author → không byline; không có track thật trong curriculum → không quảng cáo nó.
- **Khi content THẬT đã "co" về 1 dạng cụ thể** (vd mọi bài đều thuộc 1 loại) → định vị/taxonomy/nhãn phải đi theo content thật đó, không giữ khung generic ban đầu chờ content lấp đầy.

> Đã áp: [[landing-marketing]] §1-2 (grounded-in-data cho landing: field null → không phụ thuộc; reframe taxonomy theo content thật; kill filter trỏ bucket rỗng).

## Liên quan
- [[landing-marketing]] · [[labeled-section-render-empty-not-self-hide]] (rỗng vẫn phải render có nghĩa, không tự ẩn) · [[meter-tracks-out-of-box-default-target]] (meter phải có mẫu số thật để chạy) · [[affordance-and-feedback]] (empty là 1 trong 3 trạng thái async bắt buộc xử lý).
