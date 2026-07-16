---
name: starci-fe-audit
description: >
  FULL-SCAN sức khỏe FE đa-trục cho app chính (`$FE_SOURCE`, branch mtp) bằng FAN-OUT
  Workflow — 5 trục trong 1 lượt: (1) COVERAGE story (block thật chưa có story), (2) DRIFT story↔component
  (story dùng prop/state đã đổi), (3) QUALITY i18n/a11y/responsive, (4) CTA/LINK (mỗi surface là node
  chuyển đổi + điều hướng có make sense không), (5) COMPONENT TRÙNG cần gom về block canonical. ĐỌC rule
  read-only từ `.claude/fe/{axis-1-rules,axis-2-biz-ui,axis-3-layout,methodology,enforcement}` + patterns;
  GROUND từ Storybook qua `.artifacts/states/{snapshot.json,diff.md}` (fe-sync giữ, KHỎI rescan src) + source
  thật + i18n dictionaries vi/en + entities BE/`.mount` (khi phán CTA/link) + `.artifacts/concepts` (định
  hướng feature, fallback khi thiếu dữ kiện); GHI kết quả vào `.artifacts/proposals/` (bản đồ audit + finding
  ranked + PENDING vào BACKLOG.md) —
  KHÔNG sửa code, KHÔNG ghi `.claude/`, KHÔNG đụng `states/`. Đây là lane NẶNG (quét toàn app, nhiều agent,
  chạy nền) — CHỈ chạy khi thầy chủ động gọi audit; lane thường ngày là `starci-fe-sync` (incremental).
  Trigger khi user gõ `/starci-fe-audit [scope|trục]`, hoặc nói "audit FE", "quét sức khỏe UI toàn app",
  "soi coverage/drift storybook", "check i18n/a11y/responsive/CTA/link toàn cục", "tìm component trùng".
---

# /starci-fe-audit — Full-scan sức khỏe FE 5 trục → bản đồ + findings ranked

Lane NẶNG, chạy khi thầy gọi. Gom 5 lượt quét cũ (story-book · sweep · quality · cta-link · consolidate)
thành 1 skill vì chúng cùng skeleton: enumerate surface → fan-out chấm → synthesize rank → proposal. Đọc
source 1 lần, chấm đủ trục — không đọc lại app 5 lần cho 5 skill.

> Khung [[methodology/three-axis]]: trục-1 cơ học **đã lint-gate** ([[methodology/enforcement]]) — audit tập
> trung JUDGMENT (trục 2/3 + story). Pattern cơ học lặp ≥2 chỗ → log `fe/enforcement/lint-candidates.md`
> đề xuất cho `starci-fe-enforce` (ghi qua thầy, KHÔNG tự ghi `.claude/` trong vòng lặp); pattern đã ✅
> trong file đó → **NGỪNG chấm lại bằng LLM**.

## Vị trí trong hệ (đọc/ghi ở đâu)
- **ĐỌC (read-only):** `.claude/fe/axis-1-rules/RULES.md` (i18n/a11y/breakpoint) · `axis-2-biz-ui/RULES.md`
  (data-shape→block, chuẩn gom) · `axis-3-layout/RULES.md` (shell/zone/state + §CTA·content-linking·persuasion)
  · [[methodology/storybook-story-conventions]] (chuẩn story: `parameters.usage`, tag `news`) ·
  `fe/enforcement/lint-candidates.md` (cái máy đã gánh) · `.claude/patterns/fe` (code-style).
- **GROUND:** `.artifacts/states/snapshot.json` (map component↔story — nguồn enumerate coverage/drift, KHỎI
  glob cả src) + `diff.md`; source thật `src/components/{blocks,features}/**` + i18n dictionaries vi/en;
  quan hệ data thật (entities BE / `.mount`) khi phán CTA/link.
- **GHI (duy nhất):** `.artifacts/proposals/fe-audit-<scope>.audit.md` (bản đồ đầy đủ) + batch proposal +
  dòng PENDING vào `.artifacts/proposals/BACKLOG.md`. Storybook = nguồn sự thật UI; `states/` chỉ fe-sync ghi.

