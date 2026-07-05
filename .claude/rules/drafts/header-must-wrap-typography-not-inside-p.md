# Draft — `<Header>` (render `<header>`) phải BỌC NGOÀI `<Typography>` (render `<p>`), KHÔNG lồng trong — `<header>` con của `<p>` = hydration error (2026-07-06)

- File/§ đích khi `/merge`: **đính chính `elements/sidebar.md` §2** (đang ghi *"Label nhóm = HeroUI `Header` trong `Typography body-xs muted`"* — chữ "trong" = SAI thứ tự, gây lỗi) + `elements/` (typography/semantic).
- Bối cảnh: `SidebarNavGroup` label render `<Typography type="body-xs"><Header>{label}</Header></Typography>`. HeroUI `Typography` root = `<p>`; HeroUI `Header` = `<header>`. → `<p><header>…</header></p>` = **HTML invalid** (`<header>` không được là con của `<p>`) → Next **hydration error** ("In HTML, `<header>` cannot be a descendant of `<p>`"). Thầy bắt qua screenshot console.

## Luật (STRICT)
- **`<Header>` (semantic `<header>`) BỌC NGOÀI, `<Typography>` (`<p>`) BÊN TRONG.** `<header><p>…</p></header>` = hợp lệ; ngược lại (`<p><header>`) = invalid + hydration error. Quy tắc chung: **element block/landmark (`header`/`section`/`article`/`div`) KHÔNG bao giờ là con của `<p>`** — `<p>` chỉ chứa phrasing content. Khi cần cả semantic-landmark LẪN style Typography → landmark bọc ngoài, Typography (`<p>`) trong.
- **`Typography` KHÔNG còn nhận `elementType`/`as` để đổi tag** (comment `MarkdownContent/map.tsx` xác nhận: *"its root no longer accepts size/elementType"*) → KHÔNG đổi `<Typography>` thành `<header>` qua prop được; phải lồng đúng thứ tự.
- **Phát hiện nhanh:** hydration error "X cannot be a descendant of `<p>`" → tìm `<Typography>…<BlockEl>…</Typography>` (Typography là `<p>`), đảo lồng.
- Bẫy tương tự khác: `<Typography>` bọc `<div>`/`<Card>`/`<Accordion>`/`<ul>` → cùng lỗi. Typography chỉ nên bọc text/inline.

## ĐÃ ÁP DỤNG 2026-07-06
- `blocks/navigation/SidebarNavGroup/index.tsx`: đảo `<Typography><Header>` → `<Header><Typography>`. eslint sạch. Hết hydration error trên mọi trang learn (sidebar dùng chung).
- `NotificationBell:190` dùng `<Header>` nhưng trong `<div>` (không phải `<p>`) → OK, không đụng.
