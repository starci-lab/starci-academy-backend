# Principle — Affordance & Feedback

> Nguyên tắc xuyên-suốt (họ `principles/*`). Umbrella gom [[interactive-needs-hover]] + [[hover-style-matches-clickable-nature]] (affordance khi BẤM) với luật render rỗng/resume ([[labeled-section-render-empty-not-self-hide]], [[resume-cta-only-when-away]], [[asynccontent-remove-debug-hold]] — feedback khi CHỜ/KHÔNG-CÓ) thành 1 nguyên tắc: UI phải luôn TRẢ LỜI, không bao giờ im lặng.

## Rule of thumb
**Mọi thứ bấm-được phải TRÔNG bấm-được (hover + cursor + focus); mọi vùng chờ-dữ-liệu phải xử lý rõ 3 trạng thái loading/empty/error — không bao giờ im lặng render rỗng hoặc render vô-tác-dụng.**

## Nguyên tắc
- **MỌI interactive** (button, row mở drawer, link, chip bấm) phải có hover state + `cursor-pointer` + focus ring, kích bằng CẢ element qua `group` — KHÔNG chỉ trúng khi hover đúng text con.
- **KIỂU hover khớp bản chất hành động** — go-there (điều hướng) → underline title; user-identity (avatar+tên) → opacity cả cụm; stay-here (accordion/select tại chỗ) → fill nền. Không một-cỡ-cho-mọi-hover.
- **Vùng fetch dữ liệu = `error → loading → empty → content`**, đủ cả 4 nhánh. Section có NHÃN trên trang user chủ động mở → rỗng PHẢI render empty-state có nghĩa (icon+title+hint), KHÔNG `return null` tự ẩn.
- **CTA chỉ hiện khi CÓ TÁC DỤNG** — "Tiếp tục/Resume" ẩn khi đã đang ở đúng vị trí đó (nút no-op không được render).
- **Đừng giả-loading:** không dùng timer/hold nhân tạo để "cho thấy đang tải" — skeleton chỉ hiện đúng thời gian load thật.

> Đã áp: [[interactive-needs-hover]] + [[hover-style-matches-clickable-nature]] (hover bắt buộc + đúng kiểu theo bản chất) · [[labeled-section-render-empty-not-self-hide]] (rỗng = empty-state, không tự ẩn) · [[resume-cta-only-when-away]] (CTA ẩn khi vô tác dụng) · [[asynccontent-remove-debug-hold]] (bỏ 3s-hold giả-loading).

## Liên quan
- [[interactive-needs-hover]] · [[hover-style-matches-clickable-nature]] · [[labeled-section-render-empty-not-self-hide]] · [[resume-cta-only-when-away]] · [[asynccontent-remove-debug-hold]] · [[grounded-in-data]] (empty vì data thật rỗng — 2 nguyên tắc cùng gặp ở empty-state).
