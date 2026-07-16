# API surface — GraphQL resolver & REST controller & DTO

Nguồn: `src/features/api/core/graphql/mutations/flashcard/review-flashcard/` (mẫu chuẩn mutation)
+ `src/features/api/core/http/admin/presigned-url/` (mẫu chuẩn REST).

## GraphQL: 1 operation = 1 folder

```
mutations/<domain>/<operation>/          # queries/ cùng khuôn
├── <operation>.resolver.ts
├── <operation>.module.ts                # providers: [<Op>Resolver]; class <Op>SingleMutationModule
├── <operation>.module-definition.ts     # khuôn ConfigurableModuleBuilder (xem [[modules-and-di]])
├── graphql-types/
│   ├── request.ts                       # @InputType + class-validator
│   ├── response.ts                      # Data @ObjectType + Response wrapper
│   └── index.ts
└── index.ts                             # export * module + resolver + graphql-types
```

### Resolver — stack decorator ĐỦ và ĐÚNG THỨ TỰ (mẫu thật `ReviewFlashcardResolver`)

```ts
@Resolver()
export class ReviewFlashcardResolver {
    constructor(
        private readonly flashcardReviewService: FlashcardReviewService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard,
        GraphQLEnrollmentGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Flashcard reviewed successfully",
        [Locale.Vi]: "Ôn thẻ thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => ReviewFlashcardResponse,
        {
            name: "reviewFlashcard",
            description: "Grade a flashcard (SM-2) and schedule its next review.",
        },
    )
    async execute(
        @Args("request")
            request: ReviewFlashcardRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<ReviewFlashcardData> {
        return this.flashcardReviewService.review({
            userId: user.id,
            cardId: request.cardId,
            grade: request.grade,
        })
    }
}
```

LUẬT:

- Method tên **`execute`**, trả `Promise<...Data>` (interceptor tự bọc wrapper).
- **Resolver MỎNG**: chỉ map request → 1 call service từ `@modules/bussiness`; business logic KHÔNG nằm trong resolver.
- Mutation user-facing: `@GraphQLSuccessMessage` song ngữ `Locale.En`/`Locale.Vi` + `GraphQLTransformInterceptor`.
- Auth: `KeycloakAuthGraphQLGuard` + user qua `@KeycloakGraphQLUser()`; course-scoped thêm `GraphQLEnrollmentGuard`.
- Rate-limit: `@UseThrottler(ThrottlerConfig.*)` cho mutation ghi dữ liệu.
- `@Mutation` luôn có `name` + `description`.

### graphql-types

- `request.ts`: `@InputType({ description })`; mỗi `@Field` có `description`; validate bằng class-validator NGAY tại field (`@IsInt() @Min(0) @Max(3)`, `@IsOptional() @IsUUID()`); optional → `nullable: true` + `?:`.
- `response.ts`: 2 class — `<Op>Data` (`@ObjectType`, payload thật) và `<Op>Response extends AbstractGraphQLResponse implements IAbstractGraphQLResponse<<Op>Data>` (từ `@modules/api`) với `data` nullable. KHÔNG tự chế wrapper.

## REST controller (ít dùng hơn — admin/oauth/webhook)

Mẫu `PresignedUrlController`:

- Path/tags KHÔNG hardcode string: `@ApiTags(httpConfig().admin().tags)` + `@Controller({ path: httpConfig().admin().tags, version: "1" })` + `@Post(httpConfig().admin().presignedUrl().path)` — mọi path khai trong `httpConfig()`.
- Swagger đủ bộ: `@ApiOperation({ summary, description })` + `@ApiResponse({ status, description })`.
- `@UseInterceptors(RestTransformInterceptor)` cho response chuẩn.
- DTO ở `dtos/` (barrel index): request dùng `@ApiProperty`/`@ApiPropertyOptional` (có `description` + `example`) + class-validator (`@IsString() @IsNotEmpty()`); response class cũng `@ApiProperty` đầy đủ.
- Controller cũng MỎNG như resolver: gọi 1 service, không business logic.

## ❌ Cấm ở API surface

- Field/InputType không `description` — schema là docs sống, đừng để trống.
- Validate "chay" trong resolver/service thay vì decorator trên DTO (out-of-range phải chết TRƯỚC khi vào business math — xem comment `grade` trong request thật).
- Trả Nest built-in exception từ guard/resolver — xem [[exceptions]] (guard exceptions có `httpStatus` riêng).
- Import ngược: `@modules/bussiness` KHÔNG được import từ `features/api` — chiều phụ thuộc là api → bussiness → hạ tầng.
