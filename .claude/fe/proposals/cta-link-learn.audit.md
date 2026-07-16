# Audit (ngầm) — CTA/Link health, scope `learn` (toàn bộ `features/learn/*`)

> Plan ngầm — ghi HẾT finding, KHÔNG đổ hết ra duyệt 1 lần. Batch proposal lấy top ⬜ rank cao nhất (xem `cta-link-learn-batch1.proposal.md`). Re-chạy scan sau → cập nhật file này (thêm mới, giữ status cũ, bỏ ✅).

Quét 2026-07-08, 12 surface fan-out (Haiku), rank bởi Opus theo **SEVERITY × funnel-impact**.

## ❌ Broken (dead-end / dead-link / gate bypass) — ưu tiên cao nhất

| # | Surface | Finding | Call-site | Rule | Status |
|---|---|---|---|---|---|
| 1 | LessonReader right-rail | `LessonChallenges.onPractice` dispatch+`router.replace` thẳng, bỏ qua check gate premium/enrollment ở `LessonReader/index.tsx:277` | `OnThisPage/LessonChallenges/index.tsx:81-83` | content-linking §deep-link-intent (deep-link phải tới đích ĐÚNG quyền truy cập) | ✅ (2026-07-08) |
| 2 | LessonReader right-rail | 2 CTA `variant="primary" size="sm"` cạnh nhau (Flashcards + Challenges) = Hick's Law; cả 2 thiếu `ArrowRightIcon` trailing | `OnThisPage/LessonFlashcards/index.tsx:74` + `OnThisPage/LessonChallenges/index.tsx:102` | call-to-action §1 (đúng 1 primary) + §icon | ✅ (2026-07-08) |
| 3 | CourseQa | Tên người hỏi = `<Typography>` tĩnh, không phải link tới profile | `QuestionRow/index.tsx:151-152` | content-linking §2 (tham chiếu thực thể phải bấm-được) | ✅ (2026-07-08) |
| 4 | CourseQa | Tên người trả lời = `<span>` tĩnh, không phải link | `CommentItem.tsx:97-99` | content-linking §2 | ✅ (2026-07-08) |
| 5 | Leaderboard | Hàng user (table/podium/champion) có `hover:bg-default-50` gợi ý bấm được nhưng KHÔNG có link tới profile | `LeaderboardTable:94`, `LeaderboardPodium:59`, `LeaderboardChampion:39` | content-linking §2 | ✅ (2026-07-08) |
| 6 | MindMap | Full-bleed canvas KHÔNG có back-affordance nào (breadcrumb/back-link) để thoát ra | `MindMap/index.tsx`, `Canvas/index.tsx` | content-linking §3 (đúng 1 back-affordance) | ✅ (2026-07-08) |
| 7 | ContentAiChat | Lỗi hết credit/quota hiện `⚠️ {error}` KHÔNG kèm CTA upgrade — trong khi `onUpgrade` đã tồn tại (ẩn trong dropdown) | `ContentAiChat/index.tsx:288-303` | content-linking §1 (không ngõ cụt) | ✅ (2026-07-08) |
| 8 | Flashcards | Hết phiên ôn deck (FlashcardReviewer) không có "việc kế" (UpNextCard pattern) — kết thúc lơ lửng | `FlashcardReviewer/index.tsx:157-167` | content-linking §1 + call-to-action (UpNextCard đã áp ở nơi khác) | ⬜ |
| 9 | PersonalProject TaskActions | CTA "Evaluate" thiếu `variant="primary"` + icon sai (`SparkleIcon` thay vì `ArrowRightIcon`) | `TaskActions/index.tsx:165-179` | call-to-action §icon chuẩn | ⬜ |
| 10 | PersonalProject TaskActions | 2 nút phụ (Feedback/Attempts) `size="lg"` thay vì `md` — lấn cỡ với primary | `TaskActions/index.tsx:180-195` | call-to-action §sub-CTA quiet | ⬜ |
| 11 | CourseContents | Empty state không có mô tả/CTA onward ("browse courses"/"về dashboard") | `CourseContents/index.tsx:210-212` | content-linking §empty-state-is-a-path | ⬜ |

## ⚠️ Issue (copy/hierarchy/honesty lệch, chưa "gãy")

