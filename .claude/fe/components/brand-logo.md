# Element — Brand logo / wordmark

> Element doc cho logo StarCi: `Logo` (SVG gốc) → `BrandLogo` (wrapper size) → `BrandLockup` (icon + wordmark).
> 3 lớp, chỉ sửa Ở LỚP DƯỚI (`Logo`) khi cần đổi mark — navbar/footer/splash đều đọc từ 1 nguồn.

## Quy tắc
- **`Logo` (`blocks/identity/Logo`) = mark gốc, KHÔNG sửa lại ở nơi dùng.** SVG inline (crisp mọi cỡ, không
  round-trip HTTP), 1 màu cố định (brand pink `#FB59A7`, đọc được trên cả nền sáng/tối vì SVG không có nền —
  chỉ nét "C" + circuit-node). Sizing = caller set height (`h-8` mặc định, `w-auto` theo), vuông 1:1.
- **`BrandLogo` (`blocks/identity/BrandLogo`) = wrapper đặt size chuẩn** (`h-9 w-auto` = icon 36px) — entry
  point dùng chung cho navbar/footer/splash. KHÔNG tự set `h-*` lên `Logo` ở feature; đổi size chuẩn → sửa
  `BrandLogo`, mọi nơi dùng nó ăn theo.
- **`BrandLockup` (`blocks/identity/BrandLockup`) = icon + wordmark "StarCi / ACADEMY"** (2 dòng, dòng phụ nhỏ
  `text-[8px] uppercase text-muted`). Wordmark **ẨN dưới `md`** (`hidden md:flex`) — mobile chỉ còn icon (chật).
  Đây là NGOẠI LỆ CÓ CHỦ Ý của [[no-uppercase-text]] cho riêng dòng "ACADEMY" (brand small-caps wordmark, không
  phải copy UI thường) — KHÔNG suy rộng ra uppercase chỗ khác.
- Cả 3 block **presentational-only, KHÔNG tự link/click** — bọc `<Link href="/">` ở navbar/footer khi cần
  điều hướng về home.

> Block: `blocks/identity/{Logo,BrandLogo,BrandLockup}`

## Liên quan
- [[no-uppercase-text]] (ngoại lệ wordmark "ACADEMY") · [[single-source-render]] (1 mark, 3 lớp size, không
  fork).
