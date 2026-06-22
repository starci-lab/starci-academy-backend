---
name: starci-personal-project-fix
description: >
  Chuẩn hoá NỘI DUNG task "Dự án cá nhân" (milestone/capstone) của StarCi theo 3 trục đã chốt:
  (1) SPLIT 1-LANG — task `agnostic` nhồi nhiều code sample (TS/Java/C#/Go) trong 1 brief → TÁCH thành
  4 brief per-language (`## 0 typescript / ## 1 java / ## 2 csharp / ## 3 go`, mỗi brief body 1 lang),
  mirror 146 task đã đúng; FE `pickBriefByLang` tự hiện đúng lang học viên chọn. (2) ACCORDION — gói khối
  "Các bước (theo thứ tự)" thành `::::accordion`/`:::panel{title="Bước N — …"}` (mỗi bước 1 panel), giữ Mục
  tiêu + Kiểm tra phẳng. (3) TERMINOLOGY — de-bold inline-code (`**`x`**`→`` `x` ``) bằng SCRIPT + L1 dịch
  Việt / L3 jargon English+**bold** (rule `.audits/rules/terminology-bold.md`). Nguyên tắc: cơ học→script,
  đọc-hiểu→Sonnet, author lang thiếu→Opus. Chạy qua Workflow, human-in-loop (enumerate→thầy duyệt→apply),
  verify gate `.audits/check-task.mjs`, report-only. Trigger khi user gõ `/starci-personal-project-fix`, hoặc
  nói "sửa dự án cá nhân", "tách lang task", "task 4 lang", "accordion các bước", "chuẩn hoá milestone task".
---

# /starci-personal-project-fix — Chuẩn hoá nội dung task Dự án cá nhân (split-1-lang + accordion + terminology)

> Playbook tự-đủ. Runner + gate nằm trong `.audits/`. Schema TASK **khác** lesson — KHÔNG dùng
> `check-lesson.ps1`/`audit-fs-module.js` (lesson-only). Khoá mặc định SD (`1-system-design-mastery`);
> đổi `course` arg cho FS (`0-fullstack-mastery`) / DevOps (`2-devops-mastery`).

## 0. NGUYÊN TẮC TỐI THƯỢNG — chọn đúng công cụ (đây là cái làm nó NHANH + ĐÚNG)
| Việc | Bản chất | Dùng | KHÔNG dùng |
|---|---|---|---|
| **De-bold inline-code** `**\`x\`**`→`` `x` `` | tất định (regex) | **SCRIPT node** (§3) | ❌ LLM |
| **Tách body theo lang** (lang đã có code sẵn) | bán-cơ-học | **Sonnet** | ❌ Opus |
| **Author code cho lang body phủ MỎNG** | judgment cao | **Opus** (KHÔNG dịch máy) | ❌ Sonnet (ra code gượng) |
| **Accordion khối "Các bước"** | bán-cấu-trúc | **Sonnet** | ❌ Opus |
| **Dịch L1 / bold L3** | đọc-hiểu ngữ cảnh | **Sonnet** | ❌ Opus |
| **Enumerate / classify / gate** | cơ học / JSON | **Haiku/script** | ❌ Opus |
> Khẩu quyết: *cơ học → script; đọc-hiểu → Sonnet; author-nội-dung-mới → Opus.* Gate/script rẻ chạy TRƯỚC.

## 1. SCHEMA TASK (khác lesson — đọc kỹ trước khi sửa)
File: `.mount/data/courses/<course>/milestones/<N>-<slug>/tasks/<M>-<slug>/{vi,en}.md`. Phân cách bằng
`<!-- @starci/seperator -->`. Cấu trúc:
```
# sortIndex / # title / # description / # type / # weight / # maxScore / # verified
# criterias
## 0                          ← brief index (per-language)
### lang                      ← typescript | java | csharp | go | agnostic
### body                      ← markdown học viên ĐỌC (Mục tiêu/Các bước/Kiểm tra) — render qua MarkdownContent
### outcome                   ← #### 0/1/2 → ##### body/score/critical
### approach                  ← #### 0/1/2 → ##### body/score/critical
## 1 …                        ← brief tiếp theo (lang khác)
```
**Ràng buộc parser** (`src/modules/init/seeders/courses/parsers/milestone-task.service.ts` — vi phạm = vỡ seed):
- Brief index **liên tục từ `## 0`** (ID factory dùng vị trí `.map` → bỏ số = lệch UUID khi reseed).
- `### lang` ∈ `{typescript, java, csharp, go}` (FE chỉ match 4 giá trị này; parser không validate nhưng FE bỏ qua sai). `agnostic` chỉ cho task 1-lang-thật giữ nguyên.
- **GIỮ nguyên số lượng + index tiêu chí** `#### 0/1/2` trong outcome/approach (parser pivot rubric từ `langBlocks[0]`).
- vi.md ↔ en.md **mirror brief-count + dãy lang**.

**FE đọc:** `PersonalProject/TaskBrief/index.tsx` → `pickBriefByLang(briefs, lang)` chọn brief khớp lang học viên
(store `personalProjectGithub`, default `typescript`), fallback `briefs[0]`. Body render bằng **cùng
`MarkdownContent`** mà lesson dùng → token `::::accordion`/`:::panel`/`:::muted` đều render.

## 2. BA TRỤC FIX (làm gì)
**A. SPLIT 1-LANG** — task `agnostic` + 1 brief mà body nhồi ≥2 ngôn ngữ (vd `package.json` + `go.work` +
`pom.xml` + `.csproj`) → **tách 4 brief per-lang**:
- `## 0` ts / `## 1` java / `## 2` csharp / `## 3` go. Mỗi brief: prose chung (Mục tiêu, mô tả bước, Kiểm tra)
  **GIỮ NGUYÊN**, **chỉ fence code khác theo lang**.
- Lang nào body gốc phủ MỎNG (chưa đủ code chạy thật) → **Opus author thêm** đúng idiom lang đó (KHÔNG dịch máy).
- Outcome/approach: **copy rubric từ brief 0 cho cả 4**, chỉ chỉnh tên manifest theo lang
  (`package.json`/`go.mod`/`pom.xml`/`.csproj`). Giữ nguyên số tiêu chí `#### N`.
- **GOLD** (shape đích): `.mount/data/courses/0-fullstack-mastery/milestones/0-project-foundation/tasks/0-clean-architecture-and-health/vi.md`.
- KHÔNG đụng task đã 4-brief (146 task) hay task `agnostic`-1-lang-thật (FE/design — DevOps gần như chỉ loại này).

**B. ACCORDION khối "Các bước"** — trong MỖI brief body, khối sau `:::muted\nCác bước (theo thứ tự)\n:::`
(EN `Steps (in order)`): bọc toàn bộ bằng `::::accordion`; mỗi `**Bước N — <tên>.** <nội dung + fence>` →
`:::panel{title="Bước N — <tên>"}` …nội dung bước (kể cả code fence) GIỮ NGUYÊN… `:::`; đóng khối `::::`
(4 dấu bọc 3 dấu). EN `title="Step N — <name>"`. **GIỮ** callout Mục tiêu + Kiểm tra PHẲNG (không accordion).

**C. TERMINOLOGY** (SSOT `.audits/rules/terminology-bold.md`) — áp cho prose trong `### body`:
- **DE-BOLD** inline-code/URL bằng SCRIPT (§3). L1 đời thường còn English → **dịch Việt, không bold**.
  L3 jargon chưa bold → **English+`**bold**`** (bold lần-đầu). GIỮ L2 EN nền tảng plain (lifecycle/request/
  container/queue/**source code** giữ English), L4 code trong `` `backtick` ``, nhãn template (Mục tiêu/Các bước/
  Kiểm tra/Bước N/Giải pháp/Trade-off/Cơ chế). CẤM bold ad-hoc/quanh code.

## 3. DE-BOLD SCRIPT (cơ học — tái dùng của content-fix, ~1 giây cho cả batch)
```js
// node debold.mjs <task-dir-or-parent> ...  — gỡ ** quanh inline-code/URL, protect code-fence
import fs from "node:fs"; import path from "node:path"
const files=[]; const walk=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);
  if(e.isDirectory())walk(p);else if(e.name.endsWith(".md"))files.push(p)}}; for(const r of process.argv.slice(2))walk(r)
let tf=0,th=0; for(const f of files){const s=fs.readFileSync(f,"utf8"); const parts=s.split(/(```[\s\S]*?```)/g); let h=0
  const o=parts.map(g=>g.startsWith("```")?g:g.replace(/\*\*(`[^`]+`)\*\*/g,(_,x)=>{h++;return x}).replace(/\*\*(https?:\/\/[^\s*]+)\*\*/g,(_,x)=>{h++;return x})).join("")
  if(h>0){fs.writeFileSync(f,o);tf++;th+=h}} console.log(`de-bold: ${th} chops in ${tf} files`)
