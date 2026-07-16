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

Thầy đang nhìn UI CHẠY THẬT (app hoặc Storybook), chỉ tay 1 chỗ, nói 1 câu. Rule đó **có thể chưa từng được ghi** ở
đâu. Việc của skill: xác định ĐÚNG chỗ → tra rule → fix nhỏ → và **luôn chốt rule về đúng nhà** trước khi coi là xong
— không ghi thì feedback y hệt sẽ lặp lại ở surface khác.

## Nguồn (đọc/ghi gì)
- **FE source:** `$FE_SOURCE` (mtp)
- **Đọc:** `.artifacts/states` (map block↔story↔file, fe-sync giữ — khỏi rescan src) · `.claude/fe` (design rules,
  3 trục — [[methodology/three-axis]]) · `.claude/patterns/fe` (code-style FORCE) · source thật của call-site.
- **Ghi:** code fix trong `src/` · rule mới vào `.claude/patterns/fe` hoặc `.claude/fe` (ngoại lệ SETUP — xem §Ràng)
  · nếu escalate: `.artifacts/proposals/<tên>.proposal.md`.
- **KHÔNG ghi:** `.artifacts/states` (của fe-sync) · KHÔNG search web — thiếu dữ kiện (không rõ route/block nào,
  feedback đa nghĩa) → DỪNG hỏi thầy, không đoán.

## Quy trình
1. **Định vị call-site THẬT** — từ ảnh/lời + route/story đang mở, tra `.artifacts/states` để khoanh block, rồi grep +
   đọc source ĐÚNG file:line trước khi sửa. KHÔNG đoán mò.
2. **Tra rule hiện có TRƯỚC khi tự chế** — grep từ khoá liên quan (tên block, "full width", "gap", token…) trong:
   - `.claude/patterns/fe` — nếu feedback về CÁCH VIẾT CODE (props discipline, import, cấu trúc component, hook…);
   - `.claude/fe` — nếu về DESIGN, đúng trục: render global (token/gap/hover/a11y) → [[axis-1-rules/RULES]] ·
     block↔data-shape/anatomy → [[axis-2-biz-ui/RULES]] · shell/zone/flow/CTA → [[axis-3-layout/RULES]].
   - **Rule ĐÃ có, code chỉ LỆCH** → drift bug: fix thẳng theo rule đã ghi, KHÔNG viết rule mới.
   - **Chưa nhà nào bàn** → rule MỚI thầy vừa dạy → bước 3.
3. **Ghi rule MỚI trước-hoặc-cùng-lúc fix (không để sau)** — chọn nhà theo bản chất (code-style → `patterns/fe` ·
   design → `fe/` đúng trục như bước 2). Viết theo giọng nhà đó: STRICT ngắn + **ví dụ THẬT từ ca này**
   (route/file/screenshot), không lan man. Rule cũ cần siết → thêm mục "Đính chính (ngày)" thay vì xoá câu cũ (giữ
   lịch sử drift tra được). Feedback trục-1 CƠ HỌC (máy kiểm được: token/gap/border/uppercase…) → log thêm 1 dòng
   `fe/enforcement/lint-candidates.md` ([[methodology/enforcement]]) để lên máy dần — trừ khi `eslint-plugin-starci-fe`
   đã có rule cover sẵn.
4. **Fix code same-session (CHỈ khi nhỏ/cơ học)** — 1-2 call-site, đổi class/prop/token, không đổi cấu trúc/IA. Code
   tuân `.claude/patterns/fe`. Sửa ĐÚNG câu feedback, không tự thêm ý.
   - **Lớn hơn** (nhiều call-site rải feature, đổi cấu trúc/layout, cần quyết định thêm) → KHÔNG ôm: ghi
     `.artifacts/proposals/<tên>.proposal.md` (PENDING) → route `starci-fe-build`.
5. **Verify** — `npx tsc --noEmit` + eslint file đã sửa. Storybook :6006 đang mở → HMR tự áp, **báo thầy refresh soi
   bằng mắt**, KHÔNG drive browser verify hộ (chậm, treo pane). Fix đổi hẳn variant/state của block có story mà story
   chưa demo → giao `starci-fe-story` bổ sung; KHÔNG tự ghi `.artifacts/states`.

## ★ Tự phản biện TRƯỚC khi báo "đã sửa" (bắt buộc)
Chuỗi lỗi CourseCard 2026-07-14 (danger→secondary→danger-soft; sửa `"line"` quên `"grid"`) đều sửa được <1s SAU khi
thầy chỉ — thiếu tự soát, không thiếu kiến thức. Trước khi báo xong:
- **Đọc HẾT section rule liên quan, không chỉ 1 rule vừa áp** — fix có phá rule KỀ BÊN trong cùng file không?
- **Kiểm bằng grep, không bằng lời kể** — đụng ≥2 render-site giống nhau (2 layout branch…) → grep lại TẤT CẢ.
- **Đừng chốt lựa chọn đầu tiên** — cân nhắc điểm giữa (danger↔secondary còn danger-soft).
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

## Liên quan
- `starci-fe-build` — nhận escalate qua `.artifacts/proposals/` (build cả proposal block lẫn layout).
- `starci-fe-story` — bổ sung story khi fix lộ state chưa demo · `starci-fe-sync` — ghi `.artifacts/states` sau.
- `starci-fe-enforce` — build dòng lint-candidate thành ESLint rule thật (skill này KHÔNG tự build lint).
- Bản đồ canon: `fe/README.md` (3 trục + methodology) · [[methodology/three-axis]] · [[methodology/enforcement]].
