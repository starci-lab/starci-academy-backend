# sortIndex
<!-- @starci/seperator -->
2
<!-- @starci/seperator -->
# title
<!-- @starci/seperator -->
Hoán đổi implementation qua DI và cấu hình lúc compose
<!-- @starci/seperator -->
# description
<!-- @starci/seperator -->
Mở rộng từ bản easy: cùng một interface `Store` nhưng hai implementation (`InMemoryStore` vs `FileStore`), chọn cái nào lúc khởi tạo qua token/cấu hình, và truyền runtime options (`prefix`, `ttlSec`) lúc compose. Chọn ngôn ngữ của bạn; mọi ngôn ngữ trả cùng một contract output.
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
Định nghĩa interface Store + hai implementation và một dynamic module forRoot(options)
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Mục đích
:::

Tách contract khỏi implementation: một interface `Store`, hai impl `InMemoryStore` và `FileStore`, đóng gói trong một dynamic module nhận options lúc compose để framework quyết định impl nào được wire.

:::muted
Ràng buộc kỹ thuật
:::

- Khai báo interface `Store { set(key, value): void; get(key): string | undefined }` và một injection token (ví dụ `const STORE = Symbol('STORE')`).
- `StoreModule.forRoot(options: { impl: 'memory' | 'file'; prefix: string; ttlSec: number })` trả về một `DynamicModule` với một **custom provider** dùng `useFactory` chọn `InMemoryStore` hay `FileStore` theo `options.impl`.
- Options phải được wire qua DI (một provider riêng cho `STORE_OPTIONS`), KHÔNG đọc biến môi trường rải rác trong service.

:::muted
Gợi ý
:::

`provide: STORE, useFactory: (opts) => opts.impl === 'file' ? new FileStore() : new InMemoryStore(), inject: [STORE_OPTIONS]`; `exports: [STORE]` để module khác inject.
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
Interface Store + hai bean impl chọn qua config và @ConfigurationProperties
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Mục đích
:::

Tách contract khỏi implementation: interface `Store`, hai bean `InMemoryStore` và `FileStore`, để Spring chọn bean theo cấu hình và bind options qua `@ConfigurationProperties`.

:::muted
Ràng buộc kỹ thuật
:::

- Interface `Store` với `void set(String key, String value)` và `Optional<String> get(String key)`.
- Hai `@Component` impl; dùng `@Bean` trong `@Configuration` để chọn theo `store.impl` (ví dụ `@ConditionalOnProperty` hoặc switch trong factory bean), inject bằng `@Qualifier` khi cần.
- `@ConfigurationProperties(prefix = "store")` bind `impl`, `prefix`, `ttlSec` từ `application.yml`.

:::muted
Gợi ý
:::

`@ConfigurationProperties` cần `@EnableConfigurationProperties` hoặc `@ConfigurationPropertiesScan`; tránh `new` impl thủ công.
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
Interface IStore + hai impl swap theo config bằng AddSingleton và Options pattern
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Mục đích
:::

Tách contract khỏi implementation: `IStore`, hai impl `InMemoryStore` và `FileStore`, đăng ký vào container và chọn theo cấu hình, bind options bằng `IOptions<T>`.

:::muted
Ràng buộc kỹ thuật
:::

- `interface IStore { void Set(string key, string value); string? Get(string key); }`.
- Ở `Program.cs`: đọc `StoreOptions` (Options pattern), rồi `AddSingleton<IStore>` chọn `InMemoryStore` hay `FileStore` theo `options.Impl`.
- Bind `StoreOptions { Impl, Prefix, TtlSec }` qua `builder.Services.Configure<StoreOptions>(...)`; service nhận `IOptions<StoreOptions>`.

:::muted
Gợi ý
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
Inject Store qua token và expose POST /kv đúng contract
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Mục đích
:::

Cho service nghiệp vụ dùng lại `Store` đã chọn qua IoC container và áp dụng option (`prefix`, `ttlSec`) lên hành vi lưu trữ.

:::muted
Ràng buộc kỹ thuật
:::

