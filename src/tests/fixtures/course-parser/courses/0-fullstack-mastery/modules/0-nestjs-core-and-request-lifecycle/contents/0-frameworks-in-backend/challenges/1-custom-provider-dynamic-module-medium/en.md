# sortIndex
<!-- @starci/seperator -->
2
<!-- @starci/seperator -->
# title
<!-- @starci/seperator -->
Swap implementations via DI and configure at compose time
<!-- @starci/seperator -->
# description
<!-- @starci/seperator -->
Extend the easy version: the same `Store` interface with two implementations (`InMemoryStore` vs `FileStore`), picked at startup via a token/config, and runtime options (`prefix`, `ttlSec`) passed in at compose time. Pick your language; every language returns the same output contract.
<!-- @starci/seperator -->
# requirements
## 0
### langs
#### 0
##### lang
<!-- @starci/seperator -->
typescript
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Define the Store interface + two implementations and a dynamic module forRoot(options)
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Purpose
:::

Separate the contract from the implementation: one `Store` interface, two impls `InMemoryStore` and `FileStore`, packaged in a dynamic module that takes options at compose time so the framework decides which impl gets wired.

:::muted
Technical constraints
:::

- Declare interface `Store { set(key, value): void; get(key): string | undefined }` and an injection token (e.g. `const STORE = Symbol('STORE')`).
- `StoreModule.forRoot(options: { impl: 'memory' | 'file'; prefix: string; ttlSec: number })` returns a `DynamicModule` with a **custom provider** using `useFactory` to pick `InMemoryStore` or `FileStore` based on `options.impl`.
- Options must be wired through DI (a dedicated provider for `STORE_OPTIONS`); do NOT read env vars scattered inside services.

:::muted
Hints
:::

`provide: STORE, useFactory: (opts) => opts.impl === 'file' ? new FileStore() : new InMemoryStore(), inject: [STORE_OPTIONS]`; `exports: [STORE]` so other modules can inject it.
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
50
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Store interface + two bean impls picked by config and @ConfigurationProperties
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Purpose
:::

Separate the contract from the implementation: interface `Store`, two beans `InMemoryStore` and `FileStore`, let Spring pick a bean by config and bind options via `@ConfigurationProperties`.

:::muted
Technical constraints
:::

- Interface `Store` with `void set(String key, String value)` and `Optional<String> get(String key)`.
- Two `@Component` impls; use `@Bean` inside `@Configuration` to pick by `store.impl` (e.g. `@ConditionalOnProperty` or a switch in a factory bean), inject via `@Qualifier` when needed.
- `@ConfigurationProperties(prefix = "store")` binds `impl`, `prefix`, `ttlSec` from `application.yml`.

:::muted
Hints
:::

`@ConfigurationProperties` requires `@EnableConfigurationProperties` or `@ConfigurationPropertiesScan`; avoid manual `new` on impls.
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
50
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
IStore interface + two impls swappable via config with AddSingleton and the Options pattern
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Purpose
:::

Separate the contract from the implementation: `IStore`, two impls `InMemoryStore` and `FileStore`, register them into the container and pick by config, bind options via `IOptions<T>`.

:::muted
Technical constraints
:::

- `interface IStore { void Set(string key, string value); string? Get(string key); }`.
- In `Program.cs`: read `StoreOptions` (Options pattern), then `AddSingleton<IStore>` choosing `InMemoryStore` or `FileStore` based on `options.Impl`.
- Bind `StoreOptions { Impl, Prefix, TtlSec }` via `builder.Services.Configure<StoreOptions>(...)`; the service receives `IOptions<StoreOptions>`.

:::muted
Hints
:::

`builder.Services.AddSingleton<IStore>(sp => sp.GetRequiredService<IOptions<StoreOptions>>().Value.Impl == "file" ? new FileStore() : new InMemoryStore())`.
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
50
<!-- @starci/seperator -->
## 1
### langs
#### 0
##### lang
<!-- @starci/seperator -->
typescript
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Inject Store via the token and expose POST /kv with the correct contract
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Purpose
:::

Let a business service reuse the chosen `Store` via the IoC container and apply options (`prefix`, `ttlSec`) to the storage behaviour.

:::muted
Technical constraints
:::

