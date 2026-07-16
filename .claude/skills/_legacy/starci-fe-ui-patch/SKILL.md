---
name: starci-fe-ui-patch
description: >
  Find UI code in the MAIN StarCi Academy web app (`C:\Repositories\starci-academy`) that was CORRECT under an
  OLDER/superseded ruling but is now stale against the CURRENT canon in `.claude/fe/` — rule DRIFT over time, not
  duplication (→ consolidate-components) or per-surface CTA/link (→ cta-and-link) or i18n/a11y/responsive (→
  quality-audit). Grounds primarily in explicit "Đính chính" (correction) markers and multiple dated "CHỐT" entries on
  the same doc (the doc itself records what changed) — extracts the OLD signature → the NEW ruling, then greps/reads
  real source in the given SCOPE (`all` · a component · a page/feature) for call-sites still on the old pattern.
  Deterministic grep GATE finds correction markers → fan-out HAIKU readers confirm real call-sites still on the legacy
  pattern (grounded, not guessed) → OPUS ranks + writes the exact patch spec. Report-only by default; small/mechanical
  patches (prop rename, class swap, deprecated-component swap across call-sites) apply same-session on approval,
  larger ones queue via `fe/proposals/BACKLOG.md` like the other apply skills. Trigger when the user types
  `/starci-fe-ui-patch [scope]`, or asks to "patch UI cũ lên chuẩn mới · sync code với rule đã đổi · dọn code theo
  ruling mới nhất · tìm chỗ còn dùng convention cũ".
---

# /starci-fe-ui-patch — Nâng UI theo rule ĐÃ ĐỔI (đúng lúc build, lệch bây giờ)

Khác trục với các skill audit khác: không tìm code TRÙNG (→ `consolidate-components`), không chấm CTA/link 1 surface
(→ `cta-and-link`), không tìm lỗi i18n/a11y/responsive (→ `quality-audit`). Skill này tìm code **đúng khi được viết,
nhưng RULE ĐÃ ĐỔI SAU ĐÓ** (canon `fe/` có "Đính chính" hoặc nhiều mốc "CHỐT" khác ngày cho cùng 1 chủ đề) mà code
chưa theo kịp — **rule drift theo thời gian**, không phải bug logic.

## Model policy (rẻ ở chỗ nhiều, khôn ở chỗ quyết)
**Gate deterministic (grep) = script, không cần model** · **fan-out xác nhận call-site thật = HAIKU** (rẻ, quét rộng) ·
**rank + viết patch spec = OPUS**. Haiku quét, Opus chốt.

## Scope (arg)
`all` (toàn app) · `component <tên>` · `page/feature <route|tên>`. Rộng → **fan-out** HAIKU per nhóm doc đã đổi rule.

## Nền tra cứu (đọc TRƯỚC, đừng tự chế)
- **Tín hiệu chính: "Đính chính"** — grep `Đính chính` trong `.claude/fe/**`. Mỗi hit = 1 chỗ doc TỰ GHI "bản trước nói
  X, giờ đúng Y" — đọc đoạn đó ra được NGAY: pattern CŨ (signature grep được: class, prop, tên component cũ) → pattern
  MỚI (ruling hiện hành).
- **Tín hiệu phụ: nhiều mốc "CHỐT <ngày>" trên CÙNG 1 chủ đề trong 1 file** (không phải "Đính chính" tường minh, nhưng
  2 ngày CHỐT khác nhau bàn cùng 1 control/pattern → mốc SAU thắng, mốc TRƯỚC là legacy).
- **`fe/components/`, `fe/patterns/`, `fe/principles/`** — nguồn CANON HIỆN HÀNH để so khớp lại sau khi tìm ra bản cũ
  (đảm bảo patch đúng ruling MỚI NHẤT, không phải ruling giữa chừng).
- **KHÔNG lục git log/blame để tự suy "cái nào cũ hơn"** — chỉ tin đúng cái DOC đã tự ghi là đổi; đoán qua git history dễ suy diễn sai ý định.

## Quy trình
1. **GATE deterministic (grep, rẻ):** `grep -rln "Đính chính" .claude/fe/` (+ nhặt file có ≥2 mốc "CHỐT" khác ngày
   cùng 1 mục). Với mỗi hit, đọc đoạn quanh nó → trích **(pattern CŨ, pattern MỚI, file:dòng doc)**. Ra danh sách cứng
   TRƯỚC — đây là "sổ ghi rule đã đổi", không cần model để tìm.
