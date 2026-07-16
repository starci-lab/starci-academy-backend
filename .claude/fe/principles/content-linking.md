# Principle — Content Linking (Nối nội dung, không ngõ cụt)

> Nguyên tắc xuyên-suốt (họ `principles/*`). Rút từ `EntityLink`/`EntityToken` (feed reference), back-link/breadcrumb ([[header]] §3), CTA-loop trong `CTA.md` phần B (`UpNextCard`), và [[surface-lands-on-dashboard-no-auto-forward]] + [[continue-resumes-content-not-capstone]] (product) — mọi nơi StarCi ĐÃ chủ động nối 2 mảnh nội dung lại.

## Rule of thumb
**Không màn nào là ngõ cụt — mọi surface phải có đường ĐI TIẾP (funnel + resume + related), và mọi tham chiếu tới 1 thực thể khác phải bấm-được, mang đúng ý định.**

## Nguyên tắc
- **Mọi surface có ≥1 đường ONWARD.** Có nội dung → CTA tiếp theo (resume/continue, [[call-to-action]]); rỗng → không phải ngõ cụt mà là phễu về khóa/nội dung (`[Vào khóa học →]`, [[layout-must-funnel-to-courses-and-cover-full-data-state-matrix]]).
- **Tham chiếu tới 1 thực thể khác (user/bài/khóa/challenge) trong câu văn/feed = LINK bấm được, không phải text tĩnh.** `EntityLink` (feed) bold + click; không resolve được (đã xoá/lỗi) → vẫn bold plain text, KHÔNG render dead link giả-bấm-được. `EntityToken` (dashboard) resolve route qua global id trước khi navigate ([[opaque-global-id-must-decode-before-raw-id-mutation]]).
- **Deep-link phải MANG Ý ĐỊNH, không chỉ mang địa chỉ.** Scorecard "phỏng vấn thử" trỏ về đúng module/phase YẾU NHẤT vừa đo được (`weakestPhase` → `studyHref`), không trỏ về trang khóa chung — người học tới nơi VÌ MỘT LÝ DO đã tính sẵn.
- **Resume/continue đúng PHẠM VI của surface đang đứng** — content-home resume nội dung tiếp theo, KHÔNG nhảy sang capstone ([[continue-resumes-content-not-capstone]]); surface có dashboard riêng LAND ở dashboard, không auto-forward vào 1 item ([[surface-lands-on-dashboard-no-auto-forward]]).
- **Điều hướng LÙI luôn có đúng 1 affordance** — breadcrumb-chain cho trang duyệt, back-link đơn cho trang leaf (giải/kết-quả) — không để user kẹt không biết quay đầu đường nào ([[header]] §3).
- **Gợi ý "liên quan" KHÔNG được trỏ về CHÍNH surface đang đứng.** RAG/search suy query từ tiêu đề bài hiện tại → nó luôn khớp chính nó #1; phải LỌC self ra (`excludeId` = id nguồn hiện tại) trước khi render, nếu không "nên đọc thêm" lại chỉ về đúng trang đang mở = bug ([[related-content-list-row-accent-read-cta-not-snippet-panel]]).
- **Empty-state cũng là 1 đường-đi, không phải thông báo chết.** "Chưa có gì" tự nó vô dụng; luôn kèm 1 link/CTA đưa người học tới nơi TẠO ra nội dung đó ([[labeled-section-render-empty-not-self-hide]] + [[layout-must-funnel-to-courses-and-cover-full-data-state-matrix]]).

> Đã áp: `EntityLink` (`blocks/feed/EntityLink`) + `EntityToken` (`features/dashboard/EntityToken`) — reference bấm được trong feed/dashboard, resolve route qua global id, fallback bold-text khi không resolve được (không dead link) · `MockInterviewScorecard` — CTA primary deep-link `studyHref` vào đúng phase yếu nhất trong khóa, capstone hạ xuống tertiary · `UpNextCard` cuối bài học/phiên flashcard — luôn có 1 "việc kế" cụ thể, không kết thúc lơ lửng · `RelatedContentList` (RAG "nội dung liên quan", 6 surface /learn) — mỗi gợi ý là LINK-ROW gọn + CTA accent "Đọc →", KHÔNG panel snippet nhìn như accordion ([[related-content-list-row-accent-read-cta-not-snippet-panel]]).

## Liên quan
- [[call-to-action]] · [[surface-lands-on-dashboard-no-auto-forward]] · [[continue-resumes-content-not-capstone]] · [[layout-must-funnel-to-courses-and-cover-full-data-state-matrix]] · [[header]] §3 (back-link/breadcrumb) · [[labeled-section-render-empty-not-self-hide]] · [[related-content-list-row-accent-read-cta-not-snippet-panel]] (cách RENDER gợi ý liên quan).
