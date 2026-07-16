# Concept — "Tiếp tục học" trên content-home = resume NỘI DUNG (content-first), không nhảy capstone/dự án cá nhân

> Heuristic (họ `concepts/*`). Rút từ "Tiếp tục học" trỏ nhầm vào task dự án cá nhân dù mới đọc 2/95 bài. Bổ trợ [[course-home-no-duplicate-surfaces]] + [[resume-cta-only-when-away]].

## Quy tắc (STRICT)
- **"Tiếp tục học" trên trang NỘI DUNG học (Học phần/content-home) = đưa người học tới NỘI DUNG kế (bài/challenge), KHÔNG nhảy sang dự án cá nhân/capstone.** Capstone là cột mốc CUỐI lộ trình; ép người mới (mới đọc 2/95 bài) vào capstone là sai sư phạm + sai ngữ cảnh trang.
- **Mỗi surface có resume RIÊNG đúng phạm vi của nó.** Trang Dự án cá nhân có con trỏ resume của capstone riêng → capstone tự lo "tiếp tục" của nó. Content-home chỉ lo resume **nội dung**. KHÔNG gộp 2 con trỏ (ref [[course-home-no-duplicate-surfaces]]).
- **Thứ tự "việc kế" phải CONTENT-FIRST:** còn bài/challenge chưa xong → đó là currentTask; CHỈ khi nội dung xong hết mới tính tới capstone. Sửa BE là gốc (tạo field riêng `nextContentTask` content-first: bài chưa đọc đầu → challenge chưa xong → null) để đúng toàn hệ (profile/dashboard cùng hưởng); KHÔNG sửa `currentTask` cũ (giữ cho profile/dashboard/personal-project). FE "Tiếp tục học" đọc `nextContentTask`; null = hết nội dung → CTA capstone/"đã học hết".
- **Nhãn trang ≡ nội dung trang:** mục sidebar tên "Học phần" thì khối "Tiếp tục" + tiến độ phải đọc như "tiếp tục NỘI DUNG học phần", không phải dashboard tổng hợp mọi surface.
- **Resume TỐI ĐA 1 challenge như 1 nudge (dashboard):** resume slot = content-first (lessons dẫn) + trộn tối đa 1 challenge. "In-progress challenge" (đã mở-chưa-pass) KHÔNG hẳn là thứ user muốn tiếp tục; nội dung đang đọc mới là resume thật. Reserve đúng 1 slot cho challenge, phần còn lại fill lessons.

## Liên quan
- [[course-home-no-duplicate-surfaces]] (mỗi surface resume riêng, home không tổng hợp) · [[resume-cta-only-when-away]] (CTA resume chỉ hiện khi đã rời vị trí) · [[surface-lands-on-dashboard-no-auto-forward]].
