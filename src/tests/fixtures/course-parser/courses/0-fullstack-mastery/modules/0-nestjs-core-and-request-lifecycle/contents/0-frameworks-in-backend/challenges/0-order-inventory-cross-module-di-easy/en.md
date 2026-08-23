# sortIndex
<!-- @starci/seperator -->
1
<!-- @starci/seperator -->
# title
<!-- @starci/seperator -->
Reuse a service across two areas via Dependency Injection
<!-- @starci/seperator -->
# description
<!-- @starci/seperator -->
Build two independent business areas (order and inventory) and let order reuse the inventory service via dependency injection — without instantiating it itself. Pick your language; every language returns the same output contract.
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
Split two independent modules and declare the export/import boundary
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Purpose
:::

Organize the code into two separate business areas — `InventoryModule` and `OrderModule` — to see how the framework controls the sharing boundary between modules.

:::muted
Technical constraints
:::

- `InventoryModule` contains `InventoryService` and declares `exports: [InventoryService]`.
- `OrderModule` declares `imports: [InventoryModule]`; do NOT re-register `InventoryService` in `OrderModule`'s `providers` (that would create a second instance).
- Do not merge both areas into the same module to avoid wiring.

:::muted
Hints
:::

Generate with the Nest CLI (`nest g module/service`) to keep the folder convention; forgetting `exports` causes a `Nest can't resolve dependencies` error at bootstrap.
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
40
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Split two independent packages and let Spring manage the beans
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Purpose
:::

Organize the code into two packages `inventory` and `order` so Spring's IoC container can auto-discover and wire beans across packages.

:::muted
Technical constraints
:::

- `InventoryService` is `@Service` in package `inventory`; `OrderService` is `@Service` in package `order`.
- Both live within the scan path of `@SpringBootApplication` (same base-package `com.example` and below).
- Do not create `InventoryService` manually anywhere.

:::muted
Hints
:::

Use Spring Initializr (spring-boot-starter-web) to scaffold fast; beans outside the base-package require an explicit `@ComponentScan`.
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
40
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Split two namespaces and register services into the IoC container
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Purpose
:::

Organize the code into two namespaces `Inventory` and `Order`, register services into ASP.NET's built-in container to see the framework inject automatically.

:::muted
Technical constraints
:::

- `InventoryService` and `OrderService` are registered at the composition root (`Program.cs`) with `AddSingleton`.
- `OrderService` is resolved by the container, not instantiated by hand.
- Do not hard-code `new` to bypass the container.

:::muted
Hints
:::

`dotnet new web` for the minimal API; forgetting `AddSingleton` causes a runtime resolve error.
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
40
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Split two independent packages and export via Go conventions
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Purpose
:::

Organize the code into two packages `inventory` and `order`; since Go has no IoC container, you wire things yourself at the composition root to see clearly what a framework usually does for you.

:::muted
Technical constraints
:::

- package `inventory` exports `InventoryService` (capitalized identifier); package `order` imports and uses it.
- `OrderService` receives `*InventoryService` via a **constructor function** `NewOrderService(inv *InventoryService)`.
- Do not create `InventoryService` inside the `order` package.

:::muted
Hints
:::

`go mod init`; `go get` gin + `github.com/google/uuid`; wiring lives in `main`.
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
40
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
Inject InventoryService and expose POST /orders with the correct contract
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Purpose
:::

Let `OrderService` reuse `InventoryService` through the IoC container and expose an order endpoint with a stable contract.

:::muted
Technical constraints
:::

- `OrderService` receives `InventoryService` via **constructor injection** — ABSOLUTELY no `new InventoryService()`.
- `InventoryService.reserveStock(productId, qty)` subtracts stock (default 100/sku) and returns the reserved amount.
- `POST /orders` accepts `{productId, qty}` (qty is a positive integer) → returns `{orderId, productId, reservedQty}`; `orderId` is a UUID v4 generated by `crypto.randomUUID()`.

:::muted
Hints
:::

Grep the whole repo to ensure no `new InventoryService(` string remains; use a DTO + `ValidationPipe` to block invalid qty (nice-to-have).
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
60
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Inject InventoryService and expose POST /orders with the correct contract
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Purpose
:::

Let `OrderService` reuse `InventoryService` via Spring constructor injection and expose an order endpoint.

:::muted
Technical constraints
:::

- `OrderService` receives `InventoryService` via **constructor** (Spring auto-wires the single constructor) — NO `new`.
- `InventoryService.reserveStock(productId, qty)` subtracts stock (default 100) and returns the reserved amount.
- `@RestController` `POST /orders` accepts `{productId, qty}` → returns `{orderId, productId, reservedQty}`; `orderId` = `UUID.randomUUID().toString()`.

