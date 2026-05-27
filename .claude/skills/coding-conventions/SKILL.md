---
name: coding-conventions
description: >
  Backend TypeScript coding conventions for the starci-academy-backend repo. Use this skill
  whenever writing or editing any .ts file under src/ or apps/ — module structure, file naming,
  type naming, params/result patterns, JSDoc, imports, and ESLint rules are all encoded here.
  Mirror of .cursor/rules/starci-academy.mdc — keep both in sync. Trigger before creating new
  modules, services, types, entities, controllers, resolvers, GraphQL inputs, REST DTOs, or
  utility functions.
---

# Coding conventions — starci-academy-backend

These rules are authoritative for **all TypeScript code** in `src/` and `apps/`. The cursor IDE
sees the same rules via [.cursor/rules/starci-academy.mdc](../../../.cursor/rules/starci-academy.mdc).
When editing existing code, follow the convention even if surrounding code already deviates.

Before finishing, run `npm run lint` to verify.

---

## 1. Module folder structure

Allowed folders at module root (anything else must be moved or removed):

| Folder | Contains | Naming |
|--------|----------|--------|
| `types/` | TypeScript types and interfaces (one file per feature, group related) | `user.ts`, `auth.ts` (feature) |
| `enums/` | Enums (one file per enum/feature) | `role.ts`, `status.ts` |
| `classes/` | Domain classes (not GraphQL, not REST DTO) | `session.ts`, `user.ts` |
| `constants/` | Constants per feature OR `constants.ts` inside subdir | `binance.ts` or just `constants.ts` |
| `utils/` | Pure stateless helpers (one file per concern) | `parse-env.ts`, `format-date.ts` |
| `dtos/` | REST API DTOs with `@ApiProperty` (one file per feature) | `create-user.ts` |
| `graphql-types/inputs/` | `@InputType` classes (one per feature) | `create-user.input.ts` |
| `graphql-types/object-types/` | `@ObjectType` classes (one per feature) | `user.object.ts` |
| NestJS framework folders | `interceptors/`, `guards/`, `pipes/`, `middlewares/`, `filters/`, `decorators/` | NestJS naming |

Each folder must have an `index.ts` re-exporting its files.

**Root `index.ts`** of the module re-exports the public API.

**No nested interfaces.** Always extract inline object shapes into named interfaces:

```ts
// ❌ inline nested
interface A { nested?: { prop: string } }

// ✅ named
interface Nested { prop: string }
interface A { nested?: Nested }
```

---

## 1b. NestJS GraphQL leaf modules — naming + global registration

Every leaf GraphQL module (one `@Query` or one `@Mutation` resolver) follows
a strict 3-piece convention:

| Piece | Pattern | Example |
|-------|---------|---------|
| Class name | `<X>SingleQueryModule` (queries) or `<X>SingleMutationModule` (mutations) | `AiBalancerHealthSingleQueryModule`, `MarkAsReadedSingleMutationModule` |
| Companion | `<name>.module-definition.ts` with `ConfigurableModuleBuilder` + `setExtras({ isGlobal })` | see template below |
| Module class | `extends ConfigurableModuleClass` (from the companion) | required |
| Parent import | `<X>SingleQueryModule.register({ isGlobal: true })` | parent aggregator |

### Template `.module-definition.ts`

```ts
import { ConfigurableModuleBuilder } from "@nestjs/common"

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

### Template `.module.ts`

```ts
import { Module } from "@nestjs/common"
import { ConfigurableModuleClass } from "./foo-bar.module-definition"
import { FooBarResolver } from "./foo-bar.resolver"

@Module({
    providers: [FooBarResolver],
})
export class FooBarSingleQueryModule extends ConfigurableModuleClass {}
```

### Parent aggregator

Parent module **must** call `.register({ isGlobal: true })` — never import the
leaf directly:

```ts
// ✅
imports: [
    FooBarSingleQueryModule.register({ isGlobal: true }),
]