- `KvService` receives `Store` via `@Inject(STORE)` and options via `@Inject(STORE_OPTIONS)` — ABSOLUTELY no `new InMemoryStore()` / `new FileStore()`.
- `POST /kv` accepts `{key, value}` → returns `{impl, prefix, ttlSec, storedKey}`; `storedKey = "${prefix}:${key}"` and must actually be saved into the chosen store.
- `impl` in the response reflects the impl actually running per the `forRoot` config.

:::muted
Hints
:::

Grep the whole repo to ensure no `new InMemoryStore(` / `new FileStore(` remains outside the factory; flip `impl` in `forRoot` and re-call the endpoint to see the response change.
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
50
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Inject Store via constructor and expose POST /kv with the correct contract
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Purpose
:::

Let `KvService` reuse the chosen `Store` via constructor injection and apply options to the behaviour.

:::muted
Technical constraints
:::

- `KvService` receives `Store` (via `@Qualifier` for the picked bean) + `StoreProperties` via **constructor** — NO `new`.
- `@RestController` `POST /kv` accepts `{key, value}` → returns `{impl, prefix, ttlSec, storedKey}`; `storedKey = prefix + ":" + key` and is actually saved into the store.
- `impl` reflects the bean impl active per config.

:::muted
Hints
:::

Use a record for the request body; flip `store.impl` in `application.yml` and re-run to see the impl change.
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
50
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Inject IStore via constructor and expose POST /kv with the correct contract
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Purpose
:::

Let `KvService` reuse the chosen `IStore` via constructor injection and apply options to the behaviour.

:::muted
Technical constraints
:::

- `KvService` receives `IStore` + `IOptions<StoreOptions>` via **constructor** — NO `new`.
- `MapPost("/kv")` accepts `{key, value}` → returns `{impl, prefix, ttlSec, storedKey}`; `storedKey = $"{prefix}:{key}"` and is actually saved into the store.
- `impl` reflects the impl resolved per config.

:::muted
Hints
:::

The handler receives the service as a parameter (`(KvRequest body, KvService svc) => ...`) — the container resolves it automatically.
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
50
<!-- @starci/seperator -->
# steps
## 0
### langs
#### 0
##### lang
<!-- @starci/seperator -->
typescript
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Initialize the project and define the Store interface + two impls
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** `nest new store-swap-di` then `cd` into the folder.
- **Step 2:** Create `store/store.interface.ts`: interface `Store` + token `export const STORE = Symbol('STORE')` and `STORE_OPTIONS = Symbol('STORE_OPTIONS')`.
- **Step 3:** Implement `InMemoryStore` (using `Map`) and `FileStore` (reads/writes a small JSON file), both `implements Store`.

:::muted
Minimum acceptance criteria
:::

- `npm run start:dev` boots with no errors.
- Both classes `implements Store` and are independent.
- `InMemoryStore.set/get` round-trips the correct value.

:::muted
Nice to have
:::

- `FileStore` creates the file if missing; handles empty file safely.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Initialize Spring Boot and the Store interface + two impls
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** Spring Initializr (`spring-boot-starter-web`), base-package `com.example`.
- **Step 2:** Interface `Store` (`set` / `get`), two `@Component` impls `InMemoryStore` (Map) and `FileStore` (read/write a JSON file).
- **Step 3:** `@ConfigurationProperties(prefix = "store")` class `StoreProperties { impl, prefix, ttlSec }`.

:::muted
Minimum acceptance criteria
:::

- `mvn spring-boot:run` boots with no errors.
- Both impls `implements Store`.
- `application.yml` has a `store:` block with `impl/prefix/ttlSec`.

:::muted
Nice to have
:::

- `FileStore` creates the file if missing.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Initialize the minimal API and IStore + two impls + StoreOptions
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** `dotnet new web -o StoreSwapDi` then `cd` into it.
- **Step 2:** `IStore` + two impls `InMemoryStore` (Dictionary) and `FileStore` (JSON file).
- **Step 3:** Class `StoreOptions { Impl, Prefix, TtlSec }`; configure in `appsettings.json` block `Store`.

:::muted
Minimum acceptance criteria
:::

- `dotnet run` runs with no errors.
- Both impls `: IStore`.
- `appsettings.json` has a complete `Store` section.

:::muted
Nice to have
:::

