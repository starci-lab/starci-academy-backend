# title
CRUD Article với JwtAuthGuard, RolesGuard, Pipe tùy biến và LoggingInterceptor

# description
Mở rộng pipeline lên mức sản xuất: feature CRUD Article có Authentication (decode token giả), Authorization theo role, Pipe tùy biến cho query parameter, và Interceptor đo thời gian mọi request. Bài kiểm tra khả năng xếp lớp guard đúng thứ tự (JwtAuthGuard phải chạy trước RolesGuard vì RolesGuard cần đọc req.user), đặt logic đúng tầng, và xử lý đủ 3 edge case auth/role/validation.

# requirements
## 0
### purpose
Xây dựng feature CRUD `Article` trên NestJS với 4 endpoint và mock data in-memory ổn định để test auth/role/validation.
### technicalConstraints
Project folder phải là `article-auth-role-crud`. Endpoint bắt buộc: `GET /articles?tag=<tag>` (public), `POST /articles`, `PATCH /articles/:id`, `DELETE /articles/:id` (chỉ admin).
### proTipsHints
Chốt dữ liệu mẫu 3 bản ghi từ đầu để test repeatable cho cả smoke test.

## 1
### purpose
Thiết lập xác thực bằng `JwtAuthGuard` theo fake-token format thống nhất.
### technicalConstraints
`Authorization: Bearer user-<role>-<id>` phải được parse thành `req.user = {id, role}`; thiếu/sai format phải trả `UnauthorizedException` với `code: "UNAUTHENTICATED"`.
### proTipsHints
Dùng regex cố định cho token format để tránh parse thủ công dễ lỗi.

## 2
### purpose
Thiết lập phân quyền theo role bằng `@Roles` + `RolesGuard`.
### technicalConstraints
`RolesGuard` đọc metadata qua `Reflector`; nếu handler yêu cầu role mà user không đạt thì trả `ForbiddenException` `code: "FORBIDDEN_ROLE"`.
### proTipsHints
Nếu handler không có `@Roles(...)` thì cho pass ngay để tránh chặn nhầm route.

## 3
### purpose
Ràng buộc input nhất quán cho query/body bằng pipe + DTO validation.
### technicalConstraints
`TrimAndLowercasePipe` áp cho query `tag`; trim + lowercase; rỗng sau trim phải trả `BadRequestException` `code: "EMPTY_TAG"`. `CreateArticleDto` phải dùng `class-validator` đúng constraint.
### proTipsHints
Bật `ValidationPipe` global với `whitelist + transform + forbidNonWhitelisted` để chặn field lạ.

## 4
### purpose
Chuẩn hóa observability và error contract cho toàn bộ request.
### technicalConstraints
`LoggingInterceptor` log đúng format `[LOG] <method> <url> <statusCode> <durationMs>ms`. `AllExceptionsFilter` chuẩn hóa lỗi về `{code, message}`; lỗi non-HttpException trả `INTERNAL_ERROR`.
### proTipsHints
Giữ log/interceptor/filter tách file riêng để debug theo tầng.

## 5
### purpose
Giữ đúng thứ tự guard và ranh giới trách nhiệm theo pipeline.
### technicalConstraints
Bắt buộc `@UseGuards(JwtAuthGuard, RolesGuard)` theo đúng thứ tự. Cấm check role trong controller. Cấm decode token ở middleware/interceptor.
### proTipsHints
Review code theo checklist: auth ở guard, validation ở pipe/DTO, business ở service/controller.

### forbidden
- Đảo thứ tự guard (`RolesGuard` trước `JwtAuthGuard`) -> **0 prompt auth flow**.
- Check role trực tiếp trong controller/service thay vì `RolesGuard` -> **0 prompt authorization layer**.
- Decode token ở middleware/interceptor thay vì guard -> **0 prompt authentication layer**.
- Bỏ chuẩn hóa lỗi `{code, message}` hoặc log sai format interceptor -> **0 prompt observability/error contract**.

# prerequisites
## 0
### text
Hoàn thành challenge EASY `BookController` pipeline và hiểu thứ tự thực thi cơ bản của middleware/guard/pipe/interceptor/filter.
## 1
### text
Nắm `@UseGuards`, `@SetMetadata`, `Reflector` để triển khai auth + role theo handler/class.
## 2
### text
Biết `class-validator`, `ValidationPipe`, `ExceptionFilter` để chuẩn hóa input và lỗi trả về.

# steps

## 0
### title
Scaffold project và 4 endpoint CRUD Article trên mock data
### body
**Các bước thực hiện**
- **Bước 1:** Tạo project:
  ```bash
  nest new article-auth-role-crud
  cd article-auth-role-crud
  nest g module article
  nest g controller article
  nest g service article
  ```