// ❌ — leaf not global, GraphQLSchemaBuilder won't pick up the resolver
imports: [
    FooBarSingleQueryModule,
]
```

Aggregator (mid-level) modules that bundle leaves are named `<Resource>QueriesModule`
or `<Resource>MutationsModule` (plural) — they aggregate multiple leaves and
may themselves call `.register({ isGlobal: true })` upstream.

---

## 2. File naming

### NestJS framework files (keep dotted suffix)

`*.service.ts` `*.controller.ts` `*.resolver.ts` `*.module.ts` `*.module-definition.ts`
`*.guard.ts` `*.interceptor.ts` `*.pipe.ts` `*.middleware.ts` `*.filter.ts` `*.processor.ts`
`*.entity.ts` (TypeORM) `*.command.ts` (nest-commander) `*.providers.ts` `*.decorators.ts`

### Domain files (types/enums/classes/utils)

Name by **function or feature** (kebab-case):

- `types/user.ts` (all user-related types)
- `types/auth.ts` (all auth types)
- `enums/role.ts`
- `classes/session.ts`
- `utils/parse-env.ts`

All must carry JSDoc comments.

### NestJS files MUST NOT define types/enums/classes inline

A `*.service.ts` file can only **import** types, enums, and classes from `types/`, `enums/`,
`classes/`, `dtos/`, or `graphql-types/`. Never declare an `interface`, `enum`, or non-NestJS
`class` inside a service/controller/module file.

```ts
// ❌ inside user.service.ts
interface CreateUserParams { name: string }
export class UserService { ... }

// ✅
import type { CreateUserParams } from "./types"
export class UserService { ... }
```

---

## 2b. Type safety — branded primitives + discriminated unions

Plain `string` for things like API keys, IDs, and tokens loses type safety —
an OpenAI key and a Claude key are interchangeable to the compiler. Use
**branded types** to make them nominally distinct, and **discriminated
unions** to give callbacks type-narrowed payloads.

### Branded primitives

```ts
// types/api-keys.ts
declare const apiKeyBrand: unique symbol
export type Brand<T, B extends string> = T & { readonly [apiKeyBrand]: B }

export type OpenAiApiKey = Brand<string, "OpenAi">
export type GeminiApiKey = Brand<string, "Gemini">
export type ClaudeApiKey = Brand<string, "Claude">
```

A plain `string` cannot be assigned to `OpenAiApiKey` without an explicit
`as OpenAiApiKey` cast — that cast is the boundary check (e.g. inside the
service that loads keys from the mount file). Once branded, every downstream
function gets nominal protection.

### Discriminated union for action callbacks

When a callback's payload differs by enum value, use a discriminated union
keyed on that enum so narrowing inside the callback is automatic:

```ts
type UseApiActionContext =
    | { provider: ModelProvider.OpenAI; key: OpenAiApiKey; model: string }
    | { provider: ModelProvider.Gemini; key: GeminiApiKey; model: string }
    | { provider: ModelProvider.Claude; key: ClaudeApiKey; model: string }

// caller — TypeScript narrows `ctx.key` per branch
action: async (ctx) => {
    switch (ctx.provider) {
        case ModelProvider.OpenAI:
            // ctx.key: OpenAiApiKey here
            return new ChatOpenAI({ apiKey: ctx.key, model: ctx.model }).invoke(p)
        case ModelProvider.Gemini:
            return new ChatGoogleGenerativeAI({ apiKey: ctx.key, model: ctx.model }).invoke(p)
        case ModelProvider.Claude:
            return new ChatAnthropic({ apiKey: ctx.key, model: ctx.model }).invoke(p)
    }
}
```

### Map provider → key type at the type level

```ts
export type ApiKeyByProvider<P extends ModelProvider> =
    P extends ModelProvider.OpenAI ? OpenAiApiKey :
    P extends ModelProvider.Gemini ? GeminiApiKey :
    P extends ModelProvider.Claude ? ClaudeApiKey :
    never
