# Proposal — CTA/Link fix batch 1, scope `learn`

- **Status:** ✅ DONE (2026-07-08) — tsc/eslint clean trên cả 8 file sửa; browser click-through CHƯA verify (xem ghi chú Verify chung)
- **Nguồn:** `cta-link-learn.audit.md` (audit ngầm, 31 finding, scan 2026-07-08)
- **Chọn:** top 5 finding rank cao nhất (❌ dead-end/dead-link/gate-bypass, breadth cao nhất)

## 1. LessonReader right-rail — CTA hierarchy + gate bypass
- **Finding #1 + #2** (audit) — `OnThisPage/LessonFlashcards/index.tsx:74` + `OnThisPage/LessonChallenges/index.tsx:102`.
- **Vấn đề:** 2 CTA cùng `variant="primary" size="sm"` cạnh nhau (Hick's Law) + thiếu `ArrowRightIcon` trailing; `LessonChallenges.onPractice` (`:81-83`) dispatch+`router.replace` thẳng, **bỏ qua check gate premium/enrollment** đã có ở `LessonReader/index.tsx:277`.
- **Fix:** demote 1 CTA xuống `secondary` (giữ Challenges = primary, Flashcards = secondary, theo ưu tiên luyện tập > ôn tập); thêm `ArrowRightIcon` trailing cho primary; route `onPractice` qua handler gate ở `LessonReader/index.tsx` thay vì dispatch/replace trực tiếp.
- **Route:** `block-apply` (2 block nhỏ, cùng PR).
- **Verify:** tsc/eslint + preview lesson đã enroll vs chưa enroll — xác nhận nút Challenges bị khoá đúng khi premium/chưa enroll.

## 2. CourseQa — author reference dead text
- **Finding #3 + #4** — `QuestionRow/index.tsx:151-152` (câu hỏi), `CommentItem.tsx:97-99` (câu trả lời).
- **Vấn đề:** tên người dùng render `<Typography>`/`<span>` tĩnh, không phải link tới profile — vi phạm content-linking §2.
- **Fix:** thay bằng `EntityLink` (hoặc Link tới `/profile/[username]` nếu EntityLink chưa cover case này) cho cả avatar+tên, 2 call-site.
- **Route:** `block-apply`.
- **Verify:** tsc/eslint + preview click tên → tới đúng profile.

## 3. Leaderboard — user row dead text
- **Finding #5** — `LeaderboardTable:94`, `LeaderboardPodium:59`, `LeaderboardChampion:39`.
- **Vấn đề:** `hover:bg-default-50` gợi ý bấm được nhưng không có link — cả 3 state (table/podium/champion) đều thiếu.
- **Fix:** wrap avatar+username bằng Link/EntityLink tới profile, giữ nguyên style hover đã có.
- **Route:** `block-apply`.
- **Verify:** tsc/eslint + preview click ở cả 3 state.

## 4. MindMap — thiếu back-affordance khỏi full-bleed canvas
- **Finding #6** — `MindMap/index.tsx`, `Canvas/index.tsx` (không có breadcrumb/back-link nào).
- **Vấn đề:** canvas full-bleed-no-chrome không có đường thoát tường minh — chỉ có thể rời bằng cách click 1 node (forward, không phải back).
- **Fix:** thêm 1 back-link/nút nổi góc canvas (kiểu overlay, không phá full-bleed) quay về course-contents.
- **Route:** `block-apply` (thêm 1 block nhỏ vào Canvas, không đổi shell).
- **Verify:** tsc/eslint + preview — bấm back từ mind-map về đúng course-contents.

## 5. ContentAiChat — credit-exhausted dead end
- **Finding #7** — `ContentAiChat/index.tsx:288-303`.
- **Vấn đề:** lỗi hết credit/quota chỉ hiện `⚠️ {error}`, không có CTA upgrade — trong khi `onUpgrade` đã tồn tại (dùng trong model-picker dropdown, `GradeModelDropdown/index.tsx:491-515`), chỉ chưa được gọi từ error-bubble.
- **Fix:** trong `onDone` error handler, detect lỗi quota/credit (match message) → render kèm nút "Nâng cấp →" (`variant="primary"`, dùng lại route/callback `onUpgrade` đã có).
- **Route:** `block-apply`.
- **Verify:** tsc/eslint + preview giả lập lỗi hết credit (mock response) → xác nhận nút upgrade hiện + route đúng `/profile/ai-subscription`.

## Verify chung (cả batch)
- ✅ `tsc --noEmit` (toàn repo) + `npm run lint` (toàn repo) — sạch trên cả 8 file sửa (`LessonFlashcards`, `LessonChallenges`, `QuestionRow`, `CommentItem`, `LeaderboardTable`, `LeaderboardPodium`, `LeaderboardChampion`, `MindMapBackButton`+`Canvas`, `ContentAiChat`). 41 lỗi lint pre-existing còn lại đều ở file KHÔNG liên quan (`.br.mjs`, `Skeleton/*`, scripts, `useSessionSuperseded.ts`) — không phải do batch này.
- ⏳ Preview click-through từng surface (CourseQa/Leaderboard link, MindMap back, ContentAiChat upgrade CTA, LessonReader gate) — **CHƯA verify**: dev server FE (`C:\Repositories\starci-academy`) chạy ở process riêng ngoài workspace tracking của session này, Preview MCP tool không bind được serverId cross-repo (`preview_start` trả serverId nhưng `preview_logs`/`preview_list` báo "no running servers for this workspace" ngay sau đó). Xác nhận server sống qua `curl localhost:3000/en` → 200. Cần verify thủ công hoặc chạy session gốc tại `C:\Repositories\starci-academy`.

## Sau khi build
- ✅ Đánh dấu ✅ DONE ở `BACKLOG.md` + cập nhật status finding #1-7 → ✅ ở `cta-link-learn.audit.md` (giữ nguyên #8-31 ⬜ cho batch sau).
