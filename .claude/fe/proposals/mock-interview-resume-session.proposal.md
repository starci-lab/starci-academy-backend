# Proposal — Mock Interview: resume phiên đang dở

> Gợi ý ban đầu của thầy: *"khi tạo phiên thì lưu phiên lại, trên tab render /interview/[abc], để sau có thể phỏng vấn tiếp dc không. Nếu trong phiên thì trên có cái resume phiên là kiểu tiếp tục và nằm dưới lịch sử phỏng vấn."* Brainstorm qua `starci-fe-block-brainstorm` → phát hiện đụng BE thật (trước đó KHÔNG persist transcript nào cả) → build thẳng (không tách session) vì thầy chốt "xúc". Prototype xác nhận: `fe/prototypes/mock-interview.html` (card resume + toggle state, đã host :8080 verify).

## Quyết định phạm vi (đã chốt qua AskUserQuestion)
- **1 phiên đang-dở/khóa/user** — bắt đầu phiên mới tự đánh dấu phiên cũ `abandoned`.
- **Sync turns sau MỖI câu trả lời** (không debounce) — mất tối đa 1 câu nếu crash giữa chừng.
- **TTL 24h** — phiên `in_progress` nhưng `updatedAt` quá 24h không còn resume được (lọc ngay trong query, không cần cron).

## Flow + shell
- Setup (green-room, `centered max-w-2xl`) — KHÔNG đổi shell. Thêm 1 card mới (`ContinueCard`, block canonical tái dùng — 2nd usage ngoài dashboard) đứng NGAY DƯỚI `MockInterviewHistory`, chỉ hiện khi có phiên resumable.
- Interview (full-bleed 2-pane) — KHÔNG đổi shell. Route mới `.../mock-interview/interview/[sessionId]` (thay vì chỉ `?phase=interview`) — additive, giữ cả legacy query-param cho tương thích ngược ở `learn/layout.tsx`.

## State matrix
| State | Card resume | Ghi chú |
|---|---|---|
| Không có phiên dở | ẩn hẳn | `myInProgressMockInterviewSession` trả null |
| Có 1 phiên dở (còn hạn 24h) | hiện, progress = questionIndex/total (qna) hoặc phaseIndex/5 (design) | href → `/interview/[sessionId]` |
| Phiên dở đã hết hạn/bị supersede | ẩn (không migrate câu chuyện "phiên cũ đã mất" — im lặng, tự nhiên như không có gì) | |
| Resume nhưng sessionId không khớp/lỗi | `Callout status="danger"` + fallback về setup bình thường | `resumeError` state |

## Block briefs (element-aware)
- **`ContinueCard`** (`blocks/cards/ContinueCard`) — resume card, tái dùng nguyên bản, không sửa props.
- **`MockInterviewSession`** — thêm `resumeSessionId` prop, rehydrate effect, sync effect (fire-and-forget).
- **`Callout`** — báo lỗi resume thất bại.

## Files đã sửa (BUILT — xem chi tiết trong session log 2026-07-08)
**BE:** migration `1723000000000-AddResumeSupportToMockInterviewSessions.ts` · `mock-interview-session.entity.ts` (+status/turns/questionIndex/phaseIndex) · mutation mới `sync-mock-interview-session-turns/*` · query mới `queries/flashcard-decks/my-in-progress-mock-interview-session/*` · `start-mock-interview-session-draw.service.ts` (abandon phiên cũ) · `grade-mock-interview-session-grading.service.ts` (đánh completed) · `interview.module.ts` + `flashcard-decks.module.ts` (wiring).
**FE:** `useMutateSyncMockInterviewSessionTurnsSwr` + `useQueryMyInProgressMockInterviewSessionSwr` (+ types) · route mới `learn/mock-interview/interview/[sessionId]/page.tsx` · `path/index.ts` (`.interview(sessionId)`) · `learn/layout.tsx` (fullBleed detection thêm route mới) · `MockInterview/index.tsx` (thread `resumeSessionId`) · `MockInterviewSession/index.tsx` (rehydrate + sync + resume card + `startSession` route sang trang mới).

