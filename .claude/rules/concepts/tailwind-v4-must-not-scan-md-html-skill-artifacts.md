# Concept — Tailwind v4 AUTO-SCAN `.md`/`.html` → doc/artifact chứa path Windows `\hex` làm VỠ BUILD ("Invalid code point"); loại chúng khỏi content scan

> Heuristic engineering/build (họ `concepts/*`, FE Next+Tailwind v4). Cùng họ build-FE với [[no-barrel-imports]].

## Root cause
FE `starci-academy` (Next 16 Turbopack + Tailwind v4) vỡ build: `CssSyntaxError: globals.css:1:1 Invalid code point …` (stack `String.fromCodePoint` ← `markUsedVariable`). **KHÔNG phải globals.css hỏng** — Tailwind v4 **auto-scan MỌI file** (gồm `.md`/`.html`, trừ node_modules + gitignore) để trích candidate/`var()`. 1 file `.session/*.md` (checkpoint) chứa path Windows `C:\...\34864604-...\` → chuỗi `\348646` bị đọc thành **CSS unicode-escape 6-hex** → `String.fromCodePoint(0x348646)` (>0x10FFFF) → RangeError → vỡ build TOÀN APP (globals.css import ở root layout).

## Luật (STRICT)
- **Tailwind v4 content-scan CHỈ nên quét `.tsx`. LOẠI `.md` + `.html` khỏi scan** bằng `@source not` trong `globals.css` (ngay sau `@import "tailwindcss"`):
  ```css
  @source not "**/*.md";
  @source not "**/*.html";
  ```
  Class sinh từ `.tsx`; `.md`/`.html` là prose/doc/prototype (không cần generate utility). Quét chúng = rủi ro thuần (0 lợi).
- **Vì sao vỡ:** Tailwind v4 (khác v3 cần `content` config) **auto-detect nguồn**; bất kỳ text có **`\` + 5–6 hex** (path Windows `\34864604`, code sample `\1F600`…) trong file bị quét → parse thành unicode-escape → crash. `.md` doc của skill (brainstorm/critique/session) đầy path Windows + code = **mìn nổ chậm**.
- **Artifact của skill KHÔNG để lọt vào cây bị scan/commit:** `.session/` (checkpoint) + `.starci-prototypes/` (mockup `.html`) → **thêm `.gitignore`** (Tailwind v4 tôn trọng gitignore → khỏi scan + khỏi commit nhầm). Doc brainstorm `.md` cạnh feature trong `src/` thì `@source not "**/*.md"` lo.
- **Chẩn:** build FE lỗi "Invalid code point / CssSyntaxError ở globals.css:1:1" mà globals.css byte-đầu SẠCH → nghi Tailwind quét trúng file có `\hex` (stack `markUsedVariable`/`fromCodePoint` = đang unescape candidate). Grep repo (trừ node_modules/.next/.git) chuỗi hex trong message; thủ phạm thường `.md`/`.html` mới rơi vào. Fix = `@source not` + gitignore, KHÔNG sửa globals.
- **Sau khi thêm `@source not` phải RESTART dev server** (turbopack cache bản build lỗi; HMR trên CSS `@source` không re-scan đủ).

## Liên quan
- [[no-barrel-imports]] (cùng họ build FE turbopack) · [[single-source-render]].