- **Bước 2:** Trong `ArticleService`, khai báo `private readonly articles: Article[]` với 3 article mẫu (id `1`, `2`, `3`; mỗi article có `title`, `content`, `tag`); implement 4 method `list(tag?: string)`, `create(dto)`, `update(id, dto)`, `remove(id)` thao tác trực tiếp trên mảng trong memory.
- **Bước 3:** Trong `ArticleController`, khai báo 4 handler khớp 4 endpoint trên, tạm thời **chưa gắn guard/pipe/interceptor** nào; body nhận dạng `any` cho nhanh, trả về dữ liệu thẳng từ service.
- **Bước 4:** Chạy `npm run start:dev` và gọi thử `GET /articles` bằng curl hoặc browser để verify endpoint trả 3 article.

**Yêu cầu tối thiểu cần đạt**
- Folder project tên đúng `article-auth-role-crud`; app boot bằng `npm run start:dev` không lỗi.
- `ArticleService` có đủ 4 method `list`, `create`, `update`, `remove`; mảng mock khởi tạo 3 item.
- `GET /articles` trả array 3 phần tử; `GET /articles?tag=nest` lọc đúng (có thể chưa validate tag rỗng).
- Chưa có guard/pipe/interceptor gắn vào controller (verify bằng code + test không cần header).

**Nice to have**
- Khai báo interface `Article { id: number; title: string; content: string; tag: string }` ở `src/article/article.types.ts`.
- Sinh `id` cho article mới bằng `Math.max(...ids)+1` thay vì tăng tuần tự tay.

## 1
### title
Cài đặt JwtAuthGuard, RolesGuard, @Roles decorator và gắn đúng thứ tự
### body
**Các bước thực hiện**
- **Bước 1:** Tạo file `src/common/guards/jwt-auth.guard.ts` export `JwtAuthGuard implements CanActivate`. Trong `canActivate`: đọc `req = ctx.switchToHttp().getRequest()`; nếu thiếu header `Authorization` hoặc không bắt đầu bằng `Bearer ` -> `throw new UnauthorizedException({ code: 'UNAUTHENTICATED', message: 'Missing Bearer token' })`. Lấy `token = auth.slice(7)`; nếu không match regex `^user-(admin|member)-(\d+)$` -> `UnauthorizedException` `code: 'UNAUTHENTICATED'`. Gán `req.user = { id: Number(match[2]), role: match[1] }`; log `[JWT] user=${req.user.role}#${req.user.id}`; return `true`.
- **Bước 2:** Tạo file `src/common/decorators/roles.decorator.ts` export `const Roles = (...roles: string[]) => SetMetadata('roles', roles)`.
- **Bước 3:** Tạo file `src/common/guards/roles.guard.ts` export `RolesGuard implements CanActivate`. Inject `Reflector`. Trong `canActivate(ctx)`: `const required = this.reflector.getAllAndOverride<string[]>('roles', [ctx.getHandler(), ctx.getClass()])`; nếu `!required || required.length === 0` -> return `true`. Đọc `req.user`; nếu `!req.user` -> `UnauthorizedException` (phòng thủ); nếu `!required.includes(req.user.role)` -> `throw new ForbiddenException({ code: 'FORBIDDEN_ROLE', message: \`Required role: \${required.join(',')}\` })`. Log `[ROLES] ok for ${req.user.role}`.
- **Bước 4:** Trong `ArticleController`, gắn `@UseGuards(JwtAuthGuard, RolesGuard)` ở cấp class. Bỏ guard cho `GET /articles` bằng `@SkipAuth()` decorator (tạo `src/common/decorators/skip-auth.decorator.ts` export `SetMetadata('skipAuth', true)`); cập nhật `JwtAuthGuard` để đọc metadata này qua `Reflector` và skip khi gặp. Gắn `@SkipAuth()` vào handler `GET /articles`.
- **Bước 5:** Gắn `@Roles('admin')` chỉ lên handler `DELETE /articles/:id`.

**Yêu cầu tối thiểu cần đạt**
- 2 file guard nằm đúng path `src/common/guards/{jwt-auth,roles}.guard.ts`, mỗi file 1 class; 2 decorator ở `src/common/decorators/`.
- `@UseGuards(JwtAuthGuard, RolesGuard)` khai báo **đúng thứ tự** (`JwtAuthGuard` trước) ở cấp `ArticleController`.
- Gọi `POST /articles` không gửi `Authorization` trả `401` `UNAUTHENTICATED`.
- Gọi `DELETE /articles/1` với token `user-member-42` trả `403` `FORBIDDEN_ROLE`.
- Gọi `DELETE /articles/1` với token `user-admin-1` truy cập thành công (có thể trả 200/204 tuỳ implement).
- `GET /articles` gọi được không cần header nhờ `@SkipAuth()`.

