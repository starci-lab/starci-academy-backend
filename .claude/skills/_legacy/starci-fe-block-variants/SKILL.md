---
name: starci-fe-block-variants
description: >
  Sibling of `starci-fe-block-brainstorm` — instead of settling on ONE design for a block, fan out 5 GENUINELY
  different redesign directions for ONE existing component (card, button row, footer action, price block, …) in the
  MAIN StarCi Academy web app (`C:\Repositories\starci-academy`), each grounded in real canon blocks (no hand-rolled
  primitives) and each varying on a real, nameable axis — NOT 5 near-identical palette swaps, and NOT 5 variants that
  only rearrange the SAME elements' position (a real prior failure: all 5 kept the same Link+icon-button pair and
  only moved them around). Must span position AND element type/weight (Link vs Button, size, 1-loud+1-quiet vs 2
  equal) AND existence (dare to drop or add an element if the surface's job calls for it). Renders all 5 side-by-side
  in ONE static HTML page (grid comparison, not a
  slide-through flow) hosted on :8080 for the teacher to eyeball and pick from. FE-only, no backend — pure
  visual/layout exploration of an existing block's internals. Does NOT build anything itself; hands the picked
  direction to `starci-fe-block-apply`. Use this INSTEAD of `starci-fe-block-brainstorm` when the ask is "show me
  options" rather than "design the right answer". Trigger when the user types `/starci-fe-block-variants <component>`,
  or asks to suggest/compare several redesigns of one component/block via prototype.
---

# /starci-fe-block-variants — 5 hướng redesign 1 BLOCK, so sánh cạnh nhau

Sibling của `starci-fe-block-brainstorm`: thay vì chốt 1 thiết kế, fan-out **5 hướng THỰC SỰ khác nhau** cho **1 block/component đã có sẵn** — không phải cả layout/flow, không đụng BE. Dùng khi thầy muốn **xem lựa chọn** trước khi chốt, không phải khi đã biết muốn gì (lúc đó dùng thẳng `starci-fe-block-brainstorm`).

## Nền tra (đọc TRƯỚC, đừng tự chế)
- **`.claude/fe/components/INDEX.md`** + `components/<block>.md` (canon block đó, nếu có) — mọi hướng đề xuất phải dùng block/primitive CANONICAL đã liệt kê ở đây, không hand-roll.
- **`fe/foundations/`** (token màu/spacing/radius/typography) + **`fe/principles/`** (1 CTA primary/bề mặt, hover-theo-bản-chất, a11y, fair-monetization).
- **Source THẬT** của component đang redesign: `src/components/blocks/<cat>/<Block>/index.tsx` (đọc kỹ — anatomy/props/state hiện tại là điểm xuất phát, không đoán).
- **`.claude/fe/prototypes/_TEMPLATE.html`** + `INDEX.md` — dùng lại token CSS (`fe/foundations/color`) và kỷ luật host, nhưng bố cục KHÁC (grid so-sánh, không phải slide next/prev — xem §Prototype).

## Quy trình
1. **Khoanh 1 component thật** — path source, đọc anatomy/props/variant HIỆN TẠI (đây là "hướng 0" ngầm, đối chiếu để 5 hướng mới thực sự khác nó chứ không lặp lại).
2. **Sinh 5 HƯỚNG — BẮT BUỘC sáng tạo thật, KHÔNG chỉ hoán vị vị trí đúng bộ phần tử cũ (CHỐT 2026-07-14, sau ca `CourseCard` round 1):**
   - **Bẫy đã mắc thật, đừng lặp lại:** lần đầu áp cho `CourseCard`, cả 5/5 hướng đều GIỮ NGUYÊN đúng 3 phần tử gốc (PriceTag/Link/action-icon) và chỉ đổi VỊ TRÍ đứng — không hướng nào dám hỏi "phần tử này có cần tồn tại không" hay "nên đổi LOẠI phần tử không". Thầy chê thẳng: *"sao không gợi ý render 2 nút lớn, hay ở đây không cần cart button?"* — đúng, đó là 2 trục bị bỏ sót hoàn toàn vì chỉ mải hoán vị chỗ đứng. **"Redesign lại layout mới" ≠ sáng tạo — chỉ là sắp xếp lại y hệt.**
   - 5 hướng phải trải **ĐỦ CẢ 3 LOẠI biến đổi** dưới đây (không được cả 5 hướng cùng thuộc 1 loại):
     - **(i) Vị trí/bố cục** — đổi chỗ đứng của phần tử (như trước). Tối đa **2/5** hướng thuộc loại này — không được lấy hết quota vào đây.
     - **(ii) LOẠI/TRỌNG SỐ phần tử (bắt buộc ≥1 hướng)** — đổi hẳn KIỂU render, không chỉ chỗ đứng: Link nhẹ ↔ Button rõ ràng (`variant="primary"`/`"secondary"`) ↔ icon-only ↔ label+icon ↔ pill gộp; size `sm`↔`lg`; "1 CTA loud + 1 CTA quiet" ↔ "2 CTA cùng trọng số" (dù có thể phá luật 1-primary — vẫn PHẢI dựng ra để thầy tận mắt thấy tại sao đúng/sai, không chỉ nói suông là "vi phạm nên bỏ qua").
     - **(iii) TỒN TẠI hay KHÔNG (bắt buộc ≥1 hướng)** — dám đề xuất **BỎ HẲN** 1 phần tử nếu nghi ngờ JOB thực sự không cần nó tại bề mặt này (vd: "catalog-grid job là duyệt/khám phá — cart-add có cần ở ĐÂY hay nên chỉ có ở trang chi tiết, nơi user đã quyết?"), hoặc **THÊM** 1 phần tử hoàn toàn mới nếu nó giải quyết JOB tốt hơn — CHỈ khi có **DATA THẬT** để hiện (field đã tồn tại/persist), không bịa số liệu.
   - Mỗi hướng vẫn phải đặt **TÊN TRỤC rõ ràng**, và: (a) gắn tên **block canonical thật** cho mọi phần tử con (giống element-aware của layout-brainstorm — không để hình generic vô danh), (b) **không phá luật cứng đã chốt** (1 CTA primary/bề mặt, contrast, a11y) TRỪ KHI chính luật đó là trục đang thử nghiệm (nói rõ nếu vậy — loại (ii)/(iii) THƯỜNG XUYÊN sẽ đụng luật cứng, đó là mục đích), (c) 1-2 dòng **trade-off thật** (được gì/mất gì, không tô hồng).
3. **Dựng prototype SO SÁNH (không phải slide luồng)** — 1 file HTML tự chứa, layout **grid 5 cột** (hoặc 5 hàng nếu component quá rộng để ngang), mỗi cột = 1 hướng, có nhãn tên trục + trade-off ngay dưới. Dùng lại token màu từ `_TEMPLATE.html`, `.blocktag` đánh dấu block thật, KHÔNG dùng cơ chế Next/Prev/screen của template (đó là cho đi LUỒNG nhiều pha — ở đây mục đích là nhìn cả 5 CÙNG LÚC). Responsive: `>=lg` grid 5 cột, hẹp hơn thì wrap xuống 2-3 cột rồi 1 cột (không cuộn ngang che mất cột).
4. **Host :8080 (STRICT, giống layout-brainstorm) — tránh phục vụ nhầm prototype CŨ:**
   - `netstat -ano | grep :8080 | grep LISTENING` → nếu có, **KILL** process đó hoặc **scan port +1** tới khi free.
   - `python -m http.server <port> --directory <thư mục file>` (chạy nền); không có python → `npx http-server -p <port>`.
   - **BẮT BUỘC verify nội dung** — `curl :<port>` grep 1 marker DUY NHẤT (`<title>` chứa tên component) — KHÔNG dừng ở HTTP 200 (200 có thể là prototype CŨ còn sống). Sai marker → kill + serve lại.
   - Đưa URL cho thầy CHỈ SAU KHI verified.
5. **★ TỰ ĐỀ XUẤT 1 HƯỚNG KHUYẾN NGHỊ (bắt buộc, đừng chỉ trình 5 hướng trung lập rồi im)** — ngay sau khi đưa URL, chấm điểm 5 hướng dựa trên canon/principles THẬT (không cảm tính): hướng nào **không phá luật cứng đã chốt** (trừ khi thầy đang cố tình muốn thử phá) · hướng nào **đúng tông** `fair-monetization`/outcome-first của app (không ngả về "thương mại hoá" quá đà) · hướng nào ít rủi ro triển khai (không cần bịa primitive mới, không làm phức tạp state đã có) · hướng nào đúng JOB của bề mặt (vd catalog cần mật độ cao/duyệt nhanh). Nêu **1 hướng được chọn + lý do ngắn gọn**, so sánh nhanh với hướng á quân nếu sít sao — thầy vẫn toàn quyền đảo ngược, nhưng skill phải chủ động đưa quan điểm, không đẩy hết quyết định về phía thầy.
6. **Thầy chọn 1 hướng (theo đề xuất ở bước 5, hoặc tự chọn khác/yêu cầu trộn 2 hướng)** → hỏi ngắn "áp dụng hướng X luôn qua `starci-fe-block-apply` không?" — bàn giao, **KHÔNG tự build** ở skill này (giữ đúng ranh giới brainstorm-vs-apply như mọi skill khác trong bộ).

## Self-verify (tự chấm trước khi đưa thầy xem — hiện thân của `.claude/fe/principles/self-critique-before-presenting.md`)
> Cả section này CHÍNH LÀ bước "tự đóng vai thầy phản biện trước khi trình" — §sáng-tạo bên trên (ca `CourseCard` round 1: 5/5 hướng chỉ hoán vị vị trí) là ví dụ kinh điển của bẫy "chốt ở đáp án đầu tiên thỏa mãn đúng chữ yêu cầu". Tự hỏi thẳng: *"thầy sẽ nói '5 cái này giống nhau' / 'sao bỏ sót hướng hiển nhiên' không?"* — có → chưa được trình.
- [ ] Đủ 5 hướng (hoặc N nếu thầy gõ số khác qua args), không hướng nào là bản sao gần-giống hướng khác
- [ ] **KHÔNG cả 5 hướng cùng loại "chỉ đổi vị trí"** — có ít nhất 1 hướng đổi LOẠI/TRỌNG SỐ phần tử (ii) + 1 hướng thử BỎ/THÊM phần tử (iii)
- [ ] Mỗi hướng có TÊN TRỤC rõ ràng + trade-off thật (không tô hồng)
- [ ] Mọi phần tử gắn đúng tên block canonical thật (không hình generic vô danh, không bịa tên block)
- [ ] Không phá luật cứng (1 CTA primary, contrast, a11y) trừ khi đó chính là trục đang thử — nói rõ nếu có
- [ ] Prototype là SO SÁNH cạnh nhau (grid), không phải slide đi từng màn
- [ ] Port :8080 đã verify marker đúng component này, không phải prototype cũ
- [ ] Responsive: không cuộn ngang che cột trên màn hẹp
- [ ] Đã tự đề xuất 1 hướng khuyến nghị kèm lý do (không trình 5 hướng trung lập rồi im chờ thầy chọn)

## Bàn giao / liên quan
- Hướng đã chọn → build qua **`starci-fe-block-apply`** (đọc spec hướng đã chọn + `fe/components/<block>.md` + source thật).
- Đã biết muốn thiết kế gì, không cần xem nhiều lựa chọn → dùng thẳng **`starci-fe-block-brainstorm`**.
- Đổi cả layout/flow nhiều trang, không phải 1 block → **`starci-fe-layout-brainstorm`**.
- Canon: `fe/components/` · `fe/foundations/` · `fe/principles/` · `fe/prototypes/` · `fe/README.md`.