## Verify
- `tsc --noEmit` sạch cả 2 repo (BE còn lỗi pre-existing không liên quan, 0 lỗi file mới/sửa) · `eslint --quiet` sạch.
- Đọc lại tay: ownership check qua relation (không qua `@RelationId` ảo, đúng [[be-relationid-not-queryable]]), no-op an toàn khi sync trễ/hết hạn (không throw giữa phiên sống), 24h window qua `MoreThanOrEqual`, resume card đúng vị trí dưới History.
- **CHƯA**: migrate DB thật, chạy browser thật (port bị session khác giữ cả ngày — xem [[preview-tool-cross-repo-workspace-limitation]]), test tay đầu-cuối.

## Bug thật phát hiện + sửa (workflow verify, adversarial — 2026-07-08)
Workflow `mock-interview-resume-verify` (fan-out review + phản biện độc lập từng finding) tìm ra 4 vấn đề, xác nhận 3 thật (1 bị bác bỏ đúng — xem dưới):
1. **Race condition rehydrate (high, ĐÃ SỬA):** `inProgressSessionSwr.isLoading` không phân biệt "query bị disable vì auth chưa init" với "đã fetch xong, không có phiên". Hard-refresh giữa chừng phiên → auth chưa resolve → guard tưởng đã "settled" → set `resumeError` vĩnh viễn (ref latch không recheck). Fix: thêm guard `keycloak.initialized` (2 flag riêng, `authenticated` không đủ).
2. **Stale closure `isQna`/`mode` (medium, ĐÃ SỬA):** `askNextTurn` đóng closure `mode` từ RENDER TRƯỚC `setMode` — resume 1 phiên `design` trong khi state mặc định `qna` → hỏi sai kind/questionIndex ở câu mở đầu. Fix: thêm param `modeOverride` cho `askNextTurn`, effect resume truyền `nextMode` tường minh thay vì đọc closure.
3. **Sync turns bắn thừa (medium, ĐÃ SỬA):** effect sync phụ thuộc cả object `syncTurnsSwr` (SWR mutation hook trả object MỚI mỗi render, chỉ `trigger`/`reset` mới memo) → bắn lại mỗi lần re-render không liên quan (streaming delta, tick đồng hồ mỗi giây) — spam mutation. Fix: tách `syncTurnsTrigger = syncTurnsSwr.trigger` (ổn định), effect phụ thuộc biến đó thay vì cả object.
4. **Bị bác bỏ (đúng):** nghi ngờ `resumeAttemptedRef` không reset khi client-navigate sang `sessionId` khác — thực tế `ContinueCard` dùng `href` (thẻ `<a>` thật) → full navigation → remount, ref tự reset. Không phải bug.

`next build` (production) fail vì lỗi ENGINE Turbopack nội bộ (panic "Dependency tracking is disabled", tái hiện 3 lần kể cả `.next` sạch) — xác nhận KHÔNG liên quan code mình, bug đã biết của Next.js 16 Turbopack backend. `tsc --noEmit` sạch tuyệt đối kể cả sau 3 fix trên.

## Gotcha vận hành phát sinh (2026-07-08, ngoài scope feature — note lại)
Lúc restart backend để load code mới, boot bị kẹt rất lâu (sync CDN toàn bộ challenge/content) vì `.mount/config/seed.yaml` đang có 1 block "FULL RESEED" bật tạm từ lúc thầy debug việc khác cùng ngày (Mock Interview stuck-loading) — quên tắt. Đã comment block + `mode: none` (đúng hướng dẫn ghi sẵn trong chính file) → boot nhanh lại bình thường. **Nếu cần reseed/reindex lại sau này, nhớ đây là chỗ bật.**

## Regression tự gây ra + sửa (thầy bắt được bằng tay, 2026-07-08)
Thầy test tay qua browser → vào `/interview/[sessionId]` chỉ thấy màn setup, không vào được phòng phỏng vấn, không thấy lỗi gì. Tra DB thấy 8 session bị tạo dồn dập trong ~50 giây (3 session trùng cùng 1 mili-giây) — dấu hiệu thầy bấm "Vào phòng phỏng vấn" lặp lại nhiều lần vì tưởng không hoạt động.

