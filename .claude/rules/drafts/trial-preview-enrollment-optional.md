# Draft — Luồng "Học thử" (preview, chưa enroll): query KHÔNG được throw vì thiếu enrollment (2026-06-21)

- File/§ đích khi `/merge`: `main.md` §14 (heuristics) + doc BE query-guard.
- Bối cảnh: nút **"Học thử" (`course.tryLearning`, dành cho người CHƯA enroll)** route tới `/learn/content` →
  `CourseContents` → `myCourseOutline`. Handler `myCourseOutline` **throw `EnrollmentNotFoundException`** khi không
  có enrollment → trang lỗi "Không tải được nội dung khóa học" (cả rail + main). Thầy: *"luồng học thử bị lỗi chưa enroll"*.

## Luật (STRICT)
- **Query phục vụ cả luồng PREVIEW/trial (có entry cho người chưa enroll) PHẢI coi enrollment là TUỲ CHỌN, KHÔNG
  throw.** `myCourseOutline`: nếu không có enrollment → trả outline **read-only preview** (progress RỖNG: mọi bài
  `isRead=false`, challenge/task chưa làm, `currentTask`/`nextContentTask` = bài đầu), KHÔNG ném exception. Premium
  vẫn gắn cờ `isPremium` để FE khoá. Chỉ throw not-found khi **course thật sự không tồn tại** (không resolve được displayId).
- **Tách "cái cần enrollment" ra nhánh `if (enrollment)`:** 2 progress service (challenge + capstone) scope theo
  `enrollment.id` → chỉ chạy khi có enrollment; preview thì để map rỗng. `displayId` lấy từ `enrollment.course` khi
  có, else lookup course trực tiếp. (Guard resolver giữ `KeycloakAuthGraphQLGuard` = chỉ cần login, KHÔNG MustEnrolled.)
- **Nguyên tắc tổng quát:** trước khi cho 1 entry point (nút/route) dẫn người **chưa enroll** vào 1 surface, kiểm
  MỌI query surface đó gọi — query nào `MustEnrolled`/throw-khi-thiếu-enrollment sẽ làm vỡ cả trang. Hoặc query
  chịu preview (empty state), hoặc surface phải tự ẩn/redirect cho non-enrolled. ĐỪNG để 1 entry "học thử" trỏ vào
  surface mà data của nó bắt buộc enrollment.

## ĐÃ FIX 2026-06-21 (BE)
- `my-course-outline.handler.ts`: enrollment optional → preview empty-progress; progress services gói trong
  `if (enrollment)`; `displayId` từ enrollment-course hoặc lookup; chỉ throw khi không resolve được course. Luồng
  enrolled KHÔNG đổi.
- **Còn lại (chưa đụng):** discussion (comment/reaction) vẫn `GraphQLMustEnrolledGuard` → với trial đọc bài free sẽ
  lỗi/không hiện. Reader content + content-status = auth-only (OK cho trial). Cân nhắc **ẩn khối Discussion khi
  chưa enroll** (hỏi thầy).

## CHỐT 2026-06-23 (thầy: "bỏ not enroll nơi api cho các action đó")
- **Bỏ `GraphQLMustEnrolledGuard` ở API (resolver)** cho các ACTION mà người chưa enroll được làm: **đọc/tương tác
  nội dung** (mark-as-readed, toggle-favourite), **discussion** (content-reactions, content-comments,
  create/update/delete/react-comment, react-to-content), **challenges** (challenge, challenges,
  challenge-submission(s), submit-challenge-submission, sync-submission, submit-eval-challenge). Giữ
  `KeycloakAuthGraphQLGuard` (vẫn cần login).
- **GIỮ enroll-only:** personal-project (review/submit-github/sync), milestone(s), task, livestream-sessions,
  incompleted-jobs (capstone + sự kiện = chỉ học viên đã enroll). Premium content vẫn khóa ở reader (content.handler
  `isEntitled` → lock body) nên action trên bài premium thực tế không tới được.
- **Đã làm:** gỡ guard + import `GraphQLMustEnrolledGuard` ở 16 resolver (tsc resolver sạch; baseline lỗi chỉ ở
  `.spec` cũ). **Lưu ý chưa runtime-test:** service submit/grade có thể còn giả định enrollment (scope/attempt) →
  nếu guest nộp bài lỗi, cần làm service **enrollment-optional** (như `my-course-outline.handler` đã làm).

## CHỐT 2026-06-23 (mở flashcards/leaderboard/foundations cho non-enrolled)
- **FE**: gỡ 3 surface khỏi `ENROLL_REQUIRED_SURFACES` (learn `layout.tsx`) + bỏ `locked` ở sidebar
  (`useSidebarNavItems`); chỉ còn **personal-project** gate. Thêm i18n `enrollGate.{title,description,cta,locked}`.
- **BE service (gốc enrollment NGẦM, không phải guard):** `flashcard-review.service.ts` `listDue` trước **INNER JOIN
  `EnrollmentEntity`** (chỉ thẻ của khóa đã enroll) → non-enrolled = 0 thẻ. **Đã bỏ join** → trial review được.
  `review`/grade vốn đã auth-only (chỉ check card tồn tại). leaderboard + foundations resolver/handler đã auth-only,
  không cần đụng.
- **Caveat "non-premium":** `FlashcardDeckEntity` KHÔNG có cờ premium (premium nằm ở content/module liên kết) → bỏ
  enrollment join là **mở MỌI deck cho mọi người** (kể cả enrolled giờ thấy due-card xuyên khóa). Muốn lọc đúng
  "non-premium" phải JOIN qua `flashcard_deck_contents → content.isPremium`. Chưa làm — hỏi thầy nếu cần khóa premium.