- `KvService` nhận `Store` qua `@Inject(STORE)` và nhận options qua `@Inject(STORE_OPTIONS)` — TUYỆT ĐỐI không `new InMemoryStore()` / `new FileStore()`.
- `POST /kv` nhận `{key, value}` → trả `{impl, prefix, ttlSec, storedKey}`; `storedKey = "${prefix}:${key}"` và phải thực sự được lưu vào store đã chọn.
- `impl` trong response phản ánh đúng impl đang chạy theo cấu hình lúc `forRoot`.

:::muted
Gợi ý
:::

Grep toàn repo đảm bảo không còn `new InMemoryStore(` / `new FileStore(` ngoài factory; đổi `impl` ở `forRoot` rồi gọi lại endpoint để thấy response đổi theo.
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
Inject Store qua constructor và expose POST /kv đúng contract
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Mục đích
:::

Cho `KvService` dùng lại `Store` đã chọn qua constructor injection và áp option lên hành vi.

:::muted
Ràng buộc kỹ thuật
:::

- `KvService` nhận `Store` (qua `@Qualifier` đúng bean được chọn) + `StoreProperties` qua **constructor** — KHÔNG `new`.
- `@RestController` `POST /kv` nhận `{key, value}` → trả `{impl, prefix, ttlSec, storedKey}`; `storedKey = prefix + ":" + key` và được lưu thật vào store.
- `impl` phản ánh đúng bean impl đang active theo config.

:::muted
Gợi ý
:::

Dùng record cho request body; đổi `store.impl` trong `application.yml` rồi chạy lại để thấy đổi impl.
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
Inject IStore qua constructor và expose POST /kv đúng contract
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Mục đích
:::

Cho `KvService` dùng lại `IStore` đã chọn qua constructor injection và áp option lên hành vi.

:::muted
Ràng buộc kỹ thuật
:::

- `KvService` nhận `IStore` + `IOptions<StoreOptions>` qua **constructor** — KHÔNG `new`.
- `MapPost("/kv")` nhận `{key, value}` → trả `{impl, prefix, ttlSec, storedKey}`; `storedKey = $"{prefix}:{key}"` và lưu thật vào store.
- `impl` phản ánh đúng impl được resolve theo config.

:::muted
Gợi ý
:::

Handler nhận service qua tham số (`(KvRequest body, KvService svc) => ...`) — container tự resolve.
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
Khởi tạo project và định nghĩa interface Store + hai impl
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** `nest new store-swap-di` rồi `cd` vào thư mục.
- **Bước 2:** Tạo `store/store.interface.ts`: interface `Store` + token `export const STORE = Symbol('STORE')` và `STORE_OPTIONS = Symbol('STORE_OPTIONS')`.
- **Bước 3:** Cài `InMemoryStore` (dùng `Map`) và `FileStore` (ghi/đọc một file JSON nhỏ), cả hai `implements Store`.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- `npm run start:dev` boot không lỗi.
- Hai class đều `implements Store` và độc lập nhau.
- `InMemoryStore.set/get` round-trip đúng giá trị.

:::muted
Nice to have
:::

- `FileStore` tạo file nếu chưa tồn tại; xử lý file rỗng an toàn.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Khởi tạo Spring Boot và interface Store + hai impl
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** Spring Initializr (`spring-boot-starter-web`), base-package `com.example`.
- **Bước 2:** Interface `Store` (`set` / `get`), hai `@Component` impl `InMemoryStore` (Map) và `FileStore` (đọc/ghi file JSON).
- **Bước 3:** `@ConfigurationProperties(prefix = "store")` class `StoreProperties { impl, prefix, ttlSec }`.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- `mvn spring-boot:run` boot không lỗi.
- Hai impl đều `implements Store`.
- `application.yml` có block `store:` với `impl/prefix/ttlSec`.

:::muted
Nice to have
:::

