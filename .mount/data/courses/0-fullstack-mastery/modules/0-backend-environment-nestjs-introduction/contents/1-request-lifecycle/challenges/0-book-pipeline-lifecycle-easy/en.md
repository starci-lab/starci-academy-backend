# title
Implement all 5 NestJS pipeline layers with BookController

# description
Build a small NestJS project with a Book feature that travels through all 5 pipeline layers: Middleware -> Guard -> Pipe -> Controller -> Interceptor -> Exception Filter. Each layer lives in its own single file, registered at the correct scope (global / controller / method), and prints a log so the execution order is visible. Goal: watch one request traverse the pipeline and internalize which responsibility belongs to which layer.

# requirements
## 0
### purpose
Bootstrap a ***NestJS*** project with folder name `book-pipeline-lifecycle` and keep business scope minimal with one endpoint `GET /books/:id`.
### technicalConstraints
The project folder must stay `book-pipeline-lifecycle`. `GET /books/:id` must return `{id, title}` where `title` follows `"Book ${id}"` over mock data.
### proTipsHints
Implement the mock endpoint first to test each pipeline layer incrementally.

## 1
### purpose
Implement `RequestIdMiddleware` so every request has a traceable `x-request-id`.
### technicalConstraints
Register middleware app-wide; if client does not send `x-request-id`, create one via `crypto.randomUUID()`, attach to `req`, and set it in response header.
### proTipsHints
Set both `req.headers['x-request-id']` and `res.setHeader('x-request-id', id)` so success/error paths stay traceable.

## 2
### purpose
Protect endpoints with `ApiKeyGuard` using a simple API-key policy.
### technicalConstraints
`ApiKeyGuard` must check `x-api-key` against `API_KEY = "dev-key-123"`; missing/wrong key must throw `UnauthorizedException` with `code: "UNAUTHORIZED"`.
### proTipsHints
Log guard pass/fail to verify execution order quickly.

## 3
### purpose
Validate route param `id` before controller logic using `ParsePositiveIntPipe`.
### technicalConstraints
Pipe must transform `@Param('id')` from string to positive integer; parse failure or `<= 0` must throw `BadRequestException` with `code: "INVALID_ID"`.
### proTipsHints
Do not validate `id` inside controller `if` blocks.

## 4
### purpose
Standardize successful responses into one predictable structure.
### technicalConstraints
`ResponseTransformInterceptor` must wrap `2xx` responses into `{data, meta: {requestId, timestamp}}`.
### proTipsHints
Read `requestId` from the current request context to keep metadata consistent.

## 5
### purpose
Normalize all errors and preserve request tracing on failure.
### technicalConstraints
`AllExceptionsFilter` must catch all exceptions, return `{code, message}`, and always set header `x-request-id`.
### proTipsHints
Keep filter in a dedicated file; do not merge filter/interceptor/guard logic.

## 6
### purpose
Enforce strict separation of responsibilities across pipeline layers.
### technicalConstraints
Forbidden: validating `id` in controller, auth/role checks in middleware, merging two pipeline layers in one file.
### proTipsHints
Review by folder (`middlewares/guards/pipes/interceptors/filters`) to catch wrong-layer logic fast.

### forbidden
- Validating `id` directly in controller logic instead of a pipe -> **0 validation-layer prompt**.
- Putting auth/role checks in middleware/controller instead of guards -> **0 guard-layer prompt**.
- Merging multiple pipeline layers into one file -> **0 pipeline-boundary prompt**.
- Failing to preserve `x-request-id` on error responses -> **0 observability prompt**.

# prerequisites
## 0
### text
Completed the EASY cross-module DI challenge and understand basic module/controller/service setup.
## 1
### text
Understand ***Middleware***, ***Guard***, ***Pipe***, ***Interceptor***, and ***ExceptionFilter*** concepts.
## 2
### text
Know when to use global `APP_*` providers versus controller/method decorators such as `@UseGuards` and `@UseInterceptors`.

# steps