```
Chạy TRƯỚC stage apply cho milestone-set sắp sửa. Verify: `node .audits/check-task.mjs <dir>` → 0 bold-inline-code.

## 4. PIPELINE (thứ tự + lệnh) — mỗi bước verify trước khi sang bước sau
> ⚠️ Background Workflow **KHÔNG stop** bằng `TaskStop`/`TaskList` → muốn dừng vào UI `/workflows`.
> ⚠️ KHÔNG chạy 2 workflow GHI cùng task-set (giẫm file). ⚠️ Nhiều workflow nặng song song = thrash rate-limit → 1 cái 1 lúc.

**Bước 1 — ENUMERATE + CLASSIFY** (haiku, KHÔNG sửa). Phân loại từng task: `needs-split` · `already-4brief` · `agnostic-1lang-skip`:
```
Workflow({ scriptPath: ".audits/workflows/fix-personal-project.js", args: { course: "1-system-design-mastery", stage: "enumerate" } })
```
→ bảng scope. **STOP cho thầy xem scope** (bao nhiêu task cần split).

**Bước 2 — REVIEW** (Opus, KHÔNG ghi). Per task: kế hoạch 4-brief + lang nào phải author thêm + số bước accordion:
```
Workflow({ scriptPath: ".audits/workflows/fix-personal-project.js", args: { course: "...", stage: "review", milestones: ["0-...", "1-..."] } })
```
→ **THẦY DUYỆT** (substantive: thêm lang, author code = thầy chốt). Chưa duyệt KHÔNG apply.

**Bước 3 — DE-BOLD SCRIPT** (§3, tức thì) cho milestone-set sắp apply. Chạy TRƯỚC bước 4.

**Bước 4 — APPLY** (Opus tự-xác-định split + accordion + L1/L3). **BẮT BUỘC truyền `taskDirs`** (enumerate bằng
Bash, KHÔNG để runner LLM-`ls` — haiku-ls hay sót chỉ trả 1 task). Enumerate:
```
# liệt kê task-dir (relative từ repo root) cho milestone-set
for ms in 0-project-foundation 1-frontend-setup; do ls -d .mount/data/courses/0-fullstack-mastery/milestones/$ms/tasks/*/; done
```
rồi truyền mảng đó vào `taskDirs`:
```
Workflow({ scriptPath: ".audits/workflows/fix-personal-project.js",
  args: { course: "0-fullstack-mastery", stage: "apply", milestones: ["0-project-foundation"],
          taskDirs: [".mount/data/courses/0-fullstack-mastery/milestones/0-project-foundation/tasks/0-...", "...", ...] } })
```
Apply agent TỰ ĐỌC file → split nếu agnostic-cram, không thì chỉ accordion+terminology. Ghi vi.md/en.md → gate.
**Nên apply 1 milestone (5 task) làm mẫu trước**, OK rồi chạy nốt. Task đã có accordion rồi thì BỎ khỏi `taskDirs` (tránh double-wrap).

**Bước 4b — STRIP step-bold (safety-net, tức thì)** sau apply: `node .audits/strip-step-bold.mjs <file.md ...>`.
Gỡ dòng bold `**Bước N — …**` TRÙNG trong panel (1 số agent để lại → title lặp 2 lần). Idempotent.

**Bước 5 — VERIFY ĐỘC LẬP** (§5). Sót thì vá (de-bold lại / strip-step-bold / fix tay).

**Bước 6 — PUSH lên gitrefs** (chỉ khi task-set SẠCH + KHÔNG có workflow đang ghi):
```
git -C .mount/data add courses/<course>/milestones/<slug...>     # chỉ stage milestone đã xong
git -C .mount/data commit -m "content(personal-project): split per-lang + accordion + terminology"   # + Co-Authored-By
git -C .mount/data fetch origin main; (rebase nếu behind) ; git -C .mount/data push origin main
```
> `.mount/data` = clone `StarCi-Academy/data` (gitrefs/SSOT). Content chỉ "ra output" khi đã PUSH. Sau push: thầy restart backend để seed.

## 5. VERIFY (BẮT BUỘC — gate độc lập, không tin báo cáo agent)
**5a. RENDER-validate directive** (QUAN TRỌNG — `check-task.mjs` chỉ check balance, KHÔNG bắt được nesting/quote vỡ):
```
node .audits/fix-panel-title-quotes.mjs <file.md ...>   # safety-net: title chứa "..." -> '...' (directive vỡ nếu inner quote)
node .audits/check-directive-render.mjs <file.md ...>   # parse bằng CHÍNH remark-directive của FE; marker thành TEXT = vỡ render
```
`check-directive-render.mjs` import remark-directive từ FE node_modules (`D:/Repositories/starci-academy`) → bắt 2 lỗi gate-balance bỏ sót: (a) panel-title có inner `"`/`\"` → panel vỡ thành text; (b) nesting colon sai (tab sâu hơn panel). Đã dính M1-task4 (title `\"nháy\"`). CHẠY check này TRƯỚC push.

**5b. STRUCTURE gate** (balance + 1-lang + terminology):
```
node .audits/check-task.mjs "<task-dir | milestone-dir | tasks-dir>" [--json]
```
→ `X task · 0 fail`. Gate check mỗi task: (a) brief index liên tục 0..N; (b) lang ∈ {ts,java,csharp,go,agnostic};
(c) mỗi brief đủ lang/body/outcome/approach + số tiêu chí `#### N` khớp brief 0; (d) **mỗi brief body chỉ 1
language-family** (0 cram đa-lang — đây là check "1 lang"); (e) accordion cân `::::`/`:::`/panel-title;
(f) 0 bold-inline-code; (g) vi/en mirror brief-count + dãy lang.
- Spot-check tay 1 task: `## 0/1/2/3` đúng ts/java/csharp/go; mỗi body chỉ fence lang của nó; khối "Các bước" thành accordion.
- Parser test còn xanh: `npm test -- milestone-task.service.spec`.

## 6. GOTCHA (đã dính — đừng lặp)
- **⚠️ `args` tới script dưới dạng JSON-STRING, KHÔNG phải object** (đã dính: chạy nhầm cả khóa SD, 113 agent/4.8M token). Runner PHẢI normalize `const A = typeof args==='string' ? JSON.parse(args) : (args||{})` rồi đọc `A.course/A.stage/A.milestones`. Đọc thẳng `args.course` = undefined → rơi về default (course SD + tất cả milestone). **Đã có guard:** `stage:apply` mà thiếu `A.milestones` → runner TỪ CHỐI (không ghi cả khóa). Dùng `stage:"probe"` (0 token) để xác nhận args parse đúng TRƯỚC khi apply.
- **Gate báo "cram" trên task FULLSTACK là FALSE-POSITIVE nếu do `tsx/mdx` (frontend).** FS task = backend-lang chọn + React frontend chung → java brief kèm tsx là ĐÚNG. Gate `check-task.mjs` chỉ đếm fence backend-phân-biệt (`jsonc/toml/go/java/csharp`); KHÔNG sửa lại để đếm tsx. Toàn catalog chỉ **1 task thật cram**: SD `0-monorepo.../tasks/0-shop-services-map` (agnostic, jsonc+toml). FS first-5 = 0 split.
- **Outcome/approach: parser chỉ đọc brief 0** nhưng vẫn **replicate đủ 4×** cho khớp gold + tránh hiểu nhầm khi đọc raw md.
- **Split KHÔNG thuần cơ học:** lang phủ mỏng (body agnostic chỉ có TS+Go, thiếu Java/C#) phải **Opus author đủ code chạy thật** — đừng để Sonnet ra code gượng/dịch máy.
- **xml mơ hồ** (pom.xml vs .csproj): gate cố ý loại xml khỏi đếm family → 1 brief java có `java`+`xml` vẫn pass. Khi split, đặt `.csproj` vào brief go**? KHÔNG** — `.csproj` thuộc brief csharp, `pom.xml` thuộc brief java.
- **⚠️ Apply agent HAY TỰ-SPLIT/ĐỔI-LANG task FE-only (agnostic 1-brief) dù không nên** (đã dính M1: task `2-api-client` bị split 4 brief bịa port; task `3-ui-primitives` bị đổi agnostic→typescript). → **milestone FE-track (frontend-setup, *-ui-*) PHẢI truyền `noSplit:true`** (runner cấm split + cấm đổi lang, chỉ accordion+terminology). Chỉ task SCAFFOLD/monorepo (agnostic cram thật ≥2 backend manifest) mới để split. Apply xong PHẢI verify `briefs`+`lang` không đổi ngoài ý muốn (so với git HEAD); lệch → `git checkout` task đó rồi re-apply `noSplit`.
- **DevOps gần như không dính** (terraform/yaml đã 1-lang, chỉ ~3 task) → đừng ép split cái vốn agnostic-thật.
- **`resumeFromRunId` cache cả agent làm-dở** → luôn verify gate độc lập sau resume; sót thì chạy lại de-bold / fix tay.
- **Background workflow không stop bằng TaskStop** → UI `/workflows`. **1 workflow GHI / task-set / lúc.**
- **Sau git ops nhớ `cd` về repo root** (cwd Bash persist; để ở `.mount/data` làm hỏng nested workflow path → dùng absolute `D:/.../.audits/...`).
- Mặc định **report-only**: skill KHÔNG tự push/seed; push khi thầy duyệt, seed = thầy restart backend.
