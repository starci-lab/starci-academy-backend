# Concept — Luồng "Học thử" (preview, chưa enroll): query/service KHÔNG được throw vì thiếu enrollment

> Heuristic engineering (họ `concepts/*`). Rút từ nút "Học thử" → `myCourseOutline` throw `EnrollmentNotFoundException`. Bổ trợ [[premium-gate-is-enrollment-not-vip]] + [[fair-monetization-axiom]] (entitlement theo enroll, không count).

## Quy tắc (STRICT)
- **Query phục vụ cả luồng PREVIEW/trial (có entry cho người CHƯA enroll) PHẢI coi enrollment là TUỲ CHỌN, KHÔNG throw.** Vd `myCourseOutline`: không có enrollment → trả outline **read-only preview** (progress RỖNG: mọi bài `isRead=false`, challenge/task chưa làm, `currentTask`/`nextContentTask` = bài đầu), KHÔNG ném exception. Premium vẫn gắn cờ `isPremium` để FE khoá. Chỉ throw not-found khi **course thật sự không tồn tại**.
- **Tách "cái cần enrollment" ra nhánh `if (enrollment)`:** progress service (challenge + capstone) scope theo `enrollment.id` → chỉ chạy khi có enrollment; preview thì để map rỗng. `displayId` lấy từ enrollment.course khi có, else lookup course trực tiếp.
- **Trước khi cho 1 entry point (nút/route) dẫn người CHƯA enroll vào 1 surface, kiểm MỌI query surface đó gọi** — query nào `MustEnrolled`/throw-khi-thiếu-enrollment sẽ làm vỡ CẢ TRANG. Hoặc query chịu preview (empty state), hoặc surface phải tự ẩn/redirect cho non-enrolled. ĐỪNG để entry "học thử" trỏ vào surface mà data của nó bắt buộc enrollment.
- **Gỡ enroll-guard ở API (resolver) cho các ACTION người chưa enroll được làm** (đọc/tương tác nội dung, discussion, challenge, submission) — GIỮ auth-only (`KeycloakAuthGraphQLGuard`). GIỮ enroll-only cho personal-project/milestone/livestream (capstone = chỉ học viên đã enroll). Premium content vẫn khóa ở reader (`isEntitled` → lock body).
- **Enrollment NGẦM trong SERVICE cũng phải gỡ, không chỉ guard:** vd `listDue` từng INNER JOIN `EnrollmentEntity` → non-enrolled = 0 thẻ. Bỏ join để trial dùng được. ⚠️ Nhưng bỏ join có thể mở nội dung premium ngoài ý muốn (nếu entity không có cờ premium) → phải lọc premium qua liên kết content/module, không mất ranh giới.
- **FE SWR gate phải KHỚP BE guard:** khi BE gỡ enroll-guard cho 1 surface, FE hook PHẢI bỏ `enrolled` khỏi điều kiện gate key (nếu không, query không fire cho non-enrolled → UI rỗng "ngầm"). Giữ `enrolled` trong key array (revalidate khi enroll đổi), chỉ bỏ khỏi ĐIỀU KIỆN gate.

## Liên quan
- [[premium-gate-is-enrollment-not-vip]] (gate = enroll khóa, không VIP) · [[fair-monetization-axiom]] (entitlement theo enroll/tier, không count) · [[envelope-response-data-must-be-nullable]] (shape BE che lỗi runtime).
