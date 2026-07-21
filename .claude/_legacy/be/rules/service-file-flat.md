# Rule — `*.service.ts` (và mọi file NestJS) KHÔNG được khai báo type/enum/class/const

**File `*.service.ts`/`*.controller.ts`/`*.resolver.ts`/`*.processor.ts`/`*.module.ts` chỉ IMPORT type/enum/class/const, ZERO khai báo inline.**

- Inline `interface`/`type`/`enum`/non-NestJS `class`/exported `const` trong file NestJS = vi phạm cứng — tách ra `types/`/`enums/`/`classes/`/`constants/` ở root module, import lại qua `./types` v.v.
- Đây là hệ quả trực tiếp của [[module-folder-layout]]: service để flat nhưng KHÔNG có nghĩa là "muốn khai gì cũng được" trong file service.
- Cách kiểm nhanh: grep `^(export )?(interface|type|enum) ` trong file `*.service.ts`/`*.resolver.ts` — có match là fail review.

> Đã áp: baseline coding-conventions; nợ tồn (2026-06-16 audit) từng có leak nhưng đã sweep (xem [[no-inline-nested-interfaces]] cho case generic/raw-query cụ thể).
> Nguồn: `.cursor/rules/starci-academy.mdc` §NestJS files must not define types (STRICT) · memory `feedback-service-folder-structure.md`, `feedback-jsdoc-strict.md`.

[[no-inline-nested-interfaces]] · [[type-and-enum-naming]]
