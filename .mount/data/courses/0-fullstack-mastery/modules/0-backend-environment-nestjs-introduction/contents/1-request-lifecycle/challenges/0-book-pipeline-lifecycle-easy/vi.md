# title
Triển khai đủ 5 lớp pipeline của NestJS với BookController

# description
Dựng 1 project NestJS có feature Book đơn giản, đi qua đủ 5 lớp pipeline: Middleware -> Guard -> Pipe -> Controller -> Interceptor -> Exception Filter. Mỗi lớp đặt 1 file riêng, gắn đúng scope (global / controller / method), có log in rõ thứ tự thực thi. Mục tiêu: nhìn 1 request đi xuyên pipeline và thấy tầng nào đúng trách nhiệm của tầng nào.

# requirements
## 0
### purpose
Khởi tạo project ***NestJS*** đúng tên thư mục `book-pipeline-lifecycle` và giữ phạm vi nghiệp vụ tối giản với 1 endpoint `GET /books/:id`.
### technicalConstraints
Không đổi tên thư mục project. Endpoint `GET /books/:id` phải trả `{id, title}` với `title` theo format `"Book ${id}"` trên dữ liệu mock.
### proTipsHints
Làm endpoint trả dữ liệu mock trước để dễ test pipeline theo từng lớp về sau.

## 1
### purpose
Triển khai `RequestIdMiddleware` để mọi request đều có `x-request-id` dùng xuyên suốt các lớp.
### technicalConstraints
Middleware phải gắn toàn app; nếu client chưa gửi `x-request-id` thì sinh bằng `crypto.randomUUID()`, gắn vào `req` và `res`.
### proTipsHints
Luôn set cả `req.headers['x-request-id']` và `res.setHeader('x-request-id', id)` để happy-path và error-path cùng truy vết được.

## 2
### purpose
Bảo vệ endpoint bằng `ApiKeyGuard` theo cơ chế API key đơn giản.
### technicalConstraints
`ApiKeyGuard` đọc `x-api-key`, so sánh với `API_KEY = "dev-key-123"`, thiếu/sai phải ném `UnauthorizedException` với `code: "UNAUTHORIZED"`.
### proTipsHints
Log rõ guard pass/fail để kiểm tra thứ tự pipeline trong terminal.

## 3
### purpose
Đảm bảo dữ liệu đầu vào `id` hợp lệ bằng `ParsePositiveIntPipe` trước khi vào controller.
### technicalConstraints
Pipe nhận `string` từ `@Param('id')`, parse ra số nguyên dương; parse fail hoặc `<= 0` phải ném `BadRequestException` với `code: "INVALID_ID"`.
### proTipsHints
Không validate `id` bằng `if` trong controller.

## 4
### purpose
Chuẩn hóa response thành 1 cấu trúc ổn định và dễ truy vết.
### technicalConstraints
`ResponseTransformInterceptor` phải bọc response `2xx` thành `{data, meta: {requestId, timestamp}}`.
### proTipsHints
Lấy `requestId` từ request hiện tại để đồng nhất với middleware/filter.

## 5
### purpose
Chuẩn hóa error response và giữ `x-request-id` cả ở nhánh lỗi.
### technicalConstraints
`AllExceptionsFilter` bắt mọi exception, trả body `{code, message}` và luôn set header `x-request-id`.
### proTipsHints
Tách riêng filter thành 1 file độc lập, không trộn với interceptor/guard.

## 6
### purpose
Giữ đúng ranh giới trách nhiệm của từng lớp trong request lifecycle.
### technicalConstraints
Cấm validate `id` trong controller bằng `if`; cấm kiểm tra auth/role trong middleware; cấm gộp 2 lớp pipeline vào cùng 1 file.
### proTipsHints
Khi review code, check theo thư mục `middlewares/guards/pipes/interceptors/filters` để phát hiện sai tầng nhanh.

