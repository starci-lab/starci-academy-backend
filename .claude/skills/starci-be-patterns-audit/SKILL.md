---
name: starci-be-patterns-audit
description: >
  Đồng bộ SOURCE CODE BE với bộ code-style `.claude/patterns/be/` — quét
  `$BE_SOURCE\src` (NestJS/TypeScript) tìm chỗ code LỆCH chuẩn (module/DI structure ·
  LUÔN throw AbstractException · DTO + class-validator ở boundary · type-safety no-any · comment WHY-not-WHAT ·
  import/format · naming) rồi ghi **LOG + STATE** vào
  `$BE_SOURCE\.artifacts\states\patterns-audit-be.{json,md}` để audit **INCREMENTAL**:
  git-diff từ `lastAuditCommit` → chỉ soi file ĐỔI (khỏi rescan cả src); vi phạm chưa fix giữ trong state để
  **lần sau audit tiếp**. Report-only mặc định; fix nhỏ/cơ học áp same-session khi thầy OK, lệch lớn → queue
  `.artifacts/proposals`. READ-only src, ghi-only `.artifacts/states`. Trigger khi thầy gõ
  `/starci-be-patterns-audit [scope]`, hoặc "audit code-style be", "đồng bộ code với patterns be", "soi patterns be".
---

# /starci-be-patterns-audit — Source BE khớp `.claude/patterns/be`, incremental

Rubric = **`.claude/patterns/be/`** (code-style FORCE cho NestJS/TS). Quét `src` đối chiếu rubric, ghi state+log để
lần sau **khỏi rescan** — chỉ soi phần code vừa đổi (mô hình như `starci-fe-patterns-audit`).

**App BE: `$BE_SOURCE`.** READ-only `src/`, ghi `.artifacts/states/`.

## Nền tra (đọc TRƯỚC)
- **`.claude/patterns/be/`** (INDEX + modules-and-di · api-surface · exceptions · type-safety · comments · format-and-imports) — chuẩn chấm, KHÔNG tự chế thêm.
- **`.artifacts/states/patterns-audit-be.json`** — state: `{ lastAuditCommit, generatedAt, openViolations: [{rule,file,line,note}] }`.
- **`.artifacts/states/patterns-audit-be.md`** — log append-only.

## Quy trình (incremental theo git)
1. **Đọc state json** → `lastAuditCommit`. Chưa có → **full** (glob `src/**/*.ts`, bỏ `*.spec.ts` trừ khi soi test-style).
2. **Chỉ file đổi**: `git diff --name-only <lastAuditCommit> HEAD -- src` (lọc `.ts`). Không đổi → dừng "đã khớp".
3. **Chấm từng file** đối chiếu từng doc `patterns/be/` — đặc biệt: **mọi throw phải qua `AbstractException`** (không `new Error`/Nest built-in `*Exception`), DTO validation ở controller, không `any`, không đọc `process.env` rải. Liệt kê `{rule · file:line · lệch · sửa}`. Re-check `openViolations` cũ.
4. **Ghi**: append block ngày vào `patterns-audit-be.md`; cập nhật json (`lastAuditCommit = HEAD`, `openViolations`).
5. **Report-only mặc định.** Thầy OK → fix nhỏ same-session (bám `patterns/be`, verify tsc+eslint+build; đụng runtime thì chạy thật); lớn → `.artifacts/proposals`.

## "Audit tiếp sau"
`openViolations` = nợ chưa xử (ưu tiên lần sau); `lastAuditCommit` → không soi lại file đã sạch. Chia nhỏ để audit dài hơi không phải quét lại từ đầu.

## Ranh (STRICT)
- READ-only `src/`; WRITE `.artifacts/states/` (+ sửa code khi được duyệt). **KHÔNG ghi `.claude`.**
- Không tự chế luật ngoài `patterns/be`. Cơ học hoá được → đề xuất thành ESLint rule (BE) thay vì audit tay lặp.

## Liên quan
- Chuẩn tĩnh: `.claude/patterns/be/` · FE song sinh: `starci-fe-patterns-audit`.