2. **Fan-out HAIKU xác nhận call-site thật:** với mỗi (pattern CŨ) trong danh sách, grep SOURCE thật trong SCOPE tìm
   file còn dùng đúng signature cũ (tên prop/class/component đã bị thay). Đọc quanh match — confirm nó THẬT SỰ là
   dùng-theo-ruling-cũ (không phải trùng tên tình cờ, không phải đã sửa nhưng còn 1 comment nhắc chữ cũ). Neo
   `file:line` thật, không đoán.
3. **GHI PATCH-LIST NGẦM (đầy đủ, nền)** — `fe/proposals/ui-patch-<scope>.audit.md` = MỌI call-site tìm được, gom theo
   RULE (1 rule đổi → N call-site), rank theo **số call-site × mức lộ diện visual** (component render nhiều nơi > 1
   nơi ẩn). Mỗi dòng: rule (ref `[[doc]]`) · pattern cũ→mới · call-site · status (⬜/🔨/✅). Plan ngầm — ghi HẾT,
   KHÔNG đổ hết ra duyệt.
4. **LIST 3-5 RULE / LẦN** (dễ duyệt) — lấy top ⬜ rank cao nhất → báo cáo gọn: rule nào đổi, tại sao (trích câu
   "Đính chính"), bao nhiêu call-site, patch cụ thể là gì. **STOP, chờ duyệt** — KHÔNG tự sửa khi chưa xác nhận.
5. **Patch khi thầy duyệt:**
   - **Nhỏ/cơ học** (đổi prop/class/tên component, ≤ vài call-site, không đổi ý nghĩa) → **sửa NGAY same-session**,
     verify tsc/eslint + preview nơi đổi được, đổi ✅ trong plan ngầm.
   - **Lớn** (đổi cấu trúc, nhiều call-site rải feature khác nhau, cần quyết định thêm) → ghi `fe/proposals/
     ui-patch-<scope>-<batch>.proposal.md` + 1 dòng **PENDING** vào `fe/proposals/BACKLOG.md`, để `layout-apply`/
     `block-apply` build (giống các skill khác) thay vì tự ôm hết.
6. **GHI MEMORY khi patch xong** (rule always-update-mindset) — rule nào đã đồng bộ hết call-site (để lần audit sau
   không quét lại từ đầu).

## ★ Tự phản biện TRƯỚC khi trình/patch (bắt buộc — `.claude/fe/principles/self-critique-before-presenting.md`)
Trước khi báo cáo rule đổi / trước khi đánh ✅ 1 rule đã patch: (1) **phản biện mỗi call-site** — có phải THẬT dùng theo ruling cũ không, hay trùng signature tình cờ / đã sửa nhưng còn comment cũ? (2) **grep lại signature cũ sau khi patch** — đã xoá SẠCH pattern cũ khỏi scope chưa hay patch nửa vời còn sót (đừng tin "đã đồng bộ hết" theo lời kể). Hỏi thẳng *"còn call-site nào tôi bỏ sót không?"* trước khi báo xong.

## Ràng
- **CHỈ patch theo rule doc đã TỰ GHI là đổi** ("Đính chính" hoặc CHỐT-sau-thắng-CHỐT-trước) — KHÔNG tự ý nâng cấp
  code theo "gu" riêng không có căn cứ trong `fe/`. Nghi ngờ rule nào đó nên đổi nhưng doc chưa ghi → đó là việc của
  brainstorm/block-skill, không phải patch.
- Không đoán — mọi finding neo **file:line source thật** + trích đúng câu "Đính chính"/CHỐT làm căn cứ.
- Patch xong 1 rule → xoá sạch pattern cũ khỏi scope đã quét (đừng patch nửa vời còn sót call-site).

## Liên quan
- Patch lớn cần layout mới → `starci-fe-layout-apply` · patch trong 1 block → `starci-fe-block-apply` · doc tự nó có vấn
  đề (link chết, stale vs source, trùng) → `starci-doc-audit` (khác trục: đó là sức khoẻ DOC, đây là đồng bộ CODE
  theo doc). Hàng đợi lớn dùng chung `fe/proposals/BACKLOG.md`.