## Scope (arg)
`all` (mặc định) · 1 trục (`story` · `quality` · `cta` · `dedup`) · `feature <name>` · `page <route>`.
Không rõ → hỏi thầy 1 câu rồi chạy, đừng tự đoán scope hẹp.

## Model policy (rẻ ở chỗ nhiều, khôn ở chỗ quyết)
**Haiku** = enumerate + grade từng surface (fan-out, rẻ) · **Sonnet** = judge/xác nhận finding per-trục
(neo file:line, loại false-positive) · **Opus** = synthesize cross-trục + rank + viết proposal. Haiku soi,
Sonnet xác, Opus chốt.

## Quy trình (Workflow tool BẮT BUỘC — không block session chính)

### Pha A — SCAN (Workflow, nền)
1. **Enumerate (Haiku, deterministic trước):** đọc `states/snapshot.json` → list block↔story; glob
   `src/components/features/**` → list surface; sinh cặp `path|slug`. Coverage-gap story = diff snapshot.
2. **Fan-out chấm (Haiku per-nhóm/feature, mỗi agent READ-ONLY):** mỗi surface chấm đủ trục trong scope
   theo §Checklist. Mỗi finding **neo file:line thật** + rule vi phạm + hướng sửa 1 dòng. Trục sạch → ghi
   "sạch", KHÔNG bịa. Chuỗi i18n đọc dictionary thật, contrast tính thật, quan hệ data kiểm FK/`.mount`
   thật — không "nhìn-đoán".
3. **Judge per-trục (Sonnet):** dedupe, loại finding mơ hồ/giống-hình-khác-nghĩa, phân loại đích sửa
   (story-only · component · shell/layout · gom-block · lint-candidate).
4. **Synthesize (Opus):** gộp cross-trục, rank theo **severity × ROI** (❌ vỡ/dead-link/thiếu-key/đứt-phễu
   > ⚠️ drift/copy-lẫn/2-primary > nit), rút **theme xuyên suốt** (finding lặp nhiều surface = chỗ fix gom
   ROI cao nhất — vd hand-roll→1 block, isPending-no-spinner).

### Pha B — TRÌNH (main session, tương tác)
5. **GHI bản đồ audit** `.artifacts/proposals/fe-audit-<scope>.audit.md`: MỌI finding (bảng: # · trục ·
   surface · call-site · rule · fix đề xuất · severity · status ⬜/🔨/✅) + §Theme + §Stats per-trục.
   Re-chạy → cập nhật (thêm mới, GIỮ status cũ, bỏ ✅ — đừng re-flag cái thầy đã bác, ghi lý do bác vào note).
6. **LIST 3-5 finding top ⬜ / lần** cho thầy duyệt (kèm theme ROI-cao nếu có) → chốt cái nào làm → ghi
   `fe-audit-<scope>-<batch>.proposal.md` (mỗi finding: call-site · fix · route build) + PENDING vào
   `BACKLOG.md`. **STOP — không sửa code trong lượt audit.**

### Pha C — BÀN GIAO
7. Route mỗi finding đã chốt: story-only/component nhỏ → `starci-fe-build` build thẳng theo proposal;
   shell/flow cần thiết-kế-lại → `starci-fe-layout` chốt layout rồi mới `starci-fe-build`; gom trùng →
   `starci-fe-build` theo proposal gom; pattern cơ học → đề xuất lint-candidate cho `starci-fe-enforce`.
   Mọi code do `starci-fe-build` viết sau đó phải theo `.claude/patterns/fe` + đẩy story `tags: ['news']`
   caption "Chờ duyệt" lên Storybook — audit KHÔNG tự làm hộ.

## §Checklist 5 trục (bake — mỗi surface/block trong scope)
- **1 · Coverage story:** block thật trong `src/components/blocks/**` có story chưa (so `snapshot.json`)?
  Gap lớn → queue nhỏ giọt 3-5 story/batch vào BACKLOG, **CẤM generate hàng loạt 1 lượt**.
- **2 · Drift story↔component:** story dùng prop/value component đã đổi? Thiếu `parameters.usage`? Component
  có state (loading/empty/error/disabled/tone…) mà story không demo? **Component thật = spec cao nhất** —
  story/doc theo sau, trừ khi component rõ ràng sai (→ finding component-level, đích sửa khác).
