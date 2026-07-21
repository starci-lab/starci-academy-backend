---
name: starci-milestone-audit
description: >
  Audit / nghiệm thu TASK dự án cá nhân (MILESTONE / capstone) của 1 khóa StarCi (Fullstack `0-fullstack-mastery`,
  System Design `1-system-design-mastery`, DevOps `2-devops-mastery`) tại `.mount/data/courses/<course>/milestones/
  <N>-<slug>/tasks/<M>-<slug>/`. Chuẩn hoá theo plan personal-project-fix: **SPLIT brief agnostic-đa-lang → 4 brief
  per-lang** (ts/java/csharp/go; hoặc giữ agnostic) · **ACCORDION** khối "Các bước" · **TERMINOLOGY L1/L3** (de-bold) ·
  criteria per-brief đủ `### lang/body/outcome/approach` · vi↔en mirror. Gate deterministic `check-task.mjs` bắt: brief
  index liên tục từ 0 · lang ∈{ts,java,csharp,go,agnostic} · 1 language-family/brief (không cram) · accordion cân ·
  0 bold-inline-code · vi↔en mirror. Chạy qua runner `fix-personal-project.js` 3-stage (enumerate→review→apply);
  **stage=apply BẮT BUỘC `args.milestones:[...]`** (an toàn, không ghi cả khóa). Model mặc định Sonnet 5. Dùng khi
  user gõ `/starci-milestone-audit <course|milestone>`, "audit milestone/capstone/dự án cá nhân", "kiểm task". Để TẠO
  milestone/task MỚI → `/starci-milestone-generate`.
---

# /starci-milestone-audit — Nghiệm thu task dự án cá nhân (milestone/capstone)

Chạy khi thầy muốn kiểm/chuẩn-hoá task milestone. **Rule tự-đủ:** plan trong runner `.claude/docs/workflows/fix-personal-project.js` + gate `.claude/docs/check-task.mjs` + `.claude/docs/rules/terminology-bold.md`. Chung nguyên tắc pipeline: substantive = hỏi thầy · cơ học = tự làm.

## Model tier (xem `pipeline.md §Phân vai MODEL`)
- **DEFAULT Sonnet 5** cho split/author brief + accordion + terminology + decision. **Haiku** enumerate/re-gate. **Opus opt-in** cho task khó. Tiết kiệm theo mặc định.

## ⛔ Substantive = HỎI THẦY
- **Split thành lang nào** (4-lang hay giữ agnostic), **thêm/bớt task**, **đổi weight/type/maxScore**, **đổi scope brief** → thầy chốt. Runner `stage=review` chỉ ĐỀ XUẤT (không ghi). **Cơ học tự làm:** accordion hoá "Các bước", de-bold, L1/L3 terminology, re-index brief, mirror vi↔en, thêm dấu.

## 1. Scope + cấu trúc
- Path: `.mount/data/courses/<course>/milestones/<N>-<slug>/` — meta `{vi,en}.md` + `tasks/<M>-<slug>/{vi,en}.md`.
- **Task DSL:** `# sortIndex / # title / # description / # type / # weight / # maxScore / # verified / # criterias`. `# criterias` = list per-brief `## N` → `### lang` + `### body` + `### outcome` + `### approach`.
- **Brief body:** `:::muted Mục tiêu` (prose) + `:::muted Các bước (làm theo thứ tự)` → **`::::accordion`** mỗi bước 1 `:::panel{title="Bước N — …"}` (code fence trong panel).
- **Gold shape:** `milestones/0-project-foundation/tasks/0-clean-architecture-and-health` (task 4-brief đúng chuẩn).

## 2. Gate-first (free)
```
node .claude/docs/check-task.mjs .mount/data/courses/<course>/milestones/<N>-<slug>/tasks/<M>-<slug>
```
Bắt: (a) brief index liên tục từ ## 0 (bỏ số = lệch UUID reseed) · (b) mỗi brief lang ∈{typescript,java,csharp,go,agnostic} · (c) đủ `### lang/body/outcome/approach`, số tiêu chí `#### N` khớp brief 0 · (d) **1 language-family/brief** (không cram đa-lang) · (e) accordion cân (số `::::accordion`==đóng; mỗi `:::panel` có title; `:::`/`::::` cân) · (f) 0 bold-inline-code · (g) vi↔en mirror (cùng brief-count + dãy lang). Có thể truyền cả milestone-dir (script tự walk).

## 3. Chạy runner (3-stage, human-in-loop)
```
// GIAI ĐOẠN 1 — review (đề xuất, KHÔNG ghi)
Workflow({ scriptPath: ".claude/docs/workflows/fix-personal-project.js", args: { course: "<course>", stage: "review", milestones: ["<N>-<slug>", ...] } })
// → HỎI THẦY chốt split/scope → GIAI ĐOẠN 2 — apply (SAU khi thầy duyệt)
Workflow({ scriptPath: ".claude/docs/workflows/fix-personal-project.js", args: { course: "<course>", stage: "apply", milestones: ["<N>-<slug>"] } })
```
- **`stage=apply` BẮT BUỘC `milestones:[...]`** — runner TỪ CHỐI nếu thiếu (an toàn, không ghi cả khóa).
- **`course`** ∈ `0-fullstack-mastery | 1-system-design-mastery | 2-devops-mastery`. ⚠️ harness có thể serialize `args` thành JSON-string → runner tự normalize; vẫn kiểm log `RECV args=` để chắc tới đúng course/milestones.
- Apply: split agnostic→4 per-lang brief (Sonnet 5) + accordion "Các bước" + L1/L3 terminology → gate lại.

## 4. Đóng
- Re-gate `check-task.mjs` sạch → báo cáo task đã split/chuẩn-hoá. Push `.mount/data` chỉ khi thầy bảo. **ĐỪNG nhắn khi workflow chạy** (bị giết).

## Phân biệt
- Task milestone = **brief hướng dẫn học viên tự xây capstone** (per-lang, không code chạy trong skill — học viên build; chấm là flow riêng). Khác lesson (`/starci-module-audit`) + challenge.

## Phân model (fan-out / nhiều pha)
Khi skill này fan-out hoặc chia pha, phân model theo VAI:
- **fable — deep thinking**: rescan/phân tích/ra nhận định nhanh, quyết hướng (decide).
- **sonnet — action**: quét · scan · build · sửa (làm việc thật). **LUÔN ghi brief** kết quả lại (file/`.artifacts`), đừng giữ trong đầu — pha finalize cần đọc.
- **opus — finalize**: đọc mọi brief → synthesize · chốt · quyết định cuối + ghi state.
