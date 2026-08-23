# sortIndex
<!-- @starci/seperator -->
1
<!-- @starci/seperator -->
# title
<!-- @starci/seperator -->
Scaffold StarCi Shop Backend + Health Endpoint
<!-- @starci/seperator -->
# description
<!-- @starci/seperator -->
Scaffold the backend with a clean layered structure (http → domain → data) where each layer only depends inward, and expose GET /health returning 200 {"status":"ok"} as a real liveness probe.
<!-- @starci/seperator -->
# type
<!-- @starci/seperator -->
techIntegrate
<!-- @starci/seperator -->
# weight
<!-- @starci/seperator -->
2
<!-- @starci/seperator -->
# maxScore
<!-- @starci/seperator -->
100
<!-- @starci/seperator -->
# verified
<!-- @starci/seperator -->
2026-06-10
<!-- @starci/seperator -->
# criterias
## 0
### lang
<!-- @starci/seperator -->
typescript
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
:::muted
Goal
:::

In StarCi Shop, every future feature — products, cart, orders, checkout — needs a clean home before you write a line of it → lay the backend foundation now. Split the code into three layers — **http** (controller), **domain** (service), **data** (repository) — where each layer only depends *inward* (http → domain → data, never the reverse). Then expose `GET /health` returning `200 {"status":"ok"}` as a real liveness probe so a load balancer or Kubernetes can tell the StarCi Shop process is alive.

:::muted
Steps (in order)
:::

::::accordion
:::panel{title="Step 1 — Folder layout for the three layers"}
Make the boundaries physical: a folder per layer.

```text
src/
  http/        # controllers — HTTP in/out only
    health.controller.ts
  domain/      # services — business rules, no HTTP, no SQL
    health.service.ts
  data/        # repositories — DB access only
    db.repository.ts
  main.ts      # bootstrap (env-driven)
```
:::

:::panel{title="Step 2 — Data layer: a repository that owns DB access"}
The only place that talks to the database.

```typescript
// src/data/db.repository.ts
import { Injectable } from "@nestjs/common"
import { DataSource } from "typeorm"

@Injectable()
export class DbRepository {
  constructor(private readonly dataSource: DataSource) {}

  // a real liveness check: round-trip to the DB
  async ping(): Promise<boolean> {
    await this.dataSource.query("SELECT 1")
    return true
  }
}
```
:::

:::panel{title="Step 3 — Domain layer: a service with the business rule"}
No HTTP types, no SQL — it depends on the repository abstraction, not on the framework.

```typescript
// src/domain/health.service.ts
import { Injectable } from "@nestjs/common"
import { DbRepository } from "../data/db.repository"

@Injectable()
export class HealthService {
  constructor(private readonly repo: DbRepository) {}

  // returns liveness; domain decides what "healthy" means
  async check(): Promise<{ status: string }> {
    await this.repo.ping()
    return { status: "ok" }
  }
}
```
:::

:::panel{title="Step 4 — Http layer: a controller that only maps HTTP ↔ domain"}
No business logic here.

```typescript
// src/http/health.controller.ts
import { Controller, Get } from "@nestjs/common"
import { HealthService } from "../domain/health.service"

@Controller("health")
export class HealthController {
  constructor(private readonly service: HealthService) {}

  @Get()
  check() {
    return this.service.check()   // → 200 { "status": "ok" }
  }
}
```
:::

:::panel{title="Step 5 — Env-driven bootstrap + graceful shutdown"}
Read the port from the environment; close cleanly on `SIGTERM`.

```typescript
// src/main.ts
import { NestFactory } from "@nestjs/core"
import { AppModule } from "./app.module"

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.enableShutdownHooks()                 // run onModuleDestroy on SIGTERM/SIGINT
  const port = Number(process.env.PORT ?? 3000)
  await app.listen(port)
}
bootstrap()
```
:::

:::panel{title="Step 6 — Smoke-test the endpoint via an HTTP client"}


```bash
# Windows (PowerShell)
Invoke-RestMethod -Uri "http://localhost:3000/health"
# macOS / Linux
curl -i localhost:3000/health
# → Paste cURL into Postman: Import → Raw text
# expect: HTTP/1.1 200 OK
#         {"status":"ok"}
```

*Conclusion:* `GET /health` returns `200` with a JSON liveness body — the process is alive and the DB is reachable.
:::
::::

:::muted
Solution
:::

**Three folders = three layers, each depending only inward, with `GET /health` driven down through them.** The controller (`http`) does nothing but call the service; the service (`domain`) holds the rule and calls the repository; the repository (`data`) is the only code that touches the DB. The dependency arrows point http → domain → data and never back, so the domain has zero knowledge of HTTP or SQL. `GET /health` returns `200 {"status":"ok"}` and, in NestJS, the import graph (`HealthController` → `HealthService` → `DbRepository`) makes the layering real, not just a naming convention.

