# S4 — Verify + bàn giao

**Gate CỨNG** ở `$FE_SOURCE`:
- `npx tsc --noEmit` — XANH (bỏ qua lỗi `.next` generated pre-existing, không dính file mình).
- `npx eslint <file sửa>` — XANH.
- File story MỚI → restart Storybook để indexer quét vào `index.json` (watcher không hot-add file mới); xác nhận bằng `curl :6006/index.json`.

**KHÔNG tự drive browser verify** (Storybook :6006 HMR tự áp; pane hay treo / `UnknownVizError`). Cần soi pixel → **ĐO DOM** (computed style), đừng chụp hộ — thầy soi mắt.

**Reconcile 3 lớp:** component ↔ story (khớp) ↔ principle (vẫn đúng).

**Báo thầy:** refresh :6006 soi mắt + tóm fix đã apply + states/leaf đã thêm + primitive mới (nếu có).
