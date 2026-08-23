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
A public repo with the code (in the language you chose) + a 6-section README with real Smoke Test output.
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
**Happy path matches the contract.** `POST /orders` with body `{"productId":"SKU-001","qty":3}` must return HTTP `201` and JSON with the exact shape `{orderId, productId, reservedQty}` — no extra, no missing fields. `orderId` matches the UUID v4 regex `^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`. Wrong HTTP code, wrong shape, or an `orderId` that is not UUID v4 → FAIL.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Happy path matches the contract.** `POST /orders` with body `{"productId":"SKU-001","qty":3}` must return HTTP `201` and JSON with the exact shape `{orderId, productId, reservedQty}` — no extra, no missing fields. `orderId` matches the UUID v4 regex `^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`. Wrong HTTP code, wrong shape, or an `orderId` that is not UUID v4 → FAIL.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Happy path matches the contract.** `POST /orders` with body `{"productId":"SKU-001","qty":3}` must return HTTP `201` and JSON with the exact shape `{orderId, productId, reservedQty}` — no extra, no missing fields. `orderId` matches the UUID v4 regex `^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`. Wrong HTTP code, wrong shape, or an `orderId` that is not UUID v4 → FAIL.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Happy path matches the contract.** `POST /orders` with body `{"productId":"SKU-001","qty":3}` must return HTTP `201` and JSON with the exact shape `{orderId, productId, reservedQty}` — no extra, no missing fields. `orderId` matches the UUID v4 regex `^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`. Wrong HTTP code, wrong shape, or an `orderId` that is not UUID v4 → FAIL.
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
**Correct business values + state durable across requests.** `productId` in the response equals the input exactly; `reservedQty` equals the sent `qty` exactly. Call `POST /orders` twice in a row with the same `productId`, and `reservedQty`/stock must reflect cumulative deduction (e.g. qty=3 → reserved 97 then 94) — proving the service holds state and does not reset per request.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Correct business values + state durable across requests.** `productId` in the response equals the input exactly; `reservedQty` equals the sent `qty` exactly. Call `POST /orders` twice in a row with the same `productId`, and `reservedQty`/stock must reflect cumulative deduction (e.g. qty=3 → reserved 97 then 94) — proving the service holds state and does not reset per request.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Correct business values + state durable across requests.** `productId` in the response equals the input exactly; `reservedQty` equals the sent `qty` exactly. Call `POST /orders` twice in a row with the same `productId`, and `reservedQty`/stock must reflect cumulative deduction (e.g. qty=3 → reserved 97 then 94) — proving the service holds state and does not reset per request.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Correct business values + state durable across requests.** `productId` in the response equals the input exactly; `reservedQty` equals the sent `qty` exactly. Call `POST /orders` twice in a row with the same `productId`, and `reservedQty`/stock must reflect cumulative deduction (e.g. qty=3 → reserved 97 then 94) — proving the service holds state and does not reset per request.
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
**Invalid input is rejected (proof validation runs before the logic).** `POST /orders` with `qty <= 0` or a non-integer `qty` (e.g. `"abc"`) must return HTTP `4xx` and must NOT create an order (no `orderId` generated, no stock deducted). If a bad request still returns 201 / still creates an order → FAIL.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Invalid input is rejected (proof validation runs before the logic).** `POST /orders` with `qty <= 0` or a non-integer `qty` (e.g. `"abc"`) must return HTTP `4xx` and must NOT create an order (no `orderId` generated, no stock deducted). If a bad request still returns 201 / still creates an order → FAIL.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Invalid input is rejected (proof validation runs before the logic).** `POST /orders` with `qty <= 0` or a non-integer `qty` (e.g. `"abc"`) must return HTTP `4xx` and must NOT create an order (no `orderId` generated, no stock deducted). If a bad request still returns 201 / still creates an order → FAIL.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Invalid input is rejected (proof validation runs before the logic).** `POST /orders` with `qty <= 0` or a non-integer `qty` (e.g. `"abc"`) must return HTTP `4xx` and must NOT create an order (no `orderId` generated, no stock deducted). If a bad request still returns 201 / still creates an order → FAIL.
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
**Cross-module DI by the correct mechanism (verified by reading the code).** `InventoryModule` declares `exports: [InventoryService]`; `OrderModule` `imports: [InventoryModule]` and does NOT re-register `InventoryService` in its own `providers`; `OrderService` receives `InventoryService` via the constructor. Grep the whole repo: NO `new InventoryService(` string remains. If the service is self-instantiated, or the two areas are merged into one module to dodge the wiring → FAIL (critical → zero for the whole challenge).
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Cross-package DI by the correct mechanism (verified by reading the code).** `InventoryService` and `OrderService` are `@Service` in two different packages, both within the scan path of `@SpringBootApplication`; `OrderService` receives `InventoryService` via the constructor (Spring auto-wires it). Grep: NO `new InventoryService(` remains. If you `new` it yourself, or place a service outside the scan path and then instantiate it manually → FAIL (critical → zero for the whole challenge).
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**DI through the container by the correct mechanism (verified by reading the code).** Both `InventoryService` and `OrderService` are registered with `AddSingleton` at the composition root (`Program.cs`); `OrderService` receives `InventoryService` via the constructor resolved by the container. Grep: NO `new InventoryService(` remains. If you `new` it yourself, or forget to register it and then instantiate it manually → FAIL (critical → zero for the whole challenge).
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Manual DI by the correct mechanism (verified by reading the code).** The `order` package defines `NewOrderService(inv *inventory.InventoryService)` and receives its dependency via a parameter; creating `inventory` and passing it into `order` happens in `main` (the composition root). The `order` package does NOT create `InventoryService` itself (no `&inventory.InventoryService{}` or `inventory.NewInventoryService()` inside order). Any violation → FAIL (critical → zero for the whole challenge).
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
**Shared singleton (proof no copy is made).** Stock deducting cumulatively across multiple `POST /orders` calls proves `OrderService` uses exactly ONE `InventoryService` instance created by the container, not a private copy. If each request has independent state (stock resets) → FAIL.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Shared singleton bean (proof no copy is made).** Stock deducting cumulatively across multiple `POST /orders` calls proves you use exactly ONE `InventoryService` bean (default singleton scope), not a private copy. If stock resets per request → FAIL.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Shared singleton (proof no copy is made).** Stock deducting cumulatively across multiple `POST /orders` calls proves you use exactly ONE `InventoryService` instance (registered as Singleton), not a private copy. If stock resets per request → FAIL.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**One shared instance (proof no copy is made).** Stock deducting cumulatively across multiple `POST /orders` calls proves the same single `*InventoryService` pointer is shared (created once in `main`), not created fresh per request. If stock resets per request → FAIL.
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
**Evidence & documentation.** README has all 6 sections (Challenge description, How to run, Architecture/Stack, Smoke Test, Code Execution Trace, Design Decisions). The **Code Execution Trace** has ≥3 touch points in the form `file:line -> method()` following the chain `OrderController → OrderService → InventoryService`. The **Smoke Test** pastes the REAL request/response from the terminal. Fabricated output → zero for the whole challenge.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Evidence & documentation.** README has all 6 sections. The **Code Execution Trace** has ≥3 touch points `file:line -> method()` following the chain `OrderController → OrderService → InventoryService`. The **Smoke Test** pastes the REAL request/response. Fabricated output → zero for the whole challenge.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Evidence & documentation.** README has all 6 sections. The **Code Execution Trace** has ≥3 touch points `file:line -> method()` following the chain endpoint → `OrderService` → `InventoryService`. The **Smoke Test** pastes the REAL request/response. Fabricated output → zero for the whole challenge.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
**Evidence & documentation.** README has all 6 sections. The **Code Execution Trace** has ≥3 touch points `file:line -> method()` following the chain `main → order.CreateOrder → inventory.ReserveStock`. The **Smoke Test** pastes the REAL request/response. Fabricated output → zero for the whole challenge.
<!-- @starci/seperator -->
### score
<!-- @starci/seperator -->
15
<!-- @starci/seperator -->
### critical
<!-- @starci/seperator -->
false
<!-- @starci/seperator -->
