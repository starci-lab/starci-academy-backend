# Pattern — Marketing landing (full-fold hero + stacked story sections + closing CTA)

> Shell/route: `Landing` (`src/components/features/landing/Landing/index.tsx`, route `/`, `/home`). Public, không đăng nhập.

## Khi nào dùng
- Trang bán-hàng/kể-chuyện công khai, đo hiệu quả bằng scroll + convert, KHÔNG có tác vụ/form bên trong (form thật → [[centered-form-setup]]). Quy tắc COPY/DATA chi tiết (grounded-in-data, curated track không dump catalog, showcase static vs live…) sống ở `landing-marketing` (principles) — file này chỉ nói SHAPE của trang.

## Region map (dọc, 1 cột `max-w-6xl`, nhịp `gap-16` giữa beat — ngoại lệ có tên của `gap`/foundations riêng cho landing)
1. **Hero** — DUY NHẤT full-fold (`min-h-[calc(100dvh-4rem)]`, `HeroBanner`: eyebrow + headline + 2 CTA + visual). Mọi beat khác co theo content (KHÔNG `min-h-screen`) để không có "nửa màn trống".
2. **Live-proof strip** (`SectionHeading` + `StatStrip`) — số liệu THẬT ngay sau hero, chống cảm giác "chợ khóa học".
3. **Story beats** — mỗi beat = `SectionHeading` (eyebrow/title/intro) + 1 khối nội dung (scrollytelling vòng-học, track cards, knowledge-graph split, founder truths, talent marketplace…); mỗi section có `id` + `scroll-mt-24` cho anchor-nav từ navbar.
4. **FAQ** — `Accordion variant="surface"`.
5. **Closing CTA** — căn giữa, 1 primary duy nhất, lặp lại CTA chính của hero.
6. **Back-to-top FAB** — nổi góc phải-dưới, chỉ hiện sau khi cuộn qua hero (`scrollY > 600`).

## Liên quan
`landing-marketing` (principles — 10 mục quy tắc copy/data) · card (component canon — không lặp N section render cùng entity) · [[page-shell-selection]].
