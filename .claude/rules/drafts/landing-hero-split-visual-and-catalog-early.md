# Draft — Landing: HeroBanner thêm slot `visual` (split layout) + đưa conversion-surface (catalog) lên SỚM trong funnel (2026-06-25)

- File/§ đích khi `/merge`: `concepts/` (landing/marketing) hoặc `elements/` (HeroBanner) + liên quan brainstorm `features/landing/Landing/UX-BRAINSTORM.md` (vòng 2).
- Bối cảnh: redesign landing (Hướng A đã chốt). Thầy có ảnh dev-hologram trong suốt → làm hero visual anchor.

## Luật (STRICT)
- **Hero marketing có VISUAL ANCHOR → block `HeroBanner` slot `visual` → layout SPLIT** (text trái căn `start` + visual phải; mobile stack text-trên/visual-dưới). KHÔNG có visual → giữ centered single-column (honest, không bịa diagram). 1 block, 2 layout theo `visual` có/không. `Typography align` = `"start"|"center"` (KHÔNG `"left"` — `TypographyAlign` không nhận left/right).
- **Conversion surface (CourseCatalog) đặt SỚM trong funnel** — sau wedge "vì sao khác biệt", KHÔNG để cuối trang. Khách thấy "khóa học mua được gì" sớm; hero CTA `scrollIntoView(#courses)` vẫn trỏ đúng (id di chuyển theo section). Trước: catalog ở §8 (gần cuối) → chuyển lên §4.
- **Ảnh hero = asset thật, KHÔNG fake.** Dùng `<img src="/landing/hero-dev.png">` (plain img, KHÔNG next/image directive — repo lint thuần [[fe-lint-no-next-img-directive-and-serif-polish]]); cần FILE thật ở `public/landing/`. Nếu chưa có file → nêu rõ cho thầy add, KHÔNG bịa.
- **Section cần data mới → KHÔNG dựng khi thiếu hook (đừng fake).** Blog strip + hiring-partner logos cần `useQueryBlogPostsSwr` / `useQueryHeadhuntingCompaniesSwr` (query BE có nhưng FE hook CHƯA có) → defer, ghi follow-up, không hardcode data giả.

## ĐÃ ÁP DỤNG 2026-06-25 (FE)
- `blocks/marketing/HeroBanner`: thêm prop `visual?` → split layout (text col `flex-1 items-start text-left` + visual col `lg:flex-1`); centered khi không có visual. `align` start/center theo `hasVisual`. CTA/keywords justify-start khi split.
- `features/landing/Landing`: hero `visual={<img src="/landing/hero-dev.png" .../>}`; **CourseCatalog (#courses) chuyển từ §8 → sau Wedge** (conversion sớm). tsc + eslint sạch.
- **Follow-up (chưa làm, chờ thầy):** (1) thầy add file `public/landing/hero-dev.png` (ảnh transparent) — giờ `<img>` trỏ tới path đó, thiếu file = ảnh vỡ. (2) Blog section (build-in-public/case-study) + hiring-partner logo strip — cần wire FE hook `useQueryBlogPostsSwr`/`useQueryHeadhuntingCompaniesSwr` (BE query có sẵn). (3) Dedupe/condense Outcomes + Founder (vòng polish sau).