**Root cause:** chính fix #1 ở batch trước ("race condition rehydrate") tự nó có bug — gate theo `state.keycloak.initialized`, nhưng field này **KHÔNG BAO GIỜ được dispatch ở bất kỳ đâu trong toàn app** (verify bằng grep toàn repo, chỉ có definition + export, không có `dispatch(setInitialized(...))` nào). Kết quả: effect rehydrate bị guard chặn **vĩnh viễn**, không bao giờ chạy, không set lỗi, không rơi vào interview — mọi lần vào `/interview/[sessionId]` đều im lặng show setup như chưa từng bấm gì.

**Fix thật:** đổi gate sang tín hiệu THẬT — gọi lại `useQueryUserSwr()` (hook `SwrSideEffects` đã gọi 1 lần ở app root; SWR dedupe theo key nên gọi lại ở đây KHÔNG bắn thêm request, share cùng cache/loading state) và gate theo `authCheckSwr.isLoading` thay vì field chết `keycloak.initialized`.

**Bài học:** đây là bug LOẠI 2 — không phải logic sai, mà tin vào 1 field Redux "trông như đúng" (tên đọc hợp lý, có type, có setter) nhưng chưa bao giờ được wire thật. Trước khi gate theo 1 field state bất kỳ, PHẢI grep xác nhận có `dispatch(set<Field>(...))` ở đâu đó thật sự — không chỉ tin tên field.

## Nợ kiến trúc (thú nhận — 3 lần vá cùng 1 luồng)
Luồng `startSession → router.push(/interview/[id]) → route REMOUNT → effect rehydrate qua myInProgressMockInterviewSession` VỐN mong manh vì rehydrate dựa "session in_progress MỚI NHẤT" chứ không phải "session THEO ĐÚNG ID trong URL". 3 lỗi liên tiếp cùng gốc luồng này (thầy bắt từng cái bằng tay):
1. Auth gate field chết (`keycloak.initialized`) → effect treo → false expired.
2. `leaveInterview` dùng `setPhase("setup")` local → kẹt URL /interview thay vì về home.
3. **Stale SWR cache**: sau navigate+remount, effect đọc cache myInProgress CŨ (session trước) → không khớp id URL vừa tạo → false "hết hạn". Fix: `await inProgressSessionSwr.mutate()` TRƯỚC router.push (ghi session mới vào cache global, SWR dedupe qua remount).
**Fix hiện tại đúng cho single-tab + abandon-prior**, nhưng gốc rễ đúng hơn là thêm BE query `mockInterviewSession(sessionId)` FETCH-BY-ID để rehydrate theo đúng id URL (không phụ thuộc "latest in_progress"). Ghi nợ, chưa làm (tránh phình scope thêm). **Bài học meta:** đây là thay đổi cỡ-FEATURE (BE schema + route mới + đổi state machine) chạy nhầm qua skill nhẹ `block-brainstorm`/`block-apply` — thiếu bước `layout-brainstorm` (routing + hand-off state là 1 phần layout) nên các transition/rehydrate không được thiết kế 1 lần cho đủ, phải vá 3 lần. Lần sau: 1 "block" hoá ra đụng BE + route mới → CHUYỂN sang `layout-brainstorm` ngay.

## Trạng thái
✅ Code built + tsc/eslint verified + 3 bug race/stale-closure/spam đã tìm và sửa qua workflow phản biện · ✅ DB schema sync qua `synchronize=true` · ✅ backend runtime verify qua GraphQL introspection · ✅ **thầy test tay THẬT phát hiện 1 regression** (`keycloak.initialized` field chết) → đã sửa bằng tín hiệu thật (`useQueryUserSwr` dedupe) · ⬜ CHƯA test tay lại sau fix — giữ 🔨 trong BACKLOG theo [[feedback-dont-mark-done-without-real-verify]] tới khi thầy xác nhận resume chạy đúng qua browser.
