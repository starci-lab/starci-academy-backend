# Concept — Surface ĐÁNH GIÁ (thi/phỏng vấn thử): chấm CUỐI BUỔI (realistic) · đề RANDOM không tự chọn · workspace TOOL-TABS grader-aware · signal integrity feed cơ hội

> Heuristic assessment/interview (họ `concepts/*`). Rút từ Mock Interview (2026-06-21 → 2026-07-06, nhiều vòng). Bổ trợ [[fair-monetization-axiom]] · [[learning-surface-grounded-in-pedagogy-not-superficial-gamify]] · [[single-select-among-options-use-tabs]] · [[split-config-card-by-meaning-not-per-control]] · [[picker-popover-pin-default-search-below-scroll-results]] (GradeModelDropdown).

## Luật 1 (STRICT) — Chấm CUỐI BUỔI (grade-at-end), KHÔNG per-câu
- **Phỏng vấn/thi THỬ chấm CUỐI BUỔI:** trả lời hết N câu (ghi âm + transcript từng câu, **KHÔNG feedback giữa câu**) → cuối buổi grade batch → **1 scorecard** (điểm TB + verdict breakdown + weak tags + list per-câu). Đúng phỏng vấn thật (scorecard interviewing.io/Exponent), bớt friction chờ AI mỗi câu. Per-câu (drill) PHÁ ảo giác phỏng vấn → bỏ.
- **FE-only, KHÔNG cần BE batch endpoint:** BE grade vẫn stateless per-answer; FE **defer** — phase `active` STORE `pendingAnswers[]`, câu cuối → phase `grading` → loop grade tuần tự → phase `summary`. Phases: `setup | active | grading | summary`.

## Luật 2 (STRICT) — Signal integrity: thí sinh KHÔNG chọn đề; setup = 1 knob MỨC
- **Surface sinh điểm feed tín hiệu CƠ HỘI (job-readiness, recruiter-facing…): đề PHẢI random như thi thật, KHÔNG cho user tự chọn đề.** Tự chọn = luyện vùng an toàn = điểm inflate → tín hiệu hỏng ([[fair-monetization-axiom]]).
- **Setup còn ĐÚNG 1 quyết định = MỨC** (thang ordinal, `SegmentedControl`/wrap-radio). 2 knob trùng nghĩa "khó cỡ nào" (prompt difficulty + seniority) → GỘP 1: mức drive CẢ pool đề LẪN rubric strictness. Kèm caption "Đề chọn ngẫu nhiên như phỏng vấn thật".
- **Pool = capstone-first (moat: đề từ khóa) + progress-aware** (chỉ draw đề ≤ tiến độ học); classic/generic làm filler; **SERVER bốc đề** (mutation `startSession(courseId, level)` — không dead-end, không client Math.random) + giữ promptId/level SERVER để grade lookup (chống memorize-grader). Retry = đề MỚI cùng mức.
- **Feed cơ hội = NHẤT QUÁN 1 điều kiện lọc ở MỌI nơi đọc điểm:** cờ như `countsToReadiness` (buổi "luyện tủ" không feed) phải áp CẢ readiness-pillar LẪN recruiter-facing avg (grep bảng attempt khi thêm cờ, sửa hết) — bỏ sót 1 nơi = luyện tủ lọt vào điểm recruiter, phá đúng cái đang bảo vệ.
- Deliberate-practice ("luyện đúng bài này") = MODE PHỤ deep-link từ trang milestone, KHÔNG nhiễm default.

## Luật 3 (STRICT) — Workspace trả lời = TOOL TABS grader-aware
- **Vùng làm việc phỏng vấn/thi = 1 `TabsCard` TOOL TABS (Whiteboard · Code · Ghi chú)** — như CoderPad tab Code↔Drawing. KHÔNG hardcode 1 tool always-on. Mọi khóa đủ tool (ứng viên tự chọn); **default tab theo TRACK** (SD→Whiteboard · FS/DevOps→Code); **default Ghi chú** cho Q&A đa số trả lời bằng lời. Artifact persist per tab (lift state lên session); tab có nội dung → dot indicator trong `label` node (KHÔNG prop `icon` — N tab cùng icon = giống nhau).
- **CẤM "tool theater": artifact fold vào transcript PHẢI có NHÃN (`[Whiteboard]/[Code lang=…]/[Notes]`) VÀ grading/interviewer prompt PHẢI khai báo nhãn nghĩa gì + chấm theo loại.** Serialize câm (grader không biết đang đọc diagram) = effort không được chấm = theater. Không có artifact KHÔNG bị trừ điểm.

