---
name: starci-fe-patterns-audit
description: >
  Đồng bộ SOURCE CODE FE với bộ code-style `.claude/patterns/fe/` — quét `$FE_SOURCE\src`
  tìm chỗ code LỆCH chuẩn (naming · cấu trúc 1-folder-index · props/WithClassNames · type-safety no-any · comment
  WHY-not-WHAT · import/format · react-idiom) rồi ghi **LOG + STATE** vào
  `$FE_SOURCE\.artifacts\states\patterns-audit-fe.{json,md}` để audit **INCREMENTAL**:
  git-diff từ `lastAuditCommit` → chỉ soi file ĐỔI (khỏi rescan cả src); vi phạm chưa fix giữ trong state để
  **lần sau audit tiếp**. Song song `starci-fe-audit` (kia soi Storybook/UX; skill NÀY soi CODE-STYLE tuân
  patterns). Report-only mặc định; fix nhỏ/cơ học áp same-session khi thầy OK, lệch lớn → queue
  `.artifacts/proposals`. READ-only src, ghi-only `.artifacts/states`. Trigger khi thầy gõ
  `/starci-fe-patterns-audit [scope]`, hoặc "audit code-style fe", "đồng bộ code với patterns fe", "soi patterns fe".
---

# /starci-fe-patterns-audit — Source FE khớp `.claude/patterns/fe`, incremental

Rubric = **`.claude/patterns/fe/`** (code-style FORCE). Skill này quét `src` đối chiếu rubric, ghi state+log để
lần sau **khỏi rescan** — chỉ soi phần code vừa đổi (như `starci-fe-sync` làm cho Storybook).

**App FE: `$FE_SOURCE` (branch `mtp`).** READ-only `src/`, ghi `.artifacts/states/`.

## Nền tra (đọc TRƯỚC)
- **`.claude/patterns/fe/`** (INDEX + naming-and-structure · props-and-types · type-safety · comments · imports-and-format · react-idioms) — đây là chuẩn chấm, KHÔNG tự chế thêm luật.
- **`.artifacts/states/patterns-audit-fe.json`** — state lần trước: `{ lastAuditCommit, generatedAt, openViolations: [{rule,file,line,note}] }`.
- **`.artifacts/states/patterns-audit-fe.md`** — log append-only mỗi lần audit.

## Quy trình (incremental theo git)
1. **Đọc state json** → `lastAuditCommit`. Chưa có → **full** (glob `src/**/*.{ts,tsx}`, trừ `*.stories.*` — story là địa hạt `starci-fe-story`/`sync`).
2. **Chỉ file đổi**: `git -C <app> diff --name-only <lastAuditCommit> HEAD -- src` (lọc `.ts/.tsx`, bỏ `.stories.*`). Không đổi → "code đã khớp patterns tới HEAD", dừng.
3. **Chấm từng file** đối chiếu từng doc `patterns/fe/`: liệt kê vi phạm `{rule · file:line · lệch gì · sửa sao}`. Cũng **re-check `openViolations` cũ** (đã fix chưa).
4. **Ghi**: append 1 block ngày vào `patterns-audit-fe.md`; cập nhật json (`lastAuditCommit = HEAD`, `openViolations` = còn tồn + mới).
5. **Report-only mặc định.** Thầy OK → fix nhỏ/cơ học same-session (bám ĐÚNG `patterns/fe`, verify tsc+eslint); lệch lớn/nhiều call-site → ghi `.artifacts/proposals` (PENDING), không tự ôm.

## "Audit tiếp sau" (điểm cốt lõi)
`openViolations` trong json = nợ chưa xử → lần chạy sau ưu tiên; `lastAuditCommit` giúp **không soi lại file đã sạch**. Audit là việc dài hơi, state chia nhỏ để mỗi lần chỉ nhằn phần mới + nợ cũ.

## Ranh (STRICT)
- READ-only `src/`; WRITE `.artifacts/states/` (+ sửa code KHI ĐƯỢC DUYỆT). **KHÔNG ghi `.claude`.**
- Bỏ qua `*.stories.*` (story do skill khác). Không tự chế luật ngoài `patterns/fe`.
- Cơ học hoá được (naming/import/format) → gợi ý đẩy sang **`starci-fe-enforce`** (lint giữ mãi) thay vì audit tay lặp lại.

## Liên quan
- Chuẩn tĩnh: `.claude/patterns/fe/` · biến thành lint: `starci-fe-enforce` · UX/story/coverage: `starci-fe-audit` + `starci-fe-sync`.
- BE song sinh: `starci-be-patterns-audit`.
