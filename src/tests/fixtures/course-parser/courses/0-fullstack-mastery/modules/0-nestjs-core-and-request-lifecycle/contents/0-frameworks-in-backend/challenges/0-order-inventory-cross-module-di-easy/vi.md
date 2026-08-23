# sortIndex
<!-- @starci/seperator -->
1
<!-- @starci/seperator -->
# title
<!-- @starci/seperator -->
Dùng lại service giữa hai vùng qua Dependency Injection
<!-- @starci/seperator -->
# description
<!-- @starci/seperator -->
Dựng hai vùng nghiệp vụ độc lập (order và inventory) và để order dùng lại service của inventory qua dependency injection — không tự khởi tạo. Chọn ngôn ngữ của bạn; mọi ngôn ngữ trả cùng một contract output.
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
Tách hai module độc lập và khai báo ranh giới export/import
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Mục đích
:::

Tổ chức code thành hai vùng nghiệp vụ riêng — `InventoryModule` và `OrderModule` — để thấy framework kiểm soát ranh giới chia sẻ giữa các module.

:::muted
Ràng buộc kỹ thuật
:::

- `InventoryModule` chứa `InventoryService` và khai báo `exports: [InventoryService]`.
- `OrderModule` khai báo `imports: [InventoryModule]`; KHÔNG đăng ký lại `InventoryService` ở `providers` của `OrderModule` (sẽ tạo instance thứ hai).
- Không gộp hai vùng vào cùng một module để né wiring.

:::muted
Gợi ý
:::

Sinh bằng Nest CLI (`nest g module/service`) để giữ đúng convention thư mục; quên `exports` sẽ gây lỗi `Nest can't resolve dependencies` lúc bootstrap.
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
Tách hai package độc lập và để Spring quản bean
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Mục đích
:::

Tổ chức code thành hai package `inventory` và `order` để IoC container của Spring tự khám phá và ghép nối bean xuyên package.

:::muted
Ràng buộc kỹ thuật
:::

- `InventoryService` là `@Service` ở package `inventory`; `OrderService` là `@Service` ở package `order`.
- Cả hai nằm trong scan path của `@SpringBootApplication` (cùng base-package `com.example` trở xuống).
- Không tạo `InventoryService` thủ công ở bất kỳ đâu.

:::muted
Gợi ý
:::

Spring Initializr (spring-boot-starter-web) để tạo project nhanh; bean ngoài base-package phải thêm `@ComponentScan`.
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
Tách hai namespace và đăng ký service vào IoC container
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Mục đích
:::

Tổ chức code thành hai namespace `Inventory` và `Order`, đăng ký service vào container built-in của ASP.NET để thấy framework tự inject.

:::muted
Ràng buộc kỹ thuật
:::

- `InventoryService` và `OrderService` đăng ký ở composition root (`Program.cs`) bằng `AddSingleton`.
- `OrderService` được container resolve, không tự khởi tạo.
- Không hard-code `new` để bỏ qua container.

:::muted
Gợi ý
:::

`dotnet new web` cho minimal API; quên `AddSingleton` sẽ lỗi resolve lúc chạy.
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
Tách hai package độc lập và export qua quy ước Go
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Mục đích
:::

Tổ chức code thành hai package `inventory` và `order`; vì Go không có IoC container, bạn tự ghép nối ở composition root để thấy rõ phần việc framework thường làm thay.

:::muted
Ràng buộc kỹ thuật
:::

- package `inventory` export `InventoryService` (định danh chữ HOA); package `order` import và dùng.
- `OrderService` nhận `*InventoryService` qua **constructor function** `NewOrderService(inv *InventoryService)`.
- Không tạo `InventoryService` bên trong package `order`.

:::muted
Gợi ý
:::

`go mod init`; `go get` gin + `github.com/google/uuid`; wiring tập trung ở `main`.
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
Inject InventoryService và expose POST /orders đúng contract
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Mục đích
:::