### forbidden
- Validate `id` trực tiếp trong controller thay vì pipe -> **0 prompt validation layer**.
- Đặt auth/role check trong middleware hoặc controller thay vì guard -> **0 prompt guard layer**.
- Gộp nhiều lớp pipeline vào cùng một file -> **0 prompt pipeline boundaries**.
- Không set/propagate `x-request-id` ở nhánh lỗi -> **0 prompt observability**.

# prerequisites
## 0
### text
Hoàn thành challenge EASY về cross-module DI và nắm được cách tổ chức module/controller/service cơ bản.
## 1
### text
Hiểu khái niệm ***Middleware***, ***Guard***, ***Pipe***, ***Interceptor***, ***ExceptionFilter***.
## 2
### text
Biết scope đăng ký: token global `APP_*` và các decorator mức controller/method như `@UseGuards`, `@UseInterceptors`.

# steps

## 0
### title
Khởi tạo project và dựng BookController trần
### body
**Các bước thực hiện**
- **Bước 1:** Tạo project mới:
  ```bash
  nest new book-pipeline-lifecycle
  cd book-pipeline-lifecycle
  ```
- **Bước 2:** Sinh module + controller cho `book`:
  ```bash
  nest g module book
  nest g controller book
  ```
- **Bước 3:** Trong `BookController`, khai báo `GET /books/:id` trả `{id, title: \`Book \${id}\`}`; tạm để `id` kiểu `string`, chưa validate.
- **Bước 4:** Chạy `npm run start:dev`, verify endpoint phản hồi được bằng trình duyệt tại `http://localhost:3000/books/5`.

**Yêu cầu tối thiểu cần đạt**
- Folder project tên đúng `book-pipeline-lifecycle`; `npm run start:dev` boot không lỗi.
- `BookModule` tồn tại ở `src/book/`, được import vào `AppModule`.
- `GET /books/5` trả JSON `{id: "5", title: "Book 5"}` với HTTP `200`.
- Chưa có bất kỳ lớp pipeline nào ngoài controller (xác nhận bằng log trống).

**Nice to have**
- Gọi `app.setGlobalPrefix('api/v1')` để endpoint thành `/api/v1/books/:id`.
- Đặt port đọc từ `process.env.PORT` trong `main.ts`.

## 1
### title
Cài đặt RequestIdMiddleware và ApiKeyGuard
### body
**Các bước thực hiện**
- **Bước 1:** Tạo file `src/common/middlewares/request-id.middleware.ts` export class `RequestIdMiddleware implements NestMiddleware`. Trong `use(req, res, next)`: nếu `req.headers['x-request-id']` rỗng -> `const id = crypto.randomUUID()`; set `req.headers['x-request-id'] = id` và `res.setHeader('x-request-id', id)`; log `[MIDDLEWARE] x-request-id=${id}`; gọi `next()`.
- **Bước 2:** Đăng ký middleware bằng cách cho `AppModule` implement `NestModule` và override `configure(consumer) { consumer.apply(RequestIdMiddleware).forRoutes('*') }`.
- **Bước 3:** Tạo file `src/common/guards/api-key.guard.ts` export class `ApiKeyGuard implements CanActivate`. Trong `canActivate(ctx)`: lấy `req` từ `ctx.switchToHttp().getRequest()`; nếu `req.headers['x-api-key'] !== 'dev-key-123'` -> `throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: 'Missing or invalid x-api-key' })`; log `[GUARD] apiKey ok`; return `true`.
- **Bước 4:** Gắn guard vào `BookController` bằng `@UseGuards(ApiKeyGuard)` ở cấp class.

**Yêu cầu tối thiểu cần đạt**
- File `request-id.middleware.ts` và `api-key.guard.ts` nằm ở `src/common/` theo đúng path trên, mỗi file 1 class duy nhất.
- Request vào server luôn có log `[MIDDLEWARE]` trước mọi log khác; response header luôn có `x-request-id`.
- `GET /books/5` thiếu header `x-api-key` -> HTTP `401` body `{"statusCode":401,"code":"UNAUTHORIZED",...}` (dù filter chưa cài, shape của Nest chấp nhận tạm).
- Log thể hiện thứ tự: `[MIDDLEWARE] ... -> [GUARD] apiKey ok` rồi mới vào controller.

