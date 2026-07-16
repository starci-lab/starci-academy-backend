---
name: starci-fe-block
description: >
  Thiết kế/nắn MỘT BLOCK (1 component tái dùng: card, chip, tooltip, meter, form field, price block, …) của app FE
  chính (`$FE_SOURCE`, branch mtp) — chốt anatomy · variants · states
  (loading/empty/error/disabled/hover/selected) · props (WithClassNames discipline) · element-compliance (dùng
  primitive HeroUI/block canonical nào, KHÔNG hand-roll). Phạm vi NHỎ, ít effort hơn hẳn layout cả flow/page. Nguồn
  sự thật: **Storybook qua `.artifacts/states`** (fe-sync giữ, khỏi rescan src) + `.artifacts/concepts` (định hướng
  feature) + canon `.claude/fe/axis-1-rules` (read-only) + source thật của block; **KHÔNG
  search web** — thiếu dữ kiện/không chắc → DỪNG hỏi thầy. Opt-in **fan-out**: khi thầy muốn "cho xem options" thay
  vì 1 đáp án, đẻ 3–5 hướng KHÁC NHAU THẬT (mỗi hướng 1 trục nêu tên được — vị trí + loại/trọng-lượng element +
  tồn-tại element, không phải 5 bản đổi màu) render so sánh cạnh nhau, lưu `.artifacts/prototypes`. Skill này KHÔNG
  build code — chốt xong ghi spec vào `.artifacts/proposals` bàn giao `starci-fe-build`. Trigger khi user gõ
  `/starci-fe-block <block>`, hoặc nhờ thiết kế/nắn/so-phương-án 1 component/block đơn lẻ.
---

# /starci-fe-block — Thiết kế/nắn 1 BLOCK (nhẹ, 1 component, opt-in fan-out)

> ★ **Đồng bộ 3 lớp** (chân lý `.claude/fe` · story = UI-ref · component = UI-trên-nền): mọi thay đổi skill này tạo ra PHẢI reconcile CẢ 3 → luật `.claude/fe/principles/three-layer-sync-truth-story-ui.md` · recipe `.claude/fe/patterns/reconcile-three-layers-on-change.md`.

Bản NHẸ của `starci-fe-layout`: chỉ **1 block**, KHÔNG cả flow/page. Dùng khi thay đổi **nằm trong 1 block**.
Skill này chỉ THIẾT KẾ — code là việc của `starci-fe-build`.

## Nền tra (đọc TRƯỚC, đừng tự chế) — STRICT
- **`.artifacts/states`** (FE source, do `starci-fe-sync` giữ từ Storybook + git-diff) — block đã render gì, vừa đổi gì. Đọc ĐÂY thay vì rescan `src/`; states cũ/thiếu → gọi `starci-fe-sync`, KHÔNG tự ghi states.
- **`.artifacts/concepts`** — block gắn feature nào thì đọc định hướng ở đây; thiếu → hỏi thầy.
- **Canon `.claude/fe/axis-1-rules/RULES.md`** (READ-ONLY, cấm ghi) — component canonical (Button/Card/Input/Tabs/Chip/Icon/Label/Modal…, có sẵn thì DÙNG/nắn, đừng đẻ trùng) + token nền (màu/spacing/radius/typography) + heuristic (accent · hover-theo-bản-chất · a11y · disable-vs-lock).
- **Source thật** của block: `src/components/blocks/<cat>/<Block>/index.tsx` — chỉ mở khi states/concepts chưa đủ.
- **Code-style khi viết spec:** brief theo [[patterns/fe]] (`.claude/patterns/fe`) để `starci-fe-build` code không lệch.
- **KHÔNG search web.** Block-type chưa có ref canon / không chắc → **DỪNG, HỎI thầy** — không tự chế.

## Quy trình mặc định (1 đáp án đúng)
1. **Khoanh block** — tên + folder source + mục canonical trong `.claude/fe/axis-1-rules/RULES.md` nếu có + story hiện có trong `.artifacts/states`.
2. **Anatomy** — cấu trúc bên trong; mỗi phần tử phải có LÝ DO theo job của block.
3. **Variants** — size/tone/variant theo NỀN (background→primary, surface→secondary), không đẻ variant thừa.
4. **States** — có data: loading(skeleton mirror)/empty/error; luôn: default/hover/focus/disabled/selected. Hover **theo bản chất** (go-there→underline · user→opacity · stay→fill).
5. **Props** — `*Props extends WithClassNames`; container tự đọc store/SWR, KHÔNG prop-drill data/callback thừa; 1 component = 1 folder `index.tsx`.
6. **Element-compliance** — ráp từ **primitive canonical** (HeroUI/block sẵn trong `.claude/fe/axis-1-rules/RULES.md`), CẤM hand-roll `<div border>`/`<button hover:bg>`; icon = Phosphor. Element mới không có canon → hỏi thầy.
7. **Prototype :8080 (BẮT BUỘC)** — render 1 trang HTML bấm-được cho block: các variant + đủ state (default/hover/focus/disabled/loading/empty/error) cạnh nhau, host :8080, lưu `.artifacts/prototypes/<block>.html`. Block CŨNG có prototype — thầy phải NHÌN được block thật, không chỉ tả chữ.

