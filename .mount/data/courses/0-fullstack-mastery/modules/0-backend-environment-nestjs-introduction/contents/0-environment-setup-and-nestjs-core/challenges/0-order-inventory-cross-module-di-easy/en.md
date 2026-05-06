# title
Implement cross-module DI with OrderModule and InventoryModule

# description
Bootstrap a NestJS project and prove Dependency Injection works across modules using an order-inventory context. OrderService injects InventoryService from another module to reserve stock; no direct new or global singleton is allowed.

# requirements
## 1
### purpose
Build `InventoryModule` (with `InventoryService`) and `OrderModule` (with `OrderController` + `OrderService`).
### technicalConstraints
Keep the two modules separated by responsibility; do not collapse everything into a single module.
### proTipsHints
Generate module/service/controller using Nest CLI to keep folder conventions consistent.

## 2
### purpose
Allow `OrderModule` to consume `InventoryService` from the inventory module.
### technicalConstraints
`InventoryModule` must `export` `InventoryService`; `OrderModule` must `import` `InventoryModule`.
### proTipsHints
Double-check `providers`, `exports`, and `imports` to avoid DI resolution errors at startup.

## 3
### purpose
Inject `InventoryService` into `OrderService` for order flow handling.
### technicalConstraints
Use constructor injection from NestJS DI container; strictly do not instantiate `InventoryService` with `new`.
### proTipsHints
Inject `InventoryService` via constructor (for example: `constructor(private readonly inventoryService: InventoryService) {}`), then search across the repository to ensure there is no `new InventoryService()` usage left.

## 4
### purpose
Define the input contract for create-order endpoint.
### technicalConstraints
Endpoint `POST /orders` must accept body `{productId, qty}`; `qty` must be a positive integer.
### proTipsHints
Use DTO + validation to reject invalid input before business logic executes.

## 5
### purpose
Execute reserve stock flow and return create-order payload.
### technicalConstraints
The endpoint must call `InventoryService.reserveStock(productId, qty)` and return `{orderId, productId, reservedQty}`; `orderId` must be UUID v4 generated inside `OrderService`.
### proTipsHints
Generate `orderId` via `crypto.randomUUID()` and keep the response shape exactly matching the contract.

## 6
### purpose
Ensure the app boots successfully after cross-module DI setup.
### technicalConstraints
No unresolved dependency errors when running `npm run start:dev`.
### proTipsHints
If DI fails, inspect `imports` in `OrderModule` and `exports` in `InventoryModule` first.

### forbidden
- Manually instantiating services (for example `new InventoryService()`) outside NestJS DI container -> **0 DI prompt**.
- Collapsing `Order` and `Inventory` into a single module to bypass cross-module wiring -> **0 module-boundary prompt**.
- Returning an incorrect `POST /orders` contract (`orderId`, `productId`, `reservedQty`) -> **0 API-contract prompt**.
- Generating `orderId` in a non-UUID-v4 format -> **0 response-correctness prompt**.

# outputs
## 0
### title
Output 1 - Understand cross-module DI flow
### text
You clearly understand how `OrderModule` consumes `InventoryService` from `InventoryModule` through NestJS DI container, including why proper export/import wiring matters.

## 1
### title
Output 2 - Implement API contract correctly
### text
You can implement `POST /orders` with the correct request/response contract and verify both valid and invalid-input behavior using `curl`.

## 2
### title
Output 3 - Self-check DI implementation quality
### text
You can self-audit whether your DI implementation is production-safe: no manual `new` service instantiation, correct module wiring, and no DI-resolution startup errors.

# prerequisites
## 0
### text
Node.js >= 18
## 1
### text
NestJS CLI (`npm i -g @nestjs/cli`)
## 2
### text
Understanding of ***Module***, ***Provider***, ***Controller*** in ***NestJS***
## 3
### text
Understanding of ***Constructor Injection***

# steps