**Nice to have**
- Thêm `ApiKeyGuard` vào `APP_GUARD` bằng provider toàn cục thay cho `@UseGuards` cấp controller.
- Log thêm `durationMs` trong middleware bằng cách đọc `Date.now()` ở đầu và ở `res.on('finish')`.

## 2
### title
Cài đặt Pipe, Interceptor và ExceptionFilter
### body
**Các bước thực hiện**
- **Bước 1:** Tạo file `src/common/pipes/parse-positive-int.pipe.ts` export `ParsePositiveIntPipe implements PipeTransform<string, number>`. Trong `transform(value)`: `const n = Number(value)`; nếu `!Number.isInteger(n) || n <= 0` -> `throw new BadRequestException({ code: 'INVALID_ID', message: \`id must be positive integer, got \"\${value}\"\` })`; log `[PIPE] id=${n}`; return `n`.
- **Bước 2:** Áp pipe ở cấp method trong `BookController`: `findOne(@Param('id', ParsePositiveIntPipe) id: number)`.
- **Bước 3:** Tạo file `src/common/interceptors/response-transform.interceptor.ts` export `ResponseTransformInterceptor implements NestInterceptor`. Trong `intercept(ctx, next)`: return `next.handle().pipe(map(data => ({ data, meta: { requestId: ctx.switchToHttp().getRequest().headers['x-request-id'], timestamp: new Date().toISOString() } })))`; log `[INTERCEPTOR] wrapped`.
- **Bước 4:** Đăng ký interceptor ở cấp global trong `AppModule` qua token `APP_INTERCEPTOR`.
- **Bước 5:** Tạo file `src/common/filters/all-exceptions.filter.ts` export `@Catch() AllExceptionsFilter implements ExceptionFilter`. Trong `catch(exception, host)`: lấy `res` và `req`; tính `status = exception instanceof HttpException ? exception.getStatus() : 500`; tính `body = exception instanceof HttpException ? exception.getResponse() : { code: 'INTERNAL_ERROR', message: 'Unexpected error' }`; set `res.setHeader('x-request-id', req.headers['x-request-id'])`; `res.status(status).json({ code: body.code ?? 'UNKNOWN', message: body.message ?? String(exception) })`; log `[FILTER] status=${status}`.
- **Bước 6:** Đăng ký filter ở cấp global trong `AppModule` qua token `APP_FILTER`.

**Yêu cầu tối thiểu cần đạt**
- 5 file pipeline nằm đúng path: `src/common/{middlewares,guards,pipes,interceptors,filters}/`, mỗi path đúng 1 file tương ứng.
- `GET /books/5` với header hợp lệ trả `{data: {id: 5, title: "Book 5"}, meta: {requestId, timestamp}}`; response header có `x-request-id`.
- `GET /books/abc` trả HTTP `400` body `{code: "INVALID_ID", message: ...}`; log KHÔNG chứa dòng nào của controller (controller không được chạy).
- `GET /books/5` thiếu `x-api-key` trả HTTP `401` body `{code: "UNAUTHORIZED", ...}`; log KHÔNG có `[PIPE]` và `[CONTROLLER]`.
- Thứ tự log khi happy path đúng: `[MIDDLEWARE] -> [GUARD] -> [PIPE] -> [CONTROLLER] -> [INTERCEPTOR]`.

**Nice to have**
- Set `app.getHttpAdapter().getInstance().disable('x-powered-by')` để bớt leak info.
- Viết decorator `@RequestId()` param decorator thay vì đọc `req.headers` thô trong interceptor.
- Dùng `Reflector` trong `ApiKeyGuard` để hỗ trợ `@Public()` decorator skip guard (chưa bắt buộc dùng).