## Fan-out mode (OPT-IN — khi thầy muốn "cho xem options")
Thay vì chốt 1 đáp án, đẻ **3–5 hướng KHÁC NHAU THẬT** cho cùng block:
- Mỗi hướng vary trên **1 trục thật, nêu tên được** — KHÔNG phải 5 bản đổi palette, KHÔNG phải 5 bản chỉ xê dịch vị trí CÙNG một bộ element (lỗi cũ đã bị bắt: 5 bản đều giữ nguyên cặp Link+icon-button, chỉ đổi chỗ).
- Bắt buộc phủ đủ 3 loại trục: **vị trí** + **loại/trọng-lượng element** (Link vs Button · size · 1-loud+1-quiet vs 2-equal) + **tồn tại** (dám BỎ hoặc THÊM element nếu job của bề mặt cho phép).
- Mỗi hướng vẫn ground vào block canonical (không hand-roll primitive) + qua đủ checklist self-verify bên dưới.
- Render **1 trang HTML tĩnh so sánh dạng grid** (nhìn cạnh nhau, không slide-through) → lưu `.artifacts/prototypes/<block>-variants.html` cho thầy eyeball và chọn. Hướng được chọn mới đi tiếp bàn giao.

## Self-verify lite (tự chấm trước khi trình)
- [ ] không tự chế primitive (ráp từ canon) · [ ] variant theo NỀN · [ ] hover theo bản chất · [ ] a11y (focus-ring, aria icon-only, contrast) · [ ] props WithClassNames, không prop-drill · [ ] data → đủ 4-state · [ ] fan-out: các hướng khác nhau trên trục THẬT.

## ★ Tự phản biện TRƯỚC khi trình (bắt buộc)
Đóng vai thầy tìm chỗ SẼ bị bắt bẻ: anatomy/variant này có phá rule KỀ BÊN trong cùng section canon vừa đọc không
(đừng chỉ áp đúng 1 rule đang chăm chú)? Đã cân phương án thứ 2 chưa hay chốt ngay cái đầu nghe hợp lý? Tìm ra lỗ
→ sửa TRƯỚC khi trình.

## Bàn giao brainstorm — GHI RÕ 3 THỨ (BẮT BUỘC)
Xong brainstorm block, proposal + tin chốt PHẢI nêu đủ:
1. **Prototype :8080** — URL đang host + `.artifacts/prototypes/<block>.html` (variant + state bấm-được). Block cũng có prototype, không chỉ tả chữ.
2. **BẢNG component → Storybook** — block này (+ sub-component nếu có) sẽ THÊM/SỬA story nào, state demo gì:

   | Component | Story | Mới / Sửa | State demo thêm |
   |---|---|---|---|

3. **Nguồn tham khảo** — ground vào đâu (THẬT): `.artifacts/concepts/<x>` · `.artifacts/states/diff.md` · `.claude/fe/axis-1-rules/RULES.md` · source `<file:line>`. **KHÔNG web** — thiếu thì đã hỏi thầy.

## Ghi / bàn giao — STRICT
- **GHI:** `.artifacts/proposals/<block>.proposal.md` (spec block đã chốt: anatomy · variants · states · props · element map · files-to-touch) + prototype `.artifacts/prototypes/<block>.html` (+ fan-out: `<block>-variants.html`).
- Thêm 1 dòng **⏳ PENDING** vào `.artifacts/proposals/BACKLOG.md` (hàng đợi = nguồn duy nhất biết cái nào làm rồi/chưa; tạo file nếu chưa có).
- **CẤM GHI:** `.claude/**` (rule read-only trong vòng lặp) · `.artifacts/states` (chỉ `starci-fe-sync` ghi).
- **Bàn giao `starci-fe-build`** (thường ngay session này — block nhỏ): build theo spec + đẩy STORY "news" (`tags: ['news']` + caption "Chờ duyệt") lên Storybook cho thầy duyệt.
- Thay đổi trải nhiều surface/cả trang → sang `starci-fe-layout`, không cố nhét vào block.

## Phân model (fan-out / nhiều pha)
Khi skill này fan-out hoặc chia pha, phân model theo VAI:
- **fable — deep thinking**: rescan/phân tích/ra nhận định nhanh, quyết hướng (decide).
- **sonnet — action**: quét · scan · build · sửa (làm việc thật). **LUÔN ghi brief** kết quả lại (file/`.artifacts`), đừng giữ trong đầu — pha finalize cần đọc.
- **opus — finalize**: đọc mọi brief → synthesize · chốt · quyết định cuối + ghi state.
