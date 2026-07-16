---
name: starci-module-audit
description: >
  Audit / nghiệm thu 1 MODULE ĐÃ CÓ (content lesson + challenges) của khóa StarCi — Fullstack (`0-fullstack-mastery`)
  hoặc System Design (`1-system-design-mastery`) — qua pipeline tự-đủ trong `.claude/docs/`. Chạy 2 GIAI ĐOẠN human-in-loop:
  **stage=review** (brief + ĐỀ XUẤT duyệt/thêm-bớt challenge/sửa lesson → `review.md` → STOP hỏi thầy)
  → thầy confirm → **stage=apply** (apply + gate deterministic → vòng hội tụ per-lesson loop code/e2e → decision → re-gate).
  Model: **mặc định Sonnet 5** cho mọi việc nặng (tiết kiệm), Haiku cho enumerate/re-gate/refs, **Opus opt-in** qua
  `args.opus:true` (+`only:"<lesson>"`) khi 1 lesson khó. BẮT BUỘC qua Workflow (1 workflow/module), KHÔNG gọi agent lẻ. Dùng skill này khi user gõ
  `/starci-module-audit <N|slug>`, "AUDIT MODULE", "audit/kiểm/nghiệm thu module", hoặc yêu cầu rà soát 1 module
  StarCi theo chuẩn V2. Để TẠO/mở-rộng module MỚI → dùng `/starci-module-generate`.
---

# /starci-module-audit — Nghiệm thu 1 module ĐÃ CÓ (FS / SD)

Chạy khi thầy muốn audit/kiểm/nghiệm thu 1 module đã tồn tại. **Toàn bộ quy trình + rules nằm tự-đủ trong `.claude/docs/`** — đọc `.claude/docs/pipeline.md` + `.claude/docs/rules-lean.md` + `.claude/docs/references.md` + `.claude/docs/rules/<course>/{contents,challenges,coding}.md`. KHÔNG đọc rule ngoài, KHÔNG tự chế quy trình.

## Model tier (đồng bộ cả hệ `.claude/docs`, xem `pipeline.md §Phân vai MODEL`)
- **DEFAULT = Sonnet 5** cho MỌI việc nặng (brief · review+đề xuất · apply · loop code/e2e · decision · author). **Haiku** cho enumerate · re-gate · references. **Opus = opt-in** — bật `args.opus: true` (thường kèm `only:"<lesson>"`) escalate ĐÚNG 1 lesson khó khi bản Sonnet 5 chưa đạt. Tiết kiệm theo mặc định.

## ⛔ NGUYÊN TẮC TỐI THƯỢNG (pipeline.md §NGUYÊN TẮC — đọc trước tiên)
- **MẶC ĐỊNH = chạy e2e THẬT** (`stage=apply`, bind `127.0.0.1`, Docker infra local). `no-test`/`giữ-2-tier`/`guidance` là NGOẠI LỆ **CHỈ khi thầy nói RÕ cho module CỤ THỂ** → **KHÔNG tự lan** sang module/batch khác.
- **Quyết định SUBSTANTIVE = thầy chốt, KHÔNG tự làm:** thêm/bớt/đổi-độ-khó tier, tạo challenge mới, test-hay-không, đổi scope, pivot (Next↔Vite, 4-lang↔agnostic, gộp/tách lesson). Gate PASS ≠ giấy phép tự quyết → **không chắc thì HỎI**.
- **Cơ học thì tự làm OK:** format (`###`→`:::muted`), score sum, §2.1.5 lặp, mirror vi↔en, thêm dấu tiếng Việt, cd-first, doc-path, snippet↔repo.

