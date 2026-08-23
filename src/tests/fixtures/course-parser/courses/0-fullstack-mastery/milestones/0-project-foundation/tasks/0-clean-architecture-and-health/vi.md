# sortIndex
<!-- @starci/seperator -->
1
<!-- @starci/seperator -->
# title
<!-- @starci/seperator -->
Dựng Khung Backend StarCi Shop + Endpoint Health
<!-- @starci/seperator -->
# description
<!-- @starci/seperator -->
Dựng khung backend với cấu trúc phân tầng sạch (http → domain → data) trong đó mỗi tầng chỉ phụ thuộc vào trong, và mở GET /health trả về 200 {"status":"ok"} như một liveness probe thật.
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
Mục tiêu
:::

Trong StarCi Shop, mọi tính năng sau này — sản phẩm, giỏ hàng, đơn hàng, thanh toán — đều cần một chỗ ở sạch sẽ trước khi bạn viết dòng nào → đặt nền móng backend ngay bây giờ. Tách code thành ba tầng — **http** (controller), **domain** (service), **data** (repository) — trong đó mỗi tầng chỉ phụ thuộc *vào trong* (http → domain → data, không bao giờ ngược lại). Rồi mở `GET /health` trả về `200 {"status":"ok"}` như một liveness probe thật để load balancer hay Kubernetes biết process còn sống.

:::muted
Các bước (làm theo thứ tự)
:::

::::accordion
:::panel{title="Bước 1 — Bố cục thư mục cho ba tầng"}
Biến ranh giới thành vật lý: mỗi tầng một thư mục.

```text
src/
  http/        # controller — chỉ vào/ra HTTP
    health.controller.ts
  domain/      # service — quy tắc nghiệp vụ, không HTTP, không SQL
    health.service.ts
  data/        # repository — chỉ truy cập DB
    db.repository.ts
  main.ts      # bootstrap (đọc từ env)
```
:::

:::panel{title="Bước 2 — Tầng data: repository sở hữu việc truy cập DB"}
Nơi duy nhất nói chuyện với database.

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

:::panel{title="Bước 3 — Tầng domain: service chứa quy tắc nghiệp vụ"}
Không kiểu HTTP, không SQL — phụ thuộc vào abstraction repository, không phải framework.

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

:::panel{title="Bước 4 — Tầng http: controller chỉ map HTTP ↔ domain"}
Không có logic nghiệp vụ ở đây.

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

:::panel{title="Bước 5 — Bootstrap đọc env + tắt mượt"}
Đọc port từ environment; đóng sạch khi nhận `SIGTERM`.

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

:::panel{title="Bước 6 — Smoke test endpoint qua HTTP client"}


```bash
# Windows (PowerShell)
Invoke-RestMethod -Uri "http://localhost:3000/health"
# macOS / Linux
curl -i localhost:3000/health
# → Dán cURL vào Postman: Import → Raw text
# kỳ vọng: HTTP/1.1 200 OK
#          {"status":"ok"}
```

*Kết luận:* `GET /health` trả `200` với JSON liveness — process sống, DB khả dụng.
:::
::::

:::muted
Giải pháp
:::

**Ba thư mục = ba tầng, mỗi tầng chỉ phụ thuộc vào trong, với `GET /health` xuyên xuống qua chúng.** Controller (`http`) không làm gì ngoài gọi service; service (`domain`) giữ quy tắc và gọi repository; repository (`data`) là code duy nhất chạm DB. Mũi tên phụ thuộc chỉ http → domain → data và không bao giờ ngược lại, nên domain hoàn toàn không biết gì về HTTP hay SQL. `GET /health` trả `200 {"status":"ok"}` và, trong NestJS, đồ thị import (`HealthController` → `HealthService` → `DbRepository`) biến phân tầng thành thật, không chỉ là quy ước đặt tên.

:::muted
Trade-off
:::