Cho `OrderService` dùng lại `InventoryService` qua IoC container và phơi ra một endpoint đặt hàng có contract ổn định.

:::muted
Ràng buộc kỹ thuật
:::

- `OrderService` nhận `InventoryService` qua **constructor injection** — TUYỆT ĐỐI không `new InventoryService()`.
- `InventoryService.reserveStock(productId, qty)` trừ tồn kho (mặc định 100/sku) và trả số đã giữ.
- `POST /orders` nhận `{productId, qty}` (qty là số nguyên dương) → trả `{orderId, productId, reservedQty}`; `orderId` là UUID v4 sinh bằng `crypto.randomUUID()`.

:::muted
Gợi ý
:::

Grep toàn repo đảm bảo không còn chuỗi `new InventoryService(`; dùng DTO + `ValidationPipe` để chặn qty sai (nice-to-have).
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
Inject InventoryService và expose POST /orders đúng contract
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Mục đích
:::

Cho `OrderService` dùng lại `InventoryService` qua constructor injection của Spring và phơi ra endpoint đặt hàng.

:::muted
Ràng buộc kỹ thuật
:::

- `OrderService` nhận `InventoryService` qua **constructor** (Spring auto-wire constructor duy nhất) — KHÔNG `new`.
- `InventoryService.reserveStock(productId, qty)` trừ tồn kho (mặc định 100) và trả số đã giữ.
- `@RestController` `POST /orders` nhận `{productId, qty}` → trả `{orderId, productId, reservedQty}`; `orderId` = `UUID.randomUUID().toString()`.

:::muted
Gợi ý
:::

Dùng record/DTO cho request body; `@Valid` + `@Positive` để chặn qty sai (nice-to-have).
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
Inject InventoryService và expose POST /orders đúng contract
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Mục đích
:::

Cho `OrderService` dùng lại `InventoryService` qua constructor injection của container và phơi ra endpoint đặt hàng.

:::muted
Ràng buộc kỹ thuật
:::

- `OrderService` nhận `InventoryService` qua **constructor** — KHÔNG `new`.
- `InventoryService.ReserveStock(productId, qty)` trừ tồn kho (mặc định 100) và trả số đã giữ.
- `MapPost("/orders")` nhận `{productId, qty}` → trả `{orderId, productId, reservedQty}`; `orderId` = `Guid.NewGuid().ToString()`.

:::muted
Gợi ý
:::

Handler có thể nhận service qua tham số (`(OrderService svc) => ...`) — container tự resolve.
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
Wiring ở main và expose POST /orders đúng contract
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Mục đích
:::

Ghép nối inventory → order ở `main` (composition root) và phơi ra endpoint đặt hàng bằng gin.

:::muted
Ràng buộc kỹ thuật
:::

- Ở `main`: tạo `inventory`, truyền vào `NewOrderService(inv)` — cùng một instance dùng chung.
- `InventoryService.ReserveStock(productId, qty)` trừ tồn kho (mặc định 100) và trả số đã giữ.
- gin `POST /orders` nhận `{productId, qty}` → trả `{orderId, productId, reservedQty}`; `orderId` = `uuid.NewString()`.

:::muted
Gợi ý
:::

Dùng struct + json tag để giữ đúng tên field trong response.
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
Khởi tạo project và InventoryModule
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** `nest new order-inventory-di` rồi `cd` vào thư mục.
- **Bước 2:** Sinh module + service: `nest g module inventory` và `nest g service inventory`.
- **Bước 3:** Trong `InventoryService`, cài `reserveStock(productId: string, qty: number): number` dùng `Map<string, number>` nội bộ, mặc định tồn 100/sku, mỗi lần trừ `qty` và trả số còn giữ.
- **Bước 4:** Trong `InventoryModule`, thêm `InventoryService` vào `providers` và `exports`.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- `npm run start:dev` boot không lỗi.
- `src/inventory/inventory.module.ts` khai báo `exports: [InventoryService]`.
- `reserveStock('SKU-1', 3)` gọi hai lần trả `97` rồi `94`.

