# type
<!-- @starci/seperator -->
githubUrl
<!-- @starci/seperator -->
# title
<!-- @starci/seperator -->
GitHub Repository Link
<!-- @starci/seperator -->
# description
<!-- @starci/seperator -->
A public repo with the code (in the language you chose) + a 6-section README with real Smoke Test output, demonstrating that changing the config changes `impl`.
<!-- @starci/seperator -->
# score
<!-- @starci/seperator -->
100
<!-- @starci/seperator -->

# outcomeCriterias
## 0
### body
#### 0
##### lang
<!-- @starci/seperator -->
typescript
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Happy path matches the contract + shape.** `POST /kv` with body `{"key":"hello","value":"world"}` must return HTTP `201` and JSON with the exact shape `{impl, prefix, ttlSec, storedKey}` — no extra, no missing fields. `storedKey` must follow the format `"${prefix}:${key}"` (e.g. prefix `app` → `storedKey === "app:hello"`); `impl` is the string `"memory"` or `"file"`, `ttlSec` is a number. Wrong HTTP code, wrong shape, or a `storedKey` not in `prefix:key` format → FAIL.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Happy path matches the contract + shape.** `POST /kv` with body `{"key":"hello","value":"world"}` must return HTTP `201` and JSON with the exact shape `{impl, prefix, ttlSec, storedKey}` — no extra, no missing fields. `storedKey` must follow the format `"${prefix}:${key}"` (e.g. prefix `app` → `storedKey === "app:hello"`); `impl` is the string `"memory"` or `"file"`, `ttlSec` is a number. Wrong HTTP code, wrong shape, or a `storedKey` not in `prefix:key` format → FAIL.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Happy path matches the contract + shape.** `POST /kv` with body `{"key":"hello","value":"world"}` must return HTTP `201` and JSON with the exact shape `{impl, prefix, ttlSec, storedKey}` — no extra, no missing fields. `storedKey` must follow the format `"${prefix}:${key}"` (e.g. prefix `app` → `storedKey === "app:hello"`); `impl` is the string `"memory"` or `"file"`, `ttlSec` is a number. Wrong HTTP code, wrong shape, or a `storedKey` not in `prefix:key` format → FAIL.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
10
<!-- @starci/seperator -->
### critical
<!-- @starci/seperator -->
false
<!-- @starci/seperator -->
## 1
### body
#### 0
##### lang
<!-- @starci/seperator -->
typescript
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Swap implementation via config, WITHOUT touching consumer code.** Switch the config from `memory` to `file` (or vice versa) — change only the config source (forRoot options / yaml / appsettings / flag), do NOT touch `KvService` or the controller — then call `POST /kv` again and the `impl` field in the response changes accordingly (memory ↔ file), and the value is actually stored in the new store. If you must edit consumer code to switch impl, or `impl` does not change after the config change → FAIL.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Swap implementation via config, WITHOUT touching consumer code.** Switch the config from `memory` to `file` (or vice versa) — change only the config source (forRoot options / yaml / appsettings / flag), do NOT touch `KvService` or the controller — then call `POST /kv` again and the `impl` field in the response changes accordingly (memory ↔ file), and the value is actually stored in the new store. If you must edit consumer code to switch impl, or `impl` does not change after the config change → FAIL.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Swap implementation via config, WITHOUT touching consumer code.** Switch the config from `memory` to `file` (or vice versa) — change only the config source (forRoot options / yaml / appsettings / flag), do NOT touch `KvService` or the controller — then call `POST /kv` again and the `impl` field in the response changes accordingly (memory ↔ file), and the value is actually stored in the new store. If you must edit consumer code to switch impl, or `impl` does not change after the config change → FAIL.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
10
<!-- @starci/seperator -->
### critical
<!-- @starci/seperator -->
false
<!-- @starci/seperator -->
## 2
### body
#### 0
##### lang
<!-- @starci/seperator -->
typescript
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Invalid input is rejected (proof validation runs before storage).** `POST /kv` with a missing `key` (or an empty/blank `key`) must return HTTP `4xx` and must NOT store anything (no `storedKey` written into the chosen store). If a bad request still returns 201 / still writes to the store → FAIL.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Invalid input is rejected (proof validation runs before storage).** `POST /kv` with a missing `key` (or an empty/blank `key`) must return HTTP `4xx` and must NOT store anything (no `storedKey` written into the chosen store). If a bad request still returns 201 / still writes to the store → FAIL.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Invalid input is rejected (proof validation runs before storage).** `POST /kv` with a missing `key` (or an empty/blank `key`) must return HTTP `4xx` and must NOT store anything (no `storedKey` written into the chosen store). If a bad request still returns 201 / still writes to the store → FAIL.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
10
<!-- @starci/seperator -->
### critical
<!-- @starci/seperator -->
false
<!-- @starci/seperator -->
# approachCriterias
## 0
### body
#### 0
##### lang
<!-- @starci/seperator -->
typescript
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Swap impl via custom provider by the correct mechanism (verified by reading the code).** The impl is chosen via a **custom provider** `useFactory` in `StoreModule.forRoot(options)` (the factory reads `options.impl` to return `InMemoryStore` or `FileStore`), and `KvService` receives the store via the injection token `@Inject(STORE)` — NOT a concrete class. Grep the whole repo: NO `new InMemoryStore(` / `new FileStore(` outside the factory; NO `if/else` or `switch` choosing the impl inside `KvService` (the consumer). If the consumer self-`new`s the impl, picks the impl with if-else, or injects the concrete class instead of the token → FAIL (critical → zero for the whole challenge).
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Swap bean impl via DI by the correct mechanism (verified by reading the code).** The impl is chosen via a `@Bean` in a `@Configuration` (the factory bean reads `StoreProperties.getImpl()`) or `@ConditionalOnProperty`, and `KvService` receives `Store` via the **constructor** (with the correct `@Qualifier` bean if needed) — NOT a concrete impl. Grep: NO manual `new InMemoryStore(` / `new FileStore(` outside the config class; NO if-else choosing the impl inside `KvService`. If the consumer self-`new`s, self-switches the impl, or injects the concrete impl class → FAIL (critical → zero for the whole challenge).
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Swap impl via the container by the correct mechanism (verified by reading the code).** The impl is chosen via an `AddSingleton<IStore>(sp => ...)` factory in `Program.cs` reading `StoreOptions.Impl` to return `InMemoryStore` or `FileStore`; `KvService` receives `IStore` via the **constructor** — NOT a concrete impl. Grep: NO `new InMemoryStore(` / `new FileStore(` outside the registered factory; NO if-else choosing the impl inside `KvService`. If the consumer self-`new`s, self-switches the impl, or injects the concrete impl class instead of `IStore` → FAIL (critical → zero for the whole challenge).
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
40
<!-- @starci/seperator -->
### critical
<!-- @starci/seperator -->
true
<!-- @starci/seperator -->
## 1
### body
#### 0
##### lang
<!-- @starci/seperator -->
typescript
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Options bound to the correct config source via DI (options-wiring proof).** Options (`impl`, `prefix`, `ttlSec`) are wired through DI via a dedicated provider (`STORE_OPTIONS`, e.g. `{ provide: STORE_OPTIONS, useValue: options }`) and passed to the factory via `inject: [STORE_OPTIONS]`; `KvService` reads options via `@Inject(STORE_OPTIONS)`. NO `process.env` scattered across the service. If the service reads env / hard-codes prefix-ttl instead of taking them from the options provider → FAIL.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Options bound to the correct config source (options-wiring proof).** `impl`, `prefix`, `ttlSec` are bound via `@ConfigurationProperties(prefix = "store")` from `application.yml` (enabled by `@EnableConfigurationProperties`/`@ConfigurationPropertiesScan`) and `StoreProperties` is injected into the service via the constructor. NO env / scattered `@Value` reads in the service. If the service reads env itself or hard-codes prefix-ttl → FAIL.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Options bound to the correct config source (options-wiring proof).** `StoreOptions { Impl, Prefix, TtlSec }` is bound via `builder.Services.Configure<StoreOptions>(builder.Configuration.GetSection("Store"))` from `appsettings.json` and injected into the service via `IOptions<StoreOptions>`. NO scattered `Configuration[...]` reads in the service. If the service reads config itself or hard-codes prefix-ttl → FAIL.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
15
<!-- @starci/seperator -->
### critical
<!-- @starci/seperator -->
false
<!-- @starci/seperator -->
## 2
### body
#### 0
##### lang
<!-- @starci/seperator -->
typescript
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Evidence & documentation (proof the swap is real, not faked).** README has all 6 sections (Challenge description, How to run, Architecture/Stack, Smoke Test, Code Execution Trace, Design Decisions). The **Smoke Test** pastes the REAL terminal request/response for BOTH configs: one run with `impl: memory` and one run with `impl: file` (same endpoint, only the config changed), showing the `impl` field flip. The **Code Execution Trace** has ≥3 touch points `file:line -> method()` following `KvController → KvService → Store(impl)`. Fabricated output, or only one impl shown → zero for the whole challenge.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Evidence & documentation (proof the swap is real, not faked).** README has all 6 sections. The **Smoke Test** pastes the REAL terminal request/response for BOTH configs: one run with `store.impl: memory` and one with `store.impl: file` (only `application.yml` changed), showing the `impl` field flip. The **Code Execution Trace** has ≥3 touch points `file:line -> method()` following `KvController → KvService → Store(impl)`. Fabricated output, or only one impl shown → zero for the whole challenge.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Evidence & documentation (proof the swap is real, not faked).** README has all 6 sections. The **Smoke Test** pastes the REAL terminal request/response for BOTH configs: one run with `Store:Impl` = `memory` and one with `file` (only `appsettings.json` changed), showing the `impl` field flip. The **Code Execution Trace** has ≥3 touch points `file:line -> method()` following endpoint → `KvService` → `IStore(impl)`. Fabricated output, or only one impl shown → zero for the whole challenge.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
15
<!-- @starci/seperator -->
### critical
<!-- @starci/seperator -->
false
<!-- @starci/seperator -->