:::muted
Trade-off
:::

- **Layered structure** costs more files and indirection up front; it pays off as the codebase grows — you can swap the DB or test the domain in isolation. Overkill for a throwaway script, right for a project that will gain dozens of features.
- **A "fat controller"** (HTTP + logic + SQL in one file) is faster to write for one endpoint but rots fast: untestable, framework-coupled, impossible to reuse.
- **A liveness `/health` that only returns a static `200`** is cheap but can lie (process up, DB dead). A `SELECT 1` ping is more honest but adds a DB round-trip to every probe — separate liveness from readiness if that cost matters.

:::muted
Pitfalls & failure modes
:::

- **Layer leakage:** importing a `@nestjs/common` HTTP exception or a TypeORM entity inside `domain` quietly couples the layer to the framework — the arrows now point outward and the separation is fake.
- **Logic in the controller:** if the controller computes anything beyond mapping request → service call, the "domain" layer is hollow.
- **A `/health` that always returns `200`:** when the DB is down the probe still says "ok", so the orchestrator never restarts a dead process. Make liveness reflect a real dependency.
- **Hard-coded port:** `app.listen(3000)` breaks in containers that inject `PORT`. Read it from the environment.
- **No graceful shutdown:** without `enableShutdownHooks()`, `SIGTERM` kills in-flight requests and leaks DB connections on every deploy.

:::muted
Advanced (suggestions)
:::

- **Split liveness vs readiness:** `/health` (process alive) vs `/ready` (DB + cache reachable) so a slow dependency doesn't trigger a restart loop.
- `@nestjs/terminus` for structured health indicators (DB, disk, memory) with a standard JSON shape.
- **Config module with schema validation** (env validated at boot) so a missing `PORT`/`DATABASE_URL` fails fast instead of at first request.
- **Request-id + structured logging** wired in the bootstrap so every layer logs with correlation from day one.
<!-- @starci/seperator -->
### outcome
#### 0
##### body
<!-- @starci/seperator -->
**`GET /health` returns a real liveness response.** The endpoint responds `200` with a JSON liveness body (e.g. `{"status":"ok"}`) — not a 404, not an empty body, not a `500`. Evidence: the `curl -i` output showing `200` and the JSON. A missing endpoint, a non-200, or a non-JSON body → FAIL.
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
10
<!-- @starci/seperator -->
##### critical
<!-- @starci/seperator -->
true
<!-- @starci/seperator -->
#### 1
##### body
<!-- @starci/seperator -->
**The app boots and serves requests.** Running the documented start command brings the process up on the configured port and it answers HTTP without crashing. Evidence: the boot log + a successful request. A crash on boot or a port it never listens on → FAIL.
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
10
<!-- @starci/seperator -->
##### critical
<!-- @starci/seperator -->
false
<!-- @starci/seperator -->
#### 2
##### body
<!-- @starci/seperator -->
**Port comes from the environment.** Setting the `PORT` env var changes the port the app listens on; it is not hard-coded. Evidence: starting with a different `PORT` and hitting `/health` on that port. A hard-coded port that ignores the env var → FAIL.
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
10
<!-- @starci/seperator -->
##### critical
<!-- @starci/seperator -->
false
<!-- @starci/seperator -->
### approach
#### 0
##### body
<!-- @starci/seperator -->
**Three layers with inward-only dependencies (read the code).** Checked: separate `http` (controller), `domain` (service), `data` (repository) folders/files; the controller calls the service, the service calls the repository, and `domain` imports no HTTP or SQL types (dependencies point http → domain → data via the NestJS provider/module graph). Evidence: the import graph `HealthController` → `HealthService` → `DbRepository`. Fails when: everything is in one file, or `domain` imports HTTP/DB framework types (critical → zero for the whole task).
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
40
<!-- @starci/seperator -->
##### critical
<!-- @starci/seperator -->
true
<!-- @starci/seperator -->
#### 1
##### body
<!-- @starci/seperator -->
**Env-driven bootstrap + graceful shutdown.** Checked: `main.ts` reads the port from `process.env` (with a sane default) and calls `app.enableShutdownHooks()` so `SIGTERM`/`SIGINT` closes the app cleanly. Evidence: the bootstrap code. No env-based port or no shutdown hook → FAIL.
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
15
<!-- @starci/seperator -->
##### critical
<!-- @starci/seperator -->
false
<!-- @starci/seperator -->
#### 2
##### body
<!-- @starci/seperator -->
**Evidence and documentation:** README documents run command + pastes a REAL terminal/test smoke output (e.g. `curl -i /health` showing `200 {"status":"ok"}`) proving the endpoint and layout work. Evidence: the README section. Fails when the smoke output is missing or fabricated → zero for the whole task. (Screenshots optional, NOT graded.)
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
15
<!-- @starci/seperator -->
##### critical
<!-- @starci/seperator -->
false
<!-- @starci/seperator -->
## 1
### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
:::muted
Goal
:::