## 0
### title
Bootstrap the project and a bare BookController
### body
**Steps to follow**
- **Step 1:** Create a new project:
  ```bash
  nest new book-pipeline-lifecycle
  cd book-pipeline-lifecycle
  ```
- **Step 2:** Scaffold the `book` module + controller:
  ```bash
  nest g module book
  nest g controller book
  ```
- **Step 3:** In `BookController`, declare `GET /books/:id` returning `{id, title: \`Book \${id}\`}`; keep `id` as `string` for now, no validation yet.
- **Step 4:** Run `npm run start:dev` and confirm the endpoint responds in the browser at `http://localhost:3000/books/5`.

**Minimum acceptance criteria**
- Project folder name is exactly `book-pipeline-lifecycle`; `npm run start:dev` boots with no errors.
- `BookModule` exists at `src/book/` and is imported from `AppModule`.
- `GET /books/5` returns JSON `{id: "5", title: "Book 5"}` with HTTP `200`.
- No pipeline layer besides the controller exists yet (verify via empty logs from other layers).

**Nice to have**
- Call `app.setGlobalPrefix('api/v1')` so the endpoint becomes `/api/v1/books/:id`.
- Read the port from `process.env.PORT` in `main.ts`.

## 1
### title
Implement RequestIdMiddleware and ApiKeyGuard
### body
**Steps to follow**
- **Step 1:** Create `src/common/middlewares/request-id.middleware.ts` exporting `RequestIdMiddleware implements NestMiddleware`. In `use(req, res, next)`: if `req.headers['x-request-id']` is empty -> `const id = crypto.randomUUID()`; set `req.headers['x-request-id'] = id` and `res.setHeader('x-request-id', id)`; log `[MIDDLEWARE] x-request-id=${id}`; call `next()`.
- **Step 2:** Register the middleware by having `AppModule` implement `NestModule` and overriding `configure(consumer) { consumer.apply(RequestIdMiddleware).forRoutes('*') }`.
- **Step 3:** Create `src/common/guards/api-key.guard.ts` exporting `ApiKeyGuard implements CanActivate`. In `canActivate(ctx)`: get `req` from `ctx.switchToHttp().getRequest()`; if `req.headers['x-api-key'] !== 'dev-key-123'` -> `throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: 'Missing or invalid x-api-key' })`; log `[GUARD] apiKey ok`; return `true`.
- **Step 4:** Attach the guard to `BookController` using `@UseGuards(ApiKeyGuard)` at the class level.

**Minimum acceptance criteria**
- Files `request-id.middleware.ts` and `api-key.guard.ts` live under `src/common/` at the exact paths above, each with a single class.
- Every request shows a `[MIDDLEWARE]` log line before any other log; every response carries an `x-request-id` header.
- `GET /books/5` without `x-api-key` returns HTTP `401` with a body carrying the Unauthorized payload.
- Logs show the order: `[MIDDLEWARE] ... -> [GUARD] apiKey ok` before entering the controller.

**Nice to have**
- Register `ApiKeyGuard` via `APP_GUARD` as a global provider instead of `@UseGuards` on the controller.
- Log an additional `durationMs` in the middleware via `Date.now()` read at the start and on `res.on('finish')`.

