# Draft — Id từ query là OPAQUE global id (`toGlobalId`) → PHẢI `fromGlobalId(...).id` trước khi đưa vào mutation ăn raw db id (2026-06-25)

- File/§ đích khi `/merge`: `main.md` §1/§14 (BE↔FE id-contract) + `starci-async` (mutation wiring) + liên quan [[fe-swr-gate-must-match-be-enroll-guard]] (FE↔BE contract phải khớp).
- Bối cảnh: dashboard "Top học viên tuần" (`TopLearners`) — bấm "Theo dõi" KHÔNG ăn. Thầy: *"follow/unfollow không work, check backend api"*.

## Root cause (scan 2026-06-25) — id-contract lệch FE↔BE
- `globalLeaderboard.resolver` ENCODE id: `userGlobalId: toGlobalId(UserEntity.name, entry.userId)` → field `userGlobalId` là **opaque global id (base64)**, KHÔNG phải `users.id` thô. (Chủ ý: không lộ raw db id ra client.)
- `setFollow` mutation ăn **raw `users.id`** (`where: { following: { id: followingId } }`). FE `TopLearners` truyền thẳng `entry.userGlobalId` (đã encode) làm `userId` → backend không resolve được user → tạo edge với id rác → FK fail / no match → **follow im lặng không persist** ("không work"). Backend API ĐÚNG; FE gửi SAI loại id.

## Luật (STRICT)
- **Khi 1 query/list expose id dạng OPAQUE global id (resolver gọi `toGlobalId`), và bạn đưa id đó vào 1 mutation/query ăn RAW db id → PHẢI decode `fromGlobalId(globalId)?.id` TRƯỚC.** Đừng truyền thẳng global id vào API ăn raw id — mismatch = lỗi IM LẶNG (không throw rõ, chỉ "không có gì xảy ra").
- **Cách phát hiện:** 1 mutation "không work" mà không báo lỗi rõ → kiểm NGUỒN id: resolver của query cấp id đó có `toGlobalId(...)` không? Có → id là opaque → mutation ăn raw id sẽ fail. (Đối xứng với [[fe-swr-gate-must-match-be-enroll-guard]]: contract FE↔BE phải khớp.)
- **Decode ở FE call-site** (precedent có sẵn: `CourseOutline`/`CourseDetail` đã `fromGlobalId(selectedCourse)?.id` trước khi query). Giữ contract mutation = raw id (các surface có raw id như profile follow vẫn chạy). Util: `@/modules/utils/globalId` (`fromGlobalId` → `{ entityName, id } | null`).
- **Phân biệt nguồn id:** profile follow truyền `targetUserId` (raw, từ profile query) → chạy OK. Leaderboard/suggested-users encode → phải decode. KHÔNG giả định mọi `userId` cùng loại — soi resolver nguồn.

## ĐÃ ÁP DỤNG 2026-06-25 (FE)
- `TopLearners`: `userId: fromGlobalId(globalId)?.id ?? globalId` + đổi follow-only → **toggle thật** (`follow: !currentlyFollowing`, add/delete khỏi `followed`) → follow + unfollow đều chạy. Icon `FollowButton` → `UserPlusIcon`/`UserMinusIcon`. Row thêm separator (`border-b border-default` inset). tsc/eslint sạch.
- **FLAG (cùng bug, CHƯA fix):** `WhoToFollow` (dashboard) truyền `userId: globalId` y hệt — nếu `useQuerySuggestedUsersSwr` cũng encode id thì follow ở đó cũng hỏng. Cần decode tương tự + toggle. Thầy verify/cho làm.
- **Nợ data:** leaderboard KHÔNG trả `isFollowing` per-entry →初 state luôn "Theo dõi" (kể cả đã follow). Toggle trong-session đúng; muốn đúng init phải thêm field `isFollowing` (BE) hoặc fetch following-set riêng. Defer.
