# Multi-session git — giả định luôn có người ghi song song

**Trigger:** ghi vào canon / file shared / mirror; trước mọi push.

## Luật

- LUÔN giả định session (hoặc người) khác đang ghi cùng file. Không bao giờ coi worktree của mình là bản duy nhất.
- **fetch-before-write:** `git fetch` + diff TRƯỚC khi ghi canon. CẤM blind mirror worktree→canon (memory `feedback-canon-multisession-fetch-before-write`).
- BACKLOG / sử-ký / index → **union-merge**, không đè.
- **rebase-rồi-push, KHÔNG `--force`.**
- Cảnh báo trước khi `git add -A` (dễ cuốn việc session khác vào commit của mình).
- **Bg agent KHÔNG chạy `git checkout` / `reset` kiểu "undo"** mà không check status trước (memory `feedback-no-destructive-git-in-background-agents` — đã mất i18n 2026-07-11).
- Nhiều Agent song song ghi CÙNG worktree = mất việc → chỉ giao **disjoint folder** hoặc chạy **sequential**, re-read xác nhận (memory `feedback-parallel-agents-shared-worktree-race`).

## Bằng chứng

- Phiên 2026-07-22 (skill+canon migration): mọi `git mv` làm trên **branch/worktree riêng** (isolated) → 279 rename chưa đụng mirror `starci-claude-canon`. Thầy review + merge sau, KHÔNG blind-push canon chung.

Nối: [`safe-bulk-edit.md`](safe-bulk-edit.md).