- `FileStore` tạo file nếu chưa có.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Khởi tạo minimal API và IStore + hai impl + StoreOptions
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** `dotnet new web -o StoreSwapDi` rồi `cd` vào.
- **Bước 2:** `IStore` + hai impl `InMemoryStore` (Dictionary) và `FileStore` (file JSON).
- **Bước 3:** Class `StoreOptions { Impl, Prefix, TtlSec }`; cấu hình trong `appsettings.json` block `Store`.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- `dotnet run` chạy không lỗi.
- Hai impl đều `: IStore`.
- `appsettings.json` có section `Store` đầy đủ.

:::muted
Nice to have
:::

- `FileStore` tạo file nếu chưa có.
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
Dynamic module forRoot(options) với custom provider chọn impl
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** Tạo `StoreModule` với static `forRoot(options)` trả `DynamicModule`.
- **Bước 2:** Provider `{ provide: STORE_OPTIONS, useValue: options }` và `{ provide: STORE, useFactory: (o) => o.impl === 'file' ? new FileStore() : new InMemoryStore(), inject: [STORE_OPTIONS] }`.
- **Bước 3:** `exports: [STORE, STORE_OPTIONS]`; ở `AppModule` import `StoreModule.forRoot({ impl: 'memory', prefix: 'app', ttlSec: 60 })`.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- App boot không lỗi DI resolution.
- Đổi `impl: 'file'` rồi boot lại không lỗi.
- Toàn repo không còn `new InMemoryStore(` / `new FileStore(` ngoài factory.

:::muted
Nice to have
:::

- `forRootAsync` đọc options từ `ConfigService`.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Chọn bean theo config + inject qua constructor
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** `@Configuration` với `@Bean Store store(StoreProperties p, InMemoryStore mem, FileStore file)` chọn theo `p.getImpl()`; hoặc `@ConditionalOnProperty`.
- **Bước 2:** `@EnableConfigurationProperties(StoreProperties.class)`.
- **Bước 3:** `KvService` nhận `Store` + `StoreProperties` qua constructor — KHÔNG `new`.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- Đổi `store.impl` trong `application.yml` (`memory` ↔ `file`) → bean active đổi theo, boot không lỗi.
- Không còn `new InMemoryStore()` / `new FileStore()` thủ công ngoài config.

:::muted
Nice to have
:::

- `@Qualifier` rõ ràng cho bean được chọn.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Options pattern + AddSingleton<IStore> swap theo config + inject constructor
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** `builder.Services.Configure<StoreOptions>(builder.Configuration.GetSection("Store"))`.
- **Bước 2:** `AddSingleton<IStore>(sp => sp.GetRequiredService<IOptions<StoreOptions>>().Value.Impl == "file" ? new FileStore() : new InMemoryStore())`.
- **Bước 3:** `KvService` nhận `IStore` + `IOptions<StoreOptions>` qua constructor — KHÔNG `new`.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- Đổi `Store:Impl` trong `appsettings.json` (`memory` ↔ `file`) → impl resolve đổi theo, chạy không lỗi.
- Không `new` impl ngoài factory đăng ký.

:::muted
Nice to have
:::

- `IOptionsMonitor` để theo dõi đổi config (optional).
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
KvService + POST /kv, smoke test và README có Code Execution Trace
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** `KvService` inject `@Inject(STORE)` + `@Inject(STORE_OPTIONS)`; `put(key, value)` lưu `storedKey = "${opts.prefix}:${key}"` vào store, trả `{impl, prefix, ttlSec, storedKey}`.
- **Bước 2:** `KvController` tạo `POST /kv` gọi `KvService.put`.
- **Bước 3:** Gọi thử:
  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri "http://localhost:3000/kv" -Method Post -Body (@{ key = "hello"; value = "world" } | ConvertTo-Json) -ContentType "application/json"

  # macOS / Linux
  # → Dán cURL vào Postman: Import → Raw text
  curl -s -X POST http://localhost:3000/kv -H "Content-Type: application/json" -d '{"key":"hello","value":"world"}'
  ```
- **Bước 4:** Paste response thật vào README **Smoke Test** và viết **Code Execution Trace** `KvController -> KvService -> Store(impl)` với `file:line`.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- `POST /kv` trả `201` + `{impl, prefix, ttlSec, storedKey}` đúng; `storedKey === "app:hello"` với prefix `app`.
- Đổi `forRoot` sang `impl: 'file'` → field `impl` trong response đổi thành `file`.
- README có 6 mục: Challenge description, How to run, Architecture/Stack, Smoke Test, Code Execution Trace, Design Decisions.

:::muted
Nice to have
:::

- Bảng so sánh hai impl trong README.
- Test verify cùng `KvService` chạy được với cả hai impl.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
POST /kv, smoke test và README có Code Execution Trace
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** `@RestController` `POST /kv` nhận `{key, value}`; `KvService.put` lưu `storedKey = prefix + ":" + key`, trả `{impl, prefix, ttlSec, storedKey}`.
- **Bước 2:** Gọi thử:
  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri "http://localhost:3000/kv" -Method Post -Body (@{ key = "hello"; value = "world" } | ConvertTo-Json) -ContentType "application/json"

  # macOS / Linux
  # → Dán cURL vào Postman: Import → Raw text
  curl -s -X POST http://localhost:3000/kv -H "Content-Type: application/json" -d '{"key":"hello","value":"world"}'
  ```
