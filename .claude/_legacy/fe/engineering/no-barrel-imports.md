# Concept — KHÔNG barrel (`export *` index) ở FE; import THẲNG file nguồn

> Heuristic engineering (họ `concepts/*`). Thầy chốt 2026-06-27: *"fe không có barrel nhé, xóa mấy cái @/.. lun"* — sau khi `/learn/content` "compile mãi" vì barrel kéo dep nặng vào graph.

## Quy tắc (STRICT)
- **CẤM barrel aggregating ở FE** — KHÔNG `index.ts` chỉ `export * from "./sub"` để gom nhiều subdir thành 1 entry (`@/hooks`, `@/components/blocks`, `@/redux`, `@/modules/api`…). Import phải trỏ **THẲNG tới file khai báo** (vd `@/components/blocks/cards/CourseCard`, `@/hooks/swr/.../useQueryXSwr`), KHÔNG qua barrel.
- **Vì sao:** **Turbopack/Next dev KHÔNG tree-shake** → import 1 symbol từ barrel `export *` = compile **CẢ nhánh** barrel đó. Vụ thật: `@/hooks` `export * from "./useRepoSandpackFiles"` → kéo **sandpack**; `@/components/blocks` `export * from "./marketing"` → kéo **three.js + @react-three + @xyflow**. 1 route dashboard đơn giản (`/learn/content`) phải compile sandpack+three+xyflow → badge "Compiling…" quay mãi. Bỏ barrel = mỗi route chỉ compile module thật sự dùng.
- **Phân biệt barrel vs file nguồn:** `index.tsx` CHỨA component/hook thật (khai báo) **KHÔNG phải barrel** — giữ, import thẳng tới nó (folder resolve về index đó). Chỉ **file chỉ re-export** (`export * from`, `export { X } from`) mới là barrel cần bỏ.
- **`optimizePackageImports` chỉ là plaster, không thay việc bỏ barrel.** Có thể liệt kê barrel ở `next.config` để Next auto-rewrite (đỡ tạm), NHƯNG đích cuối = **xoá hẳn barrel + import sâu** (config chỉ giữ cho **icon pack node_modules** như `@phosphor-icons/react` mà mình không sửa source được).

## Cách làm (codemod, KHÔNG sửa tay hàng nghìn import)
- Dùng **ts-morph** (`npm i --no-save ts-morph`) resolve **chính xác** từng named import: `importSpec.getNameNode().getSymbol().getAliasedSymbol().getDeclarations()[0].getSourceFile()` → file khai báo thật (đi xuyên mọi barrel trung gian 1 phát). Rewrite specifier về path đó (chỉ khi nằm trong `src/`; symbol resolve ra `node_modules` → để nguyên).
- Tách import nhiều symbol khác file thành nhiều dòng; giữ `import type`; xử lý default export.
- Sau rewrite: barrel nào **0 inbound import** → xoá. tsc + eslint gate; fan-out dọn lỗi còn lại (workflow).
- **KHÔNG dùng LLM agent sửa tay bulk** (sai 1 path là tsc vỡ) — codemod deterministic trước, agent chỉ dọn dư.

## Áp đầu (2026-06-27)
- FE `D:\Repositories\starci-academy` (branch **main** — final-mvp đã cũ, main đi trước 27 commit): codemod xoá barrel `@/hooks` · `@/components/blocks` · `@/components/reuseable` · `@/redux` · `@/modules/api` · `@/modules/types` · `@/resources` (+ con). `next.config` `optimizePackageImports` giữ lại **chỉ icon pack** (`@phosphor-icons/react`, `@gravity-ui/icons`).
- Ref [[single-source-render]] (1 thứ = 1 nguồn — nhưng nguồn là FILE THẬT, không phải barrel gom).