```

Use this when a helper is generic over the provider literal.

### `ReturnType<typeof X>` for derived types

When manually retyping a function's result would create duplication and
drift, derive the type from the source:

```ts
// ✅ derived — single source of truth
const computeQuota = ({ source }: Params) => ({ available: 1, used: 0 })
export type QuotaSnapshot = ReturnType<typeof computeQuota>

// ❌ duplicated — drifts when the function changes
export interface QuotaSnapshot { available: number; used: number }
```

`ReturnType`, `Parameters`, `Awaited`, and `InstanceType` are preferred over
hand-written copies of the same shape — especially when the original lives
nearby in the same module.

### Anti-patterns to avoid

- `key: string` in a context shared across many provider implementations →
  use a brand.
- `if (provider === "openai") { ... }` with `key: string` everywhere → use
  a discriminated union so each branch sees the right key type.
- Copy-pasting a return type into an interface → use `ReturnType<typeof fn>`.
- Casting away the brand outside the loading boundary — keep `as XxxApiKey`
  inside the one function that reads from the file/secret store; everywhere
  else, accept the branded type as a parameter.

---

## 3. Function parameters & result naming

### Naming pattern

- **Params type:** `{ActionName}Params` (e.g. `CreateUserParams`)
- **Result type:** `{ActionName}Result` (e.g. `CreateUserResult`)

```ts
async createUser(params: CreateUserParams): Promise<CreateUserResult>
```

### Rules

| Rule | Example |
|------|---------|
| Use params object when **≥ 2 args** | `create({ name, email })` not `create(name, email)` |
| Single primitive arg → pass directly | `findById(id: string)` |
| Always destructure in signature | `create({ name, email }: CreateUserParams)` not `(params: CreateUserParams)` then destruct in body |
| Destructure nested objects/arrays when used multiple times | `const { a, b } = config.nested` |
| **No inline type definitions in signature** | Always `import type { CreateUserParams } from "./types"` |
| **Use `Array<T>` not `T[]`** | `Array<string>` ✅ — `string[]` ❌ |

### Return type must always be `{ActionName}Result`

Even for `void`-returning functions, prefer no explicit return type or use existing primitives.
For non-trivial returns, define `Result` type in `types/`.

### Callback parameter names — full singular nouns, never single letters

Array methods (`map`, `filter`, `find`, `some`, `every`, `forEach`, `reduce`)
and any other higher-order callback must spell out the singular form of the
collection it iterates over. Single-letter shorthand is forbidden.

```ts
// ✅ — reads naturally; the closure body still mentions a noun
models.filter((model) => model.enabled)
keys.find((key) => key.keySuffix === suffix)
pool.map((entry) => ({ ...entry, masked: entry.value.slice(-4) }))

// ❌ — single-letter shorthand
models.filter((m) => m.enabled)
keys.find((k) => k.keySuffix === suffix)
pool.map((p) => ({ ...p }))
```

For `sort` (or any pairwise comparator) use **`prev` / `next`** instead of
`a` / `b`:

```ts
// ✅
models.sort((prev, next) => next.priority - prev.priority)

// ❌
models.sort((a, b) => b.priority - a.priority)
```

For `reduce` accumulator + element use `acc` (or a domain-specific noun) and
the singular element name:

```ts
// ✅
events.reduce((acc, event) => acc + event.tokens, 0)

// ❌
events.reduce((a, e) => a + e.tokens, 0)
```

For `forEach` index pairs use `index` (or a noun like `lineNumber`) — never
`i` outside a numeric for loop:

```ts
// ✅
items.forEach((item, index) => log(index, item.name))
```

The rationale: closures get reused as JSDoc snippets, log statements, and
search anchors. A single letter ruins grep-ability and forces the reader to
hop back to the call site to recover the type.

---

## 4. Imports

### Use `import type` for type-only imports

```ts
// ✅ types & interfaces consumed only in type positions
import type { CreateUserParams } from "./types"
import type { ChainId } from "@modules/common"

