---
name: starci-fe-feedback
description: >
  Handle ONE câu feedback trực tiếp của thầy — screenshot (hoặc Storybook/preview đang mở) + 1 lời nói ngắn ("tabs
  kiểu này phải full width", "spacing sai", "màu lệch token") — cho FE app chính (`$FE_SOURCE`,
  branch mtp). Vai = INTAKE: định vị ĐÚNG call-site feedback chỉ vào (dựa `.artifacts/states` + grep source thật),
  tra xem rule đã có trong `.claude/patterns/fe` (code-style) / `.claude/fe` (design) chưa — có rồi mà code lệch →
  chỉ patch; CHƯA có → đây là rule MỚI thầy vừa dạy → GHI rule vào đúng nhà TRƯỚC rồi mới fix. Đây là bước SETUP-rule
  có chủ đích — skill này ĐƯỢC PHÉP ghi `.claude/` (ngoại lệ duy nhất so với vòng lặp động vốn chỉ ĐỌC `.claude`).
  Fix nhỏ same-session (1-2 call-site: class/prop/token, tuân `.claude/patterns/fe`), verify tsc/eslint, để Storybook
  HMR tự áp cho thầy soi — KHÔNG tự ghi `.artifacts/states` (fe-sync ghi sau). Fix hoá ra lớn → queue
  `.artifacts/proposals/` route sang `starci-fe-build`. Trigger khi user gõ
  `/starci-fe-feedback [note]`, hoặc đưa screenshot + 1 câu chỉnh về cái đang trên màn hình và muốn vừa FIX vừa NHỚ
  thành rule.
---

# /starci-fe-feedback — 1 câu feedback của thầy → fix ngay + ghi rule đúng nhà

> ★ **Đồng bộ 3 lớp** (chân lý `.claude/fe` · story = UI-ref · component = UI-trên-nền): mọi thay đổi skill này tạo ra PHẢI reconcile CẢ 3 → luật `.claude/fe/principles/three-layer-sync-truth-story-ui.md` · recipe `.claude/fe/patterns/reconcile-three-layers-on-change.md`.

Thầy đang nhìn UI CHẠY THẬT (app hoặc Storybook), chỉ tay 1 chỗ, nói 1 câu. Rule đó **có thể chưa từng được ghi** ở
đâu. Việc của skill: xác định ĐÚNG chỗ → tra rule → fix nhỏ → và **luôn chốt rule về đúng nhà** trước khi coi là xong
— không ghi thì feedback y hệt sẽ lặp lại ở surface khác.

## Nguồn (đọc/ghi gì)
- **FE source:** `$FE_SOURCE` (mtp)
- **Đọc:** `.artifacts/states/registry.md` (block↔story↔luật) + `snapshot.json` (fe-sync giữ — khỏi rescan src) ·
  `.claude/fe` (design rules: `components/`·`principles/`·`patterns/`·`foundations/`) · `.claude/patterns/fe`
  (code-style FORCE) · source thật của call-site.
- **Ghi:** code fix trong `src/` · rule mới vào `.claude/patterns/fe` hoặc `.claude/fe` (ngoại lệ SETUP — xem §Ràng)
  · nếu escalate: `.artifacts/proposals/<tên>.proposal.md`.
- **KHÔNG ghi:** `.artifacts/states` (của fe-sync) · KHÔNG search web — thiếu dữ kiện (không rõ route/block nào,
  feedback đa nghĩa) → DỪNG hỏi thầy, không đoán.

## Quy trình (mỗi pha kèm model — [[model-allocation-3tier]]; feedback đơn giản chạy thẳng main loop, chỉ fan-out khi sweep)
1. **Định vị call-site THẬT** — `[opus đa nghĩa · rõ→main loop]` từ ảnh/lời + route đang mở, khoanh block. **Grep
   `.artifacts/states/registry.md` NGAY** (tên block) → ra story + luật canon chi phối liền tay; feedback chỉ vào 1
   FEATURE-component → tra block nó dựng trên. Rồi đọc source ĐÚNG file:line, KHÔNG đoán mò.
