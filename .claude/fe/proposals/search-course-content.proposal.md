# Proposal — "Tìm nội dung khóa" (RAG search course content, in ContentAiChat)

> Thầy: *"với tính năng chat giờ chỉ giải thích content, thầy muốn dùng search để tìm nội dung khóa nữa"*. Brainstorm qua `/starci-fe-layout-brainstorm` → deep-scan grounding cả 2 repo (`ContentAiChat` hiện chỉ RAG single-lesson; `retrieveCourseExcerpt` course-wide đã có sẵn nhưng chỉ dùng cho mock-interview) → prototype `scratchpad/content-ai-search-flow/index.html` (:8080, 4 màn) → thầy chốt "tức là phải RAG toàn bộ nội dung" → hỏi phạm vi RAG (chỉ lesson body, hay mở rộng challenge/flashcard/milestone) → thầy chọn **mở rộng cả 3** → build thẳng cùng session.

## Quyết định phạm vi (đã chốt qua hội thoại)
- **RAG-based** (không phải Elasticsearch keyword search) — hiểu NGHĨA câu hỏi, không cần đúng từ khoá.
- **Mở rộng RAG index gồm 4 loại**: lesson content (đã có) + **challenge** + **flashcard deck** + **milestone task** (mới, session này).
- Scope search = **trong 1 khóa** (courseId filter), không xuyên khóa.
- Phần "AI tự trích dẫn bài khác trong chat" (đã brainstorm ở màn 4 prototype) — **CHƯA build vòng này**, chỉ build search view. Fast-follow riêng khi cần.

## Đã build (BE)

**`ContentRagIndexService`** (`src/modules/rag/content-rag-index.service.ts`) — tổng quát hoá vòng lặp index từ CHỈ `ContentEntity` sang 4 loại đồng nhất qua interface `RagIndexItem {id, collect()}`, tái dùng NGUYÊN VẸN cơ chế hash-diff/xoá/batch-embed đã có (không đổi hành vi cũ):
- `collectChallengeDocs` — title+description+hint (đọc snapshot MinIO `challenges/<id>/<locale>.json`, giống hệt field `challenge(id)` query công khai trả về — KHÔNG bao giờ lộ `outcomeCriteria`/`approachCriteria` nội bộ). Bỏ qua requirements/steps/outputs/prerequisites (boilerplate lặp lại giữa ts/java/csharp/go).
- `collectFlashcardDeckDocs` — title+description + toàn bộ câu hỏi/trả lời/giải thích mỗi thẻ (thuần Postgres, không có snapshot MinIO cho deck — dùng `TranslationResolverService.resolve()` trực tiếp, KHÔNG dùng `FlashcardDeckResolverService.transform` vì hàm đó mutate+xoá `translations` nên không resolve được cả 2 locale từ 1 lần load).
- `collectMilestoneTaskDocs` — title+description+hint + 1 brief (ưu tiên "agnostic", else brief đầu tiên) — đọc snapshot MinIO `milestone-tasks/<id>/<locale>.json`.
- 3 flag riêng `CONTENT_RAG_INDEX_{CHALLENGES,FLASHCARDS,MILESTONE_TASKS}_ENABLED` (default `true` khi `CONTENT_RAG_INDEX_ENABLED=true`) — bật/tắt độc lập từng loại khi cần test không phải embed lại cả 4.

**`ContentRagRetrievalService.searchCourse`** (mới, `src/modules/rag/content-rag-retrieval.service.ts`) — khác `retrieveCourseExcerpt` (gộp thành 1 chuỗi cho LLM): trả **danh sách có cấu trúc** `{contentId, kind, lang, score, snippet}[]` dùng `similaritySearchWithScore` (cosine thật, không phải highlight khớp chữ), dedup theo contentId giữ điểm cao nhất, over-fetch `k*4` rồi cắt còn `k` nguồn riêng biệt.