:::muted
Nice to have
:::

- Tách interface `InventoryPort` để chuẩn bị swap implementation về sau.
- Ném `OutOfStockException` khi `qty > tồn` thay vì trả số âm.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Khởi tạo project Spring Boot và package inventory
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** Tạo project qua Spring Initializr (dependency `spring-boot-starter-web`), base-package `com.example`.
- **Bước 2:** Tạo package `com.example.inventory`, class `@Service InventoryService`.
- **Bước 3:** Cài `int reserveStock(String productId, int qty)` dùng `Map<String,Integer>` nội bộ, mặc định 100/sku, trừ `qty` và trả số còn giữ.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- `mvn spring-boot:run` boot không lỗi.
- `InventoryService` được annotate `@Service`, nằm package `inventory`.
- `reserveStock("SKU-1", 3)` hai lần trả `97` rồi `94`.

:::muted
Nice to have
:::

- Tách interface `InventoryPort` + impl để chuẩn bị swap.
- Ném exception domain khi hết tồn.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Khởi tạo minimal API và namespace Inventory
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** `dotnet new web -o OrderInventoryDi` rồi `cd` vào.
- **Bước 2:** Tạo `Inventory/InventoryService.cs` (namespace `Inventory`).
- **Bước 3:** Cài `int ReserveStock(string productId, int qty)` dùng `Dictionary<string,int>`, mặc định 100/sku, trừ `qty` và trả số còn giữ.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- `dotnet run` chạy không lỗi.
- `InventoryService` ở namespace riêng.
- `ReserveStock("SKU-1", 3)` hai lần trả `97` rồi `94`.

:::muted
Nice to have
:::

- Tách interface `IInventory` + impl để chuẩn bị swap.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Khởi tạo module Go và package inventory
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** `go mod init order-inventory-di`; `go get github.com/gin-gonic/gin github.com/google/uuid`.
- **Bước 2:** Tạo package `inventory` (file `inventory/inventory.go`) với struct `InventoryService`.
- **Bước 3:** Cài `func (s *InventoryService) ReserveStock(productId string, qty int) int` dùng `map[string]int`, mặc định 100/sku, trừ `qty` và trả số còn giữ.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- `go run .` chạy không lỗi.
- `InventoryService` + `NewInventoryService()` export đúng (chữ HOA).
- Gọi `ReserveStock("SKU-1", 3)` hai lần trả `97` rồi `94`.

:::muted
Nice to have
:::

- Định nghĩa interface `Inventory` để chuẩn bị swap + mock test.
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
OrderModule import InventoryModule và inject qua constructor
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** Sinh `order`: `nest g module order`, `nest g controller order`, `nest g service order`.
- **Bước 2:** `OrderModule` khai báo `imports: [InventoryModule]` (KHÔNG đăng ký lại `InventoryService`).
- **Bước 3:** `OrderService` có `constructor(private readonly inventoryService: InventoryService) {}`; viết `createOrder(productId, qty)` sinh `orderId` bằng `crypto.randomUUID()`, gọi `reserveStock` và trả `{orderId, productId, reservedQty}`.
- **Bước 4:** `OrderController` tạo `POST /orders` nhận `@Body()` gọi `OrderService.createOrder`.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- App boot không lỗi DI resolution.
- Toàn repo không còn chuỗi `new InventoryService(`.
- `OrderModule` dùng `imports` (không phải `providers`) để lấy `InventoryService`.

:::muted
Nice to have
:::

