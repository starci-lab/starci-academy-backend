---
name: starci-fe-quality-audit-apply
description: >
  APPLY half of the quality-audit pair (sibling of `starci-fe-quality-audit-scan`). Reads a QUALITY-AUDIT PROPOSAL
  from `fe/proposals/` (produced by the scan half) — graded findings across I18N/COPY (missing/hardcoded strings,
  unnatural vi translation, emoji/uppercase) · A11Y (contrast, focus ring, aria-label) · RESPONSIVE (breakpoint
  overflow/collapse) — then FIXES each: single-block/localized fixes (copy string, aria attribute, focus ring class,
  responsive class tweak) go straight to code via `starci-fe-block-apply`-style edits; layout/shell-level responsive
  findings that need restructuring route to `starci-fe-layout-apply`. Verifies tsc/eslint + preview per fixed surface —
  contrast/focus for a11y fixes, `preview_resize` across mobile/tablet/desktop for responsive fixes, vi+en render for
  i18n fixes — marks the proposal ✅ DONE in the backlog, **RECORDS the result to MEMORY** (what was fixed, what routed
  elsewhere, false positives dropped), and PUSHES per the canon rule (private always, public when business-clean). Can
  run in a different session from the scan. Trigger when the user types `/starci-fe-quality-audit-apply
  <proposal|scope>`, or asks to "chốt sửa i18n/a11y/responsive · apply quality fix · sửa lỗi dịch/contrast/vỡ layout
  đã chốt".
---

# /starci-fe-quality-audit-apply — CHỐT sửa i18n + a11y + responsive (proposal → code, ghi memory)

Nửa APPLY. Đọc 1 quality-audit proposal đã chốt → sửa từng finding (đúng route: block lẻ hay layout) → verify đúng trục → ✅ DONE + ghi memory + push.

## Trước khi build
- Mở **`fe/proposals/BACKLOG.md`** → chọn 1 `quality-audit-<scope>` **⏳ PENDING** → đổi **🔨 IN-PROGRESS**.
- Đọc **`fe/proposals/quality-audit-<scope>-<batch>.proposal.md`** (spec: mỗi finding = surface · trục (i18n/a11y/responsive) · rule vi phạm · call-site · fix đề xuất · route). Bám spec — **không tự thêm finding mới** (thêm → quay lại `starci-fe-quality-audit-scan`).

## Build — route đúng theo loại finding
Mỗi finding trong proposal đã gắn 1 route từ scan; XÁC NHẬN lại route đó còn đúng trước khi sửa (source có thể đã đổi):

- **Fix lẻ tại chỗ (đa số)** — thêm/sửa i18n key (vi+en, dịch theo NGHĨA tự nhiên không word-for-word), bỏ emoji/uppercase, thêm `aria-label` (đổi theo trạng thái nếu icon đổi nghĩa), thêm/sửa `focus-visible:ring`, sửa tổ hợp màu-contrast không đạt AA, sửa class responsive lệch breakpoint scale chuẩn — sửa **TRỰC TIẾP** trong component đang đứng (giống scope của `starci-fe-block-apply`: 1 block, props `WithClassNames`, không hand-roll thêm primitive mới).
- **Route sang `starci-fe-layout-apply`** — finding responsive đụng **shell/region cấp layout** (cần dựng lại thứ tự co-giãn, đổi shell archetype, không chỉ đổi class trên component) — finding này KHÔNG tự sửa ở đây, chỉ **đánh dấu "→ layout-apply"** trong proposal + để nguyên PENDING cho lượt `layout-apply` riêng, hoặc gọi `starci-fe-layout-apply` ngay nếu thầy đồng ý mở rộng session.
- **OPUS** đọc proposal + source thật trước khi sửa bất kỳ finding nào — đừng đoán vị trí/chuỗi, đọc lại call-site + dictionary i18n thật.

## Verify (trước ✅, per surface đã sửa, đúng trục)
- `npx tsc --noEmit` + `npm run lint` sạch.
- **I18N** — preview đổi cả vi và en, xác nhận string đúng ngữ nghĩa, không lộ key thô, không lẫn English chỗ đã có từ Việt.
- **A11Y** — `preview_inspect` kiểm contrast màu thật + tab qua bằng bàn phím xác nhận `focus-visible:ring` hiện rõ; icon-only đọc `aria-label` đúng trạng thái hiện tại.
- **RESPONSIVE** — `preview_resize` qua mobile/tablet/desktop, xác nhận không tràn/vỡ/đè chồng ở breakpoint nào. Chụp.

- **★ Tự phản biện TRƯỚC khi ✅ (bắt buộc — `.claude/fe/principles/self-critique-before-presenting.md`):** sửa i18n/a11y/responsive → verify BẰNG HÀNH ĐỘNG đúng trục (đổi vi/en thật · tab bàn phím thật · resize thật), KHÔNG "nhìn-đoán chắc ổn". 1 chuỗi/aria/class dùng lặp nhiều nơi → grep hết call-site, đừng sửa 1 chỗ rồi báo xong. Hỏi thẳng *"thầy sẽ bắt chỗ nào còn lẫn English / contrast còn hụt / còn vỡ ở breakpoint nào?"* trước khi đánh DONE.

## Xong → BACKLOG + MEMORY + push
1. `fe/proposals/BACKLOG.md`: proposal → **✅ DONE** + ngày. Đánh **✅ finding vừa sửa** trong `fe/proposals/quality-audit-<scope>.audit.md` (plan ngầm) → re-scan tự lấy batch ⬜ tiếp.
2. **GHI MEMORY (bắt buộc):** *đã sửa N finding (chia theo trục i18n/a11y/responsive) · surface nào · finding nào route sang layout-apply (chưa sửa ở đây) · finding nào dropped vì false-positive* → để lần sau đối chiếu, không audit lại cái đã fix (rule always-update-mindset).
3. Nếu sửa đổi ruling chung (vd 1 chuỗi copy dùng lặp lại nhiều nơi) → cập nhật `fe/principles/content-voice.md`/`accessibility.md` hoặc `fe/features/<name>.md`.
4. **PUSH:** sửa canon → **private ngay**; sạch business → **public** (rule `.claude/CANON.md`).

## Ràng
- Bám SPEC proposal — finding không có trong proposal thì không sửa ở đây (quay lại scan). Chỉ sửa **thật-sự vi phạm rule**, không "chỉnh tay" theo cảm tính.
- KHÔNG tự dựng lại shell/region — đụng layout thật sự thì route sang `starci-fe-layout-apply`, đừng cố nhét fix layout vào đây.

## Liên quan
- Nguồn proposal → `starci-fe-quality-audit-scan` · fix cấp layout/shell → `starci-fe-layout-apply` · block build 1-off → `starci-fe-block-apply` · hàng đợi `fe/proposals/BACKLOG.md`.
