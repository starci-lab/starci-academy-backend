# Draft — Layout 3 tầng chuẩn cho trang/content (2026-06-19)

- File/§ đích khi `/merge`: `starci-ui.rules` (catalog block layout) + `main.md` §8 spacing.
- Bối cảnh: thầy chốt khuôn 3 tầng (ref trang Thiết bị + block `PageHeader`): breadcrumb → title+desc → content,
  nhịp dọc đều. Lesson reader trước đó title quá to (H2) + breadcrumb cap 1024 lệch content 3xl.

## Luật (STRICT)
- **Mọi trang content theo 3 TẦNG, theo thứ tự + nhịp đều:**
  1. **Tầng 1 — Breadcrumb** (`Breadcrumbs` HeroUI).
  2. **Tầng 2 — Header**: `Typography.Heading level={3}` (H3, KHÔNG H1/H2 to đùng) + description `body-sm muted`. Dùng block
     **`blocks/layout/PageHeader`** (đã bake breadcrumb slot + H3 + desc + actions slot) cho trang chuẩn. Trang đặc thù
     (lesson reader có meta chip/outcomes) tự dựng header nhưng **vẫn H3**.
  3. **Tầng 3 — Content**.
- **Cùng spacer `h-3` giữa các tầng + cùng `gap-3` trong tầng.** CẤM trộn cỡ spacer (mỗi tầng cách nhau đúng 1 nhịp h-3).
- **Cùng bề rộng cột:** breadcrumb + header + content **CÙNG cap** (`max-w-3xl` cho cột đọc) + `mx-auto` → 3 tầng thẳng mép trái.
  ĐỪNG để breadcrumb rộng hơn content (vd cũ `max-w-[1024px]` lệch `max-w-3xl`).
- **Padding container = block sở hữu** (`PageContainer`/wrapper), feature chỉ placement. Rail/khối content mặc định `p-6` (xem [[rail-long-title-and-spacing]]).
## Header nội bộ (tầng 2) — chi tiết style (thầy chốt qua lesson reader)
- **Title + description = cặp DÍNH `gap-0`** (KHÔNG gap-3), desc = `body-sm muted` — **y chang block `PageHeader`** để mọi
  header đồng bộ. ĐỪNG để title/desc cách xa hay desc cỡ `body`.
- **Mọi thứ TRONG header = cùng nội dung header → `gap-3`** (title-block ↔ meta-row ↔ outcomes). Lý do: meta chip, outcomes
  đều **thuộc nội dung của header** → theo §8 "cùng chức năng = gap-3 (h-3)", KHÔNG gap-6 (gap-6 chỉ dành cho 2 vùng KHÁC
  chức năng, vd header ↔ body content). Chỉ cặp title+desc dính `gap-0`.
- **Meta chip: cắt cái VÔ NGHĨA.** Chip "Nội dung N/M" (vị trí tuyến tính) trùng với rail/pager → BỎ. Chỉ giữ chip có
  thông tin thật (thời gian đọc, số thử thách, trạng thái đọc).
- **Chip trạng thái sáng, không để mặc định HeroUI (tối).** Read badge "Đã đọc" = **`color="success"` + `bg-success/10 text-success`**
  (success XANH LÁ đúng semantic, KHÔNG accent) — override bg về `/10` cho tint SÁNG; chip secondary mặc định của HeroUI quá
  tối. Quy ước: chip semantic muốn nổi = `bg-<token>/10 text-<token>`.
- Title dài → [[rail-long-title-and-spacing]] (truncate + tooltip); tiến độ → [[one-progress-bar-at-a-time]].
- Ref: block `PageHeader` (breadcrumb+H3+desc+actions) + trang Thiết bị (mẫu thầy duyệt).
