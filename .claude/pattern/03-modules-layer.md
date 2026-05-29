# 03 — Modules Layer (`src/modules/`)

Module = đơn vị tái sử dụng (DynamicModule), gọi từ `features/` hoặc module khác. KHÔNG gắn trực tiếp endpoint (đó là việc của `features/`, xem 04).

## Pattern 3-file CỐ ĐỊNH
Mỗi module có đúng 3 file gốc:
```
<name>/
├─ <name>.module.ts            # @Module(...) class, extends ConfigurableModuleClass
├─ <name>.module-definition.ts # ConfigurableModuleBuilder → register({ isGlobal })
└─ index.ts                    # re-export public API (BẮT BUỘC, nếu thiếu → gãy alias @modules/<name>)
```
Tách thêm khi cần: `<name>.providers.ts` (providers phức tạp), `<name>.decorators.ts`.

### Service flat + types/enums ở root module (STRICT)
Service để **flat `*.service.ts`** ngay ở module root — **KHÔNG** folder-hoá service. `types/ enums/ constants/ utils/` là **folder ngang hàng với service** ở root module (mỗi cái có `index.ts`), **chỉ tạo khi có nội dung** (không có enum thì bỏ `enums/`). KHÔNG declare type/enum inline trong `*.service.ts` → tách ra folder root tương ứng, import lại qua `./types`/`./enums`.
```
<module>/
├─ <module>.module.ts
├─ <module>.module-definition.ts
├─ foo.service.ts          # service flat (ngang hàng types/enums)
├─ bar.service.ts
├─ types/      (index.ts)  # gom type ra đây
├─ enums/      (index.ts)  # chỉ khi có nội dung
├─ constants/  utils/  classes/   # khi cần
└─ index.ts
```

**Phân tầng nơi đặt type/enum/constant/util:**
- Trong 1 module → folder root module `types/ enums/ constants/ utils/` (mọi service trong module import từ đây). KHÔNG nhồi type vào folder con của từng service.
- **Global (nhiều module dùng chung) → `src/modules/common/{types,enums,constants,utils}`** (`@modules/common`). Gom về đây, KHÔNG lặp/lan man.

### Template `.module-definition.ts`
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

### Template `.module.ts`
```ts
import { Module } from "@nestjs/common"
import { ConfigurableModuleClass } from "./foo.module-definition"
import { FooService } from "./foo.service"

@Module({
    providers: [FooService],
    exports: [FooService],
})
export class FooModule extends ConfigurableModuleClass {}
```

### Đăng ký
`apps/core/src/app.module.ts` → `FooModule.register({ isGlobal: true })` (nếu muốn global). Service được `exports` mới inject được nơi khác.

## Module nhiều logic → tách nested module (STRICT)
Module lớn → chia thành **nested sub-module** bên trong (mỗi sub-module là module 3-file đầy đủ). Module cha `imports` sub-module qua `.register({...})` rồi **re-export trong `exports: [...]`** → consumer dùng qua module cha (`@modules/<parent>`), KHÔNG import sub-path trực tiếp.

```
ai/
├─ ai.module.ts            # imports: [AiBalancerModule.register({})], exports: [AiBalancerModule, …]
├─ ai.module-definition.ts
├─ balancer/               # nested module
│  ├─ ai-balancer.module.ts
│  ├─ ai-balancer.module-definition.ts
│  ├─ core/ types/ enums/  (mỗi cái index.ts)
│  └─ index.ts             # export * module + module-definition + core/types/enums
├─ foo.service.ts          # service flat (xem trên)
├─ types/  enums/
└─ index.ts
```
- Sub-module re-export ở `exports` thì service bên trong nó dùng được ở consumer của module cha.
- Phân biệt: **service** = `@Injectable` (file `*.service.ts` flat); **nested module** = `@Module` (khi cụm logic đủ lớn, có providers + sub-structure riêng). GraphQL aggregator (`<Resource>QueriesModule`) là cùng pattern này (xem 05).

## Catalog `src/modules/` (xem tech-integration cho chi tiết)
| Nhóm | Module |
|------|--------|
| Data | `databases/` (postgres/qdrant/es/redis), `cache/`, `s3/`, `crypto/` |
| Domain | `bussiness/` (xem 08) |
| Messaging | `cqrs/` (xem 09), `event/` (NATS), `bullmq/`, `socketio/` |
| Auth/sec | `keycloak/`, `throttler/`, `cors/`, `cookie/`, `passport/`, `vaildators/` |
| AI | `ai/`, `langchain/` |
| Integrations | `payos/`, `sepay/`, `mailer/`, `github/`, `googleapis/`, `elasticsearch/` |
| Media | `ffmpeg/`, `bento4/`, `stream-async-iterator/` |
| Platform | `env/` (xem 11), `exceptions/` (xem 12), `logger/`, `winston/`, `sentry/`, `api/`, `docs/`, `init/`, `locale/`, `execa/`, `filesystem/`, `native/`, `mixin/`, `axios/`, `code/`, `common/` |

## Anti-pattern
- ❌ Module không có `index.ts`.
- ❌ Declare type/enum/class trong file `*.module.ts`/`*.service.ts` — phải để ở `types/ enums/ classes/` (xem 13).
- ❌ Đổi tên typo cố ý: `bussiness`, `vaildators` (xem 13 §typos).
