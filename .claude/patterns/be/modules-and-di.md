# Module structure & DI

Nguồn: `src/modules/bussiness/*` (achievements, flashcard, installment-plan…) — mẫu chuẩn hiện hành.

## Anatomy 1 business module — `src/modules/bussiness/<feature>/`

```
<feature>/
├── <feature>.module.ts              # @Module, extends ConfigurableModuleClass
├── <feature>.module-definition.ts   # ConfigurableModuleBuilder (isGlobal extra)
├── <feature>.service.ts             # 1 service = 1 trách nhiệm; nhiều service OK (flashcard có 5)
├── <feature>.service.spec.ts        # unit test cạnh service
├── types/                           # interface/type + barrel index.ts
│   └── index.ts
└── index.ts                         # barrel: export * từng file public
```

- **Mọi module đều có `module-definition.ts`** đúng 1 khuôn (copy y nguyên, chỉ khuôn này):

```ts
import {
    ConfigurableModuleBuilder,
} from "@nestjs/common"

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    new ConfigurableModuleBuilder()
        .setExtras({
            isGlobal: false,
        },
        (definition, extras) => ({
            ...definition,
            global: extras.isGlobal,
        }))
        .build()
```

- Module class `extends ConfigurableModuleClass`, khai `providers` + `exports`
  (chỉ export cái consumer thật sự cần — vd `AchievementsModule` export mỗi `AchievementsService`).
- Feature mới nhớ: (1) đăng ký vào module cha (`bussiness.module.ts`…), (2) thêm dòng `export *` vào barrel cha (`src/modules/bussiness/index.ts`).

## Naming — file kebab-case + suffix nói rõ vai

| Suffix | Vai |
|---|---|
| `.module.ts` / `.module-definition.ts` | Nest module + configurable builder |
| `.service.ts` | business logic |
| `.resolver.ts` / `.controller.ts` | GraphQL / REST leaf (xem [[api-surface]]) |
| `.listener.ts` | event/CDC/projection listener |
| `.cron.ts` | cron service (`InstallmentPlanEnforcementCronService`) |
| `.guard.ts` / `.interceptor.ts` / `.filter.ts` | Nest lifecycle |
| `.spec.ts` | unit test (jest `--selectProjects unit`) |

Class name = PascalCase khớp file: `flashcard-review.service.ts` → `FlashcardReviewService`.

## DI — constructor injection, không property injection

```ts
// ✅ ĐÚNG — mẫu thật từ AchievementsService
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

- Luôn `private readonly`.
- Hạ tầng inject qua **decorator chuyên dụng có sẵn** (`InjectPrimaryPostgreSQLEntityManager`… trong `@modules/databases`), KHÔNG tự chế token DB mới.
- Multi-provider gom về 1 token array bằng `useFactory` + `inject` (xem `ACHIEVEMENT_BADGES` trong `achievements.module.ts`) — pattern chuẩn khi có N implementation cùng abstract class.
- Logger: `private readonly logger = new Logger(<ClassName>.name)` — chỉ khai khi class thật sự log; KHÔNG `console.log`.
- Config/env: đọc qua `envConfig` từ `@modules/env` — KHÔNG `process.env` trực tiếp trong business code.
- Ghi nhiều bảng liên quan → `this.entityManager.transaction(async (manager) => { ... })`, mọi thao tác bên trong dùng `manager` được cấp, không dùng lại `this.entityManager`.

## Data-key ruling (từ MEMORY, vẫn hiệu lực)

Bảng mới gắn với 1 course → key theo `enrollment_id` (FK→enrollments), KHÔNG `user_id`;
course-agnostic mới dùng `user_id`.
