---
name: starci-fe-cta-and-link-scan
description: >
  SCAN half of the CTA/link pair (sibling of `starci-fe-cta-and-link-apply`). AUDITS the CTA + LINK health of pages in
  the MAIN StarCi Academy web app (`C:\Repositories\starci-academy`) — does each surface make SENSE as a conversion +
  navigation node? Scans a SCOPE (`all` · a page/route · a feature · a file set) and grades every surface against the
  house rules: exactly ONE primary CTA · outcome-not-feature copy · CTA at the anchor zone fired at the right Fogg
  moment · a north-star funnel back to courses/content · no dead-end (every surface has an onward path, empty-state
  included) · entity references are real clickable links (EntityLink/EntityToken, no dead links) · deep-links carry
  INTENT not just an address · resume stays in-scope · exactly one back-affordance · HONEST (no fake numbers/scarcity —
  fair-monetization). Grounded in `.claude/fe/principles/{call-to-action,content-linking,persuasion-psychology}` +
  `fe/features/` + the REAL source & data relationships (DB entities / `.mount`) — NEVER fabricates a cross-link.
  Writes a full ranked audit (plan ngầm) + surfaces the top findings as a PROPOSAL to `fe/proposals/` (PENDING in the
  backlog). **NO code change** — the apply half builds it. Offers same-session apply. Wide scope → fan-out scanners.
  Trigger when the user types `/starci-fe-cta-and-link-scan <scope>`, or asks to "soi CTA/link · audit call-to-action ·
  check phễu · link có make sense".
---

# /starci-fe-cta-and-link-scan — Soi CTA + LINK từng trang có make sense không → proposal (không sửa code)

Nửa SCAN của cặp CTA/link. Soi mỗi surface như 1 **node chuyển đổi + điều hướng**: CTA có đúng 1 primary, bắn đúng lúc, copy nói kết quả không? Link có onward path không ngõ cụt, reference bấm-được, deep-link mang ý định không? Chấm theo house-rule → **ghi proposal** vào hàng đợi. **KHÔNG đụng code** (apply mới build).

## Model policy (rẻ ở chỗ nhiều, khôn ở chỗ quyết)
**Scan/fan-out grade từng surface = HAIKU** (rẻ, quét rộng) · **rank severity + chốt finding + viết proposal = OPUS**. Haiku soi, Opus chốt.

## Scope (arg)
`all` (toàn app) · `page <route>` · `feature <name>` · tập file. Rộng → **fan-out** HAIKU scanner per feature/subtree, gom kết quả.

## Nền tra cứu (đọc TRƯỚC, đừng tự chế)
- **`.claude/fe/principles/call-to-action.md`** ⭐ — 1 primary/surface · anchor zone · Fogg B=MAP · north-star "vào khóa/học tiếp" · copy OUTCOME · sub-CTA quiet.
- **`.claude/fe/principles/content-linking.md`** ⭐ — mọi surface ≥1 onward · reference = link bấm-được (fallback bold, KHÔNG dead link) · deep-link mang Ý ĐỊNH · resume đúng phạm vi · 1 back-affordance · empty = đường-đi.
- **`.claude/fe/principles/persuasion-psychology.md`** + **`fe/product/fair-monetization-axiom`** — đòn tâm lý bắn CTA phải HONEST (số THẬT, cấm fake scarcity/count).
- **`.claude/fe/features/<name>.md`** + **`features/INDEX.md`** (đã có mục "⚠️ Issue CTA/phễu") — feature áp CTA/link ra sao; đừng re-audit cái đã ghi.
- **Source THẬT** `src/components/features/<...>` + **data thật** (`src/modules/databases/**/entities` FK · `.mount/data/**` nesting) — grounding neo call-site.

## Quy trình
1. **Khoanh surface** — liệt kê MỌI page/route/pha/state trong scope (rỗng·1·N·overflow·mixed đều là surface CTA/link) + đọc source thật + `fe/features/<name>.md`. Rộng → fan-out HAIKU per feature.
2. **CHẤM mỗi surface theo §Checklist** — mỗi mục ✅ (make sense) · ⚠️ (issue) · ❌ (broken), **neo call-site thật** (`file:line`) + rule vi phạm + hướng sửa 1 dòng. Không đoán.
3. **GROUNDING data (STRICT)** — trước khi phán "thiếu link" / "phễu đứt": kiểm quan hệ THẬT (FK entities / content-nesting `.mount`). **CẤM bịa cross-link giữa feature không liên quan** (challenge ≠ personal-project task). Không có quan hệ thật → surface "độc lập", đừng ép phễu.
4. **GHI AUDIT NGẦM (đầy đủ, nền)** — `fe/proposals/cta-link-<scope>.audit.md` = **MỌI finding**, rank theo **SEVERITY × funnel-impact** (❌ đứt-phễu/dead-link > ⚠️ 2-primary/copy-feature > nit), mỗi finding 1 dòng + status (⬜ chưa · 🔨 · ✅). Đây là **plan NGẦM** — ghi HẾT, KHÔNG đổ hết ra duyệt. Re-chạy → cập nhật (thêm finding mới, GIỮ status cũ, bỏ đã ✅).
5. **LIST 3-5 FINDING / LẦN** (dễ duyệt) — mỗi lần lấy **top ⬜ rank cao nhất** → ghi `cta-link-<scope>-<batch>.proposal.md` (mỗi finding: surface · rule vi phạm · call-site · fix đề xuất · **route đề xuất `layout-apply` [layout/phễu] hay `block-apply` [1 nút/link lẻ]** · verify) + 1 dòng **PENDING** vào `fe/proposals/BACKLOG.md`. **STOP.** Cạn finding ⬜ → báo "hết issue CTA/link trong scope".
6. **→ GỢI Ý APPLY NGAY:** hỏi thầy "sửa luôn session này không?" → đồng ý → `starci-fe-cta-and-link-apply <scope|proposal>`; không → để sau (BACKLOG bàn giao).

