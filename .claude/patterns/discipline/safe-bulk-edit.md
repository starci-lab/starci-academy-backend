# Safe bulk edit — gate + dry-run trước sweep

**Trigger:** sửa ≥ vài site cùng pattern (rename, đổi token, thay import, codemod hàng loạt).

## Luật

- KHÔNG sweep mù. Trước `sed -i` / `--write` / codemod hàng loạt:
  1. **Liệt kê TẤT CẢ site** (`grep -rln`) — biết con số trước.
  2. **Dry-run / test regex** trên vài case (≥10 nếu regex phức tạp) — xác nhận không bắt nhầm.
  3. **Gate đo trước & sau** (đếm / `tsc` / test) — sweep xong đối chiếu, grep lại "không còn token cũ".
- Auto-gen / workflow fan-out VẪN cần gate: `tsc` bắt "rớt prop required / typing sai", KHÔNG bắt "rớt state" (phải đếm tay) và KHÔNG bắt "render xấu" (mắt người). **Prompt sai 1 chỗ = lỗi hệ thống cả N** → spot-check.
- Sweep RỘNG / tái diễn → ledger incremental (`git diff --name-only <lastAuditCommit> HEAD`), CHỈ soi file đổi — KHÔNG full-rescan mỗi lần (memory `design-rule-sweep-cache`).

## Bằng chứng

- i18n: gate + regex test 10 case + dry-run TRƯỚC `--write`.
- Rename MarkedListCard→CrossListCard (phiên 2026-07-22): grep hết site TRƯỚC (folder + CourseCard + PricingTable + surface-header + ModalShell) → `sed` → **grep lại "no MarkedList left"** → `tsc` 0 → restart+đếm index. Không sót site nào.
- Sweep icon 76 file (memory `feedback ... rescan`): full-rescan mỗi lần = đốt token → chuyển ledger git-diff.

Nối: [`multi-session-git.md`](multi-session-git.md) (sweep trên branch riêng, không đè session khác).
