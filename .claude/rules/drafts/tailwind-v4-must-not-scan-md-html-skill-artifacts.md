# Draft — Tailwind v4 AUTO-SCAN `.md`/`.html` → doc/artifact của skill (brainstorm/critique/session, chứa path Windows `\hex`) làm VỠ BUILD ("Invalid code point"); loại chúng khỏi content scan (2026-07-05)

- File/§ đích khi `/merge`: `concepts/` (engineering/build) hoặc `layouts/` + liên quan skill `starci-fe-layout-brainstorm`/`starci-fe-critique`/`starci-session-store` (chúng ghi `.md` vào repo FE) + `.claude/rules/no-barrel-imports` (họ "build FE turbopack").
- Bối cảnh: FE `starci-academy` (Next 16 Turbopack + **Tailwind v4**) vỡ build: `CssSyntaxError: globals.css:1:1 Invalid code point 3442246` (stack `String.fromCodePoint` ← `markUsedVariable`). Đào ra: **KHÔNG phải globals.css hỏng**, mà Tailwind v4 **auto-scan MỌI file** trong project (gồm `.md`/`.html`, trừ node_modules + gitignore) để trích candidate/`var()`. 1 file `.session/*.md` (checkpoint của `starci-session-store`) chứa path Windows `C:\...\34864604-543e-...\...` → chuỗi `\348646` bị Tailwind đọc thành **CSS unicode-escape 6-hex** → `String.fromCodePoint(0x348646=3442246)` (>0x10FFFF) → RangeError → vỡ build TOÀN APP (globals.css import ở root layout).

## Luật (STRICT)
- **Tailwind v4 content-scan CHỈ nên quét `.tsx` (nơi thật sự có utility class). LOẠI `.md` + `.html` khỏi scan** bằng `@source not` trong `globals.css` (ngay sau `@import "tailwindcss"`):
  ```css
  @source not "**/*.md";
  @source not "**/*.html";
  ```
  Next App Router: class sinh từ `.tsx`; `.md`/`.html` là **prose/doc/prototype** (không cần generate utility). Quét chúng = rủi ro thuần (0 lợi).
- **Vì sao vỡ:** Tailwind v4 (khác v3 cần `content` config) **auto-detect nguồn**; bất kỳ text nào có **`\` + 5–6 hex** (path Windows `\34864604`, escape trong code sample, `\1F600`…) trong file bị quét → parse thành unicode-escape → `fromCodePoint` giá trị invalid → crash. `.md` doc của skill (brainstorm/critique/session) đầy path Windows + code → **mìn nổ chậm**.
- **Artifact của skill KHÔNG để lọt vào cây bị scan/commit:** `.session/` (session checkpoint) + `.starci-prototypes/` (mockup `.html`) → **thêm `.gitignore`** (Tailwind v4 tôn trọng gitignore → cũng khỏi scan; + khỏi commit nhầm). Doc brainstorm `.md` đặt cạnh feature trong `src/` thì `@source not "**/*.md"` lo.
- **Khi build FE lỗi "Invalid code point / CssSyntaxError ở globals.css:1:1" mà globals.css byte-đầu SẠCH** → KHÔNG phải globals hỏng → nghi **Tailwind quét trúng file có `\hex`** (đọc stack: `markUsedVariable`/`fromCodePoint` = đang unescape candidate). Grep repo (kể cả ngoài `src`, trừ node_modules/.next/.git) cho chuỗi hex trong message (vd `348646`); thủ phạm thường là `.md`/`.html` mới rơi vào. Fix = `@source not` + gitignore, KHÔNG sửa globals.
- **Sau khi thêm `@source not` phải RESTART dev server** (turbopack cache bản build lỗi; HMR trên CSS `@source` không re-scan đủ; compile 12–40ms = served-cached, không phải re-scan). Restart → re-đọc config + re-scan.

## Áp đầu (2026-07-05)
- `globals.css`: thêm `@source not "**/*.md"` + `@source not "**/*.html"`. `.gitignore`: thêm `.session/` + `.starci-prototypes/`. Restart FE → mọi route 200 (trước 500). Thủ phạm: `.session/flashcard-quick-answer-recap-fix.md` chứa `...\34864604-...`.
- **Hệ quả cho skill:** `starci-fe-layout-brainstorm`/`critique` ghi `<Feature>/*.md` vào `src/` + `starci-session-store` ghi `.session/*.md` → tất cả giờ AN TOÀN nhờ `@source not`. (Không cần đổi nơi ghi doc.)
