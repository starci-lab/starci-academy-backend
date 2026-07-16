# Rule — English-only trong code (comment/JSDoc/identifier); tiếng Việt chỉ ở i18n

**Mọi comment, JSDoc, inline `//`, `TODO`/`FIXME`, và identifier phải viết English (sản phẩm hướng quốc tế) — user-facing copy đi qua i18n file, không hardcode string tiếng Việt trong code.**

- Không mix tiếng Việt vào comment dù đang làm việc/trao đổi bằng tiếng Việt — code English-only tuyệt đối.
- Áp cho cả JSDoc per-member ([[jsdoc-strict-per-member]]) lẫn inline `//` giải thích logic — hai thứ này BẮT BUỘC nhưng phải là English.
- Copy hiển thị người dùng (label, message, toast) → file i18n `vi`/`en`, không hardcode trong `.service.ts`/`.resolver.ts`.

> Đã áp: baseline toàn bộ `src/modules/**`; skill/rule cùng nhóm bake ngày 2026-06-16 khi audit no-inline-nested-interfaces cũng update rule English-only song song ở FE lẫn BE.
> Nguồn: `.cursor/rules/starci-academy.mdc` §Unified Comment Pattern ("ENGLISH ONLY — no Vietnamese in code (STRICT)").

[[jsdoc-strict-per-member]]
