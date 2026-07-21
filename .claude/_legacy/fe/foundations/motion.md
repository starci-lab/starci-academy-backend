# Foundation — Motion

> Không có 1 "duration scale" đặt tên riêng — convention rút từ usage thật, + 2 guard BẮT BUỘC cho mọi
> animation trang trí.

- **Transition mặc định = `transition-colors`** (hover/focus đổi màu — áp đảo usage thật, ~92 chỗ trong
  `src/`) · `transition-opacity` (fade) · `transition-transform` (trượt/scale — icon caret, arrow CTA).
  `transition-all` chỉ khi ĐÃ xác nhận cần animate ≥2 property khác nhóm — không dùng làm default lười.
- **Duration quan sát được: 150/200/300/500ms** — không có token/scale đặt tên; 150-300ms cho vi-tương-tác
  (hover/focus), 500ms cho fade lớn hơn (splash, page-level). Giữ trong khoảng này, đừng bịa số lạ.
- **`prefers-reduced-motion` BẮT BUỘC cho MỌI animation trang trí** (không áp cho feedback tối-cần như
  spinner loading) — 2 cách, dùng đúng theo nơi animation sống:
  - **CSS `@keyframes`** (ambient/splash) → guard trong `@media (prefers-reduced-motion: reduce)` NGAY tại
    `globals.css` (đã có block cho `.ambient-*`/`.app-splash-bar`).
  - **Framer-motion component** (diagram/scroll-driven) → hook `useReducedMotion()` tắt lerp/motion, fallback
    cắt cứng. Vd `CollapsibleSidebar`, `ArchitectureScene`, `KnowledgeGraph`, `LearnLoopScroll`, `StatStrip`,
    `AIProcessingText`.
- **@keyframes = 1 SỔ DUY NHẤT ở `globals.css`, KHÔNG rải keyframe rời trong CSS module/inline `<style>`.**
  Đã có: `wireFlow` (packet chạy dây hero diagram) · `emberRise`/`snowFall`/`rainFall`/`bubbleRise`/
  `fireflyDrift`/`starTwinkle`/`auroraDrift`/`waveDrift`/`circuitPulse` (9 hiệu ứng `AmbientBackground`) ·
  `reactionPop` (bounce-in Facebook-style reaction) · `appSplashTrickle` (entry splash bar). Animation trang
  trí MỚI → thêm vào đây; xem [[reimplement-dead-lib-natively-fb-reactions]] cho convention tách transform
  pop-in (button) khỏi hover-scale (span con) để 2 animation không đè nhau.
- **Skeleton = 1 kiểu chung `--skeleton-animation: shimmer`** (HeroUI default, app KHÔNG override) — mọi
  `Skeleton` dùng chung, KHÔNG tự chế animation loading khác.
- **Tooltip = tức thời:** app ép `--tooltip-delay`/`--tooltip-close-delay` về **`0ms`** (HeroUI mặc định
  1500ms/500ms) → hover là thấy ngay, không có độ trễ "cảm ứng" mặc định của thư viện.
- **3 tầng loading feedback (splash cold-load → top-bar nav → skeleton region)** là 1 khái niệm riêng lớn
  hơn "motion" đơn lẻ — xem [[loading-feedback-three-tiers-splash-toploader-skeleton]].

> Nguồn: `globals.css` (@keyframes, `@media (prefers-reduced-motion)`, override `--tooltip-delay/close-delay`)
> + `@heroui/styles` (default tooltip 1500/500ms, `--skeleton-animation`) + grep usage `duration-*`/
> `transition-*` trong `src/`.

## Liên quan
- [[loading-feedback-three-tiers-splash-toploader-skeleton]] · [[reimplement-dead-lib-natively-fb-reactions]] ·
  [[z-index]] (splash/top-bar layering cùng hệ).
