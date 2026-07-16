---
name: starci-fe-quality-audit-scan
description: >
  SCAN half of the quality-audit pair (sibling of `starci-fe-quality-audit-apply`). AUDITS three combined quality
  dimensions per surface in ONE pass in the MAIN StarCi Academy web app (`C:\Repositories\starci-academy`) — I18N/COPY
  (bilingual vi/en correctness, natural Vietnamese not word-for-word, no hardcoded/missing translation keys, no emoji,
  no ALL-CAPS) · A11Y (contrast, focus-visible ring, aria-label on icon-only, color never the only signal) · RESPONSIVE
  (no overflow/collapse across breakpoints, correct breakpoint scale usage). Scans a SCOPE (`all` · a page/route · a
  feature · a file set) and grades every surface against the house rules. Grounded in
  `.claude/fe/principles/{content-voice,accessibility}` + `.claude/fe/foundations/breakpoints` +
  `.claude/fe/layouts/responsive-regions` + the REAL source. Writes a full ranked audit (plan ngầm) + surfaces the top
  findings as a PROPOSAL to `fe/proposals/` (PENDING in the backlog). **NO code change** — the apply half builds it.
  Offers same-session apply. Wide scope → fan-out scanners. Trigger when the user types
  `/starci-fe-quality-audit-scan <scope>`, or asks to "audit i18n/a11y/responsive · soi copy+accessibility+breakpoint ·
  check chất lượng UI toàn diện · quét lỗi dịch/contrast/vỡ layout".
---

# /starci-fe-quality-audit-scan — Soi i18n + a11y + responsive từng trang trong 1 lượt → proposal (không sửa code)

Nửa SCAN của cặp quality-audit. Ba trục hay bị bỏ sót vì mỗi trục "nhỏ" riêng lẻ nhưng cộng lại là nơi UI rò rỉ nhiều nhất: **copy** (lẫn tiếng Anh, dịch cứng, thiếu key), **a11y** (im lặng với bàn phím/screen reader, chỉ dựa màu), **responsive** (vỡ ở breakpoint không ai test). Gom 3 trục vào 1 lượt scan vì chúng đều là "surface đọc xong có sạch không", cùng checklist-per-surface, cùng call-site — tách 3 skill riêng sẽ đọc lại source 3 lần cho cùng 1 trang. Chấm theo house-rule → **ghi proposal** vào hàng đợi. **KHÔNG đụng code** (apply mới build).

## Model policy (rẻ ở chỗ nhiều, khôn ở chỗ quyết)
**Scan/fan-out grade từng surface trên cả 3 trục = HAIKU** (rẻ, quét rộng) · **rank severity + chốt finding + viết proposal = OPUS**. Haiku soi, Opus chốt.

## Scope (arg)
`all` (toàn app) · `page <route>` · `feature <name>` · tập file. Rộng → **fan-out** HAIKU scanner per feature/subtree, gom kết quả.

## Nền tra cứu (đọc TRƯỚC, đừng tự chế)
- **`.claude/fe/principles/content-voice.md`** ⭐ — copy vi TỰ NHIÊN (không lẫn English khi có từ Việt tốt) · dịch theo NGHĨA không word-for-word · label song nhịp · KHÔNG emoji · KHÔNG uppercase.
- **`.claude/fe/principles/accessibility.md`** ⭐ — contrast text ≥4.5:1/icon ≥3:1 · `focus-visible:ring` mọi interactive · icon-only BẮT BUỘC `aria-label` (đổi theo trạng thái nếu icon đổi nghĩa) · màu KHÔNG BAO GIỜ là kênh thông tin duy nhất.
- **`.claude/fe/foundations/breakpoints.md`** + **`.claude/fe/layouts/responsive-regions.md`** ⭐ — breakpoint scale chuẩn, region nào co giãn ra sao ở mobile/tablet/desktop.
- **`.claude/fe/features/<name>.md`** + **`features/INDEX.md`** — feature đã ghi issue quality thì đừng re-audit trừ khi source đã đổi.
- **Source THẬT** `src/components/features/<...>` + i18n dictionaries thật (vi/en) — grounding neo call-site, không đoán chuỗi.

## Quy trình
1. **Khoanh surface** — liệt kê MỌI page/route/pha/state trong scope (rỗng·1·N·overflow·mixed đều là surface) + đọc source thật + i18n dictionary liên quan + `fe/features/<name>.md`. Rộng → fan-out HAIKU per feature.
2. **CHẤM mỗi surface theo §Checklist (cả 3 trục)** — mỗi mục ✅ (sạch) · ⚠️ (issue) · ❌ (vỡ), **neo call-site thật** (`file:line`) + rule vi phạm + hướng sửa 1 dòng. Không đoán — chuỗi copy thật, contrast tính thật (không "nhìn thấy chắc ổn"), breakpoint test thật qua devtools/preview nếu nghi ngờ.
3. **GHI AUDIT NGẦM (đầy đủ, nền)** — `fe/proposals/quality-audit-<scope>.audit.md` = **MỌI finding**, rank theo **SEVERITY** (❌ vỡ-layout/thiếu-key/không-focus-được > ⚠️ copy-lẫn-English/contrast-hụt-AA > nit), mỗi finding 1 dòng + trục (i18n/a11y/responsive) + status (⬜ chưa · 🔨 · ✅). Đây là **plan NGẦM** — ghi HẾT, KHÔNG đổ hết ra duyệt. Re-chạy → cập nhật (thêm finding mới, GIỮ status cũ, bỏ đã ✅).
4. **LIST 3-5 FINDING / LẦN** (dễ duyệt) — mỗi lần lấy **top ⬜ rank cao nhất**, có thể trộn cả 3 trục trong 1 batch nếu cùng surface → ghi `fe/proposals/quality-audit-<scope>-<batch>.proposal.md` (mỗi finding: surface · trục · rule vi phạm · call-site · fix đề xuất · **route đề xuất `block-apply` [1 chỗ lẻ] hay `layout-apply` [đụng shell/region cần dựng lại]** · verify) + 1 dòng **PENDING** vào `fe/proposals/BACKLOG.md`. **STOP.** Cạn finding ⬜ → báo "hết issue quality trong scope".
5. **→ GỢI Ý APPLY NGAY:** hỏi thầy "sửa luôn session này không?" → đồng ý → `starci-fe-quality-audit-apply <scope|proposal>`; không → để sau (BACKLOG bàn giao).

