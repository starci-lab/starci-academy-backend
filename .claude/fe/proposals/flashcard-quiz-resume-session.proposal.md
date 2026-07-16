# Proposal — Flashcards "Hỏi nhanh" (Quiz): resume phiên đang dở

> Cùng gợi ý gốc của thầy áp cho Mock Interview, lặp lại cho Flashcards Quiz: *"lưu phiên lại... để sau có thể luyện tiếp"*. Khác Mock Interview ở chỗ: mỗi câu đã tự chấm-lưu ngay (SM-2 qua `mutateReviewFlashcard`, an toàn) — cái mất khi refresh chỉ là **batch câu đang làm + vị trí đang ở đâu**, không phải điểm số. Prototype đã duyệt: `fe/prototypes/flashcard-interview-flow.html` màn 0 (`resumeZone` toggle).

## Quyết định phạm vi (mirror Mock Interview, đã chốt qua AskUserQuestion)
- **1 phiên đang-dở/khóa/user** — bắt đầu phiên mới tự đánh dấu phiên cũ `abandoned`.
- **Sync progress sau MỖI câu** (không debounce).
- **TTL 24h** — lọc bằng `updatedAt` ngay trong query, không cần cron.

## Flow + shell
- Setup (`centered max-w-3xl`, KHÔNG đổi shell) — thêm `ContinueCard` (tái dùng, 3rd usage) đứng TRÊN 3 zone hiện có (Zone 1 StatsStrip/Zone 2 config/Zone 3 CTA), demote CTA "Bắt đầu luyện" xuống `secondary`/`ghost` khi có phiên dở.
- Active (`max-w-5xl`, KHÔNG đổi shell) — route mới `.../flashcards/quiz/[sessionId]` (thay `?session=` cũ khi resume; giữ flow tạo-mới hiện tại không bắt buộc đổi URL).

## State matrix
| State | Card resume | Ghi chú |
|---|---|---|
| Không có phiên dở | ẩn hẳn | `myInProgressFlashcardQuizSession` trả null |
| Có 1 phiên dở (còn hạn 24h) | hiện, progress = currentIndex/cardIds.length | href → `/quiz/[sessionId]` |
| Phiên dở hết hạn/bị supersede | ẩn im lặng | |
| Resume nhưng sessionId lỗi | fallback về setup bình thường, không throw | |

## Block briefs (element-aware)
- **`ContinueCard`** (`blocks/cards/ContinueCard`) — tái dùng nguyên bản, không sửa props.
- **`QuizSession`** — thêm `resumeSessionId` prop, rehydrate effect (fetch cardIds thật theo thứ tự đã lưu), sync effect sau mỗi `commitCard`.

## Files cần sửa
**BE (mirror mock-interview-session.entity.ts, KHÔNG dùng chung bảng — domain khác):**
- Entity mới `flashcard-quiz-session.entity.ts` (`flashcard_quiz_sessions`): enrollmentId (FK), cardIds (jsonb), currentIndex (int), results (jsonb, mirror shape của `completeFlashcardQuizSession`'s `answers` item), status (varchar).
- Migration mới (mirror `CreateMockInterviewSessions`).
- Mutation mới `startFlashcardQuizSession(courseId, cardIds)` — abandon phiên cũ, tạo mới, trả `sessionId`.
- Mutation mới `syncFlashcardQuizSessionProgress(sessionId, currentIndex, results)`.
- Query mới `myInProgressFlashcardQuizSession(courseId)`.
- Sửa `completeFlashcardQuizSession`: nhận `sessionId` THẬT (không còn `crypto.randomUUID()` client-gen), đánh `status=completed` lên session row.

**FE:**
- Hook mutation/query mới (mirror `useMutateSyncMockInterviewSessionTurnsSwr`/`useQueryMyInProgressMockInterviewSessionSwr`).
- Route mới `learn/flashcards/quiz/[sessionId]/page.tsx`.
- `QuizSession/index.tsx`: gọi `startFlashcardQuizSession` sau khi bốc `sessionCards`, gọi `syncFlashcardQuizSessionProgress` trong `commitCard`, đổi `finish()` dùng sessionId thật, thêm rehydrate khi có `resumeSessionId`, resume card ở setup.
- i18n: `flashcard.quiz.*` thêm key resume (KHÔNG dùng chữ "interview").

## Verify
- `tsc --noEmit` + `eslint --quiet` sạch cả 2 repo.
- **Đụng BE → verify runtime thật**: restart backend, GraphQL introspection xác nhận 2 mutation + 1 query mới lên schema, tạo thử 1 phiên qua mutation trực tiếp (không cần UI) để xác nhận DB ghi đúng.
- Browser thật (nếu có đăng nhập): bắt đầu quiz → rời giữa chừng → quay lại setup → thấy resume card → bấm → đúng câu đang dở.

## Trạng thái
🔨 IN-PROGRESS (2026-07-08):
- ✅ BE build thật (entity + migration + 2 mutation + 1 query) — **verify RUNTIME thật**: bảng `flashcard_quiz_sessions` đã tạo qua synchronize (query `\d` xác nhận cột+FK+index), GraphQL introspection trên instance sạch (port 3066) xác nhận 3 op `startFlashcardQuizSession`/`syncFlashcardQuizSessionProgress`/`myInProgressFlashcardQuizSession` đã live. tsc BE sạch trong file mới. Entity register đủ 3 chỗ `primary.module.ts` + barrel.
- ✅ FE build (hook mutation/query, route `[sessionId]`, resume card, rehydrate, sync-per-câu). tsc/eslint sạch.
- 🐛 **Bug thầy bắt được khi test tay (2026-07-08):** bấm "Bắt đầu luyện" KHÔNG đưa sessionId lên URL — `startSession` gọi mutation tạo session THẬT nhưng chỉ `setPhase("active")` tại chỗ, KHÔNG `router.push('/quiz/[sessionId]')` (lỗi spec gốc của tôi: ghi "flow tạo-mới không bắt buộc đổi URL" — SAI, thầy muốn parity với Mock Interview). **ĐÃ SỬA:** persist thành công → `inProgressSessionSwr.mutate()` (prime cache) → `router.push` sang route sessionId → rehydrate tiếp quản; fail → degrade chạy local non-resumable. tsc/eslint sạch sau sửa.
- ⚠️ **Bug TIỀM ẨN phát hiện, cả Mock Interview cũng dính (chưa sửa MI):** khi fresh-start navigate sang `/[sessionId]`, instance mới đọc `myInProgress...` — nếu SWR còn cache `null` cũ (từ lúc setup check resume) thì rehydrate guard `data.sessionId !== resumeSessionId` trip → "resume failed" latch vĩnh viễn (`resumeAttemptedRef` chạy 1 lần). Quiz đã fix bằng `mutate()` prime cache TRƯỚC push. **Mock Interview `startSession` (MockInterviewSession/index.tsx ~684) KHÔNG prime — nên có cùng bug latent, cần fix tương tự** (chưa làm, ngoài scope proposal này — ghi nợ).
- ⬜ **CÒN LẠI:** thầy test tay end-to-end trên :3000 (đã đăng nhập) — bấm Bắt đầu → xác nhận URL có sessionId → rời giữa chừng → quay lại setup → thấy resume card → bấm → đúng câu đang dở. (Tôi KHÔNG test được vì không có tài khoản đăng nhập; HMR đã áp bản sửa lên dev server :3000 của thầy.)
