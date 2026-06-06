---
name: audit-module
description: Audit / nghiệm thu 1 module Fullstack (content lesson + challenges) qua pipeline `.audits/` — gate deterministic → Haiku brief → Sonnet loop code↔docs → Opus decision, **iter xuyên suốt từng lesson** trong module bằng Workflow. Dùng skill này khi user gõ "AUDIT MODULE", "audit module <N/slug>", "nghiệm thu module", "kiểm module", hoặc yêu cầu rà soát 1 module FS theo chuẩn V2.
---

# Audit Module (Fullstack)

Chạy khi user muốn audit/kiểm/nghiệm thu 1 module FS. **Toàn bộ quy trình + rules nằm tự-đủ trong `.audits/`** (KHÔNG đọc rule ngoài).

## Cách chạy — BẮT BUỘC qua Workflow (thống nhất, KHÔNG agent lẻ ad-hoc)

1. **Xác định `<module>`** = folder slug dưới `.mount/data/courses/0-fullstack-mastery/modules/` (vd `13-frontend-performance`). User nói số/tên mơ hồ → map ra slug, confirm nếu chưa chắc.

2. **Gate-first** (free, biết trước chỗ hỏng):
   ```
   ./.audits/check-lesson.ps1 -Path ".mount/data/courses/0-fullstack-mastery/modules/<module>"
   ```

3. **Invoke runner** — 1 Workflow / module, `pipeline()` iter TỪNG lesson:
   ```
   Workflow({ scriptPath: ".audits/workflows/audit-fs-module.js", args: { module: "<module>" } })
   ```
   - **Context đầu vào (tùy chọn) `args.guidance`** = chỉ-dẫn-riêng-module, chèn vào mọi phase với ưu tiên tuyệt đối. Dùng khi cần override mặc định: vd FE module → `guidance: "FE Vite + Sandbox, KHÔNG Next"`, hoặc ngoại lệ Next → `guidance: "module dùng Next vì dạy RSC/app-router"`.
   - **Mặc định FE = Vite (React) + Sandbox, KHÔNG Next.js** (repo cũ Next → migrate sạch). Chỉ dùng Next khi context đầu vào nói rõ.

4. Phase ↔ model (đã encode trong runner, KHÔNG đổi). Artifact ghi **THẲNG vào mount** `.../modules/<slot>/contents/<lesson>/` (cạnh `audited.md`), **tiếng Việt**:
   - **Gate** = Haiku chạy `check-lesson.ps1` + parse fails. Mỗi lesson chạy **vòng hội tụ** `[Sonnet loop → Opus fix → re-gate]` lặp tới PASS hoặc hết `MAX_ITER`.
   - **Brief** = Haiku → `contents/<lesson>/research.md`.
   - **Loop** = Sonnet: code thiếu→viết (`.code/`) + test luồng theo docs + **đối chiếu snippet §2.1.3 ↔ `.repo/src`** (4-lang PARALLEL port-map: ts 3000 · java 3001 · net 3002 · go 3003) → proof `.e2e/`.
   - **Decision** = Opus: duyệt challenge criteria/outputs/requirements + lệch code↔docs (sửa code hay docs) + rewrite sai-format → `contents/<lesson>/decision.md` + `claude_submitted.md`.
   - **References** = Haiku: sau khi module hội tụ, append module vào `.audits/references.md` (gold theo variant) → lần sau audit tốt hơn.

5. **ĐỪNG nhắn / làm việc khác khi workflow chạy** (bị giết). Đợi notification → re-gate → báo cáo `flow × lang` + findings.

## Nguyên tắc (đọc `.audits/pipeline.md` + `.audits/references.md` + `.audits/rules/fullstack/{contents,challenges,coding}.md`)
- **Đọc `.audits/references.md` (gold cùng variant) TRƯỚC khi audit** → bắt chước format chuẩn, đỡ lặp lỗi.
- Công thức: **Sonnet loop (viết/test/đối chiếu) → Opus decision (quyết khi lệch)**.
- **vi.md = Opus viết · en.md = Sonnet dịch** (mirror, chống divergence).
- **Mọi code block §2.1.3 + codeExplaining = diff=0 với repo** (kể cả `@Module`/`imports`/`exports`/decorator).
- Gate-first: chỉ lesson FAIL hoặc chưa `claude_submitted.md` mới tốn LLM.
- Sai-format = block → Opus rewrite theo gold (M0/M1 content; M14 challenge).
- **Artifact (research/decision/claude_submitted/.code/.e2e) = tiếng Việt, ghi thẳng vào `contents/<lesson>/` trong mount.**