- **3 · Quality:** i18n (không hardcode string · key đủ vi+en · copy vi TỰ NHIÊN không word-for-word · không
  emoji/ALL-CAPS) · a11y (contrast AA tính thật · focus-visible ring · icon-only có aria-label · màu không
  phải kênh duy nhất) · responsive (không vỡ/tràn breakpoint nào · đúng scale chuẩn · region co giãn đúng
  vai trò). Mục nào lint đã gánh (✅ trong lint-candidates) → skip.
- **4 · CTA/link:** đúng 1 primary CTA ở anchor zone · copy OUTCOME không feature · north-star funnel về
  khóa/nội dung · không ngõ cụt (empty-state có đường đi) · reference = link bấm-được, không dead-link ·
  deep-link mang Ý ĐỊNH · 1 back-affordance · HONEST (số thật, cấm fake scarcity). **Phán "thiếu link" phải
  kiểm quan hệ data THẬT trước — không có quan hệ → surface độc lập, đừng ép phễu.**
- **5 · Trùng cần gom:** JSX cluster copy-paste · className blob lặp · component cùng cấu-trúc-khác-data ·
  hand-roll thứ đã có block canonical (tra bảng axis-2). Rule-of-three (≥2-3 call-site), ngữ nghĩa > hình.

## ★ Tự phản biện TRƯỚC khi trình (bắt buộc)
(1) Mỗi finding đã kiểm THẬT chưa (dictionary/contrast/data/prop thật) hay nhìn-đoán? (2) Độ phủ — có
surface/state (rỗng·1·N·overflow·mixed) nào agent chấm "sạch" mà chưa đọc hết subcomponent? (3) Theme đã nêu
đúng chỗ ROI-cao chưa hay chỉ liệt kê phẳng? (4) Trục-1 lặp đã đề xuất lint-candidate chưa — đừng để audit-LLM
gánh mãi cái máy nên gánh.

## Ràng buộc (STRICT)
- **KHÔNG sửa code, KHÔNG ghi `.claude/`, KHÔNG đụng `.artifacts/states/`** — output duy nhất là
  `.artifacts/proposals/`. Fix là việc của `starci-fe-build` theo BACKLOG.
- Path FE = `$FE_SOURCE` (khai ở `$BE_SOURCE/.artifacts/config.json`)
- Không đoán — mọi finding neo file:line thật; không chắc → đánh "cần verify", không phán.
- KHÔNG search web; thiếu dữ kiện (định hướng feature, ý đồ) → đọc `.artifacts/concepts/` hoặc DỪNG hỏi thầy.
- Fan-out trong **1 Workflow** (nhiều agent con), không launch 1 workflow/nhóm; agent con READ-ONLY trên app.
- Quyết định kiến trúc (đổi API component, đổi harness Storybook, generate >5 story) → luôn HỎI thầy,
  không tự quyết trong audit.

## Liên quan
- `starci-fe-sync` — lane thường ngày (incremental, giữ `states/`); audit là ảnh chụp toàn phần khi cần.
- Build finding → `starci-fe-build` (đẩy story `news` chờ duyệt), thiết-kế-lại lớn thì qua `starci-fe-layout`/
  `starci-fe-block` trước · pattern cơ học → `starci-fe-enforce`.
- Canon: [[methodology/three-axis]] · [[methodology/enforcement]] · [[methodology/storybook-story-conventions]]
  · `fe/axis-{1,2,3}*/RULES.md` · hàng đợi `.artifacts/proposals/BACKLOG.md`.

## Phân model (fan-out / nhiều pha)
Khi skill này fan-out hoặc chia pha, phân model theo VAI:
- **fable — deep thinking**: rescan/phân tích/ra nhận định nhanh, quyết hướng (decide).
- **sonnet — action**: quét · scan · build · sửa (làm việc thật). **LUÔN ghi brief** kết quả lại (file/`.artifacts`), đừng giữ trong đầu — pha finalize cần đọc.
- **opus — finalize**: đọc mọi brief → synthesize · chốt · quyết định cuối + ghi state.