## 0
### title
Bootstrap a new project using NestJS CLI
### body
### 1. Steps to follow
- **Step 1:** Create a new project (DO NOT clone the lesson demo):
  ```bash
  nest new order-inventory-cross-module-di
  ```
- **Step 2:** Enter the folder and verify the app runs:
  ```bash
  cd order-inventory-cross-module-di
  npm run start:dev
  ```
- **Step 3:** Remove the default `AppController` / `AppService` (unused for this challenge).

### 2. Minimum acceptance criteria
- Project is created via `nest new`; folder name is exactly `order-inventory-cross-module-di`.
- `npm run start:dev` runs without errors; terminal shows `Nest application successfully started`.
- App listens on `http://localhost:3000` (verified by `curl` or browser, not a framework 404).
- Default `app.controller.ts` / `app.service.ts` no longer exist in `src/`.

### 3. Nice to have
- In `main.ts`, read the port from `process.env.PORT` instead of hard-coding `3000`.
- Call `app.setGlobalPrefix('api/v1')` so every route is exposed under `/api/v1`.
- Call `app.enableCors()` to be ready for cross-origin frontend calls.

## 1
### title
Create InventoryModule and InventoryService
### body
### 1. Steps to follow
- **Step 1:** Scaffold module and service:
  ```bash
  nest g module inventory
  nest g service inventory
  ```
- **Step 2:** In `InventoryService`, implement `reserveStock(productId: string, qty: number): number`. Use an internal `Map<string, number>` to simulate stock with default 100 per `productId`; each call decreases by `qty` and returns the reserved amount.
- **Step 3:** In `InventoryModule`, add `InventoryService` to both `providers` and `exports` (the `exports` array is mandatory so other modules can use it).

### 2. Minimum acceptance criteria
- Files `src/inventory/inventory.module.ts` and `src/inventory/inventory.service.ts` exist.
- `InventoryService` has exactly the method `reserveStock(productId: string, qty: number): number` returning the reserved quantity.
- `InventoryModule` declares both `providers: [InventoryService]` and `exports: [InventoryService]`.
- Calling `reserveStock('SKU-001', 3)` twice in a row decreases the stock correctly (100 -> 97 -> 94).

### 3. Nice to have
- Extract an `InventoryPort` interface to prepare for the HARD challenge (swap via `useClass` / `useValue`).
- Throw an `OutOfStockException` when `qty > stock` instead of returning a negative number.
- Log each `reserveStock` call with `productId`, `qty`, `remaining` using the Nest `Logger`.

## 2
### title
Create OrderModule injecting InventoryService via constructor
### body
### 1. Steps to follow
- **Step 1:** Scaffold module, controller, service for `order`:
  ```bash
  nest g module order
  nest g controller order
  nest g service order
  ```
- **Step 2:** In `OrderModule`, `import` `InventoryModule` (not `InventoryService` directly).
- **Step 3:** In `OrderService`, declare `constructor(private readonly inventoryService: InventoryService) {}`; implement `createOrder(productId: string, qty: number)` that generates `orderId` via `crypto.randomUUID()`, calls `this.inventoryService.reserveStock(productId, qty)`, and returns `{orderId, productId, reservedQty}`.
- **Step 4:** In `OrderController`, define `POST /orders` accepting the body via `@Body()` and calling `OrderService.createOrder`.

### 2. Minimum acceptance criteria
- `OrderModule` has `imports: [InventoryModule]` (it does NOT put `InventoryService` directly into its own `providers`).
- `OrderService` has `constructor(private readonly inventoryService: InventoryService)`; no `new InventoryService(` appears anywhere in the repo.
- `OrderService.createOrder` generates `orderId` via `crypto.randomUUID()` and calls `inventoryService.reserveStock(productId, qty)`.
- The app builds and boots without any DI-resolution error.

### 3. Nice to have
- Create a `CreateOrderDto` + enable `ValidationPipe` even though validation is not yet required.
- Add an explicit `@HttpCode(201)` to the `POST /orders` handler instead of relying on the framework default.
- Add Swagger (`@nestjs/swagger`) to auto-generate an `/api` docs page.