- **Cấu trúc phân tầng** tốn thêm file và gián tiếp lúc đầu; nó đáng giá khi codebase lớn lên — bạn có thể đổi DB hoặc test domain độc lập. Thừa thãi cho script vứt đi, đúng cho dự án sẽ thêm hàng chục tính năng.
- **"Fat controller"** (HTTP + logic + SQL trong một file) viết nhanh cho một endpoint nhưng mục nhanh: không test được, dính chặt framework, không tái dùng được.
- **`/health` liveness chỉ trả `200` tĩnh** thì rẻ nhưng có thể nói dối (process sống, DB chết). Ping `SELECT 1` trung thực hơn nhưng thêm round-trip DB mỗi lần probe — tách liveness khỏi readiness nếu chi phí đó quan trọng.

:::muted
Lỗi thường gặp
:::

- **Rò rỉ tầng:** import một HTTP exception của `@nestjs/common` hay một entity TypeORM vào `domain` ngầm dính tầng vào framework — mũi tên giờ chỉ ra ngoài và việc tách tầng là giả.
- **Logic trong controller:** nếu controller tính bất cứ gì ngoài map request → gọi service, tầng "domain" rỗng ruột.
- **`/health` luôn trả `200`:** khi DB chết probe vẫn báo "ok", nên orchestrator không bao giờ restart process đã chết. Để liveness phản ánh một phụ thuộc thật.
- **Hard-code port:** `app.listen(3000)` vỡ trong container có inject `PORT`. Đọc nó từ environment.
- **Không tắt mượt:** thiếu `enableShutdownHooks()`, `SIGTERM` giết request đang xử lý và rò connection DB mỗi lần deploy.

:::muted
Nâng cao (gợi ý)
:::

- **Tách liveness vs readiness:** `/health` (process sống) vs `/ready` (DB + cache tới được) để một phụ thuộc chậm không gây vòng lặp restart.
- `@nestjs/terminus` cho health indicator có cấu trúc (DB, disk, memory) với JSON chuẩn.
- **Config module có validate schema** (env được validate lúc boot) để thiếu `PORT`/`DATABASE_URL` fail sớm thay vì tới request đầu.
- **Request-id + structured logging** nối trong bootstrap để mọi tầng log có correlation từ ngày đầu.
<!-- @starci/seperator -->
### outcome
#### 0
##### body
<!-- @starci/seperator -->
**`GET /health` trả về response liveness thật.** Endpoint trả `200` với body JSON liveness (vd `{"status":"ok"}`) — không phải 404, không phải body rỗng, không phải `500`. Bằng chứng: output `curl -i` cho thấy `200` và JSON. Thiếu endpoint, không-200, hoặc body không-JSON → FAIL.
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
**App boot lên và phục vụ request.** Chạy lệnh start trong tài liệu thì process lên trên port đã cấu hình và trả lời HTTP mà không crash. Bằng chứng: log boot + một request thành công. Crash lúc boot hoặc port nó không bao giờ lắng nghe → FAIL.
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
**Port đến từ environment.** Đặt biến env `PORT` đổi được port app lắng nghe; không hard-code. Bằng chứng: khởi động với `PORT` khác rồi gọi `/health` trên port đó. Port hard-code bỏ qua biến env → FAIL.
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
**Ba tầng với phụ thuộc chỉ-vào-trong (đọc code).** Kiểm: có riêng thư mục/file `http` (controller), `domain` (service), `data` (repository); controller gọi service, service gọi repository, và `domain` không import kiểu HTTP hay SQL nào (phụ thuộc chỉ http → domain → data qua đồ thị provider/module của NestJS). Bằng chứng: đồ thị import `HealthController` → `HealthService` → `DbRepository`. FAIL khi: tất cả nằm trong một file, hoặc `domain` import kiểu framework HTTP/DB (critical → 0 điểm toàn task).
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
**Bootstrap đọc env + tắt mượt.** Kiểm: `main.ts` đọc port từ `process.env` (có default hợp lý) và gọi `app.enableShutdownHooks()` để `SIGTERM`/`SIGINT` đóng app sạch. Bằng chứng: code bootstrap. Không có port theo env hoặc không có shutdown hook → FAIL.
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
**Bằng chứng & tài liệu:** README ghi lệnh chạy + paste output smoke test terminal/test THẬT (vd `curl -i /health` cho thấy `200 {"status":"ok"}`) chứng minh endpoint và bố cục hoạt động. Bằng chứng: mục README. FAIL khi output smoke thiếu hoặc bịa → 0 điểm toàn task. (Ảnh chụp tuỳ chọn, KHÔNG được chấm.)
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
Mục tiêu
:::