// ✅ value imports (classes, enums whose VALUES used at runtime)
import { AbstractException } from "../abstract"
import { ModelProvider } from "@modules/databases"
```

### Group and order

1. External packages first
2. Path-aliased modules (`@modules/...`, `@features/...`)
3. Relative imports (`./`, `../`)

Type-only imports grouped together; value imports grouped together. One source per line or
logical group is fine — match nearby files' formatting.

---

## 5. Comment / JSDoc patterns

### Types, enums, classes — REQUIRED JSDoc

```ts
/** Params for creating a user. */
export interface CreateUserParams { ... }

/** Result of user creation. */
export type CreateUserResult = { id: string }

/** User role in the system. */
export enum UserRole { Admin = "admin", Member = "member" }

/**
 * Service responsible for user-related business logic.
 *
 * @example
 * const service = new UserService(repo)
 * await service.createUser({ name: "Bob" })
 */
export class UserService { ... }
```

### Functions — full JSDoc on non-trivial public methods

```ts
/**
 * Creates a new user.
 *
 * @param params - User creation parameters
 * @returns Created user info
 *
 * @example
 * await service.createUser({ name: "Charlie" })
 */
async createUser({ name, email }: CreateUserParams): Promise<CreateUserResult> {
    // validate input
    const sanitized = sanitize(name)

    // persist user
    const user = await this.userRepo.create({ name: sanitized, email })

    // map entity to result DTO
    return { id: user.id }
}
```

### Inline `//` comments between logical steps

Use short single-line comments to explain intent at each logical step:

```ts
// build payload
const payload = buildPayload(input)

// send request to API
const response = await this.http.post(url, payload)

// transform response to result type
return mapToResult(response)
```

Never write a multi-step function without inline intent markers.

---

## 6. Folder examples

### GraphQL module

```
user/
├─ index.ts
├─ user.module.ts
├─ user.module-definition.ts
├─ user.service.ts
├─ user.resolver.ts
├─ types/
│  ├─ user.ts          // CreateUserParams, UpdateUserParams, …
│  ├─ auth.ts
│  └─ index.ts
├─ enums/
│  ├─ role.ts
│  └─ index.ts
├─ classes/
│  ├─ session.ts
│  └─ index.ts
└─ graphql-types/
   ├─ inputs/
   │  ├─ create-user.input.ts
   │  └─ index.ts
   ├─ object-types/
   │  ├─ user.object.ts
   │  └─ index.ts
   └─ index.ts
```

### REST API module

```
api/
├─ index.ts
├─ api.module.ts
├─ api.controller.ts
├─ types/
│  └─ base.ts
├─ classes/
│  └─ base.ts
└─ dtos/
   ├─ rest-transform.ts
   └─ index.ts
```

### Service with subdirs per concern (e.g. CEX integrations)

```
cexes/
├─ index.ts
├─ types/
│  └─ order-book.ts
├─ binance/
│  ├─ constants.ts
│  ├─ last-price.service.ts
│  └─ order-book.service.ts
├─ bybit/
│  ├─ constants.ts
│  └─ last-price.service.ts
```

Each provider subdir owns its `constants.ts`.

---

## 7. TypeORM data access — `InjectEntityManager`, not `InjectRepository`

This repo uses **`EntityManager` injected via `@InjectPrimaryPostgreSQLEntityManager()`**
for every DB call. Do **not** use `@InjectRepository(Entity, POSTGRESQL_PRIMARY)`.

### Why

- Single injection point per service — no per-entity boilerplate
- Manager works with **any** entity → join queries / multi-entity transactions are trivial
- Module wiring stays simple: no `TypeOrmModule.forFeature([...])` per feature module
- Mirrors the pattern in `hydration/`, `seeders/`, business services, processors

### Pattern

```ts
import { Injectable } from "@nestjs/common"
import { EntityManager } from "typeorm"
import {
    AiModelEntity,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"

@Injectable()
export class MyService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) { }

    async list() {
        return this.entityManager.find(AiModelEntity, {
            where: { enabled: true },
        })
    }

    async upsert(row: AiModelEntity) {
        return this.entityManager.save(row)
    }
}
```

### Module wiring