**Nice to have**
- Thay hằng regex token bằng hằng số `TOKEN_PATTERN` export riêng để dễ maintain.
- Thêm `@CurrentUser()` param decorator để lấy `req.user` thay vì đọc trực tiếp.
- Tách 2 role `admin` và `member` thành enum `UserRole` thay vì string literal.

## 2
### title
Cài đặt TrimAndLowercasePipe, CreateArticleDto và LoggingInterceptor + ExceptionFilter
### body
**Các bước thực hiện**
- **Bước 1:** Tạo file `src/common/pipes/trim-lowercase.pipe.ts` export `TrimAndLowercasePipe implements PipeTransform<string, string>`. Trong `transform(value)`: nếu `value == null` -> return `value`; `const v = String(value).trim().toLowerCase()`; nếu `v.length === 0` -> `throw new BadRequestException({ code: 'EMPTY_TAG', message: 'tag must not be empty after trim' })`; log `[PIPE] tag=${v}`; return `v`.
- **Bước 2:** Áp pipe ở query: `list(@Query('tag', TrimAndLowercasePipe) tag?: string)` trong `ArticleController`. Lưu ý: pipe chỉ chạy khi `tag` thực sự được gửi; nếu client không truyền `tag`, pipe không bị gọi.
- **Bước 3:** Tạo `src/article/dto/create-article.dto.ts`: class `CreateArticleDto` với `title` `@IsString() @IsNotEmpty() @MinLength(3)`, `content` `@IsString() @IsNotEmpty()`, `tag` `@IsString() @IsOptional()`. Trong `main.ts` bật `app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }))`.
- **Bước 4:** Đổi signature handler `POST /articles` nhận `@Body() dto: CreateArticleDto`; handler `PATCH /articles/:id` nhận `@Body() dto: UpdateArticleDto` (dùng `PartialType(CreateArticleDto)`).
- **Bước 5:** Tạo file `src/common/interceptors/logging.interceptor.ts` export `LoggingInterceptor implements NestInterceptor`. Trong `intercept(ctx, next)`: `const start = Date.now(); const req = ctx.switchToHttp().getRequest(); return next.handle().pipe(tap(() => { const res = ctx.switchToHttp().getResponse(); console.log(\`[LOG] \${req.method} \${req.url} \${res.statusCode} \${Date.now() - start}ms\`) }))`. Đăng ký global qua token `APP_INTERCEPTOR`.
- **Bước 6:** Tạo file `src/common/filters/all-exceptions.filter.ts` export `@Catch() AllExceptionsFilter` (logic như challenge EASY BookController); đăng ký global qua `APP_FILTER`.

**Yêu cầu tối thiểu cần đạt**
- 3 file `trim-lowercase.pipe.ts`, `logging.interceptor.ts`, `all-exceptions.filter.ts` tồn tại đúng path; `CreateArticleDto` có đủ decorator đã nêu.
- `GET /articles?tag=%20Nest%20` chạy thành công và lọc theo `tag = "nest"` (đã trim + lowercase).
- `GET /articles?tag=` (sau trim rỗng) trả `400` body `{code: "EMPTY_TAG", ...}`.
- `POST /articles` với body `{ "content": "abc" }` (thiếu `title`) trả `400` body `{code, message}`; shape không lộ stacktrace.
- Mỗi request chạy thành công log đúng 1 dòng `[LOG] METHOD URL STATUS <N>ms`.
- `ValidationPipe` có `forbidNonWhitelisted: true`; gửi body kèm field lạ (ví dụ `{ title, content, hack: 1 }`) -> `400`.

**Nice to have**
- Thêm metric đơn giản: interceptor đẩy mỗi `durationMs` vào `Map<route, number[]>` và expose endpoint `GET /metrics` trả p50/p95 tính trên map (chỉ nội bộ, không cần lib).
- Dùng `class-transformer`'s `@Expose` để serialize response chỉ các field trong DTO.
- Tách `CommonModule` global gom 3 provider toàn cục (interceptor + filter + guard) cho sạch.