:::muted
Hints
:::

Use a record/DTO for the request body; `@Valid` + `@Positive` blocks invalid qty (nice-to-have).
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
60
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Inject InventoryService and expose POST /orders with the correct contract
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Purpose
:::

Let `OrderService` reuse `InventoryService` via the container's constructor injection and expose an order endpoint.

:::muted
Technical constraints
:::

- `OrderService` receives `InventoryService` via **constructor** — NO `new`.
- `InventoryService.ReserveStock(productId, qty)` subtracts stock (default 100) and returns the reserved amount.
- `MapPost("/orders")` accepts `{productId, qty}` → returns `{orderId, productId, reservedQty}`; `orderId` = `Guid.NewGuid().ToString()`.

:::muted
Hints
:::

The handler may receive the service as a parameter (`(OrderService svc) => ...`) — the container resolves it automatically.
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
60
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Wire in main and expose POST /orders with the correct contract
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Purpose
:::

Wire inventory → order in `main` (composition root) and expose an order endpoint with gin.

:::muted
Technical constraints
:::

- In `main`: create `inventory`, pass it to `NewOrderService(inv)` — one shared instance.
- `InventoryService.ReserveStock(productId, qty)` subtracts stock (default 100) and returns the reserved amount.
- gin `POST /orders` accepts `{productId, qty}` → returns `{orderId, productId, reservedQty}`; `orderId` = `uuid.NewString()`.

:::muted
Hints
:::

Use a struct with json tags to preserve field names in the response.
<!-- @starci/seperator -->
##### score
<!-- @starci/seperator -->
60
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
Initialize the project and InventoryModule
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** `nest new order-inventory-di` then `cd` into the folder.
- **Step 2:** Scaffold the module + service: `nest g module inventory` and `nest g service inventory`.
- **Step 3:** In `InventoryService`, implement `reserveStock(productId: string, qty: number): number` using an internal `Map<string, number>`, default stock 100/sku, subtracting `qty` and returning the remaining amount each call.
- **Step 4:** In `InventoryModule`, add `InventoryService` to `providers` and `exports`.

:::muted
Minimum acceptance criteria
:::

- `npm run start:dev` boots with no errors.
- `src/inventory/inventory.module.ts` declares `exports: [InventoryService]`.
- Calling `reserveStock('SKU-1', 3)` twice returns `97` then `94`.

:::muted
Nice to have
:::

- Extract an `InventoryPort` interface to prepare for a later implementation swap.
- Throw `OutOfStockException` when `qty > stock` instead of returning a negative number.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Initialize the Spring Boot project and the inventory package
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** Create the project via Spring Initializr (dependency `spring-boot-starter-web`), base-package `com.example`.
- **Step 2:** Create package `com.example.inventory`, class `@Service InventoryService`.
- **Step 3:** Implement `int reserveStock(String productId, int qty)` using an internal `Map<String,Integer>`, default 100/sku, subtracting `qty` and returning the remaining amount.

:::muted
Minimum acceptance criteria
:::

- `mvn spring-boot:run` boots with no errors.
- `InventoryService` is annotated `@Service` and lives in package `inventory`.
- Calling `reserveStock("SKU-1", 3)` twice returns `97` then `94`.

:::muted
Nice to have
:::

- Extract an `InventoryPort` interface + impl to prepare for a swap.
- Throw a domain exception when out of stock.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Initialize the minimal API and the Inventory namespace
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** `dotnet new web -o OrderInventoryDi` then `cd` into it.
- **Step 2:** Create `Inventory/InventoryService.cs` (namespace `Inventory`).
- **Step 3:** Implement `int ReserveStock(string productId, int qty)` using `Dictionary<string,int>`, default 100/sku, subtracting `qty` and returning the remaining amount.

:::muted
Minimum acceptance criteria
:::

- `dotnet run` runs with no errors.
- `InventoryService` lives in its own namespace.
- Calling `ReserveStock("SKU-1", 3)` twice returns `97` then `94`.

:::muted
Nice to have
:::

- Extract an `IInventory` interface + impl to prepare for a swap.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Initialize the Go module and the inventory package
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** `go mod init order-inventory-di`; `go get github.com/gin-gonic/gin github.com/google/uuid`.
- **Step 2:** Create package `inventory` (file `inventory/inventory.go`) with struct `InventoryService`.
- **Step 3:** Implement `func (s *InventoryService) ReserveStock(productId string, qty int) int` using `map[string]int`, default 100/sku, subtracting `qty` and returning the remaining amount.

:::muted
Minimum acceptance criteria
:::

