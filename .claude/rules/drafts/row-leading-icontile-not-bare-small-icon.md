# Draft — Leading của row trong list = `IconTile` (tile khung có cover/fallback), KHÔNG icon trơ nhỏ (2026-06-25)

- File/§ đích khi `/merge`: `elements/list.md` (§ SurfaceListCardRow / ListRow leading) + `elements/icon.md` (cỡ icon) + liên quan [[elements/card]] §3c (SurfaceListCard) · [[item-card-meta-inside-bounded-object]].
- Bối cảnh: trang Bookmark (`/profile/settings/bookmarks`), mỗi row `SurfaceListCardRow` ban đầu leading = `<FileTextIcon className="size-5 text-muted" />` (icon trơ 20px). Thầy: *"render kiểu IconTile, icon không nhìn nhỏ lắm"*.

## Luật (STRICT)
- **Leading của 1 row đại diện cho 1 ĐỐI TƯỢNG (bài học, khóa, dự án, item…) trong list/row → dùng block `IconTile`, KHÔNG icon SVG trơ cỡ nhỏ (`size-4/5`).** Icon trơ trong row cao (`py-4` + title + subtitle) trông **nhỏ/yếu/lạc lõng**, không cân với khối chữ. `IconTile` = ô vuông khung bo (`size-12 rounded-xl` ở `sm`) có **trọng lượng thị giác** → đọc ra "avatar của 1 thứ", cân với title+subtitle.
- **Tận dụng cover khi có:** `IconTile` nhận `src` (ảnh, `object-cover` fill + tự fallback khi 404) + `icon` (fallback khi không có src). Item có ảnh đại diện (course `coverImageUrl`, project cover…) → truyền `src` → tile hiện ảnh; không có → fallback icon trên nền tint. 1 block lo cả 2 (khỏi guard ảnh-vs-icon ở feature). Vd bookmark row: `src={content.module?.course?.coverImageUrl}` + `icon={<FileTextIcon/>}`.
- **Cỡ + tone:** row list thường = `size="sm"` (48px, icon tự `size-6`). `tone="neutral"` (`bg-default text-muted`) cho list trung tính (design restraint — đừng accent hàng loạt); `accent`/semantic chỉ khi muốn nhấn. KHÔNG tự set `size-*`/màu cho icon con — IconTile auto-size + tone (truyền icon **bare**).
- **Phân biệt:** leading **icon trơ nhỏ** (`size-4/5`) chỉ hợp khi row GỌN 1 dòng (nhãn ngắn, không subtitle, như `LabeledList` item) hoặc icon chỉ là **marker phụ** (check/bullet). Row "item đối tượng" có title+subtitle+meta (card-like) → **IconTile**. Hỏi: leading này là **avatar của 1 thứ** (→ IconTile) hay **marker phụ** (→ icon trơ)?
- **Skeleton mirror tile:** row có IconTile `sm` → skeleton leading = `Skeleton size-12 rounded-xl shrink-0` + 2 dòng chữ (`h-4 w-1/2` + `h-3 w-1/3`), KHÔNG 1 vạch đơn → loading khớp loaded (không nhảy chiều cao).

## Nguyên tắc rút ra
- Leading của row = **identity của đối tượng** → cho nó 1 khung (IconTile) có trọng lượng + tận dụng ảnh thật, đừng để 1 glyph nhỏ trôi nổi. Cùng họ [[item-card-meta-inside-bounded-object]] (item = bounded object, mọi thuộc tính kể cả avatar gọn trong khối).

## ĐÃ ÁP DỤNG 2026-06-25 (FE)
- `Bookmarks/BookmarkCard`: leading `<FileTextIcon size-5>` → `<IconTile size="sm" tone="neutral" src={course.coverImageUrl} icon={<FileTextIcon/>} alt={title}>`. Skeleton row trong `Bookmarks/index.tsx` mirror tile (`size-12 rounded-xl` + 2 dòng). tsc/eslint sạch.