## ⭐ Quy ước VIẾT NỘI DUNG (khi review/sửa prose — BẮT BUỘC)
Khi audit chạm chữ trong body/challenge, PHẢI theo `.claude/docs/rules/terminology-bold.md` (STRICT) + `.claude/docs/rules/<course>/contents.md §3`:
- **Terminology + Bold (4 loại):** L1 phổ thông → dịch VN, không bold · L2 English nền tảng → giữ EN, không bold · L3 jargon → EN + **bold** (lần-đầu-mỗi-lesson) · L4 code → `inline`. **Bold CHỈ** jargon L3 + nhãn template §3A. De-bold: bỏ `**` quanh inline-code/URL, bold ad-hoc, L1/L2. Polysemy đọc context, CẤM replace mù.
- **Tiếng Việt đủ dấu** mọi prose (gate FAIL `Vietnamese KHÔNG DẤU`); comment code-fence = English-only.
- **§2.1.5 Kiểm thử = ACCORDION** (hiện hành): intro bullet-list `- **Luồng N — \`route\`:** …` + khối `::::accordion` (4 dấu `:`) → mỗi luồng 1 `:::panel{title="<tên, không số>"}` … `:::` → đóng `::::`. Bài còn `##### 2.1.5.x` (bullet-flow cũ) → refactor sang accordion. GIỮ §2.1.3 nest `#####`.
- **Code §2.1.3 + codeExplaining = diff=0 với `.repo/src`** (không paraphrase/bịa).

## 1. Xác định `<module>` + `<course>`
- `<module>` = folder slug dưới `.mount/data/courses/<course>/modules/`. User nói số/tên mơ hồ → map ra slug, confirm nếu chưa chắc.
- `<course>` quyết định RUNNER + RULES (tự nhận theo module thuộc course nào):
  | Course | folder | runner | rules |
  |---|---|---|---|
  | **Fullstack** | `0-fullstack-mastery` | `audit-fs-module.js` | `.claude/docs/rules/fullstack/*` |
  | **System Design** | `1-system-design-mastery` | `audit-sd-module.js` | `.claude/docs/rules/system-design/*` |
- **SD off-by-one repo:** repo name = `system-design-mastery-module-<N+1>-<slug>` (slot 0 → module-1). FS không lệch. (Runner đã encode; chỉ nhớ khi verify path.)
- **Đọc `.claude/docs/references.md` (gold cùng variant) TRƯỚC khi audit** → bắt chước format chuẩn, đỡ lặp lỗi cũ.

## 2. Gate-first (free, biết trước chỗ hỏng)
```powershell
powershell -NoProfile -File ".claude/docs/check-lesson.ps1" -Path ".mount/data/courses/<course>/modules/<module>"
```
Exit code = số FAIL (0 = sạch). Bắt: leak Opus/chủ-nhiệm/Gemini · inline-bullet §2.1.5 · fence chẵn · theory=2 mục · có 2.1.7 · challenge score=100/verified/no-ref-sub/no-`### N.` · criteria Σ30+Σ70 · ≥1 critical · separator chẵn · vi↔en parity · e2e proof. **Chỉ lesson FAIL / chưa `claude_submitted.md` mới tốn LLM.**

## 3. GIAI ĐOẠN 1 — Review (mặc định, KHÔNG đụng code/repo) → HỎI THẦY
```
Workflow({ scriptPath: ".claude/docs/workflows/<runner>", args: { module: "<module>" } })   // stage=review mặc định
```
- **Brief** mỗi lesson (purpose · phần quan trọng · flow · loại bài · challenges sơ bộ) → **phân tích + ĐỀ XUẤT**: đổi/sửa gì · lang GIỮ/BỎ · challenge HỢP/không (tier, thêm/bớt/đổi) · rủi ro pivot → ghi `contents/<lesson>/research.md` + `review.md`. (Mặc định Sonnet 5.)
- **Workflow STOP ở đây.** Opus **HỎI THẦY** (AskUserQuestion) các câu chốt substantive (pivot? lang? challenge?). **Chưa confirm thì KHÔNG sang stage=apply.**