## 3
### title
Smoke test 3 kịch bản bằng curl và ghi README trace execution
### body
**Các bước thực hiện**
- **Bước 1:** Chạy `npm run start:dev`, đảm bảo terminal boot xong không lỗi.
- **Bước 2:** Gọi `GET /books/5` với `x-api-key` hợp lệ để kiểm tra happy path.
  ```bash
  curl http://localhost:3000/books/5 \
    -H "x-api-key: dev-key-123" -i
  ```
  Kỳ vọng: HTTP `200`, body trả `{data, meta}` và response có header `x-request-id`.
- **Bước 3:** Gọi `GET /books/abc` với `x-api-key` hợp lệ để kiểm tra pipe chặn id sai.
  ```bash
  curl http://localhost:3000/books/abc \
    -H "x-api-key: dev-key-123" -i
  ```
  Kỳ vọng: HTTP `400`, body có `code: "INVALID_ID"` và log không có dòng controller.
- **Bước 4:** Gọi `GET /books/5` không gửi `x-api-key` để kiểm tra guard chặn.
  ```bash
  curl http://localhost:3000/books/5 -i
  ```
  Kỳ vọng: HTTP `401`, body có `code: "UNAUTHORIZED"` và log dừng trước pipe/controller.
- **Bước 5:** Mở `README.md`, tạo bảng `Lớp pipeline | File | Scope đăng ký` cho đủ 5 lớp; paste lại 3 response thật của 3 lệnh trên kèm block log terminal tương ứng (copy từ terminal đang chạy `start:dev`).

**Yêu cầu tối thiểu cần đạt**
- Happy path trả HTTP `200` body `{data: {id: 5, title: "Book 5"}, meta: {requestId, timestamp}}`; header `x-request-id` xuất hiện.
- `GET /books/abc` trả HTTP `400` body `{code: "INVALID_ID", ...}`; log terminal thứ tự dừng ở `[PIPE]` (không có `[INTERCEPTOR]`, không có dòng của controller).
- `GET /books/5` thiếu `x-api-key` trả HTTP `401` body `{code: "UNAUTHORIZED", ...}`; log dừng ở `[GUARD]` (không có `[PIPE]`).
- README có bảng 5 lớp pipeline với cột `File` chỉ đúng path `src/common/...` và cột `Scope` là 1 trong `global | controller | method`.
- README có 3 block response thật + 3 block log terminal thật (paste nguyên, không bịa).

**Nice to have**
- Lưu 3 lệnh curl vào `README.md` hoặc `docs/smoke-test.sh` để chạy lại nhanh.
- Thêm GIF demo 3 lệnh chạy tuần tự kèm terminal log vào README.
- Thêm sơ đồ Mermaid `graph LR` minh hoạ thứ tự 5 lớp pipeline trong README.

# outputs
## 0
### title
Phân biệt đúng trách nhiệm từng lớp pipeline
### text
Bạn hiểu rõ lớp nào xử lý việc gì trong chuỗi Middleware -> Guard -> Pipe -> Controller -> Interceptor -> Filter và tránh đặt sai logic sang tầng khác.
## 1
### title
Thiết kế được response/error nhất quán
### text
Bạn triển khai được response success/error theo chuẩn có thể kiểm thử, bao gồm `x-request-id` để truy vết xuyên suốt cả nhánh thành công và thất bại.
## 2
### title
Tự kiểm chứng thứ tự thực thi bằng log
### text
Bạn biết cách dùng log và smoke test để chứng minh guard/pipe chặn đúng chỗ, controller có hoặc không chạy đúng theo từng kịch bản.