## Luật 4 — Đa-kind: RANDOM per-câu, KHÔNG cho chọn kind; kind bản-chất-khác-thời-lượng → tách MODE riêng
- **Đừng bắt user CHỌN kind; RANDOM per-câu như phỏng vấn thật** (interviewer hỏi lý thuyết/tư duy/tình huống lẫn lộn) → hiện NHÃN kind ("Câu 2/5 · Tình huống"). Kind = KHUNG áp lên câu (controlled-prompting theo Bloom), KHÔNG cần classify/label từng item.
- **Kind KHÁC bản chất THỜI LƯỢNG thì KHÔNG trộn pool:** Lý thuyết/Tư duy/Tình huống = 1 câu → trộn được. **Thiết kế hệ thống = 5-phase CẢ BUỔI** → tách **MODE riêng** (`mode: qna | design`), KHÔNG nhét vào random.
- **Nguồn ưu tiên = ngân hàng authored (flashcard) hơn AI-gen thuần** (author-viết có đáp án mẫu + keyword + level → chấm coverage rẻ + tin cậy, phủ mọi track). AI-gen chỉ bù khi (module × kind × level) mỏng.
- **Transfer-appropriate** ([[learning-surface-grounded-in-pedagogy-not-superficial-gamify]]): kind nào → format trả lời + cách chấm nấy (lý thuyết=coverage có ground-truth; tư duy/tình huống=rubric mở; thiết kế=5-phase). Scorecard GENERIC: BE set nhãn ("Câu N"/"phase") → 1 scorecard render mọi kind, KHÔNG branch UI theo kind.

## Luật 5 — Setup: sensible-default + progressive configure; MỌI control = WRAP-RADIO/chip, KHÔNG tabs
- **Mặc định Tự động** (random hết = thi thử, feed readiness, màn gọn) · mở **Tùy chỉnh** = luyện tủ (số câu · kiểu câu multi-select · cách trả lời). Chọn CATEGORY (kind) ≠ chọn ĐỀ (đề vẫn random trong category) → không vi phạm Luật 2. **Configurable KHÔNG feed job-readiness** (giữ readiness sạch).
- **MỌI control setup = `FlexWrapButtonRadio`/chip, KHÔNG segmented-tab, KHÔNG underline TabsCard** (thầy 2026-07-06: *"tabs không render theo kiểu option"*) — kể cả toggle Tự động/Tùy chỉnh + Mức. Multi-select "Kiểu câu": "Tất cả" exclusive.
- **`answerMode` (Nói/Gõ/Cả hai) = FE-only** (nắn composer: ẩn mic / ẩn text / cả 2), BE không cần.
- **Setup FLAT theo nghĩa** ([[split-config-card-by-meaning-not-per-control]]): meta-intro = strip phẳng chips dưới header (KHÔNG card); model chấm (phụ) xuống DƯỚI CTA self-label. Model chấm phỏng vấn = `GradeModelDropdown` lọc **mid-tier↑** (Balanced/Premium/Frontier, bỏ Free/Economy — phỏng vấn cần model giỏi).

## Liên quan
- [[fair-monetization-axiom]] (điểm phản ánh làm thật; feed cơ hội nhất quán) · [[learning-surface-grounded-in-pedagogy-not-superficial-gamify]] (transfer-appropriate) · [[single-select-among-options-use-tabs]] (SegmentedControl = thang) · [[split-config-card-by-meaning-not-per-control]] (setup flat) · [[grading-result-page-labeled-cards-verdict-hero-findings-accordion]] (scorecard) · [[attempt-history-selector-adaptive-and-grading-model-chip]] (model attribution) · [[picker-popover-pin-default-search-below-scroll-results]] (GradeModelDropdown).
