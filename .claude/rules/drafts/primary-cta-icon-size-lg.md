# Draft — CTA chính = icon + `size="lg"`; nút KHÔNG icon = sub-CTA (size thường) (2026-06-25)

- File/§ đích khi `/merge`: `concepts/` (button/CTA) hoặc `elements/button.md`.
- Bối cảnh: thầy chỉ nút "Tiếp tục học" (CourseContents) — primary + PlayIcon nhưng đang `size="sm"`, muốn `lg`.
  Thầy chốt rule chung: *"mấy nút CTA kèm icon → size lg; non-icon = sub cta áp rule này"*.

## Luật (STRICT)
- **CTA CHÍNH (primary action của 1 surface) PHẢI có leading icon + `size="lg"`.** Icon + lg = "đây là hành động
  chính, to & rõ". Hợp với luật **1 primary action / surface**: nút lg+icon là cái-duy-nhất loud trên màn.
- **Nút KHÔNG icon = sub-CTA** → **size mặc định (md), KHÔNG lg.** Hành động phụ/thứ cấp (secondary/ghost/outline,
  hoặc primary nhưng vai phụ) để size thường, không icon → đọc như cấp dưới CTA chính.
- **Hệ quả:** mỗi surface tối đa 1 nút icon+lg (CTA chính). Nếu thấy 2 nút cùng icon+lg cạnh nhau → 1 trong 2 sai vai.
- **Ngoại lệ cần cân nhắc (KHÔNG auto):** FAB nổi (rounded-full trên canvas, vd MindMap), thanh mobile compact
  (CourseMobileEnrollBar) — context chật/đặc thù, có thể giữ md; hỏi trước khi ép lg.

## Scan source FE 2026-06-25 (primary + leading icon)
**Đã đúng `lg` (giữ):** `CourseDetail/CourseCtaButtons` (continue+enroll) · `EnrollGate` · `LessonReader/PremiumPaywall`.
**Đã sửa:** `CourseContents` resume (Play) `sm`→`lg` ✅.
**Candidate bump → `lg` (chờ thầy duyệt):**
- `PersonalProject/PersonalProjectDashboard` continue (Play) `sm` → lg — sibling y hệt CourseContents (cùng "home chrome").
- `landing/Landing` hero `onSeeCourses` (ArrowRight) md → lg.
- `landing/Landing` closing `onSeeCourses` (ArrowRight) md → lg.
- `landing/Landing/RecruiterProof` `onViewTalents` (ArrowRight) md → lg.
**Flag (hỏi, đặc thù):** `MindMapContinueButton` (Play, FAB rounded-full) · `CourseDetail/CourseMobileEnrollBar`
(continue+enroll, thanh mobile) · `PublicProfileLegacy/ProfilePinned` (Plus, LEGACY → skip).
- Caveat: grep multiline có thể bỏ sót nút mà `size` đặt trước `variant` hoặc icon là child thứ 2; nếu thầy duyệt áp
  loạt, em quét pass kỹ hơn (flashcards DueReviewHero/FlashcardReview… có thể còn).