In StarCi Shop, every future feature — products, cart, orders, checkout — needs a clean home before you write a line of it → lay the backend foundation now. Split the code into three layers — **http** (controller), **domain** (service), **data** (repository) — where each layer only depends *inward* (http → domain → data, never the reverse). Then expose `GET /health` returning `200 {"status":"ok"}` as a real liveness probe. With Spring Boot, the layers are `@RestController` → `@Service` → `@Repository`, wired by constructor injection.

:::muted
Steps (in order)
:::

::::accordion
:::panel{title="Step 1 — Package layout for the three layers"}
One package per layer.

```text
src/main/java/com/shop/
  http/        # @RestController — HTTP in/out only
    HealthController.java
  domain/      # @Service — business rules, no HTTP, no SQL
    HealthService.java
  data/        # @Repository — DB access only
    DbRepository.java
  Application.java   # bootstrap
```
:::

:::panel{title="Step 2 — Data layer: a repository that owns DB access"}


```java
// data/DbRepository.java
@Repository
public class DbRepository {
  private final JdbcTemplate jdbc;
  DbRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

  // a real liveness check: round-trip to the DB
  public boolean ping() {
    jdbc.queryForObject("SELECT 1", Integer.class);
    return true;
  }
}
```
:::

:::panel{title="Step 3 — Domain layer: a service with the business rule"}
No HTTP types, no SQL.

```java
// domain/HealthService.java
@Service
public class HealthService {
  private final DbRepository repo;
  HealthService(DbRepository repo) { this.repo = repo; }

  // returns liveness; domain decides what "healthy" means
  public Map<String, String> check() {
    repo.ping();
    return Map.of("status", "ok");
  }
}
```
:::

:::panel{title="Step 4 — Http layer: a controller that only maps HTTP ↔ domain"}


```java
// http/HealthController.java
@RestController
public class HealthController {
  private final HealthService service;
  HealthController(HealthService service) { this.service = service; }

  @GetMapping("/health")
  public Map<String, String> check() {
    return service.check();   // → 200 { "status": "ok" }
  }
}
```
:::

:::panel{title="Step 5 — Env-driven bootstrap + graceful shutdown"}
Spring reads `SERVER_PORT` from the environment; enable graceful shutdown in config.

```java
// Application.java
@SpringBootApplication
public class Application {
  public static void main(String[] args) {
    SpringApplication.run(Application.class, args);
  }
}
```

```text
# application.properties — port from env, graceful shutdown on SIGTERM
server.port=${SERVER_PORT:8080}
server.shutdown=graceful
```
:::

:::panel{title="Step 6 — Smoke-test the endpoint via an HTTP client"}


```bash
# Windows (PowerShell)
Invoke-RestMethod -Uri "http://localhost:8080/health"
# macOS / Linux
curl -i localhost:8080/health
# → Paste cURL into Postman: Import → Raw text
# expect: HTTP/1.1 200
#         {"status":"ok"}
```

*Conclusion:* `GET /health` returns `200` with a JSON liveness body — the process is alive and the DB is reachable.
:::
::::

:::muted
Solution
:::

**Three packages = three layers, each depending only inward, with `GET /health` driven down through them.** The `@RestController` (`http`) does nothing but call the service; the `@Service` (`domain`) holds the rule and calls the repository; the `@Repository` (`data`) is the only code that touches the DB. Constructor injection wires them so the arrows point http → domain → data and never back, and the domain has zero knowledge of HTTP or SQL. `GET /health` returns `200 {"status":"ok"}`, and the bean graph (`HealthController` → `HealthService` → `DbRepository`) makes the layering real, not just a naming convention.

:::muted
Trade-off
:::

- **Layered structure** costs more files and indirection up front; it pays off as the codebase grows — you can swap the DB or test the domain in isolation. Overkill for a throwaway script, right for a project that will gain dozens of features.
- **A "fat controller"** (HTTP + logic + SQL in one class) is faster to write for one endpoint but rots fast: untestable, framework-coupled, impossible to reuse.
- **A liveness `/health` that only returns a static `200`** is cheap but can lie (process up, DB dead). A `SELECT 1` ping is more honest but adds a DB round-trip — separate liveness from readiness if that cost matters.

