# `.claude` — canon source = PRIVATE repo (ref link, KHÔNG duplicate ở backend)

Nội dung `.claude/{fe,be,skills}` (design-system canon + Claude Code skills) **KHÔNG track trong repo backend này** —
**source of truth = private repo**. Local chỉ là working copy (gitignored ở backend); sync = clone private về đây.

- 🔒 **Private (full):** https://github.com/starci183/starci-claude-canon
- 🌐 **Public (business-redacted · read-only flex):** https://github.com/starci183/starci-ai-design-system

## RULE — vòng cập nhật canon (STRICT)
Có **SỬA canon** (thêm/đổi block · rule · concept · skill · prototype · principle) thì:
1. **PUSH lên PRIVATE** (`starci-claude-canon`) — luôn, ngay (full, uncensored).
2. Reviewed OK → **SCRUB business** (bỏ `features/` · `product/` · `proposals/` · conversion principles · gate-lộ engineering · prose monetization) rồi **PUSH lên PUBLIC** (`starci-ai-design-system`).

Mọi skill có bước FEEDBACK ghi canon (`starci-fe-*-apply` · `starci-fe-consolidate-components` · `starci-doc-audit` fix) → **tuân rule này**: đổi xong → private; sạch business → public.