## 3
### title
Smoke test 4 kịch bản bằng curl (happy + auth fail + role fail + validation fail)
### body
**Các bước thực hiện**
- **Bước 1:** Chạy `npm run start:dev`; mở terminal riêng để theo dõi log.
- **Bước 2:** Gọi `POST /articles` với token admin để kiểm tra happy path tạo bài viết.
  ```bash
  curl -X POST http://localhost:3000/articles \
    -H "Authorization: Bearer user-admin-1" \
    -H "Content-Type: application/json" \
    -d '{"title":"Intro to NestJS pipeline","content":"Request lifecycle","tag":"nest"}' -i
  ```
  Kỳ vọng: HTTP `201`, body có `id` tự sinh và `tag: "nest"`.
- **Bước 3:** Gọi `POST /articles` không gửi token để kiểm tra auth fail.
  ```bash
  curl -X POST http://localhost:3000/articles \
    -H "Content-Type: application/json" \
    -d '{"title":"Should fail","content":"no auth"}' -i
  ```
  Kỳ vọng: HTTP `401`, body có `code: "UNAUTHENTICATED"` và log không có `[ROLES]`.
- **Bước 4:** Gọi `DELETE /articles/1` với token member để kiểm tra role fail.
  ```bash
  curl -X DELETE http://localhost:3000/articles/1 \
    -H "Authorization: Bearer user-member-42" -i
  ```
  Kỳ vọng: HTTP `403`, body có `code: "FORBIDDEN_ROLE"` và không có log controller.
- **Bước 5:** Gọi `GET /articles?tag=%20` để kiểm tra validation fail của query `tag`.
  ```bash
  curl "http://localhost:3000/articles?tag=%20" -i
  ```
  Kỳ vọng: HTTP `400`, body có `code: "EMPTY_TAG"` và log có `[PIPE]` nhưng không có log controller.
- **Bước 6:** Paste 4 response thật (cả headers + body JSON) và 4 block log terminal tương ứng vào `README.md` mục **Smoke Test**.

**Yêu cầu tối thiểu cần đạt**
- Happy path trả HTTP `201` với body chứa article mới (có `id` tự sinh) và `tag: "nest"`; log có dòng `[LOG] POST /articles 201 ...ms`.
- Thiếu token trả HTTP `401` body `{code: "UNAUTHENTICATED", ...}`; log có `[ROLES]` KHÔNG xuất hiện (guard đầu tiên chặn trước).
- `DELETE` bằng member trả HTTP `403` body `{code: "FORBIDDEN_ROLE", ...}`; log có `[JWT]` nhưng KHÔNG có controller log (roles guard chặn sau khi jwt pass).
- `?tag=%20` trả HTTP `400` body `{code: "EMPTY_TAG", ...}`; log có `[PIPE]` nhưng KHÔNG có controller log.
- README có mục **Smoke Test** paste đủ 4 response JSON thật + 4 block log thật tương ứng, không chỉnh sửa.

**Nice to have**
- Lưu 4 lệnh curl vào script `docs/smoke-test.sh` để chạy lặp lại nhanh.
- Vẽ Mermaid sequence diagram trong README minh hoạ `client -> JwtAuthGuard -> RolesGuard -> Controller`.
- Thêm GIF ghi lại terminal log + response terminal cho 4 lần gọi.

# outputs
## 0
### title
Thiết kế auth/role đúng tầng theo pipeline
### text
Bạn áp dụng được mô hình auth ở `JwtAuthGuard`, role ở `RolesGuard`, và giải thích được vì sao thứ tự guard ảnh hưởng trực tiếp tới tính đúng của hệ thống.
## 1
### title
Chuẩn hóa input và lỗi cho API CRUD
### text
Bạn triển khai được query pipe + DTO validation để chặn input sai sớm, đồng thời trả lỗi theo contract nhất quán `{code, message}`.
## 2
### title
Tự tin kiểm thử edge cases auth/role/validation
### text
Bạn thiết kế được smoke test cho các kịch bản fail quan trọng, đọc log để chứng minh request dừng đúng tầng.

# references
## 0
### alias
NestJS Guards
### url
https://docs.nestjs.com/guards
## 1
### alias
NestJS Custom Decorators
### url
https://docs.nestjs.com/custom-decorators
## 2
### alias
NestJS Pipes - Custom Pipe
### url
https://docs.nestjs.com/pipes#custom-pipes
## 3
### alias
NestJS Interceptors
### url
https://docs.nestjs.com/interceptors
## 4
### alias
NestJS Testing
### url
https://docs.nestjs.com/fundamentals/testing

