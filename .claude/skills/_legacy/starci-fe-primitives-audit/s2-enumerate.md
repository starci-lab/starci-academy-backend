# S2 — Enumerate primitives

Liệt kê primitives từ STORY TREE (title `Primitives/*`) — nguồn sự thật của "primitive nào tồn tại":

```bash
grep -rhoE 'title:\s*"Primitives/[^"]+"' $FE_SOURCE/.storybook/stories \
  | sed -E 's/.*"Primitives\/([^"]+)".*/\1/' | sort -u
```
→ danh sách `Family/Name` (vd `Chip/StatusChip`, `Stats/ProgressMeter`). Toàn app hiện ~99 primitive.

> ⚠️ **Chỉ chấm PRIMITIVE THẬT (§6c): shell/container slot content-AGNOSTIC.** Card áp đặt VAI NỘI DUNG (value/label, cover/title/description, header icon+title+action) = **BLOCK** (`Block/Cards/*`), KHÔNG thuộc scope audit này — nếu gặp nó còn title `Primitives/*` thì đó là GAP tier (§6c), flag "retitle sang Block", đừng chấm 10-chiều primitive. (Bài học 2026-07-23: SummaryCard/MediaCard/SectionCard để nhầm Primitives → move Block. NestedCard GIỮ Primitive = container lồng trơ, KHÁC SectionCard vì không có action/pattern nội dung. **Code family (CodeConsole/IOExampleCard/TestCaseResultGrid) = BLOCK domain code/testing → move Block/Code**; **Feedback = giữ Primitive** (generic alert/empty/error/tooltip/confirm), riêng **ReadinessChecklist → Block/Feedback** (compose pattern feature). Lens: generic-mọi-feature = primitive · domain/pattern-feature = block.)

- **Scope hẹp** (thầy gõ `/…-audit chips` hoặc 1 family) → lọc prefix (`Chip/…`).
- **Emit JSON array** để pass `args` cho workflow S3:
  ```bash
  … | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>process.stdout.write(JSON.stringify(d.trim().split('\n'))))"
  ```
- ⚠️ **Gotcha:** `args` đến workflow script dạng **STRING** → trong script phải `const prims = Array.isArray(args) ? args : JSON.parse(args)`.
