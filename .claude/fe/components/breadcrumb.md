# Element — Breadcrumb (block `ResponsiveBreadcrumb`)

> Element doc cho breadcrumb-chain responsive. Bổ trợ [[header]] §1/§3-§4 (breadcrumb sống TRONG slot
> `breadcrumb` của `PageHeader` — luật ĐẶT ở đâu nằm ở đó; đây là API/hành vi của CHÍNH component).

## Khi nào dùng
- Trang ĐỌC/duyệt (`/learn/*`, settings) cần chain đầy đủ Home › … › Current → dùng `ResponsiveBreadcrumb`
  (hoặc wrapper DRY của nó, `LearnBreadcrumb`/`SettingsBreadcrumb` — chỉ truyền `current`) trong slot
  `breadcrumb` của `PageHeader`. KHÔNG dùng cho trang LEAF (giải/xem-kết-quả 1 item) — đó là `BackLink`
  (xem `back-link.md`).

## Quy tắc
- **Responsive = 2 RENDER khác nhau theo breakpoint, KHÔNG 1 chain co lại bằng CSS truncate.** Desktop
  (`sm+`) = `Breadcrumbs` (HeroUI) đầy đủ mọi crumb. Mobile (`<sm`) = **1 back-link đơn** `‹ <parent>` — pattern
  iOS/Polaris: chain dài wrap/tốn chiều cao trên điện thoại, và các crumb trái đã reachable qua nav khác.
  Cả 2 render **luôn cùng lúc trong DOM**, ẩn/hiện bằng `hidden sm:flex` / `sm:hidden` (pure CSS, không JS đo
  viewport) — tránh hydration mismatch.
- **Target mobile = ancestor click-được SÂU NHẤT** (`[...items].reverse().find(item => item.onPress)`) — không
  phải item ngay trước current theo thứ tự khai báo. Item cuối (current) thường KHÔNG có `onPress`
  (read-only) → hàm tự bỏ qua nó, tìm lùi tới crumb thật click được.
- **Không crumb nào click được (`items` toàn omit `onPress`) → mobile back-link KHÔNG render** (`parent`
  undefined) — không có gì để lùi về thì đừng vẽ 1 link chết.
- **Đặt vào `PageHeader.breadcrumb` slot, KHÔNG render như 1 hàng nav rời sibling** — xem [[header]] §1/§4
  (bug điển hình khi tách rời: breadcrumb↔header ăn `gap-6` sai thay vì `gap-3` đúng của slot).

> Block: `blocks/navigation/ResponsiveBreadcrumb`

## Liên quan
- [[header]] §1 (slot breadcrumb) · [[header]] §3 (khi nào dùng BackLink thay breadcrumb-chain) ·
  `back-link.md`.