2. **Tra rule hiện có TRƯỚC khi tự chế** — `[main loop]` registry (bước 1) đã trỏ luật → mở ĐÚNG file đó, khỏi grep mù.
   Block chưa có trong registry mới grep từ khoá (tên block, "full width", "gap", token…) trong:
   - `.claude/patterns/fe` — feedback về CÁCH VIẾT CODE (props, import, cấu trúc component, hook…);
   - `.claude/fe` — về DESIGN, đúng nhà: token/gap/hover/a11y → `foundations/`+`principles/` · anatomy block →
     `components/` · shell/zone/flow/CTA → `patterns/`+`layouts/`.
   - **Rule ĐÃ có, code chỉ LỆCH** → drift: fix thẳng theo rule, KHÔNG viết mới. **Chưa nhà nào bàn** → rule MỚI → bước 3.
3. **Ghi rule MỚI trước-hoặc-cùng-lúc fix** — `[opus]` chọn nhà (code-style → `patterns/fe` · design → `fe/`). Giọng
   nhà đó: STRICT ngắn + **ví dụ THẬT ca này** (route/file), không lan man. Siết rule cũ → thêm "Đính chính (ngày)",
   không xoá câu cũ (giữ lịch sử drift). Rule CƠ HỌC (token/gap/border/uppercase…) → log 1 dòng
   `fe/enforcement/lint-candidates.md` — trừ khi `eslint-plugin-starci-fe` đã cover.
4. **Fix code gốc (CHỈ khi nhỏ/cơ học)** — `[sonnet · nhỏ→main loop]` 1-2 call-site, đổi class/prop/token, không đổi
   cấu trúc/IA, sửa ĐÚNG câu feedback. **Lớn hơn** (nhiều call-site, đổi cấu trúc) → `.artifacts/proposals/` route
   `starci-fe-build`, KHÔNG ôm.
5. **★ Reconcile UI-REF NGAY — KHÔNG hand-off, KHÔNG để sau** — `[sonnet]` fix đổi state/variant/màu 1 BLOCK có story
   → **tự cập nhật/thêm story same-session** để 3 lớp khớp (sửa component + ghi rule mà bỏ story = UI-ref drift).
   Feature không story riêng → demo ở BLOCK nền (*ca 2026-07-16:* `DailyQuest` state-marker → story `StateMarkers`
   của `SurfaceListCard`). Chỉ hand-off `starci-fe-story` khi story cần TÁI CẤU TRÚC lớn. Story tuân
   [[fe/methodology/storybook-story-conventions]]. **Bồi `registry.md`**: block vừa chạm → cập nhật dòng canon+concepts
   (đánh `✎`). **KHÔNG** ghi lớp-máy states (snapshot/diff — fe-sync) · **KHÔNG** `tags:['news']` (news = lane build).
6. **[Khi cần] SWEEP chỗ tương tự** — `[sonnet]` grep `registry.md` theo tên luật → BLOCK dính (reverse lookup nhanh).
   Sweep RỘNG/tái diễn → **ỦY THÁC `starci-fe-patterns-audit` rubric-2** (ledger `design-audit-fe.json`, git-diff chỉ
   file đổi — §Cache), KHÔNG tự full-scan. Batch apply sau khi thầy duyệt scope.
7. **Verify** — `npx tsc --noEmit` + eslint CẢ file component VÀ story. Storybook :6006 HMR tự áp → **báo thầy soi mắt**,
   KHÔNG drive browser verify hộ (chậm, treo pane).
8. **Finalize** — `[opus]` tự phản biện (§dưới) · chốt · báo thầy đã ghi rule gì/vào đâu · quyết push canon.

## Phân model (chốt 2026-07-16)
**opus** = diễn giải đa nghĩa + viết luật + finalize/reconcile · **sonnet** = scan/sweep/fix/apply/viết story (LUÔN ghi
brief) · main loop cho việc nhẹ. **Scan = sonnet** (chung tier action — KHÔNG haiku). Chi tiết [[model-allocation-3tier]].

**KHÔNG workflow-hóa lane này (chốt 2026-07-17).** Feedback cần human-in-loop — diễn giải feedback đa nghĩa (thầy chốt),
gate plan, eyeball UI (browser treo, chỉ thầy soi), duyệt scope sweep — mà Workflow chạy nền, không tương tác được →
ép vào workflow = mất gate = quay lại lỗi "sửa xong thầy mới chỉ". Chỉ **pha-6 sweep** mới workflow-able, và nằm trong
`starci-fe-patterns-audit` (không phải lane này).