- `go run .` runs with no errors.
- `InventoryService` + `NewInventoryService()` are exported correctly (capitalized).
- Calling `ReserveStock("SKU-1", 3)` twice returns `97` then `94`.

:::muted
Nice to have
:::

- Define an `Inventory` interface to prepare for a swap + mock tests.
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
OrderModule imports InventoryModule and injects via the constructor
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** Scaffold `order`: `nest g module order`, `nest g controller order`, `nest g service order`.
- **Step 2:** `OrderModule` declares `imports: [InventoryModule]` (do NOT re-register `InventoryService`).
- **Step 3:** `OrderService` has `constructor(private readonly inventoryService: InventoryService) {}`; write `createOrder(productId, qty)` generating `orderId` via `crypto.randomUUID()`, calling `reserveStock`, and returning `{orderId, productId, reservedQty}`.
- **Step 4:** `OrderController` creates `POST /orders` taking `@Body()` and calling `OrderService.createOrder`.

:::muted
Minimum acceptance criteria
:::

- App boots with no DI resolution errors.
- No `new InventoryService(` string left in the repo.
- `OrderModule` uses `imports` (not `providers`) to obtain `InventoryService`.

:::muted
Nice to have
:::

- Add a `CreateOrderDto` + `ValidationPipe` to block `qty <= 0`.
- Explicit `@HttpCode(201)` on `POST /orders`.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
OrderService injects InventoryService via constructor + REST endpoint
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** Create package `com.example.order`, `@Service OrderService` with a constructor taking `InventoryService`.
- **Step 2:** `createOrder(productId, qty)` generates `orderId = UUID.randomUUID().toString()`, calls `reserveStock`, returns a record `{orderId, productId, reservedQty}`.
- **Step 3:** `@RestController` `POST /orders` takes `@RequestBody` and calls `OrderService.createOrder`.

:::muted
Minimum acceptance criteria
:::

- App boots, Spring injects `InventoryService` automatically (no `new`).
- `OrderService` and `InventoryService` live in different packages but are still injectable.

:::muted
Nice to have
:::

- DTO + `@Valid @Positive` blocks invalid qty.
- `@ResponseStatus(HttpStatus.CREATED)`.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Register DI + OrderService injects via constructor + endpoint
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** Create `Order/OrderService.cs` taking `InventoryService` via constructor; `CreateOrder(productId, qty)` generates `Guid.NewGuid().ToString()`, calls `ReserveStock`, returns an anonymous `{orderId, productId, reservedQty}`.
- **Step 2:** In `Program.cs`: `builder.Services.AddSingleton<InventoryService>()` and `AddSingleton<OrderService>()`.
- **Step 3:** `app.MapPost("/orders", (CreateOrder body, OrderService svc) => Results.Created(...))`.

:::muted
Minimum acceptance criteria
:::

- The container injects `InventoryService` into `OrderService` automatically (no `new`).
- The app runs with no resolve errors.

:::muted
Nice to have
:::

- DataAnnotations to block invalid qty.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
order package + wiring in main + gin endpoint
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** Create package `order` with `type OrderService struct{ inv *inventory.InventoryService }` and `func NewOrderService(inv *inventory.InventoryService) *OrderService`.
- **Step 2:** `CreateOrder(productId string, qty int)` generates `uuid.NewString()`, calls `inv.ReserveStock`, returns a struct `{orderId, productId, reservedQty}` (json tags).
- **Step 3:** In `main`: create `inventory`, `svc := order.NewOrderService(inv)`; gin `POST /orders` binds the body and calls `CreateOrder`.

:::muted
Minimum acceptance criteria
:::

- Wiring lives in `main`; the `order` package does NOT create `InventoryService` itself.
- One shared `inventory` instance is reused.

:::muted
Nice to have
:::