Trong StarCi Shop, mọi tính năng sau này — sản phẩm, giỏ hàng, đơn hàng, thanh toán — đều cần một chỗ ở sạch sẽ trước khi bạn viết dòng nào → đặt nền móng backend ngay bây giờ. Tách code thành ba tầng — **http** (controller), **domain** (service), **data** (repository) — trong đó mỗi tầng chỉ phụ thuộc *vào trong* (http → domain → data, không bao giờ ngược lại). Rồi mở `GET /health` trả về `200 {"status":"ok"}` như một liveness probe thật. Với Spring Boot, các tầng là `@RestController` → `@Service` → `@Repository`, nối bằng constructor injection.

:::muted
Các bước (làm theo thứ tự)
:::

::::accordion
:::panel{title="Bước 1 — Bố cục package cho ba tầng"}
Mỗi tầng một package.

```text
src/main/java/com/shop/
  http/        # @RestController — chỉ vào/ra HTTP
    HealthController.java
  domain/      # @Service — quy tắc nghiệp vụ, không HTTP, không SQL
    HealthService.java
  data/        # @Repository — chỉ truy cập DB
    DbRepository.java
  Application.java   # bootstrap
```
:::

:::panel{title="Bước 2 — Tầng data: repository sở hữu việc truy cập DB"}


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

:::panel{title="Bước 3 — Tầng domain: service chứa quy tắc nghiệp vụ"}
Không kiểu HTTP, không SQL.

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

:::panel{title="Bước 4 — Tầng http: controller chỉ map HTTP ↔ domain"}


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