# references
## 0
### alias
NestJS Request Lifecycle
### url
https://docs.nestjs.com/faq/request-lifecycle
## 1
### alias
NestJS Middleware
### url
https://docs.nestjs.com/middleware
## 2
### alias
NestJS Guards
### url
https://docs.nestjs.com/guards
## 3
### alias
NestJS Pipes
### url
https://docs.nestjs.com/pipes
## 4
### alias
NestJS Interceptors
### url
https://docs.nestjs.com/interceptors
## 5
### alias
NestJS Exception Filters
### url
https://docs.nestjs.com/exception-filters

# submissions
## 0
### type
githubUrl
### title
Link GitHub Repository
### description
Nộp link GitHub repository chứa source code challenge. Repo bắt buộc có `README.md` gồm: bảng "Lớp pipeline - File - Scope đăng ký", 3 response thật của 3 kịch bản smoke test, và 3 block log terminal tương ứng.
### score
20
### prompts
#### 0
##### title
Đủ 5 lớp pipeline, mỗi lớp 1 file, đăng ký đúng scope
##### score
6
##### promptText
Rubric chấm điểm (tối đa 6):

- Tiêu chí A (2 điểm): Repo có đúng 5 file pipeline ở `src/common/{middlewares,guards,pipes,interceptors,filters}/`, mỗi folder đúng 1 file.
- Tiêu chí B (2 điểm): Scope đăng ký đúng: middleware qua `AppModule.configure`, interceptor/filter qua `APP_INTERCEPTOR`/`APP_FILTER`, guard ở controller, pipe ở method.
- Tiêu chí C (2 điểm): Không có class pipeline nào chứa logic nghiệp vụ `Book` (đúng trách nhiệm từng tầng).

Quy tắc chấm: đạt đầy đủ tiêu chí nào thì nhận điểm tiêu chí đó; thiếu/sai tiêu chí thì tiêu chí đó nhận 0 điểm.
#### 1
##### title
GET /books/5 trả đúng shape {data, meta} và header x-request-id
##### score
5
##### promptText
Rubric chấm điểm (tối đa 5):

- Tiêu chí A (2 điểm): `GET /books/5` với `x-api-key: dev-key-123` trả HTTP `200`.
- Tiêu chí B (2 điểm): Body đúng shape `{data, meta}` và phần `data` chứa `{id: 5, title: "Book 5"}`.
- Tiêu chí C (1 điểm): Response header có `x-request-id` hợp lệ và nhất quán với `meta.requestId`.

Quy tắc chấm: đạt đầy đủ tiêu chí nào thì nhận điểm tiêu chí đó; thiếu/sai tiêu chí thì tiêu chí đó nhận 0 điểm.
#### 2
##### title
GET /books/abc bị Pipe chặn, controller không chạy
##### score
5
##### promptText
Rubric chấm điểm (tối đa 5):

- Tiêu chí A (2 điểm): `GET /books/abc` với `x-api-key` hợp lệ trả HTTP `400`.
- Tiêu chí B (2 điểm): Error body có `code: "INVALID_ID"` và thông điệp hợp lý.
- Tiêu chí C (1 điểm): Terminal log của request này không có log từ `BookController`.

Quy tắc chấm: đạt đầy đủ tiêu chí nào thì nhận điểm tiêu chí đó; thiếu/sai tiêu chí thì tiêu chí đó nhận 0 điểm.
#### 3
##### title
Thiếu x-api-key bị Guard chặn, pipe/controller không chạy
##### score
4
##### promptText
Rubric chấm điểm (tối đa 4):

- Tiêu chí A (2 điểm): `GET /books/5` không gửi `x-api-key` trả HTTP `401`.
- Tiêu chí B (1 điểm): Error body có `code: "UNAUTHORIZED"`.
- Tiêu chí C (1 điểm): Log không có `[PIPE]` và không có log từ `BookController`.

Quy tắc chấm: đạt đầy đủ tiêu chí nào thì nhận điểm tiêu chí đó; thiếu/sai tiêu chí thì tiêu chí đó nhận 0 điểm.

# difficulty
easy

# score
20
