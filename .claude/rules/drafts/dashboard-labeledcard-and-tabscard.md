# Draft — Dashboard explore: section có heading = LabeledCard · hàng filter feed = TabsCard (2026-06-21)

- File/§ đích khi `/merge`: `starci-ui.rules` (block usage) + [[tabscard-two-secondary-groups]].
- Bối cảnh: trang `/dashboard?tab=explore` (`FeedTabs` + `TrendingContents`). Thầy: *"nổi bật tuần này tách ra
  làm labeled card riêng; còn tabs dưới render theo dạng TabsCard"*.

## Luật (STRICT)
- **Khối có tiêu đề + nội dung trên dashboard/feed = block `LabeledCard`** (label NGOÀI card + `<Card>` ôm content),
  KHÔNG tự dựng card + header tay (`rounded-large bg-default/40 p-3` + span tiêu đề). `TrendingContents` ("Nổi bật
  tuần này") → `LabeledCard` (`label` + `icon` flame, list trong card). Icon = **phosphor** (`FlameIcon`), bỏ `@gravity-ui`.
- **Hàng filter SINGLE-SELECT điều khiển nội dung dưới nó = block `TabsCard`** (secondary underline tabs), KHÔNG
  dùng hàng chip `Button variant=ghost/secondary`. `FeedTabs` category (Tất cả/Khóa học/Thành tựu/Người) → `TabsCard`
  với **1 nhóm `leftTabs`** (rightTabs optional): `{items:[{key,label,icon}], selectedKey, ariaLabel, onSelectionChange}`.
  Feature chỉ truyền data; block owns style (ref [[tabscard-two-secondary-groups]] — TabsCard nhận 1 hoặc 2 nhóm).
- **Nguyên tắc rút ra:** filter "lọc nội dung phía dưới" về bản chất là TAB (đổi nội dung) → render như tab
  (TabsCard underline), không phải chip rời. Section trên dashboard → LabeledCard, không card tự chế. Đụng block
  sẵn có trước khi tự dựng.

## CHỐT 2026-06-21 (thầy duyệt) — explore feed = ĐÚNG 2 CARD
- **Card 1 (trên)** = "Nổi bật tuần này" (`TrendingContents` = `LabeledCard`) — **trending toàn nền tảng (query
  riêng, KHÔNG theo scope) → hiện ở CẢ 2 tab** (For you + Following), tự ẩn khi rỗng. ĐỪNG gate theo tab (sẽ mất
  card khi đổi scope).
- **Card 2 (dưới)** = **pattern TabsCard kiểu ContentBody (lesson reader)**: **tabs Ở NGOÀI/TRÊN, card Ở TRONG/DƯỚI**.
  `<div gap-3>` chứa **`TabsCard`** (leftTabs = scope Khám phá/Đang theo dõi · rightTabs = filter Tất cả/Khóa
  học/Thành tựu/Người) **float trên** + `<Card><CardContent>` ôm **feed** (`AsyncContent`+`ActivityFeed`) bên dưới.
  KHÔNG nhồi tabs VÀO trong card (đó là sai); tabs nổi trên card như `ContentTabBar` → body card.
- **Nguyên tắc tổng quát:** "double tabs card" = toolbar tab nổi NGOÀI + card nội dung DƯỚI (ref `ContentTabBar` +
  body `<Card>` của lesson reader), KHÔNG phải `<Card>` bọc cả tabs. Gộp 2 nhóm tab (scope+filter) vào 1 `TabsCard`.
- 2 card cách `gap-6`; tabs↔card `gap-3`. Bỏ `ExtendedTabs`/`Tabs` lẻ (TabsCard lo). i18n `dashboard.feedFilterAria`.
  tsc/lint/JSON sạch.