# submissions
## 0
### type
githubUrl
### title
Link GitHub Repository
### description
Source code đầy đủ với `README.md` gồm: mô tả feature, bảng `Layer | File | Scope`, mục **Smoke Test** paste 4 response thật + 4 log block.
### score
24
### prompts
#### 0
##### title
Guard xếp đúng thứ tự, @Roles metadata dùng đúng cách
##### score
8
##### promptText
Rubric chấm điểm (tối đa 8):

- Tiêu chí A (3 điểm): `ArticleController` khai báo `@UseGuards(JwtAuthGuard, RolesGuard)` đúng thứ tự (`JwtAuthGuard` trước).
- Tiêu chí B (2 điểm): `DELETE /articles/:id` có `@Roles('admin')` và `RolesGuard` đọc metadata bằng `Reflector.getAllAndOverride(...)`.
- Tiêu chí C (3 điểm): Không có kiểm tra auth/role trong middleware/interceptor/controller (auth chỉ xảy ra ở `JwtAuthGuard`).

Quy tắc chấm: đạt đủ tiêu chí nào thì nhận điểm tiêu chí đó; không đạt tiêu chí thì 0 điểm.
#### 1
##### title
TrimAndLowercasePipe xử lý trim + lowercase + reject empty
##### score
6
##### promptText
Rubric chấm điểm (tối đa 6):

- Tiêu chí A (2 điểm): `GET /articles?tag=%20Nest%20` trả 200 và lọc theo `tag = "nest"` sau trim/lowercase.
- Tiêu chí B (2 điểm): `GET /articles?tag=%20` trả 400 với `code: "EMPTY_TAG"`.
- Tiêu chí C (2 điểm): `GET /articles` không có `tag` vẫn trả danh sách đầy đủ và không lỗi.

Quy tắc chấm: đạt đủ tiêu chí nào thì nhận điểm tiêu chí đó; không đạt tiêu chí thì 0 điểm.
#### 2
##### title
4 kịch bản smoke test trả đúng status + shape
##### score
10
##### promptText
Rubric chấm điểm (tối đa 10):

- Tiêu chí A (3 điểm): `POST /articles` với `Bearer user-admin-1` và body hợp lệ trả 201, body có `id`, `title`, `tag`.
- Tiêu chí B (2 điểm): Thiếu token trả 401 với `code: "UNAUTHENTICATED"`.
- Tiêu chí C (2 điểm): `DELETE /articles/1` với `Bearer user-member-42` trả 403 với `code: "FORBIDDEN_ROLE"`.
- Tiêu chí D (2 điểm): `GET /articles?tag=%20` trả 400 với `code: "EMPTY_TAG"`.
- Tiêu chí E (1 điểm): README có đủ 4 response thật tương ứng 4 kịch bản.

Quy tắc chấm: đạt đủ tiêu chí nào thì nhận điểm tiêu chí đó; không đạt tiêu chí thì 0 điểm.
## 1
### type
googleDocsUrl
### title
Design note - Auth logic đặt ở đâu trong pipeline (tuỳ chọn)
### description
(Tuỳ chọn, không bắt buộc.) Google Docs ngắn (~1 trang) phân tích vì sao auth/role phải đặt ở `Guard` thay vì `Middleware` hay `Interceptor`, kèm trade-off cụ thể cho ngữ cảnh bài này.
### score
10
### prompts
#### 0
##### title
So sánh 3 tầng đặt auth (Middleware / Guard / Interceptor)
##### score
5
##### promptText
Rubric chấm điểm (tối đa 5):

- Tiêu chí A (2 điểm): So sánh đủ 3 tầng `Middleware`, `Guard`, `Interceptor`.
- Tiêu chí B (2 điểm): Có ít nhất 3 tiêu chí so sánh kỹ thuật rõ ràng.
- Tiêu chí C (1 điểm): Mỗi tiêu chí có kết luận tầng phù hợp và lý do cụ thể.

Quy tắc chấm: đạt đủ tiêu chí nào thì nhận điểm tiêu chí đó; không đạt tiêu chí thì 0 điểm.
#### 1
##### title
Kết luận chọn Guard và lý do cụ thể cho bài này
##### score
5
##### promptText
Rubric chấm điểm (tối đa 5):

- Tiêu chí A (2 điểm): Có kết luận rõ ràng chọn `Guard` cho auth/role.
- Tiêu chí B (2 điểm): Nêu ít nhất 2 lý do kỹ thuật cụ thể bám vào bối cảnh bài.
- Tiêu chí C (1 điểm): Lý do có liên hệ trực tiếp đến pipeline order hoặc metadata handler.

Quy tắc chấm: đạt đủ tiêu chí nào thì nhận điểm tiêu chí đó; không đạt tiêu chí thì 0 điểm.

# difficulty
medium

# score
34
