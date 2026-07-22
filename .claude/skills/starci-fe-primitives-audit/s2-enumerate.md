# S2 — Enumerate primitives

Liệt kê primitives từ STORY TREE (title `Primitives/*`) — nguồn sự thật của "primitive nào tồn tại":

```bash
grep -rhoE 'title:\s*"Primitives/[^"]+"' $FE_SOURCE/.storybook/stories \
  | sed -E 's/.*"Primitives\/([^"]+)".*/\1/' | sort -u
```
→ danh sách `Family/Name` (vd `Chip/StatusChip`, `Stats/ProgressMeter`). Toàn app hiện ~99 primitive.

- **Scope hẹp** (thầy gõ `/…-audit chips` hoặc 1 family) → lọc prefix (`Chip/…`).
- **Emit JSON array** để pass `args` cho workflow S3:
  ```bash
  … | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>process.stdout.write(JSON.stringify(d.trim().split('\n'))))"
  ```
- ⚠️ **Gotcha:** `args` đến workflow script dạng **STRING** → trong script phải `const prims = Array.isArray(args) ? args : JSON.parse(args)`.