- `binding:"required,gt=0"` for qty.
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
Smoke test and write a README with a Code Execution Trace
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** `npm run start:dev`.
- **Step 2:** Send a test call:
  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri "http://localhost:3000/orders" -Method Post -Body (@{ productId = "SKU-001"; qty = 3 } | ConvertTo-Json) -ContentType "application/json"

  # macOS / Linux
  # → Paste cURL into Postman: Import → Raw text
  curl -s -X POST http://localhost:3000/orders -H "Content-Type: application/json" -d '{"productId":"SKU-001","qty":3}'
  ```
- **Step 3:** Paste the real response into the README **Smoke Test** section (no fabrication).
- **Step 4:** Write the **Code Execution Trace** as `OrderController -> OrderService -> InventoryService` with `file:line` for each touch point.

:::muted
Minimum acceptance criteria
:::

- `POST /orders` returns HTTP `201` + a body with `{orderId, productId, reservedQty}`.
- `orderId` matches the UUID v4 regex; `reservedQty === qty`, `productId === input`.
- README has 6 sections: Challenge description, How to run, Architecture/Stack, Smoke Test, Code Execution Trace, Design Decisions.

:::muted
Nice to have
:::

- Add a terminal screenshot + response into the README.
- Measure cold-start with `time npm run start`.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Smoke test and write a README with a Code Execution Trace
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** `mvn spring-boot:run`.
- **Step 2:** Send a test call:
  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri "http://localhost:3000/orders" -Method Post -Body (@{ productId = "SKU-001"; qty = 3 } | ConvertTo-Json) -ContentType "application/json"

  # macOS / Linux
  # → Paste cURL into Postman: Import → Raw text
  curl -s -X POST http://localhost:3000/orders -H "Content-Type: application/json" -d '{"productId":"SKU-001","qty":3}'
  ```
- **Step 3:** Paste the real response into the README **Smoke Test** section.
- **Step 4:** Write the **Code Execution Trace** `OrderController -> OrderService -> InventoryService` with `file:line`.

:::muted
Minimum acceptance criteria
:::

- `POST /orders` returns `201` + `{orderId, productId, reservedQty}`; `orderId` is a UUID v4; `reservedQty === qty`.
- README has 6 sections.

:::muted
Nice to have
:::

- Terminal screenshot; measure boot time.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Smoke test and write a README with a Code Execution Trace
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** `dotnet run`.
- **Step 2:** Send a test call:
  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri "http://localhost:3000/orders" -Method Post -Body (@{ productId = "SKU-001"; qty = 3 } | ConvertTo-Json) -ContentType "application/json"

  # macOS / Linux
  # → Paste cURL into Postman: Import → Raw text
  curl -s -X POST http://localhost:3000/orders -H "Content-Type: application/json" -d '{"productId":"SKU-001","qty":3}'
  ```
- **Step 3:** Paste the real response into the README **Smoke Test** section.
- **Step 4:** Write the **Code Execution Trace** with `file:line`.

:::muted
Minimum acceptance criteria
:::

- `POST /orders` returns `201` + `{orderId, productId, reservedQty}`; `orderId` is a UUID v4; `reservedQty === qty`.
- README has 6 sections.

:::muted
Nice to have
:::

- Terminal screenshot.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Smoke test and write a README with a Code Execution Trace
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Steps to follow
:::

- **Step 1:** `go run .`.
- **Step 2:** Send a test call:
  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri "http://localhost:3000/orders" -Method Post -Body (@{ productId = "SKU-001"; qty = 3 } | ConvertTo-Json) -ContentType "application/json"

  # macOS / Linux
  # → Paste cURL into Postman: Import → Raw text
  curl -s -X POST http://localhost:3000/orders -H "Content-Type: application/json" -d '{"productId":"SKU-001","qty":3}'
  ```
- **Step 3:** Paste the real response into the README **Smoke Test** section.
- **Step 4:** Write the **Code Execution Trace** `main -> order.CreateOrder -> inventory.ReserveStock` with `file:line`.

:::muted
Minimum acceptance criteria
:::

- `POST /orders` returns `201` + `{orderId, productId, reservedQty}`; `orderId` is a UUID v4; `reservedQty === qty`.
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
You understand cross-module DI: one module uses another module's service through the IoC container, without instantiating it itself.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
You understand cross-package DI through the Spring IoC container, without `new` yourself.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
You understand DI through ASP.NET's built-in container, without `new` yourself.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
You understand manual DI in Go: wiring at the composition root, no container.
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
You implement `POST /orders` yourself with the correct input/output contract and can distinguish a valid case from an invalid-input case.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
You implement `POST /orders` yourself with the correct contract.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
You implement `POST /orders` yourself with the correct contract.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
You implement `POST /orders` yourself with the correct contract.
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
Node.js >= 18 + NestJS CLI (`npm i -g @nestjs/cli`).
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
JDK 21 + Maven.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
.NET SDK 8.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Go 1.22+.
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
Understand constructor injection and the difference between `imports` and `providers`.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Understand constructor injection and Spring's component scan.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Understand service lifetime (Singleton) and ASP.NET's DI container.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Understand constructor functions + manual wiring at the composition root.
<!-- @starci/seperator -->
# difficulty
<!-- @starci/seperator -->
easy
<!-- @starci/seperator -->
# score
<!-- @starci/seperator -->
100
<!-- @starci/seperator -->
# verified
<!-- @starci/seperator -->
2026-05-30
<!-- @starci/seperator -->
