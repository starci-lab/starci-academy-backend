# Draft — Heading↔desc = gap-2 (KHÔNG gap-0) + mọi trang learn phải có breadcrumb (2026-06-21)

- File/§ đích khi `/merge`: `main.md` §8 spacing + `starci-ui.rules` (PageHeader) + cập nhật [[three-tier-page-layout]].

## Luật (STRICT)
- **Title ↔ description = `gap-2`, KHÔNG `gap-0`** (thầy chốt: gap-0 sát quá). Sửa cả block canonical
  `PageHeader` (title+desc) + mọi header tự dựng (ContentHeader lesson, Task brief, dashboard…). Đây là
  **đính chính** [[three-tier-page-layout]] (bản cũ ghi "title+desc = cặp DÍNH gap-0" → nay gap-2).
- **MỌI trang trong `/learn/*` PHẢI có breadcrumb** (tier-1, trên header). Trang nào thiếu = lỗi. Trail chuẩn:
  `Home › Courses › <course> › <current>` (crumb cuối read-only, không onPress). Dùng block dùng chung
  **`features/learn/shared/LearnBreadcrumb`** (`current?` prop — OMIT ở trang course-home thì `<course>` là
  crumb cuối read-only). Trang dùng `PageHeader` → truyền qua prop `breadcrumb={<LearnBreadcrumb current=… />}`.
- **Breadcrumb sống TRONG reading column của trang, KHÔNG bọc 1 `<div p-6>` riêng.** Nó chia sẻ `p-6` + `max-w`
  của cột đọc (3 tầng cùng cap + thẳng mép trái). Đừng tạo wrapper padded riêng cho breadcrumb (gây scatter
  padding 2 chỗ + lệch mép với content). Ref: [[three-tier-page-layout]] (breadcrumb + header + content cùng
  `max-w-3xl` + cùng mép trái; trong layout SPLIT thì cột đọc **left-align, KHÔNG mx-auto**).
- **DRY breadcrumb:** chỉ khác crumb cuối → 1 component generic (`LearnBreadcrumb`), các feature chỉ truyền
  `current`. Đừng copy 4-item breadcrumb cho từng trang.
