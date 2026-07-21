# Rule — Field id từ `toGlobalId(...)` là OPAQUE — mutation ăn raw db id phải `fromGlobalId(...).id` trước

**Resolver expose id qua `toGlobalId(Entity.name, rawId)` (chủ ý không lộ raw db id) — bất kỳ nơi nào (FE hoặc BE) đưa id đó vào chỗ ăn raw `entity.id` phải decode `fromGlobalId(globalId)?.id` trước, không truyền thẳng.**

- Trộn 2 loại id (opaque global id vs raw db id) là lỗi **im lặng** — không throw rõ, chỉ "mutation không persist"/FK không match.
- Cách phát hiện: 1 field id không work rõ nguyên nhân → soi resolver NGUỒN cấp field đó có gọi `toGlobalId(...)` không. Có → mọi consumer của field này phải decode trước khi dùng làm raw id.
- Không phải mọi `userId` cùng loại: id từ 1 query profile có thể raw, id từ leaderboard/suggested-users có thể encode — luôn soi resolver nguồn, không giả định.

> Đã áp thật ở BE: resolver dùng `toGlobalId(UserEntity.name, entry.userId)` khi expose `userGlobalId` (leaderboard/suggested-users); mutation follow/unfollow ăn raw `users.id`.
> **Cross-link — nội dung đầy đủ (kèm case FE cụ thể) ở** [[opaque-global-id-must-decode-before-raw-id-mutation]] (`.claude/fe/engineering/`) — rule THUẦN BACKEND (id-contract do BE resolver quyết định) lọt sang fe/ lúc dọn cây; bản chính ở đó, đây là pointer.