Module **does not** need `NestTypeOrmModule.forFeature(...)` — the
`PrimaryPostgreSQLModule` (registered global in `app.module.ts`) already
exposes the manager. Just add your service to `providers` and `exports`.

### Anti-patterns to avoid

```ts
// ❌ Per-entity Repository injection — boilerplate, harder to refactor
@InjectRepository(AiModelEntity, POSTGRESQL_PRIMARY)
private readonly repo: Repository<AiModelEntity>

// ❌ NestTypeOrmModule.forFeature inside a feature module — unnecessary now
imports: [NestTypeOrmModule.forFeature([AiModelEntity], POSTGRESQL_PRIMARY)]
```

---

## 8. Config sources — env vs YAML

The repo has **two config layers**. Pick the right one for the value type.

| Layer | File | Read via | Use for |
|-------|------|----------|---------|
| **Env** | `src/modules/env/config.ts` | `envConfig().X.Y` | Infrastructure-level — paths, hostnames, ports, credentials' file locations, time thresholds, feature flags. Anything that differs across **deployment environments** (dev/staging/prod). |
| **App YAML** | `.mount/config/app.yaml` | `mountFilesystemService.appConfig().X` | Business / runtime catalog — AI model list, payment provider IDs, system thresholds, anything ops should be able to edit without code deploy on the same env. Parsed via `js-yaml` (`load()`). |

Mount key files (newline-separated API key arrays) are read via
`MountFilesystemService.{openAi,gemini,claude}ApiKeys()` — never raw `fs`.

### Adding values to `app.yaml`

1. Add the field to `src/modules/filesystem/types/config.ts` (`AppConfig` /
   nested interface). Export new interfaces from `types/`.
2. Edit `.mount/config/app.yaml` with the default value.
3. Read via `mountFilesystemService.appConfig().<field>` — no extra wiring.
4. If a seeder consumes the value, it pulls from `appConfig()` so changes
   apply on the next boot/seed pass.

### Never write JSON config

App-level config is **YAML only** (`app.yaml`). Don't add `.json` config
files for ops-editable settings — YAML supports comments and is easier to
edit. The legacy `app.json` was migrated.

---

## 9. Env config — never hardcode tunable values

Every value that ops might want to override per-environment **must** live in
`src/modules/env/config.ts` and be read via `envConfig()`. This includes:

- Mount file paths (`mountPath.terraform.X`, `mountPath.aiKeys.X`, …)
- Service thresholds (timeouts, retry counts, batch sizes, cron expressions)
- External hostnames / ports / region codes
- Feature flags

### Adding a new env key

1. Group by domain. Top-level sections include `mountPath`, `databases`, `s3`,
   `keycloak`, `ai`, `aiBalancer`, `init`, … Reuse an existing group or add a
   new one with a JSDoc one-liner.
2. Use the right parser:
   - `parseEnvString({ key, defaultValue })` — string
   - `parseEnvInt({ key, defaultValue })` — int (defaultValue still string)
   - `parseEnvMs({ key, defaultValue })` — duration string like `"30m"`, `"5s"`
   - `parseEnvBool({ key, defaultValue })` — boolean
3. Env key naming: `SCREAMING_SNAKE_CASE`, prefix by domain
   (`AI_BALANCER_HEALTH_CHECK_CRON`, `TERRAFORM_OPENAI_API_KEY_MOUNT_PATH`).
4. Always provide a `defaultValue` that works in local dev (mount path defaults
   to `.mount/...`, thresholds to sensible values).
5. Read via `envConfig().<group>.<key>` — do **not** read `process.env`
   directly outside `config.ts`.

### Lazy reads in constants files

When a `constants/` file needs an env-derived value, wrap in a **getter
function** instead of a top-level const so env loading order does not matter:

```ts
// ✅
export const getDefaultModels = (): ReadonlyArray<Model> => {
    const { openai } = envConfig().mountPath.aiKeys
    return [{ name: "gpt-4o", keysPath: openai }]
}

// ❌ — envConfig() may run before EnvModule.forRoot() in some test contexts
export const DEFAULT_MODELS = [
    { name: "gpt-4o", keysPath: envConfig().mountPath.aiKeys.openai },
]
```