## §Checklist chấm (bake — soi mỗi surface)
**CTA:**
- [ ] **Đúng 1 primary** (`primary lg`+arrow); nút phụ ≤ `secondary`/`tertiary`, không 2 nút to ngang cỡ (Hick).
- [ ] CTA ở **vùng anchor** (hero/sticky), KHÔNG lạc slot phụ (actions của header ≠ refresh/toolbar).
- [ ] **Bắn đúng Fogg** — completion moment / M cao; hành động 1-click, đích rõ (không bắn lúc M thấp).
- [ ] Có **1 đường về khóa/nội dung** (north-star funnel) — kể cả state rỗng.
- [ ] **Copy = OUTCOME** ("dựng bằng chứng đi làm"), không FEATURE/cơ-chế ("tốn AI credit").
- [ ] **Sub-CTA quiet** — retry/xem-chi-tiết = tertiary, không lg/arrow.

**LINK:**
- [ ] **≥1 onward path** mọi state — không ngõ cụt; rỗng = phễu về nơi TẠO nội dung, không thông báo chết.
- [ ] **Reference thực thể = link bấm-được** (EntityLink/EntityToken, resolve qua global id); không resolve → **bold plain, KHÔNG dead link giả-bấm**.
- [ ] **Deep-link mang Ý ĐỊNH** — trỏ đúng module/phase liên quan (vd weakestPhase→studyHref), không trỏ trang chung.
- [ ] **Resume đúng phạm vi** surface — content-home resume nội dung tiếp, không nhảy capstone; surface có dashboard LAND ở dashboard, không auto-forward.
- [ ] **Đúng 1 back-affordance** — breadcrumb (trang duyệt) / back-link đơn (leaf), không kẹt.

**HONEST (fair-monetization):**
- [ ] Số/scarcity trong CTA là **THẬT** — không fallback thổi (vd StatStrip=99 khi lỗi), không fake count/đếm-ngược.

## §Widget (BẮT BUỘC) — bản đồ sức khỏe CTA/link
Mỗi lần audit → `show_widget` (gọi `read_me` module `diagram`/`data_viz` trước) render **health map**: mỗi surface 1 hàng · cột = nhóm check (CTA · Link · Honest) tô ✅/⚠️/❌ · rank severity trên xuống · đánh dấu **finding batch này** (accent) vs **sắp-làm** (plan ngầm, muted) vs **OK** (xanh). Thầy NHÌN map thấy trang nào phễu đứt / dead-link ngay, không chỉ đọc bảng.

## ★ Tự phản biện TRƯỚC khi trình finding (bắt buộc — `.claude/fe/principles/self-critique-before-presenting.md`)
Trước khi list 3-5 finding cho thầy: (1) **phản biện mỗi finding** — có phải false-positive không (đã kiểm quan hệ data THẬT chưa, có nhầm signature tình cờ không)? (2) **phản biện độ phủ** — có surface/state (rỗng·overflow·mixed) nào tôi bỏ sót không? Đừng trình finding chưa tự-đập, cũng đừng báo "hết issue" khi mới quét 1 nửa scope.

## Ràng (STRICT)
- Report + proposal, **KHÔNG sửa code** (đó là apply).
- Không đoán — mọi finding neo **call-site thật** + rule cụ thể; nghi "thiếu link" → kiểm quan hệ data THẬT trước, không có → ghi "độc lập" đừng ép phễu.
- Đừng re-audit cái `features/INDEX.md` §Issue đã ghi trừ khi source đã đổi.

## Liên quan
- Build finding → `starci-fe-cta-and-link-apply` · thiết kế phễu cả flow → `starci-fe-layout-brainstorm` (lens conversion).
- Canon: `fe/principles/{call-to-action,content-linking,persuasion-psychology}` · `fe/product/fair-monetization-axiom` · hàng đợi `fe/proposals/BACKLOG.md`.