:::muted
Pitfalls & failure modes
:::

- **Layer leakage:** importing a `ResponseEntity` / HTTP type or a JPA entity inside `domain` couples the layer to the framework — the arrows now point outward and the separation is fake.
- **Logic in the controller:** if the controller computes anything beyond mapping request → service call, the "domain" layer is hollow.
- **A `/health` that always returns `200`:** when the DB is down the probe still says "ok", so the orchestrator never restarts a dead process. Make liveness reflect a real dependency.
- **Hard-coded port:** `server.port=8080` literal breaks in containers that inject `SERVER_PORT`. Bind it from the environment with `${SERVER_PORT:8080}`.
- **No graceful shutdown:** without `server.shutdown=graceful`, `SIGTERM` cuts in-flight requests on every deploy.

:::muted
Advanced (suggestions)
:::

- **Spring Boot Actuator** (`/actuator/health`) for structured liveness/readiness groups out of the box.
- **Split liveness vs readiness** so a slow dependency doesn't trigger a restart loop.
- **`@ConfigurationProperties` with validation** so a missing env var fails fast at boot, not at first request.
- **Request-id + structured logging (MDC)** wired in the bootstrap so every layer logs with correlation from day one.
<!-- @starci/seperator -->
### outcome
#### 0
##### body
<!-- @starci/seperator -->
**`GET /health` returns a real liveness response.** The endpoint responds `200` with a JSON liveness body (e.g. `{"status":"ok"}`) — not a 404, not an empty body, not a `500`. Evidence: the `curl -i` output showing `200` and the JSON. A missing endpoint, a non-200, or a non-JSON body → FAIL.
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
10
<!-- @starci/seperator -->
##### critical
<!-- @starci/seperator -->
true
<!-- @starci/seperator -->
#### 1
##### body
<!-- @starci/seperator -->
**The app boots and serves requests.** Running the documented start command brings the process up on the configured port and it answers HTTP without crashing. Evidence: the boot log + a successful request. A crash on boot or a port it never listens on → FAIL.
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
10
<!-- @starci/seperator -->
##### critical
<!-- @starci/seperator -->
false
<!-- @starci/seperator -->
#### 2
##### body
<!-- @starci/seperator -->
**Port comes from the environment.** Setting the `PORT` env var changes the port the app listens on; it is not hard-coded. Evidence: starting with a different `PORT` and hitting `/health` on that port. A hard-coded port that ignores the env var → FAIL.
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
10
<!-- @starci/seperator -->
##### critical
<!-- @starci/seperator -->
false
<!-- @starci/seperator -->
### approach
#### 0
##### body
<!-- @starci/seperator -->
**Three layers with inward-only dependencies (read the code).** Checked: separate `http` (`@RestController`), `domain` (`@Service`), `data` (`@Repository`) packages; the controller calls the service, the service calls the repository, and `domain` imports no HTTP or SQL types (dependencies point http → domain → data via constructor injection). Evidence: the bean graph `HealthController` → `HealthService` → `DbRepository`. Fails when: everything is in one class, or `domain` imports HTTP/JPA framework types (critical → zero for the whole task).
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
40
<!-- @starci/seperator -->
##### critical
<!-- @starci/seperator -->
true
<!-- @starci/seperator -->
#### 1
##### body
<!-- @starci/seperator -->
**Env-driven bootstrap + graceful shutdown.** Checked: the port is bound from the environment (`server.port=${SERVER_PORT:8080}`, with a sane default) and graceful shutdown is enabled (`server.shutdown=graceful`) so `SIGTERM` closes the app cleanly. Evidence: the config + bootstrap. No env-based port or no graceful shutdown → FAIL.
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
15
<!-- @starci/seperator -->
##### critical
<!-- @starci/seperator -->
false
<!-- @starci/seperator -->
#### 2
##### body
<!-- @starci/seperator -->
**Evidence and documentation:** README documents run command + pastes a REAL terminal/test smoke output (e.g. `curl -i /health` showing `200 {"status":"ok"}`) proving the endpoint and layout work. Evidence: the README section. Fails when the smoke output is missing or fabricated → zero for the whole task. (Screenshots optional, NOT graded.)
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
15
<!-- @starci/seperator -->
##### critical
<!-- @starci/seperator -->
false
<!-- @starci/seperator -->
## 2
### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
:::muted
Goal
:::

