# Module structure & DI

Phạm vi: cách VIẾT module NestJS trong repo này — anatomy thư mục, provider/DI, luồng resolver/controller→service→CQRS-handler, feature-module boundary, barrel `index.ts`. Ground 100% từ `src/` thật (idiom hiện hành). Đây là code-style, KHÔNG phải design.

---

## 1. Mọi module `extends ConfigurableModuleClass` — KHÔNG `@Module` trần

Idiom trội tuyệt đối: 511/530 module trong `src/` khai qua `ConfigurableModuleBuilder`, class `extends ConfigurableModuleClass`. (19 chỗ `@Module` trần đều nằm dưới `src/features/mock/` — nội dung ví dụ, đừng bắt chước.) Mỗi module có 1 file `*.module-definition.ts` đúng 1 khuôn (copy y nguyên):

✅ ĐÚNG — `src/modules/crypto/crypto.module-definition.ts` (giống hệt `start-trial.module-definition.ts`):
```ts
import { ConfigurableModuleBuilder } from "@nestjs/common"

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    new ConfigurableModuleBuilder()
        .setExtras({ isGlobal: false }, (definition, extras) => ({
            ...definition,
            global: extras.isGlobal,
        }))
        .build()
```

Module class khai `providers` + `exports` (chỉ export cái consumer THẬT cần — vd `CryptoModule` export đúng 2 service):
```ts
// src/modules/crypto/crypto.module.ts
@Module({
    providers: [EncryptionService, Sha256Service],
    exports: [EncryptionService, Sha256Service],
})
export class CryptoModule extends ConfigurableModuleClass {}
```

❌ SAI — `@Module` trần, không builder, không knob `isGlobal` (chỉ thấy ở `src/features/mock/...`):
```ts
@Module({ providers: [MulterService] })
export class MulterModule {}
```

`.register({ isGlobal })` là method mặc định của builder; CHỈ 2 module trong repo đổi tên method thành `forRoot` qua `setClassMethodName("forRoot")`.

---

## 2. Leaf GraphQL module = bộ tứ resolver + service + handler + command

Mỗi mutation/query là 1 THƯ MỤC riêng (1 folder = 1 concern), chứa đúng bộ: `*.module.ts`, `*.module-definition.ts`, `*.resolver.ts`, `*.service.ts`, `*.handler.ts`, `*.command.ts` (hoặc `.query.ts`), `graphql-types/`, `index.ts`. Luồng runtime: **Resolver → Service → CommandBus/QueryBus → Handler**.

Đặt tên class module: leaf 1-thao-tác dùng suffix `SingleMutationModule` / `SingleQueryModule` (88 + 164 chỗ); aggregator gom nhiều leaf dùng `MutationsModule` / `QueriesModule` (26 + 28 chỗ).

✅ ĐÚNG — leaf chỉ liệt kê provider của chính nó, `src/features/api/core/graphql/mutations/courses/start-trial/start-trial.module.ts`:
```ts
@Module({
    providers: [StartTrialService, StartTrialResolver, StartTrialHandler],
})
export class StartTrialSingleMutationModule extends ConfigurableModuleClass {}
```

---

## 3. Resolver/Controller MỎNG — nhận request → gọi service, KHÔNG chứa nghiệp vụ

Resolver chỉ gắn decorator (guard/interceptor/throttler), rút args, forward xuống `*.service.ts`. Service của leaf mutation cũng mỏng: đóng gói `params` thành Command rồi `commandBus.execute`. Toàn bộ nghiệp vụ (DB/exception/transaction) nằm trong Handler.

✅ ĐÚNG — service leaf forward sang CommandBus, `courses/start-trial/start-trial.service.ts`:
```ts
@Injectable()
export class StartTrialService {
    constructor(private readonly commandBus: CommandBus) {}

    async execute(
        params: ExecuteParams<StartTrialRequest>,
    ): Promise<StartTrialResponseData> {
        return this.commandBus.execute(new StartTrialCommand(params))
    }
}
```

✅ ĐÚNG — resolver mỏng, `courses/start-trial/start-trial.resolver.ts`:
```ts
@Resolver()
export class StartTrialResolver {
    constructor(private readonly startTrialService: StartTrialService) {}

    @UseThrottler(ThrottlerConfig.Medium)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @Mutation(() => StartTrialResponse, { name: "startTrial" /* ... */ })
    async execute(
        @KeycloakGraphQLUser() user: UserEntity,
        @Args("request") request: StartTrialRequest,
        @GraphQLLocale() locale: Locale,
    ): Promise<StartTrialResponseData> {
        return this.startTrialService.execute({ request, user, locale })
    }
}
```

