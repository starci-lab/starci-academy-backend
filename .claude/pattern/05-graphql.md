# 05 — GraphQL (code-first, Apollo Server 5)

`src/features/api/core/graphql/{queries,mutations}/` — mỗi operation = **1 leaf module** riêng. Code-first: schema sinh từ class `@ObjectType`/`@InputType` + resolver.

## Cây 1 operation (leaf)
```
my-ai-quota/
├─ my-ai-quota.module.ts             # MyAiQuotaSingleQueryModule
├─ my-ai-quota.module-definition.ts  # ConfigurableModuleBuilder (isGlobal)
├─ my-ai-quota.resolver.ts           # @Resolver + @Query/@Mutation
├─ graphql-types/
│  ├─ response.ts                    # @ObjectType data + response wrapper
│  ├─ inputs/                        # @InputType (mutation có input)
│  └─ index.ts
└─ index.ts
```

## Quy ước tên 3-piece (STRICT — xem coding-conventions §1b)
| Piece | Pattern |
|-------|---------|
| Leaf module | `<X>SingleQueryModule` / `<X>SingleMutationModule` |
| Module class | `extends ConfigurableModuleClass` |
| Aggregator (gom nhiều leaf) | `<Resource>QueriesModule` / `<Resource>MutationsModule` |
| Parent import leaf | `<X>SingleQueryModule.register({ isGlobal: true })` — **KHÔNG** import leaf trực tiếp (schema builder sẽ bỏ sót resolver) |

## Resolver pattern
- Method tên `execute`. `@Query(() => XxxResponse, { name, description })` / `@Mutation(...)`.
- Decorator stack chuẩn (theo thứ tự): `@UseThrottler(ThrottlerConfig.Soft)` → `@UseGuards(KeycloakAuthGraphQLGuard)` → `@GraphQLSuccessMessage({ [Locale.En]: ..., [Locale.Vi]: ... })` → `@UseInterceptors(GraphQLTransformInterceptor)`.
- User auth: `@KeycloakGraphQLUser() user: UserEntity` (từ `@modules/keycloak`).
- Resolver **trả về `XxxResponseData`** (entity thật) — interceptor tự bọc thành `{ success, message, error, data }`.

```ts
@Resolver()
export class MyAiQuotaResolver {
    constructor(private readonly aiEntitlementService: AiEntitlementService) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({ [Locale.En]: "...", [Locale.Vi]: "..." })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(() => MyAiQuotaResponse, { name: "myAiQuota", description: "..." })
    async execute(@KeycloakGraphQLUser() user: UserEntity): Promise<MyAiQuotaResponseData> {
        return this.aiEntitlementService.snapshot({ userId: user.id })
    }
}
```

## Response wrapper (BẮT BUỘC)
Mọi op trả `AbstractGraphQLResponse` (`@modules/api`). Field `data` là `@ObjectType` riêng.
```ts
@ObjectType({ description: "Response wrapper for the myAiQuota query." })
export class MyAiQuotaResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MyAiQuotaResponseData>
{
    @Field(() => MyAiQuotaResponseData, { nullable: true, description: "..." })
        data: MyAiQuotaResponseData
}
```
FE nhận `{ success, message, error, data }` → entity thật ở `.data.<field>.data` (xem 14).

## Enum trong GraphQL
- Enum value (TS) ở `@modules/databases` (vd `AiMode`). GraphQL type companion `GraphQLTypeAiMode` (registered qua `createEnumType`). `@Field(() => GraphQLTypeAiMode)` field type là `AiMode`.
- ⚠️ Value enum (thường chữ thường) phải khớp FE — sai value → lỗi GraphQL enum.

## InputType (mutation)
`graphql-types/inputs/<name>.input.ts` — class `@InputType` + `@Field`. 1 file/feature, `index.ts` re-export. Resolver nhận `@Args("request") request: XxxInput`.

## Thêm operation mới
1. Tạo folder leaf theo cây trên (5 file).
2. Resolver `execute` + decorator stack + response wrapper.
3. Đăng ký vào aggregator (`<Resource>QueriesModule`/`MutationsModule`) bằng `.register({ isGlobal: true })`.
4. Đồng bộ FE: `modules/api/graphql/<op>.ts` + `modules/types` (xem 14).
