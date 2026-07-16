# Redirect vào URL có-session: KHÔNG nối vào `pathname` thô + gate theo status trước khi mount

> Heuristic engineering (họ routing / session-resume). Rút từ bug revisit flashcard session (2026-07-12, `Flashcards/{index,DueReview,FlashcardReviewer}`): vào lại URL 1 phiên ĐÃ xong → màn trắng **"Missing `<html>` and `<body>` tags"**, URL biến thành `.../sessions/A//sessions/B` (lặp segment).

## Root cause (2 lỗi lồng nhau)
1. **Build URL redirect từ `pathname` THÔ.** Component resume gọi `router.push(\`${pathname}/sessions/${id}\`)`. Khi ĐÃ ở URL có-session (`.../review/sessions/A`), `pathname` đã chứa `/sessions/A` → nối thêm → `.../sessions/A//sessions/B`. Path này không khớp route `[sessionId]` nào → Next render không-layout → "Missing html/body".
2. **Component TỰ-khởi-tạo-session được mount TRƯỚC khi biết status.** `DueReview`/`FlashcardReviewer` có `useEffect` "resolve-or-start": nếu session không resume được (đã `completed`/`abandoned` — query in-progress không trả về nó) → tự `startSessionAndRedirect()`. Parent để nó mount khi status CHƯA xác nhận (query stats chưa về / `courseId` redux chưa hydrate lúc load-thẳng-URL) → effect bắn nhầm → tạo phiên MỚI + redirect hỏng.

## Luật (STRICT)
- **Redirect vào 1 URL có-session → tính BASE bằng cách strip `/sessions/<id>` đang có khỏi `pathname`, KHÔNG nối thẳng.** `const base = pathname.replace(/\/sessions\/[^/]+\/?$/, "")` rồi `router.replace(\`${base}/sessions/${id}\`)`. **Dùng `replace` KHÔNG `push`** (URL cũ/hỏng không kẹt lại history, back không quay về màn lỗi).
- **Component có mount-effect TỰ khởi-tạo/redirect session → parent CHỈ mount nó khi status ĐÃ xác nhận `in_progress`.** Chưa biết (query đang load · thiếu `courseId` · stats trả `null`) → giữ **skeleton**, KHÔNG rơi xuống component đó. Finished / abandoned / not-found → render surface KẾT QUẢ (stats/recap) — không phải reviewer.
- **Câu hỏi quyết định:** "nếu tôi HAND session này cho reviewer mà nó KHÔNG resume được, effect của nó có tự tạo phiên mới không?" → CÓ → phải chặn ở parent bằng gate status DƯƠNG TÍNH (`=== "in_progress"`), không để lọt qua nhánh else.

## Bối cảnh (vụ cụ thể)
- Query stats `myFlashcardReviewSessionStatsBySessionId` resolve MỌI status (mirror `myMockInterviewAttemptBySessionId`) → `status` field là chỗ phân biệt finished vs in_progress (query resume `myFlashcardReviewSessionBySessionId` KHÔNG expose status → tự nó không đủ để gate).
- Gate parent: `studyStatusKnown = Boolean(courseId) && !statsLoading && !contextLoading && Boolean(contextData)`; chỉ `stats.status === "in_progress"` mới vào reviewer/DueReview.
- `courseId`/`courseDisplayId` lấy từ redux `state.course.*` → **load-thẳng-URL / refresh CHƯA hydrate** (đúng kịch bản revisit) → gate phải chờ, KHÔNG giả định có sẵn ngay render đầu.

## Liên quan
[[fe-swr-gate-must-match-be-enroll-guard]] (SWR gate theo `courseId` + enroll-guard header — cùng lệ thuộc redux course chưa-hydrate) · `components/header` §3 (leaf result page dùng PageHeader + BackLink) · [[envelope-response-data-must-be-nullable]] (query resolve-any-status trả `null` khi not-found/not-owned → nhánh gate phải coi `null` là "chưa in_progress", không lọt xuống reviewer).
