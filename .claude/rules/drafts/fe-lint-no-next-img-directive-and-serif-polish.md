# Draft — FE lint dùng PLAIN eslint (không @next/next plugin) → CẤM `<img>` disable-directive `@next/next/*`; serif face = việc /ui-apply (2026-06-21)

- File/§ đích khi `/merge`: `main.md` (engineering/lint rules) + `starci-ui.rules` (typography note nhỏ).
- Bối cảnh: dựng lại UX `/blog`. Hai lesson tổng quát rút ra khi apply structure layer.

## Luật (STRICT)
- **Lint script của FE = `eslint` thuần (flat config), KHÔNG nạp plugin `@next/next`.** ⇒ mọi comment
  `// eslint-disable-next-line @next/next/<rule>` sẽ **error "Definition for rule not found"** (kể cả khi nó
  đang "tắt" một rule). `<img>` tự nó KHÔNG bị flag (rule không tồn tại trong config) → **đừng thêm
  disable-directive `@next/next/*`**: bỏ comment đi là sạch. (Legacy blog có sẵn 2 directive này = nợ lint, đã gỡ.)
  - Ảnh từ CDN/MinIO (URL tuỳ ý, không cấu hình domain) vẫn dùng `<img>` thường (không `next/image`) — nhưng
    **không kèm** disable-directive next. Nếu muốn chặn thật thì thêm plugin vào flat config, đừng rải directive lẻ.
- **Khi audit lint 1 feature, chạy `npx eslint <folder>` (đúng flat config repo), KHÔNG `npx eslint <folder>` kỳ vọng
  có next-plugin.** `npx next lint --dir` cũng KHÔNG còn hỗ trợ ở Next version này (option `--dir` unknown).
- **Serif display title (vd featured lead blog, article H1): structure layer chỉ đặt class `font-serif`** (fallback
  stack Georgia/ui-serif). **Chọn FACE serif cụ thể (font var, weight, tracking) là việc `/ui-apply`** (polish),
  KHÔNG chốt ở bước UX-apply. App hiện chưa khai báo `--font-serif` → `font-serif` ăn fallback mặc định, đủ cho
  cấu trúc; đừng hard-code font family ad-hoc.

## Ghi chú apply blog (đã làm — Direction C)
- IA: `PageHeader` (title+subtitle) → `CategoryFilter` (chip hover+cursor) → `AsyncContent`(skeleton mirror /
  empty phân biệt "chưa có bài" vs "trống theo filter" + clear-filter / error retry) → `FeaturedPost` (serif, flat,
  cover chỉ khi có) → list `PostRow` (text-first, group-hover underline) → `loadMore` (offset, `keepPreviousData`).
- Detail: `ReadingProgress` (fixed top bar) + serif H1 + body + premium gate + GitHub(secondary)/funnel(primary) +
  `RelatedPosts` "More in {pillar}" (tái dùng `blogPosts(category)`, self-hiding).
- DRY: `PostRow` + `CATEGORY_COLOR`/`CATEGORY_FILTERS` ở `blog/shared/` dùng chung list + related.

## Cập nhật 2026-06-26 (STRICT) — `font-serif` LÀM VỠ DẤU TIẾNG VIỆT → KHÔNG dùng cho text Việt tới khi có serif face hỗ trợ VN
- Bối cảnh: founder thesis landing để `font-serif text-2xl` → render *"Nhiê`u nơi... thâ´y... trâ`n trụi... thô´ng... yêu câ`u"* (dấu sắc/huyền/ngã **tách rời, lệch** khỏi nguyên âm). Thầy: *"phông chữ khó đọc, render dạng quote-like"*.
- **Gốc:** app **CHƯA khai báo `--font-serif`** → `font-serif` ăn fallback `ui-serif`/Times/Georgia của OS; các face đó **không có glyph precomposed cho nguyên-âm-có-dấu tiếng Việt** + không position combining marks → dấu vỡ. Inter (`--font-sans`) render dấu Việt CHUẨN (cả trang còn lại đẹp).
- **Luật:** **KHÔNG dùng `font-serif` cho text TIẾNG VIỆT** (heading editorial, thesis, pull-quote…) tới khi cấu hình 1 **serif face có VN support** (`--font-serif` = Lora/Noto Serif/Be Vietnam… qua next/font). Trước đó: muốn "sức nặng editorial" → **SANS lớn + treatment quote-like** (blockquote `border-l-2 border-accent/60 pl-4 text-xl sm:text-2xl font-medium`), KHÔNG serif. Đính chính "serif H1/featured" ở blog phía trên: chỉ áp khi text English HOẶC sau khi có serif-face-VN.
- **ĐÃ FIX:** `FounderManifesto` thesis `<p font-serif>` → `<blockquote>` sans + accent left-rule (quote-like, đọc dấu Việt OK). + eyebrow "Góc khuất nghề code" / title "Sự thật trần trụi về ngành IT" (vi+en). tsc/eslint sạch.
