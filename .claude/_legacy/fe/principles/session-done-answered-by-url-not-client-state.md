# Principle — "Is this session done?" answered by the URL, not re-derived client-side

> Rút từ 2 lần sửa cùng 1 lớp bug: Flashcard Quiz/Review result (2026-07-12) và Mock Interview result (2026-07-13).

## Quy tắc (STRICT)
- **Một work-session có 2 trạng thái (đang làm / đã xong) → 2 ROUTE riêng, không phải 1 route + cờ suy luận** (`status` field, `?phase=` query param, so sánh timestamp…). Route LIVE (`.../sessions/[id]`) chỉ render "đang làm"; route RESULT (`.../sessions/[id]/result`) chỉ render "đã xong" — KHÔNG route nào tự quyết định phải hiện cái gì dựa trên state fetch về.
- **Lý do:** suy luận "done hay chưa" ở client (từ `status`/`currentIndex`/timestamp) có 1 khoảng xám không phân biệt được — "sắp làm xong câu cuối" và "vừa làm xong câu cuối" đọc y hệt nhau ở phía client. Nếu write hoàn tất (completion) bị lỡ/trễ ở BE, F5 lại trang cứ resume vào trạng thái cũ thay vì hiện kết quả thật — một lớp bug im lặng, khó tái hiện, chỉ lộ ra khi đúng race đó xảy ra.
- **Khi hoàn tất (client-side trigger: nộp bài / chấm điểm xong) → `router.replace()` sang route RESULT ngay, không `setPhase("result")`/`setState(...)` tại chỗ.** URL đổi = trạng thái đổi, không phải state nội bộ đổi trong khi URL đứng yên.
- **Route RESULT tự fetch fresh theo `sessionId`** (query mới hoặc query sẵn có match theo id — status-agnostic, owner-scoped), KHÔNG nhận data qua props từ route LIVE truyền sang (2 route độc lập, không coupling qua React state/router state). Trả `null`/not-found → route RESULT tự render fallback (EmptyState + nút quay lại), không phải lỗi.
- **Route LIVE, khi phát hiện session KHÔNG còn `in_progress` nữa** (resume/deep-link vào 1 session đã xong) → **redirect sang route RESULT ngay, không tự fetch attempt rồi render tại chỗ.** Việc "session này thật ra đã graded hay đã chết hẳn" là trách nhiệm CỦA route RESULT (nó tự fetch + tự quyết not-found), route LIVE không cần biết.

## 2 ca đã áp (tham khảo khi làm ca thứ 3)
- **Flashcard Quiz "Hỏi nhanh"** (2026-07-12): `flashcards/quiz/sessions/[sessionId]` (live) → `.../result` (done). Query mới `myFlashcardQuizSessionBySessionId` (status-agnostic). `QuizSession` gọi `router.replace(...result().build())` sau `completeFlashcardQuizSession`. `Flashcards` component nhận `resultQuizSessionId` prop, branch sang `FlashcardQuizResult` (component RIÊNG, không tái dùng máy `QuizSession`).
- **Mock Interview** (2026-07-13, thầy hỏi "giống trang kia chưa /result" khi thấy route thiếu): `mock-interview/interview/[sessionId]` (live) → `.../result` (done). Query **đã có sẵn** `myMockInterviewAttemptBySessionId` (trước đó bị dùng SAI chỗ — làm fallback fetch-rồi-render-tại-route-live thay vì redirect) + mapper có sẵn `mapMockInterviewAttemptToGradeResult`. `finishAndGrade` gọi `router.replace(...result().build())` thay vì `setPhase("scorecard")`; resume-fallback đổi từ tự fetch+render thành redirect thẳng. Component RIÊNG mới `MockInterviewResult` (không tái dùng máy `MockInterviewSession`) — SWR hook mới `useQueryMyMockInterviewAttemptBySessionSwr` (trước đó chỉ gọi query trực tiếp không qua SWR). Dọn theo: xoá phase `"scorecard"` khỏi union type + nhánh render chết, xoá state `grade`/`resumeError` giờ write-only.
  - **Follow-up cùng ngày — xoá luôn drawer trùng lặp:** `MockInterviewHistory` (tab Lịch sử) mở `MockInterviewAttemptDrawer` — 1 drawer overlay TỰ render lại y hệt logic `MockInterviewResult` (map attempt → `MockInterviewScorecard`), nhưng nguồn data là LIST query (`myMockInterviewAttempts`, **không** có `questionReviews` — comment sẵn trong `mapAttemptToGradeResult.ts` từng cảnh báo điều này) → drawer thiếu breakdown từng câu. Thầy: "bỏ drawer render ra cái trang result được không" — đổi hẳn `onPress` của mỗi row lịch sử thành `router.push(...interview(attempt.sessionId).result().build())`, xoá state `selectedAttempt` + xoá hẳn file `MockInterviewAttemptDrawer` (0 consumer còn lại). Kết quả: lịch sử giờ dùng CHUNG route `/result` với luồng live, không còn 2 nơi render scorecard với 2 nguồn data khác độ đầy đủ.

## `pathConfig` builder shape (mirror khi thêm ca mới)
```ts
const liveThing = (sessionId: string) => {
    const build = () => `.../sessions/${sessionId}`
    const result = () => ({ build: () => `.../sessions/${sessionId}/result` })
    return { build, result }
}
```

## Dọn dẹp đi kèm khi áp (đừng bỏ sót)
Khi route LIVE không còn tự render "đã xong" nữa, phần code CŨ làm việc đó thường để lại rác:
- Nhánh render phase/state "đã xong" trong component LIVE → XOÁ (dead code, không route nào set state đó nữa).
- State chỉ còn NGƯỜI GHI, không ai ĐỌC (vd `grade`/`resumeError` ở Mock Interview) → xoá luôn, đừng để "ghi mà không đọc" — eslint `no-unused-vars` sẽ bắt phần đọc bị xoá nhưng KHÔNG bắt biến chỉ ghi-không-đọc (`const [x, setX] = useState()` mà chỉ gọi `setX`), phải tự soát.
- Import/type chỉ phục vụ nhánh vừa xoá → xoá theo (kiểm bằng grep toàn file trước khi xoá, không suy đoán).

## Liên quan
[[full-bleed-work-surface]] (2 route LIVE này đều `fullBleed`) · `flashcard-session-stats-build` (memory, bối cảnh quiz-result) · `feedback-dont-mark-done-without-real-verify` (chưa test tay browser thật — auth-gated, cùng caveat cả 2 ca).