❌ SAI — nhét DB/nghiệp vụ vào resolver (đúng ra nằm trong Handler):
```ts
@Mutation(() => StartTrialResponse)
async execute(@Args("request") request: StartTrialRequest) {
    const course = await this.entityManager.findOne(CourseEntity, { /* ... */ })
    if (!course) throw new CourseNotFoundException({})   // ❌ logic sai lớp
}
```

---

## 4. Handler = nơi chứa nghiệp vụ; `extends ICQRSHandler` + `implements ICommandHandler`

Handler vừa `extends ICQRSHandler<Cmd, Res>` (base, có `process()`), vừa `implements ICommandHandler<Cmd, Res>` của `@nestjs/cqrs`; gắn `@CommandHandler(XCommand)` + `@Injectable()`. Logic viết trong `protected override async process()`, gọi `super()` trong constructor. KHÔNG có tầng `*.repository.ts` riêng — Handler/Service thao tác DB trực tiếp qua injected `EntityManager` (grep: 0 file `*.repository.ts` trong `src/`).

✅ ĐÚNG — `courses/start-trial/start-trial.handler.ts`:
```ts
@CommandHandler(StartTrialCommand)
@Injectable()
export class StartTrialHandler
    extends ICQRSHandler<StartTrialCommand, StartTrialResponseData>
    implements ICommandHandler<StartTrialCommand, StartTrialResponseData>
{
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    protected override async process(
        command: StartTrialCommand,
    ): Promise<StartTrialResponseData> {
        const { request: { courseId }, user } = command.params
        if (!user) throw new UserNotFoundException({})
        // ... nghiệp vụ ...
    }
}
```

---

## 5. DI — constructor injection `private readonly`, không property injection

Mặc định inject bằng type ở constructor với `private readonly`. Khi provider là token/giá trị (không phải class) dùng `@Inject(TOKEN)`; token là `const` string đặt trong `constants/` của module (single-source), KHÔNG gõ tay chuỗi tại chỗ inject. Truy cập DB dùng decorator chuyên dụng có sẵn (`InjectPrimaryPostgreSQLEntityManager`… từ `@modules/databases`), KHÔNG tự chế token DB / `@InjectRepository` thô.

✅ ĐÚNG — trộn injector DB + token custom, `src/modules/bussiness/achievements/achievements.service.ts`:
```ts
@Injectable()
export class AchievementsService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        @Inject(ACHIEVEMENT_BADGES)
        private readonly badges: Array<AbstractBadge>,
    ) {}
}
```

✅ ĐÚNG — token là const string, `src/modules/cache/constants/keys.ts`:
```ts
/** Injection token for the Redis cache manager. */
export const REDIS_CACHE_MANAGER = "REDIS_CACHE_MANAGER"
```

❌ SAI — token "trần" gõ tay tại chỗ inject (dễ typo, không single-source):
```ts
constructor(@Inject("REDIS_CACHE_MANAGER") private readonly cache: Cache) {}
```

Quy ước phụ trong service/handler:
- Logger: `private readonly logger = new Logger(<ClassName>.name)` — chỉ khai khi class thật sự log; KHÔNG `console.log`. (vd `AssetsService`, `AiModelLatencyService`.)
- Config/env: đọc qua `envConfig()` từ `@modules/env` (199 chỗ) — KHÔNG `process.env` trực tiếp trong business code.
- Ghi nhiều bảng liên quan → `this.entityManager.transaction(async (manager) => { ... })`, mọi thao tác bên trong dùng `manager` được cấp, không dùng lại `this.entityManager` (vd `flashcard-quiz-session.service.ts`, `daily-quest.service.ts`).

---

## 6. Provider phức tạp → tách file `*.providers.ts` với `useFactory` + `inject`

Provider cần khởi tạo runtime (client, cache, connection) viết thành factory `Provider` trong file `*.providers.ts` riêng: `{ provide, inject, useFactory }`. Đừng nhồi factory dài vào `@Module({ providers: [...] })`. Khi có N implementation cùng abstract class, gom về 1 token-array bằng `useFactory` + `inject` (vd `ACHIEVEMENT_BADGES`).

