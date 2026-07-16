---
name: starci-fe-cta-and-link-apply
description: >
  APPLY half of the CTA/link pair (sibling of `starci-fe-cta-and-link-scan`). Reads a CTA/LINK PROPOSAL from
  `fe/proposals/` (produced by the scan half) — the graded findings (surface · rule vi phạm · call-site · fix đề xuất ·
  route layout-apply/block-apply) — then FIXES each: single-block CTA/link fixes (copy, primary/secondary demotion,
  EntityLink wiring, deep-link intent) go straight to code via `starci-fe-block-apply`-style block edits; funnel/shell-
  level fixes (missing onward path, wrong shell, cross-surface phễu) route to `starci-fe-layout-apply`. Verifies tsc/eslint
  + click-through preview per fixed surface, marks the proposal ✅ DONE in the backlog, **RECORDS the result to MEMORY**
  (which findings fixed, which routed elsewhere, which dropped as false-positive — for future cross-reference), and
  PUSHES per the canon rule (private always, public when business-clean). Can run in a different session from the scan.
  Trigger when the user types `/starci-fe-cta-and-link-apply <proposal|scope>`, or asks to "chốt sửa CTA/link · apply
  CTA fix · sửa phễu đã chốt".
---

# /starci-fe-cta-and-link-apply — CHỐT sửa CTA/link (proposal → code, ghi memory)

Nửa APPLY. Đọc 1 CTA/link proposal đã chốt → sửa từng finding (đúng route: block lẻ hay funnel/shell) → verify → ✅ DONE + ghi memory + push.

## Trước khi build
- Mở **`fe/proposals/BACKLOG.md`** → chọn 1 `cta-link-<scope>` **⏳ PENDING** → đổi **🔨 IN-PROGRESS**.
- Đọc **`fe/proposals/cta-link-<scope>-<batch>.proposal.md`** (spec: mỗi finding = surface · rule vi phạm · call-site · fix đề xuất · route). Bám spec — **không tự thêm finding mới** (thêm → quay lại `starci-fe-cta-and-link-scan`).

## Build — route đúng theo loại finding
Mỗi finding trong proposal đã gắn 1 route từ scan; XÁC NHẬN lại route đó còn đúng trước khi sửa (source có thể đã đổi):

- **Fix lẻ tại chỗ (đa số)** — sai copy (feature→outcome), demote nút phụ xuống `secondary`/`tertiary`, gắn `EntityLink`/`EntityToken` cho reference chưa bấm-được, sửa deep-link href mang đúng ý định, bỏ fallback số giả (honest) — sửa **TRỰC TIẾP** trong component đang đứng (giống scope của `starci-fe-block-apply`: 1 block, props `WithClassNames`, không hand-roll thêm primitive mới).
- **Route sang `starci-fe-layout-apply`** — finding đụng **shell/zone/phễu liên-surface** (thiếu cả 1 onward path cấp layout, CTA anchor sai zone cần dời region, resume nhảy sai phạm vi) — finding này KHÔNG tự sửa ở đây, chỉ **đánh dấu "→ layout-apply"** trong proposal + để nguyên PENDING cho lượt `layout-apply` riêng, hoặc gọi `starci-fe-layout-apply` ngay nếu thầy đồng ý mở rộng session.
- **OPUS** đọc proposal + source thật trước khi sửa bất kỳ finding nào — đừng đoán vị trí, đọc lại call-site.

## Verify (trước ✅, per surface đã sửa)
- `npx tsc --noEmit` + `npm run lint` sạch.
- **Preview** — click-through đúng surface: CTA bắn đúng chỗ, nút phụ đã hạ cấp, link/deep-link đi đúng đích, empty-state (nếu có) không còn ngõ cụt. Chụp.
- **★ Tự phản biện TRƯỚC khi ✅ (bắt buộc — `.claude/fe/principles/self-critique-before-presenting.md`):** fix CTA/link đụng nhiều nút cạnh nhau → đọc HẾT section `call-to-action.md`/`content-linking.md`, không chỉ 1 rule (ca thật: hạ 1 nút xuống secondary nhưng để nó CÙNG arrow với primary → vẫn đọc như 2 CTA ngang vai). Sửa ≥2 call-site cùng pattern → grep lại tất cả, đừng tin "đã sửa hết". Hỏi thẳng *"thầy sẽ nói phễu vẫn đứt / hierarchy vẫn nhạt ở đâu?"* trước khi báo xong.

## Xong → BACKLOG + MEMORY + push
1. `fe/proposals/BACKLOG.md`: proposal → **✅ DONE** + ngày. Đánh **✅ finding vừa sửa** trong `fe/proposals/cta-link-<scope>.audit.md` (plan ngầm) → re-scan tự lấy batch ⬜ tiếp.
2. **GHI MEMORY (bắt buộc):** *đã sửa N finding CTA/link · surface nào · finding nào route sang layout-apply (chưa sửa ở đây) · finding nào dropped vì false-positive (grounding sai)* → để lần sau đối chiếu, không audit lại cái đã fix (rule always-update-mindset).
3. Nếu sửa đổi ruling chung (vd copy pattern CTA mới) → cập nhật `fe/principles/call-to-action.md`/`content-linking.md` hoặc `fe/features/<name>.md`.
4. **PUSH:** sửa canon → **private ngay**; sạch business → **public** (rule `.claude/CANON.md`).

## Ràng
- Bám SPEC proposal — finding không có trong proposal thì không sửa ở đây (quay lại scan). Chỉ sửa **thật-sự vi phạm rule**, không "chỉnh tay" theo cảm tính.
- KHÔNG tự dựng shell/zone mới — đụng layout thật sự thì route sang `starci-fe-layout-apply`, đừng cố nhét fix layout vào đây.

## Liên quan
- Nguồn proposal → `starci-fe-cta-and-link-scan` · fix cấp layout/phễu → `starci-fe-layout-apply` · block build 1-off → `starci-fe-block-apply` · hàng đợi `fe/proposals/BACKLOG.md`.
