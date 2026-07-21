# Foundation — Z-index

> Không có CSS var riêng cho layer — thang LITERAL đúc từ usage thật khắp app. Đừng leo số tuỳ ý; neo vào
> bậc GẦN NHẤT trong bảng dưới.

- **Thang quan sát được (thấp → cao):**
  - `z-10` — chrome nổi CỤC BỘ trong chính 1 component (mini-popover reaction bar, overlay nút trên article
    text) · `-z-10` cho decor SAU nội dung (ambient background).
  - `z-20` — control nổi TRÊN 1 vùng đã sticky (resize-handle của rail, video controls overlay).
  - `z-30` — sticky sub-header / overlay trong-trang trên mobile (filter bar `sticky top-16`, tab-strip
    mobile settings, search-result dropdown).
  - `z-40` — chrome nổi CẤP TRANG (FAB, sticky bottom bar, mobile bottom tab-bar, socket-connection-status
    pill, learn mobile top bar).
  - `z-50` — **navbar** (`sticky top-0 z-50`) — mốc "app chrome trên cùng của luồng trang thường".
  - `z-[60]` — TopLoader (thanh loading điều hướng SPA) — PHẢI trên navbar. Xem
    [[loading-feedback-three-tiers-splash-toploader-skeleton]].
  - `z-[70]` — AppSplash (cold-load overlay) + overlay-phụ-cần-vượt-mọi-chrome (vd settings modal mở từ
    trong 1 popover FAB `z-40`) — bậc CAO NHẤT hiện có trong app.
- **MỌI z-index mới PHẢI neo vào bậc gần nhất trong thang trên** — không tự đặt số giữa (`z-[45]`) hay leo
  thẳng lên `z-[100]` "cho chắc". Nếu 1 overlay đánh nhau với overlay khác, ưu tiên SỬA KIẾN TRÚC trước khi
  leo số (xem gotcha dưới).
- **Gotcha unlayered (HeroUI `.modal__backdrop`/`.drawer__backdrop` bake `z-50`):** style bake nằm CÙNG
  layer utility với `z-[N]` tự thêm qua className → thắng-thua quyết bởi SOURCE ORDER trong bundle, KHÔNG
  bởi giá trị số — `z-[70]` tự thêm vẫn có thể THUA nếu CSS HeroUI nạp sau. Overlay mở TỪ TRONG 1 popover
  khác (z-fight) đừng cố ăn-thua số z — RENDER IN-PANEL thay vì Modal/Drawer body-level riêng. Xem
  [[overlay-from-popover-render-in-panel]].

> Nguồn: grep `z-\d+`/`z-\[N\]` toàn `src/` (Navbar `z-50` · TopLoader `z-[60]` · AppSplash +
> `ContentAiSettingsModal` backdrop `z-[70]` · FAB/StickyBottomBar/mobile-bars `z-40` · rail resize-handle/
> video-controls `z-20` · sticky filter/search-dropdown `z-30`).

## Liên quan
- [[overlay-from-popover-render-in-panel]] · [[loading-feedback-three-tiers-splash-toploader-skeleton]] ·
  [[when-drawer]].
