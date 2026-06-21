---
name: starci-content-fix
description: >
  Chuẩn hoá NỘI DUNG lesson StarCi (Fullstack/SD/DevOps) theo 3 trục đã chốt: (1) TERMINOLOGY/TRANSLATION —
  áp `.audits/rules/terminology-bold.md` (L1 dịch Việt / L2+L4 giữ English / L3 jargon English+**bold**,
  "source code" giữ English, DE-BOLD inline-code `**`curl`**`→`` `curl` ``); (2) ACCORDION — gói §2.1.5
  (Kiểm thử/Verification) thành `::::accordion`/`:::panel{title}` + gộp intro 1 list, các section nest sâu khác
  giữ nguyên; (3) AUDIT 4-CHALLENGE — mỗi lesson đủ 4 tier easy+medium+hard+insane (rule 2026-06-21).
  Nguyên tắc: CƠ HỌC → script (de-bold), ĐỌC-HIỂU → Sonnet song song, QUYẾT ĐỊNH challenge → Opus.
  Chạy qua Workflow, human-in-loop (review→thầy duyệt→apply→refactor), verify gate+parser, report-only.
  Trigger khi user gõ `/starci-content-fix`, hoặc nói "sửa content", "fix terminology/accordion",
  "chuẩn hoá lesson", "audit cho đủ challenge", "áp pattern content fix".
---

# /starci-content-fix — Chuẩn hoá nội dung lesson (terminology + accordion + 4-challenge)

> Playbook tự-đủ. Rule + runner nằm trong `.audits/`. KHÔNG đọc rule ngoài. Khoá mặc định Fullstack
> (`0-fullstack-mastery`); SD/DevOps đổi base path + rule track (`.audits/rules/system-design|devops/`).
>
> ⚠️ **DATA ROOT = `.mount/data`** — git clone của `StarCi-Academy/data` (remote main). Trước khi làm:
> `git -C .mount/data pull --ff-only`. Nếu `.mount/data` bị materialized lại / mất `.git` (init pipeline ghi đè,
> "no .git" + thiếu module) → re-clone: `git clone https://github.com/StarCi-Academy/data.git .mount/data`
> (nhớ PUSH mọi content local-only — vd `blog`, course mới — lên remote TRƯỚC khi xoá để khỏi mất). SD course =
> `1-system-design-mastery`, runner SD = `.audits/workflows/audit-sd-module.js` (đã trỏ `.mount/data`).
> `refactor-sd-accordion-terminology.js` còn dùng Opus per-lesson — nên đổi sang Sonnet cho accordion/terminology (theo §0).

## 0. NGUYÊN TẮC TỐI THƯỢNG — chọn đúng công cụ cho từng việc (đây là cái làm nó NHANH)
| Việc | Bản chất | Dùng | KHÔNG dùng |
|---|---|---|---|
| **De-bold inline-code** `**\`x\`**`→`` `x` `` | tất định (regex) | **SCRIPT (node)** — §3 | ❌ LLM (chậm, phí) |
| **Accordion §2.1.5** | bán-cấu-trúc, cần đọc | **Sonnet** (song song) | ❌ Opus (phí) |
| **Dịch L1 / bold L3** | cần đọc-hiểu ngữ cảnh | **Sonnet** (sàn rule §0) | ❌ Opus (phí) |
| **Đề xuất + author challenge hard/insane** | judgment cao | **Opus** | ❌ Sonnet (ra bài gượng) |
| **Brief / gate / enumerate / re-gate** | cơ học / JSON | **Haiku/Sonnet** | ❌ Opus |
> Khẩu quyết: *cơ học → script; đọc-hiểu → Sonnet; quyết-định-nội-dung → Opus.* Gate/script rẻ chạy TRƯỚC.

## 1. BA TRỤC FIX (làm gì)
**A. TERMINOLOGY** (SSOT `.audits/rules/terminology-bold.md`): L1 đời thường→**dịch Việt** (available→"sẵn sàng");
L2 EN nền tảng→**giữ English plain** (lifecycle, request, container, queue, **source code** — ruling 2026-06-21
KHÔNG dịch "mã nguồn"); L3 jargon→**English+`**bold**`** (dependency injection, idempotent; bold lần-đầu/lesson);
L4 code→`` `backtick` ``. **DE-BOLD** inline-code/URL (rule §3B cấm bold quanh code). GIỮ nhãn template §3A
(Senior Engineer/Mid-level Developer/Phần 2.1·2.2/Câu hỏi N:/Bước N:/Giải pháp:·Trade-off:·Cơ chế:). CẤM bold ad-hoc.