## 2
### title
Implement Pipe, Interceptor, and ExceptionFilter
### body
**Steps to follow**
- **Step 1:** Create `src/common/pipes/parse-positive-int.pipe.ts` exporting `ParsePositiveIntPipe implements PipeTransform<string, number>`. In `transform(value)`: `const n = Number(value)`; if `!Number.isInteger(n) || n <= 0` -> `throw new BadRequestException({ code: 'INVALID_ID', message: \`id must be positive integer, got \"\${value}\"\` })`; log `[PIPE] id=${n}`; return `n`.
- **Step 2:** Apply the pipe at method level in `BookController`: `findOne(@Param('id', ParsePositiveIntPipe) id: number)`.
- **Step 3:** Create `src/common/interceptors/response-transform.interceptor.ts` exporting `ResponseTransformInterceptor implements NestInterceptor`. In `intercept(ctx, next)`: return `next.handle().pipe(map(data => ({ data, meta: { requestId: ctx.switchToHttp().getRequest().headers['x-request-id'], timestamp: new Date().toISOString() } })))`; log `[INTERCEPTOR] wrapped`.
- **Step 4:** Register the interceptor globally inside `AppModule` via the `APP_INTERCEPTOR` token.
- **Step 5:** Create `src/common/filters/all-exceptions.filter.ts` exporting `@Catch() AllExceptionsFilter implements ExceptionFilter`. In `catch(exception, host)`: get `res` and `req`; compute `status = exception instanceof HttpException ? exception.getStatus() : 500`; compute `body = exception instanceof HttpException ? exception.getResponse() : { code: 'INTERNAL_ERROR', message: 'Unexpected error' }`; set `res.setHeader('x-request-id', req.headers['x-request-id'])`; `res.status(status).json({ code: body.code ?? 'UNKNOWN', message: body.message ?? String(exception) })`; log `[FILTER] status=${status}`.
- **Step 6:** Register the filter globally inside `AppModule` via the `APP_FILTER` token.

**Minimum acceptance criteria**
- The 5 pipeline files live at `src/common/{middlewares,guards,pipes,interceptors,filters}/`, exactly one file per folder.
- `GET /books/5` with a valid header returns `{data: {id: 5, title: "Book 5"}, meta: {requestId, timestamp}}`; response header includes `x-request-id`.
- `GET /books/abc` returns HTTP `400` with body `{code: "INVALID_ID", message: ...}`; logs do NOT contain any controller line (the controller must not execute).
- `GET /books/5` without `x-api-key` returns HTTP `401` with body `{code: "UNAUTHORIZED", ...}`; logs do NOT include `[PIPE]` or any controller line.
- On the happy path the log order is: `[MIDDLEWARE] -> [GUARD] -> [PIPE] -> [CONTROLLER] -> [INTERCEPTOR]`.

**Nice to have**
- Disable `x-powered-by` via `app.getHttpAdapter().getInstance().disable('x-powered-by')` to reduce info leakage.
- Write a `@RequestId()` param decorator instead of reading `req.headers` directly in the interceptor.
- Use `Reflector` in `ApiKeyGuard` to support a `@Public()` decorator that skips the guard (optional).

## 3
### title
Smoke-test 3 scenarios via curl and document the execution trace in README
### body
**Steps to follow**
- **Step 1:** Run `npm run start:dev` and make sure the terminal finishes booting without errors.
- **Step 2:** Call `GET /books/5` with valid `x-api-key` to verify the happy path.
  ```bash
  curl http://localhost:3000/books/5 \
    -H "x-api-key: dev-key-123" -i
  ```
  Expected: HTTP `200`, `{data, meta}` response shape, and `x-request-id` header present.
- **Step 3:** Call `GET /books/abc` with valid `x-api-key` to verify pipe rejection.
  ```bash
  curl http://localhost:3000/books/abc \
    -H "x-api-key: dev-key-123" -i
  ```
  Expected: HTTP `400`, body contains `code: "INVALID_ID"`, and controller log is absent.
- **Step 4:** Call `GET /books/5` without `x-api-key` to verify guard blocking.
  ```bash
  curl http://localhost:3000/books/5 -i
  ```
  Expected: HTTP `401`, body contains `code: "UNAUTHORIZED"`, and logs stop before pipe/controller.
- **Step 5:** Open `README.md`, create a table `Pipeline layer | File | Registration scope` covering all 5 layers; paste the 3 real responses from the calls above plus the matching terminal log blocks (copy straight from the running `start:dev` terminal).