## §Checklist chấm (bake — soi mỗi surface, 3 trục)
**I18N/COPY:**
- [ ] **Không hardcode string** — mọi UI copy qua i18n key, không chuỗi cứng trong JSX.
- [ ] **Key có đủ vi + en** — thiếu 1 bên → fallback lộ hoặc key thô hiện ra màn hình.
- [ ] **Copy vi TỰ NHIÊN** — không lẫn English khi đã có từ Việt tốt (`build`→`dựng`), dịch theo NGHĨA không word-for-word, đọc lên không sượng.
- [ ] **Label song nhịp** — nhãn cùng nhóm/hàng cùng độ dài/cấu trúc, không 1 nhãn lệch dài phá nhịp.
- [ ] **KHÔNG emoji, KHÔNG ALL-CAPS** trong bất kỳ string/label.

**A11Y:**
- [ ] **Contrast đạt AA** — text ≥4.5:1, icon/phụ ≥3:1; verify THẬT các tổ hợp `text-accent` trên nền tint nhạt, không giả định "đậm là đủ".
- [ ] **Focus-visible rõ ràng** — mọi interactive có `focus-visible:ring` tách biệt hover, bàn phím tab qua thấy đang ở đâu.
- [ ] **Icon-only có `aria-label`** — và label ĐỔI THEO khi icon đổi nghĩa theo trạng thái (lock thay puzzle khi khoá).
- [ ] **Màu không phải kênh duy nhất** — mọi status/phân loại phủ màu kèm icon hoặc text, không chỉ tô xanh/đỏ.

**RESPONSIVE:**
- [ ] **Không vỡ/tràn ở breakpoint nào** — mobile/tablet/desktop test thật (resize hoặc devtools), không chỉ nhìn desktop rồi suy ra.
- [ ] **Đúng breakpoint scale chuẩn** (`foundations/breakpoints.md`) — không magic-number breakpoint riêng lẻ.
- [ ] **Region co giãn đúng vai trò** (`layouts/responsive-regions.md`) — sidebar/content/toolbar co/collapse đúng chỗ, không đè chồng hay biến mất sai thứ tự ưu tiên.

## §Widget (BẮT BUỘC) — bản đồ sức khỏe quality
Mỗi lần audit → `show_widget` (gọi `read_me` module `diagram`/`data_viz` trước) render **health map**: mỗi surface 1 hàng · 3 cột = I18N · A11Y · RESPONSIVE tô ✅/⚠️/❌ · rank severity trên xuống · đánh dấu **finding batch này** (accent) vs **sắp-làm** (plan ngầm, muted) vs **OK** (xanh). Thầy NHÌN map thấy trang nào lẫn English, trang nào contrast hụt, trang nào vỡ mobile — không phải đọc bảng dài.

## ★ Tự phản biện TRƯỚC khi trình finding (bắt buộc — `.claude/fe/principles/self-critique-before-presenting.md`)
Trước khi list 3-5 finding cho thầy: (1) **phản biện mỗi finding** — chuỗi/contrast/breakpoint đã kiểm THẬT (đọc dictionary · tính contrast · resize) chưa hay "nhìn-đoán chắc ổn"? (2) **phản biện độ phủ** — 3 trục (i18n/a11y/responsive) đã soi đủ cho mỗi surface chưa, còn surface/state nào sót? Đừng trình finding chưa tự-kiểm, đừng báo "hết issue" khi quét dở scope.

## Ràng (STRICT)
- Report + proposal, **KHÔNG sửa code** (đó là apply).
- Không đoán — copy đọc chuỗi thật trong dictionary/source, contrast tính thật (không nhìn-đoán), responsive test thật (resize/devtools) trước khi chấm ❌.
- Đừng re-audit cái `features/INDEX.md` §Issue đã ghi trừ khi source đã đổi.

## Liên quan
- Build finding → `starci-fe-quality-audit-apply` · sửa 1 block lẻ → `starci-fe-block-apply` · đụng shell/region cả layout → `starci-fe-layout-apply`.
- Canon: `fe/principles/{content-voice,accessibility}` · `fe/foundations/breakpoints` · `fe/layouts/responsive-regions` · hàng đợi `fe/proposals/BACKLOG.md`.