### NestJS services

Inject nothing extra — just `import { envConfig } from "@modules/env"` and
read at the call site or capture in the constructor.

### Decorators with env-driven arguments

`@Cron(...)`, `@Interval(...)`, `@Throttle(...)`, and similar decorators take
literal arguments at class-decoration time. Pass `envConfig().X.Y` directly —
`envConfig()` is a function, evaluated on every call, so the decorator picks
up the env value when the class is loaded.

```ts
// ✅ interval — preferred for "ping every N ms" jobs
@Interval("ai-balancer-health-check", envConfig().aiBalancer.healthCheckIntervalMs)
async runHealthCheck() { ... }

// ✅ cron — preferred for "run at 03:00" style schedules
@Cron(envConfig().backup.dailyCron, { name: "pg-backup" })
async dailyBackup() { ... }

// ❌ — hardcoded literal cannot be overridden per-env
@Interval("ai-balancer-health-check", 60_000)
async runHealthCheck() { ... }
```

Changing the env value at runtime does **not** reschedule — that requires
`SchedulerRegistry` re-registration, which is an explicit ops action.

### Plain `setInterval` + random jitter for recurring polls

When a per-instance job polls an external service on a fixed cadence,
**always add a random jitter for the first run** so a fleet of pods
booting together don't all fire at the same instant ("thundering herd").

Pattern — `setTimeout(random [0, intervalMs))` → first sweep → `setInterval`:

```ts
@Injectable()
export class HealthService implements OnModuleInit, OnModuleDestroy {
    private initialDelayHandle: NodeJS.Timeout | null = null
    private intervalHandle: NodeJS.Timeout | null = null

    onModuleInit(): void {
        const { intervalMs } = envConfig().X

        // random jitter spreads pod boots across one full period
        const jitterMs = Math.floor(Math.random() * intervalMs)

        this.initialDelayHandle = setTimeout(() => {
            void this.runHealthCheck()
            this.intervalHandle = setInterval(
                () => { void this.runHealthCheck() },
                intervalMs,
            )
        }, jitterMs)
    }

    onModuleDestroy(): void {
        if (this.initialDelayHandle) clearTimeout(this.initialDelayHandle)
        if (this.intervalHandle) clearInterval(this.intervalHandle)
    }

    async runHealthCheck(): Promise<void> { ... }
}
```

Why over `@Interval`:

- Random jitter prevents thundering herd; `@Interval` fires every replica
  at the same wall-clock instant.
- Cleanup on `OnModuleDestroy` prevents Jest leaks + graceful shutdown hangs.
- No coupling to `SchedulerRegistry` for a per-instance job.

Prefer this pattern over `@Interval` for any recurring external-poll job.

### Strict: never `throw new Error("...")` in app code

A raw `throw new Error(...)` is **forbidden** outside trivial test scripts
and the error-normalization helper. Every thrown value in `src/` and `apps/`
must extend `AbstractException` from `@modules/exceptions`, carry a stable
`code` string, and ship structured `metadata`. That gives Sentry / log
filters something to group on and lets callers `instanceof`-match specific
failure modes.

```ts
// ❌ — flat string, no code, no metadata
default:
    throw new Error(`Unsupported provider: ${provider}`)

// ✅ — typed exception under @modules/exceptions/errors/<domain>/<name>.ts
default:
    throw new UnsupportedAiProviderException({ provider })
```

How to add one:

1. Create `src/modules/exceptions/errors/<domain>/<kebab-name>.ts` —
   `interface XMetadata extends AbstractExceptionMetadata { ... }` plus a
   class extending `AbstractException` with a stable code string passed to
   `super(...)`.
2. Export from `src/modules/exceptions/errors/<domain>/index.ts`.
3. Import from `@modules/exceptions` and throw at the call site.

The only acceptable raw `new Error()` is **inside the error-normalization
helper** below (turning an `unknown` caught value into a typed `Error`
reference for re-throw).

