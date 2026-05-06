# title
Triển khai cross-module DI với OrderModule và InventoryModule

# description
Khởi tạo project NestJS và chứng minh Dependency Injection hoạt động xuyên module trong ngữ cảnh đặt hàng - tồn kho. OrderService inject InventoryService từ module khác để đặt giữ hàng, không được tự new hay gọi qua biến global.

# requirements
## 1
### purpose
Xây dựng `InventoryModule` (gồm `InventoryService`) và `OrderModule` (gồm `OrderController` + `OrderService`).
### technicalConstraints
Phải tách đúng 2 module độc lập theo trách nhiệm; không gộp chung vào một module duy nhất.
### proTipsHints
Sinh module/service/controller bằng Nest CLI để giữ đúng convention thư mục.

## 2
### purpose
Cho phép `OrderModule` sử dụng được `InventoryService` từ module inventory.
### technicalConstraints
`InventoryModule` phải `export` `InventoryService`; `OrderModule` phải `import` `InventoryModule`.
### proTipsHints
Kiểm tra kỹ `providers`, `exports`, `imports` để tránh lỗi DI resolution khi boot app.

## 3
### purpose
Inject `InventoryService` vào `OrderService` để xử lý logic đặt hàng.
### technicalConstraints
Phải sử dụng constructor injection từ DI container của NestJS; tuyệt đối không tự khởi tạo `InventoryService` bằng `new`.
### proTipsHints
Hãy inject `InventoryService` qua constructor (ví dụ: `constructor(private readonly inventoryService: InventoryService) {}`), sau đó tìm toàn bộ repo để đảm bảo không còn chỗ nào dùng `new InventoryService()`.

## 4
### purpose
Định nghĩa contract đầu vào của endpoint tạo đơn hàng.
### technicalConstraints
Endpoint `POST /orders` phải nhận body `{productId, qty}`; `qty` bắt buộc là số nguyên dương.
### proTipsHints
Dùng DTO + validation để chặn input sai trước khi vào business logic.

## 5
### purpose
Thực thi luồng reserve stock và trả kết quả tạo đơn.
### technicalConstraints
Endpoint phải gọi `InventoryService.reserveStock(productId, qty)` và trả `{orderId, productId, reservedQty}`; `orderId` phải là UUID v4 sinh trong `OrderService`.
### proTipsHints
Sinh `orderId` bằng `crypto.randomUUID()` và giữ response shape đúng theo contract.

## 6
### purpose
Đảm bảo ứng dụng boot thành công sau khi tách module DI.
### technicalConstraints
Không để phát sinh lỗi unresolved dependency khi chạy `npm run start:dev`.
### proTipsHints
Nếu gặp lỗi DI, kiểm tra thứ tự `imports` trong `OrderModule` và `exports` trong `InventoryModule`.

### forbidden
- Dùng `new InventoryService()` hoặc tự khởi tạo service thủ công ngoài DI container -> **0 prompt DI**.
- Gộp `Order` và `Inventory` vào cùng một module để né cross-module wiring -> **0 prompt module boundaries**.
- Trả sai contract `POST /orders` (`orderId`, `productId`, `reservedQty`) -> **0 prompt API contract**.
- Không dùng UUID v4 cho `orderId` -> **0 prompt response correctness**.

# outputs
## 0
### title
Output 1 - Hiểu luồng DI xuyên module
### text
Bạn hiểu rõ cách `OrderModule` dùng `InventoryService` từ `InventoryModule` thông qua DI container và lý do phải export/import đúng module.

## 1
### title
Output 2 - Triển khai API đúng contract
### text
Bạn tự triển khai được `POST /orders` đúng input/output contract, đồng thời phân biệt được case hợp lệ và case input lỗi khi kiểm thử bằng `curl`.

## 2
### title
Output 3 - Tự kiểm tra chất lượng DI implementation
### text
Bạn tự đánh giá được implementation DI có đạt chuẩn hay chưa (không `new` service thủ công, module wiring đúng, app boot không lỗi DI resolution).

# prerequisites
## 0
### text
Node.js >= 18
## 1
### text
NestJS CLI (`npm i -g @nestjs/cli`)
## 2
### text
Hiểu ***Module***, ***Provider***, ***Controller*** của ***NestJS***
## 3
### text
Hiểu ***Constructor Injection***

# steps

## 0
### title
Khởi tạo project mới bằng NestJS CLI
### body
### 1. Các bước thực hiện
- **Bước 1:** Chạy lệnh tạo project mới (KHÔNG clone demo của bài học):
  ```bash
  nest new order-inventory-cross-module-di
  ```