In StarCi Shop, every future feature — products, cart, orders, checkout — needs a clean home before you write a line of it → lay the backend foundation now. Split the code into three layers — **http** (controller), **domain** (service), **data** (repository) — where each layer only depends *inward* (http → domain → data, never the reverse). Then expose `GET /health` returning `200 {"status":"ok"}` as a real liveness probe. With ASP.NET Core, the layers are a controller → a service → a repository, wired through the DI container.

:::muted
Steps (in order)
:::

::::accordion
:::panel{title="Step 1 — Folder layout for the three layers"}
One folder per layer.

```text
src/
  Http/        # controllers — HTTP in/out only
    HealthController.cs
  Domain/      # services — business rules, no HTTP, no SQL
    HealthService.cs
  Data/        # repositories — DB access only
    DbRepository.cs
  Program.cs   # bootstrap (env-driven)
```
:::

:::panel{title="Step 2 — Data layer: a repository that owns DB access"}


```csharp
// Data/DbRepository.cs
public class DbRepository(AppDbContext db) {
  // a real liveness check: round-trip to the DB
  public async Task<bool> PingAsync() {
    await db.Database.ExecuteSqlRawAsync("SELECT 1");
    return true;
  }
}
```
:::

:::panel{title="Step 3 — Domain layer: a service with the business rule"}
No HTTP types, no SQL.

```csharp
// Domain/HealthService.cs
public class HealthService(DbRepository repo) {
  // returns liveness; domain decides what "healthy" means
  public async Task<object> CheckAsync() {
    await repo.PingAsync();
    return new { status = "ok" };
  }
}
```
:::

:::panel{title="Step 4 — Http layer: a controller that only maps HTTP ↔ domain"}


```csharp
// Http/HealthController.cs
[ApiController]
[Route("health")]
public class HealthController(HealthService service) : ControllerBase {
  [HttpGet]
  public Task<object> Check() => service.CheckAsync();   // → 200 { "status": "ok" }
}
```
:::

:::panel{title="Step 5 — Env-driven bootstrap + graceful shutdown + DI wiring"}
The DI container enforces the layer boundaries; the port comes from the environment.

```csharp
// Program.cs
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
// inward-only dependency wiring: http → domain → data
builder.Services.AddScoped<DbRepository>();
builder.Services.AddScoped<HealthService>();

var app = builder.Build();
app.MapControllers();

// graceful shutdown: ASP.NET drains in-flight requests on SIGTERM
var port = Environment.GetEnvironmentVariable("PORT") ?? "5000";
app.Run($"http://0.0.0.0:{port}");
```
:::

:::panel{title="Step 6 — Smoke-test the endpoint via an HTTP client"}


```bash
# Windows (PowerShell)
Invoke-RestMethod -Uri "http://localhost:5000/health"
# macOS / Linux
curl -i localhost:5000/health
# → Paste cURL into Postman: Import → Raw text
# expect: HTTP/1.1 200 OK
#         {"status":"ok"}
```

*Conclusion:* `GET /health` returns `200` with a JSON liveness body — the process is alive and the DB is reachable.
:::
::::

:::muted
Solution
:::

**Three folders = three layers, each depending only inward, with `GET /health` driven down through them.** The controller (`Http`) does nothing but call the service; the service (`Domain`) holds the rule and calls the repository; the repository (`Data`) is the only code that touches the DB. The DI container wires them so the arrows point http → domain → data and never back, and the domain has zero knowledge of HTTP or SQL. `GET /health` returns `200 {"status":"ok"}`, and the `AddScoped` registrations (`HealthController` → `HealthService` → `DbRepository`) make the layering real, not just a naming convention.

:::muted
Trade-off
:::

- **Layered structure** costs more files and indirection up front; it pays off as the codebase grows — you can swap the DB or test the domain in isolation. Overkill for a throwaway script, right for a project that will gain dozens of features.
- **A "fat controller"** (HTTP + logic + SQL in one class, or a single minimal-API lambda) is faster to write for one endpoint but rots fast: untestable, framework-coupled, impossible to reuse.
- **A liveness `/health` that only returns a static `200`** is cheap but can lie (process up, DB dead). A `SELECT 1` ping is more honest but adds a DB round-trip — separate liveness from readiness if that cost matters.

:::muted
Pitfalls & failure modes
:::

- **Layer leakage:** referencing `ControllerBase`/`IActionResult` or `DbContext` inside `Domain` couples the layer to the framework — the arrows now point outward and the separation is fake.
- **Logic in the controller:** if the controller computes anything beyond mapping request → service call, the "domain" layer is hollow.
- **A `/health` that always returns `200`:** when the DB is down the probe still says "ok", so the orchestrator never restarts a dead process. Make liveness reflect a real dependency.
- **Hard-coded port:** `app.Run("http://localhost:5000")` breaks in containers that inject `PORT`. Read it from the environment.
- **No graceful shutdown:** dropping the default host lifetime (or `Environment.Exit`) cuts in-flight requests on `SIGTERM`; keep the host's drain behaviour.