### Strict: no uninitialised `let` for try/catch results

A `let x` declared without an initialiser, assigned inside a `try`, then read
after the `catch` is a foot-gun (`x` becomes `T | undefined` in scope) and
ugly. Refactor:

```ts
// ❌ — `acquired` is `Acquired | undefined` after the try block
let acquired
try {
    acquired = await this.balancer.acquire({ provider })
} catch {
    lastError = ...
    break
}
// every later use sees `Acquired | undefined`

// ✅ — helper returns `null` on the expected failure
const acquired = await this.tryAcquire(provider)
if (!acquired) { lastError = ...; break }
// acquired narrowed to `Acquired` for the rest of the iteration
```

Options:

- **Helper returning `T | null`** — best when one specific failure has a
  natural "skip this iteration" semantic.
- **Move the post-`try` logic inside the same `try`** when the two failures
  really belong together (one error path, one happy path).
- **Result/Either wrapper** — only when a library already uses one;
  don't introduce a new Result type for a single call site.

Pick whichever leaves the variable **always initialised at the point of use**.
The compiler should know its concrete type without any `!` assertion or
`undefined` check.

### Error normalization — keep type guards at the boundary

When a `catch (err)` produces `unknown`, normalize **once** at the catch site
(not at every consumer) so downstream code stays clean:

```ts
// ✅ — normalize at the boundary; consumers see strongly-typed `Error`
let lastError: Error | undefined

try {
    await something()
} catch (err) {
    lastError = err instanceof Error ? err : new Error(String(err))
}

// ...later
throw new MyException({ originalError: lastError })

// ❌ — defensive guard at every call site, original variable still `unknown`
let lastError: unknown
// ...
throw new MyException({
    originalError: lastError instanceof Error ? lastError : undefined,
})
```

Extract a tiny `normalizeError(err: unknown): Error` helper when more than
one catch site needs it inside the same service.

---

## 10. Unit tests

Unit tests live **next to the SUT** (system under test), one spec per service/handler/listener.
Mirror the source path:

```
src/modules/bussiness/progress/
├─ leaderboard.service.ts
└─ leaderboard.service.spec.ts          ← spec lives here, NOT under a separate test/ folder

src/features/api/.../leaderboard/
├─ leaderboard.handler.ts
├─ leaderboard.handler.spec.ts
├─ leaderboard.listener.ts
└─ leaderboard.listener.spec.ts
```

### Always use `Test.createTestingModule` — never construct SUT manually