## 3
### title
Run real tests and record code execution trace
### body
### 1. Steps to follow
- **Step 1:** Run `npm run start:dev`, then call `POST /orders` to create a new order.
  ```bash
  curl -X POST http://localhost:3000/orders \
    -H "Content-Type: application/json" \
    -d '{"productId":"SKU-001","qty":3}'
  ```
  Expected: HTTP `201` with `orderId`, `productId`, and `reservedQty` in response.
- **Step 2:** Record the real response in the README (do not fabricate).
- **Step 3:** Write a README section **Code Execution Trace** using this format:
  ```
  src/order/order.controller.ts:Lx -> OrderController.create()
  src/order/order.service.ts:Lx -> OrderService.createOrder()
  src/inventory/inventory.service.ts:Lx -> InventoryService.reserveStock()
  ```

### 2. Minimum acceptance criteria
- `curl -X POST http://localhost:3000/orders -d '{"productId":"SKU-001","qty":3}'` returns HTTP 201 with a JSON body containing the 3 fields `orderId`, `productId`, `reservedQty`.
- `orderId` is a valid UUID v4 (matches `^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`).
- `productId` in the response equals the input; `reservedQty` equals the input `qty`.
- README has a **Code Execution Trace** section listing all 3 touchpoints with real `file:line` values (no placeholders).

### 3. Nice to have
- Add a terminal screenshot/GIF plus the JSON response to the README.
- Write a small logger middleware printing `method url status duration` for every request.
- Measure cold-start time with `time npm run start` and note it in the README.

# references
## 0
### alias
NestJS Modules - Shared Modules
### url
https://docs.nestjs.com/modules#shared-modules
## 1
### alias
NestJS Providers - Dependency Injection
### url
https://docs.nestjs.com/providers#dependency-injection

# submissions
## 0
### type
githubUrl
### title
GitHub Repository Link
### description
Submit the GitHub repository link containing your source code. The repo must include a `README.md` with: a short description, how to run (`npm install && npm run start:dev`), a real request/response example, and a **Code Execution Trace** section in `file:line -> method` format.
### score
20
### prompts
#### 0
##### title
Correct module structure and cross-module DI
##### score
8
##### promptText
Grading rubric (max 8):

- Criterion A (2 points): The repo has two separate modules `InventoryModule` and `OrderModule`.
- Criterion B (2 points): `InventoryModule` correctly declares `exports: [InventoryService]`.
- Criterion C (2 points): `OrderModule` correctly declares `imports: [InventoryModule]`.
- Criterion D (2 points): `OrderService` injects `InventoryService` through constructor injection and the source has no `new InventoryService()`.

Scoring rule: each criterion receives points only when fully met; missing/incorrect criteria receive 0 points.
#### 1
##### title
POST /orders endpoint runs and returns the correct shape
##### score
7
##### promptText
Grading rubric (max 7):

- Criterion A (2 points): The project runs successfully with `npm install && npm run start:dev`.
- Criterion B (2 points): `POST /orders` accepts payload `{"productId":"SKU-001","qty":3}` and returns a successful HTTP response.
- Criterion C (1.5 points): The response includes `orderId` in valid UUID v4 format.
- Criterion D (1.5 points): The response includes `productId` matching input and `reservedQty` equal to `qty`.

Scoring rule: each criterion receives points only when fully met; criteria not met receive 0 points.
#### 2
##### title
README has 4 sections including file:line trace
##### score
5
##### promptText
Grading rubric (max 5, 5 points is perfect completion):

- Criterion A (1 point): README includes a short challenge description.
- Criterion B (1 point): README includes clear run instructions.
- Criterion C (1 point): README includes a real request/response example.
- Criterion D (2 points): README includes **Code Execution Trace** with `OrderController -> OrderService -> InventoryService` and `file:line` at each touchpoint.

Scoring rule: each criterion receives points only when fully met; missing criteria receive 0 points.

# difficulty
easy

# score
20
