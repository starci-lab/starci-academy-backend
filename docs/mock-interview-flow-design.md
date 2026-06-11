# Mock Interview Flow — Design Doc

> Trạng thái: **P0 BE đã implement** (2026-06-11) · STT chốt **FE Web Speech API (free)**, BE chỉ nhận text.
> Liên quan: [[quiz-feature]] (flashcard deck = ngân hàng câu hỏi), [[ai-feature]] (balancer + entitlement), [[challenge-criteria-redesign]] (mô hình chấm theo criteria).

## 1. Mục tiêu & phạm vi

Cho phép học viên **luyện phỏng vấn bằng giọng nói**: chọn một deck (theo chủ đề/role), hệ thống hiện câu hỏi, học viên **nói** câu trả lời, trình duyệt chuyển giọng → text (Web Speech API), BE **chấm free-text** dựa trên đáp án mẫu của card và trả về điểm + feedback + câu hỏi follow-up.

**P0 (đã build, BE):**
- Tái dùng **flashcard deck/card** làm ngân hàng câu hỏi; `card.answer` (3-block) = rubric chấm.
- GraphQL mutation `gradeInterviewAnswer` (stateless — không lưu attempt).
- Tái dùng AI grading stack thật: `AiInvokeService.invoke` + `resolveGradingInvokeOptions` + `AiEntitlementService` (lane Auto, pinned model).

**Ngoài phạm vi P0 (v1+):** lưu attempt + lịch sử; TTS đọc câu hỏi; STT server-side (Google/Whisper) cho browser không hỗ trợ; multi-turn; honor Premium/Byok lane; quota debit/pre-flight gate.

## 2. Implementation P0 (BE) — đã có trên đĩa

Bussiness (gộp vào module `flashcard` vì ngân hàng câu hỏi CHÍNH LÀ flashcard):
- `src/modules/bussiness/flashcard/types/interview-grade.ts` — enum `InterviewVerdict` + interfaces (`GradeInterviewAnswerParams`, `InterviewGradeResult`, prompt params/result).
- `src/modules/bussiness/flashcard/interview-grade-prompt.service.ts` — `InterviewGradePromptService.build`: prompt chấm (STT caveat, strictness theo `level`, feedback theo locale, ví dụ strict-JSON).
- `src/modules/bussiness/flashcard/interview-grading.service.ts` — `InterviewGradingService.grade`: load deck (`FlashcardDeckReadService.getById`) → tìm card server-side → guard answer null → resolve lane Auto → `AiInvokeService.invoke` → parse + normalize (clamp score 0–100, coerce verdict).
- Exception mới: `FlashcardCardMissingAnswerException` (card legacy answer null).

GraphQL (`src/features/api/core/graphql/mutations/interview/grade-interview-answer/`): command/handler/service/resolver/module + `graphql-types/{enums,request,response}`; aggregator `interview/interview.module.ts` đăng ký trong `mutations.module.ts` (`isGlobal: true`).

**Mutation:** `gradeInterviewAnswer(input: { flashcardDeckId, flashcardCardId, transcript, mode? })` → `InterviewGradeResult { score, verdict(PASS|BORDERLINE|FAIL), strengths[], gaps[], modelAnswerHint, followUpQuestion }`. Locale lấy từ `@GraphQLLocale()` (convention repo), không từ input. Guard `KeycloakAuthGraphQLGuard`.

**Verify:** tsc 0 lỗi ở file mới (kiểm độc lập), eslint --fix exit 0. CHƯA chạy runtime (app chưa boot).

## 3. Quyết định kiến trúc (đã chốt)
- STT 100% **FE Web Speech API**; BE không đụng audio.
- Chấm dùng **lane Auto** (free, pinned model) cho P0. Premium/Byok cần model+provider client không gửi → defer P1.
- Server load card từ deck → **không tin** question/rubric từ client.
- Prompt nhắc model: transcript từ STT có thể sai chính tả/thuật ngữ → **chấm theo ý**, strictness theo `card.level`, feedback theo locale, output **strict JSON**.

## 4. Luồng end-to-end
```
FE: chọn deck → hiện card.question → bấm "Trả lời"
    → webkitSpeechRecognition (lang vi-VN/en-US) → transcript
    → [cho sửa transcript] → submit
BE: gradeInterviewAnswer(deckId, cardId, transcript, mode?)  [locale từ context]
    → load card (question + answer rubric) → resolve lane Auto
    → AiInvoke → parse strict-JSON → { score, verdict, strengths, gaps, hint, followUp }
FE: hiện điểm + feedback + "Câu tiếp"
```

## 5. FE — Web Speech API (chưa build)
- `window.SpeechRecognition || window.webkitSpeechRecognition`; `lang` theo locale; `interimResults`; **cho sửa transcript** trước khi nộp; **fallback gõ tay** (Firefox/Safari cũ không hỗ trợ — bắt buộc có). Pattern: local `useSWR` + gọi `mutate*` trực tiếp (như Quiz/Practice).

## 6. Phân kỳ
- **P0 (DONE, BE):** mutation `gradeInterviewAnswer` stateless, lane Auto.
- **P1:** lưu `interview_attempt` (history + stats); honor Premium/Byok lane + quota debit/pre-flight gate; FE trang Phỏng vấn thử (Web Speech + fallback).
- **P2:** multi-turn (AI hỏi follow-up có ngữ cảnh).
- **P3:** TTS đọc câu hỏi; STT server-side (Google/Whisper); phân tích tốc độ nói (cần audio).

## 7. Open questions (còn cần thầy chốt)
1. Lưu attempt (P1 entity) hay giữ stateless lâu hơn?
2. Lane: giữ Auto-free, hay mở Premium cho gói trả phí?
3. FE: tab riêng cấp khóa hay mode trong trang Quiz?
4. 1 deck/phiên hay trộn nhiều deck theo role/level?
5. Giới hạn: số lần chấm/ngày + độ dài transcript tối đa?

## 8. Lưu ý vận hành
- Content course (gồm flashcard deck) author + commit ở **`.gitrefs/data`** (git repo `StarCi-Academy/data`), KHÔNG phải `.mount/data` (bind-mount cache, có thể đứt) — xem [[git-memory]].