- **Bước 2:** Vào thư mục và verify app chạy được:
  ```bash
  cd order-inventory-cross-module-di
  npm run start:dev
  ```
- **Bước 3:** Xoá `AppController` / `AppService` mặc định (không cần cho bài).

### 2. Yêu cầu tối thiểu cần đạt
- Project được tạo bằng `nest new`, folder tên đúng `order-inventory-cross-module-di`.
- Chạy `npm run start:dev` không lỗi, terminal hiển thị log `Nest application successfully started`.
- App lắng nghe được trên `http://localhost:3000` (kiểm bằng `curl` hoặc browser không 404 framework).
- Không còn file `app.controller.ts` / `app.service.ts` mặc định trong `src/`.

### 3. Nice to have
- Trong `main.ts`, lấy port từ `process.env.PORT` thay vì hard-code `3000`.
- Gọi `app.setGlobalPrefix('api/v1')` để toàn bộ route có prefix `/api/v1`.
- Gọi `app.enableCors()` để sẵn sàng cho frontend gọi API cross-origin.

## 1
### title
Tạo InventoryModule và InventoryService
### body
### 1. Các bước thực hiện
- **Bước 1:** Sinh module và service:
  ```bash
  nest g module inventory
  nest g service inventory
  ```
- **Bước 2:** Trong `InventoryService`, cài đặt method `reserveStock(productId: string, qty: number): number`. Dùng `Map<string, number>` nội bộ mô phỏng tồn kho, mặc định tồn 100 mỗi `productId`; mỗi lần gọi trừ `qty` và trả số đã giữ.
- **Bước 3:** Trong `InventoryModule`, thêm `InventoryService` vào `providers` và `exports` (bắt buộc `exports` để module khác dùng được).

### 2. Yêu cầu tối thiểu cần đạt
- Tồn tại file `src/inventory/inventory.module.ts` và `src/inventory/inventory.service.ts`.
- `InventoryService` có đúng method `reserveStock(productId: string, qty: number): number` trả số đã giữ.
- `InventoryModule` khai báo đủ `providers: [InventoryService]` và `exports: [InventoryService]`.
- Gọi `reserveStock('SKU-001', 3)` hai lần liên tiếp trả giá trị tồn kho còn lại đúng (100 -> 97 -> 94).

### 3. Nice to have
- Tách interface `InventoryPort` riêng để chuẩn bị cho bài HARD (swap bằng `useClass` / `useValue`).
- Ném exception `OutOfStockException` khi `qty > stock` thay vì trả số âm.
- Log mỗi lần `reserveStock` kèm `productId`, `qty`, `remaining` bằng `Logger` của NestJS.

## 2
### title
Tạo OrderModule inject InventoryService qua constructor
### body
### 1. Các bước thực hiện
- **Bước 1:** Sinh module, controller, service cho `order`:
  ```bash
  nest g module order
  nest g controller order
  nest g service order
  ```
- **Bước 2:** Trong `OrderModule`, `import` `InventoryModule` (không phải `InventoryService` trực tiếp).
- **Bước 3:** Trong `OrderService`, khai báo `constructor(private readonly inventoryService: InventoryService) {}`; viết `createOrder(productId: string, qty: number)` sinh `orderId` bằng `crypto.randomUUID()`, gọi `this.inventoryService.reserveStock(productId, qty)` và trả `{orderId, productId, reservedQty}`.
- **Bước 4:** Trong `OrderController`, tạo `POST /orders` nhận body qua `@Body()` gọi `OrderService.createOrder`.

### 2. Yêu cầu tối thiểu cần đạt
- `OrderModule` có `imports: [InventoryModule]` (không phải inject trực tiếp `InventoryService` ở providers).
- `OrderService` có `constructor(private readonly inventoryService: InventoryService)`; trong toàn repo không có `new InventoryService(`.
- `OrderService.createOrder` sinh `orderId` bằng `crypto.randomUUID()` và gọi `inventoryService.reserveStock(productId, qty)`.
- App build và khởi động không lỗi DI resolution.

### 3. Nice to have
- Tạo DTO `CreateOrderDto` + enable `ValidationPipe` dù bài chưa yêu cầu validation.
- Thêm `@HttpCode(201)` explicit cho handler `POST /orders` thay vì dựa vào default của framework.
- Thêm Swagger (`@nestjs/swagger`) để có trang `/api` tự động.