- `FileStore` creates the file if missing.
<!-- @starci/seperator -->
## 1
### langs
#### 0
##### lang
<!-- @starci/seperator -->
typescript
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Dynamic module forRoot(options) with a custom provider picking the impl
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** Create `StoreModule` with static `forRoot(options)` returning a `DynamicModule`.
- **Step 2:** Providers `{ provide: STORE_OPTIONS, useValue: options }` and `{ provide: STORE, useFactory: (o) => o.impl === 'file' ? new FileStore() : new InMemoryStore(), inject: [STORE_OPTIONS] }`.
- **Step 3:** `exports: [STORE, STORE_OPTIONS]`; in `AppModule` import `StoreModule.forRoot({ impl: 'memory', prefix: 'app', ttlSec: 60 })`.

:::muted
Minimum acceptance criteria
:::

- App boots with no DI resolution errors.
- Switching to `impl: 'file'` and rebooting works with no errors.
- No `new InMemoryStore(` / `new FileStore(` left in the repo outside the factory.

:::muted
Nice to have
:::

- `forRootAsync` reading options from `ConfigService`.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Pick the bean by config + inject via constructor
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** `@Configuration` with `@Bean Store store(StoreProperties p, InMemoryStore mem, FileStore file)` picking by `p.getImpl()`; or `@ConditionalOnProperty`.
- **Step 2:** `@EnableConfigurationProperties(StoreProperties.class)`.
- **Step 3:** `KvService` receives `Store` + `StoreProperties` via constructor — NO `new`.

:::muted
Minimum acceptance criteria
:::

- Flipping `store.impl` in `application.yml` (`memory` ↔ `file`) → the active bean changes, boots with no errors.
- No manual `new InMemoryStore()` / `new FileStore()` left outside the config.

:::muted
Nice to have
:::

- Explicit `@Qualifier` for the chosen bean.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Options pattern + AddSingleton<IStore> swap by config + constructor injection
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** `builder.Services.Configure<StoreOptions>(builder.Configuration.GetSection("Store"))`.
- **Step 2:** `AddSingleton<IStore>(sp => sp.GetRequiredService<IOptions<StoreOptions>>().Value.Impl == "file" ? new FileStore() : new InMemoryStore())`.
- **Step 3:** `KvService` receives `IStore` + `IOptions<StoreOptions>` via constructor — NO `new`.

:::muted
Minimum acceptance criteria
:::

- Flipping `Store:Impl` in `appsettings.json` (`memory` ↔ `file`) → the resolved impl changes, runs with no errors.
- No `new` on impls outside the registered factory.

:::muted
Nice to have
:::

- `IOptionsMonitor` to watch config changes (optional).
<!-- @starci/seperator -->
## 2
### langs
#### 0
##### lang
<!-- @starci/seperator -->
typescript
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
KvService + POST /kv, smoke test and a README with a Code Execution Trace
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** `KvService` injects `@Inject(STORE)` + `@Inject(STORE_OPTIONS)`; `put(key, value)` stores `storedKey = "${opts.prefix}:${key}"` into the store, returns `{impl, prefix, ttlSec, storedKey}`.
- **Step 2:** `KvController` exposes `POST /kv` calling `KvService.put`.
- **Step 3:** Send a test call:
  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri "http://localhost:3000/kv" -Method Post -Body (@{ key = "hello"; value = "world" } | ConvertTo-Json) -ContentType "application/json"

  # macOS / Linux
  # → Paste cURL into Postman: Import → Raw text
  curl -s -X POST http://localhost:3000/kv -H "Content-Type: application/json" -d '{"key":"hello","value":"world"}'
  ```
- **Step 4:** Paste the real response into the README **Smoke Test** section and write the **Code Execution Trace** as `KvController -> KvService -> Store(impl)` with `file:line`.

:::muted
Minimum acceptance criteria
:::

- `POST /kv` returns `201` + a correct `{impl, prefix, ttlSec, storedKey}`; `storedKey === "app:hello"` with prefix `app`.
- Switching `forRoot` to `impl: 'file'` → the `impl` field in the response becomes `file`.
- README has 6 sections: Challenge description, How to run, Architecture/Stack, Smoke Test, Code Execution Trace, Design Decisions.

:::muted
Nice to have
:::

- Comparison table of the two impls in the README.
- Tests verifying the same `KvService` runs on both impls.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
POST /kv, smoke test and a README with a Code Execution Trace
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** `@RestController` `POST /kv` accepts `{key, value}`; `KvService.put` stores `storedKey = prefix + ":" + key`, returns `{impl, prefix, ttlSec, storedKey}`.
- **Step 2:** Send a test call:
  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri "http://localhost:3000/kv" -Method Post -Body (@{ key = "hello"; value = "world" } | ConvertTo-Json) -ContentType "application/json"

  # macOS / Linux
  # → Paste cURL into Postman: Import → Raw text
  curl -s -X POST http://localhost:3000/kv -H "Content-Type: application/json" -d '{"key":"hello","value":"world"}'
  ```