- Thêm `CreateOrderDto` + `ValidationPipe` để chặn `qty <= 0`.
- `@HttpCode(201)` explicit cho `POST /orders`.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
OrderService inject InventoryService qua constructor + REST endpoint
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** Tạo package `com.example.order`, `@Service OrderService` có constructor nhận `InventoryService`.
- **Bước 2:** `createOrder(productId, qty)` sinh `orderId = UUID.randomUUID().toString()`, gọi `reserveStock`, trả record `{orderId, productId, reservedQty}`.
- **Bước 3:** `@RestController` `POST /orders` nhận `@RequestBody` gọi `OrderService.createOrder`.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- App boot, Spring tự inject `InventoryService` (không `new`).
- `OrderService` và `InventoryService` ở hai package khác nhau, vẫn inject được.

:::muted
Nice to have
:::

- DTO + `@Valid @Positive` chặn qty sai.
- `@ResponseStatus(HttpStatus.CREATED)`.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Đăng ký DI + OrderService inject qua constructor + endpoint
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** Tạo `Order/OrderService.cs` nhận `InventoryService` qua constructor; `CreateOrder(productId, qty)` sinh `Guid.NewGuid().ToString()`, gọi `ReserveStock`, trả anonymous `{orderId, productId, reservedQty}`.
- **Bước 2:** Trong `Program.cs`: `builder.Services.AddSingleton<InventoryService>()` và `AddSingleton<OrderService>()`.
- **Bước 3:** `app.MapPost("/orders", (CreateOrder body, OrderService svc) => Results.Created(...))`.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- Container tự inject `InventoryService` vào `OrderService` (không `new`).
- App chạy không lỗi resolve.

:::muted
Nice to have
:::

- DataAnnotations chặn qty sai.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
package order + wiring ở main + endpoint gin
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** Tạo package `order` với `type OrderService struct{ inv *inventory.InventoryService }` và `func NewOrderService(inv *inventory.InventoryService) *OrderService`.
- **Bước 2:** `CreateOrder(productId string, qty int)` sinh `uuid.NewString()`, gọi `inv.ReserveStock`, trả struct `{orderId, productId, reservedQty}` (json tag).
- **Bước 3:** Ở `main`: tạo `inventory`, `svc := order.NewOrderService(inv)`; gin `POST /orders` bind body gọi `CreateOrder`.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- Wiring nằm ở `main`; package `order` KHÔNG tự tạo `InventoryService`.
- Cùng một instance `inventory` dùng chung.

:::muted
Nice to have
:::

- `binding:"required,gt=0"` cho qty.
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
Smoke test và viết README có Code Execution Trace
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** `npm run start:dev`.
- **Bước 2:** Gọi thử:
  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri "http://localhost:3000/orders" -Method Post -Body (@{ productId = "SKU-001"; qty = 3 } | ConvertTo-Json) -ContentType "application/json"

  # macOS / Linux
  # → Dán cURL vào Postman: Import → Raw text
  curl -s -X POST http://localhost:3000/orders -H "Content-Type: application/json" -d '{"productId":"SKU-001","qty":3}'
  ```
- **Bước 3:** Paste response thật vào README mục **Smoke Test** (không bịa).
- **Bước 4:** Viết **Code Execution Trace** dạng `OrderController -> OrderService -> InventoryService` với mỗi điểm chạm `file:line`.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- `POST /orders` trả HTTP `201` + body đủ `{orderId, productId, reservedQty}`.
- `orderId` khớp regex UUID v4; `reservedQty === qty`, `productId === input`.
- README có 6 mục: Challenge description, How to run, Architecture/Stack, Smoke Test, Code Execution Trace, Design Decisions.

:::muted
Nice to have
:::

- Thêm screenshot terminal + response vào README.
- Đo cold-start bằng `time npm run start`.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Smoke test và viết README có Code Execution Trace
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** `mvn spring-boot:run`.
- **Bước 2:** Gọi thử:
  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri "http://localhost:3000/orders" -Method Post -Body (@{ productId = "SKU-001"; qty = 3 } | ConvertTo-Json) -ContentType "application/json"

  # macOS / Linux
  # → Dán cURL vào Postman: Import → Raw text
  curl -s -X POST http://localhost:3000/orders -H "Content-Type: application/json" -d '{"productId":"SKU-001","qty":3}'
  ```