✅ ĐÚNG — `src/modules/cache/cache.providers.ts`:
```ts
export const createRedisCacheManagerProvider = (): Provider => ({
    provide: REDIS_CACHE_MANAGER,
    inject: [createRedisKey(RedisInstanceKey.Cache), WinstonService],
    useFactory: async (
        redis: RedisClient,
        winstonService: WinstonService,
    ): Promise<Cache> => {
        const keyv = new Keyv(new KeyvRedis(redis))
        return createCache({ stores: [keyv], ttl: 0 })
    },
})
```

---

## 7. Feature boundary: leaf KHÔNG re-declare provider; aggregator `imports` + `.register()`

Leaf module KHÔNG import module con khác — chỉ khai `providers` của chính nó. Aggregator (`*MutationsModule`/`*QueriesModule`) gom leaf qua `imports: [XSingleMutationModule.register({ isGlobal: true })]`. `isGlobal: true` là cách repo "phơi" provider ra toàn app (thay cho `@Global()` — grep `@Global` = 0 hit).

✅ ĐÚNG — aggregator gom leaf, `courses/courses.module.ts`:
```ts
@Module({
    imports: [
        CourseEnrollSingleMutationModule.register({ isGlobal: true }),
        StartTrialSingleMutationModule.register({ isGlobal: true }),
        AddToCartSingleMutationModule.register({ isGlobal: true }),
        // ...
    ],
})
export class CoursesMutationsModule extends ConfigurableModuleClass {}
```

❌ SAI — `@Global()` decorator (không phải idiom repo; repo dùng extras `isGlobal`):
```ts
@Global()
@Module({ providers: [StartTrialService], exports: [StartTrialService] })
export class StartTrialSingleMutationModule {}
```

Feature mới nhớ 2 bước: (1) đăng ký leaf vào module cha; (2) thêm dòng `export *` vào barrel cha (`src/modules/bussiness/index.ts`…).

---

## 8. Mỗi thư mục module có barrel `index.ts` + import qua alias

Mỗi folder export public surface qua `index.ts` bằng `export * from "./..."` — luôn export `*.module`, service/resolver public, `graphql-types`/`constants`/`types`. Import chéo dùng path alias `@modules/*` và `@features/*` (định nghĩa trong `tsconfig.json`), KHÔNG đào tương đối dài `../../../`.

✅ ĐÚNG — `courses/start-trial/index.ts`:
```ts
export * from "./start-trial.module"
export * from "./start-trial.resolver"
export * from "./start-trial.service"
export * from "./graphql-types"
```

✅ ĐÚNG — `src/modules/crypto/index.ts`:
```ts
export * from "./constants"
export * from "./crypto.module"
export * from "./encryption.service"
export * from "./sha256.service"
export * from "./types"
```

✅ ĐÚNG — import qua alias:
```ts
import { UserEntity, Locale } from "@modules/databases"
import { KeycloakAuthGraphQLGuard } from "@modules/keycloak"
```

❌ SAI — import sâu vượt package qua tương đối dài:
```ts
import { UserEntity } from "../../../../../../modules/databases/postgresql/primary/entities/user.entity"
```

---

## 9. Naming — file kebab-case + suffix nói rõ vai

| Suffix | Vai |
|---|---|
| `.module.ts` / `.module-definition.ts` | Nest module + configurable builder |
| `.resolver.ts` / `.controller.ts` | GraphQL / REST leaf entry (mỏng) |
| `.service.ts` | orchestration mỏng (forward CommandBus) hoặc business service dùng chung |
| `.handler.ts` + `.command.ts`/`.query.ts` | CQRS handler = nơi chứa nghiệp vụ |
| `.listener.ts` | event/CDC/projection listener |
| `.cron.ts` | cron service |
| `.guard.ts` / `.interceptor.ts` / `.filter.ts` | Nest lifecycle |
| `.spec.ts` | unit test cạnh file được test |

Class name = PascalCase khớp file: `flashcard-review.service.ts` → `FlashcardReviewService`.

## Data-key ruling (từ MEMORY, vẫn hiệu lực)

Bảng mới gắn với 1 course → key theo `enrollment_id` (FK→enrollments), KHÔNG `user_id`; course-agnostic mới dùng `user_id`.
