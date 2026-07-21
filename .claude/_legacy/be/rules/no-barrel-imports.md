# Rule — Consumer import qua module public `index.ts` (`@modules/<name>`), KHÔNG đào sub-path

**Module khác chỉ được import qua `@modules/<name>` (public `index.ts` của module đó) — không deep-import file nội bộ (`@modules/<name>/sub/internal.service`) hay bypass module cha để chạm thẳng sub-module con.**

- Mọi module BẮT BUỘC có `index.ts` re-export public API ở root — thiếu là gãy alias `@modules/<name>`.
- Module cha chứa nested sub-module (đủ 3 file riêng) → cha `imports` sub-module qua `.register({...})` rồi **re-export lại trong `exports`**; consumer luôn `@modules/<parent>`, KHÔNG import sub-path (vd `AiModule` chứa `AiBalancerModule` — dùng qua `@modules/ai`).
- **Ngược hướng với FE** [[no-barrel-imports]] (FE cấm barrel `export *` gom nhiều thứ vì Turbopack không tree-shake, buộc import sâu tới file nguồn). BE thì NGƯỢC LẠI: `types/`, `enums/`, `classes/` mỗi folder có `index.ts` barrel nội bộ (được khuyến khích), và module boundary bắt buộc đi qua barrel gốc — vì đây là encapsulation kiến trúc (NestJS DI), không phải vấn đề bundle size.

> Đã áp: `src/modules/ai/index.ts` (barrel public), `src/modules/bussiness/progress/index.ts` (`export * from "./progress.module"` + services + types).
> Nguồn: `.cursor/rules/starci-academy.mdc` §Module Folder Structure (index.ts re-export) · `claude-legacy/pattern/03-modules-layer.md` (nested sub-module "re-export ở exports, consumer dùng qua module cha") · memory `feedback-service-folder-structure.md`.

[[module-folder-layout]] · [[shared-modules-global-once-at-app-root]]
