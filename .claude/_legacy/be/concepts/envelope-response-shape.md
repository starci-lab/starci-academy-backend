# Concept — Envelope response shape (GraphQL + REST)

> Mọi GraphQL operation trả `AbstractGraphQLResponse` (`src/modules/api/apollo/server/graphql-types/object-types/graphql-response.ts`) — resolver chỉ trả entity thật, interceptor tự bọc envelope.

- Shape chuẩn FE nhận: `{ success, message, error, data }` — entity thật nằm ở `.data.<field>.data` (double nesting: response wrapper → field ObjectType).
- `@GraphQLSuccessMessage({ [Locale.En]: ..., [Locale.Vi]: ... })` set message khi thành công (song ngữ, xem [[graphql-resolver-pattern]] decorator stack).
- `GraphQLTransformInterceptor` là nơi thực sự bọc — resolver method `execute` KHÔNG tự tạo envelope tay.
- Field `data` trong response class là `@ObjectType` riêng, `implements IAbstractGraphQLResponse<XxxResponseData>` (`src/modules/api/apollo/server/types/graphql-response.ts`).
- REST cũng có helper bọc tương tự ở `src/modules/api/rest/` khi cần thống nhất shape (không bắt buộc mọi controller).
- Đổi field/entity → đồng bộ FE: `modules/api/graphql/<op>.ts` dùng `GraphQLResponse<T>`, entity đọc ở `.data.<field>.data` — lệch shape 2 bên = lỗi runtime im lặng (undefined), không phải lỗi type.

> Nguồn: `src/modules/api/apollo/server/graphql-types/object-types/graphql-response.ts`, `src/modules/api/apollo/server/types/graphql-response.ts`
