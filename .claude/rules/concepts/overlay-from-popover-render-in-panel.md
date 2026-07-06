# Concept — Overlay PHỤ mở từ TRONG 1 popover → render IN-PANEL (view trượt), KHÔNG Drawer/Modal body-level (tránh popover-on-popover z-fight)

> Heuristic engineering (họ `concepts/*`). Rút từ panel chat AI (FAB popover) cần mở "Cài đặt" + "Cuộc trò chuyện" — cả 2 bị z-index đè, nằm SAU popover cha.

## Root cause (đọc CSS thật)
- `.modal__backdrop`/`.drawer__backdrop` (HeroUI) bake **`@apply fixed inset-0 z-50`** ở **utility layer**. Thêm `z-[70]`/`z-[80]` qua className cũng nằm **CÙNG layer utility** → thắng-thua quyết định bởi **source-order**, KHÔNG phải specificity → component CSS đứng sau trong bundle ⇒ `z-50` gốc vẫn thắng, `z-[N]` tự thêm **vô hiệu**.
- Trong khi đó popover (react-aria portal, không set z cố định kiểu này) lại đè được backdrop `z-50` → kết quả: Modal/Drawer con "chìm" xuống dưới popover cha đã mở nó = bài toán **popover-on-popover** (design-system nào cũng khuyến cáo tránh: "lớp floating thứ 3 → dùng Dialog/render-tại-chỗ, không popover-chồng-popover").

## Luật (STRICT)
- **Overlay PHỤ mở TỪ TRONG 1 popover (settings, danh sách con, xác nhận…) → render IN-PANEL** (1 "view" trượt che nội dung panel hiện tại, cùng 1 lớp floating của popover cha), **KHÔNG** `Drawer`/`Modal` body-level riêng. Hết z-fight (mọi thứ ở trong 1 lớp floating duy nhất), đúng convention design-system, chạy nhất quán cả desktop-popover lẫn mobile.
- **Impl:** component chứa state `view: "main" | "subViewA" | "subViewB"`; header/nút mở sub-view chuyển `view`; mỗi sub-view có nút back (mũi tên trái) quay về `"main"`. KHÔNG mount `Drawer`/`Modal` global (bỏ khỏi container modal toàn app nếu có — sẽ mồ côi).
- **KHÔNG cố override z-index của overlay HeroUI bằng class thường** (`z-[N]` thua `@apply z-50` baked cùng layer). Nếu THẬT SỰ buộc phải dùng Modal/Drawer độc lập (không phải trong popover) → `!z-[N]` (important) hoặc inline `style={{ zIndex: N }}`. Nhưng với overlay-phụ-mở-từ-popover, ĐỪNG fight z-index — render in-panel là giải pháp đúng, không phải patch z.
- **Câu hỏi quyết định:** overlay này mở TỪ 1 popover đang mở (FAB chat, dropdown…) hay từ TRANG/layout gốc? Từ popover → in-panel. Từ trang gốc → Modal/Drawer bình thường (không có tổ tiên popover để đè).

## Liên quan
- [[chat-session-list-lazy-create-and-search]] (context áp dụng: panel chat AI) · [[when-drawer]] (khi nào dùng Drawer — bình thường, không nested-popover).