- **Step 3:** Paste the real response into the README **Smoke Test**; write the **Code Execution Trace** `KvController -> KvService -> Store(impl)` with `file:line`.

:::muted
Minimum acceptance criteria
:::

- `POST /kv` returns `201` + `{impl, prefix, ttlSec, storedKey}`; `storedKey` matches `prefix:key`.
- Flipping config `memory` → `file` changes `impl` in the response accordingly.
- README has 6 sections.

:::muted
Nice to have
:::

- Terminal screenshot; impl comparison table.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
POST /kv, smoke test and a README with a Code Execution Trace
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** `app.MapPost("/kv", (KvRequest body, KvService svc) => Results.Created(...))`; `svc.Put` stores `storedKey = $"{prefix}:{key}"`, returns `{impl, prefix, ttlSec, storedKey}`.
- **Step 2:** Send a test call:
  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri "http://localhost:3000/kv" -Method Post -Body (@{ key = "hello"; value = "world" } | ConvertTo-Json) -ContentType "application/json"

  # macOS / Linux
  # → Paste cURL into Postman: Import → Raw text
  curl -s -X POST http://localhost:3000/kv -H "Content-Type: application/json" -d '{"key":"hello","value":"world"}'
  ```
- **Step 3:** Paste the real response into the README **Smoke Test**; write the **Code Execution Trace** with `file:line`.

:::muted
Minimum acceptance criteria
:::

- `POST /kv` returns `201` + `{impl, prefix, ttlSec, storedKey}`; `storedKey` matches `prefix:key`.
- Flipping config `memory` → `file` changes `impl` accordingly.
- README has 6 sections.

:::muted
Nice to have
:::

- Terminal screenshot.
<!-- @starci/seperator -->
# outputs
## 0
### langs
#### 0
##### lang
<!-- @starci/seperator -->
typescript
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
You know how to use a dynamic module + custom provider (`useFactory`) to swap implementations by config at compose time, without hard-coding.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
You know how to pick a bean impl by config (`@ConditionalOnProperty`/factory bean) + `@ConfigurationProperties` to bind options.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
You know how to use the Options pattern + `AddSingleton<IStore>` factory to swap impls by config.
<!-- @starci/seperator -->
## 1
### langs
#### 0
##### lang
<!-- @starci/seperator -->
typescript
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
You know how to wire runtime options via DI and apply them to behaviour (`storedKey`, `impl`) per the `POST /kv` contract.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
You know how to inject the chosen `Store` via constructor and apply options per the `POST /kv` contract.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
You know how to inject `IStore` + `IOptions<StoreOptions>` via constructor and apply options per the `POST /kv` contract.
<!-- @starci/seperator -->
# prerequisites
## 0
### langs
#### 0
##### lang
<!-- @starci/seperator -->
typescript
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Completed the easy version (cross-module DI + `imports`/`exports`).
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Completed the easy version (cross-package DI through Spring).
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Completed the easy version (DI through the ASP.NET container).
<!-- @starci/seperator -->
## 1
### langs
#### 0
##### lang
<!-- @starci/seperator -->
typescript
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Understand custom providers (`useFactory`/`useValue`), injection tokens and dynamic modules in NestJS.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Understand `@Configuration`/`@Bean`, `@ConfigurationProperties` and `@Qualifier`.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Understand the Options pattern (`IOptions<T>`), `Configure<T>` and the `AddSingleton` factory.
<!-- @starci/seperator -->
# difficulty
<!-- @starci/seperator -->
medium
<!-- @starci/seperator -->
# score
<!-- @starci/seperator -->
100
<!-- @starci/seperator -->
# verified
<!-- @starci/seperator -->
2026-05-30
<!-- @starci/seperator -->