| # | Surface | Finding | Call-site | Rule | Status |
|---|---|---|---|---|---|
| 12 | Foundations | Đếm hiển thị dùng `categories.length` (state cũ) thay vì `totalCount` (server, đã filter) — sai số khi search | `FoundationsCategoryGrid/index.tsx:172` | persuasion-psychology (đếm phải khớp data thật đang hiện) | ⬜ |
| 13 | Foundations | Nút external-link fallback lên `variant="primary"` dù Foundations là surface tham khảo thuần (không primary CTA) | `FoundationResourceBody/index.tsx:70` | call-to-action §1 | ⬜ |
| 14 | LearnShell | `ResumeRail` (bg-accent/10) + `SidebarNavItem` active (cùng bg-accent/10) — 2 điểm nổi cùng lúc, vi phạm Von Restorff | `ResumeRail/index.tsx:72` + `SidebarNavItem/index.tsx:61` | accent-system (1 điểm nổi/màn) | ⬜ |
| 15 | LearnShell | `ResumeRail` style Link+tonal, mơ hồ có phải primary CTA (north-star "học tiếp") hay chỉ nav quiet | `ResumeRail/index.tsx:68,72` | call-to-action §1 | ⬜ |
| 16 | LessonReader | Desktop không có UpNextCard cuối bài (chỉ mobile có) — completion moment desktop là sidebar tĩnh | `LessonReader/index.tsx:384-395` | call-to-action §Fogg-moment | ⬜ |
| 17 | Flashcards | Hết session "Due Review" chỉ gợi ý mock-interview dạng secondary quiet, chưa promote đúng completion-moment | `DueReview/index.tsx:148-179` | call-to-action §Fogg-moment | ⬜ |
| 18 | Flashcards | Hết thẻ due (dueCount=0) không có CTA phụ funnel (xem deck khác / chuyển hỏi nhanh) | `DueReviewHero/index.tsx:54-58` | content-linking §empty-state | ⬜ |
| 19 | Flashcards | Deck list rỗng không có CTA funnel về course | `FlashcardDeckList/index.tsx:155-156` | content-linking §empty-state | ⬜ |
| 20 | CourseQa | Nút submit câu hỏi `size="sm"`, không theo chuẩn primary lg+arrow (có thể là chủ ý pill-pattern, cần confirm) | `CommentComposer.tsx:125-127` | call-to-action §1 | ⬜ |
| 21 | CourseQa | Copy CTA rỗng "Vào nội dung khóa" = cơ chế, không phải outcome | `CourseQa/index.tsx:203-210` | call-to-action §copy=outcome | ⬜ |
| 22 | Challenge | Nút "Nộp bài" copy = cơ chế, không outcome | `SubmissionRow/index.tsx:217-231` | call-to-action §copy=outcome | ⬜ |
| 23 | Challenge | Trang kết quả (SubmissionResult) không có CTA primary/onward sau khi chấm xong | `SubmissionResult/index.tsx:299-354` | call-to-action §Fogg-moment | ⬜ |
| 24 | Challenge | Khi làm xong HẾT requirement, không có CTA hoàn tất/onward | `ChallengeView/index.tsx:194-487` | content-linking §1 | ⬜ |
| 25 | Challenge | SubmissionResult chỉ có back-link, không có forward deep-link tới requirement kế tiếp chưa làm | `SubmissionResult/index.tsx:206-209` | content-linking §deep-link-intent | ⬜ |
| 26 | MockInterview | CTA capstone (tertiary) vẫn có `ArrowRightIcon` — cạnh tranh với primary "học điểm yếu" | `MockInterviewScorecard/index.tsx:317-325` | call-to-action §sub-CTA-quiet | ⬜ |
| 27 | MockInterview | Setup phase 2 nút `size="lg"` cạnh nhau (primary+secondary) khi course có design track — rủi ro Hick's Law | `MockInterviewSession/index.tsx:856-878` | call-to-action §1 | ⬜ |
| 28 | CourseContents | TrialConversionStrip copy "Unlock the course" = feature, không outcome | `messages/en.json:455` | call-to-action §copy=outcome | ⬜ |
| 29 | MindMap | Root-node click = zoom-to-overview (canvas control), không phải navigate — lệch spec "1 node = navigate" nhưng UX hợp lý, cần confirm chủ ý | `Canvas/index.tsx:119-124` | content-linking (ambiguous) | ⬜ |
| 30 | PersonalProject | Dashboard empty-state chỉ có title, chưa có mô tả/CTA forward rõ (breadcrumb có nhưng không nổi) | `PersonalProjectDashboard/index.tsx:207-208` | content-linking §empty-state | ⬜ |
| 31 | ContentAiChat | Nút gửi icon-only, không có label outcome (chấp nhận được, nit) | `ContentAiChat/index.tsx:631-634` | call-to-action §copy (nit) | ⬜ |

## ✅ Coverage tốt (không cần sửa, ghi lại để khỏi audit lại)
- MockInterview scorecard primary CTA (deep-link `studyHref` → weakest phase) — vẫn đúng như `content-linking.md`/`call-to-action.md` đã ghi nhận, xác nhận lại 2026-07-08.
- Flashcards Interview Recap (Zone C/D/F) — best-in-class funnel, giữ nguyên làm mẫu.
- MindMap: CTA continue-button, deep-link node→lesson, honest progress data — đều ✅.
- CourseContents: primary CTA resume, Fogg timing, honest data, breadcrumb, earned-moment 1-lần — đều ✅.
- LearnShell: breadcrumb, mobile tab bar, honest badge data, tất cả nav là link thật — đều ✅.
- PersonalProject: dashboard/task-locked/task-result flow (trừ 2 issue trên) — đều ✅, resume đúng phạm vi (không nhảy capstone).
- ContentAiChat: CTA hierarchy, Fogg timing FAB/selection-ask, honest model-gating — đều ✅ (trừ #7 ở trên).
- Foundations: breadcrumb, link integrity FoundationCard, deep-link categoryId+resourceId, resume scope, empty-state message — đều ✅ (trừ #12/#13).
- Leaderboard: 1-primary rule (none needed), back-affordance, category-rail on-page filter, honest rank data, accent-1-highlight-rule — đều ✅ (trừ #5).
- CourseQa: empty-state funnel, honest counts, back-breadcrumb, quiet sub-CTA (reply/expand) — đều ✅ (trừ #3/#4/#20/#21).

## Liên quan
- [[call-to-action]] · [[content-linking]] · [[persuasion-psychology]] · `fe/product/fair-monetization-axiom`
- Batch 1 (finding #1-7) → ✅ DONE ở `cta-link-learn-batch1.proposal.md` (2026-07-08). Còn 24 ⬜ (#8-31) cho batch sau — top rank kế tiếp: #8 Flashcards end-of-session, #9/#10 PersonalProject TaskActions, #11 CourseContents empty-state.
