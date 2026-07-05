# Checkpoint: Fix "Hỏi nhanh" flashcard quiz (CRITIQUE → LAYOUT → Sonnet workflow implement)

Lưu lúc: 2026-07-05 18:34 (local machine). Repo này: `starci-academy-backend` (BE). Cặp repo: `starci-academy` (FE, cùng checkpoint mirror tại `.session/flashcard-quick-answer-recap-fix.md`).

## Đang làm gì
`/starci-fe-critique` phản biện tính năng "Hỏi nhanh" (Quick Answer flashcard cloze quiz) → thầy thua cả 7 hole →
chốt resolution cho từng hole → `/starci-fe-layout-brainstorm` vẽ + chốt layout recap screen mới → **đang** quất
Sonnet Workflow implement (BE fix trước, FE dùng contract đó dựng sau).

## Luồng còn treo (QUAN TRỌNG — đọc trước khi làm gì tiếp)
- **Workflow đang chạy nền:** task id `w8pjejj7u`, run id `wf_787b7a3b-be1` (script:
  `C:\Users\Cuong\.claude\projects\C--Repositories-ac-starci-academy-backend\34864604-543e-489d-9215-b4484623e12d\workflows\scripts\quick-answer-recap-fix-wf_787b7a3b-be1.js`).
  2 phase tuần tự: **Implement BE** (agent `be-quick-answer-fix`) → **Implement FE** (agent `fe-quick-answer-recap`,
  chỉ chạy SAU khi có kết quả BE vì cần đúng contract request/response mới).
  - Tại thời điểm lưu: BE agent **đã sửa file** (xem git status dưới) nhưng **CHƯA nhận được thông báo hoàn tất**
    (chưa đọc report cuối của agent — không biết BE đã xong hẳn hay còn đang chạy).
  - FE agent: chưa thấy dấu hiệu chạy (repo FE chưa có sửa đổi ở `InterviewSession/index.tsx`).
- **⚠️ CẢNH BÁO ĐỔI MÁY:** Workflow này ghi file TRỰC TIẾP vào working tree của **MÁY ĐANG CHẠY NÓ** (máy hiện tại).
  Nếu đổi máy TRƯỚC khi workflow xong: các thay đổi dở dang **KHÔNG tự chuyển sang máy mới** (khác máy = khác đĩa).
  Đồng thời `resumeFromRunId` của Workflow tool **CHỈ hoạt động CÙNG session** — mở session mới (máy khác) sẽ
  **KHÔNG resume lại được** bằng `wf_787b7a3b-be1`. Nếu phải đổi máy ngay:
  1. Trên máy NÀY: đợi workflow báo hoàn tất (hoặc chủ động hỏi Claude "check workflow w8pjejj7u" / `/workflows`).
  2. Verify tsc/eslint (BE: `npx tsc --noEmit -p tsconfig.json` + `npx eslint <file sửa>`; FE tương tự).
  3. Commit (KHÔNG push nếu chưa xin phép thầy) → rồi mới tắt máy.
  - Nếu KHÔNG đợi được: coi như phiên implement này BỎ DỞ trên máy này — trên máy mới phải bắt đầu lại bước
    "quất Workflow" (2 doc CRITIQUE.md + LAYOUT-BRAINSTORM.md ở FE vẫn còn, dùng lại được, không mất).

## Đã xong / đã chốt (khỏi làm lại)
- `CRITIQUE.md` (FE repo, `src/components/features/learn/Flashcards/InterviewSession/CRITIQUE.md`) — 8-lens
  phản biện + 7 hole + bảng resolution ĐÃ CHỐT (thầy thua cả 7).
- `LAYOUT-BRAINSTORM.md` (FE repo, cùng thư mục) — layout blueprint zone A-F + ma trận 6 state (rỗng/1/N/
  overflow/mixed/special) đã vẽ + widget đã render + thầy xem qua (chưa nghe phản đối, coi như duyệt ngầm khi
  gõ "xúc").
- Workflow script đã author xong (2 agent prompt BE+FE grounded từ 2 doc trên) — không cần viết lại nếu resume
  cùng session (`Workflow({scriptPath, resumeFromRunId: "wf_787b7a3b-be1"})`); nếu session mới → phải re-run từ
  đầu (viết lại script hoặc dùng lại nội dung 2 doc để author script mới).

## Bước tiếp theo cụ thể (thứ tự)
1. Check trạng thái workflow `w8pjejj7u`/`wf_787b7a3b-be1` (còn chạy / đã xong / lỗi).
2. Đọc report cuối của agent BE (`be-quick-answer-fix`) — xác nhận: request/response shape cuối cùng của
   `completeFlashcardQuizSession`, có làm được weak-tag lesson-link mapping không, đã thêm migration chưa.
3. Nếu FE agent (`fe-quick-answer-recap`) đã chạy xong — đọc report, xác nhận Zone C/D/E/F đã implement đủ chưa.
4. Verify tsc + eslint CẢ 2 repo (chỉ trên các file agent đã sửa, tránh lẫn với các file KHÔNG-liên-quan khác
   đang nằm sẵn trong working tree — xem mục git state dưới, CHỈ những file liệt kê ở đây là của việc này).
5. Test thủ công 6 state trên browser (dev server, xem `.claude/launch.json` config `backend`/`frontend`).
6. Hỏi thầy: verify OK chưa, có commit/push không (KHÔNG tự ý commit/push).

## Trạng thái git lúc lưu (CHỈ file liên quan việc này — bỏ qua mọi file khác không liên quan đang có trong working tree)
Repo `starci-academy-backend`, branch `mtp`:
```
M src/features/api/core/graphql/mutations/flashcard/complete-flashcard-quiz-session/complete-flashcard-quiz-session.resolver.ts
M src/features/api/core/graphql/mutations/flashcard/complete-flashcard-quiz-session/graphql-types/request.ts
M src/features/api/core/graphql/mutations/flashcard/complete-flashcard-quiz-session/graphql-types/response.ts
M src/modules/bussiness/flashcard/flashcard-quiz-session.service.ts
M src/modules/bussiness/flashcard/types/flashcard-quiz-session.ts
```
Repo `starci-academy` (FE), branch `mtp` (**đã xác nhận thật** — không phải do việc này, do 1 việc KHÁC không
liên quan — CV/MockInterview — đã chuyển branch từ trước; local branch `mtp` cũng có trên `origin/mtp`):
```
(chưa thấy InterviewSession/index.tsx đổi tại thời điểm lưu checkpoint — FE agent có thể chưa chạy tới)
```
**Lưu ý riêng:** FE repo hiện có RẤT NHIỀU file sửa đổi/mới KHÔNG liên quan tới việc này (CV, MockInterview,
job-readiness...) — đó là 1/nhiều việc dở KHÁC, có `CRITIQUE.md`/`LAYOUT-BRAINSTORM.md` riêng ở
`src/components/features/profile/CV/` và `src/components/features/learn/MockInterview/`. Nếu cần checkpoint
cho việc đó, viết file `.session/` RIÊNG cho nó (đừng gộp vào file này).
