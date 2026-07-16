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
  `.artifacts/proposals`. READ-only src, ghi-only `.artifacts/states`. **CŨNG chạy RUBRIC-2 = design-rule CƠ HỌC
  từ `.claude/fe`** (màu icon-text, cấm-2-icon, token/gap/border kiểm được bằng scan) với ledger RIÊNG
  `design-audit-fe.json` — cùng máy incremental, để sweep design-rule (vd icon §6/§7) KHỎI full-rescan mỗi lần
  (đây là "đòn cache" cho sweep, nơi `starci-fe-feedback` ủy thác các sweep tái diễn). Trigger khi thầy gõ
  `/starci-fe-patterns-audit [scope]`, hoặc "audit code-style fe", "đồng bộ code với patterns fe", "soi patterns fe",
  "sweep design-rule", "quét icon §6 toàn app".
---

# /starci-fe-patterns-audit — Source FE khớp `.claude/patterns/fe`, incremental

> ★ **Đồng bộ 3 lớp** (chân lý `.claude/fe` · story = UI-ref · component = UI-trên-nền): mọi thay đổi skill này tạo ra PHẢI reconcile CẢ 3 → luật `.claude/fe/principles/three-layer-sync-truth-story-ui.md` · recipe `.claude/fe/patterns/reconcile-three-layers-on-change.md`.

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

## Rubric-2 — DESIGN-rule cơ học (`.claude/fe`), ledger `design-audit-fe.json` (nối 2026-07-17)
Song sinh với rubric code-style, **CÙNG máy incremental**, ledger TÁCH:
- **Rubric:** phần **CƠ HỌC kiểm được bằng scan** của `.claude/fe` — icon leading cùng-màu-chữ (`icon.md §6`), cấm-2-icon-liên-tiếp (`icon.md §7`), token/gap/border off-scale, uppercase… **KHÔNG** rule chủ quan (bố cục "đẹp/xấu", IA) — cái đó là mắt thầy / `starci-fe-audit`.
- **Ledger:** `.artifacts/states/design-audit-fe.json` — CÙNG shape (`lastAuditCommit · openViolations[{rule,file,line,severity,note}]`) + field `rulesCovered[]` (rule design đang quét) + `rubric`. Đã seed từ sweep icon §6/§7 (2026-07-16/17): FIXED 20, `openViolations` = 6 ca borderline/won't-fix thầy để nguyên (GIỮ để sweep sau khỏi re-flag như mới).
- **Quy trình y hệt** (§Quy trình trên) nhưng `<lastAuditCommit>` đọc từ `design-audit-fe.json`, chấm theo `rulesCovered`. Thêm rule design mới cần sweep → thêm 1 dòng `rulesCovered` + baseline nó 1 lần.
- **Vì sao đây là "đòn cache" thật:** sweep icon toàn app lần đầu đắt (đọc ~76 file); ghi ledger xong, lần sau `git diff <lastAuditCommit> HEAD` chỉ ra file ĐỔI → soi bấy nhiêu + re-check 6 openViolations, **không quét lại 76**. `starci-fe-feedback` pha-6 (sweep) ỦY THÁC sang đây thay vì tự full-scan (feedback không giữ state).
- **Ranh:** rule design chủ quan / chưa cơ-học-hoá-được → KHÔNG nhét vào đây (false-positive). Chỉ rule có signature grep/AST chắc.

## Ranh (STRICT)
- READ-only `src/`; WRITE `.artifacts/states/` (+ sửa code KHI ĐƯỢC DUYỆT). **KHÔNG ghi `.claude`.**
- Bỏ qua `*.stories.*` (story do skill khác). Không tự chế luật ngoài `patterns/fe`.
- Cơ học hoá được (naming/import/format) → gợi ý đẩy sang **`starci-fe-enforce`** (lint giữ mãi) thay vì audit tay lặp lại.

## Liên quan
- Chuẩn tĩnh: `.claude/patterns/fe/` · biến thành lint: `starci-fe-enforce` · UX/story/coverage: `starci-fe-audit` + `starci-fe-sync`.
- BE song sinh: `starci-be-patterns-audit`.

## Phân model (fan-out / nhiều pha)
Khi skill này fan-out hoặc chia pha, phân model theo VAI:
- **fable — deep thinking**: rescan/phân tích/ra nhận định nhanh, quyết hướng (decide).
- **sonnet — action**: quét · scan · build · sửa (làm việc thật). **LUÔN ghi brief** kết quả lại (file/`.artifacts`), đừng giữ trong đầu — pha finalize cần đọc.
- **opus — finalize**: đọc mọi brief → synthesize · chốt · quyết định cuối + ghi state.