:::muted
Advanced (suggestions)
:::

- **`AddHealthChecks()` + `MapHealthChecks("/health")`** for structured liveness/readiness with a standard JSON contract.
- **Split liveness vs readiness** so a slow dependency doesn't trigger a restart loop.
- **Options pattern with validation** (`builder.Services.AddOptions<...>().ValidateOnStart()`) so a missing env var fails fast at boot.
- **Request-id + structured logging (Serilog)** wired in the bootstrap so every layer logs with correlation from day one.
<!-- @starci/seperator -->
### outcome
#### 0
##### body
<!-- @starci/seperator -->
**`GET /health` returns a real liveness response.** The endpoint responds `200` with a JSON liveness body (e.g. `{"status":"ok"}`) — not a 404, not an empty body, not a `500`. Evidence: the `curl -i` output showing `200` and the JSON. A missing endpoint, a non-200, or a non-JSON body → FAIL.
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
10
<!-- @starci/seperator -->
##### critical
<!-- @starci/seperator -->
true
<!-- @starci/seperator -->
#### 1
##### body
<!-- @starci/seperator -->
**The app boots and serves requests.** Running the documented start command brings the process up on the configured port and it answers HTTP without crashing. Evidence: the boot log + a successful request. A crash on boot or a port it never listens on → FAIL.
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
10
<!-- @starci/seperator -->
##### critical
<!-- @starci/seperator -->
false
<!-- @starci/seperator -->
#### 2
##### body
<!-- @starci/seperator -->
**Port comes from the environment.** Setting the `PORT` env var changes the port the app listens on; it is not hard-coded. Evidence: starting with a different `PORT` and hitting `/health` on that port. A hard-coded port that ignores the env var → FAIL.
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
10
<!-- @starci/seperator -->
##### critical
<!-- @starci/seperator -->
false
<!-- @starci/seperator -->
### approach
#### 0
##### body
<!-- @starci/seperator -->
**Three layers with inward-only dependencies (read the code).** Checked: separate `Http` (controller), `Domain` (service), `Data` (repository) folders/classes; the controller calls the service, the service calls the repository, and `Domain` imports no HTTP or SQL types (dependencies point http → domain → data via the DI container `AddScoped` registrations). Evidence: the DI graph `HealthController` → `HealthService` → `DbRepository`. Fails when: everything is in one file/lambda, or `Domain` references `ControllerBase`/`DbContext` framework types (critical → zero for the whole task).
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
40
<!-- @starci/seperator -->
##### critical
<!-- @starci/seperator -->
true
<!-- @starci/seperator -->
#### 1
##### body
<!-- @starci/seperator -->
**Env-driven bootstrap + graceful shutdown.** Checked: `Program.cs` reads the port from `Environment.GetEnvironmentVariable("PORT")` (with a sane default) and keeps the default host lifetime so `SIGTERM` drains in-flight requests cleanly. Evidence: the bootstrap code. No env-based port or no graceful shutdown → FAIL.
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
15
<!-- @starci/seperator -->
##### critical
<!-- @starci/seperator -->
false
<!-- @starci/seperator -->
#### 2
##### body
<!-- @starci/seperator -->
**Evidence and documentation:** README documents run command + pastes a REAL terminal/test smoke output (e.g. `curl -i /health` showing `200 {"status":"ok"}`) proving the endpoint and layout work. Evidence: the README section. Fails when the smoke output is missing or fabricated → zero for the whole task. (Screenshots optional, NOT graded.)
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
15
<!-- @starci/seperator -->
##### critical
<!-- @starci/seperator -->
false
<!-- @starci/seperator -->
## 3
### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
### body
<!-- @starci/seperator -->
:::muted
Goal
:::

In StarCi Shop, every future feature — products, cart, orders, checkout — needs a clean home before you write a line of it → lay the backend foundation now. Split the code into three layers — **http** (handler), **domain** (service), **data** (repository) — where each layer only depends *inward* (http → domain → data, never the reverse). Then expose `GET /health` returning `200 {"status":"ok"}` as a real liveness probe. In Go, the layers are packages wired by hand in `main`, with the domain depending on a repository *interface*.

:::muted
Steps (in order)
:::

::::accordion
:::panel{title="Step 1 — Package layout for the three layers"}
One package per layer.

```text
cmd/api/main.go      # bootstrap (env-driven), wires the layers
internal/
  http/              # handlers — HTTP in/out only
    health_handler.go
  domain/            # services — business rules, no HTTP, no SQL
    health_service.go
  data/              # repositories — DB access only
    db_repository.go
```
:::

