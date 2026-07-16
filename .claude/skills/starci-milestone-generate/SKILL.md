---
name: starci-milestone-generate
description: >
  TẠO / MỞ RỘNG milestone + task dự án cá nhân (capstone) cho 1 khóa StarCi (Fullstack/System Design/DevOps) tại
  `.mount/data/courses/<course>/milestones/` — author milestone MỚI (`{vi,en}.md` meta + `tasks/<M>/`) hoặc thêm task,
  theo chuẩn plan personal-project-fix + gate `check-task.mjs`. Task = brief hướng dẫn học viên tự xây 1 phần capstone:
  DSL `# sortIndex/title/description/type/weight/maxScore/verified/criterias`; `# criterias` per-brief per-lang
  (`### lang/body/outcome/approach`), body = `:::muted Mục tiêu` + `:::muted Các bước` → **`::::accordion`** mỗi bước
  1 panel (code fence). SPLIT per-lang (ts/java/csharp/go) hoặc agnostic; 1 language-family/brief; terminology-bold;
  vi↔en mirror. NHẸ (KHÔNG e2e — học viên build). 2 GIAI ĐOẠN: đề xuất scope (task nào · lang nào · outcome/approach)
  → HỎI THẦY chốt → author (Sonnet 5 mặc định) → gate `check-task.mjs`. Dùng khi user gõ `/starci-milestone-generate
  <course|milestone>`, "gen milestone/capstone/task dự án", "viết task mới". Để KIỂM đã đủ → `/starci-milestone-audit`.
---

# /starci-milestone-generate — Author / mở rộng milestone + task capstone

Chạy khi thầy muốn TẠO milestone/task capstone. **Rule tự-đủ:** plan trong `.claude/docs/workflows/fix-personal-project.js` + gate `.claude/docs/check-task.mjs` + `.claude/docs/rules/terminology-bold.md`. Chung nguyên tắc pipeline: substantive = hỏi thầy.

## Model tier (xem `pipeline.md §Phân vai MODEL`)
- **DEFAULT Sonnet 5** author brief + accordion bước + mirror en. **Haiku** enumerate. **Opus opt-in** cho task thiết kế khó. Tiết kiệm theo mặc định.

## ⛔ Substantive = HỎI THẦY trước khi author
- **Milestone/task nào tạo mới**, **thuộc phần nào của capstone** (StarCi Shop / hệ thống của khóa), **lang split** (4-lang hay agnostic), **type/weight/maxScore**, **outcome/approach criteria** → thầy chốt. Gen = "vẽ mới" → đề xuất rồi HỎI.

## 1. Chuẩn mục tiêu
- **Milestone** = 1 chặng lớn của capstone (`<N>-<slug>/{vi,en}.md` meta) chứa nhiều **task** (`tasks/<M>-<slug>/{vi,en}.md`). Task = 1 phần xây được, có outcome quan sát được.
- **Task DSL:** `# sortIndex / # title / # description / # type` (vd `techIntegrate`) `/ # weight / # maxScore` (100) `/ # verified` (ngày) `/ # criterias`.
- **`# criterias` per-brief:** `## N` → `### lang` (typescript/java/csharp/go/agnostic) + `### body` + `### outcome` + `### approach`. **1 language-family/brief** (không cram); brief index liên tục từ 0.
- **Gold shape:** `milestones/0-project-foundation/tasks/0-clean-architecture-and-health` — bắt chước.

## 2. GIAI ĐOẠN 1 — Đề xuất scope → HỎI THẦY
- Đọc capstone hiện có (milestone/task quanh đó) + nội dung khóa → **ĐỀ XUẤT**: task nào cần author · thuộc chặng nào · lang split · body/bước · outcome + approach criteria. → **HỎI THẦY** (AskUserQuestion) chốt. Chưa confirm KHÔNG author.

## 3. GIAI ĐOẠN 2 — Author (sau khi thầy chốt)
- **Body brief:** `:::muted Mục tiêu` (prose: xây gì + vì sao, neo vào capstone) → `:::muted Các bước (làm theo thứ tự)` → **`::::accordion`** mỗi bước 1 `:::panel{title="Bước N — …"}` chứa hướng dẫn + code fence (per-lang idiom). Đóng panel `:::`, đóng khối `::::`.
- **outcome** = kết quả quan sát được (endpoint trả gì, hành vi gì). **approach** = tiêu chí chấm cách làm (kiến trúc/pattern đúng). Số tiêu chí `#### N` khớp giữa các brief.
- **Split per-lang:** viết brief riêng cho mỗi lang cần (ts/java/csharp/go) — idiom đúng từng stack, KHÔNG cram 2 lang 1 brief. FE/khái niệm-agnostic → 1 brief `agnostic`.
- **Terminology-bold** (`.claude/docs/rules/terminology-bold.md`): L1 dịch/L2 giữ-EN/L3 jargon **bold**/L4 code `inline`; tiếng Việt **đủ dấu**; comment code English-only; 0 bold-inline-code.
- **Bilingual:** `vi.md` gốc → `en.md` mirror 1-1 (cùng brief-count + dãy lang + accordion).

## 4. Verify + đóng
```
node .claude/docs/check-task.mjs .mount/data/courses/<course>/milestones/<N>-<slug>/tasks/<M>-<slug>
```
Sạch (brief index · lang hợp lệ · đủ lang/body/outcome/approach · 1 family/brief · accordion cân · 0 bold-inline-code · vi↔en mirror) → báo cáo task đã tạo. Push `.mount/data` chỉ khi thầy bảo.

## Phân biệt với `/starci-milestone-audit`
- **generate** = tạo milestone/task MỚI. **audit** = chuẩn-hoá task đã có (split/accordion/terminology) qua `fix-personal-project.js`. Cùng gate `check-task.mjs` + convention.

## Phân model (fan-out / nhiều pha)
Khi skill này fan-out hoặc chia pha, phân model theo VAI:
- **fable — deep thinking**: rescan/phân tích/ra nhận định nhanh, quyết hướng (decide).
- **sonnet — action**: quét · scan · build · sửa (làm việc thật). **LUÔN ghi brief** kết quả lại (file/`.artifacts`), đừng giữ trong đầu — pha finalize cần đọc.
- **opus — finalize**: đọc mọi brief → synthesize · chốt · quyết định cuối + ghi state.