- **Bước 3:** Paste response thật vào README **Smoke Test**; viết **Code Execution Trace** `KvController -> KvService -> Store(impl)` với `file:line`.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- `POST /kv` trả `201` + `{impl, prefix, ttlSec, storedKey}`; `storedKey` đúng `prefix:key`.
- Đổi config `memory` → `file` thì `impl` trong response đổi theo.
- README đủ 6 mục.

:::muted
Nice to have
:::

- Screenshot terminal; bảng so sánh impl.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
POST /kv, smoke test và README có Code Execution Trace
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** `app.MapPost("/kv", (KvRequest body, KvService svc) => Results.Created(...))`; `svc.Put` lưu `storedKey = $"{prefix}:{key}"`, trả `{impl, prefix, ttlSec, storedKey}`.
- **Bước 2:** Gọi thử:
  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri "http://localhost:3000/kv" -Method Post -Body (@{ key = "hello"; value = "world" } | ConvertTo-Json) -ContentType "application/json"

  # macOS / Linux
  # → Dán cURL vào Postman: Import → Raw text
  curl -s -X POST http://localhost:3000/kv -H "Content-Type: application/json" -d '{"key":"hello","value":"world"}'
  ```
- **Bước 3:** Paste response thật vào README **Smoke Test**; viết **Code Execution Trace** với `file:line`.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- `POST /kv` trả `201` + `{impl, prefix, ttlSec, storedKey}`; `storedKey` đúng `prefix:key`.
- Đổi config `memory` → `file` thì `impl` đổi theo.
- README đủ 6 mục.

:::muted
Nice to have
:::

- Screenshot terminal.
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
Bạn biết dùng dynamic module + custom provider (`useFactory`) để hoán đổi implementation theo cấu hình lúc compose, không hard-code.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Bạn biết chọn bean impl theo config (`@ConditionalOnProperty`/factory bean) + `@ConfigurationProperties` để bind options.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Bạn biết dùng Options pattern + `AddSingleton<IStore>` factory để swap impl theo config.
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
Bạn biết wire runtime options qua DI và áp chúng lên hành vi (`storedKey`, `impl`) đúng contract `POST /kv`.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Bạn biết inject `Store` đã chọn qua constructor và áp options đúng contract `POST /kv`.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Bạn biết inject `IStore` + `IOptions<StoreOptions>` qua constructor và áp options đúng contract `POST /kv`.
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
Đã hoàn thành bản easy (cross-module DI + `imports`/`exports`).
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Đã hoàn thành bản easy (DI xuyên package qua Spring).
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Đã hoàn thành bản easy (DI qua container ASP.NET).
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
Hiểu custom provider (`useFactory`/`useValue`), injection token và dynamic module trong NestJS.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Hiểu `@Configuration`/`@Bean`, `@ConfigurationProperties` và `@Qualifier`.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Hiểu Options pattern (`IOptions<T>`), `Configure<T>` và factory `AddSingleton`.
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
