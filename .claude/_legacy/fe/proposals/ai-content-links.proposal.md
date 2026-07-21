# Proposal — AI content linking (đọc gì tiếp) xuyên suốt learn

> Nối tiếp `search-course-content.proposal.md` — thầy: *"kiểu ví dụ đang xài flashcard thì search milestone, làm milestone search content để đọc, đi phỏng vấn phỏng vấn xong hướng dẫn ng ta đọc bài nào... để link nội dung kiểu AI"*. Chốt brainstorm cả 3 bề mặt (`AskUserQuestion` → "brainstorm layout cả 3 trước") → prototype `scratchpad/ai-content-links-flow/index.html` (:8081, 5 màn) → duyệt ("chuẩn như thế đấy") → thầy yêu cầu mở rộng nghiên cứu ra CẢ trang `/learn` → quét 18 tính năng, tìm thêm 2 bề mặt hợp (Challenge SubmissionResult + LessonReader) + xác nhận 5 bề mặt KHÔNG hợp (CourseQa/CourseContents/ModulePage/Foundations/Flashcard "Học thẻ") → build thẳng cả 6.

## Cơ chế nền tảng (dùng LẠI nguyên vẹn `search-course-content`)
Mỗi bề mặt tự build 1 chuỗi "query" từ NGỮ CẢNH có sẵn (không ai gõ tay) → `useQuerySearchCourseContentSwr(courseId, query, enabled)` → `searchCourseContent` (RAG, đã build+test 100 câu) → render qua component dùng chung `RelatedContentList`.

## Đã build (shared)
- `src/modules/learn/resolve-search-result-href.ts` — tách logic điều hướng theo `kind` (content/challenge → module+content; flashcard → deck; milestone → task) từ `ContentAiChat`'s `onSelectSearchResult`, dùng chung.
- `src/components/blocks/learn/RelatedContentList/index.tsx` — block thụ động, tự ẩn (query rỗng/loading-không-gõ/lỗi/rỗng → render null), tối đa 3 dòng (breadcrumb+title+snippet), bấm → điều hướng qua util trên.

## Đã nối (6 bề mặt, ĐÚNG vị trí, KHÔNG thêm CTA cạnh tranh)
| Bề mặt | File | Query tự build | Vị trí |
|---|---|---|---|
| Mock Interview scorecard | `MockInterviewScorecard/index.tsx` | `gaps` + `followUpQuestion` | Dưới hàng CTA chính (list phụ, không phải nút) |
| Milestone task page | `PersonalProject/index.tsx` | title + description task | Cuối cột đọc, sau `TaskBrief`/criteria fallback |
| Milestone TaskResult (rớt) | `PersonalProject/TaskResult/index.tsx` | 3 feedback nặng nhất | Sau "Góp ý", CHỈ khi `!passing` |
| Challenge SubmissionResult (rớt) | `Challenge/SubmissionResult/index.tsx` | 3 feedback nặng nhất | Sau "Góp ý", CHỈ khi `!passing` |
| LessonReader | `LessonReader/index.tsx` | tiêu đề bài học | Sau `UpNextCard`, trước `ContentDiscussion` |
| Flashcard "Hỏi nhanh" recap | `Flashcards/QuizSession/index.tsx` | tên các weak tag | Ngay dưới `RecapWeakTagsCard` (KHÔNG merge vào, block riêng bổ trợ) |

i18n: `content.relatedContent.label`, `task.relatedContent.label`, `personalProjectResult.relatedContent.label`, `submissionResult.relatedContent.label`, `mockInterview.relatedContentLabel`, `flashcard.quiz.relatedContentLabel` (vi+en đủ cả 6).

## Đã quét, XÁC NHẬN KHÔNG hợp (có lý do, không phải bỏ sót)
- **CourseQa** — list thảo luận, không có "điểm kết thúc đọc", empty-state đã có CTA riêng.
- **CourseContents** + **ModulePage** — dashboard/syllabus điều hướng thuần; chính doc `lesson-reader.md` đã ghi rule "không trùng surface" (`course-home-no-duplicate-surfaces`).
- **Foundations** — trang tra cứu thuần, không mốc hoàn thành/điểm số.
- **Flashcard "Học thẻ" (SM-2 review, khác "Hỏi nhanh")** — hiện KHÔNG có màn recap (chỉ EmptyState trơn) và không track weak-tag — việc lớn hơn (cần thêm tracking trước), **CHƯA làm**, để fast-follow riêng.

## Verify
- `tsc --noEmit` sạch TUYỆT ĐỐI toàn FE repo · eslint sạch mọi file mới/sửa (8 file: 2 shared + 6 surface).
- Reuse 100% hạ tầng đã test (searchCourseContent + RAG index) — không cần vá BE gì thêm.
- **CHƯA test tay browser** (các route đều cần đăng nhập + dữ liệu thật — preview headless không vào được).

## Trạng thái
🔨 IN-PROGRESS — code xong cả 6 bề mặt + 2 file dùng chung, tsc/eslint sạch tuyệt đối. Chưa test tay. "Học thẻ" (SM-2) cố ý để lại, cần quyết định riêng.
