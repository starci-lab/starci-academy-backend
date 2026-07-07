---
name: merge
description: >
  Catch any STRAY FE rule draft that drifted back into a `.claude/rules/drafts/*.md` folder (backend
  repo D:\Repositories\starci-academy-backend, OR — worse — inside the FE app repo
  `D:\Repositories\starci-academy`) and fold it into the canonical v2 rule tree
  (`.claude/rules/{concepts,elements,layouts,responsives,debts}/*.md`) — the SSOT for the FE app's
  design system. Drafts are a DEPRECATED workflow (chốt 2026-07-06); the legacy backlog was folded +
  the `drafts/` folder deleted 2026-07-07, so normally there is NOTHING to merge. New rulings write
  STRAIGHT into v2 canonical, no staging file. `/merge` now only exists to redirect anyone (including
  a different session) who accidentally recreates a drafts-style file. The FE app repo has NO
  canonical concepts/elements/layouts of its own and must never hold rule content. Run ONLY when the
  user types `/merge`.
---

# /merge — Fold any STRAY draft into v2 canonical (SSOT)

**Canonical location (STRICT, the only one — read this before doing anything):**
`D:\Repositories\starci-academy-backend\.claude\rules\{concepts,elements,layouts,responsives,debts}\*.md`
This is **"rules v2"**. It is the ENTIRE FE design-system rule set (button/card/input/tabs/list/…
styling + product/engineering heuristics), even though it documents the FE app that lives in a
**separate repo** (`D:\Repositories\starci-academy`). There is no `main.md` / `starci-<element>.md`
anymore (that was v1 — retired). The legacy `.claude/rules/drafts/` backlog was folded + the folder
DELETED (2026-07-07), so normally there is nothing here to merge. There is no `.claude/rules/drafts/`
inside the FE app repo either — if one exists in EITHER repo, it is DRIFT and must be emptied into
this backend repo's canonical tree, never merged "in place" in the FE repo (it has no
`concepts/`/`elements/`/`layouts/` to fold into locally).

## Khi nào
- CHỈ khi thầy gõ `/merge`.
- **New rule-worthy feedback during normal `/fe` work goes STRAIGHT into v2 canonical NOW** (per
  `starci-fe-ux-apply`/`starci-fe-ux-brainstorm`/`starci-fe-layout-brainstorm`/`starci-fe-critique`,
  chốt 2026-07-06) — **KHÔNG** viết `drafts/<temp>.md` nữa. `/merge` is NOT the normal path anymore;
  it only handles (a) the backlog of legacy drafts still sitting in this repo's own `drafts/` folder
  from before the cutover, or (b) a stray drafts-style file that drifted back in somewhere (own repo
  or, worse, inside the FE app repo) and needs folding + deleting.

## Quy trình
1. **Liệt kê** `.claude/rules/drafts/*.md` trong CHÍNH backend repo này (bỏ `README.md` nếu có). ALSO check
   `D:\Repositories\starci-academy\.claude\rules\` for any stray rule/draft files (there should be NONE —
   if found, they are drift; fold them here and delete them there, same as backend-repo drafts).
   Không có gì cần gộp ở cả 2 chỗ → báo "sạch, không có gì để merge" và dừng.
2. **Đọc HẾT** các file `concepts/*.md` + `elements/*.md` + `layouts/*.md` + `responsives/*.md` liên quan +
   từng draft/stray file. Hiểu mỗi cái sửa gì.
3. **Phân loại từng draft → file đích trong v2:**
   - Mindset / heuristic / business rule / khi-nào-dùng-gì → **`concepts/<name>.md`** (tạo mới nếu chưa có).
   - Styling/anatomy 1 element cụ thể (button/card/input/list/tabs/chip/…) → **`elements/<name>.md`**
     (tạo mới nếu element chưa có file riêng).
   - Spacing/radius/responsive/scroll/sticky → **`layouts/<name>.md`** hoặc **`responsives/<name>.md`**.
4. **Fold + reconcile:** chèn luật vào đúng §/file; nếu mâu thuẫn luật cũ → **draft (mới) THẮNG**, sửa luật
   cũ cho khớp (đừng để 2 luật đá nhau). Giữ giọng STRICT, ngắn; **dedup** (đừng lặp ý đã có); kèm nguyên
   nhân gốc + cách đúng. Link chéo bằng `[[name]]`.
5. **No drift:** nếu draft mô tả thay đổi code, grep nhanh xác nhận code đã khớp (hoặc note "code chưa
   làm" rõ ràng).
6. **Xoá** mọi draft/stray file đã gộp (giữ `drafts/README.md` nếu có; xoá SẠCH bất kỳ file rule nào lỡ
   nằm trong FE app repo).
7. **Báo cáo:** mỗi draft → gộp vào file/§ nào, có sửa luật cũ gì, cái nào còn giữ (nếu chưa rõ, hỏi thầy
   thay vì đoán).

## Nguyên tắc
- KHÔNG mất thông tin: mọi ý trong draft phải có nhà trong v2 canonical (hoặc hỏi nếu mơ hồ).
- KHÔNG tự ý thêm luật ngoài draft/stray-file đang xử lý. `/merge` chỉ DI CHUYỂN + RECONCILE, không sáng tác.
- Sau merge: v2 canonical là SSOT; `drafts/` (backend repo) trống trừ README; FE app repo có **0** file
  rule/draft (không phải "trống trừ README" — hoàn toàn không có `.claude/rules/` nội dung rule ở đó).
- **Đừng tái tạo drafts workflow.** Nếu thấy mình sắp viết 1 file `drafts/<temp>.md` mới — DỪNG, đó là v1
  behavior đã bỏ; viết thẳng vào `concepts/`/`elements/`/`layouts/` tương ứng.
