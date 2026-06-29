# Draft — Phỏng vấn thử: chấm CUỐI BUỔI (defer N câu → grade batch → scorecard) + chọn MODEL chấm (mid+ Balanced↑) (2026-06-21)

- File/§ đích khi `/merge`: `concepts/` (interview/grading flow) + [[grading-result-page-labeled-cards-verdict-hero-findings-accordion]] (scorecard) + [[attempt-history-selector-adaptive-and-grading-model-chip]] (model attribution) + [[picker-popover-pin-default-search-below-scroll-results]] (GradeModelDropdown).
- Bối cảnh: `InterviewSession` (Ôn tập → Phỏng vấn thử). Thầy chốt: bỏ rail (1 cột) + **chấm cuối buổi** (không từng câu) + **chọn model phỏng vấn từ mid trở lên**.

## Luật 1 (STRICT) — Mock interview = GRADE-AT-END (realistic), KHÔNG per-câu
- **Phỏng vấn THỬ chấm CUỐI BUỔI**: trả lời hết N câu (ghi âm + transcript từng câu, **KHÔNG feedback giữa câu**) → cuối buổi loop `gradeInterviewAnswer` N lần → **1 scorecard** (điểm TB + verdict breakdown pass/borderline/fail + weak tags + **list per-câu** verdict/score/strengths/gaps/hint). Đúng phỏng vấn thật (interviewing.io/Exponent scorecard), bớt friction "chờ AI sau mỗi câu". Per-câu (drill) = phá ảo giác phỏng vấn → bỏ.
- **FE-only, KHÔNG cần BE batch endpoint**: BE `gradeInterviewAnswer` vẫn stateless per-answer; FE **defer** — `active` phase chỉ STORE `pendingAnswers[]`, last answer → phase `grading` → `runGrading(answers)` loop tuần tự → phase `summary`. Phases: `setup | active | grading | summary`.

## Luật 2 (STRICT) — Chọn model chấm = `GradeModelDropdown`, lọc MID-TIER↑ (Balanced/Premium/Frontier)
- **Phỏng vấn cần model GIỎI** → picker chỉ offer **mid trở lên**: `category ∈ {Balanced, Premium, Frontier}` (bỏ Free/Economy) + `supportedTasks ⊇ {Grading}`. Reuse block **`GradeModelDropdown`** (`task=AiModelTask.Grading`, `floor=AiModelCategory.Balanced`, `showAutoLane`, `canPremium` từ `myAiSettings`, `onUpgrade`→ai-subscription). Nhãn nhóm `<Label>` "Model phỏng vấn". Default = Auto (balancer).
- Catalog từ `aiModels.gradableModels` (`useQueryAiModelsSwr`). Selection `{mode,model,provider}` (`GradeModelSelection`) → truyền `selectedModel/selectedModelProvider` vào MỖI grade call cuối buổi (omit khi Auto).
- **⚙️ BE delta (ĐÃ làm):** `gradeInterviewAnswer` thêm `selectedModel?/selectedModelProvider?` (request + handler + `interview-grading.service`) → `GradingLaneValidationService.validate()` + `validatedLaneToAiJobSelection()` → `aiInvokeService.run({selection})`. Mirror challenge grading; KHÔNG migration. ⚠️ **BE restart** (start:dev watch tự reload) để schema có field mới — nếu không, picking model lỗi "unknown input field" (Auto vẫn chạy vì omit field).

## Layout (bỏ rail — [[when-rail]])
- Cả surface Ôn tập **no-rail** (cả Học thẻ + Phỏng vấn). Mode switch (Học thẻ⇆Phỏng vấn) = `SegmentedControl` đầu pane (desktop `hidden lg:block` + mobile `FlashcardMobileNav`). Deck list (Học thẻ) → in-pane `FlashcardDeckList` (grid/line toggle — [[list-grid-line-view-toggle-and-thin-card-meter]]).

## ĐÃ ÁP DỤNG 2026-06-21 (workflow `wko1yyyqa`, FE+BE)
- BE: `grade-interview-answer` model-select delta (request/handler/service + FE mutation type). FE: `Flashcards/index.tsx` + `layout.tsx` (no-rail cả 2 mode) · `FlashcardDeckList` (grid/line + thin bar) · `InterviewSession` (4-phase end-of-session + GradeModelDropdown mid+ + per-question scorecard). i18n `flashcard.interview.{modelLabel,gradingSession,gradingProgress,perQuestionTitle,questionN}` + `flashcard.deck.{viewAria,viewGrid,viewLine}`. tsc/eslint/JSON sạch.
- **Verify:** flow đọc-duyệt OK; **chưa verify mắt** (cần BE chạy + đăng nhập + enroll). Readiness meter + grading meter giữ `ProgressMeter` full-width (OK — chỉ deck-card meter mới hairline). `onUpgrade` route ai-subscription chưa double-check tồn tại.
