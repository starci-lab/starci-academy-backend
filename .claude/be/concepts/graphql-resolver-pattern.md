# Concept — GraphQL resolver pattern (Apollo Server 5, code-first)

> `src/features/api/core/graphql/{queries,mutations}/` — mỗi operation = 1 **leaf module** riêng (5 file: module, module-definition, resolver, `graphql-types/{response.ts,inputs/}`, index).

- **3-piece naming (STRICT)**: leaf module `<X>SingleQueryModule`/`<X>SingleMutationModule` → parent import bằng `.register({ isGlobal: true })` (KHÔNG import resolver trực tiếp, schema builder sẽ bỏ sót) → aggregator gom nhiều leaf là `<Resource>QueriesModule`/`MutationsModule`.
- Resolver method tên `execute`. Decorator stack CỐ ĐỊNH theo thứ tự: `@UseThrottler(...)` → `@UseGuards(KeycloakAuthGraphQLGuard)` → `@GraphQLSuccessMessage({en, vi})` → `@UseInterceptors(GraphQLTransformInterceptor)` → `@Query/@Mutation`.
- User auth lấy qua `@KeycloakGraphQLUser() user: UserEntity` (xem [[auth-keycloak-session]]).
- Resolver trả **entity thật** (`XxxResponseData`) — interceptor tự bọc thành envelope `{ success, message, error, data }` (xem [[envelope-response-shape]]).
- Enum: value TS ở `@modules/databases`, GraphQL companion qua `createEnumType` — value (thường chữ thường) PHẢI khớp FE.
- Entity vừa là bảng DB vừa `@ObjectType`; GraphQL chỉ serialize field có `@Field` → đây là cổng bảo mật, xem [[typeorm-entities-and-relations]] §expose.

> Nguồn: `src/features/api/core/graphql/`, `src/modules/api/apollo/`
