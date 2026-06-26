# Draft — Landing/marketing: section cách nhau LỚN (gap-24/96px+, KHÔNG gap app 6/8) + dải số liệu = editorial strip (số to + divider, không card) (2026-06-25)

- File/§ đích khi `/merge`: `layouts/` (gap — thêm thang marketing) + `concepts/` (landing) + liên quan [[gap]] (đính chính: thang 0/2/3/6/8/10 là cho APP; marketing khác) + [[no-uppercase-text]] (label editorial) + [[design-for-data-that-exists-coverless-lowvolume]].
- Bối cảnh: landing `/vi` dải số liệu (7 Học viên · 343 Bài học · 4 Khóa học · 12 Huy hiệu) = 4 card dark nhỏ, section cách nhau `gap-12` (48px) — chật, không "thở" như landing. Thầy: *"gap giữa stats xa hơn; rule gap-24 trở lên (research để lấy gap); redesign section này"*. Ref thầy gửi = editorial strip (số rất to + label nhỏ + divider dọc).

## Luật 1 (STRICT) — Section landing cách nhau bằng GAP THẬT (gap-24→32), KHÔNG min-h-screen per beat
- **ĐÍNH CHÍNH 2026-06-26 vòng 2 (thầy: *"layout lệch, gap quá dài"*): BỎ `min-h-[calc(100dvh-4rem)] justify-center` ở MỌI beat (trừ Hero) + between-section gap = `gap-24 md:gap-32` (96→128px) ở root.** `<div className="...flex flex-col gap-24 px-4 ... md:gap-32 ...">`.
  - **Vì sao bỏ min-h:** min-h-screen per beat (mỗi section ≥1 màn) + `justify-center` → content ngắn nổi GIỮA 1 màn → **nửa trên/dưới trống hoác**; cộng thêm gap-48 (192px) giữa beat = dead-space chồng dead-space → "gap quá dài" + đọc ra "lệch" (content lẻ loi giữa khoảng trắng). → **section co theo content** (bỏ min-h + justify-center) → flow tự nhiên, gap root là khoảng cách THẬT giữa content.
  - **NGOẠI LỆ giữ min-h:** **Hero** (fill fold đầu — first impression) + **LearnLoopScroll** (scrollytelling pinned cần chiều cao). Còn lại (Courses/Treasure/Founder/Talent/FAQ/Closing) = `flex flex-col gap-16` (bỏ min-h).
  - **Đính chính bản vòng 1 (gap-48 + giữ min-h):** SAI hướng — min-h là thủ phạm dead-space, không phải thiếu gap. Bỏ min-h rồi thì gap-48 (192px) quá dài → **gap-24 md:gap-32**. Thầy chốt gap-24→32 (chuẩn premium landing ~96-128px, vd Stripe/Linear).
  - **Internal section (header `SectionHeading` → content) = `gap-16`** (đồng bộ mọi section, kể cả StatStrip — bỏ gap-24/py-16 lẻ). Nội bộ khối content vẫn gap-6.
  - **Bỏ spacing lẻ** (StatStrip `py-16`, Talent wrapper `min-h`) → section là direct child root flex-col, để root gap lo.
  - **Trong 1 section: header (`SectionHeading`) ↔ nội dung dưới = `gap-16`** (64px; ĐÍNH CHÍNH 2026-06-26 — thầy chốt gap-24 dài quá → `gap-16`; KHÔNG còn gap-6/8 như app). Nội bộ khối content (grid ↔ footer, item ↔ item) vẫn `gap-6`. Section nhiều khối → bọc content `<div className="flex flex-col gap-6">` để header→content = gap-16, nội bộ = gap-6. Canonical: [[gap]] §Ngoại lệ có tên. Áp: courses · treasure · founder · faq · LearnLoop.
- **Đây là thang RIÊNG cho marketing**, không đụng [[gap]] (app). Khi `/merge`: ghi 1 mục "Marketing/landing rhythm" tách khỏi thang app. Repo dùng `flex flex-col gap-24` ở root landing (thay `gap-12`).
- **Mobile co lại:** `gap-16 sm:gap-24` (64→96px) để mobile không quá thưa.

## Luật 2 (STRICT) — Platform stats = EDITORIAL STRIP (số to + label nhỏ + divider), KHÔNG metric-card grid
- **Dải "số liệu nền tảng" (learners/lessons/courses/badges) = 1 hàng editorial PHẲNG: con số RẤT TO (`text-4xl`/`text-5xl` ~36–48px, `font-medium`, `tracking-tight`) + label nhỏ mờ bên dưới, ngăn bằng DIVIDER DỌC (`border-l border-default`), KHÔNG bọc mỗi số 1 `<Card>`/`MetricCard`.** Card cho số liệu landing = nặng, nhỏ, kém sang; editorial strip (Stripe/Linear/Vercel landing) để con số tự nói. Ref thầy gửi xác nhận kiểu này.
  - Layout: `grid grid-cols-2 md:grid-cols-4` (mobile 2, desktop 4) + mỗi ô `flex flex-col items-center gap-1 border-l border-default first:border-l-0` (divider giữa, ô đầu không viền). Mobile 2 cột thì divider theo cặp (hoặc bỏ divider mobile, chỉ `gap`).
  - **Số** = `Typography` cỡ lớn (`type` h2/h1 hoặc class `text-4xl md:text-5xl font-medium tracking-tight`), KHÔNG `h4` nhỏ như card cũ. **Label** = `text-xs text-muted` (sentence case — [[no-uppercase-text]]; nếu thầy duyệt uppercase editorial thì thêm `uppercase tracking-wide`, mặc định KHÔNG).
  - Bỏ icon mỗi ô (editorial = số trần, icon làm rối). Hoặc giữ 1 icon nhỏ mờ trên số nếu thầy muốn — mặc định bỏ.
- **2 biến thể (thầy chọn):**
  - **A — phẳng** (số + divider trên nền trang): nhẹ nhất, số tự gánh. Hợp dark landing.
  - **B — trên BAND** (bọc strip trong `bg-surface rounded-md border-y border-default py-* `): tách hẳn "vùng số liệu", giống ref light (band có viền trên/dưới). Set-apart hơn.
- **Gate giữ:** error → ẩn cả strip (không show số 0 làm "proof"); 0-value cân nhắc ẩn ô (learners=7 thật thì OK). Skeleton mirror strip mới (số to), KHÔNG mirror 4 card h-28 cũ.

## Refs
- [Web design spacing best practices](https://www.conceptfusion.co.uk/post/web-design-spacing-and-sizing-best-practices) · [Red Hat spacing](https://ux.redhat.com/foundations/spacing/) · [Unbounce — white space converts](https://unbounce.com/landing-page-design/white-space/). Editorial stats: Stripe / Linear / Vercel landing (số to + label nhỏ + divider, no card).

## Áp (sau khi thầy chốt A/B)
- `Landing/index.tsx` root: `gap-12` → `gap-16 sm:gap-24`; hero→stats để `gap-32` nếu tách wrapper.
- `StatStrip`: bỏ `MetricCard` grid → editorial strip (số `text-4xl md:text-5xl` + label `text-xs muted` + `border-l` divider). Skeleton mirror. Giữ data `platformStats` + gate error.
- Cân nhắc trích block `StatStripEditorial` (blocks/stats) tái dùng cho landing khác.
- **Hỏi thầy:** A (phẳng) hay B (band)? · label sentence-case (mặc định, đúng rule) hay uppercase editorial (cần duyệt)?
