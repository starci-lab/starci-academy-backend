# Foundation — Breakpoints

> Tailwind v4 default, KHÔNG override — app không khai `--breakpoint-*` riêng trong `globals.css`/`@theme`
> (không có `tailwind.config.*` trong repo).

- **5 mốc chuẩn (không đổi):** `sm` 640px · `md` 768px · `lg` 1024px · `xl` 1280px · `2xl` 1536px. CẤM tạo
  breakpoint tuỳ ý (`min-[900px]`) khi 1 trong 5 mốc này đủ dùng — giữ 1 thang cho toàn app.
- **`sm` = ranh giới mobile/desktop phổ biến nhất** trong rule hệ (tab label ẩn/hiện — [[tabs]] §2; input
  variant theo nền; nhiều chỗ "ẩn trên mobile" khác) — không phải `md`.
- **`lg` = ranh giới rail/2-pane MỞ hẳn** ([[when-rail]], [[sidebar]]): rail luôn `hidden lg:flex`, dưới `lg`
  fold thành chip-row cuộn ngang hoặc ẨN hẳn — KHÔNG có bậc riêng "md = rail thu nhỏ".
- **Hook JS mirror `useSmViewpoint()`** (`src/hooks/reuseables/useSmViewpoint.ts`): `isMobile`
  (`max-width:640px`) · `isTablet` (`max-width:768px`) · `isDesktop` (`min-width:1024px`) — dùng khi logic
  JS THỰC SỰ cần rẽ nhánh theo viewport (không chỉ đổi style — cái đó dùng class `sm:`/`lg:` thẳng, không cần
  hook).
- **`md`/`isTablet` hiếm neo trực tiếp rule UI chính** — chủ yếu là `sm` (cắt mobile) và `lg` (mở rail); vùng
  `md` là "chưa `lg` nhưng không còn chật như mobile", ít quyết định layout lớn dựa vào nó.

> Nguồn: `node_modules/tailwindcss/theme.css` (`--breakpoint-sm/md/lg/xl/2xl`, không bị `globals.css`
> override) + `src/hooks/reuseables/useSmViewpoint.ts`.

## Liên quan
- [[when-rail]] · [[sidebar]] · [[tabs]] §2 · [[wide-content-scrolls-not-blocks-ui]].