## ★ Tự phản biện TRƯỚC khi báo "đã sửa" (bắt buộc)
Chuỗi lỗi CourseCard 2026-07-14 (danger→secondary→danger-soft; sửa `"line"` quên `"grid"`) đều sửa được <1s SAU khi
thầy chỉ — thiếu tự soát, không thiếu kiến thức. Trước khi báo xong:
- **Đọc HẾT section rule liên quan, không chỉ 1 rule vừa áp** — fix có phá rule KỀ BÊN trong cùng file không?
- **Kiểm bằng grep, không bằng lời kể** — đụng ≥2 render-site giống nhau (2 layout branch…) → grep lại TẤT CẢ.
- **Đừng chốt lựa chọn đầu tiên** — cân nhắc điểm giữa (danger↔secondary còn danger-soft).
- **Story (UI-ref) đã cập nhật chưa? 3 lớp đã khớp chưa?** — sửa component + ghi rule mà quên story là lỗi lặp lại
  (thầy phải nhắc "sao không update stories", 2026-07-16). Reconcile CẢ 3 mới coi là xong, không đợi hand-off.
- Tự hỏi: *"thầy sẽ chỉ chỗ nào tiếp?"* — trả lời được → sửa TRƯỚC.

## Ràng (STRICT)
- **`.claude/` write = NGOẠI LỆ có chủ đích của riêng skill này**, chỉ cho bước GHI RULE MỚI (bước 3) — mọi artifact
  động khác (proposal, state, concept) đi `.artifacts/` trong FE source. Ghi xong rule → báo thầy rõ đã ghi rule gì,
  vào file nào.
- **KHÔNG tự nâng cấp ngoài câu feedback** — thấy chỗ khác cũng lệch cùng rule → LIỆT KÊ ra, để thầy quyết fix luôn
  hay để lane scan quét full.
- **Không ghi rule không có ví dụ THẬT** (route/file cụ thể) — rule mơ hồ không neo được thì sau không ai tra lại.
- **Không dựng story "news" ở lane này** — feedback là sửa block/UI ĐÃ CÓ; story "news" + "Chờ duyệt" là của lane
  build/apply khi có surface/block MỚI.

## Cache scan — ĐỪNG full-rescan, ỦY THÁC patterns-audit rubric-2 (chốt+nối 2026-07-17)
Sweep "chỗ tương tự" (pha 6) mà quét lại CẢ `src/` mỗi lần = đốt token vô ích (ca 2026-07-16 rescan 76 file icon).
Cache = **git-diff incremental + ledger**, ĐÃ NỐI DÂY THẬT ở `starci-fe-patterns-audit` **rubric-2** (design-rule):
- **Ledger có sẵn:** `.artifacts/states/design-audit-fe.json` — `{ lastAuditCommit, rulesCovered[], openViolations[{rule,file,line,note}] }`. Đã seed từ sweep icon §6/§7 (FIXED 20 · 6 openViolations borderline giữ lại).
- **Lần sweep sau CHỈ soi phần đổi:** `git diff --name-only <lastAuditCommit> HEAD -- src` → soi **chỉ file ĐỔI** + re-check `openViolations` (đã fix chưa). File sạch chưa đụng → **bỏ qua hẳn**. Không đổi → dừng. → lần sau ~= số file commit gần đây, KHÔNG phải 76.
- **Feedback KHÔNG tự giữ ledger** (không ghi state — của audit). Pha-6 sweep RỘNG/tái diễn → **gọi `starci-fe-patterns-audit`** (nó chấm rubric-2 theo ledger). Feedback chỉ (a) fix chỗ GỐC, (b) reverse-lookup nhanh qua `registry.md`.
- **Rule design mới cần sweep** (ngoài icon §6/§7) → thêm 1 dòng `rulesCovered` trong `design-audit-fe.json` + baseline 1 lần (việc của patterns-audit), không tự chế ledger mới ở feedback.
- **Prompt-cache phiên** (TTL 1h) chỉ tái dùng trong 1 hội thoại, KHÔNG bền cross-run → ledger file mới là cache thật.

## Liên quan
- `starci-fe-build` — nhận escalate qua `.artifacts/proposals/` (build cả proposal block lẫn layout).
- `starci-fe-story` — bổ sung story khi fix lộ state chưa demo · `starci-fe-sync` — ghi `.artifacts/states` sau.
- `starci-fe-enforce` — build dòng lint-candidate thành ESLint rule thật (skill này KHÔNG tự build lint).
- Bản đồ canon: `fe/README.md` (taxonomy + methodology) · [[methodology/enforcement]].
