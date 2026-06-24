# Draft — Flashcard "đến hạn hôm nay" sai (449 thẻ): thiếu course-scope + không cap thẻ mới/ngày (2026-06-25)

- File/§ đích khi `/merge`: `main.md` §14 (heuristics biz) + doc flashcard SRS. Repo BE: `starci-academy-backend`.
- Bối cảnh: trang Ôn tập (`/learn/flashcards`) SD hiện **"449 thẻ đến hạn hôm nay"** cho user gần như mới. Thầy: *"sao đến hạn hôm nay lại cần 449 thẻ? scan biz lại"*.

## Root cause (scan 2026-06-25) — 2 lỗi cộng dồn
1. **`listDue` KHÔNG scope theo course** (`flashcard-review.service.ts` `listDue` — chỉ nhận `userId/limit/locale`). Query join `deck` nhưng **không filter courseId** → đếm thẻ đến hạn của **MỌI deck của MỌI course** toàn hệ thống, không riêng course đang xem. (Trầm trọng hơn vì enrollment join đã gỡ cho trial — [[trial-preview-enrollment-optional]] — nên hết ranh giới.) Trang SD nhưng 449 = global.
2. **Thẻ chưa-ôn-lần-nào = "due", không có cap thẻ-mới/ngày.** Điều kiện due ở cả `listDue` (L92) lẫn `flashcard-deck.service.ts` dueCount (L141): `review.id IS NULL OR review.due_at <= now()`. Vế `review.id IS NULL` = chưa ôn lần nào → tính đến hạn. User mới → MỌI thẻ "đến hạn", KHÔNG có giới hạn thẻ-mới/ngày kiểu Anki (~20/day) → đổ nguyên backlog vào "hôm nay".
→ **449 = tổng thẻ chưa-ôn-lần-nào trên toàn bộ course** (global, no daily cap).

## ✅ ĐÃ CODE 2026-06-25 (tsc BE+FE sạch; cần RESTART backend vì đổi GraphQL schema)
- **BE** `listDue`: thêm `courseId?` (optional — có→scope `deck.course_id`, không→global cho dashboard) + tách `dueReviewCount` (overdue) / `newTotalCount` (never-reviewed) / `newCount = min(newTotalCount, DAILY_NEW_LIMIT=20)`; `dueCount = dueReviewCount + newCount`. Queue: overdue trước rồi fill new (capped). GraphQL response thêm 3 field + resolver thêm arg `courseId` (nullable).
- **FE**: query/types/hook `useQueryMyDueFlashcardsSwr(courseId?, limit?)` + Flashcards landing (`DueReview` + `DueReviewHero`) truyền `courseId` (từ `state.course.entity?.id`), shared SWR key courseId-aware → "đến hạn hôm nay" scope SD + cap. Dashboard giữ global (cap vẫn áp → hết 449).
- **CÒN LẠI (optional, chưa làm):** (a) per-deck `dueCount` ("10 đến hạn" ở `flashcard-deck.service.ts`) chưa tách new/overdue — bounded theo deck size nên thấp ưu tiên; (b) hero UI mới hiện `dueCount` (chưa hiện breakdown "X ôn lại · Y mới" — có field sẵn `dueReviewCount`/`newCount` nếu muốn polish); (c) cap chưa enforce hard daily limit (refill khi học xong — chấp nhận theo design).

## Fix đã CHỐT hướng (thầy duyệt 2026-06-25)
1. **Scope `listDue` theo course.** Thêm `courseId` vào `ListDueFlashcardsParams` + filter query (join deck → content/module → course, hoặc deck.courseId nếu có) → "đến hạn hôm nay" trên trang 1 course chỉ đếm thẻ của course đó. FE truyền courseId hiện tại. (Lỗi scope rõ ràng — ưu tiên cao nhất.)
2. **Cap thẻ-mới/ngày (Anki-style).** Tách "due" = (a) overdue reviews (`due_at <= now()`) + (b) thẻ mới (`review.id IS NULL`) GIỚI HẠN `min(new, dailyNewCap)` (cap configurable, vd 20). "Đến hạn hôm nay" = a + b-capped → ra batch hợp lý, hết 449. Cần track "đã giới thiệu bao nhiêu thẻ mới hôm nay" (per user per day) hoặc đơn giản cap hiển thị.
3. **Tách "mới" vs "ôn lại đến hạn" ở UI/count.** Đừng gộp 1 con số "đến hạn hôm nay": trả riêng `dueReviewCount` (overdue) + `newCount` (chưa ôn) → FE hiển thị "X thẻ ôn lại đến hạn · Y thẻ mới". User mới: 0 ôn-lại + 449 mới (rõ nghĩa, không hoảng). Kết hợp với #2 (cap new) cho gọn.

## Nguyên tắc rút ra
- **"Đến hạn hôm nay" (daily SRS queue) PHẢI có biên:** (a) scope đúng phạm vi đang xem (course), (b) cap thẻ-mới/ngày — KHÔNG đổ toàn bộ never-reviewed backlog vào "hôm nay". Never-reviewed ≠ "đến hạn hôm nay"; nó là "thẻ mới chờ học", nên tách hoặc cap.
- Đụng cả `listDue` (top count + queue) lẫn `flashcard-deck.service.ts` dueCount (per-deck "10 đến hạn") — sửa điều kiện due nhất quán 2 chỗ.