**B. ACCORDION** (chỉ §2.1.5): gộp 2 intro-list (mục tiêu+route) → 1 list `- **Luồng N — \`route\`:** <mục tiêu>`
(EN `- **Flow N — \`...\`:** <goal>`); thay `##### 2.1.5.1/.2/.3` → `::::accordion` + mỗi luồng 1
`:::panel{title="<tên, không số>"}` … nội dung GIỮ NGUYÊN … `:::`; đóng `::::` (4 dấu bọc 3 dấu). Đã accordion→skip.
Section khác (2.1.3 nest sâu) GIỮ NGUYÊN. Token render bởi FE `MarkdownContent` (committed). Gold:
`0-nestjs-core-and-request-lifecycle/contents/0-frameworks-in-backend/bodies/0-typescript/vi.md`.

**C. 4-CHALLENGE** (`.audits/rules/fullstack/challenges.md §6`): mỗi lesson **đúng 1 mỗi tier easy+medium+hard+insane**
(bỏ luật cũ slot 1-3 chỉ 2 tier). Index `0-…-easy·1-…-medium·2-…-hard·3-…-insane`. Thiếu→thêm: topic cụ thể,
criteria đo cơ chế thật (outcome Σ30 + approach Σ70, ≥1 critical, `# verified`, vi/en mirror, callout `:::muted`).
hard/insane depth production thật — KHÔNG gượng, KHÔNG bỏ tier cho đủ số.

## 2. PIPELINE (thứ tự + lệnh) — mỗi bước verify trước khi sang bước sau
> ⚠️ **Background workflow KHÔNG stop được bằng `TaskStop`/`TaskList`** (không nằm trong task-registry) →
> muốn dừng phải vào UI `/workflows`. ⚠️ **KHÔNG chạy 2 workflow GHI cùng module-set** (giẫm file). ⚠️ Nhiều
> workflow nặng song song = thrash rate-limit → CHẠY 1 CÁI 1 LÚC cho nhanh.

**Bước 1 — REVIEW (đề xuất, KHÔNG sửa file).** `audit-fs-module.js` stage=review:
```
Workflow({ scriptPath: ".audits/workflows/audit-fs-module.js", args: { module: "<slug>", stage: "review", guidance: "<rule 4-challenge>" } })
```
Batch nhiều module → viết wrapper loop `workflow({scriptPath:RUNNER},{module,stage:"review",guidance})` (mẫu: `audit-fs-m1-m4.js`). Ghi `review.md` per-lesson → STOP.

**Bước 2 — THẦY DUYỆT `review.md`.** Substantive (thêm tier, đổi nội dung) = thầy chốt. Chưa duyệt KHÔNG apply.

**Bước 3 — APPLY 4-challenge + content-fix** (Opus). Mặc định **`noE2e:true`** (apply nội dung, e2e đợt sau):
```
Workflow({ scriptPath: ".audits/workflows/audit-fs-module.js", args: { module: "<slug>", stage: "apply", noE2e: true, guidance: "..." } })
```
`noE2e` → Opus thêm challenge + sửa lesson + gate + Opus fix-format loop, KHÔNG code/e2e, KHÔNG ghi
`claude_submitted.md` (gate Check-E2E fail nếu submit mà thiếu `.e2e/`). Batch wrapper: `apply-fs-m1-m8.js`.

**Bước 4 — DE-BOLD (SCRIPT, tức thì)** cho các module sắp refactor (xem §3). Chạy TRƯỚC bước 5.

**Bước 5 — ACCORDION + L1/L3 (Sonnet, SONG SONG)** — sau khi apply + de-bold xong (tránh giẫm file):
```
Workflow({ scriptPath: ".audits/workflows/refactor-fs-fast.js", args: { modules: ["<slug>", ...] } })
```
`refactor-fs-fast.js`: enumerate (haiku) → parallel TẤT CẢ lesson (Sonnet) accordion + dịch L1 + bold L3
(de-bold đã xong bằng script) → gate per-module. (Bản cũ `refactor-fs-accordion-terminology.js` = Opus tuần tự, CHẬM — chỉ dùng khi cần.)