NestJS testing docs are the source of truth:
[https://docs.nestjs.com/fundamentals/testing](https://docs.nestjs.com/fundamentals/testing).
Direct `new MyService(mockA, mockB)` is forbidden — it bypasses DI and breaks when constructor
signatures change.

```ts
import { Test, TestingModule } from "@nestjs/testing"
import { getEntityManagerToken } from "@nestjs/typeorm"
import { CacheService } from "@modules/cache"
import { LeaderboardService } from "./leaderboard.service"
import type { EntityManager } from "typeorm"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

describe("LeaderboardService", () => {
    let module: TestingModule
    let service: LeaderboardService
    let cacheService: jest.Mocked<CacheService>
    let entityManager: jest.Mocked<Pick<EntityManager, "query">>

    beforeEach(async () => {
        cacheService = {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
        } as unknown as jest.Mocked<CacheService>

        entityManager = {
            query: jest.fn(),
        } as unknown as jest.Mocked<Pick<EntityManager, "query">>

        module = await Test.createTestingModule({
            providers: [
                LeaderboardService,
                { provide: CacheService, useValue: cacheService },
                {
                    provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                    useValue: entityManager,
                },
            ],
        }).compile()

        service = module.get<LeaderboardService>(LeaderboardService)
    })

    afterEach(async () => {
        await module.close()
    })

    // tests...
})
```

### Rules

| Rule | Detail |
|------|--------|
| Spec name | `<source>.spec.ts` next to `<source>.ts` |
| `beforeEach` is `async` | Always `await Test.createTestingModule(...).compile()` |
| `afterEach` closes the module | `await module.close()` — releases lifecycle resources |
| Mocks are `jest.fn()`-based | `{ method: jest.fn() } as unknown as jest.Mocked<T>` |
| `useValue` over `useFactory` for simple mocks | Reserve `useFactory` for mocks that need DI |
| Use the real injection token | `provide: getEntityManagerToken("primary")` — not the decorator |
| Don't pull entities into mocks | `{ id, courseId } as any` is fine for entity-typed mocks |
| Lifecycle hooks called explicitly | `listener.onModuleInit()` then assert what it registered — don't rely on auto-init |
| One `describe` per public method | Group `it` cases inside |
| Spec file size | Roughly ≤ 300 LOC; split when one method needs more than ~150 lines |
| No real I/O | No real DB, Redis, HTTP, filesystem. If a service touches a real resource, mock it. |

### Pure unit, not integration

These are **service-level unit tests** — they run in memory only. DB, cache, event bus, HTTP
are always mocked. For integration tests that hit real infrastructure, use a separate
`*.e2e-spec.ts` under `apps/<app>/test/` (existing `jest-e2e.json` config).

### Jest config notes

`package.json` jest block must include:
- `roots: ["<rootDir>/apps/", "<rootDir>/src/"]` — picks up specs under `src/`.
- `moduleNameMapper` for `@modules/*` and `@features/*`.
- `transformIgnorePatterns: []` — the codebase pulls many ESM-only deps
  (`p-retry`, `superjson`, `uuid`, `is-network-error`, …) transitively through module
  barrels; transforming everything is the only sustainable answer. Cold runs ~30s, warm runs ~8s.
- `diagnostics: false` on ts-jest so pre-existing project-wide type errors do not
  fail unit-test runs.

### Running

```bash
npx jest --testPathPatterns "<keyword>"   # single suite by name
npx jest                                   # all specs
```

---

## 11. ESLint

Before completing any code change:

1. Read [eslint.config.mjs](../../../eslint.config.mjs) to understand formatting/rule expectations.
2. Run `npm run lint` after editing. Fix any reported issues.
3. Code that fails lint is not done.

---

## 12. Quick checklist before saving a file

- [ ] File in correct folder (`types/`, `enums/`, `classes/`, `utils/`, `dtos/`, `graphql-types/`, or NestJS framework folder)
- [ ] Filename matches: NestJS dotted suffix OR kebab-case feature name
- [ ] NestJS file does NOT define type/enum/class — only imports them
- [ ] All exported types/enums/classes have JSDoc
- [ ] All public functions/methods have JSDoc (`@param`, `@returns`, `@example` for non-trivial)
- [ ] Inline `//` comments between logical steps
- [ ] Params object for ≥2 args, destructured in signature
- [ ] Param types named `{ActionName}Params`, return types named `{ActionName}Result`
- [ ] No inline type definitions in function signatures
- [ ] `Array<T>` not `T[]`
- [ ] `import type` for type-only imports
- [ ] `index.ts` re-exports updated for new files
- [ ] Tunable values read via `envConfig()`, not hardcoded
- [ ] DB access via `@InjectPrimaryPostgreSQLEntityManager()`, not `@InjectRepository`
- [ ] Ops-editable runtime config in `app.yaml`, not `app.json` or hardcoded
- [ ] Primitives that should not be interchangeable use brand types (`Brand<string, "X">`)
- [ ] Callback payloads varying by enum value use discriminated unions, not plain unions
- [ ] Derived types use `ReturnType<typeof X>` instead of hand-copy
- [ ] No raw `throw new Error(...)` in app code — use `@modules/exceptions` classes
- [ ] No uninitialised `let` for try/catch results — refactor to helper-returns-null or single try block
- [ ] Callback params spelled out (`(model) =>`, `(key) =>`, `(prev, next) =>`) — no single-letter shorthand
- [ ] ESLint clean

---

_Source: [.cursor/rules/starci-academy.mdc](../../../.cursor/rules/starci-academy.mdc). Sync any rule update here._
