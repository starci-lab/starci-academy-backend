# Rule — Field `data` của MỌI GraphQL envelope response PHẢI `nullable: true`

**Response type `extends AbstractGraphQLResponse` phải khai `@Field(() => X, { nullable: true }) data: X | null` — error-path của `GraphQLTransformInterceptor` luôn trả `data=null`, non-nullable sẽ crash và CHE lỗi thật.**

- `GraphQLTransformInterceptor` (`src/modules/api/apollo/server/interceptors/graphql-transform.interceptor.ts`): success `map(data => ({ data, message, success: true }))`; error `catchError` → `{ success: false, message, error }` — không set `data` → `null`.
- Non-nullable `data` + error path → GraphQL ném *"Cannot return null for non-nullable field …Response.data"*, đè lên lỗi thật (`err.message`). Thấy message này → nghi field thiếu `nullable: true` TRƯỚC, đừng đi tìm lỗi data giả.

> Đã áp: `globalLeaderboard`/`blogPost`/`blogPosts` (đúng convention); rule đầy đủ đã viết ở FE khi sweep contract FE↔BE.
> Nguồn thật: `src/modules/api/apollo/server/graphql-types/object-types/graphql-response.ts` (`AbstractGraphQLResponse`).
> **Cross-link — nội dung đầy đủ ở** [[envelope-response-data-must-be-nullable]] (`.claude/fe/engineering/`) — file này là 1 rule THUẦN BACKEND lọt sang bên fe/ lúc dọn cây; xem đó là bản chính, đây chỉ là pointer + anchor nguồn BE thật.