**Query mới `searchCourseContent(courseId, query)`** (`src/features/api/core/graphql/queries/search-course-content/`) — `SearchCourseContentService` join từng hit về đúng entity theo `kind` (Content+Module / Challenge+Content+Module / FlashcardDeck / MilestoneTask+Milestone), resolve title/breadcrumb theo ĐÚNG locale hit đã match, trả kèm id điều hướng (`moduleId`+`contentId` hoặc `deckId` hoặc `taskId`) để FE tự build URL.

## Đã build (FE)

- `query-search-course-content.ts` + type + `useQuerySearchCourseContentSwr` (debounce 400ms tự trong component — search RAG tốn embedding call/lần, KHÔNG bắn theo từng keystroke như ô search hội thoại đã có).
- `ContentAiChat` — thêm view thứ 4 `"search"` (mirroring `conversations`/`settings`): icon 🔍 cạnh link "Cuộc trò chuyện" (2 icon cùng nhóm "tìm gì đó"), `SearchInput` (tái dùng khối đã có) + `AsyncContent` 4-state (rỗng/loading/error/kết quả), mỗi kết quả 1 row (breadcrumb + title + snippet) → bấm → `router.push` đúng URL theo `kind` (content/challenge → `.module(moduleId).content(contentId)`; flashcard → `.flashcards().review(deckId)`; milestone → `.personalProject(taskId)`) + đóng panel (`useContentAiChatOverlayState().close()`).
- i18n `contentAi.searchContent*` (vi+en).

## Files touched
BE: `src/modules/env/config.ts` · `src/modules/rag/content-rag-index.service.ts` · `src/modules/rag/content-rag-retrieval.service.ts` · `src/features/api/core/graphql/queries/search-course-content/**` (mới) · `src/features/api/core/graphql/queries/queries.module.ts`.
FE: `src/components/features/learn/ContentAiChat/index.tsx` · `src/modules/api/graphql/queries/query-search-course-content.ts` (mới) · `src/modules/api/graphql/queries/types/search-course-content.ts` (mới) · `src/hooks/swr/api/graphql/queries/useQuerySearchCourseContentSwr.ts` (mới) · `src/messages/{vi,en}.json`.

## Verify
- `tsc --noEmit` sạch TUYỆT ĐỐI cả 2 repo (BE 205 lỗi pre-existing y hệt cũ, không file nào của tính năng này) · eslint sạch mọi file mới/sửa.
- **Boot thật xác nhận DI graph đúng**: khởi `backend` (nest start --watch), webpack compile OK, TOÀN BỘ module tree (kể cả `SearchCourseContentQueriesModule`, `QueriesModule`, mọi module sau nó) init xong KHÔNG có lỗi "Nest can't resolve dependencies" — chỉ dừng lại vì hạ tầng cục bộ (Postgres/Redis/NATS/Qdrant qua Docker) KHÔNG chạy được trong sandbox này (Docker Desktop daemon không truy cập được).
- **CHƯA verify được**: kết quả RAG thật (cần bật `CONTENT_RAG_INDEX_ENABLED=true` + chạy embed lần đầu trên máy có Docker/Qdrant thật), test tay UI trên browser thật.

## Trạng thái
🔨 IN-PROGRESS — code xong + DI graph verified qua boot thật, nhưng CHƯA chạy được embed/search thật (thiếu hạ tầng Docker trong sandbox này) và CHƯA test tay browser. Thầy cần: (1) bật `CONTENT_RAG_INDEX_ENABLED=true` (+ 3 flag con, mặc định true rồi) trên máy có Docker/Qdrant chạy, (2) restart backend để build lần đầu (sẽ CHẬM — embed cả challenge/flashcard/milestone toàn bộ khóa, theo dõi log `Content RAG: embedding + upserting...`), (3) mở 1 lesson → bấm icon 🔍 trong ContentAiChat → thử tìm 1 challenge/flashcard/milestone task để xác nhận nhảy đúng trang.