## 4. GIAI ĐOẠN 2 — Apply (SAU khi thầy confirm scope)
```
Workflow({ scriptPath: ".claude/docs/workflows/<runner>", args: { module: "<module>", stage: "apply", guidance: "<chốt của thầy nếu có>" } })
```
- **Apply `review.md`** (thêm/bớt challenge đã duyệt, sửa lesson: `vi.md` tác giả viết · `en.md` mirror, re-index challenge liền mạch) → **Gate** (JSON) → **vòng hội tụ per-lesson** `[loop → decision → re-gate]` tới PASS hoặc hết `MAX_ITER` (3).
- **Loop**: code thiếu→viết (`.code/`) + test luồng theo docs + **đối chiếu snippet §2.1.3 ↔ `.repo/src`** (4-lang PARALLEL, port-map ts 3000·java 3001·net 3002·go 3003, bind `127.0.0.1`) → proof `.e2e/<lang>/flow-*.md`.
- **Decision**: duyệt challenge criteria/outputs/requirements + lệch code↔docs (sửa code hay docs) + rewrite sai-format → `decision.md` + `claude_submitted.md`.
- **References** (Haiku): module hội tụ → append gold vào `.claude/docs/references.md`.
- **Model:** brief/apply/loop/decision/author = **Sonnet 5 mặc định**; escalate 1 lesson khó → thêm `args.opus:true` (+`only:"<lesson>"`).
- **Args tùy chọn** (pipeline.md): `guidance` (chỉ-dẫn-riêng-module, ưu tiên tuyệt đối) · `only: "<lesson|CSV>"` (chỉ xử lý lesson đó) · `noE2e: true` (apply nội dung + gate + Opus fix format, KHÔNG chạy e2e — CHỈ khi thầy nói "e2e sau").
- **Mặc định FE = Vite (React) + Sandbox, KHÔNG Next.js.** Chỉ dùng Next khi `guidance` chỉ rõ (vd dạy RSC/app-router).

## 5. Sau khi PASS
- **ĐỪNG nhắn / làm việc khác khi workflow chạy** (bị giết). Đợi notification → re-gate → báo cáo `flow × lang × status` + findings.
- **Push 2 nhóm git** (xem pipeline.md §Push): `.repo/<folder>` (mỗi folder = 1 git Sandpack) + `.mount/data` (content). Chỉ push khi thầy bảo.
- **Verify repo PUBLISHED ↔ body** trước/sau push: `Workflow({ scriptPath: ".claude/docs/workflows/verify-repos.js", args: { modules: [...] } })` (clone GitHub vào TEMP → test mọi `cd` resolve → Haiku brief content match → xóa temp).
- **Dọn tàn dư** khi module done: `bash .claude/docs/clean-residue.sh <mount-module-dir> [<repo-dir>]` (DRYRUN=1 xem trước) — xóa junk test, GIỮ audit trail + learner content.

## Artifacts (ghi THẲNG vào mount `.../modules/<slot>/contents/<lesson>/`, cạnh `audited.md`, tiếng Việt)
`research.md` [brief] · `review.md`/`decision.md` [Opus duyệt+quyết] · `.code/` [Sonnet code đã viết] · `.e2e/<lang>/flow-<N>-<slug>-<status>.md` [proof, status done|fail|require-creds] · `claude_submitted.md` [done-marker] · `synced.yaml` [body↔repo đồng nhất, idempotent]. Seeder bỏ qua file ngoài schema.

## Công thức chốt
- **Sonnet loop (viết/test/đối chiếu) → Opus decision (quyết khi lệch).**
- **vi.md = Opus viết · en.md = Sonnet dịch** (mirror 1-1, chống divergence).
- **Mọi code block §2.1.3 + codeExplaining = diff=0 với repo.**
- Sai-format = block → Opus rewrite theo gold. Sửa runner = Edit file rồi re-invoke `{scriptPath}`; ĐỪNG nhắn khi chạy.
