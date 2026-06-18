# Panel co/giãn tại chỗ = framer-motion trong block, KHÔNG Drawer (2026-06-17)

- File/§ đích: main.md §5 (HeroUI/blocks) + §13 (element-styling index) + starci dành cho navigation block.
- Bài học: làm sidebar settings collapse, trò định mượn `Drawer` (kể cả mobile) → thầy chốt "nay không phải
  drawer, này là block, dùng framer-motion để animate".
- Luật mới (STRICT):
  - **Drawer = overlay tách ngữ cảnh** (panel nổi CHE nội dung, có backdrop, đóng = thoát). Chỉ dùng khi panel
    là lớp phủ tạm (mobile nav menu nổi, filter overlay…).
  - **Panel co/giãn TẠI CHỖ** (sidebar collapse, accordion mở rộng, rail thu gọn) → **KHÔNG Drawer**. Đây là 1
    **block** tự animate width/translate/height bằng **framer-motion**, nội dung xung quanh **reflow** (đẩy chỗ),
    KHÔNG che. Áp cho **mọi breakpoint** (mobile cũng animate tại chỗ, đừng đổi sang Drawer ở mobile).
  - Animation/divider/persist/toggle = **block sở hữu** (feature chỉ ghép). Tôn trọng `useReducedMotion()` →
    tắt chuyển động.
