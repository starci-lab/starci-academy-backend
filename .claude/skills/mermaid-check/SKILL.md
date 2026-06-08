---
name: mermaid-check
description: Quét + sửa mọi mermaid diagram trong content course (Fullstack/SD/DevOps) bằng cách RENDER thật với đúng engine FE (mermaid 11.x từ node_modules FE, securityLevel strict, mermaid.render()) → fail ở đây = vỡ trên trang lesson. Dùng skill này khi user gõ "check mermaid", "quét mermaid", "sửa mermaid", "mermaid lỗi", "mermaid render fail", hoặc khi cần validate/fix diagram trong vi.md/en.md. KHÔNG đoán bằng mắt — luôn validate deterministic.
---

# Mermaid Check (content course)

Validate + sửa mermaid trong lesson content. **Nguyên tắc gốc: KHÔNG để model "đọc" đoán cú pháp** — render thật bằng đúng engine FE rồi tin kết quả.

## Vì sao phải render bằng engine FE (không phải mmdc latest)

FE render mermaid ở `starci-academy/src/components/.../MermaidDiagram/index.tsx`:
- `mermaid.initialize({ startOnLoad: false, theme, securityLevel: "strict" })`
- `mermaid.render(id, code)` (KHÔNG chỉ `parse`)
- version pin trong FE `package.json` (hiện `mermaid ^11.14`)

→ Validate bằng mmdc/version khác = **false negative**: pass ở mmdc latest nhưng vẫn vỡ trên trang. Scanner ở đây nạp thẳng `mermaid.esm.min.mjs` từ **node_modules FE** + strict + `render()` → trung thực 1:1.

## Chỉ quét file ĐƯỢC RENDER

FE chỉ render `vi.md` / `en.md` (kể cả trong `bodies/<lang>/`). `research.md`, `test.md`, `proof.md`… là artifact tác giả, KHÔNG render → scanner bỏ qua chúng. Đừng tốn công sửa mermaid trong file không render.

## Quy trình

### 1. SCAN trước (luôn luôn)
```bash
node .claude/skills/mermaid-check/scripts/scan.mjs [courseRelPath]
# default: .mount/data/courses/0-fullstack-mastery
# SD:      .mount/data/courses/1-system-design-mastery
# DevOps:  .mount/data/courses/2-devops-mastery
```
Yêu cầu: backend có `playwright` + chromium (đã cài), FE repo đã `pnpm i` (cần `node_modules/mermaid/dist`). Report đầy đủ → `scratch/mermaid-report.json` (mỗi fail có `file`, `line`, `code`, `error`).

### 2. Phân loại — đừng fix mù
Nhiều block thường **chung 1-2 root cause** → fix deterministic (string-replace) rẻ hơn để model sửa từng cái. Đọc `byType` + `byError` trong report.

### 3. VERIFY mỗi bản sửa TRƯỚC khi patch
Dựng candidate string, render thử bằng cùng engine (xem `scripts/scan.mjs` để copy phần server+playwright). Chỉ patch khi candidate `OK`. Với lỗi mơ hồ (vd sequenceDiagram báo sai dòng) → **bisect cộng dồn từng dòng** để tìm dòng độc.

### 4. PATCH cả vi + en
Diagram thường giống nhau ở vi/en nhưng **nhãn có thể đã dịch** (vd `count changes`→`count đổi`, `set()`→`gọi action → set()`). Patch bằng string-replace in-dòng (không phụ thuộc line-ending CRLF/LF), **assert mỗi `from` phải khớp** kẻo sót.

### 5. RE-SCAN tới 0 fail → push
Content nằm ở `.mount/data` (= working copy repo `StarCi-Academy/data`, branch `main`). Commit + push **từ trong `.mount/data`** (xem memory [[git-memory]]). Chỉ `git add courses/<course>`.

## Cheatsheet root-cause → fix (mermaid v11, đã gặp thật)

| Triệu chứng / error | Root cause | Fix |
|---|---|---|
| `got '1'` ở sequenceDiagram (1 = `$end`/EOF), parser chờ `end` | **Actor trùng keyword**: tên `LOOP` bị tokenize thành keyword `loop` (case-insensitive) → mở block chờ `end`. Tương tự `alt/opt/par/rect/note/end`. | Đổi tên actor (`LOOP`→`TIMER`). |
| `got 'LINK_ID'` trong flowchart edge label | Ký tự **`@`** reserve cho cú pháp shape `@{}` của v11 | Bỏ `@` trong nhãn (`@Scheduled`→`Scheduled`). |
| `Lexical error. Unrecognized text` ở dotted-link | Dạng `A -.text.-> B` với text có space/unicode (`→`) lexer không nuốt | Chuyển pipe-label: `A -.->\|text\| B`. |
| `got 'PS'` (paren start) trong pipe label | `()` rỗng trong nhãn, vd `set()` | Bỏ paren: `set`, hoặc điền nội dung. |
| `No diagram type detected ... <text>` | Dòng KHÔNG phải diagram lọt vào fence ```` ```mermaid ```` (vd shell `cd ...` bị copy nhầm) | Xoá dòng lạ, để header (`graph TD`/`flowchart`) đứng đầu. |
| Node id có space (`Redis state`) → `got 'NODE_STRING'` | Flowchart node id không được có space | Quote: `R["Redis state"]` hoặc bỏ space. |

Lưu ý chung: nhãn trong `["..."]` / `{"..."}` (quoted) chịu được ký tự lạ; nhãn trần và nhãn pipe `|...|` thì dễ vỡ. `securityLevel: strict` (như FE) chặt hơn default — luôn test ở strict.

## Mở rộng
Quét luôn 2 khoá kia khi cần: truyền `1-system-design-mastery` / `2-devops-mastery`. Cùng pipeline, cùng cheatsheet.
