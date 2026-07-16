# Concept — Id từ query là OPAQUE global id (`toGlobalId`) → PHẢI `fromGlobalId(...).id` trước khi đưa vào mutation ăn raw db id

> Heuristic engineering (họ `concepts/*`, BE↔FE id-contract). Cùng họ "lỗi im lặng vì id lệch loại" với [[chat-session-list-lazy-create-and-search]] (caller cầm id khác loại) + [[fe-swr-gate-must-match-be-enroll-guard]] (contract FE↔BE khớp).

## Root cause (id-contract lệch FE↔BE)
- Resolver ENCODE id: `userGlobalId: toGlobalId(UserEntity.name, entry.userId)` → field là **opaque global id (base64)**, KHÔNG phải `users.id` thô (chủ ý: không lộ raw db id ra client).
- Mutation ăn **raw `users.id`** (`where: { following: { id: followingId } }`). FE truyền thẳng global id → backend không resolve được user → edge với id rác → FK fail / no match → **mutation im lặng không persist** ("không work"). Backend API ĐÚNG; FE gửi SAI loại id.

## Luật (STRICT)
- **Khi 1 query expose id dạng OPAQUE global id (resolver gọi `toGlobalId`), và bạn đưa id đó vào 1 mutation/query ăn RAW db id → PHẢI decode `fromGlobalId(globalId)?.id` TRƯỚC.** Đừng truyền thẳng global id vào API ăn raw id — mismatch = lỗi IM LẶNG (không throw rõ, chỉ "không có gì xảy ra").
- **Cách phát hiện:** 1 mutation "không work" mà không báo lỗi rõ → kiểm NGUỒN id: resolver của query cấp id đó có `toGlobalId(...)` không? Có → id opaque → mutation ăn raw id sẽ fail.
- **Decode ở FE call-site** (precedent: `CourseOutline`/`CourseDetail` đã `fromGlobalId(selectedCourse)?.id` trước query). Giữ contract mutation = raw id. Util `@/modules/utils/globalId` (`fromGlobalId` → `{ entityName, id } | null`).
- **Phân biệt nguồn id:** id từ profile query có thể là raw (chạy OK); leaderboard/suggested-users encode → phải decode. KHÔNG giả định mọi `userId` cùng loại — soi resolver nguồn.

## Liên quan
- [[chat-session-list-lazy-create-and-search]] (gateway resolve `sub → users.id` trước khi gọi service — 2 đường gọi phải truyền CÙNG loại id) · [[fe-swr-gate-must-match-be-enroll-guard]] · [[envelope-response-data-must-be-nullable]] (cùng họ lỗi BE bị che).