:::panel{title="Step 2 — Data layer: a repository that owns DB access"}


```go
// internal/data/db_repository.go
package data

import "context"
import "github.com/jackc/pgx/v5/pgxpool"

type DbRepository struct{ pool *pgxpool.Pool }

func NewDbRepository(pool *pgxpool.Pool) *DbRepository { return &DbRepository{pool} }

// Ping is a real liveness check: a round-trip to the DB.
func (r *DbRepository) Ping(ctx context.Context) error {
  _, err := r.pool.Exec(ctx, "SELECT 1")
  return err
}
```
:::

:::panel{title="Step 3 — Domain layer: a service that depends on an interface, not the DB"}
The domain owns the abstraction; data implements it.

```go
// internal/domain/health_service.go
package domain

import "context"

// Pinger is the inward-facing port the domain depends on.
type Pinger interface{ Ping(ctx context.Context) error }

type HealthService struct{ repo Pinger }

func NewHealthService(repo Pinger) *HealthService { return &HealthService{repo} }

// Check returns liveness; domain decides what "healthy" means.
func (s *HealthService) Check(ctx context.Context) (map[string]string, error) {
  if err := s.repo.Ping(ctx); err != nil {
    return nil, err
  }
  return map[string]string{"status": "ok"}, nil
}
```
:::

:::panel{title="Step 4 — Http layer: a handler that only maps HTTP ↔ domain"}


```go
// internal/http/health_handler.go
package http

import ("encoding/json"; "net/http")

type HealthHandler struct{ svc *domain.HealthService }

func (h *HealthHandler) Check(w http.ResponseWriter, r *http.Request) {
  res, err := h.svc.Check(r.Context())
  if err != nil { http.Error(w, "unavailable", http.StatusServiceUnavailable); return }
  w.Header().Set("Content-Type", "application/json")
  _ = json.NewEncoder(w).Encode(res)   // → 200 { "status": "ok" }
}
```
:::

:::panel{title="Step 5 — Env-driven bootstrap + graceful shutdown"}
Wire the layers in `main`; read the port from the env; drain on `SIGTERM`.

```go
// cmd/api/main.go
func main() {
  repo := data.NewDbRepository(pool)         // data
  svc := domain.NewHealthService(repo)       // domain depends on the interface
  h := &http.HealthHandler{Svc: svc}         // http

  mux := nethttp.NewServeMux()
  mux.HandleFunc("GET /health", h.Check)

  port := os.Getenv("PORT")
  if port == "" { port = "8080" }
  srv := &nethttp.Server{Addr: ":" + port, Handler: mux}

  go func() { _ = srv.ListenAndServe() }()

  // graceful shutdown: drain in-flight requests on SIGTERM
  stop := make(chan os.Signal, 1)
  signal.Notify(stop, syscall.SIGTERM, syscall.SIGINT)
  <-stop
  ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
  defer cancel()
  _ = srv.Shutdown(ctx)
}
```
:::

:::panel{title="Step 6 — Smoke-test the endpoint via an HTTP client"}


```bash
# Windows (PowerShell)
Invoke-RestMethod -Uri "http://localhost:8080/health"
# macOS / Linux
curl -i localhost:8080/health
# → Paste cURL into Postman: Import → Raw text
# expect: HTTP/1.1 200 OK
#         {"status":"ok"}
```

*Conclusion:* `GET /health` returns `200` with a JSON liveness body — the process is alive and the DB is reachable.
:::
::::

:::muted
Solution
:::

**Three packages = three layers, each depending only inward, with `GET /health` driven down through them.** The handler (`http`) does nothing but call the service; the service (`domain`) holds the rule and depends on a `Pinger` *interface* it owns; the repository (`data`) implements that interface and is the only code that touches the DB. `main` wires them so the arrows point http → domain → data and never back, and the domain has zero knowledge of HTTP or `pgx`. `GET /health` returns `200 {"status":"ok"}`, and the interface-based wiring in `main` (`HealthHandler` → `HealthService` → `DbRepository`) makes the layering real, not just a naming convention.

:::muted
Trade-off
:::

- **Layered structure** costs more files and indirection up front; it pays off as the codebase grows — you can swap the DB or test the domain in isolation with a fake `Pinger`. Overkill for a throwaway script, right for a project that will gain dozens of features.
- **A "fat handler"** (HTTP + logic + SQL in one func) is faster to write for one endpoint but rots fast: untestable, framework-coupled, impossible to reuse.
- **A liveness `/health` that only returns a static `200`** is cheap but can lie (process up, DB dead). A `SELECT 1` ping is more honest but adds a DB round-trip — separate liveness from readiness if that cost matters.