## 3
### title
Chạy test thật và ghi trace code execution
### body
### 1. Các bước thực hiện
- **Bước 1:** Chạy `npm run start:dev`, sau đó gọi `POST /orders` để tạo order mới.
  ```bash
  curl -X POST http://localhost:3000/orders \
    -H "Content-Type: application/json" \
    -d '{"productId":"SKU-001","qty":3}'
  ```
  Kỳ vọng: HTTP `201`, body có đủ `orderId`, `productId`, `reservedQty`.
- **Bước 2:** Ghi lại response thật vào README (không bịa).
- **Bước 3:** Viết README phần **Code Execution Trace** theo format:
  ```
  src/order/order.controller.ts:Lx -> OrderController.create()
  src/order/order.service.ts:Lx -> OrderService.createOrder()
  src/inventory/inventory.service.ts:Lx -> InventoryService.reserveStock()
  ```

### 2. Yêu cầu tối thiểu cần đạt
- `curl -X POST http://localhost:3000/orders -d '{"productId":"SKU-001","qty":3}'` trả HTTP 201 với body JSON đủ 3 field `orderId`, `productId`, `reservedQty`.
- `orderId` là UUID v4 hợp lệ (match regex `^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`).
- `productId` trong response đúng bằng input; `reservedQty` đúng bằng `qty` input.
- README có mục **Code Execution Trace** liệt kê đủ 3 điểm chạm kèm `file:line` thật (không phải placeholder).

### 3. Nice to have
- Thêm screenshot/GIF terminal + response JSON vào README.
- Viết 1 logger middleware đơn giản in `method url status duration` cho mỗi request.
- Đo cold-start time bằng `time npm run start` và note trong README.

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
Link GitHub Repository
### description
Nộp link GitHub repository chứa source code challenge. Repo bắt buộc có `README.md` gồm: mô tả ngắn, cách chạy (`npm install && npm run start:dev`), ví dụ request/response thực tế, và mục **Code Execution Trace** dạng `file:line -> method`.
### score
20
### prompts
#### 0
##### title
Cấu trúc module và DI xuyên module đúng chuẩn
##### score
8
##### promptText
Rubric chấm điểm (tối đa 8):

- Tiêu chí A (2 điểm): Có đủ 2 module tách biệt `InventoryModule` và `OrderModule`.
- Tiêu chí B (2 điểm): `InventoryModule` khai báo đúng `exports: [InventoryService]`.
- Tiêu chí C (2 điểm): `OrderModule` khai báo đúng `imports: [InventoryModule]`.
- Tiêu chí D (2 điểm): `OrderService` inject qua constructor và không có `new InventoryService()` trong source.

Quy tắc chấm: mỗi tiêu chí làm đúng trọn vẹn thì nhận đủ điểm tiêu chí đó; thiếu/sai tiêu chí nào thì tiêu chí đó nhận 0 điểm.
#### 1
##### title
Endpoint POST /orders chạy thật trả đúng shape
##### score
7
##### promptText
Rubric chấm điểm (tối đa 7):

- Tiêu chí A (2 điểm): Chạy được dự án bằng `npm install && npm run start:dev`.
- Tiêu chí B (2 điểm): `POST /orders` nhận payload `{"productId":"SKU-001","qty":3}` và trả HTTP thành công.
- Tiêu chí C (1.5 điểm): Response có `orderId` đúng format UUID v4.
- Tiêu chí D (1.5 điểm): Response có `productId` đúng input và `reservedQty` đúng `qty`.

Quy tắc chấm: tiêu chí đạt đầy đủ mới nhận điểm; không đạt tiêu chí nào thì tiêu chí đó nhận 0 điểm.
#### 2
##### title
README đủ 4 mục gồm trace file:line
##### score
5
##### promptText
Rubric chấm điểm (tối đa 5, 5 điểm là mức hoàn thiện hoàn hảo):

- Tiêu chí A (1 điểm): README có phần mô tả ngắn challenge.
- Tiêu chí B (1 điểm): README có hướng dẫn chạy dự án rõ ràng.
- Tiêu chí C (1 điểm): README có ví dụ request/response thực tế.
- Tiêu chí D (2 điểm): README có **Code Execution Trace** đúng chuỗi `OrderController -> OrderService -> InventoryService` và mỗi điểm chạm có định dạng `file:line`.

Quy tắc chấm: làm đúng đầy đủ tiêu chí nào thì nhận điểm tiêu chí đó; thiếu tiêu chí nào thì tiêu chí đó nhận 0 điểm.

# difficulty
easy

# score
20