- **Bước 3:** Paste response thật vào README **Smoke Test**.
- **Bước 4:** Viết **Code Execution Trace** `OrderController -> OrderService -> InventoryService` với `file:line`.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- `POST /orders` trả `201` + `{orderId, productId, reservedQty}`; `orderId` là UUID v4; `reservedQty === qty`.
- README đủ 6 mục.

:::muted
Nice to have
:::

- Screenshot terminal; đo thời gian khởi động.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Smoke test và viết README có Code Execution Trace
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** `dotnet run`.
- **Bước 2:** Gọi thử:
  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri "http://localhost:3000/orders" -Method Post -Body (@{ productId = "SKU-001"; qty = 3 } | ConvertTo-Json) -ContentType "application/json"

  # macOS / Linux
  # → Dán cURL vào Postman: Import → Raw text
  curl -s -X POST http://localhost:3000/orders -H "Content-Type: application/json" -d '{"productId":"SKU-001","qty":3}'
  ```
- **Bước 3:** Paste response thật vào README **Smoke Test**.
- **Bước 4:** Viết **Code Execution Trace** với `file:line`.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- `POST /orders` trả `201` + `{orderId, productId, reservedQty}`; `orderId` UUID v4; `reservedQty === qty`.
- README đủ 6 mục.

:::muted
Nice to have
:::

- Screenshot terminal.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### title
<!-- @starci/seperator -->
Smoke test và viết README có Code Execution Trace
<!-- @starci/seperator -->
##### body
<!-- @starci/seperator -->
:::muted
Các bước thực hiện
:::

- **Bước 1:** `go run .`.
- **Bước 2:** Gọi thử:
  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri "http://localhost:3000/orders" -Method Post -Body (@{ productId = "SKU-001"; qty = 3 } | ConvertTo-Json) -ContentType "application/json"

  # macOS / Linux
  # → Dán cURL vào Postman: Import → Raw text
  curl -s -X POST http://localhost:3000/orders -H "Content-Type: application/json" -d '{"productId":"SKU-001","qty":3}'
  ```
- **Bước 3:** Paste response thật vào README **Smoke Test**.
- **Bước 4:** Viết **Code Execution Trace** `main -> order.CreateOrder -> inventory.ReserveStock` với `file:line`.

:::muted
Yêu cầu tối thiểu cần đạt
:::

- `POST /orders` trả `201` + `{orderId, productId, reservedQty}`; `orderId` UUID v4; `reservedQty === qty`.
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
Bạn hiểu cross-module DI: một module dùng service module khác qua IoC container, không tự khởi tạo.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Bạn hiểu DI xuyên package qua Spring IoC container, không tự `new`.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Bạn hiểu DI qua built-in container của ASP.NET, không tự `new`.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Bạn hiểu DI thủ công ở Go: ghép nối ở composition root, không container.
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
Bạn tự triển khai `POST /orders` đúng contract input/output và phân biệt được case hợp lệ với case input lỗi.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Bạn tự triển khai `POST /orders` đúng contract.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Bạn tự triển khai `POST /orders` đúng contract.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Bạn tự triển khai `POST /orders` đúng contract.
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
Hiểu constructor injection và phân biệt `imports` vs `providers`.
<!-- @starci/seperator -->
#### 1
##### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Hiểu constructor injection và component scan của Spring.
<!-- @starci/seperator -->
#### 2
##### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Hiểu service lifetime (Singleton) và DI container của ASP.NET.
<!-- @starci/seperator -->
#### 3
##### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
##### text
<!-- @starci/seperator -->
Hiểu constructor function + wiring thủ công ở composition root.
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