:::panel{title="Bước 5 — Bootstrap đọc env + tắt mượt"}
Spring đọc `SERVER_PORT` từ environment; bật tắt mượt trong config.

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
# application.properties — port từ env, tắt mượt khi SIGTERM
server.port=${SERVER_PORT:8080}
server.shutdown=graceful
```
:::

:::panel{title="Bước 6 — Smoke test endpoint qua HTTP client"}


```bash
# Windows (PowerShell)
Invoke-RestMethod -Uri "http://localhost:8080/health"
# macOS / Linux
curl -i localhost:8080/health
# → Dán cURL vào Postman: Import → Raw text
# kỳ vọng: HTTP/1.1 200
#          {"status":"ok"}
```

*Kết luận:* `GET /health` trả `200` với JSON liveness — process sống, DB khả dụng.
:::
::::

:::muted
Giải pháp
:::

**Ba package = ba tầng, mỗi tầng chỉ phụ thuộc vào trong, với `GET /health` xuyên xuống qua chúng.** `@RestController` (`http`) không làm gì ngoài gọi service; `@Service` (`domain`) giữ quy tắc và gọi repository; `@Repository` (`data`) là code duy nhất chạm DB. Constructor injection nối chúng sao cho mũi tên chỉ http → domain → data và không bao giờ ngược lại, và domain hoàn toàn không biết gì về HTTP hay SQL. `GET /health` trả `200 {"status":"ok"}`, và đồ thị bean (`HealthController` → `HealthService` → `DbRepository`) biến phân tầng thành thật, không chỉ là quy ước đặt tên.

:::muted
Trade-off
:::

- **Cấu trúc phân tầng** tốn thêm file và gián tiếp lúc đầu; nó đáng giá khi codebase lớn lên — bạn có thể đổi DB hoặc test domain độc lập. Thừa thãi cho script vứt đi, đúng cho dự án sẽ thêm hàng chục tính năng.
- **"Fat controller"** (HTTP + logic + SQL trong một class) viết nhanh cho một endpoint nhưng mục nhanh: không test được, dính chặt framework, không tái dùng được.
- **`/health` liveness chỉ trả `200` tĩnh** thì rẻ nhưng có thể nói dối (process sống, DB chết). Ping `SELECT 1` trung thực hơn nhưng thêm round-trip DB — tách liveness khỏi readiness nếu chi phí đó quan trọng.

:::muted
Lỗi thường gặp
:::

- **Rò rỉ tầng:** import một `ResponseEntity` / kiểu HTTP hay entity JPA vào `domain` dính tầng vào framework — mũi tên giờ chỉ ra ngoài và việc tách tầng là giả.
- **Logic trong controller:** nếu controller tính bất cứ gì ngoài map request → gọi service, tầng "domain" rỗng ruột.
- **`/health` luôn trả `200`:** khi DB chết probe vẫn báo "ok", nên orchestrator không bao giờ restart process đã chết. Để liveness phản ánh một phụ thuộc thật.
- **Hard-code port:** `server.port=8080` literal vỡ trong container có inject `SERVER_PORT`. Bind từ environment bằng `${SERVER_PORT:8080}`.
- **Không tắt mượt:** thiếu `server.shutdown=graceful`, `SIGTERM` cắt request đang xử lý mỗi lần deploy.

:::muted
Nâng cao (gợi ý)
:::

- **Spring Boot Actuator** (`/actuator/health`) cho nhóm liveness/readiness có cấu trúc sẵn.
- **Tách liveness vs readiness** để một phụ thuộc chậm không gây vòng lặp restart.
- **`@ConfigurationProperties` có validate** để thiếu biến env fail sớm lúc boot, không phải tới request đầu.
- **Request-id + structured logging (MDC)** nối trong bootstrap để mọi tầng log có correlation từ ngày đầu.
<!-- @starci/seperator -->
### outcome
#### 0
##### body
<!-- @starci/seperator -->
**`GET /health` trả về response liveness thật.** Endpoint trả `200` với body JSON liveness (vd `{"status":"ok"}`) — không phải 404, không phải body rỗng, không phải `500`. Bằng chứng: output `curl -i` cho thấy `200` và JSON. Thiếu endpoint, không-200, hoặc body không-JSON → FAIL.
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
**App boot lên và phục vụ request.** Chạy lệnh start trong tài liệu thì process lên trên port đã cấu hình và trả lời HTTP mà không crash. Bằng chứng: log boot + một request thành công. Crash lúc boot hoặc port nó không bao giờ lắng nghe → FAIL.
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
**Port đến từ environment.** Đặt biến env `PORT` đổi được port app lắng nghe; không hard-code. Bằng chứng: khởi động với `PORT` khác rồi gọi `/health` trên port đó. Port hard-code bỏ qua biến env → FAIL.
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
**Ba tầng với phụ thuộc chỉ-vào-trong (đọc code).** Kiểm: có riêng package `http` (`@RestController`), `domain` (`@Service`), `data` (`@Repository`); controller gọi service, service gọi repository, và `domain` không import kiểu HTTP hay SQL nào (phụ thuộc chỉ http → domain → data qua constructor injection). Bằng chứng: đồ thị bean `HealthController` → `HealthService` → `DbRepository`. FAIL khi: tất cả nằm trong một class, hoặc `domain` import kiểu framework HTTP/JPA (critical → 0 điểm toàn task).
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
**Bootstrap đọc env + tắt mượt.** Kiểm: port bind từ environment (`server.port=${SERVER_PORT:8080}`, có default hợp lý) và bật tắt mượt (`server.shutdown=graceful`) để `SIGTERM` đóng app sạch. Bằng chứng: config + bootstrap. Không có port theo env hoặc không tắt mượt → FAIL.
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
**Bằng chứng & tài liệu:** README ghi lệnh chạy + paste output smoke test terminal/test THẬT (vd `curl -i /health` cho thấy `200 {"status":"ok"}`) chứng minh endpoint và bố cục hoạt động. Bằng chứng: mục README. FAIL khi output smoke thiếu hoặc bịa → 0 điểm toàn task. (Ảnh chụp tuỳ chọn, KHÔNG được chấm.)
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
Mục tiêu
:::

Trong StarCi Shop, mọi tính năng sau này — sản phẩm, giỏ hàng, đơn hàng, thanh toán — đều cần một chỗ ở sạch sẽ trước khi bạn viết dòng nào → đặt nền móng backend ngay bây giờ. Tách code thành ba tầng — **http** (controller), **domain** (service), **data** (repository) — trong đó mỗi tầng chỉ phụ thuộc *vào trong* (http → domain → data, không bao giờ ngược lại). Rồi mở `GET /health` trả về `200 {"status":"ok"}` như một liveness probe thật. Với ASP.NET Core, các tầng là controller → service → repository, nối qua DI container.

:::muted
Các bước (làm theo thứ tự)
:::

::::accordion
:::panel{title="Bước 1 — Bố cục thư mục cho ba tầng"}
Mỗi tầng một thư mục.

```text
src/
  Http/        # controller — chỉ vào/ra HTTP
    HealthController.cs
  Domain/      # service — quy tắc nghiệp vụ, không HTTP, không SQL
    HealthService.cs
  Data/        # repository — chỉ truy cập DB
    DbRepository.cs
  Program.cs   # bootstrap (đọc từ env)