**Bước 6 — VERIFY ĐỘC LẬP** (§4). Sót thì vá (chạy lại de-bold script / fix tay).

**Bước 7 — PUSH lên gitrefs** (chỉ khi module SẠCH + KHÔNG có workflow đang ghi nó):
```
git -C .mount/data add courses/<course>/modules/<slug...>   # chỉ stage module đã xong (FS: 0-fullstack-mastery; SD: 1-system-design-mastery)
git -C .mount/data commit -m "content(<...>): ..."          # + Co-Authored-By
git -C .mount/data fetch origin main; (rebase nếu behind) ; git -C .mount/data push origin main
```
> `.mount/data` = clone của `StarCi-Academy/data` (remote `github.com/StarCi-Academy/data`, branch main).
> Seeder pull tarball từ remote → content chỉ "ra output" khi đã PUSH. Sau push: thầy restart backend để seed (init→PG→MinIO→trang).

## 3. DE-BOLD SCRIPT (cơ học — copy chạy, ~1 giây cho cả batch)
```js
// node debold.mjs <module-dir> [<module-dir> ...]   — gỡ ** quanh inline-code/URL, protect code-fence
import fs from "node:fs"; import path from "node:path"
const files=[]; const walk=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);
  if(e.isDirectory())walk(p);else if(e.name.endsWith(".md"))files.push(p)}}; for(const r of process.argv.slice(2))walk(r)
let tf=0,th=0; for(const f of files){const s=fs.readFileSync(f,"utf8"); const parts=s.split(/(```[\s\S]*?```)/g); let h=0
  const o=parts.map(g=>g.startsWith("```")?g:g.replace(/\*\*(`[^`]+`)\*\*/g,(_,x)=>{h++;return x}).replace(/\*\*(https?:\/\/[^\s*]+)\*\*/g,(_,x)=>{h++;return x})).join("")
  if(h>0){fs.writeFileSync(f,o);tf++;th+=h}} console.log(`de-bold: ${th} chops in ${tf} files`)
```
Verify ngay sau: `grep -rhoE '\*\*`[^`]+`\*\*' <module>/contents/*/bodies | wc -l` → **0**.

## 4. VERIFY (BẮT BUỘC — không tin báo cáo agent, gate độc lập)
```powershell
powershell.exe -NoProfile -File ".audits/check-lesson.ps1" -Path "<module-dir>" -Json
```
→ fails=[] (bỏ qua `github ref … KHÔNG khớp folder .repo` = pre-existing khi repo chưa clone local).
- bold-inline-code = 0: `grep -rhoE '\*\*`[^`]+`\*\*' <m>/contents/*/bodies | wc -l`
- accordion: mỗi file §2.1.5 = 1 `::::accordion` + đúng số `:::panel`; 0 `##### 2.1.5.x` sót.
- challenge: mỗi lesson 4 folder `0-easy·1-medium·2-hard·3-insane`.
- artifact đủ dấu: gate cũng check `research/decision/claude_submitted.md` (brief agent hay viết KHÔNG DẤU → fix lại).
- `***` vỡ: chỉ chấp nhận bold+italic hợp lệ (`**X *y***`).

## 5. GOTCHA (đã dính, đừng lặp)
- **Resume cache 2 mặt:** `resumeFromRunId` trả cache cho agent ĐÃ XONG — nếu agent đó làm DỞ mà "completed" thì cache bản dở (de-bold sót). → verify độc lập sau resume, sót thì chạy de-bold script vá.
- **De-bold = script, đừng để LLM** (M0: 125 chỗ; M1-M8: 325 chỗ — script làm trong 1 giây, agent thì cả tiếng).
- **Sequential modules = chậm.** Dùng `refactor-fs-fast.js` (parallel + Sonnet), KHÔNG dùng bản Opus-tuần-tự trừ khi cần.
- **Push chỉ module SẠCH + không bị workflow ghi** — stage path cụ thể, đừng `add -A` khi workflow đang chạy (commit nửa chừng).
- Mặc định **report-only**: skill KHÔNG tự push/seed; chỉ push khi thầy duyệt. Seed = thầy restart backend.
