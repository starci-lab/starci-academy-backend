# Concept — FE lint = eslint THUẦN (không `@next/next` plugin) → CẤM disable-directive `@next/next/*`; `font-serif` VỠ dấu tiếng Việt → không dùng cho text VN

> Heuristic engineering + content-safety (họ `concepts/*`, FE). 2 luật cross-cutting rút khi apply structure layer.

## Luật 1 (STRICT) — không disable-directive `@next/next/*`
- **FE lint = `eslint` thuần (flat config), KHÔNG nạp plugin `@next/next`.** → mọi comment `// eslint-disable-next-line @next/next/<rule>` sẽ **error "Definition for rule not found"** (kể cả khi đang "tắt" 1 rule). `<img>` tự nó KHÔNG bị flag (rule không tồn tại) → **đừng thêm disable-directive `@next/next/*`**: bỏ comment đi là sạch.
- Ảnh từ CDN/MinIO (URL tuỳ ý, không cấu hình domain) vẫn dùng `<img>` thường (không `next/image`) — nhưng **không kèm** disable-directive next. Muốn chặn thật thì thêm plugin vào flat config, đừng rải directive lẻ.
- **Audit lint 1 feature = `npx eslint <folder>`** (đúng flat config repo). `npx next lint --dir` KHÔNG còn hỗ trợ ở Next version này.

## Luật 2 (STRICT) — `font-serif` LÀM VỠ dấu tiếng Việt
- **KHÔNG dùng `font-serif` cho text TIẾNG VIỆT** (heading editorial, thesis, pull-quote…) tới khi cấu hình 1 **serif face có VN support** (`--font-serif` = Lora/Noto Serif/Be Vietnam… qua next/font). App CHƯA khai `--font-serif` → `font-serif` ăn fallback `ui-serif`/Times/Georgia của OS → các face đó **không có glyph precomposed cho nguyên-âm-có-dấu VN** + không position combining marks → dấu sắc/huyền/ngã **tách rời, lệch** khỏi nguyên âm. Inter (`--font-sans`) render dấu VN chuẩn.
- **Trước khi có serif-face-VN:** muốn "sức nặng editorial" cho text VN → **SANS lớn + treatment quote-like** (`border-l-2 border-accent/60 pl-4 text-xl sm:text-2xl font-medium`), KHÔNG serif. `font-serif` chỉ áp cho text ENGLISH hoặc sau khi có serif-face-VN.
- **Chọn FACE serif cụ thể (font var/weight/tracking) là việc `/ui-apply`** (polish), KHÔNG chốt ở bước UX-apply — structure layer chỉ đặt class `font-serif` (fallback stack).