```
:::

:::panel{title="Bước 2 — Tầng data: repository sở hữu việc truy cập DB"}


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

:::panel{title="Bước 3 — Tầng domain: service chứa quy tắc nghiệp vụ"}
Không kiểu HTTP, không SQL.

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

:::panel{title="Bước 4 — Tầng http: controller chỉ map HTTP ↔ domain"}


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

:::panel{title="Bước 5 — Bootstrap đọc env + tắt mượt + nối DI"}
DI container ép ranh giới tầng; port đến từ environment.

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

:::panel{title="Bước 6 — Smoke test endpoint qua HTTP client"}


```bash
# Windows (PowerShell)
Invoke-RestMethod -Uri "http://localhost:5000/health"
# macOS / Linux
curl -i localhost:5000/health
# → Dán cURL vào Postman: Import → Raw text
# kỳ vọng: HTTP/1.1 200 OK
#          {"status":"ok"}
```

*Kết luận:* `GET /health` trả `200` với JSON liveness — process sống, DB khả dụng.
:::
::::

:::muted
Giải pháp
:::

**Ba thư mục = ba tầng, mỗi tầng chỉ phụ thuộc vào trong, với `GET /health` xuyên xuống qua chúng.** Controller (`Http`) không làm gì ngoài gọi service; service (`Domain`) giữ quy tắc và gọi repository; repository (`Data`) là code duy nhất chạm DB. DI container nối chúng sao cho mũi tên chỉ http → domain → data và không bao giờ ngược lại, và domain hoàn toàn không biết gì về HTTP hay SQL. `GET /health` trả `200 {"status":"ok"}`, và các đăng ký `AddScoped` (`HealthController` → `HealthService` → `DbRepository`) biến phân tầng thành thật, không chỉ là quy ước đặt tên.

:::muted
Trade-off
:::

- **Cấu trúc phân tầng** tốn thêm file và gián tiếp lúc đầu; nó đáng giá khi codebase lớn lên — bạn có thể đổi DB hoặc test domain độc lập. Thừa thãi cho script vứt đi, đúng cho dự án sẽ thêm hàng chục tính năng.
- **"Fat controller"** (HTTP + logic + SQL trong một class, hay một lambda minimal-API) viết nhanh cho một endpoint nhưng mục nhanh: không test được, dính chặt framework, không tái dùng được.
- **`/health` liveness chỉ trả `200` tĩnh** thì rẻ nhưng có thể nói dối (process sống, DB chết). Ping `SELECT 1` trung thực hơn nhưng thêm round-trip DB — tách liveness khỏi readiness nếu chi phí đó quan trọng.

:::muted
Lỗi thường gặp
:::

- **Rò rỉ tầng:** tham chiếu `ControllerBase`/`IActionResult` hay `DbContext` vào `Domain` dính tầng vào framework — mũi tên giờ chỉ ra ngoài và việc tách tầng là giả.
- **Logic trong controller:** nếu controller tính bất cứ gì ngoài map request → gọi service, tầng "domain" rỗng ruột.
- **`/health` luôn trả `200`:** khi DB chết probe vẫn báo "ok", nên orchestrator không bao giờ restart process đã chết. Để liveness phản ánh một phụ thuộc thật.
- **Hard-code port:** `app.Run("http://localhost:5000")` vỡ trong container có inject `PORT`. Đọc nó từ environment.
- **Không tắt mượt:** bỏ host lifetime mặc định (hay `Environment.Exit`) cắt request đang xử lý khi `SIGTERM`; giữ hành vi drain của host.

:::muted
Nâng cao (gợi ý)
:::

- **`AddHealthChecks()` + `MapHealthChecks("/health")`** cho liveness/readiness có cấu trúc với JSON contract chuẩn.
- **Tách liveness vs readiness** để một phụ thuộc chậm không gây vòng lặp restart.
- **Options pattern có validate** (`builder.Services.AddOptions<...>().ValidateOnStart()`) để thiếu biến env fail sớm lúc boot.
- **Request-id + structured logging (Serilog)** nối trong bootstrap để mọi tầng log có correlation từ ngày đầu.
<!-- @starci/seperator -->
### outcome
#### 0
##### body
<!-- @starci/seperator -->
**`GET /health` trả về response liveness thật.** Endpoint trả `200` với body JSON liveness (vd `{"status":"ok"}`) — không phải 404, không phải body rỗng, không phải `500`. Bằng chứng: output `curl -i` cho thấy `200` và JSON. Thiếu endpoint, không-200, hoặc body không-JSON → FAIL.
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
**App boot lên và phục vụ request.** Chạy lệnh start trong tài liệu thì process lên trên port đã cấu hình và trả lời HTTP mà không crash. Bằng chứng: log boot + một request thành công. Crash lúc boot hoặc port nó không bao giờ lắng nghe → FAIL.
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
**Port đến từ environment.** Đặt biến env `PORT` đổi được port app lắng nghe; không hard-code. Bằng chứng: khởi động với `PORT` khác rồi gọi `/health` trên port đó. Port hard-code bỏ qua biến env → FAIL.
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
**Ba tầng với phụ thuộc chỉ-vào-trong (đọc code).** Kiểm: có riêng thư mục/class `Http` (controller), `Domain` (service), `Data` (repository); controller gọi service, service gọi repository, và `Domain` không import kiểu HTTP hay SQL nào (phụ thuộc chỉ http → domain → data qua các đăng ký `AddScoped` của DI container). Bằng chứng: đồ thị DI `HealthController` → `HealthService` → `DbRepository`. FAIL khi: tất cả nằm trong một file/lambda, hoặc `Domain` tham chiếu kiểu framework `ControllerBase`/`DbContext` (critical → 0 điểm toàn task).
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
**Bootstrap đọc env + tắt mượt.** Kiểm: `Program.cs` đọc port từ `Environment.GetEnvironmentVariable("PORT")` (có default hợp lý) và giữ host lifetime mặc định để `SIGTERM` drain request đang xử lý sạch. Bằng chứng: code bootstrap. Không có port theo env hoặc không tắt mượt → FAIL.
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
**Bằng chứng & tài liệu:** README ghi lệnh chạy + paste output smoke test terminal/test THẬT (vd `curl -i /health` cho thấy `200 {"status":"ok"}`) chứng minh endpoint và bố cục hoạt động. Bằng chứng: mục README. FAIL khi output smoke thiếu hoặc bịa → 0 điểm toàn task. (Ảnh chụp tuỳ chọn, KHÔNG được chấm.)
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
Mục tiêu
:::

Trong StarCi Shop, mọi tính năng sau này — sản phẩm, giỏ hàng, đơn hàng, thanh toán — đều cần một chỗ ở sạch sẽ trước khi bạn viết dòng nào → đặt nền móng backend ngay bây giờ. Tách code thành ba tầng — **http** (handler), **domain** (service), **data** (repository) — trong đó mỗi tầng chỉ phụ thuộc *vào trong* (http → domain → data, không bao giờ ngược lại). Rồi mở `GET /health` trả về `200 {"status":"ok"}` như một liveness probe thật. Trong Go, các tầng là package nối tay trong `main`, với domain phụ thuộc vào một *interface* repository.

:::muted
Các bước (làm theo thứ tự)
:::

::::accordion
:::panel{title="Bước 1 — Bố cục package cho ba tầng"}
Mỗi tầng một package.

```text
cmd/api/main.go      # bootstrap (đọc từ env), nối các tầng
internal/
  http/              # handler — chỉ vào/ra HTTP
    health_handler.go
  domain/            # service — quy tắc nghiệp vụ, không HTTP, không SQL
    health_service.go
  data/              # repository — chỉ truy cập DB
    db_repository.go