**Minimum acceptance criteria**
- Happy path returns HTTP `200` with body `{data: {id: 5, title: "Book 5"}, meta: {requestId, timestamp}}`; response header contains `x-request-id`.
- `GET /books/abc` returns HTTP `400` with body `{code: "INVALID_ID", ...}`; terminal logs for that call stop at `[PIPE]` (no `[INTERCEPTOR]`, no controller line).
- `GET /books/5` without `x-api-key` returns HTTP `401` with body `{code: "UNAUTHORIZED", ...}`; logs stop at `[GUARD]` (no `[PIPE]`).
- README contains a 5-row pipeline table with the `File` column pointing to the exact `src/common/...` path and the `Scope` column being one of `global | controller | method`.
- README has 3 real response blocks + 3 real terminal log blocks (pasted verbatim, no fabrication).

**Nice to have**
- Save the 3 curl commands in `README.md` or `docs/smoke-test.sh` for repeatable checks.
- Add a GIF demo of the 3 calls running sequentially alongside the terminal log to the README.
- Add a Mermaid `graph LR` diagram in the README visualizing the 5-layer order.

# outputs
## 0
### title
Understand layer responsibilities in request lifecycle
### text
You can explain why each concern belongs to Middleware, Guard, Pipe, Controller, Interceptor, or Filter without mixing responsibilities.
## 1
### title
Build consistent success/error contracts with tracing
### text
You can implement predictable success/error response shapes and keep `x-request-id` available for both successful and failed requests.
## 2
### title
Verify execution order using runtime evidence
### text
You can use logs and smoke tests to prove where a request is stopped (guard/pipe) and whether controller logic was executed.

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
GitHub Repository Link
### description
Submit a GitHub repository link containing the full source code. The repo must include a `README.md` with: a `Pipeline layer | File | Registration scope` table, the 3 real responses from the smoke-test scenarios, and the 3 matching terminal log blocks.
### score
20
### prompts
#### 0
##### title
All 5 pipeline layers exist, one file each, registered at the correct scope
##### score
6
##### promptText
Grading rubric (max 6):

- Criterion A (2 points): Repo contains exactly 5 pipeline files under `src/common/{middlewares,guards,pipes,interceptors,filters}/`, one per folder.
- Criterion B (2 points): Registration scopes are correct (`configure`, `APP_INTERCEPTOR`/`APP_FILTER`, controller-level guard, method-level pipe).
- Criterion C (2 points): No pipeline class includes `Book` business logic.

Scoring rule: each criterion gets points only when fully satisfied; missing/incorrect criteria get 0 points.
#### 1
##### title
GET /books/5 returns the exact {data, meta} shape with x-request-id header
##### score
5
##### promptText
Grading rubric (max 5):

- Criterion A (2 points): `GET /books/5` with `x-api-key: dev-key-123` returns HTTP `200`.
- Criterion B (2 points): Response body follows `{data, meta}` and `data` contains `{id: 5, title: "Book 5"}`.
- Criterion C (1 point): Response has `x-request-id`, consistent with `meta.requestId`.

Scoring rule: each criterion gets points only when fully satisfied; missing/incorrect criteria get 0 points.
#### 2
##### title
GET /books/abc is blocked by the Pipe and controller never runs
##### score
5
##### promptText
Grading rubric (max 5):

- Criterion A (2 points): `GET /books/abc` with valid `x-api-key` returns HTTP `400`.
- Criterion B (2 points): Error body includes `code: "INVALID_ID"`.
- Criterion C (1 point): Request logs contain no `BookController` line.

Scoring rule: each criterion gets points only when fully satisfied; missing/incorrect criteria get 0 points.
#### 3
##### title
Missing x-api-key is blocked by the Guard and pipe/controller never run
##### score
4
##### promptText
Grading rubric (max 4):

- Criterion A (2 points): `GET /books/5` without `x-api-key` returns HTTP `401`.
- Criterion B (1 point): Error body includes `code: "UNAUTHORIZED"`.
- Criterion C (1 point): Logs contain neither `[PIPE]` nor controller lines.

Scoring rule: each criterion gets points only when fully satisfied; missing/incorrect criteria get 0 points.

# difficulty
easy

# score
20