:::muted
Pitfalls & failure modes
:::

- **Layer leakage:** importing `net/http` or `pgx` inside `domain` couples the layer to the framework — the arrows now point outward and the separation is fake. The domain should depend only on its own `Pinger` interface.
- **Logic in the handler:** if the handler computes anything beyond mapping request → service call, the "domain" layer is hollow.
- **A `/health` that always returns `200`:** when the DB is down the probe still says "ok", so the orchestrator never restarts a dead process. Make liveness reflect a real dependency.
- **Hard-coded port:** `srv.Addr = ":8080"` literal breaks in containers that inject `PORT`. Read it from the environment.
- **No graceful shutdown:** without `srv.Shutdown(ctx)` on `SIGTERM`, in-flight requests are cut and connections leak on every deploy.

:::muted
Advanced (suggestions)
:::

- **Split liveness vs readiness:** `/health` (process alive) vs `/ready` (DB reachable) so a slow dependency doesn't trigger a restart loop.
- **A small DI helper or `wire`** to keep `main` readable as the dependency graph grows.
- **Config struct loaded + validated at boot** (e.g. `envconfig`) so a missing `PORT`/`DATABASE_URL` fails fast instead of at first request.
- **Request-id middleware + structured logging (`slog`)** wired in the bootstrap so every layer logs with correlation from day one.
<!-- @starci/seperator -->
### outcome
#### 0
##### body
<!-- @starci/seperator -->
**`GET /health` returns a real liveness response.** The endpoint responds `200` with a JSON liveness body (e.g. `{"status":"ok"}`) — not a 404, not an empty body, not a `500`. Evidence: the `curl -i` output showing `200` and the JSON. A missing endpoint, a non-200, or a non-JSON body → FAIL.
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
10
<!-- @starci/seperator -->
##### critical
<!-- @starci/seperator -->
true
<!-- @starci/seperator -->
#### 1
##### body
<!-- @starci/seperator -->
**The app boots and serves requests.** Running the documented start command brings the process up on the configured port and it answers HTTP without crashing. Evidence: the boot log + a successful request. A crash on boot or a port it never listens on → FAIL.
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
10
<!-- @starci/seperator -->
##### critical
<!-- @starci/seperator -->
false
<!-- @starci/seperator -->
#### 2
##### body
<!-- @starci/seperator -->
**Port comes from the environment.** Setting the `PORT` env var changes the port the app listens on; it is not hard-coded. Evidence: starting with a different `PORT` and hitting `/health` on that port. A hard-coded port that ignores the env var → FAIL.
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
10
<!-- @starci/seperator -->
##### critical
<!-- @starci/seperator -->
false
<!-- @starci/seperator -->
### approach
#### 0
##### body
<!-- @starci/seperator -->
**Three layers with inward-only dependencies (read the code).** Checked: separate `http` (handler), `domain` (service), `data` (repository) packages; the handler calls the service, the service depends on a domain-owned `Pinger` interface implemented by the repository, and `domain` imports no `net/http` or `pgx` types (dependencies point http → domain → data, wired in `main`). Evidence: the interface-based graph `HealthHandler` → `HealthService` → `DbRepository`. Fails when: everything is in one func, or `domain` imports HTTP/DB packages (critical → zero for the whole task).
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
40
<!-- @starci/seperator -->
##### critical
<!-- @starci/seperator -->
true
<!-- @starci/seperator -->
#### 1
##### body
<!-- @starci/seperator -->
**Env-driven bootstrap + graceful shutdown.** Checked: `main` reads the port from `os.Getenv("PORT")` (with a sane default) and calls `srv.Shutdown(ctx)` on `SIGTERM`/`SIGINT` so in-flight requests drain cleanly. Evidence: the bootstrap code. No env-based port or no graceful shutdown → FAIL.
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
15
<!-- @starci/seperator -->
##### critical
<!-- @starci/seperator -->
false
<!-- @starci/seperator -->
#### 2
##### body
<!-- @starci/seperator -->
**Evidence and documentation:** README documents run command + pastes a REAL terminal/test smoke output (e.g. `curl -i /health` showing `200 {"status":"ok"}`) proving the endpoint and layout work. Evidence: the README section. Fails when the smoke output is missing or fabricated → zero for the whole task. (Screenshots optional, NOT graded.)
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
15
<!-- @starci/seperator -->
##### critical
<!-- @starci/seperator -->
false
<!-- @starci/seperator -->
# difficulty
<!-- @starci/seperator -->
easy
<!-- @starci/seperator -->