```
:::

:::panel{title="Bước 2 — Tầng data: repository sở hữu việc truy cập DB"}


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

:::panel{title="Bước 3 — Tầng domain: service phụ thuộc vào interface, không phải DB"}
Domain sở hữu abstraction; data hiện thực nó.

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

:::panel{title="Bước 4 — Tầng http: handler chỉ map HTTP ↔ domain"}


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

:::panel{title="Bước 5 — Bootstrap đọc env + tắt mượt"}
Nối các tầng trong `main`; đọc port từ env; drain khi `SIGTERM`.

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

:::panel{title="Bước 6 — Smoke test endpoint qua HTTP client"}


```bash
# Windows (PowerShell)
Invoke-RestMethod -Uri "http://localhost:8080/health"
# macOS / Linux
curl -i localhost:8080/health
# → Dán cURL vào Postman: Import → Raw text
# kỳ vọng: HTTP/1.1 200 OK
#          {"status":"ok"}
```

*Kết luận:* `GET /health` trả `200` với JSON liveness — process sống, DB khả dụng.
:::
::::

:::muted
Giải pháp
:::

**Ba package = ba tầng, mỗi tầng chỉ phụ thuộc vào trong, với `GET /health` xuyên xuống qua chúng.** Handler (`http`) không làm gì ngoài gọi service; service (`domain`) giữ quy tắc và phụ thuộc vào một *interface* `Pinger` mà nó sở hữu; repository (`data`) hiện thực interface đó và là code duy nhất chạm DB. `main` nối chúng sao cho mũi tên chỉ http → domain → data và không bao giờ ngược lại, và domain hoàn toàn không biết gì về HTTP hay `pgx`. `GET /health` trả `200 {"status":"ok"}`, và cách nối dựa trên interface trong `main` (`HealthHandler` → `HealthService` → `DbRepository`) biến phân tầng thành thật, không chỉ là quy ước đặt tên.

:::muted
Trade-off
:::

- **Cấu trúc phân tầng** tốn thêm file và gián tiếp lúc đầu; nó đáng giá khi codebase lớn lên — bạn có thể đổi DB hoặc test domain độc lập bằng một `Pinger` giả. Thừa thãi cho script vứt đi, đúng cho dự án sẽ thêm hàng chục tính năng.
- **"Fat handler"** (HTTP + logic + SQL trong một func) viết nhanh cho một endpoint nhưng mục nhanh: không test được, dính chặt framework, không tái dùng được.
- **`/health` liveness chỉ trả `200` tĩnh** thì rẻ nhưng có thể nói dối (process sống, DB chết). Ping `SELECT 1` trung thực hơn nhưng thêm round-trip DB — tách liveness khỏi readiness nếu chi phí đó quan trọng.

:::muted
Lỗi thường gặp
:::

- **Rò rỉ tầng:** import `net/http` hay `pgx` vào `domain` dính tầng vào framework — mũi tên giờ chỉ ra ngoài và việc tách tầng là giả. Domain chỉ nên phụ thuộc vào interface `Pinger` của chính nó.
- **Logic trong handler:** nếu handler tính bất cứ gì ngoài map request → gọi service, tầng "domain" rỗng ruột.
- **`/health` luôn trả `200`:** khi DB chết probe vẫn báo "ok", nên orchestrator không bao giờ restart process đã chết. Để liveness phản ánh một phụ thuộc thật.
- **Hard-code port:** `srv.Addr = ":8080"` literal vỡ trong container có inject `PORT`. Đọc nó từ environment.
- **Không tắt mượt:** thiếu `srv.Shutdown(ctx)` khi `SIGTERM`, request đang xử lý bị cắt và connection rò mỗi lần deploy.

:::muted
Nâng cao (gợi ý)
:::

- **Tách liveness vs readiness:** `/health` (process sống) vs `/ready` (DB tới được) để một phụ thuộc chậm không gây vòng lặp restart.
- **Một DI helper nhỏ hoặc `wire`** để giữ `main` dễ đọc khi đồ thị phụ thuộc lớn lên.
- **Config struct load + validate lúc boot** (vd `envconfig`) để thiếu `PORT`/`DATABASE_URL` fail sớm thay vì tới request đầu.
- **Request-id middleware + structured logging (`slog`)** nối trong bootstrap để mọi tầng log có correlation từ ngày đầu.
<!-- @starci/seperator -->
### outcome
#### 0
##### body
<!-- @starci/seperator -->
**`GET /health` trả về response liveness thật.** Endpoint trả `200` với body JSON liveness (vd `{"status":"ok"}`) — không phải 404, không phải body rỗng, không phải `500`. Bằng chứng: output `curl -i` cho thấy `200` và JSON. Thiếu endpoint, không-200, hoặc body không-JSON → FAIL.
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
**App boot lên và phục vụ request.** Chạy lệnh start trong tài liệu thì process lên trên port đã cấu hình và trả lời HTTP mà không crash. Bằng chứng: log boot + một request thành công. Crash lúc boot hoặc port nó không bao giờ lắng nghe → FAIL.
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
**Port đến từ environment.** Đặt biến env `PORT` đổi được port app lắng nghe; không hard-code. Bằng chứng: khởi động với `PORT` khác rồi gọi `/health` trên port đó. Port hard-code bỏ qua biến env → FAIL.
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
**Ba tầng với phụ thuộc chỉ-vào-trong (đọc code).** Kiểm: có riêng package `http` (handler), `domain` (service), `data` (repository); handler gọi service, service phụ thuộc vào interface `Pinger` do domain sở hữu và repository hiện thực, và `domain` không import kiểu `net/http` hay `pgx` nào (phụ thuộc chỉ http → domain → data, nối trong `main`). Bằng chứng: đồ thị dựa-interface `HealthHandler` → `HealthService` → `DbRepository`. FAIL khi: tất cả nằm trong một func, hoặc `domain` import package HTTP/DB (critical → 0 điểm toàn task).
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
**Bootstrap đọc env + tắt mượt.** Kiểm: `main` đọc port từ `os.Getenv("PORT")` (có default hợp lý) và gọi `srv.Shutdown(ctx)` khi `SIGTERM`/`SIGINT` để request đang xử lý drain sạch. Bằng chứng: code bootstrap. Không có port theo env hoặc không tắt mượt → FAIL.
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
**Bằng chứng & tài liệu:** README ghi lệnh chạy + paste output smoke test terminal/test THẬT (vd `curl -i /health` cho thấy `200 {"status":"ok"}`) chứng minh endpoint và bố cục hoạt động. Bằng chứng: mục README. FAIL khi output smoke thiếu hoặc bịa → 0 điểm toàn task. (Ảnh chụp tuỳ chọn, KHÔNG được chấm.)
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
